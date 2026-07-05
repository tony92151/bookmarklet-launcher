export function decodeBookmarklet(input) {
  let code = String(input ?? "").trim();
  let wasBookmarklet = false;

  const prefixMatch = code.match(/^javascript:/i);
  if (prefixMatch) {
    wasBookmarklet = true;
    code = code.slice(prefixMatch[0].length);
  }

  if (/%[0-9A-Fa-f]{2}/.test(code)) {
    try {
      code = decodeURIComponent(code);
    } catch (e) {
    }
  }

  return { code: code.trim(), wasBookmarklet };
}
