# Kalshi American Odds Extension

A powerful Chrome and Firefox extension that enhances kalshi.com by displaying American odds, calculating true after-fee costs, and providing intelligent limit-order assistance for better trading decisions.

![Extension Overview](screenshots/extension-overview.png)

## 🚀 Key Features

### 📊 Smart Odds Display
- **Multiple Display Modes**: Toggle between percent, raw American odds, and after-fee American odds
- **Real-Time Updates**: Automatically updates when market prices change
- **Side Selection**: Show odds for YES only or both YES and NO sides
- **Precision Control**: Round to integers or include cents for precise calculations

### 💰 After-Fee Calculation Engine
- **True Cost Analysis**: Real-time calculation of effective odds after Kalshi's trading fees
- **Fee Source Detection**: Automatically detects fees from order tickets or uses intelligent estimation
- **Transparent Labeling**: Clear indicators showing whether fees are from actual ticket data or estimates
- **Comprehensive Validation**: Robust error handling and edge case management

### 🎯 Limit Order Helper Panel
- **Odds-to-Price Conversion**: Convert American odds to optimal Kalshi limit prices
- **Interactive Calculator**: Input desired odds and get suggested limit prices instantly
- **Real-Time Integration**: Updates automatically when you modify order ticket parameters
- **After-Fee Projections**: Shows projected effective odds for your suggested orders

### 🛡️ Production-Ready Quality
- **Non-Interfering Design**: Seamlessly integrates without blocking Kalshi's functionality
- **Click-Safe Implementation**: All injected elements use `pointer-events: none` to prevent interference
- **Comprehensive Error Handling**: Graceful fallbacks when market data is unavailable
- **Cross-Browser Compatibility**: Full support for Chrome (MV3) and Firefox

## 📸 Screenshots

### Odds Display in Action
![Odds Display](screenshots/odds-display.png)
*American odds displayed alongside Kalshi's default percentages*

### Settings Panel
![Settings Panel](screenshots/settings-panel.png)
*Comprehensive settings for customizing your trading experience*

### Helper Panel
![Helper Panel](screenshots/helper-panel.png)
*Interactive limit order helper with real-time calculations*

### After-Fee Odds Display
![After-Fee Display](screenshots/after-fee-display.png)
*True cost analysis showing effective odds after trading fees*

## 🎯 Usage Examples

### Example 1: Converting Odds for Limit Orders

**Scenario**: You want to place a limit order based on your analysis that suggests +150 odds for a YES position.

1. **Open the Helper Panel**: Navigate to any Kalshi market page
2. **Input Your Odds**: Enter `+150` in the American odds field
3. **Select Side**: Choose "YES" 
4. **Get Suggested Price**: The extension calculates the optimal limit price: `$0.40`
5. **Review After-Fee Impact**: See projected after-fee odds: `+138` (accounting for trading fees)
6. **Place Your Order**: Use the suggested `$0.40` limit price in Kalshi's order form

**Result**: You get the exact odds exposure you wanted, with full transparency about fee impact.

### Example 2: Analyzing Market Opportunities

**Scenario**: You're browsing markets and want to quickly identify opportunities where the after-fee odds are still attractive.

1. **Enable After-Fee Display**: Set display mode to "After-Fee American Odds" in settings
2. **Browse Markets**: All market prices now show true after-fee odds
3. **Spot Opportunities**: Quickly identify where displayed odds (e.g., `+200`) become less attractive after fees (e.g., `+185`)
4. **Make Informed Decisions**: Factor in the true cost before placing trades

**Result**: Never get surprised by fees again - see the real odds upfront.

### Example 3: Real-Time Order Optimization

**Scenario**: You're placing an order and want to optimize your limit price as you adjust quantity.

1. **Open Order Ticket**: Start placing an order on any Kalshi market
2. **Automatic Detection**: The extension detects your order ticket and shows after-fee odds
3. **Adjust Parameters**: Change quantity or price - after-fee calculations update instantly
4. **Fee Source Transparency**: See whether fees are from actual ticket data or estimates
5. **Optimize Entry**: Fine-tune your order based on real-time after-fee projections

**Result**: Optimize every trade with complete fee transparency and real-time calculations.

### Example 4: Cross-Market Analysis

**Scenario**: You're comparing similar markets and want to account for fee impact across different price ranges.

