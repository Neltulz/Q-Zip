<!-- eslint-disable vue/no-v-html -->
<!--
  ChangelogModalContent.vue @preserve
-->
<!-- components/modals/ChangelogModalContent.vue -->
<!--
  ChangelogModalContent.vue @preserve
-->
<template>
  <div>
    <!-- Left column: version selector -->
    <div v-if="props.section === 'left'" class="changelog-sidebar">
      <h3 class="sidebar-title">Versions</h3>
      <CustomButtonGroup orientation="vertical" class="version-nav">
        <CustomButton
          data-name="changelog-version-0-1-24"
          :class="{ active: selected === '0.1.24' }"
          @click="emitSelected('0.1.24')"
          btn-theme="liter"
          button-style-class="trans-btn can-become-active"
        >
          v0.1.24
        </CustomButton>
        
        <CustomButton
          data-name="changelog-version-0-1-23"
          :class="{ active: selected === '0.1.23' }"
          @click="emitSelected('0.1.23')"
          btn-theme="liter"
          button-style-class="trans-btn can-become-active"
        >
          v0.1.23
        </CustomButton>
        
        <CustomButton
          data-name="changelog-version-all"
          :class="{ active: selected === 'all' }"
          @click="emitSelected('all')"
          btn-theme="liter"
          button-style-class="trans-btn can-become-active"
        >
          All Versions
        </CustomButton>
      </CustomButtonGroup>
    </div>

    <!-- Main column: changelog entries -->
    <div v-else-if="props.section === 'main'" class="changelog-content-area">
      <ChangelogMainContent :selected-version="selected" />
    </div>

    <!-- Right column: not used currently -->
    <div v-else-if="props.section === 'right'" />
  </div>
  
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import CustomButtonGroup from "@/components/CustomButtonGroup.vue";
import CustomButton from "@/components/CustomButton.vue";
import ChangelogMainContent from "@/components/modals/ChangelogMainContent.vue";

// Props and emits
const props = defineProps<{
  modalsStore?: any;
  modalId?: string;
  section?: 'left' | 'main' | 'right';
  selectedVersion?: string;
}>();

const emit = defineEmits<{
  (e: 'update:selectedVersion', value: string): void;
  (e: 'has-content', value: boolean): void;
}>();

// Selected version proxy (default to 0.1.24)
const selected = computed(() => props.selectedVersion ?? '0.1.24');
const emitSelected = (value: string) => emit('update:selectedVersion', value);

// Inform BaseModal if this section has content
const notifyHasContent = () => {
  if (props.section === 'left') emit('has-content', true);
  else if (props.section === 'right') emit('has-content', false);
};

onMounted(() => notifyHasContent());
watch(() => props.section, () => notifyHasContent(), { immediate: false });
</script>

<style scoped>
.changelog-content {
  max-width: 100%;
  padding: 0;
}

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
  .changelog-header h2 {
    font-size: 1.5rem;
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

/* Sidebar styling for left column */
.changelog-sidebar {
  padding: 1rem;
  height: 100%;
}

.sidebar-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-clr);
  margin: 0 0 1rem 0;
  text-align: center;
}

.version-nav {
  width: 100%;
}

/* Content area styling */
.changelog-content-area {
  padding: 1rem;
  height: 100%;
}

/* Version button styling */
.version-nav :deep(.custom-button) {
  justify-content: flex-start;
  text-align: left;
  font-size: 0.9rem;
  padding: 0.5rem 0.75rem;
  width: 100%;
}

.version-nav :deep(.custom-button.active) {
  background-color: var(--primary-clr);
  color: white;
}
</style>
