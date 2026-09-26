import { runBlobScriptInPage } from './page-probe.js';

const RESTRICTED_URL = /^(chrome|edge|about|chrome-extension|devtools):/i;

const errorDetail = (error) => String(error?.message || error);

export function createScriptRunner(chromeApi) {
  async function userScriptsAvailable() {
    try {
      await chromeApi.userScripts.getScripts();
      return true;
    } catch {
      return false;
    }
  }

  return {
    async run(code) {
      try {
        if (typeof code !== 'string' || !code) {
          return { ok: false, error: 'INVALID_SCRIPT' };
        }

        const [tab] = await chromeApi.tabs.query({ active: true, currentWindow: true });
        if (!tab || tab.id == null) {
          return { ok: false, error: 'NO_ACTIVE_TAB' };
        }

        if (tab.url && RESTRICTED_URL.test(tab.url)) {
          return { ok: false, error: 'RESTRICTED_PAGE' };
        }

        if (await userScriptsAvailable()) {
          await chromeApi.userScripts.execute({
            target: { tabId: tab.id },
            world: 'MAIN',
            injectImmediately: true,
            js: [{ code }],
          });
          return { ok: true };
        }

        const results = await chromeApi.scripting.executeScript({
          target: { tabId: tab.id },
          world: 'MAIN',
          func: runBlobScriptInPage,
          args: [code],
        });
        const result = results?.[0]?.result;
        if (result?.ok === true) return { ok: true };
        return { ok: false, error: result?.error || 'CHROME_API_ERROR' };
      } catch (error) {
        return { ok: false, error: 'CHROME_API_ERROR', detail: errorDetail(error) };
      }
    },

    userScriptsAvailable,
  };
}
