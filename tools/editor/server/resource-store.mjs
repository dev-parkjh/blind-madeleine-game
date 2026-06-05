import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverRoot = path.dirname(fileURLToPath(import.meta.url));

export const editorRoot = path.resolve(serverRoot, "..");
export const repoRoot = path.resolve(editorRoot, "..", "..");

export const resourceTypes = Object.freeze({
  characters: {
    label: "캐릭터",
    singularLabel: "캐릭터",
    dataDir: ["data", "characters"],
    empty: (id) => ({
      id,
      display_name: "새 캐릭터",
      description: "",
      name_color: "#8FD8B8",
      portraits: {},
      metadata: {}
    })
  },
  items: {
    label: "아이템",
    singularLabel: "아이템",
    dataDir: ["data", "items"],
    empty: (id) => ({
      id,
      name: "새 아이템",
      description: "",
      metadata: {},
      chapters: []
    })
  },
  chapters: {
    label: "챕터",
    singularLabel: "챕터",
    dataDir: ["data", "chapters"],
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
  dialogues: {
    label: "대사",
    singularLabel: "대사",
    dataDir: ["data", "dialogues"],
    empty: (id) => ({
      id,
      label: "새 대사",
      chapters: [],
      nodes: []
    })
  },
  story_assets: {
    label: "스토리 에셋",
    singularLabel: "스토리 에셋",
    dataDir: ["data", "story_assets"],
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
});

const resourceIdPattern = /^[a-zA-Z0-9_-]+$/;
const allowedAssetRoots = [
  "assets/characters",
  "assets/items",
  "assets/chapters",
  "assets/story_assets",
  "assets/sfx"
];

export function getResourceMeta(type) {
  const meta = resourceTypes[type];
  if (!meta) {
    const error = new Error(`Unknown resource type: ${type}`);
    error.statusCode = 404;
    throw error;
  }
  return meta;
}

export function assertSafeResourceId(id) {
  if (typeof id !== "string" || !resourceIdPattern.test(id)) {
    const error = new Error("Resource id can only contain letters, numbers, underscores, and hyphens.");
    error.statusCode = 400;
    throw error;
  }
  return id;
}

export function resolveRepoPath(...segments) {
  const resolved = path.resolve(repoRoot, ...segments);
  if (resolved !== repoRoot && !resolved.startsWith(`${repoRoot}${path.sep}`)) {
    const error = new Error("Resolved path is outside the repository.");
    error.statusCode = 400;
    throw error;
  }
  return resolved;
}

export function normalizeAssetRelativePath(value) {
  const raw = String(value || "")
    .replace(/^res:\/\//, "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
  const normalized = path.posix.normalize(raw);

  if (!normalized || normalized === "." || normalized === ".." || normalized.startsWith("../")) {
    const error = new Error("Asset path must stay inside the repository.");
    error.statusCode = 400;
    throw error;
  }

  const allowed = allowedAssetRoots.some((root) => normalized === root || normalized.startsWith(`${root}/`));
  if (!allowed) {
    const error = new Error(`Asset uploads are only allowed under: ${allowedAssetRoots.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  return normalized;
}

function resourceDir(type) {
  const meta = getResourceMeta(type);
  return resolveRepoPath(...meta.dataDir);
}

function resourceFile(type, id) {
  assertSafeResourceId(id);
  return path.join(resourceDir(type), `${id}.json`);
}

async function readJson(filePath) {
  const contents = await fs.readFile(filePath, "utf8");
  return JSON.parse(contents);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function titleFrom(data, id) {
  return data?.label
    || data?.display_name
    || data?.title
    || data?.name
    || data?.path
    || id;
}

function subtitleFrom(type, data) {
  if (!data || typeof data !== "object") return "JSON";

  if (type === "dialogues") {
    const nodeCount = Array.isArray(data.nodes) ? data.nodes.length : 0;
    const chapterCount = Array.isArray(data.chapters) ? data.chapters.length : 0;
    return `${nodeCount} nodes · ${chapterCount} chapters`;
  }

  if (type === "chapters") {
    const order = Number.isFinite(data.order) ? `order ${data.order}` : "no order";
    const dialogueCount = Array.isArray(data.dialogues) ? data.dialogues.length : 0;
    return `${order} · ${dialogueCount} dialogues`;
  }

  if (type === "characters") {
    const portraitCount = data.portraits && typeof data.portraits === "object"
      ? Object.keys(data.portraits).length
      : 0;
    return `${portraitCount} portraits`;
  }

  if (type === "story_assets") {
    return [data.kind, data.path].filter(Boolean).join(" · ") || "asset";
  }

  if (Array.isArray(data.chapters)) {
    return `${data.chapters.length} chapters`;
  }

  return "JSON";
}

export function summarizeResource(type, id, data) {
  return {
    id,
    type,
    title: titleFrom(data, id),
    subtitle: subtitleFrom(type, data),
    hasIdMismatch: data?.id && data.id !== id
  };
}

export async function listResources(type) {
  const dir = resourceDir(type);
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });

  const summaries = await Promise.all(entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith(".") && name.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b))
    .map(async (name) => {
      const id = path.basename(name, ".json");
      const data = await readJson(path.join(dir, name));
      return summarizeResource(type, id, data);
    }));

  return summaries;
}

export async function loadResource(type, id) {
  const filePath = resourceFile(type, id);
  try {
    return await readJson(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      error.statusCode = 404;
      error.message = `Resource not found: ${type}/${id}`;
    }
    throw error;
  }
}

export async function saveResource(type, id, data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    const error = new Error("Resource body must be a JSON object.");
    error.statusCode = 400;
    throw error;
  }

  const dir = resourceDir(type);
  const filePath = resourceFile(type, id);
  const nextData = { ...data, id: data.id || id };
  const tmpPath = path.join(dir, `.${id}.${process.pid}.${Date.now()}.tmp`);

  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(tmpPath, `${JSON.stringify(nextData, null, 2)}\n`, "utf8");
  await fs.rename(tmpPath, filePath);

  return summarizeResource(type, id, nextData);
}

export async function deleteResource(type, id) {
  const filePath = resourceFile(type, id);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      error.statusCode = 404;
      error.message = `Resource not found: ${type}/${id}`;
    }
    throw error;
  }

  return { id, type };
}

export async function writeProjectAsset(relativePath, dataBase64) {
  const normalized = normalizeAssetRelativePath(relativePath);
  if (typeof dataBase64 !== "string" || !dataBase64.trim()) {
    const error = new Error("dataBase64 is required.");
    error.statusCode = 400;
    throw error;
  }

  const filePath = resolveRepoPath(...normalized.split("/"));
  const buffer = Buffer.from(dataBase64, "base64");
  if (buffer.byteLength === 0) {
    const error = new Error("Uploaded file is empty.");
    error.statusCode = 400;
    throw error;
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
  await fs.writeFile(tmpPath, buffer);
  await fs.rename(tmpPath, filePath);

  return {
    relativePath: normalized,
    resPath: `res://${normalized}`,
    bytes: buffer.byteLength
  };
}

export async function createResource(type, data = {}) {
  const id = assertSafeResourceId(data.id || randomUUID());
  const filePath = resourceFile(type, id);

  if (await fileExists(filePath)) {
    const error = new Error(`Resource already exists: ${type}/${id}`);
    error.statusCode = 409;
    throw error;
  }

  const meta = getResourceMeta(type);
  const nextData = { ...meta.empty(id), ...data, id };
  const summary = await saveResource(type, id, nextData);

  return { summary, data: nextData };
}

export async function projectSummary() {
  const entries = await Promise.all(Object.entries(resourceTypes).map(async ([type, meta]) => {
    const resources = await listResources(type);
    return [type, {
      type,
      label: meta.label,
      singularLabel: meta.singularLabel,
      count: resources.length,
      resources
    }];
  }));

  return {
    repoRoot,
    editorRoot,
    generatedAt: new Date().toISOString(),
    resources: Object.fromEntries(entries)
  };
}
