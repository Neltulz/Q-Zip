## [0.1.22] - Development

### Fixed
- *Development work in progress...*

### Added
- Auto-pause functionality during cancel confirmation dialog in FileTableLoadingOverlay
  - Scanning automatically pauses when user clicks "Cancel" button
  - Scanning resumes automatically if user closes dialog without confirming
  - Maintains original pause state if user was already paused before opening dialog

### Changed
- Improved cancel confirmation dialog layout in FileTableLoadingOverlay
  - Removed overall padding and applied individual padding to sections
  - Border now extends to full width of dropdown menu for cleaner appearance

### Technical Details
- Refactored progress section from FileTableLoadingOverlay into reusable ProgressBar component
  - Extracted progress bar logic and styling into standalone component
  - Added support for different progress variants (default, overall, current)
  - Component now supports custom labels and pause state styling
  - Improved code reusability and maintainability
- Added tooltips to FileTableLoadingOverlay buttons
  - Pause/Resume button shows contextual tooltip with Space keyboard shortcut
  - Cancel button shows tooltip with ESC shortcut
  - Added tooltips to cancel confirmation dialog elements
    - Close (X) button shows "Close cancel dialog" with ESC shortcut
    - Checkbox shows "Also remove already scanned items" with Space shortcut
    - Cancel Process button shows "Confirm cancel process" with Enter shortcut
  - Tooltips follow the same pattern as JobSelectorArea implementation
- Added keyboard shortcuts to FileTableLoadingOverlay
  - Space key pauses/resumes scanning (when cancel dialog is not open)
  - ESC key closes cancel confirmation dialog
  - Enter key pauses/resumes scanning (when cancel dialog is not open)
- Fixed tooltip positioning in FileTableLoadingOverlay
  - Close (X) button tooltip now appears to the right of the button
  - Checkbox tooltip now appears to the right of the checkbox label
  - Improved keyboard event handling for global shortcuts
- Enhanced keyboard shortcuts in FileTableLoadingOverlay cancel dialog
  - ESC key now opens the cancel dropdown when closed, and closes it when open
  - Enter key now triggers the "Cancel Process" button when dialog is open
  - Space key now toggles the "Also remove already scanned items" checkbox when dialog is open
- Fixed tooltip styling issues
  - Removed circular CSS variable declarations that were preventing proper inheritance
  - Now properly using global CSS variables for border color and border radius
  - Tooltips now display with proper styling that adapts to theme changes
- Added CSS variable source comments to InfoTooltip component
  - Added inline comments indicating where global CSS variables are defined
  - Updated code style guidelines to include CSS variable source commenting rule
  - This helps prevent circular references and makes variable sources clear
