# Troubleshooting

Common issues and solutions for r0astr.

## Audio Issues

### No Sound Playing

1. **Check browser permissions** - Click somewhere on the page first. Browsers require user interaction before playing audio.
2. **Check volume** - Ensure your system volume and the pattern's `.gain()` value are set appropriately.
3. **Check the console** - Open browser DevTools (F12) and look for errors.

### Audio is Choppy or Glitchy

- **Close other tabs** - Audio processing is CPU-intensive
- **Use Chrome or Firefox** - These have the best Web Audio support
- **Reduce pattern complexity** - Simpler patterns use less CPU

### Samples Not Loading

- Sample loading happens on first use - you may see console messages
- Wait a moment and try playing again
- Check your internet connection

---

## Pattern Issues

### Pattern Not Updating

1. Make sure you clicked **Play** after editing
2. Check for syntax errors in the console
3. Verify your pattern ends with a valid function call

### Syntax Errors

Common mistakes:

```javascript
// Wrong - missing quotes
s(bd sd)

// Correct
s("bd sd")
```

```javascript
// Wrong - missing dot
s("bd sd")gain(0.5)

// Correct
s("bd sd").gain(0.5)
```

---

## Remote Control Issues

### Can't Connect from iPad/Phone

1. **Same network** - Both devices must be on the same WiFi
2. **Use network IP** - Use `http://192.168.x.x:5173/remote.html`, not `localhost`
3. **Check firewall** - Your computer's firewall may block connections

### Remote Shows "Disconnected"

- The main app must be running
- Try refreshing the remote page
- Check that WebSocket port is not blocked

---

## Installation Issues

### macOS: "App is damaged" or "unidentified developer"

Right-click the app and select "Open", then click "Open" in the dialog.

Or run in Terminal:
```bash
xattr -cr /Applications/r0astr.app
```

### Windows: SmartScreen Warning

Click "More info" then "Run anyway".

### Linux: AppImage Won't Run

Make it executable:
```bash
chmod +x r0astr-*.AppImage
./r0astr-*.AppImage
```

---

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome | Full |
| Firefox | Full |
| Safari | Full (macOS 14+) |
| Edge | Full |
| Mobile Chrome | Basic |
| Mobile Safari | Basic |

---

## Still Stuck?

- Check [GitHub Issues](https://github.com/piatra-automation/r0astr/issues)
- See the [FAQ](../community/faq.md)
- Open a new issue with details about your problem
