import { useUiText } from "../../editorText";
import { CheckboxList, TextField, UploadField } from "../../components/EditorControls";
import { fileExtension, safeSegment } from "../../lib/files";
import type { ResourceFormCommonProps } from "../resources/resourceFormTypes";
import { getResourceChapterScopeIds, toggleResourceChapterScope } from "../resources/resourceScope";
import { ChoiceJsonField } from "../dialogues/ChoiceJsonField";
import { ItemImagePreview } from "./ItemImagePreview";

export function ItemForm({
  disabled,
  draft,
  references,
  updateField,
  uploadFile,
  replaceDraft
}: ResourceFormCommonProps) {
  const ui = useUiText();
  return (
    <div className="form-grid">
      <TextField label={ui.form.id} value={draft.id || ""} onChange={(value) => updateField("id", value)} readOnly />
      <TextField label={ui.form.name} value={draft.name} onChange={(value) => updateField("name", value)} />
      <TextField label={ui.form.image} value={draft.image} onChange={(value) => updateField("image", value)} />
      <UploadField
        disabled={disabled}
        label={ui.form.uploadItemImage}
        accept="image/png,image/jpeg,image/webp,image/gif"
        onUpload={async (file) => {
          const path = await uploadFile(`assets/items/${safeSegment(draft.id || "item")}/image.${fileExtension(file)}`, file);
          updateField("image", path);
          return path;
        }}
      />
      <ItemImagePreview imagePath={draft.image} />
      <TextField label={ui.form.description} value={draft.description} onChange={(value) => updateField("description", value)} multiline />
      <CheckboxList label={ui.form.chapters} values={getResourceChapterScopeIds(draft)} options={references.chapters} onToggle={(id) => replaceDraft(toggleResourceChapterScope(draft, id))} />
      <ChoiceJsonField label={ui.form.metadata} value={draft.metadata} expected="object" onChange={(value) => updateField("metadata", value)} />
    </div>
  );
}
