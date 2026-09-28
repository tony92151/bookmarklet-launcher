import assert from 'node:assert/strict';
import test from 'node:test';
import { createLanguageController } from '../../extension/language.js';

function page() {
  const title = { dataset: { i18n: 'savedScripts' }, textContent: 'Saved scripts' };
  const placeholder = { dataset: { i18nPlaceholder: 'scriptNameExample' }, placeholder: '' };
  const en = { dataset: { language: 'en' }, attributes: {}, setAttribute(key, value) { this.attributes[key] = value; } };
  const zh = { dataset: { language: 'zh-TW' }, attributes: {}, setAttribute(key, value) { this.attributes[key] = value; } };
  const document = {
    documentElement: { lang: 'en' },
    querySelectorAll(selector) {
      return {
        '[data-i18n]': [title],
        '[data-i18n-placeholder]': [placeholder],
        '[data-language]': [en, zh],
      }[selector] || [];
    },
  };
  return { document, title, placeholder, en, zh };
}

test('uses browser Chinese on first visit and updates visible text and pressed buttons', async () => {
  const ui = page();
  const controller = createLanguageController({
    document: ui.document,
    navigator: { language: 'zh-TW' },
    storage: { async get() { return {}; }, async set() {} },
  });

  await controller.initialize();

  assert.equal(ui.document.documentElement.lang, 'zh-TW');
  assert.equal(ui.title.textContent, '已儲存的指令碼');
  assert.equal(ui.placeholder.placeholder, '例如：C1 購物回饋');
  assert.equal(ui.en.attributes['aria-pressed'], 'false');
  assert.equal(ui.zh.attributes['aria-pressed'], 'true');
});

test('saved language wins over browser language and switching persists across pages', async () => {
  const preferences = { language: 'en' };
  const storage = {
    async get() { return { language: preferences.language }; },
    async set(value) { Object.assign(preferences, value); },
  };
  const first = page();
  const controller = createLanguageController({ document: first.document, navigator: { language: 'zh-TW' }, storage });
  await controller.initialize();
  assert.equal(first.title.textContent, 'Saved scripts');

  await controller.setLanguage('zh-TW');
  const second = page();
  const otherPage = createLanguageController({ document: second.document, navigator: { language: 'en-US' }, storage });
  await otherPage.initialize();

  assert.equal(preferences.language, 'zh-TW');
  assert.equal(second.title.textContent, '已儲存的指令碼');
});
