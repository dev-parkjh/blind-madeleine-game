import { useUiText } from "../../editorText";
import { CheckboxList, SelectField, TextField } from "../../components/EditorControls";
import type { ResourceFormCommonProps } from "../resources/resourceFormTypes";
import { ChoiceJsonField } from "../dialogues/ChoiceJsonField";
import { ChapterArtEditor } from "./ChapterArtEditor";
import {
  getChapterBgmId,
  getChapterDialogueIds,
  getChapterStartDialogueId,
  getChapterTitleEditorValue,
  toggleChapterDialogueId
} from "./chapterModel";

export function ChapterForm({
  disabled,
  draft,
  references,
  updateField,
  uploadFile,
  replaceDraft,
  savedJsonText,
  notify
}: ResourceFormCommonProps) {
  const ui = useUiText();
  return (
    <div className="form-grid">
      <TextField label={ui.form.id} value={draft.id || ""} onChange={(value) => updateField("id", value)} readOnly />
      <TextField label={ui.form.title} value={getChapterTitleEditorValue(draft)} onChange={(value) => updateField("title", value)} />
      <TextField label={ui.form.order} value={draft.order} onChange={(value) => updateField("order", Number(value) || 0)} type="number" />
      <SelectField label={ui.form.startDialogue} value={getChapterStartDialogueId(draft)} options={references.dialogues} onChange={(value) => updateField("start_dialogue", value)} />
      <SelectField label="BGM" value={getChapterBgmId(draft)} options={references.storyAssets} onChange={(value) => updateField("bgm", value)} />
      <TextField label={ui.form.description} value={draft.description} onChange={(value) => updateField("description", value)} multiline />
      <CheckboxList label={ui.form.dialogues} values={getChapterDialogueIds(draft)} options={references.dialogues} onToggle={(id) => replaceDraft(toggleChapterDialogueId(draft, id))} />
      <ChoiceJsonField label={ui.form.metadata} value={draft.metadata} expected="object" onChange={(value) => updateField("metadata", value)} />
      <ChapterArtEditor
        disabled={disabled}
        draft={draft}
        notify={notify}
        replaceDraft={replaceDraft}
        savedJsonText={savedJsonText}
        updateField={updateField}
        uploadFile={uploadFile}
      />
    </div>
  );
}
