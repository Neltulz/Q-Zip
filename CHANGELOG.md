# Q-Zip Changelog

> **Note:** This changelog maintains only the most recent 20 versions for readability and performance. Older versions are archived when new versions are added.

## Recent Changes

## [0.1.15] - 2025-01-27T20:00:00Z

### Changed
- **Version Update**: Incremented patch version from 0.1.14 to 0.1.15
  - Updated version display in `app/components/TitleBar.vue` to `v0.1.15`
  - Updated version in `src-tauri/Cargo.toml` to `0.1.15`
  - Updated version in `src-tauri/tauri.conf.json` to `0.1.15`

### Added
- **Discord-style Remove Job Confirmation**: Redesigned the remove job dropdown to match Discord's delete message popup layout
  - Added structured header with title and confirmation question
  - Added job preview section showing job icon, title, and file count
  - Added PROTIP section with helpful keyboard shortcut information
  - Improved button layout with Cancel and Remove Job buttons positioned side-by-side at bottom-right
  - Enhanced visual hierarchy and spacing for better UX
  - **Enhanced DropdownMenu Component**: Added support for customizing cancel button theme and styling
  - **Bordered Button Styling**: Updated remove job confirmation to use bordered buttons with proper justification

### Fixed
- **Remove Job UI**: Improved user experience with clearer confirmation dialog layout
- **Remove Job Button Layout**: Fixed button positioning to appear below separator with proper side-by-side layout and fit-content width
- **Remove Job Button Sizing**: Added `flex-grow: 0` to prevent buttons from stretching to fill available space
- **Remove Job Dropdown Refinements**: Made dropdown thinner (240px width), increased tip text size to 14px, changed "PROTIP" to "TIP" with neutral styling, added 35ch max-width to text elements for better readability, centered tip content with auto margins, put "TIP:" on its own line, optimized text wrapping with fit-content width to eliminate empty space, and added premium styling to tip wrapper with gradient background, subtle shadows, and accent border
- **New InfoCard Component**: Created reusable InfoCard component with theme support (primary/success/danger/info/warning), slots for header, content, and icon, and premium styling with gradient backgrounds and accent borders
- **Remove Job Dropdown Width**: Reduced max-width to 45ch for more compact layout and properly fixed padding consistency by applying individual padding to content sections, including InfoCard component with proper margin spacing

### Technical Details
- **Frontend Versioning**: Updated TitleBar component version display for development feedback
- **Hot Reload**: Version change will hot-reload without triggering full Rust rebuild

---

## [0.1.14] - 2025-01-27T19:00:00Z

### Added
- **Dropdown Cancel Button Feature**: Added `showCancelButton` prop to DropdownMenu component for consistent Cancel button functionality
  - Added `showCancelButton` and `cancelButtonText` props to DropdownMenu component
  - Implemented automatic Cancel button rendering with "Esc" keyboard shortcut
  - Added conditional rendering for Cancel button below dropdown content with proper styling
  - Enhanced dropdown reusability and consistency across the application

- **Enhanced Dropdown Management**: Improved dropdown unregistration and backdrop handling
  - Added fallback unregistration mechanism to ensure dropdowns are properly unregistered
  - Enhanced logging for dropdown manager operations to track unregistration issues
  - Added detailed logging for `closeDescendantsOf` function to debug submenu behavior
  - Improved backdrop visibility management to prevent race conditions

### Fixed
- **Submenu Cancel Button Backdrop Issue**: Fixed backdrop fading back in after clicking Cancel on submenus
  - Fixed race condition where submenu unregistration was not happening properly
  - Added fallback unregistration timeout to ensure submenus are properly cleaned up
  - Prevented backdrop from reappearing when submenus are closed via Cancel button
  - Resolved timing issue between parent and child dropdown closure

- **TypeScript Errors**: Fixed multiple TypeScript errors in DropdownMenu component
  - Fixed incorrect argument count for `handleMouseLeave` function call
  - Fixed type assertion for `vnode.children` property access
  - Fixed argument mismatches for `logWarning` and `logInteraction` function calls
  - Added null check for `buttonEl` before creating dropdown object

