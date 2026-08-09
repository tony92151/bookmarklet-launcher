import { toBookmarkletUrl } from '../../shared/bookmarklet.js';

(() => {
  'use strict';

  const STORAGE_KEY = 'bookmarklet-launcher-language';
  const SUPPORTED_LANGUAGES = ['en', 'zh-TW'];
  const state = {
    language: 'en',
    records: [],
    cards: new Map()
  };

  const translations = {
    en: {
      documentTitle: 'Bookmarklet Launcher — Install browser tools',
      github: 'GitHub',
      extension: 'Extension',
      eyebrow: 'No extension required',
      heroTitle: 'Add useful tools to your bookmarks bar',
      heroDescription: 'Drag an install button to your bookmarks bar, right-click it to add a bookmark, or copy the code manually.',
      browse: 'Browse bookmarklets',
      installExtension: 'Install Bookmarklet Manager',
      securityTitle: 'Security:',
      securityText: 'Only install scripts you trust and understand.',
      catalogEyebrow: 'Available tools',
      catalogTitle: 'Bookmarklets',
      catalogDescription: 'Each tool runs locally in the page you are viewing.',
      footerText: 'Scripts run locally in your current page and are not sent to a remote service.',
      source: 'Source',
      license: 'License',
      manualCopyTitle: 'Copy bookmarklet code',
      manualCopyDescription: 'Copy the complete text below, create a new bookmark, and paste it into the bookmark URL field.',
      selectAll: 'Select all',
      close: 'Close',
      loadingCatalog: 'Loading bookmarklets…',
      catalogError: 'Unable to load the bookmarklet catalog.',
      retry: 'Retry',
      empty: 'No bookmarklets are available yet.',
      loading: 'Loading',
      ready: 'Ready',
      unavailable: 'Unavailable',
      worksOn: 'Works on',
      installHint: 'Drag this button to the bookmarks bar, or right-click it and add the link as a bookmark.',
      copyCode: 'Copy code',
      viewSource: 'View source',
      installPrefix: 'Install',
      clickInstructions: 'To install this bookmarklet, drag the button to your bookmarks bar, right-click it to add a bookmark, or use Copy code.',
      copied: 'Bookmarklet code copied.',
      copyFailed: 'Clipboard access was unavailable. Use the manual copy dialog.',
      scriptError: 'The script could not be loaded. Installation controls are disabled.',
      stepOne: 'Install the bookmarklet using drag, right-click, or copy.',
      stepTwo: 'Open a supported webpage.',
      stepThree: 'Click the bookmark to run the tool.',
      version: 'Version',
      updated: 'Updated'
    },
    'zh-TW': {
      documentTitle: 'Bookmarklet Launcher — 安裝瀏覽器工具',
      github: 'GitHub',
      extension: '擴充功能',
      eyebrow: '不需安裝擴充功能',
      heroTitle: '把實用工具加入你的書籤列',
      heroDescription: '將安裝按鈕拖到書籤列、按右鍵加入書籤，或手動複製程式碼。',
      browse: '瀏覽書籤工具',
      installExtension: '安裝 Bookmarklet Manager',
      securityTitle: '安全提醒：',
      securityText: '只安裝你信任且了解用途的腳本。',
      catalogEyebrow: '可用工具',
      catalogTitle: '書籤工具',
      catalogDescription: '每個工具都只會在你目前瀏覽的頁面中執行。',
      footerText: '腳本只在目前頁面本機執行，不會傳送到遠端服務。',
      source: '原始碼',
      license: '授權條款',
      manualCopyTitle: '複製書籤程式碼',
      manualCopyDescription: '複製下方完整文字，建立新書籤後貼到書籤網址欄位。',
      selectAll: '全選',
      close: '關閉',
      loadingCatalog: '正在載入書籤工具…',
      catalogError: '無法載入書籤工具清單。',
      retry: '重試',
      empty: '目前還沒有可用的書籤工具。',
      loading: '載入中',
      ready: '可安裝',
      unavailable: '無法使用',
      worksOn: '適用網站',
      installHint: '將這個按鈕拖到書籤列，或按右鍵並把連結加入書籤。',
      copyCode: '複製程式碼',
      viewSource: '查看原始碼',
      installPrefix: '安裝',
      clickInstructions: '請將按鈕拖到書籤列、按右鍵加入書籤，或使用「複製程式碼」安裝。',
      copied: '已複製書籤程式碼。',
      copyFailed: '無法使用剪貼簿，請在手動複製視窗中複製。',
      scriptError: '無法載入腳本，安裝與複製功能已停用。',
      stepOne: '使用拖曳、右鍵或複製方式安裝書籤工具。',
      stepTwo: '開啟支援的網頁。',
      stepThree: '點擊書籤執行工具。',
      version: '版本',
      updated: '更新日期'
    }
  };

  const elements = {
    list: document.getElementById('bookmarklet-list'),
    catalogStatus: document.getElementById('catalog-status'),
    template: document.getElementById('bookmarklet-card-template'),
    dialog: document.getElementById('copy-dialog'),
    textarea: document.getElementById('copy-textarea'),
    selectButton: document.getElementById('select-code-button'),
    languageButtons: [...document.querySelectorAll('[data-language]')]
  };

  const t = (key) => translations[state.language][key] || translations.en[key] || key;

  const localized = (value) => {
    if (!value || typeof value !== 'object') return '';
    return value[state.language] || value.en || Object.values(value).find((item) => typeof item === 'string') || '';
  };

  const detectLanguage = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED_LANGUAGES.includes(saved)) return saved;
    return navigator.language?.toLowerCase().startsWith('zh') ? 'zh-TW' : 'en';
  };

  const setMessage = (element, message, kind = '') => {
    element.textContent = message;
    element.classList.remove('is-success', 'is-error');
    if (kind) element.classList.add(`is-${kind}`);
  };

  const applyStaticTranslations = () => {
    document.documentElement.lang = state.language;
    document.title = t('documentTitle');

    document.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });

    elements.languageButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.language === state.language));
    });
  };

  const refreshDynamicTranslations = () => {
    state.cards.forEach((cardState) => {
      const { record, nodes, loaded, failed } = cardState;
      nodes.name.textContent = localized(record.name);
      nodes.description.textContent = localized(record.description);
      nodes.install.textContent = `${t('installPrefix')} ${localized(record.name)}`;
      nodes.copy.textContent = t('copyCode');
      nodes.source.textContent = t('viewSource');
      nodes.worksOn.textContent = t('worksOn');
      nodes.installHint.textContent = t('installHint');
      nodes.steps[0].textContent = t('stepOne');
      nodes.steps[1].textContent = t('stepTwo');
      nodes.steps[2].textContent = t('stepThree');
      nodes.version.textContent = [
        record.version ? `${t('version')} ${record.version}` : '',
        record.updated ? `${t('updated')} ${record.updated}` : ''
      ].filter(Boolean).join(' · ');

      if (failed) {
        nodes.state.textContent = t('unavailable');
        setMessage(nodes.message, t('scriptError'), 'error');
      } else if (loaded) {
        nodes.state.textContent = t('ready');
      } else {
        nodes.state.textContent = t('loading');
      }
    });
  };

  const setLanguage = (language) => {
    if (!SUPPORTED_LANGUAGES.includes(language)) return;
    state.language = language;
    localStorage.setItem(STORAGE_KEY, language);
    applyStaticTranslations();
    refreshDynamicTranslations();
  };

  const isSafeSourcePath = (source) => {
    if (typeof source !== 'string' || !source.trim()) return false;
    if (/^(?:[a-z]+:)?\/\//i.test(source)) return false;
    if (/^(?:data|javascript):/i.test(source)) return false;

    try {
      const sourceRoot = new URL('../bookmarklets/', location.href);
      const resolved = new URL(source, location.href);
      return resolved.origin === sourceRoot.origin && resolved.href.startsWith(sourceRoot.href);
    } catch {
      return false;
    }
  };

  const isValidRecord = (record) => {
    return Boolean(
      record &&
      typeof record.id === 'string' && record.id.trim() &&
      record.name && typeof record.name === 'object' &&
      record.description && typeof record.description === 'object' &&
      isSafeSourcePath(record.source) &&
      Array.isArray(record.matches) && record.matches.every((match) => typeof match === 'string')
    );
  };

  const openManualCopyDialog = (bookmarkletUrl) => {
    elements.textarea.value = bookmarkletUrl;
    if (typeof elements.dialog.showModal === 'function') {
      elements.dialog.showModal();
      requestAnimationFrame(() => {
        elements.textarea.focus();
        elements.textarea.select();
      });
    } else {
      window.prompt(t('manualCopyDescription'), bookmarkletUrl);
    }
  };

  const copyBookmarklet = async (cardState) => {
    if (!cardState.bookmarkletUrl) return;

    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(cardState.bookmarkletUrl);
      setMessage(cardState.nodes.message, t('copied'), 'success');
    } catch (error) {
      console.warn('[Bookmarklet Launcher] Clipboard fallback:', error);
      setMessage(cardState.nodes.message, t('copyFailed'), 'error');
      openManualCopyDialog(cardState.bookmarkletUrl);
    }
  };

  const renderCard = (record) => {
    const fragment = elements.template.content.cloneNode(true);
    const card = fragment.querySelector('.bookmarklet-card');
    const nodes = {
      name: card.querySelector('[data-role="name"]'),
      description: card.querySelector('[data-role="description"]'),
      version: card.querySelector('[data-role="version"]'),
      state: card.querySelector('[data-role="state"]'),
      matches: card.querySelector('[data-role="matches"]'),
      install: card.querySelector('[data-role="install"]'),
      copy: card.querySelector('[data-role="copy"]'),
      source: card.querySelector('[data-role="source"]'),
      message: card.querySelector('[data-role="message"]'),
      worksOn: card.querySelector('[data-i18n-dynamic="worksOn"]'),
      installHint: card.querySelector('[data-i18n-dynamic="installHint"]'),
      steps: [...card.querySelectorAll('.usage-list li')]
    };

    record.matches.forEach((match) => {
      const pattern = document.createElement('code');
      pattern.className = 'pattern';
      pattern.textContent = match;
      nodes.matches.appendChild(pattern);
    });

    const sourceUrl = new URL(record.source, new URL('.', location.href));
    nodes.source.href = sourceUrl.href;

    const cardState = {
      record,
      nodes,
      bookmarkletUrl: '',
      loaded: false,
      failed: false
    };

    nodes.install.addEventListener('click', (event) => {
      event.preventDefault();
      if (!cardState.loaded) return;
      setMessage(nodes.message, t('clickInstructions'));
    });

    nodes.copy.addEventListener('click', () => copyBookmarklet(cardState));

    state.cards.set(record.id, cardState);
    elements.list.appendChild(fragment);
    refreshDynamicTranslations();
    return cardState;
  };

  const loadScriptForCard = async (cardState) => {
    try {
      const response = await fetch(cardState.record.source, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const source = (await response.text()).replace(/^\uFEFF/, '');
      if (!source.trim()) throw new Error('Empty script');

      cardState.bookmarkletUrl = toBookmarkletUrl(source);
      cardState.loaded = true;
      cardState.nodes.install.href = cardState.bookmarkletUrl;
      cardState.nodes.install.classList.remove('is-loading');
      cardState.nodes.install.setAttribute('aria-disabled', 'false');
      cardState.nodes.copy.disabled = false;
      cardState.nodes.state.textContent = t('ready');
    } catch (error) {
      cardState.failed = true;
      cardState.nodes.install.removeAttribute('href');
      cardState.nodes.install.setAttribute('aria-disabled', 'true');
      cardState.nodes.copy.disabled = true;
      cardState.nodes.state.textContent = t('unavailable');
      setMessage(cardState.nodes.message, t('scriptError'), 'error');
      console.error(`[Bookmarklet Launcher] Failed to load ${cardState.record.source}:`, error);
    }
  };

  const renderCatalogError = () => {
    elements.list.replaceChildren();
    elements.list.setAttribute('aria-busy', 'false');
    elements.catalogStatus.replaceChildren();

    const message = document.createElement('span');
    message.textContent = t('catalogError');
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'secondary-button retry-button';
    retry.textContent = t('retry');
    retry.addEventListener('click', loadCatalog);

    elements.catalogStatus.append(message, document.createElement('br'), retry);
  };

  const loadCatalog = async () => {
    state.cards.clear();
    elements.list.replaceChildren();
    elements.list.setAttribute('aria-busy', 'true');
    elements.catalogStatus.textContent = t('loadingCatalog');

    try {
      const response = await fetch('../bookmarklets/catalog.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data || !Array.isArray(data.bookmarklets)) throw new Error('Invalid catalog shape');

      const validRecords = data.bookmarklets.filter((record) => {
        const valid = isValidRecord(record);
        if (!valid) console.warn('[Bookmarklet Launcher] Skipping invalid record:', record);
        return valid;
      });

      state.records = validRecords;
      elements.catalogStatus.textContent = '';

      if (validRecords.length === 0) {
        elements.list.setAttribute('aria-busy', 'false');
        elements.catalogStatus.textContent = t('empty');
        return;
      }

      const cardStates = validRecords.map(renderCard);
      await Promise.allSettled(cardStates.map(loadScriptForCard));
      elements.list.setAttribute('aria-busy', 'false');
    } catch (error) {
      console.error('[Bookmarklet Launcher] Catalog load failed:', error);
      renderCatalogError();
    }
  };

  elements.languageButtons.forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.language));
  });

  elements.selectButton.addEventListener('click', () => {
    elements.textarea.focus();
    elements.textarea.select();
  });

  state.language = detectLanguage();
  applyStaticTranslations();
  loadCatalog();
})();
