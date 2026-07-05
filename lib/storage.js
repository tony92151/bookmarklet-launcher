const KEY = "scripts";

export async function getScripts() {
  const result = await chrome.storage.local.get(KEY);
  return Array.isArray(result[KEY]) ? result[KEY] : [];
}

async function setScripts(scripts) {
  await chrome.storage.local.set({ [KEY]: scripts });
}

export async function saveScript({ name, code }) {
  const scripts = await getScripts();
  const script = {
    id: crypto.randomUUID(),
    name: String(name || "").trim() || "Unnamed Script",
    code: String(code || ""),
    createdAt: Date.now(),
  };
  scripts.push(script);
  await setScripts(scripts);
  return script;
}

export async function updateScript(id, patch) {
  const scripts = await getScripts();
  const idx = scripts.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  scripts[idx] = { ...scripts[idx], ...patch };
  await setScripts(scripts);
  return scripts[idx];
}

export async function deleteScript(id) {
  const scripts = await getScripts();
  const next = scripts.filter((s) => s.id !== id);
  await setScripts(next);
}
