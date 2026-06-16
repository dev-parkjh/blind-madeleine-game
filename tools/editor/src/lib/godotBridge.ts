import type { EditorLanguage } from "../editorTypes";
import type { ResourceRecord } from "../types";
import {
  bridgeErrorMessage,
  godotPreviewUrl,
  resolveGodotPreviewBridgeUrl
} from "./editorPreferences";

export type GodotImportStatus = { ok: boolean; error: string };

export type ProjectAssetUploadResult = {
  relativePath?: string;
  resPath: string;
  bytes?: number;
  importStatus?: GodotImportStatus;
};

export async function triggerGodotImport(bridgeEndpoint: string, paths: string[]) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 125000);
  try {
    const response = await fetch(godotPreviewUrl(bridgeEndpoint, "import"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ paths, timeout_seconds: 120 }),
      signal: controller.signal
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.ok) {
      throw new Error(bridgeErrorMessage(body, "bridge import unavailable"));
    }
    return { ok: true, error: "" };
  } catch (error) {
    const message = error instanceof DOMException && error.name === "AbortError"
      ? "timeout"
      : (error as Error).message;
    return { ok: false, error: message };
  } finally {
    window.clearTimeout(timeout);
  }
}

export function formatGodotImportStatus(status: GodotImportStatus | undefined) {
  if (!status) return "Godot import 미확인";
  return status.ok ? "Godot import 완료" : `Godot import 대기: ${status.error}`;
}

export async function postEditorPreviewBridge(
  bridgeEndpoint: string,
  path: string,
  payload: ResourceRecord = {},
  fallbackErrorMessage: string
) {
  const response = await fetch(godotPreviewUrl(bridgeEndpoint, path), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.ok) {
    throw new Error(bridgeErrorMessage(body, fallbackErrorMessage));
  }
  return body as ResourceRecord;
}

export async function prepareFullGamePlayUrl(bridgeEndpoint: string, fallbackErrorMessage: string) {
  await postEditorPreviewBridge(bridgeEndpoint, "web-preview/build", { timeout_seconds: 300 }, fallbackErrorMessage);
  return resolveGodotPreviewBridgeUrl(bridgeEndpoint, `/web-preview/index.html?play_nonce=${Date.now()}`);
}

export function isMobilePlayWindowTarget() {
  const coarsePointer = window.matchMedia ? window.matchMedia("(pointer: coarse)").matches : false;
  const touchDevice = navigator.maxTouchPoints > 1;
  const userAgent = navigator.userAgent || "";
  return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(userAgent) || (coarsePointer && touchDevice);
}

export function openPlayWindow(language: EditorLanguage, notify: (message: string) => void) {
  let features: string | undefined;
  if (!isMobilePlayWindowTarget()) {
    const screenInfo = window.screen as Screen & { availLeft?: number; availTop?: number };
    const width = Math.min(1280, Math.max(900, Math.round((screenInfo.availWidth || window.outerWidth || 1280) * 0.82)));
    const height = Math.min(820, Math.max(620, Math.round((screenInfo.availHeight || window.outerHeight || 820) * 0.82)));
    const left = Math.max(0, Math.round((screenInfo.availLeft || 0) + ((screenInfo.availWidth || width) - width) / 2));
    const top = Math.max(0, Math.round((screenInfo.availTop || 0) + ((screenInfo.availHeight || height) - height) / 2));
    features = [
      "popup=yes",
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      "resizable=yes",
      "scrollbars=no"
    ].join(",");
  }
  const playWindow = window.open("", `blind-madeleine-play-${Date.now()}`, features);
  if (!playWindow || playWindow === window) {
    notify(language === "ko" ? "팝업이 차단되어 게임 창을 열 수 없습니다." : "Popup was blocked, so the game window could not open.");
    return null;
  }
  writePlayWindowStatus(
    language,
    playWindow,
    language === "ko" ? "Blind Madeleine 실행 준비 중" : "Preparing Blind Madeleine",
    language === "ko" ? "게임 화면을 준비하고 있습니다." : "Preparing the game window."
  );
  playWindow.focus();
  return playWindow;
}

export function writePlayWindowStatus(
  language: EditorLanguage,
  playWindow: Window,
  title: string,
  message: string,
  error = false
) {
  try {
    const statusDocument = playWindow.document;
    statusDocument.open();
    statusDocument.write(`<!doctype html>
<html lang="${language === "ko" ? "ko" : "en"}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Blind Madeleine</title>
<style>
*{box-sizing:border-box}
html,body{margin:0;width:100%;min-height:100%}
body{min-height:100vh;min-height:100svh;display:flex;align-items:center;justify-content:center;background:#101417;color:#eef4fa;font:600 clamp(18px,4vw,30px)/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
main{display:grid;gap:clamp(10px,2.2vw,20px);width:min(720px,calc(100vw - 48px));text-align:center;padding:clamp(28px,7vw,72px)}
strong{font-size:clamp(28px,6.8vw,54px);line-height:1.16}
span{color:#aab6c4;font-size:clamp(18px,4.2vw,32px)}
.error{color:#ffb4ab}
</style>
</head>
<body><main><strong id="status-title"></strong><span id="status-message"></span></main></body>
</html>`);
    statusDocument.close();
    const titleElement = statusDocument.getElementById("status-title");
    const messageElement = statusDocument.getElementById("status-message");
    if (titleElement) titleElement.textContent = title;
    if (messageElement) {
      messageElement.textContent = message;
      if (error) messageElement.classList.add("error");
    }
  } catch {
    // The popup may have already navigated away.
  }
}

export function finishPlayWindow(playWindow: Window, url: string) {
  playWindow.location.href = url;
  playWindow.focus();
}

export function finishPlayInCurrentTab(url: string) {
  window.location.href = url;
}

export function reportPlayFailure(
  language: EditorLanguage,
  notify: (message: string) => void,
  playWindow: Window,
  error: unknown
) {
  const message = error instanceof Error ? error.message : String(error || "");
  writePlayWindowStatus(
    language,
    playWindow,
    language === "ko" ? "실행 실패" : "Play failed",
    message,
    true
  );
  notify(`${language === "ko" ? "실행 실패" : "Play failed"}: ${message}`);
}
