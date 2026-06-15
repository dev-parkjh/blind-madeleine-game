class_name PortraitLayout
extends RefCounted

const FACE_ANCHOR := Vector2(0.5, 0.34)
const ZOOM_OUT_BODY_ANCHOR := Vector2(0.5, 0.3709)
const ZOOM_OUT_BODY_BLEND_START := 300.0
const ZOOM_OUT_BODY_BLEND_END := 250.0
const ZOOM_DEFAULT := 300
const ZOOM_MIN := 100
const ZOOM_MAX := 500
const ZOOM_STEP := 50
const FIT_PADDING := 0.92
const REFERENCE_VIEWPORT_SIZE := Vector2i(1920, 1080)
const STAGE_BOTTOM_SEPARATOR := 18.0
const DIALOGUE_PANEL_HEIGHT := DialoguePanelLayout.BASE_MIN_HEIGHT

const POSITION_PRESETS := {
	"far_left": Vector2(-0.36, 0.0),
	"left": Vector2(-0.22, 0.0),
	"center": Vector2.ZERO,
	"right": Vector2(0.22, 0.0),
	"far_right": Vector2(0.36, 0.0),
}
const POSITION_STACK_SPREAD_STEP := 0.16
const POSITION_STACK_MIN_X := -0.42
const POSITION_STACK_MAX_X := 0.42


static func reference_stage_viewport_size() -> Vector2:
	return Vector2(
		float(REFERENCE_VIEWPORT_SIZE.x),
		float(REFERENCE_VIEWPORT_SIZE.y) - DIALOGUE_PANEL_HEIGHT - STAGE_BOTTOM_SEPARATOR
	)


static func snap_zoom_percent(percent: int) -> int:
	var clamped := clampi(percent, ZOOM_MIN, ZOOM_MAX)
	return int(round(float(clamped) / float(ZOOM_STEP)) * ZOOM_STEP)


static func normalize_position(position: String) -> String:
	var key := position.strip_edges().to_lower()
	if key in ["far_left", "left", "center", "right", "far_right", "custom", "same"]:
		return key
	if key in ["inherit", "previous"]:
		return "same"
	return "center"


static func parse_offset(raw: Variant) -> Vector2:
	var point := Vector2.ZERO
	var has_point := false

	match typeof(raw):
		TYPE_ARRAY:
			var values: Array = raw
			if values.size() >= 2:
				point = Vector2(float(values[0]), float(values[1]))
				has_point = true
		TYPE_DICTIONARY:
			var data: Dictionary = raw
			point = Vector2(float(data.get("x", data.get(0, 0.0))), float(data.get("y", data.get(1, 0.0))))
			has_point = true

	if not has_point:
		return Vector2.ZERO

	return Vector2(_round4(point.x), _round4(point.y))


static func get_layout_offset(position: String, raw_offset: Variant) -> Vector2:
	var key := normalize_position(position)
	if key == "custom":
		return parse_offset(raw_offset)
	if key == "same":
		return POSITION_PRESETS.get("center", Vector2.ZERO)
	return POSITION_PRESETS.get(key, Vector2.ZERO)


static func apply_position_stack_spread(base_offset: Vector2, stack_index: int, stack_count: int) -> Vector2:
	if stack_count <= 1:
		return Vector2(_round4(base_offset.x), _round4(base_offset.y))

	var safe_count := maxi(stack_count, 1)
	var safe_index := clampi(stack_index, 0, safe_count - 1)
	var spread := float(safe_index) - (float(safe_count) - 1.0) * 0.5
	return Vector2(
		_round4(clampf(
			base_offset.x + spread * POSITION_STACK_SPREAD_STEP,
			POSITION_STACK_MIN_X,
			POSITION_STACK_MAX_X
		)),
		_round4(base_offset.y)
	)


