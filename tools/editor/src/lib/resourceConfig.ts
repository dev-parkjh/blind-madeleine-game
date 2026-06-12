import type { ResourceRecord, ResourceType } from "../types";

export const resourceOrder: ResourceType[] = [
  "dialogues",
  "characters",
  "chapters",
  "items",
  "story_assets"
];

export const resourceConfig: Record<ResourceType, {
  label: string;
  singularLabel: string;
  titleKey: string;
  icon: string;
  empty: (id: string) => ResourceRecord;
}> = {
  dialogues: {
    label: "대사",
    singularLabel: "대사",
    titleKey: "label",
    icon: "AccountTree",
    empty: (id) => ({ id, label: "새 대사", description: "", chapters: [], nodes: [], statement_nodes: [] })
  },
  characters: {
    label: "캐릭터",
    singularLabel: "캐릭터",
    titleKey: "display_name",
    icon: "Person",
    empty: (id) => ({
      id,
      display_name: "새 캐릭터",
      description: "",
      name_color: "#8FD8B8",
      protagonist: false,
      portraits: {},
      metadata: {}
    })
  },
  character_rigs: {
    label: "Character rigs",
    singularLabel: "Character rig",
    titleKey: "display_name",
    icon: "AccessibilityNew",
    empty: (id) => ({
      id,
      character_id: "",
      display_name: "New character rig",
      canvas: { width: 1200, height: 1800, origin: [600, 900] },
      parts: [],
      states: { default: { label: "default" } },
      angle_tracks: { default: {} },
      motion_tracks: {
        idle: { enabled: true, amplitude: 4, frequency: 0.45 },
        blink: { enabled: true, interval: 4, duration: 0.14 },
        mouth: { enabled: true, closed: "mouth_closed", open: "mouth_open" }
      },
      editor: {
        guides: {
          base: { enabled: false, path: "", position: [0.5, 0.5], rotation: 0, opacity: 0.55, scale: 1 },
          angles: {}
        }
      },
      metadata: {}
    })
  },
  chapters: {
    label: "챕터",
    singularLabel: "챕터",
    titleKey: "title",
    icon: "AutoStories",
    empty: (id) => ({
      id,
      title: "새 챕터",
      order: 0,
      start_dialogue: "",
      description: "",
      dialogues: [],
      layout: { positions: {} },
      metadata: {}
    })
  },
  items: {
    label: "아이템",
    singularLabel: "아이템",
    titleKey: "name",
    icon: "Inventory2",
    empty: (id) => ({ id, name: "새 아이템", description: "", image: "", metadata: {}, chapters: [] })
  },
  story_assets: {
    label: "스토리 에셋",
    singularLabel: "스토리 에셋",
    titleKey: "display_name",
    icon: "PermMedia",
    empty: (id) => ({
      id,
      kind: "sfx",
      display_name: "새 스토리 에셋",
      description: "",
      path: "",
      metadata: {},
      volume: 1
    })
  }
};

export function iconPath(name: string): string {
  return `/repo/assets/icon/mui/${name}Rounded.svg`;
}

export function titleFor(type: ResourceType, data: ResourceRecord | null | undefined, fallbackId = ""): string {
  if (!data) return "항목을 선택하세요";
  const config = resourceConfig[type];
  return String(
    data[config.titleKey]
      || data.label
      || data.display_name
      || data.title
      || data.name
      || data.path
      || fallbackId
      || config.singularLabel
  );
}

export function describeResource(type: ResourceType, data: ResourceRecord | null | undefined): string {
  if (!data) return "선택 없음";

  if (type === "dialogues") {
    return `${countArray(data.nodes)} nodes \u00b7 ${countArray(data.statement_nodes)} statements \u00b7 ${countChapterScope(data)} chapters`;
  }

  if (type === "chapters") {
    return `order ${data.order ?? "-"} \u00b7 ${countArray(data.dialogues ?? data.dialogue_ids)} dialogues`;
  }

  if (type === "characters") {
    return `${data.portraits && typeof data.portraits === "object" ? Object.keys(data.portraits).length : 0} portraits`;
  }

  if (type === "character_rigs") {
    const partCount = Array.isArray(data.parts) ? data.parts.length : 0;
    const stateCount = data.states && typeof data.states === "object" ? Object.keys(data.states).length : 0;
    return `${partCount} parts \u00b7 ${stateCount} states`;
  }

  if (type === "story_assets") {
    return [data.kind || "asset", data.path || ""].filter(Boolean).join(" \u00b7 ");
  }

  return `${countChapterScope(data)} chapters`;
}

export function countArray(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function countChapterScope(data: ResourceRecord): number {
  const metadata = data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
    ? data.metadata as ResourceRecord
    : {};
  const value = data.chapters ?? data.chapter_ids ?? metadata.chapters ?? metadata.chapter_ids;
  if (Array.isArray(value)) return value.length;
  if (typeof value === "string" && value.trim()) return 1;
  return 0;
}

export function asArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

export function normalizeKind(kind: unknown): string {
  const clean = String(kind || "").trim().toLowerCase();
  if (["bgm", "music", "background_music"].includes(clean)) return "bgm";
  if (["bg", "image", "background", "background_image", "background_img"].includes(clean)) return "background";
  if (["sfx", "sound", "se", "effect", "effect_sound"].includes(clean)) return "sfx";
  return clean || "sfx";
}

export function formatJson(data: ResourceRecord): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

export function makeUuid(): string {
  return crypto.randomUUID();
}
