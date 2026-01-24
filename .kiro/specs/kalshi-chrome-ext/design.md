# design.md
## Architecture
- Browser extension with:
  - Content script on https://kalshi.com/*
  - Popup settings UI
  - Storage (sync/local) for settings
- Content script responsibilities:
  - Detect probability/price nodes in DOM
  - Inject odds labels
  - Observe DOM changes via MutationObserver
  - Detect order ticket panel and parse:
    - side (YES/NO)
    - price
    - quantity
    - fee (total or per-contract)
  - Compute after-fee odds and render near ticket fields

## DOM Strategy
- Avoid brittle classnames; prefer:
  - pattern matching for percent text like `^\d{1,3}%$`
  - and/or price strings like `$0.xx`
  - then traverse to nearest stable row container
- Mark processed nodes with data attributes (e.g., data-kalshi-ao="1") to avoid duplicates.

## Click-safety & Layout
- All injected “label” elements must have:
  - pointer-events: none
  - user-select: none
- Prefer inline injection near existing text.
- If layout wraps, use an absolute-position badge inside a `position: relative` anchor container.

## Computation Details

### Probability ↔ American odds
- p -> American:
  - if p < 0.5: +100 * (1-p)/p
  - if p > 0.5: -100 * p/(1-p)
  - if p = 0.5: +100
- American -> p:
  - if odds > 0: p = 100 / (odds + 100)
  - if odds < 0: p = (-odds) / ((-odds) + 100)

### After-fee effective odds (per contract)
- If ticket provides total_fee and contracts C:
  - fee_per = total_fee / C
- risk = price + fee_per
- profit = 1 - risk
- Convert to American based on profit/risk:
  - if profit >= risk: +100 * (profit/risk)
  - else: -100 * (risk/profit)

## Settings
- displayMode: percent | rawAmerican | afterFeeAmerican | cycle
- showSides: yesOnly | yesAndNo
- feeSource: ticketFirst (always) + optional fallbackEstimateEnabled
- rounding: integer odds, cents
- v2 toggles reserved: showEV, showSpreadWarn, showArbBox

## V2 Design Extensions
- EV/edge module: local calculator (true p/odds input) displayed in ticket helper panel.
- Spread warning: read bid/ask if present; compute spread and odds impact; warn above threshold.
- Arb box: paste parser + calculation; no external calls required.
