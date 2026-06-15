extends SceneTree

const WebRigRuntime = preload("res://scripts/visual_novel/web_rig_runtime.gd")
const PortraitLayout = preload("res://scripts/visual_novel/portrait_layout.gd")

var _failed := false


func _init() -> void:
	var profile := _build_profile()
	var frames := WebRigRuntime.get_motion_frame_portraits(profile)
	_expect(frames.size() == 3, "expected three adaptive motion frames")

	var neutral := _find_frame(frames, "neutral")
	var surprised := _find_frame(frames, "surprised")
	var talk := _find_frame(frames, "talk")
	_expect(not neutral.is_empty(), "neutral frame missing")
	_expect(not surprised.is_empty(), "surprised frame missing")
	_expect(not talk.is_empty(), "talk frame missing")
	_expect(String(surprised.get("path", "")) == "res://assets/characters/madeleine/surprised.png", "metadata-only image path missing")
	_expect(String(surprised.get("portrait_rig_model", "")) == "res://assets/characters/madeleine/surprised.portrait-rig.json", "metadata-only rig path missing")
	_expect(Vector2(surprised.get("center", Vector2.ZERO)).distance_to(Vector2(0.52, 0.2)) < 0.001, "metadata-only center missing")
	_expect((surprised.get("portrait_rig_hit_areas", []) as Array).size() == 1, "hit areas were not attached to frame state")
	var surprised_bindings: Array[Dictionary] = []
	for raw_binding in surprised.get("portrait_rig_parameter_bindings", []) as Array:
		if typeof(raw_binding) == TYPE_DICTIONARY:
			surprised_bindings.append(raw_binding)
	_expect(surprised_bindings.size() == 2, "parameter bindings were not attached to frame state")
	_expect(String(_find_binding(surprised_bindings, "mouthOpen").get("role", "")) == "mouth_open", "profile parameter binding role was not inferred")
	_expect(String(_find_binding(surprised_bindings, "angleX").get("role", "")) == "gaze_x", "profile gaze binding role was not inferred")
	var surprised_preset: Dictionary = surprised.get("portrait_rig_expression_preset", {})
	_expect(String(surprised_preset.get("id", "")) == "surprised", "expression preset metadata was not attached to frame state")
	_expect((surprised_preset.get("pose_tags", []) as Array).has("surprised"), "expression preset pose tags missing from frame state")
	_expect(String(WebRigRuntime.get_expression_preset_from_state(surprised).get("id", "")) == "surprised", "expression preset helper did not read frame state")
	var state_expression_profile := _build_profile()
	var state_expression_portraitRig: Dictionary = state_expression_profile["metadata"]["portrait_rig"]
	var state_expression_sets: Array = state_expression_portraitRig["motion_frame_sets"]
	var state_expression_states: Array = (state_expression_sets[0] as Dictionary)["states"]
	(state_expression_states[2] as Dictionary)["expression_preset"] = {
		"id": "talk_state_expr",
		"label": "Talk State Expression",
		"pose_tags": ["talk"],
		"pose_score": {"talk": 1.0},
		"parameter_values": {"mouthOpen": 0.55},
	}
	var state_expression_talk := _find_frame(WebRigRuntime.get_motion_frame_portraits(state_expression_profile), "talk")
	_expect(String((state_expression_talk.get("portrait_rig_expression_preset", {}) as Dictionary).get("id", "")) == "talk_state_expr", "motion frame state expression preset was not attached")
	var global_expression_profile := _build_profile()
	var global_expression_portraitRig: Dictionary = global_expression_profile["metadata"]["portrait_rig"]
	global_expression_portraitRig["expression_presets"] = [
		{
			"id": "talk_global_expr",
			"label": "Talk Global Expression",
			"pose_tags": ["talk", "open_mouth"],
			"pose_score": {"talk": 0.95, "open_mouth": 0.75},
			"parameter_values": {"mouthOpen": 0.55, "angleX": 0.2},
		},
	]
	var global_presets := WebRigRuntime.get_expression_presets_from_profile(global_expression_profile)
	_expect(global_presets.size() == 1 and String(global_presets[0].get("id", "")) == "talk_global_expr", "global expression presets were not read from profile")
	var global_expression_talk := _find_frame(WebRigRuntime.get_motion_frame_portraits(global_expression_profile), "talk")
	_expect(String((global_expression_talk.get("portrait_rig_expression_preset", {}) as Dictionary).get("id", "")) == "talk_global_expr", "global expression preset fallback did not match motion frame pose tags")
	var runtime_rig := _build_runtime_rig()
	var rig_hit_areas := WebRigRuntime.get_hit_areas_from_rig(runtime_rig)
	_expect(rig_hit_areas.size() == 1, "runtime rig hit area extraction failed")
	_expect(String(rig_hit_areas[0].get("id", "")) == "face", "runtime rig hit area id failed")
	var rig_bindings := WebRigRuntime.get_parameter_bindings_from_rig(runtime_rig)
	var mouth_binding := _find_binding(rig_bindings, "mouthOpen")
	var angle_binding := _find_binding(rig_bindings, "angleX")
	var hair_binding := _find_binding(rig_bindings, "hairSway")
	var tail_binding := _find_binding(rig_bindings, "tailWag")
	_expect(not mouth_binding.is_empty(), "runtime rig mouth binding missing")
	_expect(String(mouth_binding.get("role", "")) == "mouth_open", "runtime rig mouth binding role missing")
	_expect((mouth_binding.get("channels", []) as Array).has("opacity"), "runtime rig direct opacity channel missing")
	_expect((mouth_binding.get("channels", []) as Array).has("visibility"), "runtime rig visibility channel missing")
	_expect((mouth_binding.get("channels", []) as Array).has("mesh"), "runtime rig mesh channel missing")
	_expect((mouth_binding.get("motion_clip_ids", []) as Array).has("talk_loop"), "runtime rig motion clip id missing")
	_expect(not angle_binding.is_empty() and String(angle_binding.get("role", "")) == "gaze_x", "runtime rig angle role missing")
	_expect(not angle_binding.is_empty() and (angle_binding.get("channels", []) as Array).has("deformer_group"), "runtime rig deformer binding missing")
	_expect(not angle_binding.is_empty() and (angle_binding.get("channels", []) as Array).has("warp"), "runtime rig warp binding missing")
	_expect(not hair_binding.is_empty() and String(hair_binding.get("role", "")) == "hair", "runtime rig hair role missing")
	_expect(not hair_binding.is_empty() and int(hair_binding.get("physics_rule_count", 0)) == 1, "runtime rig physics binding missing")
	_expect(not tail_binding.is_empty() and String(tail_binding.get("role", "")) == "prop", "runtime rig custom parameter role missing")
	_expect(not tail_binding.is_empty() and (tail_binding.get("channels", []) as Array).has("motion"), "runtime rig custom parameter motion channel missing")
	var source_model_path := "user://portrait_rig_runtime_source_rig.json"
	var source_file := FileAccess.open(source_model_path, FileAccess.WRITE)
	if source_file == null:
		_expect(false, "could not create runtime source rig fixture")
	else:
		source_file.store_string(JSON.stringify(runtime_rig))
		source_file.close()
		var source_model_profile := _build_source_model_fallback_profile(source_model_path)
		var source_model_frame := _find_frame(WebRigRuntime.get_motion_frame_portraits(source_model_profile), "source_only")
		_expect(String(source_model_frame.get("portrait_rig_model", "")) == source_model_path, "source_model_path was not used as a frame rig fallback")
		_expect((source_model_frame.get("portrait_rig_hit_areas", []) as Array).size() == 1, "source_model_path rig did not backfill hit areas")
		var source_model_bindings: Array[Dictionary] = []
		for raw_binding in source_model_frame.get("portrait_rig_parameter_bindings", []) as Array:
			if typeof(raw_binding) == TYPE_DICTIONARY:
				source_model_bindings.append(raw_binding)
		_expect(not _find_binding(source_model_bindings, "mouthOpen").is_empty(), "source_model_path rig did not backfill parameter bindings")
		DirAccess.remove_absolute(ProjectSettings.globalize_path(source_model_path))
	var neutral_state := neutral.duplicate(true)
	neutral_state["portrait_key"] = "neutral"
	var neutral_to_surprised_distance := WebRigRuntime.get_motion_frame_parameter_distance(surprised, neutral_state)
	_expect(neutral_to_surprised_distance > 0.25 and neutral_to_surprised_distance <= 1.0, "parameter pose distance did not detect normalized Portrait Rig parameter change")
	_expect(WebRigRuntime.get_motion_frame_parameter_distance(neutral, neutral_state) <= 0.001, "parameter pose distance should be near zero for the same frame")
	var role_weight_state := {
		"parameter_values": {
			"mouthOpen": 0.0,
			"angleX": 0.0,
		},
		"portrait_rig_parameter_bindings": [
			{"parameter": "mouthOpen", "label": "Mouth Open", "role": "mouth_open"},
			{"parameter": "angleX", "label": "Angle X", "role": "gaze_x"},
		],
	}
	var mouth_only_distance := WebRigRuntime.get_motion_frame_parameter_distance({
		"parameter_values": {
			"mouthOpen": 1.0,
			"angleX": 0.0,
		},
		"portrait_rig_parameter_bindings": role_weight_state["portrait_rig_parameter_bindings"],
	}, role_weight_state)
	var gaze_only_distance := WebRigRuntime.get_motion_frame_parameter_distance({
		"parameter_values": {
			"mouthOpen": 0.0,
			"angleX": 1.0,
		},
		"portrait_rig_parameter_bindings": role_weight_state["portrait_rig_parameter_bindings"],
	}, role_weight_state)
	_expect(gaze_only_distance > mouth_only_distance * 1.6, "semantic role weighting should favor pose/gaze changes over mouth-only motion")
	var role_only_profile := _build_profile()
	var role_only_portraitRig: Dictionary = role_only_profile["metadata"]["portrait_rig"]
	role_only_portraitRig.erase("parameter_bindings")
	role_only_portraitRig["parameter_roles"] = [
		{"parameter": "mouthOpen", "label": "Mouth Open", "role": "mouth_open"},
		{"parameter": "angleX", "label": "Angle X", "role": "gaze_x"},
	]
	var role_only_frames := WebRigRuntime.get_motion_frame_portraits(role_only_profile)
	var role_only_surprised := _find_frame(role_only_frames, "surprised")
	var role_only_surprised_bindings: Array[Dictionary] = []
	for raw_binding in role_only_surprised.get("portrait_rig_parameter_bindings", []) as Array:
		if typeof(raw_binding) == TYPE_DICTIONARY:
			role_only_surprised_bindings.append(raw_binding)
	_expect(String(_find_binding(role_only_surprised_bindings, "mouthOpen").get("role", "")) == "mouth_open", "profile parameter_roles fallback did not attach mouth role")
	_expect(String(_find_binding(role_only_surprised_bindings, "angleX").get("role", "")) == "gaze_x", "profile parameter_roles fallback did not attach gaze role")
	var expression_only_distance := WebRigRuntime.get_motion_frame_parameter_distance(
		{"portrait_rig_expression_preset": {"id": "happy", "label": "Happy"}},
		{"portrait_rig_expression_preset": {"id": "neutral", "label": "Neutral"}}
	)
	_expect(absf(expression_only_distance - 0.65) < 0.001, "expression-only pose distance fallback failed")

	var portrait_entry := PortraitLayout.resolve_portrait_entry(profile, "surprised")
	_expect(String(portrait_entry.get("portrait_rig_model", "")) == "res://assets/characters/madeleine/surprised.portrait-rig.json", "PortraitLayout did not resolve metadata-only rig")
	var portrait_frame: Dictionary = portrait_entry.get("portrait_rig_motion_frame", {})
	_expect(String(portrait_frame.get("clip_id", "")) == "adaptive_pose", "PortraitLayout did not resolve metadata-only motion frame")
	var portrait_expression_preset: Dictionary = portrait_entry.get("portrait_rig_expression_preset", {})
	_expect(String(portrait_expression_preset.get("id", "")) == "surprised", "PortraitLayout did not resolve metadata-only expression preset")

	var camel_alias_profile := _build_camel_alias_profile()
	var camel_motion_set := WebRigRuntime.get_dialogue_motion_set_from_profile(camel_alias_profile)
	_expect(String(camel_motion_set.get("adaptive_clip_id", "")) == "camel_adaptive", "camelCase dialogueMotionSet adaptiveClipId was not normalized")
	var camel_alias_sets := WebRigRuntime.get_motion_frame_sets_from_profile(camel_alias_profile)
	_expect(camel_alias_sets.size() == 1, "camelCase motionFrameSets were not collected")
	var camel_alias_frames := WebRigRuntime.get_motion_frame_portraits(camel_alias_profile)
	_expect(camel_alias_frames.size() == 2, "camelCase metadata frames were not collected")
	var camel_pose := _find_frame(camel_alias_frames, "camel_pose")
	_expect(String(camel_pose.get("path", "")) == "res://assets/characters/madeleine/camel_pose.png", "camelCase frame set imagePath was not read")
	_expect(String(camel_pose.get("portrait_rig_model", "")) == "res://assets/characters/madeleine/camel_pose.portrait-rig.json", "camelCase frame set modelPath was not read")
	_expect(String(camel_pose.get("clip_id", "")) == "camel_adaptive", "camelCase frame set clipId was not normalized")
	_expect(float((camel_pose.get("parameter_values", {}) as Dictionary).get("angleX", 0.0)) > 0.19, "camelCase frame parameterValues were not normalized")
	_expect((camel_pose.get("portrait_rig_hit_areas", []) as Array).size() == 1, "camelCase hitAreas were not attached to frame state")
	_expect((camel_pose.get("portrait_rig_parameter_bindings", []) as Array).size() == 1, "camelCase parameterBindings were not attached to frame state")
	_expect(String((camel_pose.get("portrait_rig_expression_preset", {}) as Dictionary).get("id", "")) == "camel_curious", "camelCase expressionPresets did not match frame pose tags")
	var camel_metadata_entry := PortraitLayout.resolve_portrait_entry(camel_alias_profile, "camel_metadata")
	_expect(String(camel_metadata_entry.get("path", "")) == "res://assets/characters/madeleine/camel_metadata.png", "PortraitLayout did not resolve camelCase metadata imagePath")
	_expect(String(camel_metadata_entry.get("portrait_rig_model", "")) == "res://assets/characters/madeleine/camel_metadata.portrait-rig.json", "PortraitLayout did not resolve camelCase metadata modelPath")
	var camel_metadata_frame: Dictionary = camel_metadata_entry.get("portrait_rig_motion_frame", {})
	_expect(String(camel_metadata_frame.get("clip_id", "")) == "camel_adaptive", "PortraitLayout did not normalize camelCase metadata motionFrame")
	var camel_hint_key := WebRigRuntime.select_next_motion_frame_portrait_key(
		camel_alias_profile,
		"madeleine",
		{"portraitRigMotionClip": "camel_adaptive", "poseHint": "curious"},
		{},
		"camel_dialogue",
		"camel_node",
		{},
		{}
	)
	_expect(camel_hint_key == "camel_pose", "camelCase stage-cast aliases did not select the tagged motion frame")

	var camel_top_level_profile := _build_camel_top_level_alias_profile()
	var camel_top_level_motion_set := WebRigRuntime.get_dialogue_motion_set_from_profile(camel_top_level_profile)
	_expect(String(camel_top_level_motion_set.get("adaptive_clip_id", "")) == "camel_adaptive", "top-level portraitRig dialogueMotionSet was not read")
	_expect(WebRigRuntime.get_hit_areas_from_profile(camel_top_level_profile).size() == 1, "top-level portraitRig hitAreas were not read")
	_expect(WebRigRuntime.get_parameter_bindings_from_profile(camel_top_level_profile).size() == 1, "top-level portraitRig parameterBindings were not read")
	_expect(WebRigRuntime.get_expression_presets_from_profile(camel_top_level_profile).size() == 1, "top-level portraitRig expressionPresets were not read")
	var camel_top_level_frames := WebRigRuntime.get_motion_frame_portraits(camel_top_level_profile)
	_expect(camel_top_level_frames.size() == 2, "top-level portraitRig motion frames were not collected")
	var camel_top_level_portrait := PortraitLayout.resolve_portrait_entry(camel_top_level_profile, "camel_metadata")
	_expect(String(camel_top_level_portrait.get("path", "")) == "res://assets/characters/madeleine/camel_metadata.png", "PortraitLayout did not resolve top-level portraitRig metadata portrait")

	var adaptive_frames := WebRigRuntime.get_motion_frames_for_clip(profile, "")
	_expect(adaptive_frames.size() == 3, "preferred adaptive clip did not return all frames")
	_expect(String(adaptive_frames[0].get("key", "")) == "neutral", "adaptive frames were not sorted by frame index")
	var dialogue_motion_set := WebRigRuntime.get_dialogue_motion_set_from_profile(profile)
	_expect(String(dialogue_motion_set.get("idle_clip_id", "")) == "idle_loop", "dialogue idle clip metadata missing")
	_expect(String(dialogue_motion_set.get("talk_clip_id", "")) == "talk_loop", "dialogue talk clip metadata missing")
	_expect(absf(WebRigRuntime.get_motion_frame_loop_duration(adaptive_frames) - 1.2) < 0.001, "clip duration was not read from metadata")
	_expect(absf(WebRigRuntime.get_motion_animation_sync_duration({"duration": 1.4}) - 1.4) < 0.001, "loop animation sync duration was not read")
	_expect(absf(WebRigRuntime.get_motion_animation_sync_duration({
		"dialogue_motion": true,
		"idle_duration": 1.6,
		"talk_duration": 0.9,
	}) - 1.6) < 0.001, "dialogue animation sync duration should use idle/talk duration")
	_expect(absf(WebRigRuntime.get_motion_animation_sync_duration({
		"dialogue_motion": true,
		"idle_duration": 1.0,
		"talk_duration": 1.2,
		"viseme_duration": 2.2,
	}) - 2.2) < 0.001, "dialogue animation sync duration should include viseme duration")
	_expect(String(WebRigRuntime.select_motion_frame_at_time(adaptive_frames, 0.72).get("key", "")) == "surprised", "time selection did not pick expected frame")
	_expect(String(WebRigRuntime.select_motion_frame_at_time(adaptive_frames, 1.25).get("key", "")) == "neutral", "looped time selection did not wrap")
	_expect(WebRigRuntime.select_nearest_motion_frame_portrait_key(profile, "adaptive_pose", 1.08) == "talk", "nearest frame selection failed")

	var viseme_profile := _build_profile_with_viseme_set()
	var viseme_frames := WebRigRuntime.get_motion_frames_for_clip(viseme_profile, "viseme_set")
	_expect(viseme_frames.size() == 4, "viseme_set frames missing")
	_expect(String(WebRigRuntime.select_motion_frame_for_pose_tags(viseme_frames, ["viseme_o"], {}, "viseme_o").get("key", "")) == "viseme_o", "viseme_o did not select matching frame")
	_expect(String(WebRigRuntime.select_motion_frame_for_pose_tags(viseme_frames, ["viseme_closed"], {}, "viseme_closed").get("key", "")) == "viseme_closed", "viseme_closed did not select matching frame")
	var dialogue_ready_profile := _build_dialogue_ready_profile()
	var ready_motion_set := WebRigRuntime.get_dialogue_motion_set_from_profile(dialogue_ready_profile)
	_expect(bool(ready_motion_set.get("ready", false)), "dialogue-ready profile should preserve ready metadata")
	_expect((ready_motion_set.get("complete_exported_clip_ids", []) as Array).has("talk_loop"), "complete dialogue clip metadata missing talk_loop")
	var ready_default_frames := WebRigRuntime.get_motion_frames_for_clip(dialogue_ready_profile, "")
	var ready_idle_frames := WebRigRuntime.get_motion_frames_for_clip(dialogue_ready_profile, "idle_loop")
	var ready_talk_frames := WebRigRuntime.get_motion_frames_for_clip(dialogue_ready_profile, "talk_loop")
	var ready_viseme_frames := WebRigRuntime.get_motion_frames_for_clip(dialogue_ready_profile, "viseme_set")
	_expect(ready_default_frames.size() == 3 and String(ready_default_frames[0].get("clip_id", "")) == "adaptive_pose", "dialogue-ready default frames should prefer adaptive_pose")
	_expect(ready_idle_frames.size() == 2, "dialogue-ready idle_loop frames missing")
	_expect(ready_talk_frames.size() == 3, "dialogue-ready talk_loop frames missing")
	_expect(ready_viseme_frames.size() == 4, "dialogue-ready viseme_set frames missing")
	_expect(String(WebRigRuntime.select_motion_frame_at_time(ready_idle_frames, 1.1).get("key", "")) == "idle_01", "dialogue-ready idle loop did not wrap by duration")
	_expect(String(WebRigRuntime.select_motion_frame_for_pose_tags(ready_viseme_frames, ["viseme_o"], {}, "ready_viseme").get("key", "")) == "viseme_o", "dialogue-ready viseme selection failed")
	var ready_talk_key := WebRigRuntime.select_next_motion_frame_portrait_key(
		dialogue_ready_profile,
		"madeleine",
		{"portrait_rig_motion_clip": "talk_loop", "portrait_rig_pose_hint": "open_mouth"},
		neutral_state,
		"dialogue_ready_smoke",
		"node_talk_hint",
		{},
		{}
	)
	_expect(ready_talk_key == "talk_open", "dialogue-ready talk_loop hint did not select open-mouth talk frame")
	_expect(absf(WebRigRuntime.get_motion_animation_sync_duration({
		"dialogue_motion": true,
		"idle_duration": WebRigRuntime.get_motion_frame_loop_duration(ready_idle_frames),
		"talk_duration": WebRigRuntime.get_motion_frame_loop_duration(ready_talk_frames),
		"viseme_duration": WebRigRuntime.get_motion_frame_loop_duration(ready_viseme_frames),
	}) - 1.2) < 0.001, "dialogue-ready sync duration should use longest ready clip")

	var portrait_only_profile := _build_portrait_only_dialogue_profile()
	var inferred_motion_set := WebRigRuntime.get_dialogue_motion_set_from_profile(portrait_only_profile)
	_expect(bool(inferred_motion_set.get("inferred_from_motion_frames", false)), "portrait-only dialogue motion set should be inferred from frame metadata")
	_expect(bool(inferred_motion_set.get("ready", false)), "portrait-only dialogue motion set should be ready")
	_expect(String(inferred_motion_set.get("adaptive_clip_id", "")) == "adaptive_pose", "portrait-only adaptive clip inference failed")
	_expect(String(inferred_motion_set.get("idle_clip_id", "")) == "idle_loop", "portrait-only idle clip inference failed")
	_expect(String(inferred_motion_set.get("talk_clip_id", "")) == "talk_loop", "portrait-only talk clip inference failed")
	_expect(String(inferred_motion_set.get("viseme_clip_id", "")) == "viseme_set", "portrait-only viseme clip inference failed")
	_expect((inferred_motion_set.get("complete_exported_clip_ids", []) as Array).has("talk_loop"), "portrait-only complete clip inference missing talk_loop")
	var portrait_only_default_frames := WebRigRuntime.get_motion_frames_for_clip(portrait_only_profile, "")
	var portrait_only_talk_frames := WebRigRuntime.get_motion_frames_for_clip(portrait_only_profile, "talk_loop")
	_expect(portrait_only_default_frames.size() == 2 and String(portrait_only_default_frames[0].get("clip_id", "")) == "adaptive_pose", "portrait-only default frames should prefer inferred adaptive_pose")
	_expect(portrait_only_talk_frames.size() == 2, "portrait-only talk frames missing")

	var cycle_indices := {}
	var node_cache := {}
	var hinted_key := WebRigRuntime.select_next_motion_frame_portrait_key(
		profile,
		"madeleine",
		{"portrait_rig_pose_hint": "surprised"},
		neutral_state,
		"dialogue_smoke",
		"node_hint",
		cycle_indices,
		node_cache
	)
	_expect(hinted_key == "surprised", "pose hint did not select the strongest tagged frame")

	var repeated_profile := _build_profile_with_repeated_surprised_tags()
	var recent_cycle_indices := {
		"madeleine:adaptive_pose:recent_keys": ["surprised"],
	}
	var recent_avoid_key := WebRigRuntime.select_next_motion_frame_portrait_key(
		repeated_profile,
		"madeleine",
		{"portrait_rig_pose_hint": "surprised"},
		neutral_state,
		"dialogue_smoke",
		"node_recent_surprised_hint",
		recent_cycle_indices,
		{}
	)
	_expect(recent_avoid_key == "surprised_alt", "recent pose history should avoid repeating an equivalent tagged frame")
	var recent_keys: Array = recent_cycle_indices.get("madeleine:adaptive_pose:recent_keys", [])
	_expect(not recent_keys.is_empty() and String(recent_keys[0]) == "surprised_alt", "recent pose history was not updated after tagged selection")

	var duplicate_signature_profile := _build_profile_with_duplicate_surprised_signature()
	var duplicate_signature_indices := {}
	var duplicate_time_key := WebRigRuntime.select_next_motion_frame_portrait_key(
		duplicate_signature_profile,
		"madeleine",
		{"portrait_rig_motion_time": 0.6},
		neutral_state,
		"dialogue_smoke",
		"node_duplicate_signature_time",
		duplicate_signature_indices,
		{}
	)
	_expect(duplicate_time_key == "surprised", "motion time should seed recent pose signature with the nearest frame")
	var recent_signatures: Array = duplicate_signature_indices.get("madeleine:adaptive_pose:recent_signatures", [])
	_expect(not recent_signatures.is_empty(), "recent pose signature history was not updated after timed selection")
	var duplicate_avoid_key := WebRigRuntime.select_next_motion_frame_portrait_key(
		duplicate_signature_profile,
		"madeleine",
		{"portrait_rig_pose_hint": "surprised"},
		neutral_state,
		"dialogue_smoke",
		"node_duplicate_signature_hint",
		duplicate_signature_indices,
		{}
	)
	_expect(duplicate_avoid_key == "surprised_alt", "recent pose signature should avoid key-renamed duplicate frames")

	var emotion_profile := _build_profile_with_emotion_tags()
	var angry_key := WebRigRuntime.select_next_motion_frame_portrait_key(
		emotion_profile,
		"madeleine",
		{"portrait_rig_pose_hint": "angry"},
		neutral_state,
		"dialogue_smoke",
		"node_angry_hint",
		{},
		{}
	)
	_expect(angry_key == "angry", "angry pose hint should match direct angry metadata")
	var curious_key := WebRigRuntime.select_next_motion_frame_portrait_key(
		emotion_profile,
		"madeleine",
		{"portrait_rig_pose_hint": "curious"},
		neutral_state,
		"dialogue_smoke",
		"node_curious_hint",
		{},
		{}
	)
	_expect(curious_key == "curious", "curious pose hint should match direct curious metadata")

	var progress_key := WebRigRuntime.select_next_motion_frame_portrait_key(
		profile,
		"madeleine",
		{"portrait_rig_motion_progress": 0.5},
		neutral_state,
		"dialogue_smoke",
		"node_progress",
		cycle_indices,
		node_cache
	)
	_expect(progress_key == "surprised", "motion progress did not select nearest metadata frame")

	var simple_cycle_indices := {}
	var simple_node_cache := {}
	var cycled_key := WebRigRuntime.select_next_motion_frame_portrait_key(
		profile,
		"madeleine",
		{},
		neutral_state,
		"dialogue_smoke",
		"node_cycle",
		simple_cycle_indices,
		simple_node_cache
	)
	_expect(cycled_key == "surprised", "dialogue advance did not cycle to the next adaptive frame")

	var natural_profile := _build_profile_with_natural_pose_distance()
	var natural_key := WebRigRuntime.select_next_motion_frame_portrait_key(
		natural_profile,
		"madeleine",
		{},
		neutral_state,
		"dialogue_smoke",
		"node_natural_distance",
		{},
		{}
	)
	_expect(natural_key == "natural_shift", "dialogue advance should prefer a moderate pose change over tiny or abrupt frames, got %s" % natural_key)

	var mixed_profile := _build_profile_with_idle_loop()
	var idle_state := {
		"portrait_key": "idle_01",
		"portrait_rig_motion_frame": {
			"clip_id": "idle_loop",
			"time": 0.0,
			"frame_index": 0,
			"frame_count": 2,
			"clip_duration": 1.0,
		},
	}
	var adaptive_from_idle_key := WebRigRuntime.select_next_motion_frame_portrait_key(
		mixed_profile,
		"madeleine",
		{"portrait_rig_pose_hint": "surprised"},
		idle_state,
		"dialogue_smoke",
		"node_idle_to_adaptive_hint",
		{},
		{}
	)
	_expect(adaptive_from_idle_key == "surprised", "implicit adaptive pose should not stay on the previous idle_loop clip")

	var hit := WebRigRuntime.hit_test_state_hit_areas(
		surprised,
		Vector2(220, 160),
		Rect2(Vector2(100, 100), Vector2(400, 300))
	)
	_expect(String(hit.get("id", "")) == "head", "normalized hit area polygon did not hit expected point")
	var miss := WebRigRuntime.hit_test_state_hit_areas(
		surprised,
		Vector2(520, 390),
		Rect2(Vector2(100, 100), Vector2(400, 300))
	)
	_expect(miss.is_empty(), "normalized hit area polygon matched an outside point")

	if _failed:
		quit(1)
		return
	print("Portrait Rig Godot runtime smoke test passed.")
	quit(0)