static func resolve_portrait_entry(speaker_profile: Dictionary, portrait_key: String) -> Dictionary:
	if portrait_key.is_empty() or speaker_profile.is_empty():
		return {}

	var portraits: Dictionary = speaker_profile.get("portraits", {})
	if not portraits.has(portrait_key):
		var generated_entry := resolve_motion_frame_set_portrait_entry(speaker_profile, portrait_key)
		if not generated_entry.is_empty():
			return generated_entry
		return resolve_live2d_metadata_portrait_entry(speaker_profile, portrait_key)

	var entry: Variant = portraits[portrait_key]
	if typeof(entry) == TYPE_STRING:
		var resolved := {
			"path": String(entry),
			"center": Vector2(0.5, 0.5),
		}
		return merge_live2d_metadata_into_portrait_entry(speaker_profile, portrait_key, resolved, false)

	if typeof(entry) != TYPE_DICTIONARY:
		return {}

	var portrait_data: Dictionary = entry
	var path := String(portrait_data.get("path", portrait_data.get("image_path", portrait_data.get("imagePath", "")))).strip_edges()
	if path.is_empty():
		var generated_entry := resolve_motion_frame_set_portrait_entry(speaker_profile, portrait_key)
		if not generated_entry.is_empty():
			return generated_entry
		return resolve_live2d_metadata_portrait_entry(speaker_profile, portrait_key)

	var resolved := {
		"path": path,
		"center": parse_face_center(portrait_data.get("center", null)),
	}
	var live2d_model := String(portrait_data.get("live2d_model", portrait_data.get("live2dModel", portrait_data.get("model_path", portrait_data.get("modelPath", ""))))).strip_edges()
	if not live2d_model.is_empty():
		resolved["live2d_model"] = live2d_model
	var motion_frame: Variant = read_live2d_motion_frame_alias(portrait_data)
	if typeof(motion_frame) == TYPE_DICTIONARY and not (motion_frame as Dictionary).is_empty():
		resolved["live2d_motion_frame"] = normalize_live2d_motion_frame_alias(motion_frame)
	var expression_preset: Variant = read_live2d_expression_preset_alias(portrait_data)
	if typeof(expression_preset) == TYPE_DICTIONARY and not (expression_preset as Dictionary).is_empty():
		resolved["live2d_expression_preset"] = (expression_preset as Dictionary).duplicate(true)
	return merge_live2d_metadata_into_portrait_entry(speaker_profile, portrait_key, resolved, portrait_data.has("center"))


static func merge_live2d_metadata_into_portrait_entry(
	speaker_profile: Dictionary,
	portrait_key: String,
	resolved: Dictionary,
	has_explicit_center: bool
) -> Dictionary:
	var metadata_entry := resolve_motion_frame_set_portrait_entry(speaker_profile, portrait_key)
	if metadata_entry.is_empty():
		metadata_entry = resolve_live2d_metadata_portrait_entry(speaker_profile, portrait_key)
	if metadata_entry.is_empty():
		return resolved
	var path := String(resolved.get("path", "")).strip_edges()
	var metadata_path := String(metadata_entry.get("path", "")).strip_edges()
	if path.is_empty() or metadata_path.is_empty() or path != metadata_path:
		return resolved
	var next := resolved.duplicate(true)
	if not has_explicit_center and metadata_entry.has("center"):
		next["center"] = metadata_entry.get("center", Vector2(0.5, 0.5))
	if not next.has("live2d_model") and metadata_entry.has("live2d_model"):
		next["live2d_model"] = String(metadata_entry.get("live2d_model", "")).strip_edges()
	if not next.has("live2d_motion_frame") and metadata_entry.has("live2d_motion_frame"):
		var motion_frame: Variant = metadata_entry.get("live2d_motion_frame", {})
		if typeof(motion_frame) == TYPE_DICTIONARY and not (motion_frame as Dictionary).is_empty():
			next["live2d_motion_frame"] = normalize_live2d_motion_frame_alias(motion_frame)
	if not next.has("live2d_expression_preset") and metadata_entry.has("live2d_expression_preset"):
		var expression_preset: Variant = metadata_entry.get("live2d_expression_preset", {})
		if typeof(expression_preset) == TYPE_DICTIONARY and not (expression_preset as Dictionary).is_empty():
			next["live2d_expression_preset"] = (expression_preset as Dictionary).duplicate(true)
	return next


