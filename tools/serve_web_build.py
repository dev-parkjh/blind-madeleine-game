#!/usr/bin/env python3
from __future__ import annotations

import argparse
import functools
import http.server
import ipaddress
import mimetypes
import os
from pathlib import Path
import ssl


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_BUILD_DIR = PROJECT_ROOT / "build" / "web"
DEFAULT_HOST = os.environ.get("WEB_BUILD_HOST", "127.0.0.1")
DEFAULT_PORT = int(os.environ.get("WEB_BUILD_PORT", "8060"))
DEFAULT_CERT = os.environ.get("WEB_BUILD_CERT", "")
DEFAULT_KEY = os.environ.get("WEB_BUILD_KEY", "")


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
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cross-Origin-Resource-Policy", "cross-origin")
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
    parser.add_argument(
        "--cert",
        default=DEFAULT_CERT,
        help="TLS certificate path. Defaults to WEB_BUILD_CERT.",
    )
    parser.add_argument(
        "--key",
        default=DEFAULT_KEY,
        help="TLS private key path. Defaults to WEB_BUILD_KEY.",
    )
    return parser.parse_args()


def is_loopback_host(host: str) -> bool:
    normalized = host.strip().lower()
    if normalized in ["localhost", "127.0.0.1", "::1"]:
        return True
    try:
        return ipaddress.ip_address(normalized).is_loopback
    except ValueError:
        return False


def resolve_optional_path(value: str) -> Path | None:
    text = value.strip()
    if not text:
        return None
    return Path(text).expanduser().resolve()


def main() -> int:
    args = parse_args()
    build_dir = Path(args.build_dir).expanduser().resolve()
    index_path = build_dir / "index.html"
    cert_path = resolve_optional_path(args.cert)
    key_path = resolve_optional_path(args.key)

    if not index_path.is_file():
        print(f"Web build not found: {index_path}")
        print("Build first:")
        print(f'  godot --headless --path "{PROJECT_ROOT}" --export-release Web "{DEFAULT_BUILD_DIR / "index.html"}"')
        return 1
    if bool(cert_path) != bool(key_path):
        print("HTTPS requires both --cert and --key, or WEB_BUILD_CERT and WEB_BUILD_KEY.")
        return 1
    if cert_path and not cert_path.is_file():
        print(f"TLS certificate not found: {cert_path}")
        return 1
    if key_path and not key_path.is_file():
        print(f"TLS private key not found: {key_path}")
        return 1

    mimetypes.add_type("application/javascript", ".js")
    mimetypes.add_type("application/octet-stream", ".pck")
    mimetypes.add_type("application/wasm", ".wasm")

    handler = functools.partial(GodotWebHandler, directory=str(build_dir))
    server = http.server.ThreadingHTTPServer((args.host, args.port), handler)
    server.daemon_threads = True
    scheme = "http"
    if cert_path and key_path:
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(certfile=str(cert_path), keyfile=str(key_path))
        server.socket = context.wrap_socket(server.socket, server_side=True)
        scheme = "https"

    display_host = "127.0.0.1" if args.host in ["0.0.0.0", "::"] else args.host
    print(f"Serving {build_dir}", flush=True)
    print(f"Open {scheme}://{display_host}:{args.port}/index.html", flush=True)
    if scheme == "http" and not is_loopback_host(args.host):
        print(
            "Godot Web requires a secure context: HTTP works for localhost only; use HTTPS for LAN IPs and custom hostnames.",
            flush=True,
        )
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
