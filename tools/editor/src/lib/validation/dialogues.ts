import { asArray } from "../resourceConfig";
import type { ResourceRecord, ValidationIssue } from "../../types";
import type { NodeValidationContext, ResourceMaps } from "./shared";
import {
  getResourceChapterScopeValidationValue,
  isPlainRecord,
  normalizeSingleId,
  topicIdPattern,
  validateChapterScope
} from "./shared";
import {
  getNodeAcquireInfoValue,
  readAcquireInfo,
  validateAcquireInfo,
  validateStatementNotebookScope
} from "./dialogueAcquireInfo";
import { validateOptionalBoolean, validateSetFlags, validateStoryConditions } from "./dialogueConditions";
import { scanDialogueText } from "./dialogueText";
import { validateDialogueLocations } from "./dialogueLocations";
import { choiceIsPresentDefault, readChoiceMoveToLocationId, readChoicePresentTarget } from "./dialogueChoices";
import { validateNodePopup } from "./dialoguePopups";
import {
  buildResolvedNodeIdSet,
  buildStatementResolvedNodeIdSet,
  getNodeCutsceneValidationConfig,
  isCutsceneValidationNode,
  isStageValidationNode,
  validateCutscene,
  validateDialogueCameraZoom,
  validateFocusTargets,
  validatePortraitRigNodeMetadataDefaults,
  validateStageCast,
  validateStageEventTimeline,
  validateStageNodeHold,
  validateStatementReaction,
  validateTextSoundMutedAliases
} from "./dialogueNodeValidation";

export function validateDialogue(data: ResourceRecord, issues: ValidationIssue[], maps: ResourceMaps) {
  if (!data.label) issues.push({ severity: "warning", message: "대사 label이 비어 있습니다." });
  if (data.metadata !== undefined && !isPlainRecord(data.metadata)) {
    issues.push({ severity: "warning", message: "대사 metadata는 객체 JSON이어야 합니다." });
  }
  validateChapterScope(getResourceChapterScopeValidationValue(data), issues, maps);
  const metadata = data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata) ? data.metadata as ResourceRecord : {};
  if (metadata.next_dialogue && !maps.dialogues.has(String(metadata.next_dialogue))) {
    issues.push({ severity: "warning", message: `metadata.next_dialogue 대상이 없습니다: ${metadata.next_dialogue}` });
  }
  if (metadata.next_dialogue_blackout && !metadata.next_dialogue) {
    issues.push({ severity: "warning", message: "metadata.next_dialogue_blackout은 next_dialogue가 있을 때만 의미가 있습니다." });
  }
  if (metadata.presentation_mode !== undefined && !["normal", "talk", "investigation", "statement"].includes(String(metadata.presentation_mode))) {
    issues.push({ severity: "warning", message: `metadata.presentation_mode가 지원 범위가 아닙니다: ${metadata.presentation_mode}` });
  }
  validateStatementNotebookScope(metadata.statement_notebook, issues, maps);
  for (const field of ["next_dialogue_blackout_fade_duration", "next_dialogue_blackout_hold_duration"]) {
    if (metadata[field] !== undefined) {
      const duration = Number(metadata[field]);
      if (!Number.isFinite(duration) || duration < 0) {
        issues.push({ severity: "warning", message: `metadata.${field}는 0 이상 숫자여야 합니다.` });
      }
    }
  }

  const nodes = asArray<ResourceRecord>(data.nodes);
  const statementNodes = asArray<unknown>(data.statement_nodes);
  if (nodes.length === 0 && statementNodes.length === 0) {
    issues.push({ severity: "warning", message: "대사 nodes와 statement_nodes가 모두 비어 있습니다." });
  }

  const nodeIds = buildResolvedNodeIdSet(nodes, "@");
  const statementNodeIds = buildStatementResolvedNodeIdSet(statementNodes);
  const startNodeIds = new Set([...nodeIds, ...statementNodeIds]);
  const locationIds = validateDialogueLocations(metadata.locations ?? metadata.places, nodeIds, issues);
  const start = normalizeSingleId(data.start);
  if (start && !startNodeIds.has(start)) {
    issues.push({ severity: "warning", message: `start가 존재하지 않는 노드를 가리킵니다: ${start}` });
  }

  nodes.forEach((node, index) => validateDialogueNode(node, `nodes[${index}]`, issues, maps, {
    idSet: nodeIds,
    locationIds,
    listName: "nodes",
    nodeIndex: index,
    autoPrefix: "@"
  }));
  validateStageEventTimeline(nodes, "nodes", issues, maps);
  statementNodes.forEach((entry, index) => {
    if (typeof entry === "string") {
      const linkedId = normalizeSingleId(entry);
      if (!linkedId) {
        issues.push({ severity: "warning", message: `statement_nodes[${index}] 문자열 링크가 비어 있습니다.` });
      } else if (!nodeIds.has(linkedId)) {
        issues.push({ severity: "warning", message: `statement_nodes[${index}]가 없는 nodes ID를 가리킵니다: ${linkedId}` });
      }
      return;
    }
    if (!isPlainRecord(entry)) {
      issues.push({ severity: "warning", message: `statement_nodes[${index}]는 노드 객체 또는 nodes ID 문자열이어야 합니다.` });
      return;
    }
    validateDialogueNode(entry, `statement_nodes[${index}]`, issues, maps, {
      idSet: statementNodeIds,
      locationIds,
      listName: "statement",
      nodeIndex: index,
      autoPrefix: "@statement_"
    });
  });
}

