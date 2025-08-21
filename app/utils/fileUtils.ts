// utils/fileUtils.ts
// 
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
import { logTrace } from '~/utils/loggers';
// Global cancellation and pause flags - will be set by the jobsStore
let isCancelled = false;
let isPaused = false;
let progressCallback: ((current: number, total: number, message: string, overallCurrent?: number, overallTotal?: number, overallMessage?: string) => void) | null = null;
// Track pause logging to avoid flooding
let pauseLogged = false;
export function setCancellationFlag(cancelled: boolean): void {
  isCancelled = cancelled;
}
export function setPauseFlag(paused: boolean): void {
  isPaused = paused;
}
export function setProgressCallback(callback: ((current: number, total: number, message: string, overallCurrent?: number, overallTotal?: number, overallMessage?: string) => void) | null): void {
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
    // Check for cancellation and pause more frequently at deeper levels
    const checkInterval = Math.max(1, Math.floor(entries.length / 100)); // Check every 1% instead of 10%
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      // Check for cancellation and pause more frequently for large directories
      if (i % checkInterval === 0 || depth > 2 || i % 10 === 0) { // Also check every 10 items regardless
        if (isCancelled) {
          throw new Error("Operation cancelled");
        }
        // Check for pause and wait if paused
        while (isPaused && !isCancelled) {
          // Only log the first pause detection to avoid flooding
          if (!pauseLogged) {
            logTrace('fileUtils', `PAUSE DETECTED in getDirectoryContents - Waiting for resume at ${performance.now().toFixed(2)}ms (item ${i}/${entries.length}, depth ${depth})`);
            pauseLogged = true;
          }
          await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before checking again
        }
        // Clear the pause logged flag when we resume
        if (pauseLogged && !isPaused) {
          pauseLogged = false;
        }
      }
      // Skip entries without a name, which can happen in some edge cases.
      if (!entry?.name) continue;
      const entryPath = await join(path, entry.name);
      if (entry.isDirectory) {
        topLevelFolders++;
        recursiveFolders++;
        // Update progress for folder scanning
        if (progressCallback) {
          progressCallback(i + 1, entries.length, `Scanning folder: ${entry.name}`);
        }
        // Recursively get contents of the subdirectory.
        try {
          const subDirContents = await getDirectoryContents(entryPath, depth + 1);
          recursiveFiles += subDirContents.filesTotal;
          recursiveFolders += subDirContents.foldersTotal;
          recursiveSize += subDirContents.totalSize;
        } catch (subDirError) {
          // Handle subdirectory access errors gracefully
          if (subDirError instanceof Error && subDirError.message === "Operation cancelled") {
            throw subDirError; // Re-throw cancellation errors
          }
          console.warn(`[fileUtils] Skipping subdirectory ${entryPath} due to access error:`, subDirError);
          // Continue processing other entries
        }
      } else {
        topLevelFiles++;
        recursiveFiles++;
        // Update progress for file scanning
        if (progressCallback) {
          progressCallback(i + 1, entries.length, `Scanning file: ${entry.name}`);
        }
        // For files, get their stats to add to the total size.
        try {
          const fileStat = await stat(entryPath);
          recursiveSize += fileStat.size;
        } catch (fileError) {
          // Handle individual file access errors gracefully
          if (fileError instanceof Error && fileError.message === "Operation cancelled") {
            throw fileError; // Re-throw cancellation errors
          }
          console.warn(`[fileUtils] Skipping file ${entryPath} due to access error:`, fileError);
          // Continue processing other entries
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Operation cancelled") {
      throw error; // Re-throw cancellation errors
    }

    // Handle different types of file access errors more gracefully
    let errorMessage = "Unknown error";
    let isPermissionError = false;

    if (error instanceof Error) {
      errorMessage = error.message;
      // Check for common permission-related error patterns
      isPermissionError = errorMessage.includes("forbidden") ||
        errorMessage.includes("permission") ||
        errorMessage.includes("access denied") ||
        errorMessage.includes("denied");
    }

    // Log errors but allow the function to return what it has gathered so far.
    if (isPermissionError) {
      console.warn(`[fileUtils] Permission denied accessing directory ${path}: ${errorMessage}`);
    } else {
      console.error(`[fileUtils] Could not read directory ${path}:`, error);
    }
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

    // Handle different types of file access errors more gracefully
    let errorMessage = "Unknown error";
    let isPermissionError = false;

    if (error instanceof Error) {
      errorMessage = error.message;
      // Check for common permission-related error patterns
      isPermissionError = errorMessage.includes("forbidden") ||
        errorMessage.includes("permission") ||
        errorMessage.includes("access denied") ||
        errorMessage.includes("denied");
    }

    if (isPermissionError) {
      console.warn(`[fileUtils] Permission denied getting details for ${path}: ${errorMessage}`);
    } else {
      console.error(`[fileUtils] Error getting details for ${path}:`, error);
    }
    return null;
  }
}
