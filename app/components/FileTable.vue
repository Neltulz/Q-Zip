<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/FileTable.vue @preserve -->

<!--
  RECOMMENDATIONS FOR IMPROVEMENT:

  1. COMPONENT DECOMPOSITION
     - Break into smaller, focused components:
       * FileTableHeader.vue (sorting, column resizing)
       * FileTableRow.vue (individual row rendering)
       * FileTableToolbar.vue (add/remove/move/copy actions)
       * FileTableContextMenu.vue (right-click menu)
     - Current component is 1145 lines and handles too many responsibilities

  2. PERFORMANCE OPTIMIZATIONS
     - Add memoization for expensive computations (sortedFiles, columnStyles)
     - Use useMemo or similar for sorting operations
     - Optimize large template with many conditional renders
     - Consider lazy loading for context menus

  3. ERROR HANDLING
     - Add comprehensive error handling for file operations
     - Implement loading states for individual operations
     - Add error boundaries for component failures
     - Handle edge cases (empty states, network failures)

  4. TESTING
     - Implement comprehensive unit tests for complex interactions
     - Test virtual scrolling with large datasets
     - Test drag & drop functionality
     - Test keyboard navigation and accessibility
     - Add integration tests for file operations

  5. DOCUMENTATION
     - Add JSDoc comments for complex functions
     - Document component props and events
     - Add usage examples and best practices
     - Document performance considerations

  6. ACCESSIBILITY
     - Add more ARIA labels and descriptions
     - Improve keyboard navigation (Tab, Arrow keys)
     - Add screen reader announcements for state changes
     - Ensure proper focus management
     - Add high contrast mode support
-->

