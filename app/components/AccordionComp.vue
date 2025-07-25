<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/AccordionComp.vue @preserve -->
<!--
 * Accordion Component
  A customizable accordion component for displaying collapsible sections.

 * Props:
  - categories: Array of strings representing the section names.
  - icons: Object mapping category names to icon names (e.g., { general: 'mdi:cog' }).
  - firstIconSize: Optional number or string for the size of the first icon.
  - lastIconSize: Optional number or string for the size of the last icon (chevron).
  - defaultExpanded: Optional boolean to expand all sections by default.
  - columns: Optional number of columns to distribute the accordion items (default: 1).
  - minColumnWidth: Optional minimum width for each column (default: '300px').
  - buttonNames: Optional object mapping category names to data-name values for CustomButton.

 * Usage:
  <AccordionComp
    :categories="['general', 'advanced']"
    :icons="{ general: 'mdi:cog', advanced: 'mdi:brain' }"
    :first-icon-size="24"
    :last-icon-size="20"
    default-expanded
    :columns="2"
    min-column-width="350px"
    :button-names="{ general: 'general-btn', advanced: 'advanced-btn' }"
  >
    <template #general>
      <p>Content for general settings</p>
    </template>
    <template #advanced>
      <p>Content for advanced settings</p>
    </template>
  </AccordionComp>
-->

<template>
  <div ref="accordionRef" class="accordion" :class="{ 'initial-render': isInitialRender }" data-component-name="AccordionComp">
    <div
      ref="accordionWrapperRef"
      class="accordion-wrapper"
      :style="{ 'grid-template-columns': `repeat(${effectiveColumns}, 1fr)` }"
    >
      <div v-for="(columnCategories, colIndex) in columnsData" :key="colIndex" class="accordion-column">
        <div v-for="category in columnCategories" :key="category" class="accordion-item">
          <CustomButton
            class="category-header"
            :class="{ 'is-open': openSections.includes(category) }"
            :first-icon-name="props.icons[category]"
            :first-icon-size="props.firstIconSize"
            :last-icon-name="openSections.includes(category) ? 'mdi:chevron-up' : 'mdi:chevron-down'"
            :last-icon-size="props.lastIconSize"
            button-style-class="trans-btn"
            :data-name="props.buttonNames?.[category] || ''"
            @click="toggleSection(category)"
          >
            <span class="text">{{ category.charAt(0).toUpperCase() + category.slice(1) }}</span>
          </CustomButton>
          <div class="category-content" :data-category="category">
            <div class="category-content-inner">
              <slot :name="category" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted, nextTick } from "vue";

const props = defineProps<{
  categories: string[];
  icons: Record<string, string>;
  firstIconSize?: string | number;
  lastIconSize?: string | number;
  defaultExpanded?: boolean;
  columns?: number;
  minColumnWidth?: string;
  buttonNames?: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: "toggle-clicked" | "transition-end"): void;
}>();

const maxColumns = computed((): number => props.columns || 1);
const minColumnWidth = computed((): string => props.minColumnWidth || "300px");

// Initialize openSections based on defaultExpanded before initial render
const openSections = ref<string[]>(props.defaultExpanded ? [...props.categories] : []);
const accordionRef = ref<HTMLElement | null>(null);
const accordionWrapperRef = ref<HTMLElement | null>(null);
const currentColumns = ref<number>(1);
const isInitialRender = ref<boolean>(true);

const effectiveColumns = computed((): number => {
  const totalItems: number = props.categories.length;
  const maxCols: number = currentColumns.value;
  if (totalItems === 0 || maxCols <= 0) return 0;
  return Math.min(maxCols, totalItems);
});

