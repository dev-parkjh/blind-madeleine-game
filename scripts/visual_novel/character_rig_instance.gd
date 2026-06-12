class_name CharacterRigInstance
extends Node2D

const DEFAULT_CANVAS_SIZE := Vector2(1200.0, 1800.0)
const DEFAULT_STAGE_TRANSITION := 0.45

var rig: Dictionary = {}
var _part_nodes: Dictionary = {}
var _part_textures: Dictionary = {}
var _part_physics: Dictionary = {}
var _stage_rect := Rect2()
var _target_angle := 0.0
var _current_angle := 0.0
var _target_state := "default"
var _current_state := "default"
var _transition_duration := DEFAULT_STAGE_TRANSITION
var _transition_elapsed := 0.0
var _speaking := false
var _time := 0.0


func _process(delta: float) -> void:
	if rig.is_empty():
		return
	_time += delta
	_advance_transition(delta)
	_update_parts(delta)


func configure(next_rig: Dictionary) -> void:
	rig = next_rig.duplicate(true)
	_current_state = "default"
	_target_state = "default"
	_current_angle = 0.0
	_target_angle = 0.0
	_transition_elapsed = _transition_duration
	_clear_parts()
	_build_parts()
	_update_parts(0.0)


func set_stage_rect(rect: Rect2) -> void:
	_stage_rect = rect
	position = rect.position
	_update_parts(0.0)


func set_pose(angle: float, state_id: String, transition_duration := DEFAULT_STAGE_TRANSITION) -> void:
	_target_angle = clampf(angle, -45.0, 45.0)
	_target_state = state_id.strip_edges()
	if _target_state.is_empty():
		_target_state = "default"
	_transition_duration = maxf(transition_duration, 0.0)
	_transition_elapsed = 0.0
	if is_zero_approx(_transition_duration):
		_current_angle = _target_angle
		_current_state = _target_state
		_transition_elapsed = _transition_duration
	_update_parts(0.0)


func set_speaking(active: bool) -> void:
	_speaking = active


func has_rig() -> bool:
	return not rig.is_empty()


func _clear_parts() -> void:
	for node in _part_nodes.values():
		var canvas_item: CanvasItem = node
		if canvas_item != null:
			canvas_item.queue_free()
	_part_nodes.clear()
	_part_textures.clear()
	_part_physics.clear()


func _build_parts() -> void:
	var parts := _get_parts_sorted()
	for part in parts:
		var part_id := String(part.get("id", "")).strip_edges()
		if part_id.is_empty():
			continue
		var texture := _load_texture(String(part.get("path", "")).strip_edges())
		if texture == null:
			continue
		var node := _create_part_node(part, texture)
		if node == null:
			continue
		node.name = "RigPart_%s" % part_id
		add_child(node)
		_part_nodes[part_id] = node
		_part_textures[part_id] = texture
		_part_physics[part_id] = {
			"offset": Vector2.ZERO,
			"velocity": Vector2.ZERO,
		}


func _create_part_node(part: Dictionary, texture: Texture2D) -> CanvasItem:
	var mesh: Dictionary = part.get("mesh", {})
	var vertices := _parse_vector2_array(mesh.get("vertices", []))
	if vertices.size() >= 3:
		var polygon := Polygon2D.new()
		polygon.texture = texture
		var pivot := _parse_vector2(part.get("pivot", Vector2.ZERO), Vector2.ZERO)
		var local_vertices := PackedVector2Array()
		for vertex in vertices:
			local_vertices.append(vertex - pivot)
		polygon.polygon = local_vertices
		var uvs := _parse_vector2_array(mesh.get("uvs", []))
		if uvs.size() == vertices.size():
			polygon.uv = uvs
		return polygon

	var sprite := Sprite2D.new()
	sprite.texture = texture
	sprite.centered = false
	return sprite


func _get_parts_sorted() -> Array[Dictionary]:
	var parts: Array[Dictionary] = []
	for raw_part in rig.get("parts", []):
		if typeof(raw_part) == TYPE_DICTIONARY:
			parts.append(raw_part)
	parts.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		var z_a := int(a.get("z_index", 0))
		var z_b := int(b.get("z_index", 0))
		if z_a == z_b:
			return String(a.get("id", "")) < String(b.get("id", ""))
		return z_a < z_b
	)
	return parts


