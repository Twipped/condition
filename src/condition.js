
export { TYPE } from './constants.js';
export { MUTATION } from './mutations.js';
export { OPERATOR } from './operators.js';

import {
  uc,
  arrayify,
  sizeOf,
  isObject,
  isUndefinedOrNull,
  hash as hashString,
} from '@twipped/utils';
import {
  toDate,
  isValid as dateIsValid,
  isEqual as isEqualDate,
  isAfter,
  isSameDay,
} from 'date-fns';


import {
  TYPE,
  TYPE_PRIMITIVE,
  TYPE_DATE,
  TYPE_TIME,
  TYPE_COMPOUND,
  TYPE_ITERATE,
  TYPE_EXISTS,
} from './constants.js';

import operate, {
  OP_EQUAL,
  OP_NOT_EQUAL,
  OP_LT,
  OP_GT,
  OP_INCLUDES,
  OP_NOT_INCLUDES,
  OP_FALSE,
  OP_ALL,
  OP_ANY,
  OP_BETWEEN,
  OP_NOT_BETWEEN,
  OP_MATCHES,
  OPERATOR,
} from './operators.js';

import { MUTATION } from './mutations.js';
import source from './sourcer.js';

function areInputsEqual (newInputs, lastInputs) {
  if (newInputs.length !== lastInputs.length) {
    return false;
  }
  for (var i = 0; i < newInputs.length; i++) {
    if (newInputs[i] !== lastInputs[i]) {
      return false;
    }
  }
  return true;
}

function memoizeOne (resultFn, { equality, context } = {}) {
  if (!equality) { equality = areInputsEqual; }
  var lastThis;
  var lastArgs = [];
  var lastResult;
  var calledOnce = false;
  function memoized (...newArgs) {
    if (calledOnce && lastThis === this && equality(newArgs, lastArgs)) {
      return lastResult;
    }
    lastResult = resultFn.apply(this, newArgs);
    calledOnce = true;
    lastThis = this; // eslint-disable-line consistent-this
    lastArgs = newArgs;
    return lastResult;
  }
  return context ? memoized.bind(context) : memoized;
}


export default class Condition {

  constructor (props = {}) {
    const { left, right, type, operator, dependencies, conditions, variables, description } = props;
    this.type = type || TYPE_PRIMITIVE;
    this.operator = operator || OP_EQUAL;
    this.left = left || null;
    this.right = right || null;
    this.description = description;


    this.dependencies = dependencies ? dependencies.length && dependencies.map((c) => new Condition(c)) : null;
    this.conditions = conditions ? conditions.length && conditions.map((c) => new Condition(c)) : null;
    this.variables = variables || null;

    this._buildMemoized = memoizeOne(this._build, { context: this });
  }

  get hash () {
    return hashString(this.hashQuick);
  }

  get hashQuick () {
    const { left, right, type, operator, dependencies, variables, conditions } = this;

    return JSON.stringify({
      left,
      right,
      type,
      operator,
      variables,
      dependencies: dependencies && dependencies.map((d) => d && d.hash),
      conditions: conditions && conditions.map((d) => d && d.hash),
    });
  }

  get filter () {
    if (!this.left && !this.right && !this.conditions) return () => ({ result: true });
    return this.build();
  }

  build (force) {
    return force ? this._build() : this._buildMemoized(this.hashQuick);
  }

  _build () {
    const vars = this.buildVariables();
    const deps = this.buildDependencies();
    const main = this.buildMain();
    return (input, env = {}) => {
      env = vars(input, env);
      const dependencies = deps(input, env);
      let result;

      if (!dependencies.result) {
        result = {
          type: this.type,
          op: this.operator,
          variables: env,
          result: true,
        };
      } else {
        result = main(input, env);
      }

      if (dependencies.results && dependencies.results.length) {
        result.dependencies = dependencies.result;
        result.dependencyConditions = dependencies.results;
      }

      return result;
    };
  }

