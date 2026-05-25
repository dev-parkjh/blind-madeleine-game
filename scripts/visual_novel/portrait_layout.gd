class_name PortraitLayout
extends RefCounted

const FACE_ANCHOR := Vector2(0.5, 0.4)
const LEGACY_FACE_ANCHOR_Y := 0.5
const ZOOM_DEFAULT := 300
const ZOOM_MIN := 100
const ZOOM_MAX := 500
const ZOOM_STEP := 50
const FIT_PADDING := 0.92
const REFERENCE_VIEWPORT_SIZE := Vector2i(1920, 1080)
const STAGE_BOTTOM_SEPARATOR := 18.0
const DIALOGUE_PANEL_HEIGHT := 285.0

const POSITION_PRESETS := {
	"left": Vector2(-0.22, 0.0),
	"center": Vector2.ZERO,
	"right": Vector2(0.22, 0.0),
}


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
	if key in ["left", "center", "right", "custom"]:
		return key
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

	if point.x >= 0.15 and point.x <= 0.85 and point.y >= 0.4 and point.y <= 1.0:
		return Vector2(
			_round4(point.x - FACE_ANCHOR.x),
			_round4(point.y - FACE_ANCHOR.y)
		)

	if point.y >= 0.1 and point.y <= 0.45 and absf(point.x) <= 0.35:
		return Vector2(
			_round4(point.x),
			_round4(point.y + (LEGACY_FACE_ANCHOR_Y - FACE_ANCHOR.y))
		)

	return Vector2(_round4(point.x), _round4(point.y))


static func get_layout_offset(position: String, raw_offset: Variant) -> Vector2:
	var key := normalize_position(position)
	if key == "custom":
		return parse_offset(raw_offset)
	return POSITION_PRESETS.get(key, Vector2.ZERO)


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
	layout_offset: Vector2
) -> Rect2:
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		return Rect2()
	if texture_size.x <= 0.0 or texture_size.y <= 0.0:
		return Rect2()

	var base_scale := minf(
		(viewport_size.x * FIT_PADDING) / texture_size.x,
		(viewport_size.y * FIT_PADDING) / texture_size.y
	)
	var scale := base_scale * (float(zoom_percent) / 100.0)
	var image_size := texture_size * scale

	var anchor := Vector2(
		viewport_size.x * FACE_ANCHOR.x,
		viewport_size.y * FACE_ANCHOR.y
	)
	var face_pos := anchor + Vector2(
		layout_offset.x * viewport_size.x,
		layout_offset.y * viewport_size.y
	)
	var image_pos := Vector2(
		face_pos.x - face_center.x * image_size.x,
		face_pos.y - face_center.y * image_size.y
	)
	return Rect2(image_pos, image_size)


static func _round4(value: float) -> float:
	return roundf(value * 10000.0) / 10000.0
