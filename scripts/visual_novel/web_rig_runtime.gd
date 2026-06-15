class_name WebRigRuntime
extends RefCounted

const WEB_RIG_APP_ID := "tools/portrait-rig-editor"


static func load_rig_document(model_path: String) -> Dictionary:
	var clean_path := model_path.strip_edges()
	if clean_path.is_empty():
		return {}
	if not FileAccess.file_exists(clean_path):
		return {}

	var file := FileAccess.open(clean_path, FileAccess.READ)
	if file == null:
		return {}
	var text := file.get_as_text()
	var json := JSON.new()
	if json.parse(text) != OK:
		return {}
	if typeof(json.data) != TYPE_DICTIONARY:
		return {}
	return (json.data as Dictionary).duplicate(true)


static func _load_cached_rig_document(cache: Dictionary, model_path: String) -> Dictionary:
	var clean_path := model_path.strip_edges()
	if clean_path.is_empty():
		return {}
	if cache.has(clean_path):
		var cached: Variant = cache[clean_path]
		return (cached as Dictionary).duplicate(true) if typeof(cached) == TYPE_DICTIONARY else {}
	var loaded := load_rig_document(clean_path)
	cache[clean_path] = loaded.duplicate(true)
	return loaded


static func get_motion_clips_from_rig(rig: Dictionary) -> Array[Dictionary]:
	var clips: Array[Dictionary] = []
	var source: Variant = rig.get("motionClips", rig.get("motions", []))
	if typeof(source) != TYPE_ARRAY:
		return clips
	for raw_clip in source as Array:
		if typeof(raw_clip) != TYPE_DICTIONARY:
			continue
		var clip: Dictionary = raw_clip
		var clip_id := String(clip.get("id", clip.get("label", ""))).strip_edges()
		if clip_id.is_empty():
			continue
		clips.append({
			"id": clip_id,
			"label": String(clip.get("label", clip.get("name", clip_id))).strip_edges(),
			"duration": maxf(float(clip.get("duration", 0.0)), 0.0),
			"keyframes": _duplicate_dictionary_array(clip.get("keyframes", clip.get("keys", []))),
		})
	return clips


static func get_rig_canvas_size(rig: Dictionary) -> Vector2:
	var canvas := _dictionary_from_variant(rig.get("canvas", {}))
	return Vector2(
		maxf(float(canvas.get("width", canvas.get("w", 900.0))), 1.0),
		maxf(float(canvas.get("height", canvas.get("h", 1400.0))), 1.0)
	)


static func get_default_rig_parameters(rig: Dictionary) -> Dictionary:
	var parameters := {}
	var params := _dictionary_from_variant(rig.get("params", {}))
	for raw_key in params.keys():
		var key := String(raw_key).strip_edges()
		if key.is_empty():
			continue
		parameters[key] = float(params[raw_key])
	for definition in _rig_parameter_definitions(rig):
		var key := String(definition.get("key", "")).strip_edges()
		if key.is_empty() or parameters.has(key):
			continue
		parameters[key] = clampf(
			float(definition.get("default", definition.get("value", 0.0))),
			float(definition.get("min", -100.0)),
			float(definition.get("max", 100.0))
		)
	return parameters


static func merge_rig_parameters(base_parameters: Dictionary, override_parameters: Dictionary) -> Dictionary:
	var merged := base_parameters.duplicate(true)
	for raw_key in override_parameters.keys():
		var key := String(raw_key).strip_edges()
		if key.is_empty():
			continue
		var value := float(override_parameters[raw_key])
		if _is_finite_number(value):
			merged[key] = value
	return merged


static func get_rig_parameter_definition(rig: Dictionary, parameter: String) -> Dictionary:
	var key := parameter.strip_edges()
	if key.is_empty():
		return {}
	for definition in _rig_parameter_definitions(rig):
		if String(definition.get("key", "")).strip_edges() == key:
			return definition
	return {
		"key": key,
		"label": key,
		"min": 0.0 if key in ["eyeOpen", "mouthOpen", "breath"] else -100.0,
		"max": 100.0,
		"default": 0.0,
	}


static func get_rig_motion_clip_duration(rig: Dictionary, clip_id: String) -> float:
	var clean_clip_id := clip_id.strip_edges()
	if clean_clip_id.is_empty():
		return 0.0
	for clip in get_motion_clips_from_rig(rig):
		if String(clip.get("id", "")).strip_edges() == clean_clip_id:
			return maxf(float(clip.get("duration", 0.0)), _motion_keyframe_max_time(_rig_keyframes_from_record(clip)))
	return 0.0


static func sample_rig_motion_parameters(
	rig: Dictionary,
	clip_id: String,
	time: float,
	base_parameters: Dictionary = {}
) -> Dictionary:
	var clean_clip_id := clip_id.strip_edges()
	var parameters := merge_rig_parameters(get_default_rig_parameters(rig), base_parameters)
	if clean_clip_id.is_empty():
		return parameters
	for clip in get_motion_clips_from_rig(rig):
		if String(clip.get("id", "")).strip_edges() != clean_clip_id:
			continue
		var duration := maxf(float(clip.get("duration", 0.0)), _motion_keyframe_max_time(_rig_keyframes_from_record(clip)))
		var sample_time := maxf(time, 0.0)
		if duration > 0.001:
			sample_time = fmod(sample_time, duration)
			if sample_time < 0.0:
				sample_time += duration
		return merge_rig_parameters(parameters, _sample_motion_keyframe_parameters(_rig_keyframes_from_record(clip), sample_time))
	return parameters


static func sample_rig_physics_parameters(
	rig: Dictionary,
	base_parameters: Dictionary,
	time: float
) -> Dictionary:
	var parameters := base_parameters.duplicate(true)
	var physics := _dictionary_from_variant(rig.get("physics", {}))
	if physics.is_empty() or bool(physics.get("enabled", true)) == false:
		return parameters
	var rules: Variant = physics.get("rules", [])
	if typeof(rules) != TYPE_ARRAY:
		return parameters
	for raw_rule in rules as Array:
		if typeof(raw_rule) != TYPE_DICTIONARY:
			continue
		var rule: Dictionary = raw_rule
		if bool(rule.get("enabled", true)) == false:
			continue
		var parameter := String(rule.get("param", rule.get("parameter", rule.get("target", "")))).strip_edges()
		if parameter.is_empty():
			continue
		var offset := float(rule.get("offset", rule.get("center", parameters.get(parameter, 0.0))))
		var amplitude := float(rule.get("amplitude", rule.get("scale", 0.0)))
		var frequency := maxf(float(rule.get("frequency", rule.get("hz", 0.0))), 0.0)
		var phase := float(rule.get("phase", 0.0))
		parameters[parameter] = offset + sin((time * frequency * TAU) + phase) * amplitude
	return parameters


static func interpolate_rig_keyframes(keyframes_value: Variant, parameter_value: float) -> Dictionary:
	var keyframes := _duplicate_dictionary_array(keyframes_value)
	if keyframes.is_empty():
		return {}
	keyframes.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		return float(a.get("value", a.get("time", a.get("t", 0.0)))) < float(b.get("value", b.get("time", b.get("t", 0.0))))
	)
	var first: Dictionary = keyframes[0]
	var last: Dictionary = keyframes[keyframes.size() - 1]
	var first_value := float(first.get("value", first.get("time", first.get("t", 0.0))))
	var last_value := float(last.get("value", last.get("time", last.get("t", 0.0))))
	if parameter_value <= first_value:
		return _rig_keyframe_payload(first)
	if parameter_value >= last_value:
		return _rig_keyframe_payload(last)
	for index in range(1, keyframes.size()):
		var right: Dictionary = keyframes[index]
		var left: Dictionary = keyframes[index - 1]
		var right_value := float(right.get("value", right.get("time", right.get("t", 0.0))))
		var left_value := float(left.get("value", left.get("time", left.get("t", 0.0))))
		if parameter_value > right_value:
			continue
		var span := maxf(right_value - left_value, 0.001)
		var ratio := _apply_motion_easing((parameter_value - left_value) / span, String(left.get("easing", left.get("curve", ""))))
		return _lerp_dictionaries(_rig_keyframe_payload(left), _rig_keyframe_payload(right), ratio)
	return _rig_keyframe_payload(last)


static func get_physics_rules_from_rig(rig: Dictionary) -> Array[Dictionary]:
	var physics: Variant = rig.get("physics", {})
	if typeof(physics) != TYPE_DICTIONARY:
		return []
	var rules: Variant = (physics as Dictionary).get("rules", [])
	return _duplicate_dictionary_array(rules)


static func get_hit_areas_from_rig(rig: Dictionary) -> Array[Dictionary]:
	var hit_areas: Array[Dictionary] = []
	var image_parts := _rig_image_parts(rig)
	for part in image_parts:
		var source := _dictionary_from_variant(part.get("hitArea", part.get("hit_area", {})))
		if not bool(source.get("enabled", false)):
			continue
		var area := {
			"id": source.get("id", source.get("key", source.get("name", part.get("id", "")))),
			"label": source.get("label", source.get("name", part.get("label", part.get("id", "")))),
			"kind": source.get("kind", source.get("type", "generic")),
			"part_id": part.get("id", ""),
			"source": "image_part",
			"bounds": source.get("bounds", source.get("rect", {})),
			"normalized_bounds": source.get("normalizedBounds", source.get("normalized_bounds", source.get("normalizedRect", source.get("normalized_rect", {})))),
			"points": source.get("points", source.get("polygon", [])),
			"normalized_points": source.get("normalizedPoints", source.get("normalized_points", source.get("normalizedPolygon", source.get("normalized_polygon", [])))),
		}
		var normalized := normalize_hit_area(area)
		if not normalized.is_empty():
			hit_areas.append(normalized)
	return hit_areas


static func get_parameter_bindings_from_rig(rig: Dictionary) -> Array[Dictionary]:
	var bindings := {}
	var labels := _rig_parameter_labels(rig)
	var roles := _rig_parameter_roles(rig)
	var image_parts := _rig_image_parts(rig)
	var image_part_map := {}
	for part in image_parts:
		var part_id := String(part.get("id", "")).strip_edges()
		if not part_id.is_empty():
			image_part_map[part_id] = part

	var direct_fields := [
		["bindX", "x"],
		["bindY", "y"],
		["bindRotation", "rotation"],
		["bindScaleX", "scale_x"],
		["bindScaleY", "scale_y"],
		["bindOpacity", "opacity"],
	]
	for part in image_parts:
		for pair in direct_fields:
			var binding := _ensure_rig_parameter_binding(bindings, part.get(pair[0], ""), labels, roles)
			if binding.is_empty():
				continue
			_add_rig_binding_channel(binding, pair[1])
			binding["direct_binding_count"] = int(binding.get("direct_binding_count", 0)) + 1
			_add_rig_binding_affected_part(binding, part, pair[1])

		var visibility_gate := _dictionary_from_variant(part.get("visibilityGate", part.get("visibility_gate", {})))
		if bool(visibility_gate.get("enabled", false)):
			var binding := _ensure_rig_parameter_binding(bindings, visibility_gate.get("parameter", visibility_gate.get("param", visibility_gate.get("key", ""))), labels, roles)
			if not binding.is_empty():
				_add_rig_binding_channel(binding, "visibility")
				binding["visibility_gate_count"] = int(binding.get("visibility_gate_count", 0)) + 1
				_add_rig_binding_affected_part(binding, part, "visibility")

		var transform_deformers: Variant = part.get("transformDeformers", part.get("transform_deformers", []))
		if typeof(transform_deformers) == TYPE_ARRAY:
			for raw_deformer in transform_deformers as Array:
				if typeof(raw_deformer) != TYPE_DICTIONARY:
					continue
				var deformer: Dictionary = raw_deformer
				var binding := _ensure_rig_parameter_binding(bindings, deformer.get("parameter", deformer.get("param", "")), labels, roles)
				if binding.is_empty():
					continue
				var keyframes := _rig_keyframes_from_record(deformer)
				_add_rig_binding_channel(binding, "transform_key")
				for keyframe in keyframes:
					var transform := _dictionary_from_variant(keyframe.get("transform", keyframe))
					for key in ["x", "y", "rotation", "opacity"]:
						if transform.has(key):
							_add_rig_binding_channel(binding, key)
					if transform.has("scaleX") or transform.has("scale_x"):
						_add_rig_binding_channel(binding, "scale_x")
					if transform.has("scaleY") or transform.has("scale_y"):
						_add_rig_binding_channel(binding, "scale_y")
				binding["transform_key_count"] = int(binding.get("transform_key_count", 0)) + keyframes.size()
				_add_rig_binding_affected_part(binding, part, "transform_key")

		var draw_order_deformers: Variant = part.get("drawOrderDeformers", part.get("draw_order_deformers", part.get("drawOrderKeys", [])))
		if typeof(draw_order_deformers) == TYPE_ARRAY:
			for raw_deformer in draw_order_deformers as Array:
				if typeof(raw_deformer) != TYPE_DICTIONARY:
					continue
				var deformer: Dictionary = raw_deformer
				var binding := _ensure_rig_parameter_binding(bindings, deformer.get("parameter", deformer.get("param", "")), labels, roles)
				if binding.is_empty():
					continue
				_add_rig_binding_channel(binding, "draw_order")
				binding["draw_order_key_count"] = int(binding.get("draw_order_key_count", 0)) + _rig_keyframes_from_record(deformer).size()
				_add_rig_binding_affected_part(binding, part, "draw_order")

		var mesh := _dictionary_from_variant(part.get("mesh", {}))
		if bool(mesh.get("enabled", true)):
			var deformers: Variant = mesh.get("deformers", [])
			if typeof(deformers) == TYPE_ARRAY:
				for raw_deformer in deformers as Array:
					if typeof(raw_deformer) != TYPE_DICTIONARY:
						continue
					var deformer: Dictionary = raw_deformer
					var binding := _ensure_rig_parameter_binding(bindings, deformer.get("parameter", deformer.get("param", "")), labels, roles)
					if binding.is_empty():
						continue
					_add_rig_binding_channel(binding, "mesh")
					binding["mesh_deformer_count"] = int(binding.get("mesh_deformer_count", 0)) + 1
					binding["mesh_key_count"] = int(binding.get("mesh_key_count", 0)) + _rig_keyframes_from_record(deformer).size()
					_add_rig_binding_affected_part(binding, part, "mesh")

	var deformer_groups := _rig_deformer_groups(rig)
	for group in deformer_groups:
		if bool(group.get("enabled", true)) == false:
			continue
		var binding := _ensure_rig_parameter_binding(bindings, group.get("parameter", group.get("param", "")), labels, roles)
		if binding.is_empty():
			continue
		_add_rig_binding_channel(binding, "deformer_group")
		binding["deformer_group_count"] = int(binding.get("deformer_group_count", 0)) + 1
		binding["transform_key_count"] = int(binding.get("transform_key_count", 0)) + _rig_keyframes_from_record(group).size()
		var warp := _dictionary_from_variant(group.get("warp", {}))
		var warp_enabled := bool(warp.get("enabled", false))
		if warp_enabled:
			_add_rig_binding_channel(binding, "warp")
			binding["warp_deformer_count"] = int(binding.get("warp_deformer_count", 0)) + 1
			binding["warp_key_count"] = int(binding.get("warp_key_count", 0)) + _rig_keyframes_from_record(warp).size()
		for raw_part_id in _rig_deformer_group_part_ids(group, deformer_groups):
			var part_id := String(raw_part_id).strip_edges()
			if image_part_map.has(part_id):
				_add_rig_binding_affected_part(binding, image_part_map[part_id], "warp" if warp_enabled else "deformer_group")

	for rule in get_physics_rules_from_rig(rig):
		if bool(rule.get("enabled", true)) == false:
			continue
		var binding := _ensure_rig_parameter_binding(bindings, rule.get("param", rule.get("parameter", rule.get("target", ""))), labels, roles)
		if binding.is_empty():
			continue
		_add_rig_binding_channel(binding, "physics")
		binding["physics_rule_count"] = int(binding.get("physics_rule_count", 0)) + 1

	for clip in get_motion_clips_from_rig(rig):
		var clip_id := String(clip.get("id", "")).strip_edges()
		var keyframes := _rig_keyframes_from_record(clip)
		for keyframe in keyframes:
			var params := _dictionary_from_variant(keyframe.get("params", keyframe.get("values", {})))
			for raw_parameter in params.keys():
				var binding := _ensure_rig_parameter_binding(bindings, raw_parameter, labels, roles)
				if binding.is_empty():
					continue
				_add_rig_binding_channel(binding, "motion")
				_append_unique_string(binding["motion_clip_ids"], clip_id, 32)
				binding["motion_key_count"] = int(binding.get("motion_key_count", 0)) + 1

	return _finalize_rig_parameter_bindings(bindings)


