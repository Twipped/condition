
export * from './condition.js';

import BaseCondition from './condition.js';
import { makeObservable, observable, computed } from 'mobx';

export default class Condition extends BaseCondition {

  constructor (...args) {
    super(...args);

    this.dependencies = this.dependencies ? this.dependencies.length && this.dependencies.map((c) => new Condition(c)) : null;
    this.conditions = this.conditions ? this.conditions.length && this.conditions.map((c) => new Condition(c)) : null;

    makeObservable(this, {
      left: observable.deep,
      right: observable.deep,
      type: observable,
      operator: observable,
      dependencies: observable.deep,
      conditions: observable.deep,
      variables: observable.deep,
      hash: computed,
      description: observable,
    });
  }

}

Object.assign(Condition, BaseCondition);
