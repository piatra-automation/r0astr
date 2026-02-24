# Downloads

<div class="download-hero">
  <img src="../assets/images/icon.png" alt="r0astr" class="download-hero__icon">
  <p>Get the full r0astr desktop application with remote control and WebSocket features.</p>
</div>

<div id="download-section">
<h2>Latest Release: <span id="release-version">Loading...</span></h2>
<div id="detected-os-download" class="download-card primary">
  <p>Loading release information...</p>
</div>
<h2>All Platforms</h2>
<div id="all-downloads">
  <p>Loading downloads...</p>
</div>
</div>

---

## Installation Instructions

=== "macOS"

    ### Install

    1. Download the `.dmg` file for your Mac (Intel or Apple Silicon)
    2. Open the downloaded `.dmg` file
    3. Drag **r0astr** to your **Applications** folder
    4. Eject the disk image

    ### First Launch

    !!! warning "Security Warning"
        macOS may show a warning because r0astr is not notarized by Apple.

    **If you see "r0astr is damaged" or "unidentified developer":**

    1. **Right-click** (or Control-click) the app
    2. Select **Open** from the menu
    3. Click **Open** in the dialog

    **Or use Terminal:**

    ```bash
    xattr -cr /Applications/r0astr.app
    ```

    Then open the app normally.

=== "Windows"

    ### Install (Installer Version)

    1. Download `r0astr-Setup-x.x.x.exe`
    2. Run the downloaded `.exe` file
    3. Follow the installation wizard
    4. Launch from Start Menu or Desktop shortcut

    ### Portable Version

    1. Download `r0astr-x.x.x.exe` (portable)
    2. Place the `.exe` anywhere you like
    3. Double-click to run (no installation needed)

    !!! warning "SmartScreen Warning"
        Windows may show a SmartScreen warning because r0astr is not signed.

    **To bypass:**

    1. Click **More info**
    2. Click **Run anyway**

=== "Linux"

    ### AppImage (Recommended)

    Works on most distributions.

    ```bash
    # Make it executable
    chmod +x r0astr-*.AppImage

    # Run it
    ./r0astr-*.AppImage
    ```

    !!! tip "Desktop Integration"
        Use [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher) to integrate with your desktop environment.

    ### Debian/Ubuntu (.deb)

    ```bash
    # Install
    sudo dpkg -i r0astr_*.deb

    # Fix any dependency issues
    sudo apt-get install -f
    ```

    Launch from your application menu or run `r0astr` in terminal.

---

## Verifying Installation

After installation, launch r0astr. You should see:

1. **Main interface** with panels and a master panel
2. **Default patterns** loaded in each panel

### First Steps

1. Click anywhere to enable audio
2. Click **Play** on Panel 1 to hear the default pattern
3. Try the [Getting Started](getting-started.md) guide

### Audio Check

If you don't hear sound:

- Check your system volume
- Ensure audio output is configured
- Try clicking on the page first (browsers require user interaction)
- See [Troubleshooting](guides/troubleshooting.md)

---

## Available Formats

| Platform | Formats |
|----------|---------|
| macOS (Universal — Intel + Apple Silicon) | `.dmg`, `.zip` |
| Windows | `.exe` (installer), `.exe` (portable) |
| Linux | `.AppImage`, `.deb` |

## System Requirements

| Platform | Minimum Requirements |
|----------|---------------------|
| macOS    | macOS 10.15 (Catalina) or later |
| Windows  | Windows 10 (64-bit) or later |
| Linux    | Ubuntu 20.04 or equivalent |

All platforms require:

- 4GB RAM (8GB recommended)
- 500MB disk space
- Audio output device

---

## Release Notes

