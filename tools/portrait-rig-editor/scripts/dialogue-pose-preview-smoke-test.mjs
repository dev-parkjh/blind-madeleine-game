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

for (const id of ["dialoguePoseText", "dialoguePoseTextHints", "previewDialogueTextPose"]) {
  assert.match(html, new RegExp(`id="${id}"`), `${id} should exist in the dialogue pose preview UI`);
  assert.match(appJs, new RegExp(`${id}: document\\.querySelector\\("#${id}"\\)`), `${id} should be wired in app.js elements`);
}

assert.match(appJs, /function inferDialoguePoseHintsFromText\(text\)/, "dialogue line text should infer pose hints");
assert.match(appJs, /function dominantDialogueVisemeHint\(text\)/, "dialogue line text should infer a dominant viseme hint");
assert.match(appJs, /function dialogueVisemeNameForCharacter\(character\)/, "dialogue line text should map Korean and Latin characters to visemes");
assert.match(appJs, /function bestDialoguePoseFrameForHints\(clip, frameTimes, hints\)/, "dialogue preview should score multiple inferred hints");
assert.match(appJs, /function previewDialogueTextPose\(\)/, "dialogue line preview action should exist");
assert.match(appJs, /elements\.dialoguePoseText\.addEventListener\("input", renderDialoguePosePreviewStatus\)/, "dialogue line edits should refresh the preview scoring");
assert.match(appJs, /elements\.previewDialogueTextPose\.addEventListener\("click", previewDialogueTextPose\)/, "dialogue line preview button should be interactive");
assert.match(appJs, /textContainsAny\(lower, \["하하", "ㅎㅎ"/, "Korean emotion hints should be recognized");
assert.match(appJs, /code >= 0xAC00 && code <= 0xD7A3/, "Hangul syllables should be mapped for viseme preview");

assert.match(css, /\.dialogue-pose-line textarea/, "dialogue line textarea should be styled");
assert.match(css, /\.dialogue-pose-text-hints/, "inferred pose hint chips should be styled");

console.log("Dialogue pose preview smoke test passed.");
