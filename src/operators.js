import {
  gt,
  lt,
  arrayify,
  intersect,
  not,
  any,
  all,
  none,
  isString,
  isUndefinedOrNull,
} from '@twipped/utils';

export const OP_EQUAL =        'EQUAL';
export const OP_NOT_EQUAL =    'NOT_EQUAL';
export const OP_LIKE =         'LIKE';
export const OP_NOT_LIKE =     'NOT_LIKE';
export const OP_LT =           'LT';
export const OP_GT =           'GT';
export const OP_INCLUDES =     'INCLUDES';
export const OP_NOT_INCLUDES = 'NOT_INCLUDES';
export const OP_TRUE =         'TRUE';
export const OP_FALSE =        'FALSE';
export const OP_ALL =          'ALL';
export const OP_NOT_ALL =      'NOT_ALL';
export const OP_ANY =          'ANY';
export const OP_NONE =         'NONE';
export const OP_BETWEEN =      'BETWEEN';
export const OP_NOT_BETWEEN =  'NOT_BETWEEN';
export const OP_MATCHES =      'MATCHES';

export const OPERATOR = {
  [OP_EQUAL]:        OP_EQUAL,
  'EQUALS':          OP_EQUAL,
  [OP_NOT_EQUAL]:    OP_NOT_EQUAL,
  'NOT_EQUALS':      OP_NOT_EQUAL,
  [OP_LIKE]:         OP_LIKE,
  [OP_NOT_LIKE]:     OP_NOT_LIKE,
  [OP_LT]:           OP_LT,
  [OP_GT]:           OP_GT,
  [OP_INCLUDES]:     OP_INCLUDES,
  [OP_NOT_INCLUDES]: OP_NOT_INCLUDES,
  [OP_TRUE]:         OP_TRUE,
  [OP_FALSE]:        OP_FALSE,
  [OP_ALL]:          OP_ALL,
  [OP_NOT_ALL]:      OP_NOT_ALL,
  [OP_ANY]:          OP_ANY,
  [OP_NONE]:         OP_NONE,
  [OP_BETWEEN]:      OP_BETWEEN,
  [OP_NOT_BETWEEN]:  OP_NOT_BETWEEN,
  [OP_MATCHES]:      OP_MATCHES,
};


export const Operators = {
  [OP_EQUAL]: (a, b) => a === b,
  [OP_NOT_EQUAL]: (a, b) => a !== b,
  [OP_LIKE]: (a, b) => a == b, // eslint-disable-line eqeqeq
  [OP_NOT_LIKE]: (a, b) => a != b, // eslint-disable-line eqeqeq
  [OP_LT]: lt,
  [OP_GT]: gt,
  [OP_INCLUDES]: (a, b) => {
    a = arrayify(a);
    b = arrayify(b);
    if (!a || !b || !a.length || !b.length) return false;
    const matching = intersect(a, b);
    return matching.length > 0;
  },
  [OP_NOT_INCLUDES]: (a, b) => !Operators.INCLUDES(a, b),
  [OP_TRUE]: (a) => !!a,
  [OP_FALSE]: (a) => !a,
  [OP_MATCHES]: (a, b) => isString(a) && !!String(a).match(new RegExp(b.replace(/^\/(.*)\/$/g, '$1'))),
  [OP_BETWEEN]: (a, [ min, max ]) => {
    if (isUndefinedOrNull(a)) return false;
    min = isUndefinedOrNull(min) ? Number.NEGATIVE_INFINITY : Number(min);
    max = isUndefinedOrNull(max) ? Number.POSITIVE_INFINITY : Number(max);
    return a >= min && a <= max;
  },
  [OP_NOT_BETWEEN]: (a, [ min, max ]) => {
    if (isUndefinedOrNull(a)) return false;
    min = isUndefinedOrNull(min) ? Number.NEGATIVE_INFINITY : Number(min);
    max = isUndefinedOrNull(max) ? Number.POSITIVE_INFINITY : Number(max);
    return a <= min || a >= max;
  },

  [OP_ALL]: all,
  [OP_NOT_ALL]: not(all),
  [OP_ANY]: any,
  [OP_NONE]: none,
};

export default function operate (op, ...args) {
  const oper = Operators[op];
  if (!oper) throw new Error('Unknown operator: ' + op);

  if (args.length) return oper(...args);
  return oper;
}
