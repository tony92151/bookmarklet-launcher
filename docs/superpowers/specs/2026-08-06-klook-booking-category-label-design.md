# Klook 訂單分類標籤設計

## 目標

建立一個可由 Bookmarklet Manager 執行的 JavaScript 書籤腳本，僅在 `https://www.klook.com/zh-TW/bookings/` 頁面中，替每筆訂單標題右側顯示可讀的訂單分類標籤。

## 顯示結果

原始圖片檔名若為：

`category_experiences_l1_culture_experience_48.png`

頁面上顯示：

`Culture Experience`

標籤放在訂單標題右側；滑鼠移到標籤時，透過 `title` 顯示完整、未含副檔名的原始分類字串：

`category_experiences_l1_culture_experience_48`

## 執行範圍

腳本只允許在下列頁面執行：

`https://www.klook.com/zh-TW/bookings/`

允許網址帶 query string 或 hash。若網域或 pathname 不符，停止執行並以 `alert()` 告知使用者應前往正確頁面。

## DOM 資料來源

每筆訂單以 `.booking-item` 為處理單位。

在訂單卡片內尋找：

`.booking-item_icon img`

從該圖片的 `src` URL 取得最後一段檔名，移除 query string、hash 與副檔名後，得到原始分類字串。

## 分類字串轉換

依序進行：

1. 移除副檔名。
2. 移除已知前綴 `category_experiences_l1_`。
3. 移除尾端數字編號，例如 `_48`。
4. 將底線 `_` 轉為空格。
5. 將每個單字首字母轉為大寫。

範例：

`category_experiences_l1_culture_experience_48` → `Culture Experience`

若檔名不符合完整格式，但仍可取得非空字串，則採容錯處理：保留可解析部分、將底線轉空格並套用首字母大寫。若無法取得有效分類，略過該訂單，不中止其他訂單處理。

## 標題定位與插入

每張 `.booking-item` 內，以可見的主要標題元素為目標。實作時優先使用 Klook 訂單卡片內的標題選取器；若選取器因小幅改版失效，允許使用防禦性 fallback，在 `.booking-content` 中尋找第一個符合標題特徵的元素。

標籤以 `span` 插入標題文字右側，並包含專用 class：

`klook-booking-category-label`

標籤應：

- 與標題保持小間距。
- 使用小型圓角膠囊樣式。
- 不遮擋原始操作按鈕。
- 可隨標題換行。
- 使用 `title` 保存原始分類字串。

## 重複執行與動態載入

每張訂單在成功處理後加入標記 attribute：

`data-klook-category-labeled="true"`

再次執行腳本時，不得重複加入標籤。

Klook 頁面可能動態載入或切換訂單分頁，因此腳本需建立 `MutationObserver`，監看訂單列表容器中新加入的節點，並再次掃描尚未處理的 `.booking-item`。

為避免重複建立 observer，將 observer 狀態保存在 `window` 上的唯一 key。再次執行時，先停止舊 observer，再建立新的 observer。

## 使用者回饋與錯誤處理

- 網址不符：以 `alert()` 顯示正確頁面網址。
- 找不到訂單列表或訂單：以 `alert()` 告知目前畫面沒有可處理的訂單，或頁面結構可能已變更。
- 成功：在頁面右下角顯示短暫 toast，內容包含本次新增的標籤數量。
- 單筆訂單解析失敗：只在 `console.warn()` 記錄，不影響其他訂單。
- 所有程式碼包在 IIFE 中，不使用 module 或 `chrome.*` API。

## 檔案

建立：

`scripts/klook-booking-category-label.js`

內容為可直接貼入 Bookmarklet Manager 的原始 JavaScript，不加 `javascript:` 前綴，也不做 URL 百分比編碼。

## 驗收條件

1. 在指定 Klook 訂單頁執行後，每筆可解析訂單的標題右側出現分類標籤。
2. 範例分類顯示為 `Culture Experience`。
3. 滑鼠移到標籤可看到原始分類字串。
4. 重複執行不會產生重複標籤。
5. 動態載入的新訂單也會自動補上標籤。
6. 在其他頁面執行時不修改 DOM，並顯示錯誤提示。
7. 任一訂單缺少圖片或標題時，不會造成整段腳本中止。
