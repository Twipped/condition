
import PropTypes from 'prop-types';
import Condition, { TYPE, OPERATOR, MUTATION } from './condition.js';

function lazy (f) {
  return function () {
    return f().apply(this, arguments); // eslint-disable-line prefer-rest-params
  };
}

const primitive = PropTypes.primitive = PropTypes.oneOfType([
  PropTypes.bool,
  PropTypes.number,
  PropTypes.string,
]);

const mutationPropType = PropTypes.arrayOf(
  PropTypes.shape({
    type: PropTypes.oneOf(Object.values(MUTATION)).isRequired,
  }),
);

export var SourcePropType = PropTypes.oneOfType([
  PropTypes.exact({
    value: PropTypes.oneOfType([
      primitive,
      PropTypes.arrayOf(primitive),
      PropTypes.object,
    ]).isRequired,
    mutate: mutationPropType,
  }),

  PropTypes.exact({
    get: PropTypes.string.isRequired,
    mutate: mutationPropType,
  }),

  PropTypes.exact({
    collect: PropTypes.string.isRequired,
    all: PropTypes.bool,
    mutate: mutationPropType,
  }),

  PropTypes.exact({
    path: PropTypes.string.isRequired,
    all: PropTypes.bool,
    mutate: mutationPropType,
  }),

  PropTypes.exact({
    date: PropTypes.oneOf([ 'today', 'yesterday', 'tomorrow' ]),
    mutate: mutationPropType,
  }),

  PropTypes.exact({
    env: PropTypes.string.isRequired,
    mutate: mutationPropType,
  }),

  PropTypes.exact({
    between: PropTypes.oneOfType([
      PropTypes.exact({
        range: lazy(() => SourcePropType),
      }),
      PropTypes.exact({
        left: lazy(() => SourcePropType),
        right: lazy(() => SourcePropType),
      }),
    ]),
  }),
]);

var conditionPropType = PropTypes.shape({
  left: SourcePropType,
  right: SourcePropType,
  type: PropTypes.oneOf(Object.values(TYPE)).isRequired,
  operator: PropTypes.oneOf(Object.values(OPERATOR)).isRequired,
  dependencies: PropTypes.arrayOf(lazy(() => conditionPropType)),
  conditions: PropTypes.arrayOf(lazy(() => conditionPropType)),
  variables: PropTypes.objectOf(SourcePropType),
});

export const ConditionPropType = PropTypes.oneOfType([
  PropTypes.instanceOf(Condition),
  conditionPropType,
]);
