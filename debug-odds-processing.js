/**
 * Debug script to check why odds processing isn't working
 */

console.log('=== ODDS PROCESSING DEBUG ===');

// Check if extension functions are available
console.log('\n1. FUNCTION AVAILABILITY:');
console.log('shouldActivateExtension:', typeof shouldActivateExtension);
console.log('getEffectiveDisplayMode:', typeof getEffectiveDisplayMode);
console.log('processOddsNodes:', typeof processOddsNodes);

// Check current settings
console.log('\n2. CURRENT SETTINGS:');
if (typeof settings !== 'undefined') {
  console.log('settings object:', settings);
  console.log('displayMode:', settings.displayMode);
} else {
  console.log('settings object not found');
}

// Check page activation
console.log('\n3. PAGE ACTIVATION:');
if (typeof shouldActivateExtension === 'function') {
  const shouldActivate = shouldActivateExtension();
  console.log('shouldActivateExtension():', shouldActivate);
  console.log('Current URL:', window.location.href);
  console.log('Current pathname:', window.location.pathname);
} else {
  console.log('shouldActivateExtension function not available');
}

// Check effective display mode
console.log('\n4. DISPLAY MODE:');
if (typeof getEffectiveDisplayMode === 'function') {
  const effectiveMode = getEffectiveDisplayMode();
  console.log('getEffectiveDisplayMode():', effectiveMode);
} else {
  console.log('getEffectiveDisplayMode function not available');
}

// Test odds processing manually
console.log('\n5. MANUAL ODDS PROCESSING TEST:');
if (typeof processOddsNodes === 'function') {
  try {
    console.log('Calling processOddsNodes()...');
    processOddsNodes();
    console.log('processOddsNodes() completed');
  } catch (error) {
    console.error('Error in processOddsNodes():', error);
  }
} else {
  console.log('processOddsNodes function not available');
}

// Check for existing odds elements
console.log('\n6. EXISTING ODDS ELEMENTS:');
const existingOdds = document.querySelectorAll('[data-kalshi-ao]');
console.log('Found', existingOdds.length, 'existing odds elements');
existingOdds.forEach((el, i) => {
  console.log(`  ${i + 1}:`, el.textContent, el.getAttribute('data-kalshi-ao'));
});

// Check for probability text patterns
console.log('\n7. PROBABILITY TEXT SEARCH:');
const walker = document.createTreeWalker(
  document.body,
  NodeFilter.SHOW_TEXT,
  {
    acceptNode: function(node) {
      const text = node.textContent.trim();
      // Look for percentage or price patterns
      if (/^\d+%$/.test(text) || /^\$\d+\.\d{2}$/.test(text) || /^\d+¢$/.test(text)) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_REJECT;
    }
  }
);

const probabilityNodes = [];
let node;
while (node = walker.nextNode()) {
  probabilityNodes.push(node);
}

console.log('Found', probabilityNodes.length, 'potential probability nodes:');
probabilityNodes.slice(0, 10).forEach((node, i) => {
  console.log(`  ${i + 1}: "${node.textContent.trim()}" in`, node.parentElement?.tagName);
});

console.log('\n=== DEBUG COMPLETE ===');