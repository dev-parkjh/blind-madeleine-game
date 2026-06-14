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

assert.match(appJs, /function renderRigQualityReport\(report\)/, "rig quality report renderer should exist");
assert.match(appJs, /function buildRigQualityReport\(issues = \[\]\)/, "rig quality report builder should exist");
assert.match(appJs, /function imagePartHasRigBehavior\(part\)/, "image part rig behavior classifier should exist");
assert.match(appJs, /function adaptivePoseTagDiversity\(clip\)/, "adaptive pose tag diversity metric should exist");
assert.match(appJs, /function dialogueMotionClipReadiness\(clips = getMotionClips\(\)\)/, "dialogue clip readiness metric should exist");
assert.match(appJs, /elements\.rigValidation\.append\(renderRigQualityReport\(report\)\)/, "Rig Check panel should render the quality report");
assert.match(appJs, /Export Dialogue Set before game testing: missing/, "Rig Check should warn when dialogue motion clips are missing");
assert.match(appJs, /label: "Dialogue"[\s\S]*readyCount[\s\S]*adaptive\/idle\/talk\/viseme ready/, "report should include dialogue readiness");
assert.match(appJs, /label: "Motions"[\s\S]*adaptive \$\{adaptiveFrameCount\} frames/, "report should include adaptive motion frame count");
assert.match(appJs, /function addDuplicateIdIssues\(add, label, entries, getId\)/, "export validation should include duplicate-id gate");
for (const label of ["Image part", "Deformer group", "Custom parameter", "Motion clip", "Physics rule", "Expression preset", "Hit area"]) {
  assert.match(appJs, new RegExp(`addDuplicateIdIssues\\([\\s\\S]{0,80}"${label}"`), `${label} duplicate ids should be blocked before export`);
}
assert.match(appJs, /id is duplicated/, "duplicate id validation should produce a clear export error");

assert.match(css, /\.rig-quality-grid/, "rig quality grid should be styled");
assert.match(css, /\.rig-quality-card\.ok/, "rig quality ok state should be styled");
assert.match(css, /\.rig-quality-card\.warn/, "rig quality warning state should be styled");
assert.match(css, /\.rig-quality-card\.error/, "rig quality error state should be styled");

console.log("Rig quality smoke test passed.");
