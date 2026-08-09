# Repository Structure Design

## Purpose

Restructure the repository so the Chrome extension and the static bookmarklet
site have explicit ownership, while sharing one tested implementation of
bookmarklet normalization and URI encoding.

## Decisions

- Keep both products in this repository.
- Use native browser ES modules; do not add a bundler, framework, or runtime
  dependency.
- Treat malformed percent encoding as an explicit conversion error rather than
  silently retaining the encoded input.
- Keep `manifest.json` at the repository root. Chrome therefore loads the
  repository root as the unpacked extension and extension modules can import
  from `shared/`.
- Move the public site to `site/index.html` and the converter to
  `site/converter/index.html`. Existing root-level page URLs are intentionally
  removed rather than preserved through redirects.
- Deploy GitHub Pages from a generated artifact that contains `site/`,
  `shared/`, and `bookmarklets/`. The artifact is a file copy, not a bundled or
  transformed application.

## Alternatives Considered

1. Keep the root-level layout and only rename files. This has the lowest
   migration cost but preserves unclear product ownership and duplicated logic.
2. Split the extension and site into separate repositories. This gives strict
   deployment isolation but adds coordination overhead for a small shared
   domain.
3. Keep one repository with `extension/`, `site/`, `shared/`, and
   `bookmarklets/` directories. This is selected because it provides clear
   locality without introducing an additional release process.

## Target Layout

```text
manifest.json
extension/
  background.js
  popup/index.html
  popup/index.js
  popup/styles.css
  options/index.html
  options/index.js
  options/styles.css
  storage.js
site/
  index.html
  converter/index.html
  assets/install.js
  assets/install.css
  assets/converter.js
  assets/converter.css
shared/
  bookmarklet.js
bookmarklets/
  catalog.json
  klook-booking-category-label.js
fixtures/
tests/
  shared/bookmarklet.test.js
docs/
```

## Modules and Data Flow

`shared/bookmarklet.js` is the only module responsible for removing a leading
BOM, stripping a case-insensitive `javascript:` prefix, encoding JavaScript,
creating a bookmarklet URL, and decoding a bookmarklet URL. It exports ESM
functions directly and is imported by both products.

The site loads `bookmarklets/catalog.json`, validates each local source path,
loads the corresponding source from `bookmarklets/`, and calls
`toBookmarkletUrl(source)` before setting an install link or copy value.
`install-encoded.js` is removed: there is no DOM observer or second encoding
pass.

The extension's popup sends `RUN_SCRIPT` to the background module. The
background module alone checks user-scripts availability, obtains the active
tab, rejects restricted schemes, and calls `chrome.userScripts.execute`. The
popup owns rendering, status messages, and navigation only.

Extension storage remains extension-specific because its interface depends on
`chrome.storage.local`; it is not part of `shared/`.

## Pages Deployment

A GitHub Actions workflow creates a Pages artifact by copying `site/`,
`shared/`, and `bookmarklets/` into one publish directory, then deploys that
artifact. This makes relative ESM imports and catalog source paths valid on the
published site without exposing the extension package as the website root.

## Testing and Acceptance

- Node tests import the shared ESM module and cover BOM handling, prefix
  removal, encoding, valid decoding, and malformed percent encoding.
- Existing converter behavior is preserved through the shared module.
- The static site contains no dependency on `window.BookmarkletConverter` and
  no reference to `install-encoded.js`.
- The extension manifest resolves the new popup, options, and background paths.
- The Pages workflow artifact includes all three required source directories.
- The existing test suite passes after the move.

## Non-goals

- Adding a framework, package manager, bundler, or TypeScript.
- Changing the UX or visual design beyond fixing relative paths after the move.
- Creating backward-compatible redirects for the previous root-level pages.
