/**
 * Meta Ads Library Saver — Content Script
 *
 * Injected into pages matching *://www.facebook.com/ads/library/*
 *
 * ============================================================================
 * DOM EXTRACTION STRATEGY
 * ============================================================================
 *
 * The Meta Ads Library DOM is highly dynamic. Class names are obfuscated and
 * change across deployments. Rather than relying on specific class names we use
 * a combination of:
 *
 *   1. ARIA roles and labels — Meta uses semantic ARIA attributes that tend to
 *      survive redesigns (e.g. role="article", aria-label patterns).
 *
 *   2. Structural patterns — Ad cards share a predictable nesting structure:
 *      a container holds a header (advertiser info), a body (creative + copy),
 *      and a footer (CTA / dates / status).
 *
 *   3. Data attributes — Some data-* attributes remain stable.
 *
 *   4. Text-content heuristics — We look for known label text like "Started
 *      running on", "Active", "Inactive", etc.
 *
 *   5. URL parsing — The Ad Library ID is typically embedded in the page URL
 *      query parameters (?id=...) or in links within the card.
 *
 * Each extraction function documents its strategy and includes fallback paths
 * so that if the primary selector breaks, the extension degrades gracefully
 * rather than crashing.
 *
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** Set of ad library IDs that have already been saved by the user. */
let savedAdIds = new Set();

/** Currently selected ad cards for bulk operations. */
const selectedAds = new Set();

/** Tracks whether the floating action bar is visible. */
let bulkBarVisible = false;

/** MutationObserver reference so we can disconnect on cleanup. */
let observer = null;

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

(async function init() {
  // Verify we are on the Meta Ads Library page
  if (!isAdsLibraryPage()) return;

  // Load the set of already-saved ad IDs from background
  await loadSavedAdIds();

  // Process any ad cards already in the DOM
  processAdCards();

  // Watch for new ad cards being loaded (infinite scroll / navigation)
  observeDOM();

  // Create the bulk-action floating bar (hidden by default)
  createBulkActionBar();

  // Create floating save settings panel
  createFloatingSaveSettings();
})();

// ---------------------------------------------------------------------------
// Page detection
// ---------------------------------------------------------------------------

/**
 * Confirm we are on a Meta Ads Library page.
 * The URL must contain /ads/library — this is the canonical path.
 */
function isAdsLibraryPage() {
  return window.location.pathname.includes('/ads/library');
}

// ---------------------------------------------------------------------------
// Saved-ad cache
// ---------------------------------------------------------------------------

/**
 * Ask the background script for the cached set of saved ad library IDs and
 * store them locally so we can mark cards with an "already saved" badge
 * without a network round-trip for each card.
 */
async function loadSavedAdIds() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'get-saved-ad-ids' });
    if (response?.ok && Array.isArray(response.data)) {
      savedAdIds = new Set(response.data);
    }
  } catch (err) {
    console.warn('[Meta Ads Saver] Could not load saved ad IDs:', err.message);
  }
}

// ---------------------------------------------------------------------------
// DOM observation
// ---------------------------------------------------------------------------

/**
 * Watch for mutations in the main content area so we can process newly loaded
 * ad cards (Meta uses infinite scroll and dynamic rendering).
 */
function observeDOM() {
  // Disconnect any existing observer
  if (observer) observer.disconnect();

  observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldProcess = true;
        break;
      }
    }
    if (shouldProcess) {
      // Debounce: wait a tick so batch DOM insertions are grouped
      requestAnimationFrame(processAdCards);
    }
  });

  // Observe the entire body with subtree — Meta re-renders large sections
  observer.observe(document.body, { childList: true, subtree: true });
}

// ---------------------------------------------------------------------------
// Ad card discovery
// ---------------------------------------------------------------------------

/**
 * Find all ad card containers currently in the DOM.
 *
 * Strategy (in priority order):
 *   1. Look for elements with [role="article"] — Meta wraps each ad result in
 *      an article role for accessibility.
 *   2. Look for divs whose data-testid starts with "ad_library" or similar.
 *   3. Fallback: look for the structural pattern of a container that holds an
 *      image/video, text blocks, and a "See Ad Details" type link.
 *
 * We mark processed cards with a data attribute so we do not re-process them.
 */
function findAdCards() {
  const PROCESSED_ATTR = 'data-mals-processed';
  const cards = [];
  const seen = new Set();

  // --- Strategy 1: ARIA role ---
  for (const el of document.querySelectorAll('[role="article"]:not([' + PROCESSED_ATTR + '])')) {
    cards.push(el);
    seen.add(el);
  }

  // --- Strategy 2: data-testid ---
  if (cards.length === 0) {
    for (const el of document.querySelectorAll('div[data-testid*="ad_library"]:not([' + PROCESSED_ATTR + '])')) {
      if (!seen.has(el)) { cards.push(el); seen.add(el); }
    }
  }

  // --- Strategy 3: Find "See ad details" or "See summary details" buttons and walk up ---
  if (cards.length === 0) {
    const allSpans = document.querySelectorAll('span');
    for (const span of allSpans) {
      const text = span.textContent?.trim();
      if (text === 'See ad details' || text === 'See summary details') {
        // Walk up to find the ad card container (typically 300-800px tall)
        let container = span.parentElement;
        for (let i = 0; i < 15 && container; i++) {
          const h = container.offsetHeight;
          if (h > 250 && h < 1000 && !container.getAttribute(PROCESSED_ATTR) && !seen.has(container)) {
            // Verify it has media or ad-like content
            const hasMedia = container.querySelector('img, video');
            const hasLibraryId = (container.innerText || '').includes('Library ID');
            if (hasMedia || hasLibraryId) {
              cards.push(container);
              seen.add(container);
              break;
            }
          }
          container = container.parentElement;
        }
      }
    }
  }

  // --- Strategy 4: Find elements containing "Library ID:" text and walk up ---
  if (cards.length === 0) {
    const allSpans = document.querySelectorAll('span');
    for (const span of allSpans) {
      if (span.textContent?.includes('Library ID:')) {
        let container = span.parentElement;
        for (let i = 0; i < 15 && container; i++) {
          const h = container.offsetHeight;
          if (h > 250 && h < 1000 && !container.getAttribute(PROCESSED_ATTR) && !seen.has(container)) {
            cards.push(container);
            seen.add(container);
            break;
          }
          container = container.parentElement;
        }
      }
    }
  }

  return cards;
}

