import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeBookmarklet,
  encodeJavaScript,
  normalizeScriptInput,
  stripBom,
  stripJavascriptPrefix,
  toBookmarkletUrl,
} from '../../shared/bookmarklet.js';

test('stripBom removes one leading BOM only', () => {
  assert.equal(stripBom('\uFEFFalert(1)'), 'alert(1)');
  assert.equal(stripBom(' alert(1)'), ' alert(1)');
});

test('stripJavascriptPrefix handles prefix case-insensitively', () => {
  assert.equal(stripJavascriptPrefix('JavaScript:alert(1)'), 'alert(1)');
  assert.equal(stripJavascriptPrefix('alert(1)'), 'alert(1)');
});

test('encodeJavaScript removes a leading BOM and existing prefix', () => {
  assert.equal(encodeJavaScript('\uFEFFjavascript:alert(1)'), 'alert(1)');
});

test('toBookmarkletUrl percent-encodes JavaScript and preserves one prefix', () => {
  assert.equal(
    toBookmarkletUrl("alert('hello world')"),
    "javascript:alert('hello%20world')",
  );
  assert.equal(toBookmarkletUrl('javascript:alert(1)'), 'javascript:alert(1)');
});

test('decodeBookmarklet removes the prefix and decodes bookmarklet content', () => {
  assert.equal(
    decodeBookmarklet('javascript:alert(%27hello%20world%27)'),
    "alert('hello world')",
  );
});

test('decodeBookmarklet rejects malformed percent encoding', () => {
  assert.throws(
    () => decodeBookmarklet('javascript:%E0%A4%A'),
    /Unable to decode bookmarklet: malformed percent encoding/,
  );
});

test('normalizeScriptInput preserves percent characters in raw JavaScript', () => {
  assert.equal(
    normalizeScriptInput("const width = '100%';", 'raw'),
    "const width = '100%';",
  );
});

test('normalizeScriptInput decodes an encoded bookmarklet only when selected', () => {
  assert.equal(
    normalizeScriptInput('javascript:alert(%27hello%20world%27)', 'encoded-bookmarklet'),
    "alert('hello world')",
  );
});

test('normalizeScriptInput rejects malformed input only in encoded bookmarklet mode', () => {
  assert.equal(normalizeScriptInput('100%', 'raw'), '100%');
  assert.throws(
    () => normalizeScriptInput('javascript:%E0%A4%A', 'encoded-bookmarklet'),
    /Unable to decode bookmarklet: malformed percent encoding/,
  );
});
