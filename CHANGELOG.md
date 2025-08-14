# Q-Zip Changelog

> **Note:** This changelog maintains only the most recent 20 versions for readability and performance. Older versions are archived when new versions are added.

## Recent Changes

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

## [0.1.4] - 2025-08-14T09:00:00Z

### Fixed
- **TypeScript Errors**: Fixed multiple TypeScript compilation errors across the codebase
  - Fixed `MaybeElement` type compatibility issue in `TitleBar.vue` by casting `mainMenuTooltipTarget` as `any`
  - Fixed boolean type mismatch in `TitleBar.vue` by ensuring `debugForceVisible` prop receives proper boolean value
  - Fixed method name errors in `FileTableContextMenu.vue` by updating `moveFile` → `moveFileFromContext` and `copyFile` → `copyFileFromContext`

### Added
- **AI Instruction Comments**: Added important AI instruction comments to all CSS files in the project
  - Added `IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file.` comment to:
    - `app/assets/css/styles.css`
    - `app/assets/css/overlay-scrollbar.css`
    - `app/components/job-area-comp/job-area.scoped.css`
    - `app/components/title-bar-comp/title-bar.scoped.css`
    - `app/components/file-table-comp/file-table.scoped.css`
    - `app/components/custom-button-comp/custom-button.global.css`
    - `app/components/custom-button-comp/custom-button.scoped.css`
    - `app/components/job-selector-area-comp/job-selector-area.scoped.css`
    - `app/components/custom-field-comp/custom-field.scoped.css`
    - `app/components/compression-section-comp/compression-section.scoped.css`

### Removed
- **Development Files**: Removed unused development utility file
  - Deleted `app/utils/testLogging.js` as it was no longer needed and not referenced anywhere in the codebase

### Technical Details
- **Version Bump**: Incremented patch version from 0.1.3 to 0.1.4 in:
  - `src-tauri/Cargo.toml`
  - `app/components/TitleBar.vue`
  - `src-tauri/tauri.conf.json`

---


