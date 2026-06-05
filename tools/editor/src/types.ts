export type ResourceType = "dialogues" | "characters" | "chapters" | "items" | "story_assets";

export type ResourceRecord = Record<string, any> & {
  id?: string;
};

export type ResourceSummary = {
  id: string;
  type: ResourceType;
  title: string;
  subtitle: string;
  hasIdMismatch?: boolean;
};

export type ResourceGroup = {
  type: ResourceType;
  label: string;
  singularLabel: string;
  count: number;
  resources: ResourceSummary[];
};

export type ProjectSummary = {
  repoRoot: string;
  editorRoot: string;
  generatedAt: string;
  resources: Record<ResourceType, ResourceGroup>;
};

export type ValidationIssue = {
  severity: "error" | "warning" | "info";
  message: string;
};

