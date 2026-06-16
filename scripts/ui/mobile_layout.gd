class_name MobileLayout
extends RefCounted

const REFERENCE_VIEWPORT_SIZE := Vector2(1920.0, 1080.0)
const REFERENCE_HEIGHT_WIDTH_RATIO := REFERENCE_VIEWPORT_SIZE.y / REFERENCE_VIEWPORT_SIZE.x
const FOLD7_COVER_HEIGHT_WIDTH_RATIO := 1080.0 / 2520.0
const FOLD7_MAIN_HEIGHT_WIDTH_RATIO := 1968.0 / 2184.0
const CONTENT_SAFE_MIN_HEIGHT_WIDTH_RATIO := FOLD7_COVER_HEIGHT_WIDTH_RATIO
const CONTENT_SAFE_MAX_HEIGHT_WIDTH_RATIO := 2.5


static func mobile_factor(viewport_size: Vector2) -> float:
	var factor_size := _factor_size(viewport_size)
	return maxf(wide_landscape_factor(factor_size), unfolded_factor(factor_size))


static func wide_landscape_factor(viewport_size: Vector2) -> float:
	var ratio := _height_width_ratio(_factor_size(viewport_size))
	if ratio <= 0.0 or ratio >= REFERENCE_HEIGHT_WIDTH_RATIO:
		return 0.0
	return clampf(
		(REFERENCE_HEIGHT_WIDTH_RATIO - ratio) / (REFERENCE_HEIGHT_WIDTH_RATIO - FOLD7_COVER_HEIGHT_WIDTH_RATIO),
		0.0,
		1.0
	)


static func unfolded_factor(viewport_size: Vector2) -> float:
	var ratio := _height_width_ratio(_factor_size(viewport_size))
	if ratio <= REFERENCE_HEIGHT_WIDTH_RATIO:
		return 0.0
	return clampf(
		(ratio - REFERENCE_HEIGHT_WIDTH_RATIO) / (FOLD7_MAIN_HEIGHT_WIDTH_RATIO - REFERENCE_HEIGHT_WIDTH_RATIO),
		0.0,
		1.0
	)


static func scaled_int(base_value: int, target_value: int, viewport_size: Vector2) -> int:
	return int(roundf(lerpf(float(base_value), float(target_value), mobile_factor(viewport_size))))


static func scaled_float(base_value: float, target_value: float, viewport_size: Vector2) -> float:
	return lerpf(base_value, target_value, mobile_factor(viewport_size))


static func content_safe_rect(viewport_size: Vector2) -> Rect2:
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		return Rect2(Vector2.ZERO, REFERENCE_VIEWPORT_SIZE)

	var safe_size := viewport_size
	var height_width_ratio := _height_width_ratio(viewport_size)
	var vertical_alignment := 0.5

	if height_width_ratio < CONTENT_SAFE_MIN_HEIGHT_WIDTH_RATIO:
		safe_size.x = minf(viewport_size.x, viewport_size.y / CONTENT_SAFE_MIN_HEIGHT_WIDTH_RATIO)
	elif height_width_ratio > CONTENT_SAFE_MAX_HEIGHT_WIDTH_RATIO:
		safe_size.y = minf(viewport_size.y, viewport_size.x * CONTENT_SAFE_MAX_HEIGHT_WIDTH_RATIO)
		vertical_alignment = 0.0

	var safe_position := Vector2(
		maxf(0.0, (viewport_size.x - safe_size.x) * 0.5),
		maxf(0.0, (viewport_size.y - safe_size.y) * vertical_alignment)
	)
	return Rect2(safe_position, safe_size)


static func _height_width_ratio(viewport_size: Vector2) -> float:
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		return 0.0
	return viewport_size.y / viewport_size.x


static func _factor_size(viewport_size: Vector2) -> Vector2:
	if OS.has_feature("web"):
		var web_size := _web_window_size()
		if web_size.x > 0.0 and web_size.y > 0.0:
			return web_size

	var window_size := DisplayServer.window_get_size()
	if window_size.x > 0 and window_size.y > 0:
		return Vector2(window_size)
	return viewport_size


static func _web_window_size() -> Vector2:
	var raw_size: Variant = JavaScriptBridge.eval("""
(() => {
	const width = Number(window.innerWidth || document.documentElement.clientWidth || 0);
	const height = Number(window.innerHeight || document.documentElement.clientHeight || 0);
	return width + "x" + height;
})()
""", true)
	if typeof(raw_size) != TYPE_STRING:
		return Vector2.ZERO
	var parts := String(raw_size).split("x", false)
	if parts.size() < 2:
		return Vector2.ZERO
	return Vector2(float(parts[0]), float(parts[1]))
