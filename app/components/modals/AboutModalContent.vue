<!--
  AboutModalContent.vue @preserve
-->
<!-- components/modals/AboutModalContent.vue -->
<!--
  AboutModalContent.vue @preserve
-->
<template>
  <div class="about-content">
    <div class="about-header">
      <div class="app-icon">
        <Icon name="mdi:archive" size="48" />
      </div>
      <h2>Q-Zip</h2>
      <p class="app-description">Batch Process Archive Creation</p>
      <p class="version">Version 0.1.24</p>
    </div>

    <div class="about-body">
      <div class="info-section">
        <h3>About This Application</h3>
        <p>
          Q-Zip is a powerful desktop application designed for efficient batch processing of archive creation.
          It provides an intuitive interface for managing multiple compression jobs with advanced features
          for professional archive management.
        </p>
      </div>

      <div class="features-section">
        <h3>Key Features</h3>
        <ul class="features-list">
          <li>🔄 <strong>Batch Processing</strong> - Process multiple archive jobs simultaneously</li>
          <li>📁 <strong>Advanced File Management</strong> - Comprehensive file selection and organization tools</li>
          <li>⚙️ <strong>Customizable Settings</strong> - Global and job-specific compression configurations</li>
          <li>🎨 <strong>Modern UI</strong> - Clean, responsive interface with theme support</li>
          <li>⌨️ <strong>Keyboard Shortcuts</strong> - Full keyboard navigation and shortcuts</li>
          <li>🔧 <strong>Debug Tools</strong> - Built-in debugging and development tools</li>
        </ul>
      </div>

      <div class="technical-section">
        <h3>Technical Information</h3>
        <div class="tech-info">
          <div class="tech-item">
            <span class="label">Framework:</span>
            <span class="value">Nuxt 3 + Vue 3</span>
          </div>
          <div class="tech-item">
            <span class="label">UI:</span>
            <span class="value">Custom Component Library</span>
          </div>
          <div class="tech-item">
            <span class="label">Styling:</span>
            <span class="value">SCSS + CSS Variables</span>
          </div>
          <div class="tech-item">
            <span class="label">Platform:</span>
            <span class="value">Tauri (Rust + Web Technologies)</span>
          </div>
          <div class="tech-item">
            <span class="label">License:</span>
            <span class="value">GPL-3.0</span>
          </div>
        </div>
      </div>

      <div class="links-section">
        <h3>Links</h3>
        <div class="links-grid">
          <a href="#" class="link-item" @click="openExternalLink('https://github.com/yourusername/q-zip')">
            <Icon name="mdi:github" size="20" />
            <span>GitHub Repository</span>
          </a>
          <a href="#" class="link-item" @click="openExternalLink('https://github.com/yourusername/q-zip/releases')">
            <Icon name="mdi:download" size="20" />
            <span>Releases</span>
          </a>
          <a href="#" class="link-item" @click="openExternalLink('https://github.com/yourusername/q-zip/issues')">
            <Icon name="mdi:bug" size="20" />
            <span>Report Issues</span>
          </a>
          <a href="#" class="link-item" @click="openExternalLink('https://github.com/yourusername/q-zip/blob/main/README.md')">
            <Icon name="mdi:book-open" size="20" />
            <span>Documentation</span>
          </a>
        </div>
      </div>
    </div>

    <div class="about-footer">
      <p class="copyright">© 2025 Neil "Creepio" Moore. All rights reserved.</p>
      <p class="disclaimer">This application is provided as-is for educational and development purposes.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window';

const openExternalLink = async (url: string) => {
  try {
    // In a real Tauri app, you'd use the shell API to open external links
    // For now, we'll just log it
    console.log('Opening external link:', url);
    // Example: await open(url);
  } catch (error) {
    console.error('Failed to open external link:', error);
  }
};
</script>

<style scoped>
.about-content {
  max-width: 100%;
  padding: 0;
}

.about-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--brdr-clr);
}

.app-icon {
  margin-bottom: 1rem;
  color: var(--primary-clr);
}

.about-header h2 {
  margin: 0 0 0.25rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-clr);
}

.app-description {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: var(--text-clr-muted);
  font-weight: 500;
}

.version {
  margin: 0;
  font-size: 0.9rem;
  color: var(--primary-clr);
  font-weight: 600;
}

.about-body {
  margin-bottom: 2rem;
}

.info-section,
.features-section,
.technical-section,
.links-section {
  margin-bottom: 2rem;
}

.info-section h3,
.features-section h3,
.technical-section h3,
.links-section h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-clr);
  margin: 0 0 1rem 0;
}

.info-section p {
  margin: 0;
  line-height: 1.6;
  color: var(--text-clr-muted);
}

.features-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.features-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  line-height: 1.5;
  color: var(--text-clr-muted);
}

.features-list li strong {
  color: var(--text-clr);
}

.tech-info {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

.tech-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--brdr-clr-dark);
}

.tech-item:last-child {
  border-bottom: none;
}

.tech-item .label {
  font-weight: 600;
  color: var(--text-clr);
}

.tech-item .value {
  color: var(--text-clr-muted);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: var(--bg-clr-dark);
  border: 1px solid var(--brdr-clr);
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-clr);
  transition: all 0.2s ease;
  cursor: pointer;
}

.link-item:hover {
  background-color: var(--bg-clr-darkr);
  border-color: var(--primary-clr);
  color: var(--primary-clr);
}

.link-item span {
  font-weight: 500;
}

.about-footer {
  padding-top: 1.5rem;
  border-top: 1px solid var(--brdr-clr);
  text-align: center;
}

.copyright {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: var(--text-clr-muted);
}

.disclaimer {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-clr-muted);
  font-style: italic;
}

/* Responsive design */
@media (max-width: 768px) {
  .about-header h2 {
    font-size: 1.75rem;
  }

  .links-grid {
    grid-template-columns: 1fr;
  }

  .tech-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
