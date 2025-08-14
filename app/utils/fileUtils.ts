// utils/fileUtils.ts
// 
// IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file. @preserve
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

// Global cancellation flag - will be set by the jobsStore
let isCancelled = false;
let progressCallback: ((current: number, total: number, message: string) => void) | null = null;

export function setCancellationFlag(cancelled: boolean): void {
  isCancelled = cancelled;
}

export function setProgressCallback(callback: ((current: number, total: number, message: string) => void) | null): void {
  progressCallback = callback;
}

/**
 * Recursively scans a directory to get detailed content information.
 * @param path The path of the directory to scan.
 * @returns An object containing counts for top-level and recursive files/folders, and total size.
 */
async function getDirectoryContents(path: string, depth: number = 0): Promise<{
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

    // Check for cancellation more frequently at deeper levels
    const checkInterval = Math.max(1, Math.floor(entries.length / 10));

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // Check for cancellation more frequently for large directories
      if (i % checkInterval === 0 || depth > 2) {
        if (isCancelled) {
          throw new Error("Operation cancelled");
        }
      }

      // Skip entries without a name, which can happen in some edge cases.
      if (!entry.name) continue;

      const entryPath = await join(path, entry.name);

      if (entry.isDirectory) {
        topLevelFolders++;
        recursiveFolders++;

        // Update progress for folder scanning
        if (progressCallback) {
          progressCallback(i + 1, entries.length, `Scanning folder: ${entry.name}`);
        }

        // Recursively get contents of the subdirectory.
        const subDirContents = await getDirectoryContents(entryPath, depth + 1);
        recursiveFiles += subDirContents.filesTotal;
        recursiveFolders += subDirContents.foldersTotal;
        recursiveSize += subDirContents.totalSize;
      } else {
        topLevelFiles++;
        recursiveFiles++;

        // Update progress for file scanning
        if (progressCallback) {
          progressCallback(i + 1, entries.length, `Scanning file: ${entry.name}`);
        }

        // For files, get their stats to add to the total size.
        const fileStat = await stat(entryPath);
        recursiveSize += fileStat.size;
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Operation cancelled") {
      throw error; // Re-throw cancellation errors
    }
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
    // Check for cancellation before starting
    if (isCancelled) {
      throw new Error("Operation cancelled");
    }

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
      // Update progress for directory processing
      if (progressCallback) {
        progressCallback(0, 1, `Processing folder: ${name}`);
      }

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
      // Update progress for file processing
      if (progressCallback) {
        progressCallback(1, 1, `Processing file: ${name}`);
      }

      // If it's a file, return its direct details.
      return {
        ...baseFileItem,
        type: path.split(".").pop() || "",
        size: metadata.size,
      };
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Operation cancelled") {
      throw error; // Re-throw cancellation errors
    }
    console.error(`[fileUtils] Error getting details for ${path}:`, error);
    return null;
  }
}