static func resolve_live2d_metadata_portrait_entry(speaker_profile: Dictionary, portrait_key: String) -> Dictionary:
	var key := portrait_key.strip_edges()
	if key.is_empty() or speaker_profile.is_empty():
		return {}
	var live2d_metadata := live2d_metadata_from_profile(speaker_profile)
	if live2d_metadata.is_empty():
		return {}
	var portraits: Variant = live2d_metadata.get("portraits", {})
	if typeof(portraits) != TYPE_DICTIONARY or not (portraits as Dictionary).has(key):
		return {}
	var raw_entry: Variant = (portraits as Dictionary)[key]
	if typeof(raw_entry) != TYPE_DICTIONARY:
		return {}
	var entry: Dictionary = raw_entry
	var path := String(entry.get("image_path", entry.get("imagePath", entry.get("path", "")))).strip_edges()
	if path.is_empty():
		return {}
	var resolved := {
		"path": path,
		"center": parse_face_center(entry.get("center", null)),
	}
	var live2d_model := String(entry.get("model_path", entry.get("modelPath", entry.get("live2d_model", entry.get("live2dModel", ""))))).strip_edges()
	if not live2d_model.is_empty():
		resolved["live2d_model"] = live2d_model
	var motion_frame: Variant = read_live2d_motion_frame_alias(entry)
	if typeof(motion_frame) == TYPE_DICTIONARY and not (motion_frame as Dictionary).is_empty():
		resolved["live2d_motion_frame"] = normalize_live2d_motion_frame_alias(motion_frame)
	var expression_preset: Variant = read_live2d_expression_preset_alias(entry)
	if typeof(expression_preset) == TYPE_DICTIONARY and not (expression_preset as Dictionary).is_empty():
		resolved["live2d_expression_preset"] = (expression_preset as Dictionary).duplicate(true)
	return resolved


static func read_live2d_motion_frame_alias(data: Dictionary) -> Variant:
	if data.has("live2d_motion_frame"):
		return data["live2d_motion_frame"]
	if data.has("live2dMotionFrame"):
		return data["live2dMotionFrame"]
	if data.has("motion_frame"):
		return data["motion_frame"]
	if data.has("motionFrame"):
		return data["motionFrame"]
	return {}


static func read_live2d_expression_preset_alias(data: Dictionary) -> Variant:
	if data.has("live2d_expression_preset"):
		return data["live2d_expression_preset"]
	if data.has("live2dExpressionPreset"):
		return data["live2dExpressionPreset"]
	if data.has("expression_preset"):
		return data["expression_preset"]
	if data.has("expressionPreset"):
		return data["expressionPreset"]
	return {}


static func normalize_live2d_motion_frame_alias(raw_frame: Variant) -> Dictionary:
	if typeof(raw_frame) != TYPE_DICTIONARY:
		return {}
	var frame: Dictionary = raw_frame
	var result := frame.duplicate(true)
	var clip_id := String(frame.get("clip_id", frame.get("clipId", ""))).strip_edges()
	if not clip_id.is_empty():
		result["clip_id"] = clip_id
	var clip_label := String(frame.get("clip_label", frame.get("clipLabel", frame.get("label", "")))).strip_edges()
	if not clip_label.is_empty():
		result["clip_label"] = clip_label
	if frame.has("frame_index") or frame.has("frameIndex"):
		result["frame_index"] = maxi(int(frame.get("frame_index", frame.get("frameIndex", 0))), 0)
	if frame.has("frame_count") or frame.has("frameCount"):
		result["frame_count"] = maxi(int(frame.get("frame_count", frame.get("frameCount", 0))), 0)
	if frame.has("clip_duration") or frame.has("clipDuration") or frame.has("duration"):
		result["clip_duration"] = maxf(float(frame.get("clip_duration", frame.get("clipDuration", frame.get("duration", 0.0)))), 0.0)
	if frame.has("physics_sampled") or frame.has("physicsSampled"):
		result["physics_sampled"] = bool(frame.get("physics_sampled", frame.get("physicsSampled", false)))
	var pose_tags: Variant = frame.get("pose_tags", frame.get("poseTags", null))
	if typeof(pose_tags) == TYPE_ARRAY:
		result["pose_tags"] = (pose_tags as Array).duplicate(true)
	var pose_score: Variant = frame.get("pose_score", frame.get("poseScore", null))
	if typeof(pose_score) == TYPE_DICTIONARY:
		result["pose_score"] = (pose_score as Dictionary).duplicate(true)
	var parameter_values: Variant = frame.get("parameter_values", frame.get("parameterValues", null))
	if typeof(parameter_values) == TYPE_DICTIONARY:
		result["parameter_values"] = (parameter_values as Dictionary).duplicate(true)
	return result


