import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('privacy policy discloses local storage, no transfer, permissions, and support', async () => {
  const policy = await readFile('site/privacy.html', 'utf8');

  for (const phrase of ['chrome.storage.local', 'not sent', 'activeTab', 'storage', 'userScripts', 'GitHub Issues']) {
    assert.match(policy, new RegExp(phrase, 'i'));
  }

  assert.match(policy, /自訂指令碼/);
});

test('privacy policy distinguishes developer behavior from user-script behavior in both languages', async () => {
  const policy = await readFile('site/privacy.html', 'utf8');

  assert.match(
    policy,
    /extension itself does not send scripts, page content, browsing data, or personal information to the developer or other third parties/i,
  );
  assert.match(
    policy,
    /custom scripts run in the page's <code>MAIN<\/code> world[\s\S]*may communicate with external services/i,
  );
  assert.match(
    policy,
    /擴充功能本身不會將指令碼、網頁內容、瀏覽資料或個人資訊傳送給開發者或其他第三方/,
  );
  assert.match(
    policy,
    /自訂指令碼會在網頁的 <code>MAIN<\/code> world 中執行[\s\S]*也可能與外部服務通訊/,
  );
});
