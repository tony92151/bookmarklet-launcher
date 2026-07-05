chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "CHECK_USERSCRIPTS") {
    userScriptsAvailable().then((available) => sendResponse({ available }));
    return true;
  }

  if (msg?.type === "RUN_SCRIPT") {
    runScript(msg.code).then(sendResponse);
    return true;
  }

  return false;
});

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
