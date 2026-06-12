import type { ReferenceResources } from "../../editorTypes";
import type { ResourceRecord } from "../../types";

export type ResourceFormCommonProps = {
  disabled: boolean;
  draft: ResourceRecord;
  references: ReferenceResources;
  updateField: (field: string, value: unknown) => void;
  updateMetadataField: (field: string, value: unknown) => void;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
  replaceDraft: (nextDraft: ResourceRecord) => void;
  savedJsonText: string;
  notify: (message: string) => void;
};
