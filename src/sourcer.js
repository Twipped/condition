import JPath from '@twipped/jpath';
import {
  isArray,
  isObject,
  isUndefined,
  isString,
  isFunction,
} from '@twipped/utils';
import {
  subDays,
  addDays,
} from 'date-fns';

import applyMutations from './mutations.js';


const jpathCache = new Map();
const g_Path  =      (path, rall)  => {
  const fn = JPath.compile(path, { cache: jpathCache });
  if (rall) return fn;
  return (input) => fn(input)[0];
};
const g_Value =      (value) => function gValue ()          { return value; };
const g_Today =      ()      => function gToday ()          { return new Date(); };
const g_Yesterday =  ()      => function gYesterday ()      { return subDays(Date.now(), 1); };
const g_Tomorrow =   ()      => function gTomorrow ()       { return addDays(Date.now(), 1); };

function sourceCatcher (src, fn) {
  return (...args) => {
    try {
      return fn(...args);
    } catch (e) {
      e.message = "Error while sourcing for " + JSON.stringify(src) + "\n" + e.message;
      throw e;
    }
  };
}

export default function source (src) {
  if (!src) return () => null;
  if (isFunction(src)) return src;
  if (!isObject(src)) return () => src;

  const { env: envar, path, value, date, between } = src;
  const mutate = isArray(src.mutate) ? src.mutate : (src.mutate && [ src.mutate ] || null);

  if (between) {
    const range = between.range && source(between.range);
    if (range) {
      return (input) => {
        let values = range(input);
        if (!values) return [ null, null ];

        if (!isArray(values)) values = [ values ];
        values = values.flat(Infinity);

        return [
          Math.min(...values.map(Number)),
          Math.max(...values.map(Number)),
          values,
        ];
      };
    }

    const left  = between.left && source(between.left);
    const right = between.right && source(between.right);
    return (input) => [
      left ? left(input) : null,
      right ? right(input) : null,
    ];
  }


  let fetch;
  if (!isUndefined(value))  fetch = g_Value(value);
  if (path)                 fetch = g_Path(path, src.all);
  if (date === 'today')     fetch = g_Today();
  if (date === 'yesterday') fetch = g_Yesterday();
  if (date === 'tomorrow')  fetch = g_Tomorrow();
  if (isString(envar))      fetch = (input, env) => env[envar];

  if (!fetch) fetch = function gPassThru (input) { return input; };

  fetch = sourceCatcher(src, fetch);

  if (!mutate) return (input, env) => fetch(input, env);

  return (input) => {
    const sourced = fetch(input);
    const values = applyMutations(sourced, mutate);
    return src.all ? values : values[0];
  };
}