func _advance_transition(delta: float) -> void:
	if _transition_elapsed >= _transition_duration:
		_current_angle = _target_angle
		_current_state = _target_state
		return
	_transition_elapsed = minf(_transition_elapsed + delta, _transition_duration)
	var progress := 1.0 if is_zero_approx(_transition_duration) else _ease_out_sine(_transition_elapsed / _transition_duration)
	_current_angle = lerpf(_current_angle, _target_angle, progress)
	if progress >= 1.0:
		_current_state = _target_state


func _update_parts(delta: float) -> void:
	var canvas_size := _get_canvas_size()
	if _stage_rect.size.x <= 0.0 or _stage_rect.size.y <= 0.0:
		_stage_rect = Rect2(Vector2.ZERO, canvas_size)
	var fit_scale := minf(_stage_rect.size.x / canvas_size.x, _stage_rect.size.y / canvas_size.y)
	scale = Vector2.ONE * fit_scale
	var centered_offset := (_stage_rect.size - canvas_size * fit_scale) * 0.5 / maxf(fit_scale, 0.001)
	position = _stage_rect.position + centered_offset * fit_scale

	var parts := _get_parts_sorted()
	for part in parts:
		var part_id := String(part.get("id", "")).strip_edges()
		if part_id.is_empty() or not _part_nodes.has(part_id):
			continue
		var node: CanvasItem = _part_nodes[part_id]
		var transform := _resolve_part_transform(part)
		var physics_offset := _update_part_physics(part_id, part, delta)
		var position_value := Vector2(transform.get("position", Vector2.ZERO)) + physics_offset
		var pivot := _parse_vector2(part.get("pivot", Vector2.ZERO), Vector2.ZERO)
		node.position = position_value + pivot
		node.rotation_degrees = float(transform.get("rotation", 0.0))
		node.scale = Vector2(transform.get("scale", Vector2.ONE))
		node.modulate.a = clampf(float(transform.get("opacity", 1.0)) * _motion_opacity_for_part(part), 0.0, 1.0)
		if node is Sprite2D:
			(node as Sprite2D).offset = -pivot


func _resolve_part_transform(part: Dictionary) -> Dictionary:
	var base := _normalize_transform(part.get("base_transform", {}))
	var angle_transform := _sample_angle_transform(part, base)
	var state_transform := _state_override_transform(part)
	var motion_transform := _motion_transform(part)
	return _apply_motion_transform(_merge_keyed_transform(base, angle_transform, state_transform), motion_transform)


func _sample_angle_transform(part: Dictionary, base: Dictionary) -> Dictionary:
	var state_tracks := _track_dictionary(rig.get("angle_tracks", {}), _target_state)
	if state_tracks.is_empty() and _target_state != "default":
		state_tracks = _track_dictionary(rig.get("angle_tracks", {}), "default")
	var part_tracks := _track_dictionary(state_tracks, String(part.get("id", "")))
	if part_tracks.is_empty():
		return {}

	var keys: Array[float] = [0.0]
	for raw_key in part_tracks.keys():
		var key_text := String(raw_key)
		if key_text.is_valid_float():
			keys.append(float(key_text))
	keys.sort()
	var lower := keys[0]
	var upper := keys[keys.size() - 1]
	for key in keys:
		if key <= _current_angle:
			lower = key
		if key >= _current_angle:
			upper = key
			break
	var lower_transform := base if is_zero_approx(lower) else _normalize_transform(part_tracks.get(_angle_key_for(part_tracks, lower), {}))
	var upper_transform := base if is_zero_approx(upper) else _normalize_transform(part_tracks.get(_angle_key_for(part_tracks, upper), {}))
	if is_equal_approx(lower, upper):
		return lower_transform
	var t := inverse_lerp(lower, upper, _current_angle)
	return _interpolate_transform(lower_transform, upper_transform, t)


func _angle_key_for(track: Dictionary, angle_value: float) -> String:
	var candidates: Array[String] = [str(angle_value)]
	var rounded := roundf(angle_value)
	if is_equal_approx(angle_value, rounded):
		candidates.append(str(int(rounded)))
	for candidate in candidates:
		if track.has(candidate):
			return candidate
	return candidates[0]


func _state_override_transform(part: Dictionary) -> Dictionary:
	var states: Dictionary = rig.get("states", {})
	var state: Dictionary = states.get(_current_state, states.get("default", {}))
	var overrides: Dictionary = state.get("part_overrides", {})
	var part_id := String(part.get("id", ""))
	if overrides.has(part_id) and typeof(overrides[part_id]) == TYPE_DICTIONARY:
		return _normalize_transform(overrides[part_id])
	return {}


