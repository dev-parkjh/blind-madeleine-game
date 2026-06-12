import type { MouseEvent as ReactMouseEvent } from "react";
import { useMemo } from "react";
import { Icon, NumberField, SelectField, SelectLiteralField, TextField, ToggleField } from "../../components/EditorControls";
import { getDialogueVisiblePreviewText, RichTextPreview } from "../../components/RichTextPreview";
import type { DialogueNodeMode, ReferenceResources } from "../../editorTypes";
import { useUiText } from "../../editorText";
import type { DialogueTextContextTarget } from "../../lib/dialogueTextContextMenu";
import type { ResourceRecord, ResourceSummary } from "../../types";
import { AcquireInfoEditor, getNodeAcquireInfoEditorValue, withNodeAcquireInfo } from "./AcquireInfoEditor";
import { ChoiceLayoutPreview } from "./ChoiceLayoutPreview";
import { DialogueChoicesEditor } from "./DialogueChoicesEditor";
import { NodePopupsEditor } from "./NodePopupsEditor";
import {
  dialogueNodeModeLabels,
  dialogueNodeModeOptions,
  dialogueNodeTitle,
  getDialogueNodeMode,
  getNodeCutsceneEditorValue,
  getStageNodeHoldEditorValue,
  patchCutscene,
  patchStageHold,
  withDialogueMode,
  withNodeCutscene,
  withStageMode
} from "./dialogueNodeModel";
import { buildNodeSelectOptions, dialogueNodeSummary } from "./dialogueNodeOptions";
import { getNodePopupsEditorValue, withNodePopups } from "./dialoguePopupModel";
import { StageCastEditor } from "./StageCastEditor";
import {
  getNodeFocusTargets,
  getNodeSpeakerMystery,
  withNodeFocusTargets,
  withNodeSpeakerMystery,
  withSpeakerStageCastDefaults
} from "./stageCastModel";

