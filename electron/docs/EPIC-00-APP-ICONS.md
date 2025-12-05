# Epic 00: Application Icons

## Overview

Create and integrate application icons for all supported platforms (macOS, Windows, Linux) to enable professional distribution of the r0astr desktop application.

## Business Value

- Professional appearance in OS dock/taskbar
- Required for app store distribution
- Brand recognition
- User trust and legitimacy

## Dependencies

- None (foundational epic)

## Deliverables

- macOS icon file (`.icns`)
- Windows icon file (`.ico`)
- Linux icon set (PNG folder)
- Source artwork files
- Icon generation toolchain

---

## Story 0.1: Design Source Artwork

### Description
Create or commission a high-resolution source image for the r0astr application icon that works at all sizes from 16x16 to 1024x1024.

### Acceptance Criteria
- [ ] Source image is 1024x1024 pixels minimum
- [ ] Image is in PNG format with transparency
- [ ] Design is recognizable at 16x16 (favicon size)
- [ ] Design is visually appealing at 512x512 (dock size)
- [ ] Design aligns with r0astr brand identity
- [ ] No copyright/trademark issues with design elements

### Design Considerations
- Simple, bold shapes work best at small sizes
- Avoid fine text or detailed elements
- Consider how it looks against both light and dark backgrounds
- Music/audio visual metaphor recommended

### Validation
- [ ] Design review with stakeholders
- [ ] Test render at 16, 32, 64, 128, 256, 512, 1024px
- [ ] Verify readability at each size

### Deliverables
- `/build-resources/source/icon-1024.png`
- `/build-resources/source/icon-design.sketch` (or Figma link)

---

## Story 0.2: Generate macOS Icon

### Description
Convert source artwork to macOS `.icns` format containing all required resolutions.

### Acceptance Criteria
- [ ] `.icns` file contains all required sizes: 16, 32, 64, 128, 256, 512, 1024px
- [ ] Includes @2x variants for Retina displays
- [ ] File validates with `iconutil --convert icns`
- [ ] Icon displays correctly in Finder
- [ ] Icon displays correctly in Dock
- [ ] Icon displays correctly in Spotlight

### Technical Requirements
```
icon.iconset/
├── icon_16x16.png
├── icon_16x16@2x.png
├── icon_32x32.png
├── icon_32x32@2x.png
├── icon_64x64.png
├── icon_64x64@2x.png
├── icon_128x128.png
├── icon_128x128@2x.png
├── icon_256x256.png
├── icon_256x256@2x.png
├── icon_512x512.png
└── icon_512x512@2x.png
```

### Generation Command
```bash
iconutil --convert icns icon.iconset --output icon.icns
```

### Validation
- [ ] Build macOS app with `npm run electron:build:mac`
- [ ] Verify icon in `/Applications` folder
- [ ] Verify icon in Dock (running and pinned)
- [ ] Verify icon in Activity Monitor
- [ ] Verify icon in Spotlight search results

### Deliverables
- `/build-resources/icon.icns`

---

## Story 0.3: Generate Windows Icon

### Description
Convert source artwork to Windows `.ico` format containing all required resolutions.

### Acceptance Criteria
- [ ] `.ico` file contains sizes: 16, 32, 48, 64, 128, 256px
- [ ] File validates in Windows Explorer
- [ ] Icon displays correctly in taskbar
- [ ] Icon displays correctly in Start menu
- [ ] Icon displays correctly in Explorer (all view modes)
- [ ] Icon displays correctly in Alt+Tab switcher

### Technical Requirements
The `.ico` format must contain multiple embedded images:
- 16x16 (small icons, system tray)
- 32x32 (medium icons)
- 48x48 (large icons)
- 64x64 (extra large)
- 128x128 (jumbo)
- 256x256 (high DPI displays)

### Validation
- [ ] Build Windows app with `npm run electron:build:win`
- [ ] Test on Windows 10
- [ ] Test on Windows 11
- [ ] Verify in all Explorer view modes (small, medium, large, extra large)
- [ ] Verify taskbar appearance
- [ ] Verify installer icon

### Deliverables
- `/build-resources/icon.ico`

---

## Story 0.4: Generate Linux Icons

### Description
Create PNG icon set for Linux desktop environments following freedesktop.org specifications.

### Acceptance Criteria
- [ ] PNG files at sizes: 16, 32, 48, 64, 128, 256, 512px
- [ ] Icons named correctly for freedesktop.org standard
- [ ] Icons display in GNOME Files (Nautilus)
- [ ] Icons display in KDE Dolphin
- [ ] Icons display in application launchers
- [ ] `.desktop` file references icons correctly

### Technical Requirements
```
build-resources/icons/
├── 16x16.png
├── 32x32.png
├── 48x48.png
├── 64x64.png
├── 128x128.png
├── 256x256.png
└── 512x512.png
```

### Validation
- [ ] Build Linux app with `npm run electron:build:linux`
- [ ] Test AppImage on Ubuntu 22.04
- [ ] Test AppImage on Fedora 38
- [ ] Test `.deb` on Debian-based systems
- [ ] Verify icon in file manager
- [ ] Verify icon in application menu

