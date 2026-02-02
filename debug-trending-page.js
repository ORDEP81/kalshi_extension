// Debug script for Kalshi Trending Page
// Run this in the browser console on the trending page

console.clear();
console.log('🔍 DEBUGGING KALSHI TRENDING PAGE...\n');

// 1. Check if extension is loaded
console.log('1. Extension Status:');
console.log('   Extension loaded:', typeof window.KalshiLogger !== 'undefined');
console.log('   URL:', window.location.href);
console.log('   Pathname:', window.location.pathname);

// 2. Check settings
console.log('\n2. Settings Check:');
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.sync.get(null).then(settings => {
    console.log('   Settings:', settings);
    console.log('   Display mode:', settings.displayMode);
  });
}

// 3. Manual pattern detection
console.log('\n3. Manual Pattern Detection:');
const percentPattern = /^(100|[1-9]?\d)%$/;

// Find all text nodes
const walker = document.createTreeWalker(
  document.body,
  NodeFilter.SHOW_TEXT,
  null,
  false
);

let foundPercentages = [];
let node;

while (node = walker.nextNode()) {
  const text = node.textContent.trim();
  if (percentPattern.test(text)) {
    foundPercentages.push({
      text: text,
      element: node.parentElement,
      tagName: node.parentElement.tagName,
      className: node.parentElement.className,
      hasOdds: node.parentElement.querySelector('[data-kalshi-ao-odds]') !== null
    });
  }
}

console.log('   Found percentages:', foundPercentages.length);
foundPercentages.forEach((item, index) => {
  console.log(`   ${index + 1}. "${item.text}" in ${item.tagName}.${item.className} - Has odds: ${item.hasOdds}`);
});

// 4. Check for existing odds elements
console.log('\n4. Existing Odds Elements:');
const oddsElements = document.querySelectorAll('[data-kalshi-ao-odds]');
const oddsClasses = document.querySelectorAll('.kalshi-ao-odds');
console.log('   Elements with data-kalshi-ao-odds:', oddsElements.length);
console.log('   Elements with kalshi-ao-odds class:', oddsClasses.length);

// 5. Check if page is excluded
console.log('\n5. Page Exclusion Check:');
const pathname = window.location.pathname;
const excludedPaths = ['/help', '/about', '/privacy', '/terms', '/support', '/blog', '/news', '/api', '/docs'];
let isExcluded = false;

for (const excludedPath of excludedPaths) {
  if (pathname.startsWith(excludedPath)) {
    isExcluded = true;
    console.log('   ❌ Page is excluded:', pathname);
    break;
  }
}

if (!isExcluded) {
  console.log('   ✅ Page should be processed:', pathname);
}

// 6. Test manual odds injection
console.log('\n6. Manual Odds Injection Test:');
if (foundPercentages.length > 0 && !foundPercentages[0].hasOdds) {
  const testPercentage = foundPercentages[0];
  console.log('   Testing with:', testPercentage.text);
  
  // Calculate odds
  const percentValue = parseInt(testPercentage.text.replace('%', ''));
  const probability = percentValue / 100;
  
  let odds;
  if (Math.abs(probability - 0.5) < 0.001) {
    odds = 100;
  } else if (probability < 0.5) {
    odds = 100 * (1 - probability) / probability;
  } else {
    odds = -100 * probability / (1 - probability);
  }
  odds = Math.round(odds);
  const oddsText = odds > 0 ? `+${odds}` : `${odds}`;
  
  console.log('   Calculated odds:', oddsText);
  
  // Try to inject manually
  try {
    const oddsElement = document.createElement('span');
    oddsElement.className = 'kalshi-ao-odds';
    oddsElement.textContent = ` (${oddsText})`;
    oddsElement.style.cssText = `
      color: inherit !important;
      font-size: 0.9em;
      font-weight: normal;
      margin-left: 4px;
      opacity: 0.9;
    `;
    oddsElement.setAttribute('data-kalshi-ao-odds', '1');
    
    testPercentage.element.appendChild(oddsElement);
    console.log('   ✅ Manual injection successful!');
  } catch (error) {
    console.log('   ❌ Manual injection failed:', error);
  }
} else if (foundPercentages.length === 0) {
  console.log('   ❌ No percentages found to test with');
} else {
  console.log('   ℹ️ First percentage already has odds');
}

// 7. Check for console errors
console.log('\n7. Console Error Check:');
console.log('   Look above for any red error messages that might indicate why the extension is not working');

// 8. Force extension processing
console.log('\n8. Force Extension Processing:');
setTimeout(() => {
  if (typeof window.KalshiLogger !== 'undefined') {
    console.log('   Attempting to trigger extension processing...');
    // Try to reload the page to trigger processing
    console.log('   Reloading page in 2 seconds to trigger extension...');
    setTimeout(() => {
      location.reload();
    }, 2000);
  } else {
    console.log('   ❌ Extension not loaded - cannot force processing');
  }
}, 1000);

console.log('\n🔍 Trending page debug complete. Check results above.');