## 0.1.23-dev

### Fixed
- *Development work in progress...*

### Added
- **FileTableToolbar Tooltips**: Added comprehensive tooltip support to all buttons in the FileTableToolbar
  - Added tooltips for "Add" button: "Add files or folders to this job" (Ctrl+O)
  - Added tooltips for "Refresh" button: "Refresh the file list" (F5)
  - Added tooltips for "Remove Selected" button: "Remove selected files from this job" (Del)
  - Added tooltips for "Copy to" button: "Copy selected files to another job" (Ctrl+Shift+C)
  - Added tooltips for "Move to" button: "Move selected files to another job" (Ctrl+Shift+M)
  - Added tooltips for "Settings" button: "File table display settings" (Ctrl+,)
  - All tooltips appear above the buttons for optimal visibility
  - Tooltips use the InfoTooltip component for consistent styling and behavior
  - Added proper mouse event handling with tooltipManager for reliable tooltip display
  - Added keyboard shortcut visuals to all tooltips for better user guidance
  - Fixed tooltip positioning by using proper target references (visualStyleRef for buttons, $el for dropdowns)

- **InfoTooltip Usage Guidelines**: Created comprehensive rule file for consistent tooltip implementation
  - Added `.cursor/rules/info-tooltip-usage.mdc` with complete implementation patterns
  - Documented standard workflow for adding tooltips to buttons and interactive elements
  - Included step-by-step setup instructions with code examples
  - Added best practices for tooltip ID naming, placement, and keyboard shortcuts
  - Documented common pitfalls to avoid and correct implementation patterns
  - Added reference implementations pointing to existing working examples
  - Updated InfoTooltip.vue and InfoTooltipContainer.vue with references to the rule file
  - Ensures consistent tooltip implementation across the entire codebase

### Changed
- *Development work in progress...*

### Technical Details
- *Development work in progress...*
