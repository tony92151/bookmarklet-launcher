# Bookmarklet Script Manager

Bookmarklet Script Manager is a Chrome extension for saving and running trusted
bookmarklets. This repository also includes a companion bookmarklet site; both
tools share one bookmarklet-conversion module:

- **Bookmarklet Script Manager** — a Manifest V3 Chrome extension for saving and running trusted bookmarklets.
- **Bookmarklet site** — a static catalog and URL converter for installing bookmarklets without an extension.

The project has no build step or external runtime dependencies.

## Extension features

- Add, edit, and delete custom scripts
- Supports `javascript:` bookmarklets and raw JavaScript
- Automatically removes `javascript:` prefix and tries to decode URI percent-encoding
- Uses `chrome.storage.local` to store scripts, supporting larger bookmarklet examples
- Uses `chrome.userScripts.execute` to run in the current tab's `MAIN` world
- Blocks execution on restricted pages like `chrome://`, `about:`, and extension pages
- Shows setup prompt in popup when "Allow user scripts" is not enabled

## Requirements

- Chrome 135+
- Manifest V3 extension support
- Must manually enable **Allow user scripts** for this extension

## Load the extension

1. Open `chrome://extensions`.
2. Enable **Developer mode** in the top right.
3. Click **Load unpacked**.
4. Select this repository's root folder. `manifest.json` intentionally remains at the root so the extension can import `shared/` modules.

## One-time Setup: Enable User Scripts

This extension uses Chrome's `userScripts` API to execute custom scripts. This API is designed by the browser for user custom scripts and behaves more like bookmarklets, but requires manually enabling the permission.

1. Find **Bookmarklet Script Manager** in `chrome://extensions`.
2. Click **Details**.
3. Enable **Allow user scripts**.
4. If the popup still says it's not enabled, click **Reload** on the extension card, or restart the browser.

## Usage

1. Click the Bookmarklet Script Manager icon in the toolbar.
2. Click **Manage Scripts** to open the options page.
3. Enter a script name, paste a `javascript:` bookmarklet or raw JavaScript.
4. Click **Save**.
5. Go to the target webpage, open the popup, and click the script name to execute it in the current tab.

Example input:

```js
alert(document.title)
```

Or:

```js
javascript:(()=>alert(document.title))();
```

The files in `fixtures/` are larger bookmarklet test data, useful for verifying the storage and decoding flow.

## Bookmarklet site

The static catalog lives at `site/index.html`; the URL converter is at `site/converter/index.html`. In a GitHub Pages deployment their URLs are `/site/` and `/site/converter/`.

The catalog is `bookmarklets/catalog.json`, and each local bookmarklet source lives beside it in `bookmarklets/`. The site validates catalog source paths and creates encoded bookmarklet URLs with `shared/bookmarklet.js`.

## GitHub Pages

The included Pages workflow copies `site/`, `shared/`, and `bookmarklets/` into a single deployment artifact. Configure the repository's Pages source as **GitHub Actions**; do not select a branch directory as the Pages source. After a push to `main`, open the deployed `/site/` path.

## Development

This is a pure frontend extension project with no dependencies to install.

After modifying code:

1. Go back to `chrome://extensions`.
2. Click **Reload** on the Bookmarklet Script Manager card.
3. Reopen the popup or options page to test.

## Chrome Web Store test release

Bookmarklet Script Manager supports Chrome 135+ only. Create the submission
archive with:

```sh
node scripts/package-extension.mjs
```

Before submitting a Chrome Web Store test release, follow the
[release checklist](docs/chrome-web-store-release-checklist.md). The published
[privacy policy](site/privacy.html) explains the extension's local-only data
storage and use.

Run the test suite with Node's ESM default enabled:

```sh
node --experimental-default-type=module --test
```

To check manifest JSON format:

```sh
python3 -m json.tool manifest.json
```

## File Structure

```text
manifest.json      MV3 manifest and extension entry points
extension/         background, popup, options, and storage modules
site/              static bookmarklet catalog and converter pages
shared/            bookmarklet URL conversion module
bookmarklets/      catalog metadata and bookmarklet source files
fixtures/          bookmarklet test data
tests/             Node tests for shared, site, and extension contracts
icons/             extension icons
```

## Security and Limitations

The core function of this tool is to execute JavaScript that you paste. Only save and run scripts you trust and understand.

- No external source scripts loaded
- Scripts are not sent to remote services
- Script data is stored in the browser's local `chrome.storage.local`
- Scripts will not execute if `userScripts` permission is not enabled
- Due to browser restrictions, cannot execute on `chrome://`, `about:`, `devtools:` or extension pages

## License

MIT