func _build_profile() -> Dictionary:
	return {
		"id": "madeleine",
		"display_name": "Madeleine",
		"metadata": {
			"portrait_rig": {
				"app": "tools/portrait-rig-editor",
				"adaptive_clip_id": "adaptive_pose",
				"dialogue_motion_set": {
					"version": 1,
					"ready": true,
					"adaptive_clip_id": "adaptive_pose",
					"idle_clip_id": "idle_loop",
					"talk_clip_id": "talk_loop",
					"viseme_clip_id": "viseme_set",
				},
				"hit_areas": [
					{
						"id": "head",
						"label": "Head",
						"kind": "face",
						"part_id": "head",
						"normalized_points": [
							[0.2, 0.1],
							[0.5, 0.1],
							[0.5, 0.5],
							[0.2, 0.5],
						],
						"normalized_bounds": {
							"x": 0.2,
							"y": 0.1,
							"width": 0.3,
							"height": 0.4,
						},
					},
				],
				"parameter_bindings": [
					{
						"parameter": "mouthOpen",
						"label": "Mouth Open",
						"channels": ["opacity", "motion"],
						"direct_binding_count": 1,
						"motion_key_count": 3,
						"affected_parts": [
							{
								"part_id": "mouth",
								"label": "Mouth",
								"channels": ["opacity"],
							},
						],
					},
					{
						"parameter": "angleX",
						"label": "Angle X",
						"channels": ["x", "motion"],
						"direct_binding_count": 1,
						"motion_key_count": 3,
					},
				],
				"motion_frame_sets": [
					{
						"clip_id": "adaptive_pose",
						"clip_label": "Adaptive Pose",
						"frame_count": 3,
						"expected_frame_count": 3,
						"clip_duration": 1.2,
						"physics_sampled": true,
						"states": [
							{
								"state": "neutral",
								"time": 0.0,
								"frame_index": 0,
								"image_path": "res://assets/characters/madeleine/neutral.png",
								"model_path": "res://assets/characters/madeleine/neutral.portrait-rig.json",
								"center": [0.5, 0.22],
								"pose_tags": ["neutral", "closed_mouth"],
								"pose_score": {
									"neutral": 1.0,
									"closed_mouth": 0.85,
								},
								"parameter_values": {
									"mouthOpen": 0.0,
									"angleX": 0.0,
								},
							},
							{
								"state": "surprised",
								"time": 0.6,
								"frame_index": 1,
								"image_path": "res://assets/characters/madeleine/surprised.png",
								"model_path": "res://assets/characters/madeleine/surprised.portrait-rig.json",
								"center": [0.52, 0.2],
								"pose_tags": ["surprised", "open_mouth"],
								"pose_score": {
									"surprised": 0.98,
									"open_mouth": 0.75,
								},
								"parameter_values": {
									"mouthOpen": 0.75,
									"angleX": -0.18,
								},
							},
							{
								"state": "talk",
								"time": 1.1,
								"frame_index": 2,
								"image_path": "res://assets/characters/madeleine/talk.png",
								"model_path": "res://assets/characters/madeleine/talk.portrait-rig.json",
								"center": [0.49, 0.21],
								"pose_tags": ["talk", "open_mouth"],
								"pose_score": {
									"talk": 0.96,
									"open_mouth": 0.65,
								},
								"parameter_values": {
									"mouthOpen": 0.55,
									"angleX": 0.2,
								},
							},
						],
					},
				],
				"portraits": {
					"neutral": {
						"image_path": "res://assets/characters/madeleine/neutral.png",
						"model_path": "res://assets/characters/madeleine/neutral.portrait-rig.json",
						"center": [0.5, 0.22],
							"motion_frame": {
								"clip_id": "adaptive_pose",
							"time": 0.0,
							"frame_index": 0,
							"frame_count": 3,
							"clip_duration": 1.2,
							"pose_tags": ["neutral", "closed_mouth"],
							"pose_score": {
								"neutral": 1.0,
							},
							"parameter_values": {
								"mouthOpen": 0.0,
								"angleX": 0.0,
							},
						},
					},
					"surprised": {
						"image_path": "res://assets/characters/madeleine/surprised.png",
						"model_path": "res://assets/characters/madeleine/surprised.portrait-rig.json",
						"center": [0.52, 0.2],
						"motion_frame": {
							"clip_id": "adaptive_pose",
							"time": 0.6,
							"frame_index": 1,
							"frame_count": 3,
							"clip_duration": 1.2,
							"pose_tags": ["surprised", "open_mouth"],
							"pose_score": {
								"surprised": 0.98,
								"open_mouth": 0.75,
							},
							"parameter_values": {
								"mouthOpen": 0.75,
								"angleX": -0.18,
							},
						},
						"expression_preset": {
							"id": "surprised",
							"label": "Surprised",
							"auto_generated": true,
							"auto_expression_kind": "surprised",
							"pose_tags": ["surprised", "open_mouth"],
							"pose_score": {
								"surprised": 1.0,
								"open_mouth": 0.75,
							},
							"parameter_values": {
								"mouthOpen": 0.75,
								"angleX": -0.18,
							},
						},
					},
					"talk": {
						"image_path": "res://assets/characters/madeleine/talk.png",
						"model_path": "res://assets/characters/madeleine/talk.portrait-rig.json",
						"center": [0.49, 0.21],
						"motion_frame": {
							"clip_id": "adaptive_pose",
							"time": 1.1,
							"frame_index": 2,
							"frame_count": 3,
							"clip_duration": 1.2,
							"pose_tags": ["talk", "open_mouth"],
							"pose_score": {
								"talk": 0.96,
								"open_mouth": 0.65,
							},
							"parameter_values": {
								"mouthOpen": 0.55,
								"angleX": 0.2,
							},
						},
					},
				},
			},
			}
	}


