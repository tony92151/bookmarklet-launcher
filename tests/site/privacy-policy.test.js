import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('privacy policy discloses local storage, no transfer, permissions, and support', async () => {
  const policy = await readFile('site/privacy.html', 'utf8');

  for (const phrase of ['chrome.storage.local', 'not sent', 'activeTab', 'storage', 'userScripts', 'GitHub Issues']) {
    assert.match(policy, new RegExp(phrase, 'i'));
  }

  assert.match(policy, /自訂指令碼/);
});