function validateDialogueNode(node: ResourceRecord, path: string, issues: ValidationIssue[], maps: ResourceMaps, context: NodeValidationContext) {
  if (isCutsceneValidationNode(node)) {
    validateCutscene(getNodeCutsceneValidationConfig(node), path, issues);
    return;
  }

  if (isStageValidationNode(node)) {
    const next = String(node.next || "").trim();
    if (next && !context.idSet.has(next)) {
      issues.push({ severity: "warning", message: `${path}: next '${next}'를 현재 노드 목록에서 찾을 수 없습니다.` });
    }
    if (!isPlainRecord(node.stage_cast) || Object.keys(node.stage_cast).length === 0) {
      issues.push({ severity: "warning", message: `${path}: 무대 모드이지만 stage_cast가 비어 있습니다.` });
    }
    validateStageNodeHold(node, path, issues);
    validateStageCast(node.stage_cast, path, issues, maps);
    validateFocusTargets(node, path, issues, maps);
    validateDialogueCameraZoom(node, path, issues);
    validatePortraitRigNodeMetadataDefaults(node, path, issues, maps);
    return;
  }

  if (node.speaker && node.speaker !== "narrator" && !maps.characters.has(String(node.speaker))) {
    issues.push({ severity: "warning", message: `${path}: 존재하지 않는 speaker입니다: ${node.speaker}` });
  }
  validateTextSoundMutedAliases(node, path, issues);

  if (node.choices !== undefined && !Array.isArray(node.choices)) {
    issues.push({ severity: "warning", message: `${path}.choices는 배열이어야 합니다.` });
  }
  const choices = asArray<ResourceRecord>(node.choices);
  const hasChoiceContent = choices.some((choice) => {
    const presentTarget = readChoicePresentTarget(choice);
    return choice.text || choice.label || choice.next || readChoiceMoveToLocationId(choice) || presentTarget.id || choiceIsPresentDefault(choice);
  });
  const acquireInfo = readAcquireInfo(getNodeAcquireInfoValue(node));
  const hasAcquireInfo = acquireInfo.characters.length > 0 || acquireInfo.items.length > 0;
  if (!node.text && !hasChoiceContent && !hasAcquireInfo) {
    issues.push({ severity: "warning", message: `${path}: text나 choices가 없습니다.` });
  }

  const next = String(node.next || "").trim();
  if (next && !context.idSet.has(next)) {
    issues.push({ severity: "warning", message: `${path}: next '${next}'를 현재 노드 목록에서 찾을 수 없습니다.` });
  }

  validateStageCast(node.stage_cast, path, issues, maps);
  validateFocusTargets(node, path, issues, maps);
  validateDialogueCameraZoom(node, path, issues);
  validatePortraitRigNodeMetadataDefaults(node, path, issues, maps);
  validateAcquireInfo(getNodeAcquireInfoValue(node), path, issues, maps);
  validateSetFlags(node.set_flags, `${path}.set_flags`, issues);
  validateSetFlags(node.set_flags_on_complete, `${path}.set_flags_on_complete`, issues);
  validateStoryConditions(node.conditions, `${path}.conditions`, issues, maps, context);
  validateOptionalBoolean(node.talk_end, `${path}.talk_end`, issues);
  validateOptionalBoolean(node.end_talk, `${path}.end_talk`, issues);
  scanDialogueText(String(node.text || ""), path, issues, maps, { defaultSpeakerId: String(node.speaker || "") });

  if (node.popups !== undefined && node.popup_images !== undefined) {
    issues.push({ severity: "warning", message: `${path}: popups와 popup_images가 동시에 있습니다. popups가 우선됩니다.` });
  }
  if (node.popups !== undefined && !Array.isArray(node.popups)) {
    issues.push({ severity: "warning", message: `${path}.popups는 배열이어야 합니다.` });
  }
  if (node.popup_images !== undefined && !Array.isArray(node.popup_images)) {
    issues.push({ severity: "warning", message: `${path}.popup_images는 배열이어야 합니다.` });
  }
  const popupField = node.popups !== undefined ? "popups" : "popup_images";
  const popupValues = node.popups !== undefined ? node.popups : node.popup_images;
  for (const [popupIndex, popup] of asArray<unknown>(popupValues).entries()) {
    validateNodePopup(popup, `${path}.${popupField}[${popupIndex}]`, node, issues, maps);
  }

  const choiceTopicIds = new Set<string>();
  choices.forEach((choice, choiceIndex) => {
    const choicePath = `${path}.choices[${choiceIndex}]`;
    if (!isPlainRecord(choice)) {
      issues.push({ severity: "warning", message: `${choicePath}는 객체여야 합니다.` });
      return;
    }
    const topicId = normalizeSingleId(choice.topic_id ?? choice.choice_id ?? choice.id);
    if (topicId && !topicIdPattern.test(topicId)) {
      issues.push({ severity: "warning", message: `${choicePath}: topic_id는 영문, 숫자, 밑줄, 하이픈, 점, 콜론만 권장합니다.` });
    } else if (topicId && choiceTopicIds.has(topicId)) {
      issues.push({ severity: "warning", message: `${choicePath}: 같은 노드 안에서 topic_id가 중복됩니다: ${topicId}` });
    } else if (topicId) {
      choiceTopicIds.add(topicId);
    }
    const moveTo = readChoiceMoveToLocationId(choice);
    const presentTarget = readChoicePresentTarget(choice);
    if (!choice.text && !choice.label && !choice.next && !moveTo && !presentTarget.id && !choiceIsPresentDefault(choice)) {
      issues.push({ severity: "warning", message: `${choicePath}: label, text, next, move_to, present 대상이 모두 비어 있습니다.` });
    }
    if (choice.next && !context.idSet.has(String(choice.next))) {
      issues.push({ severity: "warning", message: `${choicePath}: next '${choice.next}'를 현재 노드 목록에서 찾을 수 없습니다.` });
    }
    if (moveTo && context.locationIds && !context.locationIds.has(moveTo)) {
      issues.push({ severity: "warning", message: `${choicePath}: move_to 장소를 찾을 수 없습니다: ${moveTo}` });
    }
    if (presentTarget.kind === "item" && !maps.items.has(presentTarget.id)) {
      issues.push({ severity: "warning", message: `${choicePath}: present_item 자료를 찾을 수 없습니다: ${presentTarget.id}` });
    }
    if (presentTarget.kind === "character" && !maps.characters.has(presentTarget.id)) {
      issues.push({ severity: "warning", message: `${choicePath}: present_character 인물을 찾을 수 없습니다: ${presentTarget.id}` });
    }
    validateSetFlags(choice.set_flags, `${choicePath}.set_flags`, issues);
    validateStoryConditions(choice.conditions, `${choicePath}.conditions`, issues, maps, context);
    validateOptionalBoolean(choice.track_heard, `${choicePath}.track_heard`, issues);
    validateOptionalBoolean(choice.show_heard_check, `${choicePath}.show_heard_check`, issues);
    validateOptionalBoolean(choice.exit_talk, `${choicePath}.exit_talk`, issues);
    validateOptionalBoolean(choice.talk_end, `${choicePath}.talk_end`, issues);
    validateOptionalBoolean(choice.end_talk, `${choicePath}.end_talk`, issues);
    validateOptionalBoolean(choice.present_default, `${choicePath}.present_default`, issues);
    validateOptionalBoolean(choice.default_present, `${choicePath}.default_present`, issues);
    validateOptionalBoolean(choice.wrong_present, `${choicePath}.wrong_present`, issues);
    if (choice.nodes !== undefined && !Array.isArray(choice.nodes)) {
      issues.push({ severity: "warning", message: `${choicePath}.nodes는 배열이어야 합니다.` });
    }
    scanDialogueText(String(choice.label || ""), `${choicePath}.label`, issues, maps, { defaultSpeakerId: String(node.speaker || "") });
    scanDialogueText(String(choice.text || ""), `${choicePath}.text`, issues, maps, { defaultSpeakerId: String(node.speaker || "") });

    const nestedNodes = asArray<ResourceRecord>(choice.nodes);
    const choiceAutoPrefix = `${context.autoPrefix}choice_${choiceIndex}_`;
    const choiceIds = buildResolvedNodeIdSet(nestedNodes, choiceAutoPrefix);
    for (const [nestedIndex, nested] of nestedNodes.entries()) {
      validateDialogueNode(nested, `${choicePath}.nodes[${nestedIndex}]`, issues, maps, {
        idSet: choiceIds,
        locationIds: context.locationIds,
        listName: "choice",
        nodeIndex: nestedIndex,
        autoPrefix: choiceAutoPrefix
      });
    }
  });

  if (node.statement_lies !== undefined && node.lies !== undefined) {
    issues.push({ severity: "warning", message: `${path}: statement_lies와 lies가 동시에 있습니다. statement_lies가 우선됩니다.` });
  }
  if (node.statement_lies !== undefined && !Array.isArray(node.statement_lies)) {
    issues.push({ severity: "warning", message: `${path}.statement_lies는 배열이어야 합니다.` });
  }
  if (node.lies !== undefined && !Array.isArray(node.lies)) {
    issues.push({ severity: "warning", message: `${path}.lies는 배열이어야 합니다.` });
  }
  const statementLiesField = node.statement_lies !== undefined ? "statement_lies" : "lies";
  const statementLiesValue = node.statement_lies !== undefined ? node.statement_lies : node.lies;
  for (const [lieIndex, lie] of asArray<ResourceRecord>(statementLiesValue).entries()) {
    const liePath = `${path}.${statementLiesField}[${lieIndex}]`;
    if (!isPlainRecord(lie)) {
      issues.push({ severity: "warning", message: `${liePath}는 객체여야 합니다.` });
      continue;
    }
    if (lie.reactions !== undefined && !Array.isArray(lie.reactions)) {
      issues.push({ severity: "warning", message: `${liePath}.reactions는 배열이어야 합니다.` });
    }
    for (const [reactionIndex, reaction] of asArray<ResourceRecord>(lie.reactions).entries()) {
      validateStatementReaction(reaction, `${liePath}.reactions[${reactionIndex}]`, issues, maps);
      const nestedNodes = asArray<ResourceRecord>(reaction.nodes);
      const reactionAutoPrefix = context.listName === "statement"
        ? `@reaction_${context.nodeIndex}_${lieIndex}_${reactionIndex}_`
        : "@reaction_";
      const reactionIds = buildResolvedNodeIdSet(nestedNodes, reactionAutoPrefix);
      for (const [nestedIndex, nested] of nestedNodes.entries()) {
        validateDialogueNode(nested, `${liePath}.reactions[${reactionIndex}].nodes[${nestedIndex}]`, issues, maps, {
          idSet: reactionIds,
          locationIds: context.locationIds,
          listName: "reaction",
          nodeIndex: nestedIndex,
          autoPrefix: reactionAutoPrefix
        });
      }
    }
  }
}
