import { useState } from "react";
import { Icon, SelectField, SelectLiteralField, TextField } from "../../components/EditorControls";
import type { ReferenceResources } from "../../editorTypes";
import { asArray } from "../../lib/resourceConfig";
import { normalizeJsonObject } from "../../lib/records";
import type { ResourceRecord, ResourceSummary } from "../../types";
import {
  buildChoiceConditionRecord,
  choiceConditionKindLabels,
  choiceConditionKinds,
  getChoiceConditionTargetOptions,
  parseStoryFlagEditorValue,
  type ChoiceConditionKind
} from "./dialogueChoiceModel";

export function ChoiceProgressionTools({
  choice,
  references,
  nodeOptions,
  onAddCondition,
  onSetFlag
}: {
  choice: ResourceRecord;
  references: ReferenceResources;
  nodeOptions: ResourceSummary[];
  onAddCondition: (condition: ResourceRecord) => void;
  onSetFlag: (key: string, value: unknown) => void;
}) {
  const [conditionKind, setConditionKind] = useState<ChoiceConditionKind>("item");
  const [conditionTarget, setConditionTarget] = useState("");
  const [conditionFlagValue, setConditionFlagValue] = useState("true");
  const [flagKey, setFlagKey] = useState("");
  const [flagValue, setFlagValue] = useState("true");
  const conditionTargetOptions = getChoiceConditionTargetOptions(conditionKind, references, nodeOptions);
  const usesSelectTarget = conditionTargetOptions.length > 0;
  const conditionCount = asArray(choice.conditions).length;
  const flagCount = Object.keys(normalizeJsonObject(choice.set_flags)).length;
  const canAddCondition = conditionTarget.trim().length > 0;
  const canSetFlag = flagKey.trim().length > 0;

  function addCondition() {
    if (!canAddCondition) return;
    onAddCondition(buildChoiceConditionRecord(conditionKind, conditionTarget, parseStoryFlagEditorValue(conditionFlagValue)));
    setConditionTarget("");
  }

  function setFlag() {
    if (!canSetFlag) return;
    onSetFlag(flagKey, parseStoryFlagEditorValue(flagValue));
    setFlagKey("");
  }

  return (
    <section className="choice-progression-tools">
      <div className="choice-progression-header">
        <strong><Icon name="Rule" />진행 조건</strong>
        <span>조건 {conditionCount}개 · 플래그 {flagCount}개</span>
      </div>
      <div className="choice-progression-grid">
        <SelectLiteralField
          label="조건"
          value={conditionKind}
          options={choiceConditionKinds}
          labels={choiceConditionKindLabels}
          onChange={(value) => {
            setConditionKind(value as ChoiceConditionKind);
            setConditionTarget("");
          }}
        />
        {usesSelectTarget ? (
          <SelectField label="대상" value={conditionTarget} options={conditionTargetOptions} onChange={setConditionTarget} />
        ) : (
          <TextField label={conditionKind === "flag" ? "Flag key" : "Topic ID"} value={conditionTarget} onChange={setConditionTarget} />
        )}
        {conditionKind === "flag" && (
          <TextField label="값" value={conditionFlagValue} onChange={setConditionFlagValue} />
        )}
        <div className="choice-progression-actions">
          <button type="button" disabled={!canAddCondition} onClick={addCondition}>
            <Icon name="AddTask" />조건 추가
          </button>
        </div>
      </div>
      <div className="choice-progression-grid flag-grid">
        <TextField label="Set flag" value={flagKey} onChange={setFlagKey} />
        <TextField label="값" value={flagValue} onChange={setFlagValue} />
        <div className="choice-progression-actions">
          <button type="button" disabled={!canSetFlag} onClick={setFlag}>
            <Icon name="OutlinedFlag" />플래그 설정
          </button>
        </div>
      </div>
    </section>
  );
}
