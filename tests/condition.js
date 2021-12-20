
import suite from 'tapsuite';
import Condition from '../src/condition.js';

suite('Condition class', (s) => {

  const testData = {
    a: {
      a: [ 1, 2, 3, 4 ],
      b: [ '1', '2', '3', '4' ],
      c: [
        { a: 0, b: 'a', c: '10' },
        { a: 1, b: 'b', c: '11' },
        { a: 2, b: 'c', c: '12' },
        {},
        { a: null, b: null, c: null },
      ],
    },
    b: {
      a: '1000',
      b: '$2000',
      c: '0.1',
      d: '',
      e: 2,
      f: 2.1,
      g: '2',
    },
    c: 2,
  };

  s.test('PRIMITIVE EQUAL with path - matches', (t) => {
    const c = new Condition({
      type: Condition.TYPE.PRIMITIVE,
      left: { path: 'b.e' },
      operator: Condition.OPERATOR.EQUAL,
      right: { value: 2 },
    });

    const result = c.filter(testData);
    const expected = {
      type: Condition.TYPE.PRIMITIVE,
      op: Condition.OPERATOR.EQUAL,
      variables: {},
      left: 2,
      right: 2,
      result: true,
    };

    t.same(result, expected, 'Got back results');

    t.end();
  });

  s.test('PRIMITIVE EQUAL with path - misses', (t) => {
    const c = new Condition({
      type: Condition.TYPE.PRIMITIVE,
      left: { path: 'b.g' },
      operator: Condition.OPERATOR.EQUAL,
      right: { value: 2 },
    });

    const result = c.filter(testData);
    const expected = {
      type: Condition.TYPE.PRIMITIVE,
      op: Condition.OPERATOR.EQUAL,
      variables: {},
      left: '2',
      right: 2,
      result: false,
    };

    t.same(result, expected, 'Got back results');

    t.end();
  });

  s.test('PRIMITIVE LIKE with path - matches', (t) => {
    const c = new Condition({
      type: Condition.TYPE.PRIMITIVE,
      left: { path: 'b.g' },
      operator: Condition.OPERATOR.LIKE,
      right: { value: 2 },
    });

    const result = c.filter(testData);
    const expected = {
      type: Condition.TYPE.PRIMITIVE,
      op: Condition.OPERATOR.LIKE,
      variables: {},
      left: '2',
      right: 2,
      result: true,
    };

    t.same(result, expected, 'Got back results');

    t.end();
  });

  s.test('PRIMITIVE GT with path - matches number', (t) => {
    const c = new Condition({
      type: Condition.TYPE.PRIMITIVE,
      left: { path: 'b.a' },
      operator: Condition.OPERATOR.GT,
      right: { value: 999 },
    });

    const result = c.filter(testData);
    const expected = {
      type: Condition.TYPE.PRIMITIVE,
      op: Condition.OPERATOR.GT,
      variables: {},
      left: '1000',
      right: 999,
      result: true,
    };

    t.same(result, expected, 'Got back results');

    t.end();
  });

  s.test('PRIMITIVE GT with path - matches string', (t) => {
    const c = new Condition({
      type: Condition.TYPE.PRIMITIVE,
      left: { path: 'b.a' },
      operator: Condition.OPERATOR.GT,
      right: { value: '999' },
    });

    const result = c.filter(testData);
    const expected = {
      type: Condition.TYPE.PRIMITIVE,
      op: Condition.OPERATOR.GT,
      variables: {},
      left: '1000',
      right: '999',
      result: true,
    };

    t.same(result, expected, 'Got back results');

    t.end();
  });

  s.test('PRIMITIVE GT with path - misses non-numeric', (t) => {
    const c = new Condition({
      type: Condition.TYPE.PRIMITIVE,
      left: { path: 'b.a' },
      operator: Condition.OPERATOR.GT,
      right: { value: 'a999' },
    });

    const result = c.filter(testData);
    const expected = {
      type: Condition.TYPE.PRIMITIVE,
      op: Condition.OPERATOR.GT,
      variables: {},
      left: '1000',
      right: 'a999',
      result: false,
    };

    t.same(result, expected, 'Got back results');

    t.end();
  });

  s.test('PRIMITIVE LT with path - misses number', (t) => {
    const c = new Condition({
      type: Condition.TYPE.PRIMITIVE,
      left: { path: 'b.a' },
      operator: Condition.OPERATOR.LT,
      right: { value: 999 },
    });

    const result = c.filter(testData);
    const expected = {
      type: Condition.TYPE.PRIMITIVE,
      op: Condition.OPERATOR.LT,
      variables: {},
      left: '1000',
      right: 999,
      result: false,
    };

    t.same(result, expected, 'Got back results');

    t.end();
  });

  s.test('PRIMITIVE LT with path - misses string', (t) => {
    const c = new Condition({
      type: Condition.TYPE.PRIMITIVE,
      left: { path: 'b.a' },
      operator: Condition.OPERATOR.LT,
      right: { value: '999' },
    });

    const result = c.filter(testData);
    const expected = {
      type: Condition.TYPE.PRIMITIVE,
      op: Condition.OPERATOR.LT,
      variables: {},
      left: '1000',
      right: '999',
      result: false,
    };

    t.same(result, expected, 'Got back results');

    t.end();
  });

  s.test('PRIMITIVE INCLUDES with double path - matches', (t) => {
    const c = new Condition({
      type: Condition.TYPE.PRIMITIVE,
      left: { path: 'b.e' },
      operator: Condition.OPERATOR.INCLUDES,
      right: { path: 'a.a' },
    });

    const result = c.filter(testData);
    const expected = {
      type: Condition.TYPE.PRIMITIVE,
      op: Condition.OPERATOR.INCLUDES,
      variables: {},
      left: 2,
      right: [ 1, 2, 3, 4 ],
      result: true,
    };

    t.same(result, expected, 'Got back results');

    t.end();
  });

  s.test('PRIMITIVE INCLUDES with double path - misses string', (t) => {
    const c = new Condition({
      type: Condition.TYPE.PRIMITIVE,
      left: { path: 'b.g' },
      operator: Condition.OPERATOR.INCLUDES,
      right: { path: 'a.a' },
    });

    const result = c.filter(testData);
    const expected = {
      type: Condition.TYPE.PRIMITIVE,
      op: Condition.OPERATOR.INCLUDES,
      variables: {},
      left: '2',
      right: [ 1, 2, 3, 4 ],
      result: false,
    };

    t.same(result, expected, 'Got back results');

    t.end();
  });

  s.test('PRIMITIVE INCLUDES with double path - matches string', (t) => {
    const c = new Condition({
      type: Condition.TYPE.PRIMITIVE,
      left: { path: 'b.g' },
      operator: Condition.OPERATOR.INCLUDES,
      right: { path: 'a.b' },
    });

    const result = c.filter(testData);
    const expected = {
      type: Condition.TYPE.PRIMITIVE,
      op: Condition.OPERATOR.INCLUDES,
      variables: {},
      left: '2',
      right: [ '1', '2', '3', '4' ],
      result: true,
    };

    t.same(result, expected, 'Got back results');

    t.end();
  });

  s.test('COMPOUND ALL - matches', (t) => {
    const c = new Condition({
      type: Condition.TYPE.COMPOUND,
      operator: Condition.OPERATOR.ALL,
      conditions: [
        Condition.simple({ value: 1 }, { value: 1 }),
        Condition.simple({ value: 2 }, { value: 2 }),
      ],
    });

    const result = c.filter(testData);
    const expected = {
      type: Condition.TYPE.COMPOUND,
      op: Condition.OPERATOR.ALL,
      variables: {},
      results: [
        {
          type: Condition.TYPE.PRIMITIVE,
          op: Condition.OPERATOR.EQUAL,
          variables: {},
          left: 1,
          right: 1,
          result: true,
        },
        {
          type: Condition.TYPE.PRIMITIVE,
          op: Condition.OPERATOR.EQUAL,
          variables: {},
          left: 2,
          right: 2,
          result: true,
        },
      ],
      result: true,
    };

    t.same(result, expected, 'Got back results');

    t.end();
  });

  s.test('COMPOUND ALL - misses', (t) => {
    const c = new Condition({
      type: Condition.TYPE.COMPOUND,
      operator: Condition.OPERATOR.ALL,
      conditions: [
        Condition.simple({ value: 1 }, { value: 1 }),
        Condition.simple({ value: 1 }, { value: 2 }),
      ],
    });

    const result = c.filter(testData);
    const expected = {
      type: Condition.TYPE.COMPOUND,
      op: Condition.OPERATOR.ALL,
      variables: {},
      results: [
        {
          type: Condition.TYPE.PRIMITIVE,
          op: Condition.OPERATOR.EQUAL,
          variables: {},
          left: 1,
          right: 1,
          result: true,
        },
        {
          type: Condition.TYPE.PRIMITIVE,
          op: Condition.OPERATOR.EQUAL,
          variables: {},
          left: 1,
          right: 2,
          result: false,
        },
      ],
      result: false,
    };

    t.same(result, expected, 'Got back results');

    t.end();
  });

  s.test('COMPOUND ANY - matches', (t) => {
    const c = new Condition({
      type: Condition.TYPE.COMPOUND,
      operator: Condition.OPERATOR.ANY,
      variables: {},
      conditions: [
        Condition.simple({ value: 1 }, { value: 1 }),
        Condition.simple({ value: 2 }, { value: 2 }),
      ],
    });

    const result = c.filter(testData);
    const expected = {
      type: Condition.TYPE.COMPOUND,
      op: Condition.OPERATOR.ANY,
      variables: {},
      results: [
        {
          type: Condition.TYPE.PRIMITIVE,
          op: Condition.OPERATOR.EQUAL,
          variables: {},
          left: 1,
          right: 1,
          result: true,
        },
        {
          type: Condition.TYPE.PRIMITIVE,
          op: Condition.OPERATOR.EQUAL,
          variables: {},
          left: 2,
          right: 2,
          result: true,
        },
      ],
      result: true,
    };

    t.same(result, expected, 'Got back results');

    t.end();
  });

  s.test('COMPOUND ANY - misses', (t) => {
    const c = new Condition({
      type: Condition.TYPE.COMPOUND,
      operator: Condition.OPERATOR.ANY,
      conditions: [
        Condition.simple({ value: 1 }, { value: 1 }),
        Condition.simple({ value: 1 }, { value: 2 }),
      ],
    });

    const result = c.filter(testData);
    const expected = {
      type: Condition.TYPE.COMPOUND,
      op: Condition.OPERATOR.ANY,
      variables: {},
      results: [
        {
          type: Condition.TYPE.PRIMITIVE,
          op: Condition.OPERATOR.EQUAL,
          variables: {},
          left: 1,
          right: 1,
          result: true,
        },
        {
          type: Condition.TYPE.PRIMITIVE,
          op: Condition.OPERATOR.EQUAL,
          variables: {},
          left: 1,
          right: 2,
          result: false,
        },
      ],
      result: true,
    };

    t.same(result, expected, 'Got back results');

    t.end();
  });

  s.test('trial', (t) => {
    const c = new Condition({
      "left": {
        value: "SubjectToRepairs",
      },
      "right": {
        "value": [
          "AsIs",
          "SubjectToCompletion",
          "SubjectToRepairs",
          "SubjectToInspections",
        ],
      },
      "type": "PRIMITIVE",
      "operator": "INCLUDES",
      "dependencies": null,
      "conditions": null,
    });

    const result = c.filter(testData);
    const expected = {
      type: Condition.TYPE.PRIMITIVE,
      op: Condition.OPERATOR.INCLUDES,
      variables: {},
      left: "SubjectToRepairs",
      right: [
        "AsIs",
        "SubjectToCompletion",
        "SubjectToRepairs",
        "SubjectToInspections",
      ],
      result: true,
    };

    t.same(result, expected, 'Got back results');

    t.end();
  });

  s.test('dependency miss', (t) => {
    const c = new Condition({
      type: Condition.TYPE.PRIMITIVE,
      left: { value: 2 },
      operator: Condition.OPERATOR.EQUAL,
      right: { value: 5 },
      dependencies: [
        {
          type: Condition.TYPE.PRIMITIVE,
          left: { value: 0 },
          operator: Condition.OPERATOR.TRUE,
        },
      ],
    });

    const result = c.filter(testData);
    const expected = {
      type: Condition.TYPE.PRIMITIVE,
      op: Condition.OPERATOR.EQUAL,
      variables: {},
      result: true,
      dependencies: false,
      dependencyConditions: [
        {
          type: Condition.TYPE.PRIMITIVE,
          op: Condition.OPERATOR.TRUE,
          variables: {},
          left: 0,
          right: null,
          result: false,
        },
      ],
    };

    t.same(result, expected, 'Got back results');

    t.end();
  });
});
