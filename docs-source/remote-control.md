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

## Security Considerations

!!! warning "Local Network Only"
    The remote control is designed for local network use only. Do not expose to the public internet.

### Current Security Model

- **No authentication** - Anyone on your network can connect
- **Local only** - Only accessible within your network
- **Trust model** - Assumes trusted local environment

### Recommendations

- Use on trusted networks only
- Avoid public WiFi for performances
- Consider a dedicated portable router for gigs
- Keep r0astr updated

### Future Considerations

Future versions may include:

- Optional PIN protection
- Connection allowlists
- Encrypted connections

---

## WebSocket Protocol

!!! abstract "For Advanced Users"
    This section is for developers building custom integrations.

The remote control uses WebSocket for real-time communication.

### Connection

```javascript
const ws = new WebSocket('ws://192.168.1.100:5173/ws');
```

### Message Types

| Type | Direction | Purpose |
|------|-----------|---------|
| `panel:start` | Client → Server | Start a panel |
| `panel:stop` | Client → Server | Stop a panel |
| `playback:stop-all` | Client → Server | Stop all panels |
| `state:get` | Client → Server | Request current state |
| `state:current` | Server → Client | Current state response |
| `event:panel-state` | Server → Client | Panel state changed |

### Example

```javascript
// Start panel 1
ws.send(JSON.stringify({
  type: 'panel:start',
  payload: { panelId: 'panel-1' }
}));
```

See [API Reference](developers/api.md) for complete documentation.

---

## Tips for Live Performance

### Before the Performance

1. Test the connection at the venue
2. Note your IP address (it may change on different networks)
3. Bookmark the remote URL on your device
4. Disable auto-sleep on your remote device

### During the Performance

- Keep the remote interface visible
- Use Stop All for clean transitions
- Have a backup plan if WiFi fails

### Recommended Setup

```
┌─────────────────┐         ┌─────────────────┐
│   Main Laptop   │ ◄──────►│   WiFi Router   │
│   (r0astr)      │  WiFi   │                 │
└─────────────────┘         └────────┬────────┘
                                     │ WiFi
                            ┌────────▼────────┐
                            │  iPad/Phone     │
                            │  (Remote)       │
                            └─────────────────┘
```

---

## Related Documentation

- [API Reference](developers/api.md) - Full WebSocket API documentation
- [Troubleshooting](guides/troubleshooting.md) - General troubleshooting guide
- [FAQ](community/faq.md) - Common questions and answers
