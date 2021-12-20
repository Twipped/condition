
import { TYPE, OPERATOR, MUTATION } from './condition';
import {
  assert,
  hasOwn,
  isString,
  isObject,
  isArray,
  isArrayOfObjects,
  each,
} from '@twipped/utils';

export const OPERATOR_LABELS = {
  [OPERATOR.EQUAL]:        'Equal to',
  [OPERATOR.NOT_EQUAL]:    'Not equal to',
  [OPERATOR.LIKE]:         'Like',
  [OPERATOR.NOT_LIKE]:     'Unlike',
  [OPERATOR.LT]:           'Less than',
  [OPERATOR.GT]:           'Greater than',
  [OPERATOR.INCLUDES]:     'Included in',
  [OPERATOR.NOT_INCLUDES]: 'Not included in',
  [OPERATOR.TRUE]:         'Is true',
  [OPERATOR.FALSE]:        'Is false',
  [OPERATOR.ALL]:          'All conditions match',
  [OPERATOR.NOT_ALL]:      'Some or no conditions match, but not all',
  [OPERATOR.ANY]:          'Any condition matches',
  [OPERATOR.NONE]:         'No conditions match',
  [OPERATOR.BETWEEN]:      'Between two values',
  [OPERATOR.NOT_BETWEEN]:  'Not between two values',
  [OPERATOR.MATCHES]:      'Matches this pattern',
};

export const OPERATORS_BY_TYPE = {
  [TYPE.PRIMITIVE]: {
    [OPERATOR.EQUAL]:        OPERATOR_LABELS[OPERATOR.EQUAL],
    [OPERATOR.NOT_EQUAL]:    OPERATOR_LABELS[OPERATOR.NOT_EQUAL],
    [OPERATOR.LIKE]:         OPERATOR_LABELS[OPERATOR.LIKE],
    [OPERATOR.NOT_LIKE]:     OPERATOR_LABELS[OPERATOR.NOT_LIKE],
    [OPERATOR.LT]:           OPERATOR_LABELS[OPERATOR.LT],
    [OPERATOR.GT]:           OPERATOR_LABELS[OPERATOR.GT],
    [OPERATOR.INCLUDES]:     OPERATOR_LABELS[OPERATOR.INCLUDES],
    [OPERATOR.NOT_INCLUDES]: OPERATOR_LABELS[OPERATOR.NOT_INCLUDES],
    [OPERATOR.BETWEEN]:      OPERATOR_LABELS[OPERATOR.BETWEEN],
    [OPERATOR.NOT_BETWEEN]:  OPERATOR_LABELS[OPERATOR.NOT_BETWEEN],
    [OPERATOR.MATCHES]:      OPERATOR_LABELS[OPERATOR.MATCHES],
    [OPERATOR.TRUE]:         'Is a value other than 0 or blank text.',
    [OPERATOR.FALSE]:        'Is zero or blank',
  },
  [TYPE.DATE]: {
    [OPERATOR.EQUAL]:        OPERATOR_LABELS[OPERATOR.EQUAL],
    [OPERATOR.NOT_EQUAL]:    OPERATOR_LABELS[OPERATOR.NOT_EQUAL],
    [OPERATOR.LIKE]:         OPERATOR_LABELS[OPERATOR.LIKE],
    [OPERATOR.NOT_LIKE]:     OPERATOR_LABELS[OPERATOR.NOT_LIKE],
    [OPERATOR.LT]:           OPERATOR_LABELS[OPERATOR.LT],
    [OPERATOR.GT]:           OPERATOR_LABELS[OPERATOR.GT],
    [OPERATOR.BETWEEN]:      OPERATOR_LABELS[OPERATOR.BETWEEN],
    [OPERATOR.NOT_BETWEEN]:  OPERATOR_LABELS[OPERATOR.NOT_BETWEEN],
  },
  [TYPE.TIME]: {
    [OPERATOR.EQUAL]:        OPERATOR_LABELS[OPERATOR.EQUAL],
    [OPERATOR.NOT_EQUAL]:    OPERATOR_LABELS[OPERATOR.NOT_EQUAL],
    [OPERATOR.LIKE]:         OPERATOR_LABELS[OPERATOR.LIKE],
    [OPERATOR.NOT_LIKE]:     OPERATOR_LABELS[OPERATOR.NOT_LIKE],
    [OPERATOR.LT]:           OPERATOR_LABELS[OPERATOR.LT],
    [OPERATOR.GT]:           OPERATOR_LABELS[OPERATOR.GT],
    [OPERATOR.BETWEEN]:      OPERATOR_LABELS[OPERATOR.BETWEEN],
    [OPERATOR.NOT_BETWEEN]:  OPERATOR_LABELS[OPERATOR.NOT_BETWEEN],
  },
  [TYPE.COMPOUND]: {
    [OPERATOR.ALL]:          'All conditions match',
    [OPERATOR.NOT_ALL]:      'Some or no conditions match, but not all',
    [OPERATOR.ANY]:          'Any condition matches',
    [OPERATOR.NONE]:         'No conditions match',
  },
  [TYPE.ITERATE]: {
    [OPERATOR.ALL]:          'All iterations match all conditions',
    [OPERATOR.NOT_ALL]:      'Some or no iterations match, but not all',
    [OPERATOR.ANY]:          'Any iteration matches all conditions',
    [OPERATOR.NONE]:         'No iterations match all conditions',
  },
  [TYPE.EXISTS]: {
    [OPERATOR.TRUE]:         'Value does exist',
    [OPERATOR.FALSE]:        'Value does not exist',
  },
};

