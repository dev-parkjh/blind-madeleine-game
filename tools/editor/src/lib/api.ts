import type { EditorHealth, ProjectSummary, ResourceRecord, ResourceSummary, ResourceType } from "../types";

async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error?.message || `Request failed: ${response.status}`);
  }

  return body as T;
}

export async function getProjectSummary(): Promise<ProjectSummary> {
  const summary = await requestJson<ProjectSummary>("/api/project/summary");
  const entries = await Promise.all((Object.entries(summary.resources) as Array<[ResourceType, ProjectSummary["resources"][ResourceType]]>)
    .map(async ([type, group]) => [
      type,
      { ...group, resources: await enrichResourceSummaries(type, group.resources) }
    ] as const));
  return {
    ...summary,
    resources: Object.fromEntries(entries) as ProjectSummary["resources"]
  };
}

export function getEditorHealth(): Promise<EditorHealth> {
  return requestJson<EditorHealth>("/api/health");
}

export async function listResources(type: ResourceType): Promise<{ type: ResourceType; resources: ResourceSummary[] }> {
  const body = await requestJson<{ type: ResourceType; resources: ResourceSummary[] }>(`/api/resources/${type}`);
  return {
    ...body,
    resources: await enrichResourceSummaries(type, body.resources)
  };
}

export function loadResource(type: ResourceType, id: string): Promise<{ type: ResourceType; id: string; data: ResourceRecord }> {
  return requestJson(`/api/resources/${type}/${id}`);
}

export function createResource(type: ResourceType, data: ResourceRecord): Promise<{ summary: ResourceSummary; data: ResourceRecord }> {
  return requestJson(`/api/resources/${type}`, {
    method: "POST",
    body: JSON.stringify({ data })
  });
}

export function saveResource(
  type: ResourceType,
  id: string,
  data: ResourceRecord
): Promise<{ summary: ResourceSummary; data: ResourceRecord }> {
  return requestJson(`/api/resources/${type}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ data })
  });
}

export function deleteResource(type: ResourceType, id: string): Promise<{ type: ResourceType; id: string }> {
  return requestJson(`/api/resources/${type}/${id}`, {
    method: "DELETE"
  });
}

export async function uploadProjectFile(
  relativePath: string,
  file: File
): Promise<{ relativePath: string; resPath: string; bytes: number }> {
  const dataBase64 = await fileToBase64(file);
  return requestJson("/api/files/upload", {
    method: "POST",
    body: JSON.stringify({ relativePath, dataBase64 })
  });
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function hasChapterScope(type: ResourceType) {
  return type === "dialogues" || type === "characters" || type === "items" || type === "story_assets";
}

async function enrichResourceSummaries(type: ResourceType, resources: ResourceSummary[]) {
  const needsChapterScope = hasChapterScope(type);
  const needsCharacterColor = type === "characters";
  const needsCharacterProtagonist = type === "characters";
  if (!needsChapterScope && !needsCharacterColor && !needsCharacterProtagonist) return resources;

  if (resources.every((resource) => (
    (!needsChapterScope || Array.isArray(resource.chapterIds))
    && (!needsCharacterColor || typeof resource.nameColor === "string")
    && (!needsCharacterProtagonist || typeof resource.isProtagonist === "boolean")
  ))) {
    return resources.map((resource) => ({
      ...resource,
      chapterIds: Array.isArray(resource.chapterIds) ? normalizeIdList(resource.chapterIds) : resource.chapterIds,
      nameColor: needsCharacterColor ? normalizeCharacterNameColor(resource.nameColor) : resource.nameColor,
      isProtagonist: needsCharacterProtagonist ? Boolean(resource.isProtagonist) : resource.isProtagonist
    }));
  }

  return Promise.all(resources.map(async (resource) => {
    if (
      (!needsChapterScope || Array.isArray(resource.chapterIds))
      && (!needsCharacterColor || typeof resource.nameColor === "string")
      && (!needsCharacterProtagonist || typeof resource.isProtagonist === "boolean")
    ) {
      return {
        ...resource,
        chapterIds: Array.isArray(resource.chapterIds) ? normalizeIdList(resource.chapterIds) : resource.chapterIds,
        nameColor: needsCharacterColor ? normalizeCharacterNameColor(resource.nameColor) : resource.nameColor,
        isProtagonist: needsCharacterProtagonist ? Boolean(resource.isProtagonist) : resource.isProtagonist
      };
    }

    try {
      const body = await loadResource(type, resource.id);
      return {
        ...resource,
        chapterIds: needsChapterScope ? getResourceChapterScopeIds(body.data) : resource.chapterIds,
        nameColor: needsCharacterColor ? normalizeCharacterNameColor(body.data.name_color) : resource.nameColor,
        isProtagonist: needsCharacterProtagonist ? normalizeCharacterProtagonist(body.data) : resource.isProtagonist
      };
    } catch {
      return {
        ...resource,
        chapterIds: needsChapterScope ? [] : resource.chapterIds,
        nameColor: needsCharacterColor ? normalizeCharacterNameColor(resource.nameColor) : resource.nameColor,
        isProtagonist: needsCharacterProtagonist ? Boolean(resource.isProtagonist) : resource.isProtagonist
      };
    }
  }));
}

function normalizeCharacterNameColor(value: unknown) {
  return String(value || "").trim() || "#ffffff";
}

function normalizeCharacterProtagonist(data: ResourceRecord) {
  if (readBooleanFlag(data.protagonist ?? data.is_protagonist ?? data.main_character)) return true;
  const metadata = data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
    ? data.metadata as ResourceRecord
    : {};
  return readBooleanFlag(metadata.protagonist ?? metadata.is_protagonist ?? metadata.main_character);
}

function readBooleanFlag(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const text = String(value ?? "").trim().toLowerCase();
  return ["true", "1", "yes", "on"].includes(text);
}

function getResourceChapterScopeIds(resource: ResourceRecord) {
  const metadata = resource.metadata && typeof resource.metadata === "object" && !Array.isArray(resource.metadata)
    ? resource.metadata as ResourceRecord
    : {};
  return normalizeIdList(resource.chapters ?? resource.chapter_ids ?? metadata.chapters ?? metadata.chapter_ids);
}

function normalizeIdList(value: unknown) {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? [value]
      : [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const raw of source) {
    const id = String(raw || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}
