#!/usr/bin/env python3
from __future__ import annotations

import argparse
import functools
import http.server
import mimetypes
import os
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_BUILD_DIR = PROJECT_ROOT / "build" / "web"
DEFAULT_HOST = os.environ.get("WEB_BUILD_HOST", "127.0.0.1")
DEFAULT_PORT = int(os.environ.get("WEB_BUILD_PORT", "8060"))


class GodotWebHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "application/javascript",
        ".pck": "application/octet-stream",
        ".wasm": "application/wasm",
        ".worklet": "application/javascript",
    }

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Serve the Godot Web export from build/web for local testing."
    )
    parser.add_argument(
        "build_dir",
        nargs="?",
        default=str(DEFAULT_BUILD_DIR),
        help="Directory containing index.html. Defaults to build/web.",
    )
    parser.add_argument(
        "--host",
        default=DEFAULT_HOST,
        help="Host/interface to bind. Defaults to WEB_BUILD_HOST or 127.0.0.1.",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=DEFAULT_PORT,
        help="Port to bind. Defaults to WEB_BUILD_PORT or 8060.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    build_dir = Path(args.build_dir).expanduser().resolve()
    index_path = build_dir / "index.html"

    if not index_path.is_file():
        print(f"Web build not found: {index_path}")
        print("Build first:")
        print(f'  godot --headless --path "{PROJECT_ROOT}" --export-release Web "{DEFAULT_BUILD_DIR / "index.html"}"')
        return 1

    mimetypes.add_type("application/javascript", ".js")
    mimetypes.add_type("application/octet-stream", ".pck")
    mimetypes.add_type("application/wasm", ".wasm")

    handler = functools.partial(GodotWebHandler, directory=str(build_dir))
    server = http.server.ThreadingHTTPServer((args.host, args.port), handler)
    server.daemon_threads = True

    print(f"Serving {build_dir}", flush=True)
    print(f"Open http://{args.host}:{args.port}/index.html", flush=True)
    print("Press Ctrl+C to stop.", flush=True)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        server.server_close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
