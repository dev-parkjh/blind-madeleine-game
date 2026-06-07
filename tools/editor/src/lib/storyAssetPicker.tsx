import { useEffect, useMemo, useState } from "react";
import { loadResource } from "./api";
import { insertDialogueTextAtTarget } from "./dialogueTextContextMenu";
import { normalizeKind } from "./resourceConfig";
import type { ResourceSummary } from "../types";
import type { DialogueTextContextTarget } from "./dialogueTextContextMenu";

export type StoryAssetPickerAction = {
  label: string;
  hint: string;
  kind?: "sfx" | "bgm" | "background";
  tag?: "sfx" | "bgm" | "bg";
  insert?: string;
  fallback?: string;
};

export type StoryAssetCatalogEntry = {
  id: string;
  kind: string;
  displayName: string;
  path: string;
  chapterIds: string[];
};

export type StoryAssetPickerState = {
  action: StoryAssetPickerAction;
  target: DialogueTextContextTarget;
};

const storyAssetKindLabels: Record<string, string> = {
  bgm: "BGM",
  sfx: "SFX",
  background: "배경"
};

function resourceChapterIds(resource: ResourceSummary) {
  return Array.isArray(resource.chapterIds)
    ? resource.chapterIds.map((id) => String(id || "").trim()).filter(Boolean)
    : [];
}

function parseStoryAssetSubtitle(subtitle: string) {
  const separator = " · ";
  const index = subtitle.indexOf(separator);
  if (index < 0) return { kind: subtitle.trim(), path: "" };
  return {
    kind: subtitle.slice(0, index).trim(),
    path: subtitle.slice(index + separator.length).trim()
  };
}

export function normalizeStoryAssetKind(kind: unknown) {
  const clean = String(kind || "").trim().toLowerCase();
  if (["bgm", "music", "background_music"].includes(clean)) return "bgm";
  if (["bg", "image", "background", "background_image"].includes(clean)) return "background";
  return "sfx";
}

export function buildStoryAssetEventTag(action: StoryAssetPickerAction, asset: StoryAssetCatalogEntry) {
  const tag = action.tag || "sfx";
  const id = String(asset.id || "").trim();
  const path = String(asset.path || "").trim();
  const target = id ? `id="${id}"` : `path="${path || "res://assets/story_assets/sfx/effect.wav"}"`;
  if (tag === "bgm") return `[bgm ${target} fade=0.5]`;
  if (tag === "bg") {
    return `[bg ${target} transition=fade duration=0.5 opacity=1 blur=3 brightness=0.75 saturate=0.8 dim=0.15]`;
  }
  return `[sfx ${target}]`;
}

export function isStoryAssetAvailableForChapters(asset: StoryAssetCatalogEntry, activeChapterIds: string[]) {
  if (activeChapterIds.length === 0) return true;
  if (asset.chapterIds.length === 0) return true;
  return asset.chapterIds.some((id) => activeChapterIds.includes(id));
}

export async function loadStoryAssetCatalog(summaries: ResourceSummary[]): Promise<StoryAssetCatalogEntry[]> {
  const entries = await Promise.all(summaries.map(async (summary) => {
    try {
      const body = await loadResource("story_assets", summary.id);
      const data = body.data;
      return {
        id: summary.id,
        kind: normalizeStoryAssetKind(data.kind || summary.subtitle),
        displayName: String(data.display_name || data.name || summary.title || summary.id).trim(),
        path: String(data.path || "").trim(),
        chapterIds: resourceChapterIds(summary)
      } satisfies StoryAssetCatalogEntry;
    } catch {
      const parsed = parseStoryAssetSubtitle(String(summary.subtitle || ""));
      return {
        id: summary.id,
        kind: normalizeStoryAssetKind(parsed.kind || "sfx"),
        displayName: String(summary.title || summary.id).trim(),
        path: parsed.path,
        chapterIds: resourceChapterIds(summary)
      } satisfies StoryAssetCatalogEntry;
    }
  }));
  return entries.sort((a, b) => `${a.kind}:${a.displayName}`.localeCompare(`${b.kind}:${b.displayName}`));
}

