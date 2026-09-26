import assert from 'node:assert/strict';
import test from 'node:test';
import { prepareScriptSubmission } from '../../extension/script-submission.js';

test('prepared encoded bookmarklet keeps its decoded success message after form reset', () => {
  assert.deepEqual(
    prepareScriptSubmission({
      name: 'Example',
      code: 'javascript:alert(%27hello%27)',
      mode: 'encoded-bookmarklet',
    }),
    {
      name: 'Example',
      code: "alert('hello')",
      successMessage: 'Decoded bookmarklet and saved.',
    },
  );
});

test('prepared raw JavaScript preserves percent characters', () => {
  assert.deepEqual(
    prepareScriptSubmission({ name: 'Width', code: "const width = '100%';", mode: 'raw' }),
    {
      name: 'Width',
      code: "const width = '100%';",
      successMessage: 'Saved.',
    },
  );
});
