class_name PortraitRigRenderer
extends TextureRect

const WebRigRuntime = preload("res://scripts/visual_novel/web_rig_runtime.gd")

var _rig: Dictionary = {}
var _base_parameters: Dictionary = {}
var _motion: Dictionary = {}
var _texture_cache: Dictionary = {}
var _active := false


func has_portrait_rig() -> bool:
	return _active and not _rig.is_empty()


func clear_portrait_rig() -> void:
	_rig = {}
	_base_parameters = {}
	_motion = {}
	_active = false
	set_process(false)
	queue_redraw()


func set_portrait_rig(
	rig_document: Dictionary,
	parameters: Dictionary = {},
	motion: Dictionary = {}
) -> void:
	_rig = rig_document.duplicate(true)
	_base_parameters = WebRigRuntime.merge_rig_parameters(
		WebRigRuntime.get_default_rig_parameters(_rig),
		parameters
	)
	_motion = motion.duplicate(true)
	_active = not _rig.is_empty()
	if _active:
		texture = null
	set_process(_active and _should_process_rig())
	queue_redraw()


func _process(delta: float) -> void:
	if not _active:
		return
	if not _motion.is_empty():
		var duration := maxf(float(_motion.get("duration", 0.0)), 0.001)
		var speed := clampf(float(_motion.get("speed", 1.0)), 0.1, 4.0)
		var elapsed := fmod(float(_motion.get("elapsed", 0.0)) + delta * speed, duration)
		if elapsed < 0.0:
			elapsed += duration
		_motion["elapsed"] = elapsed
	queue_redraw()


func _draw() -> void:
	if not _active:
		return
	var canvas_size := WebRigRuntime.get_rig_canvas_size(_rig)
	if canvas_size.x <= 0.0 or canvas_size.y <= 0.0 or size.x <= 0.0 or size.y <= 0.0:
		return
	var canvas_scale := Vector2(size.x / canvas_size.x, size.y / canvas_size.y)
	var parameters := _current_parameters()
	var parts := _sorted_image_parts(parameters)
	for part in parts:
		_draw_image_part(part, parameters, canvas_scale)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


func _should_process_rig() -> bool:
	if not _motion.is_empty() and not String(_motion.get("clip_id", "")).strip_edges().is_empty():
		return true
	var physics: Variant = _rig.get("physics", {})
	if typeof(physics) == TYPE_DICTIONARY:
		var rules: Variant = (physics as Dictionary).get("rules", [])
		return bool((physics as Dictionary).get("enabled", true)) and typeof(rules) == TYPE_ARRAY and not (rules as Array).is_empty()
	return false


func _current_parameters() -> Dictionary:
	var parameters := _base_parameters.duplicate(true)
	var clip_id := String(_motion.get("clip_id", "")).strip_edges()
	if not clip_id.is_empty():
		parameters = WebRigRuntime.sample_rig_motion_parameters(
			_rig,
			clip_id,
			float(_motion.get("elapsed", 0.0)),
			parameters
		)
	return WebRigRuntime.sample_rig_physics_parameters(_rig, parameters, float(Time.get_ticks_msec()) / 1000.0)


func _sorted_image_parts(parameters: Dictionary) -> Array[Dictionary]:
	var parts: Array[Dictionary] = []
	var source: Variant = _rig.get("imageParts", _rig.get("image_parts", _rig.get("parts", [])))
	if typeof(source) != TYPE_ARRAY:
		return parts
	for raw_part in source as Array:
		if typeof(raw_part) == TYPE_DICTIONARY:
			parts.append((raw_part as Dictionary).duplicate(true))
	parts.sort_custom(func(left: Dictionary, right: Dictionary) -> bool:
		var left_order := _effective_part_order(left, parameters)
		var right_order := _effective_part_order(right, parameters)
		if not is_equal_approx(left_order, right_order):
			return left_order < right_order
		return String(left.get("label", left.get("id", ""))).naturalnocasecmp_to(
			String(right.get("label", right.get("id", "")))
		) < 0
	)
	return parts