static func _portrait_rig_metadata_from_profile(profile: Dictionary) -> Dictionary:
	var metadata: Variant = profile.get("metadata", {})
	if typeof(metadata) != TYPE_DICTIONARY:
		return {}
	var source: Variant = (metadata as Dictionary).get(
		"portrait_rig",
		(metadata as Dictionary).get("portraitRig", {})
	)
	return (source as Dictionary) if typeof(source) == TYPE_DICTIONARY else {}


static func get_hit_areas_from_profile(profile: Dictionary) -> Array[Dictionary]:
	var hit_areas: Array[Dictionary] = []
	var portrait_rig_metadata := _portrait_rig_metadata_from_profile(profile)
	if portrait_rig_metadata.is_empty():
		return hit_areas
	var source: Variant = _alias_value(portrait_rig_metadata, ["hit_areas", "hitAreas"], [])
	if typeof(source) != TYPE_ARRAY:
		return hit_areas
	for raw_area in source as Array:
		var area := normalize_hit_area(raw_area)
		if not area.is_empty():
			hit_areas.append(area)
	return hit_areas


static func get_parameter_bindings_from_profile(profile: Dictionary) -> Array[Dictionary]:
	var bindings: Array[Dictionary] = []
	var portrait_rig_metadata := _portrait_rig_metadata_from_profile(profile)
	if portrait_rig_metadata.is_empty():
		return bindings
	var role_bindings := _parameter_role_bindings_from_portrait_rig_metadata(portrait_rig_metadata)
	var role_binding_by_parameter := {}
	for role_binding in role_bindings:
		role_binding_by_parameter[String(role_binding.get("parameter", "")).strip_edges()] = role_binding

	var source: Variant = portrait_rig_metadata.get("parameter_bindings", portrait_rig_metadata.get("parameterBindings", []))
	if typeof(source) == TYPE_ARRAY:
		for raw_binding in source as Array:
			var binding := normalize_parameter_binding(raw_binding)
			if binding.is_empty():
				continue
			var parameter := String(binding.get("parameter", "")).strip_edges()
			var role_binding: Dictionary = role_binding_by_parameter.get(parameter, {})
			var role := String(role_binding.get("role", "")).strip_edges()
			if String(binding.get("role", "generic")).strip_edges() == "generic" and not role.is_empty() and role != "generic":
				binding["role"] = role
			bindings.append(binding)
		if not bindings.is_empty():
			return bindings

	for role_binding in role_bindings:
		bindings.append(role_binding.duplicate(true))
	return bindings


static func _parameter_role_bindings_from_portrait_rig_metadata(portrait_rig_metadata: Variant) -> Array[Dictionary]:
	var bindings: Array[Dictionary] = []
	if typeof(portrait_rig_metadata) != TYPE_DICTIONARY:
		return bindings
	var source: Variant = (portrait_rig_metadata as Dictionary).get("parameter_roles", (portrait_rig_metadata as Dictionary).get("parameterRoles", []))
	if typeof(source) != TYPE_ARRAY:
		return bindings
	for raw_role in source as Array:
		var binding := normalize_parameter_binding(raw_role)
		if not binding.is_empty():
			bindings.append(binding)
	return bindings


static func get_dialogue_motion_set_from_profile(profile: Dictionary) -> Dictionary:
	var declared := {}
	var portrait_rig_metadata := _portrait_rig_metadata_from_profile(profile)
	if not portrait_rig_metadata.is_empty():
		var motion_set: Variant = portrait_rig_metadata.get("dialogue_motion_set", portrait_rig_metadata.get("dialogueMotionSet", {}))
		if typeof(motion_set) == TYPE_DICTIONARY:
			declared = _normalize_dialogue_motion_set_aliases(motion_set as Dictionary)
	if not _dialogue_motion_set_needs_frame_inference(declared):
		return declared
	var inferred := _infer_dialogue_motion_set_from_frames(get_motion_frame_portraits(profile))
	if declared.is_empty():
		return inferred
	if inferred.is_empty():
		return declared
	return _merge_dialogue_motion_sets(declared, inferred)


static func _dialogue_motion_set_needs_frame_inference(motion_set: Dictionary) -> bool:
	if motion_set.is_empty():
		return true
	for pair in [
		["adaptive_clip_id", "adaptiveClipId"],
		["idle_clip_id", "idleClipId"],
		["talk_clip_id", "talkClipId"],
	]:
		var snake_key := String(pair[0])
		var camel_key := String(pair[1])
		if String(motion_set.get(snake_key, motion_set.get(camel_key, ""))).strip_edges().is_empty():
			return true
	return _normalize_string_array(motion_set.get("exported_clip_ids", motion_set.get("exportedClipIds", [])), 64).is_empty()


static func _normalize_dialogue_motion_set_aliases(motion_set: Dictionary) -> Dictionary:
	var result := motion_set.duplicate(true)
	for pair in [
		["adaptive_clip_id", "adaptiveClipId"],
		["idle_clip_id", "idleClipId"],
		["talk_clip_id", "talkClipId"],
		["viseme_clip_id", "visemeClipId"],
		["clip_ids", "clipIds"],
		["source_clip_ids", "sourceClipIds"],
		["exported_clip_ids", "exportedClipIds"],
		["complete_exported_clip_ids", "completeExportedClipIds"],
		["incomplete_clip_ids", "incompleteClipIds"],
		["motion_frame_set_count", "motionFrameSetCount"],
		["exported_frame_count", "exportedFrameCount"],
		["expected_frame_count", "expectedFrameCount"],
		["has_exported_adaptive_pose", "hasExportedAdaptivePose"],
		["has_exported_idle_loop", "hasExportedIdleLoop"],
		["has_exported_talk_loop", "hasExportedTalkLoop"],
		["has_exported_viseme_set", "hasExportedVisemeSet"],
		["has_complete_adaptive_pose", "hasCompleteAdaptivePose"],
		["has_complete_idle_loop", "hasCompleteIdleLoop"],
		["has_complete_talk_loop", "hasCompleteTalkLoop"],
		["has_complete_viseme_set", "hasCompleteVisemeSet"],
	]:
		var snake_key := String(pair[0])
		var camel_key := String(pair[1])
		if result.has(snake_key) or not result.has(camel_key):
			continue
		result[snake_key] = result[camel_key]
	return result


static func _merge_dialogue_motion_sets(declared: Dictionary, inferred: Dictionary) -> Dictionary:
	var result := inferred.duplicate(true)
	var normalized_declared := _normalize_dialogue_motion_set_aliases(declared)
	for key in normalized_declared.keys():
		var value: Variant = normalized_declared[key]
		if typeof(value) == TYPE_STRING and String(value).strip_edges().is_empty():
			continue
		if typeof(value) == TYPE_ARRAY and (value as Array).is_empty():
			continue
		result[key] = value
	for pair in [
		["adaptive_clip_id", "adaptiveClipId"],
		["idle_clip_id", "idleClipId"],
		["talk_clip_id", "talkClipId"],
		["viseme_clip_id", "visemeClipId"],
	]:
		var snake_key := String(pair[0])
		var camel_key := String(pair[1])
		if String(result.get(snake_key, "")).strip_edges().is_empty() and not String(result.get(camel_key, "")).strip_edges().is_empty():
			result[snake_key] = String(result[camel_key]).strip_edges()
	return result


static func _infer_dialogue_motion_set_from_frames(frames: Array[Dictionary]) -> Dictionary:
	if frames.is_empty():
		return {}
	var clip_stats := {}
	var exported_clip_ids: Array[String] = []
	for frame in frames:
		var clip_id := String(frame.get("clip_id", "")).strip_edges()
		if clip_id.is_empty():
			continue
		_append_unique_string(exported_clip_ids, clip_id, 64)
		var stats := _dictionary_from_variant(clip_stats.get(clip_id, {}))
		stats["count"] = int(stats.get("count", 0)) + 1
		stats["expected"] = maxi(int(stats.get("expected", 0)), int(frame.get("frame_count", 0)))
		clip_stats[clip_id] = stats

	var adaptive_clip_id := _preferred_motion_frame_clip_id(frames, ["adaptive_pose", "dialogue_pose"], _preferred_adaptive_motion_clip_id(frames))
	var idle_clip_id := _preferred_motion_frame_clip_id(frames, ["idle_loop", "idle", "breath"], "")
	var talk_clip_id := _preferred_motion_frame_clip_id(frames, ["talk_loop", "talk", "speak", "mouth"], "")
	var viseme_clip_id := _preferred_motion_frame_clip_id(frames, ["viseme_set", "viseme", "phoneme", "lip"], "")
	var dialogue_clip_ids: Array[String] = []
	for clip_id in [adaptive_clip_id, idle_clip_id, talk_clip_id, viseme_clip_id]:
		_append_unique_string(dialogue_clip_ids, clip_id, 64)

	var complete_clip_ids: Array[String] = []
	var incomplete_clip_ids: Array[String] = []
	var expected_frame_count := 0
	for clip_id in exported_clip_ids:
		var stats := _dictionary_from_variant(clip_stats.get(clip_id, {}))
		var count := maxi(int(stats.get("count", 0)), 0)
		var expected := maxi(int(stats.get("expected", 0)), count)
		expected_frame_count += expected
		if count > 0 and (expected <= 0 or count >= expected):
			complete_clip_ids.append(clip_id)
		else:
			incomplete_clip_ids.append(clip_id)

	return {
		"version": 1,
		"ready": not adaptive_clip_id.is_empty()
			and not idle_clip_id.is_empty()
			and not talk_clip_id.is_empty()
			and _dialogue_motion_clip_is_complete(complete_clip_ids, adaptive_clip_id)
			and _dialogue_motion_clip_is_complete(complete_clip_ids, idle_clip_id)
			and _dialogue_motion_clip_is_complete(complete_clip_ids, talk_clip_id),
		"inferred_from_motion_frames": true,
		"adaptive_clip_id": adaptive_clip_id,
		"idle_clip_id": idle_clip_id,
		"talk_clip_id": talk_clip_id,
		"viseme_clip_id": viseme_clip_id,
		"clip_ids": dialogue_clip_ids,
		"source_clip_ids": exported_clip_ids,
		"exported_clip_ids": dialogue_clip_ids.filter(func(clip_id: String) -> bool: return exported_clip_ids.has(clip_id)),
		"complete_exported_clip_ids": dialogue_clip_ids.filter(func(clip_id: String) -> bool: return complete_clip_ids.has(clip_id)),
		"incomplete_clip_ids": dialogue_clip_ids.filter(func(clip_id: String) -> bool: return incomplete_clip_ids.has(clip_id)),
		"motion_frame_set_count": exported_clip_ids.size(),
		"exported_frame_count": frames.size(),
		"expected_frame_count": expected_frame_count,
		"has_exported_adaptive_pose": exported_clip_ids.has(adaptive_clip_id),
		"has_exported_idle_loop": exported_clip_ids.has(idle_clip_id),
		"has_exported_talk_loop": exported_clip_ids.has(talk_clip_id),
		"has_exported_viseme_set": not viseme_clip_id.is_empty() and exported_clip_ids.has(viseme_clip_id),
		"has_complete_adaptive_pose": _dialogue_motion_clip_is_complete(complete_clip_ids, adaptive_clip_id),
		"has_complete_idle_loop": _dialogue_motion_clip_is_complete(complete_clip_ids, idle_clip_id),
		"has_complete_talk_loop": _dialogue_motion_clip_is_complete(complete_clip_ids, talk_clip_id),
		"has_complete_viseme_set": not viseme_clip_id.is_empty() and _dialogue_motion_clip_is_complete(complete_clip_ids, viseme_clip_id),
	}


static func _dialogue_motion_clip_is_complete(complete_clip_ids: Array[String], clip_id: String) -> bool:
	var clean_clip_id := clip_id.strip_edges()
	return not clean_clip_id.is_empty() and complete_clip_ids.has(clean_clip_id)