// ---------------------------------------------------------------------------
// Card processing
// ---------------------------------------------------------------------------

/**
 * For every unprocessed ad card, inject our UI (save button, checkbox) and
 * mark the card as processed.
 */
function processAdCards() {
  const cards = findAdCards();

  for (const card of cards) {
    card.setAttribute('data-mals-processed', 'true');

    // Extract the ad library ID early so we can check duplicates
    const adId = extractAdLibraryId(card);

    // Inject save button
    injectSaveButton(card, adId);

    // Inject bulk-select checkbox
    injectCheckbox(card, adId);

    // Quick-copy buttons removed — not needed

    // Show "already saved" badge if applicable
    if (adId && savedAdIds.has(adId)) {
      markAsSaved(card);
    }
  }
}

// ---------------------------------------------------------------------------
// Data extraction — each function has detailed comments about its approach
// ---------------------------------------------------------------------------

/**
 * EXTRACT: Ad Library ID
 *
 * The Ad Library ID is the most reliable piece of data. It appears in:
 *   - The page URL query parameter ?id=XXXX (single-ad view)
 *   - Links within the card that point to the detail page
 *   - data-* attributes on the card or its descendants
 *
 * We try each source in order.
 */
function extractAdLibraryId(card) {
  // --- Source 1: text content containing "Library ID:" (most reliable on current Meta layout) ---
  const allText = card.innerText || '';
  const idMatch = allText.match(/Library\s+ID[:\s]+(\d+)/i);
  if (idMatch) return idMatch[1];

  // --- Source 2: link within card whose href contains id= ---
  const detailLink = card.querySelector('a[href*="/ads/library/?id="]')
    || card.querySelector('a[href*="id="]');
  if (detailLink) {
    try {
      const url = new URL(detailLink.href, window.location.origin);
      const id = url.searchParams.get('id');
      if (id) return id;
    } catch { /* ignore malformed URLs */ }
  }

  // --- Source 3: current page URL (single-ad view) ---
  try {
    const pageUrl = new URL(window.location.href);
    const id = pageUrl.searchParams.get('id');
    if (id) return id;
  } catch { /* ignore */ }

  // --- Source 4: data attributes ---
  const dataId = card.getAttribute('data-ad-id')
    || card.getAttribute('data-id')
    || card.querySelector('[data-ad-id]')?.getAttribute('data-ad-id');
  if (dataId) return dataId;

  return null;
}

/**
 * EXTRACT: Ad Creative (image or video)
 *
 * Ads can be:
 *   - Single image
 *   - Single video (with poster frame)
 *   - Carousel (multiple images/videos)
 *
 * For images we grab the src; for videos we grab the poster and src.
 * We filter out tiny icons/avatars by checking naturalWidth or width attrs.
 */
function extractCreative(card) {
  const creatives = [];

  // --- Images ---
  // We want the ad creative, not profile photos or tiny icons.
  // Profile photos are typically < 60px wide.
  const images = card.querySelectorAll('img');
  for (const img of images) {
    const width = img.naturalWidth || parseInt(img.getAttribute('width'), 10) || img.offsetWidth;
    // Skip small images (icons, avatars)
    if (width < 80) continue;
    // Skip tracking pixels (1x1)
    if (img.src && (img.src.includes('tr?') || img.src.includes('pixel'))) continue;
    // Skip profile pictures — they are often inside links to the page
    const parentLink = img.closest('a[href*="facebook.com/"]');
    if (parentLink && !parentLink.href.includes('/ads/library')) continue;

    creatives.push({
      type: 'image',
      src: img.src || img.getAttribute('data-src') || img.currentSrc,
      alt: img.alt || '',
    });
  }

  // --- Videos ---
  const videos = card.querySelectorAll('video');
  for (const video of videos) {
    creatives.push({
      type: 'video',
      src: video.src || video.querySelector('source')?.src || '',
      poster: video.poster || '',
    });
  }

  return creatives;
}

/**
 * EXTRACT: Primary text (the main ad copy body)
 *
 * Strategy:
 *   - The primary text is typically the longest text block in the card body.
 *   - It often appears after the advertiser name and before the creative.
 *   - We look for a div/span/p that contains substantial text (> 50 chars).
 *   - We avoid elements that are clearly labels (e.g. "Started running on").
 *
 * Fallback: collect all visible text nodes in the card body area.
 */
