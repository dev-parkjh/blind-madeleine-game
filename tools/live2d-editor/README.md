# Blind Madeleine Web Rig Editor

Standalone web project for building layered, parameter-driven character portraits and exporting them into the game data.

This project is a clean-room, game-specific rig editor. It does not use proprietary Live2D source, assets, file formats, or reverse-engineered internals.

## Run

When the local data editor runs from `tools/editor`, it starts this web rig editor automatically by default and exposes the URL through `/api/health`.

```bash
cd tools/live2d-editor
npm run start
```

Default URL:

```text
http://127.0.0.1:5187
```

Change host or port:

```bash
HOST=127.0.0.1 PORT=5190 npm run start
```

## Check

```bash
npm run check
```

The check command validates the server and browser script syntax, then runs a headless smoke test against a temporary local server. The smoke test creates a throwaway character, saves a generated Live2D portrait through `/api/characters/{id}/live2d-portrait`, verifies the character JSON, exported PNG/model files, motion frame set metadata, hit areas, and parameter bindings, then removes the temporary files.

To verify the game runtime consumes the same exported metadata:

```bash
npm run check:runtime
```

This runs Godot headlessly against `scripts/visual_novel/web_rig_runtime.gd`, using metadata-only exported portraits to verify adaptive pose selection, motion progress targeting, dialogue-frame cycling, hit-area tests, and `PortraitLayout` fallback resolution.

## What It Saves

The editor writes generated portraits to:

```text
assets/characters/{character_id}/{portrait_state}.png
assets/characters/{character_id}/{portrait_state}.live2d-web.json
```

It then updates:

```text
data/characters/{character_id}.json
```

The selected portrait state is stored under `portraits.{state}` with a normal `res://` image path, face center, profile crop, and a `live2d_model` path. Rig metadata is also mirrored under `metadata.live2d_web_model.portraits`, with a lightweight source index containing the last `source_model_path`, generated portrait count, image part count, deformer group, auto deformer group, nested deformer, warp deformer, visibility gate, and locked part counts, hit area summaries, parameter count, parameter binding summaries, expression preset summaries, motion clip summaries, exported motion frame sets, dialogue motion defaults, and the preferred adaptive clip id.

Use `Rig Check` before exporting to catch common JSON issues: missing image paths, broken parent or clip mask references, missing parameter bindings, malformed mesh vertex counts, empty motion clips, invalid physics targets, and duplicate preset ids. The panel also summarizes production readiness across parts, driven parameters, deformers, adaptive motion frames, and dialogue clips so the creator can see whether the rig is ready for game dialogue. Errors block `Save Portrait`, `Export Rig`, preset export, and motion frame export; warnings are shown but do not block export.

Imported image parts are stored as editable rig source assets:

```text
assets/characters/{character_id}/live2d_parts/{part_id}.png
```

These parts are included in the saved `.live2d-web.json` as `imageParts`. Each part can be placed in front of or behind the generated model, transformed independently, and bound to parameters for X/Y movement, rotation, scale, and opacity during motion preview and portrait export.

Use `Export Project` to save a portable `.live2d-web-project.json` bundle containing the rig JSON plus embedded image-part data URLs. `Import Project` restores that bundle into the currently selected character by re-uploading each embedded image part through the editor server and rewriting `imageParts[].path` to the restored `res://assets/characters/{character_id}/live2d_parts/...` files. This is the source-project backup path; `Export Rig` remains a lightweight JSON reference export and does not embed images.

Use `Add Images` to import one or more separated PNG/JPEG/WebP parts in a single operation. Newly imported parts keep the selected file order and receive consecutive `imageParts[].order` values after the current highest draw order.

Use `Import Layers` when separated artwork comes with a clean-room layer manifest. Select the image files together with `layers.json` or `manifest.json`; each manifest row can point at a file by `file`, `filename`, `image`, `imagePath`, or `path`, and can include `id`, `label`, `x`/`y` or `bounds`, `width`/`height`, `order`, `slot`, `parent`, `clipMask`, `opacity`, `blendMode`, bindings, visibility gates, hit areas, transform keys, draw-order keys, or mesh data. The importer uploads the images through the same `/live2d-part` asset path as normal image parts, applies name-based auto rigging, then reapplies manifest placement and rig data so external layer exports can become editable portrait rigs quickly without using proprietary PSD or Live2D formats. Use `Export Layers` to write the current image-part stack back to `*.layers.json`; `Export Project` also embeds that same `layerManifest` beside the rig and image data URLs for source handoff.

