// types/types.ts
// 
// IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file. @preserve
export interface FileItem {
  path: string;
  name: string;
  type: string;
  size: number;
  parentPath: string;
  // Optional new fields
  modified?: number; // UNIX timestamp
  created?: number; // UNIX timestamp
  files?: number;
  folders?: number;
  filesTotal?: number;
  foldersTotal?: number;
}

export interface DropZoneExposed {
  addFiles: (paths: string[]) => Promise<void>;
  getDropZoneElement: () => HTMLElement | null;
}

export interface DragDropEventPayload {
  position: { x: number; y: number };
  paths: string[];
}
