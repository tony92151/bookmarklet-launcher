const RESTRICTED_URL = /^(chrome|edge|about|chrome-extension|devtools):/i;

// This function is serialized by chrome.scripting.executeScript, so it must be self-contained.
export function runBlobProbeInPage() {
  const eventName = `bookmarklet-script-probe-${Math.random().toString(36).slice(2)}`;
  const script = document.createElement('script');
  const blob = new Blob([`document.dispatchEvent(new Event(${JSON.stringify(eventName)}));`], {
    type: 'application/javascript',
  });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve) => {
    let settled = false;
    let timer;
    const onProof = () => finish({ ok: true });

    function finish(result) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      document.removeEventListener(eventName, onProof);
      script.remove();
      URL.revokeObjectURL(url);
      resolve(result);
    }

    document.addEventListener(eventName, onProof);
    script.onerror = () => finish({ ok: false, error: 'BLOB_BLOCKED' });
    script.onload = () => finish({ ok: false, error: 'PROBE_NO_SIGNAL' });
    timer = setTimeout(() => finish({ ok: false, error: 'PROBE_NO_SIGNAL' }), 2000);

    try {
      script.src = url;
      (document.head || document.documentElement).appendChild(script);
    } catch {
      finish({ ok: false, error: 'BLOB_BLOCKED' });
    }
  });
}

// The saved code runs as a page Blob script, never inside an extension context.
// Like the probe, this function must not reference variables outside its body.
export function runBlobScriptInPage(code) {
  const successEvent = `bookmarklet-script-ran-${Math.random().toString(36).slice(2)}`;
  const failureEvent = `${successEvent}-error`;
  const source = `try { (function(){\n${code}\n})(); document.dispatchEvent(new Event(${JSON.stringify(successEvent)})); } catch (error) { document.dispatchEvent(new Event(${JSON.stringify(failureEvent)})); }`;
  const script = document.createElement('script');
  const url = URL.createObjectURL(new Blob([source], { type: 'application/javascript' }));

  return new Promise((resolve) => {
    let settled = false;
    let timer;
    const onSuccess = () => finish({ ok: true });
    const onFailure = () => finish({ ok: false, error: 'SCRIPT_FAILED' });

    function finish(result) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      document.removeEventListener(successEvent, onSuccess);
      document.removeEventListener(failureEvent, onFailure);
      script.remove();
      URL.revokeObjectURL(url);
      resolve(result);
    }

    document.addEventListener(successEvent, onSuccess);
    document.addEventListener(failureEvent, onFailure);
    script.onerror = () => finish({ ok: false, error: 'BLOB_BLOCKED' });
    script.onload = () => finish({ ok: false, error: 'SCRIPT_FAILED' });
    timer = setTimeout(() => finish({ ok: false, error: 'SCRIPT_FAILED' }), 2000);

    try {
      script.src = url;
      (document.head || document.documentElement).appendChild(script);
    } catch {
      finish({ ok: false, error: 'BLOB_BLOCKED' });
    }
  });
}

export function createPageProbe(chromeApi) {
  return {
    async probe() {
      let tab;
      try {
        [tab] = await chromeApi.tabs.query({ active: true, currentWindow: true });
      } catch {
        return { ok: false, error: 'INJECTION_FAILED' };
      }
      if (tab?.id == null) return { ok: false, error: 'NO_ACTIVE_TAB' };
      if (tab.url && RESTRICTED_URL.test(tab.url)) {
        return { ok: false, error: 'RESTRICTED_PAGE' };
      }

      try {
        const results = await chromeApi.scripting.executeScript({
          target: { tabId: tab.id },
          world: 'MAIN',
          func: runBlobProbeInPage,
        });
        const result = results?.[0]?.result;
        if (result?.ok === true) return { ok: true };
        if (result?.error === 'BLOB_BLOCKED' || result?.error === 'PROBE_NO_SIGNAL') {
          return { ok: false, error: result.error };
        }
      } catch {
        // Browser-managed pages and pages without access can reject injection.
      }
      return { ok: false, error: 'INJECTION_FAILED' };
    },
  };
}
