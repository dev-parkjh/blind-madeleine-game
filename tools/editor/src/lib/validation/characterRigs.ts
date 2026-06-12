import type { ResourceRecord, ValidationIssue } from "../../types";
import {
  imagePathExtensions,
  isPlainRecord,
  type ResourceMaps,
  validateNumberRange,
  validatePathExtension,
  validatePointArray,
  validateResPath,
  validateVector2
} from "./shared";

export function validateCharacterRig(data: ResourceRecord, issues: ValidationIssue[], maps: ResourceMaps) {
  const characterId = String(data.character_id || "").trim();
  if (characterId && !maps.characters.has(characterId)) {
    issues.push({ severity: "warning", message: `character_id가 등록되지 않은 캐릭터입니다: ${characterId}` });
  }
  if (!data.display_name) issues.push({ severity: "warning", message: "character_rig display_name이 비어 있습니다." });
  validateCanvas(data.canvas, issues);
  validateParts(data.parts, issues);
  validateStateMap(data.states, "states", issues, true);
  validateTrackMap(data.angle_tracks, "angle_tracks", issues);
  validateMotionTracks(data.motion_tracks, issues);
  validateGuides(data.editor, issues);
}

function validateCanvas(value: unknown, issues: ValidationIssue[]) {
  if (value === undefined) return;
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: "canvas는 객체 JSON이어야 합니다." });
    return;
  }
  validateNumberRange(value.width, "canvas.width", issues, { min: 1, max: 10000, optional: true });
  validateNumberRange(value.height, "canvas.height", issues, { min: 1, max: 10000, optional: true });
  validateVector2(value.origin, "canvas.origin", issues, { min: -10000, max: 10000, optional: true });
}

function validateParts(value: unknown, issues: ValidationIssue[]) {
  if (!Array.isArray(value)) {
    issues.push({ severity: "warning", message: "parts는 배열이어야 합니다." });
    return;
  }
  const ids = new Set<string>();
  for (const [index, rawPart] of value.entries()) {
    if (!isPlainRecord(rawPart)) {
      issues.push({ severity: "warning", message: `parts[${index}]는 객체 JSON이어야 합니다.` });
      continue;
    }
    const id = String(rawPart.id || "").trim();
    if (!id) issues.push({ severity: "warning", message: `parts[${index}].id가 비어 있습니다.` });
    if (id && ids.has(id)) issues.push({ severity: "warning", message: `중복 파츠 id가 있습니다: ${id}` });
    if (id) ids.add(id);
    validateResPath(rawPart.path, `parts[${index}].path`, issues, true);
    validatePathExtension(rawPart.path, `parts[${index}].path`, imagePathExtensions, issues);
    validateVector2(rawPart.pivot, `parts[${index}].pivot`, issues, { min: -10000, max: 10000, optional: true });
    validateTransform(rawPart.base_transform, `parts[${index}].base_transform`, issues);
    validateMesh(rawPart.mesh, `parts[${index}].mesh`, issues);
    validatePhysics(rawPart.physics, `parts[${index}].physics`, issues);
  }
}

function validateTransform(value: unknown, label: string, issues: ValidationIssue[]) {
  if (value === undefined) return;
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `${label}는 객체 JSON이어야 합니다.` });
    return;
  }
  validateVector2(value.position, `${label}.position`, issues, { min: -10000, max: 10000, optional: true });
  validateNumberRange(value.rotation, `${label}.rotation`, issues, { min: -360, max: 360, optional: true });
  validateVector2(value.scale, `${label}.scale`, issues, { min: -20, max: 20, optional: true });
  validateNumberRange(value.opacity, `${label}.opacity`, issues, { min: 0, max: 1, optional: true });
}

