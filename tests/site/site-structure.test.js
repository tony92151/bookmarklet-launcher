import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('installation page uses module-based bookmarklet conversion', async () => {
  const page = await readFile('site/index.html', 'utf8');
  const script = await readFile('site/assets/install.js', 'utf8');

  assert.match(page, /<script type="module" src="assets\/install\.js"><\/script>/);
  assert.match(script, /import \{ toBookmarkletUrl \} from '\.\.\/\.\.\/shared\/bookmarklet\.js'/);
  assert.match(script, /toBookmarkletUrl\(source\)/);
  assert.doesNotMatch(script, /install-encoded/);
});

test('site loads its sibling catalog directory', async () => {
  const catalog = JSON.parse(await readFile('bookmarklets/catalog.json', 'utf8'));
  assert.equal(catalog.bookmarklets[0].source, '../bookmarklets/klook-booking-category-label.js');
});
