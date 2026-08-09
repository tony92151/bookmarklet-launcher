# Script Input Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the script editor explicitly save raw JavaScript or decode URL-encoded bookmarklets.

**Architecture:** Add a pure input-normalization helper in the shared bookmarklet module. The options form owns mode selection and passes its selected mode to that helper before using the unchanged storage API, so stored script code remains canonical raw JavaScript.

**Tech Stack:** Manifest V3, browser-native HTML/JavaScript, Node.js built-in test runner.

## Global Constraints

- Raw JavaScript is the default and must preserve literal `%` characters.
- URL-encoded bookmarklet mode strips a leading `javascript:` prefix then URI-decodes source.
- Saved scripts always contain executable raw JavaScript; no data migration or original-input preservation.
- Editing an existing script resets the mode to Raw JavaScript.
- No input-mode auto-detection, runtime execution changes, or new permissions.

---

### Task 1: Mode-aware script normalization

**Files:**
- Modify: `shared/bookmarklet.js`
- Modify: `tests/shared/bookmarklet.test.js`

**Interfaces:**
- Produces: `normalizeScriptInput(value, mode)` where `mode` is `'raw'` or `'encoded-bookmarklet'`.
- Consumes: existing `stripBom`, `stripJavascriptPrefix`, and `decodeBookmarklet` helpers.
- Used by: `extension/options/index.js` in Task 2.

- [ ] **Step 1: Write the failing tests**

```js
import { normalizeScriptInput } from '../../shared/bookmarklet.js';

test('normalizeScriptInput preserves percent characters in raw JavaScript', () => {
  assert.equal(
    normalizeScriptInput("const width = '100%';", 'raw'),
    "const width = '100%';",
  );
});

test('normalizeScriptInput decodes an encoded bookmarklet only when selected', () => {
  assert.equal(
    normalizeScriptInput('javascript:alert(%27hello%20world%27)', 'encoded-bookmarklet'),
    "alert('hello world')",
  );
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --experimental-default-type=module --test tests/shared/bookmarklet.test.js`

Expected: FAIL because `normalizeScriptInput` is not exported.

- [ ] **Step 3: Write the minimal implementation**

```js
export const normalizeScriptInput = (value, mode) => {
  const source = stripBom(value);
  return mode === 'encoded-bookmarklet' ? decodeBookmarklet(source) : source;
};
```

Keep `decodeBookmarklet` unchanged so malformed encoded source keeps its current specific error.

- [ ] **Step 4: Run focused and full tests**

Run: `node --experimental-default-type=module --test tests/shared/bookmarklet.test.js && node --experimental-default-type=module --test`

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add shared/bookmarklet.js tests/shared/bookmarklet.test.js
git commit -m "feat: normalize scripts by selected input mode"
```

### Task 2: Explicit input mode controls in the options editor

**Files:**
- Modify: `extension/options/index.html`
- Modify: `extension/options/index.js`
- Modify: `tests/extension/release-copy.test.js`

**Interfaces:**
- Consumes: `normalizeScriptInput(value, mode)` from `shared/bookmarklet.js`.
- Produces: radio controls named `input-mode`, values `raw` and `encoded-bookmarklet`, and mode-aware save/update behavior.

- [ ] **Step 1: Write the failing UI contract test**

```js
test('options editor provides explicit raw and encoded bookmarklet modes', async () => {
  const options = await readFile('extension/options/index.html', 'utf8');
  const script = await readFile('extension/options/index.js', 'utf8');

  assert.match(options, /name="input-mode" value="raw"[^>]*checked/);
  assert.match(options, /name="input-mode" value="encoded-bookmarklet"/);
  assert.match(script, /normalizeScriptInput/);
  assert.match(script, /inputMode/);
});
```

- [ ] **Step 2: Run the UI contract test to verify it fails**

Run: `node --experimental-default-type=module --test tests/extension/release-copy.test.js`

Expected: FAIL because no mode controls or normalization call exists.

- [ ] **Step 3: Write the minimal editor implementation**

```html
<fieldset id="input-mode">
  <legend>Input format</legend>
  <label><input type="radio" name="input-mode" value="raw" checked /> Raw JavaScript</label>
  <label><input type="radio" name="input-mode" value="encoded-bookmarklet" /> URL-encoded bookmarklet</label>
</fieldset>
```

```js
const inputMode = () => document.querySelector('input[name="input-mode"]:checked').value;
const resetInputMode = () => {
  document.querySelector('input[name="input-mode"][value="raw"]').checked = true;
};
```

Use `normalizeScriptInput(codeInput.value.trim(), inputMode()).trim()` during submit. Call `resetInputMode()` in both `enterEditMode` and `exitEditMode`. Update helper text so it does not claim automatic decoding.

- [ ] **Step 4: Run focused and full tests**

Run: `node --experimental-default-type=module --test tests/extension/release-copy.test.js && node --experimental-default-type=module --test`

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add extension/options/index.html extension/options/index.js tests/extension/release-copy.test.js
git commit -m "feat: let users choose script input mode"
```

### Task 3: Final behavior verification

**Files:**
- Test: `tests/shared/bookmarklet.test.js`
- Test: `tests/extension/release-copy.test.js`

**Interfaces:**
- Consumes: completed normalization helper and options editor controls.
- Produces: release-ready evidence that raw percent signs and encoded bookmarklets remain supported.

- [ ] **Step 1: Add malformed encoded-input regression test**

```js
test('normalizeScriptInput rejects malformed input only in encoded bookmarklet mode', () => {
  assert.equal(normalizeScriptInput('100%', 'raw'), '100%');
  assert.throws(
    () => normalizeScriptInput('javascript:%E0%A4%A', 'encoded-bookmarklet'),
    /Unable to decode bookmarklet: malformed percent encoding/,
  );
});
```

- [ ] **Step 2: Run test to verify it fails before implementation from Task 1 is present**

Run: `node --experimental-default-type=module --test tests/shared/bookmarklet.test.js`

Expected: the new test is red if the helper does not distinguish modes; otherwise it remains green because Task 1 already established behavior.

- [ ] **Step 3: Run all final verification commands**

Run: `node --experimental-default-type=module --test && node scripts/package-extension.mjs && unzip -t dist/bookmarklet-script-manager.zip`

Expected: all tests PASS and archive integrity reports no errors.

- [ ] **Step 4: Commit any final regression-only changes**

```bash
git add tests/shared/bookmarklet.test.js
git commit -m "test: cover raw percent script input"
```
