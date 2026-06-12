import type { ReferenceResources } from "../../editorTypes";
import { normalizeChapterDraftForSave } from "../chapters/chapterModel";
import { normalizeCharacterDraftForSave } from "../characters/characterSaveModel";
import { normalizeDialogueDraftForSave } from "../dialogues/dialogueSaveModel";
import { normalizeItemDraftForSave } from "../items/itemModel";
import { normalizeStoryAssetDraftForKind } from "../storyAssets/storyAssetModel";
import type { ResourceRecord, ResourceType } from "../../types";

export function prepareDraftForSave(type: ResourceType, draft: ResourceRecord, references?: ReferenceResources): ResourceRecord {
  if (type === "dialogues") return normalizeDialogueDraftForSave(draft, references?.characters || []);
  if (type === "characters") return normalizeCharacterDraftForSave(draft);
  if (type === "chapters") return normalizeChapterDraftForSave(draft);
  if (type === "items") return normalizeItemDraftForSave(draft);
  if (type === "story_assets") return normalizeStoryAssetDraftForKind(draft);
  return draft;
}