function validateMesh(value: unknown, label: string, issues: ValidationIssue[]) {
  if (value === undefined) return;
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `${label}는 객체 JSON이어야 합니다.` });
    return;
  }
  const vertices = Array.isArray(value.vertices) ? value.vertices : [];
  const uvs = Array.isArray(value.uvs) ? value.uvs : [];
  const triangles = Array.isArray(value.triangles) ? value.triangles : [];
  if (vertices.length > 0 && uvs.length > 0 && vertices.length !== uvs.length) {
    issues.push({ severity: "warning", message: `${label}.vertices와 uvs 길이가 다릅니다.` });
  }
  vertices.forEach((point, index) => validatePointArray(point, `${label}.vertices[${index}]`, issues, { length: 2, min: -10000, max: 10000 }));
  uvs.forEach((point, index) => validatePointArray(point, `${label}.uvs[${index}]`, issues, { length: 2, min: -10000, max: 10000 }));
  triangles.forEach((triangle, index) => validatePointArray(triangle, `${label}.triangles[${index}]`, issues, { length: 3, min: 0 }));
}

function validatePhysics(value: unknown, label: string, issues: ValidationIssue[]) {
  if (value === undefined) return;
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `${label}는 객체 JSON이어야 합니다.` });
    return;
  }
  validateNumberRange(value.mass, `${label}.mass`, issues, { min: 0, max: 100, optional: true });
  validateNumberRange(value.stiffness, `${label}.stiffness`, issues, { min: 0, max: 1000, optional: true });
  validateNumberRange(value.damping, `${label}.damping`, issues, { min: 0, max: 100, optional: true });
  validateNumberRange(value.gravity, `${label}.gravity`, issues, { min: -1000, max: 1000, optional: true });
  validateNumberRange(value.weight, `${label}.weight`, issues, { min: 0, max: 100, optional: true });
}

function validateStateMap(value: unknown, label: string, issues: ValidationIssue[], requireDefault = false) {
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `${label}는 객체 JSON이어야 합니다.` });
    return;
  }
  if (requireDefault && !Object.prototype.hasOwnProperty.call(value, "default")) {
    issues.push({ severity: "warning", message: `${label}.default 상태가 필요합니다.` });
  }
}

function validateTrackMap(value: unknown, label: string, issues: ValidationIssue[]) {
  if (value === undefined) return;
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `${label}는 객체 JSON이어야 합니다.` });
  }
}

function validateMotionTracks(value: unknown, issues: ValidationIssue[]) {
  if (value === undefined) return;
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: "motion_tracks는 객체 JSON이어야 합니다." });
    return;
  }
  for (const key of ["idle", "blink", "mouth"]) {
    if (value[key] !== undefined && !isPlainRecord(value[key])) {
      issues.push({ severity: "warning", message: `motion_tracks.${key}는 객체 JSON이어야 합니다.` });
    }
  }
}

function validateGuides(editor: unknown, issues: ValidationIssue[]) {
  if (editor === undefined) return;
  if (!isPlainRecord(editor)) {
    issues.push({ severity: "warning", message: "editor는 객체 JSON이어야 합니다." });
    return;
  }
  const guides = editor.guides;
  if (guides === undefined) return;
  if (!isPlainRecord(guides)) {
    issues.push({ severity: "warning", message: "editor.guides는 객체 JSON이어야 합니다." });
    return;
  }
  validateGuide(guides.base, "editor.guides.base", issues);
  if (isPlainRecord(guides.angles)) {
    for (const [key, guide] of Object.entries(guides.angles)) validateGuide(guide, `editor.guides.angles.${key}`, issues);
  }
}

function validateGuide(value: unknown, label: string, issues: ValidationIssue[]) {
  if (value === undefined) return;
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `${label}는 객체 JSON이어야 합니다.` });
    return;
  }
  validateResPath(value.path, `${label}.path`, issues, false);
  validatePathExtension(value.path, `${label}.path`, imagePathExtensions, issues);
  validateVector2(value.position, `${label}.position`, issues, { min: -2, max: 3, optional: true });
  validateNumberRange(value.rotation, `${label}.rotation`, issues, { min: -360, max: 360, optional: true });
  validateNumberRange(value.opacity, `${label}.opacity`, issues, { min: 0, max: 1, optional: true });
  validateNumberRange(value.scale, `${label}.scale`, issues, { min: 0.01, max: 20, optional: true });
}
