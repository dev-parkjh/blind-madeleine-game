class_name PortraitTransition
extends RefCounted

const DURATION_ZOOM := 0.7
const DURATION_PAN := 0.45
const DURATION_LAYOUT_SWAP := 0.55
const DURATION_EXPRESSION := 0.25
const DURATION_FADE_IN := 0.5
const DURATION_FADE_OUT := 0.45
const ANIMATION_SPEED_DEFAULT := 1.0
const ANIMATION_SPEED_MIN := 0.5
const ANIMATION_SPEED_MAX := 1.5
## 논리 50%가 발화자(100%)보다 확실히 약해 보이도록 곡선(>1이면 중간값을 더 눌림).
const CAST_DIM_CURVE_POWER := 1.24
const CAST_DIM_RGB_MIN := 0.74
const CAST_DIM_ALPHA_RENDER_MIN := 0.38
## 비발화자 느낌: 살짝 차갑고 채도 낮춤(0=틴트 없음).
const CAST_DIM_TINT_STRENGTH := 0.42


static func opacity_to_modulate(opacity: float) -> Color:
	var t := clampf(opacity, 0.0, 1.0)
	if t <= 0.001:
		return Color(1.0, 1.0, 1.0, 0.0)
	if t >= 0.995:
		return Color.WHITE

	var curve := pow(t, CAST_DIM_CURVE_POWER)
	var rgb := lerpf(CAST_DIM_RGB_MIN, 1.0, curve)
	var alpha := lerpf(CAST_DIM_ALPHA_RENDER_MIN, 1.0, curve)
	var shade := 1.0 - curve
	var tint := CAST_DIM_TINT_STRENGTH * shade
	return Color(
		lerpf(rgb, rgb * 0.82, tint),
		lerpf(rgb, rgb * 0.86, tint),
		lerpf(rgb, rgb * 0.97, tint),
		alpha
	)


static func normalize_animation_speed(raw: Variant) -> float:
	if raw == null:
		return ANIMATION_SPEED_DEFAULT
	var speed := float(raw)
	if speed <= 0.0:
		return ANIMATION_SPEED_DEFAULT
	return clampf(speed, ANIMATION_SPEED_MIN, ANIMATION_SPEED_MAX)


static func scale_duration(base_duration: float, animation_speed: float) -> float:
	var speed := normalize_animation_speed(animation_speed)
	return maxf(base_duration / speed, 0.05)


static func build_state(
	path: String,
	texture_size: Vector2,
	face_center: Vector2,
	zoom_percent: float,
	layout_offset: Vector2,
	visible: bool,
	flip_h: bool = false
) -> Dictionary:
	return {
		"path": path,
		"texture_size": texture_size,
		"face_center": face_center,
		"zoom_percent": zoom_percent,
		"layout_offset": layout_offset,
		"visual_scale": 1.0,
		"visible": visible,
		"flip_h": flip_h,
	}


static func layout_changed(from_state: Dictionary, to_state: Dictionary) -> bool:
	if from_state.is_empty() or not from_state.get("visible", false):
		return false
	return (
		from_state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT) != to_state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT)
		or from_state.get("layout_offset", Vector2.ZERO) != to_state.get("layout_offset", Vector2.ZERO)
		or not is_equal_approx(float(from_state.get("visual_scale", 1.0)), float(to_state.get("visual_scale", 1.0)))
	)


static func geometry_changed(from_state: Dictionary, to_state: Dictionary) -> bool:
	if from_state.is_empty() or not from_state.get("visible", false):
		return false
	var from_texture_size := Vector2(from_state.get("texture_size", Vector2.ZERO))
	var to_texture_size := Vector2(to_state.get("texture_size", Vector2.ZERO))
	var from_face_center := Vector2(from_state.get("face_center", Vector2(0.5, 0.5)))
	var to_face_center := Vector2(to_state.get("face_center", Vector2(0.5, 0.5)))
	return (
		layout_changed(from_state, to_state)
		or from_texture_size != to_texture_size
		or from_face_center != to_face_center
	)


static func texture_changed(from_state: Dictionary, to_state: Dictionary) -> bool:
	if from_state.is_empty() or not from_state.get("visible", false):
		return false
	return from_state.get("path", "") != to_state.get("path", "")


static func pick_layout_duration(from_state: Dictionary, to_state: Dictionary) -> float:
	if from_state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT) != to_state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT):
		return DURATION_ZOOM
	if not is_equal_approx(float(from_state.get("visual_scale", 1.0)), float(to_state.get("visual_scale", 1.0))):
		return DURATION_ZOOM
	if from_state.get("layout_offset", Vector2.ZERO) != to_state.get("layout_offset", Vector2.ZERO):
		return DURATION_PAN
	return DURATION_EXPRESSION


static func interpolate_state(from_state: Dictionary, to_state: Dictionary, progress: float) -> Dictionary:
	return interpolate_layout_state(to_state, from_state, to_state, progress)


static func interpolate_layout_state(
	appearance_state: Dictionary,
	from_state: Dictionary,
	to_state: Dictionary,
	progress: float
) -> Dictionary:
	var amount := clampf(progress, 0.0, 1.0)
	var state := {
		"path": appearance_state.get("path", ""),
		"texture_size": appearance_state.get("texture_size", Vector2.ZERO),
		"face_center": appearance_state.get("face_center", Vector2(0.5, 0.5)),
		"zoom_percent": lerpf(
			float(from_state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT)),
			float(to_state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT)),
			amount
		),
		"layout_offset": Vector2(from_state.get("layout_offset", Vector2.ZERO)).lerp(
			Vector2(to_state.get("layout_offset", Vector2.ZERO)),
			amount
		),
		"visual_scale": lerpf(
			float(from_state.get("visual_scale", 1.0)),
			float(to_state.get("visual_scale", 1.0)),
			amount
		),
		"visible": true,
		"flip_h": bool(appearance_state.get("flip_h", false)),
	}
	if appearance_state.has("live2d"):
		state["live2d"] = interpolate_live2d_state(appearance_state, from_state, to_state, amount)
	return state


