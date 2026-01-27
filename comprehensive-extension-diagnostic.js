/**
 * Comprehensive Extension Diagnostic
 * Run this in the browser console on a Kalshi page to diagnose extension issues
 */

console.log('🔍 COMPREHENSIVE EXTENSION DIAGNOSTIC');
console.log('=====================================');

// Test 1: Basic Extension Loading
console.log('\n1️⃣ EXTENSION LOADING TEST:');
const extensionFunctions = [
  'shouldActivateExtensionEarly',
  'shouldActivateExtension', 
  'processPage',
  'processOddsNodes',
  'getEffectiveDisplayMode',
  'loadSettings'
];

extensionFunctions.forEach(funcName => {
  if (typeof window[funcName] === 'function') {
    console.log(`✅ ${funcName} function available`);
  } else {
    console.log(`❌ ${funcName} function NOT available`);
  }
});

// Test 2: Settings Check
console.log('\n2️⃣ SETTINGS CHECK:');
if (typeof settings !== 'undefined') {
  console.log('✅ Settings object found:', settings);
  console.log('   displayMode:', settings.displayMode);
  console.log('   helperPanelEnabled:', settings.helperPanelEnabled);
  console.log('   fallbackEstimateEnabled:', settings.fallbackEstimateEnabled);
} else {
  console.log('❌ Settings object not found');
}

// Test 3: Page Activation
console.log('\n3️⃣ PAGE ACTIVATION TEST:');
console.log('Current URL:', window.location.href);
console.log('Current pathname:', window.location.pathname);

if (typeof shouldActivateExtensionEarly === 'function') {
  try {
    const earlyResult = shouldActivateExtensionEarly();
    console.log('shouldActivateExtensionEarly():', earlyResult);
  } catch (error) {
    console.log('❌ Error in shouldActivateExtensionEarly():', error);
  }
}

if (typeof shouldActivateExtension === 'function') {
  try {
    const result = shouldActivateExtension();
    console.log('shouldActivateExtension():', result);
  } catch (error) {
    console.log('❌ Error in shouldActivateExtension():', error);
  }
}

// Test 4: Display Mode Check
console.log('\n4️⃣ DISPLAY MODE TEST:');
if (typeof getEffectiveDisplayMode === 'function') {
  try {
    const mode = getEffectiveDisplayMode();
    console.log('getEffectiveDisplayMode():', mode);
    
    if (mode === 'rawAmerican') {
      console.log('✅ Display mode is rawAmerican - odds should be processed');
    } else {
      console.log('⚠️ Display mode is not rawAmerican - odds will be skipped');
    }
  } catch (error) {
    console.log('❌ Error in getEffectiveDisplayMode():', error);
  }
}

// Test 5: Manual Processing Test
console.log('\n5️⃣ MANUAL PROCESSING TEST:');
if (typeof processOddsNodes === 'function') {
  try {
    console.log('Attempting to call processOddsNodes()...');
    processOddsNodes();
    console.log('✅ processOddsNodes() completed without errors');
  } catch (error) {
    console.log('❌ Error in processOddsNodes():', error);
  }
} else {
  console.log('❌ processOddsNodes function not available');
}

// Test 6: Existing Odds Elements
console.log('\n6️⃣ EXISTING ODDS ELEMENTS:');
const oddsElements = document.querySelectorAll('[data-kalshi-ao]');
console.log(`Found ${oddsElements.length} existing odds elements`);
if (oddsElements.length > 0) {
  oddsElements.forEach((el, i) => {
    console.log(`  ${i + 1}: "${el.textContent}" (${el.getAttribute('data-kalshi-ao')})`);
  });
}

// Test 7: Probability Text Search
console.log('\n7️⃣ PROBABILITY TEXT SEARCH:');
const allText = document.body.innerText;
const percentMatches = allText.match(/\d+%/g) || [];
const priceMatches = allText.match(/\$\d+\.\d{2}/g) || [];
const centMatches = allText.match(/\d+¢/g) || [];

console.log(`Found ${percentMatches.length} percentage patterns:`, percentMatches.slice(0, 5));
console.log(`Found ${priceMatches.length} price patterns:`, priceMatches.slice(0, 5));
console.log(`Found ${centMatches.length} cent patterns:`, centMatches.slice(0, 5));

// Test 8: Chrome Storage Check
console.log('\n8️⃣ CHROME STORAGE CHECK:');
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.sync.get(null, (result) => {
    console.log('Chrome storage contents:', result);
  });
} else {
  console.log('❌ Chrome storage API not available');
}

// Test 9: Console Error Check
console.log('\n9️⃣ CONSOLE ERROR CHECK:');
console.log('Check the console above for any red error messages');
console.log('Common issues:');
console.log('- JavaScript syntax errors');
console.log('- Chrome extension permissions');
console.log('- Content script injection failures');

// Test 10: Force Reload Test
console.log('\n🔟 FORCE RELOAD TEST:');
console.log('Try running this command to force reload the extension:');
console.log('chrome.runtime.reload()');

console.log('\n✅ DIAGNOSTIC COMPLETE');
console.log('If you see any ❌ errors above, those are likely the cause of the issue.');