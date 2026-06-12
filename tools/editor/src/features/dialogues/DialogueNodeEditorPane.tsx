import type { MouseEvent as ReactMouseEvent, MutableRefObject } from "react";
import type { DialogueNodeMode, ReferenceResources } from "../../editorTypes";
import { useUiText } from "../../editorText";
import { Icon, NumberField, SelectField, SelectLiteralField, TextField, ToggleField } from "../../components/EditorControls";
import { RichTextPreview } from "../../components/RichTextPreview";
import type { DialogueTextContextTarget } from "../../lib/dialogueTextContextMenu";
import { normalizeJsonObject } from "../../lib/records";
import type { ResourceRecord, ResourceSummary } from "../../types";
import { ChoiceJsonField } from "./ChoiceJsonField";
import { ChoiceLayoutPreview } from "./ChoiceLayoutPreview";
import { DialogueChoicesEditor } from "./DialogueChoicesEditor";
import { DialogueStageTagQuickInsert, type DialogueStageTagTarget } from "./DialogueNodeBadges";
import { DialogueNodeBackgroundEditor } from "./DialogueNodeBackgroundEditor";
import { DialogueTagPalette, type TagAction } from "./DialogueTagPalette";
import { StageCastEditor, type StageCastActualPreviewContext } from "./StageCastEditor";
import { NodePopupsEditor } from "./NodePopupsEditor";
import { AcquireInfoEditor, getNodeAcquireInfoEditorValue, withNodeAcquireInfo } from "./AcquireInfoEditor";
import {
  dialogueNodeModeLabels,
  dialogueNodeModeOptions,
  getDialogueNodeMode,
  getNodeCutsceneEditorValue,
  getStageNodeHoldEditorValue,
  isCutsceneNode,
  isStageNode,
  patchCutscene,
  patchStageHold,
  withDialogueMode,
  withNodeCutscene,
  withStageMode
} from "./dialogueNodeModel";
import { getNodePopupsEditorValue, withNodePopups } from "./dialoguePopupModel";
import { removeTextRangeWithTextareaUndo } from "./dialogueTextEditing";
import {
  getNodeFocusTargets,
  getNodeSpeakerMystery,
  withNodeFocusTargets,
  withNodeSpeakerMystery,
  withSpeakerStageCastDefaults
} from "./stageCastModel";

