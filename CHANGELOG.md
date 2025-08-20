# Q-Zip Changelog

> **Note:** This changelog maintains only the most recent 20 versions for readability and performance. Older versions are archived when new versions are added.

## Recent Changes

## [0.1.23] - 2025-01-27T23:00:00Z

### Fixed
- *Development work in progress...*

### Added
- **Enhanced Debug Popup**: Significantly improved the debug popup with comprehensive logging controls
  - Debug popup now hidden by default for cleaner development experience
  - Added new "Logging" tab with granular control over all debug logging options
  - Organized logging options into logical sections: Component & Lifecycle, User Interactions, UI & Components, File Operations, System & Management, and Development & Warnings
  - Added support for all debug logging flags from debugConfig.ts including component mounts, ref updates, clicks/inputs, store actions, dropdown events, UI events, drag & drop, composable manager events, missing prop warnings, file selection, notifications, loading events, dual progress, rendering events, UI interactivity, component attributes, Vue warnings, keyboard events, hover events, and tooltip events
  - Added "Check All" and "Uncheck All" buttons for quick logging configuration
  - Implemented responsive CSS grid layout for better space utilization and organization
  - Added proper synchronization between debug store and debugConfig.ts
  - Enhanced CSS styling with organized sections and improved visual hierarchy
  - Added helper functions for resetting and syncing debug configuration
  - Cleaned up debug features from InfoTooltips (removed yellow glow and permanent visibility)
  - Removed "Enable All Logging" checkbox from General tab (now blank for future use)
  - Maintained existing InfoTooltips and General tabs for backward compatibility
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

---

## [0.1.22] - 2025-01-27T23:00:00Z

### Changed
- Incremented version to v0.1.22 (release version)
  - Updated version in `src-tauri/Cargo.toml` to `0.1.22`
  - Updated version in `src-tauri/tauri.conf.json` to `0.1.22`
  - Updated version display in `app/components/TitleBar.vue` to `v0.1.22`
- Incremented version to v0.1.23-dev (development version)
  - Updated version in `src-tauri/Cargo.toml` to `0.1.23-dev`
  - Updated version in `src-tauri/tauri.conf.json` to `0.1.23-dev`
  - Updated version display in `app/components/TitleBar.vue` to `v0.1.23-dev`

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

---

## [0.1.21] - 2025-01-27T23:00:00Z

### Fixed
- **CRITICAL**: Fixed cancellation behavior to properly rollback all files added during cancelled operations
  - When cancelling folder addition operations, all files that were processed and added during the operation are now removed
  - This ensures that cancelled operations leave the file table in the same state as before the operation started
  - Applies to both single folder and multiple folder addition operations
  - Previously, files added before cancellation would remain in the file table, which was confusing for users

### Added
- **NEW**: Added conditional rollback option for cancelled operations
  - Users can now choose whether to keep or remove already scanned items when cancelling
  - Added checkbox in cancel confirmation dialog: "Remove already scanned items" (checked by default)
  - When unchecked, users can keep the folders that were successfully processed while abandoning the problematic ones
  - Maintains backward compatibility - default behavior remains the same (removes all scanned items)
  - Provides flexibility for users who want to keep their progress when only some folders are problematic

### Changed
- Incremented version to v0.1.21
- Enhanced progress information layout with proper spacing and alignment
- Better visual hierarchy in loading overlay with consistent text sizing
- Fixed dual progress bar logic to only show overall progress when processing multiple folders
- Corrected single folder processing to show only current file progress without overall progress bar
- Updated JobArea to use addMultipleFoldersToJob when processing multiple folders for proper dual progress tracking
- Fixed dual progress tracking to show completed folders instead of current folder (e.g., 9/10 instead of 10/10 when processing last folder)
- Fixed individual progress tracking to show last completed item instead of current item (e.g., 269/2699 instead of 270/2699)
- Fixed overall progress initialization to start at 0 instead of defaulting to total folders count
- Fixed FileTable refresh loading to properly display dual progress bars with overall and current progress tracking
- Fixed multiple folder addition to properly preserve overall progress values and show dual progress bars
- Added detailed dual progress tracking logging to diagnose multiple folder progress bar issues
- Reduced log flooding by limiting progress logging to every 100 items instead of every 10
- Fixed dual progress bar visibility issue in FileTableLoadingOverlay component
- Reduced excessive logging to focus on essential dual progress debugging information
- Fixed addFilesToJob to not override progress callback when called from addMultipleFoldersToJob
- Fixed overall progress tracking to properly maintain folder count when processing individual folders within multiple folder operations
- Fixed progressCallback to preserve existing overall progress values when undefined parameters are passed (prevents resetting to 0)
- Fixed addFilesToJob to properly detect multiple folders context and preserve overall progress during individual folder processing

