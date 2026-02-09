/**
 * Meta Ads Library Saver — Popup Script
 *
 * Controls the extension popup UI: authentication, recent saves display,
 * quick actions, and settings management.
 */

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------

const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const settingsView = document.getElementById('settings-view');

const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const loginBtn = document.getElementById('login-btn');

const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

const queueBanner = document.getElementById('queue-banner');
const queueMsg = document.getElementById('queue-msg');
const flushQueueBtn = document.getElementById('flush-queue-btn');

const openDashboardBtn = document.getElementById('open-dashboard-btn');
const goToLibraryBtn = document.getElementById('go-to-library-btn');

const recentList = document.getElementById('recent-list');
const recentEmpty = document.getElementById('recent-empty');

const settingsToggle = document.getElementById('settings-toggle');
const settingsBack = document.getElementById('settings-back');
const settingDefaultFolder = document.getElementById('setting-default-folder');
const settingNotifications = document.getElementById('setting-notifications');
const settingDarkMode = document.getElementById('setting-dark-mode');

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentView = 'login'; // 'login' | 'dashboard' | 'settings'
let settings = {};

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
  // Load settings first (for dark mode)
  await loadSettings();
  applyDarkMode();

  // Check auth state
  const authState = await sendMessage({ type: 'get-auth-state' });

  if (authState?.authenticated) {
    showDashboard(authState.user);
  } else {
    showLogin();
  }

  // Check offline queue
  await checkQueueStatus();

  // Bind event listeners
  bindEvents();
});

// ---------------------------------------------------------------------------
// View management
// ---------------------------------------------------------------------------

function showView(viewName) {
  loginView.style.display = 'none';
  dashboardView.style.display = 'none';
  settingsView.style.display = 'none';

  currentView = viewName;

  switch (viewName) {
    case 'login':
      loginView.style.display = 'block';
      break;
    case 'dashboard':
      dashboardView.style.display = 'block';
      break;
    case 'settings':
      settingsView.style.display = 'block';
      break;
  }
}

function showLogin() {
  showView('login');
  loginEmail.value = '';
  loginPassword.value = '';
  loginError.style.display = 'none';
}

async function showDashboard(user) {
  showView('dashboard');

  if (user) {
    userName.textContent = user.name || user.email || 'User';
    userEmail.textContent = user.email || '';
  }

  // Load recent saves
  await loadRecentSaves();

  // Load folders for settings
  await loadFolders();
}

// ---------------------------------------------------------------------------
// Event binding
// ---------------------------------------------------------------------------

function bindEvents() {
  // Login
  loginForm.addEventListener('submit', handleLogin);

  // Logout
  logoutBtn.addEventListener('click', handleLogout);

  // Quick actions
  openDashboardBtn.addEventListener('click', () => {
    sendMessage({ type: 'open-dashboard' });
    window.close();
  });

  goToLibraryBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.facebook.com/ads/library/' });
    window.close();
  });

  // Settings
  settingsToggle.addEventListener('click', () => showView('settings'));
  settingsBack.addEventListener('click', () => showView('dashboard'));

  // Settings changes
  settingDefaultFolder.addEventListener('change', () => saveSettingValue('defaultFolder', settingDefaultFolder.value));
  settingNotifications.addEventListener('change', () => saveSettingValue('notifications', settingNotifications.checked));
  settingDarkMode.addEventListener('change', () => {
    saveSettingValue('darkMode', settingDarkMode.checked);
    applyDarkMode();
  });

  // Queue flush
  flushQueueBtn.addEventListener('click', handleFlushQueue);
}

// ---------------------------------------------------------------------------
// Auth handlers
// ---------------------------------------------------------------------------

