# Klook Booking Category Label Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a bookmarklet script that shows a human-readable Klook booking category label beside each booking title on the Traditional Chinese bookings page.

**Architecture:** A single defensive IIFE validates the target URL, scans each `.booking-item`, parses the category filename from `.booking-item_icon img`, and injects an idempotent inline badge beside the booking title. A `MutationObserver` rescans dynamically inserted booking cards while avoiding duplicate badges.

**Tech Stack:** Browser JavaScript, DOM APIs, MutationObserver

## Global Constraints

- Run only on `https://www.klook.com/zh-TW/bookings/`.
- Output raw JavaScript wrapped in an IIFE, not a `javascript:` URL.
- Do not use `import`, `export`, or `chrome.*` APIs.
- Display a visible error when the URL or expected booking structure is unavailable.
- Convert `category_experiences_l1_culture_experience_48` to `Culture Experience`.
- Preserve the original category string in the label's `title` attribute.
- Repeated execution must not create duplicate labels or observers.

---

### Task 1: Implement the bookmarklet

**Files:**
- Create: `scripts/klook-booking-category-label.js`

**Interfaces:**
- Consumes: Klook DOM elements matching `.booking-item`, `.booking-item_icon img`, and a booking title element.
- Produces: Inline elements marked with `data-klook-category-label="true"` and one observer stored on `window.__klookBookingCategoryObserver`.

- [ ] **Step 1: Implement filename parsing**

Extract the URL pathname's final segment, decode it, remove its extension, remove `category_experiences_l1_`, and remove a trailing numeric suffix such as `_48`.

- [ ] **Step 2: Implement human-readable formatting**

Convert underscores and hyphens to spaces, trim repeated whitespace, and title-case each word.

- [ ] **Step 3: Implement defensive DOM scanning**

For each booking card, skip cards already containing `data-klook-category-label="true"`, read the icon source, locate the title using a prioritized selector list, and append the badge beside the title.

- [ ] **Step 4: Implement dynamic-page support**

Disconnect an existing observer stored at `window.__klookBookingCategoryObserver`, create a new debounced `MutationObserver`, and rescan when nodes are added.

- [ ] **Step 5: Add visible feedback and guards**

Alert when the pathname is not `/zh-TW/bookings/`, when no booking cards are found, or when no category labels can be added. Log the successful count to the console.

### Task 2: Verify behavior

**Files:**
- Verify: `scripts/klook-booking-category-label.js`

- [ ] **Step 1: Verify parsing manually**

Confirm that an image URL ending in `category_experiences_l1_culture_experience_48.png` produces `Culture Experience` and retains the original basename in the tooltip.

- [ ] **Step 2: Verify idempotency**

Confirm that running the script twice does not add a second badge and replaces the previous observer cleanly.

- [ ] **Step 3: Verify failure paths**

Confirm that the script alerts on the wrong URL and handles booking cards with missing icons or titles without throwing.
