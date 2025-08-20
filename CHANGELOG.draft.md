## 0.1.24-dev

### Fixed
- **Disabled Button Tooltip Styling**: Fixed tooltip keyboard shortcuts to display in neutral colors when the associated button is disabled, indicating the shortcut is inaccessible
- **Disabled Button Hover Effects**: Fixed issue where disabled buttons still showed hover background effects by adding proper `:not(:disabled):not(.disabled)` selectors to all hover states
- **FileTableToolbar Disabled Button Hover**: Fixed hover effects on disabled buttons in FileTableToolbar (Remove Selected, Copy to, Move to) by adding specific CSS rules to prevent background color changes on hover

### Added
- **FileTable Keyboard Shortcuts**: Added comprehensive keyboard shortcut support for FileTable toolbar actions:
  - `Ctrl+O`: Direct shortcut for "Add Files" action
  - `Ctrl+F`: Direct shortcut for "Add Folders" action
  - `F5`: Refresh files list
  - `Delete`: Remove selected files
  - `Ctrl+Shift+C`: Copy selected files to another job (placeholder)
  - `Ctrl+Shift+M`: Move selected files to another job (placeholder)
  - `Ctrl+,`: Open file table settings (placeholder)
- **Toolbar Button Shortcuts**: Added keyboard shortcut display to "Add File" (Ctrl+O) and "Add Folder" (Ctrl+F) buttons in the FileTableToolbar
- **Enhanced Tooltips**: Updated "Add Files and Folders" dropdown tooltip to clearly show keyboard shortcuts with descriptive labels (Add Files: Ctrl+O | Add Folders: Ctrl+F)
- **Keyboard Shortcut Keycap Styling**: Added modern keycap-style borders and backgrounds to keyboard shortcuts in tooltips with individual key styling and proper contrast. Enabled buttons show blue keycaps while disabled buttons show muted colors. Plus symbols are styled separately without keycap borders
- **Disabled Button Tooltip Styling**: Fixed tooltip keyboard shortcuts to display in neutral colors when the associated button is disabled
- **Job Reordering Keyboard Shortcuts**: Added keyboard shortcuts for moving jobs left/right:
  - `Ctrl+Shift+Left`: Move currently selected job to the left
  - `Ctrl+Shift+Right`: Move currently selected job to the right
  - Added visual shortcut indicators to context menu buttons

### Fixed
- **ESC Key Conflict**: Fixed issue where pressing ESC would close one dropdown but immediately open another dropdown from FileTableLoadingOverlay by preventing the cancel dropdown from opening when other dropdowns are present
- **ESC Key Hierarchy**: Implemented proper ESC key behavior hierarchy:
  - **Dropdowns open** → Close dropdowns (highest priority)
  - **FileTableLoadingOverlay active** → Open/close cancel dialog
  - **FileTable active** → Make FileTable inactive (default behavior)
- **ESC Key Timing**: Added 10ms delay to prevent cancel dropdown from opening immediately after other dropdowns are closed

### Changed
- *Development work in progress...*

### Technical Details
- *Development work in progress...*
