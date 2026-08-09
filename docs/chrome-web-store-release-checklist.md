# Chrome Web Store test-release checklist

Use this checklist before submitting a new test release of Bookmarklet Script
Manager to the Chrome Web Store.

## Package verification

- [ ] Run the automated test suite:
  `node --experimental-default-type=module --test`.
- [ ] Build the upload package from a clean working tree:
  `node scripts/package-extension.mjs`.
- [ ] Inspect `dist/bookmarklet-script-manager.zip`; it contains only
  `manifest.json`, `extension/`, `shared/`, and `icons/` at the archive root.
- [ ] Confirm the ZIP opens without errors: `unzip -t
  dist/bookmarklet-script-manager.zip`.
- [ ] Confirm icon assets are PNG files with the required 16×16, 48×48, and
  128×128 pixel dimensions.
- [ ] Capture listing assets from the submitted build: at least one 1280×800 or
  640×400 screenshot and a required 440×280 small promotional tile.

## Chrome test-release submission

- [ ] Scope the listing to Chrome 135 and later; do not claim support for Edge,
  Firefox, Safari, or other browsers.
- [ ] Upload `dist/bookmarklet-script-manager.zip` as a Chrome Web Store test
  release, not a production rollout.
- [ ] Complete the Chrome Web Store privacy field with the published privacy
  policy: `https://tony92151.github.io/bookmarklet-launcher/site/privacy.html`.
- [ ] Set the support URL to GitHub Issues:
  `https://github.com/tony92151/bookmarklet-launcher/issues`.

## Clean-profile acceptance

- [ ] In a clean Chrome 135+ profile, install the test release and confirm the
  popup and options pages open.
- [ ] Confirm the extension requests only `userScripts`, `storage`, and
  `activeTab` permissions, and does not request host permissions.
- [ ] Add a user-provided bookmarklet script, edit it, and close and reopen the
  options page and popup to confirm each saved change persists. Delete the
  script and confirm it remains deleted after reopening the extension.
- [ ] Attempt to run a saved script on a restricted page such as
  `chrome://extensions`; confirm the script does not run and the popup reports
  that execution is not allowed on the page.
- [ ] Confirm the safety guidance says to run only scripts the user trusts, and
  the re-check action remains available after installation.
- [ ] Uninstall and reinstall the same test-release package; confirm previously
  saved scripts are absent and the first-run user-scripts setup guidance is
  shown again.
- [ ] Open the privacy policy and GitHub Issues support URL from the listing to
  verify they are publicly reachable.
