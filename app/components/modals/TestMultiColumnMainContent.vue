<!--
  TestMultiColumnMainContent.vue - Main content for test modal
-->
<template>
  <div class="demo-main">
    <h2>{{ activeTab.charAt(0).toUpperCase() + activeTab.slice(1) }} Content</h2>
    <p>This is the main content area. Each tab shows different content here.</p>

    <div v-if="activeTab === 'home'" class="content-section">
      <h3>Welcome!</h3>
      <p>This demonstrates 3 independently scrollable columns side-by-side.</p>
      <ul>
        <li>Left column scrolls independently</li>
        <li>Main content scrolls independently</li>
        <li>Right column scrolls independently</li>
      </ul>
      <p>This is a test paragraph to ensure the component loads properly.</p>
    </div>

    <div v-if="activeTab === 'settings'" class="content-section">
      <h3>Settings Panel</h3>
      <p>Configure your preferences here.</p>
      <div class="settings-grid">
        <label><input type="checkbox" v-model="notifications"> Enable notifications</label>
        <label><input type="checkbox" v-model="darkMode"> Dark mode</label>
        <label><input type="checkbox" v-model="autoSave"> Auto-save</label>
      </div>
    </div>

    <div v-if="activeTab === 'profile'" class="content-section">
      <h3>User Profile</h3>
      <p>Manage your profile information.</p>
      <div class="profile-info">
        <p><strong>Name:</strong> Demo User</p>
        <p><strong>Email:</strong> demo@example.com</p>
        <p><strong>Role:</strong> Developer</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

// Component props
const props = defineProps<{
  activeTab?: string;
}>();

// Reactive state
const activeTab = ref(props.activeTab || 'home');
const notifications = ref(true);
const darkMode = ref(false);
const autoSave = ref(true);

// Methods
const showAlert = (message: string) => {
  alert(`Clicked: ${message}`);
};
</script>

<style scoped>
.demo-main {
  padding: 1rem;
  flex: 1;
}

.demo-main h2 {
  margin: 0 0 1rem 0;
  color: var(--text-clr);
}

.demo-main p {
  margin: 0 0 1rem 0;
  color: var(--text-clr-muted);
}

.content-section {
  background: var(--bg-clr-dark);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.content-section h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-clr);
}

.settings-grid {
  display: grid;
  gap: 0.75rem;
}

.settings-grid label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: var(--text-clr);
}

.profile-info {
  background: var(--bg-clr);
  padding: 1rem;
  border-radius: 4px;
}

.profile-info p {
  margin: 0.5rem 0;
  color: var(--text-clr-muted);
}
</style>