Imported image parts are auto-bound, auto-placed, auto-parented, auto-gated, auto-grouped, auto-meshed, and auto-deformed from their file or layer names. Names containing terms like `hair`, `bang`, `eye`, `mouth`, `brow`, `body`, `blush`, or `shadow` receive a clean-room default slot, approximate portrait position, parent hierarchy, visibility gate, deformer group, scale, mesh grid, mesh key parameter, mesh deformer keyframes, and parameter binding for head angle, blink, mouth open, breath, or hair sway. Use `Auto Bind` / `Auto Place` / `Auto Parent` / `Auto Gates` / `Auto Groups` / `Auto Mesh` / `Auto Deform` to reapply this to every image part, or `Auto Bind from Name` / `Auto Place from Name` / `Auto Parent from Name` / `Auto Gate from Name` / `Auto Mesh from Name` / `Auto Deform from Name` on the selected part. Full-canvas transparent PNG layers are detected and kept centered at their original scale.

Selected image parts can be reordered with `To Back`, `Down`, `Up`, and `To Front`. Reordering is scoped to the part's draw slot (`back` or `front`) and rewrites that slot's `imageParts[].order` values into a stable consecutive sequence.

Use `Duplicate` to copy a selected image part with the same source asset, mesh, bindings, masks, parent, transform keys, and draw slot. Use `Mirror Duplicate` for left/right paired parts; it mirrors X placement, `scaleX`, rotation, X binding strength, rotation binding strength, transform-key snapshots, side-sensitive transform / draw-order / mesh key values, and side-sensitive visibility gate ranges while assigning a new id and draw order.

Use `Export Rig Template` on a selected image part to save only its reusable rigging data: bindings, visibility gate, hit-area setup, transform keys, draw-order keys, mesh grid, and mesh deformers. `Import Rig Template` applies that data to the currently selected part while preserving the target part's image path, placement, parent, slot, and draw order, which makes repeated eyes, brows, mouth shapes, hair strands, or props faster to rig consistently.

Image parts can use another image part as a parent via `Parent`. The child stores `imageParts[].parentPartId` and inherits the parent's animated transform, opacity, mesh-safe canvas coordinates, and export rendering. Assigning or clearing a parent preserves the part's current world-space pose by adjusting its local transform; parent loops are ignored when rigs are imported.

Image parts can be locked with the layer-list lock checkbox or the selected part's `Lock canvas editing` toggle. Locked parts are still rendered and exported, but they are skipped by stage picking and cannot be moved, scaled, rotated, or mesh-edited on the canvas. This is useful for base head/body layers while editing smaller expression parts. The rig stores this under `imageParts[].locked`, and export mirrors the source count into `metadata.live2d_web_model.locked_part_count`.

Use the layer-list `S` button or the selected part's `Solo in preview` toggle to isolate one or more image parts while editing meshes, masks, gates, or hit areas. Solo preview affects only the editor canvas, overlays, and picking; it is not stored in `.live2d-web.json` and never changes exported portrait PNGs.

Image parts also support draw order, canvas blend modes, local clipping shapes, and clipping through another image part's alpha mask. These are stored as `imageParts[].order`, `blendMode`, `clipShape`, `clipPartId`, `clipInset`, and `clipRadius`, then applied during preview and PNG export.

Image parts can be conditionally visible from a parameter range. Enable `Use visibility gate`, choose `Gate Param`, then set `Visible Min`, `Visible Max`, and optional `Gate Fade`. `Auto Gates` detects names such as closed/open eye, iris, pupil, open/closed mouth, smile/frown mouth, blush, tear, sweat, or surprise marks and assigns practical ranges for `eyeOpen`, `mouthOpen`, `smile`, or `brow`. The rig stores this under `imageParts[].visibilityGate`; preview, picking, hit-area overlays, and PNG export use the same factor, so motion-frame exports can bake eye, mouth, hand, or prop swaps. Export mirrors these links into `metadata.live2d_web_model.visibility_gate_count` and `parameter_bindings[].visibility_gate_count` with the `visibility` channel.

Draw order can be keyed to parameters. Select a part, choose `Order Key Param`, change the part's draw order, then use `Set Draw Order Key at Current Param`. Keys are stored under `imageParts[].drawOrderDeformers[]` and interpolated before sorting parts for preview/export, so generated motion frames can bake front/back swaps such as hair, hands, or props crossing the face. Export mirrors these links into `metadata.live2d_web_model.parameter_bindings[].draw_order_key_count`.

