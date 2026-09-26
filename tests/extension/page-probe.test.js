import assert from 'node:assert/strict';
import test from 'node:test';
import { createPageProbe, runBlobProbeInPage, runBlobScriptInPage } from '../../extension/page-probe.js';

function createChrome({ tab = { id: 17, url: 'https://example.com/' }, result, injectionError } = {}) {
  const calls = [];
  return {
    calls,
    chrome: {
      tabs: { async query() { return tab ? [tab] : []; } },
      scripting: {
        async executeScript(request) {
          calls.push(request);
          if (injectionError) throw injectionError;
          return [{ frameId: 0, result }];
        },
      },
    },
  };
}

async function withTestPage(blockScript, callback) {
  const originalDocument = globalThis.document;
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const blobs = new Map();
  const revoked = [];
  const page = new EventTarget();
  const scripts = [];

  URL.createObjectURL = (blob) => {
    const url = `blob:https://example.com/${blobs.size + 1}`;
    blobs.set(url, blob);
    return url;
  };
  URL.revokeObjectURL = (url) => revoked.push(url);
  page.createElement = () => {
    const script = { src: '', removed: false, remove() { this.removed = true; } };
    scripts.push(script);
    return script;
  };
  page.documentElement = {
    appendChild(script) {
      queueMicrotask(async () => {
        if (blockScript) {
          script.onerror?.(new Event('error'));
          return;
        }
        const source = await blobs.get(script.src).text();
        new Function('document', 'Event', source)(page, Event);
        script.onload?.(new Event('load'));
      });
    },
  };
  globalThis.document = page;

  try {
    return await callback({ scripts, revoked });
  } finally {
    globalThis.document = originalDocument;
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  }
}

test('page probe proves a Blob script ran and removes its temporary resources', async () => {
  await withTestPage(false, async ({ scripts, revoked }) => {
    assert.deepEqual(await runBlobProbeInPage(), { ok: true });
    assert.equal(scripts.length, 1);
    assert.equal(scripts[0].removed, true);
    assert.deepEqual(revoked, ['blob:https://example.com/1']);
  });
});

test('page probe reports when the page blocks a Blob script', async () => {
  await withTestPage(true, async ({ scripts, revoked }) => {
    assert.deepEqual(await runBlobProbeInPage(), { ok: false, error: 'BLOB_BLOCKED' });
    assert.equal(scripts[0].removed, true);
    assert.deepEqual(revoked, ['blob:https://example.com/1']);
  });
});

test('fallback executes the selected script on a page that allows Blob scripts', async () => {
  await withTestPage(false, async ({ scripts, revoked }) => {
    let ran = false;
    document.addEventListener('user-script-executed', () => { ran = true; });

    assert.deepEqual(await runBlobScriptInPage('document.dispatchEvent(new Event("user-script-executed"))'), { ok: true });
    assert.equal(ran, true);
    assert.equal(scripts[0].removed, true);
    assert.deepEqual(revoked, ['blob:https://example.com/1']);
  });
});

test('fallback reports a page that blocks Blob scripts without running the selected script', async () => {
  await withTestPage(true, async () => {
    assert.deepEqual(await runBlobScriptInPage('document.body.textContent = "changed"'), {
      ok: false,
      error: 'BLOB_BLOCKED',
    });
  });
});

test('page probe rejects restricted pages before attempting injection', async () => {
  const { chrome, calls } = createChrome({ tab: { id: 17, url: 'chrome://extensions/' } });
  assert.deepEqual(await createPageProbe(chrome).probe(), { ok: false, error: 'RESTRICTED_PAGE' });
  assert.deepEqual(calls, []);
});

test('page probe forwards the result of its fixed in-page test', async () => {
  const { chrome, calls } = createChrome({ result: { ok: false, error: 'BLOB_BLOCKED' } });
  assert.deepEqual(await createPageProbe(chrome).probe(), { ok: false, error: 'BLOB_BLOCKED' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].world, 'MAIN');
  assert.equal(calls[0].func, runBlobProbeInPage);
  assert.deepEqual(calls[0].target, { tabId: 17 });
});

test('page probe reports browser injection failures without claiming the site blocked the script', async () => {
  const { chrome } = createChrome({ injectionError: new Error('Cannot access this page') });
  assert.deepEqual(await createPageProbe(chrome).probe(), { ok: false, error: 'INJECTION_FAILED' });
});
