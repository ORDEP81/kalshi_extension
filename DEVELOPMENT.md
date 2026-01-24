# Development Guide

This guide covers development setup, testing, and deployment for the Kalshi American Odds extension.

## Quick Start

1. **Load Extension in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project root directory

2. **Test on Kalshi**:
   - Navigate to https://kalshi.com
   - Open any market page
   - The extension should load automatically

3. **View Console Logs**:
   - Open Developer Tools (F12)
   - Check Console tab for extension logs
   - Look for "Kalshi American Odds extension loaded" message

## File Structure Overview

### Core Files
- `manifest.json` - Extension configuration and permissions
- `content/content.js` - Main content script (runs on Kalshi pages)
- `popup/popup.html` - Settings UI
- `background/background.js` - Service worker for cross-tab communication

### Development Files
- `FIREFOX_BUILD_NOTES.md` - Firefox compatibility guide
- `scripts/build-firefox.sh` - Firefox build script
- `package.json` - Project metadata and scripts

## Development Workflow

### 1. Making Changes

1. Edit source files in `content/`, `popup/`, or `background/`
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test changes on kalshi.com

### 2. Testing Content Script

The content script (`content/content.js`) runs on all kalshi.com pages:

```javascript
// Add debug logging
console.log('Testing odds detection...');

// Test settings loading
chrome.storage.sync.get().then(settings => {
  console.log('Current settings:', settings);
});
```

### 3. Testing Popup

1. Click the extension icon in the toolbar
2. The popup should open with settings
3. Changes should save automatically
4. Check browser console for any errors

### 4. Testing Background Script

Background script logs appear in the extension's service worker console:

1. Go to `chrome://extensions/`
2. Click "service worker" link under the extension
3. View console logs and errors

## Common Development Tasks

### Adding New Settings

1. **Update Default Settings** in `popup/popup.js`:
```javascript
const defaultSettings = {
  displayMode: 'rawAmerican',
  newSetting: 'defaultValue'  // Add here
};
```

2. **Add UI Elements** in `popup/popup.html`:
```html
<section class="setting-group">
  <h3>New Setting</h3>
  <!-- Add form elements -->
</section>
```

3. **Handle in Content Script** in `content/content.js`:
```javascript
function processPage() {
  if (settings.newSetting === 'someValue') {
    // Handle new setting
  }
}
```

### Adding New DOM Processing

1. **Identify Target Elements**:
   - Use browser DevTools to inspect Kalshi pages
   - Look for stable selectors (avoid brittle class names)
   - Test on multiple market types

2. **Add Processing Logic**:
```javascript
function processNewElements() {
  const elements = document.querySelectorAll('selector');
  elements.forEach(element => {
    if (!processedNodes.has(element)) {
      // Process element
      processedNodes.add(element);
    }
  });
}
```

3. **Call from Main Loop**:
```javascript
function processPage() {
  processOddsNodes();
  processOrderTicket();
  processNewElements();  // Add here
}
```

## Testing Strategies

### Manual Testing

1. **Market List Pages**: Test odds display on market listings
2. **Market Detail Pages**: Test individual market pages
3. **Order Tickets**: Test fee parsing and after-fee odds
4. **Settings Changes**: Verify settings persist and update display

### Browser Testing

- **Chrome**: Primary development target
- **Firefox**: Test with Firefox Developer Edition
- **Edge**: Should work with Chromium-based Edge

### Error Handling

Add error boundaries around DOM operations:

```javascript
function safeProcessPage() {
  try {
    processPage();
  } catch (error) {
    console.error('Extension error:', error);
    // Optionally report to background script
    chrome.runtime.sendMessage({
      type: 'LOG_ERROR',
      error: error.message,
      context: 'processPage'
    });
  }
}
```

## Debugging Tips

### Common Issues

1. **Content Script Not Loading**:
   - Check manifest.json host permissions
   - Verify URL matches pattern
   - Check for JavaScript errors

2. **Settings Not Persisting**:
   - Check storage permissions in manifest
   - Verify chrome.storage API calls
   - Check for async/await issues

3. **DOM Elements Not Found**:
   - Kalshi may have updated their HTML structure
   - Use more flexible selectors
   - Add fallback detection methods

### Debug Console Commands

```javascript
// Check current settings
chrome.storage.sync.get().then(console.log);

// Clear all settings
chrome.storage.sync.clear();

// Test odds calculation
const p = 0.65;
const american = p > 0.5 ? -100 * p/(1-p) : 100 * (1-p)/p;
console.log(`${p} -> ${american.toFixed(0)}`);
```

## Performance Considerations

### DOM Observation

- Use debounced processing to avoid excessive updates
- Mark processed nodes to avoid duplicate work
- Disconnect observers when not needed

### Memory Management

- Clean up event listeners
- Remove references to DOM nodes
- Use WeakSet for processed nodes tracking

## Deployment

### Chrome Web Store

1. Create developer account
2. Package extension as ZIP
3. Upload and fill out store listing
4. Submit for review

### Firefox Add-ons

1. Run `scripts/build-firefox.sh`
2. Test with `web-ext run`
3. Submit to addons.mozilla.org

### Self-Distribution

For internal use or testing:
1. Package as ZIP file
2. Share with users
3. Users can install via "Load unpacked" (developer mode)