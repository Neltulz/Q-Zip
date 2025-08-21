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
