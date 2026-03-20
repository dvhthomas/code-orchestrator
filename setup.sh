#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_ROOT="$SCRIPT_DIR"

echo "Setting up Remote Orchestrator..."
echo ""

# --- Check Node.js ---
if ! command -v node &>/dev/null; then
  echo "Error: Node.js is not installed." >&2
  echo "Please install Node.js 18+ from https://nodejs.org" >&2
  exit 1
fi
NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Error: Node.js 18+ required (found $(node -v))." >&2
  exit 1
fi
echo "[1/3] Node.js $(node -v) detected"

# --- Install dependencies ---
echo "[2/3] Installing dependencies..."
cd "$PROJECT_ROOT"
npm install

# --- Create swarm command ---
echo "[3/3] Installing 'swarm' command..."
chmod +x "$PROJECT_ROOT/bin/swarm.sh"

SYMLINK_TARGET="/usr/local/bin/swarm"
SWARM_SOURCE="$PROJECT_ROOT/bin/swarm.sh"

# Remove existing symlink if it points elsewhere
if [ -L "$SYMLINK_TARGET" ]; then
  EXISTING_TARGET="$(readlink "$SYMLINK_TARGET")"
  if [ "$EXISTING_TARGET" != "$SWARM_SOURCE" ]; then
    echo "  Updating existing swarm symlink..."
    rm "$SYMLINK_TARGET" 2>/dev/null || sudo rm "$SYMLINK_TARGET"
  else
    echo "  Symlink already exists and is correct."
  fi
fi

if [ ! -e "$SYMLINK_TARGET" ]; then
  if [ -w "$(dirname "$SYMLINK_TARGET")" ]; then
    ln -s "$SWARM_SOURCE" "$SYMLINK_TARGET"
  else
    echo "  Need permission to create symlink in /usr/local/bin"
    sudo ln -s "$SWARM_SOURCE" "$SYMLINK_TARGET"
  fi
fi

echo ""
echo "Setup complete!"
echo ""
echo "Usage:"
echo "  swarm    Start the Remote Orchestrator dashboard"
echo ""
echo "The dashboard will open automatically in Google Chrome."
echo "Press Ctrl+C to stop all services."