static func resolve_motion_frame_set_portrait_entry(speaker_profile: Dictionary, portrait_key: String) -> Dictionary:
	var key := portrait_key.strip_edges()
	if key.is_empty() or speaker_profile.is_empty():
		return {}
	var live2d_metadata := live2d_metadata_from_profile(speaker_profile)
	if live2d_metadata.is_empty():
		return {}
	var frame_sets := read_live2d_motion_frame_sets_alias(live2d_metadata)
	if frame_sets.is_empty():
		return {}
	for raw_set in frame_sets:
		if typeof(raw_set) != TYPE_DICTIONARY:
			continue
		var frame_set: Dictionary = raw_set
		var states: Variant = frame_set.get("states", [])
		if typeof(states) != TYPE_ARRAY:
			continue
		for raw_state in states as Array:
			if typeof(raw_state) != TYPE_DICTIONARY:
				continue
			var state: Dictionary = raw_state
			var state_key := String(state.get("state", state.get("key", ""))).strip_edges()
			if state_key != key:
				continue
			var path := String(state.get("image_path", state.get("imagePath", state.get("path", "")))).strip_edges()
			if path.is_empty():
				continue
			var resolved := {
				"path": path,
				"center": parse_face_center(state.get("center", null)),
			}
			var live2d_model := String(state.get("model_path", state.get("modelPath", state.get("live2d_model", state.get("live2dModel", ""))))).strip_edges()
			if not live2d_model.is_empty():
				resolved["live2d_model"] = live2d_model
			var motion_frame: Variant = read_live2d_motion_frame_alias(state)
			if typeof(motion_frame) == TYPE_DICTIONARY and not (motion_frame as Dictionary).is_empty():
				resolved["live2d_motion_frame"] = normalize_live2d_motion_frame_alias(motion_frame)
			else:
				var fallback_motion_frame := {
					"clip_id": String(frame_set.get("clip_id", frame_set.get("clipId", ""))).strip_edges(),
					"clip_label": String(frame_set.get("clip_label", frame_set.get("clipLabel", frame_set.get("label", frame_set.get("clip_id", frame_set.get("clipId", "")))))).strip_edges(),
					"time": maxf(float(state.get("time", 0.0)), 0.0),
					"frame_index": maxi(int(state.get("frame_index", state.get("frameIndex", 0))), 0),
					"frame_count": maxi(int(frame_set.get("frame_count", frame_set.get("frameCount", frame_set.get("expected_frame_count", 0)))), 0),
					"clip_duration": maxf(float(frame_set.get("clip_duration", frame_set.get("clipDuration", frame_set.get("duration", 0.0)))), 0.0),
					"physics_sampled": bool(frame_set.get("physics_sampled", frame_set.get("physicsSampled", false))),
				}
				var pose_tags: Variant = state.get("pose_tags", state.get("poseTags", []))
				if typeof(pose_tags) == TYPE_ARRAY:
					fallback_motion_frame["pose_tags"] = (pose_tags as Array).duplicate(true)
				var pose_score: Variant = state.get("pose_score", state.get("poseScore", {}))
				if typeof(pose_score) == TYPE_DICTIONARY:
					fallback_motion_frame["pose_score"] = (pose_score as Dictionary).duplicate(true)
				var parameter_values: Variant = state.get("parameter_values", state.get("parameterValues", {}))
				if typeof(parameter_values) == TYPE_DICTIONARY:
					fallback_motion_frame["parameter_values"] = (parameter_values as Dictionary).duplicate(true)
				resolved["live2d_motion_frame"] = fallback_motion_frame
			var expression_preset: Variant = read_live2d_expression_preset_alias(state)
			if typeof(expression_preset) != TYPE_DICTIONARY or (expression_preset as Dictionary).is_empty():
				var metadata_entry := resolve_live2d_metadata_portrait_entry(speaker_profile, key)
				expression_preset = read_live2d_expression_preset_alias(metadata_entry)
			if typeof(expression_preset) == TYPE_DICTIONARY and not (expression_preset as Dictionary).is_empty():
				resolved["live2d_expression_preset"] = (expression_preset as Dictionary).duplicate(true)
			return resolved
	return {}


