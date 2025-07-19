// global.d.ts
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