#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

require_command() {
  local command_name="$1"
  local install_hint="$2"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    cat <<EOF
Missing required command: $command_name

$install_hint

After installing it, open a new terminal and run:
  make run

To run only the backend for now:
  make backend
EOF
    exit 127
  fi
}

require_command python3 "Install Python 3.12+ from your OS package manager or https://www.python.org/downloads/."
require_command npm "Install Node.js 20+ with npm. Recommended on Linux:
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs

Or use nvm:
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  nvm install 20
  nvm use 20"

if [ ! -d "$BACKEND_DIR/.venv" ]; then
  python3.12 -m venv "$BACKEND_DIR/.venv" 2>/dev/null || python3 -m venv "$BACKEND_DIR/.venv"
fi

"$BACKEND_DIR/.venv/bin/pip" install -q -r "$BACKEND_DIR/requirements.txt"

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  (cd "$FRONTEND_DIR" && npm install)
fi

cleanup() {
  trap - SIGTERM SIGINT
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup SIGTERM SIGINT EXIT

(cd "$BACKEND_DIR" && .venv/bin/python run.py) &
BACKEND_PID=$!

(cd "$FRONTEND_DIR" && npm run dev -- --host 0.0.0.0) &
FRONTEND_PID=$!

wait