function extractPrimaryText(card) {
  // The primary text is the ad copy — a sentence/paragraph the advertiser wrote.
  // It appears between the advertiser name ("Sponsored") and the creative media.
  const advertiser = extractAdvertiserName(card);

  // Find the "Sponsored" label to anchor our search
  const spans = card.querySelectorAll('span, div, p');
  let foundSponsored = false;
  let foundMedia = false;
  const candidates = [];

  for (const el of spans) {
    const text = el.textContent?.trim();
    if (!text) continue;

    if (text === 'Sponsored') {
      foundSponsored = true;
      continue;
    }

    // Stop collecting once we hit media elements (img/video)
    if (el.querySelector && (el.querySelector('img, video'))) {
      foundMedia = true;
    }

    if (foundSponsored && !foundMedia && el.children.length <= 1) {
      if (isInjectedElement(el)) continue;
      if (text.length >= 15 && text.length <= 500 && !isJunkText(text, advertiser)) {
        candidates.push(text);
      }
    }
  }

  // Return the longest candidate (most likely the full ad copy)
  if (candidates.length > 0) {
    return candidates.reduce((a, b) => a.length > b.length ? a : b);
  }

  // Fallback: find the longest non-junk text in the card
  let bestText = '';
  for (const el of spans) {
    if (el.children.length > 2) continue;
    if (isInjectedElement(el)) continue;
    const text = el.innerText?.trim();
    if (!text || text.length < 20 || text.length > 500) continue;
    if (isJunkText(text, advertiser)) continue;
    if (text.length > bestText.length) bestText = text;
  }
  return bestText;
}

