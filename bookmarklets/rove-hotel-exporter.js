(() => {
  'use strict';

  const ROOT_ID = 'rove-hotel-exporter';
  const CSV_HEADERS = [
    'rank',
    'hotel_name',
    'rating',
    'rating_label',
    'stars',
    'address',
    'nightly_price',
    'cash_total',
    'cash_taxes_fees',
    'miles_multiplier',
    'miles_earned_total',
    'redemption_miles',
    'redemption_taxes_fees',
    'redemption_value_cents_per_mile',
    'search_url'
  ];

  function normalizeText(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
  }

  function numericValue(value, integer = false) {
    const text = String(value ?? '').replace(/,/g, '');
    const match = text.match(/-?\d+(?:\.\d+)?/);
    if (!match) return '';
    const parsed = integer ? parseInt(match[0], 10) : parseFloat(match[0]);
    return Number.isFinite(parsed) ? parsed : '';
  }

  function normalizeMoney(value) {
    return numericValue(value, false);
  }

  function normalizeInteger(value) {
    return numericValue(value, true);
  }

  function normalizeMultiplier(value) {
    return numericValue(value, false);
  }

  function normalizeCents(value) {
    return numericValue(value, false);
  }

  function firstMatch(text, regex, normalizer = (value) => normalizeText(value)) {
    const match = String(text ?? '').match(regex);
    return match ? normalizer(match[1]) : '';
  }

  function parseHotelParts(parts, searchUrl) {
    const cashText = normalizeText(parts.cashText || parts.cardText || '');
    const redemptionText = normalizeText(parts.redemptionText || (() => {
      const source = parts.cardText || '';
      const marker = source.lastIndexOf('OR');
      return marker >= 0 ? source.slice(marker + 2) : '';
    })());

    const nightlyPrice = firstMatch(
      cashText,
      /\$\s*([\d,]+(?:\.\d+)?)\s*per\s*night/i,
      normalizeMoney
    );
    const cashTotal = firstMatch(
      cashText,
      /\$\s*([\d,]+(?:\.\d+)?)\s*total/i,
      normalizeMoney
    );
    const cashTaxes = firstMatch(
      cashText,
      /\+\s*\$\s*([\d,]+(?:\.\d+)?)\s*Taxes\s*&\s*fees/i,
      normalizeMoney
    );
    const multiplier = firstMatch(
      cashText,
      /EARN\s*UP\s*TO[\s\S]*?([\d,]+(?:\.\d+)?)\s*x\s*miles/i,
      normalizeMultiplier
    );
    const earnedTotal = firstMatch(
      cashText,
      /EARN\s*UP\s*TO[\s\S]*?miles[\s\S]*?([\d,]+)\s*total/i,
      normalizeInteger
    );
    const redemptionMiles = firstMatch(
      redemptionText,
      /([\d,]+)\s*miles/i,
      normalizeInteger
    );
    const redemptionTaxes = firstMatch(
      redemptionText,
      /\+\s*\$\s*([\d,]+(?:\.\d+)?)\s*Taxes\s*&\s*fees/i,
      normalizeMoney
    );
    const centsPerMile = firstMatch(
      redemptionText,
      /([\d,]+(?:\.\d+)?)\s*¢\s*\/\s*Mile/i,
      normalizeCents
    );

    return {
      rank: Number(parts.itemIndex) + 1,
      hotel_name: normalizeText(parts.hotelName),
      rating: numericValue(parts.rating, false),
      rating_label: normalizeText(parts.ratingLabel),
      stars: Number.isFinite(Number(parts.stars)) ? Number(parts.stars) : '',
      address: normalizeText(parts.address),
      nightly_price: nightlyPrice,
      cash_total: cashTotal,
      cash_taxes_fees: cashTaxes,
      miles_multiplier: multiplier,
      miles_earned_total: earnedTotal,
      redemption_miles: redemptionMiles,
      redemption_taxes_fees: redemptionTaxes,
      redemption_value_cents_per_mile: centsPerMile,
      search_url: String(searchUrl || '')
    };
  }

  function csvEscape(value) {
    const text = String(value ?? '');
    return /[",\r\n]/.test(text)
      ? `"${text.replace(/"/g, '""')}"`
      : text;
  }

  function serializeCsv(rows) {
    const lines = [CSV_HEADERS.join(',')];
    for (const row of rows) {
      lines.push(CSV_HEADERS.map((key) => csvEscape(row[key])).join(','));
    }
    return `\uFEFF${lines.join('\r\n')}`;
  }

  function getMissingIndexes(results, target) {
    const missing = [];
    for (let index = 0; index < target; index += 1) {
      if (!results.has(index)) missing.push(index);
    }
    return missing;
  }

  function rowsFromResults(results) {
    return Array.from(results.values()).sort((a, b) => a.rank - b.rank);
  }

  function computeRecoveryY(listTop, missingIndex, knownSizes, viewportOffset = 0) {
    const validSizes = (knownSizes || []).map(Number).filter((value) => Number.isFinite(value) && value > 0);
    const averageSize = validSizes.length
      ? validSizes.reduce((sum, value) => sum + value, 0) / validSizes.length
      : 650;
    return Math.max(0, Math.round(listTop + missingIndex * averageSize - viewportOffset));
  }

  function isNearListBottomGeometry(scrollY, innerHeight, listTop, listHeight, threshold = 64) {
    return scrollY + innerHeight >= listTop + listHeight - threshold;
  }

  function collectVisibleHotels(state, scroller, parser = parseHotelItem) {
    let added = 0;
    const items = Array.from(scroller.querySelectorAll('[data-item-index]'));
    for (const item of items) {
      const index = Number(item.getAttribute('data-item-index'));
      if (!Number.isInteger(index) || index < 0) continue;
      state.maxSeenIndex = Math.max(state.maxSeenIndex ?? -1, index);
      if (index >= state.target || state.results.has(index)) continue;

      const row = parser(item, state.searchUrl);
      if (!row) continue;

      const identity = `${row.hotel_name || ''}\u0000${row.address || ''}`;
      if (identity !== '\u0000') {
        const previousIndex = state.identityToIndex?.get(identity);
        if (previousIndex !== undefined && previousIndex !== index) {
          state.duplicateIdentities = (state.duplicateIdentities || 0) + 1;
        } else if (state.identityToIndex) {
          state.identityToIndex.set(identity, index);
        }
      }

      state.results.set(index, row);
      added += 1;
    }
    return added;
  }

  function findDirectTextElement(root, wanted) {
    if (!root) return null;
    return Array.from(root.querySelectorAll('div,span,p')).find((element) => {
      return element.children.length === 0 && normalizeText(element.textContent) === wanted;
    }) || null;
  }

  function extractHotelParts(itemElement) {
    if (!itemElement) return null;
    const itemIndex = Number(itemElement.getAttribute('data-item-index'));
    if (!Number.isInteger(itemIndex) || itemIndex < 0) return null;

    const card = itemElement.querySelector('[data-sentry-component="HotelSearchCard"]');
    if (!card) return null;

    const nameElement = card.querySelector('h3');
    const imageElement = card.querySelector('img[alt]');
    const hotelName = normalizeText(nameElement?.textContent || imageElement?.getAttribute('alt') || '');

    let rating = '';
    let ratingLabel = '';
    const imageContainer = imageElement?.parentElement || null;
    if (imageContainer) {
      const spans = Array.from(imageContainer.querySelectorAll('span'));
      for (let i = 0; i < spans.length; i += 1) {
        const candidate = normalizeText(spans[i].textContent);
        const value = numericValue(candidate, false);
        if (value !== '' && value >= 0 && value <= 10) {
          rating = candidate;
          ratingLabel = normalizeText(spans[i + 1]?.textContent || '');
          break;
        }
      }
    }

    const infoBlock = nameElement?.parentElement || null;
    const starRoot = infoBlock || card;
    const stars = starRoot.querySelectorAll('svg.lucide-star').length;
    const address = normalizeText(infoBlock?.querySelector('p')?.textContent || '');

    const orElement = findDirectTextElement(card, 'OR');
    const cashRoot = orElement?.previousElementSibling || null;
    const redemptionRoot = orElement?.nextElementSibling || null;

    return {
      itemIndex,
      hotelName,
      rating,
      ratingLabel,
      stars,
      address,
      cashText: normalizeText(cashRoot?.innerText || cashRoot?.textContent || card.innerText || card.textContent || ''),
      redemptionText: normalizeText(redemptionRoot?.innerText || redemptionRoot?.textContent || ''),
      cardText: normalizeText(card.innerText || card.textContent || '')
    };
  }

  function parseHotelItem(itemElement, searchUrl) {
    const parts = extractHotelParts(itemElement);
    return parts ? parseHotelParts(parts, searchUrl) : null;
  }

  const exported = {
    CSV_HEADERS,
    normalizeMoney,
    normalizeInteger,
    normalizeMultiplier,
    normalizeCents,
    parseHotelParts,
    parseHotelItem,
    extractHotelParts,
    getMissingIndexes,
    rowsFromResults,
    computeRecoveryY,
    isNearListBottomGeometry,
    collectVisibleHotels,
    csvEscape,
    serializeCsv
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
    return;
  }

  const existingRoot = document.getElementById(ROOT_ID);
  if (existingRoot) {
    existingRoot.style.display = 'block';
    existingRoot.style.zIndex = '2147483647';
    existingRoot.dispatchEvent(new CustomEvent('rove-exporter-show'));
    return;
  }

  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.style.position = 'fixed';
  root.style.right = '18px';
  root.style.bottom = '18px';
  root.style.zIndex = '2147483647';
  root.style.width = '340px';
  root.style.maxWidth = 'calc(100vw - 24px)';
  root.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  root.style.colorScheme = 'dark';
  document.documentElement.appendChild(root);

  const shadow = root.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      * { box-sizing: border-box; }
      .panel {
        width: 100%;
        background: rgba(22, 22, 24, 0.96);
        color: #f5f5f7;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 16px;
        box-shadow: 0 16px 48px rgba(0,0,0,.45);
        backdrop-filter: blur(18px);
        overflow: hidden;
      }
      .header { display:flex; align-items:center; justify-content:space-between; padding:14px 16px 10px; }
      .title { font-size:15px; font-weight:650; }
      .close { border:0; background:transparent; color:#aaa; cursor:pointer; font-size:18px; padding:2px 5px; }
      .body { padding:0 16px 16px; }
      label { display:block; font-size:12px; color:#aaa; margin:3px 0 6px; }
      input { width:100%; border:1px solid rgba(255,255,255,.14); border-radius:10px; padding:9px 10px; background:#222; color:#fff; outline:none; }
      .status { margin-top:12px; font-size:12px; line-height:1.45; color:#c8c8cc; min-height:18px; }
      .status.error { color:#ff9999; }
      .status.good { color:#9ae6a8; }
      .progressTrack { height:6px; border-radius:999px; background:rgba(255,255,255,.09); margin-top:10px; overflow:hidden; }
      .progress { height:100%; width:0%; background:#fff; transition:width .15s linear; }
      .stats { display:grid; grid-template-columns:1fr 1fr; gap:7px 12px; margin-top:12px; font-size:11px; color:#aaa; }
      .stats strong { color:#eee; font-weight:600; float:right; }
      .buttons { display:flex; gap:8px; flex-wrap:wrap; margin-top:14px; }
      button.action { border:1px solid rgba(255,255,255,.14); background:#2a2a2d; color:#fff; padding:8px 11px; border-radius:9px; cursor:pointer; font-size:12px; }
      button.action.primary { background:#f5f5f7; color:#111; border-color:#f5f5f7; }
      button.action:disabled { opacity:.4; cursor:not-allowed; }
    </style>
    <div class="panel">
      <div class="header">
        <div class="title">Rove Hotel Exporter</div>
        <button class="close" title="Close">×</button>
      </div>
      <div class="body">
        <label>Number of hotels</label>
        <input class="target" type="number" min="1" max="5000" step="1" value="100">
        <div class="status">Ready</div>
        <div class="progressTrack"><div class="progress"></div></div>
        <div class="stats">
          <div>Collected <strong class="collected">0</strong></div>
          <div>Target <strong class="targetStat">100</strong></div>
          <div>Current rank <strong class="currentRank">—</strong></div>
          <div>Missing <strong class="missing">0</strong></div>
          <div>Rows w/ gaps <strong class="incomplete">0</strong></div>
          <div>Recovery <strong class="recovery">0/3</strong></div>
        </div>
        <div class="buttons">
          <button class="action primary start">Start</button>
          <button class="action stop" disabled>Stop</button>
          <button class="action download" disabled>Download CSV</button>
          <button class="action restore" disabled>Restore Position</button>
          <button class="action reset">Start Over</button>
        </div>
      </div>
    </div>
  `;

  const ui = {
    target: shadow.querySelector('.target'),
    status: shadow.querySelector('.status'),
    progress: shadow.querySelector('.progress'),
    collected: shadow.querySelector('.collected'),
    targetStat: shadow.querySelector('.targetStat'),
    currentRank: shadow.querySelector('.currentRank'),
    missing: shadow.querySelector('.missing'),
    incomplete: shadow.querySelector('.incomplete'),
    recovery: shadow.querySelector('.recovery'),
    start: shadow.querySelector('.start'),
    stop: shadow.querySelector('.stop'),
    download: shadow.querySelector('.download'),
    restore: shadow.querySelector('.restore'),
    reset: shadow.querySelector('.reset'),
    close: shadow.querySelector('.close')
  };

  const state = {
    target: 100,
    results: new Map(),
    identityToIndex: new Map(),
    duplicateIdentities: 0,
    running: false,
    stoppedByUser: false,
    searchUrl: '',
    originalScrollY: null,
    scroller: null,
    listTop: 0,
    maxSeenIndex: -1,
    stalledRounds: 0,
    recoveryAttempts: 0,
    recoveryIndex: null,
    nudgeAttempts: 0
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function visibleIndexes(scroller) {
    return Array.from(scroller.querySelectorAll('[data-item-index]'))
      .map((item) => Number(item.getAttribute('data-item-index')))
      .filter((index) => Number.isInteger(index) && index >= 0)
      .sort((a, b) => a - b);
  }

  function indexSignature(scroller) {
    return visibleIndexes(scroller).join(',');
  }

  async function waitForIndexChange(previousSignature, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline && state.running) {
      if (indexSignature(state.scroller) !== previousSignature) {
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        return true;
      }
      await sleep(100);
    }
    return false;
  }

  async function waitForRenderedIndex(index, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline && state.running) {
      const found = state.scroller.querySelector(`[data-item-index="${index}"]`);
      if (found) return true;
      await sleep(100);
    }
    return false;
  }

  function missingInSeenRange() {
    const upper = Math.min(state.target, Math.max(0, state.maxSeenIndex + 1));
    return getMissingIndexes(state.results, upper);
  }

  function incompleteRowCount() {
    const requiredKeys = CSV_HEADERS.filter((key) => key !== 'search_url');
    return rowsFromResults(state.results).filter((row) => {
      return requiredKeys.some((key) => row[key] === '' || row[key] === null || row[key] === undefined);
    }).length;
  }

  function setStatus(message, kind = '') {
    ui.status.textContent = message;
    ui.status.className = `status${kind ? ` ${kind}` : ''}`;
  }

  function updateUi() {
    const count = state.results.size;
    const pct = state.target > 0 ? Math.min(100, (count / state.target) * 100) : 0;
    ui.progress.style.width = `${pct}%`;
    ui.collected.textContent = String(count);
    ui.targetStat.textContent = String(state.target || ui.target.value || 0);
    ui.currentRank.textContent = state.maxSeenIndex >= 0 ? String(state.maxSeenIndex + 1) : '—';
    ui.missing.textContent = String(missingInSeenRange().length);
    ui.incomplete.textContent = String(incompleteRowCount());
    ui.recovery.textContent = `${state.recoveryAttempts}/3`;
    ui.download.disabled = count === 0 || state.running;
    ui.restore.disabled = state.originalScrollY === null;
    ui.start.disabled = state.running;
    ui.stop.disabled = !state.running;
    ui.target.disabled = state.running;
  }

  function resetState() {
    state.results.clear();
    state.identityToIndex.clear();
    state.duplicateIdentities = 0;
    state.running = false;
    state.stoppedByUser = false;
    state.searchUrl = '';
    state.originalScrollY = null;
    state.scroller = null;
    state.listTop = 0;
    state.maxSeenIndex = -1;
    state.stalledRounds = 0;
    state.recoveryAttempts = 0;
    state.recoveryIndex = null;
    state.nudgeAttempts = 0;
    setStatus('Ready');
    updateUi();
  }

  function listHeight() {
    if (!state.scroller) return 0;
    const rectHeight = state.scroller.getBoundingClientRect().height;
    return rectHeight || state.scroller.scrollHeight || parseFloat(state.scroller.style.height) || 0;
  }

  function nearListBottom() {
    return isNearListBottomGeometry(
      window.scrollY,
      window.innerHeight,
      state.listTop,
      listHeight(),
      80
    );
  }

  function knownItemSizes() {
    if (!state.scroller) return [];
    return Array.from(state.scroller.querySelectorAll('[data-known-size]'))
      .map((item) => Number(item.getAttribute('data-known-size')))
      .filter((value) => Number.isFinite(value) && value > 0);
  }

  function collect() {
    const added = collectVisibleHotels(state, state.scroller, parseHotelItem);
    updateUi();
    return added;
  }

  async function recoverIndex(index) {
    if (state.recoveryIndex === index) state.recoveryAttempts += 1;
    else {
      state.recoveryIndex = index;
      state.recoveryAttempts = 1;
    }
    updateUi();
    setStatus(`Recovering missing rank ${index + 1}…`);

    const attemptOffsets = [0.25, 0.05, 0.45];
    const viewportOffset = window.innerHeight * attemptOffsets[Math.min(state.recoveryAttempts - 1, attemptOffsets.length - 1)];
    const targetY = computeRecoveryY(state.listTop, index, knownItemSizes(), viewportOffset);
    const signature = indexSignature(state.scroller);
    window.scrollTo({ top: targetY, behavior: 'auto' });
    await waitForIndexChange(signature, 2600);
    await sleep(80);
    collect();
    const recovered = state.results.has(index);
    if (recovered) {
      state.recoveryAttempts = 0;
      state.recoveryIndex = null;
      updateUi();
    }
    return recovered;
  }

  function finish(kind, message) {
    state.running = false;
    if (kind === 'complete') setStatus(message || `Complete — ${state.results.size} hotels collected.`, 'good');
    else if (kind === 'stopped') setStatus(message || `Stopped — ${state.results.size} hotels collected.`);
    else if (kind === 'end') setStatus(message || `End of results — ${state.results.size} hotels collected.`);
    else setStatus(message || 'Stopped because the page could not be read.', 'error');
    updateUi();
  }

  async function crawl() {
    collect();

    while (state.running) {
      const missingAll = getMissingIndexes(state.results, state.target);
      if (missingAll.length === 0) {
        finish('complete');
        return;
      }

      if (state.maxSeenIndex >= state.target - 1) {
        const missing = missingAll[0];
        if (state.recoveryAttempts >= 3) {
          finish('error', `Could not recover missing rank ${missing + 1}. ${state.results.size} rows are available to download.`);
          return;
        }
        await recoverIndex(missing);
        continue;
      }

      const beforeCount = state.results.size;
      const beforeMax = state.maxSeenIndex;
      const signature = indexSignature(state.scroller);

      window.scrollBy({ top: Math.round(window.innerHeight * 0.65), behavior: 'auto' });
      await waitForIndexChange(signature, 3000);
      if (!state.running) break;
      await sleep(60);
      if (!state.running) break;
      const added = collect();

      if (added > 0 || state.maxSeenIndex > beforeMax || state.results.size > beforeCount) {
        state.stalledRounds = 0;
        state.nudgeAttempts = 0;
      } else {
        state.stalledRounds += 1;
      }

      const missingSeen = missingInSeenRange();
      if (state.stalledRounds >= 2 && missingSeen.length > 0) {
        if (state.recoveryAttempts >= 3) {
          finish('error', `Could not recover missing rank ${missingSeen[0] + 1}. ${state.results.size} rows are available to download.`);
          return;
        }
        await recoverIndex(missingSeen[0]);
        state.stalledRounds = 0;
        continue;
      }

      if (state.stalledRounds >= 2 && nearListBottom()) {
        finish('end', `End of results — collected ${state.results.size} of requested ${state.target}.`);
        return;
      }

      if (state.stalledRounds >= 6) {
        state.nudgeAttempts += 1;
        if (state.nudgeAttempts > 3) {
          finish('error', `No new hotel results detected. ${state.results.size} rows are available to download.`);
          return;
        }
        setStatus(`No new rows yet — retrying (${state.nudgeAttempts}/3)…`);
        const nudgeSignature = indexSignature(state.scroller);
        window.scrollBy({ top: Math.round(window.innerHeight * 0.9), behavior: 'auto' });
        await waitForIndexChange(nudgeSignature, 3000);
        state.stalledRounds = 0;
        collect();
      } else {
        setStatus(`Collecting… ${state.results.size} / ${state.target}`);
      }
    }

    if (state.stoppedByUser) finish('stopped', `Stopped by user — ${state.results.size} hotels collected.`);
  }

  async function start() {
    if (state.running) return;
    const target = Number.parseInt(ui.target.value, 10);
    if (!Number.isInteger(target) || target < 1 || target > 5000) {
      setStatus('Enter a hotel count between 1 and 5000.', 'error');
      return;
    }

    const scroller = document.querySelector('[data-virtuoso-scroller="true"]');
    if (!scroller) {
      setStatus('Rove hotel result list was not recognized. The site may have changed.', 'error');
      return;
    }

    state.target = target;
    state.results.clear();
    state.identityToIndex.clear();
    state.duplicateIdentities = 0;
    state.running = true;
    state.stoppedByUser = false;
    state.originalScrollY = window.scrollY;
    state.searchUrl = window.location.href;
    state.scroller = scroller;
    state.listTop = scroller.getBoundingClientRect().top + window.scrollY;
    state.maxSeenIndex = -1;
    state.stalledRounds = 0;
    state.recoveryAttempts = 0;
    state.recoveryIndex = null;
    state.nudgeAttempts = 0;
    updateUi();

    setStatus('Moving to the first hotel…');
    window.scrollTo({ top: Math.max(0, state.listTop - 100), behavior: 'auto' });
    await sleep(80);

    if (!(await waitForRenderedIndex(0, 5000))) {
      finish('error', 'Could not reach the first Rove hotel result. The page structure may have changed.');
      return;
    }

    setStatus(`Collecting… 0 / ${state.target}`);
    try {
      await crawl();
    } catch (error) {
      console.error('[Rove Hotel Exporter]', error);
      finish('error', `Exporter error: ${error?.message || String(error)}`);
    }
  }

  function stop() {
    if (!state.running) return;
    state.stoppedByUser = true;
    state.running = false;
    setStatus('Stopping…');
    updateUi();
  }

  function downloadCsv() {
    const rows = rowsFromResults(state.results);
    if (!rows.length) return;
    const blob = new Blob([serializeCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `rove-hotels-${rows.length}.csv`;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  ui.target.addEventListener('input', () => {
    if (!state.running) {
      state.target = Number.parseInt(ui.target.value, 10) || 0;
      updateUi();
    }
  });
  ui.start.addEventListener('click', start);
  ui.stop.addEventListener('click', stop);
  ui.download.addEventListener('click', downloadCsv);
  ui.restore.addEventListener('click', () => {
    if (state.originalScrollY !== null) window.scrollTo({ top: state.originalScrollY, behavior: 'auto' });
  });
  ui.reset.addEventListener('click', () => {
    if (!state.running) resetState();
  });
  ui.close.addEventListener('click', () => {
    state.running = false;
    state.stoppedByUser = true;
    root.remove();
  });
  root.addEventListener('rove-exporter-show', () => {
    root.style.display = 'block';
  });

  resetState();
})();
