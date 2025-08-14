# Assistant Context for Q-Zip Project

## Project Overview
Q-Zip is a Tauri-based desktop application for file compression and archiving, built with Nuxt.js/Vue.js frontend and Rust backend.

### Technology Stack Versions
- **Nuxt**: ^4.0.1
- **Vue**: ^3.5.15
- **Tauri**: 2.7.0
- **Rust**: 1.77.2
- **Package Manager**: pnpm@10.13.1
- **IDE**: Cursor v1.4.3 (based on VS Code v1.99.3)

## Core Directives & Unbreakable Rules
- **List All Files:** Always list ALL files that need to be modified
- **Preserve & Update Comments:** Preserve overall structure of file-top comments (including `@preserve` and ESLint directives), but update descriptive content to reflect code modifications
- **Provide Full Code:** Always provide complete code for modified files, not just snippets
- **Skip Unchanged Files:** Do not include files that were not modified
- **Update Changelog:** Update the changelog (create one if it doesn't exist) using markdown
  - **Changelog Limit:** Keep only the most recent 20 versions in the changelog
  - **Archive Old Versions:** When adding a new version that would exceed 20 entries, remove the oldest version entry
  - **Format:** Use consistent markdown formatting with version numbers, dates, and categorized changes
  - **Date Format:** Use ISO 8601 standard with Zulu time (e.g., `2025-08-14T14:00:00Z`)
  - **Time Conversion:** Convert local time to UTC/Zulu time (CST = UTC-6, CDT = UTC-5)

## When Making Changes
1. **ALWAYS increment the version number** - Increment the third number (patch version) in:
   - `src-tauri/Cargo.toml` - `version = "0.1.X"`
   - `app/components/TitleBar.vue` - `<span class="ver-num">v0.1.X</span>`
   - `src-tauri/tauri.conf.json` - `"version": "0.1.X",`
   - `src-tauri/tauri.conf.json` - `"title": "Q-Zip v0.1.X",` (window title)
2. Check existing similar components for patterns
3. Follow the established file organization
4. Use HSL/HSLA colors exclusively
5. Maintain TypeScript type safety - Avoid using `any` type, prefer proper type definitions and generics
6. Test changes in the context of the full application

## Code Style Guidelines

### CSS/SCSS
- **Color Format**: Use HSL/HSLA instead of RGB/RGBA for all color definitions
- **CSS Nesting**: Use native CSS nesting wherever possible instead of preprocessor nesting
- **Logical Properties**: Use logical CSS properties (e.g., `margin-inline`, `padding-block`, `border-inline-start`) instead of physical properties (e.g., `margin-left`, `padding-top`, `border-left`)
- **Nested Selectors**: Prefix nested selectors like `:has`, `:disabled`, or `:deep` with ampersand (`&`)
  - Correct: `&.some-class`, `&:deep(.child)`
  - Incorrect: `.some-class`, `:deep(.child)`
- **Property Organization**: Alphabetize CSS properties, but ignore CSS variables inside `:root {}` blocks
- **CSS Variables**: Place CSS variables at the top of a rule, followed by an empty line
- **Individual Properties**: Use individual logical properties instead of shorthands for multi-value properties (e.g., use `border-start-start-radius`, not `border-radius: 0 4px 4px 0`)
- **Component Styling**: Use scoped CSS files for component-specific styles
- **Global Styles**: Use global CSS files for shared styles

### Vue.js Components
- Use Composition API with `<script setup>` syntax
- Follow Vue 3 best practices
- Use TypeScript for type safety
- Organize components in logical folders with descriptive names
- **Attribute Order**: Respect `vue/attributes-order` (e.g., `:disabled` attribute should go before `@click`)
- **Attribute Naming**: Hyphenate all attributes (e.g., use `input-type`, not `inputType`)
- **Props Usage**: Use `defineProps<...>()` directly to avoid unused variable warnings. Only use `const props = defineProps<...>()` when the `props` variable is explicitly accessed within the `<script>` block
- **Self-closing Tags**: Use self-closing tags for empty elements (e.g., `<div />`)
- **Nuxt Auto-imports**: Nuxt auto-imports components; do not add component import statements

### File Organization
- Keep component-specific styles in separate `.scoped.css` files
- Use descriptive folder names (e.g., `file-table-comp/`, `job-area-comp/`)
- Store configuration files in `assets/config/`
- Use composables for shared logic in `composables/`
- Use Nuxt.js directory structure (no `src` folder)
- For Nuxt plugins, import from `"nuxt/app"`, not `"#app"`

## Development Workflow
- Always check existing file structure before creating new files
- Follow the established patterns in the codebase
- Use the existing store structure (Pinia) for state management
- Maintain consistency with existing UI components and styling
- Use `pnpm` for all package management commands
- Provide PowerShell commands when applicable; do not use CMD

## Important Notes
- This is a Tauri application with both frontend (Vue/Nuxt) and backend (Rust) components
- Follow the existing modal and notification patterns
- Respect the established theme and UI design system
- Do not add `"tauri": {}` to `tauri.conf.json` (invalid for v2.5.0)

## TypeScript Guidelines
- Use TypeScript, not JavaScript
- Provide explicit types for all new variables and functions
- To prevent `@typescript-eslint/no-unused-vars` errors, all unused function arguments MUST be prefixed with an underscore (e.g., `_event`)
- Avoid using `any` type, prefer proper type definitions and generics

## Pinia Store Guidelines
- **Store Unification**: All Pinia stores MUST use a consistent structure to prevent type-inference failures
- **Persistence**: State persistence MUST be handled exclusively by `pinia-plugin-persistedstate` via the `persist: true` option
- **Prohibited Libraries**: Do NOT use `@vueuse/core`'s `useStorage` or any other library for store persistence. Using multiple persistence mechanisms within the project has been identified as the root cause of critical type-safety errors

