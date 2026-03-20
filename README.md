# Remote Orchestrator

A web-based dashboard for managing multiple [Claude Code](https://claude.ai/code) CLI sessions simultaneously. Spawn `claude` processes via pseudo-terminals, stream their I/O to browser-based terminals, and monitor session state in real time.

## Prerequisites

- **Node.js** (v18+)
- **Claude Code CLI** (`claude`) installed and available in your `$PATH`
- macOS (node-pty prebuilt is bundled for darwin-arm64)

## Quick Start

```bash
npm install
npm run dev
```

This starts both the server (port 5400) and client (port 5173) concurrently. Open http://localhost:5173 in your browser.

## How It Works

1. **Session creation** — The dashboard lets you create named sessions pointed at any local directory.
2. **PTY spawning** — The server spawns `claude` inside a pseudo-terminal via the user's login shell (`$SHELL -l -c "exec claude"`).
3. **Real-time streaming** — Terminal I/O flows through Socket.io rooms. Each session is a room identified by its UUID.
4. **State detection** — The server strips ANSI codes from output and, after a 500ms settle period, analyzes the tail to classify the session as `waiting` (prompt detected), `running`, `idle`, or `exited`.
5. **Reconnect replay** — A 100KB rolling buffer per session allows clients to catch up on output when joining or reconnecting.
6. **Persistence** — Sessions and their display order are saved to JSON files on disk and restored on server restart.

## Monorepo Structure

```
remote-orchestrator/
├── shared/          # TypeScript types shared between server and client
├── server/          # Express + Socket.io + node-pty backend
│   ├── services/    # SessionManager, PtyManager, StateDetector
│   ├── persistence/ # JSON file stores (SessionStore, OrderStore)
│   ├── socket/      # Socket.io connection handler
│   └── routes/      # REST endpoints (sessions, filesystem)
├── client/          # React + Vite + xterm.js frontend
│   ├── components/  # Dashboard, TerminalPanel, CreateSessionModal, etc.
│   ├── hooks/       # useSocket, useSessions, useSessionOrder, useTerminal
│   └── services/    # REST API client
└── package.json     # Root workspace config
```

## Commands

```bash
# Install all dependencies
npm install

# Run server + client concurrently (dev mode)
npm run dev

# Run workspaces individually
npm run dev -w server    # Express + Socket.io on port 5400
npm run dev -w client    # Vite dev server on port 5173

# Build
npm run build -w shared
npm run build -w server
npm run build -w client

# Lint
npm run lint -w client
```

## Ports

| Service | Port | Notes |
|---------|------|-------|
| Server  | 5400 | Express + Socket.io |
| Client  | 5173 | Vite dev server, proxies `/api` and `/socket.io` to server |

## Tech Stack

- **Server:** Express, Socket.io, node-pty, TypeScript (ESM)
- **Client:** React 19, xterm.js (WebGL), Socket.io-client, @dnd-kit, Vite
- **Shared:** TypeScript types for session models, REST shapes, and Socket.io event maps
