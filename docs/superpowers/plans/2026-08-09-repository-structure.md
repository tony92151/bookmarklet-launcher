# Repository Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate the extension and static site into clear product directories while sharing one tested ES module for bookmarklet conversion.

**Architecture:** Keep `manifest.json` at the repository root so Chrome can load the whole repository and extension modules can import `shared/bookmarklet.js`. The Pages artifact preserves `site/`, `shared/`, and `bookmarklets/` as sibling directories, so the public site URL is `/site/` and source-relative imports remain unchanged.

**Tech Stack:** Manifest V3, native browser ES modules, Node.js built-in test runner, GitHub Actions Pages.

## Global Constraints

- Chrome 135+ remains the minimum supported browser.
- Do not add a framework, bundler, package manager, or runtime dependency.
- `shared/bookmarklet.js` is the single source of truth for BOM stripping, `javascript:` prefix handling, encoding, and decoding.
- Malformed percent encoding must throw a clear conversion error.
- Pages publishes an artifact containing `site/`, `shared/`, and `bookmarklets/`.

---

### Task 1: Shared bookmarklet module

**Files:**
- Create: `tests/shared/bookmarklet.test.js`
- Create: `shared/bookmarklet.js`
- Delete: `lib/decode.js`
- Delete: `assets/bookmarklet-converter.js`
- Delete: `tests/bookmarklet-converter.test.js`

**Interfaces:**
- Produces: `stripBom(source)`, `stripJavascriptPrefix(value)`, `encodeJavaScript(source)`, `toBookmarkletUrl(source)`, and `decodeBookmarklet(value)` ESM exports.
- Consumes: no runtime dependencies.

- [ ] **Step 1: Write the failing shared-module tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeBookmarklet, toBookmarkletUrl } from '../../shared/bookmarklet.js';

test('toBookmarkletUrl removes a leading BOM and existing prefix', () => {
  assert.equal(toBookmarkletUrl('\uFEFFjavascript:alert(1)'), 'javascript:alert(1)');
});

test('decodeBookmarklet rejects malformed percent encoding', () => {
  assert.throws(() => decodeBookmarklet('javascript:%E0%A4%A'), /Unable to decode bookmarklet/);
});
```

- [ ] **Step 2: Run the test and verify it fails because the module is missing**

Run: `node --experimental-default-type=module --test tests/shared/bookmarklet.test.js`

Expected: `ERR_MODULE_NOT_FOUND` for `shared/bookmarklet.js`.

- [ ] **Step 3: Implement the ESM module**

```js
const JAVASCRIPT_PREFIX = 'javascript:';

export function toBookmarkletUrl(source) {
  return `${JAVASCRIPT_PREFIX}${encodeJavaScript(source)}`;
}

export function decodeBookmarklet(value) {
  try {
    return decodeURIComponent(stripJavascriptPrefix(stripBom(value)));
  } catch (error) {
    throw new Error('Unable to decode bookmarklet: malformed percent encoding.', { cause: error });
  }
}
```

- [ ] **Step 4: Run all shared tests and verify they pass**

Run: `node --experimental-default-type=module --test tests/shared/bookmarklet.test.js`

Expected: all shared conversion tests pass.

- [ ] **Step 5: Commit**

```bash
git add shared/bookmarklet.js tests/shared/bookmarklet.test.js lib/decode.js assets/bookmarklet-converter.js tests/bookmarklet-converter.test.js
git commit -m "refactor: centralize bookmarklet conversion"
```

### Task 2: Move the bookmarklet site and remove post-render encoding

**Files:**
- Create: `site/index.html`
- Create: `site/converter/index.html`
- Create: `site/assets/install.js`
- Create: `site/assets/install.css`
- Create: `site/assets/converter.js`
- Create: `site/assets/converter.css`
- Create: `bookmarklets/catalog.json`
- Create: `bookmarklets/klook-booking-category-label.js`
- Delete: `install.html`, `converter.html`, `assets/install.js`, `assets/install.css`, `assets/install-encoded.js`, `assets/converter.js`, `assets/converter.css`, `bookmarklets.json`, `scripts/klook-booking-category-label.js`

**Interfaces:**
- Consumes: `toBookmarkletUrl` and `decodeBookmarklet` from `../../shared/bookmarklet.js`.
- Produces: site pages whose relative imports and catalog source paths work from the Pages artifact.

- [ ] **Step 1: Write a failing static-site contract test**

```js
test('installation page uses module-based bookmarklet conversion', async () => {
  const page = await readFile('site/index.html', 'utf8');
  const script = await readFile('site/assets/install.js', 'utf8');
  assert.match(page, /type="module"/);
  assert.match(script, /toBookmarkletUrl/);
  assert.doesNotMatch(script, /install-encoded/);
});
```

- [ ] **Step 2: Run the contract test and verify it fails because site files are missing**

Run: `node --experimental-default-type=module --test tests/site/site-structure.test.js`

Expected: `ENOENT` for `site/index.html`.

- [ ] **Step 3: Move the site and update its imports**

```js
import { decodeBookmarklet, toBookmarkletUrl } from '../../shared/bookmarklet.js';

