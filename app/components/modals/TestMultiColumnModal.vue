<!--
  TestMultiColumnModal.vue - Demo content for modal body
-->
<template>
  <div>
    <div v-if="props.section === 'left'" class="demo-sidebar">
      <h3>Navigation</h3>
      <ul class="nav-list">
        <li :class="{ active: activeTab === 'home' }" @click="activeTab = 'home'">Home</li>
        <li :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">Settings</li>
        <li :class="{ active: activeTab === 'profile' }" @click="activeTab = 'profile'">Profile</li>
      </ul>

      <h4>Quick Links</h4>
      <ul class="nav-list">
        <li>Dashboard</li>
        <li>Projects</li>
        <li>Messages</li>
        <li>Analytics</li>
        <li>Reports</li>
      </ul>
    </div>

    <div v-else-if="props.section === 'main'">
      <TestMultiColumnMainContent :active-tab="activeTab" />
    </div>

    <div v-else-if="props.section === 'right'">
      <TestMultiColumnRightContent :modals-store="props.modalsStore" :modal-id="props.modalId" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import TestMultiColumnMainContent from "@/components/modals/TestMultiColumnMainContent.vue";
import TestMultiColumnRightContent from "@/components/modals/TestMultiColumnRightContent.vue";

// Component props
const props = defineProps<{
  modalsStore?: any;
  modalId?: string;
  section?: 'left' | 'main' | 'right';
}>();

// Reactive state
const activeTab = ref('home');
</script>

<style scoped>

.demo-sidebar {
  padding: 1rem;
  height: 100%;
}

.demo-sidebar h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: var(--text-clr);
  border-bottom: 1px solid var(--brdr-clr);
  padding-bottom: 0.5rem;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-list li {
  padding: 0.75rem 1rem;
  margin-bottom: 0.25rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.nav-list li:hover {
  background-color: var(--bg-clr-dark);
}

.nav-list li.active {
  background-color: var(--primary-clr);
  color: white;
}

.demo-sidebar h4 {
  margin: 1.5rem 0 0.5rem 0;
  font-size: 1rem;
  color: var(--text-clr);
  border-bottom: 1px solid var(--brdr-clr);
  padding-bottom: 0.25rem;
}

/* Responsive adjustments will be handled by BaseModal */
</style>