static func read_live2d_motion_frame_sets_alias(live2d_metadata: Dictionary) -> Array:
	var result := []
	for key in ["motion_frame_sets", "motionFrameSets"]:
		var source: Variant = live2d_metadata.get(key, [])
		if typeof(source) != TYPE_ARRAY:
			continue
		for raw_set in source as Array:
			if typeof(raw_set) == TYPE_DICTIONARY:
				result.append(raw_set)
	return result


static func live2d_metadata_from_profile(speaker_profile: Dictionary) -> Dictionary:
	var metadata: Variant = speaker_profile.get("metadata", {})
	if typeof(metadata) != TYPE_DICTIONARY:
		return {}
	var source: Variant = (metadata as Dictionary).get("live2d_web_model", (metadata as Dictionary).get("live2dWebModel", {}))
	return (source as Dictionary) if typeof(source) == TYPE_DICTIONARY else {}


static func parse_face_center(raw: Variant) -> Vector2:
	match typeof(raw):
		TYPE_VECTOR2:
			var point_v2: Vector2 = raw
			return Vector2(clampf(point_v2.x, 0.0, 1.0), clampf(point_v2.y, 0.0, 1.0))
		TYPE_VECTOR2I:
			var point_v2i: Vector2i = raw
			return Vector2(clampf(float(point_v2i.x), 0.0, 1.0), clampf(float(point_v2i.y), 0.0, 1.0))
		TYPE_ARRAY:
			var values: Array = raw
			if values.size() >= 2:
				return Vector2(clampf(float(values[0]), 0.0, 1.0), clampf(float(values[1]), 0.0, 1.0))
		TYPE_DICTIONARY:
			var data: Dictionary = raw
			return Vector2(
				clampf(float(data.get("x", data.get(0, 0.5))), 0.0, 1.0),
				clampf(float(data.get("y", data.get(1, 0.5))), 0.0, 1.0)
			)
	return Vector2(0.5, 0.5)


static func compute_display_rect(
	viewport_size: Vector2,
	texture_size: Vector2,
	face_center: Vector2,
	zoom_percent: int,
	layout_offset: Vector2,
	horizontal_safe_area := Rect2()
) -> Rect2:
	return compute_display_rect_with_zoom(
		viewport_size,
		texture_size,
		face_center,
		float(zoom_percent),
		layout_offset,
		horizontal_safe_area
	)


static func compute_display_rect_with_zoom(
	viewport_size: Vector2,
	texture_size: Vector2,
	face_center: Vector2,
	zoom_percent: float,
	layout_offset: Vector2,
	horizontal_safe_area := Rect2()
) -> Rect2:
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		return Rect2()
	if texture_size.x <= 0.0 or texture_size.y <= 0.0:
		return Rect2()

	var base_scale := minf(
		(viewport_size.x * FIT_PADDING) / texture_size.x,
		(viewport_size.y * FIT_PADDING) / texture_size.y
	)
	var scale := base_scale * (zoom_percent / 100.0)
	var image_size := texture_size * scale
	var anchor_pos := compute_zoom_anchor_position(
		viewport_size,
		layout_offset,
		zoom_percent,
		horizontal_safe_area
	)
	var image_pos := Vector2(
		anchor_pos.x - face_center.x * image_size.x,
		anchor_pos.y - face_center.y * image_size.y
	)
	return Rect2(image_pos, image_size)