### Deliverables
- `/build-resources/icons/` directory with all PNGs

---

## Story 0.5: Automate Icon Generation

### Description
Create a reproducible toolchain for generating all icon formats from a single source image.

### Acceptance Criteria
- [ ] Single npm script generates all formats
- [ ] Script handles source image validation
- [ ] Script produces consistent output
- [ ] Process is documented in README
- [ ] Works on macOS, Windows, Linux dev machines

### Implementation Options

**Option A: electron-icon-maker (npm)**
```bash
npm install -D electron-icon-maker
npx electron-icon-maker --input=./source/icon-1024.png --output=./
```

**Option B: Custom script with sharp**
```javascript
// scripts/generate-icons.js
const sharp = require('sharp');
const toIco = require('to-ico');
const fs = require('fs');

const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];
// ... generation logic
```

**Option C: ImageMagick CLI**
```bash
convert icon-1024.png -resize 256x256 icon.ico
```

### package.json Addition
```json
{
  "scripts": {
    "icons:generate": "electron-icon-maker --input=./build-resources/source/icon-1024.png --output=./build-resources"
  }
}
```

### Validation
- [ ] Run `npm run icons:generate` from clean state
- [ ] Verify all output files created
- [ ] Verify output matches manually created icons
- [ ] Test on macOS dev machine
- [ ] Test on Windows dev machine (if available)

### Deliverables
- `/scripts/generate-icons.js` or npm script
- Updated `package.json`
- Updated `build-resources/README.md`

---

## Story 0.6: Update Build Configuration

### Description
Ensure electron-builder configuration correctly references all icon files.

### Acceptance Criteria
- [ ] `electron-builder.json` references correct icon paths
- [ ] Build succeeds on all platforms
- [ ] Built apps contain correct icons
- [ ] Installers display correct icons

### Configuration Updates

```json
// electron-builder.json
{
  "mac": {
    "icon": "build-resources/icon.icns"
  },
  "win": {
    "icon": "build-resources/icon.ico"
  },
  "linux": {
    "icon": "build-resources/icons"
  },
  "nsis": {
    "installerIcon": "build-resources/icon.ico",
    "uninstallerIcon": "build-resources/icon.ico"
  }
}
```

### Validation
- [ ] `npm run electron:build:mac` succeeds with icons
- [ ] `npm run electron:build:win` succeeds with icons
- [ ] `npm run electron:build:linux` succeeds with icons
- [ ] Manual inspection of built applications

### Deliverables
- Updated `/electron-builder.json`

---

## Story 0.7: Create Favicon for Remote Interface

### Description
Create web favicon for the remote control interface (`remote.html`) accessible via browser.

### Acceptance Criteria
- [ ] `favicon.ico` created for browser tab
- [ ] `apple-touch-icon.png` for iOS home screen
- [ ] `favicon-32x32.png` for modern browsers
- [ ] `favicon-16x16.png` for legacy support
- [ ] HTML references added to `remote.html` and `index.html`

### HTML Addition
```html
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
```

### Validation
- [ ] Favicon visible in browser tab (Chrome, Firefox, Safari)
- [ ] Apple touch icon works on iOS "Add to Home Screen"
- [ ] Icons survive Vite build process

### Deliverables
- `/static/favicon.ico`
- `/static/favicon-32x32.png`
- `/static/favicon-16x16.png`
- `/static/apple-touch-icon.png`
- Updated `index.html`
- Updated `remote.html`

---

## Testing Checklist

### Platform Testing Matrix

| Test | macOS Intel | macOS ARM | Windows 10 | Windows 11 | Ubuntu | Fedora |
|------|-------------|-----------|------------|------------|--------|--------|
| App icon in dock/taskbar | | | | | | |
| App icon in file manager | | | | | | |
| App icon in app switcher | | | | | | |
| Installer icon | | | | | | |
| Favicon in browser | | | | | | |

### Visual QA Checklist

- [ ] Icon is sharp at all sizes (no blurring)
- [ ] Icon has no visible artifacts
- [ ] Icon background transparency works
- [ ] Icon is recognizable at 16x16
- [ ] Icon colors are consistent across formats
- [ ] Icon looks good on light backgrounds
- [ ] Icon looks good on dark backgrounds

---

## Definition of Done

- [ ] All icon formats generated and committed
- [ ] Build configuration updated
- [ ] Builds succeed on all platforms
- [ ] Visual QA passed
- [ ] Documentation updated
- [ ] Icon generation process documented and reproducible

---

## Estimated Effort

| Story | Points | Notes |
|-------|--------|-------|
| 0.1 Design Source Artwork | 3 | Depends on design resources |
| 0.2 Generate macOS Icon | 1 | |
| 0.3 Generate Windows Icon | 1 | |
| 0.4 Generate Linux Icons | 1 | |
| 0.5 Automate Generation | 2 | |
| 0.6 Update Build Config | 1 | |
| 0.7 Web Favicons | 1 | |
| **Total** | **10** | |
