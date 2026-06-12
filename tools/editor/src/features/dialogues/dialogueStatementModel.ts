import type { ReferenceResources } from "../../editorTypes";
import { asArray } from "../../lib/resourceConfig";
import type { ResourceRecord } from "../../types";
import { speakerLabel } from "./dialogueNodeModel";

export type StatementReactionPath = { statementIndex: number; lieIndex: number; reactionIndex: number };
export type StatementReactionNodePath = StatementReactionPath & { childIndex: number };
export type StatementScrollTarget =
  | { kind: "statement"; statementIndex: number }
  | { kind: "reaction"; path: StatementReactionPath }
  | { kind: "child"; path: StatementReactionNodePath };

export function defaultStatementReactionRecord(kind = "default"): ResourceRecord {
  return {
    kind,
    target_id: "",
    label: kind === "default" ? "잘못된 연결" : "",
    next: "",
    statement_end: false,
    nodes: []
  };
}

export function syncStatementLiesForText(text: string, currentLies: ResourceRecord[]) {
  const phrases = extractStatementLiePhrases(text);
  if (phrases.length === 0) return currentLies;
  const used = new Set<number>();
  return phrases.map((phrase, index) => {
    const existingIndex = currentLies.findIndex((lie, lieIndex) => !used.has(lieIndex) && String(lie.phrase || "") === phrase);
    const fallbackIndex = existingIndex >= 0 ? existingIndex : index;
    const existing = currentLies[fallbackIndex] || {};
    used.add(fallbackIndex);
    const reactions = asArray<ResourceRecord>(existing.reactions);
    return {
      ...existing,
      id: existing.id || `lie_${index}`,
      phrase,
      reactions: reactions.length > 0 ? reactions : [defaultStatementReactionRecord()]
    };
  });
}

export function getStatementLies(node: ResourceRecord | undefined) {
  return asArray<ResourceRecord>(node?.statement_lies ?? node?.lies);
}

export function withStatementLies(node: ResourceRecord, lies: ResourceRecord[]) {
  const next: ResourceRecord = { ...node };
  delete next.lies;
  next.statement_lies = lies;
  return next;
}

export function extractStatementLiePhrases(text: string) {
  const phrases: string[] = [];
  const pattern = /\[lie[^\]]*\]([\s\S]*?)\[\/lie\]/gi;
  let match: RegExpExecArray | null = null;
  while ((match = pattern.exec(text)) !== null) {
    const phrase = stripInlineTags(match[1]).trim();
    if (phrase) phrases.push(phrase);
  }
  if (phrases.length > 0) return phrases;

  const bracketPattern = /\[([^\[\]]+)\]/g;
  while ((match = bracketPattern.exec(text)) !== null) {
    const body = String(match[1] || "").trim();
    if (!body || body.startsWith("/") || /[\s=]/.test(body)) continue;
    if (["lie", "color", "shake", "wave", "speed", "font_scale", "alpha", "bgm", "sfx", "se", "bg", "auto_next", "enter", "exit"].includes(body.toLowerCase())) continue;
    const phrase = stripInlineTags(body).trim();
    if (phrase) phrases.push(phrase);
  }
  return phrases;
}

function stripInlineTags(text: string) {
  return text
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\|+/g, "")
    .replace(/\s+/g, " ");
}

export function escapeBbcodeAttribute(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}

export function clampListIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, Number.isFinite(index) ? Math.round(index) : 0));
}

export function moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, item);
  return nextItems;
}

export function remapMovedIndex(index: number, fromIndex: number, toIndex: number) {
  if (index === fromIndex) return toIndex;
  if (fromIndex < toIndex && index > fromIndex && index <= toIndex) return index - 1;
  if (fromIndex > toIndex && index >= toIndex && index < fromIndex) return index + 1;
  return index;
}

export function statementReactionPathKey(path: StatementReactionPath | null | undefined) {
  if (!path) return "";
  return `${path.statementIndex}:${path.lieIndex}:${path.reactionIndex}`;
}

