class_name PortraitTransition
extends RefCounted

const DURATION_ZOOM := 0.7
const DURATION_PAN := 0.45
const DURATION_LAYOUT_SWAP := 0.55
const DURATION_EXPRESSION := 0.25
const DURATION_FADE_IN := 0.22
const DURATION_FADE_OUT := 0.18


static func build_state(
	path: String,
	texture_size: Vector2,
	face_center: Vector2,
	zoom_percent: float,
	layout_offset: Vector2,
	visible: bool
) -> Dictionary:
	return {
		"path": path,
		"texture_size": texture_size,
		"face_center": face_center,
		"zoom_percent": zoom_percent,
		"layout_offset": layout_offset,
		"visible": visible,
	}


static func layout_changed(from_state: Dictionary, to_state: Dictionary) -> bool:
	if from_state.is_empty() or not from_state.get("visible", false):
		return false
	return (
		from_state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT) != to_state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT)
		or from_state.get("layout_offset", Vector2.ZERO) != to_state.get("layout_offset", Vector2.ZERO)
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
		"visible": true,
	}


static func compute_rect(viewport_size: Vector2, state: Dictionary, horizontal_safe_area := Rect2()) -> Rect2:
	return PortraitLayout.compute_display_rect_with_zoom(
		viewport_size,
		Vector2(state.get("texture_size", Vector2.ZERO)),
		Vector2(state.get("face_center", Vector2(0.5, 0.5))),
		float(state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT)),
		Vector2(state.get("layout_offset", Vector2.ZERO)),
		horizontal_safe_area
	)
