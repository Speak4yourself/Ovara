// Ovara Settings - Settings Page Logic

// Default settings
const defaultSettings = {
  theme: 'auto',
  position: 'right',
  size: 'medium',
  customSize: 380,
  autoOpen: false,
  rememberState: true
};

let currentSettings = { ...defaultSettings };

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
  updatePreview();
  applyTheme();
});

// Load settings from storage
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['assistantSettings']);

    if (result.assistantSettings) {
      currentSettings = { ...defaultSettings, ...result.assistantSettings };
    } else {
      // First time setup - detect system theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      currentSettings.theme = 'auto';

      // Save initial settings
      await chrome.storage.local.set({ assistantSettings: currentSettings });
    }

    // Apply settings to UI
    applySettingsToUI();
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Apply settings to UI elements
function applySettingsToUI() {
  // Theme
  document.querySelector(`input[name="theme"][value="${currentSettings.theme}"]`).checked = true;
  updateRadioSelection('theme', currentSettings.theme);

  // Position
  document.querySelector(`input[name="position"][value="${currentSettings.position}"]`).checked = true;
  updateRadioSelection('position', currentSettings.position);

  // Size
  document.querySelector(`input[name="size"][value="${currentSettings.size}"]`).checked = true;
  updateRadioSelection('size', currentSettings.size);

  // Custom size
  document.getElementById('customSize').value = currentSettings.customSize;
  document.getElementById('customSizeValue').textContent = currentSettings.customSize + 'px';

  if (currentSettings.size === 'custom') {
    document.getElementById('customSizeSlider').style.display = 'block';
  }

  // Toggles
  if (currentSettings.autoOpen) {
    document.getElementById('autoOpenToggle').classList.add('active');
  }

  if (currentSettings.rememberState) {
    document.getElementById('rememberToggle').classList.add('active');
  }
}

// Setup event listeners
function setupEventListeners() {
  // Theme radio buttons
  document.querySelectorAll('input[name="theme"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      currentSettings.theme = e.target.value;
      updateRadioSelection('theme', e.target.value);
      applyTheme();
    });
  });

  // Position radio buttons
  document.querySelectorAll('input[name="position"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      currentSettings.position = e.target.value;
      updateRadioSelection('position', e.target.value);
      updatePreview();
    });
  });

  // Size radio buttons
  document.querySelectorAll('input[name="size"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      currentSettings.size = e.target.value;
      updateRadioSelection('size', e.target.value);

      // Show/hide custom slider
      if (e.target.value === 'custom') {
        document.getElementById('customSizeSlider').style.display = 'block';
      } else {
        document.getElementById('customSizeSlider').style.display = 'none';
      }
    });
  });

  // Custom size slider
  document.getElementById('customSize').addEventListener('input', (e) => {
    currentSettings.customSize = parseInt(e.target.value);
    document.getElementById('customSizeValue').textContent = e.target.value + 'px';
  });

  // Auto-open toggle
  document.getElementById('autoOpenToggle').addEventListener('click', () => {
    const toggle = document.getElementById('autoOpenToggle');
    toggle.classList.toggle('active');
    currentSettings.autoOpen = toggle.classList.contains('active');
  });

  // Remember state toggle
  document.getElementById('rememberToggle').addEventListener('click', () => {
    const toggle = document.getElementById('rememberToggle');
    toggle.classList.toggle('active');
    currentSettings.rememberState = toggle.classList.contains('active');
  });

  // Save button
  document.getElementById('saveBtn').addEventListener('click', saveSettings);

  // Reset button
  document.getElementById('resetBtn').addEventListener('click', resetSettings);

  // Back link
  document.getElementById('backLink').addEventListener('click', (e) => {
    e.preventDefault();
    window.close();
  });
}

// Update radio button selection styling
function updateRadioSelection(name, value) {
  document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
    const option = radio.closest('.radio-option');
    if (radio.value === value) {
      option.classList.add('selected');
    } else {
      option.classList.remove('selected');
    }
  });
}

// Update preview
function updatePreview() {
  const preview = document.getElementById('previewAssistant');

  // Remove all position classes
  preview.classList.remove('left', 'right', 'top', 'bottom', 'split');

  // Add current position class
  preview.classList.add(currentSettings.position);
}

// Apply theme
function applyTheme() {
  const root = document.documentElement;

  let theme = currentSettings.theme;

  // If auto, detect system theme
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme = prefersDark ? 'dark' : 'light';
  }

  // Apply theme class
  if (theme === 'light') {
    root.classList.add('light');
  } else {
    root.classList.remove('light');
  }
}

// Save settings
async function saveSettings() {
  try {
    await chrome.storage.local.set({ assistantSettings: currentSettings });

    // Show success message
    const successMsg = document.getElementById('successMessage');
    successMsg.classList.add('active');

    setTimeout(() => {
      successMsg.classList.remove('active');
    }, 3000);

    // Notify all tabs to update settings
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'updateSettings',
          settings: currentSettings
        }).catch(() => {
          // Ignore errors for tabs without content script
        });
      });
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('Failed to save settings. Please try again.');
  }
}

// Reset settings
async function resetSettings() {
  if (confirm('Reset all settings to default?')) {
    currentSettings = { ...defaultSettings };
    await chrome.storage.local.set({ assistantSettings: currentSettings });
    applySettingsToUI();
    updatePreview();
    applyTheme();

    // Show success message
    const successMsg = document.getElementById('successMessage');
    successMsg.textContent = '✓ Settings reset to default!';
    successMsg.classList.add('active');

    setTimeout(() => {
      successMsg.classList.remove('active');
      successMsg.textContent = '✓ Settings saved successfully!';
    }, 3000);
  }
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (currentSettings.theme === 'auto') {
    applyTheme();
  }
});
