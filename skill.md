---
name: make-bookmarklet
description: Use when a user wants a bookmarklet for the Bookmarklet Manager extension, asks to perform a webpage action in one click, or describes a browser-page automation task.
---

# Create a Bookmarklet

The user will describe something they want to accomplish on a webpage with one click (for example, extracting a page table, automatically filling a form, changing page styles, or extracting data to download as a file). Turn that description into executable JavaScript, save it as a file, and explain how to add it to the extension.

If `$ARGUMENTS` has content, treat it as the requirements description. If it is empty, first ask the user what they want to do.

## Execution Environment

Scripts are injected by this repository's Bookmarklet Manager extension through `chrome.userScripts.execute`:

- They run in the page's **MAIN world**, so they can access the page's global variables and framework instances (such as React/Vue), and manipulate the DOM directly.
- They are **not restricted by the website's CSP**, so they may use `fetch`, dynamically load scripts, and open new windows.
- They are one-time executable code strings, **not modules**: do not use `import` or `export`.
- They do not have access to the `chrome.*` extension APIs; they are ordinary page JavaScript.
- They cannot run on restricted pages such as `chrome://`, `edge://`, or extension pages.

## Writing Guidelines

1. **Wrap the entire script in an IIFE**: `(() => { ... })();`. This avoids polluting page globals and prevents `const` redeclaration errors when the script is run more than once.
2. **Output raw JavaScript, not a `javascript:` URL.** The extension accepts both, but raw JavaScript is easier to read and modify later. Do not percent-encode it.
3. **Give the user visible feedback.** On completion or failure, clearly report the result with `alert()`, an in-page toast, or `console.log`. Silent failures create a poor experience.
4. **Use defensive DOM selection.** When a selector cannot find an element, show a clear error such as `alert("Could not find XXX. Please confirm that you are on the correct page.")` instead of throwing an uncaught exception.
5. **For operations that must wait** (infinite scrolling, SPA navigation), use an async IIFE plus polling or a `MutationObserver`, with a timeout limit.
6. **To download data**, use a Blob and a temporary `<a download>` element. **To copy to the clipboard**, use `navigator.clipboard.writeText` (the page must be focused); if it fails, display the text so the user can copy it manually.
7. Add concise comments explaining what each code section does, so the user can adjust it later.

Reference examples: `c1_trip_example.txt` and `c1_hotel_reward.txt` in the repository root are production scripts in percent-encoded `javascript:` format. They demonstrate patterns such as paginated extraction and polling waits.

## Workflow

1. **Clarify the requirements.** If the description is not specific enough (the target site, fields to extract, or output format are unknown), ask before writing. Typical questions: Which website/page? What should happen after it runs? How should the result be presented (alert, file download, copy, or page modification)?
2. **Understand the target page when possible.** If the user provides a URL for a public page, use WebFetch to inspect its structure and choose selectors. For pages behind a login, ask the user to share the relevant HTML snippet, or draft an initial version while warning that its selectors may need adjustment on the actual page.
3. **Write the script** according to the guidelines above.
4. **Save the script** at `scripts/<kebab-case-name>.js` in the repository root. Create `scripts/` if it does not exist.
5. **Explain how to use it**:
   - Open the extension popup → ⚙️ Manage Scripts.
   - Enter a descriptive script name, paste the file contents into the code field, then save.
   - On the target page, click the toolbar icon, then click the script to run it.
6. **Proactively suggest how to test it.** State which page to test, what the user should expect, and what information to report if the selector fails (for example, console errors visible in DevTools with F12).