func _build_camel_alias_profile() -> Dictionary:
	return {
		"id": "madeleine",
		"display_name": "Madeleine",
		"metadata": {
			"portrait_rig": {
				"hitAreas": [
					{
						"id": "camel_face",
						"label": "Camel Face",
						"kind": "face",
						"partId": "head",
						"normalizedBounds": {
							"x": 0.2,
							"y": 0.12,
							"width": 0.32,
							"height": 0.38,
						},
					},
				],
				"parameterBindings": [
					{
						"parameter": "angleX",
						"label": "Angle X",
						"role": "gaze_x",
						"channels": ["x", "motion"],
						"motion_clip_ids": ["camel_adaptive"],
					},
				],
				"expressionPresets": [
					{
						"id": "camel_curious",
						"label": "Camel Curious",
						"poseTags": ["curious"],
						"poseScore": {
							"curious": 1.0,
						},
						"parameterValues": {
							"angleX": 0.2,
						},
					},
				],
				"dialogueMotionSet": {
					"ready": true,
					"adaptiveClipId": "camel_adaptive",
					"idleClipId": "camel_idle",
					"talkClipId": "camel_talk",
					"completeExportedClipIds": ["camel_adaptive", "camel_idle", "camel_talk"],
				},
				"motionFrameSets": [
					{
						"clipId": "camel_adaptive",
						"clipLabel": "Camel Adaptive",
						"frameCount": 1,
						"expectedFrameCount": 1,
						"clipDuration": 0.8,
						"physicsSampled": true,
						"states": [
							{
								"key": "camel_pose",
								"time": 0.4,
								"frameIndex": 0,
								"imagePath": "res://assets/characters/madeleine/camel_pose.png",
								"modelPath": "res://assets/characters/madeleine/camel_pose.portrait-rig.json",
								"center": [0.48, 0.2],
								"poseTags": ["curious"],
								"poseScore": {
									"curious": 0.9,
								},
								"parameterValues": {
									"angleX": 0.2,
								},
							},
						],
					},
				],
				"portraits": {
					"camel_metadata": {
						"imagePath": "res://assets/characters/madeleine/camel_metadata.png",
						"modelPath": "res://assets/characters/madeleine/camel_metadata.portrait-rig.json",
						"center": [0.5, 0.21],
						"motionFrame": {
							"clipId": "camel_adaptive",
							"clipLabel": "Camel Adaptive",
							"time": 0.0,
							"frameIndex": 0,
							"frameCount": 1,
							"clipDuration": 0.8,
							"poseTags": ["neutral"],
							"parameterValues": {
								"angleX": 0.0,
							},
						},
					},
				},
			},
		},
	}


