<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- 
  HotKey.vue @preserve
-->
<!-- components/HotKey.vue @preserve -->
<!--
  Description:
  A reusable component for displaying keyboard shortcuts with proper styling.
  Supports single keys, multiple keys with + separators, and includes the keyboard icon.
  
  Props:
  - keys: string[] - Array of key names to display (e.g., ['SHIFT', 'T'])
  - showIcon: boolean - Whether to show the keyboard icon (default: true)
  - size: 'small' | 'medium' | 'large' - Size variant (default: 'medium')
  - disabled: boolean - Whether to show the shortcut in a disabled/dimmed state (default: false)
  
  Example usage:
  <HotKey :keys="['CTRL', 'C']" />
  <HotKey :keys="['SHIFT', 'DEL']" :show-icon="false" />
  <HotKey :keys="['ESC']" size="small" />
  <HotKey :keys="['CTRL', 'C']" :disabled="true" />
-->
<template>
  <div class="hot-key" :class="[sizeClass, { disabled: props.disabled }]">
    <Icon 
      v-if="showIcon" 
      name="mdi:keyboard" 
      class="keyboard-icon" 
    />
    <div class="keyboard-key-text">
      <template v-for="(key, index) in normalizedKeys" :key="index">
        <span class="keycap">{{ key }}</span>
        <span v-if="index < normalizedKeys.length - 1" class="plus-symbol">+</span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { DEBUG, debugConfig } from "@/utils/debugConfig";
import { logUI } from "@/utils/loggers";

const props = withDefaults(
  defineProps<{
    keys: string[];
    showIcon?: boolean;
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
  }>(),
  {
    showIcon: true,
    size: 'medium',
    disabled: false,
  }
);

// Normalize keys to uppercase and handle common variations
const normalizedKeys = computed(() => {
  return props.keys.map(key => {
    const normalized = key.toUpperCase().trim();
    
    // Handle common key variations
    const keyMap: Record<string, string> = {
      'CTRL': 'CTRL',
      'CONTROL': 'CTRL',
      'SHIFT': 'SHIFT',
      'ALT': 'ALT',
      'META': 'META',
      'CMD': 'CMD',
      'COMMAND': 'CMD',
      'WIN': 'WIN',
      'WINDOWS': 'WIN',
      'TAB': 'TAB',
      'ENTER': 'ENTER',
      'RETURN': 'ENTER',
      'ESC': 'ESC',
      'ESCAPE': 'ESC',
      'BACKSPACE': 'BACKSPACE',
      'DELETE': 'DEL',
      'DEL': 'DEL',
      'INSERT': 'INS',
      'INS': 'INS',
      'HOME': 'HOME',
      'END': 'END',
      'PAGEUP': 'PAGE UP',
      'PAGE_UP': 'PAGE UP',
      'PAGEDOWN': 'PAGE DOWN',
      'PAGE_DOWN': 'PAGE DOWN',
      'ARROWUP': '↑',
      'ARROW_UP': '↑',
      'UP': '↑',
      'ARROWDOWN': '↓',
      'ARROW_DOWN': '↓',
      'DOWN': '↓',
      'ARROWLEFT': '←',
      'ARROW_LEFT': '←',
      'LEFT': '←',
      'ARROWRIGHT': '→',
      'ARROW_RIGHT': '→',
      'RIGHT': '→',
      'F1': 'F1',
      'F2': 'F2',
      'F3': 'F3',
      'F4': 'F4',
      'F5': 'F5',
      'F6': 'F6',
      'F7': 'F7',
      'F8': 'F8',
      'F9': 'F9',
      'F10': 'F10',
      'F11': 'F11',
      'F12': 'F12',
    };
    
    return keyMap[normalized] || normalized;
  });
});

// Size class for styling
const sizeClass = computed(() => `size-${props.size}`);

// Log when disabled prop changes for debugging
watch(() => props.disabled, (newDisabled) => {
  if (DEBUG && debugConfig.logUIInteractivity) {
    logUI("HotKey", "Disabled prop changed", {
      keys: props.keys,
      disabled: newDisabled,
      showIcon: props.showIcon,
      size: props.size
    });
  }
});
</script>

