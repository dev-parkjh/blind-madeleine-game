#!/usr/bin/env python3
"""Local bridge used by the editor to launch Godot previews.

Browsers cannot start local executables directly, so the editor POSTs the
current dialogue JSON to this localhost-only helper. The helper writes the
dialogue file into data/dialogues and launches Godot with preview arguments.
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import re
import shutil
import subprocess
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlencode, urlparse


DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 51234
MAX_BODY_BYTES = 8 * 1024 * 1024
WEB_PREVIEW_PREFIX = "/web-preview"
WEB_PREVIEW_PRESET = "Web"
WEB_PREVIEW_PAYLOAD_DIR = "editor_preview_payloads"


mimetypes.add_type("application/wasm", ".wasm")
mimetypes.add_type("application/octet-stream", ".pck")


def find_project_root() -> Path:
    return Path(__file__).resolve().parents[1]


def expand_godot_candidate(candidate: Path) -> list[Path]:
    if sys.platform == "darwin" and candidate.suffix == ".app":
        macos_dir = candidate / "Contents" / "MacOS"
        return [
            macos_dir / "Godot",
            macos_dir / "Godot_mono",
            *sorted(macos_dir.glob("Godot*")),
        ]
    if candidate.is_dir():
        patterns = (
            ["Godot*.exe", "godot*.exe", "*Godot*.exe", "*godot*.exe"]
            if os.name == "nt"
            else ["Godot*", "godot*"]
        )
        matches: list[Path] = []
        for pattern in patterns:
            matches.extend(sorted(candidate.glob(pattern)))
        return matches or [candidate]
    return [candidate]


def unique_paths(paths: list[Path]) -> list[Path]:
    unique: list[Path] = []
    seen: set[str] = set()
    for path in paths:
        key = os.path.normcase(str(path.expanduser()))
        if key in seen:
            continue
        seen.add(key)
        unique.append(path)
    return unique


def parse_steam_library_paths(vdf_path: Path) -> list[Path]:
    if not vdf_path.exists():
        return []
    try:
        content = vdf_path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return []

    library_paths: list[Path] = []
    for raw_path in re.findall(r'"path"\s+"([^"]+)"', content, flags=re.IGNORECASE):
        library_paths.append(Path(raw_path.replace("\\\\", "\\")))

    for _index, raw_path in re.findall(r'"(\d+)"\s+"([^"]+)"', content):
        if re.match(r"^(?:[A-Za-z]:\\|\\\\|/)", raw_path):
            library_paths.append(Path(raw_path.replace("\\\\", "\\")))
    return library_paths


def windows_steam_library_roots() -> list[Path]:
    roots: list[Path] = []
    for env_name in ("STEAM", "STEAM_PATH", "STEAMDIR"):
        env_value = os.environ.get(env_name, "").strip()
        if env_value:
            roots.append(Path(env_value))

    for base in [
        os.environ.get("ProgramFiles(x86)", ""),
        os.environ.get("ProgramFiles", ""),
        os.environ.get("ProgramW6432", ""),
        os.environ.get("LOCALAPPDATA", ""),
        "C:\\Program Files (x86)",
        "C:\\Program Files",
    ]:
        if base:
            roots.append(Path(base) / "Steam")

    roots = unique_paths(roots)
    library_roots = list(roots)
    for root in roots:
        library_roots.extend(parse_steam_library_paths(root / "steamapps" / "libraryfolders.vdf"))
    return unique_paths(library_roots)


def append_windows_steam_godot_candidates(candidates: list[str]) -> None:
    for steam_root in windows_steam_library_roots():
        common_dir = steam_root / "steamapps" / "common"
        app_dirs = [common_dir / "Godot Engine"]
        if common_dir.exists():
            app_dirs.extend(sorted(common_dir.glob("Godot*")))

        for app_dir in unique_paths(app_dirs):
            candidates.append(str(app_dir))
            for pattern in ("Godot*.exe", "godot*.exe", "*Godot*.exe", "*godot*.exe"):
                candidates.extend(str(path) for path in sorted(app_dir.glob(pattern)))


def platform_godot_candidates(project_root: Path) -> list[str]:
    candidates: list[str] = []
    if sys.platform == "darwin":
        candidates.extend(
            [
                "/Applications/Godot.app",
                "/Applications/Godot_mono.app",
                "/Applications/Godot 4.app",
            ]
        )
        applications = Path("/Applications")
        if applications.exists():
            candidates.extend(str(path) for path in sorted(applications.glob("Godot*.app")))
    elif os.name == "nt":
        for base in [
            os.environ.get("ProgramFiles", ""),
            os.environ.get("ProgramFiles(x86)", ""),
            os.environ.get("LOCALAPPDATA", ""),
        ]:
            if not base:
                continue
            base_path = Path(base)
            for pattern in [
                "Godot/Godot*.exe",
                "Godot/godot*.exe",
                "Godot*/Godot*.exe",
                "Godot*/godot*.exe",
                "Programs/Godot*/Godot*.exe",
                "Programs/Godot*/godot*.exe",
            ]:
                candidates.extend(str(path) for path in sorted(base_path.glob(pattern)))
        append_windows_steam_godot_candidates(candidates)

    for pattern in ("Godot*.exe", "godot*.exe", "Godot*.app", "godot*.app"):
        candidates.extend(str(path) for path in sorted(project_root.glob(pattern)))
    return candidates


def godot_not_found_message() -> str:
    if sys.platform == "darwin":
        return (
            "Godot executable was not found. Start this bridge with "
            '--godot "/Applications/Godot.app" or set GODOT_BIN.'
        )
    if os.name == "nt":
        return (
            "Godot executable was not found. Start this bridge with "
            '--godot "C:\\path\\to\\Godot.exe" or set GODOT_BIN. '
            'Default Steam paths, including "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Godot Engine", '
            "are checked automatically."
        )
    return "Godot executable was not found. Start this bridge with --godot /path/to/godot or set GODOT_BIN."


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
    candidates.extend(platform_godot_candidates(project_root))

    for candidate in candidates:
        candidate = candidate.strip()
        if not candidate:
            continue
        expanded = Path(candidate).expanduser()
        for expanded_candidate in expand_godot_candidate(expanded):
            if expanded_candidate.exists():
                return str(expanded_candidate)
        found = shutil.which(candidate)
        if found:
            return found

    raise FileNotFoundError(godot_not_found_message())


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


def normalize_import_paths(project_root: Path, raw_paths: Any) -> list[str]:
    if raw_paths is None:
        return []
    if not isinstance(raw_paths, list):
        raise ValueError("paths must be an array.")

    normalized: list[str] = []
    for raw_path in raw_paths:
        text = str(raw_path or "").strip()
        if not text:
            continue
        if text.startswith("res://"):
            relative = text.removeprefix("res://")
        else:
            relative = text
        if relative.startswith("/") or ".." in Path(relative).parts:
            raise ValueError(f"Invalid import path: {text}")
        target = (project_root / relative).resolve()
        if project_root not in [target, *target.parents]:
            raise ValueError(f"Import path escapes project root: {text}")
        if not target.exists():
            raise FileNotFoundError(f"Import target does not exist: {text}")
        normalized.append(f"res://{relative.replace(os.sep, '/')}")
    return normalized


def run_godot_import(
    project_root: Path,
    godot_path: str,
    timeout_seconds: int,
) -> subprocess.CompletedProcess[str]:
    command = [
        godot_path,
        "--headless",
        "--path",
        str(project_root),
        "--import",
    ]
    return subprocess.run(
        command,
        cwd=str(project_root),
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=timeout_seconds,
        check=False,
    )


def run_godot_web_export(
    project_root: Path,
    godot_path: str,
    timeout_seconds: int,
) -> subprocess.CompletedProcess[str]:
    export_path = project_root / "build" / "web" / "index.html"
    export_path.parent.mkdir(parents=True, exist_ok=True)
    command = [
        godot_path,
        "--headless",
        "--path",
        str(project_root),
        "--export-release",
        WEB_PREVIEW_PRESET,
        str(export_path),
    ]
    return subprocess.run(
        command,
        cwd=str(project_root),
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=timeout_seconds,
        check=False,
    )


def web_preview_root(project_root: Path) -> Path:
    return project_root / "build" / "web"


def require_web_preview_export(project_root: Path) -> Path:
    root = web_preview_root(project_root)
    index_path = root / "index.html"
    if not index_path.exists():
        raise FileNotFoundError("Godot web export was not found. Build the web preview first.")
    return root


def clean_payload_token(value: str) -> str:
    token = "".join(character if character.isalnum() or character in ["-", "_"] else "-" for character in value)
    token = token.strip("-_")
    return token[:80] or "preview"


def write_web_preview_payload(
    project_root: Path,
    dialogue_id: str,
    node_id: str,
    dialogue_json: str,
) -> tuple[Path, str]:
    if not dialogue_json.strip():
        raise ValueError("dialogue_json is empty.")
    parsed = json.loads(dialogue_json)
    if not isinstance(parsed, dict):
        raise ValueError("dialogue_json must be a JSON object.")

    root = require_web_preview_export(project_root)
    payload_dir = root / WEB_PREVIEW_PAYLOAD_DIR
    payload_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{clean_payload_token(dialogue_id)}-{clean_payload_token(node_id or 'start')}-{int(time.time() * 1000)}.json"
    target = payload_dir / filename
    target.write_text(json.dumps(parsed, ensure_ascii=False), encoding="utf-8")
    cleanup_web_preview_payloads(payload_dir)
    return target, f"{WEB_PREVIEW_PREFIX}/{WEB_PREVIEW_PAYLOAD_DIR}/{filename}"


def cleanup_web_preview_payloads(payload_dir: Path, keep_count: int = 40) -> None:
    payloads = sorted(payload_dir.glob("*.json"), key=lambda path: path.stat().st_mtime, reverse=True)
    for stale in payloads[keep_count:]:
        try:
            stale.unlink()
        except OSError:
            pass


class PreviewBridgeHandler(BaseHTTPRequestHandler):
    project_root: Path
    godot_path: str | None

    def _read_json_body(self) -> dict[str, Any]:
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError as exc:
            raise ValueError("Invalid Content-Length.") from exc
        if length <= 0 or length > MAX_BODY_BYTES:
            raise ValueError("Request body is too large or empty.")
        body = self.rfile.read(length).decode("utf-8")
        data = json.loads(body)
        if not isinstance(data, dict):
            raise ValueError("Request body must be a JSON object.")
        return data

    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._send_common_headers()
        self.end_headers()
        self.wfile.write(body)

    def _send_common_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cross-Origin-Resource-Policy", "cross-origin")

    def _serve_web_preview_file(self, request_path: str) -> None:
        root = require_web_preview_export(self.project_root)
        relative = unquote(request_path.removeprefix(WEB_PREVIEW_PREFIX)).lstrip("/")
        if not relative:
            relative = "index.html"
        target = (root / relative).resolve()
        if target != root and root not in target.parents:
            self._send_json(400, {"ok": False, "error": "Invalid web preview path."})
            return
        if not target.is_file():
            self._send_json(404, {"ok": False, "error": "Web preview file not found."})
            return

        body = target.read_bytes()
        content_type = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store" if target.suffix in [".html", ".json"] else "public, max-age=60")
        self._send_common_headers()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self._send_json(204, {})

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == WEB_PREVIEW_PREFIX or path.startswith(f"{WEB_PREVIEW_PREFIX}/"):
            try:
                self._serve_web_preview_file(path)
            except Exception as exc:
                self._send_json(404, {"ok": False, "error": str(exc)})
            return

        if path not in ["/health", "/config"]:
            self._send_json(404, {"ok": False, "error": "Unknown endpoint."})
            return

        try:
            godot = find_godot_executable(self.project_root, self.godot_path)
            self._send_json(
                200,
                {
                    "ok": True,
                    "platform": sys.platform,
                    "project_root": str(self.project_root),
                    "configured_godot": self.godot_path or "",
                    "godot": godot,
                },
            )
        except Exception as exc:
            self._send_json(
                200,
                {
                    "ok": False,
                    "platform": sys.platform,
                    "project_root": str(self.project_root),
                    "configured_godot": self.godot_path or "",
                    "error": str(exc),
                },
            )

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path == "/config":
            try:
                request = self._read_json_body()
                godot_path = str(request.get("godot_path", "")).strip()
                type(self).godot_path = godot_path or None
                godot = find_godot_executable(self.project_root, type(self).godot_path)
                self._send_json(
                    200,
                    {
                        "ok": True,
                        "platform": sys.platform,
                        "project_root": str(self.project_root),
                        "configured_godot": type(self).godot_path or "",
                        "godot": godot,
                    },
                )
            except Exception as exc:
                self._send_json(
                    200,
                    {
                        "ok": False,
                        "platform": sys.platform,
                        "project_root": str(self.project_root),
                        "configured_godot": type(self).godot_path or "",
                        "error": str(exc),
                    },
                )
            return

        if path == "/import":
            try:
                request = self._read_json_body()
                import_paths = normalize_import_paths(self.project_root, request.get("paths", []))
                timeout_seconds = int(request.get("timeout_seconds", 120) or 120)
                timeout_seconds = max(5, min(timeout_seconds, 600))
                godot = find_godot_executable(self.project_root, self.godot_path)
                result = run_godot_import(self.project_root, godot, timeout_seconds)
                if result.returncode != 0:
                    error_text = (result.stderr or result.stdout or "").strip()
                    raise RuntimeError(error_text or f"Godot import exited with code {result.returncode}.")
                self._send_json(
                    200,
                    {
                        "ok": True,
                        "paths": import_paths,
                        "configured_godot": type(self).godot_path or "",
                        "godot": godot,
                        "stdout": (result.stdout or "").strip()[-2000:],
                        "stderr": (result.stderr or "").strip()[-2000:],
                    },
                )
            except Exception as exc:
                self._send_json(500, {"ok": False, "error": str(exc)})
            return

        if path == f"{WEB_PREVIEW_PREFIX}/build":
            try:
                request = self._read_json_body()
                timeout_seconds = int(request.get("timeout_seconds", 300) or 300)
                timeout_seconds = max(30, min(timeout_seconds, 900))
                godot = find_godot_executable(self.project_root, self.godot_path)
                result = run_godot_web_export(self.project_root, godot, timeout_seconds)
                if result.returncode != 0:
                    error_text = (result.stderr or result.stdout or "").strip()
                    raise RuntimeError(error_text or f"Godot web export exited with code {result.returncode}.")
                self._send_json(
                    200,
                    {
                        "ok": True,
                        "web_root": str(web_preview_root(self.project_root)),
                        "configured_godot": type(self).godot_path or "",
                        "godot": godot,
                        "stdout": (result.stdout or "").strip()[-2000:],
                        "stderr": (result.stderr or "").strip()[-2000:],
                    },
                )
            except Exception as exc:
                self._send_json(500, {"ok": False, "error": str(exc)})
            return

        if path == f"{WEB_PREVIEW_PREFIX}/prepare":
            try:
                request = self._read_json_body()
                dialogue_id = str(request.get("dialogue_id", "")).strip()
                node_id = str(request.get("node_id", "")).strip()
                device = str(request.get("device", "")).strip()
                if not dialogue_id:
                    raise ValueError("dialogue_id is required.")
                _, payload_url = write_web_preview_payload(
                    self.project_root,
                    dialogue_id,
                    node_id,
                    str(request.get("dialogue_json", "")),
                )
                query = urlencode({
                    "editor_preview_dialogue": dialogue_id,
                    "editor_preview_node": node_id,
                    "editor_preview_device": device,
                    "editor_preview_payload": payload_url,
                    "preview_nonce": str(int(time.time() * 1000)),
                })
                self._send_json(
                    200,
                    {
                        "ok": True,
                        "url": f"{WEB_PREVIEW_PREFIX}/index.html?{query}",
                        "payload_url": payload_url,
                    },
                )
            except Exception as exc:
                self._send_json(500, {"ok": False, "error": str(exc)})
            return

        if path != "/preview":
            self._send_json(404, {"ok": False, "error": "Unknown endpoint."})
            return

        try:
            request = self._read_json_body()
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
                    "configured_godot": type(self).godot_path or "",
                    "godot": godot,
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