Image part transforms can be keyed to parameters. Select a part, choose `Key Param`, adjust X/Y/scale/rotation/opacity, then use `Set Transform Key at Current Param`. Keys are stored under `imageParts[].transformDeformers[]` and are interpolated before preview and export. The selected parameter's keys are listed in the part panel, where individual keys can be loaded back into the editable transform or deleted.

Deformer groups can drive several image parts with one keyed transform. Use `Add Deformer`, choose affected image parts, set the group's X/Y/scale/rotation/opacity, then use `Set Group Key at Current Param`. Keys are stored under `deformerGroups[].keyframes[]` and applied around the group's center before preview and export. `Auto Groups` builds clean-room head, eye, brow, mouth, hair, body, and blush groups from image part names, preserving manual groups while replacing only groups marked with `deformerGroups[].autoGenerated`. Auto groups include parameter-driven transform keys and, where useful, warp keys so adaptive pose export can detect real rig influence immediately after import. Use `Parent Deformer` to nest one group under another; the child stores `deformerGroups[].parentGroupId`, inherits the parent's animated transform, and keeps its current world pose when the parent changes. Parent loops are ignored when rigs are imported. `Duplicate` copies the selected group with its affected parts, parent, transform keys, and warp keys. `Mirror Duplicate` builds left/right group pairs by mirroring X placement, `scaleX`, rotation, group-key snapshots, side-sensitive group / warp key values, and affected part ids or parent deformers when matching mirrored ids already exist. Enable `Use warp grid` to add a clean-room warp deformer to the same group; `Fit Bounds` sizes the warp box around affected parts, canvas handles edit `deformerGroups[].warp.vertices[]`, and `Set Warp Key at Current Param` stores parameter-driven warp snapshots under `deformerGroups[].warp.keyframes[]`. Selecting a deformer group draws its center, affected part outlines, combined bounds, and warp grid on the stage. Export mirrors this into `metadata.live2d_web_model.deformer_group_count`, `auto_deformer_group_count`, `deformer_parent_count`, `warp_deformer_count`, and each relevant `parameter_bindings[].deformer_group_count` / `warp_deformer_count` / `warp_key_count`.

Image parts can also be marked as hit areas. Enable `Use as hit area` on a selected part, then set a stable hit id, label, and kind. The rig stores this under `imageParts[].hitArea`, computes canvas-space and normalized bounds from the part's current world transform and mesh vertices when images are loaded, and export mirrors enabled areas into `metadata.live2d_web_model.hit_areas[]` for later game interaction hooks.

The stage `Hit areas` toggle draws enabled hit areas over the live rig preview. Selected parts use a stronger overlay, and the editor draws both the transformed polygon and bounding rect without baking those guides into exported portrait PNGs.

Export also mirrors parameter influence metadata into `metadata.live2d_web_model.parameter_bindings[]`. Each entry summarizes which parameter drives direct part bindings, visibility gates, transform keys, draw order keys, deformer groups, warp deformers, mesh deformers, physics rules, and motion keyframes, plus the affected image-part ids and channels. The main editor displays this as a rig-binding summary, and the runtime carries it on active portrait states as `live2d_parameter_bindings`. If an older or repaired character keeps only the `.live2d-web.json` rig path, the runtime can read that rig directly to recover hit areas and a lightweight parameter-binding summary.

Image parts can be selected and moved directly on the stage canvas; the editor checks topmost visible, unlocked parts first and uses source alpha where available so transparent pixels do not capture clicks. Parent-child coordinates are preserved while dragging, so child parts move visually in stage space and write back to their local `x`/`y` values. The selected part shows corner handles for scale and a top handle for rotation; hold `Shift` for uniform scale or 15-degree rotation snapping. Use the stage `Zoom` control or `Cmd/Ctrl` + mouse wheel to inspect mesh vertices, warp handles, and hit areas without changing rig coordinates or export resolution. `Fit` returns the canvas to the frame-fitted scale. Enable `Grid` to draw a non-exported rig-coordinate overlay, set `Step` for the spacing, and enable `Snap` to snap image-part movement, mesh vertices, and warp vertices to that grid; holding `Alt` temporarily inverts the snap state while dragging. Image parts also support a mesh deformer. Select an image part, create a mesh, then drag vertices directly on the stage canvas; vertex dragging takes priority over whole-part movement. Mesh data is stored under `imageParts[].mesh` and is applied when exporting the generated portrait PNG.

