import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

function harness() {
  const state = { focused: { space: 'one', tab: 'tab-one' }, calls: [], dialogs: [], props: null };
  const context = {
    focused: () => state.focused,
    spaces: () => [
      { id: 'one', name: 'First', tabs: [{ id: 'tab-one', name: 'Original tab' }] },
      { id: 'two', name: 'Second', tabs: [{ id: 'tab-two', name: 'Other tab' }] },
    ],
    run: (...args) => state.calls.push(args),
    openOverlay: spec => { state.dialogs.push(spec); return 'dialog-id'; },
  };
  vm.createContext(context);
  const source = readFileSync(new URL('../ui/actions.js', import.meta.url), 'utf8').replace(/^import .*\n/gm, '').replaceAll('export ', '');
  vm.runInContext(source + '\nglobalThis.action = runOmarchy;', context);
  return { state, context, action: context.action };
}

test('space close asks first and captures its target before focus changes', () => {
  const { state, action } = harness();
  action('space.close');
  assert.equal(state.calls.length, 0);
  const dialog = state.dialogs[0];
  assert.equal(dialog.mod, 'omarchy-dialog');
  assert.equal(dialog.frame, 'none');
  assert.equal(dialog.props.mode, 'confirm');
  assert.equal(dialog.props.command.args.id, 'one');
  assert.equal(dialog.props.command.args.confirmed, true);
  state.focused = { space: 'two', tab: 'tab-two' };
  assert.equal(dialog.props.command.args.id, 'one');
});

test('explicit close confirmation and completed rename execute directly', () => {
  const { state, action } = harness();
  action('space.close', { id: 'one', confirmed: true });
  action('tab.rename', { id: 'tab-one', name: '' });
  assert.equal(state.dialogs.length, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(state.calls)), [
    ['space.close', { id: 'one', confirmed: true }],
    ['tab.rename', { id: 'tab-one', name: '' }],
  ]);
});

test('rename prompts preserve the selected tab and space', () => {
  const { state, action } = harness();
  action('tab.rename');
  action('space.rename', { id: 'two' });
  assert.equal(state.dialogs[0].props.value, 'Original tab');
  assert.equal(state.dialogs[0].props.command.args.id, 'tab-one');
  assert.equal(state.dialogs[1].props.value, 'Second');
  assert.equal(state.dialogs[1].props.command.args.id, 'two');
  action('space.close', { id: 'gone' });
  assert.equal(state.dialogs.length, 2);
  assert.equal(state.calls.length, 0);
});

test('settings, keys and palette stay in Omarchy; duplicate-mod uses its prompt', () => {
  const { state, action } = harness();
  for (const command of ['app.settings', 'app.help', 'app.palette']) action(command);
  assert.deepEqual(state.calls.map(call => call[1].name), ['omarchy-settings', 'omarchy-keys', 'omarchy-palette']);
  action('mod.clone');
  assert.equal(state.dialogs[0].props.mode, 'prompt');
  assert.equal(state.dialogs[0].props.command.name, 'mod.clone');
});

test('confirmation cancel has no command side effects; Enter executes its captured command', () => {
  const { state, context, action } = harness();
  action('space.close', { id: 'one' });
  state.props = { ...state.dialogs[0].props, overlay: 'dialog-id' };
  const callbacks = new Map();
  const element = () => new Proxy({}, { get: (_target, key) => {
    if (key === 'when') return (on, fn) => on ? fn(element()) : element();
    if (key === 'on_key_down') return fn => { callbacks.set('key', fn); return element(); };
    return () => element();
  } });
  Object.assign(context, {
    View: class {}, props: () => state.props, theme: () => ({}),
    div: element, v_flex: element, h_flex: element,
    surface: (_t, el) => el, dialogHeader: element, UI: {},
    button: (_t, id, _label, callback) => { callbacks.set(id, callback); return element(); },
    closeOverlay: id => state.calls.push(['close-overlay', id]),
  });
  const source = readFileSync(new URL('../mods/omarchy-dialog/main.js', import.meta.url), 'utf8')
    .replace(/^import .*\n/gm, '').replace('export default class Dialog', 'class Dialog');
  vm.runInContext(source + '\nglobalThis.DialogView = Dialog;', context);
  const dialog = new context.DialogView();
  dialog.render();
  callbacks.get('dialog-cancel')();
  assert.deepEqual(state.calls, [['close-overlay', 'dialog-id']]);
  state.calls.length = 0;
  state.focused = { space: 'two', tab: 'tab-two' };
  callbacks.get('key')({ key: 'enter' }, { stop_propagation() {} });
  assert.equal(state.calls[0][0], 'close-overlay');
  assert.equal(state.calls[1][0], 'space.close');
  assert.equal(state.calls[1][1].id, 'one');
  assert.equal(state.calls[1][1].confirmed, true);
});
