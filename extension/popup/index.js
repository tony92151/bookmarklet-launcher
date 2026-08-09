import { getScripts } from "../storage.js";

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
    default:
      return `Execution failed: ${code}`;
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
}

async function init() {
  wireNav();
  await checkUserScripts();
  const scripts = await getScripts();
  renderScripts(scripts);
}

init();