static func interpolate_live2d_state(appearance_state: Dictionary, from_state: Dictionary, to_state: Dictionary, progress: float) -> Dictionary:
	var amount := clampf(progress, 0.0, 1.0)
	var appearance_live2d: Dictionary = _read_dictionary_field(appearance_state, "live2d")
	var from_live2d: Dictionary = _read_dictionary_field(from_state, "live2d")
	var to_live2d: Dictionary = _read_dictionary_field(to_state, "live2d")
	if from_live2d.is_empty() or to_live2d.is_empty():
		return appearance_live2d.duplicate(true)

	var next: Dictionary = appearance_live2d.duplicate(true)
	next["parts"] = _interpolate_live2d_parts(
		_read_live2d_parts(from_live2d),
		_read_live2d_parts(to_live2d),
		amount
	)
	next["angle"] = lerpf(float(from_live2d.get("angle", 0.0)), float(to_live2d.get("angle", 0.0)), amount)
	if amount >= 0.5:
		next["motion"] = _read_dictionary_field(to_live2d, "motion").duplicate(true)
		next["motion_key"] = String(to_live2d.get("motion_key", next.get("motion_key", "")))
	return next


static func _interpolate_live2d_parts(from_parts: Array, to_parts: Array, amount: float) -> Array:
	var from_by_id: Dictionary = {}
	var to_by_id: Dictionary = {}
	var order: Array = []
	for raw_part in from_parts:
		if typeof(raw_part) != TYPE_DICTIONARY:
			continue
		var part: Dictionary = raw_part
		var part_id := String(part.get("id", "")).strip_edges()
		if part_id.is_empty():
			continue
		from_by_id[part_id] = part
		order.append(part_id)
	for raw_part in to_parts:
		if typeof(raw_part) != TYPE_DICTIONARY:
			continue
		var part: Dictionary = raw_part
		var part_id := String(part.get("id", "")).strip_edges()
		if part_id.is_empty():
			continue
		to_by_id[part_id] = part
		if not order.has(part_id):
			order.append(part_id)

	var parts: Array = []
	for part_id in order:
		var from_part := _read_dictionary_field(from_by_id, part_id)
		var to_part := _read_dictionary_field(to_by_id, part_id)
		if from_part.is_empty():
			parts.append(to_part.duplicate(true))
		elif to_part.is_empty():
			parts.append(from_part.duplicate(true))
		else:
			parts.append(_interpolate_live2d_part(from_part, to_part, amount))
	return parts


static func _interpolate_live2d_part(from_part: Dictionary, to_part: Dictionary, amount: float) -> Dictionary:
	var chosen: Dictionary = to_part if amount >= 0.5 else from_part
	var next: Dictionary = chosen.duplicate(true)
	next["position"] = Vector2(from_part.get("position", Vector2.ZERO)).lerp(Vector2(to_part.get("position", Vector2.ZERO)), amount)
	next["anchor"] = Vector2(from_part.get("anchor", Vector2(0.5, 0.5))).lerp(Vector2(to_part.get("anchor", Vector2(0.5, 0.5))), amount)
	next["scale"] = Vector2(from_part.get("scale", Vector2.ONE)).lerp(Vector2(to_part.get("scale", Vector2.ONE)), amount)
	next["skew"] = Vector2(from_part.get("skew", Vector2.ZERO)).lerp(Vector2(to_part.get("skew", Vector2.ZERO)), amount)
	next["rotation"] = lerpf(float(from_part.get("rotation", 0.0)), float(to_part.get("rotation", 0.0)), amount)
	next["opacity"] = lerpf(float(from_part.get("opacity", 1.0)), float(to_part.get("opacity", 1.0)), amount)
	if int(from_part.get("z_index", 0)) == int(to_part.get("z_index", 0)):
		next["z_index"] = int(to_part.get("z_index", 0))
	return next


static func _read_dictionary_field(source: Dictionary, key: Variant) -> Dictionary:
	if source.is_empty() or not source.has(key):
		return {}
	var raw: Variant = source.get(key, {})
	if typeof(raw) != TYPE_DICTIONARY:
		return {}
	return raw


static func _read_live2d_parts(live2d: Dictionary) -> Array:
	var raw: Variant = live2d.get("parts", [])
	if typeof(raw) != TYPE_ARRAY:
		return []
	return raw


static func compute_rect(viewport_size: Vector2, state: Dictionary, horizontal_safe_area := Rect2()) -> Rect2:
	var rect := PortraitLayout.compute_display_rect_with_zoom(
		viewport_size,
		Vector2(state.get("texture_size", Vector2.ZERO)),
		Vector2(state.get("face_center", Vector2(0.5, 0.5))),
		float(state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT)),
		Vector2(state.get("layout_offset", Vector2.ZERO)),
		horizontal_safe_area
	)
	var visual_scale := clampf(float(state.get("visual_scale", 1.0)), 0.01, 4.0)
	if is_equal_approx(visual_scale, 1.0) or rect.size.x <= 0.0 or rect.size.y <= 0.0:
		return rect

	var face_center := Vector2(state.get("face_center", Vector2(0.5, 0.5)))
	var face_position := rect.position + Vector2(rect.size.x * face_center.x, rect.size.y * face_center.y)
	var scaled_size := rect.size * visual_scale
	return Rect2(
		face_position - Vector2(scaled_size.x * face_center.x, scaled_size.y * face_center.y),
		scaled_size
	)
