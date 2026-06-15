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

for (const id of ["exportProjectBundle", "importProjectBundle"]) {
  assert.match(html, new RegExp(`id="${id}"`), `${id} should exist in index.html`);
  assert.match(appJs, new RegExp(`${id}: document\\.querySelector\\("#${id}"\\)`), `${id} should be wired in app.js`);
}

assert.match(appJs, /async function exportProjectBundle\(\)/, "project bundle export function should exist");
assert.match(appJs, /kind: "portrait_rig_web_project"/, "project bundle should identify its clean-room format");
assert.match(appJs, /layerManifest: imagePartLayerManifest\(model\)/, "project bundle should embed a clean-room layer manifest");
assert.match(appJs, /async function imagePartProjectAssets\(model\)/, "project bundle should collect image part assets");
assert.match(appJs, /async function resAssetToDataUrl\(resPath\)/, "project bundle should embed res:// image assets");
assert.match(appJs, /function blobToDataUrl\(blob\)/, "project bundle should convert fetched assets to data URLs");
assert.match(appJs, /async function importProjectBundle\(file\)/, "project bundle import function should exist");
assert.match(appJs, /function projectBundleRig\(bundle\)/, "project bundle import should extract a rig document");
assert.match(appJs, /async function restoreProjectBundleAssets\(bundle, model\)/, "project bundle import should restore embedded assets");
assert.match(appJs, /\/portraitRig-part/, "project bundle import should re-upload embedded image parts");
assert.match(appJs, /part\.path = result\.path/, "project bundle import should rewrite restored part paths");
assert.match(appJs, /elements\.exportProjectBundle\.addEventListener\("click"/, "export project button should be interactive");
assert.match(appJs, /elements\.importProjectBundle\.addEventListener\("change"/, "import project input should be interactive");

console.log("Project bundle smoke test passed.");
