import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptRoot, "..");

const appJs = await fs.readFile(path.join(projectRoot, "src", "app.js"), "utf8");

assert.match(appJs, /Export Rig Template/, "selected image part controls should expose template export");
assert.match(appJs, /Import Rig Template/, "selected image part controls should expose template import");
assert.match(appJs, /function exportImagePartRigTemplate\(part\)/, "image part rig template export function should exist");
assert.match(appJs, /kind: "image_part_rig_template"/, "image part templates should identify their format");
assert.match(appJs, /function requestImagePartRigTemplateImport\(part\)/, "template import file picker should exist");
assert.match(appJs, /async function importImagePartRigTemplate\(part, file\)/, "template import handler should exist");
assert.match(appJs, /function imagePartRigTemplatesFromImportedJson\(data\)/, "template payload extraction should exist");
assert.match(appJs, /function imagePartRigTemplateFromPart\(part\)/, "template serializer should exist");
assert.match(appJs, /function normalizedImagePartTemplateSource\(part\)/, "template source normalizer should exist");
assert.match(appJs, /function applyImagePartRigTemplate\(part, rawTemplate\)/, "template apply function should exist");
const applyStart = appJs.indexOf("function applyImagePartRigTemplate(part, rawTemplate)");
const applyEnd = appJs.indexOf("\nfunction ", applyStart + 1);
const applyBody = appJs.slice(applyStart, applyEnd === -1 ? appJs.length : applyEnd);
assert.match(appJs, /part\.bindX = template\.bindX/, "template should apply direct parameter bindings");
assert.match(appJs, /part\.visibilityGate = JSON\.parse\(JSON\.stringify\(template\.visibilityGate\)\)/, "template should apply visibility gates");
assert.match(appJs, /part\.transformDeformers = JSON\.parse\(JSON\.stringify\(template\.transformDeformers/, "template should apply transform keys");
assert.match(appJs, /part\.drawOrderDeformers = JSON\.parse\(JSON\.stringify\(template\.drawOrderDeformers/, "template should apply draw-order keys");
assert.match(appJs, /part\.mesh = JSON\.parse\(JSON\.stringify\(template\.mesh\)\)/, "template should apply mesh deformers");
assert.doesNotMatch(applyBody, /part\.path =/, "template import should not replace image paths");
assert.doesNotMatch(applyBody, /part\.x =/, "template import should not replace placement");
assert.doesNotMatch(applyBody, /part\.parentPartId =/, "template import should not replace parent relationships");

console.log("Image part template smoke test passed.");
