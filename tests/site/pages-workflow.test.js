import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Pages workflow publishes site, shared module, and bookmarklet catalog', async () => {
  const workflow = await readFile('.github/workflows/deploy-pages.yml', 'utf8');

  assert.match(workflow, /cp -R site shared bookmarklets dist/);
  assert.match(workflow, /actions\/upload-pages-artifact/);
  assert.match(workflow, /actions\/deploy-pages/);
});