### Technical Details
- Added progress wrapper container for better layout control
- Implemented CSS transitions for smooth state changes
- Enhanced pause state visual feedback with opacity and color changes
- Standardized all animation container heights to 68px for consistent visual proportions
- Implemented CSS variable for animation height to improve maintainability
- Optimized pause icon size to 48px for better visual balance within 68px container
- Enhanced progress callback system to support dual progress tracking
- Updated file utilities to provide both current and overall progress information
- Centralized progress state management in jobsStore for consistent tracking
- **NEW**: Implemented comprehensive rollback mechanism for cancelled operations
  - Tracks all files added during an operation for potential rollback
  - Removes all added files when cancellation occurs, ensuring clean state
  - Applies to both single and multiple folder processing operations
  - Returns 0 for cancelled operations to indicate no files were successfully added
- **NEW**: Added conditional rollback with user preference
  - Users can choose to keep scanned items when cancelling via checkbox in cancel dialog
  - Default behavior maintains backward compatibility (removes all scanned items)
  - Conditional rollback logic respects user preference for keeping or removing files
  - Enhanced logging to track whether files are kept or removed based on user choice

---

## [0.1.20] - 2025-01-27T23:00:00Z

### Changed
- Moved FileTableLoadingOverlay component to file-table-comp directory for better organization
- Enhanced pause functionality in FileTableLoadingOverlay with immediate response and smooth fade transitions
- Updated import paths to reflect new component location

### Added
- Smooth fade transitions between loading animation and pause icon in FileTableLoadingOverlay
- Pause icon display when loading is paused using Nuxt Icon component
- Comprehensive logging for pause/cancel timing and functionality debugging
- Pause/resume functionality for refresh operations in FileTable
- Progress tracking and timing measurements for all loading operations
- Enhanced refresh functionality with step-by-step progress information (validation, sorting, display update, finalization)
- Advanced pause detection logging to track when progress updates actually stop after pause is clicked
- Progress update blocking during pause state to prevent continued UI updates
- Direct console logging to bypass debug system for pause functionality troubleshooting
- Enabled logLoadingEvents in debug configuration for better visibility
- Improved pause responsiveness for file scanning operations (check every 2 items instead of 5)
- Enhanced logging for jobsStore pause/resume operations to track file processing delays
- Additional debugging to track jobsStore state and function calls for pause functionality
- Enhanced pause check logging to identify why pause detection is delayed in file processing loop
- **CRITICAL FIX**: Changed pause check frequency from every 2 items to every single item for immediate pause responsiveness
- **CRITICAL FIX**: Enhanced pause responsiveness in folder scanning (getDirectoryContents) - now checks every 10 items instead of every 200+ items for large folders
- Reduced pause detection log frequency to prevent console flooding while maintaining pause functionality
- Enhanced FileTableLoadingOverlay UI with responsive design improvements:
  - Set max-width (320px) for loading container (removed min-width constraint)
  - Restored original loading animation height with pause icon matching (80px height)
  - Improved transition performance by keeping elements in DOM with opacity changes instead of removal
  - Added pause state visual feedback: dimmed progress elements, changed text to "Paused" and "Click 'Resume' to continue..."
  - Enhanced pause icon with circular background (light background, dark icon) for better visual contrast
  - Added text overflow with ellipsis for all text elements (scanning item, progress count, loading message)
  - Implemented responsive button stacking for thin containers
  - Removed chevron icon from cancel button dropdown

### Fixed
- *Development work in progress...*

### Technical Details
- *Development work in progress...*

---

## [0.1.19] - 2025-01-27T23:00:00Z

### Changed
- Enhanced CSS styles across various components, including tooltips, job area, and title bar, for improved layout and maintainability.
- Added comments for clarity and organization in CSS files, ensuring better readability and structure.
- Updated LoadingAnim component CSS to use logical properties, proper nesting, and detailed comments for better maintainability.

### Added
- Enhanced LoadingAnim component to support multiple animation types via `animationType` prop:
  - `'full'` (default): Complete loading animation with progress tracking, pause/resume, and cancel functionality
  - `'spinner'`: Simple three-dot bouncing animation for lightweight loading states
  - `'double-bounce'`: Two-circle bouncing animation for medium-weight loading states
- Both animations maintain proper attribution to Tobias Ahlin's SpinKit library
- Refactored LoadingAnim component architecture:
  - Created `CircleLoadingAnim.vue` for full-featured loading with progress and controls
  - Created `SpinnerLoadingAnim.vue` for simple three-dot animation
  - Created `DoubleBounceLoadingAnim.vue` for two-circle bouncing animation
  - Main `LoadingAnim.vue` now acts as a master component that delegates to specific animation types
  - Improved code organization and maintainability through component separation