Mesh deformation can be keyed to parameters. Select a mesh part, choose `Mesh Key Param`, move a parameter slider such as `Angle X`, adjust vertices, then use `Set Mesh Key at Current Param`. Keys are stored under `imageParts[].mesh.deformers[]` and are interpolated in preview/export. Mesh key rows can also be loaded into the editable vertex grid or deleted one at a time.

Expression and pose presets can be saved from the current parameter values and mesh vertex state. They are stored under `expressionPresets[]` in the rig JSON and mirrored into character metadata as `metadata.live2d_web_model.expression_presets[]` with counts, auto-preset flags, pose tags, parameter counts, and mesh snapshot counts for the main editor. Use `Auto Presets` to generate common clean-room dialogue expressions such as neutral, happy, sad, angry, surprised, worried, curious, talk, blink, and laugh from the rig's parameter roles and influence map; manually saved presets are preserved while auto-generated presets are refreshed.

Saved expression presets also include a `Key` action. It writes the preset's parameter snapshot into the active motion clip at the current timeline time, replacing an existing key at that time when present. Mesh snapshots remain expression-preset data; motion keys continue to store parameter values so they interpolate through the normal motion system.

Use `Export JSON` and `Import JSON` in the Expressions panel to reuse saved clean-room expression presets across rigs. Import accepts a preset set, a full `.live2d-web.json` rig, or a single preset object, then appends normalized presets with collision-safe ids.

Use `Export Presets` to render every saved preset as its own portrait state. Each preset id becomes a `portraits.{preset_id}` entry in `data/characters/{character_id}.json`, so the main editor and game can select those generated expressions like normal portraits. Exported preset portraits also keep `live2d_expression_preset` metadata and a synthetic `live2d_motion_frame` under the `expression_presets` clip, including semantic `pose_tags`, `pose_score`, and sampled `parameter_values`; this lets the same adaptive pose selection path target preset expressions.

Custom parameters can be added from the Parameters panel. They are saved as `customParameters[]`, participate in part bindings, mesh keyforms, expression presets, and export just like the built-in parameters. Custom parameters also store a semantic `role` such as `gaze_x`, `eye_open`, `mouth_open`, `smile`, `brow`, `hair`, or `breath`; the role selector helps adaptive pose generation vary the parameter with a matching motion pattern and helps exported motion frames receive useful `pose_tags` / `pose_score` metadata. Character metadata mirrors this as `metadata.live2d_web_model.parameter_roles[]` and each relevant `parameter_bindings[].role`.

The Parameters panel also includes an `Influence` inspector. Pick a parameter to see which direct part bindings, visibility gates, transform keys, deformer groups, warp keys, mesh keys, stage image parts, physics rules, and motion clips it currently drives. Enable `Show on stage` to highlight directly driven parts in blue and child parts that inherit parent motion in amber. This is useful before adaptive pose export because it shows whether a parameter is actually connected to visible rig behavior.

`Rig Check` also reports runtime-readiness warnings for Live2D dialogue export, including missing motion clips, missing `adaptive_pose`, disabled adaptive parameters, too few adaptive export frames, low pose tag diversity, and weak hint matches for common dialogue cues.

Motion clips can be created from the Motion panel. Each clip is saved under `motionClips[]` with `duration` and `keyframes[]`; keyframes store parameter snapshots in `keyframes[].params` and an optional outgoing `keyframes[].easing` value. Supported easing values are `linear`, `smoothstep`, `ease_in`, `ease_out`, `ease_in_out`, and `hold`. Scrubbing or playing a motion applies interpolated parameters to the current rig preview, so image part bindings and mesh keyforms respond through the existing parameter system.

Use `Rename` to update a motion clip's display label and exported clip id, or `Copy` to duplicate the current clip with its duration, export frame count, keyframes, parameter snapshots, and easing. This makes it practical to branch an `idle_loop`, `talk_loop`, `viseme_set`, or `adaptive_pose` clip before changing timing or key values.

Use `Export JSON` to save the selected motion clip as a portable clean-room motion file, or `Export All JSON` to save every clip in one file. `Import JSON` accepts those files, a full `.live2d-web.json` rig, or a raw `motionClips[]` / `clips[]` array, then appends imported clips without overwriting existing ids.

The Motion timeline shows keyframe markers on a time strip. Click the strip to scrub, click a marker to jump to that key, drag a marker to retime it, or edit the key row's time field for precise numeric placement; the keyframe list and marker highlight follow the current timeline position.

