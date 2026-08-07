(() => {
  'use strict';

  const getLanguage = () => document.documentElement.lang === 'zh-TW' ? 'zh-TW' : 'en';

  const copyLabels = {
    en: {
      button: 'Copy bookmark format',
      copied: 'Direct bookmark format copied.',
      failed: 'Clipboard access was unavailable. Use the manual copy dialog.',
      title: 'Copy direct bookmark format',
      description: 'Copy the complete encoded value below and paste it into the bookmark URL field.'
    },
    'zh-TW': {
      button: '複製直接書籤格式',
      copied: '已複製直接書籤格式。',
      failed: '無法使用剪貼簿，請在手動複製視窗中複製。',
      title: '複製直接書籤格式',
      description: '複製下方完整編碼內容，並貼到書籤的網址欄位。'
    }
  };

  const setMessage = (card, message, kind = '') => {
    const node = card.querySelector('[data-role="message"]');
    if (!node) return;
    node.textContent = message;
    node.classList.remove('is-success', 'is-error');
    if (kind) node.classList.add(`is-${kind}`);
  };

  const encodeInstallLink = (link) => {
    if (!window.BookmarkletConverter) return;
    const raw = link.getAttribute('href') || '';
    if (!raw.toLowerCase().startsWith('javascript:')) return;

    const encoded = window.BookmarkletConverter.toBookmarkletUrl(raw);
    if (raw !== encoded) link.setAttribute('href', encoded);
  };

  const refresh = () => {
    const language = getLanguage();
    document.querySelectorAll('[data-role="install"]').forEach(encodeInstallLink);
    document.querySelectorAll('[data-role="copy"]').forEach((button) => {
      button.textContent = copyLabels[language].button;
    });

    const title = document.querySelector('#copy-dialog-title');
    const description = document.querySelector('#copy-dialog [data-i18n="manualCopyDescription"]');
    if (title) title.textContent = copyLabels[language].title;
    if (description) description.textContent = copyLabels[language].description;
  };

  const openManualCopyDialog = (value) => {
    const textarea = document.getElementById('copy-textarea');
    const dialog = document.getElementById('copy-dialog');
    if (!textarea || !dialog) return;

    textarea.value = value;
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.select();
      });
    } else {
      window.prompt(copyLabels[getLanguage()].description, value);
    }
  };

  document.addEventListener('click', async (event) => {
    const button = event.target.closest?.('[data-role="copy"]');
    if (!button || button.disabled) return;

    const card = button.closest('.bookmarklet-card');
    const link = card?.querySelector('[data-role="install"]');
    if (!card || !link) return;

    encodeInstallLink(link);
    const value = link.getAttribute('href') || '';
    if (!value.toLowerCase().startsWith('javascript:')) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const labels = copyLabels[getLanguage()];
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(value);
      setMessage(card, labels.copied, 'success');
    } catch (error) {
      console.warn('[Bookmarklet Launcher] Clipboard fallback:', error);
      setMessage(card, labels.failed, 'error');
      openManualCopyDialog(value);
    }
  }, true);

  const observer = new MutationObserver(refresh);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['lang'],
    childList: true,
    subtree: true
  });

  refresh();
})();
