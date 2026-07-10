# Chrome Web Store Listing Design

## Goal

Present the extension to non-developers as a practical collection of webpage tools rather than a JavaScript or bookmarklet manager. The listing should make three everyday uses immediately understandable: organizing page content, copying useful information, and assisting with shopping or hotel information collection.

This listing must not be published with claims or screenshots of built-in tools until those tools exist in the submitted extension version.

## Audience and Positioning

- Primary audience: general Chrome users who may not know what bookmarklets or JavaScript are.
- Product concept: a personal toolbox of small utilities that work on the current webpage.
- Primary promise: save common webpage tools in one place and run them with one click.
- Technical concepts such as `userScripts`, raw JavaScript, and bookmarklets belong in setup, safety, and advanced-use explanations rather than the headline.

## Store Identity

### Name

網頁工具箱 Web Toolbox

### Short summary

集中保存常用網頁小工具，整理內容、快速複製資料，需要時點一下就能使用。

### Category

Productivity

## Detailed Description

網頁工具箱讓你把常用的網頁小工具集中在瀏覽器裡，需要時直接在目前頁面使用。

無論是整理頁面重點、複製商品資料，或彙整購物與訂房資訊，都不必反覆操作或尋找散落的工具。

主要功能：

- 內建實用範例，安裝後即可開始使用
- 整理網頁內容，讓重要資訊更容易閱讀
- 快速複製頁面中的常用資料
- 協助彙整購物、商品與訂房資訊
- 新增、編輯與管理自己的網頁工具
- 工具資料保存在瀏覽器本機，不會上傳到外部服務

使用方式：

1. 開啟想處理的網頁
2. 點擊工具列上的「網頁工具箱」
3. 選擇需要的工具，即可在目前頁面執行

為了執行網頁工具，首次使用時需要依照畫面指示啟用「允許使用者指令碼」。瀏覽器內建頁面及其他受限制頁面無法執行工具。

請只加入並執行你信任的自訂工具。

## Screenshot Storyboard

Create five 1280 x 800 full-bleed screenshots. Each image uses no more than one two-line headline. The screenshots combine a real browser page with the real extension UI so the result accurately represents the submitted version.

### 1. Core value

- Headline: 常用網頁小工具，點一下就能用
- Visual: the extension popup over a normal webpage, with recognizable tools for organizing, copying, and shopping or hotel tasks.
- Purpose: explain the product in one glance without technical vocabulary.

### 2. Organize a page

- Headline: 雜亂資訊，快速變清楚
- Visual: an honest before-and-after result from the built-in page-organizing tool.
- Purpose: demonstrate a visible outcome rather than describing implementation details.

### 3. Copy useful information

- Headline: 需要的資料，一次複製
- Visual: selected page data and a successful copy confirmation produced by the built-in copy tool.
- Purpose: show a common, concrete time-saving action.

### 4. Shopping and hotel assistance

- Headline: 購物、訂房資料，更容易整理
- Visual: a real output containing product or room information created by a built-in tool.
- Purpose: show an everyday scenario without implying automatic price comparison, universal site compatibility, or booking automation.

### 5. Customization and local storage

- Headline: 建立自己的網頁工具箱
- Visual: the real management page for adding and editing tools, paired with a short local-storage and trusted-tools note.
- Purpose: introduce advanced customization and reinforce user control.

## Visual Direction

- Use the extension's existing neutral surfaces, slate text, and blue primary action color as the shared brand language.
- Use green for copy-success examples and warm orange for shopping or hotel examples while keeping buttons and typography consistent.
- Use square corners and full-bleed compositions for the exported screenshots.
- Keep the extension UI readable at store-thumbnail sizes and avoid decorative text that competes with the headline.
- Keep the icon, screenshots, and promotional tile visually consistent.

## Store Assets

- Store icon: 128 x 128 pixels; simple mark with no miniature UI or screenshot content.
- Screenshots: five images at 1280 x 800 pixels.
- Small promotional tile: 440 x 280 pixels, using the core toolbox message with minimal text.
- Optional marquee image: 1400 x 560 pixels, using the same brand system if featuring is pursued.

Current Chrome Web Store guidance: [Creating a great listing page](https://developer.chrome.com/docs/webstore/best-listing) and [Complete your listing information](https://developer.chrome.com/docs/webstore/cws-dashboard-listing).

## Accuracy and Release Gates

Before using this listing:

1. Implement the built-in examples shown in screenshots 1 through 4.
2. Verify every screenshot against the exact packaged extension version submitted to the store.
3. Replace the current technical-facing product name in the manifest and visible extension UI with the approved store identity, or intentionally document why the installed name differs.
4. Ensure the local-storage and no-upload claims still match every code path in the submitted package.
5. Describe the one-time `Allow user scripts` setup accurately and show it during onboarding or in a supporting screenshot if users regularly miss it.
6. Avoid claims of automatic price comparison, support for every website, or actions the extension cannot reliably perform.
7. Confirm that privacy disclosures match the requested permissions and actual data handling.

The Chrome Web Store requires listing metadata and screenshots to remain accurate and current; see the [listing requirements](https://developer.chrome.com/docs/webstore/program-policies/listing-requirements).

## Success Criteria

- A non-technical user can explain the product's purpose after seeing the first screenshot and summary.
- The first four screenshots show real outcomes from features present in the submitted version.
- The listing avoids unexplained developer terminology in its primary message.
- Setup, local storage, restrictions, and the risk of untrusted custom tools are disclosed clearly.
- The listing, manifest identity, screenshots, and submitted functionality do not contradict one another.
