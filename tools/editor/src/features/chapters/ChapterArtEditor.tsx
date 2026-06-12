import { useEffect, useState } from "react";
import { Icon, NumberField, TextField, ToggleField, UploadField } from "../../components/EditorControls";
import { fileExtension, safeSegment } from "../../lib/files";
import { asArray } from "../../lib/resourceConfig";
import type { ResourceRecord } from "../../types";
import { ChapterArtOverlaySection } from "./ChapterArtOverlaySection";
import { ChapterArtTitleSection } from "./ChapterArtTitleSection";
import {
  applyChapterArtSnapshot,
  createChapterArtSnapshot,
  getChapterArtSnapshotPayload,
  getParallaxOverlayLayout,
  getParallaxTitleLayout,
  type ChapterArtSnapshot
} from "./chapterArtModel";
import { clampListIndex, createDefaultParallaxLayer } from "./chapterArtEditorModel";
import { ChapterLayerInspector } from "./ChapterLayerInspector";
import { ChapterParallaxLayerIndex } from "./ChapterParallaxLayerIndex";
import { uploadChapterThumbnailForDraft } from "./chapterThumbnail";
import { ParallaxVisualEditor } from "./ParallaxVisualEditor";

export function ChapterArtEditor({
  disabled,
  draft,
  notify,
  replaceDraft,
  savedJsonText,
  updateField,
  uploadFile
}: {
  disabled: boolean;
  draft: ResourceRecord;
  notify: (message: string) => void;
  replaceDraft: (nextDraft: ResourceRecord) => void;
  savedJsonText: string;
  updateField: (field: string, value: unknown) => void;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
}) {
  const parallax = draft.parallax && typeof draft.parallax === "object" ? draft.parallax as ResourceRecord : { enabled: false, strength: 42, layers: [] };
  const layers = asArray<ResourceRecord>(parallax.layers);
  const overlay = getParallaxOverlayLayout(parallax);
  const titleLayout = getParallaxTitleLayout(parallax);
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);
  const [snapshot, setSnapshot] = useState<ChapterArtSnapshot | null>(() => createChapterArtSnapshot(draft));
  const [thumbnailBusy, setThumbnailBusy] = useState(false);
  const [artStatus, setArtStatus] = useState("");
  const safeSelectedLayerIndex = Math.min(Math.max(selectedLayerIndex, 0), Math.max(layers.length - 1, 0));
  const selectedLayer = layers[safeSelectedLayerIndex];
  const hasSnapshotChanges = snapshot
    ? JSON.stringify(getChapterArtSnapshotPayload(draft)) !== snapshot.serialized
    : false;

  useEffect(() => {
    setSnapshot(createChapterArtSnapshot(draft));
    setArtStatus("");
  }, [draft.id, savedJsonText]);

  function updateParallax(patch: ResourceRecord) {
    updateField("parallax", { ...parallax, ...patch });
  }

  function updateLayer(index: number, patch: ResourceRecord) {
    updateParallax({
      layers: layers.map((layer, layerIndex) => layerIndex === index ? { ...layer, ...patch } : layer)
    });
  }

  function updateOverlay(patch: ResourceRecord) {
    updateParallax({ overlay: { ...overlay, ...patch } });
  }

  function updateTitleLayout(patch: ResourceRecord) {
    updateParallax({ title: { ...titleLayout, ...patch } });
  }

  function selectLayer(index: number) {
    setSelectedLayerIndex(clampListIndex(index, layers.length));
  }

  function addLayer() {
    updateParallax({
      enabled: true,
      layers: [...layers, createDefaultParallaxLayer(layers.length)]
    });
    setSelectedLayerIndex(layers.length);
  }

  function removeLayer(index: number) {
    updateParallax({ layers: layers.filter((_, layerIndex) => layerIndex !== index) });
    setSelectedLayerIndex(Math.max(0, Math.min(index - 1, layers.length - 2)));
  }

  function restoreSnapshot() {
    if (!snapshot) return;
    replaceDraft(applyChapterArtSnapshot(draft, snapshot.payload));
    setArtStatus("챕터 아트 설정을 스냅샷으로 복원했습니다.");
  }

  async function generateThumbnail() {
    if (disabled || thumbnailBusy) return;
    setThumbnailBusy(true);
    setArtStatus("");
    try {
      const result = await uploadChapterThumbnailForDraft(draft, async (relativePath, file) => ({
        resPath: await uploadFile(relativePath, file)
      }));
      if (result.skipped) {
        setArtStatus("썸네일로 저장할 패럴랙스 레이어가 없습니다.");
        return;
      }
      replaceDraft(result.draft);
      setArtStatus(`썸네일 생성: ${result.resPath}`);
      notify(`썸네일 생성 완료: ${result.resPath}`);
    } catch (error) {
      const message = `썸네일 생성 실패: ${(error as Error).message}`;
      setArtStatus(message);
      notify(message);
    } finally {
      setThumbnailBusy(false);
    }
  }

  return (
    <div className="wide structured-editor">
      <div className="structured-header">
        <span>Chapter Art / Parallax</span>
        <div className="chapter-art-actions">
          <button disabled={disabled || thumbnailBusy} type="button" onClick={() => void generateThumbnail()}><Icon name="AddPhotoAlternate" />썸네일</button>
          <button disabled={disabled || !hasSnapshotChanges} type="button" onClick={restoreSnapshot}><Icon name="Restore" />복원</button>
          <button disabled={disabled} type="button" onClick={addLayer}><Icon name="Add" />레이어</button>
        </div>
      </div>
      <div className="form-grid compact">
        <TextField label="Thumbnail" value={draft.image || ""} onChange={(value) => updateField("image", value)} />
        <UploadField
          disabled={disabled}
          label="Upload thumbnail"
          accept="image/png,image/jpeg,image/webp"
          onUpload={async (file) => {
            const path = await uploadFile(`assets/chapters/${safeSegment(draft.id || "chapter")}/thumbnail.${fileExtension(file)}`, file);
            updateField("image", path);
            return path;
          }}
        />
        <NumberField label="Parallax strength" value={parallax.strength ?? 42} min={0} step={1} resetValue={42} onChange={(value) => updateParallax({ strength: value })} />
        <ToggleField label="Parallax enabled" checked={Boolean(parallax.enabled)} onChange={(checked) => updateParallax({ enabled: checked })} />
      </div>
      <ChapterArtOverlaySection
        disabled={disabled}
        draftId={draft.id}
        overlay={overlay}
        onUpdateOverlay={updateOverlay}
        uploadFile={uploadFile}
      />
      <ChapterArtTitleSection
        disabled={disabled}
        draftId={draft.id}
        layerCount={layers.length}
        titleLayout={titleLayout}
        onUpdateTitleLayout={updateTitleLayout}
        uploadFile={uploadFile}
      />
      {artStatus && <p className="art-status">{artStatus}</p>}
      <ChapterParallaxLayerIndex
        layers={layers}
        selectedLayerIndex={safeSelectedLayerIndex}
        onSelectLayer={selectLayer}
      />
      <div className="chapter-art-workspace">
        <ParallaxVisualEditor
          draft={draft}
          layers={layers}
          parallax={parallax}
          selectedLayerIndex={safeSelectedLayerIndex}
          onSelectLayer={selectLayer}
          onChangeLayer={(index, patch) => updateLayer(index, patch)}
          onChangeTitleLayout={updateTitleLayout}
        />
        <ChapterLayerInspector
          disabled={disabled}
          draftId={draft.id}
          index={safeSelectedLayerIndex}
          layer={selectedLayer}
          onRemoveLayer={removeLayer}
          onUpdateLayer={updateLayer}
          uploadFile={uploadFile}
        />
      </div>
    </div>
  );
}
