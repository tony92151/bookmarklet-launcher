# Chrome Web Store Release Design

## Goal

Prepare a reviewable first Chrome Web Store release of **Bookmarklet Script
Manager**. It is an advanced-user tool for saving and manually running trusted
bookmarklets or JavaScript in the current tab.

## Product boundary

- Support Chrome 135+ only.
- Store script names and source locally in `chrome.storage.local`.
- Do not sign users in, synchronize data, collect analytics, use advertising,
  or contact remote services.
- Run a script only after the user selects it in the popup, and only in the
  currently active tab. No automatic, scheduled, or background execution.
- Do not ship built-in scripts in this release.

## User experience

The popup and options page use the product name consistently. On first use,
and whenever Chrome has not enabled User Scripts, the popup provides a
prominent explanation that scripts can read and change the active page, a
step-by-step enablement path, and a recheck control. The options page repeats
the trust warning beside the script editor and links to the privacy policy.

Both English and Traditional Chinese are supported through lightweight local
copy, with English as the initial packaged locale. The initial release avoids
partial language claims: any visible release-safety copy is available in both
languages.

## Privacy and support

GitHub Pages hosts a stable `privacy.html`. It describes what is stored
locally, what the extension does not collect or send, the three permissions,
and the fact that user-authored scripts are independently chosen code. GitHub
Issues is the support URL.

## Distribution artifacts

Create a release allowlist that produces a ZIP with only `manifest.json`,
`extension/`, `shared/`, and `icons/`. Keep the manifest at the archive root.
Create a release checklist that records Chrome clean-profile acceptance steps,
listing metadata, and required visual assets. Store screenshots and tiles are
not fabricated: they must be captured from the submitted build before upload.

## Testing

Add contract tests for the release package allowlist and for the presence of
the user-facing policy/support disclosures. Existing Node tests continue to
cover the manifest and shared bookmarklet transformations. Manual acceptance
in a clean Chrome profile verifies the browser-only User Scripts toggle,
storage lifecycle, restricted-page behavior, and reinstall behavior.

## Non-goals

This release does not add cloud sync, analytics, built-in page tools, Edge
support claims, automated execution, or store screenshots that promise those
features.
