import { useEffect, useRef, useState } from "react";
import type { EditorCopy } from "../../editorText";
import type { PreviewMode } from "../../editorTypes";
import { bridgeErrorMessage, godotPreviewUrl, resolveGodotPreviewBridgeUrl } from "../../lib/editorPreferences";
import type { ResourceRecord } from "../../types";
import {
  godotWebPreviewModes
} from "./StageCastActualPreviewPanel";
import type { StageCastActualPreviewContext } from "./stageCastPreviewTypes";

export function useStageCastActualPreviewController({
  actualPreview,
  ui
}: {
  actualPreview?: StageCastActualPreviewContext;
  ui: EditorCopy;
}) {
  const actualPreviewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const pendingActualPreviewMessageRef = useRef<ResourceRecord | null>(null);
  const actualPreviewUrlRef = useRef("");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("web");
  const [actualPreviewUrl, setActualPreviewUrl] = useState("");
  const [actualPreviewOpenUrl, setActualPreviewOpenUrl] = useState("");
  const [actualPreviewStatus, setActualPreviewStatus] = useState("");
  const [actualPreviewBusy, setActualPreviewBusy] = useState(false);
  const [actualPreviewBusyKind, setActualPreviewBusyKind] = useState<"" | "prepare" | "build">("");
  const [actualPreviewLoadCover, setActualPreviewLoadCover] = useState(false);
  const [godotLaunchMenuOpen, setGodotLaunchMenuOpen] = useState(false);
  const activeModeConfig = godotWebPreviewModes.find((entry) => entry.id === previewMode) || godotWebPreviewModes[0];
  const hasActualPreviewContext = Boolean(actualPreview?.dialogueId);
  const actualPreviewCoverMessage = actualPreviewBusyKind === "build"
    ? ui.preview.actualPreviewBuilding
    : actualPreviewStatus || ui.preview.actualPreviewPreparing;

  useEffect(() => {
    actualPreviewUrlRef.current = actualPreviewUrl;
  }, [actualPreviewUrl]);

  useEffect(() => {
    const handleReady = (event: MessageEvent) => {
      const data = event.data && typeof event.data === "object" ? event.data as ResourceRecord : {};
      if (data.type !== "blind-madeleine-editor-preview-ready") return;
      setActualPreviewLoadCover(false);
      setActualPreviewBusyKind("");
      setActualPreviewStatus(ui.preview.actualPreviewReady);
    };
    window.addEventListener("message", handleReady);
    return () => window.removeEventListener("message", handleReady);
  }, [ui.preview.actualPreviewReady]);

  useEffect(() => {
    if (!actualPreview) {
      setPreviewMode("web");
      setActualPreviewUrl("");
      setActualPreviewOpenUrl("");
    }
    setActualPreviewUrl("");
    setActualPreviewOpenUrl("");
    setActualPreviewStatus("");
    setActualPreviewBusyKind("");
    setActualPreviewLoadCover(false);
    setGodotLaunchMenuOpen(false);
  }, [actualPreview?.dialogueId]);

  useEffect(() => {
    setPreviewMode("web");
    setGodotLaunchMenuOpen(false);
  }, [actualPreview?.nodeId]);

  async function postBridge(endpoint: string, path: string, payload: ResourceRecord) {
    const response = await fetch(godotPreviewUrl(endpoint, path), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.ok) {
      throw new Error(bridgeErrorMessage(body, ui.preview.bridgeRequired));
    }
    return body as ResourceRecord;
  }

  function postActualPreviewMessage(message: ResourceRecord) {
    pendingActualPreviewMessageRef.current = message;
    const contentWindow = actualPreviewFrameRef.current?.contentWindow;
    if (!contentWindow) return;

    contentWindow.postMessage(message, "*");
    window.setTimeout(() => contentWindow.postMessage(message, "*"), 250);
    window.setTimeout(() => contentWindow.postMessage(message, "*"), 900);
  }

  function handleActualPreviewFrameLoad() {
    const pendingMessage = pendingActualPreviewMessageRef.current;
    if (pendingMessage) postActualPreviewMessage(pendingMessage);
    window.setTimeout(() => {
      setActualPreviewLoadCover(false);
      setActualPreviewBusyKind("");
    }, 4500);
  }

  async function prepareActualPreview(mode = previewMode, buildFirst = false) {
    const config = godotWebPreviewModes.find((entry) => entry.id === mode);
    const previewContext = actualPreview;
    if (!config || mode === "web") return;
    if (!previewContext || !hasActualPreviewContext) {
      setActualPreviewStatus(ui.preview.actualPreviewUnavailable);
      return;
    }

    setPreviewMode(mode);
    setActualPreviewBusy(true);
    setActualPreviewBusyKind(buildFirst ? "build" : "prepare");
    try {
      if (buildFirst) {
        setActualPreviewLoadCover(true);
        setActualPreviewStatus(ui.preview.actualPreviewBuilding);
        await postBridge(previewContext.bridgeEndpoint, "web-preview/build", { timeout_seconds: 300 });
      }
      setActualPreviewStatus(ui.preview.actualPreviewPreparing);
      const body = await postBridge(previewContext.bridgeEndpoint, "web-preview/prepare", {
        dialogue_id: previewContext.dialogueId,
        dialogue_json: JSON.stringify(previewContext.dialogueDraft, null, 2),
        node_id: previewContext.nodeId,
        device: config.device
      });
      const url = String(body.url || "");
      const nextUrl = resolveGodotPreviewBridgeUrl(previewContext.bridgeEndpoint, url);
      const rawPayloadUrl = String(body.payload_url || "");
      if (!rawPayloadUrl) throw new Error("Godot web preview payload URL is missing.");
      const payloadUrl = resolveGodotPreviewBridgeUrl(previewContext.bridgeEndpoint, rawPayloadUrl);
      const nextMessage = {
        type: "blind-madeleine-editor-preview",
        dialogueId: previewContext.dialogueId,
        nodeId: previewContext.nodeId,
        device: config.device,
        payloadUrl
      };
      setActualPreviewOpenUrl(nextUrl);
      if (!actualPreviewUrlRef.current || buildFirst) {
        pendingActualPreviewMessageRef.current = nextMessage;
        setActualPreviewLoadCover(true);
        setActualPreviewUrl(nextUrl);
      } else {
        postActualPreviewMessage(nextMessage);
        setActualPreviewLoadCover(false);
      }
      setActualPreviewStatus(ui.preview.actualPreviewReady);
    } catch (error) {
      const message = (error as Error).message;
      setActualPreviewStatus(message);
      setActualPreviewBusyKind("");
      setActualPreviewLoadCover(false);
      previewContext.notify(`${ui.preview.actualPreview}: ${message}`);
    } finally {
      setActualPreviewBusy(false);
      if (!buildFirst) setActualPreviewBusyKind("");
    }
  }

  function switchPreviewMode(mode: PreviewMode) {
    setPreviewMode(mode);
    if (mode !== "web") void prepareActualPreview(mode);
  }

  async function launchNativePreview(kind: "current" | "previous") {
    const previewContext = actualPreview;
    if (!previewContext || !hasActualPreviewContext) {
      setActualPreviewStatus(ui.preview.actualPreviewUnavailable);
      return;
    }
    const nodeId = kind === "previous" ? previewContext.previousNodeId : previewContext.nodeId;
    if (!nodeId) return;

    const label = kind === "previous" ? ui.preview.previousDialogue : ui.preview.currentDialogue;
    setActualPreviewBusy(true);
    try {
      const body = await postBridge(previewContext.bridgeEndpoint, "preview", {
        dialogue_id: previewContext.dialogueId,
        dialogue_file: `${previewContext.dialogueId}.json`,
        dialogue_json: JSON.stringify(previewContext.dialogueDraft, null, 2),
        node_id: nodeId
      });
      const pid = body.pid ? ` · PID ${String(body.pid)}` : "";
      setGodotLaunchMenuOpen(false);
      setActualPreviewStatus(`${ui.preview.godotRun}: ${label}`);
      previewContext.notify(`${ui.preview.godotRun}: ${label}${pid}`);
    } catch (error) {
      const message = (error as Error).message;
      setActualPreviewStatus(message);
      previewContext.notify(`${ui.preview.godotRun}: ${message}`);
    } finally {
      setActualPreviewBusy(false);
    }
  }

  return {
    activeModeConfig,
    actualPreviewBusy,
    actualPreviewBusyKind,
    actualPreviewCoverMessage,
    actualPreviewFrameRef,
    actualPreviewLoadCover,
    actualPreviewOpenUrl,
    actualPreviewStatus,
    actualPreviewUrl,
    godotLaunchMenuOpen,
    handleActualPreviewFrameLoad,
    hasActualPreviewContext,
    launchNativePreview,
    prepareActualPreview,
    previewMode,
    switchPreviewMode,
    toggleGodotLaunchMenu: () => setGodotLaunchMenuOpen((open) => !open)
  };
}
