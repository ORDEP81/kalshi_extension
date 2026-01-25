// KALSHI EXTENSION DIAGNOSTIC SCRIPT
// Copy and paste this entire script into the browser console on kalshi.com

console.clear();
console.log('🔍 KALSHI EXTENSION DIAGNOSTIC STARTING...\n');

// Step 1: Basic checks
console.log('1. BASIC ENVIRONMENT CHECKS:');
console.log('   URL:', window.location.href);
console.log('   Domain:', window.location.hostname);
console.log('   Path:', window.location.pathname);
console.log('   Chrome API available:', typeof chrome !== 'undefined');
console.log('   Extension content script loaded:', typeof window.KalshiLogger !== 'undefined');

// Step 2: Check extension activation
console.log('\n2. EXTENSION ACTIVATION CHECK:');
function shouldActivateExtensionEarly() {
  const pathname = window.location.pathname;
  const excludedPaths = ['/help', '/about', '/privacy', '/terms', '/support', '/blog', '/news', '/api', '/docs'];
  
  for (const excludedPath of excludedPaths) {
    if (pathname.startsWith(excludedPath)) {
      console.log('   ❌ Extension disabled - excluded path:', pathname);
      return false;
    }
  }
  
  const hostname = window.location.hostname;
  if (!hostname.includes('kalshi.com') && hostname !== 'localhost') {
    console.log('   ❌ Extension disabled - wrong domain:', hostname);
    return false;
  }
  
  console.log('   ✅ Extension should be active on this page');
  return true;
}

const shouldActivate = shouldActivateExtensionEarly();

// Step 3: Check settings
console.log('\n3. SETTINGS CHECK:');
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.sync.get(null).then(settings => {
    console.log('   Current settings:', settings);
    
    if (Object.keys(settings).length === 0) {
      console.log('   ⚠️  NO SETTINGS FOUND! This is likely the problem.');
      console.log('   Attempting to set default settings...');
      
      const defaultSettings = {
        displayMode: 'rawAmerican',
        fallbackEstimateEnabled: false,
        helperPanelEnabled: true
      };
      
      chrome.storage.sync.set(defaultSettings).then(() => {
        console.log('   ✅ Default settings applied:', defaultSettings);
        console.log('   Please refresh the page to test again.');
      }).catch(error => {
        console.log('   ❌ Failed to set settings:', error);
      });
    } else {
      console.log('   Display mode:', settings.displayMode);
      if (settings.displayMode !== 'rawAmerican') {
        console.log('   ⚠️  Display mode is not "rawAmerican" - odds will not show');
      }
    }
  }).catch(error => {
    console.log('   ❌ Error reading settings:', error);
  });
} else {
  console.log('   ❌ Chrome storage API not available');
}

// Step 4: Check for existing odds elements
console.log('\n4. EXISTING ODDS ELEMENTS CHECK:');
setTimeout(() => {
  const oddsElements = document.querySelectorAll('[data-kalshi-ao-odds]');
  const oddsClasses = document.querySelectorAll('.kalshi-ao-odds');
  console.log('   Elements with data-kalshi-ao-odds:', oddsElements.length);
  console.log('   Elements with kalshi-ao-odds class:', oddsClasses.length);
  
  if (oddsElements.length > 0 || oddsClasses.length > 0) {
    console.log('   ✅ Found existing odds elements - extension is working!');
  } else {
    console.log('   ❌ No odds elements found');
  }
}, 1000);

// Step 5: Pattern matching test
console.log('\n5. PATTERN MATCHING TEST:');
const percentPattern = /^(100|[1-9]?\d)%$/;
const pricePattern = /^\$0\.\d{2}$|^\$1\.00$/;

// Find text nodes with percentages
const walker = document.createTreeWalker(
  document.body,
  NodeFilter.SHOW_TEXT,
  null,
  false
);

let foundPercentages = [];
let foundPrices = [];
let node;

while (node = walker.nextNode()) {
  const text = node.textContent.trim();
  if (percentPattern.test(text)) {
    foundPercentages.push({
      text: text,
      element: node.parentElement,
      tagName: node.parentElement.tagName
    });
  }
  if (pricePattern.test(text)) {
    foundPrices.push({
      text: text,
      element: node.parentElement,
      tagName: node.parentElement.tagName
    });
  }
}

console.log('   Found percentages:', foundPercentages.length);
foundPercentages.slice(0, 5).forEach(item => {
  console.log(`     "${item.text}" in ${item.tagName}`);
});

console.log('   Found prices:', foundPrices.length);
foundPrices.slice(0, 5).forEach(item => {
  console.log(`     "${item.text}" in ${item.tagName}`);
});

// Step 6: Manual odds calculation test
console.log('\n6. ODDS CALCULATION TEST:');
function testOddsCalculation(probability) {
  if (probability <= 0 || probability >= 1) return null;
  
  let odds;
  if (Math.abs(probability - 0.5) < 0.001) {
    odds = 100;
  } else if (probability < 0.5) {
    odds = 100 * (1 - probability) / probability;
  } else {
    odds = -100 * probability / (1 - probability);
  }
  return Math.round(odds);
}

const testCases = [0.74, 0.27, 0.47, 0.40, 0.99];
testCases.forEach(prob => {
  const odds = testOddsCalculation(prob);
  const oddsText = odds > 0 ? `+${odds}` : `${odds}`;
  console.log(`   ${(prob * 100)}% → ${oddsText}`);
});

// Step 7: Try to manually trigger processing
console.log('\n7. MANUAL PROCESSING ATTEMPT:');
setTimeout(() => {
  if (typeof window.KalshiLogger !== 'undefined') {
    console.log('   Extension is loaded, attempting manual processing...');
    
    // Try to access global functions (they might not be in global scope)
    if (typeof processPage === 'function') {
      try {
        processPage();
        console.log('   ✅ processPage() called successfully');
      } catch (error) {
        console.log('   ❌ Error calling processPage():', error);
      }
    } else {
      console.log('   processPage() not in global scope');
    }
    
    if (typeof processOddsNodes === 'function') {
      try {
        processOddsNodes();
        console.log('   ✅ processOddsNodes() called successfully');
      } catch (error) {
        console.log('   ❌ Error calling processOddsNodes():', error);
      }
    } else {
      console.log('   processOddsNodes() not in global scope');
    }
  } else {
    console.log('   ❌ Extension not loaded - cannot trigger processing');
  }
}, 2000);

// Step 8: Final recommendations
setTimeout(() => {
  console.log('\n8. RECOMMENDATIONS:');
  
  if (!shouldActivate) {
    console.log('   🔧 Extension is disabled on this page - try a different Kalshi page');
  } else if (typeof window.KalshiLogger === 'undefined') {
    console.log('   🔧 Extension not loaded - check chrome://extensions/ and reload extension');
  } else if (foundPercentages.length === 0 && foundPrices.length === 0) {
    console.log('   🔧 No matching percentages/prices found - check if page has loaded completely');
  } else {
    console.log('   🔧 Extension should be working. If no odds appear:');
    console.log('      - Check extension popup settings');
    console.log('      - Try refreshing the page');
    console.log('      - Check for JavaScript errors in console');
  }
  
  console.log('\n🔍 DIAGNOSTIC COMPLETE');
}, 3000);