export const MUTATION_LABELS = {
  [MUTATION.ADD]:       'Add',
  [MUTATION.SUB]:       'Subtract',
  [MUTATION.MUL]:       'Multiply by...',
  [MUTATION.DIV]:       'Divide by...',
  [MUTATION.SUM]:       'Sum Set',
  [MUTATION.MIN]:       'Minimum of Set',
  [MUTATION.MAX]:       'Maximum of Set',
  [MUTATION.RANGE]:     'Range of Set',
  [MUTATION.AVG]:       'Average of Set',
  [MUTATION.ABS]:       'Absolute Value',
  [MUTATION.LENGTH]:    'Length of Set',
  [MUTATION.REGEXP]:    'Extract w/ Regular Expression',
  [MUTATION.GET]:       'Get Property',
  [MUTATION.COLLECT]:   'Collect Properties into Set',
  [MUTATION.SPLIT]:     'Split String into Set',
  [MUTATION.SLICE]:     'Slice Set',
  [MUTATION.FIRST]:     'First of Set',
  [MUTATION.LAST]:      'Last of Set',
  [MUTATION.FLATTEN]:   'Flatten Nested Sets',
  [MUTATION.NUMBER]:    'Convert to Number',
  [MUTATION.STRING]:    'Convert to String',
  [MUTATION.DATE]:      'Convert to Date',
  [MUTATION.LOWERCASE]: 'Convert to Lowercase',
  [MUTATION.UPPERCASE]: 'Convert to Uppercase',
  [MUTATION.TABLE]:     'Switch to Value in Table',
  [MUTATION.MEASUREMENT]: 'Convert to standard measurement',
  [MUTATION.CUSTOM]:    'Execute arbitrary javascript against the value',
};

export function validate (condition, name = 'condition') {
  assert(TYPE[condition.type], 'Unknown type "%s" in %s', condition.type, name);
  assert(OPERATOR[condition.operator], 'Unknown operator "%s" for %s', condition.operator, name);
  assert(OPERATORS_BY_TYPE[condition.type][condition.operator], 'The "%s" operator on %s cannot be used with the "%s" type', condition.operator, name, condition.type);

  if (conditionHasLeftSource(condition)) {
    assert(condition.left, '%s of type "%s" with operator "%s" requires a left source.', name, condition.type, condition.operator);
    validateSource(condition.left, name + '.left');
  } else {
    assert(!condition.left, '%s of type "%s" with operator "%s" should not have a left source.', name, condition.type, condition.operator);
  }

  if (conditionHasRightSource(condition)) {
    assert(condition.right, '%s of type %s" with operator "%s" requires a right source.', name, condition.type, condition.operator);
    validateSource(condition.right, name + '.right');
  } else {
    assert(!condition.right, '%s of type "%s" with operator "%s" should not have a right source.', name, condition.operator);
  }

  if (condition.variables) {
    assert(isObject(condition.variables), '%s.variables must be an object, found "%s".', name, condition.variables);
    for (const [ k, v ] of Object.entries(condition.variables)) {
      validateSource(v, name + '.variables.' + k);
    }
  }

  if (condition.dependencies) {
    assert(isArray(condition.dependencies), '%s.dependencies must be an array.', name);
    for (const [ i, dependency ] of condition.dependencies.entries()) {
      validate(dependency, `${name}.dependencies[${i}]`);
    }
  }

  if (typeIsIndefinite(condition.type)) {
    assert(isArray(condition.conditions), '%s.conditions must be an array.', name);
    for (const [ i, con ] of condition.conditions.entries()) {
      validate(con, `${name}.conditions[${i}]`);
    }
  } else if (condition.conditions) {
    assert(!condition.conditions, '%s.conditions should not exist for type "%s".', name, condition.type);
  }
}