func _draw_image_part(part: Dictionary, parameters: Dictionary, canvas_scale: Vector2) -> void:
	if part.get("visible", true) == false:
		return
	var visibility := _visibility_factor(part, parameters)
	if visibility <= 0.001:
		return
	var texture_path := String(part.get("path", part.get("image_path", part.get("imagePath", "")))).strip_edges()
	if texture_path.is_empty():
		return
	var part_texture := _texture_for_path(texture_path)
	if part_texture == null:
		return
	var transform := _effective_part_transform(part, parameters)
	var alpha := clampf(float(transform.get("opacity", 1.0)) * visibility, 0.0, 1.0)
	if alpha <= 0.001:
		return

	var image_size := Vector2(part_texture.get_width(), part_texture.get_height())
	var anchor := Vector2(
		clampf(float(transform.get("anchor_x", 0.5)), 0.0, 1.0),
		clampf(float(transform.get("anchor_y", 0.5)), 0.0, 1.0)
	)
	var position := Vector2(
		float(transform.get("x", 0.0)) * canvas_scale.x,
		float(transform.get("y", 0.0)) * canvas_scale.y
	)
	var scale := Vector2(
		float(transform.get("scale_x", 1.0)) * canvas_scale.x,
		float(transform.get("scale_y", 1.0)) * canvas_scale.y
	)
	var rotation := float(transform.get("rotation", 0.0))
	if flip_h:
		position.x = size.x - position.x
		rotation = -rotation
		scale.x = -scale.x

	draw_set_transform(position, rotation, scale)
	draw_texture(part_texture, -image_size * anchor, Color(1.0, 1.0, 1.0, alpha))
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


func _texture_for_path(path: String) -> Texture2D:
	if _texture_cache.has(path):
		return _texture_cache[path] as Texture2D
	var loaded := load(path) as Texture2D
	if loaded != null:
		_texture_cache[path] = loaded
	return loaded


func _effective_part_transform(part: Dictionary, parameters: Dictionary) -> Dictionary:
	var canvas_size := WebRigRuntime.get_rig_canvas_size(_rig)
	var transform := {
		"x": _number(part.get("x"), canvas_size.x * 0.5),
		"y": _number(part.get("y"), canvas_size.y * 0.5),
		"scale_x": _number(part.get("scaleX", part.get("scale_x")), 1.0),
		"scale_y": _number(part.get("scaleY", part.get("scale_y")), 1.0),
		"rotation": deg_to_rad(_number(part.get("rotation"), 0.0)),
		"opacity": _number(part.get("opacity"), 1.0),
		"anchor_x": _number(part.get("anchorX", part.get("anchor_x")), 0.5),
		"anchor_y": _number(part.get("anchorY", part.get("anchor_y")), 0.5),
	}
	transform["x"] = float(transform["x"]) + _parameter_binding_value(part.get("bindX", part.get("bind_x", "")), parameters) * _number(part.get("bindXStrength", part.get("bind_x_strength")), 0.0)
	transform["y"] = float(transform["y"]) + _parameter_binding_value(part.get("bindY", part.get("bind_y", "")), parameters) * _number(part.get("bindYStrength", part.get("bind_y_strength")), 0.0)
	transform["rotation"] = float(transform["rotation"]) + deg_to_rad(_parameter_binding_value(part.get("bindRotation", part.get("bind_rotation", "")), parameters) * _number(part.get("bindRotationStrength", part.get("bind_rotation_strength")), 0.0))
	transform["scale_x"] = clampf(float(transform["scale_x"]) + _parameter_binding_value(part.get("bindScaleX", part.get("bind_scale_x", "")), parameters) * _number(part.get("bindScaleXStrength", part.get("bind_scale_x_strength")), 0.0), -3.0, 3.0)
	transform["scale_y"] = clampf(float(transform["scale_y"]) + _parameter_binding_value(part.get("bindScaleY", part.get("bind_scale_y", "")), parameters) * _number(part.get("bindScaleYStrength", part.get("bind_scale_y_strength")), 0.0), -3.0, 3.0)
	transform["opacity"] = clampf(float(transform["opacity"]) + _parameter_binding_value(part.get("bindOpacity", part.get("bind_opacity", "")), parameters) * _number(part.get("bindOpacityStrength", part.get("bind_opacity_strength")), 0.0), 0.0, 1.0)
	_apply_transform_deformers(transform, part, parameters)
	return transform


