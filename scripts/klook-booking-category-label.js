(() => {
  'use strict';

  const TARGET_HOST = 'www.klook.com';
  const LABEL_ATTRIBUTE = 'data-klook-category-label';
  const OBSERVER_KEY = '__klookBookingCategoryObserver';
  const TIMER_KEY = '__klookBookingCategoryTimer';

  // Allow all Klook booking-page language variants.
  if (
    location.hostname !== TARGET_HOST ||
    !/\/bookings\/?$/.test(location.pathname)
  ) {
    alert('This script can only run on a Klook bookings page.');
    return;
  }

  const showToast = (message) => {
    document.getElementById('klook-category-toast')?.remove();

    const toast = document.createElement('div');
    toast.id = 'klook-category-toast';
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

  const getIconUrl = (card) => {
    const image = card.querySelector('.booking-item_icon img');

    return (
      image?.currentSrc ||
      image?.src ||
      image?.getAttribute('src') ||
      ''
    );
  };

  const normalizeCategoryPart = (value) => {
    return value
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const parseCategory = (iconUrl) => {
    if (!iconUrl) {
      return null;
    }

    try {
      const url = new URL(iconUrl, location.href);

      const filename = decodeURIComponent(
        url.pathname.split('/').pop() || ''
      );

      if (!filename) {
        return null;
      }

      const basename = filename.replace(/\.[^.]+$/, '');

      /*
       * Supports any category level:
       *
       * category_experiences_l1_culture_experience_48
       * -> experiences|culture_experience
       *
       * category_experiences_l2_tours_sightseeing_bg48
       * -> experiences|tours_sightseeing
       *
       * category_experiences_l2_boat_tours_cruises_yachts_bg48
       * -> experiences|boat_tours_cruises_yachts
       *
       * category_transport_l1_trains_bg48
       * -> transport|trains
       */
      const categoryMatch = basename.match(
        /^category_(.+?)_l\d+_(.+?)(?:_48|_?bg48)$/i
      );

      if (categoryMatch) {
        const parentCategory = normalizeCategoryPart(
          categoryMatch[1]
        );

        const childCategory = normalizeCategoryPart(
          categoryMatch[2]
        );

        if (parentCategory && childCategory) {
          return {
            raw: filename,
            label: `${parentCategory}|${childCategory}`,
            parsed: true
          };
        }
      }

      /*
       * icon_category_event_shows_app_3x
       * -> event_shows
       */
      const iconMatch = basename.match(
        /^icon_category_(.+?)_(?:app|web)(?:_\d+x)?$/i
      );

      if (iconMatch) {
        const category = normalizeCategoryPart(
          iconMatch[1]
        );

        if (category) {
          return {
            raw: filename,
            label: category,
            parsed: true
          };
        }
      }

      // Unknown format: display the complete filename.
      return {
        raw: filename,
        label: filename,
        parsed: false
      };
    } catch (error) {
      console.warn(
        '[Klook Category] Unable to parse category image:',
        iconUrl,
        error
      );

      // Last-resort fallback for malformed URLs.
      const fallbackFilename = iconUrl
        .split('?')[0]
        .split('#')[0]
        .split('/')
        .pop();

      if (fallbackFilename) {
        return {
          raw: fallbackFilename,
          label: fallbackFilename,
          parsed: false
        };
      }

      return null;
    }
  };

  const createLabel = ({ raw, label, parsed }) => {
    const badge = document.createElement('span');

    badge.setAttribute(LABEL_ATTRIBUTE, 'true');
    badge.textContent = label;
    badge.title = parsed
      ? raw
      : `Unrecognized format: ${raw}`;

    Object.assign(badge.style, {
      display: 'inline-flex',
      alignItems: 'center',
      marginLeft: '8px',
      padding: '2px 8px',
      border: parsed
        ? '1px solid #ff5b00'
        : '1px solid #8a8a8a',
      borderRadius: '999px',
      background: parsed
        ? '#fff7f2'
        : '#f5f5f5',
      color: parsed
        ? '#d94f00'
        : '#555',
      fontSize: '12px',
      fontWeight: '600',
      fontFamily: 'monospace',
      lineHeight: '18px',
      verticalAlign: 'middle',
      whiteSpace: 'nowrap',
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    });

    return badge;
  };

  const scanBookings = () => {
    const cards = [
      ...document.querySelectorAll('.booking-item')
    ];

    let added = 0;
    let fallbackUsed = 0;
    let iconMissing = 0;
    let titleMissing = 0;

    for (const card of cards) {
      if (
        card.querySelector(
          `[${LABEL_ATTRIBUTE}="true"]`
        )
      ) {
        continue;
      }

      const iconUrl = getIconUrl(card);

      if (!iconUrl) {
        iconMissing += 1;

        console.warn(
          '[Klook Category] Unable to find the category image:',
          card
        );

        continue;
      }

      const category = parseCategory(iconUrl);

      if (!category) {
        iconMissing += 1;

        console.warn(
          '[Klook Category] Unable to obtain a category filename:',
          iconUrl
        );

        continue;
      }

      const title = card.querySelector(
        '.booking-content_title'
      );

      if (!title) {
        titleMissing += 1;

        console.warn(
          '[Klook Category] Unable to find .booking-content_title:',
          card
        );

        continue;
      }

      title.appendChild(createLabel(category));

      added += 1;

      if (!category.parsed) {
        fallbackUsed += 1;

        console.warn(
          '[Klook Category] Unrecognized filename format; displaying the full filename:',
          category.raw
        );
      }
    }

    return {
      cardCount: cards.length,
      added,
      fallbackUsed,
      iconMissing,
      titleMissing
    };
  };

  const initialResult = scanBookings();

  if (initialResult.cardCount === 0) {
    alert(
      'No Klook booking cards were found. Wait for the page to finish loading and try again.'
    );
  } else if (initialResult.added === 0) {
    alert(
      [
        'Bookings were found, but no category labels were added.',
        `Missing category images: ${initialResult.iconMissing}`,
        `Missing booking titles: ${initialResult.titleMissing}`,
        'Open the browser console for more details.'
      ].join('\n')
    );
  } else {
    const fallbackMessage = initialResult.fallbackUsed > 0
      ? ` (${initialResult.fallbackUsed} full filename fallbacks)`
      : '';

    showToast(
      `Added category labels to ${initialResult.added} bookings${fallbackMessage}`
    );

    console.log(
      '[Klook Category] Scan result:',
      initialResult
    );
  }

  // Disconnect the previous observer when the script runs again.
  if (window[OBSERVER_KEY] instanceof MutationObserver) {
    window[OBSERVER_KEY].disconnect();
  }

  if (window[TIMER_KEY]) {
    clearTimeout(window[TIMER_KEY]);
  }

  // Watch for bookings loaded dynamically by the page.
  const observer = new MutationObserver((mutations) => {
    const hasAddedNodes = mutations.some(
      (mutation) => mutation.addedNodes.length > 0
    );

    if (!hasAddedNodes) {
      return;
    }

    clearTimeout(window[TIMER_KEY]);

    window[TIMER_KEY] = window.setTimeout(() => {
      const result = scanBookings();

      if (result.added > 0) {
        console.log(
          `[Klook Category] Added ${result.added} dynamically loaded category labels.`,
          result
        );
      }
    }, 150);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  window[OBSERVER_KEY] = observer;
})();
