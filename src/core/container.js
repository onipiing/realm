import React from 'react';
import Rx from 'rx';
import merge from 'lodash.merge';

export default function createContainer({ init, view }, connect) {
  const spec = {};

  spec.contextTypes = {
    store: React.PropTypes.object
  };

  spec.getInitialState = function() {
    return init ? { model: init() } : {};
  };

  spec.render = function() {
    const model = this.state.model;
    const { children } = this.props;

    return view({ model, ...this.handlers }, ...children);
  };

  spec.componentWillMount = function() {
    const setModel = (model) => {
      // TODO: do we need to handle models that aren't objects?
      this.setState({ model: merge({}, this.state.model, model) });
    };

    if (connect) {
      const { model, actions, ...handlers } = connect(this.context.store);

      this.handlers = handlers;

      this.subscription = Rx.Observable.merge(
        model.do(setModel),
        ...actions
      ).subscribe();
    }
  };

  spec.componentWillUnmount = function() {
    this.model = null;

    if (this.subscription) {
      this.subscription.dispose();
    }
  };

  const factory = React.createFactory(React.createClass(spec));

  return (props, ...children) => factory(props, children);
}