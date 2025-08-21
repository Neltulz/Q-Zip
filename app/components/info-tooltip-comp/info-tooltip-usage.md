# InfoTooltip Usage Guidelines (Comprehensive)

This workflow ensures consistent and proper implementation of InfoTooltip components across the Q-Zip application.

## Standard Pattern for Button Tooltips

### Required Setup
When adding tooltips to buttons or interactive elements, follow these steps in order:

#### 1. Import Required Dependencies
```typescript
import { useTooltipManager } from "@/composables/useTooltipManager";
import InfoTooltip from "@/components/InfoTooltip.vue";
```

#### 2. Initialize Tooltip Manager
```typescript
const tooltipManager = useTooltipManager();
```

#### 3. Create Mouse Event Handlers
```typescript
const handleButtonMouseEnter = () => {
  tooltipManager.showTooltip('unique-tooltip-id');
};

const handleButtonMouseLeave = () => {
  tooltipManager.hideTooltip();
};
```

#### 4. Add Event Listeners to Target Element
```vue
<CustomButton
  ref="buttonRef"
  @mouseenter="handleButtonMouseEnter"
  @mouseleave="handleButtonMouseLeave"
/>
```

#### 5. Use Proper Target References
- **For CustomButton components:** Use `buttonRef?.visualStyleRef`
- **For DropdownMenu components:** Use `dropdownRef?.$el`
- **For regular HTML elements:** Use the element directly

#### 6. Add InfoTooltip Component
```vue
<InfoTooltip
  :visible="tooltipManager.activeTooltipId.value === 'unique-tooltip-id'"
  :content="{ text: 'Tooltip description text' }"
  :target="buttonRef?.visualStyleRef"
  placement="top"
  keyboardShortcut="Ctrl+S"
/>
```

## Implementation Examples

### CustomButton Tooltip
```vue
<template>
  <div class="button-wrapper">
    <CustomButton
      ref="myButtonRef"
      button-style-class="trans-btn"
      @mouseenter="handleMyButtonMouseEnter"
      @mouseleave="handleMyButtonMouseLeave"
    >
      My Button
    </CustomButton>
    
    <InfoTooltip
      :visible="tooltipManager.activeTooltipId.value === 'my-button-tooltip'"
      :content="{ text: 'This is my button tooltip' }"
      :target="myButtonRef?.visualStyleRef"
      placement="top"
      keyboardShortcut="Ctrl+B"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTooltipManager } from "@/composables/useTooltipManager";
import CustomButton from "@/components/CustomButton.vue";
import InfoTooltip from "@/components/InfoTooltip.vue";

const tooltipManager = useTooltipManager();
const myButtonRef = ref<any | null>(null);

const handleMyButtonMouseEnter = () => {
  tooltipManager.showTooltip('my-button-tooltip');
};

const handleMyButtonMouseLeave = () => {
  tooltipManager.hideTooltip();
};
</script>
```

### DropdownMenu Tooltip
```vue
<template>
  <div class="dropdown-wrapper">
    <DropdownMenu
      ref="myDropdownRef"
      button-style-class="trans-btn"
      @mouseenter="handleMyDropdownMouseEnter"
      @mouseleave="handleMyDropdownMouseLeave"
      @dropdown-opened="handleMyDropdownOpened"
    >
      <template #button-content>My Dropdown</template>
    </DropdownMenu>
    
    <InfoTooltip
      :visible="tooltipManager.activeTooltipId.value === 'my-dropdown-tooltip'"
      :content="{ text: 'This is my dropdown tooltip' }"
      :target="myDropdownRef?.$el"
      placement="top"
      keyboardShortcut="Ctrl+D"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTooltipManager } from "@/composables/useTooltipManager";
import DropdownMenu from "@/components/DropdownMenu.vue";
import InfoTooltip from "@/components/InfoTooltip.vue";

const tooltipManager = useTooltipManager();
const myDropdownRef = ref<any | null>(null);

const handleMyDropdownMouseEnter = () => {
  tooltipManager.showTooltip('my-dropdown-tooltip');
};

const handleMyDropdownMouseLeave = () => {
  tooltipManager.hideTooltip();
};

// IMPORTANT: Always include this handler to hide tooltip when dropdown opens
const handleMyDropdownOpened = () => {
  tooltipManager.hideTooltipImmediately(); // Use immediate hide to prevent delay
};
</script>
```

