// global.d.ts
// 
// IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file.
interface Window {
    __TAURI__: {
      event: {
        listen: typeof import('@tauri-apps/api/event').listen;
      };
      core: {
        invoke: typeof import('@tauri-apps/api/core').invoke;
      };
    };
  }