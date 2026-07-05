// 把使用者貼上的內容正規化成可直接執行的原始 JS。
//
// 支援兩種輸入:
//   1. javascript: 書籤碼 (可能經過 URI 百分比編碼,如範例的 %3D / %7B)
//   2. 原始 JavaScript 程式碼
//
// 回傳 { code, wasBookmarklet }

export function decodeBookmarklet(input) {
  let code = String(input ?? "").trim();
  let wasBookmarklet = false;

  // 1. 去掉 javascript: 前綴 (不分大小寫)
  const prefixMatch = code.match(/^javascript:/i);
  if (prefixMatch) {
    wasBookmarklet = true;
    code = code.slice(prefixMatch[0].length);
  }

  // 2. 若看起來是百分比編碼,嘗試解碼。失敗則保留原字串。
  if (/%[0-9A-Fa-f]{2}/.test(code)) {
    try {
      code = decodeURIComponent(code);
    } catch (e) {
      // 內含無法解碼的 % 序列 — 視為原始程式碼,保持不變。
    }
  }

  return { code: code.trim(), wasBookmarklet };
}