<template>
  <div
    ref="fileTableCompRef"
    class="file-table-comp"
  :class="{
      'is-dragging': isDragging || dragDropStore.isInternalDragActive,
      'is-active': isActive && allowActivation,
      'is-scrolling': isScrolling,
      'is-marquee-dragging': isMarqueeActive,
    }"
    :style="Object.assign({}, columnStyles, fileTableRootStyle)"
    data-component-name="FileTable"
    @click="handleRootClick"
  >
    <!-- Full-screen transparent blocker to prevent interaction with outside UI while marquee drag is active -->
    <div v-if="isMarqueeActive" class="marquee-blocker" aria-hidden="true"></div>
    <!-- Loading backdrop shown while the file table is loading. It reserves the
         component's height so surrounding modals/dialogs don't jump when the
         table finishes loading. -->
    <div
      v-if="props.isLoading"
      class="file-table-loading-backdrop"
      :style="loadingBackdropStyle"
      aria-hidden="true"
    >
      <div class="file-table-loading-box">
        <LoadingAnim :visible="true" />
      </div>
    </div>
    <div class="file-table-visual-select" />
    <LoadingAnim :visible="props.isLoading" @cancel="$emit('cancel-load')"> Adding files, please wait... </LoadingAnim>
    <ToolBar v-if="props.showToolbar" class="file-table-toolbar">
      <template #start>
        <!-- Lazy Loading Progress Indicator -->
        <div v-if="lazyLoadingProgress.remaining > 0" class="lazy-loading-progress">
          <LoadingDots :visible="true" />
          <span class="progress-text">
            Calculating folder stats... {{ lazyLoadingProgress.completed }}/{{ lazyLoadingProgress.total }}
          </span>
        </div>
        
        <DropdownMenu
          button-style-class="trans-btn"
          dropdown-data-name="add-files-and-folders-dropdown"
          first-icon-name="mdi:add"
          :first-icon-size="20"
          last-icon-name="mdi:chevron-down"
          :last-icon-size="20"
        >
          <template #button-content> Add... </template>
          <template #default="{ close }">
            <CustomButton
              button-style-class="trans-btn"
              first-icon-name="mdi:file-outline"
              :first-icon-size="20"
              data-name="add-files-btn"
              @click="handleAddFile(close)"
            >
              Add File
            </CustomButton>
            <CustomButton
              button-style-class="trans-btn"
              first-icon-name="mdi:folder"
              :first-icon-size="20"
              data-name="add-folders-btn"
              @click="handleAddFolder(close)"
            >
              Add Folder
            </CustomButton>
          </template>
        </DropdownMenu>

        <CustomButton
          button-style-class="trans-btn"
          data-btn-theme="danger"
          data-name="remove-selected-files-btn"
          :disabled="selectedFiles.length === 0"
          first-icon-name="mdi:remove"
          :first-icon-size="20"
          @click.stop="removeSelectedFiles"
        >
          Remove Selected
        </CustomButton>
        <DropdownMenu
          button-style-class="trans-btn"
          dropdown-data-name="copy-to-job-dropdown"
          :disabled="selectedFiles.length === 0"
          first-icon-name="mdi:content-copy"
          :first-icon-size="20"
          last-icon-name="mdi:chevron-down"
          :last-icon-size="20"
          placement="bottom-start"
        >
          <template #button-content> Copy to </template>
          <template #default="{ close }">
            <CustomButton
              v-for="job in jobs.filter((j: Job) => j.id !== props.jobId)"
              :key="job.id"
              button-style-class="trans-btn"
              :data-name="`copy-to-job-${job.id}-btn`"
              first-icon-name="mdi:briefcase"
              :first-icon-size="20"
              @click="
                () => {
                  copyToJob(job.id);
                  close();
                }
              "
            >
              Job {{ job.id }}
            </CustomButton>
          </template>
          <template #content-bottom="{ close }">
            <hr v-if="jobs.filter((j) => j.id !== props.jobId).length > 0" />
            <CustomButton
              button-style-class="trans-btn"
              data-name="copy-to-new-job-btn"
              first-icon-name="mdi:plus"
              :first-icon-size="20"
              @click="
                () => {
                  copyToNewJob();
                  close();
                }
              "
            >
              New Job
            </CustomButton>
            <hr />
            <CustomButton
              button-style-class="trans-btn btn-lite"
              data-name="cancel-copy-to-btn"
              first-icon-name="mdi:cancel"
              :first-icon-size="20"
              shortcut-text="Esc"
              @click="close()"
            >
              Cancel
            </CustomButton>
          </template>
        </DropdownMenu>
        <DropdownMenu
          button-style-class="trans-btn"
          dropdown-data-name="move-to-job-dropdown"
          :disabled="selectedFiles.length === 0"
          first-icon-name="mdi:arrow-right"
          :first-icon-size="20"
          last-icon-name="mdi:chevron-down"
          :last-icon-size="20"
          placement="bottom-start"
        >
          <template #button-content> Move to </template>
          <template #default="{ close }">
            <CustomButton
              v-for="job in jobs.filter((j: Job) => j.id !== props.jobId)"
              :key="job.id"
              button-style-class="trans-btn"
              :data-name="`move-to-job-${job.id}-btn`"
              first-icon-name="mdi:briefcase"
              :first-icon-size="20"
              @click="
                () => {
                  moveToJob(job.id);
                  close();
                }
              "
            >
              Job {{ job.id }}
            </CustomButton>
          </template>
          <template #content-bottom="{ close }">
            <hr v-if="jobs.filter((j) => j.id !== props.jobId).length > 0" />
            <CustomButton
              button-style-class="trans-btn"
              data-name="move-to-new-job-btn"
              first-icon-name="mdi:plus"
              :first-icon-size="20"
              @click="
                () => {
                  moveToNewJob();
                  close();
                }
              "
            >
              New Job
            </CustomButton>
            <hr />
            <CustomButton
              button-style-class="trans-btn btn-lite"
              data-name="cancel-move-to-btn"
              first-icon-name="mdi:cancel"
              :first-icon-size="20"
              shortcut-text="Esc"
              @click="close()"
            >
              Cancel
            </CustomButton>
          </template>
        </DropdownMenu>
      </template>
    </ToolBar>

    <OverlayScrollbarsComponent
      ref="scrollComponentRef"
      class="table-scroll-wrapper"
      :options="{
        scrollbars: {
          visibility: 'auto',
          autoHide: 'never',
          autoHideSuspend: true,
          theme: currentTheme,
        },
      }"
      @os-scroll="handleScroll"
      @mousedown="handleComponentMouseDown"
    >
      <div class="table-content-wrapper" :style="tableContentStyle">
        <!-- Header is now INSIDE the scroll wrapper to scroll horizontally -->
        <div class="table-header">
          <div v-if="props.showCheckboxes" class="item-checkbox">
            <CustomButton
              button-style-class="minimal-trans-btn"
              data-name="select-all-files-checkbox"
              role="checkbox"
              :aria-checked="allSelected ? 'true' : 'false'"
              @click="toggleAll"
            >
              <Icon :name="allSelected ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'" size="16" />
            </CustomButton>
            <div class="resizer" @mousedown.stop="startResize($event, 'checkbox')"></div>
          </div>
          <div class="item-name" @click="handleSort('name')">
            <span class="header-text">Name</span>
            <span v-if="sortKey === 'name'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
            <div class="resizer" @mousedown.stop="startResize($event, 'name')"></div>
          </div>
          <div class="item-size" @click="handleSort('size')">
            <span class="header-text">Size (MB)</span>
            <span v-if="sortKey === 'size'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
            <div class="resizer" @mousedown.stop="startResize($event, 'size')"></div>
          </div>
          <div class="item-ext" @click="handleSort('type')">
            <span class="header-text">Ext</span>
            <span v-if="sortKey === 'type'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
            <div class="resizer" @mousedown.stop="startResize($event, 'ext')"></div>
          </div>
          <div class="item-modified" @click="handleSort('modified')">
            <span class="header-text">Modified</span>
            <span v-if="sortKey === 'modified'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
            <div class="resizer" @mousedown.stop="startResize($event, 'modified')"></div>
          </div>
          <div class="item-created" @click="handleSort('created')">
            <span class="header-text">Creation Date</span>
            <span v-if="sortKey === 'created'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
            <div class="resizer" @mousedown.stop="startResize($event, 'created')"></div>
          </div>
          <div class="item-files" @click="handleSort('files')">
            <span class="header-text">Files</span>
            <span v-if="sortKey === 'files'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
            <div class="resizer" @mousedown.stop="startResize($event, 'files')"></div>
          </div>
          <div class="item-folders" @click="handleSort('folders')">
            <span class="header-text">Folders</span>
            <span v-if="sortKey === 'folders'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
            <div class="resizer" @mousedown.stop="startResize($event, 'folders')"></div>
          </div>
          <div class="item-files-total" @click="handleSort('filesTotal')">
            <span class="header-text">Files (Total)</span>
            <span v-if="sortKey === 'filesTotal'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
            <div class="resizer" @mousedown.stop="startResize($event, 'filesTotal')"></div>
          </div>
          <div class="item-folders-total" @click="handleSort('foldersTotal')">
            <span class="header-text">Folders (Total)</span>
            <span v-if="sortKey === 'foldersTotal'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
            <div class="resizer" @mousedown.stop="startResize($event, 'foldersTotal')"></div>
          </div>
          <div class="item-parent-path" @click="handleSort('parentPath')">
            <span class="header-text">Parent Folder Path</span>
            <span v-if="sortKey === 'parentPath'" class="sort-indicator">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
            <div class="resizer" @mousedown.stop="startResize($event, 'parentPath')"></div>
          </div>
          <!-- spacer column removed: we no longer render an empty right-hand buffer column -->
        </div>

        <!-- Local selection box: updated directly via DOM to avoid reactive writes every frame -->
        <div ref="localSelectionBox" class="selection-box" style="display: none" />

        <!-- debug hotzones removed -->

        <!-- Spacer for Virtual Scroll -->
        <div class="virtual-scroll-spacer" :style="{ height: `${totalHeight}px` }">
          <!-- Content container for visible rows -->
          <div class="virtual-scroll-content" :style="{ transform: `translateY(${contentOffsetY}px)` }">
            <template v-for="file in visibleFiles" :key="file.path">
              <div
                class="table-row"
                :class="{
                  selected: selectedFiles.includes(file.path),
                  'preview-selected': isMarqueeActive && marqueePreviewSelection.includes(file.path),
                  'is-cut': cutFiles.includes(file.path) && jobId === cutSourceJobId,
                  'is-folder': file.type === 'Folder',
                }"
                :data-path="file.path"
                data-has-context-menu="true"
                @click="clickRowByPath($event, file.path)"
                @contextmenu.prevent.stop="showFileContextMenu(file, $event)"
              >
                <!-- Checkbox Cell -->
                <div v-if="props.showCheckboxes" class="item-checkbox">
                  <CustomButton
                    button-style-class="minimal-trans-btn"
                    :data-name="`select-file-${file.path}`"
                    role="checkbox"
                    :aria-checked="selectedFiles.includes(file.path) ? 'true' : 'false'"
                    @click.stop="toggleFileSelection(file.path)"
                  >
                    <Icon
                      :name="selectedFiles.includes(file.path) ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'"
                      size="16"
                    />
                  </CustomButton>
                </div>
                <!-- Name Cell -->
                <div class="item-name">
                  <div
                    class="item-name-content"
                    :draggable="props.itemDragEnabled"
                    @dragstart="handleDragStart($event, file.path)"
                    @dragend="handleDragEnd"
                  >
                    <Icon :name="file.type === 'Folder' ? 'mdi:folder' : 'mdi:file-outline'" size="16" />
                    <span class="cell-text">{{ file.name }}</span>
                  </div>
                  <div v-if="props.showRowActions" class="row-actions" @click.stop>
                    <DropdownMenu
                      :ref="(el) => setFileMenuRef(file, el)"
                      :button-style-class="'trans-btn'"
                      :dropdown-data-name="`file-actions-${file.path}`"
                      :first-icon-name="''"
                      :last-icon-name="'mdi:dots-horizontal'"
                      :last-icon-size="20"
                      placement="bottom-start"
                    >
                      <template #default="{ close: closeMain }">
                        <CustomButton
                          button-style-class="trans-btn"
                          data-btn-theme="danger"
                          :data-name="`remove-file-${file.path}-btn`"
                          first-icon-name="mdi:trash-can-outline"
                          :first-icon-size="20"
                          shortcut-text="Del"
                          @click="
                            () => {
                              removeFile(file.path);
                              closeMain();
                            }
                          "
                        >
                          Remove
                        </CustomButton>
                        <hr />
                        <DropdownMenu
                          :button-style-class="'trans-btn'"
                          :dropdown-data-name="`copy-file-${file.path}-submenu`"
                          :first-icon-name="'mdi:content-copy'"
                          :first-icon-size="20"
                          :is-submenu="true"
                          :last-icon-name="'mdi:chevron-right'"
                          :last-icon-size="20"
                          placement="right-start"
                        >
                          <template #button-content>Copy to</template>
                          <template #default="{ close: closeSub }">
                            <CustomButton
                              v-for="job in jobs.filter((j: Job) => j.id !== props.jobId)"
                              :key="job.id"
                              button-style-class="trans-btn"
                              :data-name="`copy-file-${file.path}-to-job-${job.id}-btn`"
                              first-icon-name="mdi:briefcase"
                              :first-icon-size="20"
                              @click="
                                () => {
                                  copyFile(job.id, file.path);
                                  closeSub();
                                  closeMain();
                                }
                              "
                            >
                              Job {{ job.id }}
                            </CustomButton>
                          </template>
                          <template #content-bottom="{ close: closeSub }">
                            <hr v-if="jobs.filter((j) => j.id !== props.jobId).length > 0" />
                            <CustomButton
                              button-style-class="trans-btn"
                              data-name="copy-to-new-job-btn"
                              first-icon-name="mdi:plus"
                              :first-icon-size="20"
                              @click="
                                () => {
                                  copyFileToNewJob(file.path);
                                  closeSub();
                                  closeMain();
                                }
                              "
                            >
                              New Job
                            </CustomButton>
                          </template>
                        </DropdownMenu>
                        <DropdownMenu
                          :button-style-class="'trans-btn'"
                          :dropdown-data-name="`move-file-${file.path}-submenu`"
                          :first-icon-name="'mdi:arrow-right'"
                          :first-icon-size="20"
                          :is-submenu="true"
                          :last-icon-name="'mdi:chevron-right'"
                          :last-icon-size="20"
                          placement="right-start"
                        >
                          <template #button-content>Move to</template>
                          <template #default="{ close: closeSub }">
                            <CustomButton
                              v-for="job in jobs.filter((j: Job) => j.id !== props.jobId)"
                              :key="job.id"
                              button-style-class="trans-btn"
                              :data-name="`move-file-${file.path}-to-job-${job.id}-btn`"
                              first-icon-name="mdi:briefcase"
                              :first-icon-size="20"
                              @click="
                                () => {
                                  moveFile(job.id, file.path);
                                  closeSub();
                                  closeMain();
                                }
                              "
                            >
                              Job {{ job.id }}
                            </CustomButton>
                          </template>
                          <template #content-bottom="{ close: closeSub }">
                            <hr v-if="jobs.filter((j) => j.id !== props.jobId).length > 0" />
                            <CustomButton
                              button-style-class="trans-btn"
                              data-name="move-to-new-job-btn"
                              first-icon-name="mdi:plus"
                              :first-icon-size="20"
                              @click="
                                () => {
                                  moveFileToNewJob(file.path);
                                  closeSub();
                                  closeMain();
                                }
                              "
                            >
                              New Job
                            </CustomButton>
                          </template>
                        </DropdownMenu>
                        <hr />
                        <CustomButton
                          button-style-class="trans-btn btn-lite"
                          :data-name="`cut-file-${file.path}-btn`"
                          first-icon-name="mdi:content-cut"
                          :first-icon-size="20"
                          shortcut-text="Ctrl+X"
                          @click="() => { performCutFor(file.path); closeMain(); }"
                        >
                          Cut
                        </CustomButton>
                        <CustomButton
                          button-style-class="trans-btn btn-lite"
                          :data-name="`copy-file-${file.path}-btn`"
                          first-icon-name="mdi:content-copy"
                          :first-icon-size="20"
                          shortcut-text="Ctrl+C"
                          @click="() => { performCopyFor(file.path); closeMain(); }"
                        >
                          Copy
                        </CustomButton>
                        <CustomButton
                          button-style-class="trans-btn btn-lite"
                          :data-name="`paste-file-${file.path}-btn`"
                          first-icon-name="mdi:content-paste"
                          :first-icon-size="20"
                          shortcut-text="Ctrl+V"
                          :disabled="!clipboardStore.hasClipboardItems()"
                          @click="
                            () => {
                              if (clipboardStore.isCut) {
                                moveFile(jobId, file.path);
                              } else {
                                copyFile(jobId, file.path);
                              }
                              closeMain();
                            }
                          "
                        >
                          Paste
                        </CustomButton>
                        <hr />
                        <CustomButton
                          button-style-class="trans-btn btn-lite"
                          :data-name="`cancel-file-action-${file.path}-btn`"
                          first-icon-name="mdi:cancel"
                          :first-icon-size="20"
                          shortcut-text="Esc"
                          @click="closeMain()"
                        >
                          Cancel
                        </CustomButton>
                      </template>
                    </DropdownMenu>
                  </div>
                </div>
                <!-- Other Cells -->
                <div class="item-size">
                  <div
                    v-if="!file.isLazyLoaded"
                    class="size-bar"
                    :class="file.type === 'Folder' ? 'size-bar-folder' : 'size-bar-file'"
                    :style="{
                      inlineSize: `${(file.size / (file.type === 'Folder' ? maxFolderSizeInJob : maxFileSizeInJob)) * 100}%`,
                    }"
                  ></div>
                  <span class="cell-text">
                    <span v-if="file.isLazyLoaded" class="lazy-loading-indicator">
                      <LoadingDots :visible="true" />
                      Calculating...
                    </span>
                    <span v-else-if="file.lazyLoadError" class="lazy-load-error">
                      Error: {{ file.lazyLoadError }}
                    </span>
                    <span v-else>{{ formatBytes(file.size) }} MB</span>
                  </span>
                </div>
                <div class="item-ext">
                  <span class="cell-text">{{ file.type }}</span>
                </div>
                <div class="item-modified">
                  <div
                    v-if="file.modified"
                    class="date-bar"
                    :style="{
                      inlineSize: `${normalizeTimestamp(
                        file.modified,
                        file.type === 'Folder' ? minMaxFolderModified : minMaxFileModified
                      )}%`,
                    }"
                  ></div>
                  <span class="cell-text">{{ file.modified ? formatModifiedDate(file.modified) : "---" }}</span>
                </div>
                <div class="item-created">
                  <div
                    v-if="file.created"
                    class="date-bar"
                    :style="{
                      inlineSize: `${normalizeTimestamp(
                        file.created,
                        file.type === 'Folder' ? minMaxFolderCreated : minMaxFileCreated
                      )}%`,
                    }"
                  ></div>
                  <span class="cell-text">{{ file.created ? formatCreationDate(file.created) : "---" }}</span>
                </div>
                <div class="item-files">
                  <span v-if="file.type === 'Folder'" class="cell-text">
                    <span v-if="file.isLazyLoaded" class="lazy-loading-indicator">
                      <LoadingDots :visible="true" />
                    </span>
                    <span v-else-if="file.lazyLoadError">---</span>
                    <span v-else>{{ file.files ?? "---" }}</span>
                  </span>
                </div>
                <div class="item-folders">
                  <span v-if="file.type === 'Folder'" class="cell-text">
                    <span v-if="file.isLazyLoaded" class="lazy-loading-indicator">
                      <LoadingDots :visible="true" />
                    </span>
                    <span v-else-if="file.lazyLoadError">---</span>
                    <span v-else>{{ file.folders ?? "---" }}</span>
                  </span>
                </div>
                <div class="item-files-total">
                  <span v-if="file.type === 'Folder'" class="cell-text">
                    <span v-if="file.isLazyLoaded" class="lazy-loading-indicator">
                      <LoadingDots :visible="true" />
                    </span>
                    <span v-else-if="file.lazyLoadError">---</span>
                    <span v-else>{{ file.filesTotal ?? "---" }}</span>
                  </span>
                </div>
                <div class="item-folders-total">
                  <span v-if="file.type === 'Folder'" class="cell-text">
                    <span v-if="file.isLazyLoaded" class="lazy-loading-indicator">
                      <LoadingDots :visible="true" />
                    </span>
                    <span v-else-if="file.lazyLoadError">---</span>
                    <span v-else>{{ file.foldersTotal ?? "---" }}</span>
                  </span>
                </div>
                <div class="item-parent-path">
                  <span class="cell-text">{{ file.parentPath }}</span>
                </div>
                <!-- right-side spacer removed -->
              </div>
            </template>
          </div>
        </div>
      </div>
    </OverlayScrollbarsComponent>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUpdate, reactive, onUnmounted, onMounted, onUpdated, nextTick } from "vue";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import { useThemeStore } from "@/stores/themeStore";
