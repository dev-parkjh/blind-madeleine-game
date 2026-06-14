import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptRoot, "..");

const [html, appJs] = await Promise.all([
  fs.readFile(path.join(projectRoot, "index.html"), "utf8"),
  fs.readFile(path.join(projectRoot, "src", "app.js"), "utf8")
]);

for (const id of [
  "autoExpressionPresets",
  "exportExpressionPresetJson",
  "importExpressionPresetJsonButton",
  "importExpressionPresetJson"
]) {
  assert.match(html, new RegExp(`id="${id}"`), `${id} should exist in the expression panel`);
  assert.match(appJs, new RegExp(`${id}: document\\.querySelector\\("#${id}"\\)`), `${id} should be wired in app.js elements`);
}

assert.match(html, /Auto Presets/, "auto expression preset button should be visible");
assert.match(appJs, /function autoExpressionPresets\(\{ confirmReplace = true \} = \{\}\)/, "auto expression preset handler should exist");
assert.match(appJs, /function buildAutoExpressionPresets\(\)/, "auto expression preset builder should exist");
assert.match(appJs, /function autoExpressionPresetTemplates\(\)/, "auto expression templates should exist");
assert.match(appJs, /id: "happy"[\s\S]*id: "sad"[\s\S]*id: "angry"[\s\S]*id: "surprised"/, "auto expression templates should include common dialogue emotions");
assert.match(appJs, /function autoExpressionParams\(template\)/, "auto expression presets should map semantic roles to params");
assert.match(appJs, /manualPresets = existing\.filter\(\(preset\) => !isAutoExpressionPreset\(preset\)\)/, "auto expression generation should preserve manual presets");
assert.match(appJs, /function isAutoExpressionPreset\(preset\)/, "auto expression presets should be identifiable");
assert.match(appJs, /function exportExpressionPresetJson\(\)/, "expression preset JSON export function should exist");
assert.match(appJs, /autoExpressionKind/, "expression preset JSON should preserve auto expression kind");
assert.match(appJs, /function normalizePresetPoseTags\(value\)/, "expression preset pose tags should be normalized");
assert.match(appJs, /function normalizePresetPoseScore\(value\)/, "expression preset pose scores should be normalized");
assert.match(appJs, /poseScore,/, "expression preset JSON should preserve pose scores");
assert.match(appJs, /parameterValues: poseMetadata\.parameterValues/, "expression preset JSON should preserve parameter values");
assert.match(appJs, /preset\.params \|\| preset\.parameterValues \|\| preset\.parameter_values/, "expression preset import should accept parameterValues aliases");
assert.match(appJs, /function expressionPresetPoseMetadata\(preset, params\)/, "expression preset portrait exports should derive pose metadata");
assert.match(appJs, /expressionPreset:/, "expression preset portrait exports should attach expression metadata");
assert.match(appJs, /clipId: "expression_presets"/, "expression preset portrait exports should expose a synthetic motion clip");
assert.match(appJs, /modelForExpressionPreset\(preset, index, presets\.length\)/, "expression preset portrait exports should include frame index metadata");
assert.match(appJs, /async function importExpressionPresetsFromFiles\(files\)/, "expression preset JSON import function should exist");
assert.match(appJs, /function expressionPresetsFromImportedJson\(data\)/, "expression preset JSON source extraction should exist");
assert.match(appJs, /kind: "expression_preset_set"/, "export payload should identify expression preset sets");
assert.match(appJs, /Array\.isArray\(data\.expressionPresets\)/, "full rig expressionPresets arrays should be importable");
assert.match(appJs, /Array\.isArray\(data\.expressions\)/, "legacy expressions arrays should be importable");
assert.match(appJs, /uniqueExpressionPresetId\(baseId, nextPresets\)/, "import should avoid preset id collisions");
assert.match(appJs, /elements\.autoExpressionPresets\.addEventListener\("click"/, "auto expression preset button should be interactive");

console.log("Expression preset JSON smoke test passed.");
