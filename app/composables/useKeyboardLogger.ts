/**
 * useKeyboardLogger.ts
 * 
 * A composable that tracks keyboard events and logs meaningful key combinations.
 * 
 * What it does:
 * - Logs keyboard combinations while filtering out modifier-only presses.
 * - Prevents log flooding from held keys by implementing debouncing.
 * - Tracks modifier key states (Ctrl, Shift, Alt, Win/Meta).
 * - Provides detailed logging of key combinations with modifier context.
 * 
 * Key features:
 * - Modifier key state tracking
 * - Debounced logging to prevent spam
 * - Intelligent filtering of modifier-only presses
 * - Detailed combination logging
 * 
 * Usage:
 * - Import and call useKeyboardLogger() in components that need keyboard logging
 * - Automatically handles cleanup on component unmount
 * - Integrates with existing logging infrastructure
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { logGlobalEvent } from '@/utils/loggers';
import { DEBUG, debugConfig } from '@/utils/debugConfig';

// Modifier keys that shouldn't be logged alone
const MODIFIER_KEYS = new Set([
  'Control',
  'Shift',
  'Alt',
  'Meta',
  'CapsLock',
  'NumLock',
  'ScrollLock'
]);

// Keys that are commonly held and should be debounced
const DEBOUNCE_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'PageUp',
  'PageDown',
  'Home',
  'End'
]);

interface KeyState {
  isPressed: boolean;
  lastLogTime: number;
}

export const useKeyboardLogger = () => {
  // Track modifier key states
  const modifierStates = ref({
    ctrl: false,
    shift: false,
    alt: false,
    meta: false
  });

  // Track all pressed keys to prevent duplicate logging
  const pressedKeys = ref(new Map<string, KeyState>());

  // Debounce interval for held keys (milliseconds)
  const DEBOUNCE_INTERVAL = 500;

  const isModifierKey = (key: string): boolean => {
    return MODIFIER_KEYS.has(key);
  };

  const shouldDebounce = (key: string): boolean => {
    return DEBOUNCE_KEYS.has(key);
  };

  const getModifierString = (): string => {
    const modifiers: string[] = [];
    if (modifierStates.value.ctrl) modifiers.push('Ctrl');
    if (modifierStates.value.shift) modifiers.push('Shift');
    if (modifierStates.value.alt) modifiers.push('Alt');
    if (modifierStates.value.meta) modifiers.push('Win');
    return modifiers.join('+');
  };

  const shouldLogKey = (key: string, event: KeyboardEvent): boolean => {
    // Never log standalone modifier keys
    if (isModifierKey(key)) {
      return false;
    }

    // Check if this key is already being tracked
    const existingState = pressedKeys.value.get(key);
    if (existingState?.isPressed) {
      // For debounced keys, only log if enough time has passed
      if (shouldDebounce(key)) {
        const timeSinceLastLog = Date.now() - existingState.lastLogTime;
        if (timeSinceLastLog < DEBOUNCE_INTERVAL) {
          return false;
        }
      } else {
        // For non-debounced keys, don't log repeats
        return false;
      }
    }

    return true;
  };

  const logKeyCombination = (key: string, event: KeyboardEvent) => {
    const modifiers = getModifierString();
    const combination = modifiers ? `${modifiers}+${key}` : key;

    logGlobalEvent('KeyboardLogger', `Key combination: ${combination}`, {
      key,
      modifiers,
      combination,
      eventType: event.type,
      target: (event.target as HTMLElement)?.tagName || 'unknown',
      repeat: event.repeat
    });
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!DEBUG || !debugConfig.logKeyboardEvents) return;

    const key = event.key;

    // Check if this is a modifier key
    const isModifier = isModifierKey(key);

    // Update modifier states
    if (key === 'Control') modifierStates.value.ctrl = true;
    if (key === 'Shift') modifierStates.value.shift = true;
    if (key === 'Alt') modifierStates.value.alt = true;
    if (key === 'Meta') modifierStates.value.meta = true;

    // Track this key as pressed
    pressedKeys.value.set(key, {
      isPressed: true,
      lastLogTime: Date.now()
    });

    // Only log if this is NOT a modifier key (we don't log standalone modifiers)
    if (!isModifier && shouldLogKey(key, event)) {
      logKeyCombination(key, event);

      // Update the last log time for debounced keys
      const keyState = pressedKeys.value.get(key);
      if (keyState) {
        keyState.lastLogTime = Date.now();
      }
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (!DEBUG || !debugConfig.logKeyboardEvents) return;

    const key = event.key;

    // Update modifier states
    if (key === 'Control') modifierStates.value.ctrl = false;
    if (key === 'Shift') modifierStates.value.shift = false;
    if (key === 'Alt') modifierStates.value.alt = false;
    if (key === 'Meta') modifierStates.value.meta = false;

    // Remove this key from pressed keys
    pressedKeys.value.delete(key);
  };

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);

    // Clear all pressed keys on unmount
    pressedKeys.value.clear();
    modifierStates.value = {
      ctrl: false,
      shift: false,
      alt: false,
      meta: false
    };
  });

  return {
    modifierStates,
    pressedKeys
  };
};
