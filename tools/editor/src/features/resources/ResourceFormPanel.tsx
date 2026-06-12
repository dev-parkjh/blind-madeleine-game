import { useUiText } from "../../editorText";
import type { ReferenceResources } from "../../editorTypes";
import type { ResourceRecord, ResourceType } from "../../types";
import { ChapterForm } from "../chapters/ChapterForm";
import { CharacterForm } from "../characters/CharacterForm";
import { DialogueForm } from "../dialogues/DialogueForm";
import { ItemForm } from "../items/ItemForm";
import { StoryAssetForm } from "../storyAssets/StoryAssetForm";
import type { ResourceFormCommonProps } from "./resourceFormTypes";

export function ResourceFormPanel({
  disabled,
  draft,
  type,
  references,
  updateField,
  updateMetadataField,
  uploadFile,
  replaceDraft,
  savedJsonText,
  notify
}: {
  disabled: boolean;
  draft: ResourceRecord | null;
  type: ResourceType;
  references: ReferenceResources;
  updateField: (field: string, value: unknown) => void;
  updateMetadataField: (field: string, value: unknown) => void;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
  replaceDraft: (nextDraft: ResourceRecord) => void;
  savedJsonText: string;
  notify: (message: string) => void;
}) {
  const ui = useUiText();
  if (!draft) return <p className="empty-state">{ui.form.empty}</p>;

  const formProps: ResourceFormCommonProps = {
    disabled,
    draft,
    references,
    updateField,
    updateMetadataField,
    uploadFile,
    replaceDraft,
    savedJsonText,
    notify
  };

  if (type === "dialogues") return <DialogueForm {...formProps} />;
  if (type === "characters") return <CharacterForm {...formProps} />;
  if (type === "chapters") return <ChapterForm {...formProps} />;
  if (type === "items") return <ItemForm {...formProps} />;
  return <StoryAssetForm {...formProps} />;
}
