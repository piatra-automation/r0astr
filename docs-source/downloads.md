# Downloads

Get the full r0astr desktop application with remote control and WebSocket features.

<div id="download-section">

## Latest Release: <span id="release-version">Loading...</span>

<div id="detected-os-download" class="download-card primary">
  <p>Loading release information...</p>
</div>

## All Platforms

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

1. **Main interface** with 4 panels and a master panel
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
| macOS (Intel) | `.dmg`, `.zip` |
| macOS (Apple Silicon) | `.dmg`, `.zip` |
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
// Fetch latest release from GitHub API and build download links
document.addEventListener('DOMContentLoaded', async function() {
  const versionEl = document.getElementById('release-version');
  const primaryContainer = document.getElementById('detected-os-download');
  const allDownloadsContainer = document.getElementById('all-downloads');

  // Detect OS and architecture
  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();

  let detectedOS = 'unknown';
  let isAppleSilicon = false;

  if (platform.includes('mac')) {
    detectedOS = 'macos';
    // Check for Apple Silicon (M1/M2/M3)
    // navigator.userAgentData is more reliable but not always available
    if (navigator.userAgentData && navigator.userAgentData.platform === 'macOS') {
      // Modern detection via userAgentData
      isAppleSilicon = navigator.userAgent.includes('ARM');
    } else {
      // Fallback: check if running on ARM via canvas fingerprinting hint or just default to arm64 for newer Macs
      // For simplicity, we'll show both options for Mac users
      isAppleSilicon = true; // Assume Apple Silicon is more common now
    }
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

    // Categorize assets
    const downloads = {
      macos: { arm64: { dmg: null, zip: null }, x64: { dmg: null, zip: null } },
      windows: { installer: null, portable: null },
      linux: { appimage: null, deb: null }
    };

    assets.forEach(asset => {
      const name = asset.name.toLowerCase();
      const url = asset.browser_download_url;
      const size = (asset.size / (1024 * 1024)).toFixed(1) + ' MB';

      if (name.endsWith('.dmg')) {
        if (name.includes('arm64')) {
          downloads.macos.arm64.dmg = { url, name: asset.name, size };
        } else {
          downloads.macos.x64.dmg = { url, name: asset.name, size };
        }
      } else if (name.endsWith('.zip') && name.includes('mac')) {
        if (name.includes('arm64')) {
          downloads.macos.arm64.zip = { url, name: asset.name, size };
        } else {
          downloads.macos.x64.zip = { url, name: asset.name, size };
        }
      } else if (name.includes('setup') && name.endsWith('.exe')) {
        downloads.windows.installer = { url, name: asset.name, size };
      } else if (name.endsWith('.exe') && !name.includes('setup') && !name.includes('blockmap')) {
        downloads.windows.portable = { url, name: asset.name, size };
      } else if (name.endsWith('.appimage')) {
        downloads.linux.appimage = { url, name: asset.name, size };
      } else if (name.endsWith('.deb')) {
        downloads.linux.deb = { url, name: asset.name, size };
      }
    });

    // Build primary download section based on detected OS
    let primaryHTML = '';

    if (detectedOS === 'macos') {
      const arch = isAppleSilicon ? 'arm64' : 'x64';
      const archLabel = isAppleSilicon ? 'Apple Silicon' : 'Intel';
      const dmg = downloads.macos[arch].dmg;
      const altArch = isAppleSilicon ? 'x64' : 'arm64';
      const altLabel = isAppleSilicon ? 'Intel' : 'Apple Silicon';
      const altDmg = downloads.macos[altArch].dmg;

      primaryHTML = `
        <p style="margin-bottom: 0.5rem;"><strong>Detected: macOS (${archLabel})</strong></p>
        <p style="margin-bottom: 1rem; font-size: 0.9rem; opacity: 0.8;">Version ${version}</p>
        ${dmg ? `<a href="${dmg.url}" class="md-button md-button--primary download-btn">Download for ${archLabel} (${dmg.size})</a>` : ''}
        ${altDmg ? `<p style="margin-top: 1rem;"><a href="${altDmg.url}">Download for ${altLabel} instead</a></p>` : ''}
      `;
    } else if (detectedOS === 'windows') {
      const installer = downloads.windows.installer;
      const portable = downloads.windows.portable;

      primaryHTML = `
        <p style="margin-bottom: 0.5rem;"><strong>Detected: Windows</strong></p>
        <p style="margin-bottom: 1rem; font-size: 0.9rem; opacity: 0.8;">Version ${version}</p>
        ${installer ? `<a href="${installer.url}" class="md-button md-button--primary download-btn">Download Installer (${installer.size})</a>` : ''}
        ${portable ? `<p style="margin-top: 1rem;"><a href="${portable.url}">Download Portable Version (${portable.size})</a></p>` : ''}
      `;
    } else if (detectedOS === 'linux') {
      const appimage = downloads.linux.appimage;
      const deb = downloads.linux.deb;

      primaryHTML = `
        <p style="margin-bottom: 0.5rem;"><strong>Detected: Linux</strong></p>
        <p style="margin-bottom: 1rem; font-size: 0.9rem; opacity: 0.8;">Version ${version}</p>
        ${appimage ? `<a href="${appimage.url}" class="md-button md-button--primary download-btn">Download AppImage (${appimage.size})</a>` : ''}
        ${deb ? `<p style="margin-top: 1rem;"><a href="${deb.url}">Download .deb package (${deb.size})</a></p>` : ''}
      `;
    } else {
      primaryHTML = '<p>Please select your platform below.</p>';
    }

    primaryContainer.innerHTML = primaryHTML;

    // Build all downloads section
    let allHTML = '<div class="download-grid">';

    // macOS
    allHTML += `
      <div class="download-platform">
        <h3>macOS</h3>
        <ul>
    `;
    if (downloads.macos.arm64.dmg) {
      allHTML += `<li><a href="${downloads.macos.arm64.dmg.url}">Apple Silicon .dmg</a> (${downloads.macos.arm64.dmg.size})</li>`;
    }
    if (downloads.macos.x64.dmg) {
      allHTML += `<li><a href="${downloads.macos.x64.dmg.url}">Intel .dmg</a> (${downloads.macos.x64.dmg.size})</li>`;
    }
    if (downloads.macos.arm64.zip) {
      allHTML += `<li><a href="${downloads.macos.arm64.zip.url}">Apple Silicon .zip</a> (${downloads.macos.arm64.zip.size})</li>`;
    }
    if (downloads.macos.x64.zip) {
      allHTML += `<li><a href="${downloads.macos.x64.zip.url}">Intel .zip</a> (${downloads.macos.x64.zip.size})</li>`;
    }
    allHTML += '</ul></div>';

    // Windows
    allHTML += `
      <div class="download-platform">
        <h3>Windows</h3>
        <ul>
    `;
    if (downloads.windows.installer) {
      allHTML += `<li><a href="${downloads.windows.installer.url}">Installer .exe</a> (${downloads.windows.installer.size})</li>`;
    }
    if (downloads.windows.portable) {
      allHTML += `<li><a href="${downloads.windows.portable.url}">Portable .exe</a> (${downloads.windows.portable.size})</li>`;
    }
    allHTML += '</ul></div>';

    // Linux
    allHTML += `
      <div class="download-platform">
        <h3>Linux</h3>
        <ul>
    `;
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
});
</script>

<style>
.download-card.primary {
  background: var(--md-primary-fg-color--light);
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 2rem;
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
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--md-default-fg-color--lighter);
  padding-bottom: 0.5rem;
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
