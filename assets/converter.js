(() => {
  'use strict';

  const input = document.getElementById('converter-input');
  const output = document.getElementById('converter-output');
  const status = document.getElementById('converter-status');
  const encodeButton = document.getElementById('encode-button');
  const decodeButton = document.getElementById('decode-button');
  const copyButton = document.getElementById('copy-output-button');
  const clearButton = document.getElementById('clear-button');

  const setStatus = (message, kind = '') => {
    status.textContent = message;
    status.classList.remove('is-success', 'is-error');
    if (kind) status.classList.add(`is-${kind}`);
  };

  const setOutput = (value) => {
    output.value = value;
    copyButton.disabled = !value;
  };

  encodeButton.addEventListener('click', () => {
    if (!input.value) {
      setStatus('Paste JavaScript before encoding.', 'error');
      return;
    }

    setOutput(window.BookmarkletConverter.toBookmarkletUrl(input.value));
    setStatus('Bookmarklet URL created.', 'success');
  });

  decodeButton.addEventListener('click', () => {
    if (!input.value) {
      setStatus('Paste an encoded bookmarklet before decoding.', 'error');
      return;
    }

    try {
      setOutput(window.BookmarkletConverter.decodeBookmarklet(input.value));
      setStatus('Bookmarklet decoded.', 'success');
    } catch (error) {
      setOutput('');
      setStatus(error instanceof Error ? error.message : String(error), 'error');
    }
  });

  copyButton.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(output.value);
      setStatus('Output copied.', 'success');
    } catch {
      output.focus();
      output.select();
      setStatus('Clipboard access failed. The output has been selected for manual copying.', 'error');
    }
  });

  clearButton.addEventListener('click', () => {
    input.value = '';
    setOutput('');
    setStatus('');
    input.focus();
  });
})();