func _motion_transform(part: Dictionary) -> Dictionary:
	var tracks: Dictionary = rig.get("motion_tracks", {})
	var idle: Dictionary = tracks.get("idle", {})
	var mouth: Dictionary = tracks.get("mouth", {})
	var result := {}
	if bool(idle.get("enabled", true)):
		var amplitude := float(idle.get("amplitude", 4.0))
		var frequency := float(idle.get("frequency", 0.45))
		var phase := float(abs(String(part.get("id", "")).hash() % 997)) / 997.0
		result["position"] = Vector2(0.0, sin((_time + phase) * TAU * frequency) * amplitude)
	if _speaking and bool(mouth.get("enabled", true)):
		var role := String(part.get("role", ""))
		var open_id := String(mouth.get("open", "mouth_open"))
		var amplitude_mouth := float(mouth.get("amplitude", 1.0))
		if role == "mouth" or String(part.get("id", "")) == open_id:
			result["scale"] = Vector2(1.0, 1.0 + absf(sin(_time * TAU * 6.0)) * 0.12 * amplitude_mouth)
	return result


func _motion_opacity_for_part(part: Dictionary) -> float:
	var tracks: Dictionary = rig.get("motion_tracks", {})
	var part_id := String(part.get("id", "")).strip_edges()
	var role := String(part.get("role", "")).strip_edges().to_lower()
	var alpha := 1.0

	var blink: Dictionary = tracks.get("blink", {})
	if bool(blink.get("enabled", true)):
		var blink_active := _is_blink_active(blink)
		var closed_eye_id := String(blink.get("closed", "eye_closed")).strip_edges()
		var open_eye_id := String(blink.get("open", "eye_open")).strip_edges()
		if _part_matches(part_id, role, closed_eye_id, ["eye_closed", "blink", "blink_closed"]):
			alpha *= 1.0 if blink_active else 0.0
		elif _part_matches(part_id, role, open_eye_id, ["eye_open", "blink_open"]):
			alpha *= 0.0 if blink_active else 1.0

	var mouth: Dictionary = tracks.get("mouth", {})
	if bool(mouth.get("enabled", true)):
		var open_amount := absf(sin(_time * TAU * 6.0)) if _speaking else 0.0
		var closed_mouth_id := String(mouth.get("closed", "mouth_closed")).strip_edges()
		var open_mouth_id := String(mouth.get("open", "mouth_open")).strip_edges()
		if _part_matches(part_id, role, open_mouth_id, ["mouth_open"]):
			alpha *= open_amount
		elif _part_matches(part_id, role, closed_mouth_id, ["mouth_closed"]):
			alpha *= 1.0 - open_amount * 0.85

	return clampf(alpha, 0.0, 1.0)


func _is_blink_active(blink: Dictionary) -> bool:
	var interval := maxf(float(blink.get("interval", 4.0)), 0.1)
	var duration := clampf(float(blink.get("duration", 0.14)), 0.01, interval)
	var phase_offset := float(abs(String(rig.get("id", "")).hash() % 997)) / 997.0 * interval
	return fmod(_time + phase_offset, interval) < duration


func _part_matches(part_id: String, role: String, target_id: String, roles: Array) -> bool:
	if not target_id.is_empty() and part_id == target_id:
		return true
	return roles.has(role)


func _update_part_physics(part_id: String, part: Dictionary, delta: float) -> Vector2:
	var physics: Dictionary = part.get("physics", {})
	if not bool(physics.get("enabled", false)):
		return Vector2.ZERO
	var state: Dictionary = _part_physics.get(part_id, {"offset": Vector2.ZERO, "velocity": Vector2.ZERO})
	var offset := Vector2(state.get("offset", Vector2.ZERO))
	var velocity := Vector2(state.get("velocity", Vector2.ZERO))
	var mass := maxf(float(physics.get("mass", 1.0)), 0.001)
	var stiffness := float(physics.get("stiffness", 24.0))
	var damping := float(physics.get("damping", 8.0))
	var gravity := float(physics.get("gravity", 18.0))
	var weight := float(physics.get("weight", 1.0))
	var force := Vector2(0.0, gravity * weight) - offset * stiffness - velocity * damping
	velocity += force / mass * delta
	offset += velocity * delta
	state["offset"] = offset
	state["velocity"] = velocity
	_part_physics[part_id] = state
	return offset


