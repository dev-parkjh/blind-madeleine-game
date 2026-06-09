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
	return {
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