func _build_camel_top_level_alias_profile() -> Dictionary:
	var profile := _build_camel_alias_profile()
	var metadata: Dictionary = profile["metadata"]
	metadata["portraitRig"] = metadata["portrait_rig"]
	metadata.erase("portrait_rig")
	return profile


func _build_source_model_fallback_profile(source_model_path: String) -> Dictionary:
	return {
		"id": "source_model_fallback",
		"display_name": "Source Model Fallback",
		"metadata": {
			"portrait_rig": {
				"app": "tools/portrait-rig-editor",
				"source_model_path": source_model_path,
				"motion_frame_sets": [
					{
						"clip_id": "adaptive_pose",
						"clip_label": "Adaptive Pose",
						"frame_count": 1,
						"expected_frame_count": 1,
						"clip_duration": 1.0,
						"states": [
							{
								"state": "source_only",
								"time": 0.0,
								"frame_index": 0,
								"image_path": "res://assets/characters/source_model_fallback/source_only.png",
								"pose_tags": ["neutral"],
								"parameter_values": {
									"mouthOpen": 0.0,
									"angleX": 0.0,
								},
							},
						],
					},
				],
			},
		},
	}


func _build_runtime_rig() -> Dictionary:
	return {
		"params": {
			"angleX": 0.0,
			"mouthOpen": 0.0,
			"hairSway": 0.0,
		},
		"customParameters": [
			{
				"key": "mouthOpen",
				"label": "Mouth Open",
			},
			{
				"key": "tailWag",
				"label": "Tail Wag",
				"role": "prop",
			},
		],
		"imageParts": [
			{
				"id": "head",
				"label": "Head",
				"bindX": "angleX",
				"bindOpacity": "mouthOpen",
				"visibilityGate": {
					"enabled": true,
					"parameter": "mouthOpen",
				},
				"hitArea": {
					"enabled": true,
					"id": "face",
					"label": "Face",
					"kind": "face",
					"normalizedBounds": {
						"x": 0.2,
						"y": 0.1,
						"width": 0.3,
						"height": 0.4,
					},
				},
				"mesh": {
					"enabled": true,
					"deformers": [
						{
							"parameter": "mouthOpen",
							"keyframes": [
								{"value": 0.0, "vertices": [{"x": 0, "y": 0}]},
								{"value": 1.0, "vertices": [{"x": 2, "y": 1}]},
							],
						},
					],
				},
			},
		],
		"deformerGroups": [
			{
				"id": "head_group",
				"label": "Head Group",
				"parameter": "angleX",
				"partIds": ["head"],
				"keyframes": [
					{"value": -1.0, "transform": {"x": -4}},
					{"value": 1.0, "transform": {"x": 4}},
				],
				"warp": {
					"enabled": true,
					"keyframes": [
						{"value": -1.0, "vertices": [{"x": -2, "y": 0}]},
						{"value": 1.0, "vertices": [{"x": 2, "y": 0}]},
					],
				},
			},
		],
		"physics": {
			"rules": [
				{
					"target": "hairSway",
					"amplitude": 0.2,
					"frequency": 1.2,
				},
			],
		},
		"motionClips": [
			{
				"id": "talk_loop",
				"duration": 1.0,
				"keyframes": [
					{"time": 0.0, "params": {"mouthOpen": 0.1}},
					{"time": 0.5, "params": {"mouthOpen": 0.8, "tailWag": 0.35}},
				],
			},
		],
	}


