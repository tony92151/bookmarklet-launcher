import assert from 'node:assert/strict';
import test from 'node:test';
import { createScriptRunner } from '../../extension/script-runner.js';

function createChrome({ available = true, tabs = [{ id: 17, url: 'https://example.com' }], queryError, executeError } = {}) {
  const calls = { query: [], execute: [] };
  return {
    calls,
    chrome: {
      userScripts: {
        async getScripts() {
          if (!available) throw new Error('User scripts disabled');
          return [];
        },
        async execute(request) {
          calls.execute.push(request);
          if (executeError) throw executeError;
        },
      },
      tabs: {
        async query(query) {
          calls.query.push(query);
          if (queryError) throw queryError;
          return tabs;
        },
      },
    },
  };
}

test('script runner reports disabled user scripts without querying a tab', async () => {
  const { chrome, calls } = createChrome({ available: false });
  const runner = createScriptRunner(chrome);

  assert.deepEqual(await runner.run('alert(1)'), { ok: false, error: 'USERSCRIPTS_DISABLED' });
  assert.deepEqual(calls.query, []);
});

test('script runner rejects restricted pages', async () => {
  const { chrome, calls } = createChrome({ tabs: [{ id: 17, url: 'chrome://extensions/' }] });

  assert.deepEqual(await createScriptRunner(chrome).run('alert(1)'), { ok: false, error: 'RESTRICTED_PAGE' });
  assert.deepEqual(calls.execute, []);
});

test('script runner executes code in the active tab main world', async () => {
  const { chrome, calls } = createChrome();

  assert.deepEqual(await createScriptRunner(chrome).run('alert(1)'), { ok: true });
  assert.deepEqual(calls.execute, [{
    target: { tabId: 17 },
    world: 'MAIN',
    injectImmediately: true,
    js: [{ code: 'alert(1)' }],
  }]);
});

test('script runner converts Chrome API failures to stable results', async () => {
  const { chrome } = createChrome({ queryError: new Error('tabs unavailable') });

  assert.deepEqual(await createScriptRunner(chrome).run('alert(1)'), {
    ok: false,
    error: 'CHROME_API_ERROR',
    detail: 'tabs unavailable',
  });
});