The curve panel below the timeline visualizes the most active keyed parameters in the selected clip. It samples the same interpolation used by the preview, draws key dots and the current-time marker, and makes it easier to spot abrupt pose changes before exporting adaptive dialogue frames.

Enable `Onion skin` in the Motion panel to draw the previous and next sampled motion poses as translucent ghosts around the current time. `Ghost step` controls the time offset used for those samples and wraps at clip boundaries, making idle/talk loop seams easier to inspect. Onion skin is preview-only and is not baked into saved rigs or exported portrait PNGs.

Each keyframe row can be expanded to edit stored parameter values directly. `Apply` previews the key, `Update` replaces that key with the current parameter slider state, `Copy` stores its parameter snapshot and easing, `Mirror` flips left/right motion parameters such as gaze X and tilt, and `Paste Key` writes the copied snapshot at the current timeline time. Per-parameter sliders update the keyframe while previewing that exact key time.

Use `Auto Idle` or `Auto Talk` to generate clean-room baseline loop clips from the current rig parameters. `idle_loop` creates breathing, hair sway, subtle head movement, and a blink; `talk_loop` creates mouth and head variation for dialogue. Existing clips with the same ids can be replaced after confirmation.

Use `Auto Viseme` to generate a `viseme_set` clip with closed, A, I/E, O, U, and closed mouth poses. Exported frames receive `pose_tags` / `pose_score` values such as `viseme_a`, `viseme_i`, `viseme_o`, `viseme_u`, `viseme_closed`, `viseme`, and `phoneme`, so dialogue data can target them through `live2d_pose_hint` or by selecting `viseme_set` as a motion clip.

Use `Export Frames` to render the selected motion clip into several static portrait states. A clip named `idle_loop` exports states such as `idle_loop_f01`, `idle_loop_f02`, and so on, each written to `portraits.{state}` in the character JSON for immediate use by the editor and game. `Clip export frames` stores the selected clip's preferred `motionClips[].exportFrames` count and is also used by batch export. If physics is enabled, each exported frame samples `physics.rules[]` at the frame time after applying the motion keyframes.

Use `Export All Clips` to render every motion clip that has keyframes in one pass. Each clip uses its own stored or recommended frame count, so authored custom clips, duplicated variants, `viseme_set`, `idle_loop`, `talk_loop`, and `adaptive_pose` can all be pushed into the character portraits and `motion_frame_sets[]` metadata without selecting them one by one.

Use `Export Adaptive Poses` to generate an `adaptive_pose` clean-room pose set and export it as dialogue-ready still frames. The generator starts from safe baseline head, eye, brow, mouth, breath, and hair-sway poses, then analyzes the current rig's direct part bindings, transform keys, mesh deformers, physics rules, and existing motion keys. Custom parameters that actually drive the rig receive deterministic pose variation automatically. When a dialogue cast has no explicit `live2d_motion_clip`, the main editor preview and game runtime prefer `adaptive_pose` before falling back to idle or talk loops, so ordinary dialogue advance gets varied poses without hand-authoring a clip first.

Adaptive pose tuning is saved under `adaptivePose` and mirrored into character metadata as `metadata.live2d_web_model.adaptive_pose_tuning`. `Pose energy` scales the generated pose deltas, while the adaptive rig map lists the driven parameters, semantic role, estimated amplitude, influence score, and source channels. Uncheck a parameter to exclude it from future `Build Adaptive` and `Export Adaptive Poses` generation without deleting its rig bindings.

Use the Motion panel's `Dialogue pose preview` controls before exporting. `Build Adaptive` creates or replaces the `adaptive_pose` clip, and `Next Pose` / `Prev Pose` step through the same recommended frame times used for exported dialogue poses, letting you check how a character changes as dialogue advances. Choose a `Pose hint` such as `happy`, `sad`, `angry`, `curious`, `surprised`, `talk`, or `blink`, then use `Best Pose` to preview the frame that the exported `pose_tags` / `pose_score` metadata makes most likely for that dialogue cue. Direct emotional tags such as `angry`, `curious`, and `worried` are preserved in hint matching, while also expanding to compatible expression and gaze tags.

The pose frame list shows every recommended adaptive export frame for the selected hint, including its runtime selection score and exported pose tags. Click a frame row to preview that exact pose before exporting.

