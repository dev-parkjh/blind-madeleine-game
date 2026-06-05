import type { ProjectSummary, ResourceRecord, ResourceSummary, ResourceType } from "../types";

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

export function getProjectSummary(): Promise<ProjectSummary> {
  return requestJson<ProjectSummary>("/api/project/summary");
}

export function listResources(type: ResourceType): Promise<{ type: ResourceType; resources: ResourceSummary[] }> {
  return requestJson(`/api/resources/${type}`);
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