export function DialogueNodeEditorPane({
  investigationMode,
  locationOptions,
  nodeOptions,
  nodes,
  nodeTextRef,
  onDuplicateNode,
  onInsertEnterTag,
  onInsertExitTag,
  onInsertColorTag,
  onInsertNodeAfter,
  onInsertTag,
  onOpenDialogueTextContextMenu,
  onOpenNodeList,
  onRemoveNode,
  onSelectNodeIndex,
  onUpdateNode,
  references,
  selectedNode,
  selectedNodeIndex,
  stageCastPreviewContext,
  stageTagTargets,
  talkMode
}: {
  investigationMode: boolean;
  locationOptions: ResourceSummary[];
  nodeOptions: ResourceSummary[];
  nodes: ResourceRecord[];
  nodeTextRef: MutableRefObject<HTMLTextAreaElement | null>;
  onDuplicateNode: (index: number) => void;
  onInsertEnterTag: (characterId: string) => void;
  onInsertExitTag: (characterId: string) => void;
  onInsertColorTag: (color: string) => void;
  onInsertNodeAfter: (index: number, mode: DialogueNodeMode) => void;
  onInsertTag: (action: TagAction) => void;
  onOpenDialogueTextContextMenu: (
    event: ReactMouseEvent<HTMLTextAreaElement | HTMLInputElement>,
    config: Omit<DialogueTextContextTarget, "textarea">
  ) => void;
  onOpenNodeList: () => void;
  onRemoveNode: (index: number) => void;
  onSelectNodeIndex: (index: number) => void;
  onUpdateNode: (index: number, node: ResourceRecord) => void;
  references: ReferenceResources;
  selectedNode: ResourceRecord | undefined;
  selectedNodeIndex: number;
  stageCastPreviewContext?: StageCastActualPreviewContext;
  stageTagTargets: DialogueStageTagTarget[];
  talkMode: boolean;
}) {
  const ui = useUiText();
  if (!selectedNode) return <p className="empty-state">노드를 추가하거나 선택하세요.</p>;

  return (
    <>
      <div className="node-editor-toolbar">
        <button className="node-list-toggle-button" type="button" onClick={onOpenNodeList}>
          <Icon name="Menu" />노드 목록
        </button>
        <div className="node-stepper" aria-label="노드 이동">
          <button type="button" disabled={selectedNodeIndex <= 0} onClick={() => onSelectNodeIndex(Math.max(0, selectedNodeIndex - 1))}>
            이전
          </button>
          <span>{selectedNodeIndex + 1} / {nodes.length}</span>
          <button type="button" disabled={selectedNodeIndex >= nodes.length - 1} onClick={() => onSelectNodeIndex(Math.min(nodes.length - 1, selectedNodeIndex + 1))}>
            다음
          </button>
          <button type="button" onClick={() => onInsertNodeAfter(selectedNodeIndex, getDialogueNodeMode(selectedNode))}>
            <Icon name="Add" />추가
          </button>
          <button type="button" onClick={() => onDuplicateNode(selectedNodeIndex)}>
            <Icon name="ContentCopy" />복사
          </button>
        </div>
        <SelectLiteralField
          label={ui.form.mode}
          value={getDialogueNodeMode(selectedNode)}
          options={dialogueNodeModeOptions}
          labels={dialogueNodeModeLabels(ui)}
          onChange={(value) => {
            const nextMode = value as DialogueNodeMode;
            onUpdateNode(selectedNodeIndex, nextMode === "cutscene"
              ? withNodeCutscene(selectedNode, getNodeCutsceneEditorValue(selectedNode))
              : nextMode === "stage"
                ? withStageMode(selectedNode)
                : withDialogueMode(selectedNode));
          }}
        />
        <button className="danger-action" type="button" onClick={() => onRemoveNode(selectedNodeIndex)}>
          <Icon name="Delete" />삭제
        </button>
      </div>

      {isCutsceneNode(selectedNode) ? (
        <div className="form-grid compact">
          <TextField label={ui.form.fadeIn} value={getNodeCutsceneEditorValue(selectedNode).fade_in} type="number" onChange={(value) => onUpdateNode(selectedNodeIndex, patchCutscene(selectedNode, "fade_in", Number(value)))} />
          <TextField label={ui.form.hold} value={getNodeCutsceneEditorValue(selectedNode).hold} type="number" onChange={(value) => onUpdateNode(selectedNodeIndex, patchCutscene(selectedNode, "hold", Number(value)))} />
          <TextField label={ui.form.fadeOut} value={getNodeCutsceneEditorValue(selectedNode).fade_out} type="number" onChange={(value) => onUpdateNode(selectedNodeIndex, patchCutscene(selectedNode, "fade_out", Number(value)))} />
          <TextField label={ui.form.image} value={getNodeCutsceneEditorValue(selectedNode).image} onChange={(value) => onUpdateNode(selectedNodeIndex, patchCutscene(selectedNode, "image", value))} />
        </div>
      ) : isStageNode(selectedNode) ? (
        <>
          <div className="form-grid compact">
            <SelectField label={ui.form.nextNode} value={selectedNode.next || ""} options={nodeOptions} onChange={(value) => onUpdateNode(selectedNodeIndex, { ...selectedNode, next: value })} />
            <NumberField label={ui.form.hold} value={getStageNodeHoldEditorValue(selectedNode)} min={0} step={0.1} resetValue={0} onChange={(value) => onUpdateNode(selectedNodeIndex, patchStageHold(selectedNode, value))} />
          </div>
          <StageCastEditor
            actualPreview={stageCastPreviewContext}
            characters={references.characters}
            nodes={nodes}
            selectedNodeIndex={selectedNodeIndex}
            speakerId=""
            speakerMystery={false}
            focusTargets={getNodeFocusTargets(selectedNode)}
            stageCast={selectedNode.stage_cast}
            onFocusTargetsChange={(focusTargets) => onUpdateNode(selectedNodeIndex, withNodeFocusTargets(selectedNode, focusTargets))}
            onChange={(stageCast) => onUpdateNode(selectedNodeIndex, { ...selectedNode, stage_cast: stageCast })}
          />
        </>
      ) : (
        <>
          <div className="form-grid compact">
            <SelectField
              label={ui.form.speaker}
              value={selectedNode.speaker || "narrator"}
              options={[{ id: "narrator", title: "narrator", subtitle: "built-in", type: "characters", isProtagonist: true } as ResourceSummary, ...references.characters]}
              onChange={(value) => onUpdateNode(selectedNodeIndex, withSpeakerStageCastDefaults(selectedNode, value, nodes, selectedNodeIndex, references.characters))}
            />
            <SelectField label={ui.form.nextNode} value={selectedNode.next || ""} options={nodeOptions} onChange={(value) => onUpdateNode(selectedNodeIndex, { ...selectedNode, next: value })} />
            <ToggleField label={ui.form.speakerMystery} checked={getNodeSpeakerMystery(selectedNode)} onChange={(checked) => onUpdateNode(selectedNodeIndex, withNodeSpeakerMystery(selectedNode, checked, references.characters))} />
            <ToggleField label={ui.form.textSoundMuted} checked={getNodeTextSoundMuted(selectedNode)} onChange={(checked) => onUpdateNode(selectedNodeIndex, withNodeTextSoundMuted(selectedNode, checked))} />
          </div>
          <DialogueNodeBackgroundEditor
            node={selectedNode}
            references={references}
            onTextChange={(nextText) => onUpdateNode(selectedNodeIndex, { ...selectedNode, text: nextText })}
          />
          <RichTextPreview
            references={references}
            text={selectedNode.text || ""}
            onRemoveRange={(range) => {
              const currentText = String(selectedNode.text || "");
              removeTextRangeWithTextareaUndo(nodeTextRef.current, currentText, range, (nextText) => {
                onUpdateNode(selectedNodeIndex, { ...selectedNode, text: nextText });
              });
            }}
          />
          <DialogueStageTagQuickInsert
            targets={stageTagTargets}
            onEnter={onInsertEnterTag}
            onExit={onInsertExitTag}
          />
          <label className="node-textarea">
            <span>{ui.form.text}</span>
            <textarea
              ref={nodeTextRef}
              value={selectedNode.text || ""}
              onChange={(event) => onUpdateNode(selectedNodeIndex, { ...selectedNode, text: event.target.value })}
              onContextMenu={(event) => onOpenDialogueTextContextMenu(event, {
                kind: "dialogue",
                getText: () => String(selectedNode.text || ""),
                onTextChange: (nextText) => onUpdateNode(selectedNodeIndex, { ...selectedNode, text: nextText })
              })}
              spellCheck={false}
            />
          </label>
          <DialogueTagPalette
            references={references}
            onInsertColorTag={onInsertColorTag}
            onInsertTag={onInsertTag}
          />
          <DialogueChoicesEditor
            node={selectedNode}
            nodeOptions={nodeOptions}
            locationOptions={locationOptions}
            renderLayoutPreview={(choices, choiceNode) => <ChoiceLayoutPreview choices={choices} node={choiceNode} />}
            onOpenDialogueTextContextMenu={onOpenDialogueTextContextMenu}
            references={references}
            topicMode={talkMode || investigationMode}
            updateNode={(nextNode) => onUpdateNode(selectedNodeIndex, nextNode)}
          />
          <StageCastEditor
            actualPreview={stageCastPreviewContext}
            characters={references.characters}
            nodes={nodes}
            selectedNodeIndex={selectedNodeIndex}
            speakerId={String(selectedNode.speaker || "")}
            speakerMystery={getNodeSpeakerMystery(selectedNode)}
            focusTargets={getNodeFocusTargets(selectedNode)}
            stageCast={selectedNode.stage_cast}
            onFocusTargetsChange={(focusTargets) => onUpdateNode(selectedNodeIndex, withNodeFocusTargets(selectedNode, focusTargets))}
            onChange={(stageCast) => onUpdateNode(selectedNodeIndex, { ...selectedNode, stage_cast: stageCast })}
          />
          <AcquireInfoEditor
            references={references}
            value={getNodeAcquireInfoEditorValue(selectedNode)}
            onChange={(acquireInfo) => onUpdateNode(selectedNodeIndex, withNodeAcquireInfo(selectedNode, acquireInfo))}
          />
          <div className="form-grid">
            <ChoiceJsonField
              label="set_flags_on_complete"
              value={selectedNode.set_flags_on_complete}
              expected="object"
              onChange={(value) => onUpdateNode(selectedNodeIndex, { ...selectedNode, set_flags_on_complete: value })}
            />
          </div>
          <NodePopupsEditor
            node={selectedNode}
            popups={getNodePopupsEditorValue(selectedNode)}
            references={references}
            onChange={(popups) => onUpdateNode(selectedNodeIndex, withNodePopups(selectedNode, popups))}
          />
        </>
      )}
    </>
  );
}

const textSoundMutedMetadataKeys = ["text_sound_muted", "typewriter_sound_muted", "dialogue_text_sound_muted"];

function getNodeTextSoundMuted(node: ResourceRecord) {
  const metadata = normalizeJsonObject(node.metadata);
  for (const key of textSoundMutedMetadataKeys) {
    if (Object.prototype.hasOwnProperty.call(metadata, key)) return Boolean(metadata[key]);
  }
  for (const key of textSoundMutedMetadataKeys) {
    if (Object.prototype.hasOwnProperty.call(node, key)) return Boolean(node[key]);
  }
  return false;
}

function withNodeTextSoundMuted(node: ResourceRecord, value: boolean) {
  const next: ResourceRecord = { ...node };
  const metadata = { ...normalizeJsonObject(next.metadata) };
  for (const key of textSoundMutedMetadataKeys) {
    delete metadata[key];
    delete next[key];
  }
  if (value) metadata.text_sound_muted = true;
  if (Object.keys(metadata).length > 0) next.metadata = metadata;
  else delete next.metadata;
  return next;
}
