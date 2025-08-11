// utils/fileUtils.ts @preserve
/** @preserve
 * File Utilities
 *
 * This module provides utility functions for interacting with the file system
 * using Tauri's file system API. It includes functions to retrieve detailed
 * information about files and directories, such as path, name, type, size,
 * timestamps, and folder contents.
 */
// @preserve

import { stat, readDir } from "@tauri-apps/plugin-fs";
import { basename, dirname, join } from "@tauri-apps/api/path";
import type { FileItem } from "@/types/types";

/**
 * Recursively scans a directory to get detailed content information.
 * @param path The path of the directory to scan.
 * @returns An object containing counts for top-level and recursive files/folders, and total size.
 */
async function getDirectoryContents(path: string): Promise<{
  files: number; // Top-level file count
  folders: number; // Top-level folder count
  filesTotal: number; // Recursive file count
  foldersTotal: number; // Recursive folder count
  totalSize: number; // Total size of all files recursively
}> {
  let topLevelFiles = 0;
  let topLevelFolders = 0;
  let recursiveFiles = 0;
  let recursiveFolders = 0;
  let recursiveSize = 0;

  try {
    const entries = await readDir(path);

    for (const entry of entries) {
      // Skip entries without a name, which can happen in some edge cases.
      if (!entry.name) continue;

      const entryPath = await join(path, entry.name);

      if (entry.isDirectory) {
        topLevelFolders++;
        recursiveFolders++;
        // Recursively get contents of the subdirectory.
        const subDirContents = await getDirectoryContents(entryPath);
        recursiveFiles += subDirContents.filesTotal;
        recursiveFolders += subDirContents.foldersTotal;
        recursiveSize += subDirContents.totalSize;
      } else {
        topLevelFiles++;
        recursiveFiles++;
        // For files, get their stats to add to the total size.
        const fileStat = await stat(entryPath);
        recursiveSize += fileStat.size;
      }
    }
  } catch (error) {
    // Log errors but allow the function to return what it has gathered so far.
    console.error(`[fileUtils] Could not read directory ${path}:`, error);
  }

  return {
    files: topLevelFiles,
    folders: topLevelFolders,
    filesTotal: recursiveFiles,
    foldersTotal: recursiveFolders,
    totalSize: recursiveSize,
  };
}

/**
 * Retrieves detailed information for a given file or directory path.
 * For directories, it recursively calculates the total size and content count.
 * @param path The full path to the file or directory.
 * @returns A FileItem object with details, or null if an error occurs.
 */
export async function getFileDetails(path: string): Promise<FileItem | null> {
  try {
    const metadata = await stat(path);
    const name = await basename(path);
    const parentPath = await dirname(path);

    // Base details common to both files and folders.
    // Timestamps are converted to UNIX format (milliseconds).
    const baseFileItem = {
      path,
      name,
      parentPath,
      modified: metadata.mtime?.getTime(),
      created: metadata.birthtime?.getTime(),
    };

    if (metadata.isDirectory) {
      // If it's a directory, get its recursive contents.
      const contents = await getDirectoryContents(path);
      return {
        ...baseFileItem,
        type: "Folder",
        size: contents.totalSize,
        files: contents.files,
        folders: contents.folders,
        filesTotal: contents.filesTotal,
        foldersTotal: contents.foldersTotal,
      };
    } else {
      // If it's a file, return its direct details.
      return {
        ...baseFileItem,
        type: path.split(".").pop() || "",
        size: metadata.size,
      };
    }
  } catch (error) {
    console.error(`[fileUtils] Error getting details for ${path}:`, error);
    return null;
  }
}
