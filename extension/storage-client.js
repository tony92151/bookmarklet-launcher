export async function getScripts() {
  const result = await chrome.storage.local.get('scripts');
  return Array.isArray(result.scripts) ? result.scripts : [];
}

async function mutate(operation, payload) {
  const response = await chrome.runtime.sendMessage({
    type: 'MUTATE_SCRIPTS',
    operation,
    ...payload,
  });
  if (!response?.ok) {
    throw new Error(response?.error || 'Unable to save scripts.');
  }
  return response.value;
}

export const saveScript = (script) => mutate('save', { script });
export const updateScript = (id, patch) => mutate('update', { id, patch });
export const deleteScript = (id) => mutate('delete', { id });
