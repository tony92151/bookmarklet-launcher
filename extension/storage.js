const KEY = 'scripts';

let mutationQueue = Promise.resolve();

export function resetScriptStorageForTests() {
  mutationQueue = Promise.resolve();
}

function normalizeScript(value) {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.id !== 'string' || !value.id || typeof value.code !== 'string') return null;

  return {
    id: value.id,
    name: typeof value.name === 'string' && value.name.trim() ? value.name.trim() : 'Unnamed Script',
    code: value.code,
    createdAt: Number.isFinite(value.createdAt) ? value.createdAt : Date.now(),
  };
}

export async function getScripts() {
  const result = await chrome.storage.local.get(KEY);
  if (!Array.isArray(result[KEY])) return [];
  return result[KEY].map(normalizeScript).filter(Boolean);
}

function mutateScripts(mutator) {
  const operation = mutationQueue.then(async () => {
    const scripts = await getScripts();
    const result = await mutator(scripts);
    if (result.shouldWrite) await chrome.storage.local.set({ [KEY]: result.scripts });
    return result.value;
  });
  mutationQueue = operation.catch(() => {});
  return operation;
}

export function saveScript({ name, code }) {
  const entryName = String(name || '').trim() || 'Unnamed Script';
  const entryCode = String(code || '');
  return mutateScripts((scripts) => {
    const script = {
      id: crypto.randomUUID(),
      name: entryName,
      code: entryCode,
      createdAt: Date.now(),
    };
    return { shouldWrite: true, scripts: [...scripts, script], value: script };
  });
}

export function updateScript(id, { name, code }) {
  return mutateScripts((scripts) => {
    const index = scripts.findIndex((script) => script.id === id);
    if (index === -1) return { shouldWrite: false, value: null };

    const script = {
      ...scripts[index],
      name: String(name || '').trim() || 'Unnamed Script',
      code: String(code || ''),
    };
    const next = [...scripts];
    next[index] = script;
    return { shouldWrite: true, scripts: next, value: script };
  });
}

export function deleteScript(id) {
  return mutateScripts((scripts) => {
    const next = scripts.filter((script) => script.id !== id);
    return { shouldWrite: next.length !== scripts.length, scripts: next, value: undefined };
  });
}
