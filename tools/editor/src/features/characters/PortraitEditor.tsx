import { useEffect, useState } from "react";
import { Icon, NumberField, TextField, UploadField } from "../../components/EditorControls";
import { useUiText } from "../../editorText";
import { getEditorHealth, loadResource } from "../../lib/api";
import { fileExtension, safeSegment } from "../../lib/files";
import { normalizeLive2dPoseTags } from "../../lib/live2dPoseTags";
import { asArray } from "../../lib/resourceConfig";
import { resPathToAssetUrl } from "../../lib/resourcePaths";
import type { ResourceRecord } from "../../types";
import {
  canonicalJson,
  getLive2dSyncChange,
  mergeLive2dMetadata,
  mergeLive2dPortraitExports
} from "./live2dPortraitSync";
import { PortraitCenterEditor } from "./PortraitCenterEditor";
import { ProfileCropEditor } from "./ProfileCropEditor";
import {
  getPortraitCenterPoint,
  getProfileOffset,
  getProfileZoom,
  portraitRecordForEditor,
  profileZoomDefault,
  profileZoomMax,
  profileZoomMin,
  profileZoomStep,
  withProfileOffset,
  withProfileZoom
} from "./portraitModel";

export function PortraitEditor({
  disabled,
  draft,
  replaceDraft,
  updateField,
  uploadFile
}: {
  disabled: boolean;
  draft: ResourceRecord;
  replaceDraft: (nextDraft: ResourceRecord) => void;
  updateField: (field: string, value: unknown) => void;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
}) {
  const ui = useUiText();
  const portraits = draft.portraits && typeof draft.portraits === "object" ? draft.portraits as Record<string, ResourceRecord | string> : {};
  const entries = Object.entries(portraits);
  const live2dMotionSummary = buildLive2dMotionSummary(entries, draft.metadata);
  const live2dSourceSummary = buildLive2dSourceSummary(draft.metadata);
  const live2dRuntimeReadinessSummary = buildLive2dRuntimeReadinessSummary(draft.metadata);
  const live2dDialogueMotionSummary = buildLive2dDialogueMotionSummary(draft.metadata);
  const live2dAdaptiveTuningSummary = buildLive2dAdaptiveTuningSummary(draft.metadata);
  const live2dExpressionSummary = buildLive2dExpressionSummary(draft.metadata);
  const live2dBindingSummary = buildLive2dBindingSummary(draft.metadata);
  const live2dHitAreaSummary = buildLive2dHitAreaSummary(draft.metadata);
  const live2dMetadataPortraits = collectLive2dMetadataPortraits(draft.metadata);
  const [previewClipId, setPreviewClipId] = useState("");
  const [syncStatus, setSyncStatus] = useState("");
  const [syncingLive2d, setSyncingLive2d] = useState(false);
  const activePreviewClip = live2dMotionSummary.find((item) => item.clipId === previewClipId) || live2dMotionSummary[0] || null;
  const live2dSyncSignature = canonicalJson({
    portraits,
    live2d_web_model: live2dSourceFromMetadata(draft.metadata)
  });

  useEffect(() => {
    if (live2dMotionSummary.length === 0) {
      if (previewClipId) setPreviewClipId("");
      return;
    }
    if (!live2dMotionSummary.some((item) => item.clipId === previewClipId)) {
      setPreviewClipId(live2dMotionSummary[0].clipId);
    }
  }, [live2dMotionSummary, previewClipId]);

  useEffect(() => {
    const characterId = String(draft.id || "").trim();
    setSyncStatus("");
    if (!characterId) return undefined;
    let cancelled = false;

    const refreshLive2dSyncStatus = async () => {
      try {
        const result = await loadResource("characters", characterId);
        if (cancelled) return;
        const syncChange = getLive2dSyncChange(draft, result.data);
        if (syncChange.portraitCount > 0 || syncChange.removedPortraitCount > 0 || syncChange.metadataChanged) {
          setSyncStatus(formatLive2dSyncAvailableStatus(syncChange));
        }
      } catch {
        // The explicit sync action reports load errors; the passive hint stays quiet.
      }
    };
    void refreshLive2dSyncStatus();
    window.addEventListener("focus", refreshLive2dSyncStatus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refreshLive2dSyncStatus);
    };
  }, [draft.id, live2dSyncSignature]);

  function setPortraits(next: Record<string, ResourceRecord | string>) {
    updateField("portraits", next);
  }

  function renamePortrait(oldKey: string, nextKey: string) {
    const clean = safeSegment(nextKey || oldKey, "default");
    if (clean === oldKey) return;
    const next: Record<string, ResourceRecord | string> = {};
    for (const [key, value] of entries) {
      if (key === oldKey) {
        if (Object.prototype.hasOwnProperty.call(next, clean)) continue;
        next[clean] = value;
      } else if (!Object.prototype.hasOwnProperty.call(next, key)) {
        next[key] = value;
      }
    }
    setPortraits(next);
  }

  function updatePortrait(key: string, patch: ResourceRecord) {
    setPortraits({ ...portraits, [key]: { ...portraitRecordForEditor(portraits[key]), ...patch } });
  }

  function removePortrait(key: string) {
    const next = { ...portraits };
    delete next[key];
    setPortraits(next);
  }

  async function syncLive2dExports() {
    const characterId = String(draft.id || "").trim();
    if (syncingLive2d) return;
    setSyncingLive2d(true);
    setSyncStatus("Live2D 내보내기 확인 중...");
    const localSynced = mergeLive2dPortraitExports(portraits, {}, draft.metadata);
    try {
      if (!characterId) {
        if (localSynced.count > 0 || localSynced.removedCount > 0) {
          replaceDraft({
            ...draft,
            portraits: localSynced.portraits
          });
          setSyncStatus(formatLive2dSyncAppliedStatus(localSynced.count, localSynced.removedCount, false, "metadata"));
        } else {
          setSyncStatus("동기화할 Live2D 초상이 없습니다");
        }
        return;
      }
      const result = await loadResource("characters", characterId);
      const synced = mergeLive2dPortraitExports(portraits, result.data?.portraits, result.data?.metadata);
      const syncedMetadata = mergeLive2dMetadata(draft.metadata, result.data?.metadata);
      if (synced.count > 0 || synced.removedCount > 0 || syncedMetadata) {
        replaceDraft({
          ...draft,
          ...(synced.count > 0 || synced.removedCount > 0 ? { portraits: synced.portraits } : {}),
          ...(syncedMetadata ? { metadata: syncedMetadata } : {})
        });
      }
      if (synced.count > 0 || synced.removedCount > 0) {
        setSyncStatus(formatLive2dSyncAppliedStatus(synced.count, synced.removedCount, Boolean(syncedMetadata)));
      } else if (syncedMetadata) {
        setSyncStatus("Live2D source 정보 동기화됨");
      } else {
        setSyncStatus("동기화할 Live2D 초상이 없습니다");
      }
    } catch (error) {
      if (localSynced.count > 0 || localSynced.removedCount > 0) {
        replaceDraft({
          ...draft,
          portraits: localSynced.portraits
        });
        setSyncStatus(formatLive2dSyncAppliedStatus(localSynced.count, localSynced.removedCount, false, "metadata"));
      } else {
        setSyncStatus(error instanceof Error ? error.message : "Live2D 동기화 실패");
      }
    } finally {
      setSyncingLive2d(false);
    }
  }

  return (
    <div className="wide structured-editor portrait-editor">
      <div className="structured-header">
        <span>{ui.form.portraits}</span>
        <button disabled={disabled || syncingLive2d} type="button" onClick={() => void syncLive2dExports()}>
          <Icon name="Sync" />{ui.form.live2dSyncExports}
        </button>
      </div>
      {syncStatus && <p className="portrait-sync-status">{syncStatus}</p>}
      {live2dSourceSummary && (
        <div className="portrait-live2d-source-summary">
          <strong>Live2D source</strong>
          <span>{live2dSourceSummary}</span>
        </div>
      )}
      {live2dRuntimeReadinessSummary && (
        <div className={`portrait-live2d-runtime-summary ${live2dRuntimeReadinessSummary.ready ? "ready" : "incomplete"}`}>
          <strong>Game runtime</strong>
          <span>{live2dRuntimeReadinessSummary.ready ? "rig ready" : "needs rig export"}</span>
          <span>{live2dRuntimeReadinessSummary.dialogueReady ? "dialogue ready" : "dialogue frames incomplete"}</span>
          {live2dRuntimeReadinessSummary.adaptivePoseReady && <span>adaptive pose</span>}
          {live2dRuntimeReadinessSummary.interactionReady && (
            <span>
              {live2dRuntimeReadinessSummary.hitAreaCount > 0
                ? `${live2dRuntimeReadinessSummary.hitAreaCount} hit areas`
                : "interaction ready"}
            </span>
          )}
          {live2dRuntimeReadinessSummary.expectedFrameCount > 0 && (
            <span>{live2dRuntimeReadinessSummary.exportedFrameCount}/{live2dRuntimeReadinessSummary.expectedFrameCount} frames</span>
          )}
          {live2dRuntimeReadinessSummary.parameterBindingCount > 0 && (
            <span>{live2dRuntimeReadinessSummary.parameterBindingCount} bindings</span>
          )}
          {live2dRuntimeReadinessSummary.semanticParameterCount > 0 && (
            <span>{live2dRuntimeReadinessSummary.semanticParameterCount}/{live2dRuntimeReadinessSummary.parameterRoleCount} semantic roles</span>
          )}
          {live2dRuntimeReadinessSummary.poseTagCount > 0 && (
            <span>{live2dRuntimeReadinessSummary.poseTagCount} pose tags</span>
          )}
          {live2dRuntimeReadinessSummary.incompleteMotionFrameSets.length > 0 && (
            <span title={live2dRuntimeReadinessSummary.incompleteMotionFrameSets.map((entry) => `${entry.clipId} ${entry.frameCount}/${entry.expectedFrameCount}`).join(", ")}>
              incomplete: {live2dRuntimeReadinessSummary.incompleteMotionFrameSets.slice(0, 3).map((entry) => `${entry.clipId} ${entry.frameCount}/${entry.expectedFrameCount}`).join(", ")}
              {live2dRuntimeReadinessSummary.incompleteMotionFrameSets.length > 3 ? ", ..." : ""}
            </span>
          )}
          {live2dRuntimeReadinessSummary.missing.length > 0 && (
            <span title={live2dRuntimeReadinessSummary.missing.join(", ")}>
              missing: {live2dRuntimeReadinessSummary.missing.slice(0, 3).join(", ")}
              {live2dRuntimeReadinessSummary.missing.length > 3 ? ", ..." : ""}
            </span>
          )}
          {live2dRuntimeReadinessSummary.missingDialogue.length > 0 && (
            <span title={live2dRuntimeReadinessSummary.missingDialogue.join(", ")}>
              dialogue missing: {live2dRuntimeReadinessSummary.missingDialogue.slice(0, 3).join(", ")}
              {live2dRuntimeReadinessSummary.missingDialogue.length > 3 ? ", ..." : ""}
            </span>
          )}
        </div>
      )}
      {live2dDialogueMotionSummary && (
        <div className={`portrait-live2d-dialogue-summary ${live2dDialogueMotionSummary.ready ? "ready" : "incomplete"}`}>
          <strong>Dialogue motion</strong>
          <span>{live2dDialogueMotionSummary.ready ? "defaults ready" : "defaults incomplete"}</span>
          {live2dDialogueMotionSummary.adaptiveClipId && <span>adaptive: {live2dDialogueMotionSummary.adaptiveClipId}</span>}
          {live2dDialogueMotionSummary.idleClipId && <span>idle: {live2dDialogueMotionSummary.idleClipId}</span>}
          {live2dDialogueMotionSummary.talkClipId && <span>talk: {live2dDialogueMotionSummary.talkClipId}</span>}
          {live2dDialogueMotionSummary.visemeClipId && <span>viseme: {live2dDialogueMotionSummary.visemeClipId}</span>}
          {live2dDialogueMotionSummary.expectedFrameCount > 0 && (
            <span>{live2dDialogueMotionSummary.exportedFrameCount}/{live2dDialogueMotionSummary.expectedFrameCount} frames</span>
          )}
          {live2dDialogueMotionSummary.missingExportedClipIds.length > 0 && (
            <span title={live2dDialogueMotionSummary.missingExportedClipIds.join(", ")}>
              missing export: {live2dDialogueMotionSummary.missingExportedClipIds.slice(0, 3).join(", ")}
              {live2dDialogueMotionSummary.missingExportedClipIds.length > 3 ? ", ..." : ""}
            </span>
          )}
        </div>
      )}
      {live2dAdaptiveTuningSummary && (
        <div className="portrait-live2d-adaptive-summary">
          <strong>Adaptive tuning</strong>
          <span>energy {live2dAdaptiveTuningSummary.intensity.toFixed(2)}x</span>
          <span>{live2dAdaptiveTuningSummary.enabledCount} enabled · {live2dAdaptiveTuningSummary.disabledCount} disabled</span>
          {live2dAdaptiveTuningSummary.disabledParameters.length > 0 && (
            <span title={live2dAdaptiveTuningSummary.disabledParameters.join(", ")}>
              off: {live2dAdaptiveTuningSummary.disabledParameters.slice(0, 4).join(", ")}
              {live2dAdaptiveTuningSummary.disabledParameters.length > 4 ? ", ..." : ""}
            </span>
          )}
        </div>
      )}
      {live2dExpressionSummary && (
        <div className="portrait-live2d-adaptive-summary">
          <strong>Expression presets</strong>
          <span>{live2dExpressionSummary.count} presets</span>
          {live2dExpressionSummary.autoCount > 0 && <span>{live2dExpressionSummary.autoCount} auto</span>}
          {live2dExpressionSummary.poseTags.length > 0 && (
            <span title={live2dExpressionSummary.poseTags.join(", ")}>
              tags: {live2dExpressionSummary.poseTags.slice(0, 5).join(", ")}
              {live2dExpressionSummary.poseTags.length > 5 ? ", ..." : ""}
            </span>
          )}
          {live2dExpressionSummary.names.length > 0 && (
            <span title={live2dExpressionSummary.names.join(", ")}>
              {live2dExpressionSummary.names.slice(0, 4).join(", ")}
              {live2dExpressionSummary.names.length > 4 ? ", ..." : ""}
            </span>
          )}
        </div>
      )}
      {live2dBindingSummary.length > 0 && (
        <div className="portrait-live2d-binding-summary">
          <strong>Rig bindings</strong>
          <div>
            {live2dBindingSummary.map((binding) => (
              <span key={binding.parameter} title={binding.detail}>
                {binding.label} · {binding.role} · {binding.count}
              </span>
            ))}
          </div>
        </div>
      )}
      {live2dHitAreaSummary.length > 0 && (
        <div className="portrait-live2d-hit-area-summary">
          <strong>Hit areas</strong>
          <div>
            {live2dHitAreaSummary.map((area) => (
              <span className={area.hasGeometry ? "ready" : ""} key={area.id} title={area.detail}>
                {area.label} · {area.kind}{area.hasGeometry ? " · geo" : ""}
              </span>
            ))}
          </div>
        </div>
      )}
      {entries.length === 0 && <p className="empty-state">{ui.form.noPortraits}</p>}
      {live2dMotionSummary.length > 0 && (
        <div className="portrait-live2d-summary">
          <strong>Live2D 모션 세트</strong>
          <div>
            {live2dMotionSummary.map((item) => (
              <button
                className={activePreviewClip?.clipId === item.clipId ? "active" : ""}
                key={item.clipId}
                title={item.clipId}
                type="button"
                onClick={() => setPreviewClipId(item.clipId)}
              >
                {item.label} · {item.count}f · {item.duration.toFixed(2)}s
              </button>
            ))}
          </div>
        </div>
      )}
      {activePreviewClip && <Live2dMotionFramePreview clip={activePreviewClip} />}
      {entries.map(([key, portrait], index) => (
        <PortraitRowEditor
          characterId={String(draft.id || "character")}
          disabled={disabled}
          key={`portrait-row-${index}`}
          onRemove={() => removePortrait(key)}
          onRename={(nextKey) => renamePortrait(key, nextKey)}
          onUpdate={(patch) => updatePortrait(key, patch)}
          live2dMetadataPortrait={live2dMetadataPortraits[key]}
          portrait={portrait}
          portraitKey={key}
          uploadFile={uploadFile}
        />
      ))}
    </div>
  );
}