### Technical Details
- **Component Props**: Added `showCancelButton` and `cancelButtonText` props to DropdownMenu component
- **Template Structure**: Updated dropdown template to include conditional Cancel button rendering
- **Styling**: Added proper styling for Cancel button with divider line and consistent appearance
- **Fallback Mechanism**: Implemented setTimeout-based fallback for dropdown unregistration
- **Logging Enhancement**: Added comprehensive logging for dropdown manager operations
- **Type Safety**: Fixed all TypeScript errors in DropdownMenu component for better type safety

---

## [0.1.13] - 2025-01-27T17:00:00Z

### Added
- **Job Removal Keyboard Shortcuts**: Added Shift+Delete keyboard shortcut for removing the currently selected job
  - Added shortcut text display to "Remove Job" button in job context menu
  - Implemented global keyboard event handling for job removal operations
  - Enhanced user experience with quick job removal without mouse interaction

- **Job Removal Confirmation Dropdowns**: Replaced "X" close buttons with confirmation dropdown menus
  - Added confirmation pattern similar to LoadingAnim component for safer job removal
  - Implemented dropdown menus with "Yes, remove it" and "Nevermind" options
  - Enhanced visual consistency with other confirmation dialogs in the application
  - Added proper ref management for dropdown menu components

- **Dropdown Debug Logging**: Enabled comprehensive debug logging for DropdownMenu component to troubleshoot backdrop closing issues
  - Enabled master DEBUG flag to activate all logging systems
  - Enabled `logDropdownEvents` for dropdown-specific event tracking
  - Enabled `logClicksAndInputs` for button click tracking
  - Enabled `logComposableManagerEvents` for dropdown manager state tracking
  - Enabled `logUIEvents` for general UI interaction tracking
  - Enabled `logMissingPropWarnings` for potential issue detection
  - Enhanced debugging capability to track submenu behavior and backdrop visibility issues

### Fixed
- **Dropdown Backdrop Race Condition**: Fixed backdrop fading back in after closing dropdowns due to debounced watcher race condition
  - Fixed `closeAllDropdowns` function to immediately clear the openDropdowns array before closing individual dropdowns
  - Prevented debounced watcher from incorrectly showing overlay when all dropdowns should be closed
  - Added proper handling for dropdowns trying to unregister after array has been cleared
  - Resolved timing issue between dropdown closure and overlay visibility management

### Technical Details
- **Keyboard Shortcuts**: Added Shift+Delete shortcut for job removal with proper event handling
- **Confirmation UI**: Implemented dropdown-based confirmation pattern for job removal operations
- **Component Ref Management**: Added proper ref tracking for remove job dropdown menus
- **CSS Styling**: Added styles for remove job confirmation dropdowns to match application design
- **Debug Configuration**: Updated `debugConfig.ts` to enable targeted logging for dropdown troubleshooting
- **Logging System**: Activated comprehensive logging for dropdown manager, button interactions, and UI events
- **Troubleshooting**: Enabled logging to identify backdrop closing malfunctions related to submenu behavior
- **Race Condition Fix**: Modified dropdown manager to prevent overlay from reappearing after all dropdowns are closed

---

## [0.1.12] - 2025-01-27T15:00:00Z

### Added
- **Loading Animation Enhancements**: Enhanced LoadingAnim component with pause and resume functionality
  - Added pause and resume controls to allow users to control ongoing operations
  - Added confirmation dropdown for canceling operations to improve user experience during long tasks
  - Enhanced JobArea to handle pause events and log relevant actions for better debugging
  - Updated DropdownMenu to support new button interactions and improved icon logic based on content presence

### Fixed
- **Console Logging Optimization**: Significantly reduced verbose console logging during startup and operation
  - Fixed excessive "Set job button ref" logging from JobSelectorArea component
  - Disabled master DEBUG flag to reduce console noise while maintaining debugging capability
  - Fixed 4 TypeScript linter errors in JobArea.vue related to potential undefined array access
  - Added proper null checks for array element access in file operation functions