## Best Practices

### Tooltip ID Naming Convention
- Use descriptive, unique IDs that include the component name and purpose
- Examples: `'add-files-dropdown'`, `'refresh-files-btn'`, `'remove-selected-files-btn'`

### Placement Guidelines
- **Default placement:** Use `"top"` for most buttons and controls
- **Alternative placements:** Use `"bottom"`, `"left"`, or `"right"` when space constraints require it
- **Dropdown menus:** Use `"top"` to avoid conflicts with dropdown content

### Keyboard Shortcuts
- Include relevant keyboard shortcuts when available
- Use standard shortcut notation: `"Ctrl+S"`, `"F5"`, `"Del"`, `"Ctrl+Shift+C"`
- Make shortcuts uppercase in the tooltip: `keyboardShortcut="Ctrl+S"`

### Content Guidelines
- Keep tooltip text concise and descriptive
- Use action-oriented language when appropriate
- Include context about what the button/dropdown does

## Common Pitfalls to Avoid

### ❌ Don't Use Local State
```typescript
// WRONG - Don't use local refs for tooltip visibility
const tooltipVisible = ref(false);

const showTooltip = () => {
  tooltipVisible.value = true;
};
```

### ❌ Don't Use Wrong Target References
```vue
<!-- WRONG - Don't use the component ref directly -->
<InfoTooltip
  :target="buttonRef"
  ...
/>
```

### ✅ Use TooltipManager Pattern
```typescript
// CORRECT - Use tooltipManager for visibility control
const tooltipManager = useTooltipManager();

const handleMouseEnter = () => {
  tooltipManager.showTooltip('unique-id');
};
```

## Reference Implementations

For complete working examples, see:
- **JobSelectorArea.vue** - Job tab tooltips with remove confirmation
- **FileTableToolbar.vue** - Toolbar button tooltips with keyboard shortcuts
- **TitleBar.vue** - Simple button tooltips

## Component Selection

- **Use InfoTooltip.vue** for most standard tooltip needs
- **Use InfoTooltipContainer.vue** when you need additional customization options (maxWidth, custom classes, etc.)

## Disabled Button Tooltips

### Automatic Dimming Behavior
InfoTooltip automatically detects when the target element is disabled and applies visual dimming:

- **Automatic Detection:** Tooltips detect disabled state through:
  - `disabled` attribute on the target element
  - `disabled` class on the target element  
  - `disabled` property on HTMLButtonElement
  - Parent disabled elements (e.g., disabled button containing the target)

- **Visual Effects:** When a target is disabled, tooltips automatically:
  - Reduce opacity to 60% (vs 100% for normal tooltips)
  - Use more transparent background
  - Apply darker text color
  - Dim the arrow and icons

