# Story docs-5.5: Remote Control Documentation

## Status

Done

## Story

**As a** user setting up remote control,
**I want** complete setup and troubleshooting docs,
**so that** I can use my iPad as a control surface.

## Acceptance Criteria

1. Network setup requirements (same WiFi)
2. Finding the correct URL
3. Remote interface features walkthrough
4. Troubleshooting connection issues
5. WebSocket protocol overview for advanced users
6. Security considerations

## Tasks / Subtasks

- [ ] Task 1: Write Network Requirements section (AC: 1)
  - [ ] Same WiFi network requirement
  - [ ] Network isolation issues (guest networks)
  - [ ] Firewall considerations
  - [ ] Port requirements

- [ ] Task 2: Write Finding URL section (AC: 2)
  - [ ] How to find local IP
  - [ ] macOS: System Preferences or terminal
  - [ ] Windows: ipconfig
  - [ ] Linux: ip addr or hostname -I
  - [ ] Constructing the remote URL

- [ ] Task 3: Write Features Walkthrough (AC: 3)
  - [ ] Panel control buttons
  - [ ] State indicators
  - [ ] Stop All button
  - [ ] Auto-reconnection behavior
  - [ ] Screenshot of remote interface

- [ ] Task 4: Write Troubleshooting section (AC: 4)
  - [ ] "Disconnected" status
  - [ ] Can't connect initially
  - [ ] Intermittent disconnects
  - [ ] Wrong IP address
  - [ ] Firewall blocking

- [ ] Task 5: Write WebSocket Overview (AC: 5)
  - [ ] Brief protocol explanation
  - [ ] Message types
  - [ ] Link to full API docs
  - [ ] Note: For advanced users

- [ ] Task 6: Write Security section (AC: 6)
  - [ ] Local network only warning
  - [ ] No authentication (by design)
  - [ ] Public network risks
  - [ ] Future considerations

## Dev Notes

### Target File
- `docs-source/remote-control.md` (existing file)
- Or `docs-source/guides/remote-control.md` if moved

### Current State
File exists at `docs-source/remote-control.md` (244 bytes - stub). Check existing content in `bmad/remote-control.md`.

### Reference Material
- `bmad/remote-control.md` - May have detailed content
- Actual remote.html implementation

### URL Format
```
http://[YOUR-IP]:5173/remote.html
```

### Finding IP Commands
```bash
# macOS
ipconfig getifaddr en0

# Windows
ipconfig | findstr IPv4

# Linux
hostname -I
```

### Common Issues
1. Different WiFi networks
2. Guest network isolation
3. Firewall blocking port 5173
4. Wrong IP (localhost vs network IP)
5. VPN interfering

### Testing

- Follow setup on actual devices
- Test troubleshooting steps
- Verify all commands work

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-12-13 | 1.0 | Story created | Bob (SM Agent) |

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (James - Dev Agent)

### Debug Log References
N/A - Documentation task

### Completion Notes List
- Complete rewrite from 12-line stub to comprehensive guide
- Quick Start with tabbed OS-specific IP instructions
- Network requirements with firewall/port guidance
- Remote interface features walkthrough
- Comprehensive troubleshooting section
- WebSocket protocol overview for advanced users
- Security considerations section
- Live performance tips

### File List
- docs-source/remote-control.md (major rewrite)

## QA Results
_To be filled after QA review_
