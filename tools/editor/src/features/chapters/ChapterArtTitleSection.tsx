import { NumberField, TextField, ToggleField, UploadField } from "../../components/EditorControls";
import { fileExtension, safeSegment } from "../../lib/files";
import { asArray } from "../../lib/resourceConfig";
import type { ResourceRecord } from "../../types";

export function ChapterArtTitleSection({
  disabled,
  draftId,
  layerCount,
  titleLayout,
  onUpdateTitleLayout,
  uploadFile
}: {
  disabled: boolean;
  draftId: unknown;
  layerCount: number;
  titleLayout: ResourceRecord;
  onUpdateTitleLayout: (patch: ResourceRecord) => void;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
}) {
  const titlePosition = asArray<number>(titleLayout.position);

  return (
    <details className="chapter-layer-details" open={Boolean(titleLayout.enabled)}>
      <summary>
        <span>T</span>
        <strong>Title layer</strong>
        <code>{titleLayout.enabled ? "enabled" : "disabled"}</code>
      </summary>
      <div className="structured-row chapter-layer-row">
        <ToggleField label="Title enabled" checked={Boolean(titleLayout.enabled)} onChange={(checked) => onUpdateTitleLayout({ enabled: checked })} />
        <TextField label="Title image" value={titleLayout.image || ""} onChange={(value) => onUpdateTitleLayout({ image: value })} />
        <UploadField
          disabled={disabled}
          label="Upload title"
          accept="image/png,image/jpeg,image/webp"
          onUpload={async (file) => {
            const path = await uploadFile(`assets/chapters/${safeSegment(draftId || "chapter")}/title.${fileExtension(file)}`, file);
            onUpdateTitleLayout({ enabled: true, image: path });
            return path;
          }}
        />
        <NumberField label="Title X" value={titlePosition[0] ?? 0.08} min={-0.5} max={1.5} step={0.01} resetValue={0.08} onChange={(value) => onUpdateTitleLayout({ position: [value, titlePosition[1] ?? 0.18] })} />
        <NumberField label="Title Y" value={titlePosition[1] ?? 0.18} min={-0.5} max={1.5} step={0.01} resetValue={0.18} onChange={(value) => onUpdateTitleLayout({ position: [titlePosition[0] ?? 0.08, value] })} />
        <NumberField label="Title scale" value={titleLayout.scale ?? 1} min={0.2} max={2.4} step={0.05} resetValue={1} onChange={(value) => onUpdateTitleLayout({ scale: value, scale_x: value, scale_y: value })} />
        <NumberField label="Title scale X" value={titleLayout.scale_x ?? titleLayout.scale ?? 1} min={0.2} max={2.4} step={0.01} resetValue={titleLayout.scale ?? 1} onChange={(value) => onUpdateTitleLayout({ scale_x: value })} />
        <NumberField label="Title scale Y" value={titleLayout.scale_y ?? titleLayout.scale ?? 1} min={0.2} max={2.4} step={0.01} resetValue={titleLayout.scale ?? 1} onChange={(value) => onUpdateTitleLayout({ scale_y: value })} />
        <NumberField label="Title opacity" value={titleLayout.opacity ?? 1} min={0} max={1} step={0.05} resetValue={1} onChange={(value) => onUpdateTitleLayout({ opacity: value })} />
        <NumberField label="Title order" value={titleLayout.order ?? layerCount} step={1} resetValue={layerCount} onChange={(value) => onUpdateTitleLayout({ order: value })} />
        <ToggleField label="Title floating" checked={titleLayout.floating !== false} onChange={(checked) => onUpdateTitleLayout({ floating: checked })} />
        <NumberField label="Title depth" value={titleLayout.depth ?? 0.1} min={-2} max={2} step={0.05} resetValue={0.1} onChange={(value) => onUpdateTitleLayout({ depth: value })} />
        <NumberField label="Title perspective" value={titleLayout.perspective ?? 0} min={-1} max={1} step={0.05} resetValue={0} onChange={(value) => onUpdateTitleLayout({ perspective: value })} />
      </div>
    </details>
  );
}
