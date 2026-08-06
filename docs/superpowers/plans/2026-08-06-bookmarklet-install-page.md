# Bookmarklet Install Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual static GitHub Pages installation page that renders bookmarklet cards from JSON and supports drag, right-click bookmark creation, and code copying.

**Architecture:** `install.html` provides semantic structure, `assets/install.css` supplies responsive styling, and `assets/install.js` loads metadata plus same-origin script files to generate real `javascript:` links. `bookmarklets.json` is the extensible metadata source while `scripts/*.js` remains the canonical source code.

**Tech Stack:** HTML5, CSS, vanilla JavaScript, JSON, GitHub Pages

## Global Constraints

- No framework, package manager, build step, analytics, third-party JavaScript, remote fonts, or external API.
- Support `en` and `zh-TW` with localStorage persistence and browser-language fallback.
- Script source paths must be same-origin relative paths that cannot escape the repository root.
- JSON text must be inserted with `textContent`, not `innerHTML`.
- A normal click on an install link must show instructions instead of executing the bookmarklet on the install page.
- One invalid record or failed script must not prevent other cards from rendering.
- The page must work from GitHub Pages, repository forks, and a local HTTP server.

---

### Task 1: Add metadata and page shell

**Files:**
- Create: `bookmarklets.json`
- Create: `install.html`

**Interfaces:**
- Consumes: Existing `scripts/klook-booking-category-label.js`.
- Produces: `#bookmarklet-list`, language controls, retry container, and manual-copy dialog consumed by `assets/install.js`.

- [ ] Create the Klook metadata record with localized name and description.
- [ ] Add semantic header, hero, bookmarklet list, footer, and accessible dialog markup.
- [ ] Link only local stylesheet and script files.

### Task 2: Implement responsive presentation

**Files:**
- Create: `assets/install.css`

**Interfaces:**
- Consumes: Classes emitted by `install.html` and `assets/install.js`.
- Produces: Responsive two-column card grid, accessible focus states, status styles, and mobile layout.

- [ ] Style the page shell, header, hero, cards, install link, secondary actions, status messages, and dialog.
- [ ] Ensure long URL patterns and bookmarklet titles wrap without horizontal overflow.
- [ ] Add mobile breakpoints and visible keyboard focus indicators.

### Task 3: Implement metadata loading and rendering

**Files:**
- Create: `assets/install.js`

**Interfaces:**
- Consumes: `bookmarklets.json`, same-origin script files, and static DOM IDs.
- Produces: Localized bookmarklet cards with generated `javascript:` links.

- [ ] Implement locale selection, translation lookup, and localStorage persistence.
- [ ] Validate metadata and reject unsafe source paths.
- [ ] Fetch each script independently, remove a UTF-8 BOM, prefix with `javascript:`, and keep failures isolated to their card.
- [ ] Render empty, metadata error, and retry states.

### Task 4: Implement installation interactions

**Files:**
- Modify: `assets/install.js`

**Interfaces:**
- Consumes: Generated bookmarklet URLs and rendered card controls.
- Produces: Click interception, clipboard copy, manual-copy fallback, and accessible live status updates.

- [ ] Intercept normal and keyboard activation of install links and show localized instructions.
- [ ] Copy with Clipboard API and fall back to the readonly dialog textarea.
- [ ] Update all static and dynamic copy when the language changes.
- [ ] Preserve real `javascript:` href values for drag and right-click installation.

### Task 5: Verify static-page behavior

**Files:**
- Verify: `install.html`
- Verify: `assets/install.css`
- Verify: `assets/install.js`
- Verify: `bookmarklets.json`

**Interfaces:**
- Consumes: Browser and local HTTP server.
- Produces: A deployable GitHub Pages page.

- [ ] Validate JSON syntax with `python3 -m json.tool bookmarklets.json`.
- [ ] Confirm all relative paths resolve from repository root.
- [ ] Confirm English and Traditional Chinese switching, persistence, drag/right-click links, copy fallback, retry behavior, and mobile layout.
- [ ] Confirm no third-party network resources are referenced.
