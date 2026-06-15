import { useEffect, useState } from "react";
import { Icon, NumberField, TextField, UploadField } from "../../components/EditorControls";
import { useUiText } from "../../editorText";
import { getEditorHealth, loadResource } from "../../lib/api";
import { fileExtension, safeSegment } from "../../lib/files";
import { normalizePortraitRigPoseTags } from "../../lib/portraitRigPoseTags";
import { asArray } from "../../lib/resourceConfig";
import { resPathToAssetUrl } from "../../lib/resourcePaths";
import type { ResourceRecord } from "../../types";
import {
  canonicalJson,
  getPortraitRigSyncChange,
  mergePortraitRigMetadata,
  mergePortraitRigPortraitExports
} from "./portraitRigPortraitSync";
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
  const portraitRigMotionSummary = buildPortraitRigMotionSummary(entries, draft.metadata);
  const portraitRigSourceSummary = buildPortraitRigSourceSummary(draft.metadata);
  const portraitRigRuntimeReadinessSummary = buildPortraitRigRuntimeReadinessSummary(draft.metadata);
  const portraitRigDialogueMotionSummary = buildPortraitRigDialogueMotionSummary(draft.metadata);
  const portraitRigAdaptiveTuningSummary = buildPortraitRigAdaptiveTuningSummary(draft.metadata);
  const portraitRigExpressionSummary = buildPortraitRigExpressionSummary(draft.metadata);
  const portraitRigBindingSummary = buildPortraitRigBindingSummary(draft.metadata);
  const portraitRigHitAreaSummary = buildPortraitRigHitAreaSummary(draft.metadata);
  const portraitRigMetadataPortraits = collectPortraitRigMetadataPortraits(draft.metadata);
  const [previewClipId, setPreviewClipId] = useState("");
  const [syncStatus, setSyncStatus] = useState("");
  const [syncingPortraitRig, setSyncingPortraitRig] = useState(false);
  const activePreviewClip = portraitRigMotionSummary.find((item) => item.clipId === previewClipId) || portraitRigMotionSummary[0] || null;
  const portraitRigSyncSignature = canonicalJson({
    portraits,
    portrait_rig: portraitRigSourceFromMetadata(draft.metadata)
  });

  useEffect(() => {
    if (portraitRigMotionSummary.length === 0) {
      if (previewClipId) setPreviewClipId("");
      return;
    }
    if (!portraitRigMotionSummary.some((item) => item.clipId === previewClipId)) {
      setPreviewClipId(portraitRigMotionSummary[0].clipId);
    }
  }, [portraitRigMotionSummary, previewClipId]);

  useEffect(() => {
    const characterId = String(draft.id || "").trim();
    setSyncStatus("");
    if (!characterId) return undefined;
    let cancelled = false;

    const refreshPortraitRigSyncStatus = async () => {
      try {
        const result = await loadResource("characters", characterId);
        if (cancelled) return;
        const syncChange = getPortraitRigSyncChange(draft, result.data);
        if (syncChange.portraitCount > 0 || syncChange.removedPortraitCount > 0 || syncChange.metadataChanged) {
          setSyncStatus(formatPortraitRigSyncAvailableStatus(syncChange));
        }
      } catch {
        // The explicit sync action reports load errors; the passive hint stays quiet.
      }
    };
    void refreshPortraitRigSyncStatus();
    window.addEventListener("focus", refreshPortraitRigSyncStatus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refreshPortraitRigSyncStatus);
    };
  }, [draft.id, portraitRigSyncSignature]);

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

  async function syncPortraitRigExports() {
    const characterId = String(draft.id || "").trim();
    if (syncingPortraitRig) return;
    setSyncingPortraitRig(true);
    setSyncStatus("초상 리그 동기화 확인 중...");
    const localSynced = mergePortraitRigPortraitExports(portraits, {}, draft.metadata);
    try {
      if (!characterId) {
        if (localSynced.count > 0 || localSynced.removedCount > 0) {
          replaceDraft({
            ...draft,
            portraits: localSynced.portraits
          });
          setSyncStatus(formatPortraitRigSyncAppliedStatus(localSynced.count, localSynced.removedCount, false, "metadata"));
        } else {
          setSyncStatus("동기화할 초상 리그 데이터가 없습니다");
        }
        return;
      }
      const result = await loadResource("characters", characterId);
      const synced = mergePortraitRigPortraitExports(portraits, result.data?.portraits, result.data?.metadata);
      const syncedMetadata = mergePortraitRigMetadata(draft.metadata, result.data?.metadata);
      if (synced.count > 0 || synced.removedCount > 0 || syncedMetadata) {
        replaceDraft({
          ...draft,
          ...(synced.count > 0 || synced.removedCount > 0 ? { portraits: synced.portraits } : {}),
          ...(syncedMetadata ? { metadata: syncedMetadata } : {})
        });
      }
      if (synced.count > 0 || synced.removedCount > 0) {
        setSyncStatus(formatPortraitRigSyncAppliedStatus(synced.count, synced.removedCount, Boolean(syncedMetadata)));
      } else if (syncedMetadata) {
        setSyncStatus("초상 리그 소스 정보 동기화됨");
      } else {
        setSyncStatus("동기화할 초상 리그 데이터가 없습니다");
      }
    } catch (error) {
      if (localSynced.count > 0 || localSynced.removedCount > 0) {
        replaceDraft({
          ...draft,
          portraits: localSynced.portraits
        });
        setSyncStatus(formatPortraitRigSyncAppliedStatus(localSynced.count, localSynced.removedCount, false, "metadata"));
      } else {
        setSyncStatus(error instanceof Error ? error.message : "초상 리그 동기화 실패");
      }
    } finally {
      setSyncingPortraitRig(false);
    }
  }

  return (
    <div className="wide structured-editor portrait-editor">
      <div className="structured-header">
        <span>{ui.form.portraits}</span>
        <button disabled={disabled || syncingPortraitRig} type="button" onClick={() => void syncPortraitRigExports()}>
          <Icon name="Sync" />{ui.form.portraitRigSyncExports}
        </button>
      </div>
      {syncStatus && <p className="portrait-sync-status">{syncStatus}</p>}
      {portraitRigSourceSummary && (
        <div className="portrait-rig-source-summary">
          <strong>초상 리그 소스</strong>
          <span>{portraitRigSourceSummary}</span>
        </div>
      )}
      {portraitRigRuntimeReadinessSummary && (
        <div className={`portrait-rig-runtime-summary ${portraitRigRuntimeReadinessSummary.ready ? "ready" : "incomplete"}`}>
          <strong>Game runtime</strong>
          <span>{portraitRigRuntimeReadinessSummary.ready ? "실시간 리그 준비됨" : "리그 저장 필요"}</span>
          <span>{portraitRigRuntimeReadinessSummary.dialogueReady ? "대화 모션 준비됨" : "대화 모션 준비 필요"}</span>
          {portraitRigRuntimeReadinessSummary.adaptivePoseReady && <span>adaptive pose</span>}
          {portraitRigRuntimeReadinessSummary.interactionReady && (
            <span>
              {portraitRigRuntimeReadinessSummary.hitAreaCount > 0
                ? `${portraitRigRuntimeReadinessSummary.hitAreaCount} hit areas`
                : "interaction ready"}
            </span>
          )}
          {portraitRigRuntimeReadinessSummary.expectedFrameCount > 0 && (
            <span>{portraitRigRuntimeReadinessSummary.exportedFrameCount}/{portraitRigRuntimeReadinessSummary.expectedFrameCount} 샘플</span>
          )}
          {portraitRigRuntimeReadinessSummary.parameterBindingCount > 0 && (
            <span>{portraitRigRuntimeReadinessSummary.parameterBindingCount} bindings</span>
          )}
          {portraitRigRuntimeReadinessSummary.semanticParameterCount > 0 && (
            <span>{portraitRigRuntimeReadinessSummary.semanticParameterCount}/{portraitRigRuntimeReadinessSummary.parameterRoleCount} semantic roles</span>
          )}
          {portraitRigRuntimeReadinessSummary.poseTagCount > 0 && (
            <span>{portraitRigRuntimeReadinessSummary.poseTagCount} pose tags</span>
          )}
          {portraitRigRuntimeReadinessSummary.incompleteMotionFrameSets.length > 0 && (
            <span title={portraitRigRuntimeReadinessSummary.incompleteMotionFrameSets.map((entry) => `${entry.clipId} ${entry.frameCount}/${entry.expectedFrameCount}`).join(", ")}>
              incomplete: {portraitRigRuntimeReadinessSummary.incompleteMotionFrameSets.slice(0, 3).map((entry) => `${entry.clipId} ${entry.frameCount}/${entry.expectedFrameCount}`).join(", ")}
              {portraitRigRuntimeReadinessSummary.incompleteMotionFrameSets.length > 3 ? ", ..." : ""}
            </span>
          )}
          {portraitRigRuntimeReadinessSummary.missing.length > 0 && (
            <span title={portraitRigRuntimeReadinessSummary.missing.join(", ")}>
              missing: {portraitRigRuntimeReadinessSummary.missing.slice(0, 3).join(", ")}
              {portraitRigRuntimeReadinessSummary.missing.length > 3 ? ", ..." : ""}
            </span>
          )}
          {portraitRigRuntimeReadinessSummary.missingDialogue.length > 0 && (
            <span title={portraitRigRuntimeReadinessSummary.missingDialogue.join(", ")}>
              dialogue missing: {portraitRigRuntimeReadinessSummary.missingDialogue.slice(0, 3).join(", ")}
              {portraitRigRuntimeReadinessSummary.missingDialogue.length > 3 ? ", ..." : ""}
            </span>
          )}
        </div>
      )}
      {portraitRigDialogueMotionSummary && (
        <div className={`portrait-rig-dialogue-summary ${portraitRigDialogueMotionSummary.ready ? "ready" : "incomplete"}`}>
          <strong>Dialogue motion</strong>
          <span>{portraitRigDialogueMotionSummary.ready ? "기본 모션 준비됨" : "기본 모션 준비 필요"}</span>
          {portraitRigDialogueMotionSummary.adaptiveClipId && <span>adaptive: {portraitRigDialogueMotionSummary.adaptiveClipId}</span>}
          {portraitRigDialogueMotionSummary.idleClipId && <span>idle: {portraitRigDialogueMotionSummary.idleClipId}</span>}
          {portraitRigDialogueMotionSummary.talkClipId && <span>talk: {portraitRigDialogueMotionSummary.talkClipId}</span>}
          {portraitRigDialogueMotionSummary.visemeClipId && <span>viseme: {portraitRigDialogueMotionSummary.visemeClipId}</span>}
          {portraitRigDialogueMotionSummary.expectedFrameCount > 0 && (
            <span>{portraitRigDialogueMotionSummary.exportedFrameCount}/{portraitRigDialogueMotionSummary.expectedFrameCount} 샘플</span>
          )}
          {portraitRigDialogueMotionSummary.missingExportedClipIds.length > 0 && (
            <span title={portraitRigDialogueMotionSummary.missingExportedClipIds.join(", ")}>
              누락된 모션: {portraitRigDialogueMotionSummary.missingExportedClipIds.slice(0, 3).join(", ")}
              {portraitRigDialogueMotionSummary.missingExportedClipIds.length > 3 ? ", ..." : ""}
            </span>
          )}
        </div>
      )}
      {portraitRigAdaptiveTuningSummary && (
        <div className="portrait-rig-adaptive-summary">
          <strong>Adaptive tuning</strong>
          <span>energy {portraitRigAdaptiveTuningSummary.intensity.toFixed(2)}x</span>
          <span>{portraitRigAdaptiveTuningSummary.enabledCount} enabled · {portraitRigAdaptiveTuningSummary.disabledCount} disabled</span>
          {portraitRigAdaptiveTuningSummary.disabledParameters.length > 0 && (
            <span title={portraitRigAdaptiveTuningSummary.disabledParameters.join(", ")}>
              off: {portraitRigAdaptiveTuningSummary.disabledParameters.slice(0, 4).join(", ")}
              {portraitRigAdaptiveTuningSummary.disabledParameters.length > 4 ? ", ..." : ""}
            </span>
          )}
        </div>
      )}
      {portraitRigExpressionSummary && (
        <div className="portrait-rig-adaptive-summary">
          <strong>Expression presets</strong>
          <span>{portraitRigExpressionSummary.count} presets</span>
          {portraitRigExpressionSummary.autoCount > 0 && <span>{portraitRigExpressionSummary.autoCount} auto</span>}
          {portraitRigExpressionSummary.poseTags.length > 0 && (
            <span title={portraitRigExpressionSummary.poseTags.join(", ")}>
              tags: {portraitRigExpressionSummary.poseTags.slice(0, 5).join(", ")}
              {portraitRigExpressionSummary.poseTags.length > 5 ? ", ..." : ""}
            </span>
          )}
          {portraitRigExpressionSummary.names.length > 0 && (
            <span title={portraitRigExpressionSummary.names.join(", ")}>
              {portraitRigExpressionSummary.names.slice(0, 4).join(", ")}
              {portraitRigExpressionSummary.names.length > 4 ? ", ..." : ""}
            </span>
          )}
        </div>
      )}
      {portraitRigBindingSummary.length > 0 && (
        <div className="portrait-rig-binding-summary">
          <strong>Rig bindings</strong>
          <div>
            {portraitRigBindingSummary.map((binding) => (
              <span key={binding.parameter} title={binding.detail}>
                {binding.label} · {binding.role} · {binding.count}
              </span>
            ))}
          </div>
        </div>
      )}
      {portraitRigHitAreaSummary.length > 0 && (
        <div className="portrait-rig-hit-area-summary">
          <strong>Hit areas</strong>
          <div>
            {portraitRigHitAreaSummary.map((area) => (
              <span className={area.hasGeometry ? "ready" : ""} key={area.id} title={area.detail}>
                {area.label} · {area.kind}{area.hasGeometry ? " · geo" : ""}
              </span>
            ))}
          </div>
        </div>
      )}
      {entries.length === 0 && <p className="empty-state">{ui.form.noPortraits}</p>}
      {portraitRigMotionSummary.length > 0 && (
        <div className="portrait-rig-summary">
          <strong>초상 리그 모션 세트</strong>
          <div>
            {portraitRigMotionSummary.map((item) => (
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
      {activePreviewClip && <PortraitRigMotionFramePreview clip={activePreviewClip} />}
      {entries.map(([key, portrait], index) => (
        <PortraitRowEditor
          characterId={String(draft.id || "character")}
          disabled={disabled}
          key={`portrait-row-${index}`}
          onRemove={() => removePortrait(key)}
          onRename={(nextKey) => renamePortrait(key, nextKey)}
          onUpdate={(patch) => updatePortrait(key, patch)}
          portraitRigMetadataPortrait={portraitRigMetadataPortraits[key]}
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
  portraitRigMetadataPortrait,
  onRemove,
  onRename,
  onUpdate,
  portrait,
  portraitKey,
  uploadFile
}: {
  characterId: string;
  disabled: boolean;
  portraitRigMetadataPortrait?: ResourceRecord;
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
  const metadataPath = String(portraitRigMetadataPortrait?.image_path ?? portraitRigMetadataPortrait?.imagePath ?? portraitRigMetadataPortrait?.path ?? "");
  const canUsePortraitRigMetadata = Boolean(portraitPath && metadataPath && portraitPath === metadataPath);
  const metadataProfile = canUsePortraitRigMetadata && portraitRigMetadataPortrait?.profile && typeof portraitRigMetadataPortrait.profile === "object" && !Array.isArray(portraitRigMetadataPortrait.profile)
    ? portraitRigMetadataPortrait.profile as ResourceRecord
    : {};
  const center = asArray<number>(portraitRecord.center);
  const metadataCenter = canUsePortraitRigMetadata ? asArray<number>(portraitRigMetadataPortrait?.center) : [];
  const effectiveCenter = center.length >= 2 ? center : metadataCenter;
  const profile = portraitRecord.profile && typeof portraitRecord.profile === "object" ? portraitRecord.profile as ResourceRecord : metadataProfile;
  const profileOffset = getProfileOffset(profile);
  const centerPoint = getPortraitCenterPoint(effectiveCenter);
  const portraitRigModelPath = String(
    portraitRecord.portrait_rig_model
    ?? portraitRecord.portraitRigModel
    ?? portraitRecord.model_path
    ?? portraitRecord.modelPath
    ?? (canUsePortraitRigMetadata
      ? portraitRigMetadataPortrait?.model_path
        ?? portraitRigMetadataPortrait?.modelPath
        ?? portraitRigMetadataPortrait?.portrait_rig_model
        ?? portraitRigMetadataPortrait?.portraitRigModel
        ?? ""
      : "")
  );
  const generatedBy = String(portraitRecord.generated_by ?? portraitRecord.generatedBy ?? "");
  const portraitMotionFrame = portraitRigMotionFrameFromPortraitLike(portraitRecord);
  const metadataMotionFrame = canUsePortraitRigMetadata && portraitRigMetadataPortrait
    ? portraitRigMotionFrameFromPortraitLike(portraitRigMetadataPortrait)
    : null;
  const motionFrame = portraitMotionFrame || metadataMotionFrame;
  const motionFrameClipId = String(motionFrame?.clip_id ?? motionFrame?.clipId ?? "").trim();
  const motionFrameClipLabel = String(motionFrame?.clip_label ?? motionFrame?.clipLabel ?? motionFrame?.label ?? motionFrameClipId).trim() || motionFrameClipId;
  const hasPortraitRigSource = Boolean(portraitRigModelPath || generatedBy === "tools/portrait-rig-editor" || metadataMotionFrame);

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
        <div className={`portrait-rig-strip ${hasPortraitRigSource ? "linked" : ""}`}>
          <TextField label="초상 리그 모델" value={portraitRigModelPath} onChange={(value) => onUpdate({ portrait_rig_model: value })} />
          <button
            className="portrait-rig-action"
            type="button"
            onClick={() => openPortraitRigEditor(characterId, portraitKey)}
          >
            <Icon name="OpenInNew" />초상 리그 편집
          </button>
          {hasPortraitRigSource && <span className="portrait-rig-badge">실시간 리그 연결됨</span>}
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

async function openPortraitRigEditor(characterId: string, portraitKey: string) {
  const fallbackUrl = buildPortraitRigEditorUrl(characterId, portraitKey);
  const opened = window.open("about:blank", "blind-madeleine-portrait-rig-editor");
  try {
    const health = await getEditorHealth();
    const url = buildPortraitRigEditorUrl(characterId, portraitKey, health.portraitRigEditorUrl);
    if (opened) opened.location.href = url;
    else window.open(url, "blind-madeleine-portrait-rig-editor");
  } catch {
    if (opened) opened.location.href = fallbackUrl;
    else window.open(fallbackUrl, "blind-madeleine-portrait-rig-editor");
  }
}

function buildPortraitRigEditorUrl(characterId: string, portraitKey: string, baseUrl = "http://127.0.0.1:5187/") {
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

function PortraitRigMotionFramePreview({ clip }: { clip: PortraitRigMotionSummary }) {
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
    <div className="portrait-rig-motion-preview">
      <div className="portrait-rig-motion-frame">
        {imageUrl ? <img alt="" src={imageUrl} /> : <span>NO FRAME</span>}
      </div>
      <div className="portrait-rig-motion-meta">
        <strong>{clip.label}</strong>
        <span>{clip.frames.length} samples · {formatMotionFrameTime(frame?.time)}</span>
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

type PortraitRigMotionSummary = {
  clipId: string;
  label: string;
  count: number;
  duration: number;
  frames: Array<{ key: string; path: string; time: number; frameIndex: number; poseTags: string[] }>;
};

function buildPortraitRigMotionSummary(entries: Array<[string, ResourceRecord | string]>, metadataValue: unknown) {
  const clips = new Map<string, PortraitRigMotionSummary>();
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
    const frame = portraitRigMotionFrameFromPortraitLike(portrait);
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
        poseTags: normalizePortraitRigPoseTags(frame?.pose_tags ?? frame?.poseTags)
      }
    });
  }

  for (const [key, portrait] of Object.entries(collectPortraitRigMetadataPortraits(metadataValue))) {
    if (!portrait || typeof portrait !== "object" || Array.isArray(portrait)) continue;
    const frame = portraitRigMotionFrameFromPortraitLike(portrait);
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
        poseTags: normalizePortraitRigPoseTags(frame?.pose_tags ?? frame?.poseTags)
      }
    });
  }

  const metadataPortraits = collectPortraitRigMetadataPortraits(metadataValue);
  for (const frameSet of collectPortraitRigMotionFrameSetsFromMetadata(metadataValue)) {
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

function collectPortraitRigMetadataPortraits(metadataValue: unknown): Record<string, ResourceRecord> {
  const source = portraitRigSourceFromMetadata(metadataValue) || {};
  return source.portraits && typeof source.portraits === "object" && !Array.isArray(source.portraits)
    ? source.portraits as Record<string, ResourceRecord>
    : {};
}

function portraitRigMotionFrameFromPortraitLike(portrait: ResourceRecord) {
  const frame = portrait.portrait_rig_motion_frame ?? portrait.portraitRigMotionFrame ?? portrait.motion_frame ?? portrait.motionFrame;
  return frame && typeof frame === "object" && !Array.isArray(frame) ? frame as ResourceRecord : null;
}

function portraitRigArrayFrom(source: ResourceRecord | null | undefined, snakeKey: string, camelKey: string) {
  return [
    ...(Array.isArray(source?.[snakeKey]) ? source[snakeKey] as unknown[] : []),
    ...(Array.isArray(source?.[camelKey]) ? source[camelKey] as unknown[] : [])
  ].filter((entry): entry is ResourceRecord => Boolean(entry && typeof entry === "object" && !Array.isArray(entry)));
}

function portraitRigRecordFrom(source: ResourceRecord | null | undefined, snakeKey: string, camelKey: string) {
  const value = source?.[snakeKey] ?? source?.[camelKey];
  return value && typeof value === "object" && !Array.isArray(value) ? value as ResourceRecord : null;
}

function portraitRigSourceFromMetadata(metadataValue: unknown) {
  const metadata = metadataValue && typeof metadataValue === "object" && !Array.isArray(metadataValue)
    ? metadataValue as ResourceRecord
    : {};
  const source = metadata.portrait_rig ?? metadata.portraitRig;
  return source && typeof source === "object" && !Array.isArray(source) ? source as ResourceRecord : null;
}

function collectPortraitRigMotionFrameSetsFromMetadata(metadataValue: unknown) {
  const source = portraitRigSourceFromMetadata(metadataValue);
  const sets = portraitRigArrayFrom(source, "motion_frame_sets", "motionFrameSets");
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
        const frame = portraitRigMotionFrameFromPortraitLike(state);
        const key = String(state.state || state.key || "").trim();
        if (!key) return [];
        return [{
          key,
          path: String(state.image_path || state.imagePath || state.path || ""),
          time: Number(state.time) || 0,
          frameIndex: Number(state.frame_index ?? state.frameIndex ?? 0) || 0,
          poseTags: normalizePortraitRigPoseTags(state.pose_tags ?? state.poseTags ?? frame?.pose_tags ?? frame?.poseTags)
        }];
      })
    }];
  });
}

