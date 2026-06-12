import { useUiText } from "../../editorText";
import { CheckboxList, TextField, ToggleField } from "../../components/EditorControls";
import { normalizeBooleanFlag } from "../../lib/numeric";
import type { ResourceFormCommonProps } from "../resources/resourceFormTypes";
import { getResourceChapterScopeIds, toggleResourceChapterScope } from "../resources/resourceScope";
import { ChoiceJsonField } from "../dialogues/ChoiceJsonField";
import { PortraitEditor } from "./PortraitEditor";
import { SpectrumOffsetEditor } from "./SpectrumOffsetEditor";

export function CharacterForm({
  disabled,
  draft,
  references,
  updateField,
  updateMetadataField,
  uploadFile,
  replaceDraft
}: ResourceFormCommonProps) {
  const ui = useUiText();
  return (
    <div className="form-grid">
      <TextField label={ui.form.id} value={draft.id || ""} onChange={(value) => updateField("id", value)} readOnly />
      <TextField label={ui.form.displayName} value={draft.display_name} onChange={(value) => updateField("display_name", value)} />
      <TextField
        label={ui.form.nameColor}
        previewText={String(draft.display_name || draft.id || "")}
        value={draft.name_color}
        onChange={(value) => updateField("name_color", value)}
        type="color-text"
      />
      <ToggleField label={ui.form.protagonist} checked={normalizeBooleanFlag(draft.protagonist ?? draft.is_protagonist ?? draft.main_character)} onChange={(checked) => updateField("protagonist", checked)} />
      <TextField label={ui.form.description} value={draft.description} onChange={(value) => updateField("description", value)} multiline />
      <TextField label={ui.form.voiceProfile} value={draft.metadata?.voice_profile || ""} onChange={(value) => updateMetadataField("voice_profile", value)} />
      <CheckboxList label={ui.form.chapters} values={getResourceChapterScopeIds(draft)} options={references.chapters} onToggle={(id) => replaceDraft(toggleResourceChapterScope(draft, id))} />
      <PortraitEditor disabled={disabled} draft={draft} updateField={updateField} uploadFile={uploadFile} />
      <SpectrumOffsetEditor draft={draft} updateField={updateField} />
      <ChoiceJsonField label={ui.form.metadata} value={draft.metadata} expected="object" onChange={(value) => updateField("metadata", value)} />
    </div>
  );
}
