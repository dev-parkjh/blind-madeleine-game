import type { ResourceRecord, ValidationIssue } from "../../types";
import { isPlainRecord, normalizeSingleId } from "./shared";

export function validateDialogueLocations(value: unknown, nodeIds: Set<string>, issues: ValidationIssue[]) {
  const locationIds = new Set<string>();
  if (value === undefined || value === null) return locationIds;

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      if (!isPlainRecord(entry)) {
        issues.push({ severity: "warning", message: `metadata.locations[${index}]는 객체여야 합니다.` });
        return;
      }
      validateDialogueLocation(entry, `metadata.locations[${index}]`, nodeIds, locationIds, issues);
    });
    return locationIds;
  }

  if (isPlainRecord(value)) {
    Object.entries(value).forEach(([id, entry]) => {
      const cleanId = normalizeSingleId(id);
      if (!cleanId) return;
      if (typeof entry === "string") {
        if (locationIds.has(cleanId)) {
          issues.push({ severity: "warning", message: `metadata.locations.${cleanId}: 장소 id가 중복되었습니다: ${cleanId}` });
          return;
        }
        locationIds.add(cleanId);
        if (!nodeIds.has(entry.trim())) {
          issues.push({ severity: "warning", message: `metadata.locations.${cleanId}: node를 찾을 수 없습니다: ${entry}` });
        }
        return;
      }
      if (!isPlainRecord(entry)) {
        issues.push({ severity: "warning", message: `metadata.locations.${cleanId}는 노드 ID 문자열 또는 객체여야 합니다.` });
        return;
      }
      validateDialogueLocation({ id: cleanId, ...entry }, `metadata.locations.${cleanId}`, nodeIds, locationIds, issues);
    });
    return locationIds;
  }

  issues.push({ severity: "warning", message: "metadata.locations는 배열 또는 객체여야 합니다." });
  return locationIds;
}

function validateDialogueLocation(
  location: ResourceRecord,
  path: string,
  nodeIds: Set<string>,
  locationIds: Set<string>,
  issues: ValidationIssue[]
) {
  const id = normalizeSingleId(location.id ?? location.location_id ?? location.place_id ?? location.key);
  if (!id) {
    issues.push({ severity: "warning", message: `${path}: 장소 id가 비어 있습니다.` });
  } else if (locationIds.has(id)) {
    issues.push({ severity: "warning", message: `${path}: 장소 id가 중복되었습니다: ${id}` });
  } else {
    locationIds.add(id);
  }

  const nodeId = readLocationNodeId(location);
  if (!nodeId) {
    issues.push({ severity: "warning", message: `${path}: 장소 시작 node가 필요합니다.` });
  } else if (!nodeIds.has(nodeId)) {
    issues.push({ severity: "warning", message: `${path}: 장소 시작 node를 찾을 수 없습니다: ${nodeId}` });
  }
}

function readLocationNodeId(location: ResourceRecord) {
  return normalizeSingleId(location.node ?? location.node_id ?? location.start_node ?? location.start ?? location.target ?? location.next);
}