### Technical Details
- **Debug Configuration**: Updated `debugConfig.ts` to disable automatic debug mode enabling in development
- **Type Safety**: Added null checks for `pathsToMove[0]` and `pathsToCopy[0]` array access in JobArea.vue
- **Logging System**: Maintained debugging capability through `window.__QZIP_DEBUG(true)` for targeted debugging
- **Version Bump**: Incremented patch version from 0.1.11 to 0.1.12 in:
  - `src-tauri/Cargo.toml`
  - `app/components/TitleBar.vue`
  - `src-tauri/tauri.conf.json`

---

## [0.1.11] - 2025-01-27T14:00:00Z

### Changed
- **Version Update**: Incremented patch version from 0.1.10 to 0.1.11
  - Updated version in `src-tauri/Cargo.toml`
  - Updated version display in `app/components/TitleBar.vue`
  - Updated version in `src-tauri/tauri.conf.json` (both version field and window title)

---

## [0.1.10] - 2025-08-14T15:00:00Z

### Fixed
- **Checkbox Mode Auto-Check Bug**: Fixed inconsistent behavior when deselecting files in checkbox mode with "auto check on select" enabled
  - Fixed bug where previously marquee-selected files would become checked again after deselecting all files
  - Fixed `deselectAll` function to properly clear checked files when "auto check on select" is enabled
  - Fixed `toggleAll` function to synchronize selection and checking states when "auto check on select" is enabled
  - Ensured consistent behavior between selection and checking states in checkbox mode with auto-check enabled

### Technical Details
- **Selection Logic**: Updated `deselectAll` function to clear checked files when "auto check on select" is enabled
- **Header Checkbox**: Enhanced `toggleAll` function to update both selection and checking states when auto-check is enabled
- **State Synchronization**: Ensured selection and checking states remain synchronized when "auto check on select" is enabled
- **Version Bump**: Incremented patch version from 0.1.9 to 0.1.10 in:
  - `src-tauri/Cargo.toml`
  - `app/components/TitleBar.vue`
  - `src-tauri/tauri.conf.json`

---

## [0.1.9] - 2025-08-14T14:00:00Z

### Fixed
- **Checkbox Mode Selection Behavior**: Fixed marquee selection behavior in checkbox mode with auto-check disabled
  - Fixed marquee selection only selecting files without checking them when "auto check on select" is disabled
  - Fixed marquee selection immediately deselecting all files on mousedown when starting a new selection
  - Fixed header checkbox toggling checked state instead of selection state in checkbox mode
  - Fixed deselection behavior to only clear selected files, not checked files, in checkbox mode
  - Fixed spacebar functionality to toggle checked state of selected files when auto-check is disabled

### Technical Details
- **Marquee Selection**: Modified marquee selection logic to respect "auto check on select" setting
- **Header Checkbox**: Updated `toggleAll` function to properly handle checkbox mode vs normal mode
- **Deselection Logic**: Enhanced `deselectAll` and marquee mousedown handlers to preserve checked files in checkbox mode
- **Spacebar Support**: Added spacebar functionality to toggle checked state for selected files
- **Version Bump**: Incremented patch version from 0.1.8 to 0.1.9 in:
  - `src-tauri/Cargo.toml`
  - `app/components/TitleBar.vue`
  - `src-tauri/tauri.conf.json`

---

## [0.1.8] - 2025-08-14T13:00:00Z

### Fixed
- **Modal Post-Operation Activation**: Fixed file table becoming inactive after confirming/canceling modals from drag-and-drop operations
  - Added file table reactivation after modal closes in drag-and-drop confirmation modals
  - Enhanced modal callback in `JobSelectorArea.vue` to dispatch `app:ensure-activate-filetable` event
  - Improved logging to track file table reactivation events
  - Fixed issue where file table would remain inactive after completing drag-and-drop file operations