<style scoped>
/* 
  HotKey component styles
  Extracted from InfoTooltip keyboard shortcut styling
*/

/* Main container - <div class="hot-key"> */
.hot-key {
  /* CSS Variables for keyboard shortcut styling */
  --keyboard-icon-size: 16px;
  --keyboard-icon-margin: 4px;
  --keyboard-font-size: 0.9em;
  --keyboard-keycap-font-size: 1em;
  --keyboard-keycap-padding-block: 1px;
  --keyboard-keycap-padding-inline: 3px;
  --keyboard-keycap-border-radius: 3px;
  --keyboard-keycap-min-width: 1.2em;
  --keyboard-keycap-line-height: 1.1;
  --keyboard-gap: 1px;
  --keyboard-plus-margin: 1px;
  
  align-items: center;
  display: flex;
  gap: 8px;
  font-family: monospace;
  white-space: nowrap;

  /* Keyboard icon - <Icon class="keyboard-icon"> */
  .keyboard-icon {
    block-size: var(--keyboard-icon-size);
    color: var(--blu-lite); /* --blu-lite defined in global.css */
    flex-shrink: 0;
    inline-size: var(--keyboard-icon-size);
    margin-inline-end: var(--keyboard-icon-margin);
  }

  /* Keyboard shortcut key text - <div class="keyboard-key-text"> */
  .keyboard-key-text {
    color: var(--blu-lite); /* --blu-lite defined in global.css */
    font-size: var(--keyboard-font-size);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: var(--keyboard-gap);
    font-family: monospace;
    white-space: nowrap;
  }

  /* Individual keycap styling */
  .keycap {
    background-color: hsla(211, 100%, 50%, 0.8); /* Dimmed blue background */
    border: 1px solid hsla(211, 100%, 60%, 0.5); /* Brighter border for contrast */
    border-radius: var(--keyboard-keycap-border-radius);
    color: hsla(211, 50%, 90%, 1); /* White text for contrast */
    padding-block: var(--keyboard-keycap-padding-block);
    padding-inline: var(--keyboard-keycap-padding-inline);
    font-weight: 500;
    min-width: var(--keyboard-keycap-min-width);
    text-align: center;
    line-height: var(--keyboard-keycap-line-height); /* Reduced line-height for tighter appearance */
    display: inline-block;
    font-size: var(--keyboard-keycap-font-size);
  }

  /* Plus symbol styling (not in keycap) */
  .plus-symbol {
    background: none;
    border: none;
    color: var(--blu-lite); /* --blu-lite defined in global.css */
    padding: 0;
    margin-inline: var(--keyboard-plus-margin);
  }
}

/* Size variants */
.hot-key.size-small {
  --keyboard-icon-size: 12px;
  --keyboard-font-size: 0.8em;
  --keyboard-keycap-font-size: 0.9em;
  --keyboard-keycap-padding-block: 0px;
  --keyboard-keycap-padding-inline: 2px;
  --keyboard-keycap-min-width: 1em;
  gap: 4px;
}

.hot-key.size-medium {
  /* Default values already set above */
}

.hot-key.size-large {
  --keyboard-icon-size: 20px;
  --keyboard-font-size: 1em;
  --keyboard-keycap-font-size: 1.1em;
  --keyboard-keycap-padding-block: 2px;
  --keyboard-keycap-padding-inline: 4px;
  --keyboard-keycap-min-width: 1.4em;
  gap: 10px;
}

/* Disabled state styling */
.hot-key.disabled {
  opacity: 0.6;
  
  .keyboard-icon {
    color: var(--txt-clr-dark); /* --txt-clr-dark defined in global.css */
    opacity: 0.6;
  }
  
  .keyboard-key-text {
    color: var(--txt-clr-dark); /* --txt-clr-dark defined in global.css */
  }
  
  .keycap {
    background-color: hsla(0, 0%, 40%, 0.6);
    border-color: hsla(0, 0%, 50%, 0.4);
    color: hsla(0, 0%, 80%, 1);
    opacity: 0.7;
  }
  
  .plus-symbol {
    color: var(--txt-clr-dark); /* --txt-clr-dark defined in global.css */
    opacity: 0.6;
  }
}
</style>
