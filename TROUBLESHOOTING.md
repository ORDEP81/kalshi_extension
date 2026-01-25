# Kalshi American Odds Extension Troubleshooting

## Quick Diagnosis Steps

### Step 1: Check Extension is Loaded
1. Go to `chrome://extensions/`
2. Find "Kalshi American Odds" extension
3. Make sure it's **enabled** (toggle switch is blue)
4. Note the **ID** of the extension

### Step 2: Check Console Logs
1. Go to kalshi.com
2. Open Developer Tools (F12)
3. Go to **Console** tab
4. Look for messages starting with "Kalshi American Odds"
5. You should see: `"Kalshi American Odds extension loaded"`

### Step 3: Check Extension Settings
1. Click the extension icon in Chrome toolbar
2. Make sure "Raw American odds" is selected
3. Click "Save Settings"

### Step 4: Run Debug Script
1. On kalshi.com, open Console (F12)
2. Copy and paste this debug script:

```javascript
// Quick Extension Debug
console.log('=== KALSHI EXTENSION DEBUG ===');
console.log('URL:', window.location.href);
console.log('Extension loaded:', typeof window.KalshiLogger !== 'undefined');

// Check settings
if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(null).then(settings => {
        console.log('Settings:', settings);
        if (Object.keys(settings).length === 0) {
            console.log('❌ NO SETTINGS FOUND - This is likely the problem!');
            console.log('Try resetting settings...');
            
            // Reset settings
            chrome.storage.sync.set({
                displayMode: 'rawAmerican',
                fallbackEstimateEnabled: false,
                helperPanelEnabled: true
            }).then(() => {
                console.log('✅ Settings reset. Refresh the page.');
            });
        }
    });
}

// Check for odds elements
setTimeout(() => {
    const odds = document.querySelectorAll('[data-kalshi-ao-odds]');
    console.log('Odds elements found:', odds.length);
    
    // Look for percentages
    const percentages = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && /^\d{1,2}%$/.test(el.textContent.trim())
    );
    console.log('Percentage elements found:', percentages.length);
    percentages.slice(0, 5).forEach(el => console.log('Percentage:', el.textContent, el));
}, 2000);
```

## Common Issues and Solutions

### Issue 1: Extension Not Loading
**Symptoms:** No console messages, `window.KalshiLogger` is undefined

**Solutions:**
1. **Reload Extension:**
   - Go to `chrome://extensions/`
   - Click refresh icon on Kalshi American Odds extension
   - Refresh kalshi.com page

2. **Check Manifest Errors:**
   - Go to `chrome://extensions/`
   - Click "Details" on the extension
   - Look for error messages

3. **Reinstall Extension:**
   - Remove extension
   - Load unpacked extension again from folder

### Issue 2: Settings Not Saved
**Symptoms:** Extension loads but no odds appear, settings reset

**Solutions:**
1. **Clear and Reset Settings:**
```javascript
// Run in console on kalshi.com
chrome.storage.sync.clear().then(() => {
    chrome.storage.sync.set({
        displayMode: 'rawAmerican',
        fallbackEstimateEnabled: false,
        helperPanelEnabled: true
    }).then(() => {
        console.log('Settings reset. Refresh page.');
        location.reload();
    });
});
```

2. **Check Storage Permissions:**
   - Extension needs "storage" permission in manifest

### Issue 3: Wrong Display Mode
**Symptoms:** Extension loads but shows percentages instead of odds

**Solutions:**
1. Open extension popup
2. Select "Raw American odds" 
3. Click "Save Settings"
4. Refresh page

### Issue 4: Page Not Detected
**Symptoms:** Extension works on some Kalshi pages but not others

**Solutions:**
1. Check URL - extension only works on kalshi.com
2. Some pages are excluded (help, about, etc.)
3. Try on main trading pages

### Issue 5: Odds Calculation Errors
**Symptoms:** Extension loads but odds are wrong or missing

**Solutions:**
1. Check browser console for JavaScript errors
2. Verify probability patterns are detected
3. Test with known percentages like 50%, 75%, 25%

## Manual Testing

### Test 1: Basic Functionality
1. Go to kalshi.com
2. Find a market with percentages (like "65%")
3. You should see odds like "65% (-186)"

### Test 2: Settings Change
1. Open extension popup
2. Change from "Raw American odds" to "Percent"
3. Odds should disappear
4. Change back to "Raw American odds"
5. Odds should reappear

### Test 3: Page Refresh
1. With odds visible, refresh page
2. Odds should reappear after page loads

## Advanced Debugging

### Check Extension Files
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Details" on extension
4. Click "Inspect views: background page"
5. Check for errors in background script

### Check Content Script Injection
```javascript
// Run in console
console.log('Content scripts:', chrome.runtime.getManifest().content_scripts);
```

### Force Extension Reload
```javascript
// Run in console on kalshi.com
if (typeof window.KalshiLogger !== 'undefined') {
    console.log('Extension is loaded');
    // Try to trigger processing
    location.reload();
} else {
    console.log('Extension not loaded - check chrome://extensions/');
}
```

## Getting Help

If none of these solutions work:

1. **Check Console Errors:** Look for red error messages in console
2. **Check Extension Errors:** Go to chrome://extensions/ and look for error badges
3. **Try Incognito Mode:** Test if extension works in incognito (if enabled)
4. **Try Different Browser:** Test in fresh Chrome profile

## Expected Behavior

When working correctly:
- Console shows: "Kalshi American Odds extension loaded"
- Percentages like "65%" show as "65% (-186)"
- Extension popup shows current settings
- Settings changes take effect immediately
- Works on all Kalshi trading pages