import { useDragDropStore } from "@/stores/dragDropStore";
import { useUiStore } from "@/stores/uiStore";
import type { FileItem } from "@/types/types";
import DropdownMenu from "./DropdownMenu.vue";
import { logDragDropEvent, logLifecycle, logRendering, logUI, logMarqueeSelection } from "@/utils/loggers";
import { useJobsStore, type Job } from "@/stores/jobsStore";
import { useClipboardStore } from "@/stores/clipboardStore";
import { open } from "@tauri-apps/plugin-dialog";
import LoadingAnim from "@/components/LoadingAnim.vue";
import LoadingDots from "@/components/LoadingDots.vue";

// --- VIRTUAL SCROLLING CONSTANTS ---
const ROW_HEIGHT = 35;
const BUFFER_ROWS = 10;

const props = withDefaults(
  defineProps<{
    jobId: number;
    files: FileItem[];
    isDragging: boolean;
    isLoading: boolean;
    cutFiles: string[];
    cutSourceJobId: number | null;
    showToolbar?: boolean;
    showCheckboxes?: boolean;
    showRowActions?: boolean;
    isSelectable?: boolean;
    fixedHeaders?: boolean;
    itemDragEnabled?: boolean;
    marqueeSelectionEnabled?: boolean;
  }>(),
  {
    showToolbar: true,
    showCheckboxes: true,
    showRowActions: true,
    isSelectable: true,
    fixedHeaders: true,
    itemDragEnabled: true,
    activatable: true,
    marqueeSelectionEnabled: true,
  }
);

const emit = defineEmits([
  "selection-changed",
  "remove-files",
  "move-files",
  "move-to-new-job",
  "copy-files",
  "copy-to-new-job",
  "add-files",
  "add-folders",
  "cancel-load",
]);

const themeStore = useThemeStore();
const jobsStore = useJobsStore();
const dragDropStore = useDragDropStore();
const clipboardStore = useClipboardStore();
const uiStore = useUiStore();

const scrollComponentRef = ref<InstanceType<typeof OverlayScrollbarsComponent> | null>(null);
const viewportRef = ref<HTMLElement | null>(null);
const fileTableCompRef = ref<HTMLElement | null>(null);
const fileMenuRefs = ref(new Map<string, InstanceType<typeof DropdownMenu>>());
const selectedFiles = ref<string[]>([]);
const lastClickedIndex = ref<number | null>(null);
const isActive = ref<boolean>(false);
// Respect prop to allow disabling activation in contexts like modals
const allowActivation = computed(() => (props as any).activatable !== false);
let updateStartTime = 0;
const isScrolling = ref(false);
let scrollTimeout: NodeJS.Timeout | null = null;

const scrollTop = ref(0);

const currentTheme = computed(() => (themeStore.isEffectiveDark ? "os-theme-light" : "os-theme-dark"));
const jobs = computed(() => jobsStore.jobs);

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0.00";
  const mb = bytes / (1024 * 1024);
  return mb.toFixed(2);
};

// Memoized formatters to avoid constructing on every render
const MODIFIED_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
});

const CREATION_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

const formatModifiedDate = (timestamp: number): string => MODIFIED_DATE_FORMATTER.format(new Date(timestamp));
const formatCreationDate = (timestamp: number): string => CREATION_DATE_FORMATTER.format(new Date(timestamp));

const sortKey = ref<keyof FileItem>("name");
const sortDirection = ref<"asc" | "desc">("asc");

// Computed for lazy loading progress
const lazyLoadingProgress = computed(() => {
  // Include the store trigger to force re-computation when folders are updated
  const trigger = jobsStore.lazyLoadingUpdateTrigger;
  
  const lazyLoadedFolders = props.files.filter(f => f.type === "Folder" && f.isLazyLoaded);
  const totalFolders = props.files.filter(f => f.type === "Folder");
  const completedFolders = totalFolders.length - lazyLoadedFolders.length;
  
  return {
    total: totalFolders.length,
    completed: completedFolders,
    remaining: lazyLoadedFolders.length,
    percentage: totalFolders.length > 0 ? Math.round((completedFolders / totalFolders.length) * 100) : 100,
    trigger // Include trigger to force reactivity
  };
});

const sortedFiles = computed(() => {
  const filesCopy = [...props.files];
  const folders = filesCopy.filter((item) => item.type === "Folder");
  const files = filesCopy.filter((item) => item.type !== "Folder");

  const sortArray = (arr: FileItem[]) => {
    arr.sort((a, b) => {
      const key = sortKey.value;
      
      // Handle lazy loading for folder statistics
      let aValue = a[key];
      let bValue = b[key];
      
      // For lazy loaded folders, use fallback values for sorting
      if (a.isLazyLoaded && typeof aValue === "undefined") {
        aValue = key === "size" ? 0 : (key === "files" || key === "folders" || key === "filesTotal" || key === "foldersTotal" ? 0 : "");
      }
      if (b.isLazyLoaded && typeof bValue === "undefined") {
        bValue = key === "size" ? 0 : (key === "files" || key === "folders" || key === "filesTotal" || key === "foldersTotal" ? 0 : "");
      }
      
      // Fallback to default values if still undefined
      aValue = aValue ?? (typeof aValue === "number" ? 0 : "");
      bValue = bValue ?? (typeof bValue === "number" ? 0 : "");

      let comparison = 0;
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue, undefined, { numeric: true });
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      }

      return sortDirection.value === "asc" ? comparison : -comparison;
    });
  };

  sortArray(folders);
  sortArray(files);

  return [...folders, ...files];
});

const handleSort = (key: keyof FileItem) => {
  // Prevent sorting if we just finished a resize (suppresses the mouseup click that follows)
  if (suppressHeaderClick.value) return;
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortDirection.value = "asc";
  }
};

// --- FIX: Separate max size calculations for files and folders ---
const maxFileSizeInJob = computed(() => {
  const fileSizes = props.files.filter((f) => f.type !== "Folder").map((f) => f.size);
  if (fileSizes.length === 0) return 1;
  return Math.max(...fileSizes);
});

const maxFolderSizeInJob = computed(() => {
  // Only include folders that have been fully loaded (not lazy loaded)
  const folderSizes = props.files
    .filter((f) => f.type === "Folder" && !f.isLazyLoaded)
    .map((f) => f.size);
  if (folderSizes.length === 0) return 1;
  return Math.max(...folderSizes);
});

// --- Date Bar Computeds ---
const fileTimestamps = computed(() =>
  props.files.filter((f) => f.type !== "Folder").map((f) => ({ modified: f.modified ?? 0, created: f.created ?? 0 }))
);
const folderTimestamps = computed(() =>
  props.files.filter((f) => f.type === "Folder" && !f.isLazyLoaded).map((f) => ({ modified: f.modified ?? 0, created: f.created ?? 0 }))
);

const getMinMax = (timestamps: number[]) => {
  if (timestamps.length === 0) return { min: 0, max: 1 };
  const cleanTimestamps = timestamps.filter((t) => t > 0);
  if (cleanTimestamps.length === 0) return { min: 0, max: 1 };
  return {
    min: Math.min(...cleanTimestamps),
    max: Math.max(...cleanTimestamps),
  };
};

const minMaxFileModified = computed(() => getMinMax(fileTimestamps.value.map((t) => t.modified)));
const minMaxFolderModified = computed(() => getMinMax(folderTimestamps.value.map((t) => t.modified)));
const minMaxFileCreated = computed(() => getMinMax(fileTimestamps.value.map((t) => t.created)));
const minMaxFolderCreated = computed(() => getMinMax(folderTimestamps.value.map((t) => t.created)));

const normalizeTimestamp = (timestamp: number, range: { min: number; max: number }): number => {
  if (range.max === range.min) return 50; // If all items have the same date, show a half-bar
  // Invert the scale: older dates (smaller timestamps) should have a larger bar
  return 100 - ((timestamp - range.min) / (range.max - range.min)) * 100;
};

const totalHeight = computed(() => sortedFiles.value.length * ROW_HEIGHT);

const startIndex = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / ROW_HEIGHT) - BUFFER_ROWS);
});

const endIndex = computed(() => {
  const wrapperHeight = viewportRef.value?.clientHeight || 0;
  return Math.min(sortedFiles.value.length, Math.ceil((scrollTop.value + wrapperHeight) / ROW_HEIGHT) + BUFFER_ROWS);
});

const contentOffsetY = computed(() => startIndex.value * ROW_HEIGHT);

const visibleFiles = computed(() => {
  return sortedFiles.value.slice(startIndex.value, endIndex.value);
});

const handleScroll = () => {
  if (viewportRef.value) {
    scrollTop.value = viewportRef.value.scrollTop;
  }
  isScrolling.value = true;
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  scrollTimeout = setTimeout(() => {
    isScrolling.value = false;
  }, 150);

  // Disabled logging for FileTable scrolling
  // if (isDevelopment.value) {
  //   logMarqueeSelection("FileTable", "Virtual scroll update:", {
  //     scrollTop: scrollTop.value,
  //     startIndex: startIndex.value,
  //     endIndex: endIndex.value,
  //     contentOffsetY: contentOffsetY.value,
  //     visibleFilesCount: visibleFiles.value.length,
  //     totalFiles: sortedFiles.value.length,
  //     wrapperHeight: viewportRef.value?.clientHeight || 0,
  //   });
  // }
};

const marqueeBoxStyle = computed(() => ({
  transform: `translate(${uiStore.marqueeBox.x}px, ${uiStore.marqueeBox.y}px)`,
  width: `${uiStore.marqueeBox.width}px`,
  height: `${uiStore.marqueeBox.height}px`,
}));

// Watch for when debug hotzones become visible to log DOM measurements
watch(
  () => uiStore.marqueeBox.visible,
  (newVisible) => {
    if (newVisible && isDevelopment.value) {
      // Use nextTick to ensure DOM is updated
      nextTick(() => {
        logActualDOMMeasurements();
      });
    }
  }
);

