import assert from 'node:assert/strict';
import test from 'node:test';
import { loadGithubScript } from '../../extension/github-import.js';

test('loads a GitHub blob as raw JavaScript for a local copy', async () => {
  const source = 'https://github.com/tony92151/bookmarklet-script-manager-market/blob/main/bookmarklets/klook-booking-category-label.js';
  const result = await loadGithubScript(source, async (url) => {
    assert.equal(url, 'https://raw.githubusercontent.com/tony92151/bookmarklet-script-manager-market/main/bookmarklets/klook-booking-category-label.js');
    return { ok: true, text: async () => "const label = '100%';" };
  });

  assert.deepEqual(result, { name: 'klook-booking-category-label', code: "const label = '100%';" });
});

test('rejects links outside a GitHub JavaScript blob without requesting them', async () => {
  const fetcher = () => { throw new Error('Unexpected network request'); };
  await assert.rejects(loadGithubScript('https://github.com/owner/repo/tree/main/a.js', fetcher), /GitHub.*\.js/i);
  await assert.rejects(loadGithubScript('https://evil.example/owner/repo/blob/main/a.js', fetcher), /GitHub.*\.js/i);
  await assert.rejects(loadGithubScript('https://github.com/owner/repo/blob/main/readme.md', fetcher), /GitHub.*\.js/i);
});

test('reports missing and empty files without producing a script to save', async () => {
  const url = 'https://github.com/owner/repo/blob/main/bookmarklets/example.js';
  await assert.rejects(loadGithubScript(url, async () => ({ ok: false, status: 404 })), /404/);
  await assert.rejects(loadGithubScript(url, async () => ({ ok: true, text: async () => '  ' })), /empty/i);
});
