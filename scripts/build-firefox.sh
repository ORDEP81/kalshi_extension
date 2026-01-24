#!/bin/bash

# Kalshi American Odds - Firefox Build Script
# Creates a Firefox-compatible build of the extension

set -e

echo "Building Kalshi American Odds for Firefox..."

# Create build directories
mkdir -p dist/firefox
mkdir -p dist/chrome

echo "Copying files for Firefox build..."

# Copy all source files to Firefox build directory
cp -r content/ dist/firefox/
cp -r popup/ dist/firefox/
cp -r background/ dist/firefox/
cp -r icons/ dist/firefox/
cp manifest.json dist/firefox/

# Copy files for Chrome build (for comparison)
cp -r content/ dist/chrome/
cp -r popup/ dist/chrome/
cp -r background/ dist/chrome/
cp -r icons/ dist/chrome/
cp manifest.json dist/chrome/

echo "Creating Firefox package..."

# Create Firefox addon package
cd dist/firefox
zip -r ../kalshi-american-odds-firefox.zip . -x "*.DS_Store" "*/.*"
cd ../..

echo "Creating Chrome package..."

# Create Chrome package
cd dist/chrome
zip -r ../kalshi-american-odds-chrome.zip . -x "*.DS_Store" "*/.*"
cd ../..

echo "Build complete!"
echo "Firefox package: dist/kalshi-american-odds-firefox.zip"
echo "Chrome package: dist/kalshi-american-odds-chrome.zip"

# Optional: Test with web-ext if available
if command -v web-ext &> /dev/null; then
    echo "Running Firefox validation..."
    cd dist/firefox
    web-ext lint
    cd ../..
else
    echo "web-ext not found. Install with: npm install -g web-ext"
    echo "This will allow you to validate and test the Firefox build."
fi