func _build_profile_with_idle_loop() -> Dictionary:
	var profile := _build_profile()
	var portraitRig: Dictionary = profile["metadata"]["portrait_rig"]
	var frame_sets: Array = portraitRig["motion_frame_sets"]
	frame_sets.append({
		"clip_id": "idle_loop",
		"clip_label": "Idle Loop",
		"frame_count": 2,
		"expected_frame_count": 2,
		"clip_duration": 1.0,
		"physics_sampled": true,
		"states": [
			{
				"state": "idle_01",
				"time": 0.0,
				"frame_index": 0,
				"image_path": "res://assets/characters/madeleine/idle_01.png",
				"model_path": "res://assets/characters/madeleine/idle_01.portrait-rig.json",
				"center": [0.5, 0.22],
				"pose_tags": ["neutral", "closed_mouth"],
				"pose_score": {
					"neutral": 1.0,
					"closed_mouth": 0.9,
				},
				"parameter_values": {
					"mouthOpen": 0.0,
					"angleX": 0.03,
				},
			},
			{
				"state": "idle_02",
				"time": 0.5,
				"frame_index": 1,
				"image_path": "res://assets/characters/madeleine/idle_02.png",
				"model_path": "res://assets/characters/madeleine/idle_02.portrait-rig.json",
				"center": [0.5, 0.22],
				"pose_tags": ["neutral", "closed_mouth"],
				"pose_score": {
					"neutral": 0.95,
					"closed_mouth": 0.86,
				},
				"parameter_values": {
					"mouthOpen": 0.0,
					"angleX": -0.03,
				},
			},
		],
	})
	return profile