1. **Enable Comprehensive Display**: Set to show both YES and NO sides with after-fee odds
2. **Compare Markets**: Quickly scan multiple markets with true after-fee costs visible
3. **Account for Fee Scaling**: Understand how fees impact different price ranges differently
4. **Make Better Choices**: Choose markets where fees have less impact on your expected returns

**Result**: Make more informed decisions by comparing true after-fee opportunities across markets.

## 📦 Installation

### Development Installation

1. **Clone the Repository**
   ```bash
   git clone [repository-url]
   cd kalshi-american-odds-extension
   ```

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked" and select the extension directory
   - The extension icon should appear in your browser toolbar

3. **Verify Installation**
   - Navigate to any Kalshi market page
   - You should see American odds appear alongside the default percentages
   - Click the extension icon to access settings

### Firefox Installation

Firefox installation requires additional steps due to Manifest V3 compatibility. See [FIREFOX_BUILD_NOTES.md](FIREFOX_BUILD_NOTES.md) for detailed instructions.

### Production Installation (Coming Soon)

The extension will be available on the Chrome Web Store and Firefox Add-ons store once published.

## ⚙️ Configuration

### Settings Overview

Access settings by clicking the extension icon in your browser toolbar.

#### Display Mode Options
- **Percent** (Default): Shows Kalshi's default percentage display
- **Raw American Odds**: Shows American odds without fee calculations
- **After-Fee American Odds**: Shows true odds after trading fees (Recommended)
- **Cycle Mode**: Automatically cycles between display modes every 3 seconds

#### Side Display Options
- **YES Only**: Shows odds for YES positions only
- **YES and NO**: Shows odds for both sides (Recommended for comprehensive analysis)

#### Precision Settings
- **Integer Rounding**: Rounds odds to whole numbers (e.g., +150)
- **Cents Precision**: Shows odds with decimal precision (e.g., +150.25)

#### Fee Estimation
- **Enable Fallback Estimation**: Uses Kalshi's published fee schedule when ticket fees can't be detected
- **Disable Fallback**: Only shows after-fee odds when actual ticket fees are available

### Recommended Settings for New Users

For the best experience, we recommend:
- **Display Mode**: "After-Fee American Odds"
- **Show Sides**: "YES and NO" 
- **Rounding**: "Integer"
- **Fee Estimation**: "Enable Fallback"

These settings provide maximum transparency about true trading costs while maintaining clean, readable displays.

## 🏗️ Project Structure

```
kalshi-american-odds-extension/
├── 📄 manifest.json              # Extension manifest (MV3)
├── 📁 content/
│   ├── 📄 content.js            # Main content script (5500+ lines)
│   └── 📄 content.css           # Styles for injected elements
├── 📁 popup/
│   ├── 📄 popup.html            # Settings popup UI
│   ├── 📄 popup.css             # Popup styles
│   └── 📄 popup.js              # Settings management
├── 📁 background/
│   └── 📄 background.js         # Background service worker
├── 📁 icons/
│   ├── 📄 icon16.png            # Extension icons (16x16)
│   ├── 📄 icon32.png            # Extension icons (32x32)
│   ├── 📄 icon48.png            # Extension icons (48x48)
│   ├── 📄 icon128.png           # Extension icons (128x128)
│   └── 📄 README.md             # Icon requirements
├── 📁 .kiro/specs/              # Development specifications
│   └── 📁 kalshi-chrome-ext/
│       ├── 📄 requirements.md   # Feature requirements
│       ├── 📄 design.md         # Technical design
│       └── 📄 tasks.md          # Implementation tasks
├── 📁 test-files/               # Comprehensive test suite
│   ├── 📄 test-*.js            # Unit tests
│   ├── 📄 test-*.html          # Integration tests
│   └── 📄 verify-*.js          # Validation scripts
├── 📄 DEVELOPMENT.md            # Development guide
├── 📄 FIREFOX_BUILD_NOTES.md    # Firefox compatibility
└── 📄 README.md                 # This file
```

### Key Components

#### Core Files
- **content/content.js**: The heart of the extension containing all odds detection, calculation, and UI injection logic
- **popup/popup.js**: Settings management and user preferences
- **background/background.js**: Cross-tab communication and extension lifecycle management

#### Feature Modules
- **Odds Detection**: Automatically finds and parses probability displays on Kalshi pages
- **Fee Calculation**: Handles both ticket-based and estimated fee calculations
- **Helper Panel**: Interactive limit order assistance with real-time updates
- **Error Handling**: Comprehensive fallback strategies and error recovery

