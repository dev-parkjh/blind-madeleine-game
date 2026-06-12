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

export function renderBlinkEffectNodes(
  nodes: RichTextAstNode[],
  attrs: BbcodeAttributes,
  keyPrefix: string,
  references: ReferenceResources | undefined,
  renderEventMarker: RichTextEventRenderer
): ReactNode[] {
  const cursor = { index: 0 };
  const frequency = getBbcodeAttrNumber(attrs, "freq", 3.4, 0.1, 12);
  const minAlpha = getBbcodeAttrNumber(attrs, "min", 0.12, 0, 1);
  return nodes.flatMap((node, index) => renderBlinkEffectNode(node, `${keyPrefix}-${index}`, cursor, frequency, minAlpha, references, renderEventMarker));
}

function renderBlinkEffectNode(
  node: RichTextAstNode,
  key: string,
  cursor: { index: number },
  frequency: number,
  minAlpha: number,
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
      const phaseDelay = -(charIndex * 0.08) / (Math.PI * 2 * frequency);
      return (
        <span
          className="rich-text-blink-char"
          key={`${key}-${index}`}
          style={{
            "--rich-text-blink-min": String(minAlpha),
            animationDelay: `${phaseDelay}s`,
            animationDuration: `${1 / frequency}s`
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
      {renderBlinkEffectNodesWithCursor(node.children, `${key}-nested`, cursor, frequency, minAlpha, references, renderEventMarker)}
    </span>
  ];
}

function renderBlinkEffectNodesWithCursor(
  nodes: RichTextAstNode[],
  keyPrefix: string,
  cursor: { index: number },
  frequency: number,
  minAlpha: number,
  references: ReferenceResources | undefined,
  renderEventMarker: RichTextEventRenderer
): ReactNode[] {
  return nodes.flatMap((node, index) => renderBlinkEffectNode(node, `${keyPrefix}-${index}`, cursor, frequency, minAlpha, references, renderEventMarker));
}