function validateSource (src, name) {
  assert(isObject(src, true), 'Source for "%s" must be an object.', name);

  const type = sourceType(src);

  if (src.type) {
    switch (src.type) {
    case SOURCE_TYPE.VALUE:
      assert(src.value !== undefined, '%s.type is %s but %s.value does not exist. Condition will parse this as %s', name, src.type, name, type);
      break;

    case SOURCE_TYPE.PATH:
      assert(src.path !== undefined, '%s.type is %s but %s.path does not exist. Condition will parse this as %s', name, src.type, name, type);
      break;

    case SOURCE_TYPE.DATE:
      assert(src.date !== undefined, '%s.type is %s but %s.date does not exist. Condition will parse this as %s', name, src.type, name, type);
      break;

    case SOURCE_TYPE.ENV:
      assert(src.env !== undefined, '%s.type is %s but %s.env does not exist. Condition will parse this as %s', name, src.type, name, type);
      break;

    case SOURCE_TYPE.RANGE:
      assert(src.between, '%s.type is %s but %s.between does not exist. Condition will parse this as %s', name, src.type, name, type);
      assert(src.between.range, '%s.type is %s but %s.between.range does not exist. Condition will parse this as %s', name, src.type, name, type);
      assert(src.between.range.path, '%s.type is %s but %s.between.range.path is not set.', name, src.type, name);
      assert(src.between.range.all, '%s.type is %s but %s.between.range.all is falsey. This will cause the range to only return one value.', name, src.type, name);
      validateSource(src.between.range, name + '.between.range');
      break;

    case SOURCE_TYPE.BETWEEN:
      assert(src.between, '%s.type is %s but %s.between does not exist. Condition will parse this as %s', name, src.type, name, type);
      assert(!src.between.range, '%s.type is %s but %s.between.range exists. Condition will parse this as %s', name, src.type, name, type);
      assert(src.between.left, '%s.type is %s but %s.between.range.left is not set.', name, src.type, name);
      assert(src.between.right, '%s.type is %s but %s.between.range.right is not set.', name, src.type, name);
      validateSource(src.between.left, name + '.between.left');
      validateSource(src.between.right, name + '.between.right');

    // no default
    }

    assert(src.type === type, '%s.type is %s, but Condition will interpret it as %s', name, src.type, type);
  }

  switch (type) {
  case SOURCE_TYPE.PATH:
    assert(src.path, '%s.path is empty', name);
    break;

  case SOURCE_TYPE.DATE:
    assert(src.date, '%s.date is empty', name);
    break;

  case SOURCE_TYPE.ENV:
    assert(src.env, '%s.env is empty', name);
    break;

  // no default
  }

  if (src.between) {
    validateSourceBetween(src.between, name);
  }

  if (src.mutate) {
    assert(isArrayOfObjects(src.mutate), 'Mutate for source "%s" must be an array of objects', name);
  }
}

function validateSourceBetween (between, name) {
  if (between.range) {
    validateSource(between.range, `${name}.between.range`);
    assert(isString(between.range.path), 'Sourced "%s.between.range" must have a path target.', name);
    assert(between.range.all, 'Sourced "%s.between.range" must have the "all" property as true.', name);
    return;
  }
  assert(isObject(between.left) && isObject(between.right), 'Sourced "%s.between" must have both a left and right sub-source.', name);
  validateSource(between.left, `${name}.between.left`);
  validateSource(between.right, `${name}.between.right`);
}


