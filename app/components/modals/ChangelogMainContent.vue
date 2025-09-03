<!--
  ChangelogMainContent.vue @preserve
-->
<!-- components/modals/ChangelogMainContent.vue -->
<!--
  ChangelogMainContent.vue @preserve
-->
<template>
  <div class="changelog-content-area">
    <div class="changelog-entries">
      <!-- Dynamic version entries -->
      <template v-for="(version, versionKey) in currentVersionData" :key="versionKey">
        <div class="version-entry">
          <h3 class="version-title">{{ version.title }}</h3>

          <div v-if="version.fixed && version.fixed.length > 0 && version.fixed[0] !== 'Development work in progress...'" class="changelog-section">
            <h4 class="section-title">🔧 Fixed</h4>
            <ul class="changelog-list">
              <li v-for="item in version.fixed" :key="item">{{ item }}</li>
            </ul>
          </div>

          <div v-if="version.added && version.added.length > 0 && version.added[0] !== 'Development work in progress...'" class="changelog-section">
            <h4 class="section-title">✨ Added</h4>
            <ul class="changelog-list">
              <li v-for="item in version.added" :key="item">{{ item }}</li>
            </ul>
          </div>

          <div v-if="version.changed && version.changed.length > 0 && version.changed[0] !== 'Development work in progress...'" class="changelog-section">
            <h4 class="section-title">🔄 Changed</h4>
            <ul class="changelog-list">
              <li v-for="item in version.changed" :key="item">{{ item }}</li>
            </ul>
          </div>

          <div v-if="version.technical && version.technical.length > 0 && version.technical[0] !== 'Development work in progress...'" class="changelog-section">
            <h4 class="section-title">🔧 Technical Details</h4>
            <ul class="changelog-list">
              <li v-for="item in version.technical" :key="item">{{ item }}</li>
            </ul>
          </div>
        </div>
      </template>
    </div>

    <div class="changelog-footer">
      <p>For the complete changelog history, visit our GitHub repository.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

// Component props
const props = defineProps<{
  selectedVersion?: string;
}>();

