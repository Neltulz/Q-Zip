// utils/testLogging.js
// Simple test script to verify logging is working

import { logUI, logNotification, logRendering } from './loggers';

// Test function to verify logging is working
export function testLogging() {
  console.log('🧪 Testing logging system...');
  
  // Test UI logging
  logUI('TestComponent', 'Testing UI logging', { test: true });
  
  // Test notification logging  
  logNotification('TestComponent', 'Testing notification logging', { id: 'test-123' });
  
  // Test rendering logging
  logRendering('TestComponent', 'Testing rendering logging', { placement: 'right' });
  
  console.log('✅ Logging test complete! Check the console above for colored log messages.');
}

// Make it available globally for easy testing
if (typeof window !== 'undefined') {
  window.testLogging = testLogging;
}
