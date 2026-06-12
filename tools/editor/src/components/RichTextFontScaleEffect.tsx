import type { ReactNode } from "react";
import type { ReferenceResources } from "../editorTypes";
import {
  countRichTextVisibleCharacters,
  firstDefinedBbcodeAttr,
  formatDialogueFontScale,
  getRichTextTagPresentation,
  normalizeDialogueFontScale
} from "./RichTextPresentation";
import type {
  BbcodeAttributes,
  RichTextAstNode
} from "./RichTextPreviewParser";
import type { RichTextEventRenderer } from "./RichTextEffectTypes";

export function renderFontScaleGradientNodes(
  nodes: RichTextAstNode[],
  attrs: BbcodeAttributes,
  keyPrefix: string,
  references: ReferenceResources | undefined,
  renderEventMarker: RichTextEventRenderer
): ReactNode[] {
  const visibleCount = countRichTextVisibleCharacters(nodes);
  const cursor = { index: 0 };
  const from = normalizeDialogueFontScale(firstDefinedBbcodeAttr(attrs, ["from", "from_scale", "start"]), 1);
  const to = normalizeDialogueFontScale(firstDefinedBbcodeAttr(attrs, ["to", "to_scale", "end"]), 0.3);
  return nodes.flatMap((node, index) => renderFontScaleGradientNode(node, `${keyPrefix}-${index}`, cursor, visibleCount, from, to, references, renderEventMarker));
}

function renderFontScaleGradientNode(
  node: RichTextAstNode,
  key: string,
  cursor: { index: number },
  visibleCount: number,
  from: number,
  to: number,
  references: ReferenceResources | undefined,
  renderEventMarker: RichTextEventRenderer
): ReactNode[] {
  if (node.type === "event") {
    return [renderEventMarker(node, key, references)];
  }

  if (node.type === "text") {
    return Array.from(node.text).map((character, index) => {
      const amount = visibleCount <= 1 ? 0 : cursor.index / (visibleCount - 1);
      cursor.index += 1;
      const scale = from + (to - from) * amount;
      return (
        <span className="rich-text-font-gradient-char" key={`${key}-${index}`} style={{ fontSize: `${formatDialogueFontScale(scale)}em` }}>
          {character}
        </span>
      );
    });
  }

  const presentation = getRichTextTagPresentation(node.tagName, node.attrs, references);
  const className = ["rich-text-token", ...presentation.classNames].filter(Boolean).join(" ");
  return [
    <span
      className={className}
      data-rich-text-note={presentation.dataNote}
      key={key}
      style={presentation.style}
      title={presentation.title}
    >
      {renderFontScaleGradientNodesWithCursor(node.children, `${key}-nested`, cursor, visibleCount, from, to, references, renderEventMarker)}
    </span>
  ];
}

function renderFontScaleGradientNodesWithCursor(
  nodes: RichTextAstNode[],
  keyPrefix: string,
  cursor: { index: number },
  visibleCount: number,
  from: number,
  to: number,
  references: ReferenceResources | undefined,
  renderEventMarker: RichTextEventRenderer
): ReactNode[] {
  return nodes.flatMap((node, index) => renderFontScaleGradientNode(node, `${keyPrefix}-${index}`, cursor, visibleCount, from, to, references, renderEventMarker));
}
