# Bookmarklet Manager 為何不用開啟「Allow user scripts」

研究日期：2026-09-26。對象：[Bookmarklet Manager（擴充功能 ID `ahanneemgleganlpejmaiphiaiencgfe`）](https://chromewebstore.google.com/detail/bookmarklet-manager/ahanneemgleganlpejmaiphiaiencgfe)，以及本機 Microsoft Edge 已安裝的 2.0 版套件。商店頁只描述可在目前分頁執行 bookmarklet，沒有公開實作細節；以下實作結論來自已安裝的套件檔案。

## 結論

「Allow user scripts」是 `chrome.userScripts` API 的專用開關，並非所有擴充功能執行 JavaScript 的總開關。Chrome 138 起，該 API 需要在擴充功能詳細資料頁另行開啟；關閉時 `chrome.userScripts` 會不可用。`chrome.scripting.executeScript` 是另一個 API，需 `scripting` 權限及目標網站的存取權（`host_permissions` 或使用者觸發的 `activeTab`），官方文件沒有要求它使用「Allow user scripts」開關。來源：[Chrome userScripts API](https://developer.chrome.com/docs/extensions/reference/api/userScripts)、[Chrome scripting API](https://developer.chrome.com/docs/extensions/reference/api/scripting)、[Chrome activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)。

截圖是在 Microsoft Edge；Microsoft 官方列出 Edge 支援 `scripting` 與 `userScripts` 兩種獨立 API，Chrome 擴充功能的 API 與 manifest 在 Edge 通常相容。Edge 的個別版本仍應以實際測試為準。來源：[Microsoft Edge 支援的擴充功能 API](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/api-support)、[將 Chrome 擴充功能移植到 Edge](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/port-chrome-extension)。

競品 2.0 的 `manifest.json` 第 11、20 行宣告 `host_permissions: ["<all_urls>"]` 與 `permissions: ["storage", "activeTab", "scripting"]`，**沒有** `userScripts`。第 23–25 行另宣告 `js/*` 為 web accessible resources，但本次觀察的執行路徑沒有引用這些檔案。第一手證據：本機已安裝套件 `ahanneemgleganlpejmaiphiaiencgfe/2.0_0/manifest.json`。因此它不會因 `chrome.userScripts` 專用開關關閉而受阻。

`js/bookmarklet.js` 第 2–47 行顯示它如何執行：取得目前分頁、移除 `javascript:` 前綴，呼叫 `chrome.scripting.executeScript({ target: { tabId }, world: 'MAIN', func, args: [cleanCode] })`；其中 `func` 是套件內固定的函式，在頁面中把 `cleanCode` 包成 IIFE、建立 `Blob` 與 `blob:` URL，再建立 `<script src="blob:…">` 加到 DOM。它不是直接把任意字串交給 `executeScript`：Chrome 官方明言 `executeScript` 只接受套件檔案或函式，不能直接執行字串。第一手證據：本機已安裝套件 `ahanneemgleganlpejmaiphiaiencgfe/2.0_0/js/bookmarklet.js`；API 限制：[Chrome scripting API 的 Runtime strings 小節](https://developer.chrome.com/docs/extensions/reference/api/scripting#runtime_strings)。

## 代價與判斷範圍

- 這條路徑受目標網站政策影響。Chrome 文件明確指出，注入 `MAIN` world 的 content script 適用**網站本身的 CSP**；而這個競品實際把 `blob:` URL 設為頁面 `<script>` 的 `src`。因此，網站的 `script-src` 若不允許該來源，或 Trusted Types 限制字串指定 `script.src`，第二段執行可能失敗。競品自己的商店頁也提示「部分複雜 bookmarklet 可能無法在安全政策嚴格的網站執行」。來源：[Chrome content scripts／CSP](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#content_security_policy)、[MDN script-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src)、[MDN HTMLScriptElement.src](https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement/src)、[競品商店頁](https://chromewebstore.google.com/detail/bookmarklet-manager/ahanneemgleganlpejmaiphiaiencgfe)。
- 它已宣告 `<all_urls>` 網站存取，與「Allow user scripts」是不同層的授權。`activeTab` 只能在使用者觸發擴充功能後暫時授權目前分頁；`<all_urls>` 代表廣泛的網站存取請求，仍受瀏覽器的網站存取設定約束。來源：[Chrome activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)、[Chrome scripting API](https://developer.chrome.com/docs/extensions/reference/api/scripting)。
- Chrome 官方將 `userScripts` 定位為執行使用者提供、無法預先打包的任意程式碼的 API，並說明它有別於 content scripts 與 `scripting`。競品的 Blob 方式在本機套件中確實存在，且目前上架；這些事實**不足以推論** Chrome Web Store 已明示認可這種方式，或保證未來審查和所有網站都可用。來源：[Chrome userScripts API](https://developer.chrome.com/docs/extensions/reference/api/userScripts)、[Chrome 遠端程式碼說明](https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code)、[競品商店頁](https://chromewebstore.google.com/detail/bookmarklet-manager/ahanneemgleganlpejmaiphiaiencgfe)。

## 對本專案的直接含意

本專案目前 `manifest.json` 宣告 `userScripts`；若執行路徑呼叫 `chrome.userScripts`，Chrome 138+ 使用者仍須開啟該專用開關。競品免開關的原因是換了一條 API 與頁面 Blob script 路徑；這不代表只要移除權限即可保持相同執行能力和網站相容性。來源：[本專案 manifest.json](../../manifest.json)、[Chrome userScripts API](https://developer.chrome.com/docs/extensions/reference/api/userScripts)、上述競品套件檔案。