// Version data - in a real app, this could come from an API or file
const versionData = {
  "0.1.24": {
    title: "## [0.1.24] - 2025-01-27T23:00:00Z",
    fixed: [
      "Disabled Button Tooltip Styling: Fixed tooltip keyboard shortcuts to display in neutral colors when the associated button is disabled, indicating the shortcut is inaccessible",
      "Disabled Button Hover Effects: Fixed issue where disabled buttons still showed hover background effects by adding proper :not(:disabled):not(.disabled) selectors to all hover states",
      "FileTableToolbar Disabled Button Hover: Fixed hover effects on disabled buttons in FileTableToolbar (Remove Selected, Copy to, Move to) by adding specific CSS rules to prevent background color changes on hover",
      "Input Blur Handling: Improved input blur handling in CustomFieldNew component for better user experience",
      "ESC Key Conflict: Fixed issue where pressing ESC would close one dropdown but immediately open another dropdown from FileTableLoadingOverlay by preventing the cancel dropdown from opening when other dropdowns are present",
      "ESC Key Hierarchy: Implemented proper ESC key behavior hierarchy",
      "ESC Key Timing: Added 10ms delay to prevent cancel dropdown from opening immediately after other dropdowns are closed"
    ],
    added: [
      "Windows Long Paths Detection: Implemented automatic detection of Windows long paths support and enhanced path length warnings for better user guidance",
      "Path Length Warnings: Added comprehensive path length validation with helpful warnings and instructions for enabling long paths on Windows",
      "Enhanced CompressionSection: Significantly improved CompressionSection with Global and Job-specific settings tabs, advanced output controls, and better auto-determination logic",
      "Enhanced CustomFieldNew Component: Major improvements including floating labels, clear functionality, spellcheck support, and better styling",
      "FileTable Keyboard Shortcuts: Added comprehensive keyboard shortcut support for FileTable toolbar actions",
      "Toolbar Button Shortcuts: Added keyboard shortcut display to toolbar buttons",
      "Enhanced Debug Options: Integrated nuxt-color-picker and added comprehensive debug features",
      "Dropdown Container Management: Implemented improved dropdown container management and enhanced teleport functionality"
    ],
    changed: [
      "CompressionSection Refactoring: Major refactoring for improved auto-determination and UI enhancements",
      "CustomFieldNew Optimizations: Cleaned up component by removing debug logs and optimizing event handling",
      "Debug Popup Improvements: Enhanced debug popup with better tab organization and comprehensive logging controls",
      "FileTable Enhancements: Improved FileTable and JobArea keyboard handling with enhanced debug logging",
      "Component Styling: Updated multiple components with improved layout and visual consistency"
    ],
    technical: [
      "Component Architecture: Enhanced component architecture with better separation of concerns and improved maintainability",
      "Performance Optimizations: Implemented various performance optimizations including memoization and optimized rendering",
      "Error Handling: Improved error handling throughout the application with better user feedback",
      "Accessibility: Enhanced keyboard navigation and accessibility features across components",
      "Code Quality: Cleaned up debug logs, optimized event handling, and improved code organization"
    ]
  },
  "0.1.23": {
    title: "## [0.1.23] - 2025-01-27T23:00:00Z",
    fixed: ["Development work in progress..."],
    added: [
      "Enhanced Debug Popup: Significantly improved the debug popup with comprehensive logging controls",
      "FileTableToolbar Tooltips: Added comprehensive tooltip support to all buttons in the FileTableToolbar",
      "InfoTooltip Usage Guidelines: Created comprehensive rule file for consistent tooltip implementation"
    ],
    changed: ["Development work in progress..."],
    technical: ["Development work in progress..."]
  }
};

// Computed property to get the current version data
const currentVersionData = computed(() => {
  const selected = props.selectedVersion || '0.1.24';
  if (selected === 'all') {
    return {
      "0.1.24": versionData["0.1.24"],
      "0.1.23": versionData["0.1.23"]
    };
  }
  return { [selected]: versionData[selected as keyof typeof versionData] };
});
</script>

<style scoped>
.changelog-content-area {
  padding: 1rem;
  height: 100%;
}

.changelog-entries {
  margin-bottom: 2rem;
}

.version-entry {
  margin-bottom: 2rem;
}

.version-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--primary-clr);
  margin: 0 0 1.5rem 0;
  padding: 0.75rem 1rem;
  background-color: var(--bg-clr-dark);
  border-radius: 8px;
  border-left: 4px solid var(--primary-clr);
}

.changelog-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-clr);
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.changelog-list {
  margin: 0;
  padding-left: 1.5rem;
  list-style: none;
}

.changelog-list li {
  margin-bottom: 0.75rem;
  line-height: 1.6;
  color: var(--text-clr-muted);
  position: relative;
}

.changelog-list li::before {
  content: "•";
  position: absolute;
  left: -1rem;
  color: var(--primary-clr);
  font-weight: bold;
}

.changelog-list li strong {
  color: var(--text-clr);
  font-weight: 600;
}

.changelog-list li code {
  background-color: var(--bg-clr-dark);
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
  color: var(--accent-clr);
}

.changelog-footer {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--brdr-clr);
  text-align: center;
}

.changelog-footer p {
  margin: 0;
  color: var(--text-clr-muted);
  font-size: 0.9rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .changelog-content-area {
    padding: 0.75rem;
  }

  .version-title {
    font-size: 1.2rem;
    padding: 0.5rem 0.75rem;
  }

  .section-title {
    font-size: 1rem;
  }

  .changelog-list {
    padding-left: 1.25rem;
  }

  .changelog-list li {
    font-size: 0.9rem;
  }
}
</style>