const calculateOptimalColumns = (): number => {
  if (!accordionRef.value) return 1;
  const containerWidth: number = accordionRef.value.offsetWidth;
  const minWidth: number = parseInt(minColumnWidth.value, 10);
  const gap: number = parseFloat(getComputedStyle(accordionRef.value).getPropertyValue("--pad-blok")) || 0;
  let optimalCols: number = 1;
  for (let cols = 1; cols <= maxColumns.value; cols++) {
    const requiredWidth: number = minWidth * cols + gap * (cols - 1);
    if (containerWidth >= requiredWidth) {
      optimalCols = cols;
    } else {
      break;
    }
  }
  return optimalCols;
};

const throttle = <T extends (...args: unknown[]) => void>(func: T, limit: number): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

const debounce = <T extends (...args: unknown[]) => void>(func: T, delay: number): ((...args: Parameters<T>) => void) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const throttledResize = throttle(() => {
  currentColumns.value = calculateOptimalColumns();
}, 250);

const debouncedResize = debounce(() => {
  currentColumns.value = calculateOptimalColumns();
}, 500);

const handleResize = (): void => {
  throttledResize();
  debouncedResize();
};

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  currentColumns.value = calculateOptimalColumns();
  resizeObserver = new ResizeObserver(handleResize);
  if (accordionRef.value) {
    resizeObserver.observe(accordionRef.value);
  }
  nextTick(() => {
    isInitialRender.value = false;
  });
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

const toggleSection = (category: string): void => {
  if (openSections.value.includes(category)) {
    openSections.value = openSections.value.filter((c) => c !== category);
  } else {
    openSections.value = [...openSections.value, category];
  }
  emit("toggle-clicked");
  const contentElement = accordionWrapperRef.value?.querySelector(
    `.category-content[data-category="${category}"]`
  ) as HTMLElement | null;
  if (contentElement) {
    contentElement.addEventListener(
      "transitionend",
      () => {
        emit("transition-end");
      },
      { once: true }
    );
  }
};

const columnsData = computed((): string[][] => {
  const cols: number = effectiveColumns.value;
  if (cols === 0) return [];
  const totalItems: number = props.categories.length;
  const base: number = Math.floor(totalItems / cols);
  const remainder: number = totalItems % cols;
  const result: string[][] = [];
  let index: number = 0;
  for (let i = 0; i < cols; i++) {
    const columnSize: number = base + (i < remainder ? 1 : 0);
    const column: string[] = props.categories.slice(index, index + columnSize);
    result.push(column);
    index += columnSize;
  }
  return result;
});

watch([maxColumns, minColumnWidth], () => {
  currentColumns.value = calculateOptimalColumns();
});
</script>

<style scoped>
.accordion {
  container-name: accordion;
  container-type: inline-size;

  &.initial-render {
    .accordion-item {
      .category-content {
        transition: none;
      }
    }
  }

  .accordion-wrapper {
    display: grid;
    gap: var(--pad-blok);
  }
}

.accordion-column {
  display: flex;
  flex-direction: column;
  row-gap: var(--pad-blok);

  .accordion-item {
    display: grid;
    grid-template-rows: auto 1fr;

    .category-header {
      justify-content: flex-start;

      .button-content {
        .text {
          font-size: 1.25em;
          font-weight: 500;
          color: var(--txt-clr-liter);
        }
      }

      &:deep(.last-icon) {
        margin-inline-start: auto;
      }

      &.is-open {
        &:deep(.custom-button .last-icon) {
          transform: rotate(180deg);
        }

        + .category-content {
          height: auto;
          visibility: visible;
        }
      }

      &:deep(.visual-style) {
        border-block-end: 1px solid var(--brdr-clr-liter);
        border-block-start: 0;
        border-inline-end: 0;
        border-inline-start: 0;
        border-radius: 0;
      }
    }

    .category-content {
      height: 0;
      overflow: clip;
      padding-inline: var(--pad-in);
      transition: height 500ms ease, visibility 500ms ease;
      visibility: hidden;

      .category-content-inner {
        padding-block: var(--pad-in);
      }
    }
  }

  > .accordion-item {
    &:last-child {
      .category-header {
        &:not(.is-open) {
          &:deep(.visual-style) {
            border-block-end-color: transparent;
          }
        }
      }
    }
  }
}
</style>
