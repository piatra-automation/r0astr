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

    [:octicons-arrow-right-24: View macOS Downloads](https://github.com/piatra-automation/r0astr/releases/latest)

-   :fontawesome-brands-windows:{ .lg .middle } **Windows**

    ---

    For Windows 10/11 (64-bit)

    [:octicons-arrow-right-24: View Windows Downloads](https://github.com/piatra-automation/r0astr/releases/latest)

-   :fontawesome-brands-linux:{ .lg .middle } **Linux**

    ---

    For Ubuntu, Debian, and other distributions

    [:octicons-arrow-right-24: View Linux Downloads](https://github.com/piatra-automation/r0astr/releases/latest)

</div>

</div>

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

## Release Notes

See the [GitHub Releases](https://github.com/piatra-automation/r0astr/releases) page for detailed release notes and all available versions.

## Lite Version

Don't want to install anything? [Try r0astr Lite](app/index.html) directly in your browser. The lite version works without installation but doesn't include remote control features.

<script>
// OS detection for recommended download - links to releases page
document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('detected-os-download');
  if (!container) return;

  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();

  let os = 'unknown';
  let icon = '';

  if (platform.includes('mac') || platform.includes('iphone') || platform.includes('ipad')) {
    os = 'macOS';
    icon = '🍎';
  } else if (platform.includes('win')) {
    os = 'Windows';
    icon = '🪟';
  } else if (platform.includes('linux') || userAgent.includes('linux')) {
    os = 'Linux';
    icon = '🐧';
  }

  if (os !== 'unknown') {
    container.innerHTML = `
      <p style="margin-bottom: 1rem;">Detected: <strong>${os}</strong></p>
      <a href="https://github.com/piatra-automation/r0astr/releases/latest" class="md-button md-button--primary" style="font-size: 1.1rem; padding: 0.8rem 2rem;">
        ${icon} Download for ${os}
      </a>
      <p style="margin-top: 0.5rem; font-size: 0.9rem; opacity: 0.8;">Opens GitHub Releases page</p>
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
