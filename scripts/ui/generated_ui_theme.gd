extends RefCounted

const PANEL_FILL := Color(0.035, 0.038, 0.037, 0.965)
const PANEL_FILL_WARM := Color(0.050, 0.046, 0.039, 0.945)
const SURFACE_FILL := Color(0.060, 0.064, 0.061, 0.935)
const SURFACE_FILL_DARK := Color(0.023, 0.026, 0.027, 0.960)
const BUTTON_FILL := Color(0.064, 0.069, 0.066, 0.965)
const BUTTON_HOVER_FILL := Color(0.095, 0.116, 0.112, 0.980)
const BUTTON_PRESSED_FILL := Color(0.040, 0.043, 0.041, 0.990)
const DISABLED_FILL := Color(0.053, 0.056, 0.053, 0.620)
const BORDER := Color(0.56, 0.55, 0.49, 0.760)
const BORDER_DIM := Color(0.36, 0.38, 0.35, 0.620)
const BORDER_FOCUS := Color(0.78, 0.84, 0.78, 0.920)
const BRASS := Color(0.62, 0.50, 0.30, 0.820)
const RED_ACCENT := Color(0.72, 0.08, 0.09, 0.900)
const KEYCAP_FILL := Color(0.095, 0.105, 0.100, 0.950)
const KEYCAP_BORDER := Color(0.48, 0.47, 0.40, 0.840)
const SHADOW := Color(0, 0, 0, 0.380)


static func panel_style(
	fill_color: Color = PANEL_FILL,
	border_color: Color = BORDER,
	border_width: int = 2,
	radius: int = 9,
	shadow_size: int = 14
) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = fill_color
	style.border_color = border_color
	style.set_border_width_all(border_width)
	style.set_corner_radius_all(radius)
	style.shadow_color = SHADOW
	style.shadow_size = shadow_size
	style.shadow_offset = Vector2(0.0, 6.0)
	return style


static func surface_style(
	fill_color: Color = SURFACE_FILL,
	border_color: Color = BORDER_DIM,
	border_width: int = 1,
	radius: int = 4,
	shadow_size: int = 8
) -> StyleBoxFlat:
	return panel_style(fill_color, border_color, border_width, radius, shadow_size)


static func button_style(
	fill_color: Color = BUTTON_FILL,
	border_color: Color = BORDER_DIM,
	border_width: int = 2,
	radius: int = 8,
	content_margin: Vector4 = Vector4(18.0, 8.0, 18.0, 8.0)
) -> StyleBoxFlat:
	var style := surface_style(fill_color, border_color, border_width, radius, 4)
	style.content_margin_left = content_margin.x
	style.content_margin_top = content_margin.y
	style.content_margin_right = content_margin.z
	style.content_margin_bottom = content_margin.w
	return style


static func ghost_style(radius: int = 4) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0, 0, 0, 0)
	style.border_color = Color(1, 1, 1, 0)
	style.set_border_width_all(0)
	style.set_corner_radius_all(radius)
	style.content_margin_left = 0
	style.content_margin_top = 0
	style.content_margin_right = 0
	style.content_margin_bottom = 0
	return style


static func keycap_style(radius: int = 4, border_width: int = 1) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = KEYCAP_FILL
	style.border_color = KEYCAP_BORDER
	style.set_border_width_all(border_width)
	style.set_corner_radius_all(radius)
	return style


static func slider_track_style(color: Color, radius: int = 4, margin_top: int = 4, margin_bottom: int = 4) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.set_corner_radius_all(radius)
	style.set_content_margin(SIDE_TOP, margin_top)
	style.set_content_margin(SIDE_BOTTOM, margin_bottom)
	return style
