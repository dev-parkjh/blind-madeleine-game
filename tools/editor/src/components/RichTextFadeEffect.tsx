import type { ReactNode } from "react";
import type { ReferenceResources } from "../editorTypes";
import {
  countRichTextVisibleCharacters,
  getBbcodeAttrNumber,
  getRichTextTagPresentation
} from "./RichTextPresentation";
import type {
  BbcodeAttributes,
  RichTextAstNode
} from "./RichTextPreviewParser";
import type { RichTextEventRenderer } from "./RichTextEffectTypes";

export function renderStaticFadeNodes(
  nodes: RichTextAstNode[],
  attrs: BbcodeAttributes,
  keyPrefix: string,
  references: ReferenceResources | undefined,
  renderEventMarker: RichTextEventRenderer
): ReactNode[] {
  const visibleCount = countRichTextVisibleCharacters(nodes);
  const fadeStart = Math.min(visibleCount, Math.max(0, Math.round(getBbcodeAttrNumber(attrs, ["start", "from_index", "offset"], 0))));
  const defaultLength = Math.max(visibleCount - fadeStart, 0);
  const fadeLength = Math.max(0, Math.round(getBbcodeAttrNumber(attrs, ["length", "len", "count"], defaultLength)));
  const fadeEnd = Math.min(visibleCount, Math.max(fadeStart, fadeStart + fadeLength));
  const fromAlpha = getBbcodeAttrNumber(attrs, ["from", "from_alpha", "start_alpha"], 1, 0, 1);
  const toAlpha = getBbcodeAttrNumber(attrs, ["to", "to_alpha", "end_alpha", "min"], 0.3, 0, 1);
  const cursor = { index: 0 };
  return nodes.flatMap((node, index) => renderStaticFadeNode(node, `${keyPrefix}-${index}`, cursor, fadeStart, fadeEnd, fromAlpha, toAlpha, references, renderEventMarker));
}

function renderStaticFadeNode(
  node: RichTextAstNode,
  key: string,
  cursor: { index: number },
  fadeStart: number,
  fadeEnd: number,
  fromAlpha: number,
  toAlpha: number,
  references: ReferenceResources | undefined,
  renderEventMarker: RichTextEventRenderer
): ReactNode[] {
  if (node.type === "event") {
    return cursor.index < fadeEnd ? [renderEventMarker(node, key, references)] : [];
  }

  if (node.type === "text") {
    const rendered: ReactNode[] = [];
    for (const [index, character] of Array.from(node.text).entries()) {
      if (cursor.index >= fadeEnd) break;
      const alpha = staticFadeAlphaForIndex(cursor.index, fadeStart, fadeEnd, fromAlpha, toAlpha);
      cursor.index += 1;
      rendered.push(
        <span className="rich-text-static-fade-char" key={`${key}-${index}`} style={{ opacity: alpha }}>
          {character}
        </span>
      );
    }
    return rendered;
  }

  if (cursor.index >= fadeEnd) return [];
  const presentation = getRichTextTagPresentation(node.tagName, node.attrs, references);
  const children = renderStaticFadeNodesWithCursor(node.children, `${key}-nested`, cursor, fadeStart, fadeEnd, fromAlpha, toAlpha, references, renderEventMarker);
  if (children.length === 0) return [];
  return [
    <span
      className={["rich-text-token", ...presentation.classNames].filter(Boolean).join(" ")}
      data-rich-text-note={presentation.dataNote}
      key={key}
      style={presentation.style}
      title={presentation.title}
    >
      {children}
    </span>
  ];
}

function renderStaticFadeNodesWithCursor(
  nodes: RichTextAstNode[],
  keyPrefix: string,
  cursor: { index: number },
  fadeStart: number,
  fadeEnd: number,
  fromAlpha: number,
  toAlpha: number,
  references: ReferenceResources | undefined,
  renderEventMarker: RichTextEventRenderer
): ReactNode[] {
  return nodes.flatMap((node, index) => renderStaticFadeNode(node, `${keyPrefix}-${index}`, cursor, fadeStart, fadeEnd, fromAlpha, toAlpha, references, renderEventMarker));
}

function staticFadeAlphaForIndex(index: number, fadeStart: number, fadeEnd: number, fromAlpha: number, toAlpha: number) {
  if (index < fadeStart || fadeEnd <= fadeStart) return 1;
  const fadeCount = fadeEnd - fadeStart;
  const amount = fadeCount > 1 ? (index - fadeStart) / (fadeCount - 1) : 0;
  return fromAlpha + (toAlpha - fromAlpha) * Math.min(1, Math.max(0, amount));
}
