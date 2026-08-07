(function (root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.BookmarkletConverter = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, () => {
  'use strict';

  const JAVASCRIPT_PREFIX = 'javascript:';

  const stripBom = (source) => String(source ?? '').replace(/^\uFEFF/, '');

  const stripJavascriptPrefix = (value) => {
    const text = String(value ?? '');
    return text.slice(0, JAVASCRIPT_PREFIX.length).toLowerCase() === JAVASCRIPT_PREFIX
      ? text.slice(JAVASCRIPT_PREFIX.length)
      : text;
  };

  const encodeJavaScript = (source) => encodeURIComponent(
    stripBom(stripJavascriptPrefix(source))
  );

  const toBookmarkletUrl = (source) => `${JAVASCRIPT_PREFIX}${encodeJavaScript(source)}`;

  const decodeBookmarklet = (value) => {
    try {
      return decodeURIComponent(stripJavascriptPrefix(stripBom(value)));
    } catch (error) {
      throw new Error('Unable to decode bookmarklet: malformed percent encoding.', { cause: error });
    }
  };

  return {
    stripBom,
    encodeJavaScript,
    toBookmarkletUrl,
    decodeBookmarklet
  };
});
