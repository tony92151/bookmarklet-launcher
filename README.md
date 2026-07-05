# Bookmarklet Manager

Bookmarklet Manager 是一個 Manifest V3 Chrome/Edge 擴充功能,用來集中管理自己的書籤腳本。你可以貼上 `javascript:` bookmarklet 或原始 JavaScript,之後從工具列 popup 點一下就在目前分頁執行,效果接近傳統瀏覽器書籤腳本。

專案目前沒有 build step、沒有外部套件,直接以未封裝擴充功能載入即可使用。

## 功能

- 新增、編輯、刪除自訂腳本
- 支援 `javascript:` bookmarklet 與原始 JavaScript
- 自動移除 `javascript:` 前綴並嘗試解碼 URI 百分比編碼
- 使用 `chrome.storage.local` 儲存腳本,可放較大的 bookmarklet 範例
- 使用 `chrome.userScripts.execute` 在目前分頁的 `MAIN` world 執行
- 在 `chrome://`、`edge://`、`about:`、擴充功能頁等受限頁面會阻擋執行
- 未啟用「允許使用者腳本」時,popup 會顯示設定提示

## 環境需求

- Chrome 135+ 或相容的 Chromium 瀏覽器
- Manifest V3 擴充功能支援
- 需手動啟用本擴充功能的 **Allow user scripts / 允許使用者腳本**

## 安裝

1. 開啟 `chrome://extensions`。Edge 可開啟 `edge://extensions`。
2. 右上角開啟 **開發人員模式**。
3. 點 **載入未封裝項目**。
4. 選擇本 repo 資料夾。

## 一次性設定:啟用使用者腳本

本擴充功能透過 Chrome 的 `userScripts` API 執行自訂腳本。這個 API 是瀏覽器專門為使用者自訂腳本設計的機制,較接近 bookmarklet 行為,但需要手動開啟權限。

1. 在 `chrome://extensions` 找到 **Bookmarklet Manager**。
2. 點 **詳細資料**。
3. 開啟 **允許使用者腳本 (Allow user scripts)**。
4. 若 popup 仍提示尚未啟用,請在擴充功能卡片按一次 **重新載入**,或重啟瀏覽器。

## 使用方式

1. 點工具列上的 Bookmarklet Manager 圖示。
2. 點 **管理腳本** 開啟選項頁。
3. 輸入腳本名稱,貼上 `javascript:` bookmarklet 或原始 JavaScript。
4. 按 **儲存**。
5. 回到目標網頁,打開 popup 並點選腳本名稱,即可在目前分頁執行。

範例輸入:

```js
alert(document.title)
```

或:

```js
javascript:(()=>alert(document.title))();
```

repo 內的 `c1_*.txt` 是較大型 bookmarklet 測試資料,可用來驗證儲存與解碼流程。

## 開發

這是純前端擴充功能專案,不需要安裝依賴。

修改程式後:

1. 回到 `chrome://extensions`。
2. 在 Bookmarklet Manager 卡片按 **重新載入**。
3. 重新打開 popup 或 options page 測試。

若要檢查 manifest JSON 格式:

```sh
python3 -m json.tool manifest.json
```

## 檔案結構

```text
manifest.json      MV3 manifest、權限、popup、options page 設定
background.js      service worker fallback,可呼叫 userScripts.execute
popup.html/css/js  工具列 popup:顯示腳本清單、檢查設定、執行腳本
options.html/css/js 管理頁:新增、編輯、刪除腳本
lib/decode.js      將 bookmarklet 輸入正規化成原始 JavaScript
lib/storage.js     chrome.storage.local 腳本讀寫封裝
icons/             擴充功能圖示
c1_*.txt           bookmarklet 測試資料
```

## 安全性與限制

本工具的核心功能就是執行你貼上的 JavaScript。請只儲存並執行你信任、看得懂來源的腳本。

- 不載入外部來源腳本
- 不會把腳本傳到遠端服務
- 腳本資料存在瀏覽器本機的 `chrome.storage.local`
- `userScripts` 權限未啟用時不會執行腳本
- 受瀏覽器限制,不能在 `chrome://`、`edge://`、`about:`、`devtools:` 或擴充功能頁執行

## 授權

MIT