See the [GitHub Releases](https://github.com/piatra-automation/r0astr/releases) page for detailed release notes and all available versions.

---

## Lite Version

Don't want to install anything? [Try r0astr Lite](app/index.html) directly in your browser. The lite version works without installation but doesn't include remote control features.

---

## Troubleshooting

Having issues? Check the [Troubleshooting Guide](guides/troubleshooting.md) for solutions to common problems.

<script>
// Platform SVG icons (simple, recognizable silhouettes)
var ICONS = {
  macos: '<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>',
  windows: '<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M3 12V6.5l8-1.1V12H3zm0 .5h8v6.6l-8-1.1V12.5zM11.5 5.3l9.5-1.3v8.5h-9.5V5.3zm0 7.2h9.5v8.5l-9.5-1.3V12.5z"/></svg>',
  linux: '<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.368 1.884 1.43.199.008.395-.024.585-.069l-.003.003c.759-.2 1.324-.667 1.495-1.334.201-.733-.038-1.476-.09-2.14-.03-.2-.04-.4-.04-.6.014-.178.042-.357.076-.535.088-.392.164-.785.166-1.182.008-.392-.06-.785-.186-1.157-.067-.217-.146-.43-.146-.648 0-.228.136-.47.196-.7.063-.468-.034-.725-.072-1.153-.066-.436-.1-.895-.28-1.328-.188-.398-.452-.764-.732-1.098-.258-.3-.579-.643-.75-.961-.05-.104-.089-.216-.099-.334-.156-1.178-.387-2.105-1.07-2.978C15.25 2.2 13.846.002 12.504 0z"/></svg>'
};

// Fetch latest release from GitHub API and build download links.
// Runs as an IIFE — DOMContentLoaded does not fire on MkDocs instant
// navigation (XHR-based SPA transitions), so we execute immediately.
(async function() {
  const versionEl = document.getElementById('release-version');
  const primaryContainer = document.getElementById('detected-os-download');
  const allDownloadsContainer = document.getElementById('all-downloads');
  if (!versionEl || !primaryContainer || !allDownloadsContainer) return;

  // Detect OS
  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();

  let detectedOS = 'unknown';
  if (platform.includes('mac')) {
    detectedOS = 'macos';
  } else if (platform.includes('win')) {
    detectedOS = 'windows';
  } else if (platform.includes('linux') || userAgent.includes('linux')) {
    detectedOS = 'linux';
  }

  try {
    const response = await fetch('https://api.github.com/repos/piatra-automation/r0astr/releases/latest');
    if (!response.ok) throw new Error('Failed to fetch release');

    const release = await response.json();
    const version = release.tag_name;
    const assets = release.assets;

    // Update version display
    versionEl.textContent = version;

    // Categorize assets — handles universal, arm64, and x64 builds
    const downloads = {
      macos: { dmg: [], zip: [] },
      windows: { installer: null, portable: null },
      linux: { appimage: null, deb: null }
    };

    assets.forEach(asset => {
      const name = asset.name.toLowerCase();
      const url = asset.browser_download_url;
      const size = (asset.size / (1024 * 1024)).toFixed(1) + ' MB';
      const info = { url, name: asset.name, size };

      // Determine architecture label from filename
      let archLabel = null;
      if (name.includes('universal')) archLabel = 'Universal';
      else if (name.includes('arm64')) archLabel = 'Apple Silicon';
      else if (name.includes('x64') || name.includes('x86_64')) archLabel = 'Intel';

      if (name.endsWith('.dmg')) {
        info.archLabel = archLabel || 'Universal';
        downloads.macos.dmg.push(info);
      } else if (name.endsWith('.zip') && (name.includes('mac') || name.includes('darwin'))) {
        info.archLabel = archLabel || 'Universal';
        downloads.macos.zip.push(info);
      } else if (name.includes('setup') && name.endsWith('.exe')) {
        downloads.windows.installer = info;
      } else if (name.endsWith('.exe') && !name.includes('setup') && !name.includes('blockmap')) {
        downloads.windows.portable = info;
      } else if (name.endsWith('.appimage')) {
        downloads.linux.appimage = info;
      } else if (name.endsWith('.deb')) {
        downloads.linux.deb = info;
      }
    });

    // Build primary download section based on detected OS
    let primaryHTML = '';
    const osIcon = ICONS[detectedOS] || '';

    if (detectedOS === 'macos') {
      const dmg = downloads.macos.dmg[0];
      primaryHTML = `
        <div class="download-card__icon">${osIcon}</div>
        <p style="margin-bottom: 0.5rem;"><strong>Detected: macOS</strong></p>
        <p style="margin-bottom: 1rem; font-size: 0.9rem; opacity: 0.8;">Version ${version}</p>
        ${dmg ? `<a href="${dmg.url}" class="md-button md-button--primary download-btn">Download ${dmg.archLabel} .dmg (${dmg.size})</a>` : ''}
      `;
    } else if (detectedOS === 'windows') {
      const installer = downloads.windows.installer;
      const portable = downloads.windows.portable;
      primaryHTML = `
        <div class="download-card__icon">${osIcon}</div>
        <p style="margin-bottom: 0.5rem;"><strong>Detected: Windows</strong></p>
        <p style="margin-bottom: 1rem; font-size: 0.9rem; opacity: 0.8;">Version ${version}</p>
        ${installer ? `<a href="${installer.url}" class="md-button md-button--primary download-btn">Download Installer (${installer.size})</a>` : ''}
        ${portable ? `<p style="margin-top: 1rem;"><a href="${portable.url}">Download Portable Version (${portable.size})</a></p>` : ''}
      `;
    } else if (detectedOS === 'linux') {
      const appimage = downloads.linux.appimage;
      const deb = downloads.linux.deb;
      primaryHTML = `
        <div class="download-card__icon">${osIcon}</div>
        <p style="margin-bottom: 0.5rem;"><strong>Detected: Linux</strong></p>
        <p style="margin-bottom: 1rem; font-size: 0.9rem; opacity: 0.8;">Version ${version}</p>
        ${appimage ? `<a href="${appimage.url}" class="md-button md-button--primary download-btn">Download AppImage (${appimage.size})</a>` : ''}
        ${deb ? `<p style="margin-top: 1rem;"><a href="${deb.url}">Download .deb package (${deb.size})</a></p>` : ''}
      `;
    } else {
      primaryHTML = '<p>Please select your platform below.</p>';
    }

    primaryContainer.innerHTML = primaryHTML;

    // Build all downloads section — one card per platform with icon
    let allHTML = '<div class="download-grid">';

    // macOS
    allHTML += `<div class="download-platform">
        <h3>${ICONS.macos} macOS</h3><ul>`;
    downloads.macos.dmg.forEach(d => {
      allHTML += `<li><a href="${d.url}">${d.archLabel} .dmg</a> (${d.size})</li>`;
    });
    downloads.macos.zip.forEach(d => {
      allHTML += `<li><a href="${d.url}">${d.archLabel} .zip</a> (${d.size})</li>`;
    });
    allHTML += '</ul></div>';

    // Windows
    allHTML += `<div class="download-platform">
        <h3>${ICONS.windows} Windows</h3><ul>`;
    if (downloads.windows.installer) {
      allHTML += `<li><a href="${downloads.windows.installer.url}">Installer .exe</a> (${downloads.windows.installer.size})</li>`;
    }
    if (downloads.windows.portable) {
      allHTML += `<li><a href="${downloads.windows.portable.url}">Portable .exe</a> (${downloads.windows.portable.size})</li>`;
    }
    allHTML += '</ul></div>';

    // Linux
    allHTML += `<div class="download-platform">
        <h3>${ICONS.linux} Linux</h3><ul>`;
    if (downloads.linux.appimage) {
      allHTML += `<li><a href="${downloads.linux.appimage.url}">AppImage</a> (${downloads.linux.appimage.size})</li>`;
    }
    if (downloads.linux.deb) {
      allHTML += `<li><a href="${downloads.linux.deb.url}">.deb package</a> (${downloads.linux.deb.size})</li>`;
    }
    allHTML += '</ul></div>';

    allHTML += '</div>';
    allDownloadsContainer.innerHTML = allHTML;

  } catch (error) {
    console.error('Failed to load release info:', error);
    versionEl.textContent = 'Error loading';
    primaryContainer.innerHTML = `
      <p>Failed to load release information.</p>
      <a href="https://github.com/piatra-automation/r0astr/releases/latest" class="md-button md-button--primary">View Releases on GitHub</a>
    `;
    allDownloadsContainer.innerHTML = `
      <p><a href="https://github.com/piatra-automation/r0astr/releases/latest">View all downloads on GitHub</a></p>
    `;
  }
})();
</script>

<style>
.download-hero {
  text-align: center;
  margin-bottom: 1.5rem;
}
.download-hero__icon {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  margin-bottom: 0.75rem;
}

.download-card.primary {
  background: var(--md-primary-fg-color--light);
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 2rem;
}

.download-card__icon {
  margin-bottom: 0.75rem;
}
.download-card__icon svg {
  opacity: 0.85;
}

.download-btn {
  font-size: 1.1rem !important;
  padding: 0.8rem 2rem !important;
}

.download-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-top: 1rem;
}

.download-platform h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--md-default-fg-color--lighter);
  padding-bottom: 0.5rem;
}
.download-platform h3 svg {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  opacity: 0.7;
}

.download-platform ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.download-platform li {
  margin: 0.5rem 0;
}
</style>
