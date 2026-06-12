import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import type { ReferenceResources } from "../editorTypes";
import {
  renderBlinkEffectNodes,
  renderFontScaleGradientNodes,
  renderGrowEffectNodes,
  renderMotionEffectNodes,
  renderStaticFadeNodes
} from "./RichTextEffectRenderer";
import { eventTagLabel, formatEventAttrSummary } from "./RichTextEventUtils";
import {
  getRichTextTagPresentation,
  isFontScaleGradientTag
} from "./RichTextPresentation";
import type {
  RichTextAstNode,
  RichTextSourceRange
} from "./RichTextPreviewParser";

export const RichTextRemoveContext = createContext<((range: RichTextSourceRange) => void) | null>(null);

export function renderRichTextNodes(nodes: RichTextAstNode[], keyPrefix: string, references?: ReferenceResources): ReactNode[] {
  return nodes.map((node, index) => renderRichTextNode(node, `${keyPrefix}-${index}`, references));
}

function renderRichTextNode(node: RichTextAstNode, key: string, references?: ReferenceResources): ReactNode {
  if (node.type === "text") {
    return <span key={key}>{node.text}</span>;
  }

  if (node.type === "event") {
    return renderRichTextEventMarker(node, key, references);
  }

  const presentation = getRichTextTagPresentation(node.tagName, node.attrs, references);
  const perCharacterMotion = ["blink", "shake", "wave", "tornado"].includes(node.tagName);
  const presentationClassNames = perCharacterMotion
    ? presentation.classNames.filter((className) => !["rich-text-motion", "rich-text-blink", "rich-text-shake", "rich-text-wave", "rich-text-tornado"].includes(className))
    : presentation.classNames;
  const className = ["rich-text-token", ...presentationClassNames].filter(Boolean).join(" ");
  const children = renderRichTextChildren(node, key, references);

  return (
    <span
      className={className}
      data-rich-text-note={presentation.dataNote}
      key={key}
      style={presentation.style}
      title={presentation.title}
    >
      {children}
    </span>
  );
}

function renderRichTextChildren(node: Extract<RichTextAstNode, { type: "span" }>, key: string, references?: ReferenceResources) {
  if (node.tagName === "fade") {
    return renderStaticFadeNodes(node.children, node.attrs, `${key}-fade`, references, renderRichTextEventMarker);
  }
  if (node.tagName === "grow") {
    return renderGrowEffectNodes(node.children, node.attrs, `${key}-grow`, references, renderRichTextEventMarker);
  }
  if (node.tagName === "blink") {
    return renderBlinkEffectNodes(node.children, node.attrs, `${key}-blink`, references, renderRichTextEventMarker);
  }
  if (["shake", "wave", "tornado"].includes(node.tagName)) {
    return renderMotionEffectNodes(node.children, node.tagName, node.attrs, `${key}-motion`, references, renderRichTextEventMarker);
  }
  if (isFontScaleGradientTag(node)) {
    return renderFontScaleGradientNodes(node.children, node.attrs, `${key}-gradient`, references, renderRichTextEventMarker);
  }
  return renderRichTextNodes(node.children, key, references);
}

function renderRichTextEventMarker(node: Extract<RichTextAstNode, { type: "event" }>, key: string, references?: ReferenceResources) {
  return <RichTextEventMarker key={key} node={node} references={references} />;
}

function RichTextEventMarker({ node, references }: { node: Extract<RichTextAstNode, { type: "event" }>; references?: ReferenceResources }) {
  const onRemoveRange = useContext(RichTextRemoveContext);
  const note = formatEventAttrSummary(node.tagName, node.attrs, references);
  const canRemove = Boolean(onRemoveRange && isValidRichTextSourceRange(node.range));
  const label = eventTagLabel(node.tagName);
  return (
    <span className={`rich-text-event-marker ${canRemove ? "removable" : ""}`} title={node.raw}>
      {label}
      {note ? <small>{note}</small> : null}
      {canRemove && (
        <button
          aria-label={`${label} 태그 제거`}
          className="rich-text-remove-button"
          title="태그 제거"
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (isValidRichTextSourceRange(node.range)) onRemoveRange?.(node.range);
          }}
        >
          x
        </button>
      )}
    </span>
  );
}

export function isValidRichTextSourceRange(range: RichTextSourceRange | undefined): range is RichTextSourceRange {
  return Boolean(range && Number.isFinite(range.start) && Number.isFinite(range.end) && range.end > range.start);
}
