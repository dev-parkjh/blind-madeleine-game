class_name DialoguePanelLayout
extends RefCounted

const MobileLayout = preload("res://scripts/ui/mobile_layout.gd")
const REFERENCE_VIEWPORT_SIZE := Vector2i(1920, 1080)
const REFERENCE_WIDTH := float(REFERENCE_VIEWPORT_SIZE.x)
const REFERENCE_HEIGHT := float(REFERENCE_VIEWPORT_SIZE.y)
const BASE_MIN_HEIGHT := 285.0
const MAX_WIDTH := 1600.0
const OUTER_MARGIN_WIDE_WIDTH_RATIO := 0.026
const OUTER_MARGIN_COMPACT_WIDTH_RATIO := 0.036
const OUTER_MARGIN_HEIGHT_RATIO := 0.032
const OUTER_MARGIN_X_MIN := 21.0
const OUTER_MARGIN_X_MAX := 54.0
const OUTER_MARGIN_Y_MIN := 18.0
const OUTER_MARGIN_Y_MAX := 45.0
const DISPLAY_SAFE_PADDING := 12.0

# height / width at the 16:9 reference resolution (1080 / 1920).
const REFERENCE_HEIGHT_WIDTH_RATIO := REFERENCE_HEIGHT / REFERENCE_WIDTH
# height / width of a square unfolded fold display (Fold7 inner ~1675 / 1920).
const UNFOLDED_HEIGHT_WIDTH_RATIO := 0.87
# height / width above which the target ratio blends toward portrait cover screens.
const PORTRAIT_HEIGHT_WIDTH_START := 1.3
# height / width at which portrait cover screens reach full boost strength.
const PORTRAIT_HEIGHT_WIDTH_MAX := 2.5

# Target dialogue height as a fraction of viewport height (285 / 1080 at reference).
const REFERENCE_HEIGHT_RATIO := BASE_MIN_HEIGHT / REFERENCE_HEIGHT
# Target ratio for unfolded / square displays (chest-level dialogue on inner fold screens).
const UNFOLDED_HEIGHT_RATIO := 0.32
const WIDE_MOBILE_MIN_HEIGHT := 390.0


static func resolve(viewport_size: Vector2) -> Dictionary:
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		return _fallback_layout()

	var outer_margins := _compute_outer_margins(viewport_size)
	var layout_size := Vector2(
		maxf(1.0, viewport_size.x - outer_margins.x - outer_margins.z),
		maxf(1.0, viewport_size.y - outer_margins.y - outer_margins.w)
	)

	var panel_width := layout_size.x
	if layout_size.x > REFERENCE_WIDTH:
		panel_width = minf(layout_size.x, MAX_WIDTH)
	var horizontal_inset := (layout_size.x - panel_width) * 0.5

	var height_width_ratio := layout_size.y / layout_size.x
	var tall_factor := _compute_tall_factor(height_width_ratio)
	var wide_factor := MobileLayout.wide_landscape_factor(layout_size)
	var mobile_factor := maxf(tall_factor, wide_factor)

	var panel_height := BASE_MIN_HEIGHT
	if tall_factor > 0.0:
		var target_ratio := _compute_target_height_ratio(height_width_ratio)
		var proportional_height := layout_size.y * target_ratio
		panel_height = maxf(BASE_MIN_HEIGHT, lerpf(BASE_MIN_HEIGHT, proportional_height, tall_factor))
	if wide_factor > 0.0:
		panel_height = maxf(panel_height, lerpf(BASE_MIN_HEIGHT, WIDE_MOBILE_MIN_HEIGHT, wide_factor))

	return {
		"width": panel_width,
		"height": panel_height,
		"height_ratio": panel_height / layout_size.y,
		"offset_left": outer_margins.x + horizontal_inset,
		"offset_right": -(outer_margins.z + horizontal_inset),
		"bottom_margin": outer_margins.w,
		"tall_factor": tall_factor,
		"wide_factor": wide_factor,
		"mobile_factor": mobile_factor,
	}