function getChapterScopeLabel(chapterIds: string[], chapters: ResourceSummary[]) {
  if (chapterIds.length === 0) return "전 챕터";
  const labels = chapterIds.map((id) => chapters.find((chapter) => chapter.id === id)?.title || id);
  return labels.join(", ");
}

export function StoryAssetPickerOverlay({
  picker,
  storyAssetSummaries,
  chapters,
  activeChapterIds,
  onClose,
  onOpenStoryAssetsEditor
}: {
  picker: StoryAssetPickerState;
  storyAssetSummaries: ResourceSummary[];
  chapters: ResourceSummary[];
  activeChapterIds: string[];
  onClose: () => void;
  onOpenStoryAssetsEditor?: () => void;
}) {
  const { action, target } = picker;
  const [catalog, setCatalog] = useState<StoryAssetCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    void loadStoryAssetCatalog(storyAssetSummaries)
      .then((entries) => {
        if (cancelled) return;
        setCatalog(entries);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : String(loadError || "에셋 로드 실패"));
        setCatalog([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [storyAssetSummaries]);

  useEffect(() => {
    const closeFromKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeFromKey);
    return () => window.removeEventListener("keydown", closeFromKey);
  }, [onClose]);

  const assets = useMemo(() => {
    const normalizedKind = normalizeStoryAssetKind(action.kind);
    return catalog
      .filter((asset) => normalizeStoryAssetKind(asset.kind) === normalizedKind)
      .filter((asset) => isStoryAssetAvailableForChapters(asset, activeChapterIds));
  }, [action.kind, activeChapterIds, catalog]);

  const kindLabel = storyAssetKindLabels[normalizeStoryAssetKind(action.kind)] || action.kind || "에셋";

  function insertTag(tag: string) {
    insertDialogueTextAtTarget(target, tag);
    onClose();
  }

  function insertFallbackTemplate() {
    insertTag(action.fallback || action.insert || "");
  }

  return (
    <div
      className="asset-picker-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-asset-picker-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="asset-picker" onMouseDown={(event) => event.stopPropagation()}>
        <div className="asset-picker-header">
          <div className="asset-picker-title" id="story-asset-picker-title">
            {action.label} · {kindLabel} 선택
          </div>
          {onOpenStoryAssetsEditor && (
            <button className="asset-picker-action" type="button" onClick={onOpenStoryAssetsEditor}>
              스토리 에셋
            </button>
          )}
          <button className="asset-picker-action" type="button" onClick={onClose}>
            닫기
          </button>
        </div>
        <div className="asset-picker-list">
          {loading && <div className="asset-picker-empty">에셋 목록을 불러오는 중...</div>}
          {!loading && error && <div className="asset-picker-empty">{error}</div>}
          {!loading && !error && assets.length === 0 && (
            <div className="asset-picker-empty">
              등록된 {kindLabel} 에셋이 없습니다.
              <br />
              스토리 에셋 탭에서 먼저 등록하거나 직접 경로 템플릿을 삽입하세요.
            </div>
          )}
          {!loading && !error && assets.map((asset) => (
            <button
              className="asset-picker-item"
              key={asset.id}
              type="button"
              onClick={() => insertTag(buildStoryAssetEventTag(action, asset))}
            >
              <span className="asset-picker-kind">
                {storyAssetKindLabels[normalizeStoryAssetKind(asset.kind)] || asset.kind}
              </span>
              <span>
                <span className="asset-picker-name">{asset.displayName || "(이름 없음)"}</span>
                <span className="asset-picker-id">
                  {asset.id}
                  {asset.chapterIds.length > 0 ? ` · ${getChapterScopeLabel(asset.chapterIds, chapters)}` : ""}
                </span>
              </span>
              <span className="asset-picker-path">{asset.path || "경로 없음"}</span>
            </button>
          ))}
        </div>
        <div className="asset-picker-footer">
          <button className="asset-picker-action" type="button" onClick={insertFallbackTemplate}>
            직접 경로 템플릿
          </button>
        </div>
      </div>
    </div>
  );
}