func _build_profile_with_viseme_set() -> Dictionary:
	var profile := _build_profile()
	var portraitRig: Dictionary = profile["metadata"]["portrait_rig"]
	var frame_sets: Array = portraitRig["motion_frame_sets"]
	frame_sets.append({
		"clip_id": "viseme_set",
		"clip_label": "Viseme Set",
		"frame_count": 4,
		"expected_frame_count": 4,
		"clip_duration": 1.0,
		"physics_sampled": true,
		"states": [
			_viseme_state("viseme_closed", 0, 0.0, ["viseme_closed", "closed_mouth"], {"viseme_closed": 1.0, "closed_mouth": 1.0}, 0.0),
			_viseme_state("viseme_a", 1, 0.25, ["viseme_a", "viseme", "open_mouth"], {"viseme_a": 1.0, "open_mouth": 0.8}, 0.7),
			_viseme_state("viseme_i", 2, 0.5, ["viseme_i", "viseme"], {"viseme_i": 1.0}, 0.45),
			_viseme_state("viseme_o", 3, 0.75, ["viseme_o", "viseme", "open_mouth"], {"viseme_o": 1.0, "open_mouth": 0.7}, 0.62),
		],
	})
	return profile


func _build_dialogue_ready_profile() -> Dictionary:
	var profile := _build_profile_with_idle_loop()
	var portraitRig: Dictionary = profile["metadata"]["portrait_rig"]
	var dialogue_motion_set: Dictionary = portraitRig["dialogue_motion_set"]
	dialogue_motion_set["complete_exported_clip_ids"] = ["adaptive_pose", "idle_loop", "talk_loop", "viseme_set"]
	dialogue_motion_set["incomplete_clip_ids"] = []
	dialogue_motion_set["has_complete_adaptive_pose"] = true
	dialogue_motion_set["has_complete_idle_loop"] = true
	dialogue_motion_set["has_complete_talk_loop"] = true
	dialogue_motion_set["has_complete_viseme_set"] = true
	portraitRig["runtime_readiness"] = {
		"ready": true,
		"dialogue_motion_ready": true,
		"adaptive_pose_ready": true,
		"complete_motion_frame_set_count": 4,
		"missing": [],
		"missing_dialogue_motion": [],
		"incomplete_motion_frame_sets": [],
	}
	var frame_sets: Array = portraitRig["motion_frame_sets"]
	frame_sets.append({
		"clip_id": "talk_loop",
		"clip_label": "Talk Loop",
		"frame_count": 3,
		"expected_frame_count": 3,
		"clip_duration": 1.2,
		"physics_sampled": true,
		"states": [
			_talk_state("talk_closed", 0, 0.0, ["talk", "closed_mouth"], {"talk": 0.7, "closed_mouth": 1.0}, 0.05),
			_talk_state("talk_open", 1, 0.4, ["talk", "open_mouth"], {"talk": 1.0, "open_mouth": 1.0}, 0.85),
			_talk_state("talk_smile", 2, 0.8, ["talk", "smile"], {"talk": 0.9, "smile": 0.86}, 0.45),
		],
	})
	frame_sets.append({
		"clip_id": "viseme_set",
		"clip_label": "Viseme Set",
		"frame_count": 4,
		"expected_frame_count": 4,
		"clip_duration": 1.0,
		"physics_sampled": true,
		"states": [
			_viseme_state("viseme_closed", 0, 0.0, ["viseme_closed", "closed_mouth"], {"viseme_closed": 1.0, "closed_mouth": 1.0}, 0.0),
			_viseme_state("viseme_a", 1, 0.25, ["viseme_a", "viseme", "open_mouth"], {"viseme_a": 1.0, "open_mouth": 0.8}, 0.7),
			_viseme_state("viseme_i", 2, 0.5, ["viseme_i", "viseme"], {"viseme_i": 1.0}, 0.45),
			_viseme_state("viseme_o", 3, 0.75, ["viseme_o", "viseme", "open_mouth"], {"viseme_o": 1.0, "open_mouth": 0.7}, 0.62),
		],
	})
	return profile


