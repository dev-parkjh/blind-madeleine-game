#!/usr/bin/env python3
"""Local bridge used by dialogue_editor.html to launch Godot previews.

Browsers cannot start local executables directly, so the editor POSTs the
current dialogue JSON to this localhost-only helper. The helper writes the
dialogue file into data/dialogues and launches Godot with preview arguments.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 51234
MAX_BODY_BYTES = 8 * 1024 * 1024


def find_project_root() -> Path:
    return Path(__file__).resolve().parents[1]


def find_godot_executable(project_root: Path, configured_path: str | None) -> str:
    candidates: list[str] = []
    if configured_path:
        candidates.append(configured_path)
    candidates.extend(
        [
            os.environ.get("GODOT_BIN", ""),
            os.environ.get("GODOT_EXECUTABLE", ""),
            "godot",
            "godot4",
            "godot.exe",
            "godot4.exe",
        ]
    )

    for candidate in candidates:
        candidate = candidate.strip()
        if not candidate:
            continue
        expanded = Path(candidate).expanduser()
        if expanded.exists():
            return str(expanded)
        found = shutil.which(candidate)
        if found:
            return found

    for pattern in ("Godot*.exe", "godot*.exe"):
        matches = sorted(project_root.glob(pattern))
        if matches:
            return str(matches[0])

    raise FileNotFoundError(
        "Godot executable was not found. Start this bridge with "
        '--godot "C:\\path\\to\\Godot.exe" or set GODOT_BIN.'
    )


def clean_dialogue_filename(value: str) -> str:
    filename = Path(str(value or "")).name.strip()
    if not filename:
        raise ValueError("dialogue_file is required.")
    if not filename.lower().endswith(".json"):
        filename += ".json"
    return filename


def write_dialogue(project_root: Path, filename: str, dialogue_json: str) -> Path:
    if not dialogue_json.strip():
        raise ValueError("dialogue_json is empty.")

    json.loads(dialogue_json)
    dialogue_dir = project_root / "data" / "dialogues"
    dialogue_dir.mkdir(parents=True, exist_ok=True)
    target = dialogue_dir / clean_dialogue_filename(filename)
    temp = target.with_suffix(target.suffix + ".tmp")
    temp.write_text(dialogue_json, encoding="utf-8", newline="")
    temp.replace(target)
    return target


def launch_godot(
    project_root: Path,
    godot_path: str,
    dialogue_id: str,
    node_id: str,
) -> subprocess.Popen[bytes]:
    command = [
        godot_path,
        "--path",
        str(project_root),
        "--",
        "--editor-preview-dialogue",
        dialogue_id,
    ]
    if node_id:
        command.extend(["--editor-preview-node", node_id])

    kwargs: dict[str, Any] = {
        "cwd": str(project_root),
        "stdin": subprocess.DEVNULL,
        "stdout": subprocess.DEVNULL,
        "stderr": subprocess.DEVNULL,
    }
    if os.name == "nt":
        kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.DETACHED_PROCESS

    return subprocess.Popen(command, **kwargs)


class PreviewBridgeHandler(BaseHTTPRequestHandler):
    project_root: Path
    godot_path: str | None

    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self._send_json(204, {})

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path != "/health":
            self._send_json(404, {"ok": False, "error": "Unknown endpoint."})
            return

        try:
            godot = find_godot_executable(self.project_root, self.godot_path)
            self._send_json(
                200,
                {
                    "ok": True,
                    "project_root": str(self.project_root),
                    "godot": godot,
                },
            )
        except Exception as exc:
            self._send_json(
                200,
                {
                    "ok": False,
                    "project_root": str(self.project_root),
                    "error": str(exc),
                },
            )

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path != "/preview":
            self._send_json(404, {"ok": False, "error": "Unknown endpoint."})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self._send_json(400, {"ok": False, "error": "Invalid Content-Length."})
            return
        if length <= 0 or length > MAX_BODY_BYTES:
            self._send_json(413, {"ok": False, "error": "Request body is too large or empty."})
            return

        try:
            request = json.loads(self.rfile.read(length).decode("utf-8"))
            dialogue_id = str(request.get("dialogue_id", "")).strip()
            node_id = str(request.get("node_id", "")).strip()
            if not dialogue_id:
                raise ValueError("dialogue_id is required.")

            dialogue_path = write_dialogue(
                self.project_root,
                str(request.get("dialogue_file", "")),
                str(request.get("dialogue_json", "")),
            )
            godot = find_godot_executable(self.project_root, self.godot_path)
            process = launch_godot(self.project_root, godot, dialogue_id, node_id)
            self._send_json(
                200,
                {
                    "ok": True,
                    "pid": process.pid,
                    "dialogue_file": str(dialogue_path.relative_to(self.project_root)),
                },
            )
        except Exception as exc:
            self._send_json(500, {"ok": False, "error": str(exc)})

    def log_message(self, fmt: str, *args: Any) -> None:
        sys.stderr.write("[godot-preview] " + (fmt % args) + "\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Launch Godot dialogue previews from the HTML editor.")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--godot", default="", help="Path to the Godot executable.")
    args = parser.parse_args()

    project_root = find_project_root()
    PreviewBridgeHandler.project_root = project_root
    PreviewBridgeHandler.godot_path = args.godot or None

    server = ThreadingHTTPServer((args.host, args.port), PreviewBridgeHandler)
    print(f"Godot preview bridge listening on http://{args.host}:{args.port}")
    print(f"Project root: {project_root}")
    try:
        godot = find_godot_executable(project_root, args.godot)
        print(f"Godot executable: {godot}")
    except Exception as exc:
        print(f"Godot executable: {exc}")
    print("Press Ctrl+C to stop.")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
