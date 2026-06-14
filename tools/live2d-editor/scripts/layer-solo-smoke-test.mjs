import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptRoot, "..");

const [appJs, css] = await Promise.all([
  fs.readFile(path.join(projectRoot, "src", "app.js"), "utf8"),
  fs.readFile(path.join(projectRoot, "src", "styles.css"), "utf8")
]);

assert.match(appJs, /let soloImagePartIds = new Set\(\);/, "solo image part state should be editor-only state");
assert.match(appJs, /function activeSoloImagePartIds\(sourceRig = rig\)/, "solo ids should be pruned against the active rig");
assert.match(appJs, /function imagePartMutedByEditorSolo\(sourceRig, part, options = \{\}\)/, "solo mute helper should exist");
assert.match(appJs, /function setImagePartSolo\(partId, enabled\)/, "layer list should be able to toggle solo preview");
assert.match(appJs, /function clearImagePartSolo\(\)/, "solo preview should have a clear action");
assert.match(appJs, /drawRig\(targetContext, targetRig, \{ clear: false, editorPreview: true \}\)/, "main preview onion-skin draw should pass editorPreview");
assert.match(appJs, /drawRig\(targetContext, targetRig, \{ editorPreview: isMainPreview \}\)/, "draw should only pass editorPreview for the main canvas");
assert.match(appJs, /drawImageParts\(context, sourceRig, "back", options\)/, "back image parts should receive draw options");
assert.match(appJs, /drawImageParts\(context, sourceRig, "front", options\)/, "front image parts should receive draw options");
assert.match(appJs, /if \(imagePartMutedByEditorSolo\(sourceRig, part, options\)\) return;/, "image part drawing should skip solo-muted parts");
assert.match(appJs, /ignoreEditorSolo: true/, "clip masks should still render while their owner is soloed");
assert.match(appJs, /imagePartContainsCanvasPoint\(rig, part, point, \{ editorPreview: true \}\)/, "picking should respect solo preview");
assert.doesNotMatch(appJs, /soloImagePartIds[\s\S]{0,120}(export|serialize|normalizeImageParts)/, "solo ids should not be serialized or exported");

assert.match(css, /\.layer-solo-notice/, "solo preview notice should be styled");
assert.match(css, /\.layer-row\.image-part\.solo-part/, "active solo rows should be styled");
assert.match(css, /\.layer-row\.image-part\.solo-muted/, "muted solo rows should be styled");
assert.match(css, /\.layer-row \.layer-solo-button\.active/, "active solo button should be styled");

console.log("Layer solo smoke test passed.");
