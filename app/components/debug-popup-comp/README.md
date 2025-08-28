# DebugPopup CSS Architecture

## Overview

The DebugPopup CSS has been split into multiple modular files for better organization, maintainability, and developer experience.

## File Structure

```
app/components/debug-popup-comp/
├── DebugPopup.base.css          # Main container and core layout
├── DebugPopup.header.css        # Header section and title styling
├── DebugPopup.navigation.css    # Tab navigation and button styling
├── DebugPopup.content.css       # Content areas (general, tooltips, logging)
├── DebugPopup.controls.css      # Form controls (options, switches, sliders)
├── DebugPopup.color.css         # Color picker and related components
├── DebugPopup.utilities.css     # Animations, transitions, hotzones
├── index.css                    # Master import file
└── README.md                    # This file
```

## Usage

### Individual Imports (Recommended)
Import specific modules in your Vue component:

```vue
<style scoped>
@import "./debug-popup-comp/DebugPopup.base.css";
@import "./debug-popup-comp/DebugPopup.header.css";
@import "./debug-popup-comp/DebugPopup.navigation.css";
@import "./debug-popup-comp/DebugPopup.content.css";
@import "./debug-popup-comp/DebugPopup.controls.css";
@import "./debug-popup-comp/DebugPopup.color.css";
@import "./debug-popup-comp/DebugPopup.utilities.css";
</style>
```

### Master Import (Alternative)
Use the index file for all modules at once:

```vue
<style scoped>
@import "./debug-popup-comp/index.css";
</style>
```

## Module Descriptions

### `DebugPopup.base.css`
- Main popup container styling
- Core layout structure (grid, positioning)
- Basic container elements

### `DebugPopup.header.css`
- Header section styling
- Title and icon
- Close button

### `DebugPopup.navigation.css`
- Tab navigation sidebar
- Tab buttons and states (hover, active)
- Navigation icons and text

### `DebugPopup.content.css`
- Content area layouts
- Empty states
- Scrollable content areas
- Footer sections

### `DebugPopup.controls.css`
- Form controls (USwitch, sliders)
- Option groups and labels
- Info icon styling
- Opacity controls

### `DebugPopup.color.css`
- Color picker components
- Color grid layouts
- Color format displays
- Border color controls

### `DebugPopup.utilities.css`
- Animation transitions
- Hotzone overlays
- Utility classes

## Benefits

✅ **Better Organization**: Related styles are grouped together
✅ **Easier Maintenance**: Find and modify specific functionality quickly
✅ **Improved Readability**: Smaller, focused files
✅ **Selective Loading**: Import only what you need
✅ **Team Collaboration**: Multiple developers can work on different modules
✅ **Git History**: Cleaner commit history for specific features

## Migration Guide

If you need to work with the old monolithic file:
- The original `DebugPopup.scoped.css` is still available
- All functionality remains identical
- New modular structure maintains the same CSS specificity

## Development Notes

- All CSS uses scoped styling with the `debug-` prefix
- CSS custom properties (variables) are used throughout
- Third-party component styling uses `:deep()` selectors
- Animations and transitions are isolated in utilities