export function ensureConditionStructure (condition) {
  if (!condition.type) condition.type = TYPE.PRIMITIVE;

  if (!condition.operator || !OPERATORS_BY_TYPE[condition.type]?.[condition.operator]) {
    condition.operator = Object.keys(OPERATORS_BY_TYPE[condition.type])[0];
  }

  if (!condition.dependencies) condition.dependencies = [];
  condition.dependencies.forEach(ensureConditionStructure);

  if (!condition.variables) condition.variables = {};
  each(condition.variables, ensureSourceStructure);

  if (conditionHasLeftSource(condition)) {
    if (!condition.left) condition.left = { type: SOURCE_TYPE.PATH, path: '$' };
    ensureSourceStructure(condition.left);
  } else if (condition.left) {
    condition.left = undefined;
  }

  if (conditionHasRightSource(condition)) {
    if (!condition.right) condition.right = { type: SOURCE_TYPE.PATH, path: '$' };
    if (operatorIsExtent(condition.operator)) {
      if (!sourceTypeIsExtent(condition.right.type)) {
        condition.right.type = SOURCE_TYPE.BETWEEN;
      }
    } else if (sourceTypeIsExtent(condition.right.type)) {
      condition.right.type = SOURCE_TYPE.VALUE;
    }
    ensureSourceStructure(condition.right);
  } else if (condition.right) {
    condition.right = undefined;
  }

  if (typeIsIndefinite(condition.type)) {
    if (!condition.conditions) condition.conditions = [];
    condition.conditions.forEach(ensureConditionStructure);
  } else if (condition.conditions) {
    condition.conditions = undefined;
  }

}

export function ensureSourceStructure (source) {
  if (!source.type) source.type = sourceType(source);
  switch (source.type) {
  case SOURCE_TYPE.VALUE:
    if (!hasOwn(source, 'value')) source.value = '';
    if (source.path) source.path = undefined;
    if (source.date) source.date = undefined;
    if (source.env) source.env = undefined;
    if (source.between) source.between = undefined;
    break;

  case SOURCE_TYPE.PATH:
    if (!source.path) source.path = '$';
    if (source.value) source.value = undefined;
    if (source.date) source.date = undefined;
    if (source.env) source.env = undefined;
    if (source.between) source.between = undefined;
    break;

  case SOURCE_TYPE.DATE:
    if (!source.date) source.date = 'today';
    if (source.value) source.value = undefined;
    if (source.path) source.path = undefined;
    if (source.env) source.env = undefined;
    if (source.between) source.between = undefined;
    break;

  case SOURCE_TYPE.ENV:
    if (!hasOwn(source, 'env')) source.env = null;
    if (source.value) source.value = undefined;
    if (source.path) source.path = undefined;
    if (source.date) source.date = undefined;
    if (source.between) source.between = undefined;
    break;

  case SOURCE_TYPE.RANGE:
    if (!source.between) source.between = {};
    if (!source.between.range) source.between.range = { type: SOURCE_TYPE.PATH, path: '$', all: true };
    if (!source.between.range.all) source.between.range.all = true;
    if (source.between.left) source.between.left = undefined;
    if (source.between.right) source.between.right = undefined;

    ensureSourceStructure(source.between.range);

    if (source.value) source.value = undefined;
    if (source.path) source.path = undefined;
    if (source.date) source.date = undefined;
    if (source.env) source.env = undefined;
    break;

  case SOURCE_TYPE.BETWEEN:
    if (!source.between) source.between = {};
    if (!source.between.left) source.between.left = { type: SOURCE_TYPE.VALUE, value: '' };
    if (!source.between.right) source.between.right = { type: SOURCE_TYPE.VALUE, value: '' };
    if (source.between.range) source.between.range = undefined;

    ensureSourceStructure(source.between.left);
    ensureSourceStructure(source.between.right);

    if (source.value) source.value = undefined;
    if (source.path) source.path = undefined;
    if (source.date) source.date = undefined;
    if (source.env) source.env = undefined;
  // no default
  }
}

export const typeIsComparison = (type) => type === TYPE.PRIMITIVE || type === TYPE.DATE || type === TYPE.TIME;
export const typeIsLogical    = (type) => type === TYPE.COMPOUND || type === TYPE.ITERATE || type === TYPE.EXISTS;
export const typeIsIndefinite = (type) => type === TYPE.COMPOUND || type === TYPE.ITERATE;