## 🛠️ Development

### Prerequisites

- **Browser**: Chrome 88+ or Firefox 109+
- **Knowledge**: JavaScript ES6+, DOM manipulation, Chrome Extension APIs
- **Tools**: Any text editor (VS Code recommended)

### Development Workflow

1. **Make Changes**: Edit extension files
2. **Reload Extension**: Go to `chrome://extensions/` and click the refresh icon
3. **Test on Kalshi**: Navigate to kalshi.com and verify functionality
4. **Check Console**: Monitor browser console for errors or warnings
5. **Run Tests**: Execute test files to verify functionality

### Testing

The extension includes a comprehensive test suite:

```bash
# Run unit tests
node test-odds-conversion-validation.js
node test-after-fee-odds-unit.js
node test-helper-panel-positioning.js

# Run integration tests  
open test-extension-integration.html
open test-after-fee-odds-display.html
open test-helper-panel-positioning.html

# Run validation scripts
node verify-task-*.js
```

### Key Development Areas

#### Adding New Features
1. **Update content.js**: Add core functionality
2. **Update popup.js**: Add settings if needed  
3. **Add Tests**: Create corresponding test files
4. **Update Documentation**: Modify this README

#### Debugging Common Issues
- **Odds Not Appearing**: Check console for DOM parsing errors
- **Settings Not Saving**: Verify storage permissions in manifest.json
- **Helper Panel Issues**: Check for CSS conflicts or positioning problems
- **Fee Calculations Wrong**: Verify fee parsing logic and fallback estimation

## ⚡ Advanced Features

### Real-Time Updates
The extension uses advanced MutationObserver technology to detect changes on Kalshi pages and update odds displays instantly. This means:
- Odds update automatically when market prices change
- Helper panel recalculates when you modify order parameters  
- After-fee displays refresh when fee information becomes available
- No manual refresh needed - everything stays current

### Intelligent Fee Detection
The extension employs a sophisticated fee detection system:
1. **Primary**: Reads actual fees from order tickets when available
2. **Fallback**: Uses Kalshi's published fee schedule for estimation
3. **Transparency**: Always indicates whether fees are actual or estimated
4. **Validation**: Comprehensive error checking and edge case handling

### Performance Optimization
- **Debounced Updates**: Prevents excessive recalculation during rapid changes
- **Efficient DOM Scanning**: Optimized selectors minimize performance impact
- **Memory Management**: Proper cleanup prevents memory leaks
- **Error Recovery**: Graceful handling of edge cases and network issues

## 🔧 Technical Details

### Browser Compatibility

| Feature | Chrome 88+ | Firefox 109+ |
|---------|------------|--------------|
| Core Functionality | ✅ Full Support | ✅ Full Support |
| Manifest V3 | ✅ Native | ✅ Basic Support |
| Service Workers | ✅ Full Support | ⚠️ Limited |
| Storage API | ✅ Full Support | ✅ Full Support |
| Content Scripts | ✅ Full Support | ✅ Full Support |

### Permissions Required
- **Host Permissions**: `https://kalshi.com/*` - Required to inject content and read market data
- **Storage**: Required to save user settings and preferences
- **Active Tab**: Required for cross-tab communication and updates

### Security & Privacy
- **No Data Collection**: The extension doesn't collect or transmit any personal data
- **Local Processing**: All calculations happen locally in your browser
- **No External Requests**: No communication with external servers
- **Minimal Permissions**: Only requests permissions necessary for functionality

## 🎛️ Settings Reference

### Display Mode Details

#### Percent Mode
- Shows Kalshi's default percentage display
- Useful for users who prefer percentage-based thinking
- No additional calculations performed

#### Raw American Odds Mode  
- Converts percentages to American odds format
- No fee calculations included
- Formula: `odds = probability < 0.5 ? (100 * (1-p) / p) : (-100 * p / (1-p))`

#### After-Fee American Odds Mode (Recommended)
- Shows true odds after accounting for trading fees
- Most accurate representation of actual trade costs
- Automatically detects fees from order tickets or estimates using Kalshi's fee schedule
- Formula: `after_fee_odds = american_odds_from_probability(price + fee_per_contract)`

