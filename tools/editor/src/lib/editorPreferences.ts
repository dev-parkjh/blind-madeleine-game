import type { EditorLanguage, EditorThemeAccent, EditorThemeMode } from "../editorTypes";
import type { ResourceRecord, ResourceType } from "../types";
import { countArray } from "./resourceConfig";

export const godotPreviewEndpointStorageKey = "blind-madeleine-godot-preview-endpoint";
export const editorLanguageStorageKey = "blind-madeleine-editor-language";
export const editorThemeModeStorageKey = "blind-madeleine-editor-theme-mode";
export const editorThemeAccentStorageKey = "blind-madeleine-editor-theme-accent";
export const editorCustomAccentStorageKey = "blind-madeleine-editor-custom-accent";
export const editorBackGuardStateKey = "blind-madeleine-editor-back-guard";
const godotPreviewDefaultEndpoint = "/api/godot-preview";
const godotPreviewLegacyLoopbackPorts = new Set(["51234"]);
export const defaultCustomAccent = "#9bdcb9";

function clampPreferenceNumber(value: unknown, min: number, max: number, fallback = min) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}

export function readEditorLanguage(): EditorLanguage {
  const saved = readLocalSetting(editorLanguageStorageKey);
  return saved === "en" ? "en" : "ko";
}

export function readEditorThemeMode(): EditorThemeMode {
  const saved = readLocalSetting(editorThemeModeStorageKey);
  return saved === "light" ? "light" : "dark";
}

export function readEditorThemeAccent(): EditorThemeAccent {
  return normalizeEditorThemeAccent(readLocalSetting(editorThemeAccentStorageKey));
}

export function readEditorCustomAccent(): string {
  return sanitizeHexColor(readLocalSetting(editorCustomAccentStorageKey), defaultCustomAccent);
}

function readLocalSetting(key: string): string {
  try {
    return localStorage.getItem(key)?.trim() || "";
  } catch {
    return "";
  }
}

export function normalizeEditorThemeAccent(value: unknown): EditorThemeAccent {
  const clean = String(value || "").trim();
  if (clean === "blue" || clean === "rose" || clean === "amber" || clean === "custom") return clean;
  return "blue";
}

export function applyEditorAppearance(
  language: EditorLanguage,
  themeMode: EditorThemeMode,
  themeAccent: EditorThemeAccent,
  customAccent: string
) {
  const root = document.documentElement;
  root.lang = language === "ko" ? "ko" : "en";
  root.dataset.theme = themeMode;
  root.dataset.accent = themeAccent;

  const primary = sanitizeHexColor(customAccent, defaultCustomAccent);
  const containerMixTarget = themeMode === "dark" ? "#000000" : "#ffffff";
  const containerWeight = themeMode === "dark" ? 0.6 : 0.74;
  root.style.setProperty("--custom-primary", primary);
  root.style.setProperty("--custom-on-primary", readableTextColor(primary));
  root.style.setProperty("--custom-primary-container", mixHex(primary, containerMixTarget, containerWeight));
  root.style.setProperty("--custom-state-focus", hexToRgba(primary, themeMode === "dark" ? 0.24 : 0.28));
}

export function readGodotPreviewEndpoint() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("godot_preview_endpoint")?.trim();
    if (fromUrl) {
      saveLocalSetting(godotPreviewEndpointStorageKey, fromUrl);
      return normalizeGodotPreviewEndpoint(fromUrl);
    }
    const saved = localStorage.getItem(godotPreviewEndpointStorageKey)?.trim();
    if (saved && !isLegacyLoopbackGodotPreviewEndpoint(saved)) return normalizeGodotPreviewEndpoint(saved);
    if (saved) saveLocalSetting(godotPreviewEndpointStorageKey, godotPreviewDefaultEndpoint);
  } catch {
    // Fall through to the local bridge default.
  }
  return godotPreviewDefaultEndpoint;
}

export function saveLocalSetting(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private browsing or blocked storage should not break editing.
  }
}

