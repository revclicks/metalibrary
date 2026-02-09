// Content Script - Injected into Meta Ads Library pages
// Adds save buttons, status badges, and quick actions to ad cards

(function () {
  "use strict";

  const SAVE_BTN_CLASS = "meta-ads-saver-btn";
  const SAVED_BADGE_CLASS = "meta-ads-saved-badge";
  const BULK_BAR_CLASS = "meta-ads-bulk-bar";

  let savedAdIds = new Set();
  let selectedAds = new Set();

  // Initialize
  init();

  async function init() {
    // Wait for page to load
    await waitForAds();

    // Load saved ad IDs for duplicate detection
    loadSavedIds();

    // Inject save buttons into ad cards
    injectButtons();

    // Watch for new ads loaded (infinite scroll)
    observeNewAds();
  }

  function waitForAds() {
    return new Promise((resolve) => {
      const check = () => {
        const ads = document.querySelectorAll('[class*="xrvj5dj"]');
        if (ads.length > 0) {
          resolve();
        } else {
          setTimeout(check, 500);
        }
      };
      check();
    });
  }

  function loadSavedIds() {
    chrome.storage.local.get(["savedAdIds"], (result) => {
      if (result.savedAdIds) {
        savedAdIds = new Set(result.savedAdIds);
      }
    });
  }

  function injectButtons() {
    // Find all ad card containers
    const adCards = document.querySelectorAll('[class*="xrvj5dj"]');

    adCards.forEach((card) => {
      if (card.querySelector(`.${SAVE_BTN_CLASS}`)) return; // Already injected

      const adData = extractAdData(card);
      if (!adData) return;

      // Create save button
      const saveBtn = document.createElement("button");
      saveBtn.className = SAVE_BTN_CLASS;
      saveBtn.innerHTML = savedAdIds.has(adData.adLibraryId)
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Saved'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Save';

      if (savedAdIds.has(adData.adLibraryId)) {
        saveBtn.classList.add("saved");
      }

      saveBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        handleSaveAd(adData, saveBtn);
      });

      // Create quick actions container
      const actionsContainer = document.createElement("div");
      actionsContainer.className = "meta-ads-saver-actions";

      // Copy ad text button
      if (adData.primaryText) {
        const copyBtn = document.createElement("button");
        copyBtn.className = "meta-ads-saver-action-btn";
        copyBtn.title = "Copy ad text";
        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
        copyBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(adData.primaryText);
          showToast("Ad text copied!");
        });
        actionsContainer.appendChild(copyBtn);
      }

      // Open landing page button
      if (adData.destinationUrl) {
        const linkBtn = document.createElement("button");
        linkBtn.className = "meta-ads-saver-action-btn";
        linkBtn.title = "Open landing page";
        linkBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
        linkBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          window.open(adData.destinationUrl, "_blank");
        });
        actionsContainer.appendChild(linkBtn);
      }

      // Find a good place to inject the button
      const headerArea = card.querySelector('[class*="x1lliihq"]') || card;
      headerArea.style.position = "relative";
      headerArea.appendChild(saveBtn);
      headerArea.appendChild(actionsContainer);
    });
  }

  function extractAdData(card) {
    try {
      // Extract text content from the ad card
      const allText = card.innerText || "";
      const links = card.querySelectorAll("a[href]");

      // Try to find the Ad Library ID from links or data attributes
      let adLibraryId = "";
      links.forEach((link) => {
        const href = link.getAttribute("href") || "";
        const match = href.match(/id=(\d+)/);
        if (match) adLibraryId = match[1];
      });

      // Extract various text elements
      const textElements = card.querySelectorAll("span, div");
      let advertiserName = "";
      let primaryText = "";
      let headline = "";
      let description = "";
      let ctaType = "";

      // The first prominent text is usually the advertiser name
      const nameEl = card.querySelector('[class*="x1heor9g"]') || card.querySelector("strong");
      if (nameEl) advertiserName = nameEl.textContent.trim();

      // Find the ad body text
      const bodyEl = card.querySelector('[class*="xz9dl7a"]');
      if (bodyEl) primaryText = bodyEl.textContent.trim();

      // Find headline (usually in a link with bold text)
      const headlineEl = card.querySelector('[class*="x1s688f"]');
      if (headlineEl) headline = headlineEl.textContent.trim();

      // Find CTA button text
      const ctaEl = card.querySelector('[class*="x1ja2u2z"]');
      if (ctaEl) ctaType = ctaEl.textContent.trim();

      // Find destination URL
      let destinationUrl = "";
      links.forEach((link) => {
        const href = link.getAttribute("href") || "";
        if (href.startsWith("http") && !href.includes("facebook.com")) {
          destinationUrl = href;
        }
      });

      // Find creative (image or video)
      let creativeUrl = "";
      let videoUrl = "";
      const img = card.querySelector("img[src*='scontent']");
      if (img) creativeUrl = img.src;

      const video = card.querySelector("video source, video");
      if (video) videoUrl = video.src || video.querySelector("source")?.src || "";

      // Detect format
      let format = "image";
      if (videoUrl) format = "video";
      const carouselIndicator = card.querySelector('[class*="x1n2onr6"]');
      if (carouselIndicator) format = "carousel";

      // Find status
      let status = "active";
      if (allText.toLowerCase().includes("inactive")) status = "inactive";

      // Find platforms
      let platforms = "";
      if (allText.includes("Facebook")) platforms += "Facebook,";
      if (allText.includes("Instagram")) platforms += "Instagram,";
      if (allText.includes("Messenger")) platforms += "Messenger,";
      if (allText.includes("Audience Network")) platforms += "Audience Network,";
      platforms = platforms.replace(/,$/, "");

      return {
        adLibraryId,
        advertiserName: advertiserName || "Unknown Advertiser",
        primaryText,
        headline,
        description,
        ctaType,
        destinationUrl,
        creativeUrl,
        videoUrl,
        format,
        status,
        platforms,
      };
    } catch (err) {
      console.error("Error extracting ad data:", err);
      return null;
    }
  }

  async function handleSaveAd(adData, button) {
    // Check authentication
    const authResult = await chrome.runtime.sendMessage({ type: "GET_AUTH" });
    if (!authResult.token) {
      showToast("Please sign in first (click the extension icon)", "error");
      return;
    }

    // Check for duplicate
    if (adData.adLibraryId) {
      const dupCheck = await chrome.runtime.sendMessage({
        type: "CHECK_DUPLICATE",
        adLibraryId: adData.adLibraryId,
      });
      if (dupCheck.isDuplicate) {
        showToast("This ad has already been saved!", "warning");
        return;
      }
    }

    // Update button state
    button.classList.add("saving");
    button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spinning"><circle cx="12" cy="12" r="10"/></svg> Saving...';

    // Save via background script
    const result = await chrome.runtime.sendMessage({
      type: "SAVE_AD",
      data: adData,
    });

    if (result.error) {
      button.classList.remove("saving");
      button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Save';
      showToast(`Error: ${result.error}`, "error");
    } else {
      button.classList.remove("saving");
      button.classList.add("saved");
      button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Saved';
      savedAdIds.add(adData.adLibraryId);
      chrome.storage.local.set({ savedAdIds: [...savedAdIds] });
      showToast("Ad saved successfully!");
    }
  }

  function observeNewAds() {
    const observer = new MutationObserver((mutations) => {
      let hasNewNodes = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          hasNewNodes = true;
          break;
        }
      }
      if (hasNewNodes) {
        setTimeout(injectButtons, 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function showToast(message, type = "success") {
    const existing = document.querySelector(".meta-ads-saver-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `meta-ads-saver-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
})();