// Function to log actual DOM measurements for debugging
const logActualDOMMeasurements = () => {
  // Disabled logging for FileTable DOM measurements
  // if (!isDevelopment.value || !uiStore.marqueeBox.visible) return;

  // // Try to get actual measurements from the DOM
  // const tableRows = document.querySelectorAll(".table-row");
  // const itemNameContents = document.querySelectorAll(".item-name-content");

  // if (tableRows.length > 0 && itemNameContents.length > 0) {
  //   const firstRow = tableRows[0] as HTMLElement;
  //   const firstItemNameContent = itemNameContents[0] as HTMLElement;

  //   if (firstRow && firstItemNameContent) {
  //     const rowRect = firstRow.getBoundingClientRect();
  //     const contentRect = firstItemNameContent.getBoundingClientRect();
  //     const tableComp = fileTableCompRef.value;
  //     const tableCompRect = tableComp?.getBoundingClientRect();

  //     // Get computed styles
  //     const computedStyles = {
  //       rowPadding: window.getComputedStyle(firstRow).paddingInline,
  //       contentGap: window.getComputedStyle(firstItemNameContent).columnGap,
  //       contentPadding: window.getComputedStyle(firstItemNameContent).paddingInline,
  //       contentWidth: window.getComputedStyle(firstItemNameContent).width,
  //       contentMinWidth: window.getComputedStyle(firstItemNameContent).minInlineSize,
  //       contentMaxWidth: window.getComputedStyle(firstItemNameContent).maxInlineSize,
  //       itemNameGap: window.getComputedStyle(firstRow.querySelector(".item-name") as HTMLElement)?.gap || "N/A",
  //     };

  //     logMarqueeSelection("FileTable", "Actual DOM measurements:", {
  //       tableCompBounds: tableCompRect
  //         ? {
  //             left: tableCompRect.left,
  //             top: tableCompRect.top,
  //             width: tableCompRect.width,
  //             height: tableCompRect.height,
  //           }
  //         : null,
  //       firstRowBounds: {
  //         left: rowRect.left,
  //         top: rowRect.top,
  //         width: rowRect.width,
  //         height: rowRect.height,
  //       },
  //       firstItemNameContentBounds: {
  //         left: contentRect.left,
  //         top: contentRect.top,
  //         width: contentRect.width,
  //         height: contentRect.height,
  //       },
  //       // Calculate relative positions
  //       contentRelativeToRow: {
  //         left: contentRect.left - rowRect.left,
  //         top: contentRect.top - rowRect.top,
  //       },
  //       contentRelativeToTable: tableCompRect
  //         ? {
  //             left: contentRect.left - tableCompRect.left,
  //             top: contentRect.top - tableCompRect.top,
  //           }
  //         : null,
  //       // Computed CSS styles
  //       computedStyles,
  //     });
  //   }
  // }
};

// Debug hotzone style computation
const getDebugHotzoneStyle = (index: number, file: FileItem) => {
  // Account for header height (34px) and virtual scroll offset
  const rowTop = index * ROW_HEIGHT + 34 + contentOffsetY.value;

  // Try to use actual DOM measurements so the debug hotzone exactly matches the rendered element
  try {
    const scrollWrapper = viewportRef.value;
    const tableComp = fileTableCompRef.value;
    if (scrollWrapper && tableComp) {
      const scrollBounds = scrollWrapper.getBoundingClientRect();
      const itemNodes = document.querySelectorAll(".virtual-scroll-content .item-name-content");
      const node = itemNodes[index] as HTMLElement | undefined;
      if (node) {
        const rect = node.getBoundingClientRect();
        // Compute left relative to the scroll wrapper (same coordinate space as marquee)
        const leftRelToScroll = rect.left - scrollBounds.left;
        const width = rect.width;
        return {
          position: "absolute" as const,
          top: `${rowTop}px`,
          left: `${leftRelToScroll}px`,
          width: `${width}px`,
          height: `${ROW_HEIGHT}px`,
          backgroundColor: "rgba(255, 0, 0, 0.2)",
          border: "1px solid rgba(255, 0, 0, 0.5)",
          pointerEvents: "none" as const,
          zIndex: 99,
        };
      }
    }
  } catch (err) {
    // ignore and fallback to estimate below
  }

  // Fallback: calculate the horizontal bounds of the .item-name-content area
  let itemNameContentLeft = 8; // Left padding of .item-name cell

  // If checkboxes are shown, add the full width of the checkbox column
  if (props.showCheckboxes) {
    itemNameContentLeft += columnWidths.checkbox;
  }

  // Calculate the width that fully encompasses the icon and text content
  const iconWidth = 16; // Icon width (from template)
  const textPadding = 8; // column-gap in .item-name-content (from CSS)
  const rowActionsWidth = 40; // Estimated width of the '...' button (from visual)
  const itemNameGap = 8; // gap in .item-name flexbox (from CSS)

  // Account for padding of .item-name cell (8px left + 8px right)
  let maxAvailableSpace = columnWidths.name - 16;

  // If row actions are shown, account for their width and the gap in .item-name flexbox
  if (props.showRowActions) {
    maxAvailableSpace -= itemNameGap + rowActionsWidth;
  }

  // The hotzone should cover the entire available space for the item name content
  const itemNameContentWidth = maxAvailableSpace;

  // Log detailed calculations for debugging
  // Disabled logging for FileTable hotzone calculations
  // if (isDevelopment.value) {
  //   logMarqueeSelection("FileTable", `Hotzone calculation for row ${index} (${file.name}):`, {
  //     rowTop,
  //     itemNameContentLeft,
  //     itemNameContentWidth,
  //     iconWidth,
  //     textPadding,
  //     rowActionsWidth,
  //     itemNameGap,
  //     maxAvailableSpace,
  //     fileLength: file.name.length,
  //     columnWidths: columnWidths.name,
  //     showCheckboxes: props.showCheckboxes,
  //     checkboxWidth: props.showCheckboxes ? columnWidths.checkbox : 0,
  //     contentOffsetY: contentOffsetY.value,
  //     ROW_HEIGHT,
  //     headerHeight: 34,
  //     calculatedRowTop: index * ROW_HEIGHT,
  //     finalRowTop: rowTop,
  //     itemNameGapCSS: "8px",
  //     columnGapCSS: "8px",
  //     paddingInlineCSS: "8px",
  //     virtualScrollOffset: contentOffsetY.value,
  //     isVirtualScrolling: contentOffsetY.value > 0,
  //   });
  // }

  return {
    position: "absolute" as const,
    top: `${rowTop}px`,
    left: `${itemNameContentLeft}px`,
    width: `${itemNameContentWidth}px`,
    height: `${ROW_HEIGHT}px`,
    backgroundColor: "rgba(255, 0, 0, 0.2)",
    border: "1px solid rgba(255, 0, 0, 0.5)",
    pointerEvents: "none" as const,
    zIndex: 99,
  };
};

// Check if we're in development mode
const isDevelopment = computed(() => {
  return typeof window !== "undefined" && window.location.hostname === "localhost";
});

const isMarqueeActive = ref(false);
const marqueeAnchorX = ref(0);
const marqueeAnchorY = ref(0);
// Preview selection kept local during drag to avoid reactive churn
const marqueePreviewSelection = ref<string[]>([]); // retained for compatibility (committed on mouseup)
const marqueePreviewAdd = ref<string[]>([]);
const marqueePreviewRemove = ref<string[]>([]);
const marqueeIsAdditive = ref(false);
const marqueeIsInvert = ref(false);
// Local DOM refs/state used to avoid per-frame reactive writes
const localSelectionBox = ref<HTMLElement | null>(null);
const localMarqueeRect = reactive({ x: 0, y: 0, width: 0, height: 0 });
const localPreviewSet = new Set<string>();
const skipRootClick = ref(false);
// Drag threshold (px) to distinguish click vs marquee drag
const DRAG_THRESHOLD = 6;
const isPossibleMarquee = ref(false);
// Single-sample calibration for .item-name-content horizontal bounds (relative to scroll wrapper)
const nameContentCalibration = reactive({ left: null as number | null, right: null as number | null });
// Measured header height (fallback 34)
const headerHeight = ref(34);

const calibrateHeaderHeight = (scrollWrapper: HTMLElement | null) => {
  try {
    const tableHeader = fileTableCompRef.value?.querySelector(".table-header") as HTMLElement | null;
    if (tableHeader) headerHeight.value = tableHeader.getBoundingClientRect().height || 34;
  } catch (err) {
    headerHeight.value = 34;
  }
};

const calibrateNameContent = (scrollWrapper: HTMLElement) => {
  try {
    const scrollBounds = scrollWrapper.getBoundingClientRect();
    const node = document.querySelector(".virtual-scroll-content .item-name-content") as HTMLElement | null;
    if (node) {
      const rect = node.getBoundingClientRect();
      const scrollLeft = scrollWrapper ? scrollWrapper.scrollLeft : 0;
      // store calibration in content-coordinate space (include horizontal scroll)
      nameContentCalibration.left = rect.left - scrollBounds.left + scrollLeft;
      nameContentCalibration.right = nameContentCalibration.left + rect.width;
    }
  } catch (err) {
    // ignore calibration errors and fall back to estimate
    nameContentCalibration.left = null;
    nameContentCalibration.right = null;
  }
};

const handleComponentMouseDown = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.closest(".os-scrollbar")) {
    return;
  }

  if (!props.marqueeSelectionEnabled || event.button !== 0) return;

  // If the mousedown is on an item name/content or checkbox, let the native drag/interaction proceed
  if (target.closest(".item-name-content") || target.closest(".item-checkbox")) {
    return;
  }

  const isInteractiveElement = target.closest("button, a, input, select, textarea, .table-header, .resizer");
  if (isInteractiveElement) return;
  // Determine whether this mousedown started on a file's name/checkbox or on the blank background
  const clickedOnName = !!target.closest(".item-name-content");
  const clickedOnCheckbox = !!target.closest(".item-checkbox");

  const ctrlPressed = event.ctrlKey || event.metaKey;
  const shiftPressed = event.shiftKey;

  // If the mousedown is on the background (not on a name or checkbox), clear selection to start fresh
  // unless the user is holding Ctrl (additive) or Ctrl+Shift (invert)
  if (!clickedOnName && !clickedOnCheckbox) {
    if (!ctrlPressed) {
      if (selectedFiles.value.length > 0) {
        selectedFiles.value = [];
      }
    }
  }

  event.preventDefault();
  // mark a possible marquee; activate only after movement exceeds threshold
  isPossibleMarquee.value = true;
  isMarqueeActive.value = false;
  marqueeIsAdditive.value = ctrlPressed;
  marqueeIsInvert.value = ctrlPressed && shiftPressed;

  const scrollWrapper = viewportRef.value;
  if (!scrollWrapper) return;

  // compute anchor in content-space and clamp to content bounds
  // If the file table is zoomed using `zoom`, the bounding rects and scroll offsets
  // already reflect the visual scale in Chromium. We still compute using client
  // coordinates but transform to content coordinates by accounting for the zoom
  // factor if necessary.
  const scrollWrapperBounds = scrollWrapper.getBoundingClientRect();
  const rootStyles = getComputedStyle(document.documentElement);
  const ftZoomRaw = rootStyles.getPropertyValue("--file-table-zoom") || rootStyles.getPropertyValue("--file-table-zoom-local");
  const parsed = Number(ftZoomRaw ? parsedFloatSafe(ftZoomRaw) : NaN);
  const ftZoom = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;

  // clientX/left are in viewport pixels; when content is zoomed via CSS `zoom`
  // the scrollLeft/scrollTop and getBoundingClientRect reflect layout after
  // zoom. Therefore converting anchor using these values works directly.
  const computedAnchorX = event.clientX - scrollWrapperBounds.left + scrollWrapper.scrollLeft;
  const maxContentX = Math.max(0, scrollWrapper.scrollWidth - 1);
  marqueeAnchorX.value = Math.min(maxContentX, Math.max(0, computedAnchorX));
  const computedAnchorY = event.clientY - scrollWrapperBounds.top + scrollWrapper.scrollTop - headerHeight.value;
  const maxContentY = Math.max(0, scrollWrapper.scrollHeight - headerHeight.value - 1);
  marqueeAnchorY.value = Math.min(maxContentY, Math.max(0, computedAnchorY)); // Offset by header height

  window.addEventListener("mousemove", handleMarqueeMouseMove);
  window.addEventListener("mouseup", handleMarqueeMouseUp);
  // Also listen for pointer events to be robust on quick releases / touch
  window.addEventListener("pointerup", handleMarqueeMouseUp);
  window.addEventListener("pointercancel", handleMarqueeMouseUp);
  // do NOT start auto-scroll until marquee is actually activated (threshold passed)
};