cardState.bookmarkletUrl = toBookmarkletUrl(source);
```

Update the converter to import its functions rather than read
`window.BookmarkletConverter`. Fetch `../bookmarklets/catalog.json`, make
catalog `source` fields begin with `../bookmarklets/`, update page links for
`site/` and `site/converter/`, and delete the observer-based encoder.

- [ ] **Step 4: Run shared and site tests and verify they pass**

Run: `node --experimental-default-type=module --test tests/shared/bookmarklet.test.js tests/site/site-structure.test.js`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add site bookmarklets tests/site install.html converter.html assets bookmarklets.json scripts
git commit -m "refactor: organize static bookmarklet site"
```

### Task 3: Move and simplify the extension

**Files:**
- Create: `extension/background.js`
- Create: `extension/storage.js`
- Create: `extension/popup/index.html`
- Create: `extension/popup/index.js`
- Create: `extension/popup/styles.css`
- Create: `extension/options/index.html`
- Create: `extension/options/index.js`
- Create: `extension/options/styles.css`
- Modify: `manifest.json`
- Delete: `background.js`, `popup.html`, `popup.js`, `popup.css`, `options.html`, `options.js`, `options.css`, `lib/storage.js`

**Interfaces:**
- Popup sends `{ type: 'CHECK_USERSCRIPTS' }` and `{ type: 'RUN_SCRIPT', code }` messages.
- Background owns all calls to `chrome.userScripts`, `chrome.tabs.query`, and `chrome.userScripts.execute`.
- Options imports `decodeBookmarklet` from `../../shared/bookmarklet.js`.

- [ ] **Step 1: Write a failing manifest contract test**

```js
test('manifest points to grouped extension entry points', async () => {
  const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
  assert.equal(manifest.background.service_worker, 'extension/background.js');
  assert.equal(manifest.action.default_popup, 'extension/popup/index.html');
  assert.equal(manifest.options_page, 'extension/options/index.html');
});
```

- [ ] **Step 2: Run the test and verify it fails against the old manifest**

Run: `node --experimental-default-type=module --test tests/extension/manifest.test.js`

Expected: assertion failure showing the former root-level paths.

- [ ] **Step 3: Move the extension files and centralize execution**

```js
async function runScript(code) {
  if (!(await userScriptsAvailable())) return { ok: false, error: 'USERSCRIPTS_DISABLED' };
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  // validate tab and restricted schemes, then chrome.userScripts.execute
}
```

Change the popup to always message the background rather than executing scripts
itself. Adjust relative ESM imports and HTML CSS/script URLs after the move.

- [ ] **Step 4: Run all Node tests and verify they pass**

Run: `node --experimental-default-type=module --test`

Expected: all shared, site, and extension contract tests pass.

- [ ] **Step 5: Commit**

```bash
git add manifest.json extension tests/extension background.js popup.html popup.js popup.css options.html options.js options.css lib/storage.js
git commit -m "refactor: group extension modules"
```

### Task 4: Add Pages artifact deployment and repository documentation

**Files:**
- Create: `.github/workflows/deploy-pages.yml`
- Create: `fixtures/c1_hotel_reward.txt`
- Create: `fixtures/c1_trip_example.txt`
- Create: `fixtures/c1_trip_example_maxpages1000.txt`
- Modify: `README.md`
- Delete: `c1_hotel_reward.txt`, `c1_trip_example.txt`, `c1_trip_example_maxpages1000.txt`

**Interfaces:**
- Pages artifact contains `site/`, `shared/`, and `bookmarklets/` as sibling directories; GitHub Pages serves the site entry at `/site/`.
- README tells developers to load the repository root as the unpacked extension and explains the Pages workflow.

- [ ] **Step 1: Write a failing workflow contract test**

```js
test('Pages workflow publishes the site, shared module, and catalog', async () => {
  const workflow = await readFile('.github/workflows/deploy-pages.yml', 'utf8');
  assert.match(workflow, /site/);
  assert.match(workflow, /shared/);
  assert.match(workflow, /bookmarklets/);
});
```

- [ ] **Step 2: Run the contract test and verify it fails because the workflow is missing**

Run: `node --experimental-default-type=module --test tests/site/pages-workflow.test.js`

Expected: `ENOENT` for `.github/workflows/deploy-pages.yml`.

- [ ] **Step 3: Implement Pages deployment and move fixtures**

The workflow uses `actions/configure-pages`, copies the three source
directories into one `dist/` directory, uploads it with
`actions/upload-pages-artifact`, and deploys it with
`actions/deploy-pages`. Update README structure, extension installation, site
paths, testing command, and Pages deployment notes.

- [ ] **Step 4: Run all tests and syntax checks**

Run: `node --experimental-default-type=module --test && python3 -m json.tool manifest.json >/dev/null`

Expected: all tests pass and the manifest is valid JSON.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy-pages.yml README.md fixtures tests/site c1_hotel_reward.txt c1_trip_example.txt c1_trip_example_maxpages1000.txt
git commit -m "ci: deploy bookmarklet site to Pages"
```