function isJunkText(text, advertiser) {
  if (!text) return true;
  const junkExact = /^(sponsored|active|inactive|install now|download|shop now|learn more|sign up|see ad details|see summary details|see more|eu transparency|open dropdown|save|saved|saving|saved!|copy text|copy headline|copy url|copied!|select all|clear)$/i;
  const junkStart = /^(started running|library id|platforms|about this ad|disclaimer|\d+:\d+\s*[\/|])/i;
  const junkContains = /Library ID:|Started running|PLAY\.GOOGLE\.COM|ITUNES\.APPLE\.COM|\d+:\d+\s*\/\s*\d+:\d+|Copy Text|Copy Headline|Copy URL/;
  if (junkExact.test(text.trim())) return true;
  if (junkStart.test(text.trim())) return true;
  if (junkContains.test(text)) return true;
  if (advertiser && text.trim() === advertiser.trim()) return true;
  // Skip very short domain-like text
  if (/^[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(text.trim())) return true;
  return false;
}

/**
 * EXTRACT: Headline
 *
 * The headline is typically a short, bold/larger text element that appears
 * near the CTA button. It is usually styled differently (font-weight bold,
 * larger font-size) from the primary text.
 *
 * Strategy:
 *   1. Look for elements with font-weight >= 600 or <strong>/<b> tags.
 *   2. Filter to those near the bottom half of the card (headlines are below the creative).
 *   3. Pick the first qualifying element that is 5-150 chars.
 */
function extractHeadline(card) {
  const advertiser = extractAdvertiserName(card);
  const skipTexts = /^(sponsored|active|inactive|see ad details|see summary details|install now|download|shop now|learn more|sign up|eu transparency)$/i;

  // The headline appears near the CTA button at the bottom of the card,
  // typically as bold text. It's a short punchy line.

  // Strategy 1: bold elements in the lower portion of the card
  const boldElements = card.querySelectorAll('strong, b');
  for (const el of boldElements) {
    if (isInjectedElement(el)) continue;
    const text = el.innerText?.trim();
    if (!text || text.length < 5 || text.length > 200) continue;
    if (skipTexts.test(text)) continue;
    if (advertiser && text === advertiser) continue;
    const rect = el.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    if (rect.top > cardRect.top + cardRect.height * 0.3) {
      return text;
    }
  }

  // Strategy 2: computed style check for font-weight in lower portion
  const allSpans = card.querySelectorAll('span, div');
  for (const el of allSpans) {
    if (isInjectedElement(el)) continue;
    const style = window.getComputedStyle(el);
    const weight = parseInt(style.fontWeight, 10);
    if (weight >= 600) {
      const text = el.innerText?.trim();
      if (!text || text.length < 5 || text.length > 200 || el.children.length > 2) continue;
      if (skipTexts.test(text)) continue;
      if (advertiser && text === advertiser) continue;
      if (isJunkText(text, advertiser)) continue;
      const rect = el.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      if (rect.top > cardRect.top + cardRect.height * 0.3) {
        return text;
      }
    }
  }

  return '';
}

/**
 * EXTRACT: Description
 *
 * The description is a secondary text block that appears below the headline
 * and above the CTA. It is shorter than the primary text.
 */
function extractDescription(card) {
  const headline = extractHeadline(card);
  const primaryText = extractPrimaryText(card);
  const advertiser = extractAdvertiserName(card);

  // The description is a secondary text near the CTA/headline area at the bottom
  const textElements = card.querySelectorAll('div, span, p');
  for (const el of textElements) {
    if (el.children.length > 3) continue;
    if (isInjectedElement(el)) continue;
    const text = el.innerText?.trim();
    if (!text || text.length < 10 || text.length > 300) continue;
    if (text === headline || text === primaryText) continue;
    if (isJunkText(text, advertiser)) continue;

    const rect = el.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    if (rect.top > cardRect.top + cardRect.height * 0.5) {
      return text;
    }
  }

  return '';
}

/**
 * EXTRACT: CTA button text and type
 *
 * The CTA button is typically a <button> or styled <a> element with text like
 * "Shop Now", "Learn More", "Sign Up", etc.
 *
 * Strategy:
 *   1. Look for <button> elements in the lower half of the card.
 *   2. Look for <a> elements styled as buttons (with specific CTA text patterns).
 *   3. Look for elements with role="button".
 */
function extractCTA(card) {
  const ctaPatterns = /^(shop now|learn more|sign up|download|get offer|book now|contact us|apply now|subscribe|watch more|get quote|order now|see menu|send message|get directions|call now|install now|use app|play game|listen now|open link|buy tickets|request time|get showtimes|see more)/i;

  // Strategy 1: actual <button> elements
  const buttons = card.querySelectorAll('button');
  for (const btn of buttons) {
    const text = btn.innerText?.trim();
    if (text && ctaPatterns.test(text)) {
      return { text, type: categorizeCTA(text) };
    }
  }

  // Strategy 2: links styled as buttons or with CTA text
  const links = card.querySelectorAll('a');
  for (const link of links) {
    const text = link.innerText?.trim();
    if (text && ctaPatterns.test(text)) {
      return { text, type: categorizeCTA(text), url: link.href };
    }
  }

  // Strategy 3: role="button" elements
  const roleButtons = card.querySelectorAll('[role="button"]');
  for (const el of roleButtons) {
    const text = el.innerText?.trim();
    if (text && ctaPatterns.test(text)) {
      return { text, type: categorizeCTA(text) };
    }
  }

  return { text: '', type: 'none' };
}

/**
 * Map CTA text to a standardized type.
 */
function categorizeCTA(text) {
  const lower = text.toLowerCase();
  if (lower.includes('shop') || lower.includes('buy') || lower.includes('order')) return 'SHOP_NOW';
  if (lower.includes('learn')) return 'LEARN_MORE';
  if (lower.includes('sign up') || lower.includes('subscribe')) return 'SIGN_UP';
  if (lower.includes('download') || lower.includes('install')) return 'DOWNLOAD';
  if (lower.includes('book') || lower.includes('request')) return 'BOOK_NOW';
  if (lower.includes('contact') || lower.includes('message') || lower.includes('call')) return 'CONTACT';
  if (lower.includes('apply')) return 'APPLY_NOW';
  if (lower.includes('watch') || lower.includes('play') || lower.includes('listen')) return 'WATCH_MORE';
  return 'OTHER';
}

/**
 * EXTRACT: Destination URL
 *
 * The destination URL is usually on the CTA link or in a visible URL display
 * element (Meta sometimes shows a truncated URL).
 *
 * Strategy:
 *   1. Find the CTA link href (if the CTA is an <a>).
 *   2. Look for a displayed URL (e.g. a span that looks like "example.com/...").
 *   3. Check for data attributes.
 */
function extractDestinationURL(card) {
  // Strategy 1: CTA link
  const cta = extractCTA(card);
  if (cta.url && !cta.url.includes('facebook.com')) {
    return cta.url;
  }

  // Strategy 2: External links in the card
  const links = card.querySelectorAll('a[href]');
  for (const link of links) {
    const href = link.href;
    if (href && !href.includes('facebook.com') && !href.includes('fb.com') && !href.startsWith('javascript:')) {
      return href;
    }
  }

  // Strategy 3: Displayed URL text (looks like a domain)
  const allText = card.querySelectorAll('span, div');
  const urlPattern = /^[a-z0-9][-a-z0-9]*\.[a-z]{2,}(?:\/\S*)?$/i;
  for (const el of allText) {
    const text = el.innerText?.trim();
    if (text && urlPattern.test(text) && el.children.length === 0) {
      return text.startsWith('http') ? text : `https://${text}`;
    }
  }

  return '';
}

/**
 * EXTRACT: Advertiser / Page name
 *
 * Strategy:
 *   1. The advertiser name is almost always at the top of the card, typically
 *      inside a link to the Facebook page.
 *   2. Look for <a> elements whose href points to a Facebook page and that
 *      are in the top 30% of the card.
 *   3. Fallback: the first bold/heading text in the card.
 */
function extractAdvertiserName(card) {
  // Strategy 1: Find the link near "Sponsored" text — this is the page name
  const spans = card.querySelectorAll('span');
  for (const span of spans) {
    if (span.textContent?.trim() === 'Sponsored') {
      // Walk up a few levels and look for a sibling/nearby <a> linking to a FB page
      let container = span.parentElement;
      for (let i = 0; i < 5 && container; i++) {
        const link = container.querySelector('a[href*="facebook.com/"]:not([href*="/ads/library"])');
        if (link) {
          const text = link.innerText?.trim();
          if (text && text.length > 1 && text.length < 100 && text !== 'Sponsored') {
            return text;
          }
        }
        container = container.parentElement;
      }
    }
  }

  // Strategy 2: link to a Facebook page (not ads/library)
  const links = card.querySelectorAll('a[href]');
  for (const link of links) {
    const href = link.href || '';
    const text = link.innerText?.trim();
    if (
      href.includes('facebook.com') &&
      !href.includes('/ads/library') &&
      text &&
      text.length > 1 &&
      text.length < 100 &&
      text !== 'Sponsored'
    ) {
      return text;
    }
  }

  return '';
}

/**
 * EXTRACT: Ad start and end dates
 *
 * Meta shows dates like "Started running on Jan 15, 2025" or
 * "Jan 15, 2025 - Feb 1, 2025".
 *
 * Strategy: Search for text nodes matching date patterns.
 */
function extractDates(card) {
  const allText = card.innerText || '';

  // Pattern: "Started running on <date>"
  const startMatch = allText.match(/[Ss]tarted\s+running\s+on\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/);
  const startDate = startMatch ? startMatch[1].trim() : '';

  // Pattern: date range "Jan 15, 2025 - Feb 1, 2025" or "Ended on <date>"
  const endMatch = allText.match(/[Ee]nded\s+on\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/)
    || allText.match(/[-–]\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/);
  const endDate = endMatch ? endMatch[1].trim() : '';

  return { startDate, endDate };
}

/**
 * EXTRACT: Ad status (Active / Inactive)
 *
 * Strategy: Look for text "Active" or "Inactive" badges. Meta often styles
 * these with a colored indicator.
 */
function extractStatus(card) {
  const allText = card.innerText || '';

  // Direct text match
  if (/\bActive\b/.test(allText) && !/\bInactive\b/.test(allText)) {
    return 'Active';
  }
  if (/\bInactive\b/.test(allText)) {
    return 'Inactive';
  }

  // Look for status indicator elements
  const statusEl = card.querySelector('[data-testid*="status"], [aria-label*="Active"], [aria-label*="Inactive"]');
  if (statusEl) {
    const label = statusEl.getAttribute('aria-label') || statusEl.innerText || '';
    if (/active/i.test(label)) return label.includes('Inactive') ? 'Inactive' : 'Active';
  }

  return 'Unknown';
}

/**
 * EXTRACT: Platform placements
 *
 * Meta may show icons or text for Facebook, Instagram, Messenger,
 * Audience Network.
 */
function extractPlatforms(card) {
  const platforms = [];
  const allText = card.innerText || '';

  if (/\bFacebook\b/i.test(allText)) platforms.push('Facebook');
  if (/\bInstagram\b/i.test(allText)) platforms.push('Instagram');
  if (/\bMessenger\b/i.test(allText)) platforms.push('Messenger');
  if (/\bAudience\s+Network\b/i.test(allText)) platforms.push('Audience Network');

  // Also check for platform icons via aria-label or title attributes
  const icons = card.querySelectorAll('[aria-label], [title]');
  for (const icon of icons) {
    const label = (icon.getAttribute('aria-label') || icon.getAttribute('title') || '').toLowerCase();
    if (label.includes('facebook') && !platforms.includes('Facebook')) platforms.push('Facebook');
    if (label.includes('instagram') && !platforms.includes('Instagram')) platforms.push('Instagram');
    if (label.includes('messenger') && !platforms.includes('Messenger')) platforms.push('Messenger');
  }

  return platforms.length > 0 ? platforms : ['Facebook']; // Default to Facebook
}

/**
 * EXTRACT: Ad format type
 *
 * Determine if the ad is an image, video, carousel, or collection.
 */
function extractAdFormat(card) {
  const videos = card.querySelectorAll('video');
  const images = card.querySelectorAll('img');
  const carouselIndicators = card.querySelectorAll(
    '[aria-label*="carousel"], [aria-label*="scroll"], [role="tablist"], [data-testid*="carousel"]'
  );

  // Check for multiple navigable panels (carousel)
  const nextButtons = card.querySelectorAll('[aria-label*="Next"], [aria-label*="next"]');

  if (carouselIndicators.length > 0 || nextButtons.length > 0) {
    return 'carousel';
  }
  if (videos.length > 0) {
    return 'video';
  }
  if (images.length > 0) {
    return 'image';
  }
  return 'unknown';
}

/**
 * EXTRACT: Carousel cards
 *
 * If the ad is a carousel, extract data from each individual card/slide.
 *
 * Strategy:
 *   - Carousels typically have a scrollable container with individual panels.
 *   - Each panel has its own image, headline, and sometimes description.
 *   - We look for navigable panels within the card.
 */
function extractCarouselCards(card) {
  const carouselItems = [];

  // Look for individual slide containers
  const slides = card.querySelectorAll(
    '[role="tabpanel"], [role="group"], [aria-roledescription="slide"]'
  );

  if (slides.length > 0) {
    slides.forEach((slide, index) => {
      const img = slide.querySelector('img');
      const video = slide.querySelector('video');
      const textEls = slide.querySelectorAll('span, div, p');
      let slideHeadline = '';
      let slideDescription = '';

      for (const el of textEls) {
        const text = el.innerText?.trim();
        if (!text || text.length < 3) continue;
        if (!slideHeadline && text.length < 100) {
          slideHeadline = text;
        } else if (!slideDescription && text.length < 300) {
          slideDescription = text;
        }
      }

      carouselItems.push({
        index,
        image: img?.src || '',
        video: video?.src || video?.querySelector('source')?.src || '',
        poster: video?.poster || '',
        headline: slideHeadline,
        description: slideDescription,
      });
    });
  }

  return carouselItems;
}

/**
 * EXTRACT: Country/region targeting
 *
 * Meta sometimes shows "This ad ran in <countries>" or displays country badges.
 */
function extractCountryTargeting(card) {
  const allText = card.innerText || '';
  const countries = [];

  // Pattern: "This ad ran in United States, United Kingdom"
  const ranInMatch = allText.match(/(?:ran|running)\s+in\s+([A-Z][^.]+)/i);
  if (ranInMatch) {
    const countryStr = ranInMatch[1];
    // Split by comma and clean up
    countries.push(...countryStr.split(',').map((c) => c.trim()).filter(Boolean));
  }

  // Look for country code badges or labels
  const badges = card.querySelectorAll('[data-testid*="country"], [aria-label*="country"]');
  for (const badge of badges) {
    const text = badge.innerText?.trim() || badge.getAttribute('aria-label') || '';
    if (text) countries.push(text);
  }

  return countries;
}

/**
 * MASTER EXTRACTION: Pull all data from an ad card into a structured object.
 */
/**
 * Check if an element is one of our injected UI elements (should be skipped during extraction).
 */
function isInjectedElement(el) {
  if (!el) return false;
  if (el.classList && (
    el.classList.contains('mals-save-btn') ||
    el.classList.contains('mals-copy-btn') ||
    el.classList.contains('mals-quick-copy-bar') ||
    el.classList.contains('mals-checkbox-wrapper') ||
    el.classList.contains('mals-saved-badge') ||
    el.classList.contains('mals-bulk-bar')
  )) return true;
  // Check if any ancestor is an injected element
  if (el.closest && el.closest('[class*="mals-"]')) return true;
  return false;
}

function extractAllAdData(card) {
  const creatives = extractCreative(card);
  const cta = extractCTA(card);
  const dates = extractDates(card);
  const format = extractAdFormat(card);

  // Find the best image and video from creatives
  const firstImage = creatives.find(c => c.type === 'image');
  const firstVideo = creatives.find(c => c.type === 'video');

  const adData = {
    adLibraryId: extractAdLibraryId(card),
    advertiserName: extractAdvertiserName(card),
    primaryText: extractPrimaryText(card),
    headline: extractHeadline(card),
    description: extractDescription(card),
    ctaType: cta.type || 'OTHER',
    destinationUrl: extractDestinationURL(card) || cta.url || '',
    creativeUrl: firstImage?.src || firstVideo?.poster || '',
    videoUrl: firstVideo?.src || '',
    format: format,
    status: extractStatus(card),
    platforms: extractPlatforms(card),
    countries: extractCountryTargeting(card),
    adStartDate: dates.startDate || null,
    adEndDate: dates.endDate || null,
    sourceUrl: window.location.href,
  };

  // If carousel, include card-level data mapped to API format
  if (format === 'carousel') {
    const rawCards = extractCarouselCards(card);
    adData.carouselCards = rawCards.map((c, i) => ({
      position: i,
      imageUrl: c.image || '',
      headline: c.headline || '',
      description: c.description || '',
      url: '',
    }));
  }

  return adData;
}

// ---------------------------------------------------------------------------
// UI injection — Save Button
// ---------------------------------------------------------------------------

/**
 * Inject a "Save" button into an ad card.
 * The button is positioned at the top-right of the card.
 */
function injectSaveButton(card, adId) {
  // Skip if already has a save button
  if (card.querySelector('.mals-save-btn')) return;

  // Ensure the card has relative positioning so we can absolute-position the button
  const currentPosition = window.getComputedStyle(card).position;
  if (currentPosition === 'static') {
    card.style.position = 'relative';
  }

  const btn = document.createElement('button');
  btn.className = 'mals-save-btn';
  btn.setAttribute('data-mals-ad-id', adId || '');
  btn.title = 'Save to Meta Ads Library Saver';

  // Bookmark SVG icon
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
    </svg>
    <span class="mals-save-btn-text">Save</span>
  `;

  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    e.preventDefault();
    await handleSaveAd(card, btn);
  });

  card.appendChild(btn);
}

/**
 * Handle the save action for a single ad.
 */
async function handleSaveAd(card, btn) {
  // Prevent double-clicks
  if (btn.classList.contains('mals-saving') || btn.classList.contains('mals-saved')) return;

  btn.classList.add('mals-saving');
  btn.querySelector('.mals-save-btn-text').textContent = 'Saving...';

  try {
    const adData = extractAllAdData(card);

    // Include folder/tag settings
    if (saveSettings.folderId) adData.folderIds = [saveSettings.folderId];
    if (saveSettings.tagIds?.length) adData.tagIds = saveSettings.tagIds;

    const response = await chrome.runtime.sendMessage({
      type: 'save-ad',
      adData,
    });

    if (response?.ok) {
      btn.classList.remove('mals-saving');
      btn.classList.add('mals-saved');
      btn.querySelector('.mals-save-btn-text').textContent = response.queued ? 'Queued' : 'Saved!';

      // Update local cache
      if (adData.adLibraryId) {
        savedAdIds.add(adData.adLibraryId);
      }
      markAsSaved(card);

      // Show brief success toast
      showToast(response.queued ? 'Ad queued for saving (offline mode)' : 'Ad saved successfully!');
    } else {
      btn.classList.remove('mals-saving');
      btn.querySelector('.mals-save-btn-text').textContent = 'Save';
      showToast(`Error: ${response?.error || 'Failed to save'}`, 'error');
    }
  } catch (err) {
    btn.classList.remove('mals-saving');
    btn.querySelector('.mals-save-btn-text').textContent = 'Save';
    showToast(`Error: ${err.message}`, 'error');
  }
}

// ---------------------------------------------------------------------------
// UI injection — Bulk Select Checkbox
// ---------------------------------------------------------------------------

/**
 * Inject a checkbox for bulk selection in each ad card.
 */
function injectCheckbox(card, adId) {
  // Skip if already has a checkbox
  if (card.querySelector('.mals-checkbox-wrapper')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'mals-checkbox-wrapper';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'mals-bulk-checkbox';
  checkbox.setAttribute('data-mals-ad-id', adId || '');

  checkbox.addEventListener('change', (e) => {
    e.stopPropagation();
    if (checkbox.checked) {
      selectedAds.add(card);
      card.classList.add('mals-selected');
    } else {
      selectedAds.delete(card);
      card.classList.remove('mals-selected');
    }
    updateBulkActionBar();
  });

  wrapper.appendChild(checkbox);
  card.appendChild(wrapper);
}

// ---------------------------------------------------------------------------
// UI injection — "Already Saved" Badge
// ---------------------------------------------------------------------------

/**
 * Add an "Already Saved" badge to a card.
 */
function markAsSaved(card) {
  if (card.querySelector('.mals-saved-badge')) return;

  const badge = document.createElement('div');
  badge.className = 'mals-saved-badge';
  badge.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
    <span>Saved</span>
  `;

  // Attach hover preview
  badge.addEventListener('mouseenter', (e) => showInlinePreview(card, e));
  badge.addEventListener('mouseleave', hideInlinePreview);

  card.appendChild(badge);
}

// ---------------------------------------------------------------------------
// UI injection — Quick Copy Buttons
// ---------------------------------------------------------------------------

/**
 * Inject quick-copy buttons for ad copy, headline, and URL.
 */
function injectQuickCopyButtons(card) {
  const container = document.createElement('div');
  container.className = 'mals-quick-copy-bar';

  const items = [
    { label: 'Copy Text', extractor: () => extractPrimaryText(card) },
    { label: 'Copy Headline', extractor: () => extractHeadline(card) },
    { label: 'Copy URL', extractor: () => extractDestinationURL(card) },
  ];

  for (const item of items) {
    const btn = document.createElement('button');
    btn.className = 'mals-copy-btn';
    btn.textContent = item.label;
    btn.title = item.label;

    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      const value = item.extractor();
      if (value) {
        await navigator.clipboard.writeText(value);
        btn.textContent = 'Copied!';
        btn.classList.add('mals-copied');
        setTimeout(() => {
          btn.textContent = item.label;
          btn.classList.remove('mals-copied');
        }, 1500);
      } else {
        btn.textContent = 'N/A';
        setTimeout(() => { btn.textContent = item.label; }, 1000);
      }
    });

    container.appendChild(btn);
  }

  card.appendChild(container);
}