static func get_hit_areas_from_state(state: Dictionary) -> Array[Dictionary]:
	var hit_areas: Array[Dictionary] = []
	var source: Variant = _alias_value(state, ["portrait_rig_hit_areas", "portraitRigHitAreas", "hit_areas", "hitAreas"], [])
	if typeof(source) != TYPE_ARRAY:
		return hit_areas
	for raw_area in source as Array:
		var area := normalize_hit_area(raw_area)
		if not area.is_empty():
			hit_areas.append(area)
	return hit_areas


static func get_expression_preset_from_state(state: Dictionary) -> Dictionary:
	return normalize_expression_preset(_expression_preset_variant_from_record(state))


static func hit_test_state_hit_areas(
	state: Dictionary,
	stage_position: Vector2,
	display_rect: Rect2
) -> Dictionary:
	return hit_test_hit_areas(get_hit_areas_from_state(state), stage_position, display_rect, Vector2(state.get("texture_size", Vector2.ZERO)))


static func hit_test_hit_areas(
	hit_areas: Array[Dictionary],
	stage_position: Vector2,
	display_rect: Rect2,
	source_size := Vector2.ZERO
) -> Dictionary:
	if display_rect.size.x <= 0.0 or display_rect.size.y <= 0.0:
		return {}
	var index := hit_areas.size() - 1
	while index >= 0:
		var area := normalize_hit_area(hit_areas[index])
		if not area.is_empty() and hit_area_contains_stage_position(area, stage_position, display_rect, source_size):
			var result := area.duplicate(true)
			var stage_rect := hit_area_stage_rect(area, display_rect, source_size)
			if stage_rect.size.x > 0.0 and stage_rect.size.y > 0.0:
				result["stage_rect"] = stage_rect
			return result
		index -= 1
	return {}


static func hit_area_contains_stage_position(
	area: Dictionary,
	stage_position: Vector2,
	display_rect: Rect2,
	source_size := Vector2.ZERO
) -> bool:
	if display_rect.size.x <= 0.0 or display_rect.size.y <= 0.0:
		return false
	var polygon := hit_area_stage_polygon(area, display_rect)
	if polygon.size() >= 3:
		return _point_in_polygon(stage_position, polygon)
	var stage_rect := hit_area_stage_rect(area, display_rect, source_size)
	return stage_rect.size.x > 0.0 and stage_rect.size.y > 0.0 and stage_rect.has_point(stage_position)


static func hit_area_stage_rect(area: Dictionary, display_rect: Rect2, source_size := Vector2.ZERO) -> Rect2:
	var normalized_bounds := _normalize_hit_area_bounds(area.get("normalized_bounds", area.get("normalizedBounds", {})))
	if not normalized_bounds.is_empty():
		return Rect2(
			display_rect.position + Vector2(float(normalized_bounds.get("x", 0.0)), float(normalized_bounds.get("y", 0.0))) * display_rect.size,
			Vector2(float(normalized_bounds.get("width", 0.0)), float(normalized_bounds.get("height", 0.0))) * display_rect.size
		)

	var bounds := _normalize_hit_area_bounds(area.get("bounds", area.get("rect", {})))
	if bounds.is_empty() or source_size.x <= 0.0 or source_size.y <= 0.0:
		return Rect2()
	return Rect2(
		display_rect.position + Vector2(float(bounds.get("x", 0.0)) / source_size.x, float(bounds.get("y", 0.0)) / source_size.y) * display_rect.size,
		Vector2(float(bounds.get("width", 0.0)) / source_size.x, float(bounds.get("height", 0.0)) / source_size.y) * display_rect.size
	)


static func hit_area_stage_polygon(area: Dictionary, display_rect: Rect2) -> PackedVector2Array:
	var normalized_points := _normalize_hit_area_points(area.get("normalized_points", area.get("normalizedPoints", [])))
	var polygon := PackedVector2Array()
	for point in normalized_points:
		polygon.append(display_rect.position + Vector2(float(point.get("x", 0.0)), float(point.get("y", 0.0))) * display_rect.size)
	return polygon


static func normalize_hit_area(raw_area: Variant) -> Dictionary:
	if typeof(raw_area) != TYPE_DICTIONARY:
		return {}
	var area: Dictionary = raw_area
	var id := String(area.get("id", area.get("key", area.get("name", "")))).strip_edges()
	if id.is_empty():
		return {}
	var label := String(area.get("label", area.get("name", id))).strip_edges()
	if label.is_empty():
		label = id
	var normalized := {
		"id": id,
		"label": label,
		"kind": _normalize_hit_area_kind(area.get("kind", area.get("type", "generic"))),
		"part_id": String(area.get("part_id", area.get("partId", ""))).strip_edges(),
		"source": String(area.get("source", "image_part")).strip_edges(),
	}
	var bounds := _normalize_hit_area_bounds(area.get("bounds", area.get("rect", {})))
	if not bounds.is_empty():
		normalized["bounds"] = bounds
	var normalized_bounds := _normalize_hit_area_bounds(area.get("normalized_bounds", area.get("normalizedBounds", area.get("normalized_rect", area.get("normalizedRect", {})))))
	if not normalized_bounds.is_empty():
		normalized["normalized_bounds"] = normalized_bounds
	var points := _normalize_hit_area_points(area.get("points", area.get("polygon", [])))
	if not points.is_empty():
		normalized["points"] = points
	var normalized_points := _normalize_hit_area_points(area.get("normalized_points", area.get("normalizedPoints", area.get("normalized_polygon", area.get("normalizedPolygon", [])))))
	if not normalized_points.is_empty():
		normalized["normalized_points"] = normalized_points
	return normalized


static func normalize_parameter_binding(raw_binding: Variant) -> Dictionary:
	if typeof(raw_binding) != TYPE_DICTIONARY:
		return {}
	var binding: Dictionary = raw_binding
	var parameter := String(binding.get("parameter", binding.get("param", binding.get("id", "")))).strip_edges()
	if parameter.is_empty():
		return {}
	var label := String(binding.get("label", binding.get("name", parameter))).strip_edges()
	if label.is_empty():
		label = parameter
	var role := _normalize_parameter_role(binding.get("role", binding.get("semantic_role", binding.get("semanticRole", ""))))
	if role.is_empty():
		role = _infer_parameter_role_from_text("%s %s" % [parameter, label])
	return {
		"parameter": parameter,
		"label": label,
		"role": role if not role.is_empty() else "generic",
		"channels": _normalize_string_array(binding.get("channels", []), 32),
		"direct_binding_count": maxi(int(binding.get("direct_binding_count", binding.get("directBindingCount", 0))), 0),
		"visibility_gate_count": maxi(int(binding.get("visibility_gate_count", binding.get("visibilityGateCount", 0))), 0),
		"transform_key_count": maxi(int(binding.get("transform_key_count", binding.get("transformKeyCount", 0))), 0),
		"draw_order_key_count": maxi(int(binding.get("draw_order_key_count", binding.get("drawOrderKeyCount", 0))), 0),
		"deformer_group_count": maxi(int(binding.get("deformer_group_count", binding.get("deformerGroupCount", 0))), 0),
		"warp_deformer_count": maxi(int(binding.get("warp_deformer_count", binding.get("warpDeformerCount", 0))), 0),
		"warp_key_count": maxi(int(binding.get("warp_key_count", binding.get("warpKeyCount", 0))), 0),
		"mesh_deformer_count": maxi(int(binding.get("mesh_deformer_count", binding.get("meshDeformerCount", 0))), 0),
		"mesh_key_count": maxi(int(binding.get("mesh_key_count", binding.get("meshKeyCount", 0))), 0),
		"physics_rule_count": maxi(int(binding.get("physics_rule_count", binding.get("physicsRuleCount", 0))), 0),
		"motion_key_count": maxi(int(binding.get("motion_key_count", binding.get("motionKeyCount", 0))), 0),
		"motion_clip_ids": _normalize_string_array(binding.get("motion_clip_ids", binding.get("motionClipIds", [])), 32),
		"affected_parts": _normalize_parameter_binding_parts(binding.get("affected_parts", binding.get("affectedParts", []))),
	}


static func _rig_image_parts(rig: Dictionary) -> Array[Dictionary]:
	var source: Variant = rig.get("imageParts", rig.get("image_parts", rig.get("parts", [])))
	return _duplicate_dictionary_array(source)


static func _rig_deformer_groups(rig: Dictionary) -> Array[Dictionary]:
	var source: Variant = rig.get("deformerGroups", rig.get("deformer_groups", rig.get("deformers", [])))
	return _duplicate_dictionary_array(source)


static func _rig_keyframes_from_record(record: Dictionary) -> Array[Dictionary]:
	return _duplicate_dictionary_array(record.get("keyframes", record.get("keys", [])))


static func _rig_parameter_labels(rig: Dictionary) -> Dictionary:
	var labels := {}
	var params := _dictionary_from_variant(rig.get("params", {}))
	for raw_key in params.keys():
		var key := String(raw_key).strip_edges()
		if not key.is_empty():
			labels[key] = key
	var custom_parameters: Variant = rig.get("customParameters", rig.get("custom_parameters", []))
	if typeof(custom_parameters) == TYPE_ARRAY:
		for raw_parameter in custom_parameters as Array:
			if typeof(raw_parameter) != TYPE_DICTIONARY:
				continue
			var parameter: Dictionary = raw_parameter
			var key := String(parameter.get("key", parameter.get("id", parameter.get("label", "")))).strip_edges()
			if key.is_empty():
				continue
			var label := String(parameter.get("label", parameter.get("name", key))).strip_edges()
			labels[key] = label if not label.is_empty() else key
	return labels


static func _rig_parameter_roles(rig: Dictionary) -> Dictionary:
	var roles := {
		"angleX": "gaze_x",
		"angleY": "gaze_y",
		"angleZ": "tilt",
		"eyeOpen": "eye_open",
		"mouthOpen": "mouth_open",
		"smile": "smile",
		"brow": "brow",
		"hairSway": "hair",
		"breath": "breath",
	}
	var custom_parameters: Variant = rig.get("customParameters", rig.get("custom_parameters", []))
	if typeof(custom_parameters) == TYPE_ARRAY:
		for raw_parameter in custom_parameters as Array:
			if typeof(raw_parameter) != TYPE_DICTIONARY:
				continue
			var parameter: Dictionary = raw_parameter
			var key := String(parameter.get("key", parameter.get("id", parameter.get("label", "")))).strip_edges()
			if key.is_empty():
				continue
			var label := String(parameter.get("label", parameter.get("name", key))).strip_edges()
			var role := _normalize_parameter_role(parameter.get("role", parameter.get("semanticRole", parameter.get("semantic_role", parameter.get("kind", "")))))
			if role.is_empty():
				role = _infer_parameter_role_from_text("%s %s" % [key, label])
			roles[key] = role if not role.is_empty() else "generic"
	return roles


static func _ensure_rig_parameter_binding(bindings: Dictionary, parameter: Variant, labels: Dictionary, roles: Dictionary) -> Dictionary:
	var key := String(parameter).strip_edges()
	if key.is_empty():
		return {}
	if not bindings.has(key):
		var role := _normalize_parameter_role(roles.get(key, ""))
		bindings[key] = {
			"parameter": key,
			"label": String(labels.get(key, key)).strip_edges(),
			"role": role if not role.is_empty() else "generic",
			"channels": [],
			"motion_clip_ids": [],
			"_affected_parts": {},
			"direct_binding_count": 0,
			"visibility_gate_count": 0,
			"transform_key_count": 0,
			"draw_order_key_count": 0,
			"deformer_group_count": 0,
			"warp_deformer_count": 0,
			"warp_key_count": 0,
			"mesh_deformer_count": 0,
			"mesh_key_count": 0,
			"physics_rule_count": 0,
			"motion_key_count": 0,
		}
	var binding: Dictionary = bindings[key]
	return binding


static func _normalize_parameter_role(value: Variant) -> String:
	var role := String(value).strip_edges().to_lower().replace("-", "_").replace(" ", "_")
	var aliases := {
		"angle_x": "gaze_x",
		"look_x": "gaze_x",
		"turn_x": "gaze_x",
		"angle_y": "gaze_y",
		"look_y": "gaze_y",
		"angle_z": "tilt",
		"roll": "tilt",
		"eye": "eye_open",
		"blink": "eye_open",
		"mouth": "mouth_open",
		"lip": "mouth_open",
		"emotion": "smile",
		"expression": "smile",
		"eyebrow": "brow",
		"sway": "hair",
		"breathing": "breath",
		"accessory": "prop",
		"visibility": "prop",
		"none": "generic",
	}
	role = String(aliases.get(role, role))
	if role in ["generic", "gaze_x", "gaze_y", "tilt", "eye_open", "mouth_open", "smile", "brow", "hair", "breath", "body", "prop"]:
		return role
	return ""


static func _infer_parameter_role_from_text(value: String) -> String:
	var text := value.strip_edges().to_lower().replace("_", " ").replace("-", " ")
	if _text_has_any(text, ["angle x", "look x", "gaze x", "turn x", "head x", "face x"]):
		return "gaze_x"
	if _text_has_any(text, ["angle y", "look y", "gaze y", "head y", "face y"]):
		return "gaze_y"
	if _text_has_any(text, ["angle z", "tilt", "roll"]):
		return "tilt"
	if _text_has_any(text, ["eye", "blink", "lid", "iris", "pupil"]):
		return "eye_open"
	if _text_has_any(text, ["mouth", "lip", "jaw", "talk", "speak", "phoneme"]):
		return "mouth_open"
	if _text_has_any(text, ["smile", "happy", "sad", "laugh", "frown", "emotion"]):
		return "smile"
	if _text_has_any(text, ["brow", "eyebrow", "angry", "serious", "worried"]):
		return "brow"
	if _text_has_any(text, ["hair", "bang", "sway", "strand"]):
		return "hair"
	if _text_has_any(text, ["breath", "breathe", "chest"]):
		return "breath"
	if _text_has_any(text, ["body", "torso", "shoulder", "arm", "hand"]):
		return "body"
	if _text_has_any(text, ["prop", "item", "accessory", "weapon", "tail", "wing"]):
		return "prop"
	return "generic"


static func _text_has_any(text: String, needles: Array) -> bool:
	for raw_needle in needles:
		if text.find(String(raw_needle)) >= 0:
			return true
	return false


