# Build Resources

This folder contains resources for building distributable packages.

## Required Files

### macOS
- `icon.icns` - App icon (1024x1024, multi-resolution)

### Windows  
- `icon.ico` - App icon (256x256, multi-resolution)

### Linux
- `icons/` - Directory containing PNG icons at various sizes:
  - `16x16.png`
  - `32x32.png`
  - `48x48.png`
  - `64x64.png`
  - `128x128.png`
  - `256x256.png`
  - `512x512.png`

## Generating Icons

From a source PNG (at least 1024x1024):

```bash
# Using electron-icon-maker
npx electron-icon-maker --input=./logo.png --output=./build-resources

# Or manually with ImageMagick
convert logo.png -resize 1024x1024 icon.png
# Then use online converters for .icns and .ico
```

## Entitlements (macOS)

The `entitlements.mac.plist` file is already configured with:
- Network access (for WebSocket server)
- Audio input access
- JIT compilation (for V8/JavaScript)
