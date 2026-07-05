import { getScripts } from "./lib/storage.js";

const listEl = document.getElementById("script-list");
const emptyEl = document.getElementById("empty");
const bannerEl = document.getElementById("setup-banner");
const statusEl = document.getElementById("status");

let userScriptsOk = false;

function showStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = `status ${kind}`;
  statusEl.classList.remove("hidden");
}

// 未啟用「允許使用者腳本」時:顯眼地提醒使用者先去設定,而不是直接執行。
function promptSetup() {
  bannerEl.classList.remove("hidden");
  bannerEl.classList.remove("flash");
  // 觸發重排以重新播放動畫
  void bannerEl.offsetWidth;
  bannerEl.classList.add("flash");
  bannerEl.scrollIntoView({ behavior: "smooth", block: "start" });
  showStatus("尚未啟用「允許使用者腳本」,請先依下方說明設定後再執行。", "err");
}

function errorMessage(code) {
  switch (code) {
    case "USERSCRIPTS_DISABLED":
      return "請先開啟「允許使用者腳本」開關。";
    case "NO_ACTIVE_TAB":
      return "找不到作用中的分頁。";
    case "RESTRICTED_PAGE":
      return "無法在此頁面執行 (chrome:// 等受限頁面)。";
    default:
      return `執行失敗:${code}`;
  }
}

// 偵測「允許使用者腳本」是否已啟用。
// 重點:在 popup 自身的 context 偵測 —— popup 每次開啟都是全新 context,
// 會反映最新的開關狀態,不像可能殘留舊狀態的 service worker。
// 依官方建議:實際呼叫一個方法 (getScripts),關閉時會丟例外。
async function detectUserScripts() {
  if (chrome.userScripts) {
    try {
      await chrome.userScripts.getScripts();
      return true;
    } catch {
      return false;
    }
  }
  // 此 context 取不到 API,退而問 service worker。
  try {
    const res = await chrome.runtime.sendMessage({ type: "CHECK_USERSCRIPTS" });
    return !!res?.available;
  } catch {
    return false;
  }
}

// 直接在 popup context 執行 (避免 service worker 殘留舊狀態的問題);
// 若此 context 沒有 userScripts.execute,再退回 service worker。
async function runScript(code) {
  if (!userScriptsOk) {
    promptSetup();
    return;
  }

  if (chrome.userScripts && typeof chrome.userScripts.execute === "function") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || tab.id == null) {
      showStatus(errorMessage("NO_ACTIVE_TAB"), "err");
      return;
    }
    if (tab.url && /^(chrome|edge|about|chrome-extension|devtools):/i.test(tab.url)) {
      showStatus(errorMessage("RESTRICTED_PAGE"), "err");
      return;
    }
    try {
      await chrome.userScripts.execute({
        target: { tabId: tab.id },
        world: "MAIN",
        injectImmediately: true,
        js: [{ code }],
      });
      window.close(); // 與書籤一樣:執行後關閉視窗
    } catch (e) {
      showStatus(errorMessage(String(e?.message || e)), "err");
    }
    return;
  }

  // Fallback:交給 service worker 執行
  const res = await chrome.runtime.sendMessage({ type: "RUN_SCRIPT", code });
  if (res?.ok) {
    window.close();
  } else {
    showStatus(errorMessage(res?.error), "err");
  }
}

function renderScripts(scripts) {
  listEl.innerHTML = "";
  if (scripts.length === 0) {
    emptyEl.classList.remove("hidden");
    return;
  }
  emptyEl.classList.add("hidden");

  for (const script of scripts) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "script-btn";
    btn.textContent = script.name;
    btn.title = "點擊在目前分頁執行";
    btn.addEventListener("click", () => runScript(script.code));
    li.appendChild(btn);
    listEl.appendChild(li);
  }
}

async function checkUserScripts() {
  userScriptsOk = await detectUserScripts();
  bannerEl.classList.toggle("hidden", userScriptsOk);
}

function wireNav() {
  document.getElementById("manage").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
  document.getElementById("add-first").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
  document.getElementById("open-extensions").addEventListener("click", () => {
    chrome.tabs.create({ url: "chrome://extensions" });
  });
}

async function init() {
  wireNav();
  await checkUserScripts();
  const scripts = await getScripts();
  renderScripts(scripts);
}

init();