- Enhanced FileTable refresh functionality:
  - Refresh button now shows DoubleBounceLoadingAnim animation when clicked
  - 5-second loading state with cancel functionality
  - Full-screen loading overlay with circular animation, progress tracking, and pause/cancel buttons during refresh
  - Improved user feedback during file refresh operations
- Refactored loading animation architecture for better separation of concerns:
  - Created `FileTableLoadingOverlay.vue` for full-featured loading UI with progress, buttons, and controls
  - Simplified `CircleLoadingAnim.vue` to contain only the circular animation (no UI logic)
  - Maintained `DoubleBounceLoadingAnim.vue` and `SpinnerLoadingAnim.vue` as pure animation components
  - Updated `LoadingAnim.vue` master component to use the new overlay architecture

### Fixed
- *Development work in progress...*

### Technical Details
- FileTable refresh implementation:
  - Added `isRefreshing` reactive state to track refresh loading
  - Implemented 5-second timeout with cleanup in `onUnmounted`
  - Added `cancelRefresh` function for user cancellation
  - Modified FileTableToolbar to show DoubleBounceLoadingAnim in refresh button
  - Added proper CSS styling for scaled-down animation in button context
  - Maintained existing refresh functionality while adding visual feedback
- Loading animation architecture refactoring:
  - Separated UI logic from animation components for better maintainability
  - Created reusable `FileTableLoadingOverlay.vue` component for full-featured loading experiences
  - Simplified animation components to focus solely on visual animations
  - Maintained backward compatibility with existing loading implementations

---

## [0.1.18] - 2025-01-27T23:00:00Z

### Changed
- **Tooltip Functionality**: Enhanced tooltip functionality and logging across components for improved debugging and user interaction tracking
- **CSS Organization**: Refined CSS styles for tooltips and buttons, including relocation of tooltip styles to dedicated CSS files for better organization

### Added
- **Detailed Hover and Tooltip Logging**: Integrated comprehensive logging in CustomButton, DropdownMenu, and InfoTooltip components to track user interactions and improve debugging capabilities
- **Enhanced Mouse Event Handlers**: Updated mouse event handlers in JobSelectorArea to manage tooltip visibility more effectively, ensuring tooltips remain visible when interacting with related elements

### Fixed
- *Development work in progress...*

### Technical Details
- **Version Update**: Incremented version number to 0.1.18 in configuration files to reflect ongoing development

---

## [0.1.17] - 2025-01-27T22:00:00Z