static func compute_face_position(
	viewport_size: Vector2,
	layout_offset: Vector2,
	horizontal_safe_area := Rect2()
) -> Vector2:
	return _compute_anchor_position(viewport_size, layout_offset, FACE_ANCHOR, horizontal_safe_area)


static func compute_body_position(
	viewport_size: Vector2,
	layout_offset: Vector2,
	horizontal_safe_area := Rect2()
) -> Vector2:
	return _compute_anchor_position(viewport_size, layout_offset, ZOOM_OUT_BODY_ANCHOR, horizontal_safe_area)


static func compute_zoom_anchor_position(
	viewport_size: Vector2,
	layout_offset: Vector2,
	zoom_percent: float,
	horizontal_safe_area := Rect2()
) -> Vector2:
	var face_pos := compute_face_position(viewport_size, layout_offset, horizontal_safe_area)
	var blend := _zoom_out_body_blend(zoom_percent)
	if blend <= 0.0:
		return face_pos
	return face_pos.lerp(compute_body_position(viewport_size, layout_offset, horizontal_safe_area), blend)


static func _compute_anchor_position(
	viewport_size: Vector2,
	layout_offset: Vector2,
	anchor: Vector2,
	horizontal_safe_area := Rect2()
) -> Vector2:
	var safe_left := 0.0
	var safe_width := viewport_size.x
	if horizontal_safe_area.size.x > 0.0:
		safe_left = clampf(horizontal_safe_area.position.x, 0.0, viewport_size.x)
		var safe_right := clampf(
			horizontal_safe_area.position.x + horizontal_safe_area.size.x,
			safe_left,
			viewport_size.x
		)
		safe_width = safe_right - safe_left

	var anchor_pos := Vector2(
		safe_left + safe_width * anchor.x,
		viewport_size.y * anchor.y
	)
	return anchor_pos + Vector2(
		layout_offset.x * safe_width,
		layout_offset.y * viewport_size.y
	)


static func _zoom_out_body_blend(zoom_percent: float) -> float:
	var span := maxf(ZOOM_OUT_BODY_BLEND_START - ZOOM_OUT_BODY_BLEND_END, 0.001)
	return clampf((ZOOM_OUT_BODY_BLEND_START - zoom_percent) / span, 0.0, 1.0)


static func parse_spectrum_offset(raw: Variant) -> Vector2:
	match typeof(raw):
		TYPE_ARRAY:
			var values: Array = raw
			if values.size() >= 2:
				return Vector2(_round4(float(values[0])), _round4(float(values[1])))
		TYPE_DICTIONARY:
			var data: Dictionary = raw
			return Vector2(
				_round4(float(data.get("x", data.get(0, 0.0)))),
				_round4(float(data.get("y", data.get(1, 0.0))))
			)
	return Vector2.ZERO


static func compute_spectrum_position(
	viewport_size: Vector2,
	layout_offset: Vector2,
	spectrum_offset: Vector2,
	horizontal_safe_area := Rect2(),
	offset_scale: float = 1.0,
	zoom_percent: float = ZOOM_DEFAULT
) -> Vector2:
	var anchor_pos := compute_zoom_anchor_position(
		viewport_size,
		layout_offset,
		zoom_percent,
		horizontal_safe_area
	)
	if spectrum_offset == Vector2.ZERO:
		return anchor_pos

	var safe_width := viewport_size.x
	if horizontal_safe_area.size.x > 0.0:
		var safe_left := clampf(horizontal_safe_area.position.x, 0.0, viewport_size.x)
		var safe_right := clampf(
			horizontal_safe_area.position.x + horizontal_safe_area.size.x,
			safe_left,
			viewport_size.x
		)
		safe_width = safe_right - safe_left

	var scale := maxf(offset_scale, 0.0)
	return anchor_pos + Vector2(
		spectrum_offset.x * safe_width * scale,
		spectrum_offset.y * viewport_size.y * scale
	)


static func _round4(value: float) -> float:
	return roundf(value * 10000.0) / 10000.0
