# Debug Popup Feature

## Overview
The debug popup is a secret development tool that provides debug options for testing and development. It can be accessed using a keyboard shortcut and contains various debug settings.

## Keyboard Shortcut
- **Shortcut**: `Ctrl + Alt + Shift + B`
- **Description**: Opens/closes the debug popup
- **Design**: Easy to press with left hand, unlikely to be pressed accidentally, avoids conflict with Nuxt's debug menu

## Features

### Draggable Debug Button
- **Purpose**: A floating button on the right side of the window that can be clicked to toggle the debug popup
- **Dragging**: Can be dragged vertically to reposition along the right edge
- **Position**: Automatically adjusts when the window is resized

### Draggable Debug Popup
- **Purpose**: The debug popup can be dragged around the screen by its title bar
- **Position**: Remembers its position between sessions
- **Constraints**: Stays within window bounds

### Prevent InfoTooltips from Closing
- **Purpose**: When enabled, tooltips will remain visible until this option is unchecked
- **Use Case**: Useful for debugging tooltip positioning, styling, and behavior
- **How it works**: 
  - Once a tooltip becomes visible, it will stay visible regardless of mouse movements
  - The tooltip will only close when this option is unchecked
  - Affects all InfoTooltip components throughout the application

## Implementation Details

### Files Created/Modified
1. **`app/stores/debugStore.ts`** - New Pinia store for debug state management with position tracking
2. **`app/components/DebugPopup.vue`** - Draggable debug popup component
3. **`app/components/DebugPopup.scoped.css`** - Enhanced styling for the debug popup
4. **`app/components/DebugButton.vue`** - Draggable debug button component
5. **`app/components/DebugButton.scoped.css`** - Styling for the debug button
6. **`app/app.vue`** - Added keyboard shortcut handler and debug components
7. **`app/components/InfoTooltip.vue`** - Modified to respect debug settings
8. **`app/composables/useTooltipManager.ts`** - Modified to respect debug settings

### Store Structure
```typescript
interface DebugOptions {
  preventTooltipClosing: boolean;
}

interface DebugPosition {
  x: number;
  y: number;
}

interface DebugStore {
  isDebugPopupVisible: boolean;
  debugPopupPosition: DebugPosition;
  debugButtonPosition: DebugPosition;
  debugOptions: DebugOptions;
  toggleDebugPopup(): void;
  updateDebugOption<K extends keyof DebugOptions>(key: K, value: DebugOptions[K]): void;
  updateDebugPopupPosition(position: DebugPosition): void;
  updateDebugButtonPosition(position: DebugPosition): void;
  resetDebugOptions(): void;
}
```

### Persistence
The debug store uses Pinia's persistence plugin, so debug options will be remembered between application sessions.

## Usage Instructions

1. **Open Debug Popup**: 
   - Press `Ctrl + Alt + Shift + B`, or
   - Click the debug button on the right side of the window
2. **Move Debug Button**: Drag the debug button vertically to reposition it
3. **Move Debug Popup**: Drag the popup by its title bar to move it anywhere on screen
4. **Enable Tooltip Debug**: Check "Prevent InfoTooltips from Closing"
5. **Test Tooltips**: Hover over any element with a tooltip - it will stay visible
6. **Disable Debug**: Uncheck the option or close the popup
7. **Reset Options**: Click "Reset All Options" to restore defaults

## Technical Notes

- The debug popup and button positions are remembered between sessions
- The debug button stays fixed to the right side of the window and adjusts on resize
- The debug popup can be dragged anywhere within the window bounds
- Uses CSS transitions for smooth show/hide animations
- Enhanced backdrop blur and border styling for better visibility
- Respects the application's theme and styling
- Debug options are applied globally across all tooltips
- The feature is designed to be unobtrusive and only visible when needed
