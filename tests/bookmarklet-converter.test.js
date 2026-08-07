const test = require('node:test');
const assert = require('node:assert/strict');
const converter = require('../assets/bookmarklet-converter.js');

test('stripBom removes only one leading UTF-8 BOM', () => {
  assert.equal(converter.stripBom('\uFEFFalert(1)'), 'alert(1)');
  assert.equal(converter.stripBom(' alert(1)'), ' alert(1)');
});

test('toBookmarkletUrl percent-encodes JavaScript but preserves the prefix', () => {
  assert.equal(
    converter.toBookmarkletUrl("alert('hello world')"),
    "javascript:alert('hello%20world')"
  );
});

test('toBookmarkletUrl does not duplicate an existing javascript prefix', () => {
  assert.equal(
    converter.toBookmarkletUrl('javascript:alert(1)'),
    'javascript:alert(1)'
  );
});

test('decodeBookmarklet decodes encoded bookmarklet content and removes the prefix', () => {
  assert.equal(
    converter.decodeBookmarklet('javascript:alert(%27hello%20world%27)'),
    "alert('hello world')"
  );
});

test('decodeBookmarklet throws a clear error for malformed percent encoding', () => {
  assert.throws(
    () => converter.decodeBookmarklet('javascript:%E0%A4%A'),
    /Unable to decode bookmarklet/
  );
});
