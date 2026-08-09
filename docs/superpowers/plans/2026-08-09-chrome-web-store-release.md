# Chrome Web Store Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Bookmarklet Script Manager ready for a truthful, reviewable Chrome Web Store test release.

**Architecture:** Keep runtime behavior local and package only the extension runtime folders. Add static policy and release-document artifacts beside the existing Pages site, while popup and options copy provide the same safety and permission disclosures users see in the listing.

**Tech Stack:** Manifest V3, browser-native HTML/CSS/JavaScript, Node.js built-in test runner, GitHub Pages.

## Global Constraints

- Support Chrome 135+ only.
- No sign-in, synchronization, analytics, advertising, cloud backup, or remote service communication.
- Scripts run only after an explicit popup click and only in the active tab.
- Do not include built-in scripts or claim that they exist.
- Retain only `userScripts`, `storage`, and `activeTab` permissions.
- User-facing safety and privacy information must exist in English and Traditional Chinese.
- The release ZIP contains only `manifest.json`, `extension/`, `shared/`, and `icons/`, with manifest at its root.

---

### Task 1: Product identity and safety onboarding

**Files:**
- Modify: `manifest.json`
- Modify: `extension/popup/index.html`
- Modify: `extension/popup/index.js`
- Modify: `extension/options/index.html`
- Modify: `extension/options/index.js`
- Test: `tests/extension/release-copy.test.js`

**Interfaces:**
- Consumes: Chrome `CHECK_USERSCRIPTS` message from `extension/background.js`.
- Produces: visible product title, risk disclosure, User Scripts recheck action, and privacy-policy link in the extension UI.

- [ ] **Step 1: Write the failing test**

```js
test('extension UI identifies the product and links its safety disclosures', async () => {
  const popup = await readFile('extension/popup/index.html', 'utf8');
  const options = await readFile('extension/options/index.html', 'utf8');
  const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));

  assert.equal(manifest.name, 'Bookmarklet Script Manager');
  assert.match(popup, /only run scripts you trust/i);
  assert.match(popup, /id="recheck-user-scripts"/);
  assert.match(options, /privacy\.html/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-default-type=module --test tests/extension/release-copy.test.js`

Expected: FAIL because the old product name and required disclosure controls are absent.

- [ ] **Step 3: Write minimal implementation**

```html
<p class="banner-hint">Custom scripts can read and change this page. Only run scripts you trust.</p>
<button id="recheck-user-scripts" class="link-btn">I've enabled it — recheck</button>
<a href="../../site/privacy.html" target="_blank" rel="noreferrer">Privacy</a>
```

```js
document.getElementById('recheck-user-scripts').addEventListener('click', checkUserScripts);
```