static func _add_rig_binding_channel(binding: Dictionary, channel: String) -> void:
	_append_unique_string(binding["channels"], channel, 32)


static func _add_rig_binding_affected_part(binding: Dictionary, part: Dictionary, channel: String) -> void:
	var part_id := String(part.get("id", "")).strip_edges()
	if part_id.is_empty():
		return
	var affected: Dictionary = binding.get("_affected_parts", {})
	if not affected.has(part_id):
		var label := String(part.get("label", part.get("name", part_id))).strip_edges()
		affected[part_id] = {
			"part_id": part_id,
			"label": label if not label.is_empty() else part_id,
			"channels": [],
		}
	var entry: Dictionary = affected[part_id]
	_append_unique_string(entry["channels"], channel, 16)
	binding["_affected_parts"] = affected


static func _rig_deformer_group_part_ids(group: Dictionary, groups: Array[Dictionary], visited := {}) -> Array[String]:
	var group_id := String(group.get("id", "")).strip_edges()
	if group_id.is_empty() or visited.has(group_id):
		return []
	visited[group_id] = true
	var result: Array[String] = []
	var direct_part_ids: Variant = group.get("partIds", group.get("part_ids", group.get("parts", [])))
	if typeof(direct_part_ids) == TYPE_ARRAY:
		for raw_part_id in direct_part_ids as Array:
			var part_id := ""
			if typeof(raw_part_id) == TYPE_DICTIONARY:
				part_id = String((raw_part_id as Dictionary).get("id", "")).strip_edges()
			else:
				part_id = String(raw_part_id).strip_edges()
			_append_unique_string(result, part_id, 256)
	for child in groups:
		if bool(child.get("enabled", true)) == false:
			continue
		var child_id := String(child.get("id", "")).strip_edges()
		var parent_id := String(child.get("parentGroupId", child.get("parent_group_id", child.get("parentId", child.get("parent", ""))))).strip_edges()
		if child_id.is_empty() or parent_id != group_id:
			continue
		for part_id in _rig_deformer_group_part_ids(child, groups, visited.duplicate()):
			_append_unique_string(result, part_id, 256)
	return result


static func _finalize_rig_parameter_bindings(bindings: Dictionary) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for raw_key in bindings.keys():
		var binding := normalize_parameter_binding(bindings[raw_key])
		if binding.is_empty():
			continue
		var affected_map: Dictionary = (bindings[raw_key] as Dictionary).get("_affected_parts", {})
		var affected_parts: Array[Dictionary] = []
		for raw_part_id in affected_map.keys():
			if typeof(affected_map[raw_part_id]) != TYPE_DICTIONARY:
				continue
			var affected_part: Dictionary = affected_map[raw_part_id]
			affected_parts.append({
				"part_id": String(affected_part.get("part_id", raw_part_id)).strip_edges(),
				"label": String(affected_part.get("label", raw_part_id)).strip_edges(),
				"channels": _normalize_string_array(affected_part.get("channels", []), 16),
			})
		affected_parts.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
			return String(a.get("label", "")) < String(b.get("label", ""))
		)
		binding["affected_parts"] = affected_parts.slice(0, 64)
		result.append(binding)
	result.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		return String(a.get("label", "")) < String(b.get("label", ""))
	)
	return result.slice(0, 128)


static func sample_runtime_params(
	rig: Dictionary,
	clip_id: String,
	motion_time: float,
	physics_time := -1.0
) -> Dictionary:
	var params := _dictionary_from_variant(rig.get("params", {}))
	var motion_params := sample_motion_clip_params(rig, clip_id, motion_time)
	for key in motion_params.keys():
		params[key] = motion_params[key]
	return sample_physics_params(rig, physics_time if physics_time >= 0.0 else motion_time, params)


static func sample_motion_clip_params(rig: Dictionary, clip_id: String, time: float, loop := true) -> Dictionary:
	var clip := _find_motion_clip(rig, clip_id)
	if clip.is_empty():
		return {}
	var keyframes := _normalize_motion_keyframes(clip.get("keyframes", []))
	if keyframes.is_empty():
		return {}

	var duration := maxf(float(clip.get("duration", 0.0)), 0.0)
	var sample_time := maxf(time, 0.0)
	if loop and duration > 0.0:
		sample_time = fmod(sample_time, duration)
		if sample_time < 0.0:
			sample_time += duration

	if sample_time <= float(keyframes[0].get("time", 0.0)):
		return _dictionary_from_variant(keyframes[0].get("params", {}))
	var last: Dictionary = keyframes[keyframes.size() - 1]
	if sample_time >= float(last.get("time", 0.0)):
		return _dictionary_from_variant(last.get("params", {}))

	var previous: Dictionary = keyframes[0]
	var next: Dictionary = last
	for index in range(1, keyframes.size()):
		var keyframe: Dictionary = keyframes[index]
		if float(keyframe.get("time", 0.0)) >= sample_time:
			next = keyframe
			previous = keyframes[index - 1]
			break

	var previous_time := float(previous.get("time", 0.0))
	var next_time := float(next.get("time", 0.0))
	var ratio := _apply_motion_easing(
		clampf((sample_time - previous_time) / maxf(next_time - previous_time, 0.001), 0.0, 1.0),
		String(previous.get("easing", "linear"))
	)
	var previous_params := _dictionary_from_variant(previous.get("params", {}))
	var next_params := _dictionary_from_variant(next.get("params", {}))
	var result := {}
	var keys := {}
	for key in previous_params.keys():
		keys[key] = true
	for key in next_params.keys():
		keys[key] = true
	for key in keys.keys():
		var has_previous := previous_params.has(key)
		var has_next := next_params.has(key)
		if has_previous and has_next:
			result[key] = lerpf(float(previous_params[key]), float(next_params[key]), ratio)
		elif has_previous:
			result[key] = previous_params[key]
		elif has_next:
			result[key] = next_params[key]
	return result


static func sample_physics_params(rig: Dictionary, time: float, base_params: Dictionary = {}) -> Dictionary:
	var physics: Variant = rig.get("physics", {})
	if typeof(physics) == TYPE_DICTIONARY and bool((physics as Dictionary).get("enabled", true)) == false:
		return base_params.duplicate(true)
	var result := base_params.duplicate(true)
	if result.is_empty():
		result = _dictionary_from_variant(rig.get("params", {}))
	var sample_time := maxf(time, 0.0)
	for rule in get_physics_rules_from_rig(rig):
		if bool(rule.get("enabled", true)) == false:
			continue
		var param := String(rule.get("param", rule.get("parameter", rule.get("target", "")))).strip_edges()
		if param.is_empty():
			continue
		var offset := float(rule.get("offset", rule.get("center", result.get(param, 0.0))))
		var amplitude := float(rule.get("amplitude", rule.get("scale", 0.0)))
		var frequency := maxf(float(rule.get("frequency", rule.get("hz", 0.0))), 0.0)
		var phase := float(rule.get("phase", 0.0))
		result[param] = offset + sin(sample_time * frequency * PI * 2.0 + phase) * amplitude
	return result


static func _motion_frame_variant_from_record(data: Dictionary) -> Variant:
	if data.has("portrait_rig_motion_frame"):
		return data["portrait_rig_motion_frame"]
	if data.has("portraitRigMotionFrame"):
		return data["portraitRigMotionFrame"]
	if data.has("motion_frame"):
		return data["motion_frame"]
	if data.has("motionFrame"):
		return data["motionFrame"]
	return {}


static func _expression_preset_variant_from_record(data: Dictionary) -> Variant:
	if data.has("portrait_rig_expression_preset"):
		return data["portrait_rig_expression_preset"]
	if data.has("portraitRigExpressionPreset"):
		return data["portraitRigExpressionPreset"]
	if data.has("expression_preset"):
		return data["expression_preset"]
	if data.has("expressionPreset"):
		return data["expressionPreset"]
	return {}


static func get_motion_frame_portraits(profile: Dictionary) -> Array[Dictionary]:
	var frames: Array[Dictionary] = []
	var portraits: Variant = profile.get("portraits", {})
	var portrait_map: Dictionary = portraits if typeof(portraits) == TYPE_DICTIONARY else {}
	var hit_areas := get_hit_areas_from_profile(profile)
	var parameter_bindings := get_parameter_bindings_from_profile(profile)
	var seen_frames := {}
	var rig_cache := {}
	var source_model_path := _portrait_rig_source_model_path_from_profile(profile)

	for frame_set in get_motion_frame_sets_from_profile(profile):
		var states: Variant = frame_set.get("states", [])
		if typeof(states) != TYPE_ARRAY:
			continue
		for raw_state in states as Array:
			if typeof(raw_state) != TYPE_DICTIONARY:
				continue
			var state: Dictionary = raw_state
			var key := String(state.get("state", state.get("key", ""))).strip_edges()
			var frame := normalize_motion_frame(_motion_frame_variant_from_record(state))
			if frame.is_empty():
				frame = normalize_motion_frame({
					"clip_id": frame_set.get("clip_id", ""),
					"clip_label": frame_set.get("clip_label", frame_set.get("clip_id", "")),
					"time": state.get("time", 0.0),
					"frame_index": state.get("frame_index", 0),
					"frame_count": frame_set.get("frame_count", frame_set.get("expected_frame_count", 0)),
					"clip_duration": frame_set.get("clip_duration", 0.0),
					"physics_sampled": frame_set.get("physics_sampled", false),
					"pose_tags": state.get("pose_tags", []),
					"pose_score": state.get("pose_score", {}),
					"parameter_values": state.get("parameter_values", {}),
				})
			_append_motion_frame_portrait(
				frames,
				seen_frames,
				profile,
				key,
				frame,
				hit_areas,
				parameter_bindings,
				String(state.get("image_path", state.get("imagePath", state.get("path", "")))).strip_edges(),
					_resolve_portrait_rig_model_fallback(
						_rig_model_path_from_record(state),
						source_model_path
					),
				null,
				rig_cache,
				_expression_preset_variant_from_record(state)
			)

	var portrait_rig_portrait_map := _portrait_rig_metadata_portraits_from_profile(profile)
	for raw_key in portrait_rig_portrait_map.keys():
		var key := String(raw_key).strip_edges()
		if key.is_empty():
			continue
		var raw_entry: Variant = portrait_rig_portrait_map[raw_key]
		if typeof(raw_entry) != TYPE_DICTIONARY:
			continue
		var entry: Dictionary = raw_entry
		var frame := normalize_motion_frame(_motion_frame_variant_from_record(entry))
		if frame.is_empty():
			continue
		_append_motion_frame_portrait(
			frames,
			seen_frames,
			profile,
			key,
			frame,
			hit_areas,
			parameter_bindings,
			String(entry.get("image_path", entry.get("imagePath", entry.get("path", "")))).strip_edges(),
				_resolve_portrait_rig_model_fallback(
					_rig_model_path_from_record(entry),
					source_model_path
				),
			entry.get("center", null),
			rig_cache,
			_expression_preset_variant_from_record(entry)
		)

	for raw_key in portrait_map.keys():
		var key := String(raw_key).strip_edges()
		if key.is_empty():
			continue
		var raw_entry: Variant = portrait_map[raw_key]
		if typeof(raw_entry) != TYPE_DICTIONARY:
			continue
		var entry: Dictionary = raw_entry
		var frame := normalize_motion_frame(_motion_frame_variant_from_record(entry))
		if frame.is_empty():
			continue
		_append_motion_frame_portrait(frames, seen_frames, profile, key, frame, hit_areas, parameter_bindings, "", source_model_path, null, rig_cache, _expression_preset_variant_from_record(entry))
	return frames


static func _portrait_rig_source_model_path_from_profile(profile: Dictionary) -> String:
	var portrait_rig_metadata := _portrait_rig_metadata_from_profile(profile)
	if portrait_rig_metadata.is_empty():
		return ""
	return String(portrait_rig_metadata.get("source_model_path", portrait_rig_metadata.get("sourceModelPath", ""))).strip_edges()


static func _resolve_portrait_rig_model_fallback(model_path: String, source_model_path: String) -> String:
	var clean_model_path := model_path.strip_edges()
	if not clean_model_path.is_empty():
		return clean_model_path
	return source_model_path.strip_edges()


static func _portrait_rig_metadata_portraits_from_profile(profile: Dictionary) -> Dictionary:
	var portrait_rig_metadata := _portrait_rig_metadata_from_profile(profile)
	if portrait_rig_metadata.is_empty():
		return {}
	var portraits: Variant = portrait_rig_metadata.get("portraits", {})
	return portraits if typeof(portraits) == TYPE_DICTIONARY else {}


static func get_motion_frame_sets_from_profile(profile: Dictionary) -> Array[Dictionary]:
	var frame_sets: Array[Dictionary] = []
	var portrait_rig_metadata := _portrait_rig_metadata_from_profile(profile)
	if portrait_rig_metadata.is_empty():
		return frame_sets
	var source_sets: Array = []
	for key in ["motion_frame_sets", "motionFrameSets"]:
		var source: Variant = portrait_rig_metadata.get(key, [])
		if typeof(source) != TYPE_ARRAY:
			continue
		source_sets.append_array(source as Array)
	for raw_set in source_sets:
		if typeof(raw_set) != TYPE_DICTIONARY:
			continue
		var frame_set: Dictionary = raw_set
		var clip_id := String(frame_set.get("clip_id", frame_set.get("clipId", ""))).strip_edges()
		if clip_id.is_empty():
			continue
		var states: Array[Dictionary] = []
		var raw_states: Variant = frame_set.get("states", [])
		if typeof(raw_states) == TYPE_ARRAY:
			for raw_state in raw_states as Array:
				if typeof(raw_state) != TYPE_DICTIONARY:
					continue
				var state: Dictionary = raw_state
				var key := String(state.get("state", state.get("key", ""))).strip_edges()
				if key.is_empty():
					continue
				states.append({
					"state": key,
					"time": maxf(float(state.get("time", 0.0)), 0.0),
					"frame_index": maxi(int(state.get("frame_index", state.get("frameIndex", 0))), 0),
					"image_path": String(state.get("image_path", state.get("imagePath", state.get("path", "")))).strip_edges(),
						"model_path": _rig_model_path_from_record(state),
						"portrait_rig_motion_frame": _dictionary_from_variant(_motion_frame_variant_from_record(state)),
						"portrait_rig_expression_preset": _dictionary_from_variant(_expression_preset_variant_from_record(state)),
					"pose_tags": _normalize_pose_tag_array(state.get("pose_tags", state.get("poseTags", [])), 64),
					"pose_score": _pose_score_dictionary_from_variant(state.get("pose_score", state.get("poseScore", {})), 32),
					"parameter_values": _number_dictionary_from_variant(state.get("parameter_values", state.get("parameterValues", {})), -10000.0, 10000.0, 128),
				})
		if states.is_empty():
			continue
		var expected_count := maxi(int(frame_set.get("expected_frame_count", frame_set.get("expectedFrameCount", states.size()))), states.size())
		frame_sets.append({
			"clip_id": clip_id,
			"clip_label": String(frame_set.get("clip_label", frame_set.get("clipLabel", frame_set.get("label", clip_id)))).strip_edges(),
			"frame_count": maxi(int(frame_set.get("frame_count", frame_set.get("frameCount", expected_count))), states.size()),
			"expected_frame_count": expected_count,
			"clip_duration": maxf(float(frame_set.get("clip_duration", frame_set.get("clipDuration", frame_set.get("duration", 0.0)))), 0.0),
			"physics_sampled": bool(frame_set.get("physics_sampled", frame_set.get("physicsSampled", false))),
			"states": states,
		})
	return frame_sets


