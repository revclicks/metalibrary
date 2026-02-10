const API_BASE = 'https://metalibrary.vercel.app/api'

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_AD') {
    saveAd(message.data).then(sendResponse).catch(err => sendResponse({ error: err.message }))
    return true // Keep channel open for async response
  }

  if (message.type === 'SAVE_BULK') {
    saveBulkAds(message.data).then(sendResponse).catch(err => sendResponse({ error: err.message }))
    return true
  }

  if (message.type === 'CHECK_SAVED') {
    checkSaved(message.adLibraryId).then(sendResponse).catch(err => sendResponse({ error: err.message }))
    return true
  }

  if (message.type === 'GET_FOLDERS') {
    getFolders().then(sendResponse).catch(err => sendResponse({ error: err.message }))
    return true
  }

  if (message.type === 'GET_TAGS') {
    getTags().then(sendResponse).catch(err => sendResponse({ error: err.message }))
    return true
  }

  if (message.type === 'GET_AUTH_STATUS') {
    getAuthStatus().then(sendResponse).catch(err => sendResponse({ error: err.message }))
    return true
  }

  // Content script message handlers (lowercase variants)
  if (message.type === 'save-ad') {
    saveAd(message.adData).then(r => sendResponse({ ok: true, data: r })).catch(err => sendResponse({ ok: false, error: err.message }))
    return true
  }

  if (message.type === 'bulk-save') {
    saveBulkAds(message.ads).then(r => sendResponse({ ok: true, data: r })).catch(err => sendResponse({ ok: false, error: err.message }))
    return true
  }

  if (message.type === 'get-saved-ad-ids') {
    (async () => {
      const queue = (await chrome.storage.local.get('savedAds'))?.savedAds || []
      const ids = queue.map(a => a.adLibraryId).filter(Boolean)
      sendResponse({ ok: true, data: ids })
    })()
    return true
  }

  if (message.type === 'check-duplicate') {
    checkSaved(message.adLibraryId).then(r => sendResponse({ ok: true, data: r })).catch(err => sendResponse({ ok: false, error: err.message }))
    return true
  }

  // Popup message handlers
  if (message.type === 'get-auth-state') {
    getAuthStatus().then(sendResponse).catch(err => sendResponse({ error: err.message }))
    return true
  }

  if (message.type === 'login') {
    handleLogin(message.email, message.password).then(sendResponse).catch(err => sendResponse({ error: err.message }))
    return true
  }

  if (message.type === 'logout') {
    handleLogout().then(sendResponse).catch(err => sendResponse({ error: err.message }))
    return true
  }

  if (message.type === 'get-recent-saves') {
    getRecentSaves(message.limit).then(sendResponse).catch(err => sendResponse({ error: err.message }))
    return true
  }

  if (message.type === 'get-queue-status') {
    getQueueStatus().then(sendResponse).catch(err => sendResponse({ error: err.message }))
    return true
  }

  if (message.type === 'flush-queue') {
    flushQueue().then(sendResponse).catch(err => sendResponse({ error: err.message }))
    return true
  }

  if (message.type === 'get-settings') {
    chrome.storage.local.get('settings').then(r => sendResponse(r.settings || {})).catch(err => sendResponse({ error: err.message }))
    return true
  }

  if (message.type === 'save-settings') {
    chrome.storage.local.set({ settings: message.settings }).then(() => sendResponse({ success: true })).catch(err => sendResponse({ error: err.message }))
    return true
  }

  if (message.type === 'get-folders') {
    getFolders().then(sendResponse).catch(err => sendResponse({ error: err.message }))
    return true
  }

  if (message.type === 'open-dashboard') {
    chrome.tabs.create({ url: 'https://metalibrary.vercel.app/dashboard' })
    sendResponse({ success: true })
    return false
  }
})

async function getAuthToken() {
  const result = await chrome.storage.local.get('authToken')
  return result.authToken
}

async function apiRequest(endpoint, options = {}) {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }
  return response.json()
}

async function saveAd(adData) {
  try {
    const result = await apiRequest('/ads', {
      method: 'POST',
      body: JSON.stringify(adData),
    })

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Ad Saved!',
      message: `Saved ad from ${adData.advertiserName}`,
    })

    // Store in local queue as backup
    const queue = (await chrome.storage.local.get('savedAds'))?.savedAds || []
    queue.unshift({ ...adData, savedAt: new Date().toISOString(), synced: true })
    await chrome.storage.local.set({ savedAds: queue.slice(0, 50) })

    return result
  } catch (error) {
    // Offline queue - save locally for later sync
    const queue = (await chrome.storage.local.get('offlineQueue'))?.offlineQueue || []
    queue.push({ ...adData, savedAt: new Date().toISOString() })
    await chrome.storage.local.set({ offlineQueue: queue })
    throw error
  }
}

async function saveBulkAds(adsData) {
  const results = []
  for (const ad of adsData) {
    try {
      const result = await saveAd(ad)
      results.push({ success: true, ad: result })
    } catch (error) {
      results.push({ success: false, error: error.message, ad })
    }
  }
  return results
}

async function checkSaved(adLibraryId) {
  try {
    const result = await apiRequest(`/ads?search=${encodeURIComponent(adLibraryId)}&pageSize=1`)
    return { saved: result.data && result.data.length > 0 }
  } catch {
    return { saved: false }
  }
}

async function getFolders() {
  return apiRequest('/folders')
}

async function getTags() {
  return apiRequest('/tags')
}

async function getAuthStatus() {
  try {
    const result = await apiRequest('/auth/me')
    return { authenticated: true, user: result.user }
  } catch {
    return { authenticated: false }
  }
}

async function handleLogin(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Login failed' }))
    throw new Error(error.error || 'Login failed')
  }
  const data = await response.json()
  if (data.token) {
    await chrome.storage.local.set({ authToken: data.token })
  }
  return { authenticated: true, user: data.user }
}

async function handleLogout() {
  await chrome.storage.local.remove(['authToken'])
  return { success: true }
}

async function getRecentSaves(limit = 15) {
  const queue = (await chrome.storage.local.get('savedAds'))?.savedAds || []
  return { saves: queue.slice(0, limit) }
}

async function getQueueStatus() {
  const queue = (await chrome.storage.local.get('offlineQueue'))?.offlineQueue || []
  return { count: queue.length }
}

async function flushQueue() {
  const queue = (await chrome.storage.local.get('offlineQueue'))?.offlineQueue || []
  const results = []
  for (const ad of queue) {
    try {
      await saveAd(ad)
      results.push({ success: true })
    } catch (e) {
      results.push({ success: false, error: e.message })
    }
  }
  await chrome.storage.local.set({ offlineQueue: [] })
  return { results }
}

// Keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: command })
    }
  })
})

// Context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-ad',
    title: 'Save to Ad Library',
    contexts: ['page'],
    documentUrlPatterns: ['https://www.facebook.com/ads/library/*'],
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-ad' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'save-ad' })
  }
})
