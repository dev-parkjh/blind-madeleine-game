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
	"left": Vector2(-0.22, 0.0),
	"center": Vector2.ZERO,
	"right": Vector2(0.22, 0.0),
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
	if key in ["left", "center", "right", "custom", "same"]:
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
		return {}

	var entry: Variant = portraits[portrait_key]
	if typeof(entry) == TYPE_STRING:
		return {
			"path": String(entry),
			"center": Vector2(0.5, 0.5),
		}

	if typeof(entry) != TYPE_DICTIONARY:
		return {}

	var portrait_data: Dictionary = entry
	var path := String(portrait_data.get("path", "")).strip_edges()
	if path.is_empty():
		return {}

	return {
		"path": path,
		"center": parse_face_center(portrait_data.get("center", null)),
	}


static func parse_face_center(raw: Variant) -> Vector2:
	match typeof(raw):
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
