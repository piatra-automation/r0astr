# Frequently Asked Questions

Quick answers to common questions.

## General

### What is r0astr?

r0astr is a multi-instrument live coding interface built on Strudel. It provides a card-based UI where each card is an independent instrument, all synchronized to a shared clock.

### Is r0astr free?

Yes, r0astr is open source and free to use under the AGPL-3.0 license.

### What browsers are supported?

- Chrome (recommended)
- Firefox
- Safari (macOS 14+)
- Edge

### Do I need to install anything?

No! You can [try r0astr in your browser](../index.md) immediately. For offline use and remote control features, download the [desktop app](../downloads.md).

---

## Audio & Patterns

### Why is there no sound?

Browsers require user interaction before playing audio. Click anywhere on the page, then try playing your pattern. See [Troubleshooting](../guides/troubleshooting.md) for more help.

### How do I stop all sounds?

Click the **Stop All** button in the master panel, or use keyboard shortcut (coming soon).

### Can I use my own samples?

Yes! See [Custom Samples](../guides/samples.md) for instructions.

### What's the difference between `s()` and `note()`?

- `s("bd")` plays **samples** (pre-recorded sounds)
- `note("c3")` plays **synthesizers** (generated tones)

### How do sliders work?

Use `slider(default, min, max)` in your pattern:

```javascript
note("c2").lpf(slider(800, 100, 5000))
```

This creates a control that you can adjust in real-time.

---

## Remote Control

### How do I set up remote control?

1. Start r0astr on your computer
2. Find your computer's local IP (e.g., `192.168.1.100`)
3. On your iPad/phone, open `http://192.168.1.100:5173/remote.html`
4. Both devices must be on the same WiFi network

See [Remote Control](../guides/remote-control.md) for detailed instructions.

### Why won't my remote connect?

- Ensure both devices are on the same WiFi
- Check that r0astr is running on your computer
- Try refreshing the remote page
- Check your firewall settings

---

## Desktop App

### Where can I download the app?

See the [Downloads](../downloads.md) page for all platforms.

### macOS says the app is "damaged" or from an unidentified developer

Right-click the app and select "Open", then click "Open" in the dialog. Or run:

```bash
xattr -cr /Applications/r0astr.app
```

### Windows SmartScreen blocks the app

Click "More info" then "Run anyway".

---

## Development

### How do I run r0astr locally?

```bash
git clone https://github.com/piatra-automation/r0astr.git
cd r0astr
npm install
npm run dev
```

### How do I contribute?

See [Contributing](../developers/contributing.md) for guidelines.

### Where's the source code?

[github.com/piatra-automation/r0astr](https://github.com/piatra-automation/r0astr)

---

## Still Have Questions?

- Check [Troubleshooting](../guides/troubleshooting.md)
- Search [GitHub Issues](https://github.com/piatra-automation/r0astr/issues)
- Open a new issue if you can't find an answer
