<!-- #region top-comments -->
<!-- eslint-disable vue/html-self-closing @preserve -->
<!--
  components/CustomButtonGroup.vue @preserve
-->
<!-- components/CustomButtonGroup.vue @preserve -->
<!--
  Description:
  A reusable button group component that displays connected buttons with
  dividers between them. The active button shows a blue line indicator at
  the bottom. Supports arbitrary number of buttons with automatic divider
  management and hover states.

  Features:
  - Connected button styling with background
  - Automatic dividers between buttons
  - Active state with blue line indicator
  - Hover effects that hide adjacent dividers
  - Support for arbitrary number of buttons
  - Flexible button configuration
-->
<!-- #endregion -->
<!-- #region template -->
<template>
  <div
    ref="rootRef"
    class="custom-button-group"
    :class="{ disabled, 'is-vertical': isVertical }"
    :data-orientation="isVertical ? 'vertical' : 'horizontal'"
    data-component-name="CustomButtonGroup"
  >
    <slot />
  </div>
</template>

<!-- #region script -->
<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from "vue";

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    orientation?: 'horizontal' | 'vertical';
  }>(),
  {
    disabled: false,
    orientation: 'horizontal',
  }
);



const isVertical = computed(() => props.orientation === 'vertical');

// Dynamically insert divider elements between direct child buttons
const rootRef = ref<HTMLElement | null>(null);
let mo: MutationObserver | null = null;

const syncDividers = () => {
  const root = rootRef.value;
  if (!root) return;

  // Remove existing dividers (only those we manage)
  Array.from(root.children)
    .forEach((el) => {
      if ((el as HTMLElement).classList?.contains('divider')) {
        root.removeChild(el);
      }
    });

  // Collect direct child buttons rendered by CustomButton
  const buttons: HTMLElement[] = Array.from(root.children)
    .filter((el): el is HTMLElement => el instanceof HTMLElement)
    .filter((el) => el.classList.contains('custom-button'));

  // Interleave dividers between buttons
  for (let i = 0; i < buttons.length - 1; i += 1) {
    const btn = buttons[i] as HTMLElement;
    if (!btn) continue;
    const divider = document.createElement('div');
    divider.className = 'divider';
    // Insert after the button
    const next = btn.nextSibling;
    if (next) root.insertBefore(divider, next);
    else root.appendChild(divider);
  }
};

onMounted(() => {
  syncDividers();
  mo = new MutationObserver(() => {
    // Defer to end of tick to ensure DOM settled
    nextTick().then(syncDividers);
  });
  mo.observe(rootRef.value as Node, { childList: true });
});

onBeforeUnmount(() => {
  if (mo) {
    mo.disconnect();
    mo = null;
  }
});

watch(isVertical, async () => {
  await nextTick();
  syncDividers();
});

// Expose the component for parent access if needed
defineExpose({});
</script>
<!-- #endregion -->
<!-- #region styles -->
<style scoped>
/* Custom Button Group Block */
.custom-button-group {
  --btn-line-thickness: 2px;
  display: flex;
  position: relative;
  padding-inline: 0;
  width: 100%;
  flex-direction: v-bind('isVertical ? "column" : "row"');
}

/* Background pseudo-element for button group - positioned behind buttons */
.custom-button-group:before {
  background-color: var(--bg-clr-liter);
  border-radius: var(--brdr-rad-smalr);
  content: "";
  inset: 0;
  position: absolute;
  z-index: 0;
}

/* Disabled state modifier */
.custom-button-group--disabled {
  opacity: 0.25;
  pointer-events: none;
}

/* Debug popup specific z-index fixes */
.debug-popup .custom-button-group {
  z-index: 10000;
}

.debug-popup .custom-button-group :deep(.custom-button) {
  z-index: 10001;
}

.debug-popup .custom-button-group :deep(.divider) {
  z-index: 10002;
}

/* Button element styling */
.custom-button-group :deep(.custom-button) {
  margin-inline: 0;
  padding-inline: 1.5em;
  position: relative;
  z-index: 1;
  min-width: 80px;
  flex: 1;
}

/* Vertical orientation button adjustments */
.custom-button-group.is-vertical :deep(.custom-button) {
  width: 100%;
  padding-block: 0.75em;
  min-width: auto;
}

/* Button content visibility */
.custom-button-group :deep(.custom-button .button-content) {
  display: flex !important;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  overflow: visible;
}

/* Fix visual-style positioning - remove inset that causes layout issues */
.custom-button-group :deep(.custom-button .visual-style) {
  inset: 0 !important;
}



/* Divider element between buttons - scoped to this group (deep selector to catch dynamic nodes) */
.custom-button-group :deep(.divider) {
  position: relative;
  transition: opacity 200ms ease;
  z-index: 5;
  opacity: 1;
  /* Horizontal orientation (default): vertical line */
  border-inline-start: 1px solid var(--brdr-clr-liter);
  height: calc(100% - 10px); /* 5px inset top & bottom */
  margin-block: 5px;
  width: 0;
}

/* Vertical orientation divider styling: horizontal line */
.custom-button-group[data-orientation="vertical"] :deep(.divider) {
  border-inline-start: none;
  border-block-start: 1px solid var(--brdr-clr-liter);
  height: 0;
  width: calc(100% - 10px); /* 5px inset left/right */
  margin-inline: 5px;
  margin-block: 0;
}

/* Hide the divider immediately AFTER the active button */
.custom-button-group :deep(.custom-button.active + .divider) {
  opacity: 0;
}

/* Hide the divider immediately BEFORE the active button using :has */
.custom-button-group :deep(.divider:has(+ .custom-button.active)) {
  opacity: 0;
}

/* Also hide adjacent dividers around the hovered button */
.custom-button-group :deep(.custom-button:hover + .divider) {
  opacity: 0;
}

.custom-button-group :deep(.divider:has(+ .custom-button:hover)) {
  opacity: 0;
}
</style>
<!-- #endregion -->
