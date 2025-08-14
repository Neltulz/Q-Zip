# Q-Zip Changelog

## [0.1.5] - 2024-12-19 16:47:00 UTC

### Added
- **Focus Indicator System**: Implemented comprehensive focus management for the file table
  - Added visual focus indicator with 1px border around the focused row
  - Added keyboard navigation support (Arrow Up/Down, Enter, Space) for file selection
  - Added focus initialization on refresh/load (focuses first selected file or first row)
  - Added hover states with dimmer background colors (15% opacity) for better visual distinction
  - Added focus persistence when deselecting files (maintains focus indicator)

### Fixed
- **File Table Behavior**: Fixed non-standard right-click behavior to match Directory Opus expectations
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

## [0.1.4] - 2024-12-19

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

## [0.1.3] - Previous Version
- Initial release and previous changes
