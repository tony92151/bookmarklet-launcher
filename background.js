// Service worker:接收來自 popup 的訊息,用 chrome.userScripts API
// 在目前分頁的「主世界 (MAIN world)」執行使用者的腳本。
//
// 為何用 userScripts 而非 scripting:userScripts 是 Chrome 專為
// 「執行使用者自訂腳本」設計的 API,不受網站 CSP 限制,最接近書籤行為。
// 代價:使用者需在擴充功能詳細資料頁開啟「允許使用者腳本」開關。

// 偵測 userScripts 開關是否開啟。
// 依官方建議:實際呼叫一個方法 (getScripts),開關關閉時會丟例外
// (或 chrome.userScripts 本身為 undefined,存取其方法時丟例外)。兩種情況都涵蓋。
async function userScriptsAvailable() {
  try {
    await chrome.userScripts.getScripts();
    return true;
  } catch {
    return false;
  }
}

async function runScript(code) {
  if (!(await userScriptsAvailable())) {
    return { ok: false, error: "USERSCRIPTS_DISABLED" };
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || tab.id == null) {
    return { ok: false, error: "NO_ACTIVE_TAB" };
  }

  // 不允許在 chrome:// / extension 等受限頁面注入
  if (tab.url && /^(chrome|edge|about|chrome-extension|devtools):/i.test(tab.url)) {
    return { ok: false, error: "RESTRICTED_PAGE" };
  }

  try {
    await chrome.userScripts.execute({
      target: { tabId: tab.id },
      world: "MAIN",
      injectImmediately: true,
      js: [{ code }],
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e) };
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "CHECK_USERSCRIPTS") {
    userScriptsAvailable().then((available) => sendResponse({ available }));
    return true; // 非同步回應,保持 channel 開啟
  }

  if (msg?.type === "RUN_SCRIPT") {
    runScript(msg.code).then(sendResponse);
    return true; // 非同步回應,保持 channel 開啟
  }

  return false;
});
