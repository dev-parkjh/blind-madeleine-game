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

const _ASSET_REGIONS := {
	"main_panel": {
		"path": "res://assets/ui_generated/01_main_title.png",
		"region": Rect2(24, 24, 872, 635),
		"margins": Vector4(54, 54, 54, 54),
	},
	"main_button": {
		"path": "res://assets/ui_generated/01_main_title.png",
		"region": Rect2(303, 696, 256, 50),
		"margins": Vector4(28, 16, 28, 16),
	},
	"main_button_focus": {
		"path": "res://assets/ui_generated/01_main_title.png",
		"region": Rect2(584, 696, 255, 50),
		"margins": Vector4(28, 16, 28, 16),
	},
	"main_button_disabled": {
		"path": "res://assets/ui_generated/01_main_title.png",
		"region": Rect2(869, 872, 279, 50),
		"margins": Vector4(28, 16, 28, 16),
	},
	"dialogue_panel": {
		"path": "res://assets/ui_generated/03_story_dialogue_panel.png",
		"region": Rect2(23, 537, 1088, 260),
		"margins": Vector4(62, 62, 70, 50),
	},
	"dialogue_panel_thin": {
		"path": "res://assets/ui_generated/03_story_dialogue_panel.png",
		"region": Rect2(23, 827, 1026, 145),
		"margins": Vector4(58, 42, 72, 36),
	},
	"choice_normal": {
		"path": "res://assets/ui_generated/04_choice_buttons.png",
		"region": Rect2(24, 57, 495, 70),
		"margins": Vector4(56, 20, 56, 20),
	},
	"choice_hover": {
		"path": "res://assets/ui_generated/04_choice_buttons.png",
		"region": Rect2(24, 144, 494, 70),
		"margins": Vector4(56, 20, 56, 20),
	},
	"choice_focus": {
		"path": "res://assets/ui_generated/04_choice_buttons.png",
		"region": Rect2(24, 230, 494, 70),
		"margins": Vector4(56, 20, 56, 20),
	},
	"choice_pressed": {
		"path": "res://assets/ui_generated/04_choice_buttons.png",
		"region": Rect2(24, 317, 495, 70),
		"margins": Vector4(56, 20, 56, 20),
	},
	"choice_disabled": {
		"path": "res://assets/ui_generated/04_choice_buttons.png",
		"region": Rect2(24, 576, 495, 69),
		"margins": Vector4(56, 20, 56, 20),
	},
	"hud_button": {
		"path": "res://assets/ui_generated/05_top_hud_and_input_hints.png",
		"region": Rect2(42, 195, 337, 56),
		"margins": Vector4(30, 16, 30, 16),
	},
	"hud_button_focus": {
		"path": "res://assets/ui_generated/05_top_hud_and_input_hints.png",
		"region": Rect2(415, 194, 337, 56),
		"margins": Vector4(30, 16, 30, 16),
	},
	"chapter_button": {
		"path": "res://assets/ui_generated/02_chapter_select.png",
		"region": Rect2(574, 112, 240, 52),
		"margins": Vector4(34, 16, 34, 16),
	},
	"chapter_button_focus": {
		"path": "res://assets/ui_generated/02_chapter_select.png",
		"region": Rect2(809, 112, 240, 52),
		"margins": Vector4(34, 16, 34, 16),
	},
	"overlay_panel": {
		"path": "res://assets/ui_generated/13_popup_frames.png",
		"region": Rect2(28, 393, 779, 312),
		"margins": Vector4(58, 54, 58, 54),
	},
	"backlog_panel": {
		"path": "res://assets/ui_generated/09_backlog.png",
		"region": Rect2(30, 39, 869, 607),
		"margins": Vector4(58, 58, 58, 58),
	},
	"backlog_entry": {
		"path": "res://assets/ui_generated/09_backlog.png",
		"region": Rect2(1074, 183, 426, 105),
		"margins": Vector4(38, 26, 38, 26),
	},
	"backlog_entry_focus": {
		"path": "res://assets/ui_generated/09_backlog.png",
		"region": Rect2(1074, 313, 426, 106),
		"margins": Vector4(38, 26, 38, 26),
	},
	"branch_panel": {
		"path": "res://assets/ui_generated/10_branch_tree.png",
		"region": Rect2(48, 42, 1441, 932),
		"margins": Vector4(66, 66, 66, 66),
	},
	"options_panel": {
		"path": "res://assets/ui_generated/11_options.png",
		"region": Rect2(315, 124, 670, 420),
		"margins": Vector4(58, 58, 58, 58),
	},
	"options_button": {
		"path": "res://assets/ui_generated/11_options.png",
		"region": Rect2(31, 39, 236, 63),
		"margins": Vector4(32, 18, 32, 18),
	},
	"options_button_focus": {
		"path": "res://assets/ui_generated/11_options.png",
		"region": Rect2(281, 38, 212, 64),
		"margins": Vector4(32, 18, 32, 18),
	},
}


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


