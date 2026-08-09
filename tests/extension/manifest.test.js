import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('manifest points to grouped extension entry points', async () => {
  const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));

  assert.equal(manifest.background.service_worker, 'extension/background.js');
  assert.equal(manifest.action.default_popup, 'extension/popup/index.html');
  assert.equal(manifest.options_page, 'extension/options/index.html');
});
