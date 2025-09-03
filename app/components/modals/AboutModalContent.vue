<!--
  AboutModalContent.vue @preserve
-->
<!-- components/modals/AboutModalContent.vue -->
<!--
  AboutModalContent.vue @preserve
-->
<template>
    <div class="app-icon grid-center">
      <Icon name="mdi:archive" size="48" />
    </div>
    <h2 class="grid-center">Q-Zip</h2>
    <p class="app-description grid-center">Batch Process Archive Creation</p>
    <p class="version grid-center">Version 0.1.24</p>
      <div class="info-section grid-center">
        <h3>About This Application</h3>
        <p>
          Q-Zip is a powerful desktop application designed for efficient batch processing of archive creation.
          It provides an intuitive interface for managing multiple compression jobs with advanced features
          for professional archive management.
        </p>
      </div>

      <div class="features-section grid-center">
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

      <div class="technical-section grid-breakout">
        <h3>Technical Information</h3>
        <div class="tech-info">
          <div class="tech-item">
            <span class="label">Framework:</span>
            <span class="value">Nuxt 3 + Vue 3</span>
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

      <div class="requirements-section grid-breakout">
        <h3>System Requirements</h3>
        <div class="requirements-info">
          <div class="requirement-item">
            <span class="label">Operating System:</span>
            <span class="value">Windows 11 Pro minimum, Linux supported, macOS untested</span>
          </div>
          <div class="requirement-item">
            <span class="label">Memory:</span>
            <span class="value">4GB RAM minimum (8GB recommended for large archives)</span>
          </div>
          <div class="requirement-item">
            <span class="label">Storage:</span>
            <span class="value">2GB free space minimum (plus space for archives)</span>
          </div>
          <div class="requirement-item">
            <span class="label">Processor:</span>
            <span class="value">x64-compatible CPU</span>
          </div>
          <div class="requirement-item">
            <span class="label">Runtime Dependencies:</span>
            <span class="value">WebView2 (Windows), system libraries (Linux/macOS)</span>
          </div>
        </div>
      </div>

      <div class="formats-section grid-center">
        <h3>Supported Formats & Capabilities</h3>
        <div class="formats-content">
          <div class="formats-subsection">
            <h4>Archive Formats</h4>
            <p>Same formats supported by 7-Zip for creation:</p>
            <div class="format-tags">
              <span class="format-tag">7Z</span>
              <span class="format-tag">ZIP</span>
              <span class="format-tag">TAR</span>
              <span class="format-tag">GZ</span>
              <span class="format-tag">BZ2</span>
              <span class="format-tag">XZ</span>
              <span class="format-tag">WIM</span>
            </div>
          </div>
          <div class="formats-subsection">
            <h4>Compression Algorithms</h4>
            <p>Same algorithms supported by 7-Zip:</p>
            <div class="format-tags">
              <span class="format-tag">LZMA</span>
              <span class="format-tag">LZMA2</span>
              <span class="format-tag">PPMd</span>
              <span class="format-tag">BCJ</span>
              <span class="format-tag">BCJ2</span>
              <span class="format-tag">BZip2</span>
              <span class="format-tag">Deflate</span>
            </div>
          </div>
        </div>
      </div>

      <div class="credits-section grid-center">
        <h3>Credits & Acknowledgments</h3>
        <div class="credits-content">
          <div class="credits-subsection">
            <h4>Compression Libraries</h4>
            <p>This application uses compression technology compatible with 7-Zip formats:</p>
            <ul class="credits-list">
              <li><strong>7-Zip:</strong> Archive format specifications and algorithms</li>
              <li><strong>LZMA SDK:</strong> Compression library implementation</li>
              <li><strong>Tauri:</strong> Cross-platform desktop framework</li>
              <li><strong>Nuxt 3 & Vue 3:</strong> Web framework and UI library</li>
            </ul>
          </div>
          <div class="credits-subsection">
            <h4>Contributors</h4>
            <p>Special thanks to:</p>
            <ul class="contributors-list">
              <li><strong>Grover "ThyGuyX":</strong> Testing, recommendations, and valuable feedback</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="privacy-section grid-center">
        <h3>Privacy & Security</h3>
        <div class="privacy-content">
          <div class="privacy-item">
            <h4>Data Collection</h4>
            <p>This application does not collect, transmit, or store any personal data or usage statistics.</p>
          </div>
          <div class="privacy-item">
            <h4>Security Measures</h4>
            <p>
              Files are processed locally on your device. Archive operations use industry-standard
              encryption algorithms when password protection is enabled. No data is sent to external servers.
            </p>
          </div>
          <div class="privacy-item">
            <h4>Data Handling</h4>
            <p>
              All file processing occurs in memory or temporary files on your local system.
              No files or data are uploaded, synced, or shared with any third-party services.
            </p>
          </div>
        </div>
      </div>

      <div class="contact-section grid-breakout">
        <h3>Contact Information</h3>
        <div class="contact-content">
          <div class="contact-item">
            <span class="label">Developer:</span>
            <span class="value">Neil "Creepio" Moore</span>
          </div>
          <div class="contact-item">
            <span class="label">Email:</span>
            <span class="value">neilvmoore@gmail.com</span>
          </div>
          <div class="contact-item">
            <span class="label">Support:</span>
            <span class="value">GitHub Issues (see Resources below)</span>
          </div>
        </div>
      </div>

      <div class="links-section grid-breakout">
        <h3>Resources</h3>
        <div class="links-grid">
          <CustomButton
            data-name="github-link"
            first-icon-name="mdi:github"
            first-icon-size="20"
            btn-theme="dark"
            @click="openExternalLink('https://github.com/neltulz/q-zip')"
          >
            GitHub Repository
          </CustomButton>
          <CustomButton
            data-name="releases-link"
            first-icon-name="mdi:download"
            first-icon-size="20"
            btn-theme="dark"
            @click="openExternalLink('https://github.com/Neltulz/Q-Zip/releases')"
          >
            Releases
          </CustomButton>
          <CustomButton
            data-name="issues-link"
            first-icon-name="mdi:bug"
            first-icon-size="20"
            btn-theme="dark"
            @click="openExternalLink('https://github.com/Neltulz/Q-Zip/issues')"
          >
            Report Issues
          </CustomButton>
          <CustomButton
            data-name="documentation-link"
            first-icon-name="mdi:book-open"
            first-icon-size="20"
            btn-theme="dark"
            :disabled="true"
          >
            Documentation
          </CustomButton>
          <CustomButton
            data-name="discord-link"
            first-icon-name="mdi:discord"
            first-icon-size="20"
            btn-theme="dark"
            :disabled="true"
          >
            Discord Server
          </CustomButton>
        </div>
      </div>
    <p class="liability-disclaimer grid-center">
      <strong>Disclaimer:</strong> The developer is not responsible for any damage, data loss, or issues that may occur to your computer, device, or files while using this application. Use this program at your own risk.
    </p>
    <p class="disclaimer grid-center">This application is provided as-is for educational and development purposes.</p>
 
