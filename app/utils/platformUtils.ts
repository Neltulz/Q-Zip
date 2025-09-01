// utils/platformUtils.ts
// 
/**
 * Platform detection utilities for cross-platform compatibility
 */

export const getPlatform = (): 'windows' | 'macos' | 'linux' | 'unknown' => {
  if (typeof window === 'undefined') return 'unknown';

  const platform = window.navigator.platform.toLowerCase();

  if (platform.includes('win')) return 'windows';
  if (platform.includes('mac')) return 'macos';
  if (platform.includes('linux')) return 'linux';

  return 'unknown';
};

export const isWindows = (): boolean => getPlatform() === 'windows';
export const isMacOS = (): boolean => getPlatform() === 'macos';
export const isLinux = (): boolean => getPlatform() === 'linux';

export const shouldShowCustomWindowControls = (): boolean => {
  // Show custom window controls on Linux since Decorum doesn't work well there
  return isLinux();
};

export const shouldUseDecorum = (): boolean => {
  // Use Decorum on Windows where it works well
  return isWindows();
};

// Check if long paths are enabled on Windows (registry check only)
export const checkLongPathsEnabled = async (): Promise<boolean> => {
  if (!isWindows()) {
    // Non-Windows platforms typically support longer paths
    return true;
  }

  try {
    // Import Tauri invoke dynamically to avoid issues in non-Tauri environments
    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke<boolean>('check_long_paths_enabled');
    console.log('Registry check result:', result);
    return result;
  } catch (error) {
    console.warn('Failed to check long paths registry setting:', error);
    // Default to true for safety (better to assume long paths work than to break functionality)
    return true;
  }
};

// Get current path limit based on platform and long paths setting
export const getCurrentPathLimit = async (): Promise<number> => {
  const platform = getPlatform();

  if (platform === 'windows') {
    try {
      // Check debug store for long paths setting
      const { useDebugStore } = await import('@/stores/debugStore');
      const debugStore = useDebugStore();
      const longPathsEnabled = debugStore.debugOptions.longPathsEnabled;
      return longPathsEnabled ? 32767 : 260;
    } catch (error) {
      console.warn('Failed to check debug store for long paths, using registry check:', error);
      // Fallback to registry check
      const longPathsEnabled = await checkLongPathsEnabled();
      return longPathsEnabled ? 32767 : 260;
    }
  } else if (platform === 'linux') {
    return 65536; // Modern Linux systems support much longer paths
  } else if (platform === 'macos') {
    return 4096; // macOS with APFS supports longer paths
  } else {
    return 4096; // Conservative fallback
  }
};