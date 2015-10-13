import Rx from 'rx';
import createContainer from '../core/container';

import * as Section from '../components/Section';
import * as Text from '../components/Text';
import * as TextInput from '../components/TextInput';
import * as PasswordInput from '../components/PasswordInput';
import * as Button from '../components/Button';


const simulateLoginRequest = (creds) => (
  Rx.Observable.just(creds)
    .delay(1000)
    .selectMany(
      creds && creds.username === creds.password ?
        Rx.Observable.just({ name: creds.username, token: 'abc' }) :
        Rx.Observable.throw(new Error('invalid username or password'))
    )
);


const init = () => ({
  username: '',
  password: '',
  error: null,
  pending: false
});


const actions = () => ({
  onUsername: new Rx.Subject(),
  onPassword: new Rx.Subject(),
  onLogin: new Rx.Subject()
});


const update = ({ appState, modelState, onUsername, onPassword, onLogin }) => (
  Rx.Observable.merge(
    onUsername
      .selectMany(modelState.set('username')),

    onPassword
      .selectMany(modelState.set('password')),

    onLogin
      .selectMany(() => modelState.set('error')(null))
      .selectMany(() => modelState.set('pending')(true))
      .selectMany(modelState.get())
      .selectMany((creds) =>
        simulateLoginRequest(creds)
          .catch((err) =>
            modelState.set('error')(err)
              .selectMany(() => modelState.set('pending')(false))
              .selectMany(Rx.Observable.empty())
          )
      )
      .selectMany(appState.set('user'))
      .selectMany(() => modelState.set('pending')(false))
  )
);


const view = ({ model, onUsername, onPassword, onLogin }) => (
  Section.view({},
    TextInput.view({ model: model.username, onInput: onUsername }),
    PasswordInput.view({ model: model.password, onInput: onPassword }),
    Button.view({ model: { disabled: model.pending }, onClick: onLogin },
      Text.view({ model: model.pending ? 'Logging In...' : 'Login' })),

    model.error &&
      Section.view({},
        Text.view({ model: model.error.message })))
);


export default createContainer({ init, actions, update, view });