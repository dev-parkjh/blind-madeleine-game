import type { DragEvent as ReactDragEvent, MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { useState } from "react";
import { Icon, SelectField, SelectLiteralField, TextField, ToggleField } from "../../components/EditorControls";
import { getDialogueVisiblePreviewText, RichTextPreview } from "../../components/RichTextPreview";
import type { ReferenceResources } from "../../editorTypes";
import type { DialogueTextContextTarget } from "../../lib/dialogueTextContextMenu";
import { asArray } from "../../lib/resourceConfig";
import type { ResourceRecord, ResourceSummary } from "../../types";
import { ChoiceJsonField } from "./ChoiceJsonField";
import { ChoiceProgressionTools } from "./ChoiceProgressionTools";
import {
  defaultChoiceRecord,
  getChoiceExitTalk,
  getChoiceMoveToLocationId,
  getChoicePresentTarget,
  getChoiceShowHeardCheck,
  getChoiceTopicIdEditorValue,
  getChoiceTrackHeard,
  parseStoryFlagEditorValue,
  withChoiceCondition,
  withChoiceExitTalk,
  withChoiceMoveToLocation,
  withChoicePresentTarget,
  withChoiceSetFlag,
  withChoiceShowHeardCheck,
  withChoiceTopicId,
  withChoiceTrackHeard
} from "./dialogueChoiceModel";

export function DialogueChoicesEditor({
  node,
  references,
  locationOptions = [],
  nodeOptions,
  updateNode,
  onOpenDialogueTextContextMenu,
  topicMode = false,
  compact = false,
  renderLayoutPreview
}: {
  node: ResourceRecord;
  references: ReferenceResources;
  locationOptions?: ResourceSummary[];
  nodeOptions: ResourceSummary[];
  updateNode: (node: ResourceRecord) => void;
  onOpenDialogueTextContextMenu?: (
    event: ReactMouseEvent<HTMLTextAreaElement | HTMLInputElement>,
    config: Omit<DialogueTextContextTarget, "textarea">
  ) => void;
  topicMode?: boolean;
  compact?: boolean;
  renderLayoutPreview?: (choices: ResourceRecord[], node: ResourceRecord) => ReactNode;
}) {
  const choices = asArray<ResourceRecord>(node.choices);
  const [choiceDragIndex, setChoiceDragIndex] = useState<number | null>(null);
  const [choiceDropTarget, setChoiceDropTarget] = useState<{ index: number; position: "before" | "after" } | null>(null);

  function setChoices(nextChoices: ResourceRecord[]) {
    updateNode({ ...node, choices: nextChoices });
  }

  function updateChoice(index: number, nextChoice: ResourceRecord) {
    setChoices(choices.map((choice, choiceIndex) => choiceIndex === index ? nextChoice : choice));
  }

  function addChoice() {
    setChoices([...choices, defaultChoiceRecord()]);
  }

  function removeChoice(index: number) {
    setChoices(choices.filter((_, choiceIndex) => choiceIndex !== index));
  }

  function moveChoiceTo(fromIndex: number, toIndex: number) {
    if (fromIndex < 0 || fromIndex >= choices.length) return;
    const clampedTo = Math.max(0, Math.min(toIndex, choices.length - 1));
    if (fromIndex === clampedTo) return;
    const nextChoices = [...choices];
    const [choice] = nextChoices.splice(fromIndex, 1);
    nextChoices.splice(clampedTo, 0, choice);
    setChoices(nextChoices);
  }

  function moveChoice(index: number, direction: -1 | 1) {
    moveChoiceTo(index, index + direction);
  }

  function handleChoiceDragStart(event: ReactDragEvent<HTMLElement>, index: number) {
    setChoiceDragIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }

  function handleChoiceDragOver(event: ReactDragEvent<HTMLElement>, index: number) {
    event.preventDefault();
    if (choiceDragIndex === null || index === choiceDragIndex) {
      setChoiceDropTarget(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const position = event.clientY < rect.top + rect.height * 0.5 ? "before" : "after";
    setChoiceDropTarget({ index, position });
    event.dataTransfer.dropEffect = "move";
  }

  function clearChoiceDrag() {
    setChoiceDragIndex(null);
    setChoiceDropTarget(null);
  }

  function handleChoiceDrop(event: ReactDragEvent<HTMLElement>, index: number) {
    event.preventDefault();
    const fromIndex = choiceDragIndex ?? Number(event.dataTransfer.getData("text/plain"));
    if (!Number.isFinite(fromIndex) || fromIndex < 0) {
      clearChoiceDrag();
      return;
    }
    let toIndex = index;
    if (choiceDropTarget?.position === "after") toIndex += 1;
    if (fromIndex < toIndex) toIndex -= 1;
    clearChoiceDrag();
    moveChoiceTo(fromIndex, toIndex);
  }

  const editorTitle = topicMode ? "대화 주제" : "Choices";
  const addLabel = topicMode ? "주제" : "선택지";
  const emptyText = topicMode
    ? "대화 주제 없음 — 주제를 추가하면 들은 항목 체크와 조건 해금이 작동합니다."
    : "선택지 없음 — next 또는 순차 흐름을 사용합니다.";
  const countText = choices.length > 0
    ? (topicMode ? `${choices.length} topics` : `${choices.length} branches`)
    : "단일 흐름";

  return (
    <details className={`choices-editor ${topicMode ? "topic-mode" : ""} ${compact ? "compact" : ""}`} open={choices.length > 0}>
      <summary>
        <strong>{editorTitle}</strong>
        <span>{countText}</span>
        <button type="button" onClick={(event) => {
          event.preventDefault();
          addChoice();
        }}>
          <Icon name="Add" />{addLabel}
        </button>
      </summary>
      <div className="choices-editor-body">
        {choices.length === 0 ? (
          <p className="empty-state">{emptyText}</p>
        ) : (
          <>
            {renderLayoutPreview?.(choices, node)}
            <div className="choice-card-list">
              {choices.map((choice, index) => (
                <article
                  className={[
                    "choice-editor-card",
                    choiceDragIndex === index ? "dragging" : "",
                    choiceDropTarget?.index === index ? `drop-${choiceDropTarget.position}` : ""
                  ].filter(Boolean).join(" ")}
                  key={index}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setChoiceDropTarget(null);
                  }}
                  onDragOver={(event) => handleChoiceDragOver(event, index)}
                  onDrop={(event) => handleChoiceDrop(event, index)}
                >
                  <div className="structured-header">
                    <div className="choice-title-group">
                      <button
                        aria-label={`Choice ${index + 1} drag reorder`}
                        className="choice-drag-handle"
                        draggable
                        onDragEnd={clearChoiceDrag}
                        onDragStart={(event) => handleChoiceDragStart(event, index)}
                        type="button"
                      >
                        <Icon name="DragIndicator" />
                      </button>
                      <span>Choice {index + 1}</span>
                    </div>
                    <div className="inline-actions">
                      <button aria-label={`Choice ${index + 1} up`} disabled={index === 0} type="button" onClick={() => moveChoice(index, -1)}>
                        <Icon name="KeyboardArrowUp" />
                      </button>
                      <button aria-label={`Choice ${index + 1} down`} disabled={index >= choices.length - 1} type="button" onClick={() => moveChoice(index, 1)}>
                        <Icon name="KeyboardArrowDown" />
                      </button>
                      <button className="danger-action" type="button" onClick={() => removeChoice(index)}>
                        <Icon name="Delete" />삭제
                      </button>
                    </div>
                  </div>
                  <div className="form-grid compact">
                    <TextField
                      label="Topic ID"
                      value={getChoiceTopicIdEditorValue(choice)}
                      onChange={(value) => updateChoice(index, withChoiceTopicId(choice, value))}
                    />
                    <ToggleField
                      label="들은 상태 추적"
                      checked={getChoiceTrackHeard(choice)}
                      onChange={(checked) => updateChoice(index, withChoiceTrackHeard(choice, checked))}
                    />
                    <ToggleField
                      label="체크 표시"
                      checked={getChoiceShowHeardCheck(choice)}
                      onChange={(checked) => updateChoice(index, withChoiceShowHeardCheck(choice, checked))}
                    />
                    {topicMode && (
                      <ToggleField
                        label="대화 종료"
                        checked={getChoiceExitTalk(choice)}
                        onChange={(checked) => updateChoice(index, withChoiceExitTalk(choice, checked))}
                      />
                    )}
                    <TextField
                      label="Label"
                      value={choice.label || ""}
                      onChange={(value) => updateChoice(index, { ...choice, label: value })}
                      onContextMenu={onOpenDialogueTextContextMenu ? (event) => onOpenDialogueTextContextMenu(event, {
                        kind: "choice",
                        getText: () => String(choice.label || ""),
                        onTextChange: (nextText) => updateChoice(index, { ...choice, label: nextText })
                      }) : undefined}
                    />
                    <TextField
                      label="Text"
                      value={choice.text || ""}
                      onChange={(value) => updateChoice(index, { ...choice, text: value })}
                      onContextMenu={onOpenDialogueTextContextMenu ? (event) => onOpenDialogueTextContextMenu(event, {
                        kind: "choice",
                        getText: () => String(choice.text || ""),
                        onTextChange: (nextText) => updateChoice(index, { ...choice, text: nextText })
                      }) : undefined}
                    />
                    <SelectField label="Next" value={choice.next || ""} options={nodeOptions} onChange={(value) => updateChoice(index, { ...choice, next: value })} />
                    {locationOptions.length > 0 && (
                      <SelectField
                        label="Move to"
                        value={getChoiceMoveToLocationId(choice)}
                        options={locationOptions}
                        onChange={(value) => updateChoice(index, withChoiceMoveToLocation(choice, value))}
                      />
                    )}
                    <SelectField
                      label="Present item"
                      value={getChoicePresentTarget(choice).kind === "item" ? getChoicePresentTarget(choice).id : ""}
                      options={references.items}
                      onChange={(value) => updateChoice(index, withChoicePresentTarget(choice, value ? "item" : "", value))}
                    />
                    <SelectField
                      label="Present character"
                      value={getChoicePresentTarget(choice).kind === "character" ? getChoicePresentTarget(choice).id : ""}
                      options={references.characters}
                      onChange={(value) => updateChoice(index, withChoicePresentTarget(choice, value ? "character" : "", value))}
                    />
                  </div>
                  <div className="choice-rich-preview-grid">
                    <RichTextPreview compact references={references} text={String(choice.label || "")} />
                    <RichTextPreview compact references={references} text={String(choice.text || "")} />
                  </div>
                  <ChoiceProgressionTools
                    choice={choice}
                    nodeOptions={nodeOptions}
                    references={references}
                    onAddCondition={(condition) => updateChoice(index, withChoiceCondition(choice, condition))}
                    onSetFlag={(key, value) => updateChoice(index, withChoiceSetFlag(choice, key, value))}
                  />
                  <div className="form-grid">
                    <ChoiceJsonField
                      label="set_flags"
                      value={choice.set_flags}
                      expected="object"
                      onChange={(value) => updateChoice(index, { ...choice, set_flags: value })}
                    />
                    <ChoiceJsonField
                      label="conditions"
                      value={choice.conditions}
                      expected="array"
                      onChange={(value) => updateChoice(index, { ...choice, conditions: value })}
                    />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </details>
  );
}
