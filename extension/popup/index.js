import { getScripts } from "../storage-client.js";
import { createLanguageController } from "../language.js";

const listEl = document.getElementById("script-list");
const emptyEl = document.getElementById("empty");
const bannerEl = document.getElementById("setup-banner");
const statusEl = document.getElementById("status");
const testPageEl = document.getElementById('test-this-page');

let userScriptsOk = false;
let setupDeferred = false;
let currentStatus = null;
let testing = false;
const i18n = createLanguageController({
  document,
  navigator: globalThis.navigator,
  storage: chrome.storage.local,
  onChange() {
    if (currentStatus?.key) statusEl.textContent = i18n.t(currentStatus.key, currentStatus.values);
    testPageEl.textContent = i18n.t(testing ? 'testing' : 'testPage');
    document.querySelectorAll('.script-btn').forEach((button) => { button.title = i18n.t('runScriptTitle'); });
  },
});

function renderSetup() {
  bannerEl.classList.toggle('hidden', userScriptsOk);
  bannerEl.classList.toggle('collapsed', !userScriptsOk && setupDeferred);
  testPageEl.classList.toggle('hidden', userScriptsOk || !setupDeferred);
  document.getElementById('expand-setup').setAttribute('aria-expanded', String(!setupDeferred));
}

async function saveSetupDeferred(value) {
  setupDeferred = value;
  renderSetup();
  try {
    await chrome.storage.local.set({ setupDeferred: value });
  } catch {
    showStatus('preferenceError', 'err');
  }
}

function showStatus(key, kind, values) {
  currentStatus = { key, values };
  statusEl.textContent = i18n.t(key, values);
  statusEl.className = `status ${kind}`;
  statusEl.classList.remove("hidden");
}

function promptSetup() {
  setupDeferred = false;
  renderSetup();
  bannerEl.classList.remove("flash");
  void bannerEl.offsetWidth;
  bannerEl.classList.add("flash");
  bannerEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

function errorMessage(code) {
  switch (code) {
    case "BLOB_BLOCKED":
      return 'blobBlocked';
    case "SCRIPT_FAILED":
      return 'scriptFailed';
    case "NO_ACTIVE_TAB":
      return 'noActiveTab';
    case "RESTRICTED_PAGE":
      return 'restrictedPage';
    case "CHROME_API_ERROR":
      return 'chromeApiError';
    case "INVALID_SCRIPT":
      return 'invalidScript';
    default:
      return 'executionFailed';
  }
}

function probeMessage(result) {
  if (result?.ok) {
    return 'probePassed';
  }
  switch (result?.error) {
    case 'BLOB_BLOCKED':
      return 'probeBlobBlocked';
    case 'PROBE_NO_SIGNAL':
      return 'probeNoSignal';
    case 'RESTRICTED_PAGE':
      return 'probeRestricted';
    case 'NO_ACTIVE_TAB':
      return 'probeNoTab';
    default:
      return 'probeFailed';
  }
}

async function testThisPage() {
  testPageEl.disabled = true;
  testing = true;
  testPageEl.textContent = i18n.t('testing');
  try {
    const result = await chrome.runtime.sendMessage({ type: 'PROBE_PAGE' });
    showStatus(probeMessage(result), result?.ok ? 'ok' : 'err');
  } catch {
    showStatus(probeMessage(null), 'err');
  } finally {
    testPageEl.disabled = false;
    testing = false;
    testPageEl.textContent = i18n.t('testPage');
  }
}

async function detectUserScripts() {
  try {
    const res = await chrome.runtime.sendMessage({ type: "CHECK_USERSCRIPTS" });
    return !!res?.available;
  } catch {
    return false;
  }
}

async function runScript(code) {
  let res;
  try {
    res = await chrome.runtime.sendMessage({ type: "RUN_SCRIPT", code });
  } catch {
    showStatus(errorMessage("CHROME_API_ERROR"), "err");
    return;
  }
  if (res?.ok) {
    window.close();
  } else {
    if (!userScriptsOk && (res?.error === 'BLOB_BLOCKED' || res?.error === 'SCRIPT_FAILED')) {
      promptSetup();
    }
    showStatus(errorMessage(res?.error), "err", { code: res?.error });
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
    const name = document.createElement("span");
    name.textContent = script.name;
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("width", "18");
    icon.setAttribute("height", "18");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = '<path d="m9 6 7 6-7 6V6Z" fill="currentColor"/>';
    btn.append(name, icon);
    btn.title = i18n.t('runScriptTitle');
    btn.addEventListener("click", () => runScript(script.code));
    li.appendChild(btn);
    listEl.appendChild(li);
  }
}

async function checkUserScripts() {
  userScriptsOk = await detectUserScripts();
  renderSetup();
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
  document.getElementById("recheck-user-scripts").addEventListener("click", checkUserScripts);
  document.getElementById('defer-setup').addEventListener('click', async () => {
    statusEl.classList.add('hidden');
    await saveSetupDeferred(true);
  });
  document.getElementById('expand-setup').addEventListener('click', () => saveSetupDeferred(false));
  testPageEl.addEventListener('click', testThisPage);
  document.querySelectorAll('[data-language]').forEach((button) => {
    button.addEventListener('click', () => i18n.setLanguage(button.dataset.language));
  });
}

async function init() {
  wireNav();
  await i18n.initialize();
  try {
    const saved = await chrome.storage.local.get('setupDeferred');
    setupDeferred = saved.setupDeferred === true;
  } catch {
    setupDeferred = false;
  }
  await checkUserScripts();
  const scripts = await getScripts();
  renderScripts(scripts);
}

init();