function PortraitRowEditor({
  characterId,
  disabled,
  live2dMetadataPortrait,
  onRemove,
  onRename,
  onUpdate,
  portrait,
  portraitKey,
  uploadFile
}: {
  characterId: string;
  disabled: boolean;
  live2dMetadataPortrait?: ResourceRecord;
  onRemove: () => void;
  onRename: (nextKey: string) => void;
  onUpdate: (patch: ResourceRecord) => void;
  portrait: ResourceRecord | string;
  portraitKey: string;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
}) {
  const ui = useUiText();
  const [draftKey, setDraftKey] = useState(portraitKey);
  const portraitRecord = portraitRecordForEditor(portrait);
  const portraitPath = String(portraitRecord.path ?? portraitRecord.image_path ?? portraitRecord.imagePath ?? "");
  const metadataPath = String(live2dMetadataPortrait?.image_path ?? live2dMetadataPortrait?.imagePath ?? live2dMetadataPortrait?.path ?? "");
  const canUseLive2dMetadata = Boolean(portraitPath && metadataPath && portraitPath === metadataPath);
  const metadataProfile = canUseLive2dMetadata && live2dMetadataPortrait?.profile && typeof live2dMetadataPortrait.profile === "object" && !Array.isArray(live2dMetadataPortrait.profile)
    ? live2dMetadataPortrait.profile as ResourceRecord
    : {};
  const center = asArray<number>(portraitRecord.center);
  const metadataCenter = canUseLive2dMetadata ? asArray<number>(live2dMetadataPortrait?.center) : [];
  const effectiveCenter = center.length >= 2 ? center : metadataCenter;
  const profile = portraitRecord.profile && typeof portraitRecord.profile === "object" ? portraitRecord.profile as ResourceRecord : metadataProfile;
  const profileOffset = getProfileOffset(profile);
  const centerPoint = getPortraitCenterPoint(effectiveCenter);
  const live2dModelPath = String(
    portraitRecord.live2d_model
    ?? portraitRecord.live2dModel
    ?? portraitRecord.model_path
    ?? portraitRecord.modelPath
    ?? (canUseLive2dMetadata
      ? live2dMetadataPortrait?.model_path
        ?? live2dMetadataPortrait?.modelPath
        ?? live2dMetadataPortrait?.live2d_model
        ?? live2dMetadataPortrait?.live2dModel
        ?? ""
      : "")
  );
  const generatedBy = String(portraitRecord.generated_by ?? portraitRecord.generatedBy ?? "");
  const portraitMotionFrame = live2dMotionFrameFromPortraitLike(portraitRecord);
  const metadataMotionFrame = canUseLive2dMetadata && live2dMetadataPortrait
    ? live2dMotionFrameFromPortraitLike(live2dMetadataPortrait)
    : null;
  const motionFrame = portraitMotionFrame || metadataMotionFrame;
  const motionFrameClipId = String(motionFrame?.clip_id ?? motionFrame?.clipId ?? "").trim();
  const motionFrameClipLabel = String(motionFrame?.clip_label ?? motionFrame?.clipLabel ?? motionFrame?.label ?? motionFrameClipId).trim() || motionFrameClipId;
  const hasLive2dSource = Boolean(live2dModelPath || generatedBy === "tools/live2d-editor" || metadataMotionFrame);

  useEffect(() => {
    setDraftKey(portraitKey);
  }, [portraitKey]);

  function commitPortraitKey() {
    const clean = safeSegment(draftKey || portraitKey, "default");
    setDraftKey(clean);
    if (clean !== portraitKey) onRename(clean);
  }

  return (
    <article className="structured-row portrait-row">
      <div className="portrait-entry-fields">
        <TextField
          label={ui.form.key}
          value={draftKey}
          onBlur={commitPortraitKey}
          onChange={setDraftKey}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
        <TextField label={ui.form.path} value={portraitPath} onChange={(value) => onUpdate({ path: value })} />
        <UploadField
          disabled={disabled}
          label={ui.form.uploadPortrait}
          accept="image/png,image/jpeg,image/webp,image/gif"
          onUpload={async (file) => {
            const path = await uploadFile(`assets/characters/${safeSegment(characterId)}/${safeSegment(portraitKey)}.${fileExtension(file)}`, file);
            onUpdate({ path });
            return path;
          }}
        />
        <div className={`portrait-rig-strip ${hasLive2dSource ? "linked" : ""}`}>
          <TextField label="Live2D rig" value={live2dModelPath} onChange={(value) => onUpdate({ live2d_model: value })} />
          <button
            className="portrait-rig-action"
            type="button"
            onClick={() => openLive2dEditor(characterId, portraitKey)}
          >
            <Icon name="OpenInNew" />Live2D 편집
          </button>
          {hasLive2dSource && <span className="portrait-rig-badge">web rig 연결됨</span>}
          {motionFrameClipId && (
            <span className="portrait-rig-badge motion">
              {motionFrameClipLabel} {formatMotionFrameTime(motionFrame?.time)}
            </span>
          )}
        </div>
      </div>
      <div className="portrait-visual-area">
        <PortraitCenterEditor
          label={ui.form.center}
          imagePath={portraitPath}
          x={centerPoint.x}
          y={centerPoint.y}
          onChange={(x, y) => onUpdate({ center: [x, y] })}
        />
        <ProfileCropEditor
          faceCenter={centerPoint}
          imagePath={portraitPath}
          profile={profile}
          onChangeProfile={(nextProfile) => onUpdate({ profile: nextProfile })}
        />
      </div>
      <div className="portrait-controls-panel">
        <NumberField label={ui.form.centerX} value={effectiveCenter[0] ?? 0.5} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => onUpdate({ center: [value, effectiveCenter[1] ?? 0.5] })} />
        <NumberField label={ui.form.centerY} value={effectiveCenter[1] ?? 0.5} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => onUpdate({ center: [effectiveCenter[0] ?? 0.5, value] })} />
        <NumberField label={ui.form.profileZoom} value={getProfileZoom(profile.zoom)} min={profileZoomMin} max={profileZoomMax} step={profileZoomStep} resetValue={profileZoomDefault} onChange={(value) => onUpdate({ profile: withProfileZoom(profile, value) })} />
        <NumberField label={ui.form.profileOffsetX} value={profileOffset.x} min={-1} max={1} step={0.01} resetValue={0} onChange={(value) => onUpdate({ profile: withProfileOffset(profile, { x: value, y: profileOffset.y }) })} />
        <NumberField label={ui.form.profileOffsetY} value={profileOffset.y} min={-1} max={1} step={0.01} resetValue={0} onChange={(value) => onUpdate({ profile: withProfileOffset(profile, { x: profileOffset.x, y: value }) })} />
        <button className="danger-action" disabled={disabled} type="button" onClick={onRemove}><Icon name="Delete" />{ui.common.delete}</button>
      </div>
    </article>
  );
}