### Changed
- *Development work in progress...*`

### Added
- *Development work in progress...*

### Fixed
- **Vue Attribute Inheritance Warning**: Fixed "extraneous non-props attributes" warning by correcting prop name from `keyboard-shortcut` to `keyboardShortcut` in InfoTooltip component usage
- **TypeScript Errors**: Fixed type errors in InfoTooltip component by properly casting content to NotificationMessageDetails type and adding optional chaining for undefined properties
- **Icon Import Issue**: Removed explicit Icon import from InfoTooltip component since Nuxt Icons are auto-imported
- **Tooltip Positioning Issue**: Fixed tooltips appearing in top-left corner instead of below buttons by implementing job-specific refs for confirmation buttons and proper tooltip state management
- **Tooltip Keyboard Shortcut Styling**: Improved keyboard shortcut display in tooltips by capitalizing text, removing backdrop blur glow effect, and ensuring proper blue color application
- **Code Style Guidelines**: Added CSS specificity rules preferring greater specificity over `!important` and using `:deep()` for sub-component styling
- **Keyboard Event Logging**: Added comprehensive keyboard logging system that tracks key combinations while filtering modifier-only presses and preventing log flooding from held keys
- **Debugging Enhancements**: Added temporary debugging logs to investigate keyboard event handling and Enter key functionality in dropdown menus
- **Keyboard Logger Fixes**: Fixed keyboard logging to only log meaningful combinations (not standalone modifier keys) and prevent log flooding from held keys
- **Enter Key Functionality**: Fixed Enter key not working in remove job dropdown by adding missing event handler binding
- **Keyboard Logger Improvements**: Enhanced keyboard logging to completely eliminate individual modifier key logging and prevent log flooding from held modifier keys
- **Tooltip Consistency**: Fixed Remove Job tooltip to use proper keyboard shortcut formatting with icon and separate line display
- **Tooltip Alignment**: Changed tooltip text alignment from centered to left-justified for better readability
- **Job Navigation Shortcuts**: Added browser-style keyboard shortcuts for job tab navigation: Ctrl+Tab (next job), Ctrl+Shift+Tab (previous job), and Ctrl+1-9 (jump to specific job)
- **Job Switch Delay**: Added 150ms delay between job switches via Ctrl+Tab to prevent accidental rapid cycling

### Technical Details
- *Development work in progress...*

---

## [0.1.16] - 2025-01-27T21:00:00Z

### Changed
- **CustomButton Component**: Enhanced with integrated tooltip support using InfoTooltip component for consistent tooltip behavior across the application

### Added
- **CustomButton Tooltip Integration**: Added built-in tooltip functionality to CustomButton component with props for `showTooltip`, `tooltipText`, and `tooltipPlacement`
- **Keyboard Shortcut Tooltips**: CustomButton now automatically displays keyboard shortcuts in tooltips when `shortcutText` prop is provided and `showTooltip` is enabled
- **Enhanced Job Selector UX**: Remove Job and Cancel buttons in job confirmation dropdowns now display their keyboard shortcuts (Esc, Shift+Del) in tooltips
- **DropdownMenu ESC Key Support**: Added automatic ESC key handling to close any open dropdown menu and backdrop
- **Tooltip Icon Support**: Added keyboard icon display in tooltips when showing keyboard shortcuts, enhancing visual clarity
- **Tooltip Template Priority**: Fixed template condition ordering to ensure icon tooltips are displayed correctly over legacy shortcut parsing
- **SHIFT+Click Job Removal**: Added ability to bypass confirmation dialog by holding SHIFT while clicking the remove job button, providing quick job removal functionality
- **SHIFT+Del Hotkey Behavior**: Modified SHIFT+Del to open the remove job confirmation dropdown for the currently selected job instead of bypassing confirmation, preventing accidental job deletion
- **CTRL+SHIFT+Del Force Delete**: Added new hotkey for force removing the currently selected job without confirmation, providing quick deletion for power users
- **Last Job Protection**: Modified behavior when only one job remains - instead of preventing removal, SHIFT+Click and CTRL+SHIFT+Del now clear the job (remove all files and reset settings) while keeping the job structure intact
- **Job Clearing Functionality**: Added `clearJob` method to jobsStore for clearing all files and resetting job-specific settings while preserving the job structure
- **DropdownMenu Enter Key Support**: Added Enter key handling to DropdownMenu component to trigger the default action button (e.g., "Remove Job" button) when the dropdown is active, with enhanced debugging and improved button detection logic
- **DropdownMenu Custom Event Emission**: Modified DropdownMenu to emit `action-button-activated` events instead of programmatic clicks to bypass dropdownManager interception, enabling proper Enter key functionality
- **JobSelectorArea Event Handling**: Added `handleActionButtonActivated` function to JobSelectorArea to process custom events from DropdownMenu and handle job removal/clearing logic appropriately
- **DropdownMenu Custom Click Handler**: Enhanced DropdownMenu component with `onButtonClick` prop to support custom click handling while maintaining dropdown functionality

### Fixed
- **Tooltip Z-Index Layering**: Fixed InfoTooltip appearing behind dropdown menus by increasing z-index to 100002 (above dropdown z-index of 100001)
- **Duplicate Keyboard Shortcuts**: Fixed CustomButton showing keyboard shortcuts both in button text and tooltip - now only shows in tooltip when `showTooltip` is enabled
- **InfoTooltip Min-Width**: Updated InfoTooltip to use `var(--min-tch-tgt)` for consistent minimum touch target sizing
- **Button Flex-Grow Issue**: Fixed Remove Job and Cancel buttons growing to fill available space using `:deep()` selector for proper specificity without `!important` declarations
- **TypeScript Error in JobSelectorArea**: Fixed type error where `buttonData.dataName` (string | undefined) was being used in template literals without proper null coalescing
- **Vue Component Emits**: Added proper emits declaration to CustomButton component to resolve Vue warnings about non-emits event listeners (click, contextmenu, dragover, dragleave, drop, mouseenter, mouseleave)
- **Enhanced Debugging**: Added comprehensive logging for component attribute inheritance issues and Vue warnings to help diagnose attribute binding problems
- **Vue Warning Interception**: Created plugin to intercept and log Vue warnings about non-props attributes and non-emits event listeners
- **Vue Watch Source Warning**: Fixed CustomButton component Vue warnings about invalid watch sources by wrapping `attrs` in a getter function for proper reactive watching
- **Vue Attribute Inheritance Warning**: Fixed CustomButton component Vue warnings about extraneous non-props attributes by wrapping template in a single root element with `display: contents` to maintain layout while enabling proper attribute inheritance

### Technical Details
- **Version Update**: Incremented patch version from 0.1.15 to 0.1.16
  - Updated version display in `app/components/TitleBar.vue` to `v0.1.16`
  - Updated version in `src-tauri/Cargo.toml` to `0.1.16`
  - Updated version in `src-tauri/tauri.conf.json` to `0.1.16`

---

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




