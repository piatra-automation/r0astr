# Downloads

Get the full r0astr desktop application with remote control and WebSocket features.

<div id="download-section">

## Recommended Download

<div id="detected-os-download" class="download-card primary">
  <p>Detecting your operating system...</p>
</div>

## All Platforms

<div class="grid cards" markdown>

-   :fontawesome-brands-apple:{ .lg .middle } **macOS**

    ---

    For Intel and Apple Silicon Macs

    - [Download DMG (Universal)](https://github.com/piatra-automation/r0astr/releases/latest/download/r0astr-mac-universal.dmg)
    - [Download ZIP (Intel)](https://github.com/piatra-automation/r0astr/releases/latest/download/r0astr-mac-x64.zip)
    - [Download ZIP (Apple Silicon)](https://github.com/piatra-automation/r0astr/releases/latest/download/r0astr-mac-arm64.zip)

-   :fontawesome-brands-windows:{ .lg .middle } **Windows**

    ---

    For Windows 10/11 (64-bit)

    - [Download Installer (.exe)](https://github.com/piatra-automation/r0astr/releases/latest/download/r0astr-Setup.exe)
    - [Download Portable (.exe)](https://github.com/piatra-automation/r0astr/releases/latest/download/r0astr-portable.exe)

-   :fontawesome-brands-linux:{ .lg .middle } **Linux**

    ---

    For Ubuntu, Debian, and other distributions

    - [Download AppImage](https://github.com/piatra-automation/r0astr/releases/latest/download/r0astr.AppImage)
    - [Download .deb](https://github.com/piatra-automation/r0astr/releases/latest/download/r0astr.deb)

</div>

</div>

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

## Release Notes

See the [GitHub Releases](https://github.com/piatra-automation/r0astr/releases) page for detailed release notes and all available versions.

## Lite Version

Don't want to install anything? [Try r0astr Lite](app/index.html) directly in your browser. The lite version works without installation but doesn't include remote control features.

<script>
// OS detection for recommended download
document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('detected-os-download');
  if (!container) return;

  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();

  let os = 'unknown';
  let downloadUrl = '';
  let downloadText = '';
  let icon = '';

  if (platform.includes('mac') || platform.includes('iphone') || platform.includes('ipad')) {
    os = 'macOS';
    downloadUrl = 'https://github.com/piatra-automation/r0astr/releases/latest/download/r0astr-mac-universal.dmg';
    downloadText = 'Download for macOS';
    icon = '🍎';
  } else if (platform.includes('win')) {
    os = 'Windows';
    downloadUrl = 'https://github.com/piatra-automation/r0astr/releases/latest/download/r0astr-Setup.exe';
    downloadText = 'Download for Windows';
    icon = '🪟';
  } else if (platform.includes('linux') || userAgent.includes('linux')) {
    os = 'Linux';
    downloadUrl = 'https://github.com/piatra-automation/r0astr/releases/latest/download/r0astr.AppImage';
    downloadText = 'Download for Linux';
    icon = '🐧';
  }

  if (os !== 'unknown') {
    container.innerHTML = `
      <p style="margin-bottom: 1rem;">Detected: <strong>${os}</strong></p>
      <a href="${downloadUrl}" class="md-button md-button--primary" style="font-size: 1.1rem; padding: 0.8rem 2rem;">
        ${icon} ${downloadText}
      </a>
    `;
  } else {
    container.innerHTML = '<p>Please select your platform below.</p>';
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
</style>
