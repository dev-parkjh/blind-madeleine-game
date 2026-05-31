#!/usr/bin/env python3
"""Local JSON-to-CosyVoice TTS proxy for the dialogue editor.

The dialogue editor posts JSON to a local TTS endpoint. CosyVoice's FastAPI
server expects multipart form data and streams raw PCM16 audio. This proxy sits
between them, converts the request, wraps the response as WAV, and returns
audio/wav to the editor.
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import re
import sys
import uuid
import wave
from dataclasses import dataclass
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
from pathlib import Path
from typing import Any
from urllib import error, request


SUPPORTED_MODES = {"sft", "zero_shot", "cross_lingual", "instruct", "instruct2"}
DEFAULT_COSYVOICE_URL = os.environ.get("COSYVOICE_URL", "http://localhost:50000")
DEFAULT_SAMPLE_RATE = 22050
LANGUAGE_TAGS = {
    "zh": "<|zh|>",
    "cn": "<|zh|>",
    "chinese": "<|zh|>",
    "ko": "<|ko|>",
    "kr": "<|ko|>",
    "kor": "<|ko|>",
    "korean": "<|ko|>",
    "ja": "<|ja|>",
    "jp": "<|ja|>",
    "japanese": "<|ja|>",
    "en": "<|en|>",
    "eng": "<|en|>",
    "english": "<|en|>",
}
HANGUL_RE = re.compile(r"[\u1100-\u11ff\u3130-\u318f\uac00-\ud7a3]")
KANA_RE = re.compile(r"[\u3040-\u30ff]")
LANGUAGE_TAG_RE = re.compile(r"<\|[a-z]{2,3}\|>", re.IGNORECASE)


@dataclass(frozen=True)
class ProxyConfig:
    cosyvoice_url: str
    project_root: Path
    sample_rate: int
    timeout: float


def normalize_text(value: Any) -> str:
    return str(value or "").strip()


def flatten_voice_config(voice: Any) -> dict[str, Any]:
    if not isinstance(voice, dict):
        return {}
    nested = voice.get("cosyvoice")
    merged: dict[str, Any] = {}
    if isinstance(nested, dict):
        merged.update(nested)
    merged.update({key: value for key, value in voice.items() if key != "cosyvoice"})
    return merged


def choose_first(*values: Any) -> str:
    for value in values:
        text = normalize_text(value)
        if text:
            return text
    return ""


def clean_tts_text(text: str) -> str:
    # Mirrors the editor's dialogue timing marker cleanup for direct API callers.
    special_tokens: list[str] = []

    def stash_special_token(match: re.Match[str]) -> str:
        special_tokens.append(match.group(0))
        return f"\ue100{len(special_tokens) - 1}\ue101"

    text = LANGUAGE_TAG_RE.sub(stash_special_token, str(text or ""))
    pipe_token = "\ue000"
    text = text.replace(r"\|", pipe_token)
    text = re.sub(r"\|\d*(?:\.\d+)?\|", " ", text)
    text = text.replace("|", " ")
    text = re.sub(r"\[([^\[\]]+)\]", r"\1", text)
    text = text.replace(pipe_token, "|")
    text = re.sub(r"\s+", " ", text)
    for index, token in enumerate(special_tokens):
        text = text.replace(f"\ue100{index}\ue101", token)
    return text.strip()


def normalize_language(value: Any) -> str:
    text = normalize_text(value).lower().replace("_", "-")
    if not text:
        return ""
    return text.split("-", 1)[0]


def detect_text_language(text: str, voice: dict[str, Any], payload: dict[str, Any]) -> str:
    explicit = choose_first(
        voice.get("language"),
        voice.get("lang"),
        voice.get("tts_language"),
        payload.get("language"),
        payload.get("lang"),
    )
    language = normalize_language(explicit)
    if language:
        return language
    if HANGUL_RE.search(text):
        return "ko"
    if KANA_RE.search(text):
        return "ja"
    return ""


def apply_language_tag(text: str, language: str) -> str:
    if not text or LANGUAGE_TAG_RE.search(text):
        return text
    tag = LANGUAGE_TAGS.get(normalize_language(language))
    return f"{tag}{text}" if tag else text


def resolve_project_path(project_root: Path, path_value: Any) -> Path:
    raw_path = normalize_text(path_value)
    if not raw_path:
        raise ValueError("prompt_wav is required for this CosyVoice mode.")
    if raw_path.startswith("res://"):
        raw_path = raw_path[len("res://") :]
    raw_path = raw_path.replace("\\", "/").lstrip("/")
    path = Path(raw_path)
    if not path.is_absolute():
        path = project_root / path
    path = path.resolve()
    if not path.is_file():
        raise ValueError(f"prompt_wav not found: {path}")
    return path


def parse_sample_rate(value: Any, fallback: int) -> int:
    try:
        sample_rate = int(value)
    except (TypeError, ValueError):
        return fallback
    return sample_rate if sample_rate > 0 else fallback


def build_cosyvoice_request(payload: dict[str, Any], config: ProxyConfig) -> tuple[str, dict[str, str], list[tuple[str, Path]], int]:
    voice = flatten_voice_config(payload.get("voice"))
    mode = normalize_text(voice.get("mode") or "sft").lower()
    if mode not in SUPPORTED_MODES:
        raise ValueError(f"Unsupported CosyVoice mode: {mode}")

    text = clean_tts_text(payload.get("text") or payload.get("raw_text") or "")
    if not text:
        raise ValueError("text is required.")

    endpoint = choose_first(voice.get("endpoint"), voice.get("base_url"), config.cosyvoice_url).rstrip("/")
    if not endpoint:
        raise ValueError("CosyVoice endpoint is required.")

    sample_rate = parse_sample_rate(voice.get("sample_rate"), config.sample_rate)
    fields: dict[str, str] = {"tts_text": text}
    files: list[tuple[str, Path]] = []

    spk_id = choose_first(
        voice.get("spk_id"),
        voice.get("speaker"),
        voice.get("voice"),
        voice.get("preset"),
        payload.get("speaker"),
    )
    prompt_wav = choose_first(voice.get("prompt_wav"), voice.get("prompt_audio"))
    instruct_text = choose_first(
        voice.get("instruct_text"),
        voice.get("instruction"),
        voice.get("instructions"),
        payload.get("instructions"),
    )
    language = detect_text_language(text, voice, payload)
    text = apply_language_tag(text, language)
    fields["tts_text"] = text

    if mode == "sft":
        if not spk_id:
            raise ValueError("CosyVoice sft mode requires spk_id, voice, preset, or speaker.")
        fields["spk_id"] = spk_id
    elif mode == "zero_shot":
        prompt_text = choose_first(voice.get("prompt_text"))
        if not prompt_text:
            raise ValueError("CosyVoice zero_shot mode requires prompt_text.")
        fields["prompt_text"] = prompt_text
        files.append(("prompt_wav", resolve_project_path(config.project_root, prompt_wav)))
    elif mode == "cross_lingual":
        files.append(("prompt_wav", resolve_project_path(config.project_root, prompt_wav)))
    elif mode == "instruct":
        if not spk_id:
            raise ValueError("CosyVoice instruct mode requires spk_id, voice, preset, or speaker.")
        fields["spk_id"] = spk_id
        fields["instruct_text"] = instruct_text
    elif mode == "instruct2":
        fields["instruct_text"] = instruct_text
        files.append(("prompt_wav", resolve_project_path(config.project_root, prompt_wav)))

    return f"{endpoint}/inference_{mode}", fields, files, sample_rate


def encode_multipart(fields: dict[str, str], files: list[tuple[str, Path]]) -> tuple[bytes, str]:
    boundary = f"----blind-madeleine-{uuid.uuid4().hex}"
    body = bytearray()

    def add_line(value: bytes | str = b"") -> None:
        if isinstance(value, str):
            value = value.encode("utf-8")
        body.extend(value)
        body.extend(b"\r\n")

    for name, value in fields.items():
        add_line(f"--{boundary}")
        add_line(f'Content-Disposition: form-data; name="{name}"')
        add_line()
        add_line(value)

    for name, path in files:
        filename = path.name
        mime_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
        add_line(f"--{boundary}")
        add_line(f'Content-Disposition: form-data; name="{name}"; filename="{filename}"')
        add_line(f"Content-Type: {mime_type}")
        add_line()
        body.extend(path.read_bytes())
        body.extend(b"\r\n")

    add_line(f"--{boundary}--")
    return bytes(body), f"multipart/form-data; boundary={boundary}"


def pcm16_to_wav(audio: bytes, sample_rate: int) -> bytes:
    if audio.startswith(b"RIFF") and audio[8:12] == b"WAVE":
        return audio

    buffer = BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio)
    return buffer.getvalue()


def request_cosyvoice(url: str, fields: dict[str, str], files: list[tuple[str, Path]], sample_rate: int, timeout: float) -> bytes:
    body, content_type = encode_multipart(fields, files)
    req = request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Content-Type": content_type,
            "Accept": "application/octet-stream, audio/wav, */*",
        },
    )
    try:
        with request.urlopen(req, timeout=timeout) as response:
            audio = response.read()
    except error.HTTPError as exc:
        detail = exc.read(2048).decode("utf-8", errors="replace").strip()
        raise RuntimeError(f"CosyVoice HTTP {exc.code}: {detail or exc.reason}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"CosyVoice connection failed: {exc.reason}") from exc

    if not audio:
        raise RuntimeError("CosyVoice returned an empty audio stream.")
    return pcm16_to_wav(audio, sample_rate)


class TtsProxyHandler(BaseHTTPRequestHandler):
    server_version = "BlindMadeleineCosyVoiceProxy/1.0"

    @property
    def proxy_config(self) -> ProxyConfig:
        return self.server.proxy_config  # type: ignore[attr-defined]

    def log_message(self, fmt: str, *args: Any) -> None:
        sys.stderr.write("%s - - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), fmt % args))

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_GET(self) -> None:
        if self.path.rstrip("/") == "/health":
            self.send_json(
                HTTPStatus.OK,
                {
                    "ok": True,
                    "cosyvoice_url": self.proxy_config.cosyvoice_url,
                    "project_root": str(self.proxy_config.project_root),
                    "sample_rate": self.proxy_config.sample_rate,
                },
            )
            return
        self.send_json(HTTPStatus.NOT_FOUND, {"error": "Not found. Use POST /tts or GET /health."})

    def do_POST(self) -> None:
        if self.path.rstrip("/") != "/tts":
            self.send_json(HTTPStatus.NOT_FOUND, {"error": "Not found. Use POST /tts."})
            return

        try:
            payload = self.read_json()
            url, fields, files, sample_rate = build_cosyvoice_request(payload, self.proxy_config)
            wav_audio = request_cosyvoice(url, fields, files, sample_rate, self.proxy_config.timeout)
        except ValueError as exc:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
            return
        except Exception as exc:  # Keeps local editor errors readable.
            self.send_json(HTTPStatus.BAD_GATEWAY, {"error": str(exc)})
            return

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "audio/wav")
        self.send_header("Content-Length", str(len(wav_audio)))
        self.end_headers()
        self.wfile.write(wav_audio)

    def read_json(self) -> dict[str, Any]:
        content_length = int(self.headers.get("Content-Length") or 0)
        if content_length <= 0:
            raise ValueError("JSON body is required.")
        raw_body = self.rfile.read(content_length)
        try:
            data = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid JSON body: {exc.msg}") from exc
        if not isinstance(data, dict):
            raise ValueError("JSON body must be an object.")
        return data

    def send_json(self, status: HTTPStatus, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


class TtsProxyServer(ThreadingHTTPServer):
    def __init__(self, server_address: tuple[str, int], handler_class: type[BaseHTTPRequestHandler], proxy_config: ProxyConfig):
        super().__init__(server_address, handler_class)
        self.proxy_config = proxy_config


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run a local CosyVoice TTS proxy for the dialogue editor.")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind. Use 0.0.0.0 for LAN access.")
    parser.add_argument("--port", type=int, default=7860, help="Local proxy port.")
    parser.add_argument("--cosyvoice-url", default=DEFAULT_COSYVOICE_URL, help="Base URL of the CosyVoice FastAPI server.")
    parser.add_argument("--project-root", default=str(Path(__file__).resolve().parents[1]), help="Project root for resolving prompt_wav paths.")
    parser.add_argument("--sample-rate", type=int, default=DEFAULT_SAMPLE_RATE, help="Sample rate for wrapping CosyVoice PCM as WAV.")
    parser.add_argument("--timeout", type=float, default=300.0, help="CosyVoice request timeout in seconds.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    proxy_config = ProxyConfig(
        cosyvoice_url=str(args.cosyvoice_url).rstrip("/"),
        project_root=Path(args.project_root).resolve(),
        sample_rate=args.sample_rate,
        timeout=args.timeout,
    )
    server = TtsProxyServer((args.host, args.port), TtsProxyHandler, proxy_config)
    print(f"CosyVoice TTS proxy: http://{args.host}:{args.port}/tts")
    print(f"CosyVoice backend:   {proxy_config.cosyvoice_url}")
    print(f"Project root:       {proxy_config.project_root}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping proxy.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
