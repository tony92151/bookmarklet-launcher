import assert from 'node:assert/strict';
import test from 'node:test';

function makeElement(initialClasses = []) {
  const classes = new Set(initialClasses);
  const handlers = new Map();
  const attributes = new Map();
  return {
    children: [],
    textContent: '',
    className: '',
    innerHTML: '',
    disabled: false,
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
      toggle(name, force) {
        if (force ?? !classes.has(name)) classes.add(name);
        else classes.delete(name);
      },
    },
    addEventListener(name, handler) { handlers.set(name, handler); },
    setAttribute(name, value) { attributes.set(name, value); },
    getAttribute(name) { return attributes.get(name); },
    append(...nodes) { this.children.push(...nodes); },
    appendChild(node) { this.children.push(node); },
    async click() { await handlers.get('click')?.(); },
    scrollIntoView() {},
    get offsetWidth() { return 100; },
  };
}

async function withPopup(preferences, callback) {
  const elements = new Map();
  for (const id of [
    'script-list', 'empty', 'setup-banner', 'status', 'manage', 'add-first',
    'open-extensions', 'recheck-user-scripts', 'test-this-page',
    'defer-setup', 'expand-setup',
  ]) {
    elements.set(id, makeElement());
  }
  elements.get('setup-banner').classList.add('hidden');
  elements.get('test-this-page').classList.add('hidden');
  const originalDocument = globalThis.document;
  const originalChrome = globalThis.chrome;
  const originalWindow = globalThis.window;
  globalThis.document = {
    getElementById: (id) => elements.get(id),
    createElement: () => makeElement(),
    createElementNS: () => makeElement(),
  };
  globalThis.window = { close() { preferences.closed = true; } };
  globalThis.chrome = {
    storage: {
      local: {
        async get(key) {
          if (key === 'scripts') return { scripts: preferences.scripts || [] };
          return { setupDeferred: preferences.setupDeferred };
        },
        async set(value) { Object.assign(preferences, value); },
      },
    },
    runtime: {
      async sendMessage(message) {
        preferences.messages?.push(message);
        if (message.type === 'CHECK_USERSCRIPTS') return { available: preferences.available };
        if (message.type === 'PROBE_PAGE') return { ok: true };
        if (message.type === 'RUN_SCRIPT') return { ok: true };
        throw new Error(`Unexpected message: ${message.type}`);
      },
    },
  };
  try {
    await import(`../../extension/popup/index.js?setup-test=${Math.random()}`);
    await new Promise((resolve) => setImmediate(resolve));
    await callback(elements);
  } finally {
    globalThis.document = originalDocument;
    globalThis.chrome = originalChrome;
    globalThis.window = originalWindow;
  }
}

test('deferring setup folds the banner and shows the page test in the header', async () => {
  const preferences = { setupDeferred: false, available: false };
  await withPopup(preferences, async (elements) => {
    assert.equal(elements.get('setup-banner').classList.contains('hidden'), false);
    assert.equal(elements.get('test-this-page').classList.contains('hidden'), true);

    await elements.get('defer-setup').click();

    assert.equal(preferences.setupDeferred, true);
    assert.equal(elements.get('setup-banner').classList.contains('collapsed'), true);
    assert.equal(elements.get('test-this-page').classList.contains('hidden'), false);
  });
});

test('a saved defer choice is restored and the folded setup can be reopened', async () => {
  const preferences = { setupDeferred: true, available: false };
  await withPopup(preferences, async (elements) => {
    assert.equal(elements.get('setup-banner').classList.contains('collapsed'), true);
    assert.equal(elements.get('test-this-page').classList.contains('hidden'), false);

    await elements.get('expand-setup').click();

    assert.equal(preferences.setupDeferred, false);
    assert.equal(elements.get('setup-banner').classList.contains('collapsed'), false);
    assert.equal(elements.get('test-this-page').classList.contains('hidden'), true);
  });
});

test('enabling user scripts hides both the setup banner and page test', async () => {
  const preferences = { setupDeferred: true, available: true };
  await withPopup(preferences, async (elements) => {
    assert.equal(elements.get('setup-banner').classList.contains('hidden'), true);
    assert.equal(elements.get('test-this-page').classList.contains('hidden'), true);
  });
});

test('saved scripts try to run without a prior page test when user scripts are off', async () => {
  const preferences = {
    setupDeferred: true,
    available: false,
    scripts: [{ name: 'Example', code: 'alert(1)' }],
    messages: [],
  };
  await withPopup(preferences, async (elements) => {
    const runButton = elements.get('script-list').children[0].children[0];
    await runButton.click();

    assert.ok(preferences.messages.some((message) => message.type === 'RUN_SCRIPT' && message.code === 'alert(1)'));
    assert.equal(preferences.closed, true);
  });
});
