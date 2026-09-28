import assert from 'node:assert/strict';
import test from 'node:test';

async function withOptions(fetcher, callback, scripts = []) {
  const original = { document: globalThis.document, chrome: globalThis.chrome, fetch: globalThis.fetch };
  const elements = new Map();
  const makeElement = () => {
    const handlers = new Map();
    const classes = new Set();
    const attributes = new Map();
    return {
      value: '', textContent: '', innerHTML: '', disabled: false, children: [],
      classList: {
        add(name) { classes.add(name); }, remove(name) { classes.delete(name); },
        contains(name) { return classes.has(name); },
        toggle(name, force) { if (force) classes.add(name); else classes.delete(name); },
      },
      setAttribute(name, value) { attributes.set(name, value); },
      getAttribute(name) { return attributes.get(name); },
      addEventListener(type, handler) { handlers.set(type, handler); },
      async fire(type) { await handlers.get(type)?.({ preventDefault() {} }); },
      reset() {}, scrollIntoView() {}, focus() {}, appendChild(node) { this.children.push(node); },
    };
  };
  for (const id of [
    'extension-version', 'script-form', 'name', 'code', 'form-title', 'form-hint',
    'save-btn', 'cancel-btn', 'list', 'list-empty', 'count',
    'manual-tab', 'github-tab', 'manual-panel', 'github-panel',
    'github-form', 'github-url', 'github-save-btn', 'github-hint',
  ]) elements.set(id, makeElement());

  const messages = [];
  globalThis.document = {
    documentElement: { lang: 'en' },
    getElementById: (id) => elements.get(id),
    querySelector: () => ({ value: 'raw', checked: true }),
    querySelectorAll: () => [],
    createElement: () => makeElement(),
  };
  globalThis.chrome = {
    runtime: {
      getManifest: () => ({ version: '1.1.0' }),
      async sendMessage(message) { messages.push(message); return { ok: true }; },
    },
    storage: { local: { async get(key) { return key === 'language' ? { language: 'en' } : { scripts }; }, async set() {} } },
  };
  globalThis.fetch = fetcher;

  try {
    await import(`../../extension/options/index.js?github-import-test=${Math.random()}`);
    await new Promise((resolve) => setImmediate(resolve));
    await callback(elements, messages);
  } finally {
    Object.assign(globalThis, original);
  }
}

test('GitHub tab saves the fetched script directly as a local copy', async () => {
  await withOptions(async () => ({ ok: true, text: async () => "const rate = '100%';" }), async (elements, messages) => {
    await elements.get('github-tab').fire('click');
    assert.equal(elements.get('manual-panel').classList.contains('hidden'), true);
    assert.equal(elements.get('github-panel').classList.contains('hidden'), false);

    elements.get('github-url').value = 'https://github.com/owner/repo/blob/main/tools/reward.js';
    await elements.get('github-form').fire('submit');

    assert.deepEqual(messages[0], {
      type: 'MUTATE_SCRIPTS', operation: 'save',
      script: { name: 'reward', code: "const rate = '100%';" },
    });
    assert.equal(elements.get('name').value, '');
    assert.equal(elements.get('code').value, '');
  });
});

test('failed GitHub load does not save a script', async () => {
  await withOptions(async () => ({ ok: false, status: 404 }), async (elements, messages) => {
    await elements.get('github-tab').fire('click');
    elements.get('github-url').value = 'https://github.com/owner/repo/blob/main/missing.js';
    await elements.get('github-form').fire('submit');

    assert.equal(messages.length, 0);
    assert.match(elements.get('github-hint').textContent, /404/);
  });
});

test('switching tabs preserves manual input and manual Save uses that input', async () => {
  await withOptions(async () => { throw new Error('GitHub should not be fetched'); }, async (elements, messages) => {
    elements.get('name').value = 'My script';
    elements.get('code').value = 'alert(1)';
    await elements.get('github-tab').fire('click');
    await elements.get('manual-tab').fire('click');

    assert.equal(elements.get('name').value, 'My script');
    assert.equal(elements.get('code').value, 'alert(1)');
    assert.equal(elements.get('manual-panel').classList.contains('hidden'), false);
    await elements.get('script-form').fire('submit');
    assert.deepEqual(messages[0], {
      type: 'MUTATE_SCRIPTS', operation: 'save',
      script: { name: 'My script', code: 'alert(1)' },
    });
  });
});

test('editing a saved script opens the manual tab', async () => {
  await withOptions(async () => { throw new Error('GitHub should not be fetched'); }, async (elements) => {
    await elements.get('github-tab').fire('click');
    const editButton = elements.get('list').children[0].children[1].children[0];
    await editButton.fire('click');

    assert.equal(elements.get('manual-panel').classList.contains('hidden'), false);
    assert.equal(elements.get('github-panel').classList.contains('hidden'), true);
    assert.equal(elements.get('github-tab').classList.contains('hidden'), true);
    assert.equal(elements.get('name').value, 'Saved');
  }, [{ id: 'saved', name: 'Saved', code: 'alert(2)' }]);
});

test('saved script list shows last updated local time to the second instead of code', async () => {
  const updatedAt = new Date(2024, 0, 2, 3, 4, 5).getTime();
  await withOptions(async () => { throw new Error('GitHub should not be fetched'); }, async (elements) => {
    const item = elements.get('list').children[0];
    const metadata = item.children[0].children[1];
    assert.equal(metadata.textContent, 'Updated 2024-01-02 03:04:05');
  }, [{ id: 'saved', name: 'Saved', code: 'alert(2)', createdAt: 1, updatedAt }]);
});
