import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptRoot, "..");

const appJs = await fs.readFile(path.join(projectRoot, "src", "app.js"), "utf8");
const html = await fs.readFile(path.join(projectRoot, "index.html"), "utf8");
const readme = await fs.readFile(path.join(projectRoot, "README.md"), "utf8");

assert.match(html, /Import Layers/, "layer manifest import control should be visible");
assert.match(html, /id="importLayerBundle"/, "layer manifest file input should exist");
assert.match(html, /application\/json,\s*\.json/, "layer manifest input should accept JSON manifests");
assert.match(html, /Export Layers/, "layer manifest export control should be visible");
assert.match(html, /id="exportLayerManifest"/, "layer manifest export button should exist");
assert.match(appJs, /importLayerBundle: document\.querySelector\("#importLayerBundle"\)/, "layer manifest input should be registered");
assert.match(appJs, /exportLayerManifest: document\.querySelector\("#exportLayerManifest"\)/, "layer manifest export button should be registered");
assert.match(appJs, /async function importLayerBundleFiles\(files\)/, "layer manifest import handler should exist");
assert.match(appJs, /async function exportLayerManifest\(\)/, "layer manifest export handler should exist");
assert.match(appJs, /function imagePartLayerManifest\(model\)/, "layer manifest serializer should exist");
assert.match(appJs, /kind: "live2d_web_layer_manifest"/, "layer manifest export should identify its clean-room format");
assert.match(appJs, /function imagePartLayerManifestRecord\(part, index\)/, "layer manifest should serialize image parts");
assert.match(appJs, /function imagePartLayerManifestBounds\(part\)/, "layer manifest should include image-part bounds when images are loaded");
assert.match(appJs, /function layerBundleRecordsFromManifest\(data\)/, "layer manifest records should be normalized");
assert.match(appJs, /function layerBundleImageFileForRecord\(record, imageFiles\)/, "manifest rows should match selected image files");
assert.match(appJs, /function applyLayerBundleRecordToPart\(part, record, partReferenceMap = new Map\(\)\)/, "manifest rows should apply to image parts");
assert.match(appJs, /function applyLayerBundleBindings\(part, record\)/, "manifest rows should apply parameter bindings");
assert.match(appJs, /function layerBundleUsesNormalizedCoordinates\(record\)/, "normalized layer coordinates should require an explicit manifest hint");
assert.match(appJs, /async function uploadImagePart\(file, order, options = \{\}\)/, "image part upload should accept manifest options");
assert.match(appJs, /if \(partId\) body\.partId = partId/, "manifest import should preserve stable part ids during upload");
assert.match(appJs, /elements\.importLayerBundle\.addEventListener\("change"/, "layer manifest input should be wired");
assert.match(appJs, /elements\.exportLayerManifest\.addEventListener\("click"/, "layer manifest export button should be wired");
assert.match(readme, /Use `Import Layers`/, "README should document layer manifest import");
assert.match(readme, /Use `Export Layers`/, "README should document layer manifest export");
assert.match(readme, /without using proprietary PSD or Live2D formats/, "README should state the clean-room import boundary");

console.log("Layer manifest smoke test passed.");
