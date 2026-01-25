/**
 * Kalshi American Odds - Background Service Worker
 * Handles extension lifecycle and cross-tab communication
 */

console.log('Kalshi American Odds background service worker loaded');

/**
 * Handle extension installation
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // Set default settings on first install
    const defaultSettings = {
      displayMode: 'rawAmerican',
      showSides: 'yesAndNo',
      rounding: 'integer',
      fallbackEstimateEnabled: false
    };
    
    chrome.storage.sync.set(defaultSettings).then(() => {
      console.log('Default settings initialized:', defaultSettings);
    }).catch((error) => {
      console.error('Failed to initialize default settings:', error);
    });
  }
});

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  switch (message.type) {
    case 'GET_SETTINGS':
      // Forward settings request to storage
      chrome.storage.sync.get().then((settings) => {
        sendResponse({ success: true, settings });
      }).catch((error) => {
        console.error('Failed to get settings:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true; // Keep message channel open for async response
      
    case 'LOG_ERROR':
      // Centralized error logging
      console.error('Content script error:', message.error, message.context);
      break;
      
    case 'VALIDATE_SETTINGS':
      // Validate settings format
      const isValid = validateSettings(message.settings);
      sendResponse({ success: true, isValid });
      break;
      
    default:
      console.log('Unknown message type:', message.type);
  }
});

/**
 * Validate settings object
 */
function validateSettings(settings) {
  const validValues = {
    displayMode: ['percent', 'rawAmerican', 'afterFeeAmerican', 'cycle'],
    showSides: ['yesOnly', 'yesAndNo'],
    rounding: ['integer', 'cents']
  };

  if (!settings || typeof settings !== 'object') {
    return false;
  }

  for (const [key, value] of Object.entries(settings)) {
    if (key === 'fallbackEstimateEnabled') {
      if (typeof value !== 'boolean') {
        console.error(`Invalid ${key} value:`, value);
        return false;
      }
    } else if (validValues[key] && !validValues[key].includes(value)) {
      console.error(`Invalid ${key} value:`, value);
      return false;
    }
  }

  return true;
}

/**
 * Handle storage changes and broadcast to all Kalshi tabs
 */
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    console.log('Settings changed:', changes);
    
    // Build new settings object
    const newSettings = {};
    for (const [key, { newValue }] of Object.entries(changes)) {
      newSettings[key] = newValue;
    }

    // Validate settings before broadcasting
    if (!validateSettings(newSettings)) {
      console.error('Invalid settings detected, not broadcasting:', newSettings);
      return;
    }
    
    // Broadcast changes to all Kalshi tabs
    chrome.tabs.query({ url: 'https://kalshi.com/*' }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SETTINGS_UPDATED',
          settings: newSettings
        }).catch((error) => {
          // Tab might not have content script loaded - this is normal
          console.log('Could not notify tab:', tab.id, error.message);
        });
      });
    });
  }
});

/**
 * Handle tab updates to inject content script if needed
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('kalshi.com')) {
    console.log('Kalshi tab updated:', tab.url);
    // Content script should auto-inject via manifest, but we can add logic here if needed
  }
});