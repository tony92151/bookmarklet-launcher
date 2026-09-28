const translations = {
  en: {
    documentTitle: 'Bookmarklet Script Manager', brandName: 'Script Manager', version: 'Version',
    language: 'Language', testPage: 'Test this page', testing: 'Testing…',
    setupSummary: 'User scripts are off — show setup', setupTitle: 'Allow user scripts is optional',
    setupDescription: 'Saved scripts can run without it on some websites. If a website blocks the alternate method, enable "Allow user scripts" in this extension\'s Details page at chrome://extensions. Choose "I\'ll enable it later" to test the current page.',
    setupReload: 'Already enabled but still seeing this? Click "Reload" on the extension card, or restart the browser.',
    setupSafety: 'Custom scripts can read and change this page. Only run scripts you trust.',
    openExtensions: 'Open Extensions Page', recheck: "I've enabled it — recheck", defer: "I'll enable it later",
    savedScripts: 'Saved scripts', runOnTab: 'RUN ON THIS TAB', collectionStarts: 'Your collection starts here',
    addToLaunch: 'Add a script to launch it on the current tab.', addFirst: 'Add First Script', manage: 'Manage Scripts',
    runScriptTitle: 'Click to execute in current tab', preferenceError: 'Could not save this preference. It may reset when you reopen the popup.',
    blobBlocked: 'This page blocked the alternate script method. Enable Allow user scripts and try again.',
    scriptFailed: 'The alternate method could not run this script. Check the script or enable Allow user scripts.',
    noActiveTab: 'No active tab found.', restrictedPage: 'Cannot execute on this page (restricted pages like chrome://).',
    chromeApiError: 'Chrome could not execute the script. Try reloading the page and extension.',
    invalidScript: 'The saved script is invalid.', executionFailed: 'Execution failed: {code}',
    probePassed: 'Basic test passed on this page. Some bookmarklets may still fail.',
    probeBlobBlocked: 'This page blocked the test script. Its security settings may prevent this method.',
    probeNoSignal: 'The test script did not run on this page.',
    probeRestricted: 'This browser page does not allow extensions to run scripts.',
    probeNoTab: 'No active tab found to test.', probeFailed: 'Could not test this page. Try a regular website.',
    workspace: 'YOUR WORKSPACE', heroTitle: 'Make the web work for you.',
    heroDescription: 'Keep your favorite scripts in one place, then run them from the extension on any supported page.',
    editor: 'EDITOR', addScript: 'Add Script', editScript: 'Edit Script', scriptName: 'Script name',
    scriptNameExample: 'e.g., C1 Shopping Trips', inputFormat: 'Input format', rawJavaScript: 'Raw JavaScript',
    encodedBookmarklet: 'Encoded bookmarklet', formatHint: 'Choose the format of the code you paste below.',
    scriptCode: 'Script code', save: 'Save', update: 'Update', cancel: 'Cancel', library: 'LIBRARY',
    libraryDescription: 'Pick a script in the extension popup to run it on your current tab.',
    noScripts: 'No scripts saved yet', addUsingEditor: 'Add your first script using the editor.',
    scriptSafetyLabel: 'Script safety', safetyTitle: 'Run scripts you trust.',
    safetyDescription: 'Custom scripts can read and change the page where they run.',
    privacy: 'Privacy Policy', edit: 'Edit', delete: 'Delete', deleteConfirm: 'Delete "{name}"?',
    updated: 'Updated.', saved: 'Saved.', decodedSaved: 'Decoded bookmarklet and saved.',
    emptyCode: 'Code cannot be empty.', malformedEncoding: 'Unable to decode bookmarklet: malformed percent encoding.',
    addScriptMethod: 'Add script method', manual: 'Manual', githubFileUrl: 'GitHub JavaScript file URL',
    githubCopyHint: 'Save a one-time local copy of a public .js file.', githubLoading: 'Loading GitHub file…',
    githubSaved: 'Saved a local copy.', githubInvalidLink: 'Enter a GitHub link to a .js file.',
    githubConnectionError: 'Unable to load the GitHub file. Check your connection and try again.',
    githubHttpError: 'Unable to load the GitHub file (HTTP {status}).', githubEmptyFile: 'The GitHub file is empty.',
    updatedAt: 'Updated {date}', updatedTimeUnavailable: 'Updated time unavailable',
  },
  'zh-TW': {
    documentTitle: '書籤指令碼管理器', brandName: '指令碼管理器', version: '版本',
    language: '語言', testPage: '測試此頁面', testing: '測試中…',
    setupSummary: '使用者指令碼尚未啟用 — 查看設定', setupTitle: '啟用使用者指令碼是選擇性的',
    setupDescription: '在部分網站上，即使未啟用此功能，已儲存的指令碼仍可執行。若網站封鎖替代執行方式，請到 chrome://extensions 中此擴充功能的詳細資料頁，啟用「允許使用者指令碼」。選擇「稍後再啟用」即可測試目前頁面。',
    setupReload: '已啟用卻仍看到此提示？請在擴充功能卡片上按「重新載入」，或重新啟動瀏覽器。',
    setupSafety: '自訂指令碼可以讀取及變更此頁面。請只執行您信任的指令碼。',
    openExtensions: '開啟擴充功能頁面', recheck: '已啟用 — 重新檢查', defer: '稍後再啟用',
    savedScripts: '已儲存的指令碼', runOnTab: '在目前分頁執行', collectionStarts: '從這裡開始收藏',
    addToLaunch: '新增指令碼，即可在目前分頁執行。', addFirst: '新增第一個指令碼', manage: '管理指令碼',
    runScriptTitle: '按一下即可在目前分頁執行', preferenceError: '無法儲存此偏好設定。重新開啟視窗後可能會重設。',
    blobBlocked: '此頁面封鎖了替代執行方式。請啟用「允許使用者指令碼」後重試。',
    scriptFailed: '替代執行方式無法執行此指令碼。請檢查指令碼，或啟用「允許使用者指令碼」。',
    noActiveTab: '找不到使用中的分頁。', restrictedPage: '無法在此頁面執行（例如 chrome:// 等受限制頁面）。',
    chromeApiError: 'Chrome 無法執行指令碼。請重新載入頁面與擴充功能後重試。',
    invalidScript: '儲存的指令碼無效。', executionFailed: '執行失敗：{code}',
    probePassed: '此頁面的基本測試通過，但部分書籤指令碼仍可能無法執行。',
    probeBlobBlocked: '此頁面封鎖了測試指令碼，其安全設定可能不允許此方式。',
    probeNoSignal: '測試指令碼未在此頁面執行。',
    probeRestricted: '此瀏覽器頁面不允許擴充功能執行指令碼。',
    probeNoTab: '找不到可測試的使用中分頁。', probeFailed: '無法測試此頁面。請改用一般網站。',
    workspace: '您的工作區', heroTitle: '讓網頁依您的方式運作。',
    heroDescription: '將常用指令碼集中管理，再從擴充功能於支援的頁面上執行。',
    editor: '編輯器', addScript: '新增指令碼', editScript: '編輯指令碼', scriptName: '指令碼名稱',
    scriptNameExample: '例如：C1 購物回饋', inputFormat: '輸入格式', rawJavaScript: '原始 JavaScript',
    encodedBookmarklet: '編碼後的書籤指令碼', formatHint: '選擇下方貼上程式碼的格式。',
    scriptCode: '指令碼內容', save: '儲存', update: '更新', cancel: '取消', library: '指令碼庫',
    libraryDescription: '在擴充功能的彈出視窗選擇指令碼，即可於目前分頁執行。',
    noScripts: '尚未儲存指令碼', addUsingEditor: '使用編輯器新增第一個指令碼。',
    scriptSafetyLabel: '指令碼安全', safetyTitle: '只執行您信任的指令碼。',
    safetyDescription: '自訂指令碼可以讀取及變更其執行頁面。',
    privacy: '隱私權政策', edit: '編輯', delete: '刪除', deleteConfirm: '刪除「{name}」？',
    updated: '已更新。', saved: '已儲存。', decodedSaved: '已解碼並儲存書籤指令碼。',
    emptyCode: '指令碼內容不可為空。', malformedEncoding: '無法解碼書籤指令碼：百分比編碼格式錯誤。',
    addScriptMethod: '新增指令碼方式', manual: '手動輸入', githubFileUrl: 'GitHub JavaScript 檔案網址',
    githubCopyHint: '儲存公開 .js 檔案的一次性本機副本。', githubLoading: '正在載入 GitHub 檔案…',
    githubSaved: '已儲存本機副本。', githubInvalidLink: '請輸入 GitHub .js 檔案連結。',
    githubConnectionError: '無法載入 GitHub 檔案。請檢查網路連線後重試。',
    githubHttpError: '無法載入 GitHub 檔案（HTTP {status}）。', githubEmptyFile: 'GitHub 檔案是空的。',
    updatedAt: '更新時間：{date}', updatedTimeUnavailable: '無法取得更新時間',
  },
};

export function createLanguageController({ document, navigator, storage, onChange = () => {} }) {
  let language = 'en';
  const t = (key, values = {}) => (translations[language][key] || translations.en[key] || key)
    .replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));

  function render() {
    document.documentElement.lang = language;
    document.title = t('documentTitle');
    document.querySelectorAll('[data-i18n]').forEach((element) => { element.textContent = t(element.dataset.i18n); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => { element.placeholder = t(element.dataset.i18nPlaceholder); });
    document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
      element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
    });
    document.querySelectorAll('[data-language]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
    onChange();
  }

  async function initialize() {
    try {
      const saved = (await storage.get('language')).language;
      language = saved === 'en' || saved === 'zh-TW' ? saved : undefined;
    } catch {
      language = undefined;
    }
    language ||= navigator?.language?.toLowerCase().startsWith('zh') ? 'zh-TW' : 'en';
    render();
  }

  async function setLanguage(next) {
    if (next !== 'en' && next !== 'zh-TW') return;
    language = next;
    render();
    try { await storage.set({ language }); } catch { /* Keep the selection for this page. */ }
  }

  return { initialize, setLanguage, t, get language() { return language; } };
}