async function openLive2dEditor(characterId: string, portraitKey: string) {
  const fallbackUrl = buildLive2dEditorUrl(characterId, portraitKey);
  const opened = window.open("about:blank", "blind-madeleine-live2d-editor");
  try {
    const health = await getEditorHealth();
    const url = buildLive2dEditorUrl(characterId, portraitKey, health.live2dEditorUrl);
    if (opened) opened.location.href = url;
    else window.open(url, "blind-madeleine-live2d-editor");
  } catch {
    if (opened) opened.location.href = fallbackUrl;
    else window.open(fallbackUrl, "blind-madeleine-live2d-editor");
  }
}

function buildLive2dEditorUrl(characterId: string, portraitKey: string, baseUrl = "http://127.0.0.1:5187/") {
  const url = new URL(baseUrl);
  url.searchParams.set("character", safeSegment(characterId, "character"));
  url.searchParams.set("portrait", safeSegment(portraitKey, "default"));
  return url.toString();
}

function formatMotionFrameTime(value: unknown) {
  const time = Number(value);
  return Number.isFinite(time) ? `@ ${time.toFixed(2)}s` : "";
}

function positiveMotionMetadataNumber(source: ResourceRecord | null | undefined, keys: string[]) {
  if (!source) return 0;
  for (const key of keys) {
    const value = Number(source[key]);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return 0;
}

function Live2dMotionFramePreview({ clip }: { clip: Live2dMotionSummary }) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    setFrameIndex(0);
  }, [clip.clipId]);

  useEffect(() => {
    if (clip.frames.length <= 1) return undefined;
    const frameMs = Math.max(80, Math.round((Math.max(clip.duration, 0.35) * 1000) / clip.frames.length));
    const timer = window.setInterval(() => {
      setFrameIndex((index) => (index + 1) % clip.frames.length);
    }, frameMs);
    return () => window.clearInterval(timer);
  }, [clip.clipId, clip.duration, clip.frames.length]);

  const frame = clip.frames[Math.min(frameIndex, clip.frames.length - 1)] || clip.frames[0];
  const imageUrl = resPathToAssetUrl(frame?.path);
  return (
    <div className="portrait-live2d-motion-preview">
      <div className="portrait-live2d-motion-frame">
        {imageUrl ? <img alt="" src={imageUrl} /> : <span>NO FRAME</span>}
      </div>
      <div className="portrait-live2d-motion-meta">
        <strong>{clip.label}</strong>
        <span>{clip.frames.length} frames · {formatMotionFrameTime(frame?.time)}</span>
        {frame?.poseTags.length > 0 && <span>{frame.poseTags.slice(0, 5).join(", ")}</span>}
        <div>
          {clip.frames.map((item, index) => (
            <button
              className={index === frameIndex ? "active" : ""}
              key={item.key}
              title={item.key}
              type="button"
              onClick={() => setFrameIndex(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

type Live2dMotionSummary = {
  clipId: string;
  label: string;
  count: number;
  duration: number;
  frames: Array<{ key: string; path: string; time: number; frameIndex: number; poseTags: string[] }>;
};

function buildLive2dMotionSummary(entries: Array<[string, ResourceRecord | string]>, metadataValue: unknown) {
  const clips = new Map<string, Live2dMotionSummary>();
  const portraits = new Map(entries);
  const addFrame = ({
    clipId,
    label,
    duration,
    frame
  }: {
    clipId: string;
    label: string;
    duration: number;
    frame: { key: string; path: string; time: number; frameIndex: number; poseTags: string[] };
  }) => {
    if (!clipId || !frame.key) return;
    const existing = clips.get(clipId) || {
      clipId,
      label: label || clipId,
      count: 0,
      duration: 0,
      frames: []
    };
    if (existing.frames.some((item) => item.key === frame.key)) {
      clips.set(clipId, existing);
      return;
    }
    existing.count += 1;
    existing.duration = Math.max(existing.duration, duration, frame.time);
    existing.frames.push(frame);
    clips.set(clipId, existing);
  };

  for (const [key, portrait] of entries) {
    if (!portrait || typeof portrait !== "object" || Array.isArray(portrait)) continue;
    const frame = live2dMotionFrameFromPortraitLike(portrait);
    const clipId = String(frame?.clip_id || frame?.clipId || "").trim();
    if (!clipId) continue;
    const time = Number(frame?.time);
    const clipDuration = positiveMotionMetadataNumber(frame, ["clip_duration", "clipDuration", "duration"]);
    addFrame({
      clipId,
      label: String(frame?.clip_label || frame?.clipLabel || frame?.label || clipId).trim() || clipId,
      duration: clipDuration,
      frame: {
        key,
        path: String(portrait.path ?? portrait.image_path ?? portrait.imagePath ?? ""),
        time: Number.isFinite(time) ? time : 0,
        frameIndex: Number(frame?.frame_index ?? frame?.frameIndex ?? 0) || 0,
        poseTags: normalizeLive2dPoseTags(frame?.pose_tags ?? frame?.poseTags)
      }
    });
  }

  for (const [key, portrait] of Object.entries(collectLive2dMetadataPortraits(metadataValue))) {
    if (!portrait || typeof portrait !== "object" || Array.isArray(portrait)) continue;
    const frame = live2dMotionFrameFromPortraitLike(portrait);
    const clipId = String(frame?.clip_id || frame?.clipId || "").trim();
    if (!clipId) continue;
    const existingPortrait = portraits.get(key);
    const existingPath = existingPortrait && typeof existingPortrait === "object" && !Array.isArray(existingPortrait)
      ? String(existingPortrait.path ?? existingPortrait.image_path ?? existingPortrait.imagePath ?? "")
      : "";
    const time = Number(frame?.time);
    const clipDuration = positiveMotionMetadataNumber(frame, ["clip_duration", "clipDuration", "duration"]);
    addFrame({
      clipId,
      label: String(frame?.clip_label || frame?.clipLabel || frame?.label || clipId).trim() || clipId,
      duration: clipDuration,
      frame: {
        key,
        path: existingPath || String(portrait.image_path || portrait.path || ""),
        time: Number.isFinite(time) ? time : 0,
        frameIndex: Number(frame?.frame_index ?? frame?.frameIndex ?? 0) || 0,
        poseTags: normalizeLive2dPoseTags(frame?.pose_tags ?? frame?.poseTags)
      }
    });
  }

  const metadataPortraits = collectLive2dMetadataPortraits(metadataValue);
  for (const frameSet of collectLive2dMotionFrameSetsFromMetadata(metadataValue)) {
    for (const state of frameSet.states) {
      const portrait = portraits.get(state.key);
      const metadataPortrait = metadataPortraits[state.key];
      const path = portrait && typeof portrait === "object" && !Array.isArray(portrait)
        ? String(portrait.path || state.path || metadataPortrait?.image_path || metadataPortrait?.path || "")
        : String(state.path || metadataPortrait?.image_path || metadataPortrait?.path || "");
      addFrame({
        clipId: frameSet.clipId,
        label: frameSet.label,
        duration: frameSet.duration,
        frame: {
          key: state.key,
          path,
          time: state.time,
          frameIndex: state.frameIndex,
          poseTags: state.poseTags
        }
      });
    }
  }
  return [...clips.values()]
    .map((clip) => ({
      ...clip,
      frames: clip.frames.sort((a, b) => a.frameIndex === b.frameIndex ? a.time - b.time : a.frameIndex - b.frameIndex)
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function collectLive2dMetadataPortraits(metadataValue: unknown): Record<string, ResourceRecord> {
  const source = live2dSourceFromMetadata(metadataValue) || {};
  return source.portraits && typeof source.portraits === "object" && !Array.isArray(source.portraits)
    ? source.portraits as Record<string, ResourceRecord>
    : {};
}

function live2dMotionFrameFromPortraitLike(portrait: ResourceRecord) {
  const frame = portrait.live2d_motion_frame ?? portrait.live2dMotionFrame ?? portrait.motion_frame ?? portrait.motionFrame;
  return frame && typeof frame === "object" && !Array.isArray(frame) ? frame as ResourceRecord : null;
}

function live2dArrayFrom(source: ResourceRecord | null | undefined, snakeKey: string, camelKey: string) {
  return [
    ...(Array.isArray(source?.[snakeKey]) ? source[snakeKey] as unknown[] : []),
    ...(Array.isArray(source?.[camelKey]) ? source[camelKey] as unknown[] : [])
  ].filter((entry): entry is ResourceRecord => Boolean(entry && typeof entry === "object" && !Array.isArray(entry)));
}

function live2dRecordFrom(source: ResourceRecord | null | undefined, snakeKey: string, camelKey: string) {
  const value = source?.[snakeKey] ?? source?.[camelKey];
  return value && typeof value === "object" && !Array.isArray(value) ? value as ResourceRecord : null;
}

function live2dSourceFromMetadata(metadataValue: unknown) {
  const metadata = metadataValue && typeof metadataValue === "object" && !Array.isArray(metadataValue)
    ? metadataValue as ResourceRecord
    : {};
  const source = metadata.live2d_web_model ?? metadata.live2dWebModel;
  return source && typeof source === "object" && !Array.isArray(source) ? source as ResourceRecord : null;
}

function collectLive2dMotionFrameSetsFromMetadata(metadataValue: unknown) {
  const source = live2dSourceFromMetadata(metadataValue);
  const sets = live2dArrayFrom(source, "motion_frame_sets", "motionFrameSets");
  return sets.flatMap((rawSet) => {
    if (!rawSet || typeof rawSet !== "object" || Array.isArray(rawSet)) return [];
    const frameSet = rawSet as ResourceRecord;
    const clipId = String(frameSet.clip_id || frameSet.clipId || "").trim();
    if (!clipId) return [];
    const states = Array.isArray(frameSet.states) ? frameSet.states : [];
    return [{
      clipId,
      label: String(frameSet.clip_label || frameSet.clipLabel || frameSet.label || clipId).trim() || clipId,
      duration: positiveMotionMetadataNumber(frameSet, ["clip_duration", "clipDuration", "duration"]),
      states: states.flatMap((rawState) => {
        if (!rawState || typeof rawState !== "object" || Array.isArray(rawState)) return [];
        const state = rawState as ResourceRecord;
        const frame = live2dMotionFrameFromPortraitLike(state);
        const key = String(state.state || state.key || "").trim();
        if (!key) return [];
        return [{
          key,
          path: String(state.image_path || state.imagePath || state.path || ""),
          time: Number(state.time) || 0,
          frameIndex: Number(state.frame_index ?? state.frameIndex ?? 0) || 0,
          poseTags: normalizeLive2dPoseTags(state.pose_tags ?? state.poseTags ?? frame?.pose_tags ?? frame?.poseTags)
        }];
      })
    }];
  });
}

function buildLive2dSourceSummary(metadataValue: unknown) {
  const source = live2dSourceFromMetadata(metadataValue);
  if (!source) return "";
  const motionFrameSets = live2dArrayFrom(source, "motion_frame_sets", "motionFrameSets");
  const parameterBindings = live2dArrayFrom(source, "parameter_bindings", "parameterBindings");
  const parameterRoles = live2dArrayFrom(source, "parameter_roles", "parameterRoles");
  const expressionPresets = live2dArrayFrom(source, "expression_presets", "expressionPresets");
  const hitAreas = live2dArrayFrom(source, "hit_areas", "hitAreas");

  const portraitCount = positiveSummaryNumber(source.portrait_count)
    || (source.portraits && typeof source.portraits === "object" && !Array.isArray(source.portraits) ? Object.keys(source.portraits).length : 0);
  const clipCount = positiveSummaryNumber(source.motion_clip_count)
    || (Array.isArray(source.clips) ? source.clips.length : 0);
  const frameSetCount = positiveSummaryNumber(source.motion_frame_set_count ?? source.motionFrameSetCount)
    || motionFrameSets.length;
  const exportedFrameCount = motionFrameSets.reduce((total, record) => {
    return total + (positiveSummaryNumber(record.frame_count) || (Array.isArray(record.states) ? record.states.length : 0));
  }, 0);
  const partCount = positiveSummaryNumber(source.image_part_count ?? source.part_count);
  const deformerGroupCount = positiveSummaryNumber(source.deformer_group_count);
  const autoDeformerGroupCount = positiveSummaryNumber(source.auto_deformer_group_count);
  const deformerParentCount = positiveSummaryNumber(source.deformer_parent_count);
  const warpDeformerCount = positiveSummaryNumber(source.warp_deformer_count);
  const visibilityGateCount = positiveSummaryNumber(source.visibility_gate_count);
  const lockedPartCount = positiveSummaryNumber(source.locked_part_count);
  const hitAreaCount = positiveSummaryNumber(source.hit_area_count ?? source.hitAreaCount)
    || hitAreas.length;
  const parameterCount = positiveSummaryNumber(source.parameter_count);
  const rigBindingCount = positiveSummaryNumber(source.rig_binding_count ?? source.rigBindingCount)
    || parameterBindings.length;
  const semanticParameterCount = positiveSummaryNumber(source.semantic_parameter_count ?? source.semanticParameterCount)
    || parameterRoles.filter((entry) => String(entry.role || "generic") !== "generic").length;
  const expressionPresetCount = positiveSummaryNumber(source.expression_preset_count ?? source.expressionPresetCount)
    || expressionPresets.length;
  const autoExpressionPresetCount = positiveSummaryNumber(source.auto_expression_preset_count);
  const adaptiveClip = String(source.adaptive_clip_id || source.adaptiveClipId || "").trim();
  const segments = [
    portraitCount > 0 ? `${portraitCount} portraits` : "",
    clipCount > 0 ? `${clipCount} clips` : "",
    frameSetCount > 0 ? `${frameSetCount} motion sets` : "",
    exportedFrameCount > 0 ? `${exportedFrameCount} motion frames` : "",
    partCount > 0 ? `${partCount} image parts` : "",
    deformerGroupCount > 0 ? `${deformerGroupCount} deformers` : "",
    autoDeformerGroupCount > 0 ? `${autoDeformerGroupCount} auto groups` : "",
    deformerParentCount > 0 ? `${deformerParentCount} nested` : "",
    warpDeformerCount > 0 ? `${warpDeformerCount} warps` : "",
    visibilityGateCount > 0 ? `${visibilityGateCount} visibility gates` : "",
    lockedPartCount > 0 ? `${lockedPartCount} locked parts` : "",
    hitAreaCount > 0 ? `${hitAreaCount} hit areas` : "",
    parameterCount > 0 ? `${parameterCount} params` : "",
    semanticParameterCount > 0 ? `${semanticParameterCount} semantic roles` : "",
    expressionPresetCount > 0 ? `${expressionPresetCount} expression presets` : "",
    autoExpressionPresetCount > 0 ? `${autoExpressionPresetCount} auto expressions` : "",
    rigBindingCount > 0 ? `${rigBindingCount} bindings` : "",
    adaptiveClip ? `adaptive: ${adaptiveClip}` : ""
  ].filter(Boolean);
  return segments.join(" · ");
}

function buildLive2dDialogueMotionSummary(metadataValue: unknown): Live2dDialogueMotionSummary | null {
  const source = live2dSourceFromMetadata(metadataValue);
  const motionSet = live2dRecordFrom(source, "dialogue_motion_set", "dialogueMotionSet");
  if (!motionSet) return null;
  const motionFrameSets = live2dArrayFrom(source, "motion_frame_sets", "motionFrameSets");

  const adaptiveClipId = String(motionSet.adaptive_clip_id || motionSet.adaptiveClipId || "").trim();
  const idleClipId = String(motionSet.idle_clip_id || motionSet.idleClipId || "").trim();
  const talkClipId = String(motionSet.talk_clip_id || motionSet.talkClipId || "").trim();
  const visemeClipId = String(motionSet.viseme_clip_id || motionSet.visemeClipId || "").trim();
  const fallbackExportedClipIds = motionFrameSets.flatMap((frameSet) => [String(frameSet.clip_id || frameSet.clipId || "").trim()].filter(Boolean));
  const exportedClipIds = stringListFromUnknown(motionSet.exported_clip_ids ?? motionSet.exportedClipIds);
  const effectiveExportedClipIds = exportedClipIds.length > 0 ? exportedClipIds : stringListFromUnknown(fallbackExportedClipIds);
  const completeClipIds = stringListFromUnknown(motionSet.complete_exported_clip_ids ?? motionSet.completeExportedClipIds);
  const hasCompleteClipMetadata = motionSet.complete_exported_clip_ids !== undefined
    || motionSet.completeExportedClipIds !== undefined
    || motionSet.incomplete_clip_ids !== undefined
    || motionSet.incompleteClipIds !== undefined;
  const fallbackCompleteClipIds = stringListFromUnknown(motionFrameSets.flatMap((frameSet) => {
    const states = Array.isArray(frameSet.states) ? frameSet.states : [];
    const frameCount = positiveSummaryNumber(frameSet.frame_count ?? frameSet.frameCount) || states.length;
    const expectedFrameCount = positiveSummaryNumber(frameSet.expected_frame_count ?? frameSet.expectedFrameCount)
      || positiveSummaryNumber(frameSet.frame_count ?? frameSet.frameCount)
      || states.length;
    const clipId = String(frameSet.clip_id || frameSet.clipId || "").trim();
    return frameCount > 0 && frameCount >= expectedFrameCount ? [clipId] : [];
  }));
  const effectiveCompleteClipIds = hasCompleteClipMetadata
    ? completeClipIds
    : (fallbackCompleteClipIds.length > 0 ? fallbackCompleteClipIds : effectiveExportedClipIds);
  const requiredClipIds = stringListFromUnknown([adaptiveClipId, idleClipId, talkClipId]);
  const missingExportedClipIds = requiredClipIds.filter((clipId) => !effectiveCompleteClipIds.includes(clipId));
  const fallbackExportedFrameCount = motionFrameSets.reduce((total, frameSet) => {
    const states = Array.isArray(frameSet.states) ? frameSet.states : [];
    return total + (positiveSummaryNumber(frameSet.frame_count ?? frameSet.frameCount) || states.length);
  }, 0);
  const fallbackExpectedFrameCount = motionFrameSets.reduce((total, frameSet) => {
    const states = Array.isArray(frameSet.states) ? frameSet.states : [];
    return total + (
      positiveSummaryNumber(frameSet.expected_frame_count ?? frameSet.expectedFrameCount)
      || positiveSummaryNumber(frameSet.frame_count ?? frameSet.frameCount)
      || states.length
    );
  }, 0);
  return {
    ready: Boolean(adaptiveClipId && idleClipId && talkClipId && missingExportedClipIds.length === 0),
    adaptiveClipId,
    idleClipId,
    talkClipId,
    visemeClipId,
    exportedFrameCount: positiveSummaryNumber(motionSet.exported_frame_count ?? motionSet.exportedFrameCount) || fallbackExportedFrameCount,
    expectedFrameCount: positiveSummaryNumber(motionSet.expected_frame_count ?? motionSet.expectedFrameCount) || fallbackExpectedFrameCount,
    missingExportedClipIds
  };
}

type Live2dBindingSummary = {
  parameter: string;
  label: string;
  role: string;
  count: number;
  detail: string;
};

type Live2dAdaptiveTuningSummary = {
  intensity: number;
  enabledCount: number;
  disabledCount: number;
  disabledParameters: string[];
};

type Live2dExpressionSummary = {
  count: number;
  autoCount: number;
  names: string[];
  poseTags: string[];
};

type Live2dHitAreaSummary = {
  id: string;
  label: string;
  kind: string;
  hasGeometry: boolean;
  detail: string;
};

type Live2dDialogueMotionSummary = {
  ready: boolean;
  adaptiveClipId: string;
  idleClipId: string;
  talkClipId: string;
  visemeClipId: string;
  exportedFrameCount: number;
  expectedFrameCount: number;
  missingExportedClipIds: string[];
};

type Live2dRuntimeReadinessSummary = {
  ready: boolean;
  dialogueReady: boolean;
  interactionReady: boolean;
  adaptivePoseReady: boolean;
  exportedFrameCount: number;
  expectedFrameCount: number;
  completeMotionFrameSetCount: number;
  poseTagCount: number;
  parameterRoleCount: number;
  semanticParameterCount: number;
  parameterBindingCount: number;
  hitAreaCount: number;
  missing: string[];
  missingDialogue: string[];
  incompleteMotionFrameSets: Array<{ clipId: string; frameCount: number; expectedFrameCount: number }>;
};

function buildLive2dRuntimeReadinessSummary(metadataValue: unknown): Live2dRuntimeReadinessSummary | null {
  const source = live2dSourceFromMetadata(metadataValue);
  const readiness = source?.runtime_readiness && typeof source.runtime_readiness === "object" && !Array.isArray(source.runtime_readiness)
    ? source.runtime_readiness as ResourceRecord
    : null;
  if (!readiness) return null;
  return {
    ready: readiness.ready === true,
    dialogueReady: readiness.dialogue_motion_ready === true || readiness.dialogueMotionReady === true,
    interactionReady: readiness.interaction_ready === true || readiness.interactionReady === true,
    adaptivePoseReady: readiness.adaptive_pose_ready === true || readiness.adaptivePoseReady === true,
    exportedFrameCount: positiveSummaryNumber(readiness.exported_frame_count ?? readiness.exportedFrameCount),
    expectedFrameCount: positiveSummaryNumber(readiness.expected_frame_count ?? readiness.expectedFrameCount),
    completeMotionFrameSetCount: positiveSummaryNumber(readiness.complete_motion_frame_set_count ?? readiness.completeMotionFrameSetCount),
    poseTagCount: positiveSummaryNumber(readiness.pose_tag_count ?? readiness.poseTagCount),
    parameterRoleCount: positiveSummaryNumber(readiness.parameter_role_count ?? readiness.parameterRoleCount),
    semanticParameterCount: positiveSummaryNumber(readiness.semantic_parameter_count ?? readiness.semanticParameterCount),
    parameterBindingCount: positiveSummaryNumber(readiness.parameter_binding_count ?? readiness.parameterBindingCount),
    hitAreaCount: positiveSummaryNumber(readiness.hit_area_count ?? readiness.hitAreaCount),
    missing: stringListFromUnknown(readiness.missing).slice(0, 32),
    missingDialogue: stringListFromUnknown(readiness.missing_dialogue_motion ?? readiness.missingDialogueMotion).slice(0, 32),
    incompleteMotionFrameSets: Array.isArray(readiness.incomplete_motion_frame_sets)
      ? readiness.incomplete_motion_frame_sets.flatMap((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
        const record = entry as ResourceRecord;
        const clipId = String(record.clip_id || record.clipId || "").trim();
        if (!clipId) return [];
        return [{
          clipId,
          frameCount: positiveSummaryNumber(record.frame_count ?? record.frameCount),
          expectedFrameCount: positiveSummaryNumber(record.expected_frame_count ?? record.expectedFrameCount)
        }];
      }).slice(0, 32)
      : []
  };
}

function buildLive2dExpressionSummary(metadataValue: unknown): Live2dExpressionSummary | null {
  const source = live2dSourceFromMetadata(metadataValue);
  if (!source) return null;
  const presets = live2dArrayFrom(source, "expression_presets", "expressionPresets");
  const count = positiveSummaryNumber(source.expression_preset_count ?? source.expressionPresetCount) || presets.length;
  if (count <= 0) return null;
  const autoCount = positiveSummaryNumber(source.auto_expression_preset_count)
    || presets.filter((preset) => preset.auto_generated === true || preset.autoGenerated === true).length;
  const names = presets
    .map((preset) => String(preset.label || preset.name || preset.id || "").trim())
    .filter(Boolean)
    .slice(0, 24);
  const poseTags = normalizeLive2dPoseTags(presets.flatMap((preset) => preset.pose_tags ?? preset.poseTags ?? []));
  return {
    count,
    autoCount,
    names,
    poseTags
  };
}

function buildLive2dAdaptiveTuningSummary(metadataValue: unknown): Live2dAdaptiveTuningSummary | null {
  const source = live2dSourceFromMetadata(metadataValue);
  const tuning = source?.adaptive_pose_tuning && typeof source.adaptive_pose_tuning === "object" && !Array.isArray(source.adaptive_pose_tuning)
    ? source.adaptive_pose_tuning as ResourceRecord
    : null;
  if (!tuning) return null;
  const disabledParameters = Array.isArray(tuning.disabled_parameters)
    ? tuning.disabled_parameters.map((entry) => String(entry || "").trim()).filter(Boolean).slice(0, 128)
    : [];
  return {
    intensity: clampSummaryNumber(tuning.intensity, 0.25, 2, 1),
    enabledCount: positiveSummaryNumber(tuning.enabled_parameter_count),
    disabledCount: positiveSummaryNumber(tuning.disabled_parameter_count) || disabledParameters.length,
    disabledParameters
  };
}

function buildLive2dHitAreaSummary(metadataValue: unknown): Live2dHitAreaSummary[] {
  const source = live2dSourceFromMetadata(metadataValue);
  const hitAreas = live2dArrayFrom(source, "hit_areas", "hitAreas");
  return hitAreas
    .filter((area): area is ResourceRecord => Boolean(area && typeof area === "object" && !Array.isArray(area)))
    .map((area) => {
      const id = String(area.id || "").trim();
      const kind = String(area.kind || area.type || "generic").trim() || "generic";
      const label = String(area.label || area.name || id).trim() || id;
      const hasBounds = isPlainBounds(area.bounds) || isPlainBounds(area.normalized_bounds) || isPlainBounds(area.normalizedBounds);
      const hasPoints = isPointList(area.points) || isPointList(area.normalized_points) || isPointList(area.normalizedPoints);
      const detail = [
        id ? `id: ${id}` : "",
        area.part_id ? `part: ${String(area.part_id)}` : "",
        hasBounds ? "bounds" : "",
        hasPoints ? "polygon" : ""
      ].filter(Boolean).join(" · ");
      return {
        id,
        label,
        kind,
        hasGeometry: hasBounds || hasPoints,
        detail
      };
    })
    .filter((area) => area.id)
    .sort((a, b) => a.kind.localeCompare(b.kind) || a.label.localeCompare(b.label))
    .slice(0, 16);
}

function isPlainBounds(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const bounds = value as ResourceRecord;
  return ["x", "y", "width", "height"].every((key) => Number.isFinite(Number(bounds[key])));
}

function isPointList(value: unknown) {
  if (!Array.isArray(value)) return false;
  return value.some((point) => {
    if (Array.isArray(point)) return Number.isFinite(Number(point[0])) && Number.isFinite(Number(point[1]));
    if (!point || typeof point !== "object") return false;
    const record = point as ResourceRecord;
    return Number.isFinite(Number(record.x)) && Number.isFinite(Number(record.y));
  });
}

function buildLive2dBindingSummary(metadataValue: unknown): Live2dBindingSummary[] {
  const source = live2dSourceFromMetadata(metadataValue);
  const bindings = live2dArrayFrom(source, "parameter_bindings", "parameterBindings");
  return bindings
    .filter((binding): binding is ResourceRecord => Boolean(binding && typeof binding === "object" && !Array.isArray(binding)))
    .map((binding) => {
      const parameter = String(binding.parameter || "").trim();
      const affectedPartCount = Array.isArray(binding.affected_parts) ? binding.affected_parts.length : 0;
      const count = [
        binding.direct_binding_count,
        binding.visibility_gate_count,
        binding.transform_key_count,
        binding.draw_order_key_count,
        binding.deformer_group_count,
        binding.warp_deformer_count,
        binding.warp_key_count,
        binding.mesh_deformer_count,
        binding.physics_rule_count,
        binding.motion_key_count
      ].reduce((total, value) => total + positiveSummaryNumber(value), 0);
      const channels = Array.isArray(binding.channels)
        ? binding.channels.map((channel) => String(channel)).filter(Boolean).slice(0, 6).join(", ")
        : "";
      return {
        parameter,
        label: String(binding.label || parameter).trim() || parameter,
        role: String(binding.role || "generic").trim() || "generic",
        count: count || affectedPartCount,
        detail: [
          binding.role ? `role: ${String(binding.role)}` : "",
          channels ? `channels: ${channels}` : "",
          affectedPartCount > 0 ? `${affectedPartCount} affected parts` : "",
          positiveSummaryNumber(binding.visibility_gate_count) > 0 ? `${positiveSummaryNumber(binding.visibility_gate_count)} visibility gates` : "",
          positiveSummaryNumber(binding.draw_order_key_count) > 0 ? `${positiveSummaryNumber(binding.draw_order_key_count)} order keys` : "",
          positiveSummaryNumber(binding.warp_key_count) > 0 ? `${positiveSummaryNumber(binding.warp_key_count)} warp keys` : "",
          positiveSummaryNumber(binding.mesh_key_count) > 0 ? `${positiveSummaryNumber(binding.mesh_key_count)} mesh keys` : "",
          positiveSummaryNumber(binding.motion_key_count) > 0 ? `${positiveSummaryNumber(binding.motion_key_count)} motion keys` : ""
        ].filter(Boolean).join(" · ")
      };
    })
    .filter((binding) => binding.parameter)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 8);
}

function positiveSummaryNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.round(numberValue) : 0;
}

function stringListFromUnknown(value: unknown) {
  const source = Array.isArray(value) ? value : [value];
  return [...new Set(source.map((entry) => String(entry || "").trim()).filter(Boolean))];
}

function clampSummaryNumber(value: unknown, min: number, max: number, fallback: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(max, Math.max(min, numberValue));
}

function formatLive2dSyncAvailableStatus(change: { portraitCount: number; removedPortraitCount: number; metadataChanged: boolean }) {
  const parts = [
    change.portraitCount > 0 ? `변경 ${change.portraitCount}개` : "",
    change.removedPortraitCount > 0 ? `stale 정리 ${change.removedPortraitCount}개` : "",
    change.metadataChanged ? "source 정보" : ""
  ].filter(Boolean);
  if (parts.length > 0) return `Live2D 내보내기 ${parts.join(" · ")} 동기화 가능`;
  return "Live2D source 정보 동기화 가능";
}

function formatLive2dSyncAppliedStatus(
  portraitCount: number,
  removedPortraitCount: number,
  metadataChanged: boolean,
  source = "초상"
) {
  const parts = [
    portraitCount > 0 ? `${source} ${portraitCount}개 가져옴` : "",
    removedPortraitCount > 0 ? `stale 초상 ${removedPortraitCount}개 정리` : "",
    metadataChanged ? "source 정보 동기화" : ""
  ].filter(Boolean);
  return parts.length > 0 ? `Live2D ${parts.join(" · ")}` : "동기화할 Live2D 초상이 없습니다";
}
