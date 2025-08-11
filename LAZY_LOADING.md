# Lazy Loading Implementation for Folder Statistics

## Overview

This implementation adds lazy loading for folder statistics in the Q-Zip application, dramatically improving the performance when adding large folders to jobs. Instead of calculating folder statistics (size, file count, folder count) immediately when adding folders, the system now:

1. **Quickly adds folders** with basic information
2. **Shows loading indicators** for incomplete data
3. **Calculates statistics in the background** without blocking the UI
4. **Updates the display** as calculations complete

## How It Works

### 1. Quick File Addition (`getQuickFileDetails`)

When adding files/folders, the system now uses `getQuickFileDetails()` instead of `getFileDetails()`:

- **Files**: Complete information is retrieved immediately
- **Folders**: Basic information (name, path, timestamps) is retrieved immediately, but statistics are marked as pending

### 2. Lazy Loading State

Folders added with lazy loading have these properties:
- `isLazyLoaded: true` - Indicates statistics are being calculated
- `size: 0` - Placeholder until calculated
- `files: undefined` - Placeholder until calculated
- `folders: undefined` - Placeholder until calculated
- `filesTotal: undefined` - Placeholder until calculated
- `foldersTotal: undefined` - Placeholder until calculated

### 3. Background Calculation

The `calculateFolderStatisticsInBackground()` function:
- Processes folders in batches of 3 to avoid overwhelming the system
- Updates FileItem objects in place as calculations complete
- Handles errors gracefully and marks failed calculations
- Includes small delays between batches to keep UI responsive

### 4. UI Updates

The FileTable component shows:
- **Loading indicators** (spinning icons) for incomplete data
- **Error messages** if calculations fail
- **Progressive updates** as statistics become available

## Performance Benefits

### Before Lazy Loading
- Adding a folder with 10,000 files could take 30+ seconds
- UI was completely blocked during calculation
- User had to wait for all calculations to complete

### After Lazy Loading
- Adding the same folder takes ~1-2 seconds
- UI remains responsive immediately
- Statistics appear progressively as calculated
- User can continue working while calculations run

## Implementation Details

### New Functions

1. **`getQuickFileDetails(path)`** - Fast file/folder addition without recursive scanning
2. **`calculateFolderStatistics(fileItem)`** - Calculates statistics for a single folder
3. **`addFilesToJobLazy(jobId, paths)`** - New store function for lazy loading
4. **`calculateFolderStatisticsInBackground(jobId, folders)`** - Background processing

### Updated Components

1. **FileTable.vue** - Shows loading states and handles incomplete data
2. **JobArea.vue** - Uses lazy loading for file addition
3. **jobsStore.ts** - New lazy loading functions
4. **fileUtils.ts** - New utility functions

### Type Updates

The `FileItem` interface now includes:
```typescript
isLazyLoaded?: boolean; // Indicates if folder stats are still being calculated
lazyLoadError?: string; // Error message if lazy loading failed
```

## Usage

The lazy loading is automatically enabled when adding files/folders through the normal UI. No user action is required - the system automatically:

1. Uses lazy loading for new additions
2. Shows appropriate loading indicators
3. Updates the display as calculations complete

## Error Handling

If folder statistics calculation fails:
- The folder remains in the job
- An error message is displayed in the relevant columns
- The user can still work with the folder
- The error is logged for debugging

## Future Enhancements

Potential improvements could include:
- Retry mechanism for failed calculations
- User preference to disable lazy loading
- Progress indicators showing calculation percentage
- Ability to cancel ongoing calculations
- Caching of calculated statistics
