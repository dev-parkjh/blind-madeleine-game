import type { CSSProperties } from "react";
import type { ReferenceResources } from "../../editorTypes";
import { Icon } from "../../components/EditorControls";
import {
  formatEventAttrSummary,
  getEventTargetIds,
  parseRichTextPreviewAst,
  type RichTextAstNode
} from "../../components/RichTextPreview";
import { sanitizeHexColor } from "../../lib/editorPreferences";
import type { ResourceRecord, ResourceSummary } from "../../types";
import { isCutsceneNode, isStageNode } from "./dialogueNodeModel";
import { characterLabel, getEnterIdsAtNode, getExitIdsFromNode } from "./stageCastModel";

export type DialogueStageTagTarget = {
  id: string;
  label: string;
  color: string;
};

type NodeCastBadge = { kind: "enter" | "exit"; characterId: string; label: string; color: string };
type NodeBgmBadge = { kind: "start" | "stop"; detail: string };

export function DialogueStageTagQuickInsert({
  targets,
  onEnter,
  onExit
}: {
  targets: DialogueStageTagTarget[];
  onEnter: (characterId: string) => void;
  onExit: (characterId: string) => void;
}) {
  if (targets.length === 0) return null;
  return (
    <section className="dialogue-stage-tag-quick-insert" aria-label="등장/퇴장 태그">
      <div className="dialogue-stage-tag-title">
        <Icon name="Groups" />
        <span>등장/퇴장</span>
      </div>
      <div className="dialogue-stage-tag-list">
        {targets.map((target) => (
          <div
            className="dialogue-stage-tag-target"
            key={target.id}
            style={{ "--stage-tag-color": target.color } as CSSProperties}
          >
            <span className="dialogue-stage-tag-name">
              <span className="dialogue-stage-tag-swatch" />
              <span>{target.label}</span>
            </span>
            <button type="button" onClick={() => onEnter(target.id)}>
              <Icon name="Login" />
              등장
            </button>
            <button type="button" onClick={() => onExit(target.id)}>
              <Icon name="Logout" />
              퇴장
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function textEventCastBadges(text: string, references: ReferenceResources): NodeCastBadge[] {
  const badges: NodeCastBadge[] = [];
  const seen = new Set<string>();
  const visit = (node: RichTextAstNode) => {
    if (node.type === "event" && (node.tagName === "enter" || node.tagName === "exit")) {
      getEventTargetIds(node.attrs).forEach((characterId) => {
        const key = `${node.tagName}:${characterId}`;
        if (!characterId || seen.has(key)) return;
        seen.add(key);
        const badge: NodeCastBadge = {
          kind: node.tagName as "enter" | "exit",
          characterId,
          label: characterLabel(characterId, undefined, references.characters),
          color: characterBadgeColor(characterId, references.characters)
        };
        badges.push(badge);
      });
      return;
    }
    if (node.type === "span") node.children.forEach(visit);
  };
  parseRichTextPreviewAst(text).forEach(visit);
  return badges;
}

export function NodeRowBadgeStrip({
  castBadges,
  bgmBadges
}: {
  castBadges: NodeCastBadge[];
  bgmBadges: NodeBgmBadge[];
}) {
  if (castBadges.length === 0 && bgmBadges.length === 0) return null;
  return (
    <span className="node-cast-badge-strip">
      {bgmBadges.map((badge, index) => (
        <span
          className={`node-cast-badge bgm-${badge.kind}`}
          key={`bgm-${badge.kind}-${badge.detail || index}`}
          style={castBadgeColorStyle(badge.kind === "start" ? "#ffc857" : "#a0a0a0")}
          title={badge.kind === "start"
            ? (badge.detail ? `이 노드에서 BGM 재생: ${badge.detail}` : "이 노드에서 BGM 재생")
            : "이 노드에서 BGM 종료"}
        >
          {nodeBgmBadgeLabel(badge)}
        </span>
      ))}
      {castBadges.map((badge) => (
        <span
          className={`node-cast-badge ${badge.kind}`}
          key={`${badge.kind}-${badge.characterId}`}
          style={castBadgeColorStyle(badge.color)}
          title={badge.kind === "enter" ? "이 노드에서 무대에 등장" : "다음 노드에서 퇴장"}
        >
          {badge.label} {badge.kind === "enter" ? "등장" : "퇴장"}
        </span>
      ))}
    </span>
  );
}

function nodeBgmBadgeLabel(badge: NodeBgmBadge) {
  if (badge.kind === "stop") return "BGM 종료";
  return badge.detail ? `BGM · ${badge.detail}` : "BGM 시작";
}

export function nodeBgmBadges(node: ResourceRecord, references: ReferenceResources): NodeBgmBadge[] {
  if (isCutsceneNode(node) || isStageNode(node)) return [];
  return collectBgmBadgesFromAst(parseRichTextPreviewAst(String(node.text || "")), references);
}

function collectBgmBadgesFromAst(nodes: RichTextAstNode[], references: ReferenceResources): NodeBgmBadge[] {
  const badges: NodeBgmBadge[] = [];
  const seen = new Set<string>();

  const visit = (node: RichTextAstNode) => {
    if (node.type === "event") {
      const tag = node.tagName.toLowerCase();
      if (tag === "bgm" || tag === "music") {
        const detail = formatEventAttrSummary(tag, node.attrs, references);
        const key = `start|${detail}`;
        if (!seen.has(key)) {
          seen.add(key);
          badges.push({ kind: "start", detail });
        }
      } else if (tag === "bgm_stop" || tag === "music_stop") {
        if (!seen.has("stop")) {
          seen.add("stop");
          badges.push({ kind: "stop", detail: "" });
        }
      }
      return;
    }
    if (node.type === "span") node.children.forEach(visit);
  };

  nodes.forEach(visit);
  return badges;
}

function castBadgeColorStyle(color: string) {
  return { "--cast-badge-color": color } as CSSProperties & Record<string, string>;
}

export function characterBadgeColor(characterId: string, characters: ResourceSummary[]) {
  return sanitizeHexColor(characters.find((entry) => entry.id === characterId)?.nameColor, "#ffffff");
}

export function nodeCastBadges(node: ResourceRecord, index: number, nodes: ResourceRecord[], references: ReferenceResources): NodeCastBadge[] {
  const badges: NodeCastBadge[] = [];
  const appendBadge = (badge: NodeCastBadge) => {
    if (!badges.some((entry) => entry.kind === badge.kind && entry.characterId === badge.characterId)) badges.push(badge);
  };

  getEnterIdsAtNode(index, nodes).forEach((characterId) => appendBadge({
    kind: "enter" as const,
    characterId,
    label: characterLabel(characterId, undefined, references.characters),
    color: characterBadgeColor(characterId, references.characters)
  }));
  textEventCastBadges(String(node.text || ""), references).forEach(appendBadge);
  getExitIdsFromNode(node).forEach((characterId) => appendBadge({
    kind: "exit" as const,
    characterId,
    label: characterLabel(characterId, undefined, references.characters),
    color: characterBadgeColor(characterId, references.characters)
  }));

  return badges;
}
