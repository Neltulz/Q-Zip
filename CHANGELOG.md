# Q-Zip Changelog

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