static func _append_motion_frame_portrait(
	frames: Array[Dictionary],
	seen_frames: Dictionary,
	profile: Dictionary,
	key: String,
	frame: Dictionary,
	hit_areas: Array[Dictionary],
	parameter_bindings: Array[Dictionary],
	fallback_path := "",
	fallback_model := "",
	fallback_center: Variant = null,
	rig_cache: Dictionary = {},
	fallback_expression_preset: Variant = null
) -> void:
	if key.is_empty() or frame.is_empty():
		return
	var clip_id := String(frame.get("clip_id", "")).strip_edges()
	if clip_id.is_empty():
		return
	var seen_key := "%s:%s" % [key, clip_id]
	if seen_frames.has(seen_key):
		return

	var portrait_entry := PortraitLayout.resolve_portrait_entry(profile, key)
	var path := String(portrait_entry.get("path", fallback_path)).strip_edges()
	var portrait_rig_model := _rig_model_path_from_record(portrait_entry)
	if portrait_rig_model.is_empty():
		portrait_rig_model = fallback_model.strip_edges()
	if path.is_empty():
		path = fallback_path.strip_edges()
	if path.is_empty() and portrait_rig_model.is_empty():
		return
	var expression_preset := normalize_expression_preset(fallback_expression_preset)
	if expression_preset.is_empty():
		expression_preset = normalize_expression_preset(_expression_preset_variant_from_record(portrait_entry))
	if expression_preset.is_empty():
		expression_preset = _best_expression_preset_for_motion_frame(profile, frame)
	var center := Vector2(0.5, 0.5)
	if portrait_entry.has("center"):
		center = Vector2(portrait_entry.get("center", Vector2(0.5, 0.5)))
	elif fallback_center != null:
		center = PortraitLayout.parse_face_center(fallback_center)

	var state_hit_areas := hit_areas.duplicate(true)
	var state_parameter_bindings := parameter_bindings.duplicate(true)
	if (state_hit_areas.is_empty() or state_parameter_bindings.is_empty()) and not portrait_rig_model.is_empty():
		var rig_doc := _load_cached_rig_document(rig_cache, portrait_rig_model)
		if not rig_doc.is_empty():
			if state_hit_areas.is_empty():
				state_hit_areas = get_hit_areas_from_rig(rig_doc)
			if state_parameter_bindings.is_empty():
				state_parameter_bindings = get_parameter_bindings_from_rig(rig_doc)

	seen_frames[seen_key] = true
	var frame_state := {
		"key": key,
		"clip_id": clip_id,
		"clip_label": String(frame.get("clip_label", clip_id)).strip_edges(),
		"frame_index": int(frame.get("frame_index", 0)),
		"time": float(frame.get("time", 0.0)),
		"clip_duration": float(frame.get("clip_duration", 0.0)),
		"frame_count": int(frame.get("frame_count", 0)),
		"physics_sampled": bool(frame.get("physics_sampled", false)),
		"pose_tags": _normalize_pose_tag_array(frame.get("pose_tags", []), 64),
		"pose_score": _pose_score_dictionary_from_variant(frame.get("pose_score", {}), 32),
		"parameter_values": _number_dictionary_from_variant(frame.get("parameter_values", {}), -10000.0, 10000.0, 128),
			"path": path,
			"center": center,
			"portrait_rig_model": portrait_rig_model,
			"portrait_rig_motion_frame": frame.duplicate(true),
			"portrait_rig_hit_areas": state_hit_areas,
			"portrait_rig_parameter_bindings": state_parameter_bindings,
		}
	if not expression_preset.is_empty():
		frame_state["portrait_rig_expression_preset"] = expression_preset
	frames.append(frame_state)


static func normalize_motion_frame(raw_frame: Variant) -> Dictionary:
	if typeof(raw_frame) != TYPE_DICTIONARY:
		return {}
	var frame: Dictionary = raw_frame
	var clip_id := String(frame.get("clip_id", frame.get("clipId", ""))).strip_edges()
	if clip_id.is_empty():
		return {}
	return {
		"clip_id": clip_id,
		"clip_label": String(frame.get("clip_label", frame.get("clipLabel", frame.get("label", clip_id)))).strip_edges(),
		"time": maxf(float(frame.get("time", 0.0)), 0.0),
		"frame_index": maxi(int(frame.get("frame_index", frame.get("frameIndex", 0))), 0),
		"clip_duration": maxf(float(frame.get("clip_duration", frame.get("clipDuration", frame.get("duration", 0.0)))), 0.0),
		"frame_count": maxi(int(frame.get("frame_count", frame.get("frameCount", 0))), 0),
		"physics_sampled": bool(frame.get("physics_sampled", frame.get("physicsSampled", false))),
		"pose_tags": _normalize_pose_tag_array(frame.get("pose_tags", frame.get("poseTags", [])), 64),
		"pose_score": _pose_score_dictionary_from_variant(frame.get("pose_score", frame.get("poseScore", {})), 32),
		"parameter_values": _number_dictionary_from_variant(frame.get("parameter_values", frame.get("parameterValues", {})), -10000.0, 10000.0, 128),
	}


static func normalize_expression_preset(raw_preset: Variant) -> Dictionary:
	if typeof(raw_preset) != TYPE_DICTIONARY:
		return {}
	var preset: Dictionary = raw_preset
	var id := String(preset.get("id", preset.get("preset_id", preset.get("presetId", "")))).strip_edges()
	if id.is_empty():
		return {}
	var result := {
		"id": id,
		"label": String(preset.get("label", preset.get("name", id))).strip_edges(),
		"auto_generated": bool(preset.get("auto_generated", preset.get("autoGenerated", false))),
	}
	var kind := String(preset.get("auto_expression_kind", preset.get("autoExpressionKind", ""))).strip_edges()
	if not kind.is_empty():
		result["auto_expression_kind"] = kind
	var pose_tags := _normalize_pose_tag_array(preset.get("pose_tags", preset.get("poseTags", [])), 64)
	if not pose_tags.is_empty():
		result["pose_tags"] = pose_tags
	var pose_score := _pose_score_dictionary_from_variant(preset.get("pose_score", preset.get("poseScore", {})), 32)
	if not pose_score.is_empty():
		result["pose_score"] = pose_score
	var parameter_values := _number_dictionary_from_variant(preset.get("parameter_values", preset.get("parameterValues", {})), -10000.0, 10000.0, 128)
	if not parameter_values.is_empty():
		result["parameter_values"] = parameter_values
	return result


static func get_expression_presets_from_profile(profile: Dictionary) -> Array[Dictionary]:
	var presets: Array[Dictionary] = []
	var portrait_rig_metadata := _portrait_rig_metadata_from_profile(profile)
	if portrait_rig_metadata.is_empty():
		return presets
	var source: Variant = portrait_rig_metadata.get("expression_presets", portrait_rig_metadata.get("expressionPresets", []))
	if typeof(source) != TYPE_ARRAY:
		return presets
	for raw_preset in source as Array:
		var preset := normalize_expression_preset(raw_preset)
		if not preset.is_empty():
			presets.append(preset)
	return presets


static func _best_expression_preset_for_motion_frame(profile: Dictionary, frame: Dictionary) -> Dictionary:
	var requested_tags := _frame_pose_tags(frame)
	var requested_score := _frame_pose_score(frame)
	if requested_tags.is_empty() and requested_score.is_empty():
		return {}
	requested_tags = _expand_pose_hint_tags(requested_tags)
	var best_preset := {}
	var best_score := 0.0
	for preset in get_expression_presets_from_profile(profile):
		var preset_tags := _normalize_pose_tag_array(preset.get("pose_tags", []), 64)
		var preset_score := _pose_score_dictionary_from_variant(preset.get("pose_score", {}), 32)
		var score := 0.0
		for tag in requested_tags:
			if preset_tags.has(tag):
				score += 3.0
			score += float(preset_score.get(tag, 0.0)) * 2.0
		for tag in preset_tags:
			score += float(requested_score.get(tag, 0.0)) * 0.85
		for raw_tag in preset_score.keys():
			var tag := _normalize_pose_tag(raw_tag)
			if tag.is_empty():
				continue
			score += minf(float(preset_score.get(tag, 0.0)), float(requested_score.get(tag, 0.0))) * 1.25
		if score > best_score:
			best_score = score
			best_preset = preset
	if best_score < 0.65:
		return {}
	return (best_preset as Dictionary).duplicate(true)


static func get_motion_clip_id_from_state(state: Dictionary) -> String:
	return String(normalize_motion_frame(_motion_frame_variant_from_record(state)).get("clip_id", "")).strip_edges()


static func select_nearest_motion_frame_portrait_key(profile: Dictionary, clip_id: String, target_time: float) -> String:
	var frames := _sorted_motion_frames_for_clip(profile, clip_id)
	if frames.is_empty():
		return ""
	var best: Dictionary = frames[0]
	var best_distance := absf(float(best.get("time", 0.0)) - target_time)
	for index in range(1, frames.size()):
		var frame: Dictionary = frames[index]
		var distance := absf(float(frame.get("time", 0.0)) - target_time)
		if distance < best_distance:
			best = frame
			best_distance = distance
	return String(best.get("key", "")).strip_edges()


static func get_motion_frames_for_clip(profile: Dictionary, clip_id: String) -> Array[Dictionary]:
	if clip_id.strip_edges().is_empty():
		var all_frames := get_motion_frame_portraits(profile)
		var dialogue_motion_set := get_dialogue_motion_set_from_profile(profile)
		var dialogue_adaptive_clip := String(dialogue_motion_set.get("adaptive_clip_id", dialogue_motion_set.get("adaptiveClipId", ""))).strip_edges()
		if not dialogue_adaptive_clip.is_empty():
			var dialogue_adaptive_frames := _filter_frames_by_clip(all_frames, dialogue_adaptive_clip)
			if not dialogue_adaptive_frames.is_empty():
				_sort_motion_frames(dialogue_adaptive_frames)
				return dialogue_adaptive_frames
		var preferred_clip := _preferred_adaptive_motion_clip_id(all_frames)
		if not preferred_clip.is_empty():
			var preferred_frames := _filter_frames_by_clip(all_frames, preferred_clip)
			_sort_motion_frames(preferred_frames)
			return preferred_frames
		_sort_motion_frames(all_frames)
		return all_frames
	var frames := _sorted_motion_frames_for_clip(profile, clip_id)
	return frames


static func get_motion_frame_loop_duration(frames: Array[Dictionary]) -> float:
	if frames.is_empty():
		return 0.0
	var declared_duration := _motion_frame_declared_duration(frames)
	if declared_duration > 0.0:
		return declared_duration
	if frames.size() <= 1:
		return 0.0
	var sorted_frames := frames.duplicate(true)
	_sort_motion_frames(sorted_frames)
	var last_time := float(sorted_frames[sorted_frames.size() - 1].get("time", 0.0))
	var total_step := 0.0
	var step_count := 0
	for index in range(1, sorted_frames.size()):
		var previous_time := float(sorted_frames[index - 1].get("time", 0.0))
		var next_time := float(sorted_frames[index].get("time", 0.0))
		var step := next_time - previous_time
		if step > 0.001:
			total_step += step
			step_count += 1
	var average_step := total_step / float(step_count) if step_count > 0 else 1.0 / 12.0
	return maxf(last_time + average_step, average_step * float(sorted_frames.size()))


static func get_motion_frame_parameter_distance(frame: Dictionary, current_state: Dictionary) -> float:
	var reference_values := _state_parameter_values(current_state)
	var frame_values := _frame_parameter_values(frame)
	if not reference_values.is_empty() and not frame_values.is_empty():
		var total := 0.0
		var total_weight := 0.0
		var roles := _parameter_roles_for_state_pair(frame, current_state)
		for raw_key in reference_values.keys():
			var key := String(raw_key)
			if key.is_empty() or not frame_values.has(key):
				continue
			var reference_value := float(reference_values[key])
			var frame_value := float(frame_values[key])
			var denominator := _parameter_distance_denominator(reference_value, frame_value)
			var role := String(roles.get(key, "")).strip_edges()
			if role.is_empty():
				role = _infer_parameter_role_from_text(key)
			var weight := _parameter_distance_role_weight(role)
			total += clampf(absf(frame_value - reference_value) / denominator, 0.0, 1.0) * weight
			total_weight += weight
		if total_weight > 0.001:
			return clampf(total / total_weight, 0.0, 1.0)

	var current_expression := get_expression_preset_from_state(current_state)
	var frame_expression := normalize_expression_preset(_expression_preset_variant_from_record(frame))
	var current_expression_id := String(current_expression.get("id", "")).strip_edges()
	var frame_expression_id := String(frame_expression.get("id", "")).strip_edges()
	if not current_expression_id.is_empty() and not frame_expression_id.is_empty() and current_expression_id != frame_expression_id:
		return 0.65

	var current_tags := _frame_pose_tags(current_state)
	var frame_tags := _frame_pose_tags(frame)
	if not current_tags.is_empty() and not frame_tags.is_empty():
		for tag in current_tags:
			if frame_tags.has(tag):
				return 0.18
		return 0.45
	return 0.0


