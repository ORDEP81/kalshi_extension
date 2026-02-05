/**
 * Debug script to check odds visibility and lifecycle
 * Run this in browser console to diagnose odds issues
 */

console.log('🔍 Kalshi American Odds Debug - Odds Visibility Check');
console.log('================================================');

// 1. Check if extension is loaded
console.log('\n1. Extension Status:');
const extensionLoaded = typeof window.KalshiLogger !== 'undefined';
console.log('   Extension loaded:', extensionLoaded);

if (extensionLoaded) {
  console.log('   Logger available:', !!window.KalshiLogger);
  console.log('   Settings:', window.settings || 'Not available');
}

// 2. Check for odds elements
console.log('\n2. Odds Elements Check:');
const oddsElements = document.querySelectorAll('[data-kalshi-ao-odds]');
console.log('   Odds elements found:', oddsElements.length);

if (oddsElements.length > 0) {
  console.log('   Odds elements details:');
  oddsElements.forEach((element, index) => {
    console.log(`     ${index + 1}. Text: "${element.textContent}"`, {
      visible: element.offsetWidth > 0 && element.offsetHeight > 0,
      display: getComputedStyle(element).display,
      visibility: getComputedStyle(element).visibility,
      opacity: getComputedStyle(element).opacity,
      parent: element.parentElement?.tagName,
      parentText: element.parentElement?.textContent?.substring(0, 50) + '...'
    });
  });
}

// 3. Check for percentage nodes that should have odds
console.log('\n3. Percentage Nodes Check:');
const percentagePattern = /^(100|[0-9]{1,2})%$/;
const textNodes = [];
const walker = document.createTreeWalker(
  document.body,
  NodeFilter.SHOW_TEXT,
  null,
  false
);

let node;
while (node = walker.nextNode()) {
  const text = node.textContent.trim();
  if (percentagePattern.test(text)) {
    textNodes.push({
      text: text,
      parent: node.parentElement,
      hasOdds: node.parentElement?.querySelector('[data-kalshi-ao-odds]') !== null
    });
  }
}

console.log('   Percentage nodes found:', textNodes.length);
console.log('   Percentage nodes with odds:', textNodes.filter(n => n.hasOdds).length);
console.log('   Percentage nodes without odds:', textNodes.filter(n => !n.hasOdds).length);

if (textNodes.length > 0) {
  console.log('   Sample percentage nodes:');
  textNodes.slice(0, 5).forEach((node, index) => {
    console.log(`     ${index + 1}. "${node.text}" - Has odds: ${node.hasOdds}`);
  });
}

// 4. Monitor odds creation/removal
console.log('\n4. Setting up odds monitoring...');
let oddsCount = oddsElements.length;
let monitoringActive = true;

const monitorOdds = () => {
  if (!monitoringActive) return;
  
  const currentOdds = document.querySelectorAll('[data-kalshi-ao-odds]');
  const currentCount = currentOdds.length;
  
  if (currentCount !== oddsCount) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`   [${timestamp}] Odds count changed: ${oddsCount} → ${currentCount}`);
    
    if (currentCount > oddsCount) {
      console.log('     ✅ Odds added');
    } else {
      console.log('     ❌ Odds removed');
    }
    
    oddsCount = currentCount;
  }
  
  setTimeout(monitorOdds, 1000);
};

monitorOdds();

// 5. Stop monitoring function
window.stopOddsMonitoring = () => {
  monitoringActive = false;
  console.log('   Odds monitoring stopped');
};

console.log('   Monitoring started. Run stopOddsMonitoring() to stop.');

// 6. Manual odds creation test
console.log('\n5. Manual Odds Creation Test:');
window.testOddsCreation = () => {
  console.log('   Testing manual odds creation...');
  
  const testPercentages = document.querySelectorAll('*');
  let testCount = 0;
  
  for (let element of testPercentages) {
    const text = element.textContent?.trim();
    if (percentagePattern.test(text) && !element.querySelector('[data-kalshi-ao-odds]') && testCount < 3) {
      // Create test odds element
      const oddsElement = document.createElement('span');
      oddsElement.textContent = ' (+100)';
      oddsElement.style.cssText = `
        color: #10b981;
        font-weight: 600;
        margin-left: 4px;
        font-size: 0.875em;
      `;
      oddsElement.setAttribute('data-kalshi-ao-odds', '1');
      oddsElement.setAttribute('data-test', 'manual');
      
      element.appendChild(oddsElement);
      testCount++;
      
      console.log(`     Created test odds for "${text}"`);
    }
  }
  
  console.log(`   Created ${testCount} test odds elements`);
};

console.log('   Run testOddsCreation() to manually create test odds');

console.log('\n================================================');
console.log('Debug script loaded. Functions available:');
console.log('- stopOddsMonitoring() - Stop monitoring odds changes');
console.log('- testOddsCreation() - Manually create test odds');