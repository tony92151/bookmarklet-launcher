import { normalizeScriptInput } from '../shared/bookmarklet.js';

export function prepareScriptSubmission({ name, code, mode }) {
  const normalizedCode = normalizeScriptInput(String(code || '').trim(), mode).trim();
  if (!normalizedCode) throw new Error('Code cannot be empty.');

  return {
    name: String(name || '').trim(),
    code: normalizedCode,
    successMessage: mode === 'encoded-bookmarklet' ? 'Decoded bookmarklet and saved.' : 'Saved.',
  };
}
