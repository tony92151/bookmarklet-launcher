import { createScriptRunner } from './script-runner.js';
import { deleteScript, saveScript, updateScript } from './storage.js';

const runner = createScriptRunner(chrome);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (sender.id && sender.id !== chrome.runtime.id) return false;

  if (msg?.type === 'CHECK_USERSCRIPTS') {
    runner.userScriptsAvailable()
      .then((available) => sendResponse({ available }))
      .catch(() => sendResponse({ available: false }));
    return true;
  }

  if (msg?.type === 'RUN_SCRIPT') {
    runner.run(msg.code)
      .then(sendResponse)
      .catch(() => sendResponse({ ok: false, error: 'CHROME_API_ERROR' }));
    return true;
  }

  if (msg?.type === 'MUTATE_SCRIPTS') {
    mutateScripts(msg)
      .then((value) => sendResponse({ ok: true, value }))
      .catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
    return true;
  }

  return false;
});

async function mutateScripts({ operation, script, id, patch }) {
  switch (operation) {
    case 'save':
      return saveScript(script || {});
    case 'update':
      return updateScript(id, patch || {});
    case 'delete':
      return deleteScript(id);
    default:
      throw new Error('Unknown script storage operation.');
  }
}
