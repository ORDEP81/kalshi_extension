// Debug script for Kalshi American Odds Extension
// Run this in the browser console on kalshi.com

console.log('🔍 Starting Kalshi Extension Debug...');

// 1. Check if extension is loaded
console.log('\n1. Extension Loading Check:');
if (typeof window.KalshiLogger !== 'undefined') {
    console.log('✅ Extension content script loaded (KalshiLogger found)');
} else {
    console.log('❌ Extension content script NOT loaded (KalshiLogger missing)');
}

// 2. Check current URL and activation
console.log('\n2. URL and Activation Check:');
console.log('Current URL:', window.location.href);
console.log('Hostname:', window.location.hostname);
console.log('Pathname:', window.location.pathname);

// 3. Check for extension elements
console.log('\n3. Extension Elements Check:');
const oddsElements = document.querySelectorAll('[data-kalshi-ao-odds]');
console.log(`Found ${oddsElements.length} odds elements on page`);

const existingOdds = document.querySelectorAll('.kalshi-ao-odds');
console.log(`Found ${existingOdds.length} elements with kalshi-ao-odds class`);

// 4. Check storage settings
console.log('\n4. Storage Settings Check:');
if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(null).then(settings => {
        console.log('Current settings:', settings);
        
        if (Object.keys(settings).length === 0) {
            console.log('⚠️ No settings found in storage!');
        } else {
            console.log('Display mode:', settings.displayMode);
            console.log('Helper panel enabled:', settings.helperPanelEnabled);
            console.log('Fallback estimate enabled:', settings.fallbackEstimateEnabled);
        }
    }).catch(error => {
        console.log('❌ Error reading settings:', error);
    });
} else {
    console.log('❌ Chrome storage API not available');
}

// 5. Check for probability text patterns
console.log('\n5. Probability Pattern Check:');
const percentagePattern = /^(100|[1-9]?\d)%$/;
const pricePattern = /^\$0\.\d{2}$|^\$1\.00$/;

const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
);

let percentageMatches = 0;
let priceMatches = 0;
let node;

while (node = walker.nextNode()) {
    const text = node.textContent.trim();
    if (percentagePattern.test(text)) {
        percentageMatches++;
        console.log(`Found percentage: "${text}" in element:`, node.parentElement);
    }
    if (pricePattern.test(text)) {
        priceMatches++;
        console.log(`Found price: "${text}" in element:`, node.parentElement);
    }
}

console.log(`Total percentage matches: ${percentageMatches}`);
console.log(`Total price matches: ${priceMatches}`);

// 6. Test probability conversion
console.log('\n6. Probability Conversion Test:');
function testProbabilityToAmericanOdds(p) {
    if (p <= 0 || p >= 1) {
        return null;
    }
    
    let odds;
    if (Math.abs(p - 0.5) < 0.001) {
        odds = 100;
    } else if (p < 0.5) {
        odds = 100 * (1 - p) / p;
    } else {
        odds = -100 * p / (1 - p);
    }
    
    return Math.round(odds);
}

const testCases = [0.74, 0.27, 0.47, 0.40, 0.99];
testCases.forEach(prob => {
    const odds = testProbabilityToAmericanOdds(prob);
    const oddsText = odds > 0 ? `+${odds}` : `${odds}`;
    console.log(`${(prob * 100)}% → ${oddsText}`);
});

// 7. Check console for extension logs
console.log('\n7. Extension Console Logs:');
console.log('Look for messages starting with "Kalshi American Odds" in the console');

// 8. Try to manually trigger extension
console.log('\n8. Manual Extension Trigger:');
if (typeof window.KalshiLogger !== 'undefined') {
    console.log('Attempting to trigger extension processing...');
    // Try to find and call processPage if it exists
    if (typeof processPage === 'function') {
        try {
            processPage();
            console.log('✅ processPage() called successfully');
        } catch (error) {
            console.log('❌ Error calling processPage():', error);
        }
    } else {
        console.log('processPage() function not found in global scope');
    }
} else {
    console.log('Cannot trigger - extension not loaded');
}

console.log('\n🔍 Debug complete. Check the output above for issues.');