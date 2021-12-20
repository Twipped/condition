
import JPath from '@twipped/jpath';
import {
  get as getter,
  distance as convert,
  sizeOf,
  isArray,
  isObject,
  isUndefined,
  isString,
  isNumeric,
  isDate,
  isUndefinedOrNull,
} from '@twipped/utils';
import {
  toDate,
  parse as parseDate,
  isValid as dateIsValid,
  add as addDate,
  sub as subDate,
  subSeconds,
  addSeconds,
} from 'date-fns';

import {
  TYPE_DATE,
  TYPE_TIME,
} from './constants.js';

const MUT_ADD       = 'ADD';
const MUT_SUB       = 'SUB';
const MUT_MUL       = 'MUL';
const MUT_DIV       = 'DIV';
const MUT_SUM       = 'SUM';
const MUT_MIN       = 'MIN';
const MUT_MAX       = 'MAX';
const MUT_ABS       = 'ABS';
const MUT_RANGE     = 'RANGE';
const MUT_AVG       = 'AVG';
const MUT_LENGTH    = 'LENGTH';
const MUT_REGEXP    = 'REGEXP';
const MUT_GET       = 'GET';
const MUT_COLLECT   = 'COLLECT';
const MUT_SPLIT     = 'SPLIT';
const MUT_SLICE     = 'SLICE';
const MUT_FIRST     = 'FIRST';
const MUT_LAST      = 'LAST';
const MUT_FLATTEN   = 'FLATTEN';
const MUT_NUMBER    = 'NUMBER';
const MUT_STRING    = 'STRING';
const MUT_DATE      = 'DATE';
const MUT_LOWERCASE = 'LOWERCASE';
const MUT_UPPERCASE = 'UPPERCASE';
const MUT_TABLE     = 'TABLE';
const MUT_MEASUREMENT = 'MEASUREMENT';
const MUT_CUSTOM    = 'CUSTOM';

export const MUTATION = {
  [MUT_ADD]:       MUT_ADD,
  [MUT_SUB]:       MUT_SUB,
  [MUT_MUL]:       MUT_MUL,
  [MUT_DIV]:       MUT_DIV,
  [MUT_SUM]:       MUT_SUM,
  [MUT_MIN]:       MUT_MIN,
  [MUT_MAX]:       MUT_MAX,
  [MUT_ABS]:       MUT_ABS,
  [MUT_RANGE]:     MUT_RANGE,
  [MUT_AVG]:       MUT_AVG,
  [MUT_LENGTH]:    MUT_LENGTH,
  [MUT_REGEXP]:    MUT_REGEXP,
  [MUT_GET]:       MUT_GET,
  [MUT_COLLECT]:   MUT_COLLECT,
  [MUT_SPLIT]:     MUT_SPLIT,
  [MUT_SLICE]:     MUT_SLICE,
  [MUT_FIRST]:     MUT_FIRST,
  [MUT_LAST]:      MUT_LAST,
  [MUT_FLATTEN]:   MUT_FLATTEN,
  [MUT_NUMBER]:    MUT_NUMBER,
  [MUT_STRING]:    MUT_STRING,
  [MUT_DATE]:      MUT_DATE,
  [MUT_LOWERCASE]: MUT_LOWERCASE,
  [MUT_UPPERCASE]: MUT_UPPERCASE,
  [MUT_TABLE]:     MUT_TABLE,
  [MUT_MEASUREMENT]: MUT_MEASUREMENT,
  [MUT_CUSTOM]:    MUT_CUSTOM,
};

