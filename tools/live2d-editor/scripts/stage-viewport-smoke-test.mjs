import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptRoot, "..");

const [html, appJs, css] = await Promise.all([
  fs.readFile(path.join(projectRoot, "index.html"), "utf8"),
  fs.readFile(path.join(projectRoot, "src", "app.js"), "utf8"),
  fs.readFile(path.join(projectRoot, "src", "styles.css"), "utf8")
]);

for (const id of ["stageZoom", "stageZoomLabel", "stageZoomFit", "showStageGrid", "snapStageGrid", "stageGridSize"]) {
  assert.match(html, new RegExp(`id="${id}"`), `${id} should exist in the stage overlay`);
  assert.match(appJs, new RegExp(`${id}: document\\.querySelector\\("#${id}"\\)`), `${id} should be wired in app.js elements`);
}

assert.match(appJs, /function stageViewportFitScale\(\)/, "stage viewport fit scale should be computed");
assert.match(appJs, /function applyStageViewportZoom\(\)/, "stage viewport zoom should be applied to canvas CSS size");
assert.match(appJs, /function resetStageViewportZoom\(\)/, "stage viewport fit reset should exist");
assert.match(appJs, /function handleStageViewportWheel\(event\)/, "stage viewport wheel zoom should exist");
assert.match(appJs, /function drawStageGridOverlay\(context, sourceRig = rig\)/, "stage grid overlay should be drawn only in the editor preview");
assert.match(appJs, /function snapCanvasPointToStageGrid\(point, event = null\)/, "stage grid snap point helper should exist");
assert.match(appJs, /snapWorldTransformToStageGrid\(\{[\s\S]*imagePartDragState\.startWorld/, "image part drag should snap world position");
assert.match(appJs, /globalPointToTransformLocal\(snapCanvasPointToStageGrid\(canvasPointerPoint\(event\), event\), transform\)/, "warp vertex drag should use grid snapping");
assert.match(appJs, /globalToPartLocal\(snapCanvasPointToStageGrid\(canvasPointerPoint\(event\), event\), part\)/, "mesh vertex drag should use grid snapping");
assert.match(appJs, /elements\.stageZoom\.addEventListener\("input"/, "stage zoom range should be interactive");
assert.match(appJs, /elements\.showStageGrid\.addEventListener\("change", draw\)/, "stage grid overlay toggle should be interactive");
assert.match(appJs, /elements\.snapStageGrid\.addEventListener\("change", draw\)/, "stage snap toggle should be interactive");
assert.match(appJs, /elements\.stageFrame\.addEventListener\("wheel", handleStageViewportWheel, \{ passive: false \}\)/, "stage wheel zoom should prevent default scrolling when active");
assert.match(css, /\.stage-frame\s*\{[\s\S]*overflow: auto;/, "stage frame should scroll when zoomed");
assert.match(css, /\.stage-zoom-controls/, "stage zoom controls should be styled");
assert.match(css, /\.stage-grid-controls/, "stage grid controls should be styled");

console.log("Stage viewport smoke test passed.");