// ---------------------------------------------------------------------------
// UI — Floating Bulk Action Bar
// ---------------------------------------------------------------------------

/**
 * Create the floating action bar that appears when ads are selected.
 */
function createBulkActionBar() {
  if (document.getElementById('mals-bulk-bar')) return;

  const bar = document.createElement('div');
  bar.id = 'mals-bulk-bar';
  bar.className = 'mals-bulk-bar';
  bar.innerHTML = `
    <div class="mals-bulk-bar-inner">
      <span class="mals-bulk-count">0 ads selected</span>
      <button class="mals-bulk-save-btn" id="mals-bulk-save">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
        Save Selected
      </button>
      <button class="mals-bulk-select-all-btn" id="mals-bulk-select-all">Select All</button>
      <button class="mals-bulk-clear-btn" id="mals-bulk-clear">Clear</button>
    </div>
  `;

  document.body.appendChild(bar);

  // Event listeners
  document.getElementById('mals-bulk-save').addEventListener('click', handleBulkSave);
  document.getElementById('mals-bulk-select-all').addEventListener('click', handleSelectAll);
  document.getElementById('mals-bulk-clear').addEventListener('click', handleClearSelection);
}

/**
 * Update the floating bar visibility and selected count.
 */
function updateBulkActionBar() {
  const bar = document.getElementById('mals-bulk-bar');
  if (!bar) return;

  const count = selectedAds.size;
  bar.querySelector('.mals-bulk-count').textContent = `${count} ad${count !== 1 ? 's' : ''} selected`;

  if (count > 0 && !bulkBarVisible) {
    bar.classList.add('mals-bulk-bar-visible');
    bulkBarVisible = true;
  } else if (count === 0 && bulkBarVisible) {
    bar.classList.remove('mals-bulk-bar-visible');
    bulkBarVisible = false;
  }
}