export const Mutations = {
  [MUT_ADD]: (input, { value }, con) => {
    let result = input;
    if (con.type === TYPE_DATE || con.type === TYPE_TIME || isDate(input)) {
      result = toDate(result);
      if (!dateIsValid(result)) return null;
      result = isObject(value) ? addDate(result, value) : addSeconds(result, value);
    } else if (!isObject(value)) {
      result = (isNumeric(result) ? Number(result) : result) + value;
    }
    return result;
  },
  [MUT_SUB]: (input, { value }, con) => {
    let result = input;
    if (con.type === TYPE_DATE || con.type === TYPE_TIME || isDate(input)) {
      result = toDate(result);
      if (!dateIsValid(result)) return null;
      result = isObject(value) ? subDate(result, value) : subSeconds(result, value);
    } else if (!isObject(value)) {
      result = result - value;
    }
    return result;
  },
  [MUT_MUL]: (input, { value }) => {
    if (isArray(input)) return input.map((x) => x * value);
    return input * value;
  },
  [MUT_DIV]: (input, { value }) => {
    if (isArray(input)) return input.map((x) => (value ? x / value : 0));
    return value ? input / value : 0;
  },
  [MUT_SUM]: (input) => {
    if (!isArray(input) || !input.length) return input;
    if (input.length === 1) return input[0];
    return input.reduce((a, b) => a + b, 0);
  },
  [MUT_MIN]: (input) => {
    if (!isArray(input) || !input.length) return input;
    if (input.length === 1) return Number(input[0]);
    return Math.min(...input.flat(Infinity).map(Number));
  },
  [MUT_MAX]: (input) => {
    if (!isArray(input) || !input.length) return input;
    if (input.length === 1) return Number(input[0]);
    return Math.max(...input.flat(Infinity).map(Number));
  },
  [MUT_ABS]: (input) => {
    if (isArray(input)) return input.map(Math.abs);
    return Math.abs(input);
  },
  [MUT_RANGE]: (input) => {
    if (!isArray(input) || !input.length) return input;
    if (input.length === 1) return Number(input[0]);
    input = input.flat(Infinity).map(Number);
    return [ Math.min(...input), Math.max(...input) ];
  },
  [MUT_AVG]: (input) => {
    if (!isArray(input) || !input.length) return input;
    if (input.length === 1) return input[0];
    const tot = input.reduce((a, b) => a + b, 0);
    return tot / input.length;
  },
  [MUT_LENGTH]: (input) => sizeOf(input),
  [MUT_REGEXP]: (input, { pattern, replace }) => {
    if (!pattern) throw new Error('RegExp Mutation lacks a pattern to match against.');
    pattern = RegExp(pattern);
    input = String(input);
    if (replace !== undefined) {
      return input.replace(pattern, replace);
    }
    const match = input.match(pattern);
    return match && match[0];
  },
  [MUT_SLICE]:     (input, { start, end }) => (isArray(input) ? input : String(input)).slice(start, end),
  [MUT_FIRST]:     (input) => (isArray(input) ? input[0] : input),
  [MUT_LAST]:      (input) => (isArray(input) ? input.slice(-1)[0] : input),
  [MUT_SPLIT]:     (input, { delimiter = /,\s*/ }) => String(input).split(delimiter),
  [MUT_GET]:       (input, { path }) => getter(input, path),
  [MUT_COLLECT]:   (input, { path }) => JPath.execute(path, input),
  [MUT_FLATTEN]:   (input) => (isArray(input) ? input.flat(Infinity) : [ input ]),
  [MUT_NUMBER]:    (input) => {
    if (isUndefinedOrNull(input)) return 0;
    if (isNumeric(input)) return Number(input);
    return parseFloat(String(input).replace(/[^0-9.]/g, ''));
  },
  [MUT_STRING]:    (input, mut) => {
    if (isString(input) || isUndefined(input)) return input;
    const locale = mut.locale || 'en-US';
    if (isNumeric(input)) return (new Intl.NumberFormat(locale, mut)).format(input);
    return String(input);
  },
  [MUT_DATE]:      (input, { format = 'yyyy-LL-dd' }) => parseDate(input, format, new Date()),
  [MUT_LOWERCASE]: (input) => (isString(input) ? input.toLowerCase() : input),
  [MUT_UPPERCASE]: (input) => (isString(input) ? input.toUpperCase() : input),
  [MUT_TABLE]:     (input, { table }) => (table && !isUndefinedOrNull(table[input]) ? table[input] : null),
  [MUT_MEASUREMENT]: (input, { assume = 'sqft', target = 'm' }) => {
    let [ , value, unit ] = String(input).trim().toUpperCase().match(/^(-?\d+(?:,\d{3})*(?:\.\d+)?)\s*(\w+)?$/) || [];
    if (isUndefinedOrNull(value)) return;
    if (!unit) unit = assume;
    value = parseFloat(String(input).replace(/(?!^-)[^0-9.]/g, '')); // strip out non-numeric characters
    return convert(value, unit, target);
  },
  [MUT_CUSTOM]: (input, { code }) => {
    const fn = Function('input', code); // eslint-disable-line no-new-func
    return fn(input);
  },
};

export default function Mutate (input, mutations = []) {
  if (isUndefinedOrNull(input)) return []; // no need to mutate a value that isn't there.
  let values = isArray(input) ? input : [ input ];
  for (const mut of mutations) {
    const mutation = Mutations[mut.type];
    if (!mutation) throw new Error('Unknown mutation type: ' + mut.type);

    if (mut.all) values = mutation(values, mut, this);
    else values = values.map((v) => mutation(v, mut, this));
  }
  return values;
}