static func _parameter_roles_for_state_pair(frame: Dictionary, current_state: Dictionary) -> Dictionary:
	var roles := {}
	_collect_parameter_roles_from_record(roles, current_state)
	_collect_parameter_roles_from_record(roles, frame)
	return roles


static func _collect_parameter_roles_from_record(roles: Dictionary, record: Dictionary) -> void:
	for key in ["portrait_rig_parameter_bindings", "portraitRigParameterBindings", "parameter_bindings", "parameterBindings"]:
		var source: Variant = record.get(key, [])
		if typeof(source) != TYPE_ARRAY:
			continue
		for raw_binding in source as Array:
			var binding := normalize_parameter_binding(raw_binding)
			if binding.is_empty():
				continue
			var parameter := String(binding.get("parameter", "")).strip_edges()
			if parameter.is_empty():
				continue
			var role := _normalize_parameter_role(binding.get("role", ""))
			if role.is_empty():
				role = _infer_parameter_role_from_text("%s %s" % [parameter, String(binding.get("label", ""))])
			roles[parameter] = role if not role.is_empty() else "generic"


static func _parameter_distance_role_weight(role: String) -> float:
	match _normalize_parameter_role(role):
		"gaze_x", "gaze_y", "tilt", "smile", "brow", "body":
			return 1.2
		"eye_open":
			return 0.8
		"mouth_open":
			return 0.55
		"prop":
			return 0.5
		"hair", "breath":
			return 0.35
		_:
			return 1.0


static func get_motion_animation_sync_duration(animation: Dictionary) -> float:
	var duration := maxf(float(animation.get("duration", 0.0)), 0.0)
	if not bool(animation.get("dialogue_motion", false)):
		return duration
	return maxf(
		duration,
		maxf(
			maxf(
				float(animation.get("idle_duration", 0.0)),
				float(animation.get("talk_duration", 0.0))
			),
			float(animation.get("viseme_duration", 0.0))
		)
	)


static func select_motion_frame_at_time(frames: Array[Dictionary], time: float) -> Dictionary:
	if frames.is_empty():
		return {}
	var sorted_frames := frames.duplicate(true)
	_sort_motion_frames(sorted_frames)
	var duration := get_motion_frame_loop_duration(sorted_frames)
	var sample_time := maxf(time, 0.0)
	if duration > 0.0:
		sample_time = fmod(sample_time, duration)
		if sample_time < 0.0:
			sample_time += duration
	var selected: Dictionary = sorted_frames[0]
	for frame in sorted_frames:
		if float(frame.get("time", 0.0)) <= sample_time:
			selected = frame
		else:
			break
	return selected


static func select_motion_frame_for_pose_tags(
	frames: Array[Dictionary],
	pose_tags: Array,
	current_state := {},
	seed := ""
) -> Dictionary:
	if frames.is_empty() or pose_tags.is_empty():
		return {}
	var requested_tags: Array[String] = []
	_append_pose_hint_tags(requested_tags, pose_tags)
	requested_tags = _expand_pose_hint_tags(requested_tags)
	if requested_tags.is_empty():
		return {}
	var state := current_state if typeof(current_state) == TYPE_DICTIONARY else {}
	var current_key := String(state.get("portrait_key", "")).strip_edges()
	var frame_key := _best_pose_tag_frame_key(frames, requested_tags, current_key, state, String(seed))
	if frame_key.is_empty():
		return {}
	for frame in frames:
		if String(frame.get("key", "")).strip_edges() == frame_key:
			return frame.duplicate(true)
	return {}


static func select_next_motion_frame_portrait_key(
	profile: Dictionary,
	cast_id: String,
	cast_entry: Dictionary,
	current_state: Dictionary,
	dialogue_id: String,
	node_id: String,
	cycle_indices: Dictionary,
	node_cache: Dictionary
) -> String:
	var frames := get_motion_frame_portraits(profile)
	if frames.is_empty():
		return ""

	var requested_clip := String(_alias_value(cast_entry, ["portrait_rig_motion_clip", "portraitRigMotionClip", "motion_clip", "motionClip", "clip_id", "clipId"], "")).strip_edges()
	var current_clip := requested_clip
	var current_key := String(current_state.get("portrait_key", "")).strip_edges()
	if current_clip.is_empty():
		var dialogue_motion_set := get_dialogue_motion_set_from_profile(profile)
		var dialogue_adaptive_clip := String(dialogue_motion_set.get("adaptive_clip_id", dialogue_motion_set.get("adaptiveClipId", ""))).strip_edges()
		if not dialogue_adaptive_clip.is_empty() and not _filter_frames_by_clip(frames, dialogue_adaptive_clip).is_empty():
			current_clip = dialogue_adaptive_clip
	if current_clip.is_empty():
		current_clip = _preferred_adaptive_motion_clip_id(frames)
	if current_clip.is_empty():
		current_clip = get_motion_clip_id_from_state(current_state)
	if current_clip.is_empty():
		return ""

	var clip_frames := _filter_frames_by_clip(frames, current_clip)
	if clip_frames.is_empty():
		return ""

	_sort_motion_frames(clip_frames)

	var requested_time := _optional_float(cast_entry, ["portrait_rig_motion_time", "portraitRigMotionTime", "motion_time", "motionTime", "pose_time", "poseTime"], -1.0)
	if requested_time < 0.0:
		var requested_progress := _optional_float(cast_entry, ["portrait_rig_motion_progress", "portraitRigMotionProgress", "motion_progress", "motionProgress", "pose_progress", "poseProgress"], -1.0)
		if requested_progress >= 0.0:
			requested_time = _motion_frame_duration(clip_frames) * clampf(requested_progress, 0.0, 1.0)
	if requested_time >= 0.0:
		var nearest_key := _nearest_frame_key(clip_frames, requested_time)
		if not nearest_key.is_empty():
			var time_cache_key := "%s:%s:%s:%s:%s" % [dialogue_id, node_id, cast_id, current_clip, str(snappedf(requested_time, 0.001))]
			node_cache[time_cache_key] = nearest_key
			_remember_recent_motion_frame(cycle_indices, cast_id, current_clip, _find_frame_by_key(clip_frames, nearest_key))
			return nearest_key

	var requested_pose_tags := _pose_hint_tags_from_cast_entry(cast_entry)
	if not requested_pose_tags.is_empty():
		var tag_cache_key := "%s:%s:%s:%s:%s:tags:%s" % [dialogue_id, node_id, cast_id, current_clip, current_key, _string_array_key(requested_pose_tags)]
		if node_cache.has(tag_cache_key):
			return String(node_cache[tag_cache_key])
		var tagged_key := _best_pose_tag_frame_key(
			clip_frames,
			requested_pose_tags,
			current_key,
			current_state,
			"%s:%s:%s" % [dialogue_id, node_id, cast_id],
			_recent_motion_frame_keys(cycle_indices, cast_id, current_clip),
			_recent_motion_pose_signatures(cycle_indices, cast_id, current_clip)
		)
		if not tagged_key.is_empty():
			node_cache[tag_cache_key] = tagged_key
			_remember_recent_motion_frame(cycle_indices, cast_id, current_clip, _find_frame_by_key(clip_frames, tagged_key))
			return tagged_key

	var node_cache_key := "%s:%s:%s:%s" % [dialogue_id, node_id, cast_id, current_clip]
	if node_cache.has(node_cache_key):
		return String(node_cache[node_cache_key])

	var current_index := -1
	for index in range(clip_frames.size()):
		if String(clip_frames[index].get("key", "")) == current_key:
			current_index = index
			break

	var cycle_key := "%s:%s" % [cast_id, current_clip]
	var cycle_index := int(cycle_indices.get(cycle_key, -1))
	var base_index := maxi(current_index, cycle_index)
	var next_index := _next_distinct_motion_frame_index(
		clip_frames,
		base_index,
		current_key,
		current_state,
		_recent_motion_frame_keys(cycle_indices, cast_id, current_clip),
		_recent_motion_pose_signatures(cycle_indices, cast_id, current_clip),
		"%s:%s:%s:%s" % [dialogue_id, node_id, cast_id, current_clip]
	)
	cycle_indices[cycle_key] = next_index
	var next_key := String(clip_frames[next_index].get("key", "")).strip_edges()
	_remember_recent_motion_frame(cycle_indices, cast_id, current_clip, clip_frames[next_index])
	node_cache[node_cache_key] = next_key
	return next_key


static func _recent_motion_frame_cycle_key(cast_id: String, clip_id: String) -> String:
	return "%s:%s:recent_keys" % [cast_id.strip_edges(), clip_id.strip_edges()]


static func _recent_motion_pose_signature_cycle_key(cast_id: String, clip_id: String) -> String:
	return "%s:%s:recent_signatures" % [cast_id.strip_edges(), clip_id.strip_edges()]


static func _recent_motion_frame_keys(cycle_indices: Dictionary, cast_id: String, clip_id: String) -> Array[String]:
	var result: Array[String] = []
	var raw_recent: Variant = cycle_indices.get(_recent_motion_frame_cycle_key(cast_id, clip_id), [])
	if typeof(raw_recent) != TYPE_ARRAY:
		return result
	for raw_key in raw_recent as Array:
		var key := String(raw_key).strip_edges()
		if key.is_empty() or result.has(key):
			continue
		result.append(key)
	return result


static func _recent_motion_pose_signatures(cycle_indices: Dictionary, cast_id: String, clip_id: String) -> Array[String]:
	var result: Array[String] = []
	var raw_recent: Variant = cycle_indices.get(_recent_motion_pose_signature_cycle_key(cast_id, clip_id), [])
	if typeof(raw_recent) != TYPE_ARRAY:
		return result
	for raw_signature in raw_recent as Array:
		var signature := String(raw_signature).strip_edges()
		if signature.is_empty() or result.has(signature):
			continue
		result.append(signature)
	return result


static func _remember_recent_motion_frame(
	cycle_indices: Dictionary,
	cast_id: String,
	clip_id: String,
	frame: Dictionary,
	limit := 4
) -> void:
	var frame_key := String(frame.get("key", "")).strip_edges()
	_remember_recent_motion_frame_key(cycle_indices, cast_id, clip_id, frame_key, limit)
	var signature := _motion_pose_signature(frame)
	if signature.is_empty():
		return
	var next_recent: Array[String] = []
	next_recent.append(signature)
	for recent_signature in _recent_motion_pose_signatures(cycle_indices, cast_id, clip_id):
		if next_recent.size() >= limit:
			break
		if recent_signature == signature:
			continue
		next_recent.append(recent_signature)
	cycle_indices[_recent_motion_pose_signature_cycle_key(cast_id, clip_id)] = next_recent


static func _remember_recent_motion_frame_key(
	cycle_indices: Dictionary,
	cast_id: String,
	clip_id: String,
	frame_key: String,
	limit := 4
) -> void:
	var clean_key := frame_key.strip_edges()
	if clean_key.is_empty():
		return
	var next_recent: Array[String] = []
	next_recent.append(clean_key)
	for key in _recent_motion_frame_keys(cycle_indices, cast_id, clip_id):
		if next_recent.size() >= limit:
			break
		if key == clean_key:
			continue
		next_recent.append(key)
	cycle_indices[_recent_motion_frame_cycle_key(cast_id, clip_id)] = next_recent


static func _find_frame_by_key(frames: Array[Dictionary], frame_key: String) -> Dictionary:
	var clean_key := frame_key.strip_edges()
	if clean_key.is_empty():
		return {}
	for frame in frames:
		if String(frame.get("key", "")).strip_edges() == clean_key:
			return frame
	return {}


static func _next_distinct_motion_frame_index(
	frames: Array[Dictionary],
	base_index: int,
	current_key: String,
	current_state: Dictionary,
	recent_keys: Array[String],
	recent_signatures: Array[String],
	seed := ""
) -> int:
	if frames.is_empty():
		return -1
	var fallback_index := 0 if base_index < 0 else (base_index + 1) % frames.size()
	if frames.size() <= 1:
		return fallback_index

	var current_signature := _motion_pose_signature(current_state)
	var soft_fallback_index := fallback_index
	var best_natural_index := -1
	var best_natural_score := -1.0e20
	for offset in range(1, frames.size() + 1):
		var candidate_index := 0 if base_index < 0 and offset == 1 else (base_index + offset) % frames.size()
		var frame: Dictionary = frames[candidate_index]
		var frame_key := String(frame.get("key", "")).strip_edges()
		if frame_key.is_empty():
			continue
		var signature := _motion_pose_signature(frame)
		var matches_current := frame_key == current_key or (not signature.is_empty() and signature == current_signature)
		var matches_recent := recent_keys.has(frame_key) or (not signature.is_empty() and recent_signatures.has(signature))
		var natural_score := _natural_motion_frame_score(
			frame,
			current_state,
			frame_key,
			current_key,
			signature,
			current_signature,
			recent_keys,
			recent_signatures,
			seed,
			offset,
			frames.size()
		)
		if natural_score > best_natural_score and not matches_current:
			best_natural_score = natural_score
			best_natural_index = candidate_index
		if not matches_current and not matches_recent:
			if best_natural_score >= 0.45:
				return best_natural_index
		if not matches_current:
			soft_fallback_index = candidate_index
	return best_natural_index if best_natural_index >= 0 else soft_fallback_index


static func _natural_motion_frame_score(
	frame: Dictionary,
	current_state: Dictionary,
	frame_key: String,
	current_key: String,
	signature: String,
	current_signature: String,
	recent_keys: Array[String],
	recent_signatures: Array[String],
	seed: String,
	offset: int,
	frame_count: int
) -> float:
	var distance := get_motion_frame_parameter_distance(frame, current_state)
	var target_distance := 0.42
	var distance_score := 0.0
	if distance > 0.001:
		distance_score = clampf(1.0 - absf(distance - target_distance) / target_distance, 0.0, 1.0) * 2.0
		distance_score += clampf(distance, 0.0, 0.65) * 0.35
	if distance > 0.78:
		distance_score -= (distance - 0.78) * 1.6

	var sequence_score := 0.0
	if frame_count > 1:
		sequence_score = clampf(1.0 - float(maxi(offset - 1, 0)) / float(frame_count - 1), 0.0, 1.0) * 0.28

	var score := distance_score + sequence_score
	if frame_key == current_key:
		score -= 3.0
	elif not signature.is_empty() and signature == current_signature:
		score -= 1.5
	score -= _recent_pose_history_penalty(frame_key, recent_keys)
	if not signature.is_empty():
		score -= _recent_pose_history_penalty(signature, recent_signatures) * 0.9
	score += _stable_unit_score("%s:%s" % [seed, frame_key]) * 0.08
	return score