export function describeResourceForLanguage(type: ResourceType, data: ResourceRecord | null | undefined, language: EditorLanguage): string {
  if (!data) return language === "ko" ? "선택 없음" : "No selection";

  if (type === "dialogues") {
    const nodeCount = countArray(data.nodes);
    const statementCount = countArray(data.statement_nodes);
    const chapterCount = countChapterScopeForDescription(data);
    return language === "ko"
      ? `노드 ${nodeCount}개 · 진술 ${statementCount}개 · 챕터 ${chapterCount}개`
      : `${nodeCount} nodes · ${statementCount} statements · ${chapterCount} chapters`;
  }

  if (type === "chapters") {
    const dialogueCount = countArray(data.dialogues ?? data.dialogue_ids);
    return language === "ko"
      ? `순서 ${data.order ?? "-"} · 대사 ${dialogueCount}개`
      : `order ${data.order ?? "-"} · ${dialogueCount} dialogues`;
  }

  if (type === "characters") {
    const portraitCount = data.portraits && typeof data.portraits === "object" ? Object.keys(data.portraits).length : 0;
    return language === "ko" ? `초상 ${portraitCount}개` : `${portraitCount} portraits`;
  }

  if (type === "story_assets") {
    return [data.kind || (language === "ko" ? "에셋" : "asset"), data.path || ""].filter(Boolean).join(" · ");
  }

  const chapterCount = countChapterScopeForDescription(data);
  return language === "ko" ? `챕터 ${chapterCount}개` : `${chapterCount} chapters`;
}

function countChapterScopeForDescription(data: ResourceRecord): number {
  const metadata = data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
    ? data.metadata as ResourceRecord
    : {};
  const value = data.chapters ?? data.chapter_ids ?? metadata.chapters ?? metadata.chapter_ids;
  if (Array.isArray(value)) return value.length;
  if (typeof value === "string" && value.trim()) return 1;
  return 0;
}

export function sanitizeHexColor(value: unknown, fallback: string): string {
  const text = String(value || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(text)) return text;
  if (/^[0-9a-f]{6}$/i.test(text)) return `#${text}`;
  return fallback;
}

function hexToRgb(value: string): { r: number; g: number; b: number } {
  const hex = sanitizeHexColor(value, defaultCustomAccent).slice(1);
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  };
}

function mixHex(source: string, target: string, targetWeight: number): string {
  const a = hexToRgb(source);
  const b = hexToRgb(target);
  const weight = clampPreferenceNumber(targetWeight, 0, 1, 0.5);
  const channel = (from: number, to: number) => Math.round(from * (1 - weight) + to * weight);
  return `#${[channel(a.r, b.r), channel(a.g, b.g), channel(a.b, b.b)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

function hexToRgba(value: string, alpha: number): string {
  const color = hexToRgb(value);
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${clampPreferenceNumber(alpha, 0, 1, 0.24)})`;
}

function readableTextColor(background: string): string {
  const { r, g, b } = hexToRgb(background);
  const luminance = [r, g, b]
    .map((channel) => {
      const srgb = channel / 255;
      return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  return luminance > 0.48 ? "#101417" : "#ffffff";
}

export function normalizeGodotPreviewEndpoint(value: string) {
  const trimmed = String(value || "").trim();
  return (trimmed || godotPreviewDefaultEndpoint).replace(/\/+$/, "");
}

export function godotPreviewUrl(endpoint: string, path: string) {
  return `${normalizeGodotPreviewEndpoint(endpoint)}/${String(path || "").replace(/^\/+/, "")}`;
}

export function resolveGodotPreviewBridgeUrl(endpoint: string, path: string) {
  const resolved = path.startsWith("http") ? path : godotPreviewUrl(endpoint, path);
  if (typeof window === "undefined") return resolved;
  try {
    const url = new URL(resolved, window.location.origin);
    const payloadUrl = url.searchParams.get("editor_preview_payload");
    if (payloadUrl) {
      url.searchParams.set("editor_preview_payload", payloadUrl.startsWith("http") ? payloadUrl : godotPreviewUrl(endpoint, payloadUrl));
    }
    if (resolved.startsWith("http")) return url.toString();
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return resolved;
  }
}

export function bridgeErrorMessage(body: unknown, fallback: string) {
  const record = body && typeof body === "object" ? body as ResourceRecord : {};
  const error = record.error;
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const message = String((error as ResourceRecord).message || (error as ResourceRecord).detail || "").trim();
    if (message) return message;
  }
  const message = String(record.message || "").trim();
  return message || fallback;
}

function isLegacyLoopbackGodotPreviewEndpoint(value: string) {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    return ["127.0.0.1", "localhost", "::1", "[::1]"].includes(host) && godotPreviewLegacyLoopbackPorts.has(parsed.port || "80");
  } catch {
    return false;
  }
}
