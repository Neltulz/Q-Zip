// 
// IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file.
// useZoom.ts

const STORAGE_KEY = "app-zoom-factor";
const DEFAULT = 1.0;
const STEP = 0.05; // change increment to 0.05 per request
const MIN = 0.5;
const MAX = 3.0;

// Allow a separate per-component zoom key for file-table
const FILE_TABLE_STORAGE_KEY = "file-table-zoom-factor";

export function getFileTableZoomFactor(): number {
  try {
    const raw = localStorage.getItem(FILE_TABLE_STORAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? clamp(parsed) : DEFAULT;
  } catch (e) {
    return DEFAULT;
  }
}

export function setFileTableZoomFactor(factor: number): void {
  try {
    const v = clamp(Number.parseFloat(String(factor)));
    localStorage.setItem(FILE_TABLE_STORAGE_KEY, String(v));
    // set CSS var on a container element (document.documentElement) for global zoom
    // For file-table we'll set a separate CSS var `--file-table-zoom` on the root so components can opt-in.
    document.documentElement.style.setProperty("--file-table-zoom", String(v));
    // Notify listeners about file-table zoom change
    try {
      window.dispatchEvent(new CustomEvent("app:file-table-zoom-changed", { detail: v }));
    } catch (e) {
      // ignore (non-browser env)
    }
  } catch (e) {
    // ignore
  }
}

function clamp(v: number) {
  return Math.max(MIN, Math.min(MAX, v));
}

function applyFactor(factor: number) {
  const v = clamp(Number.parseFloat(String(factor)));
  try {
    // store numeric factor (e.g. 1.0, 1.5, 2.0)
    localStorage.setItem(STORAGE_KEY, String(v));
    // expose as CSS variable `--zoom` and let styles apply `zoom: var(--zoom)` on html
    document.documentElement.style.setProperty("--zoom", String(v));
    // Notify listeners about global zoom change
    try {
      window.dispatchEvent(new CustomEvent("app:global-zoom-changed", { detail: v }));
    } catch (e) {
      // ignore
    }
  } catch (e) {
    // ignore in non-browser environments
  }
}

export function getZoomFactor(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? clamp(parsed) : DEFAULT;
  } catch (e) {
    return DEFAULT;
  }
}

export function setZoomFactor(factor: number): void {
  applyFactor(factor);
}

export function zoomIn(): void {
  setZoomFactor(getZoomFactor() + STEP);
}

export function zoomOut(): void {
  setZoomFactor(getZoomFactor() - STEP);
}

export function resetZoom(): void {
  setZoomFactor(DEFAULT);
}

// Initialize on import
try {
  applyFactor(getZoomFactor());
} catch (e) { }

// Ensure file-table zoom variable is initialized on import so components that
// read the CSS var during mount get the persisted value immediately.
try {
  const ft = getFileTableZoomFactor();
  try {
    document.documentElement.style.setProperty("--file-table-zoom", String(ft));
  } catch (e) {
    // ignore in non-browser environments
  }
} catch (e) {
  // ignore
}

export default { getZoomFactor, setZoomFactor, zoomIn, zoomOut, resetZoom };


