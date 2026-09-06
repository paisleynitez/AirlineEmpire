#!/usr/bin/env bash
# Serve Airline Empire at http://localhost:8123 so Claude in Chrome can see and drive the game.
# Run this from a bash shell (Git Bash, WSL, macOS Terminal, Linux). Leave it running while
# playing; Ctrl-C to stop when done.

set -u

# Resolve the directory this script lives in, then cd into game/ (matches servegame.bat).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/game" || { echo "Could not find game/ next to this script."; exit 1; }

URL="http://localhost:8123/index.html"
echo "Starting Airline Empire at $URL ..."

# Open the browser (best-effort; skip silently if no opener is available).
open_url() {
  local url="$1"
  if   command -v xdg-open  >/dev/null 2>&1; then xdg-open  "$url" >/dev/null 2>&1 &
  elif command -v open      >/dev/null 2>&1; then open      "$url" >/dev/null 2>&1 &
  elif command -v start     >/dev/null 2>&1; then start     "$url" >/dev/null 2>&1 &
  elif command -v cygstart  >/dev/null 2>&1; then cygstart  "$url" >/dev/null 2>&1 &
  elif command -v wslview   >/dev/null 2>&1; then wslview   "$url" >/dev/null 2>&1 &
  # Git Bash on Windows: `start` isn't on PATH but explorer.exe works
  elif command -v explorer.exe >/dev/null 2>&1; then explorer.exe "$url" >/dev/null 2>&1 &
  fi
}
open_url "$URL"

# Prefer Python, then Node — same order as servegame.bat.
if command -v py >/dev/null 2>&1; then
  exec py -m http.server 8123
fi
if command -v python3 >/dev/null 2>&1; then
  exec python3 -m http.server 8123
fi
if command -v python >/dev/null 2>&1; then
  exec python -m http.server 8123
fi
if command -v node >/dev/null 2>&1; then
  exec npx --yes http-server -p 8123 -c-1 .
fi

echo
echo "Could not find Python or Node on this system. Install either one, then run this again."
read -rp "Press Enter to close..."
exit 1