</template>

<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window';
import CustomButton from '@/components/CustomButton.vue';

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
/* Unwrapped: .about-content, .about-header, .about-body, .about-footer */
/* Keep styles that still apply to specific elements */

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
  color: var(--blu-lite);
  font-weight: 600;
}

/* unified spacing */
.

.info-section,
.features-section,
.technical-section,
.requirements-section,
.formats-section,
.credits-section,
.privacy-section,
.contact-section,
.links-section {
  margin-bottom: 2rem;
}

/* grid helpers now provided by ContentGrid */

.technical-section,
.requirements-section,
.formats-section {
  width: 100%;
}

.credits-section,
.privacy-section,
.contact-section,
.links-section {
  width: 100%;
  margin-top: 2rem;
}

.info-section h3,
.features-section h3,
.technical-section h3,
.requirements-section h3,
.formats-section h3,
.credits-section h3,
.privacy-section h3,
.contact-section h3,
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
  max-width: var(--ideal-char-reading-count);
  width: auto;
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
  border-bottom: 1px solid var(--brdr-clr-liter);
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

.links-grid .custom-button {
  width: 100%;
  justify-content: start;
  padding: 0.75rem 1rem;
  box-shadow: none !important;
}

.about-footer {
  padding-top: 1.5rem;
  border-top: 1px solid var(--brdr-clr);
  text-align: center;
  /* Center footer text blocks */
  display: grid;
  justify-items: center;
}

