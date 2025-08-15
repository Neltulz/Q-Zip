## [0.1.15] - 2025-01-27T20:00:00Z

### Changed
- **Version Update**: Incremented patch version from 0.1.14 to 0.1.15-dev
  - Updated version display in `app/components/TitleBar.vue` to `v0.1.15-dev`
  - Frontend-only version update for development feedback

### Added
- **Discord-style Remove Job Confirmation**: Redesigned the remove job dropdown to match Discord's delete message popup layout
  - Added structured header with title and confirmation question
  - Added job preview section showing job icon, title, and file count
  - Added PROTIP section with helpful keyboard shortcut information
  - Improved button layout with Cancel and Remove Job buttons positioned side-by-side at bottom-right
  - Enhanced visual hierarchy and spacing for better UX
  - **Enhanced DropdownMenu Component**: Added support for customizing cancel button theme and styling
  - **Bordered Button Styling**: Updated remove job confirmation to use bordered buttons with proper justification

### Fixed
- **Remove Job UI**: Improved user experience with clearer confirmation dialog layout
- **Remove Job Button Layout**: Fixed button positioning to appear below separator with proper side-by-side layout and fit-content width
- **Remove Job Button Sizing**: Added `flex-grow: 0` to prevent buttons from stretching to fill available space
- **Remove Job Dropdown Refinements**: Made dropdown thinner (240px width), increased tip text size to 14px, changed "PROTIP" to "TIP" with neutral styling, added 35ch max-width to text elements for better readability, centered tip content with auto margins, put "TIP:" on its own line, optimized text wrapping with fit-content width to eliminate empty space, and added premium styling to tip wrapper with gradient background, subtle shadows, and accent border
- **New InfoCard Component**: Created reusable InfoCard component with theme support (primary/success/danger/info/warning), slots for header, content, and icon, and premium styling with gradient backgrounds and accent borders
- **Remove Job Dropdown Width**: Reduced max-width to 45ch for more compact layout and properly fixed padding consistency by applying individual padding to content sections, including InfoCard component with proper margin spacing

### Technical Details
- **Frontend Versioning**: Updated TitleBar component version display for development feedback
- **Hot Reload**: Version change will hot-reload without triggering full Rust rebuild