export const operatorIsExtent       = (operator) => operator === OPERATOR.BETWEEN || operator === OPERATOR.NOT_BETWEEN;
export const operatorIsBoolean      = (operator) => operator === OPERATOR.TRUE || operator === OPERATOR.FALSE;

export const operatorIsSingleTarget = (operator) => (
  operator === OPERATOR.TRUE
  || operator === OPERATOR.FALSE
);
export const operatorIsDualTarget = (operator) => (
  operator === OPERATOR.EQUAL
    || operator === OPERATOR.NOT_EQUAL
    || operator === OPERATOR.LIKE
    || operator === OPERATOR.NOT_LIKE
    || operator === OPERATOR.LT
    || operator === OPERATOR.GT
);
export const operatorIsInclusion = (operator) => operator === OPERATOR.INCLUDES || operator === OPERATOR.NOT_INCLUDES;
export const operatorIsComparison = (operator) => (
  operator === OPERATOR.EQUAL
    || operator === OPERATOR.NOT_EQUAL
    || operator === OPERATOR.LIKE
    || operator === OPERATOR.NOT_LIKE
    || operator === OPERATOR.LT
    || operator === OPERATOR.GT
    || operator === OPERATOR.INCLUDES
    || operator === OPERATOR.NOT_INCLUDES
);
export const operatorIsIndefinite = (operator) => (
  operator === OPERATOR.ALL
  || operator === OPERATOR.NOT_ALL
  || operator === OPERATOR.ANY
  || operator === OPERATOR.NONE
);

export const conditionIsComparison = (condition) => typeIsComparison(condition.type);
export const conditionIsLogical = (condition) => typeIsLogical(condition.type);
export const conditionIsExtent = (condition) => conditionIsComparison(condition) && operatorIsExtent(condition.operator);
export const conditionIsBoolean = (condition) => typeIsComparison(condition.type) && operatorIsBoolean(condition.operator);
export const conditionHasLeftSource = (condition) => condition.type !== TYPE.COMPOUND;
export const conditionHasRightSource = (condition) => (
  condition.type !== TYPE.COMPOUND
  && condition.type !== TYPE.ITERATE
  && (
    operatorIsComparison(condition.operator)
    || operatorIsExtent(condition.operator)
  )
);


export const ST_PASSTHRU = 'PASSTHRU';
export const ST_VALUE = 'VALUE';
export const ST_PATH = 'PATH';
export const ST_DATE = 'DATE';
export const ST_ENV = 'ENV';
export const ST_RANGE = 'RANGE';
export const ST_BETWEEN = 'BETWEEN';
export const SOURCE_TYPE = {
  [ST_PASSTHRU]: ST_PASSTHRU,
  [ST_VALUE]:    ST_VALUE,
  [ST_PATH]:     ST_PATH,
  [ST_DATE]:     ST_DATE,
  [ST_ENV]:      ST_ENV,
  [ST_RANGE]:    ST_RANGE,
  [ST_BETWEEN]:  ST_BETWEEN,
};
export const SOURCE_TARGET = {
  [ST_PASSTHRU]:  null,
  [ST_VALUE]:    'value',
  [ST_PATH]:     'path',
  [ST_DATE]:     'date',
  [ST_ENV]:      'env',
  [ST_RANGE]:    'between',
  [ST_BETWEEN]:  'between',
};

export const sourceIsExtent = (source) => source?.between;
export const sourceIs = (source, expected) => sourceType(source) === expected;
export const sourceTypeIsExtent = (st) => st === SOURCE_TYPE.BETWEEN || st === SOURCE_TYPE.RANGE;

export function sourceType (source) {
  if (!source) return ST_PASSTHRU;

  for (const key of [ 'value', 'path', 'date', 'env' ]) {
    if (typeof source[key] === 'undefined') continue;
    return key.toUpperCase();
  }

  if (source.between) {
    if (source.between.range) return ST_RANGE;
    return ST_BETWEEN;
  }
  return ST_PASSTHRU;
}

export const TYPE_LABELS = {
  [TYPE.PRIMITIVE]: 'Value Comparison',
  [TYPE.DATE]:      'Date Comparison',
  [TYPE.TIME]:      'Date & Time Comparison',
  [TYPE.COMPOUND]:  'Compound Condition',
  [TYPE.ITERATE]:   'Iterate Across Dataset',
  [TYPE.EXISTS]:    'Value Exists',
};
