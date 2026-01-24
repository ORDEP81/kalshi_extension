# tasks.md
## V1 Tasks
- [x] 1. Project setup
  - [x] 1.1 Create MV3 extension scaffold (Chrome + Firefox build notes)
  - [x] 1.2 Add storage permissions and host permissions for kalshi.com

- [x] 2. Settings UI (popup)
  - [x] 2.1 Implement displayMode, showSides, rounding, fee fallback toggles
  - [x] 2.2 Persist settings in storage and broadcast changes to content script

- [x] 3. Content script: odds injection
  - [x] 3.1 Implement DOM scan for probability nodes (percent/price) (TASK-3.1-SUMMARY.md)
  - [x] 3.2 Render raw American odds per setting (TASK-3.2-COMPLETION-SUMMARY.md)
  - [x] 3.3 Add MutationObserver + debounced re-render (TASK-3.3-COMPLETION-SUMMARY.md)
  - [x] 3.4 Ensure click-safety (pointer-events: none) and minimal layout impact (TASK-3.4-COMPLETION-SUMMARY.md)

- [x] 4. Ticket parsing + after-fee odds (References: R3, R4, R5)
  - [x] 4.1 Detect order ticket open state (TASK-4.1-COMPLETION-SUMMARY.md)
  - [x] 4.2 Parse ticket data from order form UI
    - [x] 4.2.1 Implement robust ticket element selectors and parsing functions (TASK-4.2.1-COMPLETION-SUMMARY.md)
    - [x] 4.2.2 Parse order side (YES/NO) from ticket UI elements (TASK-4.2.2-COMPLETION-SUMMARY.md)
    - [x] 4.2.3 Parse limit price from price input field with validation (TASK-4.2.3-COMPLETION-SUMMARY.md)
    - [x] 4.2.4 Parse quantity/contracts from quantity input field with validation (TASK-4.2.4-COMPLETION-SUMMARY.md)
    - [x] 4.2.5 Parse fee information from ticket display elements (TASK-4.2.5-COMPLETION-SUMMARY.md)
    - [x] 4.2.6 Add comprehensive error handling and fallback strategies (TASK-4.2.6-COMPLETION-SUMMARY.md)
  - [x] 4.3 Implement after-fee odds calculation and display
    - [x] 4.3.1 Create after-fee odds calculation formula (risk + fee_per_contract) (TASK-4.3.1-COMPLETION-SUMMARY.md)
    - [x] 4.3.2 Handle both total fee and per-contract fee scenarios (TASK-4.3.2-COMPLETION-SUMMARY.md)
    - [x] 4.3.3 Implement fallback fee estimation using published schedule
    - [x] 4.3.4 Add comprehensive validation for calculated values
  - [x] 4.4 Create after-fee odds display UI
    - [x] 4.4.1 Design and implement after-fee odds display element
    - [x] 4.4.2 Add fee source tooltip indicating ticket vs estimated source
    - [x] 4.4.3 Inject display near ticket form with proper positioning
    - [x] 4.4.4 Update display dynamically when ticket data changes

- [x] 5. Limit-order helper panel (References: R6)
  - [x] 5.1 Create helper panel UI and positioning
    - [x] 5.1.1 Design helper panel layout and styling
    - [x] 5.1.2 Implement panel injection and positioning logic
    - [x] 5.1.3 Ensure panel doesn't interfere with existing ticket functionality
  - [x] 5.2 Implement odds-to-price conversion functionality
    - [x] 5.2.1 Add American odds input field with validation
    - [x] 5.2.2 Add YES/NO side selection controls
    - [x] 5.2.3 Implement American odds to probability conversion
    - [x] 5.2.4 Calculate and display suggested limit price
    - [x] 5.2.5 Show projected after-fee effective odds for suggested order
  - [x] 5.3 Add real-time updates and integration
    - [x] 5.3.1 Listen for changes in ticket form inputs
    - [x] 5.3.2 Recalculate helper panel values when inputs change
    - [x] 5.3.3 Update calculations when fee information becomes available

- [x] 6. QA + hardening (References: R7)
  - [x] 6.1 Test on multiple market pages (completed via comprehensive test suites)
  - [x] 6.2 Verify no click interference (completed via click-safety tests)
  - [x] 6.3 Add comprehensive error handling and validation
    - [x] 6.3.1 Handle cases where ticket elements cannot be found
    - [x] 6.3.2 Validate all parsed numeric values and handle edge cases
    - [x] 6.3.3 Add detailed error logging and debugging information
  - [x] 6.4 Implement fallback fee estimation labeling
    - [x] 6.4.1 Detect when fallback fee estimation is being used
    - [x] 6.4.2 Add clear "Estimated" labels to affected displays
    - [x] 6.4.3 Update tooltips to explain fee source and estimation method

## V2 Tasks
- [ ]* 7. EV/edge quick calc
  - [ ]* 7.1 Add optional fields (true odds/true p)
  - [ ]* 7.2 Compute EV/edge after fees
  - [ ]* 7.3 Display results in helper panel

- [ ]* 8. Spread/slippage warning
  - [ ]* 8.1 Parse best bid/ask if present
  - [ ]* 8.2 Compute spread + odds impact
  - [ ]* 8.3 Add threshold setting and warning UI

- [ ]* 9. Arb compare box (paste-in)
  - [ ]* 9.1 Paste parser for sportsbook odds lines
  - [ ]* 9.2 Compare vs Kalshi after-fee odds
  - [ ]* 9.3 Compute stake sizing + profit estimate
  - [ ]* 9.4 Add settlement-definition warning text

- [ ]* 10. Polish
  - [ ]* 10.1 Copy-to-clipboard outputs
  - [ ]* 10.2 Keyboard shortcut to cycle display modes (optional)
  - [ ]* 10.3 Documentation + release packaging