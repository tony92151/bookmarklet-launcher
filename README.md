# Bookmarklet Script Manager

Bookmarklet Script Manager is a Chrome extension for saving and running trusted
bookmarklets. The companion bookmarklet site now lives in [bookmarklet-script-manager-market](https://github.com/tony92151/bookmarklet-script-manager-market). This repository contains the Manifest V3 Chrome extension.

The project has no build step or external runtime dependencies.

## Extension features

- Add, edit, and delete custom scripts
- Supports `javascript:` bookmarklets and raw JavaScript through explicit input modes
- Removes the `javascript:` prefix; URL decoding occurs only when you select the URL-encoded bookmarklet input mode
- Uses `chrome.storage.local` to store scripts, supporting larger bookmarklet examples
- Uses `chrome.userScripts.execute` when enabled and a page Blob script as a fallback when it is off
- Blocks execution on restricted pages like `chrome://`, `about:`, and extension pages
- Lets users defer the optional "Allow user scripts" setup and collapse its guidance
- Offers a "Test This Page" probe while user scripts are disabled; it checks whether a temporary Blob script can run on the current page without running saved scripts

## Requirements

- Chrome 135+
- Manifest V3 extension support
- Enable **Allow user scripts** if a website blocks the fallback execution method
- The `zip` command-line utility on `PATH` when creating a release package

## Load the extension

1. Open `chrome://extensions`.
2. Enable **Developer mode** in the top right.
3. Click **Load unpacked**.
4. Select this repository's root folder. `manifest.json` intentionally remains at the root so the extension can import `shared/` modules.

## Optional Setup: Enable User Scripts

When **Allow user scripts** is enabled, the extension uses Chrome's
`userScripts` API to execute custom scripts. Otherwise it tries a page Blob
script. Some websites block that fallback with their security policy. The
popup lets you postpone setup and reopen its instructions later.

1. Find **Bookmarklet Script Manager** in `chrome://extensions`.
2. Click **Details**.
3. Enable **Allow user scripts**.
4. If the popup still says it's not enabled, click **Reload** on the extension card, or restart the browser.

When the toggle is off, **Test this page** checks whether a simple temporary
Blob script can run on the current tab. Testing is optional; saved scripts
attempt the fallback even if you have not tested the page. A passing test does
not guarantee that every bookmarklet will work.

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

## Public site and privacy policy

The bookmarklet catalog, URL converter, privacy policy, and GitHub Pages deployment are maintained in [bookmarklet-script-manager-market](https://github.com/tony92151/bookmarklet-script-manager-market). The public site is at [Bookmarklet Launcher](https://tony92151.github.io/bookmarklet-script-manager-market/), and the privacy policy is at [privacy.html](https://tony92151.github.io/bookmarklet-script-manager-market/privacy.html).

The extension keeps its own copy of `shared/bookmarklet.js` for script input conversion and release packaging.

## Development

This is a pure frontend extension project with no dependencies to install.

After modifying code:

1. Go back to `chrome://extensions`.
2. Click **Reload** on the Bookmarklet Script Manager card.
3. Reopen the popup or options page to test.

## GitHub extension releases

For the first release, use the current `manifest.json` version. For later releases,
update `manifest.json` to the next Chrome extension version in a PR and merge it
to `main`. Then open **Actions → Release Chrome extension → Run workflow** on
`main` and enter that exact version without a `v` prefix (for example, `1.0.1`).
The workflow checks that the input matches the manifest and is greater than
all published GitHub Release versions. After tests pass, it builds the extension
ZIP, creates a `v<version>` tag at the tested commit, and publishes the ZIP on
[GitHub Releases](https://github.com/tony92151/bookmarklet-launcher/releases).
The existing tag name must be available. The ZIP is the extension package;
GitHub Releases do not publish it to the Chrome Web Store.

## Chrome Web Store test release

Bookmarklet Script Manager supports Chrome 135+ only. Create the submission
archive with:

```sh
node scripts/package-extension.mjs
```

Before submitting a Chrome Web Store test release, follow the
[release checklist](docs/chrome-web-store-release-checklist.md). The published
[privacy policy](https://tony92151.github.io/bookmarklet-script-manager-market/privacy.html) explains the extension's local-only data
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
shared/            bookmarklet URL conversion module
fixtures/          bookmarklet test data
tests/             Node tests for shared and extension contracts
icons/             extension icons
```

## Security and Limitations

The core function of this tool is to execute JavaScript that you paste. Only save and run scripts you trust and understand.

- No external source scripts loaded
- Scripts are not sent to remote services
- Script data is stored in the browser's local `chrome.storage.local`
- Sites that block Blob scripts may require **Allow user scripts** for saved scripts to run
- Due to browser restrictions, cannot execute on `chrome://`, `about:`, `devtools:` or extension pages

## License

MIT