function buildPortraitRigSourceSummary(metadataValue: unknown) {
  const source = portraitRigSourceFromMetadata(metadataValue);
  if (!source) return "";
  const motionFrameSets = portraitRigArrayFrom(source, "motion_frame_sets", "motionFrameSets");
  const parameterBindings = portraitRigArrayFrom(source, "parameter_bindings", "parameterBindings");
  const parameterRoles = portraitRigArrayFrom(source, "parameter_roles", "parameterRoles");
  const expressionPresets = portraitRigArrayFrom(source, "expression_presets", "expressionPresets");
  const hitAreas = portraitRigArrayFrom(source, "hit_areas", "hitAreas");

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
    exportedFrameCount > 0 ? `${exportedFrameCount} motion samples` : "",
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

function buildPortraitRigDialogueMotionSummary(metadataValue: unknown): PortraitRigDialogueMotionSummary | null {
  const source = portraitRigSourceFromMetadata(metadataValue);
  const motionSet = portraitRigRecordFrom(source, "dialogue_motion_set", "dialogueMotionSet");
  if (!motionSet) return null;
  const motionFrameSets = portraitRigArrayFrom(source, "motion_frame_sets", "motionFrameSets");

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

type PortraitRigBindingSummary = {
  parameter: string;
  label: string;
  role: string;
  count: number;
  detail: string;
};

type PortraitRigAdaptiveTuningSummary = {
  intensity: number;
  enabledCount: number;
  disabledCount: number;
  disabledParameters: string[];
};

type PortraitRigExpressionSummary = {
  count: number;
  autoCount: number;
  names: string[];
  poseTags: string[];
};

type PortraitRigHitAreaSummary = {
  id: string;
  label: string;
  kind: string;
  hasGeometry: boolean;
  detail: string;
};

type PortraitRigDialogueMotionSummary = {
  ready: boolean;
  adaptiveClipId: string;
  idleClipId: string;
  talkClipId: string;
  visemeClipId: string;
  exportedFrameCount: number;
  expectedFrameCount: number;
  missingExportedClipIds: string[];
};

type PortraitRigRuntimeReadinessSummary = {
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

function buildPortraitRigRuntimeReadinessSummary(metadataValue: unknown): PortraitRigRuntimeReadinessSummary | null {
  const source = portraitRigSourceFromMetadata(metadataValue);
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

function buildPortraitRigExpressionSummary(metadataValue: unknown): PortraitRigExpressionSummary | null {
  const source = portraitRigSourceFromMetadata(metadataValue);
  if (!source) return null;
  const presets = portraitRigArrayFrom(source, "expression_presets", "expressionPresets");
  const count = positiveSummaryNumber(source.expression_preset_count ?? source.expressionPresetCount) || presets.length;
  if (count <= 0) return null;
  const autoCount = positiveSummaryNumber(source.auto_expression_preset_count)
    || presets.filter((preset) => preset.auto_generated === true || preset.autoGenerated === true).length;
  const names = presets
    .map((preset) => String(preset.label || preset.name || preset.id || "").trim())
    .filter(Boolean)
    .slice(0, 24);
  const poseTags = normalizePortraitRigPoseTags(presets.flatMap((preset) => preset.pose_tags ?? preset.poseTags ?? []));
  return {
    count,
    autoCount,
    names,
    poseTags
  };
}

function buildPortraitRigAdaptiveTuningSummary(metadataValue: unknown): PortraitRigAdaptiveTuningSummary | null {
  const source = portraitRigSourceFromMetadata(metadataValue);
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

function buildPortraitRigHitAreaSummary(metadataValue: unknown): PortraitRigHitAreaSummary[] {
  const source = portraitRigSourceFromMetadata(metadataValue);
  const hitAreas = portraitRigArrayFrom(source, "hit_areas", "hitAreas");
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

function buildPortraitRigBindingSummary(metadataValue: unknown): PortraitRigBindingSummary[] {
  const source = portraitRigSourceFromMetadata(metadataValue);
  const bindings = portraitRigArrayFrom(source, "parameter_bindings", "parameterBindings");
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

function formatPortraitRigSyncAvailableStatus(change: { portraitCount: number; removedPortraitCount: number; metadataChanged: boolean }) {
  const parts = [
    change.portraitCount > 0 ? `변경 ${change.portraitCount}개` : "",
    change.removedPortraitCount > 0 ? `stale 정리 ${change.removedPortraitCount}개` : "",
    change.metadataChanged ? "소스 정보" : ""
  ].filter(Boolean);
  if (parts.length > 0) return `초상 리그 ${parts.join(" · ")} 동기화 가능`;
  return "초상 리그 소스 정보 동기화 가능";
}

function formatPortraitRigSyncAppliedStatus(
  portraitCount: number,
  removedPortraitCount: number,
  metadataChanged: boolean,
  source = "초상"
) {
  const parts = [
    portraitCount > 0 ? `${source} ${portraitCount}개 가져옴` : "",
    removedPortraitCount > 0 ? `stale 초상 ${removedPortraitCount}개 정리` : "",
    metadataChanged ? "소스 정보 동기화" : ""
  ].filter(Boolean);
  return parts.length > 0 ? `초상 리그 ${parts.join(" · ")}` : "동기화할 초상 리그 데이터가 없습니다";
}
