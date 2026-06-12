import type { PointerPoint } from "../../editorTypes";
import { normalizeBooleanFlag, round4Number } from "../../lib/numeric";
import { normalizeJsonObject } from "../../lib/records";
import type { ResourceRecord } from "../../types";
import { getResourceChapterScopeIds } from "../resources/resourceScope";
import { normalizeLive2dForSave } from "./live2dModel";
import {
  getPortraitCenterPoint,
  getProfileOffset,
  getProfileZoom,
  getSpectrumOffset,
  isDefaultPortraitCenterPoint,
  profileZoomDefault
} from "./portraitModel";

export function normalizeCharacterDraftForSave(character: ResourceRecord): ResourceRecord {
  const chapters = getResourceChapterScopeIds(character);
  const live2d = normalizeLive2dForSave(character.live2d);
  const next: ResourceRecord = {
    ...character,
    display_name: String(character.display_name || character.id || "").trim(),
    description: String(character.description || ""),
    name_color: String(character.name_color || "#ffffff").trim() || "#ffffff",
    protagonist: normalizeBooleanFlag(character.protagonist ?? character.is_protagonist ?? character.main_character),
    portraits: normalizeCharacterPortraitsForSave(character.portraits),
    metadata: normalizeJsonObject(character.metadata)
  };
  if (live2d !== null) next.live2d = live2d;
  else delete next.live2d;
  delete next.is_protagonist;
  delete next.main_character;
  if (chapters.length > 0) next.chapters = chapters;
  else delete next.chapters;
  delete next.chapter_ids;
  const spectrumOffset = getSpectrumOffset(character.spectrum_offset);
  if (Math.abs(spectrumOffset.x) >= 0.0001 || Math.abs(spectrumOffset.y) >= 0.0001) {
    next.spectrum_offset = [round4Number(spectrumOffset.x), round4Number(spectrumOffset.y)];
  } else {
    delete next.spectrum_offset;
  }
  return next;
}

function normalizeCharacterPortraitsForSave(value: unknown) {
  const portraits = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, ResourceRecord | string>
    : {};
  const next: Record<string, ResourceRecord | string> = {};
  for (const [key, portrait] of Object.entries(portraits)) {
    const cleanKey = String(key || "").trim();
    if (!cleanKey) continue;
    const normalized = normalizeCharacterPortraitForSave(portrait);
    if (normalized !== null) next[cleanKey] = normalized;
  }
  return next;
}

function normalizeCharacterPortraitForSave(value: ResourceRecord | string) {
  if (typeof value === "string") return value.trim() || null;
  if (!value || typeof value !== "object") return null;
  const path = String(value.path || "").trim();
  if (!path) return null;
  const center = getPortraitCenterPoint(value.center);
  const profile = normalizePortraitProfileForSave(value.profile, center);
  if (isDefaultPortraitCenterPoint(center) && profile === null) return path;
  const next: ResourceRecord = { path };
  if (!isDefaultPortraitCenterPoint(center)) next.center = [round4Number(center.x), round4Number(center.y)];
  if (profile !== null) next.profile = profile;
  return next;
}

function normalizePortraitProfileForSave(value: unknown, _fallbackCenter: PointerPoint) {
  const profile = value && typeof value === "object" ? value as ResourceRecord : {};
  const zoom = getProfileZoom(profile.zoom);
  const offset = getProfileOffset(profile);
  const next: ResourceRecord = {};
  if (Math.abs(zoom - profileZoomDefault) >= 0.001) next.zoom = zoom;
  if (Math.abs(offset.x) >= 0.0001 || Math.abs(offset.y) >= 0.0001) {
    next.offset = [round4Number(offset.x), round4Number(offset.y)];
  }
  return Object.keys(next).length > 0 ? next : null;
}