Use `Export Dialogue Set` to generate `idle_loop`, `talk_loop`, `viseme_set`, and `adaptive_pose`, then export their recommended frame counts in one pass. The adaptive clip is generated after the baseline dialogue clips so it can see the rig's existing motion ranges, and export writes `metadata.live2d_web_model.dialogue_motion_set` with the default adaptive, idle, talk, and viseme clip ids. The resulting portraits are immediately usable by the main editor's Live2D stage-cast controls and by the game runtime's adaptive pose selection, dialogue idle/talk switching, and typewriter-driven viseme targeting.

Use `Export Current` to render only the current timeline time as one portrait state. The default state id is `{clip_id}_t{milliseconds}`, and the exported portrait keeps the same `live2d_motion_frame` metadata so dialogue can target it by `live2d_motion_time`.

Exported motion frames include `live2d_motion_frame` portrait metadata with `clip_id`, `time`, `frame_index`, `frame_count`, `clip_duration`, `physics_sampled`, semantic `pose_tags`, `pose_score`, and sampled `parameter_values`. The character metadata also receives `metadata.live2d_web_model.motion_frame_sets[]`, grouping those exported states by clip id with their state keys, frame times, image paths, model paths, crop data, and pose metadata, plus `dialogue_motion_set` so the editor and runtime can use the same adaptive/idle/talk/viseme defaults. The game runtime reads the portrait metadata through `scripts/visual_novel/web_rig_runtime.gd` as an adaptive pose set: when a dialogue line advances and the speaker has no explicit portrait override, it can match `live2d_pose_hint` / inferred dialogue text cues to the best tagged frame, prefer a candidate whose `parameter_values` differ from the currently visible frame, penalize recently used equivalent frames to avoid repeated poses, then fall back to cycling the clip and uses the existing portrait transition animation. During dialogue typing, `viseme_set` frames tagged as `viseme_a`, `viseme_i`, `viseme_o`, `viseme_u`, or `viseme_closed` are selected from the current visible character before falling back to the talk loop. Runtime motion loops use `clip_duration` when available, then fall back to estimating the loop length from frame times for older exports.

Dialogue data can also target a clip time directly. Set `stage_cast.{character_id}.live2d_motion_clip` plus `live2d_motion_time` seconds or `live2d_motion_progress` from `0` to `1`; the runtime selects the nearest exported frame for that clip. If time/progress is omitted, use `live2d_pose_hint` values such as `happy`, `sad`, `angry`, `surprised`, `curious`, `talk`, or `blink` to select by exported pose tags. The same keys may be placed in node `metadata` as defaults for the current speaker.

Physics rules are saved under `physics.rules[]`. Each rule targets a parameter and stores an offset, amplitude, frequency, and phase. Use `Auto Physics` to regenerate clean-room secondary-motion rules from parameter roles and actual rig influence: breath, hair, body, gaze, tilt, and prop parameters that drive visible parts receive practical loop settings while manually authored physics rules are preserved. `Auto preview motion` evaluates those rules live, replacing the old fixed breath/hair sway preview with editable rig data.

The editor keeps an in-browser undo/redo history for rig edits and saves a local draft to `localStorage`. Use the top-bar `Undo`, `Redo`, and `Restore Draft` controls, or `Cmd/Ctrl+Z` and `Cmd/Ctrl+Shift+Z`/`Cmd/Ctrl+Y`.

If the Godot preview bridge is available at `GODOT_PREVIEW_ENDPOINT` or `http://127.0.0.1:51234`, the server also requests a Godot import for the generated PNG. Disable that with:

```bash
LIVE2D_GODOT_IMPORT_AUTO=0 npm run start
```

## Editor Handoff

Generated portraits are regular character portraits. In `tools/editor`, open the character portrait list, refresh/load the character, and the generated portrait appears with its `path`, crop controls, and `Live2D rig` source path. The `Live2D 편집` button opens this standalone editor for the same character and portrait state:

```text
http://127.0.0.1:5187/?character={character_id}&portrait={portrait_state}
```

Inside the standalone editor, use `Existing portrait` to pick one of the character's saved portrait states. If that state has a saved web rig, the editor reopens the matching `.live2d-web.json`; otherwise it only switches the `Portrait state` field. When opening a character or a new state, the editor can also fall back to `metadata.live2d_web_model.source_model_path`, so newly generated states start from the latest saved rig source. `Load State Rig` still reloads the exact state manually using the `live2d_model` path stored on `portraits.{state}`, the mirrored `metadata.live2d_web_model.portraits.{state}.model_path`, or a matching `metadata.live2d_web_model.motion_frame_sets[].states[].model_path` entry. This keeps repaired/imported character files usable even when the top-level `portraits` map has not been rebuilt yet.
