import type { ResourceRecord } from "../types";

export function normalizeJsonObject(value: unknown): ResourceRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as ResourceRecord : {};
}

export function isEmptyPlainRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0;
}

export function cloneJsonValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