static func asset_panel_style(
	asset_key: String,
	fill_color: Color = PANEL_FILL,
	border_color: Color = BORDER,
	border_width: int = 2,
	radius: int = 9,
	shadow_size: int = 14,
	content_margin: Vector4 = Vector4(-1, -1, -1, -1)
) -> StyleBox:
	var fallback := panel_style(fill_color, border_color, border_width, radius, shadow_size)
	return _asset_style(asset_key, fallback, content_margin)


static func asset_surface_style(
	asset_key: String,
	fill_color: Color = SURFACE_FILL,
	border_color: Color = BORDER_DIM,
	border_width: int = 1,
	radius: int = 4,
	shadow_size: int = 8,
	content_margin: Vector4 = Vector4(-1, -1, -1, -1)
) -> StyleBox:
	var fallback := surface_style(fill_color, border_color, border_width, radius, shadow_size)
	return _asset_style(asset_key, fallback, content_margin)


static func asset_button_style(
	asset_key: String,
	fill_color: Color = BUTTON_FILL,
	border_color: Color = BORDER_DIM,
	border_width: int = 2,
	radius: int = 8,
	content_margin: Vector4 = Vector4(18.0, 8.0, 18.0, 8.0)
) -> StyleBox:
	var fallback := button_style(fill_color, border_color, border_width, radius, content_margin)
	return _asset_style(asset_key, fallback, content_margin)


static func _asset_style(asset_key: String, fallback: StyleBox, content_margin: Vector4 = Vector4(-1, -1, -1, -1)) -> StyleBox:
	if not _ASSET_REGIONS.has(asset_key):
		return fallback

	var region_info: Dictionary = _ASSET_REGIONS[asset_key]
	var texture := _make_atlas_texture(String(region_info.get("path", "")), region_info.get("region", Rect2()))
	if texture == null:
		return fallback

	var style := StyleBoxTexture.new()
	style.texture = texture
	style.draw_center = true
	style.modulate_color = Color.WHITE

	var texture_margins: Vector4 = region_info.get("margins", Vector4(0, 0, 0, 0))
	style.set_texture_margin(SIDE_LEFT, texture_margins.x)
	style.set_texture_margin(SIDE_TOP, texture_margins.y)
	style.set_texture_margin(SIDE_RIGHT, texture_margins.z)
	style.set_texture_margin(SIDE_BOTTOM, texture_margins.w)

	var resolved_content_margin := content_margin
	if resolved_content_margin.x < 0.0:
		resolved_content_margin = region_info.get("content_margins", Vector4(0, 0, 0, 0))
	style.set_content_margin(SIDE_LEFT, resolved_content_margin.x)
	style.set_content_margin(SIDE_TOP, resolved_content_margin.y)
	style.set_content_margin(SIDE_RIGHT, resolved_content_margin.z)
	style.set_content_margin(SIDE_BOTTOM, resolved_content_margin.w)
	return style


static func _make_atlas_texture(path: String, region: Rect2) -> Texture2D:
	if path.is_empty() or region.size.x <= 0.0 or region.size.y <= 0.0:
		return null
	var source := load(path) as Texture2D
	if source == null:
		return null
	var atlas := AtlasTexture.new()
	atlas.atlas = source
	atlas.region = region
	return atlas
