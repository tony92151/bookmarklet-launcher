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
        if (!(await userScriptsAvailable())) {
          return { ok: false, error: 'USERSCRIPTS_DISABLED' };
        }

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

        await chromeApi.userScripts.execute({
          target: { tabId: tab.id },
          world: 'MAIN',
          injectImmediately: true,
          js: [{ code }],
        });
        return { ok: true };
      } catch (error) {
        return { ok: false, error: 'CHROME_API_ERROR', detail: errorDetail(error) };
      }
    },

    userScriptsAvailable,
  };
}
