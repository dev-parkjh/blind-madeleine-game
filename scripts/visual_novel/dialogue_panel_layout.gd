class_name DialoguePanelLayout
extends RefCounted

const REFERENCE_VIEWPORT_SIZE := Vector2i(1920, 1080)
const REFERENCE_WIDTH := float(REFERENCE_VIEWPORT_SIZE.x)
const REFERENCE_HEIGHT := float(REFERENCE_VIEWPORT_SIZE.y)
const BASE_MIN_HEIGHT := 285.0
const MAX_WIDTH := 1600.0

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


static func resolve(viewport_size: Vector2) -> Dictionary:
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		return _fallback_layout()

	var panel_width := viewport_size.x
	if viewport_size.x > REFERENCE_WIDTH:
		panel_width = minf(viewport_size.x, MAX_WIDTH)
	var horizontal_inset := (viewport_size.x - panel_width) * 0.5

	var height_width_ratio := viewport_size.y / viewport_size.x
	var tall_factor := _compute_tall_factor(height_width_ratio)

	var panel_height := BASE_MIN_HEIGHT
	if tall_factor > 0.0:
		var target_ratio := _compute_target_height_ratio(height_width_ratio)
		var proportional_height := viewport_size.y * target_ratio
		panel_height = maxf(BASE_MIN_HEIGHT, lerpf(BASE_MIN_HEIGHT, proportional_height, tall_factor))

	return {
		"width": panel_width,
		"height": panel_height,
		"height_ratio": panel_height / viewport_size.y,
		"offset_left": horizontal_inset,
		"offset_right": -horizontal_inset,
		"tall_factor": tall_factor,
	}


static func reserved_bottom(viewport_size: Vector2, separation: float) -> float:
	return float(resolve(viewport_size).get("height", BASE_MIN_HEIGHT)) + separation


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


static func _fallback_layout() -> Dictionary:
	return {
		"width": MAX_WIDTH,
		"height": BASE_MIN_HEIGHT,
		"height_ratio": REFERENCE_HEIGHT_RATIO,
		"offset_left": 0.0,
		"offset_right": 0.0,
		"tall_factor": 0.0,
	}
