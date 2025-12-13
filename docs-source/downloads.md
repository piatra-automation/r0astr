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

---

## Installation Instructions

=== "macOS"

    ### Download

    1. Go to [GitHub Releases](https://github.com/piatra-automation/r0astr/releases/latest)
    2. Download the `.dmg` file for your Mac:
        - **Intel Mac:** `r0astr-x.x.x.dmg`
        - **Apple Silicon (M1/M2/M3):** `r0astr-x.x.x-arm64.dmg`

    ### Install

    1. Open the downloaded `.dmg` file
    2. Drag **r0astr** to your **Applications** folder
    3. Eject the disk image

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

    ### Download

    1. Go to [GitHub Releases](https://github.com/piatra-automation/r0astr/releases/latest)
    2. Download one of:
        - `r0astr-Setup-x.x.x.exe` - Installer (recommended)
        - `r0astr-x.x.x-portable.exe` - Portable version

    ### Install (Installer Version)

    1. Run the downloaded `.exe` file
    2. Follow the installation wizard
    3. Launch from Start Menu or Desktop shortcut

    ### Portable Version

    1. Place the `.exe` anywhere you like
    2. Double-click to run (no installation needed)

    !!! warning "SmartScreen Warning"
        Windows may show a SmartScreen warning because r0astr is not signed.

    **To bypass:**

    1. Click **More info**
    2. Click **Run anyway**

=== "Linux"

    ### AppImage (Recommended)

    Works on most distributions.

    ```bash
    # Download the AppImage
    wget https://github.com/piatra-automation/r0astr/releases/latest/download/r0astr-x.x.x.AppImage

    # Make it executable
    chmod +x r0astr-*.AppImage

    # Run it
    ./r0astr-*.AppImage
    ```

    !!! tip "Desktop Integration"
        Use [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher) to integrate with your desktop environment.

    ### Debian/Ubuntu (.deb)

    ```bash
    # Download the .deb package
    wget https://github.com/piatra-automation/r0astr/releases/latest/download/r0astr_x.x.x_amd64.deb

    # Install
    sudo dpkg -i r0astr_*.deb

    # Fix any dependency issues
    sudo apt-get install -f
    ```

    Launch from your application menu or run `r0astr` in terminal.

---

## Verifying Installation

After installation, launch r0astr. You should see:

1. **Splash screen** with r0astr logo (briefly)
2. **Main interface** with 4 panels and a master panel
3. **Default patterns** loaded in each panel

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