### Implementation Notes
- **No Additional Setup Required:** Disabled button detection is automatic
- **Tooltips Still Work:** Disabled buttons can still show tooltips (useful for explaining why they're disabled)
- **Consistent UX:** All disabled buttons across the application will have dimmed tooltips

### Example: Disabled Button Tooltip
```vue
<template>
  <div class="button-wrapper">
    <CustomButton
      ref="disabledButtonRef"
      :disabled="isButtonDisabled"
      @mouseenter="handleDisabledButtonMouseEnter"
      @mouseleave="handleDisabledButtonMouseLeave"
    >
      Disabled Button
    </CustomButton>
    
    <InfoTooltip
      :visible="tooltipManager.activeTooltipId.value === 'disabled-button-tooltip'"
      :content="{ text: 'This button is disabled because no items are selected' }"
      :target="disabledButtonRef?.visualStyleRef"
      placement="top"
    />
  </div>
</template>
```

**Result:** When `isButtonDisabled` is `true`, the tooltip will automatically appear dimmed, providing clear visual feedback that the button is disabled while still allowing users to understand why.

## Dropdown Tooltip Management

### Critical Requirement: Hide Tooltips When Dropdowns Open
When using tooltips with dropdown menus, **ALWAYS** include a `@dropdown-opened` event handler to immediately hide the associated tooltip. This prevents the tooltip from appearing on top of the dropdown content.

### Required Pattern for Dropdown Tooltips
```vue
<DropdownMenu
  ref="myDropdownRef"
  @mouseenter="handleMouseEnter"
  @mouseleave="handleMouseLeave"
  @dropdown-opened="handleDropdownOpened"  <!-- REQUIRED -->
  @dropdown-closed="handleDropdownClosed"  <!-- RECOMMENDED for orphaned tooltip cleanup -->
>
  <!-- dropdown content -->
</DropdownMenu>

<InfoTooltip
  :visible="tooltipManager.activeTooltipId.value === 'my-tooltip-id'"
  :target="myDropdownRef?.$el"
  :content="{ text: 'Tooltip text' }"
/>
```

```typescript
// REQUIRED: Handler to hide tooltip when dropdown opens
const handleDropdownOpened = () => {
  tooltipManager.hideTooltipImmediately(); // Use immediate hide to prevent delay
};

// RECOMMENDED: Handler to clean up orphaned tooltips when dropdown closes
const handleDropdownClosed = () => {
  // Check for orphaned tooltips when dropdown fully closes
  const tooltipTargets = [
    { element: buttonRef.value?.visualStyleRef || null, name: 'button' }
  ];
  
  checkMultipleTooltipTargets(tooltipTargets);
};
```

### Advanced: Using useDropdownTooltipManager
For more complex scenarios, you can use the dedicated composable:

```typescript
import { useDropdownTooltipManager } from "@/composables/useDropdownTooltipManager";

const { tooltipManager, createDropdownOpenedHandler } = useDropdownTooltipManager();

// Create a handler for a specific tooltip ID
const handleDropdownOpened = createDropdownOpenedHandler('my-tooltip-id');

// Or create a handler that hides any active tooltip
const handleDropdownOpened = createDropdownOpenedHandler();
```

**Note:** The `useDropdownTooltipManager` automatically uses `hideTooltipImmediately()` to ensure tooltips disappear instantly when dropdowns open.

## Orphaned Tooltip Management

### Critical Issue: Orphaned Tooltips
When tooltip target elements are removed from the DOM unexpectedly (e.g., when dropdowns close via ESC key), tooltips can become "orphaned" and remain visible even though their target no longer exists.

### Solution: Comprehensive Tooltip State Management
For components that might have tooltips orphaned by unexpected DOM changes, implement a comprehensive cleanup system:

#### 1. Create Tooltip State Reset Functions
```typescript
// Hide all tooltips to prevent orphaned tooltips when dropdown closes
const hideAllTooltips = () => {
  pauseTooltipVisible.value = false;
  cancelTooltipVisible.value = false;
  closeButtonTooltipVisible.value = false;
  checkboxTooltipVisible.value = false;
  confirmCancelButtonTooltipVisible.value = false;
};

// Reset tooltip refs to prevent orphaned tooltips
const resetTooltipRefs = () => {
  closeButtonRef.value = null;
  checkboxRef.value = null;
  checkboxLabelRef.value = null;
  confirmCancelButtonRef.value = null;
};

// Complete tooltip state reset
const resetAllTooltipState = () => {
  hideAllTooltips();
  resetTooltipRefs();
  
  // Also reset the dropdown ref to ensure complete cleanup
  cancelDropdownRef.value = null;
};
```

#### 2. Validate Tooltip Target Elements
```typescript
// Check if tooltip refs are still valid (elements still in DOM)
const areTooltipRefsValid = () => {
  const refs = [
    closeButtonRef.value?.visualStyleRef,
    checkboxLabelRef.value,
    confirmCancelButtonRef.value?.visualStyleRef
  ];
  
  return refs.every(ref => {
    if (!ref) return false;
    if (ref instanceof Element) {
      return document.contains(ref);
    }
    // Check if it's a ref with a value property
    if (typeof ref === 'object' && ref !== null && 'value' in ref) {
      const refValue = (ref as any).value;
      if (refValue instanceof Element) {
        return document.contains(refValue);
      }
    }
    return false;
  });
};
```

#### 3. Check for Orphaned Tooltips
```typescript
// Check for orphaned tooltips when dropdown closes unexpectedly
const checkForOrphanedTooltips = () => {
  // Check all tooltip targets that might be orphaned
  const tooltipTargets = [
    { element: closeButtonRef.value?.visualStyleRef || null, name: 'close button' },
    { element: checkboxLabelRef.value || null, name: 'checkbox' },
    { element: confirmCancelButtonRef.value?.visualStyleRef || null, name: 'confirm cancel button' }
  ];

  // If any tooltip targets are null or invalid, complete cleanup of tooltip state
  const hasNullTargets = tooltipTargets.some(target => target.element === null);
  const hasInvalidRefs = !areTooltipRefsValid();
  
  if (hasNullTargets || hasInvalidRefs) {
    console.log(`[Component] Invalid tooltip targets detected, resetting all tooltip state`);
    resetAllTooltipState();
  }

  // Use the orphaned tooltip detector composable
  checkMultipleTooltipTargets(tooltipTargets);
};
```

#### 4. Integrate Cleanup into Event Handlers
```typescript
// CRITICAL: Close dropdown BEFORE resetting tooltip state
// If you reset tooltip state first, the dropdown ref becomes null and can't be closed
const handleConfirmCancel = () => {
  // Stop monitoring since we're confirming the cancel
  stopDropdownCloseMonitoring();
  
  // Close the dropdown properly BEFORE resetting tooltip state
  if (cancelDropdownRef.value) {
    cancelDropdownRef.value.closeDropdown();
  }
  
  // Complete cleanup of tooltip state when cancel is confirmed
  resetAllTooltipState();
  
  emit("cancel", removeScannedItems.value);
};
```

const handleDropdownClosed = () => {
  // Stop monitoring since the dropdown is now fully closed
  stopDropdownCloseMonitoring();
  
  // Complete cleanup of tooltip state when dropdown closes
  resetAllTooltipState();
  
  // Resume scanning if we weren't paused before
  if (!wasPausedBeforeCancel.value) {
    emit("pause", false);
  }
};
```

#### 5. Add Dropdown Ref Watcher
```typescript
// Debug: Watch for when the dropdown ref is set
watch(cancelDropdownRef, (newRef) => {
  if (newRef) {
    console.log(`[Component] Dropdown ref set:`, !!newRef);
  } else {
    // Dropdown ref is null, complete cleanup of tooltip state
    console.log(`[Component] Dropdown ref is null, resetting all tooltip state`);
    resetAllTooltipState();
  }
});
```

#### 6. Cleanup on Component Unmount
```typescript
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  
  // Complete cleanup of all tooltip state when component is destroyed
  resetAllTooltipState();
  
  // Stop any ongoing monitoring
  if (dropdownCloseMonitorInterval) {
    clearInterval(dropdownCloseMonitorInterval);
    dropdownCloseMonitorInterval = null;
  }
  
  // Reset remaining refs to prevent memory leaks
  pauseButtonRef.value = null;
});
```

### When to Use Comprehensive Orphaned Tooltip Detection
- **Dropdown components** that can close unexpectedly (ESC key, click outside, etc.)
- **Modal components** that might close without proper cleanup
- **Dynamic content** that gets removed from DOM
- **Components with multiple tooltip targets** that might be hidden simultaneously
- **Components with complex state management** that might leave tooltips orphaned

### Example: Dropdown with Comprehensive Orphaned Tooltip Protection
```vue
<template>
  <DropdownMenu
    ref="dropdownRef"
    @dropdown-opened="handleDropdownOpened"
    @dropdown-closed="handleDropdownClosed"
  >
    <CustomButton
      ref="buttonRef"
      @mouseenter="handleButtonMouseEnter"
      @mouseleave="handleButtonMouseLeave"
    />
  </DropdownMenu>
  
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'my-tooltip'"
    :target="buttonRef?.visualStyleRef"
    :content="{ text: 'Tooltip text' }"
  />
</template>

<script setup lang="ts">
import { useOrphanedTooltipDetector } from "@/composables/useOrphanedTooltipDetector";

const { checkMultipleTooltipTargets } = useOrphanedTooltipDetector();

// Implement all the cleanup functions shown above
const resetAllTooltipState = () => { /* ... */ };
const checkForOrphanedTooltips = () => { /* ... */ };

const handleDropdownClosed = () => {
  // Complete cleanup of tooltip state when dropdown closes
  resetAllTooltipState();
  
  // Check for orphaned tooltips
  checkForOrphanedTooltips();
};
</script>
```

### Reference Implementation
For a complete working example with comprehensive orphaned tooltip management, see:
- **FileTableLoadingOverlay.vue** - Full implementation with dropdown monitoring, tooltip state reset, and DOM validation

