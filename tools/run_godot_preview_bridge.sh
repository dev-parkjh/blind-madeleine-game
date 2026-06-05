#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

case "${1:-}" in
  -h|--help)
    cat <<'USAGE'
Starts the local bridge used by the editor to launch Godot previews.

Usage:
  tools/run_godot_preview_bridge.sh
  tools/run_godot_preview_bridge.sh "/Applications/Godot.app"
  tools/run_godot_preview_bridge.sh "/path/to/Godot"

Optional environment variables:
  GODOT_PREVIEW_PORT=51234
  GODOT_BIN=/path/to/Godot
USAGE
    exit 0
    ;;
esac

export GODOT_PREVIEW_PORT="${GODOT_PREVIEW_PORT:-51234}"
if [[ $# -gt 0 && -z "${GODOT_BIN:-}" ]]; then
  export GODOT_BIN="$1"
fi

if command -v python3 >/dev/null 2>&1; then
  PYTHON_CMD=(python3)
elif command -v python >/dev/null 2>&1; then
  PYTHON_CMD=(python)
else
  echo "Python was not found on PATH." >&2
  echo "Install Python, then run this file again." >&2
  exit 1
fi

echo "[Blind Madeleine] Starting Godot preview bridge..."
echo "Endpoint: http://127.0.0.1:${GODOT_PREVIEW_PORT}"
if [[ -n "${GODOT_BIN:-}" ]]; then
  echo "Godot: ${GODOT_BIN}"
fi
echo
echo "Keep this terminal open while using Godot preview in the editor."
echo "Press Ctrl+C to stop the bridge."
echo

if [[ -n "${GODOT_BIN:-}" ]]; then
  exec "${PYTHON_CMD[@]}" tools/godot_preview_bridge.py --port "${GODOT_PREVIEW_PORT}" --godot "${GODOT_BIN}"
fi

exec "${PYTHON_CMD[@]}" tools/godot_preview_bridge.py --port "${GODOT_PREVIEW_PORT}"
