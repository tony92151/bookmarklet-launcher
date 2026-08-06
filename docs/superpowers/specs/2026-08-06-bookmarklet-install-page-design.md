# Bookmarklet Install Page Design

## Goal

Create a bilingual GitHub Pages installation page that lists bookmarklets from `bookmarklets.json`, loads each script from `scripts/`, and lets users install a bookmarklet by dragging its button to the bookmarks bar, right-clicking the button to add it as a bookmark, or copying the generated `javascript:` URL.

## Scope

The first version includes one bookmarklet, Klook Booking Category Labels, but the page must support adding more scripts without changing the page layout code.

The existing Bookmarklet Manager extension remains available as an alternative installation method. The page links to the repository documentation for users who prefer the extension.

## Files

- `install.html`: semantic page structure and bilingual text containers.
- `assets/install.css`: responsive presentation and component styling.
- `assets/install.js`: language handling, JSON loading, script loading, bookmarklet generation, card rendering, copy behavior, and errors.
- `bookmarklets.json`: bookmarklet metadata and localized copy.
- Existing `scripts/*.js`: canonical script sources. The install page must not duplicate script contents in JSON.

No framework, package manager, build step, analytics, or third-party JavaScript is used.

## Data Model

`bookmarklets.json` contains an array of bookmarklet records:

```json
{
  "bookmarklets": [
    {
      "id": "klook-booking-category",
      "name": {
        "en": "Klook Booking Category Labels",
        "zh-TW": "Klook 訂單分類標籤"
      },
      "description": {
        "en": "Shows the category extracted from each booking icon beside the booking title.",
        "zh-TW": "在每筆訂單標題旁顯示從分類圖示解析出的分類。"
      },
      "source": "scripts/klook-booking-category-label.js",
      "matches": ["https://www.klook.com/*/bookings/"],
      "version": "1.0.0",
      "updated": "2026-08-06"
    }
  ]
}
```

Required fields are `id`, `name`, `description`, `source`, and `matches`. `version` and `updated` are displayed when provided.

## Page Structure

### Header

The header contains:

- Project name: Bookmarklet Launcher.
- Language switch: `EN` and `繁中`.
- GitHub repository link.
- Bookmarklet Manager extension documentation link.

The header remains compact on mobile and wraps controls when necessary.

### Hero

The hero explains that users can install scripts without an extension by:

- Dragging an install button to the bookmarks bar.
- Right-clicking the button and adding the link as a bookmark.
- Copying the bookmarklet URL manually.

It includes a security warning telling users to install only scripts they trust.

### Bookmarklet List

Each bookmarklet renders as one card containing:

- Localized name and description.
- Supported URL patterns.
- Optional version and updated date.
- A prominent draggable/right-clickable install link.
- A `Copy code` button.
- A `View source` link.
- A concise three-step usage guide.
- A status message for loading or errors.

The install link uses the bookmarklet name as its bookmark title.

### Footer

The footer states that scripts run locally in the current page and links to the repository license and source.

## Bookmarklet Generation

For each record, `assets/install.js` performs the following:

1. Fetch `bookmarklets.json` with `cache: "no-cache"`.
2. Validate the top-level array and required metadata.
3. Fetch the referenced raw JavaScript file relative to the page URL.
4. Remove a UTF-8 BOM if present.
5. Prefix the raw script with `javascript:` without aggressive minification.
6. Assign the generated URL to the install anchor's `href`.
7. Use the same generated URL for clipboard copying.

The page does not strip comments or collapse whitespace because doing so with regular expressions can corrupt JavaScript strings, templates, or regular expressions. Bookmark URL size limitations are acknowledged in the installation instructions. The existing scripts are expected to remain within browser bookmark limits.

## Install-Link Interaction

The anchor must remain a real `href="javascript:..."` link so browsers can drag or bookmark it.

A normal left click on the install page is intercepted. Instead of executing the script against the installation page, it displays localized instructions to drag the button, right-click it, or use `Copy code`.

Keyboard activation receives the same instruction message.

## Language Behavior

Supported locales:

- `en`
- `zh-TW`

Initial language selection:

1. Use the saved value in `localStorage` when valid.
2. Otherwise use `zh-TW` when the browser language starts with `zh`.
3. Otherwise use English.

Changing language updates static page copy, bookmarklet cards, button labels, status messages, document title, and the `<html lang>` attribute. The preference is stored in `localStorage`.

Missing localized bookmarklet text falls back to English, then to the first available string.

## Copy Behavior

`Copy code` first uses `navigator.clipboard.writeText()`.

If Clipboard API access fails, the page opens a small fallback dialog containing a readonly textarea with the complete bookmarklet URL selected for manual copying.

A temporary status message announces success or failure without relying solely on color.

## Error Handling

### Metadata Failure

If `bookmarklets.json` cannot be fetched or parsed, the list area displays a localized page-level error and a retry button.

### Invalid Entry

An invalid bookmarklet record is skipped and logged to the browser console. One malformed record must not prevent valid records from appearing.

### Script Failure

If a script cannot be fetched:

- The card remains visible.
- The install and copy controls are disabled.
- A localized load-error message is shown.
- `View source` remains available when the source path is valid.

### Empty List

If the metadata loads but contains no valid entries, the page shows a localized empty-state message.

## Security

- No external JavaScript, CSS framework, analytics, fonts, or remote API is loaded.
- Script source paths must be same-origin relative paths. Absolute URLs, protocol-relative URLs, data URLs, and paths escaping the repository root are rejected.
- Content from JSON is inserted with `textContent`, never `innerHTML`.
- Only the generated install anchor receives a `javascript:` URL.
- External repository links use `rel="noopener noreferrer"`.
- The page clearly states that users should inspect and trust scripts before installing them.

## Accessibility

- All controls are keyboard accessible.
- Language buttons expose pressed/selected state.
- Status messages use `aria-live="polite"`.
- Focus indicators remain visible.
- Text and controls meet reasonable contrast requirements.
- Instructions do not depend only on drag-and-drop; right-click and copy alternatives are always presented.

## Responsive Layout

- Desktop: centered content with a two-column card grid when space permits.
- Tablet and mobile: single-column cards.
- Install buttons wrap long titles safely.
- Source patterns and bookmarklet URLs do not force horizontal page scrolling.

## GitHub Pages Deployment

The page is served directly from the repository root using GitHub Pages:

- Source: deploy from a branch.
- Branch: `main`.
- Folder: `/ (root)`.

Expected URL:

`https://tony92151.github.io/bookmarklet-launcher/install.html`

All paths are relative so the page also works from a local HTTP server and repository forks.

## Testing

Manual verification covers:

1. English and Traditional Chinese initial language selection.
2. Language switching and persistence after reload.
3. JSON metadata loading and card rendering.
4. Klook script loading and `javascript:` URL generation.
5. Dragging the install link to the bookmarks bar.
6. Right-clicking and adding the install link as a bookmark.
7. Copying code through Clipboard API.
8. Manual-copy fallback when Clipboard API is unavailable.
9. Left-click interception on the install link.
10. Script-load failure state.
11. Metadata-load retry state.
12. Mobile-width layout.
13. No third-party network requests.

## Success Criteria

- The installation page is usable in English and Traditional Chinese.
- Bookmarklet cards are generated from `bookmarklets.json`.
- Script content is loaded from `scripts/` as the single source of truth.
- Users can drag, right-click, or copy to install a bookmarklet.
- Clicking an install link on the page does not execute it there.
- Failed scripts do not break the rest of the page.
- Adding another bookmarklet requires only a new script file and one JSON record.
- The page works as a static GitHub Pages site without a build step.