static func _find_motion_clip(rig: Dictionary, clip_id: String) -> Dictionary:
	var clean_clip_id := clip_id.strip_edges()
	for clip in get_motion_clips_from_rig(rig):
		if clean_clip_id.is_empty() or String(clip.get("id", "")).strip_edges() == clean_clip_id:
			return clip
	return {}


static func _normalize_motion_keyframes(value: Variant) -> Array[Dictionary]:
	var keyframes := _duplicate_dictionary_array(value)
	var normalized: Array[Dictionary] = []
	for keyframe in keyframes:
		var params := _dictionary_from_variant(keyframe.get("params", keyframe.get("values", {})))
		if params.is_empty():
			continue
		normalized.append({
			"time": maxf(float(keyframe.get("time", keyframe.get("t", 0.0))), 0.0),
			"easing": _normalize_motion_easing(keyframe.get("easing", keyframe.get("curve", keyframe.get("interpolation", "linear")))),
			"params": params,
		})
	normalized.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		return float(a.get("time", 0.0)) < float(b.get("time", 0.0))
	)
	return normalized


static func _normalize_motion_easing(value: Variant) -> String:
	var easing := String(value).strip_edges().to_lower().replace("-", "_").replace(" ", "_")
	if easing in ["linear", "smoothstep", "ease_in", "ease_out", "ease_in_out", "hold"]:
		return easing
	if easing == "easein":
		return "ease_in"
	if easing == "easeout":
		return "ease_out"
	if easing == "easeinout":
		return "ease_in_out"
	return "linear"


static func _normalize_hit_area_kind(value: Variant) -> String:
	var kind := String(value).strip_edges().to_lower().replace("-", "_").replace(" ", "_")
	if kind in ["head", "face", "body", "hand", "prop", "generic"]:
		return kind
	return "generic"


static func _normalize_hit_area_bounds(value: Variant) -> Dictionary:
	if typeof(value) != TYPE_DICTIONARY:
		return {}
	var source: Dictionary = value
	var width := float(source.get("width", source.get("w", 0.0)))
	var height := float(source.get("height", source.get("h", 0.0)))
	if width <= 0.0 or height <= 0.0:
		return {}
	return {
		"x": _round4(float(source.get("x", 0.0))),
		"y": _round4(float(source.get("y", 0.0))),
		"width": _round4(width),
		"height": _round4(height),
	}


static func _normalize_hit_area_points(value: Variant) -> Array[Dictionary]:
	var points: Array[Dictionary] = []
	if typeof(value) != TYPE_ARRAY:
		return points
	for raw_point in value as Array:
		var point := _normalize_hit_area_point(raw_point)
		if not point.is_empty():
			points.append(point)
	return points


static func _normalize_hit_area_point(value: Variant) -> Dictionary:
	if typeof(value) == TYPE_ARRAY:
		var values: Array = value
		if values.size() < 2:
			return {}
		return {
			"x": _round4(float(values[0])),
			"y": _round4(float(values[1])),
		}
	if typeof(value) == TYPE_DICTIONARY:
		var point: Dictionary = value
		return {
			"x": _round4(float(point.get("x", 0.0))),
			"y": _round4(float(point.get("y", 0.0))),
		}
	return {}


static func _normalize_parameter_binding_parts(value: Variant) -> Array[Dictionary]:
	var parts: Array[Dictionary] = []
	if typeof(value) != TYPE_ARRAY:
		return parts
	for raw_part in value as Array:
		if typeof(raw_part) != TYPE_DICTIONARY:
			continue
		var part: Dictionary = raw_part
		var part_id := String(part.get("part_id", part.get("partId", part.get("id", "")))).strip_edges()
		if part_id.is_empty():
			continue
		var label := String(part.get("label", part.get("name", part_id))).strip_edges()
		if label.is_empty():
			label = part_id
		parts.append({
			"part_id": part_id,
			"label": label,
			"channels": _normalize_string_array(part.get("channels", []), 16),
		})
	return parts


static func _normalize_string_array(value: Variant, limit := 64) -> Array[String]:
	var result: Array[String] = []
	if typeof(value) != TYPE_ARRAY:
		return result
	for raw_entry in value as Array:
		if result.size() >= limit:
			break
		var entry := String(raw_entry).strip_edges()
		if entry.is_empty() or result.has(entry):
			continue
		result.append(entry)
	return result


static func _append_unique_string(target: Array, value: Variant, limit := 64) -> void:
	if target.size() >= limit:
		return
	var entry := String(value).strip_edges()
	if entry.is_empty() or target.has(entry):
		return
	target.append(entry)


static func _number_dictionary_from_variant(value: Variant, min_value := -1000000.0, max_value := 1000000.0, limit := 128) -> Dictionary:
	var result := {}
	if typeof(value) != TYPE_DICTIONARY:
		return result
	var source: Dictionary = value
	for raw_key in source.keys():
		if result.size() >= limit:
			break
		var key := String(raw_key).strip_edges()
		if key.is_empty():
			continue
		var number_value := clampf(float(source[raw_key]), min_value, max_value)
		result[key] = snappedf(number_value, 0.001)
	return result


static func _pose_hint_tags_from_cast_entry(cast_entry: Dictionary) -> Array[String]:
	var tags: Array[String] = []
	for key in ["portrait_rig_pose_tag", "portraitRigPoseTag", "pose_tag", "poseTag", "portrait_rig_pose_tags", "portraitRigPoseTags", "pose_tags", "poseTags"]:
		_append_pose_hint_tags(tags, cast_entry.get(key, []))
	for key in ["portrait_rig_pose_hint", "portraitRigPoseHint", "pose_hint", "poseHint", "emotion", "mood", "tone", "expression"]:
		_append_pose_hint_tags(tags, cast_entry.get(key, ""))
	return _expand_pose_hint_tags(tags)


static func _append_pose_hint_tags(tags: Array[String], value: Variant) -> void:
	if typeof(value) == TYPE_ARRAY:
		for entry in value as Array:
			_append_pose_hint_tags(tags, entry)
		return
	if typeof(value) == TYPE_BOOL:
		return
	var text := String(value).strip_edges().to_lower()
	if text.is_empty():
		return
	text = text.replace(";", ",").replace("/", ",").replace("|", ",")
	for raw_chunk in text.split(",", false):
		for raw_tag in String(raw_chunk).split(" ", false):
			var tag := _normalize_pose_tag(raw_tag)
			if tag.is_empty() or tags.has(tag):
				continue
			tags.append(tag)


static func _normalize_pose_tag(value: Variant) -> String:
	var tag := String(value).strip_edges().to_lower().replace("-", "_")
	tag = tag.replace("기쁨", "happy")
	tag = tag.replace("행복", "happy")
	tag = tag.replace("웃음", "smile")
	tag = tag.replace("슬픔", "sad")
	tag = tag.replace("화남", "angry")
	tag = tag.replace("놀람", "surprised")
	tag = tag.replace("의문", "curious")
	tag = tag.replace("말하기", "talk")
	tag = tag.replace("대화", "talk")
	tag = tag.replace("깜빡", "blink")
	tag = tag.replace("감기", "blink")
	tag = tag.replace("진지", "serious")
	tag = tag.replace("걱정", "worried")
	tag = tag.replace("움직임", "motion")
	tag = tag.replace("음소", "phoneme")
	tag = tag.replace("입모양", "viseme")
	var clean := ""
	for index in range(tag.length()):
		var code := tag.unicode_at(index)
		if (code >= 97 and code <= 122) or (code >= 48 and code <= 57) or code == 95:
			clean += tag.substr(index, 1)
	return clean


static func _normalize_pose_tag_array(value: Variant, limit := 64) -> Array[String]:
	var result: Array[String] = []
	if typeof(value) != TYPE_ARRAY:
		return result
	for raw_entry in value as Array:
		if result.size() >= limit:
			break
		var tag := _normalize_pose_tag(raw_entry)
		if tag.is_empty() or result.has(tag):
			continue
		result.append(tag)
	return result


static func _pose_score_dictionary_from_variant(value: Variant, limit := 32) -> Dictionary:
	var result := {}
	if typeof(value) != TYPE_DICTIONARY:
		return result
	var source: Dictionary = value
	for raw_key in source.keys():
		if result.size() >= limit:
			break
		var key := _normalize_pose_tag(raw_key)
		if key.is_empty():
			continue
		var number_value := clampf(float(source[raw_key]), 0.0, 1.0)
		result[key] = snappedf(number_value, 0.001)
	return result


static func _expand_pose_hint_tags(tags: Array[String]) -> Array[String]:
	var expanded: Array[String] = []
	for tag in tags:
		if expanded.size() >= 32:
			return expanded
		if not expanded.has(tag):
			expanded.append(tag)
		var aliases := []
		match tag:
			"happy", "joy", "smile":
				aliases = ["happy", "smile", "laugh"]
			"laugh":
				aliases = ["laugh", "happy", "smile", "open_mouth"]
			"sad":
				aliases = ["sad", "worried", "serious"]
			"angry", "mad":
				aliases = ["serious", "worried", "look_down"]
			"surprise", "surprised", "shock":
				aliases = ["surprised", "open_mouth"]
			"question", "curious", "doubt":
				aliases = ["squint", "look_left", "look_right", "serious"]
			"talk", "speak":
				aliases = ["talk", "open_mouth"]
			"open_mouth":
				aliases = ["open_mouth", "talk", "surprised"]
			"closed_mouth":
				aliases = ["closed_mouth", "viseme_closed", "neutral"]
			"viseme", "phoneme":
				aliases = ["viseme", "phoneme", "talk"]
			"viseme_a":
				aliases = ["viseme_a", "viseme", "phoneme", "talk", "open_mouth"]
			"viseme_i":
				aliases = ["viseme_i", "viseme", "phoneme", "talk", "smile"]
			"viseme_o":
				aliases = ["viseme_o", "viseme", "phoneme", "talk", "open_mouth"]
			"viseme_u":
				aliases = ["viseme_u", "viseme", "phoneme", "talk"]
			"viseme_closed":
				aliases = ["viseme_closed", "closed_mouth", "viseme", "phoneme"]
			"blink":
				aliases = ["blink", "squint"]
			"squint":
				aliases = ["squint", "blink", "curious"]
			"serious":
				aliases = ["serious", "worried", "look_down"]
			"worried":
				aliases = ["worried", "serious", "sad"]
			"motion":
				aliases = ["motion", "look_left", "look_right", "tilt_left", "tilt_right"]
			"look_left":
				aliases = ["look_left", "motion"]
			"look_right":
				aliases = ["look_right", "motion"]
			"look_up":
				aliases = ["look_up", "motion", "surprised"]
			"look_down":
				aliases = ["look_down", "serious", "motion"]
			"tilt_left":
				aliases = ["tilt_left", "motion"]
			"tilt_right":
				aliases = ["tilt_right", "motion"]
			"neutral":
				aliases = ["neutral"]
		for alias in aliases:
			if expanded.size() >= 32:
				return expanded
			if not expanded.has(alias):
				expanded.append(alias)
	return expanded


static func _best_pose_tag_frame_key(
	frames: Array[Dictionary],
	requested_tags: Array[String],
	current_key: String,
	current_state: Dictionary,
	seed: String,
	recent_keys: Array[String] = [],
	recent_signatures: Array[String] = []
) -> String:
	if frames.is_empty() or requested_tags.is_empty():
		return ""
	var best_key := ""
	var best_score := -1.0e20
	var best_match_score := 0.0
	var best_alt_key := ""
	var best_alt_score := -1.0e20
	var best_alt_match_score := 0.0
	var current_values := _state_parameter_values(current_state)
	var current_signature := _motion_pose_signature(current_state)
	for frame in frames:
		var frame_key := String(frame.get("key", "")).strip_edges()
		if frame_key.is_empty():
			continue
		var signature := _motion_pose_signature(frame)
		var match_score := _pose_tag_match_score(frame, requested_tags)
		var score := match_score
		score += _parameter_difference_score(frame, current_values)
		if frame_key == current_key:
			score -= 2.75
		elif not signature.is_empty() and signature == current_signature:
			score -= 1.4
		score -= _recent_pose_history_penalty(frame_key, recent_keys)
		if not signature.is_empty():
			score -= _recent_pose_history_penalty(signature, recent_signatures) * 0.9
		score += _stable_unit_score("%s:%s" % [seed, frame_key]) * 0.12
		if score > best_score:
			best_score = score
			best_key = frame_key
			best_match_score = match_score
		if frame_key != current_key and score > best_alt_score:
			best_alt_score = score
			best_alt_key = frame_key
			best_alt_match_score = match_score
	if best_key == current_key and best_alt_match_score > 0.05:
		return best_alt_key
	return best_key if best_match_score > 0.05 else ""


static func _recent_pose_history_penalty(frame_key: String, recent_keys: Array[String]) -> float:
	var index := recent_keys.find(frame_key)
	if index < 0:
		return 0.0
	match index:
		0:
			return 1.15
		1:
			return 0.55
		2:
			return 0.28
		_:
			return 0.12


static func _pose_tag_match_score(frame: Dictionary, requested_tags: Array[String]) -> float:
	var frame_tags := _frame_pose_tags(frame)
	var pose_score := _frame_pose_score(frame)
	var score := 0.0
	for tag in requested_tags:
		if frame_tags.has(tag):
			score += 3.0
		score += float(pose_score.get(tag, 0.0)) * 2.0
	return score


static func _frame_pose_tags(frame: Dictionary) -> Array[String]:
	var tags := _normalize_pose_tag_array(_alias_value(frame, ["pose_tags", "poseTags"], []), 64)
	if not tags.is_empty():
		return tags
	var motion_frame := normalize_motion_frame(_motion_frame_variant_from_record(frame))
	return _normalize_pose_tag_array(motion_frame.get("pose_tags", []), 64)


