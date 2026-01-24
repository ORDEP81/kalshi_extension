# requirements.md
## Overview
Build a Chrome + Firefox extension that enhances kalshi.com by displaying American odds (raw and after-fee) and providing a limit-order helper (odds ↔ limit price). The extension must not interfere with normal site interaction.

## Users
- Odds-focused traders who think in American odds.
- Users placing frequent limit orders who want quick conversion and accurate after-fee odds.

## User Stories & Acceptance Criteria (EARS)

### R1 — Toggle odds display
WHEN the user is viewing a Kalshi market list or market detail page  
THE SYSTEM SHALL provide a toggle to display odds as Percent, Raw American, or After-fee American.

WHEN the user selects a display mode  
THE SYSTEM SHALL persist that choice and apply it on subsequent kalshi.com visits.

### R2 — Raw American odds conversion
WHEN the system identifies an implied probability p from the UI (percent or price)  
THE SYSTEM SHALL compute and display the corresponding raw American odds.

WHEN p equals 0.50  
THE SYSTEM SHALL display +100.

### R3 — After-fee effective odds (ticket fee)
WHEN an order ticket is visible and contains a fee value for the current order  
THE SYSTEM SHALL read that fee value and compute effective after-fee American odds for the order.

WHEN the fee value changes (price/qty/side changes)  
THE SYSTEM SHALL update after-fee odds within 300ms.

### R4 — Fee source transparency
WHEN displaying any fee-derived number  
THE SYSTEM SHALL show a tooltip explaining the fee source:
- “Read from Kalshi ticket” OR
- “Estimated from published schedule (fallback)”

### R5 — Fallback fee estimate (optional)
WHEN the system cannot find a fee value in the ticket UI AND fallback is enabled  
THE SYSTEM SHALL estimate the fee using a deterministic formula and label the result as “Estimated”.

### R6 — Limit-order helper (odds → price)
WHEN the user enters American odds and chooses YES or NO  
THE SYSTEM SHALL compute a suggested limit price for Kalshi and display it.

WHEN fee information is available  
THE SYSTEM SHALL compute and display the after-fee effective odds for the suggested limit order.

### R7 — Non-interfering UI
WHEN the extension injects UI elements on kalshi.com  
THE SYSTEM SHALL ensure injected labels do not capture clicks (pointer-events disabled)  
AND shall not block existing buttons, links, or row interactions.

## Non-functional Requirements
- Performance: DOM updates must be debounced; no continuous heavy scanning.
- Privacy: No collection of user credentials; store only extension settings locally/sync.
- Compatibility: Chrome MV3 and Firefox support (MV3 where applicable).
