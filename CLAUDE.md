# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Code Orchestrator is a web-based dashboard for managing multiple Claude Code CLI sessions simultaneously. It spawns `claude` processes via pseudo-terminals (node-pty), streams their I/O through Socket.io to a React frontend with xterm.js terminals, and detects session state (running/waiting/idle/exited) by analyzing terminal output.

## Commands

```bash
# Install dependencies (monorepo-wide)
npm install

# Run both server and client in dev mode (concurrent)
npm run dev

# Run only the server (Express + Socket.io on port 5400)
npm run dev -w server

# Run only the client (Vite on port 5173)
npm run dev -w client

# Build
npm run build -w shared   # Build shared types first
npm run build -w server   # Then server
npm run build -w client   # Then client

# Lint (client only)
npm run lint -w client
```

## Architecture

**Monorepo** with npm workspaces: `shared/`, `server/`, `client/`.

### shared/
Single file (`src/types.ts`) defining all shared TypeScript types: session models, REST request/response shapes, Socket.io event maps (`ClientToServerEvents`, `ServerToClientEvents`), and filesystem types.

### server/ (Express + Socket.io + node-pty)
- **`services/SessionManager`** — Central orchestrator. Creates/destroys sessions, manages pty lifecycle, buffers output (100KB rolling window for reconnect replay), persists sessions to disk, and broadcasts state changes via Socket.io rooms.
- **`services/PtyManager`** — Spawns `claude` CLI via the user's login shell (`$SHELL -l -c "exec claude"`). Wraps node-pty for write/resize/kill.
- **`services/StateDetector`** — Analyzes ANSI-stripped terminal output to detect session status. After output settles (500ms), checks tail against prompt patterns to distinguish `waiting` (prompt detected) from `idle` (output stopped, no prompt).
- **`persistence/SessionStore`** + **`persistence/OrderStore`** — JSON file stores in `server/data/`. Sessions are restored on server restart.
- **`socket/handler`** — Socket.io connection handler. Clients join/leave session rooms; input is forwarded to pty; buffered output is replayed on join.
- **`routes/sessions`** — REST CRUD for sessions + ordering.
- **`routes/filesystem`** — Path autocomplete and directory browsing for the session creation UI.

### client/ (React + Vite + xterm.js)
- **`App`** — Top-level layout with theme toggle (dark/light, persisted to localStorage) and focus mode (Escape to exit).
- **`components/Dashboard`** — Grid of session cards with drag-and-drop reordering (@dnd-kit).
- **`components/TerminalPanel`** — xterm.js terminal with WebGL renderer, wired to Socket.io for I/O.
- **`hooks/useSocket`** — Singleton Socket.io client (WebSocket transport preferred).
- **`hooks/useSessions`** — Session list state synced via REST + Socket.io events.
- **`hooks/useSessionOrder`** — Persisted drag-and-drop ordering.

### Communication Flow
Client ←(REST)→ Server for CRUD. Client ←(Socket.io rooms)→ Server for real-time terminal I/O and status updates. Each session is a Socket.io room identified by session UUID. Vite proxies `/api` and `/socket.io` to the server in dev.

## Key Details

- Server port: **5400**, Client port: **5173** (Vite dev server proxies API/WS to server)
- TypeScript strict mode, ES2022 target, ESM (`"type": "module"`) throughout
- Server uses `.js` extensions in imports (required for ESM resolution with TypeScript)
- Session data files (`server/data/sessions.json`, `server/data/order.json`) are gitignored
- `node-pty` requires a native prebuilt binary; `postinstall` script ensures the macOS ARM64 spawn-helper is executable
