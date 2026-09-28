import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deleteScript,
  getScripts,
  resetScriptStorageForTests,
  saveScript,
  updateScript,
} from '../../extension/storage.js';

function installStorage(initialValue) {
  let value = initialValue;
  const writes = [];
  globalThis.chrome = {
    storage: {
      local: {
        async get() {
          return { scripts: value };
        },
        async set(next) {
          value = next.scripts;
          writes.push(value);
        },
      },
    },
  };
  return { get value() { return value; }, writes };
}

test('getScripts discards malformed script records', async (t) => {
  t.after(() => delete globalThis.chrome);
  installStorage([{ id: 'valid', name: 'Valid', code: 'alert(1)', createdAt: 1 }, { id: 'broken' }]);

  assert.deepEqual(await getScripts(), [{ id: 'valid', name: 'Valid', code: 'alert(1)', createdAt: 1, updatedAt: 1 }]);
});

test('concurrent saves preserve both scripts', async (t) => {
  t.after(() => delete globalThis.chrome);
  const storage = installStorage([]);
  resetScriptStorageForTests();
  const originalUuid = crypto.randomUUID;
  let id = 0;
  crypto.randomUUID = () => `script-${++id}`;
  t.after(() => { crypto.randomUUID = originalUuid; });

  await Promise.all([
    saveScript({ name: 'A', code: 'alert(1)' }),
    saveScript({ name: 'B', code: 'alert(2)' }),
  ]);

  assert.deepEqual(storage.value.map((script) => script.name), ['A', 'B']);
  assert.ok(storage.value.every((script) => script.createdAt === script.updatedAt));
});

test('updating a blank name keeps the saved-script name invariant', async (t) => {
  t.after(() => delete globalThis.chrome);
  const storage = installStorage([{ id: 'one', name: 'Original', code: 'alert(1)', createdAt: 1 }]);
  resetScriptStorageForTests();
  const originalNow = Date.now;
  Date.now = () => 2000;
  t.after(() => { Date.now = originalNow; });

  assert.deepEqual(await updateScript('one', { name: '', code: 'alert(2)' }), {
    id: 'one', name: 'Unnamed Script', code: 'alert(2)', createdAt: 1, updatedAt: 2000,
  });
  await deleteScript('missing');
  assert.equal(storage.writes.length, 1);
});