func _build_portrait_only_dialogue_profile() -> Dictionary:
	return {
		"id": "madeleine",
		"display_name": "Madeleine",
		"portraits": {
			"adaptive_01": _portrait_motion_entry("adaptive_01", "adaptive_pose", 0, 0.0, 2, 1.0, ["neutral"], {"neutral": 1.0}, 0.0),
			"adaptive_02": _portrait_motion_entry("adaptive_02", "adaptive_pose", 1, 0.5, 2, 1.0, ["curious", "motion"], {"curious": 0.8}, 0.15),
			"idle_01": _portrait_motion_entry("idle_01", "idle_loop", 0, 0.0, 2, 1.0, ["neutral", "closed_mouth"], {"neutral": 1.0}, 0.0),
			"idle_02": _portrait_motion_entry("idle_02", "idle_loop", 1, 0.5, 2, 1.0, ["neutral", "closed_mouth"], {"neutral": 0.95}, 0.0),
			"talk_closed": _portrait_motion_entry("talk_closed", "talk_loop", 0, 0.0, 2, 0.8, ["talk", "closed_mouth"], {"talk": 0.7}, 0.05),
			"talk_open": _portrait_motion_entry("talk_open", "talk_loop", 1, 0.4, 2, 0.8, ["talk", "open_mouth"], {"talk": 1.0, "open_mouth": 1.0}, 0.8),
			"viseme_closed": _portrait_motion_entry("viseme_closed", "viseme_set", 0, 0.0, 2, 0.6, ["viseme_closed", "viseme"], {"viseme_closed": 1.0}, 0.0),
			"viseme_o": _portrait_motion_entry("viseme_o", "viseme_set", 1, 0.3, 2, 0.6, ["viseme_o", "viseme", "open_mouth"], {"viseme_o": 1.0}, 0.62),
		},
	}


func _portrait_motion_entry(
	state: String,
	clip_id: String,
	frame_index: int,
	time: float,
	frame_count: int,
	clip_duration: float,
	pose_tags: Array,
	pose_score: Dictionary,
	mouth_open: float
) -> Dictionary:
	return {
		"path": "res://assets/characters/madeleine/%s.png" % state,
		"portrait_rig_model": "res://assets/characters/madeleine/%s.portrait-rig.json" % state,
		"center": [0.5, 0.22],
		"portrait_rig_motion_frame": {
			"clip_id": clip_id,
			"clip_label": clip_id,
			"time": time,
			"frame_index": frame_index,
			"frame_count": frame_count,
			"clip_duration": clip_duration,
			"pose_tags": pose_tags,
			"pose_score": pose_score,
			"parameter_values": {
				"mouthOpen": mouth_open,
				"angleX": 0.05 * float(frame_index),
			},
		},
	}


func _talk_state(state: String, frame_index: int, time: float, pose_tags: Array, pose_score: Dictionary, mouth_open: float) -> Dictionary:
	return {
		"state": state,
		"time": time,
		"frame_index": frame_index,
		"image_path": "res://assets/characters/madeleine/%s.png" % state,
		"model_path": "res://assets/characters/madeleine/%s.portrait-rig.json" % state,
		"center": [0.5, 0.22],
		"pose_tags": pose_tags,
		"pose_score": pose_score,
		"parameter_values": {
			"mouthOpen": mouth_open,
			"angleX": 0.05,
		},
	}


func _viseme_state(state: String, frame_index: int, time: float, pose_tags: Array, pose_score: Dictionary, mouth_open: float) -> Dictionary:
	return {
		"state": state,
		"time": time,
		"frame_index": frame_index,
		"image_path": "res://assets/characters/madeleine/%s.png" % state,
		"model_path": "res://assets/characters/madeleine/%s.portrait-rig.json" % state,
		"center": [0.5, 0.22],
		"pose_tags": pose_tags,
		"pose_score": pose_score,
		"parameter_values": {
			"mouthOpen": mouth_open,
			"angleX": 0.0,
		},
	}


