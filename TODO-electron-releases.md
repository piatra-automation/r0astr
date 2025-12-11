# Electron Release Workflow

## Status: IMPLEMENTED

## How to Create a Release

### Option 1: Tag-based release (recommended)

```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

This automatically triggers the release workflow which:
1. Builds for macOS (Intel + Apple Silicon)
2. Builds for Windows (x64)
3. Builds for Linux (x64)
4. Creates a GitHub Release with all artifacts

### Option 2: Manual trigger

1. Go to GitHub Actions
2. Select "Release Electron Apps" workflow
3. Click "Run workflow"
4. Optionally enter a version number

## Release Artifacts

### macOS
- `r0astr-{version}-mac-x64.dmg` - Intel Macs
- `r0astr-{version}-mac-arm64.dmg` - Apple Silicon Macs
- `r0astr-{version}-mac-x64.zip` - Intel (zip)
- `r0astr-{version}-mac-arm64.zip` - Apple Silicon (zip)

### Windows
- `r0astr-Setup-{version}.exe` - NSIS installer
- `r0astr-{version}-portable.exe` - Portable version

### Linux
- `r0astr-{version}.AppImage` - Universal Linux
- `r0astr-{version}.deb` - Debian/Ubuntu

## Pre-release Requirements

### Icons (REQUIRED)
Place in `build-resources/`:
- `icon.icns` - macOS icon
- `icon.ico` - Windows icon
- `icons/` directory with Linux PNGs (16x16 to 512x512)

Generate from source PNG:
```bash
npx electron-icon-maker --input=./logo.png --output=./build-resources
```

### Code Signing (Optional)

#### macOS (Apple Developer Account required)
Set these GitHub secrets:
- `MAC_CERTS` - Base64 encoded .p12 certificate
- `MAC_CERTS_PASSWORD` - Certificate password
- `APPLE_ID` - Apple ID email
- `APPLE_APP_SPECIFIC_PASSWORD` - App-specific password
- `APPLE_TEAM_ID` - Team ID

#### Windows (Optional)
For EV code signing, configure in electron-builder.json or use secrets.

## Files Created/Modified

- `.github/workflows/release.yml` - Release workflow
- `electron-builder.json` - Updated with GitHub publish config
- `docs-source/downloads.md` - Downloads page with OS detection
- `mkdocs.yml` - Added Downloads to navigation

## Download Links Format

The downloads page uses GitHub's "latest" redirect URLs:
```
https://github.com/piatra-automation/r0astr/releases/latest/download/{filename}
```

These automatically point to the latest release.

## Version Numbering

Use semantic versioning:
- `v1.0.0` - Stable release
- `v1.0.0-beta.1` - Pre-release (marked as prerelease on GitHub)
- `v1.0.0-rc.1` - Release candidate

## Troubleshooting

### Build fails on macOS
- Check that `build-resources/icon.icns` exists
- Verify entitlements file is valid

### Build fails on Windows
- Check that `build-resources/icon.ico` exists
- NSIS must be available (installed by electron-builder)

### Build fails on Linux
- Check that `build-resources/icons/` directory has PNG files
- Verify required system packages are available

### Release not created
- Check that `GITHUB_TOKEN` has write permissions
- Verify tag format starts with `v`