/**
 * Handle bulk save of selected ads.
 */
async function handleBulkSave() {
  const saveBtn = document.getElementById('mals-bulk-save');
  saveBtn.textContent = 'Saving...';
  saveBtn.disabled = true;

  try {
    const adsToSave = [];
    for (const card of selectedAds) {
      adsToSave.push(extractAllAdData(card));
    }

    const response = await chrome.runtime.sendMessage({
      type: 'bulk-save',
      ads: adsToSave,
    });

    if (response?.ok) {
      showToast(
        response.queued
          ? `${adsToSave.length} ads queued for saving (offline mode)`
          : `${adsToSave.length} ads saved successfully!`
      );

      // Mark all as saved
      for (const card of selectedAds) {
        const adId = extractAdLibraryId(card);
        if (adId) savedAdIds.add(adId);
        markAsSaved(card);
        const saveBtn = card.querySelector('.mals-save-btn');
        if (saveBtn) {
          saveBtn.classList.add('mals-saved');
          saveBtn.querySelector('.mals-save-btn-text').textContent = 'Saved!';
        }
      }

      handleClearSelection();
    } else {
      showToast(`Error: ${response?.error || 'Bulk save failed'}`, 'error');
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    saveBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
      </svg>
      Save Selected
    `;
    saveBtn.disabled = false;
  }
}

/**
 * Select all visible ad cards.
 */
function handleSelectAll() {
  const cards = document.querySelectorAll('[data-mals-processed="true"]');
  for (const card of cards) {
    selectedAds.add(card);
    card.classList.add('mals-selected');
    const checkbox = card.querySelector('.mals-bulk-checkbox');
    if (checkbox) checkbox.checked = true;
  }
  updateBulkActionBar();
}

/**
 * Clear all selections.
 */
function handleClearSelection() {
  for (const card of selectedAds) {
    card.classList.remove('mals-selected');
    const checkbox = card.querySelector('.mals-bulk-checkbox');
    if (checkbox) checkbox.checked = false;
  }
  selectedAds.clear();
  updateBulkActionBar();
}

// ---------------------------------------------------------------------------
// UI — Inline Preview Popover (on hover for saved ads)
// ---------------------------------------------------------------------------

let previewPopover = null;

function showInlinePreview(card, event) {
  hideInlinePreview();

  const adId = extractAdLibraryId(card);
  if (!adId) return;

  previewPopover = document.createElement('div');
  previewPopover.className = 'mals-preview-popover';
  previewPopover.innerHTML = `
    <div class="mals-preview-loading">Loading...</div>
  `;

  // Position near the badge
  const rect = event.target.getBoundingClientRect();
  previewPopover.style.top = `${rect.bottom + window.scrollY + 8}px`;
  previewPopover.style.left = `${rect.left + window.scrollX}px`;

  document.body.appendChild(previewPopover);

  // Fetch ad details from the background
  chrome.runtime.sendMessage({ type: 'check-duplicate', adLibraryId: adId })
    .then((response) => {
      if (!previewPopover) return;
      if (response?.ok && response.data) {
        const ad = response.data;
        previewPopover.innerHTML = `
          <div class="mals-preview-content">
            <div class="mals-preview-title">${escapeHtml(ad.advertiserName || 'Unknown Advertiser')}</div>
            ${ad.tags?.length ? `<div class="mals-preview-tags">${ad.tags.map((t) => `<span class="mals-preview-tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
            ${ad.notes ? `<div class="mals-preview-notes">${escapeHtml(ad.notes)}</div>` : ''}
            ${ad.folder ? `<div class="mals-preview-folder">Folder: ${escapeHtml(ad.folder)}</div>` : ''}
            <div class="mals-preview-date">Saved: ${ad.savedAt ? new Date(ad.savedAt).toLocaleDateString() : 'Unknown'}</div>
          </div>
        `;
      } else {
        previewPopover.innerHTML = `<div class="mals-preview-content"><em>Saved ad</em></div>`;
      }
    })
    .catch(() => {
      if (previewPopover) {
        previewPopover.innerHTML = `<div class="mals-preview-content"><em>Saved ad</em></div>`;
      }
    });
}

function hideInlinePreview() {
  if (previewPopover) {
    previewPopover.remove();
    previewPopover = null;
  }
}

// ---------------------------------------------------------------------------
// UI — Floating Save Settings Panel
// ---------------------------------------------------------------------------

let saveSettings = { folderId: '', tagIds: [] };
let availableFolders = [];
let availableTags = [];

function createFloatingSaveSettings() {
  if (document.getElementById('mals-settings-fab')) return;

  // Floating action button
  const fab = document.createElement('button');
  fab.id = 'mals-settings-fab';
  fab.className = 'mals-settings-fab';
  fab.title = 'Save Settings';
  fab.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  `;

  // Panel
  const panel = document.createElement('div');
  panel.id = 'mals-settings-panel';
  panel.className = 'mals-settings-panel';
  panel.style.display = 'none';
  panel.innerHTML = `
    <div class="mals-settings-header">
      <span class="mals-settings-title">Save Settings</span>
      <button id="mals-settings-close" class="mals-settings-close">&times;</button>
    </div>
    <div class="mals-settings-body">
      <label class="mals-settings-label">Folder</label>
      <select id="mals-folder-select" class="mals-settings-select">
        <option value="">No folder</option>
      </select>
      <label class="mals-settings-label" style="margin-top:12px">Tags</label>
      <div id="mals-tags-container" class="mals-tags-container">
        <span class="mals-settings-hint">Loading tags...</span>
      </div>
    </div>
  `;

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  fab.addEventListener('click', () => {
    const isOpen = panel.style.display !== 'none';
    if (isOpen) {
      panel.style.display = 'none';
    } else {
      panel.style.display = 'block';
      loadFoldersAndTags();
    }
  });

  document.getElementById('mals-settings-close').addEventListener('click', () => {
    panel.style.display = 'none';
  });

  document.getElementById('mals-folder-select').addEventListener('change', (e) => {
    saveSettings.folderId = e.target.value;
    chrome.storage.local.set({ malsSaveSettings: saveSettings });
  });

  // Load saved settings
  chrome.storage.local.get('malsSaveSettings').then(r => {
    if (r.malsSaveSettings) saveSettings = r.malsSaveSettings;
  });
}

async function loadFoldersAndTags() {
  try {
    const foldersRes = await chrome.runtime.sendMessage({ type: 'get-folders' });
    if (Array.isArray(foldersRes)) {
      availableFolders = foldersRes;
    } else if (foldersRes?.data) {
      availableFolders = foldersRes.data;
    }

    const select = document.getElementById('mals-folder-select');
    select.innerHTML = '<option value="">No folder</option>';
    for (const folder of availableFolders) {
      const opt = document.createElement('option');
      opt.value = folder.id;
      opt.textContent = folder.name;
      if (saveSettings.folderId === folder.id) opt.selected = true;
      select.appendChild(opt);
    }
  } catch (e) {
    console.warn('[MALS] Could not load folders:', e);
  }

  try {
    const tagsRes = await chrome.runtime.sendMessage({ type: 'GET_TAGS' });
    if (Array.isArray(tagsRes)) {
      availableTags = tagsRes;
    } else if (tagsRes?.data) {
      availableTags = tagsRes.data;
    }

    const container = document.getElementById('mals-tags-container');
    if (availableTags.length === 0) {
      container.innerHTML = '<span class="mals-settings-hint">No tags yet. Create them in the dashboard.</span>';
      return;
    }
    container.innerHTML = '';
    for (const tag of availableTags) {
      const chip = document.createElement('button');
      chip.className = 'mals-tag-chip' + (saveSettings.tagIds?.includes(tag.id) ? ' mals-tag-active' : '');
      chip.textContent = tag.name;
      chip.addEventListener('click', () => {
        const idx = saveSettings.tagIds.indexOf(tag.id);
        if (idx >= 0) {
          saveSettings.tagIds.splice(idx, 1);
          chip.classList.remove('mals-tag-active');
        } else {
          saveSettings.tagIds.push(tag.id);
          chip.classList.add('mals-tag-active');
        }
        chrome.storage.local.set({ malsSaveSettings: saveSettings });
      });
      container.appendChild(chip);
    }
  } catch (e) {
    console.warn('[MALS] Could not load tags:', e);
  }
}

// ---------------------------------------------------------------------------
// UI — Toast Notifications
// ---------------------------------------------------------------------------

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `mals-toast mals-toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger entrance animation
  requestAnimationFrame(() => {
    toast.classList.add('mals-toast-visible');
  });

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    toast.classList.remove('mals-toast-visible');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3000);
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
