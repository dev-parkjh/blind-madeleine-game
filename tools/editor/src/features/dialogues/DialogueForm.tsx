import { useUiText } from "../../editorText";
import { CheckboxList, SelectField, SelectLiteralField, TextField, ToggleField } from "../../components/EditorControls";
import { normalizeJsonObject } from "../../lib/records";
import { asArray } from "../../lib/resourceConfig";
import type { ResourceRecord, ResourceSummary } from "../../types";
import type { ResourceFormCommonProps } from "../resources/resourceFormTypes";
import { getResourceChapterScopeIds, toggleResourceChapterScope } from "../resources/resourceScope";
import { ChoiceJsonField } from "./ChoiceJsonField";
import { InvestigationMapEditor } from "./InvestigationMapEditor";
import {
  defaultStatementNotebookScope,
  getStatementNotebookScope,
  isStatementNotebookScopeConfigured,
  normalizeDialoguePresentationMode,
  toggleNotebookScopeId,
  withDialogueMetadataEntry,
  withDialoguePresentationMode,
  withStatementNotebookScope,
  withoutStatementNotebookScope
} from "./dialogueMetadata";
import { buildDialogueStartOptions } from "./dialogueNodeOptions";

export function DialogueForm({
  draft,
  references,
  updateField,
  updateMetadataField,
  replaceDraft
}: ResourceFormCommonProps) {
  const ui = useUiText();
  const metadata = normalizeJsonObject(draft.metadata);
  const presentationMode = normalizeDialoguePresentationMode(metadata.presentation_mode);
  return (
    <div className="form-grid">
      <TextField label={ui.form.id} value={draft.id || ""} onChange={(value) => updateField("id", value)} readOnly />
      <TextField label={ui.form.label} value={draft.label} onChange={(value) => updateField("label", value)} />
      <TextField label={ui.form.description} value={draft.description} onChange={(value) => updateField("description", value)} multiline />
      <CheckboxList label={ui.form.chapters} values={getResourceChapterScopeIds(draft)} options={references.chapters} onToggle={(id) => replaceDraft(toggleResourceChapterScope(draft, id))} />
      <SelectField label={ui.form.startNode} value={draft.start || ""} options={buildDialogueStartOptions(draft, references.characters)} onChange={(value) => updateField("start", value)} />
      <SelectLiteralField label={ui.form.presentationMode} value={presentationMode} options={["normal", "talk", "investigation", "statement"]} labels={ui.presentationModes} onChange={(value) => replaceDraft(withDialoguePresentationMode(draft, value))} />
      <SelectField label={ui.form.nextDialogue} value={metadata.next_dialogue || ""} options={references.dialogues.filter((dialogue) => dialogue.id !== String(draft.id || ""))} onChange={(value) => replaceDraft(withDialogueMetadataEntry(draft, "next_dialogue", value))} />
      {(presentationMode === "talk" || presentationMode === "investigation") && (
        <>
          <ChoiceJsonField label="locations" value={metadata.locations} expected="object_or_array" onChange={(value) => updateMetadataField("locations", value)} />
          {presentationMode === "investigation" && (
            <InvestigationMapEditor
              locations={metadata.locations ?? metadata.places}
              map={metadata.map ?? metadata.investigation_map}
              nodes={asArray<ResourceRecord>(draft.nodes)}
              onLocationsChange={(value) => updateMetadataField("locations", value)}
              onMapChange={(value) => updateMetadataField("map", value)}
            />
          )}
        </>
      )}
      {(presentationMode === "statement" || isStatementNotebookScopeConfigured(metadata)) && (
        <StatementNotebookScopeEditor
          draft={draft}
          items={references.items}
          characters={references.characters}
          replaceDraft={replaceDraft}
        />
      )}
      <ChoiceJsonField label={ui.form.metadata} value={draft.metadata} expected="object" onChange={(value) => updateField("metadata", value)} />
    </div>
  );
}

function StatementNotebookScopeEditor({
  draft,
  characters,
  items,
  replaceDraft
}: {
  draft: ResourceRecord;
  characters: ResourceSummary[];
  items: ResourceSummary[];
  replaceDraft: (nextDraft: ResourceRecord) => void;
}) {
  const ui = useUiText();
  const metadata = normalizeJsonObject(draft.metadata);
  const configured = isStatementNotebookScopeConfigured(metadata);
  const scope = getStatementNotebookScope(metadata);
  return (
    <fieldset className="wide checkbox-list">
      <legend>{ui.form.statementNotebook}</legend>
      <ToggleField
        label={ui.form.customStatementScope}
        checked={configured}
        onChange={(checked) => replaceDraft(checked
          ? withStatementNotebookScope(draft, defaultStatementNotebookScope(characters, items))
          : withoutStatementNotebookScope(draft))}
      />
      {!configured && <span className="muted">{ui.form.defaultStatementScope}</span>}
      {configured && (
        <>
          <CheckboxList
            label={ui.form.notebookCharacters}
            values={scope.characters}
            options={characters}
            onToggle={(id) => replaceDraft(withStatementNotebookScope(draft, toggleNotebookScopeId(scope, "characters", id)))}
          />
          <CheckboxList
            label={ui.form.notebookItems}
            values={scope.items}
            options={items}
            onToggle={(id) => replaceDraft(withStatementNotebookScope(draft, toggleNotebookScopeId(scope, "items", id)))}
          />
        </>
      )}
    </fieldset>
  );
}