const handleMarqueeMouseMove = (event: MouseEvent) => {
  const scrollWrapper = viewportRef.value;
  if (!scrollWrapper) return;

  // save last client coordinates so auto-scroll can reuse when needed
  lastMouseClientX = event.clientX;
  lastMouseClientY = event.clientY;

  const scrollWrapperBounds = scrollWrapper.getBoundingClientRect();
  const mouseX_content = event.clientX - scrollWrapperBounds.left + scrollWrapper.scrollLeft;
  const mouseY_content = event.clientY - scrollWrapperBounds.top + scrollWrapper.scrollTop - headerHeight.value; // Offset by header height

  // If marquee hasn't been activated yet, check threshold
  if (!isMarqueeActive.value && isPossibleMarquee.value) {
    const dx = mouseX_content - marqueeAnchorX.value;
    const dy = mouseY_content - marqueeAnchorY.value;
    const distSq = dx * dx + dy * dy;
    if (distSq < DRAG_THRESHOLD * DRAG_THRESHOLD) {
      // not past threshold yet
      return;
    }
    // activate marquee
    isMarqueeActive.value = true;
    isPossibleMarquee.value = false;
    // show selection box starting at anchor with zero size to avoid flash at 0,0
    if (localSelectionBox.value) {
      localSelectionBox.value.style.display = "block";
      localSelectionBox.value.style.transform = `translate(${marqueeAnchorX.value}px, ${marqueeAnchorY.value}px)`;
      localSelectionBox.value.style.width = `0px`;
      localSelectionBox.value.style.height = `0px`;
    }
    // start auto-scroll now that marquee is active
    // try to disable overscroll/rubber-band on the scroll wrapper while marquee is active
    try {
      scrollWrapper.style.setProperty("overscroll-behavior", "contain");
    } catch (e) {
      // ignore
    }
    startAutoScroll(scrollWrapper);
    // Attempt single-sample calibration for .item-name-content to get exact horizontal bounds
    calibrateNameContent(scrollWrapper);
  }

  if (!isMarqueeActive.value) return;

  // Throttle updates using requestAnimationFrame to reduce DOM thrash.
  let scheduled = false as boolean;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      if (!isMarqueeActive.value) return;
      const bounds = scrollWrapper.getBoundingClientRect();
      let mx = event.clientX - bounds.left + scrollWrapper.scrollLeft;
      let my = event.clientY - bounds.top + scrollWrapper.scrollTop - headerHeight.value;
      // Clamp horizontal and vertical positions to content bounds to avoid marquee growing past content end
      const maxContentY = Math.max(0, (scrollWrapper.scrollHeight || totalHeight.value) - headerHeight.value - 1);
      const maxContentX = Math.max(0, (scrollWrapper.scrollWidth || bounds.width) - 1);
      mx = Math.min(maxContentX, Math.max(0, mx));
      my = Math.min(maxContentY, Math.max(0, my));

      const x = Math.min(marqueeAnchorX.value, mx);
      const y = Math.min(marqueeAnchorY.value, my);
      const width = Math.abs(mx - marqueeAnchorX.value);
      const height = Math.abs(my - marqueeAnchorY.value);

      // Update local rect and the DOM element directly (avoid reactive writes)
      localMarqueeRect.x = x;
      localMarqueeRect.y = y;
      localMarqueeRect.width = width;
      localMarqueeRect.height = height;

      if (localSelectionBox.value) {
        localSelectionBox.value.style.transform = `translate(${x}px, ${y}px)`;
        localSelectionBox.value.style.width = `${width}px`;
        localSelectionBox.value.style.height = `${height}px`;
      }

      // Compute preview selection using math-based selection (no per-row getBoundingClientRect)
      const paths = computeSelectionByRectLocal(marqueeIsAdditive.value, x, y, width, height);

      // Toggle preview classes on visible rows directly to avoid reactive churn
      updatePreviewDOM(paths);
    });
  };

  schedule();
};

// --- Auto-scroll while dragging near edges ---
let autoScrollRaf: number | null = null;
let lastMouseClientX = 0;
let lastMouseClientY = 0;
const AUTO_SCROLL_THRESHOLD = 60; // px from edge to start scrolling
const AUTO_SCROLL_MAX_SPEED = 24; // px per frame approx
// Horizontal buffer to keep last-column resizer reachable (pixels)
const HORIZONTAL_RIGHT_BUFFER = 48;

const startAutoScroll = (scrollWrapper: HTMLElement) => {
  if (autoScrollRaf) return;

  const tick = () => {
    if (!isMarqueeActive.value) {
      stopAutoScroll();
      return;
    }

    const bounds = scrollWrapper.getBoundingClientRect();
    // compute mouse position relative to viewport
    const y = lastMouseClientY - bounds.top;
    const xPos = lastMouseClientX - bounds.left;
    let speedY = 0;
    let speedX = 0;

    if (y < AUTO_SCROLL_THRESHOLD) {
      const pct = (AUTO_SCROLL_THRESHOLD - y) / AUTO_SCROLL_THRESHOLD;
      speedY = -Math.min(AUTO_SCROLL_MAX_SPEED, Math.max(2, AUTO_SCROLL_MAX_SPEED * pct));
    } else if (y > bounds.height - AUTO_SCROLL_THRESHOLD) {
      const pct = (y - (bounds.height - AUTO_SCROLL_THRESHOLD)) / AUTO_SCROLL_THRESHOLD;
      speedY = Math.min(AUTO_SCROLL_MAX_SPEED, Math.max(2, AUTO_SCROLL_MAX_SPEED * pct));
    }

    if (xPos < AUTO_SCROLL_THRESHOLD) {
      const pct = (AUTO_SCROLL_THRESHOLD - xPos) / AUTO_SCROLL_THRESHOLD;
      speedX = -Math.min(AUTO_SCROLL_MAX_SPEED, Math.max(2, AUTO_SCROLL_MAX_SPEED * pct));
    } else if (xPos > bounds.width - AUTO_SCROLL_THRESHOLD) {
      const pct = (xPos - (bounds.width - AUTO_SCROLL_THRESHOLD)) / AUTO_SCROLL_THRESHOLD;
      speedX = Math.min(AUTO_SCROLL_MAX_SPEED, Math.max(2, AUTO_SCROLL_MAX_SPEED * pct));
    }

    if (speedY !== 0 || speedX !== 0) {
      // Clamp vertical scrollTop
      const maxScrollTop = Math.max(0, scrollWrapper.scrollHeight - bounds.height);
      const desiredTop = scrollWrapper.scrollTop + speedY;
      const newTop = Math.max(0, Math.min(maxScrollTop, desiredTop));
      if (newTop !== scrollWrapper.scrollTop) scrollWrapper.scrollTop = newTop;

      // Clamp horizontal scrollLeft
      // reduce max scroll left by a small buffer so the last column resizer remains reachable
      const maxScrollLeft = Math.max(0, scrollWrapper.scrollWidth - bounds.width - HORIZONTAL_RIGHT_BUFFER);
      const desiredLeft = scrollWrapper.scrollLeft + speedX;
      const newLeft = Math.max(0, Math.min(maxScrollLeft, desiredLeft));
      if (newLeft !== scrollWrapper.scrollLeft) scrollWrapper.scrollLeft = newLeft;

      // update marquee using synthetic mouse position (use last client coords)
      const mouseX_content = lastMouseClientX - bounds.left + scrollWrapper.scrollLeft;
      let mouseY_content = lastMouseClientY - bounds.top + scrollWrapper.scrollTop - headerHeight.value;
      // Clamp synthetic mouse X/Y to content bounds to avoid overscroll
      const maxY = Math.max(0, (scrollWrapper.scrollHeight || totalHeight.value) - headerHeight.value - 1);
      // Consider a right-side buffer so the marquee doesn't extend beyond and interfere with the resizer
      const maxX = Math.max(0, (scrollWrapper.scrollWidth || bounds.width) - HORIZONTAL_RIGHT_BUFFER - 1);
      const clampedMouseX = Math.min(maxX, Math.max(0, mouseX_content));
      mouseY_content = Math.min(maxY, Math.max(0, mouseY_content));

      const x = Math.min(marqueeAnchorX.value, clampedMouseX);
      const yPos = Math.min(marqueeAnchorY.value, mouseY_content);
      const width = Math.abs(mouseX_content - marqueeAnchorX.value);
      const height = Math.abs(mouseY_content - marqueeAnchorY.value);

      // Update local rect + DOM
      localMarqueeRect.x = x;
      localMarqueeRect.y = yPos;
      localMarqueeRect.width = width;
      localMarqueeRect.height = height;
      if (localSelectionBox.value) {
        localSelectionBox.value.style.display = "block";
        localSelectionBox.value.style.transform = `translate(${x}px, ${yPos}px)`;
        localSelectionBox.value.style.width = `${width}px`;
        localSelectionBox.value.style.height = `${height}px`;
      }

      // recompute preview selection via math
      const paths = computeSelectionByRectLocal(marqueeIsAdditive.value, x, yPos, width, height);
      updatePreviewDOM(paths);
    }

    autoScrollRaf = window.requestAnimationFrame(tick);
  };

  autoScrollRaf = window.requestAnimationFrame(tick);
};

const stopAutoScroll = () => {
  if (autoScrollRaf) {
    window.cancelAnimationFrame(autoScrollRaf);
    autoScrollRaf = null;
  }
};