static func reserved_bottom(viewport_size: Vector2, separation: float) -> float:
	var layout := resolve(viewport_size)
	return float(layout.get("height", BASE_MIN_HEIGHT)) + float(layout.get("bottom_margin", 0.0)) + separation


static func _compute_tall_factor(height_width_ratio: float) -> float:
	if height_width_ratio <= REFERENCE_HEIGHT_WIDTH_RATIO:
		return 0.0

	if height_width_ratio <= UNFOLDED_HEIGHT_WIDTH_RATIO:
		return _inverse_lerp(
			REFERENCE_HEIGHT_WIDTH_RATIO,
			UNFOLDED_HEIGHT_WIDTH_RATIO,
			height_width_ratio
		)

	return 1.0


static func _compute_target_height_ratio(height_width_ratio: float) -> float:
	if height_width_ratio <= PORTRAIT_HEIGHT_WIDTH_START:
		return UNFOLDED_HEIGHT_RATIO

	return lerpf(
		UNFOLDED_HEIGHT_RATIO,
		REFERENCE_HEIGHT_RATIO,
		_inverse_lerp(PORTRAIT_HEIGHT_WIDTH_START, PORTRAIT_HEIGHT_WIDTH_MAX, height_width_ratio)
	)


static func _inverse_lerp(from_value: float, to_value: float, value: float) -> float:
	if is_equal_approx(from_value, to_value):
		return 1.0 if value >= to_value else 0.0
	return clampf((value - from_value) / (to_value - from_value), 0.0, 1.0)


static func _compute_outer_margins(viewport_size: Vector2) -> Vector4:
	var compact := viewport_size.x < 1140.0 or viewport_size.x < viewport_size.y * 0.92
	var safe_margins := _get_display_safe_margins(viewport_size)
	var base_x := clampf(
		viewport_size.x * (OUTER_MARGIN_COMPACT_WIDTH_RATIO if compact else OUTER_MARGIN_WIDE_WIDTH_RATIO),
		OUTER_MARGIN_X_MIN,
		OUTER_MARGIN_X_MAX
	)
	var base_y := clampf(viewport_size.y * OUTER_MARGIN_HEIGHT_RATIO, OUTER_MARGIN_Y_MIN, OUTER_MARGIN_Y_MAX)
	return Vector4(
		maxf(base_x, safe_margins.x + DISPLAY_SAFE_PADDING),
		maxf(base_y, safe_margins.y + DISPLAY_SAFE_PADDING),
		maxf(base_x, safe_margins.z + DISPLAY_SAFE_PADDING),
		maxf(base_y, safe_margins.w + DISPLAY_SAFE_PADDING)
	)


static func _get_display_safe_margins(viewport_size: Vector2) -> Vector4:
	if not OS.has_feature("mobile"):
		return Vector4(0, 0, 0, 0)

	var window_size := DisplayServer.window_get_size()
	var safe_area := DisplayServer.get_display_safe_area()
	if window_size.x <= 0 or window_size.y <= 0 or safe_area.size.x <= 0 or safe_area.size.y <= 0:
		return Vector4(0, 0, 0, 0)

	var scale := Vector2(viewport_size.x / float(window_size.x), viewport_size.y / float(window_size.y))
	var right := float(window_size.x - safe_area.position.x - safe_area.size.x) * scale.x
	var bottom := float(window_size.y - safe_area.position.y - safe_area.size.y) * scale.y
	return Vector4(
		float(safe_area.position.x) * scale.x,
		float(safe_area.position.y) * scale.y,
		right,
		bottom
	)


static func _fallback_layout() -> Dictionary:
	return {
		"width": MAX_WIDTH,
		"height": BASE_MIN_HEIGHT,
		"height_ratio": REFERENCE_HEIGHT_RATIO,
		"offset_left": 0.0,
		"offset_right": 0.0,
		"bottom_margin": 0.0,
		"tall_factor": 0.0,
		"wide_factor": 0.0,
		"mobile_factor": 0.0,
	}