async function handleLogin(e) {
  e.preventDefault();

  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    showLoginError('Please enter both email and password.');
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';
  loginError.style.display = 'none';

  try {
    const result = await sendMessage({ type: 'login', email, password });

    if (result?.ok) {
      showDashboard(result.data?.user);
    } else {
      showLoginError(result?.error || 'Login failed. Check your credentials.');
    }
  } catch (err) {
    showLoginError('Could not connect to the dashboard. Is it running?');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
}

async function handleLogout() {
  await sendMessage({ type: 'logout' });
  showLogin();
}

function showLoginError(msg) {
  loginError.textContent = msg;
  loginError.style.display = 'block';
}

// ---------------------------------------------------------------------------
// Recent saves
// ---------------------------------------------------------------------------

async function loadRecentSaves() {
  recentList.innerHTML = '<div class="loading-spinner"></div>';
  recentEmpty.style.display = 'none';

  try {
    const result = await sendMessage({ type: 'get-recent-saves', limit: 15 });

    if (result?.ok && Array.isArray(result.data) && result.data.length > 0) {
      renderRecentSaves(result.data);
    } else if (result?.ok && result.data?.ads && result.data.ads.length > 0) {
      // Handle paginated response format
      renderRecentSaves(result.data.ads);
    } else {
      recentList.innerHTML = '';
      recentEmpty.style.display = 'block';
    }
  } catch (err) {
    recentList.innerHTML = '<div class="error-inline">Could not load recent saves</div>';
  }
}

function renderRecentSaves(ads) {
  recentList.innerHTML = '';

  for (const ad of ads) {
    const item = document.createElement('div');
    item.className = 'recent-item';

    // Thumbnail: use first creative image or a placeholder
    const thumbnail = ad.creatives?.[0]?.src || ad.thumbnail || '';
    const thumbHtml = thumbnail
      ? `<img src="${escapeAttr(thumbnail)}" class="recent-thumb" alt="" loading="lazy">`
      : `<div class="recent-thumb-placeholder">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
             <circle cx="8.5" cy="8.5" r="1.5"></circle>
             <polyline points="21 15 16 10 5 21"></polyline>
           </svg>
         </div>`;

    item.innerHTML = `
      ${thumbHtml}
      <div class="recent-info">
        <div class="recent-advertiser">${escapeHtml(ad.advertiserName || 'Unknown')}</div>
        <div class="recent-headline">${escapeHtml(truncate(ad.headline || ad.primaryText || '', 60))}</div>
        <div class="recent-meta">
          <span class="recent-status ${(ad.status || '').toLowerCase()}">${escapeHtml(ad.status || '')}</span>
          <span class="recent-date">${formatDate(ad.savedAt)}</span>
        </div>
      </div>
    `;

    // Click to open the ad in the Ads Library
    item.addEventListener('click', () => {
      if (ad.adLibraryId) {
        chrome.tabs.create({ url: `https://www.facebook.com/ads/library/?id=${ad.adLibraryId}` });
      } else if (ad.sourceUrl) {
        chrome.tabs.create({ url: ad.sourceUrl });
      }
    });

    recentList.appendChild(item);
  }
}

// ---------------------------------------------------------------------------
// Queue management
// ---------------------------------------------------------------------------

async function checkQueueStatus() {
  try {
    const result = await sendMessage({ type: 'get-queue-status' });
    if (result?.ok && result.count > 0) {
      queueBanner.style.display = 'flex';
      queueMsg.textContent = `${result.count} ad${result.count !== 1 ? 's' : ''} queued offline`;
    } else {
      queueBanner.style.display = 'none';
    }
  } catch {
    queueBanner.style.display = 'none';
  }
}

async function handleFlushQueue() {
  flushQueueBtn.disabled = true;
  flushQueueBtn.textContent = 'Syncing...';

  try {
    const result = await sendMessage({ type: 'flush-queue' });
    if (result?.ok) {
      if (result.remaining > 0) {
        queueMsg.textContent = `${result.remaining} ad${result.remaining !== 1 ? 's' : ''} still queued`;
      } else {
        queueBanner.style.display = 'none';
        // Refresh recent saves
        await loadRecentSaves();
      }
    }
  } catch {
    // ignore
  } finally {
    flushQueueBtn.disabled = false;
    flushQueueBtn.textContent = 'Sync Now';
  }
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

async function loadSettings() {
  try {
    const result = await sendMessage({ type: 'get-settings' });
    if (result?.ok && result.data) {
      settings = result.data;

      // Apply to UI
      settingNotifications.checked = settings.notifications !== false;
      settingDarkMode.checked = !!settings.darkMode;
      if (settings.defaultFolder) {
        settingDefaultFolder.value = settings.defaultFolder;
      }
    }
  } catch {
    settings = {};
  }
}

async function loadFolders() {
  try {
    const result = await sendMessage({ type: 'get-folders' });
    if (result?.ok && Array.isArray(result.data)) {
      // Preserve the "None" option
      settingDefaultFolder.innerHTML = '<option value="">None (choose each time)</option>';
      for (const folder of result.data) {
        const opt = document.createElement('option');
        opt.value = folder._id || folder.id || folder.name;
        opt.textContent = folder.name;
        settingDefaultFolder.appendChild(opt);
      }
      // Re-apply saved setting
      if (settings.defaultFolder) {
        settingDefaultFolder.value = settings.defaultFolder;
      }
    }
  } catch {
    // Folders unavailable
  }
}

async function saveSettingValue(key, value) {
  settings[key] = value;
  await sendMessage({ type: 'save-settings', settings });
}

function applyDarkMode() {
  if (settings.darkMode) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Send a message to the background service worker.
 */
function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function escapeAttr(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function truncate(str, maxLen) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;

    // Relative time for recent saves
    if (diff < 60_000) return 'Just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}
