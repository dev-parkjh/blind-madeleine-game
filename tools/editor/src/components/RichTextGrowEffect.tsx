import type { CSSProperties, ReactNode } from "react";
import type { ReferenceResources } from "../editorTypes";
import {
  getBbcodeAttrNumber,
  getRichTextTagPresentation
} from "./RichTextPresentation";
import type {
  BbcodeAttributes,
  RichTextAstNode
} from "./RichTextPreviewParser";
import type { RichTextEventRenderer } from "./RichTextEffectTypes";

export function renderGrowEffectNodes(
  nodes: RichTextAstNode[],
  attrs: BbcodeAttributes,
  keyPrefix: string,
  references: ReferenceResources | undefined,
  renderEventMarker: RichTextEventRenderer
): ReactNode[] {
  const cursor = { index: 0 };
  const from = getBbcodeAttrNumber(attrs, "from", 0.78, 0.05, 4);
  const to = getBbcodeAttrNumber(attrs, "to", 1.34, 0.05, 4);
  const duration = getBbcodeAttrNumber(attrs, "duration", 1.05, 0.05, 8);
  const delay = getBbcodeAttrNumber(attrs, "delay", 0.018, 0, 0.5);
  return nodes.flatMap((node, index) => renderGrowEffectNode(node, `${keyPrefix}-${index}`, cursor, from, to, duration, delay, references, renderEventMarker));
}

function renderGrowEffectNode(
  node: RichTextAstNode,
  key: string,
  cursor: { index: number },
  from: number,
  to: number,
  duration: number,
  delay: number,
  references: ReferenceResources | undefined,
  renderEventMarker: RichTextEventRenderer
): ReactNode[] {
  if (node.type === "event") {
    return [renderEventMarker(node, key, references)];
  }

  if (node.type === "text") {
    return Array.from(node.text).map((character, index) => {
      const charIndex = cursor.index;
      cursor.index += 1;
      return (
        <span
          className="rich-text-grow-char"
          key={`${key}-${index}`}
          style={{
            "--rich-text-grow-from": String(from),
            "--rich-text-grow-to": String(to),
            "--rich-text-grow-lift": `${-9 * (to - 1)}px`,
            animationDelay: `${charIndex * delay}s`,
            animationDuration: `${duration}s`
          } as CSSProperties}
        >
          {character}
        </span>
      );
    });
  }

  const presentation = getRichTextTagPresentation(node.tagName, node.attrs, references);
  return [
    <span
      className={["rich-text-token", ...presentation.classNames].filter(Boolean).join(" ")}
      data-rich-text-note={presentation.dataNote}
      key={key}
      style={presentation.style}
      title={presentation.title}
    >
      {renderGrowEffectNodesWithCursor(node.children, `${key}-nested`, cursor, from, to, duration, delay, references, renderEventMarker)}
    </span>
  ];
}

function renderGrowEffectNodesWithCursor(
  nodes: RichTextAstNode[],
  keyPrefix: string,
  cursor: { index: number },
  from: number,
  to: number,
  duration: number,
  delay: number,
  references: ReferenceResources | undefined,
  renderEventMarker: RichTextEventRenderer
): ReactNode[] {
  return nodes.flatMap((node, index) => renderGrowEffectNode(node, `${keyPrefix}-${index}`, cursor, from, to, duration, delay, references, renderEventMarker));
}
