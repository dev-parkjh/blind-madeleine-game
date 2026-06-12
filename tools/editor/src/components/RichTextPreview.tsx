import { useMemo } from "react";
import type { ReferenceResources } from "../editorTypes";
import {
  parseRichTextPreviewAst,
  type RichTextSourceRange
} from "./RichTextPreviewParser";
import { detectTextTags, tagPreviewLabel } from "./RichTextPreviewSummary";
import { RichTextRemoveContext, renderRichTextNodes } from "./RichTextRenderer";

export { eventTagLabel, formatEventAttrSummary, getEventTargetIds } from "./RichTextEventUtils";
export {
  countRichTextVisibleCharacters,
  firstDefinedBbcodeAttr,
  formatDialogueFontScale,
  getBbcodeAttrNumber,
  getDialogueFontScaleFromAttrs,
  getRichTextMotionConfig,
  getRichTextTagPresentation,
  isFontScaleGradientAttrs,
  isFontScaleGradientTag,
  normalizeDialogueFontScale
} from "./RichTextPresentation";
export type { BbcodeAttributes, RichTextAstNode, RichTextSourceRange } from "./RichTextPreviewParser";
export {
  getBbcodeTagName,
  getBbcodeTagPayload,
  parseBbcodeAttributes,
  parseRichTextPreviewAst,
  stripDialoguePreviewPauses
} from "./RichTextPreviewParser";
export {
  collectRichTextPlainText,
  detectTextTags,
  getDialogueVisiblePreviewText,
  tagPreviewLabel
} from "./RichTextPreviewSummary";
export {
  RichTextRemoveContext,
  isValidRichTextSourceRange,
  renderRichTextNodes
} from "./RichTextRenderer";

export type TagActionCategory = "format" | "color" | "motion" | "typing" | "media" | "flow";
export type TagAction = {
  label: string;
  hint: string;
  category: TagActionCategory;
  open?: string;
  close?: string;
  insert?: string;
  previewText?: string;
  badge?: string;
};

export function RichTextPreview({
  text,
  compact = false,
  references,
  onRemoveRange
}: {
  text: string;
  compact?: boolean;
  references?: ReferenceResources;
  onRemoveRange?: (range: RichTextSourceRange) => void;
}) {
  const nodes = useMemo(() => parseRichTextPreviewAst(text), [text]);
  const tags = detectTextTags(text);

  return (
    <RichTextRemoveContext.Provider value={onRemoveRange || null}>
      <section className={`rich-text-preview ${compact ? "compact" : ""}`}>
        <div className="rich-text-preview-header">
          <span>Preview</span>
          <code>{tags.length > 0 ? tags.map(tagPreviewLabel).join(" · ") : "plain"}</code>
        </div>
        <div className="rich-text-preview-body">
          {nodes.length > 0 ? renderRichTextNodes(nodes, "rich", references) : <span className="rich-text-empty">보이는 텍스트 없음</span>}
        </div>
      </section>
    </RichTextRemoveContext.Provider>
  );
}
