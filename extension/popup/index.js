import { getScripts } from "../storage-client.js";

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

function promptSetup() {
  bannerEl.classList.remove("hidden");
  bannerEl.classList.remove("flash");
  void bannerEl.offsetWidth;
  bannerEl.classList.add("flash");
  bannerEl.scrollIntoView({ behavior: "smooth", block: "start" });
  showStatus("Allow user scripts is not enabled. Please set it up first using the instructions below.", "err");
}

function errorMessage(code) {
  switch (code) {
    case "USERSCRIPTS_DISABLED":
      return "Please enable Allow user scripts first.";
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
  const button = document.getElementById('test-this-page');
  button.disabled = true;
  button.textContent = 'Testing…';
  try {
    const result = await chrome.runtime.sendMessage({ type: 'PROBE_PAGE' });
    showStatus(probeMessage(result), result?.ok ? 'ok' : 'err');
  } catch {
    showStatus(probeMessage(null), 'err');
  } finally {
    button.disabled = false;
    button.textContent = 'Test This Page';
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
  if (!userScriptsOk) {
    promptSetup();
    return;
  }

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
  document.getElementById("recheck-user-scripts").addEventListener("click", checkUserScripts);
  document.getElementById('test-this-page').addEventListener('click', testThisPage);
}

async function init() {
  wireNav();
  await checkUserScripts();
  const scripts = await getScripts();
  renderScripts(scripts);
}

init();