func _build_profile_with_repeated_surprised_tags() -> Dictionary:
	var profile := _build_profile()
	var portraitRig: Dictionary = profile["metadata"]["portrait_rig"]
	var frame_sets: Array = portraitRig["motion_frame_sets"]
	var adaptive_set: Dictionary = frame_sets[0]
	adaptive_set["frame_count"] = 4
	adaptive_set["expected_frame_count"] = 4
	adaptive_set["clip_duration"] = 1.6
	var repeated_frame := {
		"state": "surprised_alt",
		"time": 1.35,
		"frame_index": 3,
		"image_path": "res://assets/characters/madeleine/surprised_alt.png",
		"model_path": "res://assets/characters/madeleine/surprised_alt.portrait-rig.json",
		"center": [0.51, 0.2],
		"pose_tags": ["surprised", "open_mouth"],
		"pose_score": {
			"surprised": 0.98,
			"open_mouth": 0.75,
		},
		"parameter_values": {
			"mouthOpen": 0.75,
			"angleX": 0.18,
		},
	}
	(adaptive_set["states"] as Array).append(repeated_frame)
	(portraitRig["portraits"] as Dictionary)["surprised_alt"] = {
		"image_path": "res://assets/characters/madeleine/surprised_alt.png",
		"model_path": "res://assets/characters/madeleine/surprised_alt.portrait-rig.json",
		"center": [0.51, 0.2],
		"motion_frame": {
			"clip_id": "adaptive_pose",
			"time": 1.35,
			"frame_index": 3,
			"frame_count": 4,
			"clip_duration": 1.6,
			"pose_tags": ["surprised", "open_mouth"],
			"pose_score": {
				"surprised": 0.98,
				"open_mouth": 0.75,
			},
			"parameter_values": {
				"mouthOpen": 0.75,
				"angleX": 0.18,
			},
		},
	}
	return profile


func _build_profile_with_duplicate_surprised_signature() -> Dictionary:
	var profile := _build_profile_with_repeated_surprised_tags()
	var portraitRig: Dictionary = profile["metadata"]["portrait_rig"]
	var frame_sets: Array = portraitRig["motion_frame_sets"]
	var adaptive_set: Dictionary = frame_sets[0]
	adaptive_set["frame_count"] = 5
	adaptive_set["expected_frame_count"] = 5
	adaptive_set["clip_duration"] = 2.0
	var duplicate_frame := {
		"state": "surprised_clone",
		"time": 1.65,
		"frame_index": 4,
		"image_path": "res://assets/characters/madeleine/surprised_clone.png",
		"model_path": "res://assets/characters/madeleine/surprised_clone.portrait-rig.json",
		"center": [0.52, 0.2],
		"pose_tags": ["surprised", "open_mouth"],
		"pose_score": {
			"surprised": 0.98,
			"open_mouth": 0.75,
		},
		"parameter_values": {
			"mouthOpen": 0.75,
			"angleX": -0.18,
		},
	}
	(adaptive_set["states"] as Array).append(duplicate_frame)
	(portraitRig["portraits"] as Dictionary)["surprised_clone"] = {
		"image_path": "res://assets/characters/madeleine/surprised_clone.png",
		"model_path": "res://assets/characters/madeleine/surprised_clone.portrait-rig.json",
		"center": [0.52, 0.2],
		"motion_frame": {
			"clip_id": "adaptive_pose",
			"time": 1.65,
			"frame_index": 4,
			"frame_count": 5,
			"clip_duration": 2.0,
			"pose_tags": ["surprised", "open_mouth"],
			"pose_score": {
				"surprised": 0.98,
				"open_mouth": 0.75,
			},
			"parameter_values": {
				"mouthOpen": 0.75,
				"angleX": -0.18,
			},
		},
	}
	return profile


func _build_profile_with_emotion_tags() -> Dictionary:
	var profile := _build_profile()
	var portraitRig: Dictionary = profile["metadata"]["portrait_rig"]
	var frame_sets: Array = portraitRig["motion_frame_sets"]
	var adaptive_set: Dictionary = frame_sets[0]
	adaptive_set["frame_count"] = 5
	adaptive_set["expected_frame_count"] = 5
	adaptive_set["clip_duration"] = 2.0
	var states: Array = adaptive_set["states"]
	states.append({
		"state": "angry",
		"time": 1.35,
		"frame_index": 3,
		"image_path": "res://assets/characters/madeleine/angry.png",
		"model_path": "res://assets/characters/madeleine/angry.portrait-rig.json",
		"center": [0.5, 0.22],
		"pose_tags": ["angry"],
		"pose_score": {
			"angry": 1.0,
		},
		"parameter_values": {
			"mouthOpen": 0.1,
			"angleX": 0.0,
		},
	})
	states.append({
		"state": "curious",
		"time": 1.75,
		"frame_index": 4,
		"image_path": "res://assets/characters/madeleine/curious.png",
		"model_path": "res://assets/characters/madeleine/curious.portrait-rig.json",
		"center": [0.5, 0.22],
		"pose_tags": ["curious"],
		"pose_score": {
			"curious": 1.0,
		},
		"parameter_values": {
			"mouthOpen": 0.15,
			"angleX": -0.25,
		},
	})
	return profile


func _build_profile_with_natural_pose_distance() -> Dictionary:
	var profile := _build_profile()
	var portraitRig: Dictionary = profile["metadata"]["portrait_rig"]
	var frame_sets: Array = portraitRig["motion_frame_sets"]
	var adaptive_set: Dictionary = frame_sets[0]
	adaptive_set["frame_count"] = 4
	adaptive_set["expected_frame_count"] = 4
	adaptive_set["clip_duration"] = 1.6
	portraitRig["portraits"] = {}
	adaptive_set["states"] = [
		_natural_pose_state("neutral", 0, 0.0, ["neutral"], 0.0, 0.0),
		_natural_pose_state("tiny_shift", 1, 0.4, ["neutral"], 0.02, 0.01),
		_natural_pose_state("natural_shift", 2, 0.8, ["curious", "motion"], 0.38, 0.42),
		_natural_pose_state("abrupt_shift", 3, 1.2, ["surprised", "open_mouth"], 1.0, -1.0),
	]
	return profile


func _natural_pose_state(state: String, frame_index: int, time: float, pose_tags: Array, mouth_open: float, angle_x: float) -> Dictionary:
	return {
		"state": state,
		"time": time,
		"frame_index": frame_index,
		"image_path": "res://assets/characters/madeleine/%s.png" % state,
		"model_path": "res://assets/characters/madeleine/%s.portrait-rig.json" % state,
		"center": [0.5, 0.22],
		"pose_tags": pose_tags,
		"pose_score": {},
		"parameter_values": {
			"mouthOpen": mouth_open,
			"angleX": angle_x,
		},
	}


func _find_frame(frames: Array[Dictionary], key: String) -> Dictionary:
	for frame in frames:
		if String(frame.get("key", "")) == key:
			return frame
	return {}


func _find_binding(bindings: Array[Dictionary], parameter: String) -> Dictionary:
	for binding in bindings:
		if String(binding.get("parameter", "")) == parameter:
			return binding
	return {}


func _expect(condition: bool, message: String) -> void:
	if condition:
		return
	_failed = true
	push_error(message)
