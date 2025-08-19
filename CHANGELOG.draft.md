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