  buildVariables () {
    if (!this.variables) return (input, env = {}) => ({ ...env });

    const envvars = Object.entries(this.variables)
      .map(([ k, s ]) => k && s && [ k, source(s) ])
      .filter(Boolean);

    return (input, env = {}) => {
      const result = {};
      for (const [ key, fn ] of envvars) {
        result[key] = fn(input, env);
      }
      return Object.assign(result, env);
    };
  }

  buildMain () {
    if (!this.left && !this.right && !this.conditions) return () => ({ result: true });
    switch (this.type) {
    case TYPE_DATE:     return this.buildDate();
    case TYPE_TIME:     return this.buildTime();
    case TYPE_COMPOUND: return this.buildCompound();
    case TYPE_ITERATE:  return this.buildIterative();
    case TYPE_EXISTS:   return this.buildExists();
    default: return this.buildPrimitive();
    }
  }

  buildIterative (op = this.operator) {
    if (!this.conditions || !this.conditions.length) throw new Error('Iterative condition has no conditions');
    const sourcer = source(this.left);
    const test = this.buildCompound(OP_ALL);
    const oper = operate(uc(op));

    return (input, env) => {
      const targets = arrayify(sourcer(input, env));
      const results = targets.map((target) => test(target, env));
      const result = oper(results.map((r) => r.result));

      return {
        type: this.type,
        op,
        variables: env,
        targets,
        results,
        result,
      };
    };
  }

  buildDependencies () {
    if (!this.dependencies || !this.dependencies.length) return () => ({ results: [], result: true });
    return this.buildCompound(OP_ALL, this.dependencies);
  }

  buildCompound (op = this.operator, conditions = this.conditions) {
    if (!conditions || !conditions.length) throw new Error('Compound condition has no conditions');

    const oper = operate(uc(op));
    conditions = conditions.map((c) => c.build());
    return (input, env) => {
      const results = conditions.map((test) => test(input, env));
      const rset = results.map((r) => r.result);
      const result = oper(rset);
      return {
        type: this.type,
        op,
        variables: env,
        results,
        result,
      };
    };
  }

  buildDate (op = this.operator) {
    if (op === OP_BETWEEN || op === OP_INCLUDES) {
      return this.buildBetweenDate(op, true);
    }
    if (op === OP_NOT_BETWEEN || op === OP_NOT_INCLUDES) {
      return this.buildBetweenDate(op, false);
    }

    const left = source(this.left);
    const right = source(this.right);

    return (input, env) => {
      const a = toDate(left(input, env));
      const b = toDate(right(input, env));
      if (!dateIsValid(a) || !dateIsValid(b)) {
        return { type: this.type, op, variables: env, left: a, right: b, result: false };
      }
      var result;
      switch (op) {
      case OP_EQUAL:     result = isSameDay(a, b);                   break;
      case OP_NOT_EQUAL: result = !isSameDay(a, b);                  break;
      case OP_LT:        result = !isSameDay(a, b) && isAfter(a, b); break;
      case OP_GT:        result = !isSameDay(a, b) && isAfter(b, a); break;
      default:           result = false;                             break;
      }
      return { type: this.type, op, variables: env, left: a, right: b, result };
    };
  }

  buildTime (op = this.operator) {
    if (op === OP_BETWEEN || op === OP_INCLUDES) {
      return this.buildBetweenTime(op, true);
    }
    if (op === OP_NOT_BETWEEN || op === OP_NOT_INCLUDES) {
      return this.buildBetweenTime(op, false);
    }

    const left = source(this.left);
    const right = source(this.right);

    return (input, env) => {
      const a = toDate(left(input, env));
      const b = toDate(right(input, env));
      if (!dateIsValid(a) || !dateIsValid(b)) {
        return { type: this.type, op, variables: env, left: a, right: b, result: false };
      }
      var result;
      switch (op) {
      case OP_EQUAL:     result = isEqualDate(a, b);  break;
      case OP_NOT_EQUAL: result = !isEqualDate(a, b); break;
      case OP_LT:        result = isAfter(a, b);      break;
      case OP_GT:        result = isAfter(b, a);      break;
      default: throw new Error('Unknown operator for date values: ' + this.operator);
      }
      return { type: this.type, op, variables: env, left: a, right: b, result };
    };
  }