Update manifest and all visible extension titles to `Bookmarklet Script Manager`; add the corresponding Traditional Chinese disclosure alongside English text.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-default-type=module --test tests/extension/release-copy.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add manifest.json extension tests/extension/release-copy.test.js
git commit -m "feat: add release safety onboarding"
```

### Task 2: Hosted privacy policy and support information

**Files:**
- Create: `site/privacy.html`
- Create: `site/assets/privacy.css`
- Modify: `site/index.html`
- Test: `tests/site/privacy-policy.test.js`

**Interfaces:**
- Consumes: GitHub Pages deployment path established by `.github/workflows/deploy-pages.yml`.
- Produces: `/site/privacy.html` that the Chrome Web Store Privacy Policy field and extension UI can link to.

- [ ] **Step 1: Write the failing test**

```js
test('privacy policy discloses local storage, no transfer, permissions, and support', async () => {
  const policy = await readFile('site/privacy.html', 'utf8');
  for (const phrase of ['chrome.storage.local', 'not sent', 'activeTab', 'storage', 'userScripts', 'GitHub Issues']) {
    assert.match(policy, new RegExp(phrase, 'i'));
  }
  assert.match(policy, /自訂指令碼/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-default-type=module --test tests/site/privacy-policy.test.js`

Expected: FAIL because `site/privacy.html` does not exist.

- [ ] **Step 3: Write minimal implementation**

```html
<h1>Privacy Policy / 隱私權政策</h1>
<p>Script names and source are stored only in <code>chrome.storage.local</code>.</p>
<p>The extension does not send scripts, page content, or browsing data to us or third parties.</p>
<p>Custom scripts are chosen by you and may read or modify the page where you run them.</p>
```

Use a local stylesheet. Describe each permission, link to the repository's GitHub Issues page, add a privacy link to the site footer, and duplicate all essential statements in Traditional Chinese.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-default-type=module --test tests/site/privacy-policy.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add site tests/site/privacy-policy.test.js
git commit -m "docs: publish extension privacy policy"
```

### Task 3: Reproducible minimal release package

**Files:**
- Create: `scripts/package-extension.mjs`
- Create: `docs/chrome-web-store-release-checklist.md`
- Modify: `.gitignore`
- Test: `tests/extension/package-extension.test.js`

**Interfaces:**
- Consumes: root `manifest.json` and the `extension/`, `shared/`, and `icons/` directories.
- Produces: `dist/bookmarklet-script-manager.zip`, without putting `dist/` under version control.

- [ ] **Step 1: Write the failing test**

```js
test('release packager defines a strict extension-file allowlist', async () => {
  const source = await readFile('scripts/package-extension.mjs', 'utf8');
  assert.match(source, /manifest\.json/);
  assert.match(source, /['"]extension['"]/);
  assert.match(source, /['"]shared['"]/);
  assert.match(source, /['"]icons['"]/);
  assert.doesNotMatch(source, /site\/|fixtures\/|docs\//);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-default-type=module --test tests/extension/package-extension.test.js`

Expected: FAIL because the packaging script does not exist.

- [ ] **Step 3: Write minimal implementation**

```js
const RELEASE_PATHS = ['manifest.json', 'extension', 'shared', 'icons'];
```

Use Node's `child_process` to create `dist/bookmarklet-script-manager.zip` with each listed path at the archive root. Fail if `manifest.json` is missing. The checklist must include clean-profile manual checks, asset dimensions, Chrome 135+ scope, privacy field, GitHub Issues support URL, and test-release distribution.

- [ ] **Step 4: Run tests to verify it passes and produces a ZIP**

Run: `node --experimental-default-type=module --test tests/extension/package-extension.test.js && node scripts/package-extension.mjs && unzip -l dist/bookmarklet-script-manager.zip`

Expected: PASS; archive contains only the four allowlisted roots.

- [ ] **Step 5: Commit**

```bash
git add scripts docs/chrome-web-store-release-checklist.md .gitignore tests/extension/package-extension.test.js
git commit -m "build: add web store release package"
```

### Task 4: Final release verification

**Files:**
- Modify: `README.md`
- Test: all files under `tests/`

**Interfaces:**
- Consumes: completed UI, policy, package script, and release checklist.
- Produces: accurate maintainer instructions for a Chrome-only test release.

- [ ] **Step 1: Write the failing documentation-contract test**

```js
test('README documents Chrome-only support and the release package command', async () => {
  const readme = await readFile('README.md', 'utf8');
  assert.match(readme, /Chrome 135\+/);
  assert.doesNotMatch(readme, /Chrome\/Edge extension/);
  assert.match(readme, /node scripts\/package-extension\.mjs/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-default-type=module --test tests/extension/release-copy.test.js`

Expected: FAIL because the README still claims Edge support and omits the packager.

- [ ] **Step 3: Write minimal implementation**

```md
## Chrome Web Store test release

Create the submission archive with:

```sh
node scripts/package-extension.mjs
```
```

Update all product naming and support statements to match the shipped extension, and link the privacy policy and release checklist.

- [ ] **Step 4: Run all automated checks**

Run: `node --experimental-default-type=module --test && node scripts/package-extension.mjs && unzip -t dist/bookmarklet-script-manager.zip`

Expected: all tests PASS and `unzip` reports no archive errors.

- [ ] **Step 5: Commit**

```bash
git add README.md tests/extension/release-copy.test.js
git commit -m "docs: document Chrome Web Store release"
```
