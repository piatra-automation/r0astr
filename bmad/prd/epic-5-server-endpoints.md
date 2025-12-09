# Epic 5: Server Endpoints (WebSocket Remote Control)

## Overview

Implement HTTP/WebSocket server endpoints for external control of panels via API. This enables MCP integration and remote control workflows for live performance.

## Business Value

- **MCP Integration**: Enable AI control via Model Context Protocol
- **Remote Control**: Control panels from external devices/scripts
- **Automation**: Programmatic pattern updates and panel management
- **Live Performance**: External triggers for panel changes during performance

## User Stories

### Story 5.1: Create Panel Endpoint

**As an** external application,
**I want** to create new panels via POST request,
**so that** I can programmatically add instruments to the session

**Acceptance Criteria:**
1. Endpoint: `POST /api/panels`
2. Request body: `{ title?: string, code?: string, position?: { x, y }, size?: { w, h } }`
3. Response: `{ success: true, panelId: string }` or error
4. Created panel appears in UI immediately
5. Panel uses provided code or defaults to empty pattern

---

### Story 5.2: Delete Panel Endpoint

**As an** external application,
**I want** to delete panels via DELETE request,
**so that** I can programmatically remove instruments

**Acceptance Criteria:**
1. Endpoint: `DELETE /api/panels/:id`
2. Response: `{ success: true }` or `{ error: "Panel not found" }`
3. Deleting master panel returns error (protected)
4. Panel removed from UI immediately
5. Panel audio stopped before removal

---

### Story 5.3: Update Panel Code Endpoint

**As an** external application,
**I want** to push new code to a panel via POST request,
**so that** I can update patterns remotely

**Acceptance Criteria:**
1. Endpoint: `POST /api/panels/:id/code`
2. Request body: `{ code: string, autoPlay?: boolean }`
3. Response: `{ success: true, stale: boolean }` (stale=true if panel was playing)
4. Code updated in textarea immediately
5. If `autoPlay: true`, panel activates with new code automatically

---

### Story 5.4: Play/Pause Panel Endpoint

**As an** external application,
**I want** to control panel playback state via POST request,
**so that** I can trigger patterns remotely

**Acceptance Criteria:**
1. Endpoint: `POST /api/panels/:id/playback`
2. Request body: `{ state: 'play' | 'pause' | 'toggle' }`
3. Response: `{ success: true, currentState: 'playing' | 'paused' }`
4. Panel play/pause button updates to reflect state
5. Audio starts/stops accordingly

---

### Story 5.5: List Panels Endpoint

**As an** external application,
**I want** to retrieve all panel states via GET request,
**so that** I can query current session state

**Acceptance Criteria:**
1. Endpoint: `GET /api/panels`
2. Response: `{ panels: [{ id, title, code, playing, position, size, stale }] }`
3. Returns all panels including master panel
4. Stale flag indicates if panel code differs from running pattern

---

### Story 5.6: WebSocket State Sync

**As an** external application,
**I want** real-time updates when panels change,
**so that** my UI stays synchronized with the application

**Acceptance Criteria:**
1. WebSocket endpoint: `ws://localhost:PORT/ws`
2. Broadcasts events: `panel_created`, `panel_deleted`, `panel_updated`, `playback_changed`
3. Event payload includes panel ID and relevant data
4. External clients can subscribe to events
5. Connection resilience: auto-reconnect on disconnect

---

## Technical Notes

- Use Express.js or Fastify for HTTP server
- WebSocket library: `ws` or `socket.io`
- CORS headers required for browser access from external origins
- Authentication: Consider API key-based auth (`X-API-Key` header)
- State sync: Server must communicate with browser UI (WebSocket or Server-Sent Events)
- Architecture challenge: Server runs separately from Vite dev server
  - Option 1: Vite dev server with custom middleware
  - Option 2: Separate Express server proxied by Vite
  - Option 3: WebSocket-only (no HTTP server), embedded in main app

## Dependencies

- Epic 1: Dynamic Panel Management (panel CRUD operations)
- Epic 6: Staleness Detection (stale flag in API responses)

## Related Epics

- Epic 4: Settings System (remote WS layout preference)

## Out of Scope

- OAuth authentication (use simple API key for now)
- Rate limiting (future security enhancement)
- HTTPS/WSS support (use reverse proxy for production)
- Multiple simultaneous clients (locking/conflict resolution)