export function NestedDialogueNodeEditor({
  active,
  index,
  node,
  nodeAutoPrefix,
  nodes,
  onSelect,
  onOpenDialogueTextContextMenu,
  references,
  updateNode,
  removeNode,
  statementTargetKey
}: {
  active?: boolean;
  index: number;
  node: ResourceRecord;
  nodeAutoPrefix: string;
  nodes: ResourceRecord[];
  onSelect?: () => void;
  onOpenDialogueTextContextMenu?: (
    event: ReactMouseEvent<HTMLTextAreaElement | HTMLInputElement>,
    config: Omit<DialogueTextContextTarget, "textarea">
  ) => void;
  references: ReferenceResources;
  updateNode: (node: ResourceRecord) => void;
  removeNode: () => void;
  statementTargetKey?: string;
}) {
  const ui = useUiText();
  const mode = getDialogueNodeMode(node);
  const cutscene = getNodeCutsceneEditorValue(node);
  const nodeOptions = useMemo(
    () => buildNodeSelectOptions(nodes, nodeAutoPrefix, references.characters),
    [nodeAutoPrefix, nodes, references.characters]
  );

  return (
    <details
      className={`statement-child-node ${active ? "active" : ""}`}
      data-statement-target={statementTargetKey}
      open={active || index === 0}
    >
      <summary onClick={onSelect}>
        <strong>{index + 1}. {dialogueNodeTitle(node, references, ui)}</strong>
        <span>{mode === "dialogue" ? getDialogueVisiblePreviewText(node.text).slice(0, 52) || "빈 대사" : dialogueNodeSummary(node, references)}</span>
      </summary>
      <div className="nested-node-grid">
        <div className="structured-header">
          <span>Nested node</span>
          <button className="danger-action" type="button" onClick={removeNode}><Icon name="Delete" />삭제</button>
        </div>
        <div className="form-grid compact">
          <SelectLiteralField
            label={ui.form.mode}
            value={mode}
            options={dialogueNodeModeOptions}
            labels={dialogueNodeModeLabels(ui)}
            onChange={(value) => {
              const nextMode = value as DialogueNodeMode;
              updateNode(nextMode === "cutscene"
                ? withNodeCutscene(node, getNodeCutsceneEditorValue(node))
                : nextMode === "stage"
                  ? withStageMode(node)
                  : withDialogueMode(node));
            }}
          />
          {mode === "dialogue" && (
            <SelectField
              label={ui.form.speaker}
              value={node.speaker || "narrator"}
              options={[{ id: "narrator", title: "narrator", subtitle: "built-in", type: "characters", isProtagonist: true } as ResourceSummary, ...references.characters]}
              onChange={(value) => updateNode(withSpeakerStageCastDefaults(node, value, nodes, index, references.characters))}
            />
          )}
        </div>
        {mode === "cutscene" ? (
          <div className="form-grid compact">
            <NumberField label={ui.form.fadeIn} value={cutscene.fade_in} min={0} step={0.1} resetValue={0} onChange={(value) => updateNode(patchCutscene(node, "fade_in", value))} />
            <NumberField label={ui.form.hold} value={cutscene.hold} min={0} step={0.1} resetValue={1} onChange={(value) => updateNode(patchCutscene(node, "hold", value))} />
            <NumberField label={ui.form.fadeOut} value={cutscene.fade_out} min={0} step={0.1} resetValue={1} onChange={(value) => updateNode(patchCutscene(node, "fade_out", value))} />
            <TextField label={ui.form.image} value={cutscene.image} onChange={(value) => updateNode(patchCutscene(node, "image", value))} />
          </div>
        ) : mode === "stage" ? (
          <>
            <div className="form-grid compact">
              <SelectField label={ui.form.nextNode} value={node.next || ""} options={nodeOptions} onChange={(value) => updateNode({ ...node, next: value })} />
              <NumberField label={ui.form.hold} value={getStageNodeHoldEditorValue(node)} min={0} step={0.1} resetValue={0} onChange={(value) => updateNode(patchStageHold(node, value))} />
            </div>
            <StageCastEditor
              characters={references.characters}
              nodes={nodes}
              selectedNodeIndex={index}
              speakerId=""
              speakerMystery={false}
              focusTargets={getNodeFocusTargets(node)}
              stageCast={node.stage_cast}
              onFocusTargetsChange={(focusTargets) => updateNode(withNodeFocusTargets(node, focusTargets))}
              onChange={(stageCast) => updateNode({ ...node, stage_cast: stageCast })}
            />
          </>
        ) : (
          <>
            <div className="form-grid compact">
              <SelectField label={ui.form.nextNode} value={node.next || ""} options={nodeOptions} onChange={(value) => updateNode({ ...node, next: value })} />
              <ToggleField label={ui.form.speakerMystery} checked={getNodeSpeakerMystery(node)} onChange={(checked) => updateNode(withNodeSpeakerMystery(node, checked, references.characters))} />
            </div>
            <TextField
              label={ui.form.text}
              multiline
              value={node.text || ""}
              onChange={(value) => updateNode({ ...node, text: value })}
              onContextMenu={onOpenDialogueTextContextMenu ? (event) => onOpenDialogueTextContextMenu(event, {
                kind: "dialogue",
                getText: () => String(node.text || ""),
                onTextChange: (nextText) => updateNode({ ...node, text: nextText })
              }) : undefined}
            />
            <RichTextPreview compact references={references} text={node.text || ""} />
            <DialogueChoicesEditor
              compact
              node={node}
              nodeOptions={buildNodeSelectOptions(nodes, nodeAutoPrefix, references.characters)}
              renderLayoutPreview={(choices, choiceNode) => <ChoiceLayoutPreview choices={choices} node={choiceNode} />}
              onOpenDialogueTextContextMenu={onOpenDialogueTextContextMenu}
              references={references}
              updateNode={updateNode}
            />
            <StageCastEditor
              characters={references.characters}
              nodes={nodes}
              selectedNodeIndex={index}
              speakerId={String(node.speaker || "")}
              speakerMystery={getNodeSpeakerMystery(node)}
              focusTargets={getNodeFocusTargets(node)}
              stageCast={node.stage_cast}
              onFocusTargetsChange={(focusTargets) => updateNode(withNodeFocusTargets(node, focusTargets))}
              onChange={(stageCast) => updateNode({ ...node, stage_cast: stageCast })}
            />
            <AcquireInfoEditor
              references={references}
              value={getNodeAcquireInfoEditorValue(node)}
              onChange={(acquireInfo) => updateNode(withNodeAcquireInfo(node, acquireInfo))}
            />
            <NodePopupsEditor
              node={node}
              popups={getNodePopupsEditorValue(node)}
              references={references}
              onChange={(popups) => updateNode(withNodePopups(node, popups))}
            />
          </>
        )}
      </div>
    </details>
  );
}
