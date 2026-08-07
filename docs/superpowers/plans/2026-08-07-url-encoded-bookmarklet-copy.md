# URL-Encoded Bookmarklet Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a browser-only JavaScript URL encoding converter and make the GitHub Pages copy/install controls generate fully percent-encoded `javascript:` bookmarklet URLs.

**Architecture:** Introduce one shared browser utility in `assets/bookmarklet-converter.js` that owns source normalization, percent encoding, bookmarklet URL creation, and decoding. Both the standalone converter page and the existing installation page consume this utility so they cannot drift into different output formats.

**Tech Stack:** HTML5, CSS, vanilla JavaScript, GitHub Pages, Node.js built-in test runner for pure utility tests

## Global Constraints

- No framework, package manager, build step, analytics, third-party JavaScript, remote fonts, or external API.
- All conversion happens locally in the browser.
- Output format is `javascript:` followed by the complete JavaScript source encoded with `encodeURIComponent`.
- Remove only a leading UTF-8 BOM; do not minify, strip comments, collapse whitespace, or otherwise rewrite JavaScript.
- Do not encode the literal `javascript:` prefix.
- The standalone converter must support encode, decode, copy, clear, and visible error messages.
- The existing install page must keep drag and right-click installation working with a real encoded `javascript:` href.
- English and Traditional Chinese labels must remain supported on the installation page.
- Clipboard failure must continue to open the manual-copy dialog.

---

### Task 1: Add the shared converter utility with tests

**Files:**
- Create: `assets/bookmarklet-converter.js`
- Create: `tests/bookmarklet-converter.test.js`

**Interfaces:**
- Consumes: Plain JavaScript source strings or encoded bookmarklet strings.
- Produces: Global `window.BookmarkletConverter` in browsers and CommonJS exports in Node with `stripBom(source)`, `encodeJavaScript(source)`, `toBookmarkletUrl(source)`, and `decodeBookmarklet(value)`.

- [ ] **Step 1: Write failing tests for the public API**

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const converter = require('../assets/bookmarklet-converter.js');

test('stripBom removes only one leading UTF-8 BOM', () => {
  assert.equal(converter.stripBom('\uFEFFalert(1)'), 'alert(1)');
  assert.equal(converter.stripBom(' alert(1)'), ' alert(1)');
});

test('toBookmarkletUrl fully percent-encodes JavaScript but preserves the prefix', () => {
  assert.equal(
    converter.toBookmarkletUrl("alert('hello world')"),
    "javascript:alert('hello%20world')"
  );
});

test('toBookmarkletUrl does not duplicate an existing javascript prefix', () => {
  assert.equal(
    converter.toBookmarkletUrl('javascript:alert(1)'),
    'javascript:alert(1)'
  );
});

test('decodeBookmarklet decodes encoded bookmarklet content and removes the prefix', () => {
  assert.equal(
    converter.decodeBookmarklet('javascript:alert(%27hello%20world%27)'),
    "alert('hello world')"
  );
});

