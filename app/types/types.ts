// types/types.ts @preserve
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
  // Lazy loading support
  isLazyLoaded?: boolean; // Indicates if folder stats are still being calculated
  lazyLoadError?: string; // Error message if lazy loading failed
}

export interface DropZoneExposed {
  addFiles: (paths: string[]) => Promise<void>;
  getDropZoneElement: () => HTMLElement | null;
}

export interface DragDropEventPayload {
  position: { x: number; y: number };
  paths: string[];
}
