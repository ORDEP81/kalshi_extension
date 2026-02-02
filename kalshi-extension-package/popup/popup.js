/**
 * Kalshi American Odds - Popup Script
 * Handles settings UI and storage
 */

// Default settings
const defaultSettings = {
  displayMode: 'rawAmerican'
};

let currentSettings = { ...defaultSettings };

/**
 * Initialize popup
 */
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  updateUI();
  setupEventListeners();
  validateForm();
});

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(defaultSettings);
    currentSettings = { ...defaultSettings, ...result };
    console.log('Settings loaded:', currentSettings);
  } catch (error) {
    console.error('Failed to load settings:', error);
    showStatus('Failed to load settings', 'error');
  }
}

/**
 * Update UI to reflect current settings
 */
function updateUI() {
  // Update radio buttons
  const displayModeRadio = document.querySelector(`input[name="displayMode"][value="${currentSettings.displayMode}"]`);
  if (displayModeRadio) {
    displayModeRadio.checked = true;
  } else {
    // Fallback to default if invalid value
    const defaultRadio = document.querySelector(`input[name="displayMode"][value="${defaultSettings.displayMode}"]`);
    if (defaultRadio) defaultRadio.checked = true;
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  const saveButton = document.getElementById('saveSettings');
  if (saveButton) {
    saveButton.addEventListener('click', handleSaveClick);
  }

  // Real-time validation and visual feedback
  const inputs = document.querySelectorAll('input[type="radio"]');
  inputs.forEach(input => {
    input.addEventListener('change', () => {
      validateForm();
      addVisualFeedback(input);
      // Auto-save on change with small delay
      setTimeout(saveSettings, 150);
    });
  });

  // Add keyboard support
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.tagName !== 'BUTTON') {
      event.preventDefault();
      saveSettings();
    }
  });
}

/**
 * Handle save button click with visual feedback
 */
async function handleSaveClick(event) {
  event.preventDefault();
  
  const saveButton = event.target;
  const originalText = saveButton.textContent;
  
  // Show loading state
  saveButton.textContent = 'Saving...';
  saveButton.disabled = true;
  
  try {
    await saveSettings();
    
    // Show success state briefly
    saveButton.textContent = 'Saved!';
    setTimeout(() => {
      saveButton.textContent = originalText;
      saveButton.disabled = false;
    }, 1000);
  } catch (error) {
    // Show error state
    saveButton.textContent = 'Error';
    setTimeout(() => {
      saveButton.textContent = originalText;
      saveButton.disabled = false;
    }, 2000);
  }
}

/**
 * Add visual feedback when settings change
 */
function addVisualFeedback(input) {
  const label = input.closest('label');
  if (label) {
    label.style.backgroundColor = '#f0f9ff';
    label.style.borderRadius = '4px';
    label.style.transition = 'background-color 0.3s ease';
    
    setTimeout(() => {
      label.style.backgroundColor = '';
    }, 500);
  }
}

/**
 * Validate form inputs
 */
function validateForm() {
  const isValid = validateRadioGroups();
  
  const saveButton = document.getElementById('saveSettings');
  if (saveButton) {
    saveButton.disabled = !isValid;
  }
  
  return isValid;
}

/**
 * Validate radio button groups
 */
function validateRadioGroups() {
  const radioGroups = ['displayMode'];
  
  for (const groupName of radioGroups) {
    const checkedRadio = document.querySelector(`input[name="${groupName}"]:checked`);
    if (!checkedRadio) {
      console.warn(`No option selected for ${groupName}`);
      return false;
    }
  }
  
  return true;
}


/**
 * Save settings to storage
 */
async function saveSettings() {
  try {
    if (!validateForm()) {
      throw new Error('Form validation failed');
    }

    // Collect current form values
    const displayMode = document.querySelector('input[name="displayMode"]:checked')?.value || defaultSettings.displayMode;

    const newSettings = {
      displayMode
    };

    // Validate setting values
    if (!validateSettingValues(newSettings)) {
      throw new Error('Invalid setting values');
    }

    // Save to storage
    await chrome.storage.sync.set(newSettings);
    currentSettings = newSettings;

    // Notify content scripts
    await notifyContentScripts(newSettings);

    showStatus('Settings saved successfully!', 'success');
    console.log('Settings saved:', newSettings);
  } catch (error) {
    console.error('Failed to save settings:', error);
    showStatus('Failed to save settings', 'error');
    throw error;
  }
}

/**
 * Validate setting values against allowed options
 */
function validateSettingValues(settings) {
  const validValues = {
    displayMode: ['percent', 'rawAmerican', 'fractional', 'decimal']
  };

  for (const [key, value] of Object.entries(settings)) {
    if (key === 'showSides' || key === 'rounding' || key === 'helperPanelEnabled' || key === 'fallbackEstimateEnabled') {
      // Ignore legacy settings that are no longer used
      console.log(`Ignoring legacy setting: ${key}`);
      continue;
    } else if (validValues[key] && !validValues[key].includes(value)) {
      console.error(`Invalid ${key} value:`, value);
      return false;
    }
  }

  return true;
}

/**
 * Notify content scripts of settings changes
 */
async function notifyContentScripts(newSettings) {
  try {
    // Query for all Kalshi tabs
    const tabs = await chrome.tabs.query({ url: 'https://kalshi.com/*' });
    
    if (tabs.length === 0) {
      console.log('No Kalshi tabs found to notify');
      return;
    }
    
    // Send message to each tab
    const notifications = tabs.map(async (tab) => {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'SETTINGS_UPDATED',
          settings: newSettings,
          timestamp: Date.now()
        });
        console.log(`Successfully notified tab ${tab.id} of settings update`);
        return { tabId: tab.id, success: true };
      } catch (error) {
        // Tab might not have content script loaded yet or be inactive - this is normal
        console.log(`Could not notify tab ${tab.id}:`, error.message);
        return { tabId: tab.id, success: false, error: error.message };
      }
    });

    const results = await Promise.allSettled(notifications);
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;
    
    console.log(`Notified ${successful}/${tabs.length} Kalshi tabs of settings update`);
  } catch (error) {
    console.error('Error notifying content scripts:', error);
    throw error;
  }
}

/**
 * Show status message with improved styling
 */
function showStatus(message, type) {
  const statusElement = document.getElementById('statusMessage');
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
    statusElement.style.opacity = '1';
    
    // Hide after 3 seconds with fade out
    setTimeout(() => {
      statusElement.style.opacity = '0';
      setTimeout(() => {
        statusElement.textContent = '';
        statusElement.className = 'status-message';
      }, 300);
    }, 3000);
  }
}