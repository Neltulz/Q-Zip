// 
// IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file.
// useSelectionLock.ts

/**
 * Ref-counted global selection lock helper.
 *
 * Usage:
 * const release = acquireSelectionLock();
 * // later...
 * release();
 *
 * Or use enableSelectionLock()/disableSelectionLock() for simple toggle (not ref-counted).
 */

const BODY_NO_SELECT_CLASS = "no-select";
let lockCount = 0;

function isBrowser(): boolean {
  return typeof document !== "undefined" && typeof window !== "undefined";
}

function applyClass(): void {
  if (!isBrowser()) return;
  document.body.classList.add(BODY_NO_SELECT_CLASS);
  // Apply inline user-select styles on the body with !important to ensure
  // it overrides component-scoped rules that may use !important.
  try {
    document.body.style.setProperty("-webkit-user-select", "none", "important");
    document.body.style.setProperty("-moz-user-select", "none", "important");
    document.body.style.setProperty("-ms-user-select", "none", "important");
    document.body.style.setProperty("user-select", "none", "important");
  } catch (e) {
    // ignore in non-browser or unsupported environments
  }

  // Ensure interactive form controls and contenteditable remain selectable by
  // applying inline "text" selection style and marking them so we can clean up.
  const selectors = ["textarea", "input", "select", "[contenteditable]"];
  const nodes = Array.from(document.querySelectorAll(selectors.join(","))) as HTMLElement[];
  nodes.forEach((el) => {
    try {
      el.setAttribute("data-selection-lock-exception", "true");
      el.style.setProperty("-webkit-user-select", "text", "important");
      el.style.setProperty("-moz-user-select", "text", "important");
      el.style.setProperty("-ms-user-select", "text", "important");
      el.style.setProperty("user-select", "text", "important");
    } catch (e) {
      // ignore per-element failures
    }
  });
}

function removeClass(): void {
  if (!isBrowser()) return;
  document.body.classList.remove(BODY_NO_SELECT_CLASS);
  try {
    document.body.style.removeProperty("-webkit-user-select");
    document.body.style.removeProperty("-moz-user-select");
    document.body.style.removeProperty("-ms-user-select");
    document.body.style.removeProperty("user-select");
  } catch (e) {
    // ignore
  }

  // Remove inline exception styles from elements we modified
  const nodes = Array.from(document.querySelectorAll("[data-selection-lock-exception]")) as HTMLElement[];
  nodes.forEach((el) => {
    try {
      el.removeAttribute("data-selection-lock-exception");
      el.style.removeProperty("-webkit-user-select");
      el.style.removeProperty("-moz-user-select");
      el.style.removeProperty("-ms-user-select");
      el.style.removeProperty("user-select");
    } catch (e) {
      // ignore
    }
  });
}

/**
 * Acquire a selection lock. Returns a release() function which must be called
 * to decrement the internal counter. The `no-select` class is present while
 * the counter is > 0.
 */
export function acquireSelectionLock(): () => void {
  if (!isBrowser()) return () => { };
  lockCount += 1;
  if (lockCount === 1) applyClass();

  let released = false;
  return function release() {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) removeClass();
  };
}

/**
 * Convenience: force-enable the no-select class (sets counter to 1).
 * Use paired with disableSelectionLock() if you don't need ref-counting.
 */
export function enableSelectionLock(): void {
  if (!isBrowser()) return;
  lockCount = Math.max(1, lockCount);
  applyClass();
}

/**
 * Convenience: force-disable the no-select class and reset counter to 0.
 */
export function disableSelectionLock(): void {
  if (!isBrowser()) return;
  lockCount = 0;
  removeClass();
}

export function isSelectionLocked(): boolean {
  return lockCount > 0;
}

/**
 * Force release all locks (useful for cleanup).
 */
export function forceReleaseAllSelectionLocks(): void {
  if (!isBrowser()) return;
  lockCount = 0;
  removeClass();
}

export default {
  acquireSelectionLock,
  enableSelectionLock,
  disableSelectionLock,
  isSelectionLocked,
  forceReleaseAllSelectionLocks,
};