  buildBetweenDate (op, inside = true) {
    const left = source(this.left);
    const right = source(this.right);

    return (input, env) => {
      let result;
      const a = toDate(left(input, env));
      if (!dateIsValid(a)) return { type: this.type, op, variables: env, left: a, result: false };
      const [ b1, b2 ] = right(input, env).map((d) => dateIsValid(d) && toDate(d) || null);
      if (b1 && !isSameDay(a, b1) && isAfter(a, b1)) result = !inside; // a is before b1
      else if (b2 && !isSameDay(a, b2) && isAfter(b2, a)) result = !inside; // a is after b2
      else result = inside; // a is between b1 and b2

      return { type: this.type, op, variables: env, left: a, right: [ b1, b2 ], result };
    };
  }

  buildBetweenTime (op, inside = true) {
    const left = source(this.left);
    const right = source(this.right);

    return (input, env) => {
      let result;
      const a = toDate(left(input, env));
      if (!dateIsValid(a)) return { type: this.type, op, variables: env, left: a, result: false };
      const [ b1, b2 ] = right(input, env).map((d) => dateIsValid(d) && toDate(d) || null);
      if (b1 && isAfter(a, b1)) result = !inside; // a is before b1
      else if (b2 && isAfter(b2, a)) result = !inside; // a is after b2
      else result = inside; // a is between b1 and b2

      return { type: this.type, op, variables: env, left: a, right: [ b1, b2 ], result };
    };
  }

  buildExists (op = this.operator) {
    const sourcer = source(this.left);
    return (input, env) => {
      const l = sourcer(input, env);
      let result = !isUndefinedOrNull(l);
      if (op === OP_FALSE) result = !result;
      return { type: this.type, op, variables: env, left: l, result };
    };
  }

  buildPrimitive (op = this.operator) {
    const oper = operate(op);

    const left = source(this.left);
    const right = source(this.right);
    return (input, env) => {
      const l = left(input, env);
      const r = right(input, env);
      const result = isUndefinedOrNull(l) || isUndefinedOrNull(r) ? false : oper(l, r);
      return { type: this.type, op, variables: env, left: l, right: r, result };
    };
  }

  toJSON () {
    const { left, right, type, operator, dependencies, conditions = [], variables, description } = this;

    return {
      description: description || undefined,
      left: left || undefined,
      right: right || undefined,
      type,
      operator,
      variables: sizeOf(variables) && variables || undefined,
      dependencies: dependencies && dependencies.length && dependencies.map((d) => d && d.toJSON()) || undefined,
      conditions: conditions && conditions.length && conditions.map((d) => d && d.toJSON()) || undefined,
    };
  }

}

Condition.OPERATOR = OPERATOR;
Condition.TYPE = TYPE;
Condition.MUTATION = MUTATION;


Condition.all = (...args) => new Condition({
  conditions: args,
  type: TYPE_COMPOUND,
  operator: OP_ALL,
});

Condition.any = (...args) => new Condition({
  conditions: args,
  type: TYPE_COMPOUND,
  operator: OP_ANY,
});

Condition.none = (...args) => new Condition({
  conditions: args,
  type: TYPE_COMPOUND,
  operator: OP_ANY,
});

Condition.compare = (type, left, operator, right) => new Condition({
  type,
  left,
  right,
  operator,
});

Condition.simple = (get, value, operator = OP_EQUAL) => new Condition({
  type: TYPE_PRIMITIVE,
  left: isObject(get) ? get : { get },
  operator,
  right: isObject(value) ? value : { value },
});

Condition.matches = (get, value) => new Condition({
  type: TYPE_PRIMITIVE,
  left: isObject(get) ? get : { get },
  operator: OP_MATCHES,
  right: { value: String(value) },
});

Condition.iterate = ({ operator = OP_ALL, ...left }, ...conditions) => new Condition({
  type: TYPE_ITERATE,
  left,
  operator,
  conditions,
});

