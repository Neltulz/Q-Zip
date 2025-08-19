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

// DropdownMenu component type definition
declare module '#components' {
  interface DropdownMenuExpose {
    openDropdown: (options?: { anchorEl?: HTMLElement }) => void;
    closeDropdown: () => void;
    getTriggerVisualStyle: () => HTMLElement | null;
    isOpen: Ref<boolean>;
  }
}