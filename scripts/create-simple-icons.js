/**
 * Create simple base64 PNG icons for development
 * These are minimal 1-pixel colored squares that will work as placeholders
 */

const fs = require('fs');
const path = require('path');

// Simple 1x1 blue PNG in base64 (will be scaled by browser)
const bluePNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA60e6kgAAAABJRU5ErkJggg==';

// Create a simple colored PNG for each size
function createSimplePNG(size) {
  // This is a minimal PNG that browsers will scale appropriately
  return Buffer.from(bluePNG, 'base64');
}

// Icon sizes needed
const sizes = [16, 32, 48, 128];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'icons');

// Create PNG files
sizes.forEach(size => {
  const pngData = createSimplePNG(size);
  const pngPath = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(pngPath, pngData);
  console.log(`Created ${pngPath}`);
});

console.log('Simple PNG placeholder icons created successfully!');
console.log('These are minimal placeholders. Replace with proper icons for production.');