const handleMarqueeMouseUp = () => {
  // Suppress the next root click that may be generated by the mouseup after dragging
  skipRootClick.value = true;
  setTimeout(() => (skipRootClick.value = false), 100);
  isMarqueeActive.value = false;
  // Commit the previewed selection on mouse up using the local rect
  const finalPaths = computeSelectionByRectLocal(
    marqueeIsAdditive.value,
    localMarqueeRect.x,
    localMarqueeRect.y,
    localMarqueeRect.width,
    localMarqueeRect.height
  );
  if (finalPaths.length > 0) {
    if (marqueeIsInvert.value) {
      const currentSet = new Set(selectedFiles.value);
      for (const p of finalPaths) {
        if (currentSet.has(p)) currentSet.delete(p);
        else currentSet.add(p);
      }
      selectedFiles.value = Array.from(currentSet);
    } else if (marqueeIsAdditive.value) {
      const selectionSet = new Set([...selectedFiles.value, ...finalPaths]);
      selectedFiles.value = Array.from(selectionSet);
    } else {
      selectedFiles.value = finalPaths;
    }
  }
  // clear preview DOM classes and local state
  clearPreviewDOM();
  marqueePreviewSelection.value = [];
  uiStore.marqueeBox.visible = false;
  window.removeEventListener("mousemove", handleMarqueeMouseMove);
  window.removeEventListener("mouseup", handleMarqueeMouseUp);
  window.removeEventListener("pointerup", handleMarqueeMouseUp);
  window.removeEventListener("pointercancel", handleMarqueeMouseUp);
  // stop auto-scroll when marquee ends
  stopAutoScroll();
};

// Compute selection paths for current marquee rect without committing (used for preview)
const computeSelectionByRect = (isAdditive: boolean): string[] => {
  // Backwards-compatible: if a local marquee rect is active, prefer that (avoids layout reads)
  const marqueeTop = isMarqueeActive.value ? localMarqueeRect.y : uiStore.marqueeBox.y;
  const marqueeBottom = marqueeTop + (isMarqueeActive.value ? localMarqueeRect.height : uiStore.marqueeBox.height);
  const marqueeLeft = isMarqueeActive.value ? localMarqueeRect.x : uiStore.marqueeBox.x;
  const marqueeRight = marqueeLeft + (isMarqueeActive.value ? localMarqueeRect.width : uiStore.marqueeBox.width);

  const startIndexInView = Math.max(0, Math.floor(marqueeTop / ROW_HEIGHT));
  const endIndexInView = Math.min(sortedFiles.value.length, Math.ceil(marqueeBottom / ROW_HEIGHT));

  const pathsToSelect: string[] = [];

  for (let i = startIndexInView; i < endIndexInView; i++) {
    const file = sortedFiles.value[i];
    if (!file) continue;

    const rowTop = i * ROW_HEIGHT;
    const rowBottom = rowTop + ROW_HEIGHT;

    if (!(marqueeBottom > rowTop && marqueeTop < rowBottom)) continue;

    // Compute horizontal bounds; try DOM first
    let itemNameContentLeftFinal = 8;
    if (props.showCheckboxes) itemNameContentLeftFinal += columnWidths.checkbox;
    let itemNameContentRight = itemNameContentLeftFinal + (columnWidths.name - 16);

    try {
      const scrollWrapper = viewportRef.value;
      if (scrollWrapper) {
        const scrollBounds = scrollWrapper.getBoundingClientRect();
        const rowNodes = document.querySelectorAll(".virtual-scroll-content .table-row");
        const rowNode = rowNodes[i - startIndex.value] as HTMLElement | undefined;
        if (rowNode) {
          const contentNode = rowNode.querySelector(".item-name-content") as HTMLElement | null;
          if (contentNode) {
            const rect = contentNode.getBoundingClientRect();
            itemNameContentLeftFinal = rect.left - scrollBounds.left;
            itemNameContentRight = itemNameContentLeftFinal + rect.width;
          }
        }
      }
    } catch (err) {
      // fall back to estimate
    }

    if (marqueeRight > itemNameContentLeftFinal - 2 && marqueeLeft < itemNameContentRight + 2) {
      pathsToSelect.push(file.path);
    }
  }

  return pathsToSelect;
};

// Math-based selection computation that avoids DOM reads. Use columnWidths and ROW_HEIGHT to test ranges.
const computeSelectionByRectLocal = (
  isAdditive: boolean,
  rectX: number,
  rectY: number,
  rectW: number,
  rectH: number
): string[] => {
  const marqueeTop = rectY;
  const marqueeBottom = rectY + rectH;
  const marqueeLeft = rectX;
  const marqueeRight = rectX + rectW;

  const startIndexInView = Math.max(0, Math.floor(marqueeTop / ROW_HEIGHT));
  const endIndexInView = Math.min(sortedFiles.value.length, Math.ceil(marqueeBottom / ROW_HEIGHT));

  const pathsToSelect: string[] = [];

  // Horizontal bounds estimation for .item-name content
  let leftPadding = 8 + (props.showCheckboxes ? columnWidths.checkbox : 0);
  let rightEdge = leftPadding + (columnWidths.name - 16);
  // apply a right-side buffer so marquee and interactions don't overlap scrollbar/resizer
  rightEdge = Math.max(leftPadding, rightEdge - HORIZONTAL_RIGHT_BUFFER);
  // If we calibrated actual .item-name-content bounds, use those
  if (nameContentCalibration.left !== null && nameContentCalibration.right !== null) {
    leftPadding = nameContentCalibration.left;
    rightEdge = nameContentCalibration.right;
  }

  // Try to read actual .item-name-content rects for visible rows (cheap because it's limited to visible rows)
  try {
    const scrollWrapper = viewportRef.value;
    const scrollBounds = scrollWrapper ? scrollWrapper.getBoundingClientRect() : null;
    const rowNodes = document.querySelectorAll(".virtual-scroll-content .table-row");

    for (let i = startIndexInView; i < endIndexInView; i++) {
      const file = sortedFiles.value[i];
      if (!file) continue;

      const rowTop = i * ROW_HEIGHT;
      const rowBottom = rowTop + ROW_HEIGHT;
      if (!(marqueeBottom > rowTop && marqueeTop < rowBottom)) continue;

      const node = rowNodes[i - startIndex.value] as HTMLElement | undefined;
      if (node && scrollBounds) {
        const contentNode = node.querySelector(".item-name-content") as HTMLElement | null;
        if (contentNode) {
          const rect = contentNode.getBoundingClientRect();
          const scrollLeft = scrollWrapper ? scrollWrapper.scrollLeft : 0;
          const itemLeft = rect.left - scrollBounds.left + scrollLeft;
          const itemRight = itemLeft + rect.width;
          if (marqueeRight > itemLeft - 2 && marqueeLeft < itemRight + 2) {
            pathsToSelect.push(file.path);
          }
          continue;
        }
      }

      // Fallback to estimation if DOM node unavailable
      if (marqueeRight > leftPadding - 2 && marqueeLeft < rightEdge + 2) {
        pathsToSelect.push(file.path);
      }
    }
  } catch (err) {
    // If any DOM read fails, fallback to estimate for all rows
    for (let i = startIndexInView; i < endIndexInView; i++) {
      const file = sortedFiles.value[i];
      if (!file) continue;
      const rowTop = i * ROW_HEIGHT;
      const rowBottom = rowTop + ROW_HEIGHT;
      if (!(marqueeBottom > rowTop && marqueeTop < rowBottom)) continue;
      if (marqueeRight > leftPadding - 2 && marqueeLeft < rightEdge + 2) {
        pathsToSelect.push(file.path);
      }
    }
  }

  return pathsToSelect;
};

// Update visible rows' preview classes based on the provided paths array
const updatePreviewDOM = (paths: string[]) => {
  const newSet = new Set(paths);
  // Query only visible rows
  const rowNodes = document.querySelectorAll(".virtual-scroll-content .table-row");
  rowNodes.forEach((node) => {
    const path = node.getAttribute("data-path") || "";
    const shouldHave = newSet.has(path);
    const has = node.classList.contains("preview-selected");
    if (shouldHave && !has) node.classList.add("preview-selected");
    else if (!shouldHave && has) node.classList.remove("preview-selected");
  });
};

const clearPreviewDOM = () => {
  const rowNodes = document.querySelectorAll(".virtual-scroll-content .table-row.preview-selected");
  rowNodes.forEach((n) => n.classList.remove("preview-selected"));
  if (localSelectionBox.value) {
    localSelectionBox.value.style.display = "none";
  }
};

const columnWidths = reactive({
  checkbox: 40,
  name: 300,
  size: 100,
  ext: 80,
  modified: 180,
  created: 120,
  files: 80,
  folders: 80,
  filesTotal: 100,
  foldersTotal: 100,
  parentPath: 300,
});

const columnStyles = computed(() => ({
  "--col-width-checkbox": `${columnWidths.checkbox}px`,
  "--col-width-name": `${columnWidths.name}px`,
  "--col-width-size": `${columnWidths.size}px`,
  "--col-width-ext": `${columnWidths.ext}px`,
  "--col-width-modified": `${columnWidths.modified}px`,
  "--col-width-created": `${columnWidths.created}px`,
  "--col-width-files": `${columnWidths.files}px`,
  "--col-width-folders": `${columnWidths.folders}px`,
  "--col-width-files-total": `${columnWidths.filesTotal}px`,
  "--col-width-folders-total": `${columnWidths.foldersTotal}px`,
  "--col-width-parent-path": `${columnWidths.parentPath}px`,
}));

// Per-component zoom factor for FileTable. Uses CSS var `--file-table-zoom` set by useZoom.
const fileTableZoom = ref<number>(1.0);
const applyFileTableZoomFromCSS = () => {
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--file-table-zoom").trim();
    const parsed = raw ? Number(parsedFloatSafe(raw)) : NaN;
    fileTableZoom.value = Number.isFinite(parsed) ? parsed : 1.0;
  } catch (e) {
    fileTableZoom.value = 1.0;
  }
};

// safe parse float helper to avoid stray characters
const parsedFloatSafe = (s: string) => {
  const m = s.match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : NaN;
};

// initialize from CSS var
applyFileTableZoomFromCSS();

// Watch for changes to the root CSS var and apply to the component root as a style variable
const fileTableRootStyle = computed(() => ({
  "--file-table-zoom-local": String(fileTableZoom.value),
}));

// MutationObserver to detect style changes on documentElement
let fileTableZoomObserver: MutationObserver | null = null;
let fileTableClassObserver: MutationObserver | null = null;
onMounted(() => {
  try {
    fileTableZoomObserver = new MutationObserver(() => {
      applyFileTableZoomFromCSS();
    });
    fileTableZoomObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
  } catch (e) {
    // ignore
  }
});
onUnmounted(() => {
  if (fileTableZoomObserver) {
    fileTableZoomObserver.disconnect();
    fileTableZoomObserver = null;
  }
  if (fileTableClassObserver) {
    fileTableClassObserver.disconnect();
    fileTableClassObserver = null;
  }
});

const effectiveZoom = () => (fileTableZoom.value && fileTableZoom.value > 0 ? fileTableZoom.value : 1);

const tableContentStyle = computed(() => {
  const totalWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0);
  return {
    minInlineSize: `${totalWidth}px`,
  };
});

const resizingColumn = ref<keyof typeof columnWidths | null>(null);
const startX = ref(0);
const startWidth = ref(0);
const isResizing = ref(false);
const suppressHeaderClick = ref(false);

const startResize = (event: MouseEvent, column: keyof typeof columnWidths) => {
  document.body.classList.add("is-resizing");
  isResizing.value = true;
  resizingColumn.value = column;
  startX.value = event.clientX;
  startWidth.value = columnWidths[column];
  window.addEventListener("mousemove", doResize);
  window.addEventListener("mouseup", stopResize);
};