func _apply_transform_deformers(transform: Dictionary, part: Dictionary, parameters: Dictionary) -> void:
	var deformers: Variant = part.get("transformDeformers", part.get("transform_deformers", part.get("transformKeys", [])))
	if typeof(deformers) != TYPE_ARRAY:
		return
	for raw_deformer in deformers as Array:
		if typeof(raw_deformer) != TYPE_DICTIONARY:
			continue
		var deformer: Dictionary = raw_deformer
		var parameter := String(deformer.get("parameter", deformer.get("param", ""))).strip_edges()
		if parameter.is_empty():
			continue
		var keyed := WebRigRuntime.interpolate_rig_keyframes(
			deformer.get("keyframes", deformer.get("keys", [])),
			float(parameters.get(parameter, 0.0))
		)
		if keyed.is_empty():
			continue
		if keyed.has("x"):
			transform["x"] = _number(keyed.get("x"), float(transform["x"]))
		if keyed.has("y"):
			transform["y"] = _number(keyed.get("y"), float(transform["y"]))
		if keyed.has("rotation"):
			transform["rotation"] = deg_to_rad(_number(keyed.get("rotation"), rad_to_deg(float(transform["rotation"]))))
		if keyed.has("scaleX") or keyed.has("scale_x"):
			transform["scale_x"] = clampf(_number(keyed.get("scaleX", keyed.get("scale_x")), float(transform["scale_x"])), -3.0, 3.0)
		if keyed.has("scaleY") or keyed.has("scale_y"):
			transform["scale_y"] = clampf(_number(keyed.get("scaleY", keyed.get("scale_y")), float(transform["scale_y"])), -3.0, 3.0)
		if keyed.has("opacity"):
			transform["opacity"] = clampf(_number(keyed.get("opacity"), float(transform["opacity"])), 0.0, 1.0)


func _effective_part_order(part: Dictionary, parameters: Dictionary) -> float:
	var order := _number(part.get("order", part.get("draw_order")), 0.0)
	var deformers: Variant = part.get("drawOrderDeformers", part.get("draw_order_deformers", part.get("drawOrderKeys", [])))
	if typeof(deformers) != TYPE_ARRAY:
		return order
	for raw_deformer in deformers as Array:
		if typeof(raw_deformer) != TYPE_DICTIONARY:
			continue
		var deformer: Dictionary = raw_deformer
		var parameter := String(deformer.get("parameter", deformer.get("param", ""))).strip_edges()
		if parameter.is_empty():
			continue
		var keyed := WebRigRuntime.interpolate_rig_keyframes(
			deformer.get("keyframes", deformer.get("keys", [])),
			float(parameters.get(parameter, 0.0))
		)
		if keyed.has("order"):
			order = _number(keyed.get("order"), order)
		elif keyed.has("value"):
			order = _number(keyed.get("value"), order)
	return order


func _visibility_factor(part: Dictionary, parameters: Dictionary) -> float:
	var gate: Variant = part.get("visibilityGate", part.get("visibility_gate", {}))
	if typeof(gate) != TYPE_DICTIONARY:
		return 1.0
	var visibility_gate: Dictionary = gate
	if not bool(visibility_gate.get("enabled", false)):
		return 1.0
	var parameter := String(visibility_gate.get("parameter", visibility_gate.get("param", visibility_gate.get("key", "")))).strip_edges()
	if parameter.is_empty():
		return 1.0
	var value := float(parameters.get(parameter, 0.0))
	var min_value := _number(visibility_gate.get("min", visibility_gate.get("minimum")), -INF)
	var max_value := _number(visibility_gate.get("max", visibility_gate.get("maximum")), INF)
	if min_value > max_value:
		var swap := min_value
		min_value = max_value
		max_value = swap
	var fade := maxf(_number(visibility_gate.get("fade", visibility_gate.get("softness")), 0.0), 0.0)
	if value >= min_value and value <= max_value:
		return 1.0
	if fade <= 0.001:
		return 0.0
	if value < min_value:
		return clampf(1.0 - ((min_value - value) / fade), 0.0, 1.0)
	return clampf(1.0 - ((value - max_value) / fade), 0.0, 1.0)


func _parameter_binding_value(parameter: Variant, parameters: Dictionary) -> float:
	var key := String(parameter).strip_edges()
	if key.is_empty():
		return 0.0
	var value := float(parameters.get(key, 0.0))
	var definition := WebRigRuntime.get_rig_parameter_definition(_rig, key)
	var min_value := float(definition.get("min", -100.0))
	var max_value := float(definition.get("max", 100.0))
	if min_value >= 0.0:
		return (value - min_value) / maxf(max_value - min_value, 1.0)
	return value / maxf(maxf(absf(min_value), absf(max_value)), 1.0)


func _number(value: Variant, fallback: float) -> float:
	if value == null:
		return fallback
	var number := float(value)
	return number if number == number and absf(number) < 1.0e30 else fallback
