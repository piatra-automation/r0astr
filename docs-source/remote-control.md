# Remote Control

Control r0astr from your tablet, phone, or any device on your network.

---

## Overview

r0astr includes a remote control interface that lets you control panels from a secondary device. Perfect for:

- Using an iPad as a control surface while coding on your laptop
- Triggering panels from a phone during live performance
- Controlling r0astr from across the room

---

## Quick Start

### 1. Start r0astr

Run r0astr on your main computer:

```bash
npm run dev
```

Or launch the desktop app.

### 2. Find Your IP Address

=== "macOS"

    Open Terminal and run:

    ```bash
    ipconfig getifaddr en0
    ```

    Or go to System Settings → Network → Your connection → Details → IP Address

=== "Windows"

    Open Command Prompt and run:

    ```cmd
    ipconfig
    ```

    Look for "IPv4 Address" under your active network adapter.

=== "Linux"

    Open Terminal and run:

    ```bash
    hostname -I | awk '{print $1}'
    ```

### 3. Connect from Your Device

On your tablet or phone:

1. Make sure you're on the **same WiFi network**
2. Open your browser
3. Go to: `http://YOUR-IP:5173/remote.html`

For example: `http://192.168.1.100:5173/remote.html`

---

## Network Requirements

!!! warning "Same Network Required"
    The remote device MUST be on the same local network as the computer running r0astr.

### Requirements

| Requirement | Details |
|-------------|---------|
| Same WiFi | Both devices on the same network |
| Port 5173 | Must not be blocked by firewall |
| No VPN | VPN can interfere with local connections |

### Guest Networks

Most "guest" WiFi networks isolate devices from each other. If you can't connect, try the main network instead.

---

## Remote Interface Features

The remote interface provides:

### Panel Controls

- **Play/Pause** buttons for each panel
- **Visual indicators** showing which panels are playing
- Panel numbering matches the main interface

### Global Controls

- **Stop All** - Immediately stops all panels
- **Connection status** - Shows if connected to r0astr

### Auto-Reconnection

If the connection drops:

1. The interface shows "Disconnected"
2. Automatically attempts to reconnect
3. Reconnects when r0astr becomes available again

---

## Troubleshooting

### "Disconnected" Status

**Cause:** Cannot reach the r0astr server.

**Solutions:**

1. Verify r0astr is running on your computer
2. Check you're using the correct IP address
3. Ensure both devices are on the same WiFi
4. Try refreshing the remote page

### Can't Connect Initially

**Common issues:**

| Problem | Solution |
|---------|----------|
| Wrong IP | Re-check your computer's IP address |
| Different networks | Connect both devices to same WiFi |
| Guest network | Use main network instead |
| Firewall blocking | Allow port 5173 in firewall settings |
| VPN active | Disable VPN on both devices |

### Intermittent Disconnects

**Possible causes:**

- Weak WiFi signal
- Network congestion
- Sleep/standby modes

**Solutions:**

- Move closer to WiFi router
- Keep devices awake during performance
- Consider a dedicated WiFi for performances

### Finding Your IP - Common Mistakes

| Mistake | Correct Approach |
|---------|------------------|
| Using `localhost` | Use your actual network IP (192.168.x.x) |
| Using `127.0.0.1` | This only works on the same machine |
| Old IP after network change | Re-check IP address after WiFi changes |

---

## Security

!!! warning "Local Network Only"
    The remote control is designed for local network use only. No authentication is enforced — anyone on your network can connect. Use on trusted networks only.

---

## Tips for Live Performance

- Test the connection at the venue beforehand
- Bookmark the remote URL on your device
- Disable auto-sleep on your remote device
- Use **Stop All** for clean transitions
- Have a backup plan if WiFi fails

---

## WebSocket Protocol

The remote control uses WebSocket for real-time communication. See the [API Reference](developers/api.md) for the full protocol specification.

---

## Related

- [API Reference](developers/api.md) — REST and WebSocket endpoints
- [Troubleshooting](guides/troubleshooting.md)
- [FAQ](community/faq.md)
