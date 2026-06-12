export type ResourceType = "dialogues" | "characters" | "character_rigs" | "chapters" | "items" | "story_assets";

export type ResourceRecord = Record<string, any> & {
  id?: string;
};

export type ResourceSummary = {
  id: string;
  type: ResourceType;
  title: string;
  subtitle: string;
  chapterIds?: string[];
  nameColor?: string;
  isProtagonist?: boolean;
  validation?: ResourceRecord;
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

export type EditorHealth = {
  ok: boolean;
  host: string;
  port: number;
  platform: string;
  urls: string[];
  godotPreviewProxyEndpoint: string;
  godotPreviewBridgeTarget: string;
  godotPreviewBridgeAutoStart: boolean;
  godotPreviewAutoStartStatus: string;
  managedGodotPreviewBridgePid: number | null;
  repoRoot: string;
  editorRoot: string;
};

export type ValidationIssue = {
  severity: "error" | "warning" | "info";
  message: string;
};
