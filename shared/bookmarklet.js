const JAVASCRIPT_PREFIX = 'javascript:';

export const stripBom = (source) => String(source ?? '').replace(/^\uFEFF/, '');

export const stripJavascriptPrefix = (value) => {
  const text = String(value ?? '');
  return text.slice(0, JAVASCRIPT_PREFIX.length).toLowerCase() === JAVASCRIPT_PREFIX
    ? text.slice(JAVASCRIPT_PREFIX.length)
    : text;
};

export const encodeJavaScript = (source) => encodeURIComponent(
  stripJavascriptPrefix(stripBom(source)),
);

export const toBookmarkletUrl = (source) => `${JAVASCRIPT_PREFIX}${encodeJavaScript(source)}`;

export const decodeBookmarklet = (value) => {
  try {
    return decodeURIComponent(stripJavascriptPrefix(stripBom(value)));
  } catch (error) {
    throw new Error('Unable to decode bookmarklet: malformed percent encoding.', { cause: error });
  }
};

export const normalizeScriptInput = (value, mode) => {
  const source = stripBom(value);
  return mode === 'encoded-bookmarklet' ? decodeBookmarklet(source) : source;
};