// Use rAF batching to avoid updating reactive state on every mousemove
let pendingResizeRaf: number | null = null;
let pendingResizeColumn: keyof typeof columnWidths | null = null;
let pendingResizeWidth = 0;

const doResize = (event: MouseEvent) => {
  if (!resizingColumn.value) return;
  const delta = event.clientX - startX.value;
  const newWidth = Math.max(30, startWidth.value + delta);

  // store pending values
  pendingResizeColumn = resizingColumn.value;
  pendingResizeWidth = newWidth;

  if (pendingResizeRaf !== null) return;
  pendingResizeRaf = window.requestAnimationFrame(() => {
    if (pendingResizeColumn) {
      // commit to reactive state once per frame
      columnWidths[pendingResizeColumn] = pendingResizeWidth;
    }
    pendingResizeRaf = null;
    pendingResizeColumn = null;
    pendingResizeWidth = 0;
  });
};

const stopResize = () => {
  document.body.classList.remove("is-resizing");
  // small delay to prevent the click event that follows mouseup from triggering header actions
  isResizing.value = false;
  suppressHeaderClick.value = true;
  setTimeout(() => (suppressHeaderClick.value = false), 150);
  resizingColumn.value = null;
  // cancel any pending rAF and commit pending width synchronously
  if (pendingResizeRaf !== null) {
    window.cancelAnimationFrame(pendingResizeRaf);
    pendingResizeRaf = null;
  }
  if (pendingResizeColumn) {
    columnWidths[pendingResizeColumn] = pendingResizeWidth;
    pendingResizeColumn = null;
    pendingResizeWidth = 0;
  }
  window.removeEventListener("mousemove", doResize);
  window.removeEventListener("mouseup", stopResize);
};

const allSelected = computed(() => {
  return props.files.length > 0 && selectedFiles.value.length === props.files.length;
});

const toggleFileSelection = (path: string) => {
  if (!props.isSelectable) return;
  const selectedIndex = selectedFiles.value.indexOf(path);
  if (selectedIndex > -1) {
    selectedFiles.value.splice(selectedIndex, 1);
  } else {
    selectedFiles.value.push(path);
  }
  const fileIndex = sortedFiles.value.findIndex((f) => f.path === path);
  if (fileIndex !== -1) {
    lastClickedIndex.value = fileIndex;
  }
};

const clickRowByPath = (event: MouseEvent, path: string) => {
  if (!props.isSelectable) return;

  // Only treat as a row-selection click if the user clicked the name content or checkbox
  const target = event.target as HTMLElement;
  const clickedOnName = !!target.closest(".item-name-content");
  const clickedOnCheckbox = !!target.closest(".item-checkbox");

  if (!clickedOnName && !clickedOnCheckbox) {
    // Clicked elsewhere in the row: deselect all
    deselectAll();
    return;
  }

  // Prevent the root click handler from also deselecting
  event.stopPropagation();

  const clickedIndex = sortedFiles.value.findIndex((f) => f.path === path);
  if (clickedIndex === -1) return;

  const isCtrlPressed = event.ctrlKey || event.metaKey;

  if (event.shiftKey && lastClickedIndex.value !== null) {
    const start = Math.min(lastClickedIndex.value, clickedIndex);
    const end = Math.max(lastClickedIndex.value, clickedIndex);
    const rangePaths = sortedFiles.value.slice(start, end + 1).map((f) => f.path);

    if (isCtrlPressed) {
      const selectionSet = new Set(selectedFiles.value);
      rangePaths.forEach((p) => selectionSet.add(p));
      selectedFiles.value = Array.from(selectionSet);
    } else {
      selectedFiles.value = rangePaths;
    }
  } else if (isCtrlPressed) {
    toggleFileSelection(path);
  } else {
    selectedFiles.value = [path];
  }
  lastClickedIndex.value = clickedIndex;
};

const handleRootClick = (event: MouseEvent) => {
  isActive.value = true;
  // If we recently ended a marquee drag, ignore this root click (it comes from the mouseup)
  if (skipRootClick.value) {
    skipRootClick.value = false;
    return;
  }
  // If we just finished a resize, suppress the immediate click
  if (suppressHeaderClick.value) {
    return;
  }
  const target = event.target as HTMLElement;
  // If click is inside item-name-content or interactive controls, do nothing
  if (
    target.closest(".item-name-content") ||
    target.closest(".item-checkbox") ||
    target.closest(".file-table-toolbar") ||
    target.closest(".row-actions") ||
    target.closest(".table-header") ||
    target.closest(".resizer")
  ) {
    return;
  }
  // Otherwise deselect all
  deselectAll();
};

const toggleAll = (): void => {
  if (!props.isSelectable) return;
  if (allSelected.value) {
    selectedFiles.value = [];
  } else {
    selectedFiles.value = props.files.map((file) => file.path);
  }
  lastClickedIndex.value = null;
};

const deselectAll = () => {
  if (!props.isSelectable) return;
  selectedFiles.value = [];
  lastClickedIndex.value = null;
};

const handleDragStart = (event: DragEvent, path: string) => {
  if (!props.itemDragEnabled) {
    event.preventDefault();
    return;
  }
  let pathsToDrag: string[];

  if (selectedFiles.value.includes(path)) {
    pathsToDrag = [...selectedFiles.value];
  } else {
    selectedFiles.value = [path];
    pathsToDrag = [path];
  }

  if (event.dataTransfer) {
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ type: "internal-files", paths: pathsToDrag, sourceJobId: props.jobId })
    );
    event.dataTransfer.effectAllowed = "copyMove";
  }

  dragDropStore.startInternalDrag(pathsToDrag, null, props.jobId);
  logDragDropEvent("FileTable", `Native drag started for ${pathsToDrag.length} files from job ${props.jobId}.`);
};

const handleDragEnd = () => {
  logDragDropEvent("FileTable", "Native drag ended.");
  setTimeout(() => {
    if (dragDropStore.isInternalDragActive && !dragDropStore.dropOccurred) {
      logDragDropEvent("FileTable", "Drag ended on an invalid target. Cleaning up state.");
      dragDropStore.endInternalDrag();
    }
  }, 50);
};

const handleAddFile = async (close: () => void): Promise<void> => {
  close();
  const selected: string[] | null = await open({
    multiple: true,
    directory: false,
  });
  if (selected) {
    emit("add-files", selected);
  }
};

const performCopyFor = (pathOrPaths: string | string[]) => {
  const paths = Array.isArray(pathOrPaths)
    ? pathOrPaths
    : selectedFiles.value.includes(pathOrPaths) && selectedFiles.value.length > 0
    ? selectedFiles.value
    : [pathOrPaths];
  const filesToCopy: FileItem[] = paths
    .map((p) => jobsStore.jobs.find((j) => j.id === props.jobId)?.files.find((f) => f.path === p))
    .filter(Boolean) as FileItem[];
  clipboardStore.copy(filesToCopy, props.jobId);
};

const performCutFor = (pathOrPaths: string | string[]) => {
  const paths = Array.isArray(pathOrPaths)
    ? pathOrPaths
    : selectedFiles.value.includes(pathOrPaths) && selectedFiles.value.length > 0
    ? selectedFiles.value
    : [pathOrPaths];
  const filesToCut: FileItem[] = paths
    .map((p) => jobsStore.jobs.find((j) => j.id === props.jobId)?.files.find((f) => f.path === p))
    .filter(Boolean) as FileItem[];
  clipboardStore.cut(filesToCut, props.jobId);
};

const handleAddFolder = async (close: () => void): Promise<void> => {
  close();
  const selected: string[] | null = await open({
    multiple: true,
    directory: true,
  });
  if (selected) {
    emit("add-folders", selected);
  }
};

const removeSelectedFiles = (): void => {
  emit("remove-files", selectedFiles.value);
};

const moveToJob = (targetJobId: number): void => {
  emit("move-files", { targetJobId, files: selectedFiles.value });
};

const moveToNewJob = (): void => {
  emit("move-to-new-job", selectedFiles.value);
};

const copyToJob = (targetJobId: number): void => {
  emit("copy-files", { targetJobId, files: selectedFiles.value });
};

const copyToNewJob = (): void => {
  emit("copy-to-new-job", selectedFiles.value);
};

const removeFile = (path: string): void => {
  // Emit the path as a string so parent can decide whether to act on the full selection
  emit("remove-files", path);
};

const moveFile = (targetJobId: number, pathOrPaths: string | string[]): void => {
  const paths = Array.isArray(pathOrPaths)
    ? pathOrPaths
    : selectedFiles.value.includes(pathOrPaths) && selectedFiles.value.length > 0
    ? selectedFiles.value
    : [pathOrPaths];
  emit("move-files", { targetJobId, files: paths });
};

const moveFileToNewJob = (pathOrPaths: string | string[]): void => {
  const paths = Array.isArray(pathOrPaths)
    ? pathOrPaths
    : selectedFiles.value.includes(pathOrPaths) && selectedFiles.value.length > 0
    ? selectedFiles.value
    : [pathOrPaths];
  // Emit array so parent can use selection if appropriate
  emit("move-to-new-job", paths);
};

const copyFile = (targetJobId: number, pathOrPaths: string | string[]): void => {
  const paths = Array.isArray(pathOrPaths)
    ? pathOrPaths
    : selectedFiles.value.includes(pathOrPaths) && selectedFiles.value.length > 0
    ? selectedFiles.value
    : [pathOrPaths];
  emit("copy-files", { targetJobId, files: paths });
};

const copyFileToNewJob = (pathOrPaths: string | string[]): void => {
  const paths = Array.isArray(pathOrPaths)
    ? pathOrPaths
    : selectedFiles.value.includes(pathOrPaths) && selectedFiles.value.length > 0
    ? selectedFiles.value
    : [pathOrPaths];
  // Emit array so parent can use selection if appropriate
  emit("copy-to-new-job", paths);
};

const setFileMenuRef = (file: FileItem, el: any) => {
  if (el) {
    fileMenuRefs.value.set(file.path, el);
  }
};

const showFileContextMenu = (file: FileItem, event: MouseEvent) => {
  if (!props.isSelectable) return;
  if (!selectedFiles.value.includes(file.path)) {
    selectedFiles.value = [file.path];
    const fileIndex = sortedFiles.value.findIndex((f) => f.path === file.path);
    if (fileIndex !== -1) {
      lastClickedIndex.value = fileIndex;
    }
  }
  const menuRef = fileMenuRefs.value.get(file.path);
  menuRef?.openDropdown({ x: event.clientX, y: event.clientY });
};

// --- LOGGING ---
watch(visibleFiles, (newVisibleFiles) => {
  logRendering("FileTable", `Virtual scroll update: now showing ${newVisibleFiles.length} files.`);
});

// Emit selection changes so parent components (e.g., JobArea) stay in sync
watch(selectedFiles, (newSelection) => {
  emit("selection-changed", newSelection);
});

watch(columnStyles, (newStyle) => {
  logRendering("FileTable", `Column styles updated`, newStyle);
});