static func _frame_pose_score(frame: Dictionary) -> Dictionary:
	var score := _pose_score_dictionary_from_variant(_alias_value(frame, ["pose_score", "poseScore"], {}), 32)
	if not score.is_empty():
		return score
	var motion_frame := normalize_motion_frame(_motion_frame_variant_from_record(frame))
	return _pose_score_dictionary_from_variant(motion_frame.get("pose_score", {}), 32)


static func _state_parameter_values(state: Dictionary) -> Dictionary:
	var values := _number_dictionary_from_variant(_alias_value(state, ["parameter_values", "parameterValues"], {}), -10000.0, 10000.0, 128)
	if not values.is_empty():
		return values
	var motion_frame := normalize_motion_frame(_motion_frame_variant_from_record(state))
	return _number_dictionary_from_variant(motion_frame.get("parameter_values", {}), -10000.0, 10000.0, 128)


static func _frame_parameter_values(frame: Dictionary) -> Dictionary:
	var values := _number_dictionary_from_variant(_alias_value(frame, ["parameter_values", "parameterValues"], {}), -10000.0, 10000.0, 128)
	if not values.is_empty():
		return values
	var motion_frame := normalize_motion_frame(_motion_frame_variant_from_record(frame))
	return _number_dictionary_from_variant(motion_frame.get("parameter_values", {}), -10000.0, 10000.0, 128)


static func _motion_pose_signature(state_or_frame: Dictionary) -> String:
	var expression_preset := normalize_expression_preset(_expression_preset_variant_from_record(state_or_frame))
	var expression_id := String(expression_preset.get("id", "")).strip_edges()
	if not expression_id.is_empty():
		return "preset:%s" % expression_id

	var values := _frame_parameter_values(state_or_frame)
	if not values.is_empty():
		var keys: Array[String] = []
		for raw_key in values.keys():
			var key := String(raw_key).strip_edges()
			if not key.is_empty():
				keys.append(key)
		keys.sort()
		var parts: Array[String] = []
		for key in keys.slice(0, 24):
			parts.append("%s=%s" % [key, str(snappedf(float(values[key]), 0.05))])
		if not parts.is_empty():
			return "params:%s" % "|".join(parts)

	var tags := _frame_pose_tags(state_or_frame)
	if not tags.is_empty():
		tags.sort()
		return "tags:%s" % "|".join(tags.slice(0, 24))
	return ""


static func _parameter_difference_score(frame: Dictionary, reference_values: Dictionary) -> float:
	if reference_values.is_empty():
		return 0.0
	return get_motion_frame_parameter_distance(frame, {"parameter_values": reference_values}) * 1.35


static func _parameter_distance_denominator(a: float, b: float) -> float:
	var max_abs := maxf(absf(a), absf(b))
	if max_abs <= 1.5:
		return 1.0
	if max_abs <= 10.0:
		return 10.0
	return 100.0


static func _string_array_key(values: Array[String]) -> String:
	var copy := values.duplicate()
	copy.sort()
	return "|".join(copy)


static func _stable_unit_score(value: String) -> float:
	var hash_value := 2166136261
	for index in range(value.length()):
		hash_value = int((hash_value ^ value.unicode_at(index)) * 16777619) & 0x7fffffff
	return float(hash_value % 1000) / 1000.0


static func _point_in_polygon(point: Vector2, polygon: PackedVector2Array) -> bool:
	if polygon.size() < 3:
		return false
	var inside := false
	var previous_index := polygon.size() - 1
	for index in range(polygon.size()):
		var current := polygon[index]
		var previous := polygon[previous_index]
		var crosses_y := (current.y > point.y) != (previous.y > point.y)
		if crosses_y:
			var denominator := previous.y - current.y
			if absf(denominator) > 0.00001:
				var intersect_x := ((previous.x - current.x) * (point.y - current.y) / denominator) + current.x
				if point.x < intersect_x:
					inside = not inside
		previous_index = index
	return inside


static func _rig_parameter_definitions(rig: Dictionary) -> Array[Dictionary]:
	var definitions := {
		"angleX": {"key": "angleX", "label": "Angle X", "min": -100.0, "max": 100.0, "default": 0.0},
		"angleY": {"key": "angleY", "label": "Angle Y", "min": -100.0, "max": 100.0, "default": 0.0},
		"angleZ": {"key": "angleZ", "label": "Angle Z", "min": -45.0, "max": 45.0, "default": 0.0},
		"eyeOpen": {"key": "eyeOpen", "label": "Eye Open", "min": 0.0, "max": 100.0, "default": 88.0},
		"mouthOpen": {"key": "mouthOpen", "label": "Mouth", "min": 0.0, "max": 100.0, "default": 8.0},
		"smile": {"key": "smile", "label": "Smile", "min": -100.0, "max": 100.0, "default": 0.0},
		"brow": {"key": "brow", "label": "Brow", "min": -100.0, "max": 100.0, "default": 0.0},
		"hairSway": {"key": "hairSway", "label": "Hair Sway", "min": -100.0, "max": 100.0, "default": 0.0},
		"breath": {"key": "breath", "label": "Breath", "min": 0.0, "max": 100.0, "default": 36.0},
	}
	var custom_parameters: Variant = rig.get("customParameters", rig.get("custom_parameters", []))
	if typeof(custom_parameters) == TYPE_ARRAY:
		for raw_parameter in custom_parameters as Array:
			if typeof(raw_parameter) != TYPE_DICTIONARY:
				continue
			var parameter: Dictionary = raw_parameter
			var key := String(parameter.get("key", parameter.get("id", parameter.get("label", "")))).strip_edges()
			if key.is_empty():
				continue
			var min_value := float(parameter.get("min", -100.0))
			var max_value := float(parameter.get("max", 100.0))
			if min_value > max_value:
				var swap := min_value
				min_value = max_value
				max_value = swap
			definitions[key] = {
				"key": key,
				"label": String(parameter.get("label", parameter.get("name", key))).strip_edges(),
				"min": min_value,
				"max": max_value,
				"default": clampf(float(parameter.get("default", parameter.get("value", 0.0))), min_value, max_value),
			}
	var result: Array[Dictionary] = []
	for raw_key in definitions.keys():
		result.append((definitions[raw_key] as Dictionary).duplicate(true))
	return result


static func _motion_keyframe_max_time(keyframes: Array[Dictionary]) -> float:
	var max_time := 0.0
	for keyframe in keyframes:
		max_time = maxf(max_time, float(keyframe.get("time", keyframe.get("t", 0.0))))
	return max_time


static func _sample_motion_keyframe_parameters(keyframes: Array[Dictionary], time: float) -> Dictionary:
	var normalized := _normalize_motion_keyframes(keyframes)
	if normalized.is_empty():
		return {}
	if normalized.size() == 1:
		return _dictionary_from_variant(normalized[0].get("params", {}))
	var first: Dictionary = normalized[0]
	var last: Dictionary = normalized[normalized.size() - 1]
	var sample_time := maxf(time, 0.0)
	if sample_time <= float(first.get("time", 0.0)):
		return _dictionary_from_variant(first.get("params", {}))
	if sample_time >= float(last.get("time", 0.0)):
		return _dictionary_from_variant(last.get("params", {}))
	for index in range(1, normalized.size()):
		var right: Dictionary = normalized[index]
		var left: Dictionary = normalized[index - 1]
		var right_time := float(right.get("time", 0.0))
		var left_time := float(left.get("time", 0.0))
		if sample_time > right_time:
			continue
		var ratio := _apply_motion_easing((sample_time - left_time) / maxf(right_time - left_time, 0.001), String(left.get("easing", "linear")))
		return _lerp_dictionaries(
			_dictionary_from_variant(left.get("params", {})),
			_dictionary_from_variant(right.get("params", {})),
			ratio
		)
	return _dictionary_from_variant(last.get("params", {}))


static func _rig_keyframe_payload(keyframe: Dictionary) -> Dictionary:
	var payload := _dictionary_from_variant(keyframe.get("transform", keyframe.get("params", keyframe.get("values", {}))))
	if payload.is_empty():
		for key in ["x", "y", "scaleX", "scaleY", "scale_x", "scale_y", "rotation", "opacity", "order", "value"]:
			if keyframe.has(key):
				payload[key] = keyframe[key]
	return payload


static func _lerp_dictionaries(left: Dictionary, right: Dictionary, ratio: float) -> Dictionary:
	var result := left.duplicate(true)
	var t := clampf(ratio, 0.0, 1.0)
	for raw_key in right.keys():
		var key := String(raw_key)
		if result.has(key):
			var left_value: Variant = result[key]
			var right_value: Variant = right[raw_key]
			if (typeof(left_value) == TYPE_INT or typeof(left_value) == TYPE_FLOAT) and (typeof(right_value) == TYPE_INT or typeof(right_value) == TYPE_FLOAT):
				result[key] = lerpf(float(left_value), float(right_value), t)
			else:
				result[key] = right_value
		else:
			result[key] = right[raw_key]
	return result


static func _round4(value: float) -> float:
	return snappedf(value, 0.0001)


static func _apply_motion_easing(ratio: float, easing: String) -> float:
	var t := clampf(ratio, 0.0, 1.0)
	match _normalize_motion_easing(easing):
		"hold":
			return 0.0
		"ease_in":
			return t * t
		"ease_out":
			return 1.0 - ((1.0 - t) * (1.0 - t))
		"ease_in_out":
			if t < 0.5:
				return 2.0 * t * t
			return 1.0 - pow(-2.0 * t + 2.0, 2.0) / 2.0
		"smoothstep":
			return t * t * (3.0 - 2.0 * t)
		_:
			return t


static func _sorted_motion_frames_for_clip(profile: Dictionary, clip_id: String) -> Array[Dictionary]:
	var frames := _filter_frames_by_clip(get_motion_frame_portraits(profile), clip_id)
	_sort_motion_frames(frames)
	return frames


static func _filter_frames_by_clip(frames: Array[Dictionary], clip_id: String) -> Array[Dictionary]:
	var clean_clip_id := clip_id.strip_edges()
	var filtered: Array[Dictionary] = []
	for frame in frames:
		if String(frame.get("clip_id", "")).strip_edges() == clean_clip_id:
			filtered.append(frame)
	return filtered


static func _preferred_adaptive_motion_clip_id(frames: Array[Dictionary]) -> String:
	if frames.is_empty():
		return ""
	var priorities := ["adaptive_pose", "dialogue_pose", "idle_loop", "idle", "breath", "talk_loop", "talk"]
	return _preferred_motion_frame_clip_id(frames, priorities, String(frames[0].get("clip_id", "")).strip_edges())


static func _preferred_motion_frame_clip_id(frames: Array[Dictionary], priorities: Array, fallback: String) -> String:
	for priority in priorities:
		for frame in frames:
			var clip_id := String(frame.get("clip_id", "")).strip_edges()
			if clip_id.is_empty():
				continue
			var label := String(frame.get("clip_label", clip_id)).strip_edges()
			var haystack := ("%s %s" % [clip_id, label]).to_lower()
			var normalized_priority := String(priority).strip_edges().to_lower()
			if normalized_priority.is_empty():
				continue
			if clip_id.to_lower() == normalized_priority or haystack.find(normalized_priority) >= 0:
				return clip_id
	return fallback.strip_edges()


static func _sort_motion_frames(frames: Array[Dictionary]) -> void:
	frames.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		var index_a := int(a.get("frame_index", 0))
		var index_b := int(b.get("frame_index", 0))
		if index_a != index_b:
			return index_a < index_b
		var time_a := float(a.get("time", 0.0))
		var time_b := float(b.get("time", 0.0))
		if not is_equal_approx(time_a, time_b):
			return time_a < time_b
		return String(a.get("key", "")) < String(b.get("key", ""))
	)


static func _nearest_frame_key(frames: Array[Dictionary], target_time: float) -> String:
	if frames.is_empty():
		return ""
	var best: Dictionary = frames[0]
	var best_distance := absf(float(best.get("time", 0.0)) - target_time)
	for index in range(1, frames.size()):
		var frame: Dictionary = frames[index]
		var distance := absf(float(frame.get("time", 0.0)) - target_time)
		if distance < best_distance:
			best = frame
			best_distance = distance
	return String(best.get("key", "")).strip_edges()


static func _motion_frame_duration(frames: Array[Dictionary]) -> float:
	var declared_duration := _motion_frame_declared_duration(frames)
	if declared_duration > 0.0:
		return declared_duration
	var duration := 0.0
	for frame in frames:
		duration = maxf(duration, float(frame.get("time", 0.0)))
	return duration


static func _motion_frame_declared_duration(frames: Array[Dictionary]) -> float:
	var duration := 0.0
	for frame in frames:
		duration = maxf(duration, float(frame.get("clip_duration", 0.0)))
		var nested_frame := normalize_motion_frame(_motion_frame_variant_from_record(frame))
		duration = maxf(duration, float(nested_frame.get("clip_duration", 0.0)))
	return duration


static func _optional_float(source: Dictionary, keys: Array, fallback: float) -> float:
	for raw_key in keys:
		var key := String(raw_key)
		if not source.has(key):
			continue
		var value: Variant = source[key]
		match typeof(value):
			TYPE_INT, TYPE_FLOAT:
				return float(value)
			TYPE_STRING:
				var text := String(value).strip_edges()
				if text.is_valid_float():
					return float(text)
	return fallback


static func _alias_value(source: Dictionary, keys: Array, fallback: Variant = null) -> Variant:
	for raw_key in keys:
		var key := String(raw_key)
		if source.has(key):
			return source[key]
	return fallback


static func _dictionary_from_variant(value: Variant) -> Dictionary:
	if typeof(value) == TYPE_DICTIONARY:
		return (value as Dictionary).duplicate(true)
	return {}


static func _rig_model_path_from_record(record: Dictionary) -> String:
	for key in ["portrait_rig_model", "portraitRigModel", "rig_model", "rigModel", "model_path", "modelPath"]:
		var value := String(record.get(key, "")).strip_edges()
		if not value.is_empty():
			return value
	return ""


static func _is_finite_number(value: float) -> bool:
	return value == value and absf(value) < 1.0e30


static func _duplicate_dictionary_array(value: Variant) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	if typeof(value) != TYPE_ARRAY:
		return result
	for raw_entry in value as Array:
		if typeof(raw_entry) == TYPE_DICTIONARY:
			result.append((raw_entry as Dictionary).duplicate(true))
	return result
