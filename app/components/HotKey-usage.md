# HotKey Component Usage

The `HotKey` component displays keyboard shortcuts with proper styling, including the keyboard icon and keycaps.

## Props

- `keys: string[]` - Array of key names to display (required)
- `showIcon: boolean` - Whether to show the keyboard icon (default: `true`)
- `size: 'small' | 'medium' | 'large'` - Size variant (default: `'medium'`)
- `disabled: boolean` - Whether to show the shortcut in a disabled/dimmed state (default: `false`)

## Examples

### Basic Usage

```vue
<!-- Single key -->
<HotKey :keys="['ESC']" />

<!-- Multiple keys with + separator -->
<HotKey :keys="['CTRL', 'C']" />

<!-- Complex shortcut -->
<HotKey :keys="['CTRL', 'SHIFT', 'DEL']" />
```

### Size Variants

```vue
<!-- Small size -->
<HotKey :keys="['ESC']" size="small" />

<!-- Medium size (default) -->
<HotKey :keys="['CTRL', 'C']" size="medium" />

<!-- Large size -->
<HotKey :keys="['CTRL', 'SHIFT', 'DEL']" size="large" />
```

### Disabled State

```vue
<!-- Normal state -->
<HotKey :keys="['CTRL', 'C']" />

<!-- Disabled/dimmed state -->
<HotKey :keys="['CTRL', 'C']" :disabled="true" />
```

### Without Icon

```vue
<!-- Hide the keyboard icon -->
<HotKey :keys="['CTRL', 'C']" :show-icon="false" />
```

## Key Normalization

The component automatically normalizes common key variations:

- `CONTROL` → `CTRL`
- `COMMAND` → `CMD`
- `WINDOWS` → `WIN`
- `RETURN` → `ENTER`
- `ESCAPE` → `ESC`
- `DELETE` → `DEL`
- `ARROW_UP` → `↑`
- `ARROW_DOWN` → `↓`
- `ARROW_LEFT` → `←`
- `ARROW_RIGHT` → `→`
- `PAGE_UP` → `PAGE UP`
- `PAGE_DOWN` → `PAGE DOWN`

## Styling

The component uses the same styling as the original InfoTooltip keyboard shortcuts:
- Blue keycaps with white text
- Monospace font for consistent key width
- Proper spacing and alignment
- Responsive sizing variants
- Disabled state with dimmed colors and reduced opacity

## Integration with InfoTooltip

The HotKey component is now used within InfoTooltip for displaying keyboard shortcuts, replacing the previous inline HTML implementation.
