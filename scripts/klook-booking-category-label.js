(() => {
  'use strict';

  const TARGET_HOST = 'www.klook.com';
  const TARGET_PATH = '/zh-TW/bookings/';
  const LABEL_ATTRIBUTE = 'data-klook-category-label';
  const OBSERVER_KEY = '__klookBookingCategoryObserver';
  const RESCAN_TIMER_KEY = '__klookBookingCategoryRescanTimer';

  // 僅允許在 Klook 繁中版訂單頁執行。
  const normalizedPath = `${location.pathname.replace(/\/+$/, '')}/`;
  if (location.hostname !== TARGET_HOST || normalizedPath !== TARGET_PATH) {
    alert('此腳本只能在 https://www.klook.com/zh-TW/bookings/ 執行。');
    return;
  }

  const showToast = (message) => {
    const oldToast = document.getElementById('klook-category-label-toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.id = 'klook-category-label-toast';
    toast.textContent = message;
    Object.assign(toast.style, {
      position: 'fixed',
      right: '20px',
      bottom: '20px',
      zIndex: '2147483647',
      padding: '10px 14px',
      borderRadius: '8px',
      background: 'rgba(0, 0, 0, 0.82)',
      color: '#fff',
      fontSize: '14px',
      lineHeight: '1.4',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.24)',
      pointerEvents: 'none'
    });

    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 2800);
  };

  // 從圖片 URL 或 CSS background-image 取得分類圖示的檔名。
  const getIconUrl = (card) => {
    const icon = card.querySelector('.booking-item_icon, [class*="booking-item_icon"]');
    if (!icon) return '';

    const image = icon.matches('img') ? icon : icon.querySelector('img');
    if (image) {
      return image.currentSrc || image.src || image.getAttribute('src') || '';
    }

    const source = icon.querySelector('source[srcset]');
    if (source) {
      const firstCandidate = source.getAttribute('srcset')?.split(',')[0]?.trim().split(/\s+/)[0];
      if (firstCandidate) return firstCandidate;
    }

    const backgroundImage = getComputedStyle(icon).backgroundImage;
    const match = backgroundImage.match(/^url\(["']?(.*?)["']?\)$/);
    return match ? match[1] : '';
  };

  const parseCategory = (iconUrl) => {
    if (!iconUrl) return null;

    try {
      const pathname = new URL(iconUrl, location.href).pathname;
      const filename = decodeURIComponent(pathname.split('/').pop() || '');
      const basename = filename.replace(/\.[^.]+$/, '');

      if (!basename.startsWith('category_')) return null;

      // 例如：category_experiences_l1_culture_experience_48
      const categoryKey = basename
        .replace(/^category_.+?_l1_/, '')
        .replace(/_\d+$/, '')
        .trim();

      if (!categoryKey || categoryKey === basename) return null;

      const label = categoryKey
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

      return label ? { raw: basename, label } : null;
    } catch (error) {
      console.warn('[Klook Category Label] 無法解析圖示 URL：', iconUrl, error);
      return null;
    }
  };

  const findTitleElement = (card) => {
    const selectors = [
      '.booking-item_title',
      '.booking-item__title',
      '[class*="booking-item_title"]',
      '[class*="booking-item__title"]',
      '[class*="booking-title"]',
      'h3',
      'h4'
    ];

    for (const selector of selectors) {
      const element = card.querySelector(selector);
      if (element?.textContent?.trim()) return element;
    }

    return null;
  };

  const createLabel = ({ raw, label }) => {
    const badge = document.createElement('span');
    badge.setAttribute(LABEL_ATTRIBUTE, 'true');
    badge.title = raw;
    badge.textContent = label;

    Object.assign(badge.style, {
      display: 'inline-flex',
      alignItems: 'center',
      marginLeft: '8px',
      padding: '2px 8px',
      border: '1px solid #ff5b00',
      borderRadius: '999px',
      background: '#fff7f2',
      color: '#d94f00',
      fontSize: '12px',
      fontWeight: '600',
      lineHeight: '18px',
      verticalAlign: 'middle',
      whiteSpace: 'nowrap'
    });

    return badge;
  };

  const scanBookings = () => {
    const cards = Array.from(document.querySelectorAll('.booking-item'));
    let added = 0;

    for (const card of cards) {
      if (card.querySelector(`[${LABEL_ATTRIBUTE}="true"]`)) continue;

      const category = parseCategory(getIconUrl(card));
      if (!category) continue;

      const title = findTitleElement(card);
      if (!title) {
        console.warn('[Klook Category Label] 找不到訂單標題：', card);
        continue;
      }

      title.appendChild(createLabel(category));
      added += 1;
    }

    return { cardCount: cards.length, added };
  };

  const initialResult = scanBookings();

  if (initialResult.cardCount === 0) {
    alert('找不到 Klook 訂單卡片，請確認頁面已載入完成後再執行。');
  } else if (initialResult.added === 0) {
    showToast('找到訂單，但未能解析分類圖示。');
  } else {
    showToast(`已顯示 ${initialResult.added} 筆訂單分類`);
    console.log(`[Klook Category Label] 已新增 ${initialResult.added} 個分類標籤。`);
  }

  // 重複執行時先清除舊 observer，避免同一頁累積監聽器。
  if (window[OBSERVER_KEY] instanceof MutationObserver) {
    window[OBSERVER_KEY].disconnect();
  }
  if (window[RESCAN_TIMER_KEY]) {
    clearTimeout(window[RESCAN_TIMER_KEY]);
  }

  const observer = new MutationObserver((mutations) => {
    const hasAddedNodes = mutations.some((mutation) => mutation.addedNodes.length > 0);
    if (!hasAddedNodes) return;

    clearTimeout(window[RESCAN_TIMER_KEY]);
    window[RESCAN_TIMER_KEY] = window.setTimeout(() => {
      const result = scanBookings();
      if (result.added > 0) {
        console.log(`[Klook Category Label] 動態新增 ${result.added} 個分類標籤。`);
      }
    }, 150);
  });

  observer.observe(document.body, { childList: true, subtree: true });
  window[OBSERVER_KEY] = observer;
})();
