# Firefox Compatibility Build Notes

This document outlines the steps and considerations for building the Kalshi American Odds extension for Firefox.

## Manifest V3 Support in Firefox

Firefox has been gradually adopting Manifest V3 support:
- Firefox 109+ has basic MV3 support
- Some MV3 features may still be experimental or incomplete
- Consider targeting Firefox ESR for broader compatibility

## Key Differences and Compatibility Issues

### 1. Service Worker vs Background Scripts

**Chrome MV3**: Uses service workers (`background.service_worker`)
**Firefox**: May still prefer persistent background pages in some versions

**Solution**: Use feature detection or create separate manifests:

```json
// For Firefox (if needed)
"background": {
  "scripts": ["background/background.js"],
  "persistent": false
}
```

### 2. Host Permissions

**Chrome MV3**: Uses `host_permissions` array
**Firefox**: May still use `permissions` array for host permissions

**Current approach**: Our manifest uses `host_permissions` which should work in modern Firefox versions.

### 3. Storage API

Both browsers support `chrome.storage` API, but Firefox also supports `browser.storage`.

**Solution**: Use a compatibility shim:
```javascript
const storage = chrome.storage || browser.storage;
```

### 4. Content Security Policy

Firefox may have stricter CSP requirements for extensions.

**Current approach**: We avoid inline scripts and use external files, which should be compatible.

## Build Process for Firefox

### Option 1: Single Manifest (Recommended)

Keep the current `manifest.json` as it should work with modern Firefox versions (109+).

### Option 2: Separate Manifests

If compatibility issues arise, create separate manifests:

1. `manifest.json` - Chrome version (current)
2. `manifest-firefox.json` - Firefox-specific version

### Build Script Example

```bash
#!/bin/bash
# build-firefox.sh

# Create Firefox build directory
mkdir -p dist/firefox

# Copy all files except manifest
cp -r content/ popup/ background/ icons/ dist/firefox/

# Use Firefox-specific manifest if needed
if [ -f "manifest-firefox.json" ]; then
  cp manifest-firefox.json dist/firefox/manifest.json
else
  cp manifest.json dist/firefox/
fi

# Create Firefox addon package
cd dist/firefox
zip -r ../kalshi-american-odds-firefox.zip .
cd ../..

echo "Firefox build created: dist/kalshi-american-odds-firefox.zip"
```

## Testing in Firefox

### Development Testing

1. Open Firefox
2. Navigate to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file

### Production Testing

1. Package the extension as a `.zip` file
2. Submit to Firefox Add-ons for review
3. Or use Firefox Developer Edition for self-distribution

## Known Limitations

### Firefox-Specific Issues

1. **Service Worker Limitations**: Firefox's service worker implementation may have differences
2. **Storage Sync**: Firefox sync may behave differently than Chrome sync
3. **Content Script Injection**: Timing differences in content script injection

### Workarounds

1. **Feature Detection**: Always check if APIs exist before using them
2. **Polyfills**: Use webextension-polyfill for cross-browser compatibility
3. **Graceful Degradation**: Ensure core functionality works even if some features fail

## Cross-Browser Compatibility Library

Consider using the `webextension-polyfill` library for better cross-browser support:

```bash
npm install webextension-polyfill
```

```javascript
// In your scripts
import browser from 'webextension-polyfill';

// Use browser.* instead of chrome.*
const settings = await browser.storage.sync.get();
```

## Distribution

### Chrome Web Store
- Package as `.zip` file
- Submit through Chrome Developer Dashboard
- Review process typically takes 1-3 days

### Firefox Add-ons (AMO)
- Package as `.zip` file
- Submit through Firefox Add-on Developer Hub
- Review process can take several days to weeks
- Consider self-distribution for faster deployment

## Version Management

Maintain version parity between Chrome and Firefox builds:
- Use same version numbers in both manifests
- Tag releases in version control
- Document any platform-specific differences in release notes

## Future Considerations

- Monitor Firefox MV3 implementation progress
- Update compatibility notes as Firefox support improves
- Consider dropping MV2 support once MV3 is fully stable in Firefox