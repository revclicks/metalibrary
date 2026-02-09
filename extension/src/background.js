// Background Service Worker - Handles API calls and authentication state

const API_BASE = "http://localhost:3002/api";

// Store auth token
let authToken = null;

// Initialize from storage
chrome.storage.local.get(["authToken"], (result) => {
  authToken = result.authToken || null;
});

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SAVE_AD") {
    saveAd(message.data).then(sendResponse);
    return true; // async response
  }

  if (message.type === "CHECK_DUPLICATE") {
    checkDuplicate(message.adLibraryId).then(sendResponse);
    return true;
  }

  if (message.type === "GET_AUTH") {
    sendResponse({ token: authToken });
    return false;
  }

  if (message.type === "SET_AUTH") {
    authToken = message.token;
    chrome.storage.local.set({ authToken: message.token });
    sendResponse({ success: true });
    return false;
  }

  if (message.type === "LOGOUT") {
    authToken = null;
    chrome.storage.local.remove(["authToken"]);
    sendResponse({ success: true });
    return false;
  }

  if (message.type === "GET_FOLDERS") {
    getFolders().then(sendResponse);
    return true;
  }

  if (message.type === "GET_TAGS") {
    getTags().then(sendResponse);
    return true;
  }

  if (message.type === "GET_RECENT_SAVES") {
    getRecentSaves().then(sendResponse);
    return true;
  }
});

async function apiCall(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        ...options.headers,
      },
    });
    return await res.json();
  } catch (err) {
    console.error("API call failed:", err);
    return { error: "Network error" };
  }
}

async function saveAd(adData) {
  return apiCall("/ads", {
    method: "POST",
    body: JSON.stringify(adData),
  });
}

async function checkDuplicate(adLibraryId) {
  const result = await apiCall(`/ads?search=${encodeURIComponent(adLibraryId)}&limit=1`);
  return { isDuplicate: result.ads && result.ads.length > 0 };
}

async function getFolders() {
  return apiCall("/folders");
}

async function getTags() {
  return apiCall("/tags");
}

async function getRecentSaves() {
  return apiCall("/ads?limit=10&sortBy=savedAt&sortOrder=desc");
}