test('decodeBookmarklet throws a clear error for malformed percent encoding', () => {
  assert.throws(
    () => converter.decodeBookmarklet('javascript:%E0%A4%A'),
    /Unable to decode bookmarklet/
  );
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
node --test tests/bookmarklet-converter.test.js
```

Expected: FAIL because `assets/bookmarklet-converter.js` does not exist.

- [ ] **Step 3: Implement the shared utility**

```javascript
(function (root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.BookmarkletConverter = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, () => {
  'use strict';

  const JAVASCRIPT_PREFIX = 'javascript:';

  const stripBom = (source) => String(source ?? '').replace(/^\uFEFF/, '');

  const stripJavascriptPrefix = (value) => {
    const text = String(value ?? '');
    return text.slice(0, JAVASCRIPT_PREFIX.length).toLowerCase() === JAVASCRIPT_PREFIX
      ? text.slice(JAVASCRIPT_PREFIX.length)
      : text;
  };

  const encodeJavaScript = (source) => encodeURIComponent(
    stripBom(stripJavascriptPrefix(source))
  );

  const toBookmarkletUrl = (source) => `${JAVASCRIPT_PREFIX}${encodeJavaScript(source)}`;

  const decodeBookmarklet = (value) => {
    try {
      return decodeURIComponent(stripJavascriptPrefix(stripBom(value)));
    } catch (error) {
      throw new Error('Unable to decode bookmarklet: malformed percent encoding.', { cause: error });
    }
  };

  return {
    stripBom,
    encodeJavaScript,
    toBookmarkletUrl,
    decodeBookmarklet
  };
});
```

- [ ] **Step 4: Run tests and verify they pass**

Run:

```bash
node --test tests/bookmarklet-converter.test.js
```

Expected: all tests PASS.

- [ ] **Step 5: Commit the shared utility**

```bash
git add assets/bookmarklet-converter.js tests/bookmarklet-converter.test.js
git commit -m "feat: add bookmarklet URL converter"
```

---

### Task 2: Add the standalone converter page

**Files:**
- Create: `converter.html`
- Create: `assets/converter.js`
- Modify: `assets/install.css`

**Interfaces:**
- Consumes: `window.BookmarkletConverter.toBookmarkletUrl()` and `window.BookmarkletConverter.decodeBookmarklet()`.
- Produces: A static browser page with `#converter-input`, `#converter-output`, `#encode-button`, `#decode-button`, `#copy-output-button`, `#clear-button`, and `#converter-status`.

- [ ] **Step 1: Create the converter page markup**

Create `converter.html` with this structure:

```html
<!doctype html>
<html lang="zh-TW">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Convert JavaScript to and from a URL-encoded bookmarklet.">
  <title>Bookmarklet URL Encoding Converter</title>
  <link rel="stylesheet" href="assets/install.css">
  <script src="assets/bookmarklet-converter.js" defer></script>
  <script src="assets/converter.js" defer></script>
</head>
<body>
  <header class="site-header">
    <a class="brand" href="install.html">
      <span class="brand-mark" aria-hidden="true">{ }</span>
      <span>Bookmarklet Launcher</span>
    </a>
    <nav class="header-actions" aria-label="Site navigation">
      <a href="install.html">Bookmarklets</a>
      <a href="https://github.com/tony92151/bookmarklet-launcher" target="_blank" rel="noopener noreferrer">GitHub</a>
    </nav>
  </header>

  <main class="converter-page">
    <section class="converter-card" aria-labelledby="converter-title">
      <p class="eyebrow">Local browser tool</p>
      <h1 id="converter-title">URL Encoding Converter</h1>
      <p class="hero-copy">Paste JavaScript or an encoded bookmarklet. Nothing is uploaded.</p>

      <label for="converter-input">Input</label>
      <textarea id="converter-input" rows="12" spellcheck="false" placeholder="Paste JavaScript or javascript:%28... here"></textarea>

      <div class="converter-actions">
        <button id="encode-button" type="button" class="primary-button">Encode as bookmarklet</button>
        <button id="decode-button" type="button" class="secondary-button">Decode</button>
        <button id="clear-button" type="button" class="secondary-button">Clear</button>
      </div>

      <label for="converter-output">Output</label>
      <textarea id="converter-output" rows="12" readonly spellcheck="false"></textarea>

      <div class="converter-actions">
        <button id="copy-output-button" type="button" class="primary-button" disabled>Copy output</button>
      </div>
      <p id="converter-status" class="card-message" aria-live="polite"></p>
    </section>
  </main>
</body>
</html>
```

- [ ] **Step 2: Implement converter interactions**

Create `assets/converter.js`:

```javascript
(() => {
  'use strict';

  const input = document.getElementById('converter-input');
  const output = document.getElementById('converter-output');
  const status = document.getElementById('converter-status');
  const encodeButton = document.getElementById('encode-button');
  const decodeButton = document.getElementById('decode-button');
  const copyButton = document.getElementById('copy-output-button');
  const clearButton = document.getElementById('clear-button');

  const setStatus = (message, kind = '') => {
    status.textContent = message;
    status.classList.remove('is-success', 'is-error');
    if (kind) status.classList.add(`is-${kind}`);
  };

  const setOutput = (value) => {
    output.value = value;
    copyButton.disabled = !value;
  };

  encodeButton.addEventListener('click', () => {
    if (!input.value) {
      setStatus('Paste JavaScript before encoding.', 'error');
      return;
    }

    setOutput(window.BookmarkletConverter.toBookmarkletUrl(input.value));
    setStatus('Bookmarklet URL created.', 'success');
  });

  decodeButton.addEventListener('click', () => {
    if (!input.value) {
      setStatus('Paste an encoded bookmarklet before decoding.', 'error');
      return;
    }

    try {
      setOutput(window.BookmarkletConverter.decodeBookmarklet(input.value));
      setStatus('Bookmarklet decoded.', 'success');
    } catch (error) {
      setOutput('');
      setStatus(error instanceof Error ? error.message : String(error), 'error');
    }
  });

  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.value);
      setStatus('Output copied.', 'success');
    } catch {
      output.focus();
      output.select();
      setStatus('Clipboard access failed. The output has been selected for manual copying.', 'error');
    }
  });

  clearButton.addEventListener('click', () => {
    input.value = '';
    setOutput('');
    setStatus('');
    input.focus();
  });
})();
```

- [ ] **Step 3: Add converter-specific styles without duplicating the existing design system**

Append to `assets/install.css`:

```css
.converter-page {
  width: min(920px, calc(100% - 32px));
  margin: 48px auto 80px;
}

.converter-card {
  padding: 30px;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: var(--surface);
  box-shadow: var(--shadow);
}

.converter-card h1 {
  margin: 8px 0 10px;
  font-size: clamp(2rem, 5vw, 3.6rem);
  line-height: 1.05;
  letter-spacing: -0.045em;
}

.converter-card label {
  display: block;
  margin: 24px 0 8px;
  font-weight: 800;
}

.converter-card textarea {
  width: 100%;
  resize: vertical;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
  background: #fbfcff;
  color: var(--text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.86rem;
  line-height: 1.5;
}

.converter-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 14px;
}
```

- [ ] **Step 4: Verify the converter manually**

Run:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/converter.html` and verify:

1. `alert('hello world')` encodes to a value beginning with `javascript:alert(` and containing `%20`.
2. The encoded output decodes back to the original source.
3. A malformed value such as `javascript:%E0%A4%A` displays an error.
4. Copy works on localhost HTTPS-equivalent secure context support; otherwise the output becomes selected.
5. Clear empties both textareas.
6. The page remains usable at mobile width.

- [ ] **Step 5: Commit the converter page**

```bash
git add converter.html assets/converter.js assets/install.css
git commit -m "feat: add bookmarklet URL converter page"
```

---

### Task 3: Use encoded bookmarklet URLs on the install page

**Files:**
- Modify: `install.html`
- Modify: `assets/install.js`

**Interfaces:**
- Consumes: `window.BookmarkletConverter.toBookmarkletUrl(source)`.
- Produces: Encoded drag-install href values and encoded clipboard/manual-copy output.

- [ ] **Step 1: Load the shared converter before the installation-page script**

Change the scripts in `install.html` to:

```html
<script src="assets/bookmarklet-converter.js" defer></script>
<script src="assets/install.js" defer></script>
```

Add a converter link in the header navigation:

```html
<a href="converter.html" data-i18n="converter">Converter</a>
```

- [ ] **Step 2: Update translated copy for direct bookmark format**

In `assets/install.js`, add these keys to both translation objects:

```javascript
// English
converter: 'Converter',
copyCode: 'Copy bookmark format',
copied: 'Direct bookmark format copied.',
manualCopyTitle: 'Copy direct bookmark format',
manualCopyDescription: 'Copy the complete encoded value below and paste it into the bookmark URL field.',

// Traditional Chinese
converter: '轉換工具',
copyCode: '複製直接書籤格式',
copied: '已複製直接書籤格式。',
manualCopyTitle: '複製直接書籤格式',
manualCopyDescription: '複製下方完整編碼內容，並貼到書籤的網址欄位。',
```

- [ ] **Step 3: Replace raw-prefix generation with the shared converter**

In `loadScriptForCard`, replace:

```javascript
cardState.bookmarkletUrl = `javascript:${source}`;
```

with:

```javascript
if (!window.BookmarkletConverter) {
  throw new Error('Bookmarklet converter is unavailable');
}

cardState.bookmarkletUrl = window.BookmarkletConverter.toBookmarkletUrl(source);
```

Do not add separate encoding logic elsewhere. The install anchor, clipboard copy, and manual-copy dialog must all keep using `cardState.bookmarkletUrl`.

- [ ] **Step 4: Add a browser smoke test page**

Create no permanent fixture. Use the local server and verify in DevTools:

```javascript
const sample = window.BookmarkletConverter.toBookmarkletUrl("alert('hello world')");
console.assert(sample === "javascript:alert('hello%20world')");
console.assert(window.BookmarkletConverter.decodeBookmarklet(sample) === "alert('hello world')");
```

Then verify on `install.html`:

1. The card copy button reads `複製直接書籤格式` in Traditional Chinese and `Copy bookmark format` in English.
2. Copy output begins with `javascript:` and includes `%0A` for source newlines.
3. The draggable install anchor has the same encoded value in its `href`.
4. Normal left-click remains intercepted and does not execute on the install page.
5. Manual-copy fallback shows the same encoded value.
6. `converter.html` is reachable from the header.

- [ ] **Step 5: Run all automated tests**

Run:

```bash
node --test tests/bookmarklet-converter.test.js
```

Expected: all tests PASS.

- [ ] **Step 6: Commit the install-page integration**

```bash
git add install.html assets/install.js
git commit -m "feat: copy encoded bookmarklet URLs"
```

---

### Task 4: Final verification and release metadata

**Files:**
- Modify: `bookmarklets.json`
- Verify: `converter.html`
- Verify: `install.html`
- Verify: `assets/bookmarklet-converter.js`
- Verify: `assets/converter.js`
- Verify: `assets/install.js`
- Verify: `assets/install.css`

**Interfaces:**
- Consumes: Completed shared utility and both static pages.
- Produces: A deployable GitHub Pages change with accurate bookmarklet metadata.

- [ ] **Step 1: Update the bookmarklet catalog version and date**

Change the Klook record in `bookmarklets.json` to:

```json
"version": "1.1.0",
"updated": "2026-08-07"
```

- [ ] **Step 2: Validate JSON and JavaScript tests**

Run:

```bash
python3 -m json.tool bookmarklets.json >/dev/null
node --test tests/bookmarklet-converter.test.js
```

Expected: JSON validation succeeds and all tests PASS.

- [ ] **Step 3: Verify generated encoded content round-trips against the real Klook script**

Run in the browser console on `install.html` after the card loads:

```javascript
const cardLink = document.querySelector('[data-role="install"]').href;
const decoded = window.BookmarkletConverter.decodeBookmarklet(cardLink);
console.assert(cardLink.startsWith('javascript:'));
console.assert(decoded.includes("const TARGET_HOST = 'www.klook.com'"));
console.assert(decoded.includes("new MutationObserver"));
```

Expected: all assertions pass.

- [ ] **Step 4: Perform the final manual browser checklist**

Verify:

1. English and Traditional Chinese switching still works and persists.
2. Converter page encode, decode, copy, clear, and malformed-input errors work.
3. Installation-page copy produces fully encoded output.
4. Dragging or right-clicking the install button preserves the encoded `javascript:` URL.
5. Clipboard fallback opens the dialog with the encoded value selected.
6. No third-party network requests are introduced.
7. Both pages work from a repository subpath and local HTTP server.

- [ ] **Step 5: Commit release metadata**

```bash
git add bookmarklets.json
git commit -m "chore: bump Klook bookmarklet metadata"
```

- [ ] **Step 6: Review the complete branch diff**

Run:

```bash
git diff main...HEAD --check
git diff --stat main...HEAD
```

Expected: no whitespace errors; changed files are limited to the converter utility/page, install-page integration, tests, metadata, and this plan.
