import { useUiText } from "../../editorText";
import { CheckboxList, NumberField, SelectLiteralField, TextField, ToggleField, UploadField } from "../../components/EditorControls";
import { normalizeNumber } from "../../lib/numeric";
import { normalizeKind } from "../../lib/resourceConfig";
import type { ResourceFormCommonProps } from "../resources/resourceFormTypes";
import { getResourceChapterScopeIds, toggleResourceChapterScope } from "../resources/resourceScope";
import { ChoiceJsonField } from "../dialogues/ChoiceJsonField";
import { StoryAssetMediaPreview } from "./StoryAssetMediaPreview";
import { normalizeStoryAssetDraftForKind, storyAssetUploadPath } from "./storyAssetModel";

export function StoryAssetForm({
  disabled,
  draft,
  references,
  updateField,
  uploadFile,
  replaceDraft
}: ResourceFormCommonProps) {
  const ui = useUiText();
  const storyAssetKind = normalizeKind(draft.kind || "sfx");
  return (
    <div className="form-grid">
      <TextField label={ui.form.id} value={draft.id || ""} onChange={(value) => updateField("id", value)} readOnly />
      <TextField label={ui.form.displayName} value={draft.display_name} onChange={(value) => updateField("display_name", value)} />
      <SelectLiteralField
        label={ui.form.kind}
        value={storyAssetKind}
        options={["sfx", "bgm", "background"]}
        onChange={(value) => replaceDraft(normalizeStoryAssetDraftForKind({ ...draft, kind: value }, value))}
      />
      <TextField label={ui.form.path} value={draft.path} onChange={(value) => updateField("path", value)} />
      <UploadField
        disabled={disabled}
        label={ui.form.uploadAssetFile}
        accept={storyAssetKind === "background" ? "image/png,image/jpeg,image/webp,image/gif" : "audio/mpeg,audio/ogg,audio/wav,audio/mp4,audio/aac,audio/flac,audio/webm"}
        onUpload={async (file) => {
          const path = await uploadFile(storyAssetUploadPath(draft, file), file);
          updateField("path", path);
          return path;
        }}
      />
      <StoryAssetMediaPreview asset={draft} kind={storyAssetKind} />
      {storyAssetKind !== "background" && <NumberField label={ui.form.volume} value={normalizeNumber(draft.volume, 1, 0, 1)} min={0} max={1} step={0.05} resetValue={1} onChange={(value) => updateField("volume", value)} />}
      {storyAssetKind === "background" && <ToggleField label={ui.form.fixedBackground} checked={Boolean(draft.fixed ?? draft.background_fixed ?? draft.metadata?.fixed)} onChange={(checked) => updateField("fixed", checked)} />}
      <TextField label={ui.form.description} value={draft.description} onChange={(value) => updateField("description", value)} multiline />
      <CheckboxList label={ui.form.chapters} values={getResourceChapterScopeIds(draft)} options={references.chapters} onToggle={(id) => replaceDraft(toggleResourceChapterScope(draft, id))} />
      <ChoiceJsonField label={ui.form.metadata} value={draft.metadata} expected="object" onChange={(value) => updateField("metadata", value)} />
    </div>
  );
}
