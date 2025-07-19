// types/types.ts @preserve
export interface FileItem {
    path: string;
    name: string;
    type: string;
    size: number;
    parentPath: string;
  }
  
  export interface DropZoneExposed {
    addFiles: (paths: string[]) => Promise<void>;
    getDropZoneElement: () => HTMLElement | null;
  }
  
  export interface DragDropEventPayload {
    position: { x: number; y: number };
    paths: string[];
  }