#### Cycle Mode
- Automatically rotates between display modes every 3 seconds
- Useful for comparing different representations
- Pauses cycling when hovering over odds displays

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup
1. **Fork the Repository**: Create your own fork on GitHub
2. **Clone Locally**: `git clone [your-fork-url]`
3. **Create Branch**: `git checkout -b feature/your-feature-name`
4. **Install Extension**: Load unpacked extension in Chrome for testing

### Contribution Guidelines
- **Code Style**: Follow existing JavaScript patterns and conventions
- **Testing**: Add tests for new features in the appropriate test files
- **Documentation**: Update README.md and inline comments for new features
- **Browser Testing**: Test on both Chrome and Firefox before submitting

### Areas for Contribution
- **V2 Features**: EV/edge calculation, spread warnings, arbitrage tools
- **UI Improvements**: Enhanced styling, animations, accessibility
- **Performance**: Optimization of DOM scanning and calculation algorithms
- **Testing**: Additional test coverage and edge case validation
- **Documentation**: Screenshots, tutorials, and usage guides

### Submitting Changes
1. **Test Thoroughly**: Verify functionality on multiple Kalshi market pages
2. **Run Test Suite**: Execute existing tests to ensure no regressions
3. **Update Documentation**: Modify README.md if adding user-facing features
4. **Create Pull Request**: Submit with clear description of changes
5. **Respond to Feedback**: Address any review comments promptly

## 📋 Roadmap

### V1 Features (✅ Complete)
- [x] American odds display with multiple modes
- [x] After-fee odds calculation engine  
- [x] Limit order helper panel
- [x] Real-time updates and integration
- [x] Comprehensive error handling
- [x] Cross-browser compatibility
- [x] Production-ready quality assurance

### V2 Features (🔄 Planned)
- [ ] **EV/Edge Calculator**: Quick expected value and edge calculations
- [ ] **Spread/Slippage Warnings**: Alerts for wide spreads and market impact
- [ ] **Arbitrage Tools**: Compare Kalshi odds with external sportsbooks
- [ ] **Advanced Analytics**: Historical odds tracking and market analysis
- [ ] **Keyboard Shortcuts**: Quick access to display mode cycling
- [ ] **Copy/Export Tools**: Export calculations and analysis data

### Future Considerations
- Mobile browser support (when technically feasible)
- Integration with trading journals and portfolio trackers
- Advanced risk management tools
- Social features for sharing analysis

## 🆘 Troubleshooting

### Common Issues

#### Odds Not Displaying
**Symptoms**: No American odds appear on Kalshi pages
**Solutions**:
1. Check that you're on a supported Kalshi market page
2. Verify extension is enabled in `chrome://extensions/`
3. Check browser console for JavaScript errors
4. Try refreshing the page
5. Ensure extension has proper permissions

#### Settings Not Saving  
**Symptoms**: Settings reset when browser restarts
**Solutions**:
1. Verify storage permissions in extension settings
2. Check if browser is in incognito mode (may limit storage)
3. Clear extension storage and reconfigure
4. Reinstall extension if problem persists

#### Helper Panel Not Appearing
**Symptoms**: Limit order helper doesn't show on order pages
**Solutions**:
1. Ensure you're on a market page with an active order ticket
2. Check for CSS conflicts with other extensions
3. Verify content script injection in developer tools
4. Try disabling other extensions temporarily

#### Incorrect Fee Calculations
**Symptoms**: After-fee odds seem wrong or inconsistent
**Solutions**:
1. Check if fees are marked as "Estimated" vs actual ticket fees
2. Verify your order quantity and price parameters
3. Compare with manual calculation using Kalshi's fee schedule
4. Report specific examples for investigation

### Getting Help

1. **Check Console**: Open browser developer tools and check for error messages
2. **Verify Permissions**: Ensure extension has access to kalshi.com
3. **Test Clean Install**: Try disabling other extensions to isolate conflicts
4. **Report Issues**: Create detailed bug reports with:
   - Browser version and operating system
   - Extension version
   - Specific Kalshi page URL where issue occurs
   - Screenshots or console error messages
   - Steps to reproduce the problem

## 📄 License

[Add your license information here]

---

## 🙏 Acknowledgments

- **Kalshi**: For providing an innovative prediction market platform
- **Chrome Extensions Team**: For comprehensive documentation and APIs
- **Open Source Community**: For tools and libraries that made this possible
- **Beta Testers**: For feedback and bug reports during development

---

*Made with ❤️ for the Kalshi trading community*