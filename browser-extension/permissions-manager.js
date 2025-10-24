// Permissions Manager Logic

// Default permissions state
const defaultPermissions = {
  clipboard: false,
  autoSuggest: false,
  emailAnalysis: false,
  voiceInput: false,
  contextMenu: false,
  meetingAssistant: false,
  grammarChecker: false
};

let currentPermissions = { ...defaultPermissions };

// Load saved permissions on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadPermissions();
  setupEventListeners();
  updateUI();
});

// Load permissions from storage
async function loadPermissions() {
  try {
    const result = await chrome.storage.local.get(['permissions']);

    if (result.permissions) {
      currentPermissions = { ...defaultPermissions, ...result.permissions };
    }
  } catch (error) {
    console.error('Error loading permissions:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Individual toggle listeners
  document.getElementById('clipboardToggle').addEventListener('change', (e) => {
    handlePermissionToggle('clipboard', e.target.checked);
  });

  document.getElementById('autoSuggestToggle').addEventListener('change', (e) => {
    handlePermissionToggle('autoSuggest', e.target.checked);
  });

  document.getElementById('emailToggle').addEventListener('change', (e) => {
    handlePermissionToggle('emailAnalysis', e.target.checked);
  });

  document.getElementById('voiceToggle').addEventListener('change', (e) => {
    handlePermissionToggle('voiceInput', e.target.checked);
  });

  document.getElementById('contextMenuToggle').addEventListener('change', (e) => {
    handlePermissionToggle('contextMenu', e.target.checked);
  });

  document.getElementById('meetingToggle').addEventListener('change', (e) => {
    handlePermissionToggle('meetingAssistant', e.target.checked);
  });

  document.getElementById('grammarToggle').addEventListener('change', (e) => {
    handlePermissionToggle('grammarChecker', e.target.checked);
  });

  // Action buttons
  document.getElementById('saveBtn').addEventListener('click', savePermissions);
  document.getElementById('enableAllBtn').addEventListener('click', enableAllPermissions);
  document.getElementById('disableAllBtn').addEventListener('click', disableAllPermissions);
}

// Handle permission toggle
function handlePermissionToggle(permission, enabled) {
  currentPermissions[permission] = enabled;
  updateUI();
}

// Update UI to reflect current permissions
function updateUI() {
  // Clipboard
  updateToggleUI('clipboard', currentPermissions.clipboard, 'clipboardToggle', 'clipboardStatus', 'clipboardCard');

  // Auto-Suggest
  updateToggleUI('autoSuggest', currentPermissions.autoSuggest, 'autoSuggestToggle', 'autoSuggestStatus', 'autoSuggestCard');

  // Email Analysis
  updateToggleUI('emailAnalysis', currentPermissions.emailAnalysis, 'emailToggle', 'emailStatus', 'emailCard');

  // Voice Input
  updateToggleUI('voiceInput', currentPermissions.voiceInput, 'voiceToggle', 'voiceStatus', 'voiceCard');

  // Context Menu
  updateToggleUI('contextMenu', currentPermissions.contextMenu, 'contextMenuToggle', 'contextMenuStatus', 'contextMenuCard');

  // Meeting Assistant
  updateToggleUI('meetingAssistant', currentPermissions.meetingAssistant, 'meetingToggle', 'meetingStatus', 'meetingCard');

  // Grammar Checker
  updateToggleUI('grammarChecker', currentPermissions.grammarChecker, 'grammarToggle', 'grammarStatus', 'grammarCard');
}

// Update individual toggle UI
function updateToggleUI(permission, enabled, toggleId, statusId, cardId) {
  const toggle = document.getElementById(toggleId);
  const status = document.getElementById(statusId);
  const card = document.getElementById(cardId);

  toggle.checked = enabled;

  if (enabled) {
    status.textContent = 'Enabled';
    status.classList.remove('disabled');
    status.classList.add('enabled');
    card.classList.add('enabled');
  } else {
    status.textContent = 'Disabled';
    status.classList.remove('enabled');
    status.classList.add('disabled');
    card.classList.remove('enabled');
  }
}

// Save permissions to storage
async function savePermissions() {
  try {
    await chrome.storage.local.set({ permissions: currentPermissions });

    // Show success notification
    showNotification('Preferences saved successfully!');

    // Broadcast to all tabs
    broadcastPermissionsUpdate();

    // Request browser permissions if needed
    await requestBrowserPermissions();
  } catch (error) {
    console.error('Error saving permissions:', error);
    showNotification('Error saving preferences. Please try again.', true);
  }
}

// Request necessary browser permissions
async function requestBrowserPermissions() {
  const permissionsToRequest = {
    permissions: []
  };

  // Clipboard
  if (currentPermissions.clipboard) {
    permissionsToRequest.permissions.push('clipboardRead');
  }

  // Context Menu
  if (currentPermissions.contextMenu) {
    permissionsToRequest.permissions.push('contextMenus');
  }

  // Only request if there are permissions to request
  if (permissionsToRequest.permissions.length > 0) {
    try {
      const granted = await chrome.permissions.request(permissionsToRequest);

      if (!granted) {
        showNotification('Some browser permissions were not granted. Features may not work.', true);
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  }
}

// Broadcast permissions update to all tabs
function broadcastPermissionsUpdate() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'permissionsUpdated',
        permissions: currentPermissions
      }).catch(() => {
        // Tab may not have content script, ignore error
      });
    });
  });
}

// Enable all optional permissions
function enableAllPermissions() {
  currentPermissions = {
    clipboard: true,
    autoSuggest: true,
    emailAnalysis: true,
    voiceInput: true,
    contextMenu: true,
    meetingAssistant: true,
    grammarChecker: true
  };

  updateUI();
  showNotification('All features enabled! Click "Save Preferences" to apply.');
}

// Disable all optional permissions
function disableAllPermissions() {
  currentPermissions = { ...defaultPermissions };

  updateUI();
  showNotification('All optional features disabled! Click "Save Preferences" to apply.');
}

// Show notification
function showNotification(message, isError = false) {
  const notification = document.getElementById('saveNotification');
  notification.textContent = isError ? '❌ ' + message : '✓ ' + message;
  notification.style.background = isError
    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
    : 'linear-gradient(135deg, #22c55e, #16a34a)';

  notification.classList.add('show');

  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}