### Technical Details
- **Event System**: Utilized existing `app:ensure-activate-filetable` event system for consistent activation
- **Modal Callbacks**: Enhanced modal callback to reactivate file table after operation completion
- **Logging Enhancement**: Added detailed logging for file table reactivation events
- **Version Bump**: Incremented patch version from 0.1.7 to 0.1.8 in:
  - `src-tauri/Cargo.toml`
  - `app/components/TitleBar.vue`
  - `src-tauri/tauri.conf.json`

---

## [0.1.7] - 2025-08-14T12:30:00Z

### Fixed
- **Context Menu Activation**: Fixed file table not becoming active when right-clicking on .item-name-content elements
  - Enhanced `handleContextMenu` function to ensure immediate activation with persistence
  - Added `nextTick` delay to prevent activation from being overridden by other handlers
  - Improved `handleRootContextMenu` function with similar activation persistence
  - Added enhanced logging to track context menu activation events
  - Fixed timing issues that could cause activation to be lost during context menu opening

### Technical Details
- **Event Handling**: Modified context menu handlers to use immediate activation with persistence
- **Timing Fixes**: Added `nextTick` calls to ensure activation persists through context menu operations
- **Logging Enhancement**: Added target element class information to focus logging for better debugging
- **Version Bump**: Incremented patch version from 0.1.6 to 0.1.7 in:
  - `src-tauri/Cargo.toml`
  - `app/components/TitleBar.vue`
  - `src-tauri/tauri.conf.json`

---

## [0.1.6] - 2025-08-14T11:15:00Z

### Fixed
- **Context Menu Focus Management**: Fixed file table losing active status after context menu interactions
  - Fixed focus restoration when clicking "Cancel" button in context menus
  - Enhanced focus debugging with comprehensive logging system
  - Modified `FileTable.vue` outside handler to prevent deactivation for active jobs
  - Added `logFocus` function to `app/utils/loggers.ts` for detailed focus state tracking
  - Improved focus management in `JobArea.vue` and `dropdownManager.ts`

### Technical Details
- **Focus Debugging**: Added extensive logging to track focus state changes across components
- **Event Handling**: Modified global click handlers to preserve focus for active job tables
- **Component Updates**: Enhanced `FileTable.vue`, `JobArea.vue`, and `dropdownManager.ts` with focus-aware behavior
- **Version Bump**: Incremented patch version from 0.1.5 to 0.1.6 in:
  - `src-tauri/Cargo.toml`
  - `app/components/TitleBar.vue`
  - `src-tauri/tauri.conf.json`

---

## [0.1.5] - 2025-08-14T10:47:00Z

### Added
- **Focus Indicator System**: Implemented comprehensive focus management for the file table
  - Added visual focus indicator with 1px border around the focused row
  - Added keyboard navigation support (Arrow Up/Down, Enter, Space) for file selection
  - Added focus initialization on refresh/load (focuses first selected file or first row)
  - Added hover states with dimmer background colors (15% opacity) for better visual distinction
  - Added focus persistence when deselecting files (maintains focus indicator)

### Fixed
- **File Table Behavior**: Fixed non-standard right-click behavior
  - Fixed selection clearing when right-clicking in empty areas (standard file manager behavior)
  - Fixed file table losing active status after context menu interactions
  - Fixed focus restoration after context menu closes
  - Fixed hover/selection visual distinction with proper color opacity levels

### Technical Details
- **Component Updates**: Modified `FileTable.vue`, `FileTableRow.vue`, and `JobArea.vue` to support focus management
- **State Management**: Added `focusedRowIndex` state to track currently focused row
- **Event Handling**: Implemented global keyboard event listeners for navigation
- **CSS Enhancements**: Added focus and hover styles using HSL/HSLA color format
- **Version Bump**: Incremented patch version from 0.1.4 to 0.1.5 in:
  - `src-tauri/Cargo.toml`
  - `app/components/TitleBar.vue`
  - `src-tauri/tauri.conf.json`

---