export function statementReactionNodePathKey(path: StatementReactionNodePath | null | undefined) {
  if (!path) return "";
  return `${statementReactionPathKey(path)}:${path.childIndex}`;
}

export function statementReactionPathFromNodePath(path: StatementReactionNodePath): StatementReactionPath {
  return {
    statementIndex: path.statementIndex,
    lieIndex: path.lieIndex,
    reactionIndex: path.reactionIndex
  };
}

export function isSameStatementReactionPath(a: StatementReactionPath | null | undefined, b: StatementReactionPath | null | undefined) {
  return Boolean(a && b && statementReactionPathKey(a) === statementReactionPathKey(b));
}

export function isSameStatementReactionNodePath(a: StatementReactionNodePath | null | undefined, b: StatementReactionNodePath | null | undefined) {
  return Boolean(a && b && statementReactionNodePathKey(a) === statementReactionNodePathKey(b));
}

export function getStatementReactionAtPath(statementNodes: ResourceRecord[], path: StatementReactionPath | null | undefined) {
  if (!path) return null;
  const statementNode = statementNodes[path.statementIndex];
  const lie = getStatementLies(statementNode)[path.lieIndex];
  return asArray<ResourceRecord>(lie?.reactions)[path.reactionIndex] || null;
}

function findFirstStatementReactionPath(statementNodes: ResourceRecord[], statementIndex: number): StatementReactionPath | null {
  const statementNode = statementNodes[statementIndex];
  if (!statementNode) return null;
  const lies = getStatementLies(statementNode);
  for (let lieIndex = 0; lieIndex < lies.length; lieIndex += 1) {
    const reactions = asArray<ResourceRecord>(lies[lieIndex]?.reactions);
    if (reactions.length > 0) return { statementIndex, lieIndex, reactionIndex: 0 };
  }
  return null;
}

export function normalizeStatementReactionPath(statementNodes: ResourceRecord[], path: StatementReactionPath | null): StatementReactionPath | null {
  if (!path || statementNodes.length === 0) return null;
  const statementIndex = clampListIndex(path.statementIndex, statementNodes.length);
  const lies = getStatementLies(statementNodes[statementIndex]);
  const lieIndex = clampListIndex(path.lieIndex, lies.length);
  const reactions = asArray<ResourceRecord>(lies[lieIndex]?.reactions);
  if (reactions.length === 0) return findFirstStatementReactionPath(statementNodes, statementIndex);
  return { statementIndex, lieIndex, reactionIndex: clampListIndex(path.reactionIndex, reactions.length) };
}

export function normalizeStatementReactionNodePath(statementNodes: ResourceRecord[], path: StatementReactionNodePath | null): StatementReactionNodePath | null {
  if (!path) return null;
  const reactionPath = normalizeStatementReactionPath(statementNodes, path);
  if (!reactionPath) return null;
  const reaction = getStatementReactionAtPath(statementNodes, reactionPath);
  const childNodes = asArray<ResourceRecord>(reaction?.nodes);
  if (childNodes.length === 0) return null;
  return { ...reactionPath, childIndex: clampListIndex(path.childIndex, childNodes.length) };
}

export function statementScrollSelector(target: StatementScrollTarget) {
  if (target.kind === "statement") return `[data-statement-target="statement:${target.statementIndex}"]`;
  if (target.kind === "reaction") return `[data-statement-target="reaction:${statementReactionPathKey(target.path)}"]`;
  return `[data-statement-target="child:${statementReactionNodePathKey(target.path)}"]`;
}

export function statementReactionDisplayLabel(reaction: ResourceRecord, lie: ResourceRecord, reactionIndex: number, references: ReferenceResources) {
  if (reaction.label) return String(reaction.label);
  const kind = String(reaction.kind || "default");
  const targetId = String(reaction.target_id || "");
  if (kind === "character" && targetId) return speakerLabel(targetId, references.characters);
  if (kind === "item" && targetId) return references.items.find((item) => item.id === targetId)?.title || targetId;
  if (kind === "default") return "잘못된 연결";
  return `${lie.phrase || "반응"} ${reactionIndex + 1}`;
}
