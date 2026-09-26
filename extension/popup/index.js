import { getScripts } from "../storage-client.js";

const listEl = document.getElementById("script-list");
const emptyEl = document.getElementById("empty");
const bannerEl = document.getElementById("setup-banner");
const statusEl = document.getElementById("status");
const testPageEl = document.getElementById('test-this-page');

let userScriptsOk = false;
let setupDeferred = false;

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
    showStatus('Could not save this preference. It may reset when you reopen the popup.', 'err');
  }
}

function showStatus(text, kind) {
  statusEl.textContent = text;
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
      return "This page blocked the alternate script method. Enable Allow user scripts and try again.";
    case "SCRIPT_FAILED":
      return "The alternate method could not run this script. Check the script or enable Allow user scripts.";
    case "NO_ACTIVE_TAB":
      return "No active tab found.";
    case "RESTRICTED_PAGE":
      return "Cannot execute on this page (restricted pages like chrome://).";
    case "CHROME_API_ERROR":
      return "Chrome could not execute the script. Try reloading the page and extension.";
    case "INVALID_SCRIPT":
      return "The saved script is invalid.";
    default:
      return `Execution failed: ${code}`;
  }
}

function probeMessage(result) {
  if (result?.ok) {
    return 'Basic test passed on this page. Some bookmarklets may still fail.';
  }
  switch (result?.error) {
    case 'BLOB_BLOCKED':
      return 'This page blocked the test script. Its security settings may prevent this method.';
    case 'PROBE_NO_SIGNAL':
      return 'The test script did not run on this page.';
    case 'RESTRICTED_PAGE':
      return 'This browser page does not allow extensions to run scripts.';
    case 'NO_ACTIVE_TAB':
      return 'No active tab found to test.';
    default:
      return 'Could not test this page. Try a regular website.';
  }
}

async function testThisPage() {
  testPageEl.disabled = true;
  testPageEl.textContent = 'Testing…';
  try {
    const result = await chrome.runtime.sendMessage({ type: 'PROBE_PAGE' });
    showStatus(probeMessage(result), result?.ok ? 'ok' : 'err');
  } catch {
    showStatus(probeMessage(null), 'err');
  } finally {
    testPageEl.disabled = false;
    testPageEl.textContent = 'Test this page';
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
    const name = document.createElement("span");
    name.textContent = script.name;
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("width", "18");
    icon.setAttribute("height", "18");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = '<path d="m9 6 7 6-7 6V6Z" fill="currentColor"/>';
    btn.append(name, icon);
    btn.title = "Click to execute in current tab";
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
}

async function init() {
  wireNav();
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
