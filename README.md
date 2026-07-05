# Bookmarklet Manager

Bookmarklet Manager is a Manifest V3 Chrome/Edge extension for managing your bookmarklets in one place. You can paste a `javascript:` bookmarklet or raw JavaScript, then click to execute it in the current tab from the toolbar popup — similar to traditional browser bookmarklets.

This project has no build step and no external dependencies. Just load it as an unpacked extension to use.

## Features

- Add, edit, and delete custom scripts
- Supports `javascript:` bookmarklets and raw JavaScript
- Automatically removes `javascript:` prefix and tries to decode URI percent-encoding
- Uses `chrome.storage.local` to store scripts, supporting larger bookmarklet examples
- Uses `chrome.userScripts.execute` to run in the current tab's `MAIN` world
- Blocks execution on restricted pages like `chrome://`, `edge://`, `about:`, and extension pages
- Shows setup prompt in popup when "Allow user scripts" is not enabled

## Requirements

- Chrome 135+ or compatible Chromium browser
- Manifest V3 extension support
- Must manually enable **Allow user scripts** for this extension

## Installation

1. Open `chrome://extensions`. Edge users can open `edge://extensions`.
2. Enable **Developer mode** in the top right.
3. Click **Load unpacked**.
4. Select this repo folder.

## One-time Setup: Enable User Scripts

This extension uses Chrome's `userScripts` API to execute custom scripts. This API is designed by the browser for user custom scripts and behaves more like bookmarklets, but requires manually enabling the permission.

1. Find **Bookmarklet Manager** in `chrome://extensions`.
2. Click **Details**.
3. Enable **Allow user scripts**.
4. If the popup still says it's not enabled, click **Reload** on the extension card, or restart the browser.

## Usage

1. Click the Bookmarklet Manager icon in the toolbar.
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

The `c1_*.txt` files in the repo are larger bookmarklet test data, useful for verifying the storage and decoding flow.

## Development

This is a pure frontend extension project with no dependencies to install.

After modifying code:

1. Go back to `chrome://extensions`.
2. Click **Reload** on the Bookmarklet Manager card.
3. Reopen the popup or options page to test.

To check manifest JSON format:

```sh
python3 -m json.tool manifest.json
```

## File Structure

```text
manifest.json      MV3 manifest, permissions, popup, options page config
background.js      service worker fallback, can call userScripts.execute
popup.html/css/js  toolbar popup: show script list, check setup, run scripts
options.html/css/js management page: add, edit, delete scripts
lib/decode.js      normalize bookmarklet input to raw JavaScript
lib/storage.js     chrome.storage.local script read/write wrapper
icons/             extension icons
c1_*.txt           bookmarklet test data
```

## Security and Limitations

The core function of this tool is to execute JavaScript that you paste. Only save and run scripts you trust and understand.

- No external source scripts loaded
- Scripts are not sent to remote services
- Script data is stored in the browser's local `chrome.storage.local`
- Scripts will not execute if `userScripts` permission is not enabled
- Due to browser restrictions, cannot execute on `chrome://`, `edge://`, `about:`, `devtools:` or extension pages

## License

MIT
