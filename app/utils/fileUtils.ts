// utils/fileUtils.ts @preserve
/** @preserve
 * File Utilities
 *
 * This module provides utility functions for interacting with the file system
 * using Tauri's file system API. It includes functions to retrieve detailed
 * information about files and directories, such as path, name, type, size,
 * and parent directory.
 */
// @preserve

import { stat } from "@tauri-apps/plugin-fs";
import { basename, dirname } from "@tauri-apps/api/path";
import type { FileItem } from "@/types/types";

export async function getFileDetails(path: string): Promise<FileItem | null> {
  try {
    const metadata = await stat(path);
    const name = await basename(path);
    const parentPath = await dirname(path);
    const type = metadata.isDirectory ? "Folder" : path.split(".").pop() || "";
    return {
      path,
      name,
      type,
      size: metadata.size,
      parentPath,
    };
  } catch (error) {
    console.error(`[fileUtils] Error getting details for ${path}:`, error);
    return null;
  }
}