.copyright {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: var(--text-clr-muted);
}

.liability-disclaimer {
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  color: var(--warning-clr, #d4a574);
  line-height: 1.5;
  max-width: var(--ideal-char-reading-count);
  width: auto;
  text-align: center;
}

.disclaimer {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-clr-muted);
  font-style: italic;
}

/* Requirements section styles */
.requirements-info {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.requirement-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--brdr-clr-liter);
  gap: 1rem;
}

.requirement-item:last-child {
  border-bottom: none;
}

.requirement-item .label {
  font-weight: 600;
  color: var(--text-clr);
  flex-shrink: 0;
  min-width: 140px;
}

.requirement-item .value {
  color: var(--text-clr-muted);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  text-align: right;
  flex: 1;
}

/* Formats section styles */
.formats-content {
  display: grid;
  gap: 1.5rem;
}

.formats-subsection h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-clr);
  margin: 0 0 0.5rem 0;
}

.formats-subsection p {
  margin: 0 0 1rem 0;
  color: var(--text-clr-muted);
  font-size: 0.9rem;
}

.format-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.format-tag {
  background-color: var(--bg-clr-dark);
  color: var(--text-clr);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  border: 1px solid var(--brdr-clr-liter);
}

/* Credits section styles */
.credits-content {
  display: grid;
  gap: 1.5rem;
}

.credits-subsection h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-clr);
  margin: 0 0 0.5rem 0;
}

.credits-subsection p {
  margin: 0 0 1rem 0;
  color: var(--text-clr-muted);
  font-size: 0.9rem;
}

.credits-list,
.contributors-list {
  margin: 0;
  padding-left: 1.5rem;
}

.credits-list li,
.contributors-list li {
  margin-bottom: 0.5rem;
  color: var(--text-clr-muted);
  line-height: 1.4;
}

.credits-list li:last-child,
.contributors-list li:last-child {
  margin-bottom: 0;
}

.credits-list li strong,
.contributors-list li strong {
  color: var(--text-clr);
}

/* Privacy section styles */
.privacy-content {
  display: grid;
  gap: 1.5rem;
}

.privacy-item h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-clr);
  margin: 0 0 0.5rem 0;
}

.privacy-item p {
  margin: 0;
  color: var(--text-clr-muted);
  line-height: 1.5;
  font-size: 0.9rem;
}

/* Contact section styles */
.contact-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.contact-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.5rem 0;
  gap: 1rem;
}

.contact-item .label {
  font-weight: 600;
  color: var(--text-clr);
  flex-shrink: 0;
  min-width: 100px;
}

.contact-item .value {
  color: var(--text-clr-muted);
  font-size: 0.9rem;
  text-align: right;
  flex: 1;
}

/* Responsive design */
@media (max-width: 768px) {
  .about-header h2 {
    font-size: 1.75rem;
  }

  .links-grid {
    grid-template-columns: 1fr;
  }

  .tech-item,
  .requirement-item,
  .contact-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .tech-item .value,
  .requirement-item .value,
  .contact-item .value {
    text-align: left;
  }

  .requirement-item .label,
  .contact-item .label {
    min-width: unset;
  }

  .format-tags {
    justify-content: center;
  }
}
</style>
