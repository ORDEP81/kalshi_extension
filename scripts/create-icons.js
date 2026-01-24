/**
 * Create placeholder icons for the Kalshi American Odds extension
 * This script creates simple colored icons with the "AO" text
 */

const fs = require('fs');
const path = require('path');

// Create SVG icon template
function createSVGIcon(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563eb" rx="${size * 0.1}"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
        fill="white" font-family="Arial, sans-serif" font-weight="bold" 
        font-size="${size * 0.4}">AO</text>
</svg>`;
}

// Icon sizes needed
const sizes = [16, 32, 48, 128];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create SVG files
sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const svgPath = path.join(iconsDir, `icon${size}.svg`);
  fs.writeFileSync(svgPath, svgContent);
  console.log(`Created ${svgPath}`);
});

console.log('Placeholder icons created successfully!');
console.log('Note: These are SVG files. For production, convert to PNG using an online converter or image editing software.');