// Log lazy loading progress changes
watch(lazyLoadingProgress, (progress) => {
  if (progress.remaining > 0) {
    logRendering("FileTable", `📊 Lazy loading progress: ${progress.completed}/${progress.total} folders completed (${progress.percentage}%)`);
  } else if (progress.total > 0) {
    logRendering("FileTable", `✅ All folder statistics calculated! ${progress.total} folders completed.`);
  }
}, { deep: true });

// Watch for lazy loading updates from the store
watch(() => jobsStore.lazyLoadingUpdateTrigger, () => {
  // Force a re-computation of lazy loading progress
  logRendering("FileTable", `🔄 Lazy loading update triggered - recalculating progress`);
  
  // Force the component to re-render by triggering a reactive update
  nextTick(() => {
    // Force re-computation of computed properties
    const _ = visibleFiles.value.length;
    const __ = lazyLoadingProgress.value;
    logRendering("FileTable", `🔄 Forced re-render after lazy loading update`);
  });
}, { flush: 'post' });

// Add a more aggressive watcher for real-time updates during lazy loading
watch(() => jobsStore.lazyLoadingUpdateTrigger, (newTrigger, oldTrigger) => {
  if (newTrigger !== oldTrigger) {
    // Force immediate re-render of visible files
    nextTick(() => {
      // Trigger a reactive update by accessing computed properties
      const _ = visibleFiles.value.length;
      const __ = lazyLoadingProgress.value;
      logRendering("FileTable", `🔄 Triggered immediate re-render for lazy loading update (trigger: ${oldTrigger} → ${newTrigger})`);
    });
  }
}, { flush: 'post' });

// Add a watcher for individual file changes with more aggressive detection
watch(() => props.files, (newFiles, oldFiles) => {
  if (newFiles !== oldFiles) {
    const lazyLoadedCount = newFiles.filter(f => f.type === "Folder" && f.isLazyLoaded).length;
    const oldLazyLoadedCount = oldFiles?.filter(f => f.type === "Folder" && f.isLazyLoaded).length || 0;
    
    if (lazyLoadedCount !== oldLazyLoadedCount) {
      logRendering("FileTable", `📊 Files prop changed - lazy loaded folders: ${oldLazyLoadedCount} → ${lazyLoadedCount}`);
    }
    
    // Check for any files that changed from lazy loaded to loaded
    const changedFiles = newFiles.filter((file, index) => {
      const oldFile = oldFiles?.[index];
      return oldFile && 
             file.type === "Folder" && 
             oldFile.isLazyLoaded && 
             !file.isLazyLoaded;
    });
    
    if (changedFiles.length > 0) {
      logRendering("FileTable", `🔄 Detected ${changedFiles.length} files that finished lazy loading:`, 
        changedFiles.map(f => f.name));
      
      // Force a re-render
      nextTick(() => {
        const _ = visibleFiles.value.length;
        const __ = lazyLoadingProgress.value;
        logRendering("FileTable", `🔄 Forced re-render after detecting lazy loading completion`);
      });
    }
    
    // Always force a re-render when files change to ensure updates are visible
    nextTick(() => {
      const _ = visibleFiles.value.length;
      logRendering("FileTable", `🔄 Forced re-render due to files prop change`);
    });
  }
}, { deep: true, flush: 'post' });

// Add a watcher for the lazyLoadingUpdateTrigger with immediate execution
watch(() => jobsStore.lazyLoadingUpdateTrigger, () => {
  // Force a re-computation of lazy loading progress
  logRendering("FileTable", `🔄 Lazy loading update triggered - recalculating progress`);
  
  // Force the component to re-render by triggering a reactive update
  nextTick(() => {
    // Force re-computation of computed properties
    const _ = visibleFiles.value.length;
    const __ = lazyLoadingProgress.value;
    logRendering("FileTable", `🔄 Forced re-render after lazy loading update`);
  });
}, { flush: 'post', immediate: true });

// Add a watcher for the lazyLoadingProgress computed property to force updates
watch(() => lazyLoadingProgress.value, (newProgress, oldProgress) => {
  if (newProgress.remaining !== oldProgress.remaining || newProgress.completed !== oldProgress.completed) {
    logRendering("FileTable", `📊 Lazy loading progress changed: ${oldProgress.completed}/${oldProgress.total} → ${newProgress.completed}/${newProgress.total}`);
    
    // Force a re-render when progress changes
    nextTick(() => {
      const _ = visibleFiles.value.length;
      logRendering("FileTable", `🔄 Forced re-render due to lazy loading progress change`);
    });
  }
}, { deep: true, flush: 'post' });

// --- LIFECYCLE HOOKS ---
onMounted(() => {
  // NOOP: already handled above
});

onBeforeUpdate(() => {
  fileMenuRefs.value.clear();
  updateStartTime = performance.now();
  logLifecycle("FileTable", "Component is about to update...");
});

onUpdated(() => {
  const updateDuration = performance.now() - updateStartTime;
  logLifecycle("FileTable", `Component has been updated. Update duration: ${updateDuration.toFixed(2)}ms`);
});

watch(scrollComponentRef, (newRef) => {
  if (newRef) {
    const osInstance = newRef.osInstance();
    if (osInstance) {
      const viewportEl = osInstance.elements().viewport;
      const contentEl = osInstance.elements().content;
      viewportRef.value = viewportEl;
      try {
        // Disable momentum/elastic scrolling for this overlayscrollbars instance
        // -webkit-overflow-scrolling: auto disables iOS momentum
        // overscroll-behavior: contain prevents rubber-banding
        // scrollBehavior: auto avoids smooth scrolling side-effects
        if (viewportEl) {
          viewportEl.style.setProperty("-webkit-overflow-scrolling", "auto");
          viewportEl.style.setProperty("overscroll-behavior", "contain");
          viewportEl.style.setProperty("scroll-behavior", "auto");
        }
        if (contentEl) {
          contentEl.style.setProperty("-webkit-overflow-scrolling", "auto");
        }
      } catch (err) {
        // ignore
      }
    }
  }
});

// --- Global marquee blocker (app-level overlay) ---
let globalMarqueeBlocker: HTMLElement | null = null;
// Reference to the global click handler so it can be removed on unmount
let globalClickHandler: ((e: MouseEvent) => void) | null = null;
onMounted(() => {
  logLifecycle("FileTable", "Component has been mounted.");

  // Watch the root element for class changes so we can diagnose 'is-active' toggles
  try {
    nextTick(() => {
      const root = fileTableCompRef.value as HTMLElement | null;
      if (root) {
        // Log initial classes
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { logLifecycle } = require("@/utils/loggers");
          logLifecycle("FileTable", `root initial classes: ${Array.from(root.classList).join(' ')}`);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log("FileTable root initial classes:", root.className);
        }

        fileTableClassObserver = new MutationObserver((muts) => {
          for (const m of muts) {
            if (m.type === "attributes" && m.attributeName === "class") {
              const el = m.target as HTMLElement;
              // eslint-disable-next-line no-console
              console.log(`FileTable.classMutation: job=${props.jobId} class="${el.className}"`);
            }
          }
        });
        fileTableClassObserver.observe(root, { attributes: true, attributeFilter: ["class"] });
      }
    });
  } catch (err) {
    // ignore
  }

  // create a global blocker appended to body so it captures pointer events outside this component
  try {
    globalMarqueeBlocker = document.createElement("div");
    globalMarqueeBlocker.className = "marquee-blocker-global";
    // Inline styles (so they apply even without global CSS)
    Object.assign(globalMarqueeBlocker.style, {
      position: "fixed",
      inset: "0",
      background: "transparent",
      zIndex: "2000",
      pointerEvents: "auto",
    });

    // Watch marquee active state to add/remove from DOM
    watch(
      () => isMarqueeActive.value,
      (val) => {
        if (!globalMarqueeBlocker) return;
        
        if (val) {
          // Add to DOM when marquee becomes active
          if (!document.body.contains(globalMarqueeBlocker)) {
            document.body.appendChild(globalMarqueeBlocker);
          }
        } else {
          // Remove from DOM when marquee becomes inactive
          if (document.body.contains(globalMarqueeBlocker)) {
            document.body.removeChild(globalMarqueeBlocker);
          }
        }
      }
    );
  } catch (err) {
    // ignore if DOM unavailable
  }
  // install a global click handler to deselect when clicking empty space inside .job-content
  // store handler reference so it can be removed on unmount
  globalClickHandler = (event: MouseEvent) => {
    if (skipRootClick.value) {
      // ignore spurious click generated by mouseup after marquee
      skipRootClick.value = false;
      return;
    }
    if (isMarqueeActive.value) return; // ignore while dragging
    const target = event.target as HTMLElement;
    // If click is within a job-content but not on interactive name/checkbox/header/resizer, deselect
    if (target.closest(".job-content")) {
      const clickedOnName = !!target.closest(".item-name-content");
      const clickedOnCheckbox = !!target.closest(".item-checkbox");
      const isInteractive = !!target.closest(".row-actions") || !!target.closest(".table-header") || !!target.closest(".resizer");
      if (!clickedOnName && !clickedOnCheckbox && !isInteractive) {
        deselectAll();
      }
    }
  };

  window.addEventListener("click", globalClickHandler);
  // Listen for app-level outside clicks to deactivate job-content
  const outsideHandler = () => {
    isActive.value = false;
  };
  window.addEventListener("app:clicked-outside-job-content", outsideHandler as EventListener);
});

onUnmounted(() => {
  if (globalMarqueeBlocker && globalMarqueeBlocker.parentElement) {
    globalMarqueeBlocker.parentElement.removeChild(globalMarqueeBlocker);
    globalMarqueeBlocker = null;
  }
  if (globalClickHandler) {
    window.removeEventListener("click", globalClickHandler);
    globalClickHandler = null;
  }
  window.removeEventListener("app:clicked-outside-job-content", (() => {}) as EventListener);
});

// Programmatic setter so parents can toggle active state. Log for debugging.
const setActive = (val: boolean) => {
  try {
    if (!allowActivation.value) {
      // ignore attempts to activate when activatable is false
      return;
    }
    const prev = isActive.value;
    isActive.value = !!val;
    // log lifecycle/state change
    try {
      // prefer logLifecycle (component state changes)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { logLifecycle } = require("@/utils/loggers");
      logLifecycle("FileTable", `setActive called -> ${isActive.value} (was ${prev})`, {
        jobId: props.jobId,
      });
    } catch (e) {
      // fallback console
      // eslint-disable-next-line no-console
      console.log(`FileTable.setActive: job=${props.jobId} -> ${isActive.value} (was ${prev})`);
    }
  } catch (err) {
    // ignore
  }
};

defineExpose({
  deselectAll,
  toggleAll,
  selectedFiles,
  setActive,
});

// Watch isActive to add/remove the visual class only when activation allowed
watch(
  () => isActive.value,
  (val) => {
    const root = fileTableCompRef.value;
    if (!root) return;
    if (allowActivation.value) {
      if (val) root.classList.add("is-active");
      else root.classList.remove("is-active");
    } else {
      // ensure class removed if activation disabled
      root.classList.remove("is-active");
    }
  }
);
</script>

<style scoped src="./file-table-comp/file-table.scoped.css"></style>
