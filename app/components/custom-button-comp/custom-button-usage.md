# CustomButton Usage Guide

## Overview

The `CustomButton` component is a reusable button component with optional icons, customizable via props. It uses a `.visual-style` div as its visual container for styling.

## Basic Usage

```vue
<CustomButton
  btn-theme="default"
  button-style-class="trans-btn"
  data-name="my-button"
  first-icon-name="mdi:star"
  :first-icon-size="20"
  @click="handleClick"
>
  Button Text
</CustomButton>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `btnTheme` | `"default" \| "lite" \| "liter" \| "dark" \| "darkr" \| "primary" \| "danger" \| "warning" \| "info"` | `"default"` | Theme for button styling |
| `buttonStyleClass` | `string` | `""` | Additional CSS classes |
| `dataName` | `string` | **required** | Unique identifier for the button |
| `firstIconName` | `string` | `""` | Icon name for the first icon (left side) |
| `firstIconSize` | `string \| number` | `20` | Size of the first icon |
| `justify` | `"auto" \| "start" \| "center" \| "end" \| "stretch"` | `"auto"` | Content justification |
| `lastIconName` | `string` | `""` | Icon name for the last icon (right side) |
| `lastIconSize` | `string \| number` | `20` | Size of the last icon |
| `shortcutText` | `string` | `""` | Keyboard shortcut text to display |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `click` | `MouseEvent` | Fired when button is clicked |
| `contextmenu` | `MouseEvent` | Fired on right-click |
| `dragover` | `DragEvent` | Fired on drag over |
| `dragleave` | `DragEvent` | Fired on drag leave |
| `drop` | `DragEvent` | Fired on drop |
| `mouseenter` | `MouseEvent` | Fired on mouse enter |
| `mouseleave` | `MouseEvent` | Fired on mouse leave |

## Component Structure

The CustomButton component has the following internal structure:

```html
<button class="custom-button" data-name="...">
  <div class="visual-style"></div>           <!-- Visual container -->
  <div class="icon-placeholder first-icon">  <!-- First icon -->
    <Icon name="..." />
  </div>
  <div class="button-content">               <!-- Button text -->
    <slot />
  </div>
  <div class="shortcut-text">                <!-- Shortcut text -->
    {{ shortcutText }}
  </div>
  <div class="icon-placeholder last-icon">   <!-- Last icon -->
    <Icon name="..." />
  </div>
</button>
```

## Visual Style Div

**IMPORTANT**: The `.visual-style` div is the primary visual container that should receive all styling for:
- Background colors
- Borders
- Box shadows
- Border radius
- Transitions

### Styling the Visual Style Div

When creating custom styles for CustomButton, always target the `.visual-style` div:

```css
/* ❌ WRONG - Don't style the button directly */
.my-custom-button {
  background-color: red;
  border: 1px solid blue;
}

/* ✅ CORRECT - Style the visual-style div */
.my-custom-button > .visual-style {
  background-color: red;
  border: 1px solid blue;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

/* ✅ CORRECT - Hover states */
.my-custom-button:hover > .visual-style {
  background-color: darkred;
  border-color: darkblue;
}
```

### Example: Window Control Buttons

```css
.window-control-btn > .visual-style {
  border: none !important;
  box-shadow: none !important;
  background-color: transparent;
  transition: background-color 0.2s ease;
}

.window-control-btn:hover > .visual-style {
  background-color: var(--bg-clr-lite);
}

.window-control-btn[data-name="custom-close-btn"]:hover > .visual-style {
  background-color: hsl(0, 65%, 55%);
}
```

## Themes

The component supports several built-in themes:

- `default` - Standard button styling
- `lite` - Light theme variant
- `liter` - Lighter theme variant
- `dark` - Dark theme variant
- `darkr` - Darker theme variant
- `primary` - Primary action styling
- `danger` - Destructive action styling
- `warning` - Warning action styling
- `info` - Informational action styling

## Button Style Classes

Common button style classes:

- `trans-btn` - Transparent button
- `bordered-btn` - Button with borders
- `minimal-trans-btn` - Minimal transparent button

## Exposed Refs

The component exposes the following refs:

```typescript
const buttonRef = ref<HTMLElement | null>(null);
const visualStyleRef = ref<HTMLElement | null>(null);
```

You can access these via template refs:

```vue
<CustomButton ref="myButton" data-name="example" />
```

```typescript
// Access the button element
const buttonElement = myButton.value?.buttonRef;

// Access the visual style element
const visualStyleElement = myButton.value?.visualStyleRef;
```

## Best Practices

1. **Always use `data-name`** - This is required for proper identification and debugging
2. **Style the `.visual-style` div** - Don't apply visual styles directly to the button
3. **Use CSS variables** - Leverage the global CSS variables for consistent theming
4. **Handle hover states properly** - Use `:hover > .visual-style` selectors
5. **Use `!important` sparingly** - Only when you need to override built-in styles
6. **Test accessibility** - Ensure buttons are keyboard accessible and have proper ARIA labels

## Common Patterns

### Icon-only Button
```vue
<CustomButton
  data-name="icon-only-btn"
  first-icon-name="mdi:star"
  :first-icon-size="24"
  button-style-class="trans-btn"
/>
```

### Button with Text and Icon
```vue
<CustomButton
  data-name="text-icon-btn"
  first-icon-name="mdi:download"
  :first-icon-size="20"
  btn-theme="primary"
>
  Download File
</CustomButton>
```

### Button with Shortcut
```vue
<CustomButton
  data-name="shortcut-btn"
  first-icon-name="mdi:save"
  :first-icon-size="20"
  shortcut-text="Ctrl+S"
  btn-theme="primary"
>
  Save
</CustomButton>
```

### Custom Styled Button
```vue
<CustomButton
  data-name="custom-styled-btn"
  button-style-class="my-custom-button"
>
  Custom Button
</CustomButton>
```

```css
.my-custom-button > .visual-style {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  border-radius: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.my-custom-button:hover > .visual-style {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}
```
