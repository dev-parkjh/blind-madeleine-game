import { NumberField, TextField, ToggleField, UploadField } from "../../components/EditorControls";
import { fileExtension, safeSegment } from "../../lib/files";
import type { ResourceRecord } from "../../types";

export function ChapterArtOverlaySection({
  disabled,
  draftId,
  overlay,
  onUpdateOverlay,
  uploadFile
}: {
  disabled: boolean;
  draftId: unknown;
  overlay: ResourceRecord;
  onUpdateOverlay: (patch: ResourceRecord) => void;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
}) {
  return (
    <details className="chapter-layer-details" open={Boolean(overlay.enabled)}>
      <summary>
        <span>O</span>
        <strong>Overlay reference</strong>
        <code>{overlay.enabled ? "enabled" : "disabled"}</code>
      </summary>
      <div className="structured-row chapter-layer-row">
        <ToggleField label="Overlay enabled" checked={Boolean(overlay.enabled)} onChange={(checked) => onUpdateOverlay({ enabled: checked })} />
        <TextField label="Overlay path" value={overlay.path} onChange={(value) => onUpdateOverlay({ path: value })} />
        <UploadField
          disabled={disabled}
          label="Upload overlay"
          accept="image/png,image/jpeg,image/webp"
          onUpload={async (file) => {
            const path = await uploadFile(`assets/chapters/${safeSegment(draftId || "chapter")}/overlay.${fileExtension(file)}`, file);
            onUpdateOverlay({ enabled: true, path });
            return path;
          }}
        />
        <NumberField label="Overlay opacity" value={overlay.opacity} min={0} max={1} step={0.05} resetValue={0.55} onChange={(value) => onUpdateOverlay({ opacity: value })} />
      </div>
    </details>
  );
}