func _normalize_transform(raw: Variant) -> Dictionary:
	var data: Dictionary = raw if typeof(raw) == TYPE_DICTIONARY else {}
	return {
		"position": _parse_vector2(data.get("position", Vector2.ZERO), Vector2.ZERO),
		"rotation": float(data.get("rotation", 0.0)),
		"scale": _parse_vector2(data.get("scale", Vector2.ONE), Vector2.ONE),
		"opacity": clampf(float(data.get("opacity", 1.0)), 0.0, 1.0),
	}


func _merge_keyed_transform(base: Dictionary, angle_transform: Dictionary, state_transform: Dictionary) -> Dictionary:
	var result := base.duplicate(true)
	for patch in [angle_transform, state_transform]:
		if typeof(patch) != TYPE_DICTIONARY:
			continue
		for key in patch.keys():
			if key == "position" or key == "scale":
				result[key] = Vector2(patch[key])
			elif key == "rotation" or key == "opacity":
				result[key] = float(patch[key])
			else:
				result[key] = patch[key]
	return result


func _apply_motion_transform(base: Dictionary, motion_transform: Dictionary) -> Dictionary:
	var result := base.duplicate(true)
	if typeof(motion_transform) != TYPE_DICTIONARY:
		return result
	for key in motion_transform.keys():
		if key == "position" and result.has("position"):
			result[key] = Vector2(result[key]) + Vector2(motion_transform[key])
		elif key == "scale" and result.has("scale"):
			var a := Vector2(result[key])
			var b := Vector2(motion_transform[key])
			result[key] = Vector2(a.x * b.x, a.y * b.y)
		elif key == "rotation" and result.has("rotation"):
			result[key] = float(result[key]) + float(motion_transform[key])
		else:
			result[key] = motion_transform[key]
	return result


func _interpolate_transform(a: Dictionary, b: Dictionary, t: float) -> Dictionary:
	var amount := clampf(t, 0.0, 1.0)
	return {
		"position": Vector2(a.get("position", Vector2.ZERO)).lerp(Vector2(b.get("position", Vector2.ZERO)), amount),
		"rotation": lerpf(float(a.get("rotation", 0.0)), float(b.get("rotation", 0.0)), amount),
		"scale": Vector2(a.get("scale", Vector2.ONE)).lerp(Vector2(b.get("scale", Vector2.ONE)), amount),
		"opacity": lerpf(float(a.get("opacity", 1.0)), float(b.get("opacity", 1.0)), amount),
	}


func _track_dictionary(source: Variant, key: String) -> Dictionary:
	if typeof(source) != TYPE_DICTIONARY:
		return {}
	var dictionary: Dictionary = source
	var value: Variant = dictionary.get(key, {})
	return value if typeof(value) == TYPE_DICTIONARY else {}


func _get_canvas_size() -> Vector2:
	var canvas: Dictionary = rig.get("canvas", {})
	var fallback := _parse_vector2(canvas.get("size", DEFAULT_CANVAS_SIZE), DEFAULT_CANVAS_SIZE)
	return Vector2(
		maxf(float(canvas.get("width", fallback.x)), 1.0),
		maxf(float(canvas.get("height", fallback.y)), 1.0)
	)


func _load_texture(path: String) -> Texture2D:
	if path.is_empty() or not ResourceLoader.exists(path):
		return null
	var resource := load(path)
	return resource as Texture2D


func _parse_vector2(raw: Variant, fallback: Vector2) -> Vector2:
	match typeof(raw):
		TYPE_VECTOR2:
			return raw
		TYPE_ARRAY:
			var values: Array = raw
			if values.size() >= 2:
				return Vector2(float(values[0]), float(values[1]))
		TYPE_DICTIONARY:
			var data: Dictionary = raw
			return Vector2(float(data.get("x", data.get(0, fallback.x))), float(data.get("y", data.get(1, fallback.y))))
	return fallback


func _parse_vector2_array(raw: Variant) -> PackedVector2Array:
	var result := PackedVector2Array()
	if typeof(raw) != TYPE_ARRAY:
		return result
	for entry in raw:
		result.append(_parse_vector2(entry, Vector2.ZERO))
	return result


func _ease_out_sine(value: float) -> float:
	return sin(clampf(value, 0.0, 1.0) * PI * 0.5)
