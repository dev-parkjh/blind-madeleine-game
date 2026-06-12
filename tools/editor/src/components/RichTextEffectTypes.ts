import type { ReactNode } from "react";
import type { ReferenceResources } from "../editorTypes";
import type { RichTextAstNode } from "./RichTextPreviewParser";

export type RichTextEventRenderer = (
  node: Extract<RichTextAstNode, { type: "event" }>,
  key: string,
  references?: ReferenceResources
) => ReactNode;
