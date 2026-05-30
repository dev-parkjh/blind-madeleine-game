extends "res://scripts/screens/screen_base.gd"

const RewindTransitionOverlay = preload("res://scripts/ui/rewind_transition_overlay.gd")
const DialogueBlinkEffect = preload("res://scripts/visual_novel/dialogue_blink_effect.gd")
const DialogueGrowEffect = preload("res://scripts/visual_novel/dialogue_grow_effect.gd")

const DEFAULT_DIALOGUE_ID_BY_CHAPTER = {
	"9e13c22d-e69e-4883-849b-f68a533f37be": "f52b0b1d-9c28-453d-8ce2-50290e50a79d",
}

const LAYOUT_SEPARATION := 18.0
const CHOICE_PANEL_WIDTH := 540.0
const CHOICE_PANEL_MIN_WIDTH := 420.0
const CHOICE_PANEL_MAX_WIDTH := 620.0
const CHOICE_BUTTON_MIN_HEIGHT := 78.0
const CHOICE_BUTTON_BORDER_WIDTH := 3
const CHOICE_BUTTON_CORNER_RADIUS := 9
const CHOICE_BUTTON_CONTENT_MARGIN_X := 24
const CHOICE_BUTTON_CONTENT_MARGIN_Y := 12
const CHOICE_FONT_SIZE := 30
const CHOICE_LIST_SEPARATION := 32.0
const CHOICE_REFERENCE_STAGE_SIZE := Vector2(1920.0, 777.0)
const CHOICE_DIALOGUE_WIDTH_MIN_SCALE := 0.46
const CHOICE_VIEWPORT_HEIGHT_MIN_SCALE := 0.52
const CHOICE_FONT_MIN_SIZE := 14
const CHOICE_STAGE_MARGIN_X := 64.0
const CHOICE_STAGE_MARGIN_TOP := 64.0
const CHOICE_STAGE_MARGIN_BOTTOM := 96.0
const CHOICE_CENTER_DEADZONE := 0.08
const CHOICE_ANCHOR_GAP_MIN_SMALL_X := 48.0
const CHOICE_ANCHOR_GAP_MIN_LARGE_X := 140.0
const CHOICE_ANCHOR_GAP_MAX_SMALL_X := 120.0
const CHOICE_ANCHOR_GAP_MAX_LARGE_X := 420.0
const CHOICE_BOUNDARY_WEIGHT_SMALL := 0.44
const CHOICE_BOUNDARY_WEIGHT_AT_300 := 0.64
const CHOICE_BOUNDARY_WEIGHT_LARGE := 0.74
const CHOICE_VERTICAL_STACK_CENTER_Y := 345.0
const CHOICE_SPEAKER_SCALE_BLEND := 0.45
const CHOICE_SPEAKER_SCALE_MIN := 0.70
const CHOICE_SPEAKER_SCALE_MAX := 1.0
const CHOICE_CHARACTER_EDGE_PADDING_X := 24.0
const CHOICE_FACE_REFERENCE_HALF_WIDTH := 120.0
const DIALOGUE_BORDER_WIDTH := 3.0
const DIALOGUE_CORNER_RADIUS := 9.0
const DIALOGUE_BORDER_COLOR := Color(0.52, 0.52, 0.52)
const DIALOGUE_PANEL_COLOR := Color(0.095, 0.09, 0.082, 0.88)
const DEFAULT_SPEAKER_COLOR := Color(0.92, 0.9, 0.84)
const BODY_TEXT_COLOR := Color(0.86, 0.84, 0.78)
const NARRATOR_TEXT_COLOR := Color("#a0a0a0")
const MUTED_TEXT_COLOR := Color(0.6, 0.58, 0.54)
const DIALOGUE_CONTENT_MARGIN_LEFT := 48
const DIALOGUE_CONTENT_MARGIN_LEFT_UNFOLDED := 62
const DIALOGUE_CONTENT_MARGIN_TOP := 46
const DIALOGUE_CONTENT_MARGIN_TOP_UNFOLDED := 62
const DIALOGUE_CONTENT_MARGIN_RIGHT := 48
const DIALOGUE_CONTENT_MARGIN_BOTTOM := 24
const SPEAKER_LABEL_LEFT := 52.0
const SPEAKER_LABEL_TOP := -20.0
const SPEAKER_LABEL_TOP_UNFOLDED := -36.0
const SPEAKER_LABEL_NOTCH_PADDING := 12.0
const SPEAKER_LABEL_OUTLINE_COLOR := Color(0, 0, 0, 0.78)
const MENU_OVERLAY_COLOR := Color(0, 0, 0, 0.56)
const MENU_PANEL_WIDTH := 450.0
const MENU_PANEL_MARGIN := 42.0
const KEYCAP_BACKGROUND_COLOR := Color(0.18, 0.17, 0.15, 0.94)
const KEYCAP_BORDER_COLOR := Color(0.42, 0.4, 0.35)
const TOP_MENU_GHOST_HOVER_COLOR := Color(1, 1, 1, 0.07)
const TOP_MENU_GHOST_PRESSED_COLOR := Color(1, 1, 1, 0.11)
const TOP_MENU_GHOST_CORNER_RADIUS := 12
const TOP_MENU_BUTTON_CONTENT_MARGIN := Vector2(12, 3)
const FLOATING_MENU_MARGIN := Vector2(20, 12)
const FLOATING_UI_FADE_DURATION := 0.22
const TOP_MENU_TEXT_OUTLINE_COLOR := Color(0, 0, 0, 1)
const TOP_MENU_TEXT_OUTLINE_SIZE := 2
const TOP_MENU_KEYCAP_FONT_SIZE := 14
const TOP_MENU_KEYCAP_MARGIN_HORIZONTAL := 6
const TOP_MENU_KEYCAP_MARGIN_VERTICAL := 0
const TOP_MENU_KEYCAP_CORNER_RADIUS := 3
const TOP_MENU_KEYCAP_LINE_SPACING := -5
const TOP_MENU_KEYCAP_Y_OFFSET := 3
const TOP_MENU_KEYBOARD_BUTTON_MIN_HEIGHT := 42
const TOP_MENU_KEYBOARD_HINT_SEPARATION := 12
const TOP_MENU_SEPARATOR_MARGIN := {
	"default": 2,
	"keyboard": 3,
	"gamepad": 3,
}
const TOP_MENU_SEPARATOR_MARGIN_RIGHT := {
	"gamepad": 2,
}
const TOP_MENU_TEXT_MIN_SIZE := Vector2(84, 51)
const TOP_MENU_TEXT_BUTTON_MIN_SIZE := Vector2(0, 51)
const TOP_MENU_ICON_MIN_SIZE := Vector2(117, 63)
const TOP_MENU_ICON_VERTICAL_PADDING := 15.0
const TOP_MENU_BAR_SEPARATION := {
	"default": 9,
	"keyboard": 6,
	"gamepad": 6,
}
const TOP_MENU_ICON_TEXT_SEPARATION := {
	"default": 6,
	"gamepad": 8,
}
const TOP_MENU_ICON_MIN_WIDTHS := {
	"default": 117,
	"gamepad": 0,
}
const INPUT_ADVANCE_ICON_HEIGHT := 45
const BACKLOG_MAX_ENTRIES := 300
const STATEMENT_KEYBOARD_NAV_FONT_SIZE := 44
const STATEMENT_TOUCH_NAV_FONT_SIZE := 64
const STATEMENT_TOUCH_NAV_ICON_HEIGHT := 58
const STATEMENT_GAMEPAD_NAV_ICON_HEIGHT := 42
const ADVANCE_HINT_PULSE_MIN_ALPHA := 0.42
const ADVANCE_HINT_PULSE_FADE_DURATION := 0.85
const ADVANCE_HINT_PULSE_PEAK_HOLD := 0.55
const TOUCH_TAP_MAX_DISTANCE_PX := 18.0
const STATEMENT_LIE_META_PREFIX := "statement_lie:"
const DIALOGUE_BBCODE_TAGS := [
	"b", "i", "u", "s", "code", "font", "font_size", "color", "bgcolor", "fgcolor",
	"outline_size", "outline_color", "shake", "wave", "tornado", "pulse", "fade",
	"rainbow", "grow", "blink",
]
const STATEMENT_LIE_TEXT_SIDE_PADDING := " "
const STATEMENT_LIE_TEXT_SIDE_PADDING_EXPANDED := "  "
const STATEMENT_LIE_SELECTION_PADDING := Vector2(7.0, 8.0)
const STATEMENT_LIE_SELECTION_PADDING_UNFOLDED := Vector2(9.0, 10.0)
const STATEMENT_LIE_SELECTION_VERTICAL_OFFSET := 1.0
const STATEMENT_LIE_SELECTION_VERTICAL_OFFSET_UNFOLDED := 1.5
const STATEMENT_LIE_SELECTION_BORDER_WIDTH := 3
const STATEMENT_PRESENT_SELECTION_OPACITY := 0.5
const STATEMENT_CONNECTION_HINT_MARGIN := Vector2(16.0, 10.0)
const STATEMENT_CONNECTION_HINT_MIN_HEIGHT := 51.0
const STATEMENT_CONNECTION_HINT_FONT_SIZE := 28
const STATEMENT_CONNECTION_HINT_SEPARATION := 10
const STATEMENT_CONNECTION_HINT_ICON_HEIGHT := 36
const STATEMENT_CONNECTION_HINT_SHOULDER_ICON_HEIGHT := 40
const STATEMENT_CONNECTION_HINT_KEYCAP_FONT_SIZE := 17
const STATEMENT_CONNECTION_HINT_KEYCAP_MARGIN_HORIZONTAL := 8
const STATEMENT_CONNECTION_HINT_KEYCAP_MARGIN_VERTICAL := 2
const STATEMENT_CONNECTION_HINT_KEYCAP_Y_OFFSET := 2
const STATEMENT_LIE_TEXT_SPEED_MULTIPLIER := 0.15
const STATEMENT_LIE_TEXT_EXIT_SPEED_MULTIPLIER := 0.12
const STATEMENT_ARROW_BUTTON_SIZE := Vector2(72, 108)
const STATEMENT_ARROW_DISABLED_OPACITY := 0.5
const STATEMENT_PREVIOUS_ARROW_DISABLED_OPACITY := 0.3
const STATEMENT_ARROW_SIDE_GAP := 18.0
const STATEMENT_DIALOGUE_MIN_CENTER_WIDTH := 420.0
const STATEMENT_NOTE_PANEL_WIDTH := 1120.0
const STATEMENT_NOTE_PANEL_MIN_WIDTH := 520.0
const STATEMENT_NOTE_PANEL_MARGIN := Vector2(36.0, 54.0)
const STATEMENT_NOTE_CENTER_OFFSET_SCALE := 0.5
const STATEMENT_NOTE_CAPTION_LIFT := 8
const STATEMENT_NOTE_OVERLAY_COLOR := Color(0, 0, 0, 0.0)
const STATEMENT_NOTE_SPEAKER_ZOOM := 300
const STATEMENT_NOTE_SPEAKER_OPACITY := 1.0
const STATEMENT_NOTE_PANEL_ENTER_DURATION := 0.45
const STATEMENT_NOTE_PANEL_COLOR := Color(0.045, 0.045, 0.045, 0.94)
const STATEMENT_NOTE_BORDER_COLOR := Color(0.34, 0.34, 0.34, 0.82)
const STATEMENT_NOTE_TEXT_COLOR := Color(0.86, 0.86, 0.86)
const STATEMENT_NOTE_MUTED_COLOR := Color(0.58, 0.58, 0.58)
const STATEMENT_NOTE_ACCENT_COLOR := Color(0.74, 0.74, 0.74)
const STATEMENT_NOTE_CARD_MIN_HEIGHT := 88.0
const STATEMENT_NOTE_CARD_THUMB_SIZE := 62.0
const STATEMENT_NOTE_CARD_FOCUS_SCROLL_PADDING := 12.0
const STATEMENT_NOTE_CARD_FOCUS_SCROLL_DURATION := 0.16
const STATEMENT_NOTE_SINGLE_COLUMN_WIDTH := 760.0
const STATEMENT_NOTE_PANEL_CONTENT_MARGIN_LEFT := 8
const STATEMENT_NOTE_RAIL_WIDTH := 34.0
const STATEMENT_NOTE_RAIL_GAP := 18
const STATEMENT_NOTE_RAIL_SEPARATOR_INSET := 1.0
const STATEMENT_NOTE_RAIL_TICK_PADDING := 7.0
const STATEMENT_NOTE_RAIL_TICK_OUTER_PADDING := 10.0
const STATEMENT_NOTE_RAIL_HEADER_CENTER_Y := 27.0
const STATEMENT_NOTE_RAIL_RULE_Y := 68.0
const STATEMENT_NOTE_RAIL_DEFAULT_STEP := 16.0
const STATEMENT_NOTE_RAIL_STROKE_WIDTH := 1.0
const STATEMENT_NOTE_RAIL_MARK_OFFSET_X := -2.0
const STATEMENT_NOTE_SCROLLBAR_SPACING := 8
const STATEMENT_NOTE_SCROLLBAR_CONTENT_PADDING := 6
const STATEMENT_NOTE_INPUT_HINT_FONT_SIZE := 26
const STATEMENT_NOTE_INPUT_HINT_ICON_HEIGHT := 34
const STATEMENT_NOTE_INPUT_HINT_KEYCAP_FONT_SIZE := 16
const STATEMENT_NOTE_INPUT_HINT_KEYCAP_MARGIN_HORIZONTAL := 7
const STATEMENT_TITLE_FADE_DURATION := 0.3
const STATEMENT_TITLE_HOLD_DURATION := 1.2
const REWIND_FADE_DURATION := 0.28
const STATEMENT_LOOP_PROMPT_TEXT := "진술의 마지막 부분입니다. 처음으로 돌아갈까요?"
const STATEMENT_LOOP_PROMPT_PANEL_WIDTH := 560.0
const STATEMENT_LOOP_PROMPT_BUTTON_SIZE := Vector2(180.0, 72.0)
const SPECTRUM_PORTRAIT_WIDTH_RATIO := 0.76
const SPECTRUM_HEIGHT_SCALE_POWER := 1.12
const SPECTRUM_MIN_ZOOM_SIZE_FACTOR := 0.82
const SPECTRUM_MIN_ZOOM_ALPHA := 0.40
const SPECTRUM_MAX_ZOOM_ALPHA := 0.90
const STAGE_CAST_OPACITY_SPEAKER_DEFAULT := 1.0
const STAGE_CAST_OPACITY_BYSTANDER_DEFAULT := 0.5
const STAGE_CAST_ZOOM_BYSTANDER_DEFAULT := 250
const STAGE_CAST_ANIMATION_SPEED_BYSTANDER_DEFAULT := 1.25
const STAGE_PORTRAIT_HIGHLIGHT_DURATION := 0.28
const STAGE_PARALLAX_ACTIVE_WEIGHT := 2.35
const STAGE_PARALLAX_BYSTANDER_WEIGHT := 0.75
const STAGE_PARALLAX_OPACITY_FLOOR := 0.16
const STAGE_PARALLAX_ACTIVE_PULL_MULTI := 0.38
const STAGE_PARALLAX_GRID_ZOOM_SPREAD_BLEND := 0.55
const POPUP_DEFAULT_SIZE := Vector2(320.0, 320.0)
const POPUP_SIZE_MIN := 96.0
const POPUP_SIZE_MAX := 900.0
const POPUP_SCALE_MIN := 0.25
const POPUP_SCALE_MAX := 3.0
const POPUP_PROFILE_ZOOM_DEFAULT := 3.0
const POPUP_PROFILE_ZOOM_MIN := 1.0
const POPUP_PROFILE_ZOOM_MAX := 6.0
const POPUP_IMAGE_ZOOM_MIN := 0.25
const POPUP_IMAGE_ZOOM_MAX := 6.0
const POPUP_DEFAULT_OPACITY := 1.0
const POPUP_TRANSITION_DURATION := 0.22
const POPUP_FRAME_BACKGROUND := Color(0.035, 0.032, 0.03, 0.86)
const POPUP_POSITION_PRESETS := {
	"left": Vector2(0.24, 0.38),
	"center": Vector2(0.5, 0.36),
	"right": Vector2(0.76, 0.38),
	"top_left": Vector2(0.22, 0.22),
	"top_right": Vector2(0.78, 0.22),
}
const INPUT_ICON_PATHS := {
	"xbox_a": "res://assets/icon/input/xbox_button_color_a_outline.png",
	"xbox_b": "res://assets/icon/input/xbox_button_color_b_outline.png",
	"xbox_y": "res://assets/icon/input/xbox_button_color_y_outline.png",
	"xbox_lb": "res://assets/icon/input/xbox_lb_outline.png",
	"xbox_rb": "res://assets/icon/input/xbox_rb_outline.png",
	"xbox_menu": "res://assets/icon/input/xbox_button_menu_outline.png",
	"xbox_view": "res://assets/icon/input/xbox_button_view_outline.png",
	"stick_l_left": "res://assets/icon/input/xbox_stick_l_left.png",
	"stick_l_right": "res://assets/icon/input/xbox_stick_l_right.png",
}
const TOP_MENU_ICON_KEYS := {
	"gamepad": {
		"skip": "xbox_lb",
		"log": "xbox_y",
		"tree": "xbox_view",
		"menu": "xbox_menu",
	},
}
const TOP_MENU_ICON_HEIGHTS := {
	"gamepad": {
		"skip": 33,
		"log": 27,
		"tree": 27,
		"menu": 27,
	},
}
const SKIP_HOLD_ADVANCE_INTERVAL := 0.08
const SKIP_DISABLED_OPACITY := 0.3
const SKIP_BUTTON_ACTIVE_COLOR := Color(1, 1, 1, 0.14)
const SKIP_INDICATOR_LABEL_WIDTH := 76.0
const SKIP_INDICATOR_LABEL_OFFSET_X := 10.0
const SKIP_INDICATOR_LABEL_OFFSET_Y := 2.0
const SKIP_INDICATOR_ICON_GAP := 6.0
const SKIP_INDICATOR_TEXT := "SKIP"
const SKIP_INDICATOR_ICON := "KeyboardDoubleArrowRightRounded"
const SKIP_INDICATOR_ICON_HEIGHT := 41
const SKIP_INDICATOR_POSITION_OFFSET_X := 10.0
const SKIP_INDICATOR_POSITION_OFFSET_Y := 4.0
const SKIP_INDICATOR_ARROW_TRAVEL := 5.0
const SKIP_INDICATOR_ARROW_DURATION := 0.42

class DialogueBorderFrame:
	extends Control

	var border_color := Color.WHITE
	var border_width := 3.0
	var corner_radius := 9.0
	var notch_visible := false
	var notch_left := 0.0
	var notch_width := 0.0

	func configure(next_color: Color, next_width: float, next_radius: float) -> void:
		border_color = next_color
		border_width = next_width
		corner_radius = next_radius
		queue_redraw()

	func set_notch(next_left: float, next_width: float, next_visible: bool) -> void:
		notch_left = next_left
		notch_width = next_width
		notch_visible = next_visible
		queue_redraw()

	func _draw() -> void:
		if size.x <= border_width or size.y <= border_width:
			return

		var half_width := border_width * 0.5
		var left := half_width
		var top := half_width
		var right := size.x - half_width
		var bottom := size.y - half_width
		var radius := minf(corner_radius, minf((right - left) * 0.5, (bottom - top) * 0.5))
		var top_start := left + radius
		var top_end := right - radius
		var gap_start := top_start
		var gap_end := top_start
		var has_notch := notch_visible and notch_width > 0.0

		if has_notch:
			gap_start = clampf(notch_left, top_start, top_end)
			gap_end = clampf(notch_left + notch_width, top_start, top_end)
			has_notch = gap_end > gap_start

		if has_notch:
			if gap_start > top_start:
				draw_line(Vector2(top_start, top), Vector2(gap_start, top), border_color, border_width, true)
			if gap_end < top_end:
				draw_line(Vector2(gap_end, top), Vector2(top_end, top), border_color, border_width, true)
		else:
			draw_line(Vector2(top_start, top), Vector2(top_end, top), border_color, border_width, true)

		draw_line(Vector2(right, top + radius), Vector2(right, bottom - radius), border_color, border_width, true)
		draw_line(Vector2(right - radius, bottom), Vector2(left + radius, bottom), border_color, border_width, true)
		draw_line(Vector2(left, bottom - radius), Vector2(left, top + radius), border_color, border_width, true)
		draw_arc(Vector2(left + radius, top + radius), radius, PI, PI * 1.5, 16, border_color, border_width, true)
		draw_arc(Vector2(right - radius, top + radius), radius, PI * 1.5, PI * 2.0, 16, border_color, border_width, true)
		draw_arc(Vector2(right - radius, bottom - radius), radius, 0.0, PI * 0.5, 16, border_color, border_width, true)
		draw_arc(Vector2(left + radius, bottom - radius), radius, PI * 0.5, PI, 16, border_color, border_width, true)


class StatementNotebookRail:
	extends Control

	var border_color := Color(0.34, 0.34, 0.34, 0.82)
	var muted_color := Color(0.58, 0.58, 0.58)
	var header_center_y := STATEMENT_NOTE_RAIL_HEADER_CENTER_Y
	var first_tick_y := STATEMENT_NOTE_RAIL_RULE_Y

	func configure(next_border_color: Color, next_muted_color: Color) -> void:
		border_color = next_border_color
		muted_color = next_muted_color
		queue_redraw()

	func set_markers(next_header_center_y: float, next_first_tick_y: float) -> void:
		var changed := not is_equal_approx(header_center_y, next_header_center_y)
		changed = changed or not is_equal_approx(first_tick_y, next_first_tick_y)
		header_center_y = next_header_center_y
		first_tick_y = next_first_tick_y
		if changed:
			queue_redraw()

	func _notification(what: int) -> void:
		if what == NOTIFICATION_RESIZED:
			queue_redraw()

	func _pixel_snap(value: float) -> float:
		return floorf(value) + 0.5

	func _draw() -> void:
		if size.x <= 2.0 or size.y <= 2.0:
			return

		var top := _pixel_snap(8.0)
		var bottom := maxf(top + 1.0, _pixel_snap(size.y - 8.0))
		var separator_color := border_color.darkened(0.18)
		separator_color.a = 0.48
		var separator_x := _pixel_snap(size.x - STATEMENT_NOTE_RAIL_SEPARATOR_INSET)
		draw_line(Vector2(separator_x, top), Vector2(separator_x, bottom), separator_color, STATEMENT_NOTE_RAIL_STROKE_WIDTH, false)

		var tick_area_left := _pixel_snap(STATEMENT_NOTE_RAIL_TICK_OUTER_PADDING)
		var tick_area_right := maxf(tick_area_left + 1.0, _pixel_snap(separator_x - STATEMENT_NOTE_RAIL_TICK_OUTER_PADDING))
		var center_x := _pixel_snap((tick_area_left + tick_area_right) * 0.5 + STATEMENT_NOTE_RAIL_MARK_OFFSET_X)
		var circle_color := muted_color
		circle_color.a = 0.58
		var circle_y := _pixel_snap(clampf(header_center_y, top + 5.0, bottom - 5.0))
		draw_arc(Vector2(center_x, circle_y), 4.2, 0.0, TAU, 18, circle_color, STATEMENT_NOTE_RAIL_STROKE_WIDTH, true)
		draw_arc(Vector2(center_x, circle_y), 1.7, 0.0, TAU, 14, circle_color, STATEMENT_NOTE_RAIL_STROKE_WIDTH, true)

		var y := _pixel_snap(clampf(first_tick_y, top, bottom - 4.0))
		var tick_index := 0
		while y < bottom - 4.0:
			var is_major := tick_index % 5 == 0
			var tick_color := muted_color
			tick_color.a = 0.52 if is_major else 0.28
			var major_tick_length := maxf(1.0, tick_area_right - tick_area_left)
			var tick_length := major_tick_length if is_major else major_tick_length * 0.46
			var tick_left := _pixel_snap(center_x - tick_length * 0.5)
			var tick_right := _pixel_snap(center_x + tick_length * 0.5)
			draw_line(
				Vector2(tick_left, y),
				Vector2(tick_right, y),
				tick_color,
				STATEMENT_NOTE_RAIL_STROKE_WIDTH,
				false
			)
			y = _pixel_snap(y + STATEMENT_NOTE_RAIL_DEFAULT_STEP)
			tick_index += 1


class PopupContentFrame:
	extends Control

	var background_color := Color(0, 0, 0, 0)
	var texture: Texture2D
	var image_position := Vector2.ZERO
	var image_size := Vector2.ZERO
	var border_width := 0.0
	var corner_radius := 0.0

	func configure(next_background_color: Color, next_border_width: float, next_corner_radius: float) -> void:
		background_color = next_background_color
		border_width = maxf(next_border_width, 0.0)
		corner_radius = maxf(next_corner_radius, 0.0)
		queue_redraw()

	func set_texture(next_texture: Texture2D) -> void:
		texture = next_texture
		queue_redraw()

	func set_image_layout(next_position: Vector2, next_size: Vector2) -> void:
		image_position = next_position
		image_size = next_size
		queue_redraw()

	func _draw() -> void:
		var content_rect := _get_content_rect()
		if content_rect.size.x <= 0.0 or content_rect.size.y <= 0.0:
			return

		var content_radius := _get_content_radius(content_rect.size)
		_draw_rounded_background(content_rect, content_radius)
		_draw_rounded_texture(content_rect, content_radius)

	func _get_content_rect() -> Rect2:
		var inset := border_width
		var content_size := Vector2(
			maxf(size.x - inset * 2.0, 0.0),
			maxf(size.y - inset * 2.0, 0.0)
		)
		return Rect2(Vector2(inset, inset), content_size)

	func _get_content_radius(content_size: Vector2) -> float:
		return minf(
			maxf(corner_radius - border_width * 0.5, 0.0),
			minf(content_size.x, content_size.y) * 0.5
		)

	func _draw_rounded_background(rect: Rect2, radius: float) -> void:
		if background_color.a <= 0.0:
			return
		if radius <= 0.0:
			draw_rect(rect, background_color, true)
			return

		var middle_height := maxf(rect.size.y - radius * 2.0, 0.0)
		if middle_height > 0.0:
			draw_rect(
				Rect2(rect.position + Vector2(0.0, radius), Vector2(rect.size.x, middle_height)),
				background_color,
				true
			)
		_draw_rounded_background_cap(rect, radius, true)
		_draw_rounded_background_cap(rect, radius, false)

	func _draw_rounded_background_cap(rect: Rect2, radius: float, is_top: bool) -> void:
		var rows := maxi(int(ceilf(radius * 2.0)), 1)
		for row in range(rows):
			var y0 := radius * float(row) / float(rows)
			var y1 := radius * float(row + 1) / float(rows)
			var strip := _build_rounded_cap_strip(rect, radius, y0, y1, is_top)
			if strip.size.x > 0.0 and strip.size.y > 0.0:
				draw_rect(strip, background_color, true)

	func _draw_rounded_texture(rect: Rect2, radius: float) -> void:
		if texture == null or image_size.x <= 0.0 or image_size.y <= 0.0:
			return

		var texture_size := Vector2(texture.get_width(), texture.get_height())
		if texture_size.x <= 0.0 or texture_size.y <= 0.0:
			return

		var image_rect := Rect2(image_position, image_size)
		if radius <= 0.0:
			_draw_texture_in_strip(rect, image_rect, texture_size)
			return

		var middle_height := maxf(rect.size.y - radius * 2.0, 0.0)
		if middle_height > 0.0:
			_draw_texture_in_strip(
				Rect2(rect.position + Vector2(0.0, radius), Vector2(rect.size.x, middle_height)),
				image_rect,
				texture_size
			)
		_draw_rounded_texture_cap(rect, radius, true, image_rect, texture_size)
		_draw_rounded_texture_cap(rect, radius, false, image_rect, texture_size)

	func _draw_rounded_texture_cap(
		rect: Rect2,
		radius: float,
		is_top: bool,
		image_rect: Rect2,
		texture_size: Vector2
	) -> void:
		var rows := maxi(int(ceilf(radius * 2.0)), 1)
		for row in range(rows):
			var y0 := radius * float(row) / float(rows)
			var y1 := radius * float(row + 1) / float(rows)
			_draw_texture_in_strip(
				_build_rounded_cap_strip(rect, radius, y0, y1, is_top),
				image_rect,
				texture_size
			)

	func _build_rounded_cap_strip(rect: Rect2, radius: float, y0: float, y1: float, is_top: bool) -> Rect2:
		var mid_y := (y0 + y1) * 0.5
		var vertical_distance := radius - mid_y
		var x_extent := sqrt(maxf(radius * radius - vertical_distance * vertical_distance, 0.0))
		var left_inset := radius - x_extent
		var strip_y := rect.position.y + y0 if is_top else rect.position.y + rect.size.y - y1
		return Rect2(
			Vector2(rect.position.x + left_inset, strip_y),
			Vector2(maxf(rect.size.x - left_inset * 2.0, 0.0), y1 - y0)
		)

	func _draw_texture_in_strip(strip_rect: Rect2, image_rect: Rect2, texture_size: Vector2) -> void:
		if strip_rect.size.x <= 0.0 or strip_rect.size.y <= 0.0:
			return

		var visible_rect := image_rect.intersection(strip_rect)
		if visible_rect.size.x <= 0.0 or visible_rect.size.y <= 0.0:
			return

		var source_rect := Rect2(
			Vector2(
				(visible_rect.position.x - image_rect.position.x) / image_rect.size.x * texture_size.x,
				(visible_rect.position.y - image_rect.position.y) / image_rect.size.y * texture_size.y
			),
			Vector2(
				visible_rect.size.x / image_rect.size.x * texture_size.x,
				visible_rect.size.y / image_rect.size.y * texture_size.y
			)
		)
		draw_texture_rect_region(texture, visible_rect, source_rect)


var _speaker_label: Label
var _dialogue_text: RichTextLabel
var _dialogue_typewriter := DialogueTypewriter.new()
var _advance_hint_bar: HBoxContainer
var _advance_hint_icon: TextureRect
var _advance_hint_label: Label
var _advance_hint_pulse_tween: Tween
var _skip_indicator: Control
var _skip_indicator_label: Label
var _skip_indicator_arrow_icon: TextureRect
var _skip_indicator_arrow_base_x := 0.0
var _skip_indicator_arrow_tween: Tween
var _statement_prev_button: Button
var _statement_next_button: Button
var _statement_phrase_selection_frame: PanelContainer
var _statement_phrase_selection_frames: Array[PanelContainer] = []
var _statement_phrase_selection_color := DEFAULT_SPEAKER_COLOR
var _statement_connection_hint: HBoxContainer
var _statement_notebook_overlay: Control
var _statement_notebook_character_scroll: ScrollContainer
var _statement_notebook_item_scroll: ScrollContainer
var _statement_notebook_columns: GridContainer
var _statement_notebook_character_list: VBoxContainer
var _statement_notebook_item_list: VBoxContainer
var _statement_notebook_character_count_label: Label
var _statement_notebook_item_count_label: Label
var _statement_notebook_close_button: Button
var _statement_notebook_input_hint: HBoxContainer
var _statement_notebook_rail: StatementNotebookRail
var _statement_notebook_tween: Tween
var _statement_notebook_scroll_tweens: Dictionary = {}
var _statement_notebook_focus_entries: Array[Dictionary] = []
var _statement_notebook_last_focus_by_column: Dictionary = {}
var _statement_title_overlay: Control
var _statement_title_group: Control
var _statement_title_label: Label
var _statement_title_caption: Label
var _statement_loop_prompt_overlay: Control
var _statement_loop_prompt_yes_button: Button
var _statement_loop_prompt_no_button: Button
var _skip_button: Button
var _backlog_button: Button
var _branch_tree_button: Button
var _menu_button: Button
var _menu_continue_button: Button
var _choice_list: Control
var _choice_overlay: Control
var _portrait_viewport: Control
var _effect_layer: Control
var _dialogue_overlay: Control
var _dialogue_border_frame: DialogueBorderFrame
var _dialogue_content_margin: MarginContainer
var _dialogue_text_layout: VBoxContainer
var _menu_overlay: Control
var _menu_scrim: ColorRect
var _menu_panel: PanelContainer
var _menu_panel_final_rect := Rect2()
var _menu_overlay_closing := false
var _rewind_fade_overlay: Control
var _rewind_fade_tween: Tween
var _floating_ui_canvas: CanvasLayer
var _floating_ui_layer: Control
var _floating_ui_tween: Tween
var _top_menu_bar: HBoxContainer
var _top_menu_buttons: Dictionary = {}
var _top_menu_separators: Array[MarginContainer] = []

var _character_layer: Control
var _popup_layer: Control
var _active_popup_items: Array[Dictionary] = []
var _dialogue_spectrum: DialogueSpectrum
var _voice_player: AudioStreamPlayer
var _dialogue_spectrum_active := false
var _dialogue_spectrum_speaker_id := ""
var _dialogue_spectrum_layout_offset := Vector2.ZERO
var _dialogue_spectrum_offset := Vector2.ZERO
var _portrait_texture_cache: Dictionary = {}
var _portrait_used_rect_cache: Dictionary = {}
var _statement_notebook_profile_thumbnail_cache: Dictionary = {}
var _statement_notebook_content_ready := false
var _statement_notebook_content_signature := ""
var _portrait_face_center := Vector2(0.5, 0.5)
var _portrait_zoom := PortraitLayout.ZOOM_DEFAULT
var _portrait_layout_offset := Vector2.ZERO
var _portrait_has_layout := false
var _portrait_state: Dictionary = {}
var _stage_speaker_id := ""
var _stage_characters: Dictionary = {}
var _stage_character_slots: Dictionary = {}
var _stage_entering_ids: Dictionary = {}
var _parallax_target_speaker_ids: Dictionary = {}
var _dialogue_tall_factor := 0.0
var _choice_button_style_normal: StyleBoxFlat
var _choice_button_style_hover: StyleBoxFlat
var _choice_button_style_focus: StyleBoxFlat
var _choice_button_style_pressed: StyleBoxFlat

var _dialogue_id := ""
var _dialogue_metadata: Dictionary = {}
var _current_node_id := ""
var _current_node: Dictionary = {}
var _nodes_by_id: Dictionary = {}
var _statement_node_ids: Array[String] = []
var _statement_node_index_by_id: Dictionary = {}
var _statement_current_lies: Array[Dictionary] = []
var _statement_lie_ranges: Array[Vector2i] = []
var _statement_hovered_lie_index := -1
var _statement_active_lie_index := -1
var _statement_node_history: Array[String] = []
var _statement_note_open := false
var _statement_connection_mode_active := false
var _statement_resume_connection_mode_on_note_close := false
var _statement_lie_revealing := false
var _statement_title_playing := false
var _statement_title_preparing_reveal := false
var _statement_title_pending_spectrum: Dictionary = {}
var _statement_title_pending_voice_path := ""
var _statement_reveal_layout_active := false
var _statement_loop_prompt_open := false
var _statement_character_shift_active := false
var _statement_character_shift_speaker_id := ""
var _statement_character_shift_original_state: Dictionary = {}
var _statement_note_hidden_character_states: Dictionary = {}
var _statement_note_animation_token := 0
var _statement_phrase_selection_update_queued := false
var _has_loaded_dialogue := false
var _backlog_entries: Array[Dictionary] = []
var _overlay_obscured := false
var _input_icon_cache: Dictionary = {}
var _touch_advance_gestures: Dictionary = {}
var _awaiting_portrait_for_dialogue := false
var _portrait_dialogue_token := 0
var _pending_dialogue: Dictionary = {}
var _cast_batch_remaining := 0
var _cast_batch_on_finished := Callable()
var _skip_hold_requested := false
var _skip_hold_active := false
var _skip_advance_cooldown := 0.0


func setup(payload: Dictionary = {}) -> void:
	setup_payload = payload
	if is_node_ready():
		_load_dialogue_from_payload(payload)


func _ready() -> void:
	screen_id = "story_dialogue"
	screen_title = "일반 대화"
	skip_allowed = true
	_build()
	_dialogue_typewriter.bind(_dialogue_text)
	_dialogue_typewriter.typewriter_finished.connect(_update_advance_hint)
	_dialogue_typewriter.typewriter_finished.connect(_on_dialogue_typewriter_finished)
	_dialogue_typewriter.visible_character_changed.connect(_on_dialogue_visible_character_changed)
	_dialogue_typewriter.speed_range_active_changed.connect(_on_dialogue_speed_range_active_changed)
	set_process(false)
	_load_dialogue_from_payload(setup_payload)
	call_deferred("_sync_fixed_overlay_layout")
	call_deferred("_sync_grid_background")


func _process(delta: float) -> void:
	var typewriter_processed := _dialogue_typewriter.process(delta)
	if _skip_hold_active:
		_process_skip_hold(delta)
	if typewriter_processed or _skip_hold_active:
		return

	set_process(false)


func set_overlay_obscured(obscured: bool) -> void:
	_overlay_obscured = obscured
	if obscured:
		_stop_skip_hold()
	var should_show := not obscured and not _statement_title_playing and not _statement_title_preparing_reveal and not _is_menu_overlay_open()
	_set_floating_ui_visible(should_show)


func _input(event: InputEvent) -> void:
	if _should_ignore_gameplay_event(event):
		return

	super._input(event)

	if _handle_shortcut_input(event):
		get_viewport().set_input_as_handled()


func _unhandled_input(event: InputEvent) -> void:
	if _should_ignore_gameplay_event(event):
		return

	if _handle_pointer_advance_event(event):
		if _uses_statement_dialogue_window():
			_reveal_statement_dialogue()
		else:
			_advance_dialogue()
		get_viewport().set_input_as_handled()


func _gui_input(event: InputEvent) -> void:
	if _should_ignore_gameplay_event(event):
		return

	if event is InputEventMouseMotion:
		_sync_statement_hover_from_mouse_position()

	if _handle_pointer_advance_event(event):
		if _uses_statement_dialogue_window():
			_reveal_statement_dialogue()
		else:
			_advance_dialogue()
		accept_event()


func _notification(what: int) -> void:
	super._notification(what)
	if what == NOTIFICATION_RESIZED:
		_sync_fixed_overlay_layout()


func _build() -> void:
	make_full_rect()

	var layout := VBoxContainer.new()
	layout.name = "StoryDialogueLayout"
	layout.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layout.set_anchors_preset(Control.PRESET_FULL_RECT)
	layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_theme_constant_override("separation", int(LAYOUT_SEPARATION))
	add_child(layout)

	var stage := Control.new()
	stage.name = "Stage"
	stage.mouse_filter = Control.MOUSE_FILTER_IGNORE
	stage.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	stage.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_child(stage)

	var effect_layer := Control.new()
	effect_layer.name = "EffectLayer"
	effect_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	effect_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	stage.add_child(effect_layer)
	_effect_layer = effect_layer

	_build_portrait_viewport()
	_build_dialogue_spectrum()
	_build_voice_player()
	_build_choice_overlay()
	_build_dialogue_overlay()
	_build_skip_indicator()
	_build_statement_navigation()
	_build_statement_notebook_overlay()
	_build_statement_loop_prompt_overlay()
	_build_statement_title_overlay()
	_create_choice_button_styles()
	_build_floating_menu()
	_sync_fixed_overlay_layout()

	_skip_button.button_down.connect(_on_skip_button_down)
	_skip_button.button_up.connect(_on_skip_button_up)
	_backlog_button.pressed.connect(_on_backlog_pressed)
	_branch_tree_button.pressed.connect(_on_branch_tree_pressed)
	_menu_button.pressed.connect(_on_menu_pressed)

	_build_menu_overlay()
	_refresh_input_hints()


func _create_portrait_rect(rect_name: String) -> TextureRect:
	var rect := TextureRect.new()
	rect.name = rect_name
	rect.visible = false
	rect.flip_h = false
	rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	rect.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	rect.stretch_mode = TextureRect.STRETCH_SCALE
	return rect


func _create_dialogue_panel_style(draw_border := true) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = DIALOGUE_PANEL_COLOR
	style.border_color = DIALOGUE_BORDER_COLOR
	style.set_border_width_all(int(DIALOGUE_BORDER_WIDTH) if draw_border else 0)
	style.set_corner_radius_all(int(DIALOGUE_CORNER_RADIUS))
	style.shadow_color = Color(0, 0, 0, 0.34)
	style.shadow_size = 15
	return style


func _build_portrait_viewport() -> void:
	_portrait_viewport = Control.new()
	_portrait_viewport.name = "PortraitViewport"
	_portrait_viewport.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_portrait_viewport)
	_portrait_viewport.resized.connect(_on_portrait_viewport_resized)

	_character_layer = Control.new()
	_character_layer.name = "CharacterLayer"
	_character_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_character_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	_portrait_viewport.add_child(_character_layer)

	_popup_layer = Control.new()
	_popup_layer.name = "PopupLayer"
	_popup_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_popup_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	_portrait_viewport.add_child(_popup_layer)


func _show_node_popups(node: Dictionary, default_character_id: String = "") -> void:
	var raw_popups: Variant = node.get("popups", node.get("popup_images", []))
	var popups: Array = []
	if typeof(raw_popups) == TYPE_DICTIONARY:
		popups.append(raw_popups)
	elif typeof(raw_popups) == TYPE_ARRAY:
		popups = raw_popups

	if popups.is_empty() or _popup_layer == null:
		return

	for index in popups.size():
		var raw_popup: Variant = popups[index]
		if typeof(raw_popup) != TYPE_DICTIONARY:
			continue
		var popup_data: Dictionary = raw_popup
		var image_spec := _resolve_popup_image_spec(popup_data, default_character_id)
		if image_spec.is_empty():
			continue
		_create_popup_image(popup_data, image_spec, index)


func _clear_popup_images() -> void:
	for item in _active_popup_items:
		var tween: Tween = item.get("tween")
		if tween != null:
			tween.kill()
		var root: Control = item.get("root")
		if root != null:
			root.queue_free()
	_active_popup_items.clear()


func _create_popup_image(popup_data: Dictionary, image_spec: Dictionary, index: int) -> void:
	var texture: Texture2D = image_spec.get("texture")
	if texture == null:
		return

	var root := Control.new()
	root.name = String(popup_data.get("id", "PopupImage%d" % (index + 1)))
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.clip_contents = true
	root.z_index = int(popup_data.get("z_index", index))
	_popup_layer.add_child(root)

	var content_frame := PopupContentFrame.new()
	content_frame.name = "Content"
	content_frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
	content_frame.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	content_frame.set_anchors_preset(Control.PRESET_FULL_RECT)
	content_frame.configure(
		_parse_popup_color(popup_data.get("background_color", null), POPUP_FRAME_BACKGROUND),
		DIALOGUE_BORDER_WIDTH,
		DIALOGUE_CORNER_RADIUS
	)
	content_frame.set_texture(texture)
	root.add_child(content_frame)

	var border := DialogueBorderFrame.new()
	border.name = "Border"
	border.mouse_filter = Control.MOUSE_FILTER_IGNORE
	border.set_anchors_preset(Control.PRESET_FULL_RECT)
	border.configure(DIALOGUE_BORDER_COLOR, DIALOGUE_BORDER_WIDTH, DIALOGUE_CORNER_RADIUS)
	root.add_child(border)

	var item := {
		"root": root,
		"content_frame": content_frame,
		"border": border,
		"texture": texture,
		"data": popup_data.duplicate(true),
		"spec": image_spec,
		"tween": null,
	}
	_active_popup_items.append(item)
	_apply_popup_item_layout(item)
	_play_popup_enter_animation(item)


func _parse_popup_color(raw: Variant, default_color: Color) -> Color:
	if typeof(raw) != TYPE_STRING:
		return default_color
	var color_text := String(raw).strip_edges()
	if color_text.is_empty():
		return default_color
	return Color.from_string(color_text, default_color)


func _play_popup_enter_animation(item: Dictionary) -> void:
	var root: Control = item.get("root")
	if root == null:
		return

	var popup_data: Dictionary = item.get("data", {})
	var opacity := _resolve_popup_opacity(popup_data)
	var transition := String(popup_data.get("transition", "fade")).strip_edges().to_lower()
	var duration := clampf(float(popup_data.get("duration", POPUP_TRANSITION_DURATION)), 0.0, 2.0)
	root.modulate.a = 0.0
	root.scale = Vector2.ONE
	root.pivot_offset = root.size * 0.5

	if transition == "none" or duration <= 0.0:
		root.modulate.a = opacity
		return

	var tween := create_tween()
	item["tween"] = tween
	tween.set_parallel(true)
	tween.set_ease(Tween.EASE_OUT)
	tween.set_trans(Tween.TRANS_SINE)
	tween.tween_property(root, "modulate:a", opacity, duration)
	if transition == "pop":
		root.scale = Vector2(0.94, 0.94)
		tween.tween_property(root, "scale", Vector2.ONE, duration)
	elif transition == "slide":
		var final_position := root.position
		root.position = final_position + Vector2(0.0, 18.0)
		tween.tween_property(root, "position", final_position, duration)
	tween.finished.connect(func() -> void:
		item["tween"] = null
		root.modulate.a = opacity
		root.scale = Vector2.ONE
	, CONNECT_ONE_SHOT)


func _apply_popup_layouts() -> void:
	for item in _active_popup_items:
		_apply_popup_item_layout(item)


func _apply_popup_item_layout(item: Dictionary) -> void:
	var root: Control = item.get("root")
	var content_frame: PopupContentFrame = item.get("content_frame")
	var border: DialogueBorderFrame = item.get("border")
	var texture: Texture2D = item.get("texture")
	if root == null or content_frame == null or texture == null:
		return

	var popup_data: Dictionary = item.get("data", {})
	var spec: Dictionary = item.get("spec", {})
	var viewport_size := _get_portrait_viewport_size()
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		return

	var frame_size := _resolve_popup_size(popup_data, viewport_size)
	var anchor := _resolve_popup_anchor(popup_data, viewport_size)
	root.position = anchor - frame_size * 0.5
	root.size = frame_size
	root.pivot_offset = frame_size * 0.5
	content_frame.size = frame_size
	if border != null:
		border.size = frame_size

	if bool(spec.get("crop", false)):
		_apply_popup_crop_layout(content_frame, texture, frame_size, spec)
	else:
		_apply_popup_fit_layout(content_frame, texture, frame_size, popup_data)


func _apply_popup_crop_layout(
	content_frame: PopupContentFrame,
	texture: Texture2D,
	frame_size: Vector2,
	spec: Dictionary
) -> void:
	var texture_size := Vector2(texture.get_width(), texture.get_height())
	if texture_size.x <= 0.0 or texture_size.y <= 0.0:
		return

	var base_scale := maxf(frame_size.x / texture_size.x, frame_size.y / texture_size.y)
	var zoom := clampf(
		float(spec.get("crop_zoom", POPUP_PROFILE_ZOOM_DEFAULT)),
		POPUP_PROFILE_ZOOM_MIN,
		POPUP_PROFILE_ZOOM_MAX
	)
	var image_size := texture_size * base_scale * zoom
	var center := Vector2(spec.get("center", Vector2(0.5, 0.5)))
	var crop_offset := Vector2(spec.get("crop_offset", Vector2.ZERO))
	var anchor := frame_size * 0.5 + Vector2(crop_offset.x * frame_size.x, crop_offset.y * frame_size.y)
	content_frame.set_image_layout(
		anchor - Vector2(center.x * image_size.x, center.y * image_size.y),
		image_size
	)


func _apply_popup_fit_layout(
	content_frame: PopupContentFrame,
	texture: Texture2D,
	frame_size: Vector2,
	popup_data: Dictionary
) -> void:
	var texture_size := Vector2(texture.get_width(), texture.get_height())
	if texture_size.x <= 0.0 or texture_size.y <= 0.0:
		return

	var mode := String(popup_data.get("image_mode", popup_data.get("fit", "fit"))).strip_edges().to_lower()
	var base_scale := minf(frame_size.x / texture_size.x, frame_size.y / texture_size.y)
	if mode == "cover" or mode == "crop":
		base_scale = maxf(frame_size.x / texture_size.x, frame_size.y / texture_size.y)
	var image_zoom := clampf(float(popup_data.get("image_zoom", 1.0)), POPUP_IMAGE_ZOOM_MIN, POPUP_IMAGE_ZOOM_MAX)
	var image_size := texture_size * base_scale * image_zoom
	var image_offset := _parse_popup_offset(popup_data.get("image_offset", Vector2.ZERO))
	var anchor := frame_size * 0.5 + Vector2(image_offset.x * frame_size.x, image_offset.y * frame_size.y)
	content_frame.set_image_layout(anchor - image_size * 0.5, image_size)


func _resolve_popup_image_spec(popup_data: Dictionary, default_character_id: String = "") -> Dictionary:
	var source := _normalize_popup_source(popup_data)
	if source == "item":
		var item_id := String(popup_data.get("item_id", popup_data.get("target_id", ""))).strip_edges()
		var item := VisualNovelData.get_item(StringName(item_id))
		var item_path := String(item.get("image", popup_data.get("path", ""))).strip_edges()
		return _build_popup_texture_spec(item_path, false)
	if source == "image":
		return _build_popup_texture_spec(String(popup_data.get("path", popup_data.get("image", ""))).strip_edges(), false)

	var character_id := String(
		popup_data.get("character_id", popup_data.get("target_id", default_character_id))
	).strip_edges()
	var portrait_key := String(popup_data.get("portrait", "")).strip_edges()
	return _resolve_character_profile_popup_spec(character_id, portrait_key)


func _normalize_popup_source(popup_data: Dictionary) -> String:
	var source := String(popup_data.get("source", popup_data.get("kind", ""))).strip_edges().to_lower()
	if source.is_empty():
		if String(popup_data.get("path", popup_data.get("image", ""))).strip_edges().is_empty():
			return "character_profile"
		return "image"
	if source in ["character", "profile", "character_profile", "portrait_profile"]:
		return "character_profile"
	if source in ["item", "item_image"]:
		return "item"
	if source in ["image", "path", "direct"]:
		return "image"
	return source


func _build_popup_texture_spec(path: String, crop: bool) -> Dictionary:
	if path.is_empty():
		return {}
	var texture := _load_portrait_texture(path)
	if texture == null:
		return {}
	return {
		"path": path,
		"texture": texture,
		"crop": crop,
	}


func _resolve_character_profile_popup_spec(character_id: String, portrait_key: String = "") -> Dictionary:
	if character_id.is_empty() or _is_narrator_speaker(character_id):
		return {}
	var character_profile := VisualNovelData.get_character(StringName(character_id))
	if character_profile.is_empty():
		return {}

	var character_profile_settings := _read_dictionary_field(character_profile, "profile")
	var resolved_portrait_key := portrait_key
	if resolved_portrait_key.is_empty():
		resolved_portrait_key = String(character_profile_settings.get("portrait", "")).strip_edges()
	if resolved_portrait_key.is_empty():
		resolved_portrait_key = _get_default_profile_portrait_key(character_profile)
	if resolved_portrait_key.is_empty():
		return {}

	var portrait_entry := PortraitLayout.resolve_portrait_entry(character_profile, resolved_portrait_key)
	if portrait_entry.is_empty():
		return {}

	var path := String(portrait_entry.get("path", "")).strip_edges()
	var texture := _load_portrait_texture(path)
	if texture == null:
		return {}

	var raw_portrait_entry: Variant = _get_raw_portrait_entry(character_profile, resolved_portrait_key)
	var portrait_profile_settings := _read_dictionary_field(raw_portrait_entry, "profile")
	var center: Vector2 = portrait_entry.get("center", Vector2(0.5, 0.5))
	if portrait_profile_settings.has("center"):
		center = PortraitLayout.parse_face_center(portrait_profile_settings.get("center"))

	return {
		"path": path,
		"texture": texture,
		"crop": true,
		"center": center,
		"crop_zoom": _resolve_profile_zoom(portrait_profile_settings, character_profile_settings),
		"crop_offset": _resolve_profile_offset(portrait_profile_settings, character_profile_settings),
		"portrait": resolved_portrait_key,
		"character_id": character_id,
	}


func _get_default_profile_portrait_key(character_profile: Dictionary) -> String:
	var portraits: Dictionary = character_profile.get("portraits", {})
	if portraits.has("default"):
		return "default"
	var keys := portraits.keys()
	keys.sort()
	for raw_key in keys:
		var key := String(raw_key)
		if not PortraitLayout.resolve_portrait_entry(character_profile, key).is_empty():
			return key
	return ""


func _get_raw_portrait_entry(character_profile: Dictionary, portrait_key: String) -> Variant:
	var portraits: Dictionary = character_profile.get("portraits", {})
	return portraits.get(portrait_key, {})


func _read_dictionary_field(source: Variant, field_name: String) -> Dictionary:
	if typeof(source) != TYPE_DICTIONARY:
		return {}
	var data: Dictionary = source
	var raw_value: Variant = data.get(field_name, {})
	if typeof(raw_value) != TYPE_DICTIONARY:
		return {}
	return raw_value


func _resolve_profile_zoom(portrait_profile: Dictionary, character_profile: Dictionary) -> float:
	var raw_zoom: Variant = portrait_profile.get("zoom", character_profile.get("zoom", POPUP_PROFILE_ZOOM_DEFAULT))
	return clampf(float(raw_zoom), POPUP_PROFILE_ZOOM_MIN, POPUP_PROFILE_ZOOM_MAX)


func _resolve_profile_offset(portrait_profile: Dictionary, character_profile: Dictionary) -> Vector2:
	if portrait_profile.has("offset"):
		return _parse_popup_offset(portrait_profile.get("offset"))
	return _parse_popup_offset(character_profile.get("offset", Vector2.ZERO))


func _resolve_popup_size(popup_data: Dictionary, viewport_size: Vector2) -> Vector2:
	var base_size := POPUP_DEFAULT_SIZE
	var raw_size: Variant = popup_data.get("size", null)
	if typeof(raw_size) == TYPE_ARRAY:
		var values: Array = raw_size
		if values.size() >= 2:
			base_size = Vector2(float(values[0]), float(values[1]))
	elif typeof(raw_size) == TYPE_DICTIONARY:
		var data: Dictionary = raw_size
		base_size = Vector2(float(data.get("x", data.get("width", base_size.x))), float(data.get("y", data.get("height", base_size.y))))
	elif popup_data.has("width") or popup_data.has("height"):
		base_size = Vector2(float(popup_data.get("width", base_size.x)), float(popup_data.get("height", base_size.y)))

	base_size.x = clampf(base_size.x, POPUP_SIZE_MIN, POPUP_SIZE_MAX)
	base_size.y = clampf(base_size.y, POPUP_SIZE_MIN, POPUP_SIZE_MAX)
	var scale := clampf(float(popup_data.get("scale", 1.0)), POPUP_SCALE_MIN, POPUP_SCALE_MAX)
	var reference_size := Vector2(
		float(PortraitLayout.REFERENCE_VIEWPORT_SIZE.x),
		float(PortraitLayout.REFERENCE_VIEWPORT_SIZE.y)
	)
	var viewport_scale := clampf(minf(viewport_size.x / reference_size.x, viewport_size.y / reference_size.y), 0.62, 1.25)
	return base_size * scale * viewport_scale


func _resolve_popup_anchor(popup_data: Dictionary, viewport_size: Vector2) -> Vector2:
	var position := String(popup_data.get("position", "center")).strip_edges().to_lower()
	var normalized_anchor := Vector2(0.5, 0.36)
	if popup_data.has("anchor"):
		normalized_anchor = _parse_popup_offset(popup_data.get("anchor"))
	elif POPUP_POSITION_PRESETS.has(position):
		normalized_anchor = POPUP_POSITION_PRESETS[position]
	elif position == "custom":
		normalized_anchor = _parse_popup_offset(popup_data.get("anchor", Vector2(0.5, 0.36)))

	var offset := _parse_popup_offset(popup_data.get("offset", Vector2.ZERO))
	return Vector2(
		normalized_anchor.x * viewport_size.x + offset.x * viewport_size.x,
		normalized_anchor.y * viewport_size.y + offset.y * viewport_size.y
	)


func _parse_popup_offset(raw: Variant) -> Vector2:
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
		TYPE_VECTOR2:
			var point: Vector2 = raw
			return Vector2(_round4(point.x), _round4(point.y))
	return Vector2.ZERO


func _resolve_popup_opacity(popup_data: Dictionary) -> float:
	return clampf(float(popup_data.get("opacity", POPUP_DEFAULT_OPACITY)), 0.0, 1.0)


func _round4(value: float) -> float:
	return roundf(value * 10000.0) / 10000.0


func _build_dialogue_spectrum() -> void:
	_dialogue_spectrum = null


func _build_voice_player() -> void:
	_voice_player = AudioStreamPlayer.new()
	_voice_player.name = "DialogueVoicePlayer"
	add_child(_voice_player)


func _build_choice_overlay() -> void:
	_choice_overlay = Control.new()
	_choice_overlay.name = "ChoiceOverlay"
	_choice_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_choice_overlay.clip_contents = true
	add_child(_choice_overlay)

	_choice_list = Control.new()
	_choice_list.name = "ChoiceList"
	_choice_list.visible = false
	_choice_list.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_choice_list.clip_contents = true
	_choice_list.set_anchors_preset(Control.PRESET_FULL_RECT)
	_choice_overlay.add_child(_choice_list)


func _build_dialogue_overlay() -> void:
	_dialogue_overlay = Control.new()
	_dialogue_overlay.name = "DialogueOverlay"
	_dialogue_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_dialogue_overlay)

	var dialogue_panel := PanelContainer.new()
	dialogue_panel.name = "DialoguePanel"
	dialogue_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	dialogue_panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	dialogue_panel.add_theme_stylebox_override("panel", _create_dialogue_panel_style(false))
	_dialogue_overlay.add_child(dialogue_panel)

	_dialogue_border_frame = DialogueBorderFrame.new()
	_dialogue_border_frame.name = "DialogueBorderFrame"
	_dialogue_border_frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_dialogue_border_frame.set_anchors_preset(Control.PRESET_FULL_RECT)
	_dialogue_border_frame.configure(DIALOGUE_BORDER_COLOR, DIALOGUE_BORDER_WIDTH, DIALOGUE_CORNER_RADIUS)
	_dialogue_overlay.add_child(_dialogue_border_frame)

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	margin.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	margin.size_flags_vertical = Control.SIZE_EXPAND_FILL
	margin.add_theme_constant_override("margin_left", DIALOGUE_CONTENT_MARGIN_LEFT)
	margin.add_theme_constant_override("margin_top", DIALOGUE_CONTENT_MARGIN_TOP)
	margin.add_theme_constant_override("margin_right", DIALOGUE_CONTENT_MARGIN_RIGHT)
	margin.add_theme_constant_override("margin_bottom", DIALOGUE_CONTENT_MARGIN_BOTTOM)
	dialogue_panel.add_child(margin)
	_dialogue_content_margin = margin

	var text_layout := VBoxContainer.new()
	text_layout.name = "TextLayout"
	text_layout.mouse_filter = Control.MOUSE_FILTER_IGNORE
	text_layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	text_layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	text_layout.add_theme_constant_override("separation", 12)
	margin.add_child(text_layout)
	_dialogue_text_layout = text_layout

	_speaker_label = Label.new()
	_speaker_label.name = "SpeakerName"
	_speaker_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_speaker_label.text = ""
	_speaker_label.visible = false
	_speaker_label.position = Vector2(SPEAKER_LABEL_LEFT, SPEAKER_LABEL_TOP)
	_speaker_label.add_theme_font_override("font", DialogueTypography.speaker_font())
	_speaker_label.add_theme_font_size_override("font_size", DialogueTypography.speaker_font_size())
	_speaker_label.add_theme_color_override("font_color", DEFAULT_SPEAKER_COLOR)
	_speaker_label.add_theme_color_override("font_outline_color", SPEAKER_LABEL_OUTLINE_COLOR)
	_speaker_label.add_theme_constant_override("outline_size", DialogueTypography.speaker_outline_size())
	_dialogue_overlay.add_child(_speaker_label)

	_statement_connection_hint = HBoxContainer.new()
	_statement_connection_hint.name = "StatementConnectionHint"
	_statement_connection_hint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_statement_connection_hint.visible = false
	_statement_connection_hint.alignment = BoxContainer.ALIGNMENT_END
	_statement_connection_hint.custom_minimum_size.y = STATEMENT_CONNECTION_HINT_MIN_HEIGHT
	_statement_connection_hint.add_theme_constant_override("separation", STATEMENT_CONNECTION_HINT_SEPARATION)
	_dialogue_overlay.add_child(_statement_connection_hint)

	_dialogue_text = RichTextLabel.new()
	_dialogue_text.name = "DialogueText"
	_dialogue_text.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_dialogue_text.clip_contents = false
	_dialogue_text.bbcode_enabled = false
	_dialogue_text.meta_underlined = false
	_dialogue_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_dialogue_text.scroll_active = false
	_dialogue_text.text = ""
	_dialogue_text.add_theme_font_override("normal_font", DialogueTypography.body_font())
	_dialogue_text.add_theme_font_override("bold_font", DialogueTypography.build_font(DialogueTypography.BODY_FONT_PATH, 800))
	_dialogue_text.add_theme_font_size_override("normal_font_size", DialogueTypography.body_font_size())
	_dialogue_text.add_theme_font_size_override("bold_font_size", DialogueTypography.body_font_size())
	_dialogue_text.add_theme_constant_override("line_separation", DialogueTypography.body_line_spacing())
	_dialogue_text.add_theme_color_override("default_color", BODY_TEXT_COLOR)
	_dialogue_text.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_dialogue_text.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_dialogue_text.install_effect(DialogueBlinkEffect.new())
	_dialogue_text.install_effect(DialogueGrowEffect.new())
	_dialogue_text.gui_input.connect(_on_dialogue_text_gui_input)
	_dialogue_text.meta_hover_started.connect(_on_dialogue_meta_hover_started)
	_dialogue_text.meta_hover_ended.connect(_on_dialogue_meta_hover_ended)
	_dialogue_text.meta_clicked.connect(_on_dialogue_meta_clicked)
	_dialogue_text.resized.connect(_on_dialogue_text_resized)
	text_layout.add_child(_dialogue_text)

	_advance_hint_bar = HBoxContainer.new()
	_advance_hint_bar.name = "AdvanceHintBar"
	_advance_hint_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_advance_hint_bar.alignment = BoxContainer.ALIGNMENT_END
	_advance_hint_bar.add_theme_constant_override("separation", 9)
	text_layout.add_child(_advance_hint_bar)

	_advance_hint_icon = TextureRect.new()
	_advance_hint_icon.name = "AdvanceHintIcon"
	_advance_hint_icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_advance_hint_icon.custom_minimum_size = Vector2(INPUT_ADVANCE_ICON_HEIGHT, INPUT_ADVANCE_ICON_HEIGHT)
	_advance_hint_icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_advance_hint_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_advance_hint_icon.visible = false
	_advance_hint_bar.add_child(_advance_hint_icon)

	_advance_hint_label = Label.new()
	_advance_hint_label.name = "AdvanceHintLabel"
	_advance_hint_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_advance_hint_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_advance_hint_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_advance_hint_label.add_theme_font_size_override("font_size", 27)
	_advance_hint_label.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	_advance_hint_bar.add_child(_advance_hint_label)


func _build_skip_indicator() -> void:
	_skip_indicator = Control.new()
	_skip_indicator.name = "SkipHoldIndicator"
	_skip_indicator.visible = false
	_skip_indicator.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_skip_indicator.clip_contents = false
	add_child(_skip_indicator)

	_skip_indicator_label = Label.new()
	_skip_indicator_label.name = "SkipLabel"
	_skip_indicator_label.text = SKIP_INDICATOR_TEXT
	_skip_indicator_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_skip_indicator_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_skip_indicator_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_skip_indicator_label.add_theme_font_size_override("font_size", 27)
	_skip_indicator_label.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	_apply_top_menu_text_outline(_skip_indicator_label)
	_skip_indicator.add_child(_skip_indicator_label)

	_skip_indicator_arrow_icon = TextureRect.new()
	_skip_indicator_arrow_icon.name = "SkipArrows"
	_skip_indicator_arrow_icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_skip_indicator_arrow_icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_skip_indicator_arrow_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_skip_indicator.add_child(_skip_indicator_arrow_icon)

	_apply_skip_indicator_content_layout()


func _build_statement_navigation() -> void:
	_statement_prev_button = _create_statement_arrow_button("StatementPreviousButton", "")
	_statement_next_button = _create_statement_arrow_button("StatementNextButton", "")
	_statement_prev_button.pressed.connect(_on_statement_previous_button_pressed)
	_statement_next_button.pressed.connect(_on_statement_next_button_pressed)
	add_child(_statement_prev_button)
	add_child(_statement_next_button)

	_statement_phrase_selection_frame = _create_statement_phrase_selection_frame("StatementPhraseSelectionFrame")
	_statement_phrase_selection_frames.append(_statement_phrase_selection_frame)
	_dialogue_text.add_child(_statement_phrase_selection_frame)
	_refresh_statement_controls()


func _create_statement_phrase_selection_frame(node_name: String) -> PanelContainer:
	var frame := PanelContainer.new()
	frame.name = node_name
	frame.visible = false
	frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
	frame.show_behind_parent = true
	_apply_statement_phrase_selection_frame_theme(frame)
	return frame


func _apply_statement_phrase_selection_frame_theme(frame: PanelContainer) -> void:
	if frame == null:
		return

	var frame_style := StyleBoxFlat.new()
	var opacity := STATEMENT_PRESENT_SELECTION_OPACITY if _statement_connection_mode_active else 1.0
	frame_style.bg_color = Color(
		_statement_phrase_selection_color.r,
		_statement_phrase_selection_color.g,
		_statement_phrase_selection_color.b,
		0.13 * opacity
	)
	frame_style.border_color = Color(
		_statement_phrase_selection_color.r,
		_statement_phrase_selection_color.g,
		_statement_phrase_selection_color.b,
		0.95 * opacity
	)
	frame_style.set_border_width_all(STATEMENT_LIE_SELECTION_BORDER_WIDTH)
	frame_style.set_corner_radius_all(4)
	frame.add_theme_stylebox_override("panel", frame_style)


func _create_statement_arrow_button(node_name: String, text: String) -> Button:
	var button := Button.new()
	button.name = node_name
	button.text = text
	button.visible = false
	button.focus_mode = Control.FOCUS_NONE
	button.mouse_default_cursor_shape = Control.CURSOR_ARROW
	button.custom_minimum_size = STATEMENT_ARROW_BUTTON_SIZE
	button.expand_icon = false
	button.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
	button.alignment = HORIZONTAL_ALIGNMENT_CENTER
	button.add_theme_font_size_override("font_size", 64)
	button.add_theme_color_override("font_color", BODY_TEXT_COLOR)
	button.add_theme_color_override("font_hover_color", DEFAULT_SPEAKER_COLOR)
	button.add_theme_color_override("font_pressed_color", DEFAULT_SPEAKER_COLOR)
	button.add_theme_color_override("font_disabled_color", BODY_TEXT_COLOR)
	button.add_theme_constant_override("h_separation", 0)
	button.add_theme_constant_override("icon_max_width", 0)

	var normal := _create_statement_arrow_style(DIALOGUE_PANEL_COLOR)
	var hover := _create_statement_arrow_style(DIALOGUE_PANEL_COLOR.lerp(DEFAULT_SPEAKER_COLOR, 0.08))
	var pressed := _create_statement_arrow_style(DIALOGUE_PANEL_COLOR.lerp(Color.BLACK, 0.16))
	button.add_theme_stylebox_override("normal", normal)
	button.add_theme_stylebox_override("focus", hover)
	button.add_theme_stylebox_override("hover", hover)
	button.add_theme_stylebox_override("pressed", pressed)
	button.add_theme_stylebox_override("disabled", normal)
	return button


func _create_statement_arrow_style(background: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = background
	style.border_color = DIALOGUE_BORDER_COLOR
	style.set_border_width_all(int(DIALOGUE_BORDER_WIDTH))
	style.set_corner_radius_all(int(DIALOGUE_CORNER_RADIUS))
	return style


func _build_statement_notebook_overlay() -> void:
	_statement_notebook_overlay = Control.new()
	_statement_notebook_overlay.name = "StatementNotebookOverlay"
	_statement_notebook_overlay.visible = false
	_statement_notebook_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	_statement_notebook_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_statement_notebook_overlay)

	var scrim := ColorRect.new()
	scrim.name = "Scrim"
	scrim.color = STATEMENT_NOTE_OVERLAY_COLOR
	scrim.mouse_filter = Control.MOUSE_FILTER_STOP
	scrim.set_anchors_preset(Control.PRESET_FULL_RECT)
	_statement_notebook_overlay.add_child(scrim)

	var panel := PanelContainer.new()
	panel.name = "NotebookPanel"
	panel.mouse_filter = Control.MOUSE_FILTER_STOP
	panel.custom_minimum_size = Vector2(STATEMENT_NOTE_PANEL_MIN_WIDTH, 0)
	panel.add_theme_stylebox_override("panel", _create_statement_notebook_panel_style())
	_statement_notebook_overlay.add_child(panel)

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.add_theme_constant_override("margin_left", STATEMENT_NOTE_PANEL_CONTENT_MARGIN_LEFT)
	margin.add_theme_constant_override("margin_top", 10)
	margin.add_theme_constant_override("margin_right", 28)
	margin.add_theme_constant_override("margin_bottom", 18)
	panel.add_child(margin)

	var body := HBoxContainer.new()
	body.name = "NotebookBody"
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_theme_constant_override("separation", STATEMENT_NOTE_RAIL_GAP)
	margin.add_child(body)

	var rail := StatementNotebookRail.new()
	rail.name = "NotebookRail"
	rail.custom_minimum_size = Vector2(STATEMENT_NOTE_RAIL_WIDTH, 0)
	rail.size_flags_vertical = Control.SIZE_EXPAND_FILL
	rail.mouse_filter = Control.MOUSE_FILTER_IGNORE
	rail.configure(STATEMENT_NOTE_BORDER_COLOR, STATEMENT_NOTE_MUTED_COLOR)
	body.add_child(rail)
	_statement_notebook_rail = rail

	var layout := VBoxContainer.new()
	layout.name = "NotebookLayout"
	layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_theme_constant_override("separation", 14)
	body.add_child(layout)

	var header := HBoxContainer.new()
	header.name = "Header"
	header.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_theme_constant_override("separation", 16)
	layout.add_child(header)

	var title_row := HBoxContainer.new()
	title_row.name = "TitleRow"
	title_row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	title_row.alignment = BoxContainer.ALIGNMENT_BEGIN
	title_row.add_theme_constant_override("separation", 12)
	header.add_child(title_row)

	var title := Label.new()
	title.name = "Title"
	title.text = "수사노트"
	title.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 38)
	title.add_theme_color_override("font_color", STATEMENT_NOTE_TEXT_COLOR)
	title_row.add_child(title)

	var caption_offset := MarginContainer.new()
	caption_offset.name = "CaptionOffset"
	caption_offset.mouse_filter = Control.MOUSE_FILTER_IGNORE
	caption_offset.size_flags_vertical = Control.SIZE_SHRINK_END
	caption_offset.add_theme_constant_override("margin_bottom", STATEMENT_NOTE_CAPTION_LIFT)
	title_row.add_child(caption_offset)

	var caption := Label.new()
	caption.name = "Caption"
	caption.text = "CASE NOTEBOOK"
	caption.vertical_alignment = VERTICAL_ALIGNMENT_BOTTOM
	caption.add_theme_font_size_override("font_size", 13)
	caption.add_theme_color_override("font_color", STATEMENT_NOTE_MUTED_COLOR)
	caption_offset.add_child(caption)

	var input_hint := HBoxContainer.new()
	input_hint.name = "InputHint"
	input_hint.visible = false
	input_hint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	input_hint.alignment = BoxContainer.ALIGNMENT_END
	input_hint.custom_minimum_size.y = STATEMENT_CONNECTION_HINT_MIN_HEIGHT
	input_hint.add_theme_constant_override("separation", STATEMENT_CONNECTION_HINT_SEPARATION)
	header.add_child(input_hint)
	_statement_notebook_input_hint = input_hint

	var close_button := Button.new()
	close_button.name = "CloseButton"
	close_button.text = ""
	close_button.icon = _get_mui_icon("CloseRounded", 26, STATEMENT_NOTE_TEXT_COLOR)
	if close_button.icon == null:
		close_button.text = "×"
	close_button.alignment = HORIZONTAL_ALIGNMENT_CENTER
	close_button.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
	close_button.expand_icon = false
	close_button.custom_minimum_size = Vector2(40, 40)
	close_button.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	close_button.focus_mode = Control.FOCUS_NONE
	close_button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	close_button.add_theme_constant_override("h_separation", 0)
	close_button.add_theme_constant_override("icon_max_width", 26)
	_apply_statement_notebook_close_button_theme(close_button)
	close_button.pressed.connect(_close_statement_notebook)
	_statement_notebook_close_button = close_button
	header.add_child(close_button)

	var rule := ColorRect.new()
	rule.name = "HeaderRule"
	rule.color = STATEMENT_NOTE_BORDER_COLOR
	rule.custom_minimum_size = Vector2(0, 1)
	rule.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	layout.add_child(rule)

	var columns := GridContainer.new()
	columns.name = "NotebookColumns"
	columns.columns = 2
	columns.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	columns.size_flags_vertical = Control.SIZE_EXPAND_FILL
	columns.add_theme_constant_override("h_separation", 24)
	columns.add_theme_constant_override("v_separation", 16)
	_statement_notebook_columns = columns
	layout.add_child(columns)

	var character_column: Dictionary = _create_statement_notebook_column("CharacterColumn", "인물목록", "명")
	columns.add_child(character_column["root"] as Control)
	_statement_notebook_character_scroll = character_column["scroll"] as ScrollContainer
	_statement_notebook_character_list = character_column["list"] as VBoxContainer
	_statement_notebook_character_count_label = character_column["count_label"] as Label

	var item_column: Dictionary = _create_statement_notebook_column("ItemColumn", "자료목록", "건")
	columns.add_child(item_column["root"] as Control)
	_statement_notebook_item_scroll = item_column["scroll"] as ScrollContainer
	_statement_notebook_item_list = item_column["list"] as VBoxContainer
	_statement_notebook_item_count_label = item_column["count_label"] as Label


func _create_statement_notebook_column(node_name: String, title_text: String, count_unit: String) -> Dictionary:
	var column := VBoxContainer.new()
	column.name = node_name
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	column.size_flags_vertical = Control.SIZE_EXPAND_FILL
	column.add_theme_constant_override("separation", 12)

	var header := HBoxContainer.new()
	header.name = "Header"
	header.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_theme_constant_override("separation", 10)
	column.add_child(header)

	var title := Label.new()
	title.name = "Title"
	title.text = "%s›" % title_text
	title.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 24)
	title.add_theme_color_override("font_color", STATEMENT_NOTE_TEXT_COLOR)
	header.add_child(title)

	var count_label := Label.new()
	count_label.name = "Count"
	count_label.text = "0 %s" % count_unit
	count_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	count_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	count_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	count_label.add_theme_font_size_override("font_size", 18)
	count_label.add_theme_color_override("font_color", STATEMENT_NOTE_MUTED_COLOR)
	header.add_child(count_label)

	var scroll := ScrollContainer.new()
	scroll.name = "Scroll"
	scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.follow_focus = true
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.mouse_filter = Control.MOUSE_FILTER_STOP
	scroll.add_theme_constant_override("scrollbar_spacing", STATEMENT_NOTE_SCROLLBAR_SPACING)
	column.add_child(scroll)

	var scroll_content_margin := MarginContainer.new()
	scroll_content_margin.name = "ScrollContentMargin"
	scroll_content_margin.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll_content_margin.add_theme_constant_override("margin_right", 0)
	scroll.add_child(scroll_content_margin)

	var list := VBoxContainer.new()
	list.name = "List"
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	list.add_theme_constant_override("separation", 10)
	scroll_content_margin.add_child(list)

	return {
		"root": column,
		"scroll": scroll,
		"list": list,
		"count_label": count_label,
	}


func _queue_statement_notebook_scroll_padding_update() -> void:
	if _statement_notebook_overlay == null:
		return
	call_deferred("_apply_statement_notebook_scroll_padding")
	call_deferred("_apply_statement_notebook_scroll_padding_after_layout")


func _apply_statement_notebook_scroll_padding_after_layout() -> void:
	if not is_inside_tree():
		return
	await get_tree().process_frame
	_apply_statement_notebook_scroll_padding()
	await get_tree().process_frame
	_apply_statement_notebook_scroll_padding()


func _apply_statement_notebook_scroll_padding() -> void:
	_apply_statement_notebook_scroll_padding_for(_statement_notebook_character_scroll)
	_apply_statement_notebook_scroll_padding_for(_statement_notebook_item_scroll)


func _apply_statement_notebook_scroll_padding_for(scroll: ScrollContainer) -> void:
	if scroll == null or not is_instance_valid(scroll):
		return

	var content_margin := scroll.get_node_or_null("ScrollContentMargin") as MarginContainer
	if content_margin == null:
		return

	var list := content_margin.get_node_or_null("List") as VBoxContainer
	var content_height := content_margin.get_combined_minimum_size().y
	if list != null:
		content_height = list.get_combined_minimum_size().y

	var has_scroll := scroll.size.y > 0.0 and content_height > scroll.size.y + 0.5
	var scroll_bar := scroll.get_v_scroll_bar()
	if scroll_bar != null:
		has_scroll = has_scroll or scroll_bar.visible or scroll_bar.max_value > scroll_bar.page + 0.5

	content_margin.add_theme_constant_override(
		"margin_right",
		STATEMENT_NOTE_SCROLLBAR_CONTENT_PADDING if has_scroll else 0
	)


func _create_statement_notebook_panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = STATEMENT_NOTE_PANEL_COLOR
	style.border_color = STATEMENT_NOTE_BORDER_COLOR
	style.set_border_width_all(int(DIALOGUE_BORDER_WIDTH))
	style.set_corner_radius_all(int(DIALOGUE_CORNER_RADIUS))
	style.shadow_color = Color(0, 0, 0, 0.36)
	style.shadow_size = 15
	return style


func _apply_statement_notebook_close_button_theme(button: Button) -> void:
	button.flat = true
	var clear_style := _create_statement_notebook_ghost_style(Color(0, 0, 0, 0), Color(1, 1, 1, 0.0))
	button.add_theme_stylebox_override("normal", clear_style)
	button.add_theme_stylebox_override("hover", clear_style)
	button.add_theme_stylebox_override("focus", clear_style)
	button.add_theme_stylebox_override("pressed", clear_style)
	button.add_theme_color_override("font_color", STATEMENT_NOTE_TEXT_COLOR)
	button.add_theme_color_override("font_hover_color", STATEMENT_NOTE_ACCENT_COLOR)
	button.add_theme_color_override("font_focus_color", STATEMENT_NOTE_ACCENT_COLOR)
	button.add_theme_color_override("font_pressed_color", STATEMENT_NOTE_ACCENT_COLOR)


func _create_statement_notebook_ghost_style(background: Color, border: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = background
	style.border_color = border
	style.set_border_width_all(1 if border.a > 0.0 else 0)
	style.set_corner_radius_all(4)
	style.content_margin_left = 0
	style.content_margin_right = 0
	style.content_margin_top = 0
	style.content_margin_bottom = 0
	return style


func _build_statement_loop_prompt_overlay() -> void:
	_statement_loop_prompt_overlay = Control.new()
	_statement_loop_prompt_overlay.name = "StatementLoopPromptOverlay"
	_statement_loop_prompt_overlay.visible = false
	_statement_loop_prompt_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(_statement_loop_prompt_overlay)

	var center := CenterContainer.new()
	center.name = "Center"
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	_statement_loop_prompt_overlay.add_child(center)

	var panel := PanelContainer.new()
	panel.name = "PromptPanel"
	panel.custom_minimum_size = Vector2(STATEMENT_LOOP_PROMPT_PANEL_WIDTH, 0.0)
	panel.add_theme_stylebox_override("panel", _create_dialogue_panel_style())
	center.add_child(panel)

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.add_theme_constant_override("margin_left", 30)
	margin.add_theme_constant_override("margin_top", 27)
	margin.add_theme_constant_override("margin_right", 30)
	margin.add_theme_constant_override("margin_bottom", 27)
	panel.add_child(margin)

	var layout := VBoxContainer.new()
	layout.name = "PromptLayout"
	layout.add_theme_constant_override("separation", 21)
	margin.add_child(layout)

	var label := Label.new()
	label.name = "PromptText"
	label.text = STATEMENT_LOOP_PROMPT_TEXT
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.add_theme_font_size_override("font_size", 28)
	label.add_theme_color_override("font_color", BODY_TEXT_COLOR)
	layout.add_child(label)

	var actions := HBoxContainer.new()
	actions.name = "Actions"
	actions.alignment = BoxContainer.ALIGNMENT_CENTER
	actions.add_theme_constant_override("separation", 18)
	layout.add_child(actions)

	_statement_loop_prompt_yes_button = _create_statement_loop_prompt_button("YesButton", "예")
	_statement_loop_prompt_no_button = _create_statement_loop_prompt_button("NoButton", "아니오")
	_statement_loop_prompt_yes_button.pressed.connect(_on_statement_loop_prompt_yes_pressed)
	_statement_loop_prompt_no_button.pressed.connect(_on_statement_loop_prompt_no_pressed)
	actions.add_child(_statement_loop_prompt_yes_button)
	actions.add_child(_statement_loop_prompt_no_button)


func _create_statement_loop_prompt_button(node_name: String, text: String) -> Button:
	var button := Button.new()
	button.name = node_name
	button.text = text
	button.custom_minimum_size = STATEMENT_LOOP_PROMPT_BUTTON_SIZE
	button.alignment = HORIZONTAL_ALIGNMENT_CENTER
	button.add_theme_font_size_override("font_size", 28)
	return button


func _build_statement_title_overlay() -> void:
	_statement_title_overlay = Control.new()
	_statement_title_overlay.name = "StatementTitleOverlay"
	_statement_title_overlay.visible = false
	_statement_title_overlay.modulate.a = 0.0
	_statement_title_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	_statement_title_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_statement_title_overlay)

	var dim := ColorRect.new()
	dim.name = "Dim"
	dim.color = Color(0, 0, 0, 1)
	dim.mouse_filter = Control.MOUSE_FILTER_IGNORE
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	_statement_title_overlay.add_child(dim)

	var center := CenterContainer.new()
	center.name = "Center"
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	_statement_title_overlay.add_child(center)

	var layout := VBoxContainer.new()
	layout.name = "TitleGroup"
	layout.visible = false
	layout.alignment = BoxContainer.ALIGNMENT_CENTER
	layout.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layout.add_theme_constant_override("separation", 12)
	center.add_child(layout)
	_statement_title_group = layout

	_statement_title_caption = Label.new()
	_statement_title_caption.name = "Caption"
	_statement_title_caption.text = "- 진술 시작 -"
	_statement_title_caption.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_statement_title_caption.add_theme_font_size_override("font_size", 22)
	_statement_title_caption.add_theme_color_override("font_color", Color(0.7, 0.95, 0.92, 0.82))
	layout.add_child(_statement_title_caption)

	_statement_title_label = Label.new()
	_statement_title_label.name = "Title"
	_statement_title_label.text = "진술"
	_statement_title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_statement_title_label.add_theme_font_size_override("font_size", 58)
	_statement_title_label.add_theme_color_override("font_color", Color(1.0, 0.34, 0.62))
	layout.add_child(_statement_title_label)


func _sync_fixed_overlay_layout() -> void:
	_apply_fullscreen_overlay_layout(_effect_layer)
	_apply_fullscreen_overlay_layout(_portrait_viewport)
	_apply_popup_layouts()
	_sync_grid_background()
	_apply_fixed_overlay_layout(_choice_overlay)
	_sync_choice_layout()
	_apply_dialogue_overlay_layout()
	_apply_statement_navigation_layout()
	_apply_statement_notebook_layout()
	_apply_fixed_overlay_layout(_statement_loop_prompt_overlay)
	_apply_viewport_overlay_layout(_statement_title_overlay)
	_apply_viewport_overlay_layout(_menu_overlay)
	_layout_menu_overlay_panel(true)
	_apply_skip_indicator_layout()
	_apply_floating_ui_layout()


func _apply_fullscreen_overlay_layout(node: Control) -> void:
	if node == null:
		return

	node.set_anchors_preset(Control.PRESET_FULL_RECT)
	node.offset_left = 0.0
	node.offset_top = 0.0
	node.offset_right = 0.0
	node.offset_bottom = 0.0


func _apply_viewport_overlay_layout(node: Control) -> void:
	if node == null:
		return

	var viewport_rect := _get_viewport_local_rect()
	node.set_anchors_preset(Control.PRESET_TOP_LEFT)
	node.offset_left = viewport_rect.position.x
	node.offset_top = viewport_rect.position.y
	node.offset_right = viewport_rect.position.x + viewport_rect.size.x
	node.offset_bottom = viewport_rect.position.y + viewport_rect.size.y


func _get_viewport_local_rect() -> Rect2:
	var viewport_size := get_viewport().get_visible_rect().size
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		viewport_size = Vector2(PortraitLayout.REFERENCE_VIEWPORT_SIZE)
	# Viewport overlays may need a negative local origin if a parent container offsets this screen.
	return Rect2(-global_position, viewport_size)


func _get_layout_viewport_size() -> Vector2:
	if size.x > 0.0 and size.y > 0.0:
		return size
	return Vector2(PortraitLayout.REFERENCE_VIEWPORT_SIZE)


func _get_dialogue_panel_layout() -> Dictionary:
	return DialoguePanelLayout.resolve(_get_layout_viewport_size())


func _get_dialogue_reserved_bottom() -> float:
	return DialoguePanelLayout.reserved_bottom(_get_layout_viewport_size(), LAYOUT_SEPARATION)


func _apply_fixed_overlay_layout(node: Control) -> void:
	if node == null:
		return

	var reserved_bottom := _get_dialogue_reserved_bottom()
	node.set_anchors_preset(Control.PRESET_FULL_RECT)
	node.offset_left = 0.0
	node.offset_top = 0.0
	node.offset_right = 0.0
	node.offset_bottom = -reserved_bottom


func _apply_dialogue_overlay_layout() -> void:
	if _dialogue_overlay == null:
		return

	var panel_layout := _get_dialogue_panel_layout()
	var statement_side_reserve := _get_statement_dialogue_side_reserve(panel_layout)
	var outer_bottom_margin := float(panel_layout.get("bottom_margin", 0.0))
	_dialogue_overlay.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	_dialogue_overlay.offset_left = float(panel_layout.get("offset_left", 0.0)) + statement_side_reserve
	_dialogue_overlay.offset_top = -float(panel_layout.get("height", DialoguePanelLayout.BASE_MIN_HEIGHT)) - outer_bottom_margin
	_dialogue_overlay.offset_right = float(panel_layout.get("offset_right", 0.0)) - statement_side_reserve
	_dialogue_overlay.offset_bottom = -outer_bottom_margin
	_apply_dialogue_scale(panel_layout)
	_apply_skip_indicator_layout()
	_sync_speaker_label_layout()
	_apply_statement_connection_hint_layout()
	if _is_statement_main_node_active():
		_set_statement_phrase_selection_visible(false)
		_queue_statement_phrase_selection_frame_update()


func _apply_skip_indicator_layout() -> void:
	if _skip_indicator == null:
		return

	_apply_skip_indicator_content_layout()
	var panel_layout := _get_dialogue_panel_layout()
	var viewport_size := _get_layout_viewport_size()
	var statement_side_reserve := _get_statement_dialogue_side_reserve(panel_layout)
	var panel_right := viewport_size.x + float(panel_layout.get("offset_right", 0.0)) - statement_side_reserve
	var horizontal_spacing_scale := _get_dialogue_horizontal_spacing_scale()
	var bottom_spacing_scale := _get_dialogue_bottom_spacing_scale()
	var right_margin := float(_scaled_int(DIALOGUE_CONTENT_MARGIN_RIGHT, horizontal_spacing_scale))
	var content_bottom_margin := float(_scaled_int(DIALOGUE_CONTENT_MARGIN_BOTTOM, bottom_spacing_scale))
	var outer_bottom_margin := float(panel_layout.get("bottom_margin", 0.0))
	_skip_indicator.position = Vector2(
		roundf(panel_right - right_margin - _skip_indicator.size.x + SKIP_INDICATOR_POSITION_OFFSET_X * horizontal_spacing_scale),
		roundf(viewport_size.y - outer_bottom_margin - content_bottom_margin - _skip_indicator.size.y + SKIP_INDICATOR_POSITION_OFFSET_Y * bottom_spacing_scale)
	)


func _apply_skip_indicator_content_layout() -> void:
	if _skip_indicator == null or _skip_indicator_label == null or _skip_indicator_arrow_icon == null:
		return

	var previous_arrow_base_x := _skip_indicator_arrow_base_x
	var was_animating := _skip_indicator_arrow_tween != null and _skip_indicator_arrow_tween.is_valid()

	var scale := _get_dialogue_horizontal_spacing_scale()
	var label_width := roundf(SKIP_INDICATOR_LABEL_WIDTH * scale)
	var label_offset_x := roundf(SKIP_INDICATOR_LABEL_OFFSET_X * scale)
	var label_offset_y := roundf(SKIP_INDICATOR_LABEL_OFFSET_Y * scale)
	var icon_gap := roundf(SKIP_INDICATOR_ICON_GAP * scale)
	var font_size := _scaled_int(27, scale)
	var icon_height := _scaled_int(SKIP_INDICATOR_ICON_HEIGHT, scale)
	var icon_texture := _get_mui_icon(SKIP_INDICATOR_ICON, icon_height, MUTED_TEXT_COLOR)
	var icon_size := Vector2(icon_height, icon_height)
	if icon_texture != null:
		icon_size = Vector2(icon_texture.get_width(), icon_texture.get_height())
	_skip_indicator_label.add_theme_font_size_override("font_size", font_size)
	var indicator_size := Vector2(
		label_offset_x + label_width + icon_gap + icon_size.x + roundf(SKIP_INDICATOR_ARROW_TRAVEL * scale),
		maxf(_skip_indicator_label.get_combined_minimum_size().y, icon_size.y)
	)
	_skip_indicator.size = indicator_size
	_skip_indicator_label.position = Vector2(label_offset_x, label_offset_y)
	_skip_indicator_label.size = Vector2(label_width, maxf(indicator_size.y - label_offset_y, 0.0))
	_skip_indicator_arrow_base_x = label_offset_x + label_width + icon_gap
	_skip_indicator_arrow_icon.texture = icon_texture
	_skip_indicator_arrow_icon.size = icon_size
	var icon_y := roundf((indicator_size.y - icon_size.y) * 0.5)
	if was_animating:
		_skip_indicator_arrow_icon.position.y = icon_y
	else:
		_skip_indicator_arrow_icon.position = Vector2(_skip_indicator_arrow_base_x, icon_y)

	if was_animating and not is_equal_approx(previous_arrow_base_x, _skip_indicator_arrow_base_x):
		_stop_skip_indicator_arrow_tween()
		_ensure_skip_indicator_arrow_tween()
	elif not was_animating:
		_skip_indicator_arrow_icon.position.x = _skip_indicator_arrow_base_x


func _get_statement_dialogue_side_reserve(panel_layout: Dictionary) -> float:
	if not _uses_statement_dialogue_window():
		return 0.0

	var panel_width := float(panel_layout.get("width", _get_layout_viewport_size().x))
	var max_side_reserve := maxf(0.0, (panel_width - STATEMENT_DIALOGUE_MIN_CENTER_WIDTH) * 0.5)
	return minf(STATEMENT_ARROW_BUTTON_SIZE.x + STATEMENT_ARROW_SIDE_GAP, max_side_reserve)


func _apply_statement_navigation_layout() -> void:
	if _statement_prev_button == null or _statement_next_button == null:
		return

	var panel_layout := _get_dialogue_panel_layout()
	var viewport_size := _get_layout_viewport_size()
	var statement_side_reserve := _get_statement_dialogue_side_reserve(panel_layout)
	var panel_left := float(panel_layout.get("offset_left", 0.0))
	var panel_right := viewport_size.x + float(panel_layout.get("offset_right", 0.0))
	var outer_bottom_margin := float(panel_layout.get("bottom_margin", 0.0))
	var panel_top := viewport_size.y - outer_bottom_margin - float(panel_layout.get("height", DialoguePanelLayout.BASE_MIN_HEIGHT))
	var panel_height := float(panel_layout.get("height", DialoguePanelLayout.BASE_MIN_HEIGHT))
	var button_width := minf(STATEMENT_ARROW_BUTTON_SIZE.x, statement_side_reserve)
	var button_size := Vector2(button_width, panel_height)
	var button_y := panel_top
	_statement_prev_button.size = button_size
	_statement_next_button.size = button_size
	_statement_prev_button.position = Vector2(
		panel_left,
		button_y
	)
	_statement_next_button.position = Vector2(
		panel_right - button_size.x,
		button_y
	)


func _apply_statement_notebook_layout() -> void:
	if _statement_notebook_overlay == null:
		return

	_apply_viewport_overlay_layout(_statement_notebook_overlay)
	var panel := _statement_notebook_overlay.get_node_or_null("NotebookPanel") as Control
	if panel == null:
		return

	var viewport_size := _statement_notebook_overlay.size
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		viewport_size = get_viewport().get_visible_rect().size
	var safe_rect := _get_statement_notebook_safe_rect(viewport_size)
	var panel_width := minf(STATEMENT_NOTE_PANEL_WIDTH, safe_rect.size.x)
	var panel_height := maxf(1.0, safe_rect.size.y)
	panel.size = Vector2(panel_width, panel_height)
	panel.position = _get_statement_notebook_panel_final_position(panel.size)
	if _statement_notebook_columns != null:
		var previous_columns := _statement_notebook_columns.columns
		_statement_notebook_columns.columns = 1 if panel_width < STATEMENT_NOTE_SINGLE_COLUMN_WIDTH else 2
		if previous_columns != _statement_notebook_columns.columns and not _statement_notebook_focus_entries.is_empty():
			_configure_statement_notebook_focus_navigation()
	_queue_statement_notebook_rail_sync()
	_queue_statement_notebook_scroll_padding_update()


func _queue_statement_notebook_rail_sync() -> void:
	if _statement_notebook_overlay == null:
		return
	call_deferred("_sync_statement_notebook_rail_metrics")
	call_deferred("_sync_statement_notebook_rail_metrics_after_layout")


func _sync_statement_notebook_rail_metrics_after_layout() -> void:
	if not is_inside_tree():
		return
	await get_tree().process_frame
	_sync_statement_notebook_rail_metrics()


func _sync_statement_notebook_rail_metrics() -> void:
	if _statement_notebook_overlay == null or _statement_notebook_rail == null:
		return
	if not is_instance_valid(_statement_notebook_rail):
		return

	var rail_rect := _statement_notebook_rail.get_global_rect()
	if rail_rect.size.x <= 0.0 or rail_rect.size.y <= 0.0:
		return

	var header_center_y := STATEMENT_NOTE_RAIL_HEADER_CENTER_Y
	var title_row := _statement_notebook_overlay.get_node_or_null("NotebookPanel/Margin/NotebookBody/NotebookLayout/Header/TitleRow") as Control
	if title_row != null:
		var title_rect := title_row.get_global_rect()
		if title_rect.size.y > 0.0:
			header_center_y = title_rect.position.y + title_rect.size.y * 0.5 - rail_rect.position.y

	var first_tick_y := STATEMENT_NOTE_RAIL_RULE_Y
	var header_rule := _statement_notebook_overlay.get_node_or_null("NotebookPanel/Margin/NotebookBody/NotebookLayout/HeaderRule") as Control
	if header_rule != null:
		var rule_rect := header_rule.get_global_rect()
		if rule_rect.size.y > 0.0:
			first_tick_y = rule_rect.position.y + rule_rect.size.y * 0.5 - rail_rect.position.y

	_statement_notebook_rail.set_markers(header_center_y, first_tick_y)


func _get_statement_notebook_safe_rect(viewport_size: Vector2) -> Rect2:
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		viewport_size = get_viewport().get_visible_rect().size
	var panel_layout := _get_dialogue_panel_layout()
	var dialogue_top_limit := maxf(1.0, viewport_size.y - _get_dialogue_reserved_bottom())
	var top := minf(_get_statement_notebook_top_limit(), maxf(0.0, dialogue_top_limit - 1.0))
	var right := _get_statement_notebook_next_button_right_edge(viewport_size, panel_layout)
	var center_offset := viewport_size.x * 0.5 + _get_statement_dialogue_side_reserve(panel_layout) * STATEMENT_NOTE_CENTER_OFFSET_SCALE
	var left := clampf(center_offset, 0.0, maxf(0.0, right - 1.0))
	return Rect2(Vector2(left, top), Vector2(right - left, maxf(1.0, dialogue_top_limit - top)))


func _get_statement_notebook_top_limit() -> float:
	return maxf(STATEMENT_NOTE_PANEL_MARGIN.y, _get_statement_notebook_menu_bottom() + LAYOUT_SEPARATION)


func _get_statement_notebook_menu_bottom() -> float:
	var menu_height := TOP_MENU_TEXT_MIN_SIZE.y
	if _top_menu_bar != null:
		var minimum_size := _top_menu_bar.get_combined_minimum_size()
		menu_height = maxf(menu_height, maxf(_top_menu_bar.size.y, minimum_size.y))
	return FLOATING_MENU_MARGIN.y + menu_height


func _get_statement_notebook_next_button_right_edge(viewport_size: Vector2, panel_layout: Dictionary) -> float:
	var panel_right := viewport_size.x + float(panel_layout.get("offset_right", 0.0))
	return clampf(panel_right, viewport_size.x * 0.5 + 1.0, viewport_size.x)


func _get_statement_notebook_panel_final_position(panel_size: Vector2) -> Vector2:
	var viewport_size := _statement_notebook_overlay.size if _statement_notebook_overlay != null else _get_layout_viewport_size()
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		viewport_size = get_viewport().get_visible_rect().size
	var safe_rect := _get_statement_notebook_safe_rect(viewport_size)
	var right := safe_rect.position.x + safe_rect.size.x
	return Vector2(right - panel_size.x, safe_rect.position.y)


func _get_statement_notebook_panel_enter_position(panel_size: Vector2) -> Vector2:
	var final_position := _get_statement_notebook_panel_final_position(panel_size)
	var viewport_size := _statement_notebook_overlay.size if _statement_notebook_overlay != null else _get_layout_viewport_size()
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		viewport_size = get_viewport().get_visible_rect().size
	var safe_rect := _get_statement_notebook_safe_rect(viewport_size)
	return Vector2(safe_rect.position.x + safe_rect.size.x + 24.0, final_position.y)


func _apply_dialogue_scale(panel_layout: Dictionary) -> void:
	var tall_factor := clampf(float(panel_layout.get("tall_factor", 0.0)), 0.0, 1.0)
	_dialogue_tall_factor = tall_factor
	var horizontal_spacing_scale := _get_dialogue_horizontal_spacing_scale()
	var left_spacing_scale := lerpf(
		1.0,
		float(DIALOGUE_CONTENT_MARGIN_LEFT_UNFOLDED) / float(DIALOGUE_CONTENT_MARGIN_LEFT),
		tall_factor
	)
	var top_spacing_scale := lerpf(
		1.0,
		float(DIALOGUE_CONTENT_MARGIN_TOP_UNFOLDED) / float(DIALOGUE_CONTENT_MARGIN_TOP),
		tall_factor
	)
	var bottom_spacing_scale := _get_dialogue_bottom_spacing_scale()
	var text_spacing_scale := lerpf(1.0, 1.42, tall_factor)

	if _dialogue_content_margin != null:
		_dialogue_content_margin.add_theme_constant_override("margin_left", _scaled_int(DIALOGUE_CONTENT_MARGIN_LEFT, left_spacing_scale))
		_dialogue_content_margin.add_theme_constant_override("margin_top", _scaled_int(DIALOGUE_CONTENT_MARGIN_TOP, top_spacing_scale))
		_dialogue_content_margin.add_theme_constant_override("margin_right", _scaled_int(DIALOGUE_CONTENT_MARGIN_RIGHT, horizontal_spacing_scale))
		_dialogue_content_margin.add_theme_constant_override("margin_bottom", _scaled_int(DIALOGUE_CONTENT_MARGIN_BOTTOM, bottom_spacing_scale))

	if _dialogue_text_layout != null:
		_dialogue_text_layout.add_theme_constant_override("separation", _scaled_int(12, text_spacing_scale))

	if _speaker_label != null:
		_speaker_label.add_theme_font_size_override("font_size", DialogueTypography.speaker_font_size_for_layout(panel_layout))
		_speaker_label.add_theme_constant_override("outline_size", DialogueTypography.speaker_outline_size_for_layout(panel_layout))

	if _dialogue_text != null:
		var body_font_size := DialogueTypography.body_font_size_for_layout(panel_layout)
		_dialogue_text.add_theme_font_size_override("normal_font_size", body_font_size)
		_dialogue_text.add_theme_font_size_override("bold_font_size", body_font_size)
		_dialogue_text.add_theme_constant_override("line_separation", DialogueTypography.body_line_spacing_for_layout(panel_layout))

	if _advance_hint_label != null:
		_advance_hint_label.add_theme_font_size_override("font_size", _scaled_int(27, horizontal_spacing_scale))

	if _advance_hint_icon != null:
		var icon_size := float(_scaled_int(INPUT_ADVANCE_ICON_HEIGHT, horizontal_spacing_scale))
		_advance_hint_icon.custom_minimum_size = Vector2(icon_size, icon_size)

	if _statement_connection_hint != null:
		_apply_statement_connection_hint_font_size(
			_scaled_int(STATEMENT_CONNECTION_HINT_FONT_SIZE, horizontal_spacing_scale)
		)


func _get_dialogue_horizontal_spacing_scale() -> float:
	return lerpf(1.0, 1.16, _dialogue_tall_factor)


func _get_dialogue_bottom_spacing_scale() -> float:
	return lerpf(1.0, 1.28, _dialogue_tall_factor)


func _scaled_int(base_value: int, scale: float) -> int:
	return int(roundf(float(base_value) * scale))


func _get_speaker_label_top() -> float:
	return lerpf(SPEAKER_LABEL_TOP, SPEAKER_LABEL_TOP_UNFOLDED, _dialogue_tall_factor)


func _apply_statement_connection_hint_layout() -> void:
	if _statement_connection_hint == null:
		return

	var hint_size := _statement_connection_hint.get_combined_minimum_size()
	hint_size.x = maxf(hint_size.x, 1.0)
	hint_size.y = maxf(hint_size.y, STATEMENT_CONNECTION_HINT_MIN_HEIGHT)
	_statement_connection_hint.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	_statement_connection_hint.offset_left = -hint_size.x - STATEMENT_CONNECTION_HINT_MARGIN.x
	_statement_connection_hint.offset_top = -hint_size.y - STATEMENT_CONNECTION_HINT_MARGIN.y
	_statement_connection_hint.offset_right = -STATEMENT_CONNECTION_HINT_MARGIN.x
	_statement_connection_hint.offset_bottom = -STATEMENT_CONNECTION_HINT_MARGIN.y


func _apply_statement_connection_hint_font_size(font_size: int) -> void:
	if _statement_connection_hint == null:
		return

	for child in _statement_connection_hint.get_children():
		if child is Label:
			(child as Label).add_theme_font_size_override("font_size", font_size)


func _get_portrait_viewport_size() -> Vector2:
	if _portrait_viewport != null and _portrait_viewport.size.x > 0.0 and _portrait_viewport.size.y > 0.0:
		return _portrait_viewport.size

	var screen_size := _get_layout_viewport_size()
	var reserved_bottom := _get_dialogue_reserved_bottom()
	return Vector2(screen_size.x, maxf(0.0, screen_size.y - reserved_bottom))


func _get_portrait_horizontal_safe_area() -> Rect2:
	var screen_size := _get_layout_viewport_size()
	var panel_layout := _get_dialogue_panel_layout()
	return Rect2(
		Vector2(float(panel_layout.get("offset_left", 0.0)), 0.0),
		Vector2(float(panel_layout.get("width", screen_size.x)), screen_size.y)
	)


func _get_stage_baseline_face_position() -> Vector2:
	return PortraitLayout.compute_face_position(
		_get_layout_viewport_size(),
		Vector2.ZERO,
		_get_portrait_horizontal_safe_area()
	)


func _get_stage_parallax_metrics() -> Dictionary:
	var baseline_position := _get_stage_baseline_face_position()
	var samples := _collect_stage_parallax_samples()
	if samples.is_empty():
		var viewport_size := _get_layout_viewport_size()
		return {
			"enabled": false,
			"cast_count": 0,
			"focus_face_position": baseline_position,
			"focus_zoom_percent": float(PortraitLayout.ZOOM_DEFAULT),
			"grid_zoom_percent": float(PortraitLayout.ZOOM_DEFAULT),
			"baseline_face_position": baseline_position,
			"spread_ratio": 0.0,
			"zoom_pivot_position": viewport_size * 0.5,
		}

	var focus_position := _compute_stage_parallax_focus_position(samples)
	var focus_zoom_percent := _compute_stage_parallax_focus_zoom(samples)
	var spread_ratio := _compute_stage_parallax_spread_ratio(samples, focus_position)
	return {
		"enabled": true,
		"cast_count": samples.size(),
		"focus_face_position": focus_position,
		"focus_zoom_percent": focus_zoom_percent,
		"grid_zoom_percent": _compute_stage_parallax_grid_zoom(samples, focus_zoom_percent, spread_ratio),
		"baseline_face_position": baseline_position,
		"spread_ratio": spread_ratio,
		"zoom_pivot_position": _get_stage_zoom_pivot_position(),
	}


func _collect_stage_parallax_samples() -> Array[Dictionary]:
	var samples: Array[Dictionary] = []
	var viewport_size := _get_layout_viewport_size()
	var safe_area := _get_portrait_horizontal_safe_area()

	for speaker_id in _stage_characters.keys():
		var cast_id := String(speaker_id)
		if cast_id.is_empty() or _is_narrator_speaker(cast_id):
			continue

		var sample := _build_stage_parallax_sample(cast_id, viewport_size, safe_area)
		if not sample.is_empty():
			samples.append(sample)

	return samples


func _build_stage_parallax_sample(cast_id: String, viewport_size: Vector2, safe_area: Rect2) -> Dictionary:
	var state := _get_stage_parallax_state(cast_id)
	if state.is_empty() or not bool(state.get("visible", false)):
		return {}

	var slot := _get_character_slot(cast_id)
	var weight := _get_stage_parallax_weight(cast_id, slot, state)
	if weight <= 0.0:
		return {}

	var layout_offset := Vector2(state.get("layout_offset", Vector2.ZERO))
	var zoom_percent := float(state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT))
	return {
		"speaker_id": cast_id,
		"position": PortraitLayout.compute_zoom_anchor_position(
			viewport_size,
			layout_offset,
			zoom_percent,
			safe_area
		),
		"zoom_percent": zoom_percent,
		"grid_zoom_percent": zoom_percent,
		"weight": weight,
		"active": cast_id == _stage_speaker_id and not _is_narrator_speaker(cast_id),
	}


func _get_stage_parallax_state(cast_id: String) -> Dictionary:
	var slot := _get_character_slot(cast_id)
	var target_state: Dictionary = slot.get("parallax_target_state", {})
	if not target_state.is_empty() and bool(target_state.get("visible", false)):
		return target_state

	var state: Dictionary = slot.get("state", {})
	if not state.is_empty() and bool(state.get("visible", false)):
		return state

	if cast_id == _stage_speaker_id and not _portrait_state.is_empty() and bool(_portrait_state.get("visible", false)):
		return _portrait_state

	return {}


func _get_stage_parallax_weight(cast_id: String, slot: Dictionary, state: Dictionary) -> float:
	var role_weight := STAGE_PARALLAX_BYSTANDER_WEIGHT
	if cast_id == _stage_speaker_id and not _is_narrator_speaker(cast_id):
		role_weight = STAGE_PARALLAX_ACTIVE_WEIGHT

	var target_opacity := clampf(
		float(slot.get("parallax_target_opacity", slot.get("portrait_opacity", _resolve_cast_opacity_for_node(cast_id)))),
		0.0,
		1.0
	)
	if not slot.has("parallax_target_opacity") and slot.has("portrait_opacity"):
		target_opacity = maxf(target_opacity, clampf(float(slot["portrait_opacity"]), 0.0, 1.0))

	var zoom_ratio := clampf(
		float(state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT)) / float(PortraitLayout.ZOOM_DEFAULT),
		0.55,
		1.35
	)
	return role_weight * lerpf(STAGE_PARALLAX_OPACITY_FLOOR, 1.0, target_opacity) * zoom_ratio


func _collect_stage_face_positions() -> Array[Vector2]:
	var positions: Array[Vector2] = []
	var viewport_size := _get_layout_viewport_size()
	var safe_area := _get_portrait_horizontal_safe_area()

	for speaker_id in _stage_characters.keys():
		var cast_id := String(speaker_id)
		if cast_id.is_empty() or _is_narrator_speaker(cast_id):
			continue

		var state := _get_stage_parallax_state(cast_id)
		if state.is_empty() or not bool(state.get("visible", false)):
			continue

		var layout_offset := Vector2(state.get("layout_offset", Vector2.ZERO))
		var zoom_percent := float(state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT))
		positions.append(PortraitLayout.compute_zoom_anchor_position(
			viewport_size,
			layout_offset,
			zoom_percent,
			safe_area
		))

	return positions


func _get_stage_zoom_pivot_position() -> Vector2:
	var viewport_size := _get_layout_viewport_size()
	var positions := _collect_stage_face_positions()
	if positions.is_empty():
		return viewport_size * 0.5

	var centroid := Vector2.ZERO
	for face_position in positions:
		centroid += face_position
	return centroid / float(positions.size())


func _compute_portrait_display_rect(state: Dictionary) -> Rect2:
	return PortraitTransition.compute_rect(
		_get_portrait_viewport_size(),
		state,
		_get_portrait_horizontal_safe_area()
	)


func _compute_stage_parallax_focus_position(samples: Array[Dictionary]) -> Vector2:
	var group_position := _compute_stage_parallax_weighted_position(samples)
	var active_position := Vector2.ZERO
	var active_weight := 0.0

	for sample in samples:
		if not bool(sample.get("active", false)):
			continue
		var weight := float(sample.get("weight", 0.0))
		active_position += Vector2(sample.get("position", Vector2.ZERO)) * weight
		active_weight += weight

	if active_weight <= 0.0:
		return group_position

	active_position /= active_weight
	var active_pull := 1.0 if samples.size() <= 1 else STAGE_PARALLAX_ACTIVE_PULL_MULTI
	return group_position.lerp(active_position, active_pull)


func _compute_stage_parallax_weighted_position(samples: Array[Dictionary]) -> Vector2:
	var weighted_position := Vector2.ZERO
	var total_weight := 0.0

	for sample in samples:
		var weight := float(sample.get("weight", 0.0))
		weighted_position += Vector2(sample.get("position", Vector2.ZERO)) * weight
		total_weight += weight

	if total_weight <= 0.0:
		return _get_stage_baseline_face_position()
	return weighted_position / total_weight


func _compute_stage_parallax_focus_zoom(samples: Array[Dictionary]) -> float:
	var weighted_zoom := _compute_stage_parallax_weighted_zoom(samples)
	var active_zoom := 0.0
	var active_weight := 0.0

	for sample in samples:
		if not bool(sample.get("active", false)):
			continue
		var weight := float(sample.get("weight", 0.0))
		active_zoom += float(sample.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT)) * weight
		active_weight += weight

	if active_weight <= 0.0:
		return weighted_zoom

	active_zoom /= active_weight
	var active_pull := 1.0 if samples.size() <= 1 else STAGE_PARALLAX_ACTIVE_PULL_MULTI
	return lerpf(weighted_zoom, active_zoom, active_pull)


func _compute_stage_parallax_weighted_zoom(samples: Array[Dictionary]) -> float:
	var weighted_zoom := 0.0
	var total_weight := 0.0

	for sample in samples:
		var weight := float(sample.get("weight", 0.0))
		weighted_zoom += float(sample.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT)) * weight
		total_weight += weight

	if total_weight <= 0.0:
		return float(PortraitLayout.ZOOM_MIN)
	return weighted_zoom / total_weight


func _compute_stage_parallax_grid_focus_zoom(samples: Array[Dictionary]) -> float:
	var weighted_zoom := _compute_stage_parallax_weighted_grid_zoom(samples)
	var active_zoom := 0.0
	var active_weight := 0.0

	for sample in samples:
		if not bool(sample.get("active", false)):
			continue
		var weight := float(sample.get("weight", 0.0))
		active_zoom += float(sample.get("grid_zoom_percent", PortraitLayout.ZOOM_DEFAULT)) * weight
		active_weight += weight

	if active_weight <= 0.0:
		return weighted_zoom

	active_zoom /= active_weight
	var active_pull := 1.0 if samples.size() <= 1 else STAGE_PARALLAX_ACTIVE_PULL_MULTI
	return lerpf(weighted_zoom, active_zoom, active_pull)


func _compute_stage_parallax_weighted_grid_zoom(samples: Array[Dictionary]) -> float:
	var weighted_zoom := 0.0
	var total_weight := 0.0

	for sample in samples:
		var weight := float(sample.get("weight", 0.0))
		weighted_zoom += float(sample.get("grid_zoom_percent", PortraitLayout.ZOOM_DEFAULT)) * weight
		total_weight += weight

	if total_weight <= 0.0:
		return float(PortraitLayout.ZOOM_MIN)
	return weighted_zoom / total_weight


func _compute_stage_parallax_grid_zoom(
	samples: Array[Dictionary],
	_focus_zoom_percent: float,
	spread_ratio: float
) -> float:
	var grid_focus_zoom := _compute_stage_parallax_grid_focus_zoom(samples)
	var min_zoom := grid_focus_zoom
	for sample in samples:
		min_zoom = minf(min_zoom, float(sample.get("grid_zoom_percent", PortraitLayout.ZOOM_DEFAULT)))

	var spread_blend := clampf(spread_ratio * STAGE_PARALLAX_GRID_ZOOM_SPREAD_BLEND, 0.0, 0.45)
	return clampf(
		lerpf(grid_focus_zoom, min_zoom, spread_blend),
		float(PortraitLayout.ZOOM_MIN),
		float(PortraitLayout.ZOOM_MAX)
	)


func _compute_stage_parallax_spread_ratio(samples: Array[Dictionary], focus_position: Vector2) -> float:
	if samples.size() <= 1:
		return 0.0

	var viewport_size := _get_layout_viewport_size()
	if viewport_size.x <= 1.0:
		return 0.0

	var weighted_distance := 0.0
	var total_weight := 0.0

	for sample in samples:
		var weight := float(sample.get("weight", 0.0))
		var position := Vector2(sample.get("position", Vector2.ZERO))
		weighted_distance += absf(position.x - focus_position.x) * weight
		total_weight += weight

	if total_weight <= 0.0:
		return 0.0
	return clampf((weighted_distance / total_weight) / viewport_size.x, 0.0, 1.0)


func _get_story_grid_background() -> ScrollingGridBackground:
	var main := get_tree().current_scene
	if main == null or not main.has_method("get_story_grid_background"):
		return null
	return main.call("get_story_grid_background")


func _to_viewport_position(local_position: Vector2) -> Vector2:
	return get_global_transform_with_canvas() * local_position


func _sync_grid_background() -> void:
	var grid := _get_story_grid_background()
	if grid == null or not grid.visible:
		return

	var viewport_size := get_viewport().get_visible_rect().size
	var metrics := _get_stage_parallax_metrics()
	grid.sync_stage(
		viewport_size,
		float(metrics.get("grid_zoom_percent", PortraitLayout.ZOOM_MIN)),
		_to_viewport_position(Vector2(metrics.get("focus_face_position", Vector2.ZERO))),
		float(metrics.get("focus_zoom_percent", PortraitLayout.ZOOM_MIN)),
		bool(metrics.get("enabled", false)),
		_to_viewport_position(Vector2(metrics.get("baseline_face_position", Vector2.ZERO))),
		float(metrics.get("spread_ratio", 0.0)),
		int(metrics.get("cast_count", 0)),
		_to_viewport_position(Vector2(metrics.get("zoom_pivot_position", viewport_size * 0.5)))
	)


func _create_choice_button_styles() -> void:
	_choice_button_style_normal = _create_choice_button_style(DIALOGUE_PANEL_COLOR, DIALOGUE_BORDER_COLOR)
	var hover_bg := DIALOGUE_PANEL_COLOR.lerp(DEFAULT_SPEAKER_COLOR, 0.08)
	var hover_border := DIALOGUE_BORDER_COLOR.lerp(DEFAULT_SPEAKER_COLOR, 0.35)
	_choice_button_style_hover = _create_choice_button_style(hover_bg, hover_border)
	var focus_bg := DIALOGUE_PANEL_COLOR.lerp(DEFAULT_SPEAKER_COLOR, 0.12)
	var focus_border := DIALOGUE_BORDER_COLOR.lerp(DEFAULT_SPEAKER_COLOR, 0.58)
	_choice_button_style_focus = _create_choice_button_style(focus_bg, focus_border)
	var pressed_bg := DIALOGUE_PANEL_COLOR.darkened(0.04)
	_choice_button_style_pressed = _create_choice_button_style(pressed_bg, DIALOGUE_BORDER_COLOR)
	_refresh_statement_loop_prompt_button_styles()


func _create_choice_button_style(bg_color: Color, border_color: Color, visual_scale := 1.0) -> StyleBoxFlat:
	var resolved_scale := clampf(visual_scale, CHOICE_DIALOGUE_WIDTH_MIN_SCALE, 1.0)
	var style := StyleBoxFlat.new()
	style.bg_color = bg_color
	style.border_color = border_color
	style.set_border_width_all(maxi(1, int(roundf(float(CHOICE_BUTTON_BORDER_WIDTH) * resolved_scale))))
	style.set_corner_radius_all(maxi(4, int(roundf(float(CHOICE_BUTTON_CORNER_RADIUS) * resolved_scale))))
	style.content_margin_left = maxf(8.0, float(CHOICE_BUTTON_CONTENT_MARGIN_X) * resolved_scale)
	style.content_margin_right = maxf(8.0, float(CHOICE_BUTTON_CONTENT_MARGIN_X) * resolved_scale)
	style.content_margin_top = maxf(4.0, float(CHOICE_BUTTON_CONTENT_MARGIN_Y) * resolved_scale)
	style.content_margin_bottom = maxf(4.0, float(CHOICE_BUTTON_CONTENT_MARGIN_Y) * resolved_scale)
	style.draw_center = true
	return style


func _apply_choice_button_theme(button: Button, visual_scale := 1.0) -> void:
	var use_cached_styles := is_equal_approx(clampf(visual_scale, CHOICE_DIALOGUE_WIDTH_MIN_SCALE, 1.0), 1.0)
	button.flat = false
	button.focus_mode = Control.FOCUS_ALL
	if use_cached_styles:
		button.add_theme_stylebox_override("normal", _choice_button_style_normal)
		button.add_theme_stylebox_override("hover", _choice_button_style_hover)
		button.add_theme_stylebox_override("pressed", _choice_button_style_pressed)
		button.add_theme_stylebox_override("focus", _choice_button_style_focus)
		button.add_theme_stylebox_override("disabled", _choice_button_style_normal)
	else:
		var hover_bg := DIALOGUE_PANEL_COLOR.lerp(DEFAULT_SPEAKER_COLOR, 0.08)
		var hover_border := DIALOGUE_BORDER_COLOR.lerp(DEFAULT_SPEAKER_COLOR, 0.45)
		var focus_bg := DIALOGUE_PANEL_COLOR.lerp(DEFAULT_SPEAKER_COLOR, 0.12)
		var focus_border := DIALOGUE_BORDER_COLOR.lerp(DEFAULT_SPEAKER_COLOR, 0.58)
		var pressed_bg := DIALOGUE_PANEL_COLOR.darkened(0.04)
		button.add_theme_stylebox_override("normal", _create_choice_button_style(DIALOGUE_PANEL_COLOR, DIALOGUE_BORDER_COLOR, visual_scale))
		button.add_theme_stylebox_override("hover", _create_choice_button_style(hover_bg, hover_border, visual_scale))
		button.add_theme_stylebox_override("pressed", _create_choice_button_style(pressed_bg, DIALOGUE_BORDER_COLOR, visual_scale))
		button.add_theme_stylebox_override("focus", _create_choice_button_style(focus_bg, focus_border, visual_scale))
		button.add_theme_stylebox_override("disabled", _create_choice_button_style(DIALOGUE_PANEL_COLOR, DIALOGUE_BORDER_COLOR, visual_scale))
	button.alignment = HORIZONTAL_ALIGNMENT_CENTER
	button.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	button.add_theme_font_size_override("font_size", CHOICE_FONT_SIZE)
	button.add_theme_color_override("font_color", BODY_TEXT_COLOR)
	button.add_theme_color_override("font_hover_color", DEFAULT_SPEAKER_COLOR)
	button.add_theme_color_override("font_focus_color", DEFAULT_SPEAKER_COLOR)
	button.add_theme_color_override("font_pressed_color", DEFAULT_SPEAKER_COLOR)


func _apply_choice_button_scale(button: Button, speaker_scale: float) -> void:
	var resolved_scale := speaker_scale
	if resolved_scale <= 0.0:
		resolved_scale = _get_choice_speaker_scale()
	var resolution_scale := _get_choice_resolution_scale(_get_choice_stage_size())
	button.add_theme_font_size_override(
		"font_size",
		maxi(CHOICE_FONT_MIN_SIZE, int(roundf(float(CHOICE_FONT_SIZE) * resolved_scale * resolution_scale)))
	)


func _apply_choice_button_alignment(button: Button, _choice_count: int, _character_side: String) -> void:
	button.alignment = HORIZONTAL_ALIGNMENT_CENTER


func _refresh_statement_loop_prompt_button_styles() -> void:
	for button in [_statement_loop_prompt_yes_button, _statement_loop_prompt_no_button]:
		if button == null:
			continue
		_apply_choice_button_theme(button)
		button.alignment = HORIZONTAL_ALIGNMENT_CENTER
		button.add_theme_font_size_override("font_size", 28)


func _build_floating_menu() -> void:
	_floating_ui_canvas = CanvasLayer.new()
	_floating_ui_canvas.name = "FloatingUICanvas"
	_floating_ui_canvas.layer = 1
	add_child(_floating_ui_canvas)

	_floating_ui_layer = Control.new()
	_floating_ui_layer.name = "FloatingUILayer"
	_floating_ui_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_floating_ui_canvas.add_child(_floating_ui_layer)

	_top_menu_bar = HBoxContainer.new()
	_top_menu_bar.name = "DialogueMenuBar"
	_top_menu_bar.mouse_filter = Control.MOUSE_FILTER_STOP
	_top_menu_bar.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	_top_menu_bar.alignment = BoxContainer.ALIGNMENT_END
	_top_menu_bar.add_theme_constant_override("separation", int(TOP_MENU_BAR_SEPARATION["default"]))
	_floating_ui_layer.add_child(_top_menu_bar)

	_skip_button = _add_top_menu_button(_top_menu_bar, "SkipButton", "Skip", "skip")
	_add_menu_separator(_top_menu_bar)
	_backlog_button = _add_top_menu_button(_top_menu_bar, "BacklogButton", "Log", "log")
	_add_menu_separator(_top_menu_bar)
	_branch_tree_button = _add_top_menu_button(_top_menu_bar, "BranchTreeButton", "Tree", "tree")
	_add_menu_separator(_top_menu_bar)
	_menu_button = _add_top_menu_button(_top_menu_bar, "MenuButton", "Menu", "menu")


func _apply_floating_ui_layout() -> void:
	if _floating_ui_layer == null:
		return

	var viewport_size := get_viewport().get_visible_rect().size
	_floating_ui_layer.set_anchors_preset(Control.PRESET_TOP_LEFT)
	_floating_ui_layer.offset_left = 0.0
	_floating_ui_layer.offset_top = 0.0
	_floating_ui_layer.offset_right = viewport_size.x
	_floating_ui_layer.offset_bottom = viewport_size.y

	if _top_menu_bar != null:
		_top_menu_bar.set_anchors_preset(Control.PRESET_TOP_RIGHT)
		_top_menu_bar.offset_left = 0.0
		_top_menu_bar.offset_top = FLOATING_MENU_MARGIN.y
		_top_menu_bar.offset_right = -FLOATING_MENU_MARGIN.x
		_top_menu_bar.offset_bottom = 0.0


func _set_floating_ui_visible(visible: bool, animated: bool = false) -> void:
	if visible and _overlay_obscured:
		visible = false

	if _floating_ui_canvas == null:
		return

	if _floating_ui_layer == null:
		_floating_ui_canvas.visible = visible
		return

	_stop_floating_ui_tween()

	var target_alpha := 1.0 if visible else 0.0
	if not animated:
		_floating_ui_canvas.visible = visible
		_floating_ui_layer.modulate.a = target_alpha
		return

	if visible:
		_floating_ui_canvas.visible = true
	elif not _floating_ui_canvas.visible:
		_floating_ui_layer.modulate.a = target_alpha
		return

	if is_equal_approx(_floating_ui_layer.modulate.a, target_alpha):
		if not visible:
			_floating_ui_canvas.visible = false
		return

	var tween := create_tween()
	_floating_ui_tween = tween
	tween.set_ease(Tween.EASE_OUT if visible else Tween.EASE_IN)
	tween.set_trans(Tween.TRANS_SINE)
	tween.tween_property(_floating_ui_layer, "modulate:a", target_alpha, FLOATING_UI_FADE_DURATION)
	tween.finished.connect(func() -> void:
		if _floating_ui_tween == tween:
			_floating_ui_tween = null
		_floating_ui_layer.modulate.a = target_alpha
		if not visible:
			_floating_ui_canvas.visible = false
	, CONNECT_ONE_SHOT)


func _stop_floating_ui_tween() -> void:
	if _floating_ui_tween != null and _floating_ui_tween.is_valid():
		_floating_ui_tween.kill()
	_floating_ui_tween = null


func _apply_top_menu_text_outline(node: Control) -> void:
	node.add_theme_color_override("font_outline_color", TOP_MENU_TEXT_OUTLINE_COLOR)
	node.add_theme_constant_override("outline_size", TOP_MENU_TEXT_OUTLINE_SIZE)


func _add_top_menu_button(parent: HBoxContainer, node_name: String, text: String, action: String) -> Button:
	var button := Button.new()
	button.name = node_name
	button.text = text
	button.flat = true
	button.alignment = HORIZONTAL_ALIGNMENT_CENTER
	button.focus_mode = Control.FOCUS_NONE
	button.custom_minimum_size = TOP_MENU_TEXT_MIN_SIZE
	button.expand_icon = false
	button.icon_alignment = HORIZONTAL_ALIGNMENT_LEFT
	button.add_theme_font_size_override("font_size", 24)
	button.add_theme_color_override("font_color", BODY_TEXT_COLOR)
	button.add_theme_color_override("font_hover_color", DEFAULT_SPEAKER_COLOR)
	button.add_theme_color_override("font_pressed_color", DEFAULT_SPEAKER_COLOR)
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	_apply_top_menu_text_outline(button)
	button.add_theme_constant_override("h_separation", 6)
	button.add_theme_constant_override("icon_max_width", 0)
	_add_keyboard_menu_hint_content(button)
	parent.add_child(button)
	_top_menu_buttons[action] = button
	return button


func _add_keyboard_menu_hint_content(button: Button) -> void:
	var center := CenterContainer.new()
	center.name = "KeyboardHintContent"
	center.visible = false
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	button.add_child(center)

	var layout := HBoxContainer.new()
	layout.name = "Layout"
	layout.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layout.alignment = BoxContainer.ALIGNMENT_CENTER
	layout.add_theme_constant_override("separation", TOP_MENU_KEYBOARD_HINT_SEPARATION)
	center.add_child(layout)

	var label := Label.new()
	label.name = "BaseLabel"
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 24)
	label.add_theme_color_override("font_color", BODY_TEXT_COLOR)
	_apply_top_menu_text_outline(label)
	layout.add_child(label)

	var keycap_offset := MarginContainer.new()
	keycap_offset.name = "KeycapOffset"
	keycap_offset.mouse_filter = Control.MOUSE_FILTER_IGNORE
	keycap_offset.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	keycap_offset.add_theme_constant_override("margin_top", TOP_MENU_KEYCAP_Y_OFFSET)
	layout.add_child(keycap_offset)

	var keycap := PanelContainer.new()
	keycap.name = "Keycap"
	keycap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	keycap.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	keycap.add_theme_stylebox_override("panel", _create_keycap_style())
	keycap_offset.add_child(keycap)

	var key_margin := MarginContainer.new()
	key_margin.name = "Margin"
	key_margin.add_theme_constant_override("margin_left", TOP_MENU_KEYCAP_MARGIN_HORIZONTAL)
	key_margin.add_theme_constant_override("margin_top", TOP_MENU_KEYCAP_MARGIN_VERTICAL)
	key_margin.add_theme_constant_override("margin_right", TOP_MENU_KEYCAP_MARGIN_HORIZONTAL)
	key_margin.add_theme_constant_override("margin_bottom", TOP_MENU_KEYCAP_MARGIN_VERTICAL)
	keycap.add_child(key_margin)

	var key_label := Label.new()
	key_label.name = "KeyLabel"
	key_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	key_label.add_theme_font_size_override("font_size", TOP_MENU_KEYCAP_FONT_SIZE)
	key_label.add_theme_constant_override("line_spacing", TOP_MENU_KEYCAP_LINE_SPACING)
	key_label.add_theme_color_override("font_color", DEFAULT_SPEAKER_COLOR)
	_apply_top_menu_text_outline(key_label)
	key_margin.add_child(key_label)


func _create_keycap_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = KEYCAP_BACKGROUND_COLOR
	style.border_color = KEYCAP_BORDER_COLOR
	style.set_border_width_all(2)
	style.set_corner_radius_all(TOP_MENU_KEYCAP_CORNER_RADIUS)
	return style


func _create_top_menu_button_stylebox(background_color: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = background_color
	style.set_corner_radius_all(TOP_MENU_GHOST_CORNER_RADIUS)
	style.set_content_margin(SIDE_LEFT, int(TOP_MENU_BUTTON_CONTENT_MARGIN.x))
	style.set_content_margin(SIDE_RIGHT, int(TOP_MENU_BUTTON_CONTENT_MARGIN.x))
	style.set_content_margin(SIDE_TOP, int(TOP_MENU_BUTTON_CONTENT_MARGIN.y))
	style.set_content_margin(SIDE_BOTTOM, int(TOP_MENU_BUTTON_CONTENT_MARGIN.y))
	return style


func _should_use_top_menu_ghost_hover() -> bool:
	return is_pointer_hover_enabled()


func _apply_top_menu_button_style(button: Button) -> void:
	var use_ghost_hover := _should_use_top_menu_ghost_hover()
	button.flat = not use_ghost_hover

	var normal_style := _create_top_menu_button_stylebox(Color(0, 0, 0, 0))
	button.add_theme_stylebox_override("normal", normal_style)
	button.add_theme_stylebox_override("focus", normal_style)
	button.add_theme_stylebox_override("disabled", normal_style)

	if use_ghost_hover:
		button.add_theme_stylebox_override("hover", _create_top_menu_button_stylebox(TOP_MENU_GHOST_HOVER_COLOR))
		button.add_theme_stylebox_override("pressed", _create_top_menu_button_stylebox(TOP_MENU_GHOST_PRESSED_COLOR))
	else:
		button.add_theme_stylebox_override("hover", normal_style)
		button.add_theme_stylebox_override("pressed", normal_style)


func _apply_skip_button_hold_visual(available: bool) -> void:
	if _skip_button == null:
		return

	var active := available and _skip_hold_requested
	if active:
		var active_style := _create_top_menu_button_stylebox(SKIP_BUTTON_ACTIVE_COLOR)
		_skip_button.flat = false
		_skip_button.add_theme_stylebox_override("normal", active_style)
		_skip_button.add_theme_stylebox_override("hover", active_style)
		_skip_button.add_theme_stylebox_override("pressed", active_style)
		_skip_button.add_theme_stylebox_override("focus", active_style)
		_apply_menu_button_text_color(_skip_button, DEFAULT_SPEAKER_COLOR, DEFAULT_SPEAKER_COLOR)
	else:
		_apply_top_menu_button_style(_skip_button)
		_apply_menu_button_text_color(_skip_button, BODY_TEXT_COLOR, DEFAULT_SPEAKER_COLOR)


func _apply_menu_button_text_color(button: Button, base_color: Color, key_color: Color) -> void:
	button.add_theme_color_override("font_color", base_color)
	button.add_theme_color_override("font_hover_color", DEFAULT_SPEAKER_COLOR)
	button.add_theme_color_override("font_pressed_color", DEFAULT_SPEAKER_COLOR)

	var content := button.get_node_or_null("KeyboardHintContent") as Control
	if content == null:
		return

	var base_label := content.get_node_or_null("Layout/BaseLabel") as Label
	if base_label != null:
		base_label.add_theme_color_override("font_color", base_color)

	var key_label := content.get_node_or_null("Layout/KeycapOffset/Keycap/Margin/KeyLabel") as Label
	if key_label != null:
		key_label.add_theme_color_override("font_color", key_color)


func _add_menu_separator(parent: HBoxContainer) -> void:
	var wrapper := MarginContainer.new()
	wrapper.mouse_filter = Control.MOUSE_FILTER_IGNORE
	wrapper.add_theme_constant_override("margin_left", int(TOP_MENU_SEPARATOR_MARGIN["default"]))
	wrapper.add_theme_constant_override("margin_right", int(TOP_MENU_SEPARATOR_MARGIN["default"]))
	parent.add_child(wrapper)
	_top_menu_separators.append(wrapper)

	var separator := Label.new()
	separator.text = "|"
	separator.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	separator.add_theme_font_size_override("font_size", 24)
	separator.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	_apply_top_menu_text_outline(separator)
	wrapper.add_child(separator)


func _build_menu_overlay() -> void:
	_menu_overlay = Control.new()
	_menu_overlay.name = "StoryMenuOverlay"
	_menu_overlay.visible = false
	_menu_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	_menu_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_menu_overlay)

	_menu_scrim = ColorRect.new()
	_menu_scrim.name = "Scrim"
	_menu_scrim.color = MENU_OVERLAY_COLOR
	_menu_scrim.mouse_filter = Control.MOUSE_FILTER_STOP
	_menu_scrim.set_anchors_preset(Control.PRESET_FULL_RECT)
	_menu_overlay.add_child(_menu_scrim)

	_menu_panel = PanelContainer.new()
	_menu_panel.name = "MenuPanel"
	_menu_panel.clip_contents = true
	_menu_panel.custom_minimum_size = Vector2(MENU_PANEL_WIDTH, 0)
	_menu_panel.add_theme_stylebox_override("panel", _create_dialogue_panel_style())
	_menu_overlay.add_child(_menu_panel)

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.add_theme_constant_override("margin_left", 33)
	margin.add_theme_constant_override("margin_top", 27)
	margin.add_theme_constant_override("margin_right", 33)
	margin.add_theme_constant_override("margin_bottom", 27)
	_menu_panel.add_child(margin)

	var menu_layout := VBoxContainer.new()
	menu_layout.name = "MenuLayout"
	menu_layout.add_theme_constant_override("separation", 15)
	margin.add_child(menu_layout)

	var title := Label.new()
	title.name = "MenuTitle"
	title.text = "Menu"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 36)
	title.add_theme_color_override("font_color", DEFAULT_SPEAKER_COLOR)
	menu_layout.add_child(title)

	var continue_button := _add_menu_overlay_button(menu_layout, "ContinueButton", "Continue")
	var chapter_button := _add_menu_overlay_button(menu_layout, "ChapterSelectButton", "Chapter Select")
	var title_button := _add_menu_overlay_button(menu_layout, "TitleButton", "Title")
	_menu_continue_button = continue_button
	continue_button.pressed.connect(_hide_menu_overlay)
	chapter_button.pressed.connect(func() -> void:
		_hide_menu_overlay(func() -> void:
			request_screen_change("chapter_select")
		)
	)
	title_button.pressed.connect(func() -> void:
		_hide_menu_overlay(func() -> void:
			request_screen_change("main_title")
		)
	)
	_apply_viewport_overlay_layout(_menu_overlay)
	_layout_menu_overlay_panel(true)


func _add_menu_overlay_button(parent: VBoxContainer, node_name: String, text: String) -> Button:
	var button := Button.new()
	button.name = node_name
	button.text = text
	button.custom_minimum_size = Vector2(0, 69)
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	parent.add_child(button)
	return button


func _layout_menu_overlay_panel(apply_immediate: bool) -> void:
	if _menu_overlay == null or _menu_panel == null:
		return

	var viewport_size := _menu_overlay.size
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		viewport_size = get_viewport().get_visible_rect().size
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		return

	var minimum_size := _menu_panel.get_combined_minimum_size()
	var panel_width := minf(
		MENU_PANEL_WIDTH,
		maxf(280.0, viewport_size.x - MENU_PANEL_MARGIN * 2.0)
	)
	var panel_height := minf(
		maxf(1.0, minimum_size.y),
		maxf(1.0, viewport_size.y - MENU_PANEL_MARGIN * 2.0)
	)
	_menu_panel_final_rect = Rect2(
		Vector2(
			(viewport_size.x - panel_width) * 0.5,
			(viewport_size.y - panel_height) * 0.5
		),
		Vector2(panel_width, panel_height)
	)

	if apply_immediate:
		_apply_control_rect(_menu_panel, _menu_panel_final_rect)


func _apply_control_rect(control: Control, rect: Rect2) -> void:
	if control == null:
		return
	control.set_anchors_preset(Control.PRESET_TOP_LEFT)
	control.offset_left = rect.position.x
	control.offset_top = rect.position.y
	control.offset_right = rect.position.x + rect.size.x
	control.offset_bottom = rect.position.y + rect.size.y


func _show_menu_panel() -> void:
	if _menu_panel == null or _menu_scrim == null:
		if _menu_continue_button != null and _is_navigation_input_mode_active():
			set_preferred_focus_control(_menu_continue_button)
		return

	_apply_viewport_overlay_layout(_menu_overlay)
	_layout_menu_overlay_panel(true)
	_menu_scrim.color = MENU_OVERLAY_COLOR
	_menu_panel.modulate.a = 1.0
	if _menu_continue_button != null and _is_navigation_input_mode_active():
		set_preferred_focus_control(_menu_continue_button)


func _close_menu_panel(after_close: Callable = Callable()) -> void:
	if _menu_panel == null or _menu_scrim == null:
		_finish_menu_close(after_close)
		return

	_menu_overlay_closing = true
	var focus_owner := get_viewport().gui_get_focus_owner()
	if focus_owner != null and _menu_overlay != null and _menu_overlay.is_ancestor_of(focus_owner):
		focus_owner.release_focus()

	_finish_menu_close(after_close)


func _finish_menu_close(after_close: Callable = Callable()) -> void:
	if _menu_panel != null:
		_layout_menu_overlay_panel(true)
		_menu_panel.modulate.a = 1.0
	if _menu_scrim != null:
		_menu_scrim.color = MENU_OVERLAY_COLOR
	if _menu_overlay != null:
		_menu_overlay.visible = false
	_menu_overlay_closing = false
	_set_floating_ui_visible(true)
	_update_advance_hint()
	_restore_dialogue_focus()
	if after_close.is_valid():
		after_close.call()


func _load_dialogue_from_payload(payload: Dictionary) -> void:
	_stop_skip_hold()
	VisualNovelData.reload()
	_invalidate_statement_notebook_content()
	_dialogue_id = _resolve_dialogue_id(payload)
	var target_node_id := _resolve_target_node_id(payload)
	_restore_acquired_info_from_payload(payload)
	var rewind_backlog_entries := _read_rewind_backlog_entries(payload, _dialogue_id)
	_dialogue_metadata = {}
	_backlog_entries.clear()
	_nodes_by_id.clear()
	_statement_node_ids.clear()
	_statement_node_index_by_id.clear()
	_statement_current_lies.clear()
	_statement_lie_ranges.clear()
	_statement_node_history.clear()
	_statement_hovered_lie_index = -1
	_statement_active_lie_index = -1
	_statement_connection_mode_active = false
	_statement_resume_connection_mode_on_note_close = false
	_statement_lie_revealing = false
	_statement_title_playing = false
	_statement_title_preparing_reveal = false
	_statement_title_pending_spectrum = {}
	_statement_reveal_layout_active = false
	_hide_statement_loop_prompt(false)
	_current_node = {}
	_current_node_id = ""
	_has_loaded_dialogue = false
	_close_statement_notebook(false)
	_set_statement_phrase_selection_visible(false)
	_restore_statement_stage_after_note()
	_clear_stage_characters()
	_clear_popup_images()
	_backlog_entries = rewind_backlog_entries

	if _dialogue_id.is_empty():
		_show_empty_dialogue_state(payload)
		_play_rewind_fade_from_payload(payload)
		return

	if not _begin_dialogue_session(_dialogue_id, target_node_id):
		_show_empty_dialogue_state(payload)
	_play_rewind_fade_from_payload(payload)


func _begin_dialogue_session(dialogue_id: String, target_node_id := "") -> bool:
	var dialogue: Dictionary = VisualNovelData.get_dialogue(StringName(dialogue_id))
	if dialogue.is_empty():
		return false

	var switching_dialogue := not _dialogue_id.is_empty() and _dialogue_id != dialogue_id
	if switching_dialogue:
		_backlog_entries.clear()

	_dialogue_id = dialogue_id
	_dialogue_metadata = _read_dialogue_metadata(dialogue)
	_nodes_by_id = dialogue.get("_nodes_by_id", {})
	_collect_statement_nodes(dialogue)
	var clean_target_node_id := target_node_id.strip_edges()
	_current_node_id = String(dialogue.get("start", "")).strip_edges()
	if not clean_target_node_id.is_empty() and _nodes_by_id.has(clean_target_node_id):
		_current_node_id = clean_target_node_id
	elif _is_statement_presentation() and not _statement_node_ids.is_empty():
		_current_node_id = _statement_node_ids[0]
	_has_loaded_dialogue = not _nodes_by_id.is_empty() and not _current_node_id.is_empty()
	_statement_node_history.clear()
	_refresh_statement_controls()
	_refresh_statement_noise_mode()
	call_deferred("_sync_fixed_overlay_layout")

	if not _has_loaded_dialogue:
		return false

	if _is_statement_presentation():
		_show_statement_title_then_node(_current_node_id)
	else:
		_show_node(_current_node_id)
	return true


func _read_dialogue_metadata(dialogue: Dictionary) -> Dictionary:
	var metadata: Variant = dialogue.get("metadata", {})
	if typeof(metadata) != TYPE_DICTIONARY:
		return {}
	return metadata


func _is_statement_presentation() -> bool:
	return String(_dialogue_metadata.get("presentation_mode", "normal")).strip_edges() == "statement"


func _is_statement_main_node_active() -> bool:
	return _is_statement_presentation() and _is_statement_main_node_id(_current_node_id)


func _uses_statement_dialogue_window() -> bool:
	return _statement_reveal_layout_active and _is_statement_main_node_active()


func _is_statement_reveal_layout_active() -> bool:
	return _is_statement_presentation() and _statement_reveal_layout_active


func _show_statement_title_then_node(node_id: String) -> void:
	if not _is_statement_presentation():
		_show_node(node_id)
		return
	_statement_title_playing = true
	_statement_title_preparing_reveal = false
	_statement_title_pending_spectrum = {}
	_statement_title_pending_voice_path = ""
	_set_statement_title_text_visible(true)
	_refresh_statement_controls()
	_set_floating_ui_visible(false, true)
	await _fade_in_statement_title_card()

	var title_hold_until := Time.get_ticks_msec() + int(STATEMENT_TITLE_HOLD_DURATION * 1000.0)
	_statement_title_preparing_reveal = true
	_statement_reveal_layout_active = true
	_sync_fixed_overlay_layout()
	_refresh_statement_controls()
	_show_node(node_id)
	_preload_statement_notebook_content()
	await _wait_for_statement_title_reveal_ready(node_id, title_hold_until)
	_refresh_statement_controls()
	await _fade_out_statement_title_overlay()
	_statement_title_preparing_reveal = false
	_statement_title_playing = false
	_set_floating_ui_visible(true, true)
	_refresh_statement_controls()
	_play_statement_title_pending_spectrum()
	_play_statement_title_pending_voice()
	if _dialogue_typewriter.is_typing():
		_dialogue_typewriter.prepare_to_resume()
		set_process(true)
	_update_advance_hint()


func _set_statement_title_text_visible(visible: bool) -> void:
	if _statement_title_group != null:
		_statement_title_group.visible = visible
		_statement_title_group.modulate.a = 1.0 if visible else 0.0


func _fade_in_statement_title_card() -> void:
	if _statement_title_overlay == null:
		return
	_statement_title_overlay.visible = true
	_statement_title_overlay.modulate.a = 0.0
	var tween := create_tween()
	tween.set_ease(Tween.EASE_OUT)
	tween.set_trans(Tween.TRANS_SINE)
	tween.tween_property(_statement_title_overlay, "modulate:a", 1.0, STATEMENT_TITLE_FADE_DURATION)
	await tween.finished


func _fade_out_statement_title_overlay() -> void:
	if _statement_title_overlay == null:
		return
	_statement_title_overlay.visible = true
	var tween := create_tween()
	tween.set_ease(Tween.EASE_IN)
	tween.set_trans(Tween.TRANS_SINE)
	tween.tween_property(_statement_title_overlay, "modulate:a", 0.0, STATEMENT_TITLE_FADE_DURATION)
	await tween.finished
	_statement_title_overlay.visible = false
	_set_statement_title_text_visible(false)


func _wait_for_statement_title_reveal_ready(node_id: String, hold_until: int) -> void:
	while true:
		var hold_done := Time.get_ticks_msec() >= hold_until
		var node_ready := _current_node_id == node_id and not _awaiting_portrait_for_dialogue
		if hold_done and node_ready:
			return
		await get_tree().process_frame


func _collect_statement_nodes(dialogue: Dictionary) -> void:
	_statement_node_ids.clear()
	_statement_node_index_by_id.clear()

	var configured_node_ids: Array[String] = []
	var raw_configured_node_ids: Variant = dialogue.get("_statement_node_ids", [])
	if typeof(raw_configured_node_ids) == TYPE_ARRAY:
		var raw_configured_array: Array = raw_configured_node_ids
		for raw_node_id in raw_configured_array:
			configured_node_ids.append(String(raw_node_id))
	if configured_node_ids.is_empty():
		configured_node_ids = _read_statement_node_sequence(dialogue)
	if not configured_node_ids.is_empty():
		for node_id in configured_node_ids:
			if not _nodes_by_id.has(node_id) or _statement_node_index_by_id.has(node_id):
				continue
			_statement_node_index_by_id[node_id] = _statement_node_ids.size()
			_statement_node_ids.append(node_id)
		if not _statement_node_ids.is_empty():
			return

	var raw_nodes: Array = dialogue.get("nodes", [])
	for raw_node in raw_nodes:
		if typeof(raw_node) != TYPE_DICTIONARY:
			continue
		var node: Dictionary = raw_node
		var node_id := String(node.get("id", "")).strip_edges()
		if node_id.is_empty():
			continue
		_statement_node_index_by_id[node_id] = _statement_node_ids.size()
		_statement_node_ids.append(node_id)


func _read_statement_node_sequence(dialogue: Dictionary) -> Array[String]:
	var node_ids: Array[String] = []
	var raw_sequence: Variant = dialogue.get("statement_nodes", dialogue.get("statements", []))
	if typeof(raw_sequence) != TYPE_ARRAY:
		return node_ids

	var raw_array: Array = raw_sequence
	for raw_entry in raw_array:
		var node_id := ""
		if typeof(raw_entry) == TYPE_STRING:
			node_id = String(raw_entry).strip_edges()
		elif typeof(raw_entry) == TYPE_DICTIONARY:
			var entry: Dictionary = raw_entry
			node_id = String(entry.get("node_id", entry.get("id", ""))).strip_edges()
		if node_id.is_empty() or node_ids.has(node_id):
			continue
		node_ids.append(node_id)
	return node_ids


func _is_statement_main_node_id(node_id: String) -> bool:
	return _statement_node_index_by_id.has(node_id)


func _is_statement_end_node(node: Dictionary) -> bool:
	if bool(node.get("statement_end", false)) or bool(node.get("ends_statement", false)):
		return true
	var metadata: Variant = node.get("metadata", {})
	if typeof(metadata) == TYPE_DICTIONARY:
		var meta: Dictionary = metadata
		return bool(meta.get("statement_end", false)) or bool(meta.get("ends_statement", false))
	return false


func _refresh_statement_noise_mode() -> void:
	if _dialogue_spectrum == null:
		return
	var has_active_statement_lie := _is_statement_presentation() and (
		_statement_lie_revealing
		or _statement_hovered_lie_index >= 0
		or _statement_active_lie_index >= 0
	)
	_dialogue_spectrum.set_noise_mode(_dialogue_spectrum_active and has_active_statement_lie)


func _get_chained_next_dialogue_id() -> String:
	return String(_dialogue_metadata.get("next_dialogue", "")).strip_edges()


func _grant_node_acquire_info(node: Dictionary) -> void:
	if node.is_empty():
		return
	var acquired := VisualNovelData.acquire_info_from_data(node)
	var acquired_characters := acquired.get("characters", []) as Array
	var acquired_items := acquired.get("items", []) as Array
	if not acquired_characters.is_empty() or not acquired_items.is_empty():
		_invalidate_statement_notebook_content()


func _try_advance_to_chained_dialogue() -> bool:
	var next_dialogue_id := _get_chained_next_dialogue_id()
	if next_dialogue_id.is_empty() or next_dialogue_id == _dialogue_id:
		return false
	if not VisualNovelData.has_dialogue(StringName(next_dialogue_id)):
		return false

	var next_dialogue: Dictionary = VisualNovelData.get_dialogue(StringName(next_dialogue_id))
	var next_metadata := _read_dialogue_metadata(next_dialogue)
	var next_is_statement := String(next_metadata.get("presentation_mode", "normal")).strip_edges().to_lower() == "statement"
	if not next_is_statement:
		_clear_stage_characters()
	_close_statement_notebook(false)
	_restore_statement_stage_after_note()
	return _begin_dialogue_session(next_dialogue_id)


func _resolve_dialogue_id(payload: Dictionary) -> String:
	var explicit_id := String(payload.get("dialogue_id", "")).strip_edges()
	if not explicit_id.is_empty() and VisualNovelData.has_dialogue(StringName(explicit_id)):
		return explicit_id

	var chapter_id := String(payload.get("chapter_id", "")).strip_edges()
	if not chapter_id.is_empty() and VisualNovelData.has_chapter(StringName(chapter_id)):
		var chapter: Dictionary = VisualNovelData.get_chapter(StringName(chapter_id))
		var start_dialogue := String(chapter.get("start_dialogue", "")).strip_edges()
		if not start_dialogue.is_empty() and VisualNovelData.has_dialogue(StringName(start_dialogue)):
			return start_dialogue

	if DEFAULT_DIALOGUE_ID_BY_CHAPTER.has(chapter_id):
		var mapped_id: String = DEFAULT_DIALOGUE_ID_BY_CHAPTER[chapter_id]
		if VisualNovelData.has_dialogue(StringName(mapped_id)):
			return mapped_id

	if not chapter_id.is_empty() and VisualNovelData.has_dialogue(StringName(chapter_id)):
		return chapter_id

	var dialogues := VisualNovelData.get_all_dialogues()
	if dialogues.size() > 0:
		var first_dialogue: Dictionary = dialogues[0]
		return String(first_dialogue.get("id", ""))

	return ""


func _resolve_target_node_id(payload: Dictionary) -> String:
	var target_node_id := String(payload.get("target_node_id", "")).strip_edges()
	if target_node_id.is_empty():
		target_node_id = String(payload.get("node_id", "")).strip_edges()
	return target_node_id


func _restore_acquired_info_from_payload(payload: Dictionary) -> void:
	if not bool(payload.get("rewind_acquired_info", false)):
		return
	VisualNovelData.set_acquired_info(
		_to_clean_string_array(payload.get("rewind_acquired_character_ids", [])),
		_to_clean_string_array(payload.get("rewind_acquired_item_ids", []))
	)


func _read_rewind_backlog_entries(payload: Dictionary, dialogue_id: String) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	var raw_entries: Variant = payload.get("rewind_backlog_entries", [])
	if typeof(raw_entries) != TYPE_ARRAY:
		return result

	for raw_entry in raw_entries as Array:
		if typeof(raw_entry) != TYPE_DICTIONARY:
			continue
		var entry := (raw_entry as Dictionary).duplicate(true)
		if String(entry.get("dialogue_id", "")).strip_edges() != dialogue_id:
			continue
		entry["index"] = result.size() + 1
		result.append(entry)
	return result


func _to_clean_string_array(raw_value: Variant) -> Array:
	var result := []
	if typeof(raw_value) != TYPE_ARRAY:
		return result
	for raw_id in raw_value as Array:
		var id := String(raw_id).strip_edges()
		if not id.is_empty():
			result.append(id)
	return result


func _play_rewind_fade_from_payload(payload: Dictionary) -> void:
	if not bool(payload.get("rewind_fade", false)):
		return

	if _rewind_fade_tween != null:
		_rewind_fade_tween.kill()
		_rewind_fade_tween = null
	if _rewind_fade_overlay != null and is_instance_valid(_rewind_fade_overlay):
		_rewind_fade_overlay.queue_free()

	_rewind_fade_overlay = RewindTransitionOverlay.new()
	_rewind_fade_overlay.name = "RewindFade"
	_rewind_fade_overlay.modulate.a = 1.0
	_rewind_fade_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	_rewind_fade_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_rewind_fade_overlay)
	_rewind_fade_overlay.move_to_front()
	if _rewind_fade_overlay.has_method("restart"):
		_rewind_fade_overlay.call("restart")

	_rewind_fade_tween = create_tween()
	_rewind_fade_tween.set_ease(Tween.EASE_OUT)
	_rewind_fade_tween.set_trans(Tween.TRANS_SINE)
	_rewind_fade_tween.tween_property(_rewind_fade_overlay, "modulate:a", 0.0, REWIND_FADE_DURATION)
	_rewind_fade_tween.finished.connect(func() -> void:
		_rewind_fade_tween = null
		if _rewind_fade_overlay != null and is_instance_valid(_rewind_fade_overlay):
			_rewind_fade_overlay.queue_free()
		_rewind_fade_overlay = null
	, CONNECT_ONE_SHOT)


func _show_empty_dialogue_state(payload: Dictionary) -> void:
	_has_loaded_dialogue = false
	_current_node = {}
	_current_node_id = ""
	_awaiting_portrait_for_dialogue = false
	_pending_dialogue = {}
	_statement_title_pending_spectrum = {}
	_statement_title_pending_voice_path = ""
	_statement_reveal_layout_active = false
	_statement_current_lies.clear()
	_statement_lie_ranges.clear()
	_statement_hovered_lie_index = -1
	_statement_active_lie_index = -1
	_statement_connection_mode_active = false
	_statement_resume_connection_mode_on_note_close = false
	_statement_lie_revealing = false
	_refresh_statement_controls()
	_set_statement_phrase_selection_visible(false)
	_clear_choices()
	_hide_dialogue_spectrum()
	_stop_voice_audio()
	_clear_popup_images()

	var chapter_title := String(payload.get("chapter_title", ""))
	var body := "대화 데이터가 아직 없습니다."
	if not chapter_title.is_empty():
		body = "%s의 대화 데이터가 아직 없습니다." % chapter_title

	_render_dialogue_line("시스템", body, MUTED_TEXT_COLOR)
	_clear_stage_characters()
	_refresh_skip_button_state()
	_update_advance_hint()


func _show_node(node_id: String) -> void:
	_stop_voice_audio()
	if not _nodes_by_id.has(node_id):
		_show_empty_dialogue_state(setup_payload)
		return

	_hide_statement_loop_prompt(false)
	_current_node_id = node_id
	_current_node = _nodes_by_id[node_id]
	_clear_popup_images()
	_prune_statement_stage_characters_for_node(_current_node)
	_statement_hovered_lie_index = -1
	_statement_active_lie_index = -1
	_statement_connection_mode_active = false
	_statement_resume_connection_mode_on_note_close = false
	_statement_current_lies.clear()
	_statement_lie_ranges.clear()
	_statement_lie_revealing = false
	_set_statement_phrase_selection_visible(false)
	_refresh_statement_controls()
	_refresh_skip_button_state()
	_refresh_statement_noise_mode()
	if _is_statement_presentation():
		_sync_fixed_overlay_layout()

	var speaker_id := String(_current_node.get("speaker", ""))
	var speaker_profile := _get_speaker_profile(speaker_id)
	var is_narrator := _is_narrator_speaker(speaker_id)
	var speaker_name := _get_speaker_name(speaker_id, speaker_profile)
	var speaker_color := _get_speaker_color(speaker_profile)
	_grant_node_acquire_info(_current_node)
	var line_text := String(_current_node.get("text", ""))
	_show_node_popups(_current_node, speaker_id)
	var layout_offset := Vector2.ZERO
	var zoom_percent := PortraitLayout.ZOOM_DEFAULT
	if not is_narrator:
		var cast_entry := {}
		if _current_node.has("stage_cast"):
			var stage_cast: Dictionary = _current_node.get("stage_cast", {})
			if stage_cast.has(speaker_id):
				cast_entry = stage_cast[speaker_id]
		layout_offset = _resolve_cast_layout_offset(speaker_id, cast_entry)
		zoom_percent = _resolve_cast_zoom_percent(speaker_id, cast_entry)

	_pending_dialogue = {
		"speaker_id": speaker_id,
		"speaker_name": speaker_name,
		"line_text": line_text,
		"speaker_color": speaker_color,
		"layout_offset": layout_offset,
		"zoom_percent": zoom_percent,
		"spectrum_offset": PortraitLayout.parse_spectrum_offset(speaker_profile.get("spectrum_offset", null)),
		"is_narrator": is_narrator,
	}
	_portrait_dialogue_token += 1
	var dialogue_token := _portrait_dialogue_token
	_awaiting_portrait_for_dialogue = true
	_clear_choices()
	_prepare_dialogue_presentation(speaker_name, speaker_color)
	_update_advance_hint()

	var on_portrait_ready := func() -> void:
		_on_portrait_ready_for_dialogue(dialogue_token)

	_apply_stage_flags(_current_node, speaker_id, is_narrator)

	if is_narrator:
		_stage_speaker_id = ""
		_play_stage_cast_animations(_current_node, on_portrait_ready)
		_hide_dialogue_spectrum()
	else:
		_stage_speaker_id = speaker_id
		_raise_character_slot(speaker_id)
		_play_stage_cast_animations(_current_node, on_portrait_ready)
	_sync_grid_background()


func _prepare_dialogue_presentation(speaker_name: String, speaker_color: Color) -> void:
	var show_speaker := not speaker_name.is_empty()
	_speaker_label.visible = show_speaker
	_speaker_label.text = speaker_name
	_speaker_label.add_theme_color_override("font_color", speaker_color)
	_dialogue_text.text = ""
	_dialogue_text.visible_characters = -1
	set_process(false)
	_sync_speaker_label_layout()


func _on_portrait_ready_for_dialogue(dialogue_token: int) -> void:
	if dialogue_token != _portrait_dialogue_token:
		return
	if not _awaiting_portrait_for_dialogue:
		return

	_awaiting_portrait_for_dialogue = false
	_begin_pending_dialogue_line()


func _begin_pending_dialogue_line() -> void:
	if _pending_dialogue.is_empty():
		return

	var speaker_name := String(_pending_dialogue.get("speaker_name", ""))
	var speaker_id := String(_pending_dialogue.get("speaker_id", ""))
	var line_text := String(_pending_dialogue.get("line_text", ""))
	var speaker_color: Color = _pending_dialogue.get("speaker_color", DEFAULT_SPEAKER_COLOR)
	var layout_offset: Vector2 = _pending_dialogue.get("layout_offset", Vector2.ZERO)
	var spectrum_offset: Vector2 = _pending_dialogue.get("spectrum_offset", Vector2.ZERO)
	var is_narrator := bool(_pending_dialogue.get("is_narrator", false))

	var body_text_color := NARRATOR_TEXT_COLOR if is_narrator else BODY_TEXT_COLOR
	if _is_statement_main_node_active():
		_render_statement_dialogue_line(speaker_name, line_text, speaker_color, body_text_color)
	else:
		_render_dialogue_line(speaker_name, line_text, speaker_color, body_text_color)
	_append_backlog_entry(speaker_name, line_text, speaker_color, "dialogue", _current_node_id)
	if _statement_title_preparing_reveal:
		_statement_title_pending_voice_path = _get_node_voice_audio_path(_current_node)
	else:
		_play_node_voice_audio(_current_node)
	if not is_narrator:
		if _statement_title_preparing_reveal:
			_statement_title_pending_spectrum = {
				"speaker_id": speaker_id,
				"line_text": line_text,
				"speaker_color": speaker_color,
				"layout_offset": layout_offset,
				"spectrum_offset": spectrum_offset,
			}
			_hide_dialogue_spectrum()
		else:
			_show_dialogue_spectrum(line_text, speaker_color, layout_offset, spectrum_offset, speaker_id)
	_render_choices(_current_node.get("choices", []))
	if _statement_title_preparing_reveal:
		set_process(false)
	_refresh_statement_controls()
	_resume_skip_hold_if_requested()


func _invoke_portrait_finished(on_finished: Callable) -> void:
	if on_finished.is_valid():
		on_finished.call()


func _make_single_shot_callback(callback: Callable) -> Callable:
	var fired := [false]
	return func() -> void:
		if fired[0] or not callback.is_valid():
			return
		fired[0] = true
		callback.call()


func _begin_cast_animation_batch(total: int, on_finished: Callable) -> void:
	_cast_batch_remaining = maxi(total, 0)
	_cast_batch_on_finished = on_finished


func _mark_cast_animation_job_done() -> void:
	if _cast_batch_remaining <= 0:
		return
	_cast_batch_remaining -= 1
	if _cast_batch_remaining > 0:
		return

	var callback := _cast_batch_on_finished
	_cast_batch_on_finished = Callable()
	_invoke_portrait_finished(callback)


func _create_slot_tween(_slot: Dictionary) -> Tween:
	# SceneTree tween을 쓰면 노드/슬롯 간 bind 충돌 없이 병렬 재생 가능.
	return get_tree().create_tween()


func _render_dialogue_line(
	speaker_name: String,
	line_text: String,
	speaker_color: Color,
	body_text_color: Color = BODY_TEXT_COLOR,
) -> void:
	_dialogue_text.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var show_speaker := not speaker_name.is_empty()
	_speaker_label.visible = show_speaker
	_speaker_label.text = speaker_name
	_speaker_label.add_theme_color_override("font_color", speaker_color)
	_dialogue_text.add_theme_color_override("default_color", body_text_color)
	if _line_uses_dialogue_bbcode(line_text):
		_dialogue_text.bbcode_enabled = true
		_dialogue_typewriter.start_bbcode_line(line_text)
	else:
		_dialogue_text.bbcode_enabled = false
		_dialogue_typewriter.start_line(line_text)
	set_process(true)
	_sync_speaker_label_layout()


func _append_backlog_entry(
	speaker_name: String,
	line_text: String,
	speaker_color: Color,
	kind := "dialogue",
	node_id := "",
) -> void:
	var clean_text := _sanitize_backlog_text(line_text)
	if clean_text.is_empty():
		return

	var entry := {
		"speaker": speaker_name,
		"text": clean_text,
		"speaker_color": speaker_color,
		"kind": kind,
		"dialogue_id": _dialogue_id,
		"node_id": node_id,
	}
	var acquired_info := _get_acquired_info_snapshot()
	entry["acquired_character_ids"] = acquired_info.get("characters", [])
	entry["acquired_item_ids"] = acquired_info.get("items", [])
	if _is_same_as_last_backlog_entry(entry):
		return

	entry["index"] = _backlog_entries.size() + 1
	_backlog_entries.append(entry)
	if _backlog_entries.size() > BACKLOG_MAX_ENTRIES:
		_backlog_entries.pop_front()
		for index in _backlog_entries.size():
			_backlog_entries[index]["index"] = index + 1


func _sanitize_backlog_text(line_text: String) -> String:
	var plain_text := _strip_dialogue_bbcode_tags(_strip_typewriter_pauses(line_text))
	return plain_text.replace("[", "").replace("]", "").strip_edges()


func _is_same_as_last_backlog_entry(entry: Dictionary) -> bool:
	if _backlog_entries.is_empty():
		return false

	var previous: Dictionary = _backlog_entries.back()
	return String(previous.get("kind", "")) == String(entry.get("kind", "")) \
		and String(previous.get("dialogue_id", "")) == String(entry.get("dialogue_id", "")) \
		and String(previous.get("node_id", "")) == String(entry.get("node_id", "")) \
		and String(previous.get("speaker", "")) == String(entry.get("speaker", "")) \
		and String(previous.get("text", "")) == String(entry.get("text", ""))


func _make_backlog_payload() -> Dictionary:
	return {
		"entries": _get_current_dialogue_backlog_entries(),
		"dialogue_id": _dialogue_id,
		"current_node_id": _current_node_id,
		"chapter_id": _get_current_chapter_id_for_branch_tree(),
		"chapter_title": _get_current_chapter_title_for_branch_tree(),
		"panel_max_width": _get_backlog_panel_max_width(),
	}


func _get_acquired_info_snapshot() -> Dictionary:
	return {
		"characters": VisualNovelData.get_acquired_character_ids().duplicate(),
		"items": VisualNovelData.get_acquired_item_ids().duplicate(),
	}


func _get_current_dialogue_backlog_entries() -> Array:
	var entries := []
	for entry in _backlog_entries:
		if String(entry.get("dialogue_id", "")) == _dialogue_id:
			entries.append(entry.duplicate(true))
	_remove_current_visible_backlog_entry(entries)
	return entries


func _remove_current_visible_backlog_entry(entries: Array) -> void:
	if entries.is_empty() or _current_node_id.strip_edges().is_empty():
		return

	var last_index := entries.size() - 1
	var raw_entry: Variant = entries[last_index]
	if typeof(raw_entry) != TYPE_DICTIONARY:
		return

	var entry: Dictionary = raw_entry
	if String(entry.get("kind", "")).strip_edges() != "dialogue":
		return
	if String(entry.get("node_id", "")).strip_edges() != _current_node_id:
		return

	entries.remove_at(last_index)


func _make_branch_tree_payload() -> Dictionary:
	return {
		"dialogue_id": _dialogue_id,
		"current_node_id": _current_node_id,
		"visited_node_ids": _get_branch_tree_visited_node_ids(),
		"chapter_id": _get_current_chapter_id_for_branch_tree(),
		"chapter_title": _get_current_chapter_title_for_branch_tree(),
	}


func _get_branch_tree_visited_node_ids() -> Array[String]:
	var ids: Array[String] = []
	for entry in _backlog_entries:
		if String(entry.get("dialogue_id", "")) != _dialogue_id:
			continue
		_append_unique_branch_tree_node_id(ids, String(entry.get("node_id", "")))
	_append_unique_branch_tree_node_id(ids, _current_node_id)
	return ids


func _append_unique_branch_tree_node_id(ids: Array[String], node_id: String) -> void:
	var clean_id := node_id.strip_edges()
	if clean_id.is_empty() or ids.has(clean_id):
		return
	ids.append(clean_id)


func _get_current_chapter_id_for_branch_tree() -> String:
	var chapter_id := String(setup_payload.get("chapter_id", "")).strip_edges()
	if not chapter_id.is_empty():
		return chapter_id

	var chapter := _find_chapter_for_dialogue(_dialogue_id)
	return String(chapter.get("id", "")).strip_edges()


func _get_current_chapter_title_for_branch_tree() -> String:
	var chapter_title := String(setup_payload.get("chapter_title", "")).strip_edges()
	if not chapter_title.is_empty():
		return chapter_title

	var chapter := _find_chapter_for_dialogue(_dialogue_id)
	return String(chapter.get("title", "")).strip_edges()


func _find_chapter_for_dialogue(dialogue_id: String) -> Dictionary:
	if dialogue_id.strip_edges().is_empty():
		return {}

	for raw_chapter in VisualNovelData.get_all_chapters():
		if typeof(raw_chapter) != TYPE_DICTIONARY:
			continue
		var chapter: Dictionary = raw_chapter
		if String(chapter.get("start_dialogue", "")).strip_edges() == dialogue_id:
			return chapter

		var raw_dialogues: Variant = chapter.get("dialogues", [])
		if typeof(raw_dialogues) == TYPE_ARRAY and (raw_dialogues as Array).has(dialogue_id):
			return chapter
	return {}


func _get_backlog_panel_max_width() -> float:
	var panel_layout := _get_dialogue_panel_layout()
	return float(panel_layout.get("width", _get_layout_viewport_size().x))


func _render_statement_dialogue_line(
	speaker_name: String,
	line_text: String,
	speaker_color: Color,
	body_text_color: Color = BODY_TEXT_COLOR,
) -> void:
	var show_speaker := not speaker_name.is_empty()
	_speaker_label.visible = show_speaker
	_speaker_label.text = speaker_name
	_speaker_label.add_theme_color_override("font_color", speaker_color)
	_dialogue_text.add_theme_color_override("default_color", body_text_color)
	_dialogue_text.bbcode_enabled = true
	_dialogue_text.mouse_filter = Control.MOUSE_FILTER_STOP
	_statement_phrase_selection_color = speaker_color

	var parsed := _build_statement_bbcode_text(line_text, _current_node, speaker_color)
	_statement_current_lies = parsed.get("lies", [])
	_statement_lie_ranges = parsed.get("ranges", [])
	_statement_lie_revealing = false
	_dialogue_typewriter.start_bbcode_line(
		String(parsed.get("bbcode_text", "")),
		_create_statement_lie_speed_ranges(_statement_lie_ranges)
	)
	set_process(true)
	_refresh_statement_noise_mode()
	_sync_speaker_label_layout()
	_queue_statement_phrase_selection_frame_update()


func _create_statement_lie_speed_ranges(ranges: Array[Vector2i]) -> Array[Dictionary]:
	var speed_ranges: Array[Dictionary] = []
	for lie_range in ranges:
		if lie_range.x < 0 or lie_range.y <= lie_range.x:
			continue
		speed_ranges.append({
			"start": lie_range.x,
			"end": lie_range.y,
			"speed_multiplier": STATEMENT_LIE_TEXT_SPEED_MULTIPLIER,
			"exit_speed_multiplier": STATEMENT_LIE_TEXT_EXIT_SPEED_MULTIPLIER,
		})
	return speed_ranges


func _build_statement_bbcode_text(line_text: String, node: Dictionary, speaker_color: Color) -> Dictionary:
	var bbcode := ""
	var lies: Array[Dictionary] = []
	var ranges: Array[Vector2i] = []
	var visible_index := 0
	var phrase_index := 0
	var cursor := 0
	var lie_color := _get_statement_lie_bbcode_color(speaker_color)

	while cursor < line_text.length():
		var open_index := line_text.find("[", cursor)
		if open_index < 0:
			var tail_source := line_text.substr(cursor)
			var tail := _strip_typewriter_pauses(tail_source)
			bbcode += _escape_statement_bbcode(tail_source)
			visible_index += tail.length()
			break

		var before_source := line_text.substr(cursor, open_index - cursor)
		var before_text := _strip_typewriter_pauses(before_source)
		bbcode += _escape_statement_bbcode(before_source)
		visible_index += before_text.length()

		var close_index := line_text.find("]", open_index + 1)
		if close_index < 0:
			var rest_source := line_text.substr(open_index)
			var rest := _strip_typewriter_pauses(rest_source)
			bbcode += _escape_statement_bbcode(rest_source)
			visible_index += rest.length()
			break

		var phrase_source := line_text.substr(open_index + 1, close_index - open_index - 1)
		var phrase := _strip_typewriter_pauses(phrase_source)
		if phrase.strip_edges().is_empty():
			var empty_brackets_source := line_text.substr(open_index, close_index - open_index + 1)
			var empty_brackets := _strip_typewriter_pauses(empty_brackets_source)
			bbcode += _escape_statement_bbcode(empty_brackets_source)
			visible_index += empty_brackets.length()
			cursor = close_index + 1
			continue

		var lie := _get_statement_lie_config(node, phrase_index, phrase)
		var lie_id := String(lie.get("id", "lie_%d" % phrase_index))
		lie["id"] = lie_id
		lie["phrase"] = phrase
		lie["index"] = phrase_index
		lies.append(lie)
		var left_padding := _get_statement_lie_side_padding_for_previous_text(before_text)
		var right_padding := _get_statement_lie_side_padding_for_next_text(line_text, close_index + 1)
		bbcode += _escape_statement_bbcode(left_padding)
		visible_index += left_padding.length()
		var phrase_start := visible_index
		ranges.append(Vector2i(phrase_start, phrase_start + phrase.length()))
		bbcode += "[url=%s%d][shake rate=22.0 level=6 connected=1][color=%s][b]%s[/b][/color][/shake][/url]" % [
			STATEMENT_LIE_META_PREFIX,
			phrase_index,
			lie_color,
			_escape_statement_bbcode(phrase_source),
		]
		visible_index += phrase.length()
		bbcode += _escape_statement_bbcode(right_padding)
		visible_index += right_padding.length()
		phrase_index += 1
		cursor = close_index + 1

	return {
		"bbcode_text": bbcode,
		"lies": lies,
		"ranges": ranges,
	}


func _get_statement_lie_bbcode_color(speaker_color: Color) -> String:
	return "#%s" % speaker_color.to_html(false)


func _line_uses_dialogue_bbcode(text: String) -> bool:
	var index := 0
	while index < text.length():
		var open_index := text.find("[", index)
		if open_index < 0:
			return false

		var close_index := text.find("]", open_index + 1)
		if close_index < 0:
			return false

		var tag_body := text.substr(open_index + 1, close_index - open_index - 1)
		if DIALOGUE_BBCODE_TAGS.has(_get_dialogue_bbcode_tag_name(tag_body)):
			return true

		index = close_index + 1

	return false


func _get_dialogue_bbcode_tag_name(raw_tag: String) -> String:
	var tag := raw_tag.strip_edges().to_lower()
	if tag.is_empty():
		return ""
	if tag.begins_with("/"):
		tag = tag.substr(1).strip_edges()

	var end_index := tag.length()
	for separator in [" ", "=", "\t", "\n"]:
		var separator_index := tag.find(separator)
		if separator_index >= 0:
			end_index = mini(end_index, separator_index)
	tag = tag.substr(0, end_index)

	var clean_tag := ""
	for i in tag.length():
		var ch := tag[i]
		if (ch >= "a" and ch <= "z") or (ch >= "0" and ch <= "9") or ch == "_":
			clean_tag += ch
	return clean_tag


func _strip_dialogue_bbcode_tags(text: String) -> String:
	var display := ""
	var index := 0
	while index < text.length():
		var ch := text[index]
		if ch == "[":
			var close_index := text.find("]", index + 1)
			if close_index >= 0:
				var tag_body := text.substr(index + 1, close_index - index - 1)
				var tag_name := _get_dialogue_bbcode_tag_name(tag_body)
				if tag_name == "lb":
					display += "["
					index = close_index + 1
					continue
				if tag_name == "rb":
					display += "]"
					index = close_index + 1
					continue
				if DIALOGUE_BBCODE_TAGS.has(tag_name):
					index = close_index + 1
					continue

		display += ch
		index += 1
	return display


func _get_statement_lie_side_padding_for_previous_text(text: String) -> String:
	if text.is_empty():
		return STATEMENT_LIE_TEXT_SIDE_PADDING
	return (
		STATEMENT_LIE_TEXT_SIDE_PADDING
		if _is_statement_lie_padding_space(text[text.length() - 1])
		else STATEMENT_LIE_TEXT_SIDE_PADDING_EXPANDED
	)


func _get_statement_lie_side_padding_for_next_text(line_text: String, start_index: int) -> String:
	var next_text := _strip_typewriter_pauses(line_text.substr(start_index))
	if next_text.is_empty():
		return STATEMENT_LIE_TEXT_SIDE_PADDING
	return (
		STATEMENT_LIE_TEXT_SIDE_PADDING
		if _is_statement_lie_padding_space(next_text[0])
		else STATEMENT_LIE_TEXT_SIDE_PADDING_EXPANDED
	)


func _is_statement_lie_padding_space(character: String) -> bool:
	return character.strip_edges().is_empty()


func _get_statement_lie_config(node: Dictionary, phrase_index: int, phrase: String) -> Dictionary:
	var raw_lies: Variant = node.get("statement_lies", node.get("lies", []))
	var lie := {}
	if typeof(raw_lies) == TYPE_ARRAY:
		var lie_array: Array = raw_lies
		if phrase_index < lie_array.size() and typeof(lie_array[phrase_index]) == TYPE_DICTIONARY:
			lie = (lie_array[phrase_index] as Dictionary).duplicate(true)
	elif typeof(raw_lies) == TYPE_DICTIONARY:
		var lie_map: Dictionary = raw_lies
		var id_key := "lie_%d" % phrase_index
		if lie_map.has(id_key) and typeof(lie_map[id_key]) == TYPE_DICTIONARY:
			lie = (lie_map[id_key] as Dictionary).duplicate(true)
		elif lie_map.has(phrase) and typeof(lie_map[phrase]) == TYPE_DICTIONARY:
			lie = (lie_map[phrase] as Dictionary).duplicate(true)

	if lie.is_empty():
		lie = {
			"id": "lie_%d" % phrase_index,
			"phrase": phrase,
			"reactions": [_create_default_statement_reaction()],
		}

	var reactions: Variant = lie.get("reactions", [])
	if typeof(reactions) != TYPE_ARRAY or (reactions as Array).is_empty():
		lie["reactions"] = [_create_default_statement_reaction()]
	return lie


func _create_default_statement_reaction() -> Dictionary:
	return {
		"kind": "default",
		"target_id": "",
		"label": "잘못된 연결",
		"next": "",
		"nodes": [],
	}


func _strip_typewriter_pauses(text: String) -> String:
	var display := ""
	var index := 0
	while index < text.length():
		var ch := text[index]
		if ch == "\\" and index + 1 < text.length():
			var next := text[index + 1]
			if next == "|" or next == "\\":
				display += next
				index += 2
				continue
		if ch == "|":
			var consumed_custom_pause := false
			var close_index := text.find("|", index + 1)
			if close_index >= 0:
				var token := text.substr(index + 1, close_index - index - 1)
				if _is_typewriter_custom_pause_token(token):
					index = close_index + 1
					consumed_custom_pause = true
			if not consumed_custom_pause:
				index += 1
			continue
		display += ch
		index += 1
	return display


func _is_typewriter_custom_pause_token(token: String) -> bool:
	if token.is_empty():
		return false

	var has_digit := false
	var has_decimal_point := false
	for i in token.length():
		var ch := token[i]
		if ch >= "0" and ch <= "9":
			has_digit = true
			continue
		if ch == "." and not has_decimal_point:
			has_decimal_point = true
			continue
		return false
	return has_digit


func _escape_statement_bbcode(text: String) -> String:
	return text.replace("[", "[lb]").replace("]", "[rb]")


func _refresh_statement_controls() -> void:
	var visible := _should_show_statement_navigation_controls()
	_apply_statement_navigation_button_content()
	if _statement_prev_button != null:
		_statement_prev_button.visible = visible
		_apply_statement_arrow_button_state(
			_statement_prev_button,
			_can_statement_retreat(true),
			STATEMENT_PREVIOUS_ARROW_DISABLED_OPACITY
		)
	if _statement_next_button != null:
		_statement_next_button.visible = visible
		_apply_statement_arrow_button_state(_statement_next_button, _can_statement_button_advance(true))
	if _dialogue_text != null:
		_dialogue_text.mouse_filter = Control.MOUSE_FILTER_STOP if _uses_statement_dialogue_window() else Control.MOUSE_FILTER_IGNORE
	_refresh_statement_connection_hint()
	_refresh_skip_button_state()
	_update_advance_hint()


func _should_show_statement_navigation_controls() -> bool:
	if not _uses_statement_dialogue_window():
		return false

	match _get_current_input_mode():
		"mouse", "keyboard", "gamepad", "touch":
			return true
	return false


func _refresh_statement_connection_hint() -> void:
	if _statement_connection_hint == null:
		return

	for child in _statement_connection_hint.get_children():
		_statement_connection_hint.remove_child(child)
		child.queue_free()

	var hint_state := _get_statement_connection_hint_state()
	if not bool(hint_state.get("visible", false)):
		_statement_connection_hint.visible = false
		return

	_statement_connection_hint.visible = true
	_statement_connection_hint.modulate.a = 0.5 if bool(hint_state.get("disabled", false)) else 1.0
	_build_statement_connection_hint_content(hint_state)
	_apply_statement_connection_hint_layout()


func _get_statement_connection_hint_state() -> Dictionary:
	if not _uses_statement_dialogue_window():
		return {"visible": false}
	if _statement_note_open or _statement_loop_prompt_open or _statement_title_playing or _awaiting_portrait_for_dialogue:
		return {"visible": false}

	var mode := _get_current_input_mode()
	if mode != "keyboard" and mode != "gamepad":
		return {"visible": false}

	var has_targets := _has_statement_connection_targets()
	if _statement_connection_mode_active:
		return {
			"visible": has_targets,
			"mode": mode,
			"active": true,
			"disabled": false,
		}

	return {
		"visible": true,
		"mode": mode,
		"active": false,
		"disabled": not has_targets,
	}


func _build_statement_connection_hint_content(hint_state: Dictionary) -> void:
	var mode := String(hint_state.get("mode", ""))
	var active := bool(hint_state.get("active", false))
	if active:
		match mode:
			"keyboard":
				_add_statement_connection_hint_label("선택")
				_add_statement_connection_hint_keycap("Space")
				_add_statement_connection_hint_separator()
				_add_statement_connection_hint_label("돌아가기")
				_add_statement_connection_hint_keycap("Esc")
			"gamepad":
				_add_statement_connection_hint_icon("xbox_a", STATEMENT_CONNECTION_HINT_ICON_HEIGHT)
				_add_statement_connection_hint_label("선택")
				_add_statement_connection_hint_separator()
				_add_statement_connection_hint_icon("xbox_b", STATEMENT_CONNECTION_HINT_ICON_HEIGHT)
				_add_statement_connection_hint_label("돌아가기")
		return

	match mode:
		"keyboard":
			_add_statement_connection_hint_label("제시")
			_add_statement_connection_hint_keycap("R")
		"gamepad":
			_add_statement_connection_hint_icon("xbox_rb", STATEMENT_CONNECTION_HINT_SHOULDER_ICON_HEIGHT)
			_add_statement_connection_hint_label("제시")


func _add_statement_connection_hint_label(text: String, color: Color = BODY_TEXT_COLOR) -> Label:
	var label := Label.new()
	label.text = text
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_override("font", DialogueTypography.body_font())
	label.add_theme_font_size_override("font_size", _get_statement_connection_hint_font_size())
	label.add_theme_color_override("font_color", color)
	_apply_top_menu_text_outline(label)
	_statement_connection_hint.add_child(label)
	return label


func _add_statement_connection_hint_separator() -> void:
	_add_statement_connection_hint_label("|", MUTED_TEXT_COLOR)


func _add_statement_connection_hint_icon(icon_key: String, icon_height: int) -> void:
	var icon := _get_input_icon(icon_key, icon_height)
	if icon == null:
		_add_statement_connection_hint_label(icon_key)
		return

	var icon_rect := TextureRect.new()
	icon_rect.texture = icon
	icon_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	icon_rect.custom_minimum_size = Vector2(icon.get_width(), icon.get_height())
	icon_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	icon_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_statement_connection_hint.add_child(icon_rect)


func _add_statement_connection_hint_keycap(text: String) -> void:
	var keycap_offset := MarginContainer.new()
	keycap_offset.mouse_filter = Control.MOUSE_FILTER_IGNORE
	keycap_offset.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	keycap_offset.add_theme_constant_override("margin_top", STATEMENT_CONNECTION_HINT_KEYCAP_Y_OFFSET)
	_statement_connection_hint.add_child(keycap_offset)

	var keycap := PanelContainer.new()
	keycap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	keycap.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	keycap.add_theme_stylebox_override("panel", _create_keycap_style())
	keycap_offset.add_child(keycap)

	var key_margin := MarginContainer.new()
	key_margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	key_margin.add_theme_constant_override("margin_left", STATEMENT_CONNECTION_HINT_KEYCAP_MARGIN_HORIZONTAL)
	key_margin.add_theme_constant_override("margin_top", STATEMENT_CONNECTION_HINT_KEYCAP_MARGIN_VERTICAL)
	key_margin.add_theme_constant_override("margin_right", STATEMENT_CONNECTION_HINT_KEYCAP_MARGIN_HORIZONTAL)
	key_margin.add_theme_constant_override("margin_bottom", STATEMENT_CONNECTION_HINT_KEYCAP_MARGIN_VERTICAL)
	keycap.add_child(key_margin)

	var key_label := Label.new()
	key_label.text = text
	key_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	key_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	key_label.add_theme_font_size_override("font_size", STATEMENT_CONNECTION_HINT_KEYCAP_FONT_SIZE)
	key_label.add_theme_constant_override("line_spacing", TOP_MENU_KEYCAP_LINE_SPACING)
	key_label.add_theme_color_override("font_color", DEFAULT_SPEAKER_COLOR)
	_apply_top_menu_text_outline(key_label)
	key_margin.add_child(key_label)


func _get_statement_connection_hint_font_size() -> int:
	return _scaled_int(
		STATEMENT_CONNECTION_HINT_FONT_SIZE,
		lerpf(1.0, 1.16, _dialogue_tall_factor)
	)


func _get_statement_notebook_input_hint_font_size() -> int:
	return _scaled_int(
		STATEMENT_NOTE_INPUT_HINT_FONT_SIZE,
		lerpf(1.0, 1.10, _dialogue_tall_factor)
	)


func _refresh_statement_notebook_input_affordance() -> void:
	if _statement_notebook_close_button == null or _statement_notebook_input_hint == null:
		return

	var show_input_hint := _statement_note_open and _is_navigation_input_mode_active()
	var focus_owner := get_viewport().gui_get_focus_owner()
	_statement_notebook_close_button.visible = not show_input_hint
	_statement_notebook_close_button.focus_mode = Control.FOCUS_NONE
	_rebuild_statement_notebook_input_hint(show_input_hint)
	if not _statement_notebook_focus_entries.is_empty():
		_configure_statement_notebook_focus_navigation()
		var focus_outside_note := (
			focus_owner == null
			or _statement_notebook_overlay == null
			or not _statement_notebook_overlay.is_ancestor_of(focus_owner)
		)
		if show_input_hint and (focus_owner == _statement_notebook_close_button or focus_outside_note):
			var focus_target := _get_first_statement_notebook_focus_control()
			if focus_target != null:
				focus_target.grab_focus()


func _rebuild_statement_notebook_input_hint(visible: bool) -> void:
	if _statement_notebook_input_hint == null:
		return

	for child in _statement_notebook_input_hint.get_children():
		_statement_notebook_input_hint.remove_child(child)
		child.queue_free()

	_statement_notebook_input_hint.visible = visible
	if not visible:
		return

	match _get_current_input_mode():
		INPUT_MODE_KEYBOARD:
			_add_statement_notebook_hint_label("연결")
			_add_statement_notebook_hint_keycap("Space")
			_add_statement_notebook_hint_separator()
			_add_statement_notebook_hint_label("닫기")
			_add_statement_notebook_hint_keycap("Esc")
		INPUT_MODE_GAMEPAD:
			_add_statement_notebook_hint_icon("xbox_a", STATEMENT_NOTE_INPUT_HINT_ICON_HEIGHT)
			_add_statement_notebook_hint_label("연결")
			_add_statement_notebook_hint_separator()
			_add_statement_notebook_hint_icon("xbox_b", STATEMENT_NOTE_INPUT_HINT_ICON_HEIGHT)
			_add_statement_notebook_hint_label("닫기")


func _add_statement_notebook_hint_label(text: String, color: Color = STATEMENT_NOTE_TEXT_COLOR) -> Label:
	var label := Label.new()
	label.text = text
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_override("font", DialogueTypography.body_font())
	label.add_theme_font_size_override("font_size", _get_statement_notebook_input_hint_font_size())
	label.add_theme_color_override("font_color", color)
	_apply_top_menu_text_outline(label)
	_statement_notebook_input_hint.add_child(label)
	return label


func _add_statement_notebook_hint_separator() -> void:
	_add_statement_notebook_hint_label("|", STATEMENT_NOTE_MUTED_COLOR)


func _add_statement_notebook_hint_icon(icon_key: String, icon_height: int) -> void:
	var icon := _get_input_icon(icon_key, icon_height)
	if icon == null:
		_add_statement_notebook_hint_label(icon_key)
		return

	var icon_rect := TextureRect.new()
	icon_rect.texture = icon
	icon_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	icon_rect.custom_minimum_size = Vector2(icon.get_width(), icon.get_height())
	icon_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	icon_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_statement_notebook_input_hint.add_child(icon_rect)


func _add_statement_notebook_hint_keycap(text: String) -> void:
	var keycap_offset := MarginContainer.new()
	keycap_offset.mouse_filter = Control.MOUSE_FILTER_IGNORE
	keycap_offset.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	keycap_offset.add_theme_constant_override("margin_top", STATEMENT_CONNECTION_HINT_KEYCAP_Y_OFFSET)
	_statement_notebook_input_hint.add_child(keycap_offset)

	var keycap := PanelContainer.new()
	keycap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	keycap.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	keycap.add_theme_stylebox_override("panel", _create_keycap_style())
	keycap_offset.add_child(keycap)

	var key_margin := MarginContainer.new()
	key_margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	key_margin.add_theme_constant_override("margin_left", STATEMENT_NOTE_INPUT_HINT_KEYCAP_MARGIN_HORIZONTAL)
	key_margin.add_theme_constant_override("margin_top", STATEMENT_CONNECTION_HINT_KEYCAP_MARGIN_VERTICAL)
	key_margin.add_theme_constant_override("margin_right", STATEMENT_NOTE_INPUT_HINT_KEYCAP_MARGIN_HORIZONTAL)
	key_margin.add_theme_constant_override("margin_bottom", STATEMENT_CONNECTION_HINT_KEYCAP_MARGIN_VERTICAL)
	keycap.add_child(key_margin)

	var key_label := Label.new()
	key_label.text = text
	key_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	key_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	key_label.add_theme_font_size_override("font_size", STATEMENT_NOTE_INPUT_HINT_KEYCAP_FONT_SIZE)
	key_label.add_theme_constant_override("line_spacing", TOP_MENU_KEYCAP_LINE_SPACING)
	key_label.add_theme_color_override("font_color", DEFAULT_SPEAKER_COLOR)
	_apply_top_menu_text_outline(key_label)
	key_margin.add_child(key_label)


func _can_enter_statement_connection_mode() -> bool:
	if not _uses_statement_dialogue_window():
		return false
	if _statement_note_open or _statement_loop_prompt_open or _statement_title_playing or _awaiting_portrait_for_dialogue:
		return false
	return _has_statement_connection_targets()


func _enter_statement_connection_mode() -> bool:
	if not _can_enter_statement_connection_mode():
		return false

	if _dialogue_typewriter.is_typing():
		_dialogue_typewriter.reveal_all()

	var selectable_indices := _get_selectable_statement_lie_indices()
	if selectable_indices.size() == 1:
		_statement_connection_mode_active = false
		_open_statement_notebook(selectable_indices[0])
		return true
	if selectable_indices.is_empty():
		return false

	_statement_connection_mode_active = true
	_statement_hovered_lie_index = -1
	if not _is_statement_lie_index_selectable(_statement_active_lie_index):
		_statement_active_lie_index = selectable_indices[0]
	_update_statement_phrase_selection_frame()
	_refresh_statement_noise_mode()
	_refresh_statement_controls()
	return true


func _exit_statement_connection_mode(clear_selection := true) -> bool:
	if not _statement_connection_mode_active:
		return false

	_statement_connection_mode_active = false
	if clear_selection:
		_statement_active_lie_index = -1
		_set_statement_phrase_selection_visible(false)
	_refresh_statement_noise_mode()
	_refresh_statement_controls()
	return true


func _move_statement_connection_selection(delta: int) -> bool:
	if not _statement_connection_mode_active:
		return false

	var selectable_indices := _get_selectable_statement_lie_indices()
	if selectable_indices.is_empty():
		_exit_statement_connection_mode()
		return true

	var current_position := selectable_indices.find(_statement_active_lie_index)
	if current_position < 0:
		current_position = 0
	else:
		current_position = clampi(current_position + delta, 0, selectable_indices.size() - 1)
	_statement_active_lie_index = selectable_indices[current_position]
	_update_statement_phrase_selection_frame()
	_refresh_statement_noise_mode()
	return true


func _open_statement_connection_selection() -> bool:
	if not _statement_connection_mode_active:
		return false
	if not _is_statement_lie_index_selectable(_statement_active_lie_index):
		var first_index := _get_first_selectable_statement_lie_index()
		if first_index < 0:
			_exit_statement_connection_mode()
			return true
		_statement_active_lie_index = first_index

	var selected_index := _statement_active_lie_index
	_statement_connection_mode_active = false
	_open_statement_notebook(selected_index, true)
	return true


func _get_selectable_statement_lie_indices() -> Array[int]:
	var indices: Array[int] = []
	for index in _get_statement_connection_target_indices(true):
		indices.append(index)
	return indices


func _get_first_selectable_statement_lie_index() -> int:
	var indices := _get_selectable_statement_lie_indices()
	if not indices.is_empty():
		return indices[0]
	return -1


func _has_statement_connection_targets() -> bool:
	return not _get_statement_connection_target_indices(false).is_empty()


func _get_statement_connection_target_indices(require_visible: bool) -> Array[int]:
	var indices: Array[int] = []
	var target_count := mini(_statement_current_lies.size(), _statement_lie_ranges.size())
	for index in target_count:
		var lie_range := _statement_lie_ranges[index]
		if lie_range.x < 0 or lie_range.y <= lie_range.x:
			continue
		if require_visible and not _is_statement_lie_range_visible(lie_range):
			continue
		indices.append(index)
	return indices


func _is_statement_lie_index_selectable(lie_index: int) -> bool:
	if lie_index < 0 or lie_index >= _statement_current_lies.size():
		return false
	if lie_index >= _statement_lie_ranges.size():
		return false
	return _is_statement_lie_range_visible(_statement_lie_ranges[lie_index])


func _apply_statement_navigation_button_content() -> void:
	var mode := _get_current_input_mode()
	match mode:
		"keyboard":
			_configure_statement_navigation_button(
				_statement_prev_button,
				"A",
				"",
				0,
				STATEMENT_KEYBOARD_NAV_FONT_SIZE,
				false
			)
			_configure_statement_navigation_button(
				_statement_next_button,
				"D",
				"",
				0,
				STATEMENT_KEYBOARD_NAV_FONT_SIZE,
				false
			)
		"gamepad":
			_configure_statement_navigation_button(
				_statement_prev_button,
				"",
				"stick_l_left",
				STATEMENT_GAMEPAD_NAV_ICON_HEIGHT,
				STATEMENT_TOUCH_NAV_FONT_SIZE,
				false
			)
			_configure_statement_navigation_button(
				_statement_next_button,
				"",
				"stick_l_right",
				STATEMENT_GAMEPAD_NAV_ICON_HEIGHT,
				STATEMENT_TOUCH_NAV_FONT_SIZE,
				false
			)
		_:
			_configure_statement_navigation_button(
				_statement_prev_button,
				"",
				"mui:KeyboardArrowLeftRounded",
				STATEMENT_TOUCH_NAV_ICON_HEIGHT,
				STATEMENT_TOUCH_NAV_FONT_SIZE,
				mode == "mouse" or mode == "touch"
			)
			_configure_statement_navigation_button(
				_statement_next_button,
				"",
				"mui:KeyboardArrowRightRounded",
				STATEMENT_TOUCH_NAV_ICON_HEIGHT,
				STATEMENT_TOUCH_NAV_FONT_SIZE,
				mode == "mouse" or mode == "touch"
			)


func _configure_statement_navigation_button(
	button: Button,
	text: String,
	icon_key: String,
	icon_height: int,
	font_size: int,
	handles_pointer: bool
) -> void:
	if button == null:
		return

	var icon := _get_input_icon(icon_key, icon_height)
	button.text = text
	button.icon = icon
	button.mouse_filter = Control.MOUSE_FILTER_STOP if handles_pointer else Control.MOUSE_FILTER_IGNORE
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND if handles_pointer else Control.CURSOR_ARROW
	button.alignment = HORIZONTAL_ALIGNMENT_CENTER
	button.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
	button.expand_icon = false
	button.add_theme_font_size_override("font_size", font_size)
	button.add_theme_constant_override("h_separation", 0)
	button.add_theme_constant_override("icon_max_width", icon.get_width() if icon != null else 0)


func _apply_statement_arrow_button_state(
	button: Button,
	enabled: bool,
	disabled_opacity: float = STATEMENT_ARROW_DISABLED_OPACITY
) -> void:
	button.disabled = not enabled
	if button.mouse_filter == Control.MOUSE_FILTER_STOP:
		button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND if enabled else Control.CURSOR_ARROW
	button.modulate.a = 1.0 if enabled else disabled_opacity


func _can_statement_advance(ignore_title_lock := false) -> bool:
	if not _is_statement_presentation() or _statement_note_open or _statement_connection_mode_active or _awaiting_portrait_for_dialogue or _statement_loop_prompt_open:
		return false
	if _statement_title_playing and not ignore_title_lock:
		return false
	if _dialogue_typewriter.is_typing():
		return true
	return _has_statement_forward_target()


func _can_statement_button_advance(ignore_title_lock := false) -> bool:
	if not _is_statement_presentation() or _statement_note_open or _statement_connection_mode_active or _awaiting_portrait_for_dialogue or _statement_loop_prompt_open:
		return false
	if _statement_title_playing and not ignore_title_lock:
		return false
	return _has_statement_forward_target()


func _has_statement_forward_target() -> bool:
	if _is_statement_main_node_id(_current_node_id):
		var current_index := int(_statement_node_index_by_id.get(_current_node_id, 0))
		return current_index < _statement_node_ids.size() - 1
	if _is_statement_end_node(_current_node):
		return true
	if not String(_current_node.get("next", "")).strip_edges().is_empty():
		return true
	for index in range(_statement_node_history.size() - 1, -1, -1):
		if _is_statement_main_node_id(String(_statement_node_history[index])):
			return true
	return false


func _can_statement_retreat(ignore_title_lock := false) -> bool:
	if not _is_statement_presentation() or _statement_note_open or _statement_connection_mode_active or _awaiting_portrait_for_dialogue or _statement_loop_prompt_open:
		return false
	if not _is_statement_main_node_active():
		return false
	if _statement_title_playing and not ignore_title_lock:
		return false
	return _has_statement_previous_node()


func _has_statement_previous_node() -> bool:
	if _is_statement_main_node_id(_current_node_id):
		var current_index := int(_statement_node_index_by_id.get(_current_node_id, 0))
		return current_index > 0
	return not _statement_node_history.is_empty()


func _cancel_statement_typewriter_for_navigation() -> void:
	if not _dialogue_typewriter.is_typing():
		return
	_dialogue_typewriter.cancel()
	set_process(false)
	_hide_dialogue_spectrum()
	_statement_lie_revealing = false
	_refresh_statement_noise_mode()


func _on_statement_previous_button_pressed() -> void:
	if not _is_statement_pointer_navigation_mode():
		return
	_retreat_dialogue(true)


func _on_statement_next_button_pressed() -> void:
	if not _is_statement_pointer_navigation_mode():
		return
	_advance_statement_forward(true)


func _is_statement_pointer_navigation_mode() -> bool:
	var mode := _get_current_input_mode()
	return mode == "mouse" or mode == "touch"


func _advance_statement_forward(skip_typewriter := false) -> void:
	var can_advance := _can_statement_button_advance() if skip_typewriter else _can_statement_advance()
	if not can_advance:
		return
	if _dialogue_typewriter.is_typing():
		if skip_typewriter:
			_cancel_statement_typewriter_for_navigation()
		elif not _dialogue_typewriter.request_advance():
			_update_advance_hint()
			_refresh_statement_controls()
			return

	if _is_statement_main_node_id(_current_node_id):
		var current_index := int(_statement_node_index_by_id.get(_current_node_id, 0))
		if current_index >= _statement_node_ids.size() - 1:
			return
		var next_index := (current_index + 1) % _statement_node_ids.size()
		_transition_to_node(_statement_node_ids[next_index])
		return

	if _is_statement_end_node(_current_node):
		_finish_statement_sequence()
		return

	var next_id := String(_current_node.get("next", "")).strip_edges()
	if next_id.is_empty():
		while not _statement_node_history.is_empty():
			var return_node_id: String = _statement_node_history.pop_back()
			if not return_node_id.is_empty() and _is_statement_main_node_id(return_node_id):
				_transition_to_node(return_node_id)
				return
		return
	_statement_node_history.append(_current_node_id)
	_transition_to_node(next_id)


func _retreat_dialogue(skip_typewriter := false) -> void:
	if not _is_statement_presentation() or not _can_statement_retreat():
		return
	if _dialogue_typewriter.is_typing():
		if skip_typewriter:
			_cancel_statement_typewriter_for_navigation()
		else:
			_dialogue_typewriter.reveal_all()
			_update_advance_hint()
			_refresh_statement_controls()
			return

	if _is_statement_main_node_id(_current_node_id):
		var current_index := int(_statement_node_index_by_id.get(_current_node_id, 0))
		var prev_index := posmod(current_index - 1, _statement_node_ids.size())
		_transition_to_node(_statement_node_ids[prev_index])
		return

	var previous_id: String = _statement_node_history.pop_back()
	if not previous_id.is_empty():
		_transition_to_node(previous_id)


func _finish_statement_sequence() -> void:
	if _try_advance_to_chained_dialogue():
		return
	request_screen_change("chapter_select")


func _show_statement_loop_prompt() -> void:
	if _statement_loop_prompt_overlay == null:
		return

	_statement_hovered_lie_index = -1
	_statement_active_lie_index = -1
	_statement_connection_mode_active = false
	_statement_resume_connection_mode_on_note_close = false
	_statement_loop_prompt_open = true
	_set_statement_phrase_selection_visible(false)
	_refresh_statement_noise_mode()
	_statement_loop_prompt_overlay.visible = true
	_refresh_statement_controls()
	if _statement_loop_prompt_yes_button != null and _is_navigation_input_mode_active():
		set_preferred_focus_control(_statement_loop_prompt_yes_button)


func _hide_statement_loop_prompt(restore_focus: bool = true) -> void:
	if _statement_loop_prompt_overlay != null:
		_statement_loop_prompt_overlay.visible = false
	_statement_loop_prompt_open = false
	_refresh_statement_controls()
	if restore_focus:
		_restore_dialogue_focus()


func _on_statement_loop_prompt_yes_pressed() -> void:
	_restart_statement_from_title()


func _on_statement_loop_prompt_no_pressed() -> void:
	_hide_statement_loop_prompt()


func _restart_statement_from_title() -> void:
	if _statement_node_ids.is_empty():
		_hide_statement_loop_prompt()
		return

	_hide_statement_loop_prompt(false)
	_statement_node_history.clear()
	_statement_hovered_lie_index = -1
	_statement_active_lie_index = -1
	_statement_connection_mode_active = false
	_statement_resume_connection_mode_on_note_close = false
	_statement_lie_revealing = false
	_set_statement_phrase_selection_visible(false)
	_show_statement_title_then_node(_statement_node_ids[0])


func _on_dialogue_text_gui_input(event: InputEvent) -> void:
	if not _uses_statement_dialogue_window():
		return
	if _statement_loop_prompt_open:
		accept_event()
		return
	if _statement_note_open:
		accept_event()
		return

	if event is InputEventMouseMotion:
		_sync_statement_hover_from_mouse_position()
		return

	if event is InputEventMouseButton:
		var mouse_event := event as InputEventMouseButton
		if not mouse_event.pressed or mouse_event.device == InputEvent.DEVICE_ID_EMULATION:
			return
		if mouse_event.button_index == MOUSE_BUTTON_RIGHT:
			accept_event()
		elif mouse_event.button_index == MOUSE_BUTTON_LEFT and (_dialogue_typewriter.is_typing() or _statement_hovered_lie_index < 0):
			_reveal_statement_dialogue()
			accept_event()
		return

	if event is InputEventScreenTouch:
		var touch_event := event as InputEventScreenTouch
		if touch_event.pressed:
			_handle_touch_advance_event(touch_event)
			return
		var was_typing := _dialogue_typewriter.is_typing()
		if _handle_touch_advance_event(touch_event):
			if was_typing:
				_reveal_statement_dialogue()
				accept_event()
		return

	if event is InputEventScreenDrag:
		_track_touch_advance_drag(event as InputEventScreenDrag)


func _on_dialogue_meta_hover_started(meta: Variant) -> void:
	if not _is_statement_main_node_active() or _statement_connection_mode_active or _statement_loop_prompt_open:
		return
	var lie_index := _parse_statement_lie_meta(meta)
	if lie_index < 0:
		return
	_statement_hovered_lie_index = lie_index
	_refresh_statement_noise_mode()


func _on_dialogue_meta_hover_ended(meta: Variant) -> void:
	if not _is_statement_main_node_active() or _statement_connection_mode_active or _statement_loop_prompt_open:
		return
	var lie_index := _parse_statement_lie_meta(meta)
	if lie_index < 0 or lie_index != _statement_hovered_lie_index:
		return
	_statement_hovered_lie_index = -1
	_refresh_statement_noise_mode()


func _on_dialogue_meta_clicked(meta: Variant) -> void:
	if not _is_statement_main_node_active() or _statement_loop_prompt_open:
		return
	var lie_index := _parse_statement_lie_meta(meta)
	if lie_index < 0:
		return
	_open_statement_notebook(lie_index)


func _sync_statement_hover_from_mouse_position() -> void:
	if not _is_statement_main_node_active() or _dialogue_text == null or _statement_note_open or _statement_loop_prompt_open:
		return
	if not _should_sync_statement_mouse_hover():
		return

	var pointer_positions := _get_statement_pointer_positions()
	if pointer_positions.is_empty():
		return

	var to_dialogue_local := _dialogue_text.get_global_transform_with_canvas().affine_inverse()
	var next_hovered_index := -1
	for index in _statement_lie_ranges.size():
		var lie_range := _statement_lie_ranges[index]
		if not _is_statement_lie_range_visible(lie_range):
			continue
		var local_rects := _compute_dialogue_visible_range_rects(lie_range)
		if local_rects.is_empty():
			continue
		for pointer_position in pointer_positions:
			var local_pointer: Vector2 = to_dialogue_local * pointer_position
			if _is_point_in_any_rect(local_pointer, local_rects):
				next_hovered_index = index
				break
		if next_hovered_index >= 0:
			break

	if next_hovered_index == _statement_hovered_lie_index:
		return
	_statement_hovered_lie_index = next_hovered_index
	_refresh_statement_noise_mode()


func _should_sync_statement_mouse_hover() -> bool:
	if _statement_connection_mode_active:
		return false
	var input_router := _get_input_router()
	if input_router == null:
		return true
	var current_mode := String(input_router.get("current_mode"))
	return current_mode != INPUT_MODE_GAMEPAD and current_mode != "touch"


func _get_statement_pointer_positions() -> Array[Vector2]:
	var positions: Array[Vector2] = []
	_add_unique_statement_pointer_position(positions, get_viewport().get_mouse_position())

	var input_router := _get_input_router()
	if input_router != null:
		var pointer_position: Variant = input_router.get("pointer_position")
		if typeof(pointer_position) == TYPE_VECTOR2:
			_add_unique_statement_pointer_position(positions, pointer_position)
	return positions


func _add_unique_statement_pointer_position(positions: Array[Vector2], position: Vector2) -> void:
	for existing in positions:
		if existing.distance_squared_to(position) <= 0.01:
			return
	positions.append(position)


func _is_statement_lie_range_visible(lie_range: Vector2i) -> bool:
	if lie_range.x < 0 or lie_range.y <= lie_range.x:
		return false
	var visible_characters := _dialogue_text.visible_characters
	return visible_characters < 0 or visible_characters >= lie_range.y


func _parse_statement_lie_meta(meta: Variant) -> int:
	var text := str(meta)
	if not text.begins_with(STATEMENT_LIE_META_PREFIX):
		return -1
	var number_text := text.substr(STATEMENT_LIE_META_PREFIX.length())
	if not number_text.is_valid_int():
		return -1
	var lie_index := int(number_text)
	if lie_index < 0 or lie_index >= _statement_current_lies.size():
		return -1
	return lie_index


func _open_statement_notebook(lie_index: int, resume_connection_mode_on_close := false) -> void:
	if _statement_loop_prompt_open:
		return
	if lie_index < 0 or lie_index >= _statement_current_lies.size() or _statement_notebook_overlay == null:
		return
	if _dialogue_typewriter.is_typing():
		_dialogue_typewriter.reveal_all()
	_statement_connection_mode_active = false
	_statement_resume_connection_mode_on_note_close = (
		resume_connection_mode_on_close
		and _get_statement_connection_target_indices(false).size() > 1
	)
	_statement_active_lie_index = lie_index
	_statement_note_open = true
	_update_statement_phrase_selection_frame()
	_ensure_statement_notebook_populated()
	_refresh_statement_notebook_input_affordance()
	_prepare_statement_notebook_open_animation()
	_slide_statement_character_for_note(true)
	_refresh_statement_controls()
	_refresh_statement_noise_mode()
	var focus_target := _get_first_statement_notebook_focus_control()
	if focus_target != null and _is_navigation_input_mode_active():
		set_preferred_focus_control(focus_target)


func _close_statement_notebook(restore_character: bool = true) -> void:
	var resume_connection_mode := (
		restore_character
		and _statement_resume_connection_mode_on_note_close
		and _can_resume_statement_connection_mode_after_note()
	)
	var resume_lie_index := _statement_active_lie_index
	_hide_statement_notebook_overlay_immediate()
	_statement_note_open = false
	_statement_resume_connection_mode_on_note_close = false
	_statement_connection_mode_active = resume_connection_mode
	if resume_connection_mode:
		_statement_active_lie_index = resume_lie_index
		if not _is_statement_lie_index_selectable(_statement_active_lie_index):
			_statement_active_lie_index = _get_first_selectable_statement_lie_index()
		_update_statement_phrase_selection_frame()
	else:
		_statement_active_lie_index = -1
		_set_statement_phrase_selection_visible(false)
	_statement_hovered_lie_index = -1
	if restore_character:
		_slide_statement_character_for_note(false)
	_refresh_statement_controls()
	_refresh_statement_noise_mode()


func _can_resume_statement_connection_mode_after_note() -> bool:
	if not _uses_statement_dialogue_window():
		return false
	if not _is_navigation_input_mode_active():
		return false
	if _statement_loop_prompt_open or _statement_title_playing or _awaiting_portrait_for_dialogue:
		return false
	return _get_statement_connection_target_indices(false).size() > 1


func _prepare_statement_notebook_open_animation() -> void:
	if _statement_notebook_overlay == null:
		return

	_stop_statement_notebook_tween()
	_apply_statement_notebook_layout()
	var panel := _statement_notebook_overlay.get_node_or_null("NotebookPanel") as Control
	var scrim := _statement_notebook_overlay.get_node_or_null("Scrim") as CanvasItem
	if panel == null:
		return

	_statement_notebook_overlay.visible = true
	panel.visible = true
	panel.modulate.a = 0.0
	panel.position = _get_statement_notebook_panel_enter_position(panel.size)
	if scrim != null:
		scrim.modulate.a = 0.0


func _play_statement_notebook_open_animation(on_finished: Callable = Callable()) -> void:
	if _statement_notebook_overlay == null:
		_invoke_portrait_finished(on_finished)
		return

	var panel := _statement_notebook_overlay.get_node_or_null("NotebookPanel") as Control
	var scrim := _statement_notebook_overlay.get_node_or_null("Scrim") as CanvasItem
	if panel == null:
		_invoke_portrait_finished(on_finished)
		return

	_stop_statement_notebook_tween()
	_statement_notebook_overlay.visible = true
	panel.visible = true
	var final_position := _get_statement_notebook_panel_final_position(panel.size)
	var tween := create_tween()
	_statement_notebook_tween = tween
	tween.set_parallel(true)
	tween.set_ease(Tween.EASE_OUT)
	tween.set_trans(Tween.TRANS_SINE)
	tween.tween_property(panel, "position", final_position, STATEMENT_NOTE_PANEL_ENTER_DURATION)
	tween.tween_property(panel, "modulate:a", 1.0, STATEMENT_NOTE_PANEL_ENTER_DURATION)
	if scrim != null:
		tween.tween_property(scrim, "modulate:a", 1.0, STATEMENT_NOTE_PANEL_ENTER_DURATION)
	tween.finished.connect(func() -> void:
		_statement_notebook_tween = null
		panel.position = final_position
		panel.modulate.a = 1.0
		if scrim != null:
			scrim.modulate.a = 1.0
		_invoke_portrait_finished(on_finished)
	, CONNECT_ONE_SHOT)


func _hide_statement_notebook_overlay_immediate() -> void:
	_stop_statement_notebook_tween()
	_stop_statement_notebook_scroll_tweens()
	if _statement_notebook_overlay == null:
		return

	var panel := _statement_notebook_overlay.get_node_or_null("NotebookPanel") as Control
	var scrim := _statement_notebook_overlay.get_node_or_null("Scrim") as CanvasItem
	if panel != null:
		panel.modulate.a = 1.0
	if scrim != null:
		scrim.modulate.a = 1.0
	_statement_notebook_overlay.visible = false


func _stop_statement_notebook_tween() -> void:
	if _statement_notebook_tween != null and _statement_notebook_tween.is_valid():
		_statement_notebook_tween.kill()
	_statement_notebook_tween = null


func _stop_statement_notebook_scroll_tweens() -> void:
	for raw_tween in _statement_notebook_scroll_tweens.values():
		var tween := raw_tween as Tween
		if tween != null and tween.is_valid():
			tween.kill()
	_statement_notebook_scroll_tweens.clear()


func _get_statement_notebook_characters() -> Array:
	if VisualNovelData.has_any_acquired_info():
		return VisualNovelData.get_acquired_characters()
	return VisualNovelData.get_all_characters()


func _get_statement_notebook_items() -> Array:
	if VisualNovelData.has_any_acquired_info():
		return VisualNovelData.get_acquired_items()
	return VisualNovelData.get_all_items()


func _invalidate_statement_notebook_content() -> void:
	_statement_notebook_content_ready = false
	_statement_notebook_content_signature = ""


func _preload_statement_notebook_content() -> void:
	if not _is_statement_presentation():
		return
	_ensure_statement_notebook_populated()


func _ensure_statement_notebook_populated(force := false) -> void:
	if _statement_notebook_character_list == null or _statement_notebook_item_list == null:
		return

	var signature := _get_statement_notebook_content_signature()
	if not force and _statement_notebook_content_ready and _statement_notebook_content_signature == signature:
		return

	_populate_statement_notebook()
	_statement_notebook_content_signature = signature
	_statement_notebook_content_ready = true


func _get_statement_notebook_content_signature() -> String:
	var character_ids: Array[String] = []
	var item_ids: Array[String] = []

	for character in _get_statement_notebook_characters():
		if typeof(character) != TYPE_DICTIONARY:
			continue
		var profile: Dictionary = character
		var character_id := String(profile.get("id", "")).strip_edges()
		if character_id.is_empty() or VisualNovelData.is_narrator_character(StringName(character_id)):
			continue
		character_ids.append(character_id)

	for item in _get_statement_notebook_items():
		if typeof(item) != TYPE_DICTIONARY:
			continue
		var item_profile: Dictionary = item
		var item_id := String(item_profile.get("id", "")).strip_edges()
		if item_id.is_empty():
			continue
		item_ids.append(item_id)

	return "%s|%s|%s" % [
		"acquired" if VisualNovelData.has_any_acquired_info() else "all",
		_join_statement_notebook_signature_ids(character_ids),
		_join_statement_notebook_signature_ids(item_ids),
	]


func _join_statement_notebook_signature_ids(ids: Array[String]) -> String:
	var text := ""
	for id in ids:
		if not text.is_empty():
			text += ","
		text += id
	return text


func _populate_statement_notebook() -> void:
	if _statement_notebook_character_list == null or _statement_notebook_item_list == null:
		return

	_statement_notebook_focus_entries.clear()
	_statement_notebook_last_focus_by_column.clear()
	_clear_statement_notebook_list(_statement_notebook_character_list)
	_clear_statement_notebook_list(_statement_notebook_item_list)

	var character_count := 0
	for character in _get_statement_notebook_characters():
		if typeof(character) != TYPE_DICTIONARY:
			continue
		var profile: Dictionary = character
		var character_id := String(profile.get("id", "")).strip_edges()
		if character_id.is_empty() or VisualNovelData.is_narrator_character(StringName(character_id)):
			continue
		_add_statement_notebook_entry(
			_statement_notebook_character_list,
			_statement_notebook_character_scroll,
			String(profile.get("display_name", character_id)),
			_get_statement_notebook_subtitle(profile, "인물 정보"),
			"character",
			character_id,
			_get_statement_notebook_character_icon(profile),
			"인물",
			"character",
			character_count
		)
		character_count += 1
	if character_count == 0:
		_add_statement_notebook_empty(_statement_notebook_character_list, "획득한 인물 정보 없음")
	if _statement_notebook_character_count_label != null:
		_statement_notebook_character_count_label.text = "%d 명" % character_count

	var item_count := 0
	for item in _get_statement_notebook_items():
		if typeof(item) != TYPE_DICTIONARY:
			continue
		var item_profile: Dictionary = item
		var item_id := String(item_profile.get("id", "")).strip_edges()
		if item_id.is_empty():
			continue
		_add_statement_notebook_entry(
			_statement_notebook_item_list,
			_statement_notebook_item_scroll,
			String(item_profile.get("name", item_id)),
			_get_statement_notebook_subtitle(item_profile, "자료 정보"),
			"item",
			item_id,
			_get_statement_notebook_item_icon(item_profile),
			"자료",
			"item",
			item_count
		)
		item_count += 1
	if item_count == 0:
		_add_statement_notebook_empty(_statement_notebook_item_list, "획득한 자료 정보 없음")
	if _statement_notebook_item_count_label != null:
		_statement_notebook_item_count_label.text = "%d 건" % item_count

	_refresh_statement_notebook_input_affordance()
	_configure_statement_notebook_focus_navigation()
	_queue_statement_notebook_scroll_padding_update()
	refresh_input_focus_mode()
	refresh_pointer_hover_mode()


func _clear_statement_notebook_list(list: VBoxContainer) -> void:
	if list == null:
		return
	for child in list.get_children():
		list.remove_child(child)
		child.queue_free()


func _add_statement_notebook_empty(parent: VBoxContainer, text: String) -> void:
	if parent == null:
		return
	var label := Label.new()
	label.text = text
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.custom_minimum_size = Vector2(0, STATEMENT_NOTE_CARD_MIN_HEIGHT)
	label.add_theme_font_size_override("font_size", 18)
	label.add_theme_color_override("font_color", STATEMENT_NOTE_MUTED_COLOR)
	parent.add_child(label)


func _add_statement_notebook_entry(
	parent: VBoxContainer,
	scroll: ScrollContainer,
	label: String,
	sub_label: String,
	kind: String,
	target_id: String,
	icon: Texture2D,
	tag_text: String,
	column: String,
	index: int
) -> Button:
	var button := Button.new()
	button.name = "Entry_%s_%02d" % [column.capitalize(), index + 1]
	button.text = ""
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	button.custom_minimum_size = Vector2(0, STATEMENT_NOTE_CARD_MIN_HEIGHT)
	button.focus_mode = Control.FOCUS_ALL
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	_apply_statement_notebook_entry_theme(button)
	_build_statement_notebook_entry_content(button, label, sub_label, icon, tag_text)
	button.pressed.connect(_on_statement_notebook_entry_selected.bind(kind, target_id))
	button.focus_entered.connect(_on_statement_notebook_entry_focus_entered.bind(button, scroll))
	parent.add_child(button)
	_statement_notebook_focus_entries.append({
		"button": button,
		"scroll": scroll,
		"column": column,
		"index": index,
	})
	return button


func _apply_statement_notebook_entry_theme(button: Button) -> void:
	var base_bg := Color(0.055, 0.055, 0.055, 0.93)
	var border := STATEMENT_NOTE_BORDER_COLOR
	button.flat = false
	button.add_theme_stylebox_override("normal", _create_statement_notebook_entry_style(base_bg, border, 1))
	button.add_theme_stylebox_override("hover", _create_statement_notebook_entry_style(base_bg.lerp(STATEMENT_NOTE_ACCENT_COLOR, 0.07), STATEMENT_NOTE_ACCENT_COLOR, 1))
	button.add_theme_stylebox_override("focus", _create_statement_notebook_entry_style(base_bg.lerp(STATEMENT_NOTE_ACCENT_COLOR, 0.10), STATEMENT_NOTE_ACCENT_COLOR, 2))
	button.add_theme_stylebox_override("pressed", _create_statement_notebook_entry_style(base_bg.darkened(0.08), STATEMENT_NOTE_ACCENT_COLOR, 2))
	button.add_theme_color_override("font_color", STATEMENT_NOTE_TEXT_COLOR)
	button.add_theme_color_override("font_hover_color", STATEMENT_NOTE_ACCENT_COLOR)
	button.add_theme_color_override("font_focus_color", STATEMENT_NOTE_ACCENT_COLOR)
	button.add_theme_color_override("font_pressed_color", STATEMENT_NOTE_ACCENT_COLOR)


func _create_statement_notebook_entry_style(background: Color, border: Color, border_width: int) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = background
	style.border_color = border
	style.set_border_width_all(border_width)
	style.set_corner_radius_all(3)
	style.content_margin_left = 0
	style.content_margin_right = 0
	style.content_margin_top = 0
	style.content_margin_bottom = 0
	return style


func _build_statement_notebook_entry_content(
	button: Button,
	label: String,
	sub_label: String,
	icon: Texture2D,
	tag_text: String
) -> void:
	var margin := MarginContainer.new()
	margin.name = "Content"
	margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 14)
	margin.add_theme_constant_override("margin_top", 10)
	margin.add_theme_constant_override("margin_right", 12)
	margin.add_theme_constant_override("margin_bottom", 10)
	button.add_child(margin)

	var row := HBoxContainer.new()
	row.name = "Row"
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.size_flags_vertical = Control.SIZE_EXPAND_FILL
	row.add_theme_constant_override("separation", 14)
	margin.add_child(row)

	var thumb_shell := PanelContainer.new()
	thumb_shell.name = "Thumb"
	thumb_shell.mouse_filter = Control.MOUSE_FILTER_IGNORE
	thumb_shell.custom_minimum_size = Vector2(STATEMENT_NOTE_CARD_THUMB_SIZE, STATEMENT_NOTE_CARD_THUMB_SIZE)
	thumb_shell.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	thumb_shell.add_theme_stylebox_override("panel", _create_statement_notebook_thumb_style())
	row.add_child(thumb_shell)

	var thumb := TextureRect.new()
	thumb.name = "Icon"
	thumb.mouse_filter = Control.MOUSE_FILTER_IGNORE
	thumb.texture = icon
	thumb.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	thumb.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	thumb.custom_minimum_size = Vector2(STATEMENT_NOTE_CARD_THUMB_SIZE, STATEMENT_NOTE_CARD_THUMB_SIZE)
	thumb_shell.add_child(thumb)

	var text_stack := VBoxContainer.new()
	text_stack.name = "Text"
	text_stack.mouse_filter = Control.MOUSE_FILTER_IGNORE
	text_stack.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	text_stack.size_flags_vertical = Control.SIZE_EXPAND_FILL
	text_stack.alignment = BoxContainer.ALIGNMENT_CENTER
	text_stack.add_theme_constant_override("separation", 3)
	row.add_child(text_stack)

	var name_label := Label.new()
	name_label.name = "Name"
	name_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	name_label.text = label
	name_label.clip_text = true
	name_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	name_label.add_theme_font_size_override("font_size", 22)
	name_label.add_theme_color_override("font_color", STATEMENT_NOTE_TEXT_COLOR)
	text_stack.add_child(name_label)

	var subtitle_label := Label.new()
	subtitle_label.name = "Subtitle"
	subtitle_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	subtitle_label.text = sub_label
	subtitle_label.clip_text = true
	subtitle_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	subtitle_label.add_theme_font_size_override("font_size", 15)
	subtitle_label.add_theme_color_override("font_color", STATEMENT_NOTE_MUTED_COLOR)
	text_stack.add_child(subtitle_label)

	var tag := PanelContainer.new()
	tag.name = "Tag"
	tag.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tag.custom_minimum_size = Vector2(62, 28)
	tag.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	tag.add_theme_stylebox_override("panel", _create_statement_notebook_tag_style())
	row.add_child(tag)

	var tag_margin := MarginContainer.new()
	tag_margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tag_margin.add_theme_constant_override("margin_left", 8)
	tag_margin.add_theme_constant_override("margin_right", 8)
	tag_margin.add_theme_constant_override("margin_top", 3)
	tag_margin.add_theme_constant_override("margin_bottom", 3)
	tag.add_child(tag_margin)

	var tag_label := Label.new()
	tag_label.name = "TagLabel"
	tag_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tag_label.text = tag_text
	tag_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tag_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	tag_label.add_theme_font_size_override("font_size", 14)
	tag_label.add_theme_color_override("font_color", STATEMENT_NOTE_ACCENT_COLOR)
	tag_margin.add_child(tag_label)


func _create_statement_notebook_thumb_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0, 0, 0, 0.24)
	style.border_color = Color(STATEMENT_NOTE_BORDER_COLOR.r, STATEMENT_NOTE_BORDER_COLOR.g, STATEMENT_NOTE_BORDER_COLOR.b, 0.32)
	style.set_border_width_all(1)
	style.set_corner_radius_all(3)
	return style


func _create_statement_notebook_tag_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(STATEMENT_NOTE_ACCENT_COLOR.r, STATEMENT_NOTE_ACCENT_COLOR.g, STATEMENT_NOTE_ACCENT_COLOR.b, 0.08)
	style.border_color = Color(STATEMENT_NOTE_ACCENT_COLOR.r, STATEMENT_NOTE_ACCENT_COLOR.g, STATEMENT_NOTE_ACCENT_COLOR.b, 0.58)
	style.set_border_width_all(1)
	style.set_corner_radius_all(2)
	return style


func _get_statement_notebook_subtitle(data: Dictionary, fallback: String) -> String:
	for key in ["description", "role", "title", "summary"]:
		var value := String(data.get(key, "")).strip_edges()
		if not value.is_empty():
			return value
	var metadata: Dictionary = data.get("metadata", {})
	for key in ["description", "role", "title", "category", "date"]:
		var value := String(metadata.get(key, "")).strip_edges()
		if not value.is_empty():
			return value
	return fallback


func _get_statement_notebook_character_icon(profile: Dictionary) -> Texture2D:
	var profile_thumbnail := _get_statement_notebook_character_profile_thumbnail(profile)
	if profile_thumbnail != null:
		return profile_thumbnail

	var thumbnail := _get_statement_notebook_character_thumbnail(profile)
	if thumbnail != null:
		return thumbnail

	var portrait_key := _get_default_profile_portrait_key(profile)
	if not portrait_key.is_empty():
		var portrait_entry := PortraitLayout.resolve_portrait_entry(profile, portrait_key)
		var path := String(portrait_entry.get("path", "")).strip_edges()
		if not path.is_empty():
			var texture := _load_portrait_texture(path)
			if texture != null:
				return texture
	return _get_mui_icon("PersonRounded", int(STATEMENT_NOTE_CARD_THUMB_SIZE * 0.72), STATEMENT_NOTE_TEXT_COLOR)


func _get_statement_notebook_character_profile_thumbnail(profile: Dictionary) -> Texture2D:
	var character_id := String(profile.get("id", "")).strip_edges()
	if character_id.is_empty():
		return null
	var spec := _resolve_character_profile_popup_spec(character_id)
	if spec.is_empty():
		return null
	return _create_statement_notebook_profile_thumbnail(spec, int(STATEMENT_NOTE_CARD_THUMB_SIZE * 2.0))


func _create_statement_notebook_profile_thumbnail(spec: Dictionary, target_size: int) -> Texture2D:
	var texture: Texture2D = spec.get("texture")
	if texture == null or target_size <= 0:
		return null

	var path := String(spec.get("path", "")).strip_edges()
	var cache_key := "%s:%s:%d:%s:%s:%s" % [
		path,
		String(spec.get("portrait", "")),
		target_size,
		str(spec.get("center", Vector2(0.5, 0.5))),
		str(spec.get("crop_zoom", POPUP_PROFILE_ZOOM_DEFAULT)),
		str(spec.get("crop_offset", Vector2.ZERO)),
	]
	if _statement_notebook_profile_thumbnail_cache.has(cache_key):
		return _statement_notebook_profile_thumbnail_cache[cache_key] as Texture2D

	var source := texture.get_image()
	if source == null or source.is_empty():
		return null
	source.convert(Image.FORMAT_RGBA8)

	var texture_size := Vector2(source.get_width(), source.get_height())
	if texture_size.x <= 0.0 or texture_size.y <= 0.0:
		return null

	var frame_size := Vector2(float(target_size), float(target_size))
	var base_scale := maxf(frame_size.x / texture_size.x, frame_size.y / texture_size.y)
	var zoom := clampf(
		float(spec.get("crop_zoom", POPUP_PROFILE_ZOOM_DEFAULT)),
		POPUP_PROFILE_ZOOM_MIN,
		POPUP_PROFILE_ZOOM_MAX
	)
	var image_size := texture_size * base_scale * zoom
	var scaled_size := Vector2i(
		maxi(1, int(roundf(image_size.x))),
		maxi(1, int(roundf(image_size.y)))
	)

	var scaled_source := source.duplicate()
	scaled_source.resize(scaled_size.x, scaled_size.y, Image.INTERPOLATE_LANCZOS)

	var center := Vector2(spec.get("center", Vector2(0.5, 0.5)))
	var crop_offset := Vector2(spec.get("crop_offset", Vector2.ZERO))
	var anchor := frame_size * 0.5 + Vector2(crop_offset.x * frame_size.x, crop_offset.y * frame_size.y)
	var image_position := anchor - Vector2(center.x * float(scaled_size.x), center.y * float(scaled_size.y))
	var destination_position := Vector2i(int(floorf(image_position.x)), int(floorf(image_position.y)))
	var source_origin := Vector2i(maxi(0, -destination_position.x), maxi(0, -destination_position.y))
	var destination_origin := Vector2i(maxi(0, destination_position.x), maxi(0, destination_position.y))
	var copy_size := Vector2i(
		mini(target_size - destination_origin.x, scaled_size.x - source_origin.x),
		mini(target_size - destination_origin.y, scaled_size.y - source_origin.y)
	)
	if copy_size.x <= 0 or copy_size.y <= 0:
		return null

	var thumbnail_image := Image.create(target_size, target_size, false, Image.FORMAT_RGBA8)
	thumbnail_image.fill(Color(0, 0, 0, 0))
	thumbnail_image.blit_rect(scaled_source, Rect2i(source_origin, copy_size), destination_origin)
	var thumbnail := ImageTexture.create_from_image(thumbnail_image)
	_statement_notebook_profile_thumbnail_cache[cache_key] = thumbnail
	return thumbnail


func _get_statement_notebook_character_thumbnail(profile: Dictionary) -> Texture2D:
	var texture := _get_statement_notebook_texture_from_keys(
		profile,
		["thumbnail", "thumb", "preview", "profile_image", "image", "icon"]
	)
	if texture != null:
		return texture

	var metadata: Variant = profile.get("metadata", {})
	if typeof(metadata) == TYPE_DICTIONARY:
		texture = _get_statement_notebook_texture_from_keys(
			metadata as Dictionary,
			["thumbnail", "thumb", "preview", "profile_image", "image", "icon"]
		)
		if texture != null:
			return texture

	var character_id := String(profile.get("id", "")).strip_edges()
	if character_id.is_empty():
		return null

	var candidate_dirs: Array[String] = []
	var source_path := String(profile.get("source_path", "")).strip_edges()
	if not source_path.is_empty():
		candidate_dirs.append(source_path.get_base_dir())
	candidate_dirs.append("res://assets/characters/%s" % character_id)

	for dir in candidate_dirs:
		for file_name in ["thumbnail.png", "thumb.png", "profile.png", "preview.png", "icon.png"]:
			texture = _load_statement_notebook_texture("%s/%s" % [dir, file_name])
			if texture != null:
				return texture
	return null


func _get_statement_notebook_texture_from_keys(data: Dictionary, keys: Array) -> Texture2D:
	for key in keys:
		var path := String(data.get(String(key), "")).strip_edges()
		var texture := _load_statement_notebook_texture(path)
		if texture != null:
			return texture
	return null


func _load_statement_notebook_texture(path: String) -> Texture2D:
	if path.is_empty():
		return null
	if not ResourceLoader.exists(path) and not FileAccess.file_exists(path):
		return null
	return load(path) as Texture2D


func _get_statement_notebook_item_icon(item: Dictionary) -> Texture2D:
	var image_path := String(item.get("image", "")).strip_edges()
	if not image_path.is_empty():
		var texture := load(image_path) as Texture2D
		if texture != null:
			return texture
	return _get_mui_icon("ArticleRounded", int(STATEMENT_NOTE_CARD_THUMB_SIZE * 0.66), STATEMENT_NOTE_TEXT_COLOR)


func _configure_statement_notebook_focus_navigation() -> void:
	var character_buttons := _get_statement_notebook_column_buttons("character")
	var item_buttons := _get_statement_notebook_column_buttons("item")
	var ordered: Array[Button] = []
	ordered.append_array(character_buttons)
	ordered.append_array(item_buttons)

	var first_entry := ordered[0] if not ordered.is_empty() else null
	var close_button := _get_statement_notebook_focusable_close_button()
	if close_button != null:
		close_button.focus_previous = NodePath()
		close_button.focus_neighbor_top = NodePath()
		close_button.focus_neighbor_left = NodePath()
		close_button.focus_neighbor_right = NodePath()
		close_button.focus_next = close_button.get_path_to(first_entry) if first_entry != null else NodePath()
		close_button.focus_neighbor_bottom = close_button.focus_next

	for index in ordered.size():
		var button := ordered[index]
		if button == null:
			continue
		var previous := close_button if index == 0 else ordered[index - 1]
		var next := close_button if index == ordered.size() - 1 else ordered[index + 1]
		button.focus_previous = button.get_path_to(previous) if previous != null else NodePath()
		button.focus_next = button.get_path_to(next) if next != null else NodePath()

	if _is_statement_notebook_single_column_layout():
		for index in ordered.size():
			var button := ordered[index]
			if button == null:
				continue
			var top := close_button if index == 0 else ordered[index - 1]
			var bottom := ordered[index + 1] if index < ordered.size() - 1 else null
			button.focus_neighbor_top = button.get_path_to(top) if top != null else NodePath()
			button.focus_neighbor_bottom = button.get_path_to(bottom) if bottom != null else NodePath()
			button.focus_neighbor_left = NodePath()
			button.focus_neighbor_right = NodePath()
		return

	for index in character_buttons.size():
		var button := character_buttons[index]
		if button == null:
			continue
		var top := close_button if index == 0 else character_buttons[index - 1]
		var bottom := character_buttons[index + 1] if index < character_buttons.size() - 1 else null
		var right := _get_statement_notebook_column_button_at(item_buttons, index)
		button.focus_neighbor_top = button.get_path_to(top) if top != null else NodePath()
		button.focus_neighbor_bottom = button.get_path_to(bottom) if bottom != null else NodePath()
		button.focus_neighbor_left = NodePath()
		button.focus_neighbor_right = button.get_path_to(right) if right != null else NodePath()

	for index in item_buttons.size():
		var button := item_buttons[index]
		if button == null:
			continue
		var top := close_button if index == 0 else item_buttons[index - 1]
		var bottom := item_buttons[index + 1] if index < item_buttons.size() - 1 else null
		var left := _get_statement_notebook_column_button_at(character_buttons, index)
		button.focus_neighbor_top = button.get_path_to(top) if top != null else NodePath()
		button.focus_neighbor_bottom = button.get_path_to(bottom) if bottom != null else NodePath()
		button.focus_neighbor_left = button.get_path_to(left) if left != null else NodePath()
		button.focus_neighbor_right = NodePath()


func _is_statement_notebook_single_column_layout() -> bool:
	return _statement_notebook_columns != null and _statement_notebook_columns.columns <= 1


func _get_statement_notebook_focusable_close_button() -> Button:
	if (
		_statement_notebook_close_button != null
		and is_instance_valid(_statement_notebook_close_button)
		and _statement_notebook_close_button.visible
		and _statement_notebook_close_button.focus_mode != Control.FOCUS_NONE
	):
		return _statement_notebook_close_button
	return null


func _get_statement_notebook_column_buttons(column: String) -> Array[Button]:
	var buttons: Array[Button] = []
	for entry in _statement_notebook_focus_entries:
		if String(entry.get("column", "")) != column:
			continue
		var button := entry.get("button") as Button
		if button != null and is_instance_valid(button):
			buttons.append(button)
	return buttons


func _get_statement_notebook_column_button_at(buttons: Array[Button], index: int) -> Button:
	if buttons.is_empty():
		return null
	return buttons[clampi(index, 0, buttons.size() - 1)]


func _get_statement_notebook_focus_entry_for_button(button: Button) -> Dictionary:
	if button == null:
		return {}
	for entry in _statement_notebook_focus_entries:
		if entry.get("button") == button:
			return entry
	return {}


func _get_statement_notebook_ordered_buttons() -> Array[Button]:
	var buttons: Array[Button] = []
	for entry in _statement_notebook_focus_entries:
		var button := entry.get("button") as Button
		if button != null and is_instance_valid(button):
			buttons.append(button)
	return buttons


func _get_statement_notebook_last_focused_button(column: String) -> Button:
	var button := _statement_notebook_last_focus_by_column.get(column) as Button
	if button != null and is_instance_valid(button):
		return button
	return null


func _move_statement_notebook_focus_vertical(direction: int) -> bool:
	var focus_owner := get_viewport().gui_get_focus_owner() as Button
	var entry := _get_statement_notebook_focus_entry_for_button(focus_owner)
	var buttons: Array[Button] = []
	var scroll: ScrollContainer

	if entry.is_empty():
		buttons = _get_statement_notebook_ordered_buttons()
		if buttons.is_empty():
			return false
		_focus_statement_notebook_button(buttons[0])
		return true

	if _is_statement_notebook_single_column_layout():
		buttons = _get_statement_notebook_ordered_buttons()
	else:
		var column := String(entry.get("column", ""))
		buttons = _get_statement_notebook_column_buttons(column)
		scroll = _get_statement_notebook_scroll_for_column(column)

	var current_index := buttons.find(focus_owner)
	if current_index < 0:
		return false

	if scroll != null and not _is_statement_notebook_entry_visible_in_scroll(scroll, focus_owner):
		var visible_button := _find_statement_notebook_bottom_visible_button(buttons, scroll)
		if visible_button != null:
			_focus_statement_notebook_button(visible_button)
			return true

	var next_index := clampi(current_index + direction, 0, buttons.size() - 1)
	_focus_statement_notebook_button(buttons[next_index])
	return true


func _focus_statement_notebook_button(button: Button) -> void:
	if button == null or not is_instance_valid(button):
		return
	var entry := _get_statement_notebook_focus_entry_for_button(button)
	var column := String(entry.get("column", ""))
	if not column.is_empty():
		_statement_notebook_last_focus_by_column[column] = button
	set_preferred_focus_control(button)
	button.grab_focus()
	_ensure_statement_notebook_entry_visible(_get_statement_notebook_scroll_for_column(column), button)


func _is_statement_notebook_entry_visible_in_scroll(scroll: ScrollContainer, button: Control) -> bool:
	if scroll == null or not is_instance_valid(scroll) or button == null or not is_instance_valid(button):
		return false
	return button.get_global_rect().intersects(scroll.get_global_rect())


func _find_statement_notebook_bottom_visible_button(buttons: Array[Button], scroll: ScrollContainer) -> Button:
	if scroll == null or not is_instance_valid(scroll):
		return null
	var scroll_rect := scroll.get_global_rect()
	var target: Button
	var target_bottom := -1.0e20
	for button in buttons:
		if button == null or not is_instance_valid(button) or not button.is_visible_in_tree():
			continue
		var button_rect := button.get_global_rect()
		if not button_rect.intersects(scroll_rect):
			continue
		var button_bottom := button_rect.position.y + button_rect.size.y
		if button_bottom > target_bottom:
			target_bottom = button_bottom
			target = button
	return target


func _move_statement_notebook_focus_horizontal(direction: int) -> bool:
	if _is_statement_notebook_single_column_layout():
		return false

	var focus_owner := get_viewport().gui_get_focus_owner() as Button
	if focus_owner == null:
		return false
	if _statement_notebook_overlay == null or not _statement_notebook_overlay.is_ancestor_of(focus_owner):
		return false

	var entry := _get_statement_notebook_focus_entry_for_button(focus_owner)
	if entry.is_empty():
		return false

	var current_column := String(entry.get("column", ""))
	var target_column := ""
	if direction > 0 and current_column == "character":
		target_column = "item"
	elif direction < 0 and current_column == "item":
		target_column = "character"
	if target_column.is_empty():
		return false

	var target := _get_statement_notebook_last_focused_button(target_column)
	if target == null:
		var target_buttons := _get_statement_notebook_column_buttons(target_column)
		target = _get_statement_notebook_column_button_at(target_buttons, int(entry.get("index", 0)))
	if target == null:
		return false

	_focus_statement_notebook_button(target)
	return true


func _get_statement_notebook_scroll_for_column(column: String) -> ScrollContainer:
	match column:
		"character":
			return _statement_notebook_character_scroll
		"item":
			return _statement_notebook_item_scroll
	return null


func _activate_statement_notebook_focus() -> bool:
	var focus_owner := get_viewport().gui_get_focus_owner() as Button
	if focus_owner == null:
		return false
	if _statement_notebook_overlay == null or not _statement_notebook_overlay.is_ancestor_of(focus_owner):
		return false
	if _get_statement_notebook_focus_entry_for_button(focus_owner).is_empty():
		return false
	focus_owner.emit_signal("pressed")
	return true


func _get_first_statement_notebook_focus_control() -> Control:
	if not _statement_notebook_focus_entries.is_empty():
		var button := _statement_notebook_focus_entries[0].get("button") as Control
		if button != null and is_instance_valid(button):
			return button
	if _statement_notebook_close_button != null and is_instance_valid(_statement_notebook_close_button):
		return _statement_notebook_close_button
	return null


func _on_statement_notebook_entry_focus_entered(button: Button, scroll: ScrollContainer) -> void:
	var entry := _get_statement_notebook_focus_entry_for_button(button)
	var column := String(entry.get("column", ""))
	if not column.is_empty():
		_statement_notebook_last_focus_by_column[column] = button
	set_preferred_focus_control(button)
	_ensure_statement_notebook_entry_visible(scroll, button)


func _ensure_statement_notebook_entry_visible(scroll: ScrollContainer, button: Control) -> void:
	if scroll == null or button == null or not is_instance_valid(scroll) or not is_instance_valid(button):
		return

	var scroll_bar := scroll.get_v_scroll_bar()
	if scroll_bar == null:
		return

	var scroll_rect := scroll.get_global_rect()
	var button_rect := button.get_global_rect()
	var max_scroll := maxf(0.0, scroll_bar.max_value - scroll_bar.page)
	var target_scroll := float(scroll.scroll_vertical)
	if button_rect.position.y < scroll_rect.position.y:
		target_scroll -= scroll_rect.position.y - button_rect.position.y + STATEMENT_NOTE_CARD_FOCUS_SCROLL_PADDING
	elif button_rect.position.y + button_rect.size.y > scroll_rect.position.y + scroll_rect.size.y:
		target_scroll += (button_rect.position.y + button_rect.size.y) - (scroll_rect.position.y + scroll_rect.size.y) + STATEMENT_NOTE_CARD_FOCUS_SCROLL_PADDING

	target_scroll = clampf(target_scroll, 0.0, max_scroll)
	if is_equal_approx(target_scroll, float(scroll.scroll_vertical)):
		return
	_animate_statement_notebook_scroll_to(scroll, target_scroll)


func _animate_statement_notebook_scroll_to(scroll: ScrollContainer, target_scroll: float) -> void:
	if scroll == null or not is_instance_valid(scroll):
		return

	var tween_key := scroll.get_instance_id()
	var existing_tween := _statement_notebook_scroll_tweens.get(tween_key) as Tween
	if existing_tween != null and existing_tween.is_valid():
		existing_tween.kill()

	var tween := create_tween()
	_statement_notebook_scroll_tweens[tween_key] = tween
	tween.set_ease(Tween.EASE_OUT)
	tween.set_trans(Tween.TRANS_SINE)
	tween.tween_property(
		scroll,
		"scroll_vertical",
		int(roundf(target_scroll)),
		STATEMENT_NOTE_CARD_FOCUS_SCROLL_DURATION
	)
	tween.finished.connect(func() -> void:
		if _statement_notebook_scroll_tweens.get(tween_key) == tween:
			_statement_notebook_scroll_tweens.erase(tween_key)
	, CONNECT_ONE_SHOT)


func _on_statement_notebook_entry_selected(kind: String, target_id: String) -> void:
	if _statement_active_lie_index < 0 or _statement_active_lie_index >= _statement_current_lies.size():
		return
	var lie: Dictionary = _statement_current_lies[_statement_active_lie_index]
	var next_id := _find_statement_reaction_next(lie, kind, target_id)
	_close_statement_notebook(false)
	if next_id.is_empty():
		_slide_statement_character_for_note(false)
		return
	var from_node_id := _current_node_id
	_slide_statement_character_for_note(false, func() -> void:
		if from_node_id.is_empty():
			return
		_statement_node_history.append(from_node_id)
		_transition_to_node(next_id)
	)


func _find_statement_reaction_next(lie: Dictionary, kind: String, target_id: String) -> String:
	var reactions: Variant = lie.get("reactions", [])
	if typeof(reactions) != TYPE_ARRAY:
		return ""

	var default_next := ""
	for raw_reaction in reactions:
		if typeof(raw_reaction) != TYPE_DICTIONARY:
			continue
		var reaction: Dictionary = raw_reaction
		var reaction_kind := String(reaction.get("kind", reaction.get("target_type", reaction.get("type", "")))).strip_edges().to_lower()
		var reaction_target := String(reaction.get("target_id", reaction.get("id", reaction.get("target", "")))).strip_edges()
		var reaction_next := String(reaction.get("next", "")).strip_edges()
		if reaction_next.is_empty():
			var child_nodes: Variant = reaction.get("nodes", [])
			if typeof(child_nodes) == TYPE_ARRAY and not (child_nodes as Array).is_empty():
				var first_child: Variant = (child_nodes as Array)[0]
				if typeof(first_child) == TYPE_DICTIONARY:
					reaction_next = String((first_child as Dictionary).get("id", "")).strip_edges()
		if reaction_kind == "default" or reaction_kind == "wrong" or reaction_kind == "invalid":
			default_next = reaction_next
			continue
		if reaction_kind == kind and reaction_target == target_id:
			return reaction_next
	return default_next


func _slide_statement_character_for_note(is_open: bool, on_finished: Callable = Callable()) -> void:
	_statement_note_animation_token += 1
	var animation_token := _statement_note_animation_token
	if is_open:
		_hide_statement_bystanders_for_note(func() -> void:
			if animation_token != _statement_note_animation_token or not _statement_note_open:
				return
			_play_statement_note_open_focus_animation(on_finished)
		)
	else:
		_restore_statement_stage_after_note(animation_token, on_finished)


func _play_statement_note_open_focus_animation(on_finished: Callable = Callable()) -> void:
	var remaining := [2]
	var finish_one := func() -> void:
		remaining[0] -= 1
		if remaining[0] > 0:
			return
		_invoke_portrait_finished(on_finished)

	_play_statement_notebook_open_animation(finish_one)
	_shift_statement_speaker_to_left_preset(finish_one)


func _restore_statement_stage_after_note(animation_token: int = -1, on_finished: Callable = Callable()) -> void:
	_restore_statement_character_shift(func() -> void:
		if animation_token >= 0 and animation_token != _statement_note_animation_token:
			return
		_restore_statement_bystanders_for_note(on_finished)
	)


func _shift_statement_speaker_to_left_preset(on_finished: Callable = Callable()) -> void:
	if _statement_character_shift_active or not _should_shift_statement_speaker_for_note():
		_invoke_portrait_finished(on_finished)
		return

	var speaker_id := _get_statement_note_speaker_id()
	if speaker_id.is_empty() or not _stage_character_slots.has(speaker_id):
		_invoke_portrait_finished(on_finished)
		return

	var slot: Dictionary = _stage_character_slots[speaker_id]
	var current_state: Dictionary = slot.get("state", {})
	if current_state.is_empty() or not bool(current_state.get("visible", false)):
		_invoke_portrait_finished(on_finished)
		return

	var left_offset := PortraitLayout.get_layout_offset("left", null)
	var texture := _get_texture_for_portrait_state(speaker_id, current_state)
	if texture == null:
		_invoke_portrait_finished(on_finished)
		return

	var target_state := current_state.duplicate(true)
	target_state["layout_offset"] = left_offset
	target_state["zoom_percent"] = PortraitLayout.snap_zoom_percent(STATEMENT_NOTE_SPEAKER_ZOOM)
	target_state["visible"] = true
	_statement_character_shift_active = true
	_statement_character_shift_speaker_id = speaker_id
	_statement_character_shift_original_state = current_state.duplicate(true)
	_animate_speaker_portrait_to(
		speaker_id,
		target_state,
		texture,
		on_finished,
		_resolve_cast_animation_speed(speaker_id, _get_current_speaker_cast_entry(speaker_id))
	)


func _restore_statement_character_shift(on_finished: Callable = Callable()) -> void:
	if not _statement_character_shift_active:
		_statement_character_shift_speaker_id = ""
		_statement_character_shift_original_state = {}
		_invoke_portrait_finished(on_finished)
		return

	var speaker_id := _statement_character_shift_speaker_id
	var target_state := _statement_character_shift_original_state.duplicate(true)
	_statement_character_shift_active = false
	_statement_character_shift_speaker_id = ""
	_statement_character_shift_original_state = {}
	if speaker_id.is_empty() or target_state.is_empty() or not _stage_character_slots.has(speaker_id):
		_invoke_portrait_finished(on_finished)
		return

	var texture := _get_texture_for_portrait_state(speaker_id, target_state)
	if texture == null:
		_invoke_portrait_finished(on_finished)
		return

	_animate_speaker_portrait_to(
		speaker_id,
		target_state,
		texture,
		on_finished,
		_resolve_cast_animation_speed(speaker_id, _get_current_speaker_cast_entry(speaker_id))
	)


func _hide_statement_bystanders_for_note(on_finished: Callable = Callable()) -> void:
	var speaker_id := _get_statement_note_speaker_id()
	if speaker_id.is_empty():
		_invoke_portrait_finished(on_finished)
		return

	var candidate_ids := {}
	for raw_id in _stage_characters.keys():
		candidate_ids[String(raw_id)] = true
	for raw_id in _stage_character_slots.keys():
		candidate_ids[String(raw_id)] = true
	for raw_id in _statement_note_hidden_character_states.keys():
		candidate_ids[String(raw_id)] = true

	var cast_ids: Array[String] = []
	var target_opacities: Dictionary = {}
	for raw_id in candidate_ids.keys():
		var cast_id := String(raw_id)
		if cast_id == speaker_id or cast_id.is_empty() or not _stage_character_slots.has(cast_id):
			continue

		var slot: Dictionary = _stage_character_slots[cast_id]
		var state: Dictionary = slot.get("state", {})
		var rect: TextureRect = slot.get("rect")
		var swap_rect: TextureRect = slot.get("swap_rect")
		var rect_visible := rect != null and rect.visible and rect.texture != null
		var swap_visible := swap_rect != null and swap_rect.visible and swap_rect.texture != null
		var state_visible := not state.is_empty() and bool(state.get("visible", false))
		var was_hidden_for_note := _statement_note_hidden_character_states.has(cast_id)
		if not rect_visible and not swap_visible and not state_visible and not was_hidden_for_note:
			continue

		_stop_slot_tween(slot, cast_id, false, false)
		_stop_slot_highlight_tween(slot)
		if not was_hidden_for_note:
			_statement_note_hidden_character_states[cast_id] = {
				"state": state.duplicate(true),
				"portrait_opacity": float(slot.get("portrait_opacity", _resolve_cast_opacity_for_node(cast_id))),
			}
		slot.erase("parallax_target_state")
		slot.erase("parallax_target_opacity")
		_parallax_target_speaker_ids.erase(cast_id)
		cast_ids.append(cast_id)
		target_opacities[cast_id] = 0.0

	_run_statement_note_bystander_opacity_animation(cast_ids, target_opacities, true, on_finished)


func _restore_statement_bystanders_for_note(on_finished: Callable = Callable()) -> void:
	if _statement_note_hidden_character_states.is_empty():
		_invoke_portrait_finished(on_finished)
		return

	var cast_ids: Array[String] = []
	var target_opacities: Dictionary = {}
	for raw_id in _statement_note_hidden_character_states.keys():
		var cast_id := String(raw_id)
		if not _stage_character_slots.has(cast_id):
			continue

		var saved: Dictionary = _statement_note_hidden_character_states[cast_id]
		var state: Dictionary = saved.get("state", {})
		var slot: Dictionary = _stage_character_slots[cast_id]
		var rect: TextureRect = slot.get("rect")
		var texture := _get_texture_for_portrait_state(cast_id, state)
		var opacity := float(saved.get("portrait_opacity", _resolve_cast_opacity_for_node(cast_id)))

		_stop_slot_tween(slot, cast_id, false)
		_stop_slot_highlight_tween(slot)
		if rect != null and texture != null and not state.is_empty():
			slot["state"] = state.duplicate(true)
			_apply_portrait_state_to_rect(rect, state, texture)
			_apply_slot_highlight(slot, 0.0)
			slot["portrait_opacity"] = 0.0
			cast_ids.append(cast_id)
			target_opacities[cast_id] = opacity
		_reset_slot_swap_rect(slot)

	if cast_ids.is_empty():
		_statement_note_hidden_character_states.clear()
		_sync_grid_background()
		_invoke_portrait_finished(on_finished)
		return

	_run_statement_note_bystander_opacity_animation(cast_ids, target_opacities, false, func() -> void:
		_statement_note_hidden_character_states.clear()
		_invoke_portrait_finished(on_finished)
	)


func _run_statement_note_bystander_opacity_animation(
	cast_ids: Array[String],
	target_opacities: Dictionary,
	hide_after: bool,
	on_finished: Callable = Callable()
) -> void:
	if cast_ids.is_empty():
		_invoke_portrait_finished(on_finished)
		return

	var remaining := [cast_ids.size()]
	var finish_one := func() -> void:
		remaining[0] -= 1
		if remaining[0] > 0:
			return
		_sync_grid_background()
		_invoke_portrait_finished(on_finished)

	for cast_id in cast_ids:
		if not _stage_character_slots.has(cast_id):
			finish_one.call()
			continue

		var slot: Dictionary = _stage_character_slots[cast_id]
		var rect: TextureRect = slot.get("rect")
		var swap_rect: TextureRect = slot.get("swap_rect")
		var rect_can_fade := rect != null and rect.visible and rect.texture != null
		var swap_can_fade := swap_rect != null and swap_rect.visible and swap_rect.texture != null
		if hide_after and not rect_can_fade and not swap_can_fade:
			finish_one.call()
			continue
		if not hide_after and (rect == null or rect.texture == null):
			finish_one.call()
			continue

		var start_opacity := clampf(float(slot.get("portrait_opacity", _resolve_cast_opacity_for_node(cast_id))), 0.0, 1.0)
		var target_opacity := clampf(float(target_opacities.get(cast_id, start_opacity)), 0.0, 1.0)
		if hide_after:
			var start_rect_modulate := rect.modulate if rect_can_fade else Color(1, 1, 1, 0)
			var start_swap_modulate := swap_rect.modulate if swap_can_fade else Color(1, 1, 1, 0)
			var start_alpha := maxf(start_rect_modulate.a, start_swap_modulate.a)
			start_opacity = minf(start_opacity, start_alpha)
			if start_alpha < 0.01:
				_finish_statement_note_bystander_opacity(cast_id, target_opacity, hide_after)
				finish_one.call()
				continue

			var fade_tween := _create_slot_tween(slot)
			slot["highlight_tween"] = fade_tween
			fade_tween.set_ease(Tween.EASE_IN_OUT)
			fade_tween.set_trans(Tween.TRANS_SINE)
			fade_tween.tween_method(
				func(progress: float) -> void:
					if rect_can_fade:
						var next_rect_modulate := start_rect_modulate
						next_rect_modulate.a = lerpf(start_rect_modulate.a, 0.0, progress)
						rect.modulate = next_rect_modulate
					if swap_can_fade:
						var next_swap_modulate := start_swap_modulate
						next_swap_modulate.a = lerpf(start_swap_modulate.a, 0.0, progress)
						swap_rect.modulate = next_swap_modulate
					slot["portrait_opacity"] = lerpf(start_opacity, target_opacity, progress)
					_sync_grid_background(),
				0.0,
				1.0,
				PortraitTransition.DURATION_FADE_OUT
			)
			fade_tween.finished.connect(func() -> void:
				slot["highlight_tween"] = null
				_finish_statement_note_bystander_opacity(cast_id, target_opacity, hide_after)
				finish_one.call()
			, CONNECT_ONE_SHOT)
			continue

		if absf(start_opacity - target_opacity) < 0.01:
			_apply_slot_highlight(slot, target_opacity)
			_finish_statement_note_bystander_opacity(cast_id, target_opacity, hide_after)
			finish_one.call()
			continue

		rect.visible = true
		var tween := _create_slot_tween(slot)
		slot["highlight_tween"] = tween
		tween.set_ease(Tween.EASE_IN_OUT)
		tween.set_trans(Tween.TRANS_SINE)
		tween.tween_method(
			func(opacity: float) -> void:
				_apply_slot_highlight(slot, opacity)
				_sync_grid_background(),
			start_opacity,
			target_opacity,
			PortraitTransition.DURATION_FADE_OUT if hide_after else PortraitTransition.DURATION_FADE_IN
		)
		tween.finished.connect(func() -> void:
			slot["highlight_tween"] = null
			_finish_statement_note_bystander_opacity(cast_id, target_opacity, hide_after)
			finish_one.call()
		, CONNECT_ONE_SHOT)


func _finish_statement_note_bystander_opacity(cast_id: String, opacity: float, hide_after: bool) -> void:
	if not _stage_character_slots.has(cast_id):
		return

	var slot: Dictionary = _stage_character_slots[cast_id]
	slot["portrait_opacity"] = opacity
	_apply_slot_highlight(slot, opacity)
	if not hide_after:
		return

	var state: Dictionary = slot.get("state", {})
	if not state.is_empty():
		var hidden_state := state.duplicate(true)
		hidden_state["visible"] = false
		slot["state"] = hidden_state
	var rect: TextureRect = slot.get("rect")
	if rect != null:
		rect.visible = false
	var swap_rect: TextureRect = slot.get("swap_rect")
	if swap_rect != null:
		swap_rect.visible = false


func _get_texture_for_portrait_state(speaker_id: String, state: Dictionary) -> Texture2D:
	var path := String(state.get("path", "")).strip_edges()
	if path.is_empty():
		return null
	if _stage_character_slots.has(speaker_id):
		var slot: Dictionary = _stage_character_slots[speaker_id]
		var rect: TextureRect = slot.get("rect")
		if rect != null and rect.texture != null:
			return rect.texture
	return _load_portrait_texture(path)


func _should_shift_statement_speaker_for_note() -> bool:
	if _character_layer == null or not _is_statement_presentation() or _current_node.is_empty():
		return false
	var speaker_id := _get_statement_note_speaker_id()
	if speaker_id.is_empty() or _is_narrator_speaker(speaker_id):
		return false
	return _stage_character_slots.has(speaker_id)


func _get_statement_note_speaker_id() -> String:
	var speaker_id := String(_current_node.get("speaker", "")).strip_edges()
	if speaker_id.is_empty() or _is_narrator_speaker(speaker_id):
		return ""
	return speaker_id


func _get_current_speaker_cast_entry(speaker_id: String) -> Dictionary:
	var cast_data: Variant = _current_node.get("stage_cast", {})
	if typeof(cast_data) == TYPE_DICTIONARY:
		var cast: Dictionary = cast_data
		if cast.has(speaker_id) and typeof(cast[speaker_id]) == TYPE_DICTIONARY:
			return cast[speaker_id]
	return {}


func _set_statement_phrase_selection_visible(visible: bool) -> void:
	for frame in _statement_phrase_selection_frames:
		if frame != null:
			frame.visible = visible


func _on_dialogue_text_resized() -> void:
	if _is_statement_main_node_active():
		_set_statement_phrase_selection_visible(false)
		_queue_statement_phrase_selection_frame_update()


func _queue_statement_phrase_selection_frame_update() -> void:
	if _statement_phrase_selection_update_queued:
		return
	_statement_phrase_selection_update_queued = true
	call_deferred("_flush_statement_phrase_selection_frame_update")


func _flush_statement_phrase_selection_frame_update() -> void:
	await RenderingServer.frame_post_draw
	_statement_phrase_selection_update_queued = false
	if _is_statement_main_node_active():
		_update_statement_phrase_selection_frame()


func _update_statement_phrase_selection_frame() -> void:
	if _statement_phrase_selection_frame == null:
		return
	if _statement_active_lie_index < 0 or _statement_active_lie_index >= _statement_lie_ranges.size():
		_statement_phrase_selection_frame.visible = false
		_set_statement_phrase_selection_visible(false)
		return

	var frame_rects := _compute_dialogue_visible_range_rects(_statement_lie_ranges[_statement_active_lie_index])
	if frame_rects.is_empty():
		_set_statement_phrase_selection_visible(false)
		return

	for index in frame_rects.size():
		var frame := _get_statement_phrase_selection_frame(index)
		_apply_statement_phrase_selection_frame_theme(frame)
		var frame_rect: Rect2 = frame_rects[index]
		var selection_padding := _get_statement_lie_selection_padding()
		var vertical_offset := _get_statement_lie_selection_vertical_offset()
		var padded_position := frame_rect.position - selection_padding + Vector2(0.0, vertical_offset)
		var padded_size := frame_rect.size + selection_padding * 2.0
		frame.position = Vector2(floorf(padded_position.x), floorf(padded_position.y))
		frame.size = Vector2(ceilf(padded_size.x), ceilf(padded_size.y))
		frame.visible = true

	for index in range(frame_rects.size(), _statement_phrase_selection_frames.size()):
		var frame := _statement_phrase_selection_frames[index]
		if frame != null:
			frame.visible = false


func _get_statement_phrase_selection_frame(index: int) -> PanelContainer:
	while _statement_phrase_selection_frames.size() <= index:
		var frame := _create_statement_phrase_selection_frame(
			"StatementPhraseSelectionFrame%d" % _statement_phrase_selection_frames.size()
		)
		_statement_phrase_selection_frames.append(frame)
		if _dialogue_text != null:
			_dialogue_text.add_child(frame)
	return _statement_phrase_selection_frames[index]


func _get_statement_lie_selection_padding() -> Vector2:
	return STATEMENT_LIE_SELECTION_PADDING.lerp(
		STATEMENT_LIE_SELECTION_PADDING_UNFOLDED,
		_dialogue_tall_factor
	)


func _get_statement_lie_selection_vertical_offset() -> float:
	return lerpf(
		STATEMENT_LIE_SELECTION_VERTICAL_OFFSET,
		STATEMENT_LIE_SELECTION_VERTICAL_OFFSET_UNFOLDED,
		_dialogue_tall_factor
	)


func _compute_dialogue_visible_range_rect(text_range: Vector2i) -> Rect2:
	var rects := _compute_dialogue_visible_range_rects(text_range)
	if rects.is_empty():
		return Rect2()

	var merged := rects[0]
	for index in range(1, rects.size()):
		merged = merged.merge(rects[index])
	return merged


func _compute_dialogue_visible_range_rects(text_range: Vector2i) -> Array[Rect2]:
	var rects: Array[Rect2] = []
	var parsed_text := _dialogue_text.get_parsed_text()
	if parsed_text.is_empty():
		return rects

	var start := clampi(text_range.x, 0, parsed_text.length())
	var end := clampi(text_range.y, start + 1, parsed_text.length())
	var first_line := _dialogue_text.get_character_line(start)
	var last_line := _dialogue_text.get_character_line(end - 1)
	if first_line < 0 or last_line < 0:
		return rects
	var normal_font := _dialogue_text.get_theme_font(&"normal_font")
	var normal_font_size := _dialogue_text.get_theme_font_size(&"normal_font_size")
	var phrase_font := _dialogue_text.get_theme_font(&"bold_font")
	var phrase_font_size := _dialogue_text.get_theme_font_size(&"bold_font_size")
	if normal_font == null:
		normal_font = ThemeDB.fallback_font
	if phrase_font == null:
		phrase_font = normal_font
		phrase_font_size = normal_font_size

	var content_offset := _get_dialogue_text_content_offset()
	for line in range(first_line, last_line + 1):
		var line_range := _dialogue_text.get_line_range(line)
		var line_start := maxi(start, line_range.x)
		var line_end := mini(end, line_range.y)
		if line_end <= line_start:
			continue

		var x := _measure_dialogue_visible_text_width(
			parsed_text,
			line_range.x,
			line_start,
			normal_font,
			normal_font_size,
			phrase_font,
			phrase_font_size
		)
		var width := _measure_dialogue_visible_text_width(
			parsed_text,
			line_start,
			line_end,
			normal_font,
			normal_font_size,
			phrase_font,
			phrase_font_size
		)
		var line_height := float(_dialogue_text.get_line_height(line))
		var font_height := phrase_font.get_height(phrase_font_size)
		var large_font_y_adjust := -maxf(
			0.0,
			(font_height - float(phrase_font_size)) * _dialogue_tall_factor * 0.5
		)
		var y := _dialogue_text.get_line_offset(line) + maxf(0.0, (line_height - font_height) * 0.5) + large_font_y_adjust
		var height := float(phrase_font_size)
		rects.append(Rect2(content_offset + Vector2(x, y), Vector2(maxf(width, 12.0), height)))

	return rects


func _get_dialogue_text_content_offset() -> Vector2:
	var normal_style := _dialogue_text.get_theme_stylebox(&"normal")
	if normal_style == null:
		return Vector2.ZERO
	return normal_style.get_offset()


func _measure_dialogue_visible_text_width(
	parsed_text: String,
	start: int,
	end: int,
	normal_font: Font,
	normal_font_size: int,
	phrase_font: Font,
	phrase_font_size: int
) -> float:
	if end <= start:
		return 0.0

	var width := 0.0
	var index := start
	while index < end:
		var in_lie := _is_statement_lie_character(index)
		var boundary := _next_statement_text_style_boundary(index, end, in_lie)
		var font := phrase_font if in_lie else normal_font
		var font_size := phrase_font_size if in_lie else normal_font_size
		width += font.get_string_size(
			parsed_text.substr(index, boundary - index),
			HORIZONTAL_ALIGNMENT_LEFT,
			-1,
			font_size
		).x
		index = boundary
	return width


func _is_statement_lie_character(character_index: int) -> bool:
	for lie_range in _statement_lie_ranges:
		if character_index >= lie_range.x and character_index < lie_range.y:
			return true
	return false


func _next_statement_text_style_boundary(index: int, end: int, in_lie: bool) -> int:
	var boundary := end
	for lie_range in _statement_lie_ranges:
		if lie_range.y <= index or lie_range.x >= end:
			continue
		if in_lie and index >= lie_range.x and index < lie_range.y:
			boundary = mini(boundary, lie_range.y)
		elif not in_lie and lie_range.x > index:
			boundary = mini(boundary, lie_range.x)
	return maxi(index + 1, boundary)


func _is_point_in_any_rect(point: Vector2, rects: Array[Rect2]) -> bool:
	for rect in rects:
		if rect.has_point(point):
			return true
	return false


func _sync_speaker_label_layout() -> void:
	if _speaker_label == null or _dialogue_border_frame == null:
		return

	if not _speaker_label.visible:
		_dialogue_border_frame.set_notch(0.0, 0.0, false)
		return

	var label_size := _speaker_label.get_minimum_size()
	_speaker_label.position = Vector2(SPEAKER_LABEL_LEFT, _get_speaker_label_top())
	_speaker_label.size = label_size

	var notch_left := SPEAKER_LABEL_LEFT - SPEAKER_LABEL_NOTCH_PADDING
	var notch_width := label_size.x + SPEAKER_LABEL_NOTCH_PADDING * 2.0
	_dialogue_border_frame.set_notch(notch_left, notch_width, true)


func _collect_characters_appearing_on_node(
	node: Dictionary,
	speaker_id: String,
	is_narrator: bool
) -> Array[String]:
	var ids: Array[String] = []
	if node.is_empty():
		return ids

	if not is_narrator and not speaker_id.is_empty() and not _is_narrator_speaker(speaker_id):
		ids.append(speaker_id)

	var cast_data: Variant = node.get("stage_cast", {})
	if typeof(cast_data) == TYPE_DICTIONARY:
		for key in cast_data.keys():
			var cast_id := String(key)
			if cast_id.is_empty() or _is_narrator_speaker(cast_id):
				continue
			var entry: Variant = cast_data[key]
			if typeof(entry) != TYPE_DICTIONARY:
				continue
			var cast_portrait := String(entry.get("portrait", "")).strip_edges()
			if not cast_portrait.is_empty() and not cast_id in ids:
				ids.append(cast_id)

	return ids


func _collect_stage_character_ids_for_node(node: Dictionary) -> Array[String]:
	var speaker_id := String(node.get("speaker", ""))
	var is_narrator := _is_narrator_speaker(speaker_id)
	return _collect_characters_appearing_on_node(node, speaker_id, is_narrator)


func _get_stage_speaker_ids_absent_from_node(node: Dictionary) -> Array[String]:
	var ids: Array[String] = []
	if node.is_empty():
		return ids

	var target_ids := {}
	for cast_id in _collect_stage_character_ids_for_node(node):
		target_ids[cast_id] = true

	for raw_id in _stage_characters.keys():
		var cast_id := String(raw_id)
		if cast_id.is_empty() or _is_narrator_speaker(cast_id):
			continue
		if target_ids.has(cast_id):
			continue
		if not cast_id in ids:
			ids.append(cast_id)

	return ids


func _prune_statement_stage_characters_for_node(node: Dictionary) -> void:
	if not _is_statement_presentation():
		return

	for cast_id in _get_stage_speaker_ids_absent_from_node(node):
		_stage_entering_ids.erase(cast_id)
		_stage_characters.erase(cast_id)
		_finalize_hide_character_slot(cast_id)


func _apply_stage_flags(node: Dictionary, speaker_id: String, is_narrator: bool) -> void:
	_stage_entering_ids.clear()

	for cast_id in _collect_characters_appearing_on_node(node, speaker_id, is_narrator):
		if _stage_characters.has(cast_id):
			continue
		_add_stage_character(cast_id)
		_stage_entering_ids[cast_id] = true


func _get_exit_speaker_ids_from_node(node: Dictionary) -> Array[String]:
	var ids: Array[String] = []
	if node.is_empty():
		return ids

	var cast_data: Variant = node.get("stage_cast", {})
	if typeof(cast_data) == TYPE_DICTIONARY:
		for key in cast_data.keys():
			var cast_id := String(key)
			if cast_id.is_empty() or _is_narrator_speaker(cast_id):
				continue
			var entry: Variant = cast_data[key]
			if typeof(entry) != TYPE_DICTIONARY:
				continue
			if not bool(entry.get("character_exit", false)):
				continue
			if _stage_characters.has(cast_id) and not cast_id in ids:
				ids.append(cast_id)

	return ids


func _get_transition_exit_speaker_ids(next_node: Dictionary) -> Array[String]:
	var ids := _get_exit_speaker_ids_from_node(_current_node)
	if not _is_statement_presentation():
		return ids

	for cast_id in _get_stage_speaker_ids_absent_from_node(next_node):
		if not cast_id in ids:
			ids.append(cast_id)

	return ids


func _fade_out_stage_characters(speaker_ids: Array[String], on_finished: Callable = Callable()) -> void:
	if speaker_ids.is_empty():
		_invoke_portrait_finished(on_finished)
		return

	_begin_cast_animation_batch(speaker_ids.size(), on_finished)
	var batch_job_done := Callable(self, "_mark_cast_animation_job_done")
	for speaker_id in speaker_ids:
		_remove_stage_character(
			speaker_id,
			_make_single_shot_callback(batch_job_done)
		)


func _transition_to_node(next_id: String) -> void:
	var next_node: Dictionary = {}
	var raw_next_node: Variant = _nodes_by_id.get(next_id, {})
	if typeof(raw_next_node) == TYPE_DICTIONARY:
		next_node = raw_next_node
	var exiting := _get_transition_exit_speaker_ids(next_node)
	if exiting.is_empty():
		_show_node(next_id)
		return

	_awaiting_portrait_for_dialogue = true
	_update_advance_hint()
	_fade_out_stage_characters(exiting, func() -> void:
		_show_node(next_id)
	)


func _add_stage_character(speaker_id: String) -> void:
	if speaker_id.is_empty() or _is_narrator_speaker(speaker_id):
		return
	if not _stage_characters.has(speaker_id):
		_stage_characters[speaker_id] = true


func _remove_stage_character(speaker_id: String, on_finished: Callable = Callable()) -> void:
	if not _stage_characters.has(speaker_id):
		_invoke_portrait_finished(on_finished)
		return

	_hide_character_slot(speaker_id, func() -> void:
		_stage_characters.erase(speaker_id)
		_invoke_portrait_finished(on_finished)
	)


func _clear_stage_characters() -> void:
	_stage_speaker_id = ""
	_dialogue_spectrum_active = false
	_dialogue_spectrum_speaker_id = ""
	_dialogue_spectrum = null
	_stage_entering_ids.clear()
	_statement_character_shift_active = false
	_statement_character_shift_speaker_id = ""
	_statement_character_shift_original_state = {}
	_statement_note_hidden_character_states.clear()
	_clear_parallax_targets()
	_stage_characters.clear()
	_clear_popup_images()
	for speaker_id in _stage_character_slots.keys():
		var slot: Dictionary = _stage_character_slots[speaker_id]
		_finalize_hide_character_slot(String(speaker_id))
		_queue_free_character_slot_nodes(slot)
	_stage_character_slots.clear()
	_portrait_has_layout = false
	_portrait_state = {}


func _get_character_slot(speaker_id: String) -> Dictionary:
	if _stage_character_slots.has(speaker_id):
		return _stage_character_slots[speaker_id]

	var root := Control.new()
	root.name = "CharacterSlot_%s" % speaker_id
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	_character_layer.add_child(root)

	var spectrum := DialogueSpectrum.new()
	spectrum.name = "DialogueSpectrum_%s" % speaker_id
	spectrum.visible = false
	root.add_child(spectrum)

	var rect := _create_portrait_rect("Portrait_%s" % speaker_id)
	var swap_rect := _create_portrait_rect("PortraitSwap_%s" % speaker_id)
	root.add_child(rect)
	root.add_child(swap_rect)
	var slot := {
		"root": root,
		"spectrum": spectrum,
		"rect": rect,
		"swap_rect": swap_rect,
		"tween": null,
		"highlight_tween": null,
		"state": {},
	}
	_stage_character_slots[speaker_id] = slot
	return slot


func _raise_character_slot(speaker_id: String) -> void:
	if not _stage_characters.has(speaker_id):
		return
	var slot := _get_character_slot(speaker_id)
	var root: Control = slot.get("root")
	if _character_layer == null:
		return
	if root != null:
		_character_layer.move_child(root, -1)
		return
	var rect: TextureRect = slot["rect"]
	var swap_rect: TextureRect = slot["swap_rect"]
	_character_layer.move_child(rect, -1)
	_character_layer.move_child(swap_rect, -1)


func _queue_free_character_slot_nodes(slot: Dictionary) -> void:
	var root: Control = slot.get("root")
	if root != null:
		root.queue_free()
		return

	var spectrum: DialogueSpectrum = slot.get("spectrum")
	if spectrum != null:
		spectrum.queue_free()
	var rect: TextureRect = slot.get("rect")
	if rect != null:
		rect.queue_free()
	var swap_rect: TextureRect = slot.get("swap_rect")
	if swap_rect != null:
		swap_rect.queue_free()


func _resolve_cast_portrait_opacity(
	cast_id: String,
	cast_entry: Dictionary
) -> float:
	if _statement_character_shift_active and cast_id == _statement_character_shift_speaker_id:
		return STATEMENT_NOTE_SPEAKER_OPACITY
	if cast_entry.has("portrait_opacity"):
		return clampf(float(cast_entry.get("portrait_opacity")), 0.0, 1.0)
	if cast_id == _stage_speaker_id:
		return STAGE_CAST_OPACITY_SPEAKER_DEFAULT
	return STAGE_CAST_OPACITY_BYSTANDER_DEFAULT


func _resolve_cast_opacity_for_node(cast_id: String) -> float:
	if _current_node.is_empty():
		return STAGE_CAST_OPACITY_BYSTANDER_DEFAULT
	var cast_entry: Dictionary = {}
	var cast_data: Variant = _current_node.get("stage_cast", {})
	if typeof(cast_data) == TYPE_DICTIONARY and cast_data.has(cast_id):
		var raw_entry: Variant = cast_data[cast_id]
		if typeof(raw_entry) == TYPE_DICTIONARY:
			cast_entry = raw_entry
	return _resolve_cast_portrait_opacity(cast_id, cast_entry)


func _refresh_stage_highlights(active_speaker_id: String, all_dim: bool = false, instant: bool = false) -> void:
	for speaker_id in _stage_characters.keys():
		var cid := String(speaker_id)
		if _should_skip_highlight_tween(cid):
			continue
		var slot := _get_character_slot(cid)
		var alpha := STAGE_CAST_OPACITY_BYSTANDER_DEFAULT if all_dim else _resolve_cast_opacity_for_node(cid)
		slot["portrait_opacity"] = alpha
		if instant:
			_apply_slot_highlight(slot, alpha)
		else:
			_tween_slot_highlight(slot, alpha)


func _should_skip_highlight_tween(speaker_id: String) -> bool:
	if _stage_entering_ids.has(speaker_id):
		return true
	var slot := _get_character_slot(speaker_id)
	var rect: TextureRect = slot.get("rect")
	if rect == null or not rect.visible or rect.texture == null:
		return true
	var portrait_tween: Tween = slot.get("tween")
	return portrait_tween != null and portrait_tween.is_valid()


func _apply_slot_highlight(slot: Dictionary, opacity: float) -> void:
	slot["portrait_opacity"] = opacity
	var modulate := PortraitTransition.opacity_to_modulate(opacity)
	var rect: TextureRect = slot["rect"]
	var swap_rect: TextureRect = slot["swap_rect"]
	if rect != null and rect.visible:
		rect.modulate = modulate
	if swap_rect != null and swap_rect.visible:
		swap_rect.modulate = modulate


func _stop_all_stage_portrait_tweens() -> void:
	_cast_batch_remaining = 0
	_cast_batch_on_finished = Callable()
	_clear_parallax_targets()
	for speaker_id in _stage_character_slots.keys():
		var slot: Dictionary = _stage_character_slots[speaker_id]
		_stop_slot_tween(slot, String(speaker_id), false)
		_stop_slot_highlight_tween(slot)


func _stop_slot_highlight_tween(slot: Dictionary) -> void:
	var highlight_tween: Tween = slot.get("highlight_tween")
	if highlight_tween != null:
		highlight_tween.kill()
	slot["highlight_tween"] = null


func _clear_parallax_targets() -> void:
	for speaker_id in _parallax_target_speaker_ids.keys():
		var cast_id := String(speaker_id)
		if not _stage_character_slots.has(cast_id):
			continue
		var slot: Dictionary = _stage_character_slots[cast_id]
		slot.erase("parallax_target_state")
		slot.erase("parallax_target_opacity")
	_parallax_target_speaker_ids.clear()


func _prepare_parallax_targets_for_jobs(jobs: Array) -> void:
	_clear_parallax_targets()
	for job in jobs:
		var cast_id := String(job.get("speaker_id", ""))
		if cast_id.is_empty():
			continue
		var to_state: Dictionary = job.get("state", {})
		if to_state.is_empty():
			continue
		var slot := _get_character_slot(cast_id)
		slot["parallax_target_state"] = to_state
		slot["parallax_target_opacity"] = float(job.get("portrait_opacity", _resolve_cast_opacity_for_node(cast_id)))
		_parallax_target_speaker_ids[cast_id] = true


func _tween_slot_highlight(
	slot: Dictionary,
	target_alpha: float,
	duration: float = STAGE_PORTRAIT_HIGHLIGHT_DURATION
) -> void:
	var rect: TextureRect = slot.get("rect")
	if rect == null or not rect.visible:
		return

	var start_opacity := float(slot.get("portrait_opacity", target_alpha))
	if absf(start_opacity - target_alpha) < 0.01:
		_apply_slot_highlight(slot, target_alpha)
		return

	_stop_slot_highlight_tween(slot)
	var tween := _create_slot_tween(slot)
	slot["highlight_tween"] = tween
	tween.set_ease(Tween.EASE_OUT)
	tween.set_trans(Tween.TRANS_SINE)
	tween.tween_method(
		func(progress: float) -> void:
			_apply_slot_highlight(slot, lerpf(start_opacity, target_alpha, progress)),
		0.0,
		1.0,
		duration
	)


func _play_stage_cast_animations(
	node: Dictionary,
	on_finished: Callable = Callable()
) -> void:
	var jobs: Array[Dictionary] = []
	var cast_data: Variant = node.get("stage_cast", {})

	if typeof(cast_data) == TYPE_DICTIONARY and not cast_data.is_empty():
		for key in cast_data.keys():
			var cast_id := String(key)
			if not _stage_characters.has(cast_id):
				continue
			var entry: Variant = cast_data[key]
			if typeof(entry) != TYPE_DICTIONARY:
				continue
			var job := _build_cast_animation_job(cast_id, entry)
			if not job.is_empty():
				jobs.append(job)

	if jobs.is_empty():
		for cast_id in _stage_characters.keys():
			var cid := String(cast_id)
			if not _stage_entering_ids.has(cid):
				continue
			var entry: Dictionary = {}
			if typeof(cast_data) == TYPE_DICTIONARY and cast_data.has(cid):
				var raw_entry: Variant = cast_data[cid]
				if typeof(raw_entry) == TYPE_DICTIONARY:
					entry = raw_entry
			var enter_job := _build_cast_animation_job(cid, entry)
			if not enter_job.is_empty():
				jobs.append(enter_job)

	if jobs.is_empty():
		_refresh_stage_highlights(_stage_speaker_id, false)
		_invoke_portrait_finished(on_finished)
		return

	_apply_stage_cast_position_spread(jobs)
	_sync_pending_dialogue_layout_offset_from_jobs(jobs)
	_stop_all_stage_portrait_tweens()
	_prepare_parallax_targets_for_jobs(jobs)

	var groups: Dictionary = {}
	for job in jobs:
		var order := int(job.get("order", 1))
		if order < 1:
			order = 1
		if not groups.has(order):
			groups[order] = []
		(groups[order] as Array).append(job)

	var orders: Array = groups.keys()
	orders.sort()
	_animate_cast_order_groups(orders, groups, 0, on_finished)


func _resolve_cast_position_key(cast_entry: Dictionary) -> String:
	var position := ""
	if cast_entry.has("portrait_position"):
		position = String(cast_entry.get("portrait_position", "")).strip_edges()
	if position.is_empty():
		position = "same"
	return PortraitLayout.normalize_position(position)


func _resolve_cast_position_order(cast_entry: Dictionary) -> int:
	return maxi(int(cast_entry.get("portrait_position_order", cast_entry.get("position_order", 1))), 1)


func _resolve_cast_layout_offset(
	cast_id: String,
	cast_entry: Dictionary
) -> Vector2:
	var key := _resolve_cast_position_key(cast_entry)
	if key == "custom":
		var offset_source: Variant = null
		if cast_entry.has("portrait_offset"):
			offset_source = cast_entry.get("portrait_offset")
		return PortraitLayout.get_layout_offset("custom", offset_source)

	if key == "same":
		if _stage_character_slots.has(cast_id):
			var slot_state: Dictionary = _stage_character_slots[cast_id].get("state", {})
			if not slot_state.is_empty() and slot_state.get("visible", false):
				return Vector2(slot_state.get("layout_offset", Vector2.ZERO))
		return PortraitLayout.get_layout_offset("center", null)

	return PortraitLayout.get_layout_offset(key, null)


func _apply_stage_cast_position_spread(jobs: Array[Dictionary]) -> void:
	var groups: Dictionary = {}
	for index in range(jobs.size()):
		var job: Dictionary = jobs[index]
		var key := String(job.get("position_key", ""))
		if not key in ["left", "center", "right"]:
			continue
		if not groups.has(key):
			groups[key] = []
		(groups[key] as Array).append({
			"job_index": index,
			"position_order": maxi(int(job.get("position_order", index + 1)), 1),
			"fallback_index": index,
		})

	for raw_key in groups.keys():
		var group: Array = groups[raw_key]
		if group.size() < 2:
			continue
		group.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
			var order_a := int(a.get("position_order", 1))
			var order_b := int(b.get("position_order", 1))
			if order_a == order_b:
				return int(a.get("fallback_index", 0)) < int(b.get("fallback_index", 0))
			return order_a < order_b
		)

		for stack_index in range(group.size()):
			var item: Dictionary = group[stack_index]
			var job_index := int(item.get("job_index", -1))
			if job_index < 0 or job_index >= jobs.size():
				continue
			var job: Dictionary = jobs[job_index]
			var state: Dictionary = job.get("state", {})
			if state.is_empty():
				continue
			var base_offset := Vector2(job.get("base_layout_offset", state.get("layout_offset", Vector2.ZERO)))
			state["layout_offset"] = PortraitLayout.apply_position_stack_spread(
				base_offset,
				stack_index,
				group.size()
			)
			job["state"] = state
			jobs[job_index] = job


func _sync_pending_dialogue_layout_offset_from_jobs(jobs: Array[Dictionary]) -> void:
	if _stage_speaker_id.is_empty() or _pending_dialogue.is_empty():
		return
	for job in jobs:
		if String(job.get("speaker_id", "")) != _stage_speaker_id:
			continue
		var state: Dictionary = job.get("state", {})
		if state.is_empty():
			return
		_pending_dialogue["layout_offset"] = Vector2(state.get("layout_offset", Vector2.ZERO))
		_pending_dialogue["zoom_percent"] = float(state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT))
		return


func _build_cast_animation_job(
	cast_id: String,
	cast_entry: Dictionary
) -> Dictionary:
	var profile := _get_speaker_profile(cast_id)
	var portrait_key := String(cast_entry.get("portrait", "")).strip_edges()
	if portrait_key.is_empty():
		return {}

	var portrait_entry := PortraitLayout.resolve_portrait_entry(profile, portrait_key)
	if portrait_entry.is_empty():
		return {}

	var portrait_path := String(portrait_entry.get("path", ""))
	var texture := _load_portrait_texture(portrait_path)
	if texture == null:
		return {}

	var zoom_percent := _resolve_cast_zoom_percent(cast_id, cast_entry)

	var position_key := _resolve_cast_position_key(cast_entry)
	var layout_offset := _resolve_cast_layout_offset(cast_id, cast_entry)

	var target_state := PortraitTransition.build_state(
		portrait_path,
		Vector2(texture.get_width(), texture.get_height()),
		portrait_entry.get("center", Vector2(0.5, 0.5)),
		float(zoom_percent),
		layout_offset,
		true,
		_resolve_cast_flip_h(cast_entry)
	)
	var order := int(cast_entry.get("animation_order", 1))
	var animation_speed := _resolve_cast_animation_speed(cast_id, cast_entry)
	var portrait_opacity := _resolve_cast_portrait_opacity(cast_id, cast_entry)

	return {
		"speaker_id": cast_id,
		"order": maxi(order, 1),
		"state": target_state,
		"texture": texture,
		"animation_speed": animation_speed,
		"portrait_opacity": portrait_opacity,
		"position_key": position_key,
		"position_order": _resolve_cast_position_order(cast_entry),
		"base_layout_offset": layout_offset,
	}


func _resolve_cast_zoom_percent(cast_id: String, cast_entry: Dictionary) -> int:
	if cast_entry.has("portrait_zoom"):
		return PortraitLayout.snap_zoom_percent(int(cast_entry.get("portrait_zoom")))
	if cast_id == _stage_speaker_id:
		return PortraitLayout.snap_zoom_percent(PortraitLayout.ZOOM_DEFAULT)
	return PortraitLayout.snap_zoom_percent(STAGE_CAST_ZOOM_BYSTANDER_DEFAULT)


func _resolve_cast_animation_speed(cast_id: String, cast_entry: Dictionary) -> float:
	if cast_entry.has("animation_speed"):
		return PortraitTransition.normalize_animation_speed(cast_entry.get("animation_speed"))
	if cast_id == _stage_speaker_id:
		return PortraitTransition.ANIMATION_SPEED_DEFAULT
	return PortraitTransition.normalize_animation_speed(STAGE_CAST_ANIMATION_SPEED_BYSTANDER_DEFAULT)


func _resolve_cast_flip_h(cast_entry: Dictionary) -> bool:
	return bool(cast_entry.get("portrait_flip_h", cast_entry.get("flip_h", false)))


func _portrait_anim_duration(base_duration: float, animation_speed: float) -> float:
	return PortraitTransition.scale_duration(base_duration, animation_speed)


func _animate_cast_order_groups(
	orders: Array,
	groups: Dictionary,
	index: int,
	on_finished: Callable
) -> void:
	if index >= orders.size():
		_clear_parallax_targets()
		_sync_grid_background()
		_refresh_stage_highlights(_stage_speaker_id, false)
		_invoke_portrait_finished(on_finished)
		return

	var batch: Array = groups[orders[index]]
	if batch.is_empty():
		_animate_cast_order_groups(orders, groups, index + 1, on_finished)
		return

	_run_cast_animation_batch_parallel(batch, func() -> void:
		_animate_cast_order_groups(orders, groups, index + 1, on_finished)
	)


func _run_cast_animation_batch_parallel(batch: Array, on_batch_finished: Callable) -> void:
	if batch.is_empty():
		_invoke_portrait_finished(on_batch_finished)
		return

	_begin_cast_animation_batch(batch.size(), on_batch_finished)
	var batch_job_done := Callable(self, "_mark_cast_animation_job_done")
	for job in batch:
		var cast_id: String = job["speaker_id"]
		var animation_speed := float(job.get("animation_speed", PortraitTransition.ANIMATION_SPEED_DEFAULT))
		_animate_speaker_portrait_to(
			cast_id,
			job["state"],
			job["texture"],
			batch_job_done,
			animation_speed
		)


func _apply_portrait_layout() -> void:
	for speaker_id in _stage_characters.keys():
		var slot := _get_character_slot(String(speaker_id))
		var state: Dictionary = slot["state"]
		if state.is_empty() or not state.get("visible", false):
			continue
		var rect: TextureRect = slot["rect"]
		if rect.texture != null:
			_apply_portrait_state_to_rect(rect, state, rect.texture)

	_refresh_stage_highlights(_stage_speaker_id, false)
	_sync_grid_background()
	if _portrait_state.is_empty() or not _portrait_state.get("visible", false):
		return
	_sync_dialogue_spectrum_layout(_portrait_layout_offset)


func _get_dialogue_spectrum_span() -> float:
	var display_size := _get_portrait_display_size()
	if display_size.x <= 0.0:
		return 0.0

	return display_size.x * SPECTRUM_PORTRAIT_WIDTH_RATIO * _get_dialogue_spectrum_zoom_size_factor()


func _get_dialogue_spectrum_zoom_size_factor() -> float:
	var size_ratio := _get_dialogue_spectrum_size_ratio()
	var min_ratio := float(PortraitLayout.ZOOM_MIN) / float(PortraitLayout.ZOOM_DEFAULT)
	if size_ratio >= 1.0:
		return 1.0
	return lerpf(SPECTRUM_MIN_ZOOM_SIZE_FACTOR, 1.0, inverse_lerp(min_ratio, 1.0, size_ratio))


func _get_portrait_zoom_percent() -> int:
	if not _portrait_state.is_empty():
		return int(_portrait_state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT))
	if _portrait_has_layout:
		return _portrait_zoom
	return PortraitLayout.ZOOM_DEFAULT


func _get_dialogue_spectrum_peak_alpha() -> float:
	var zoom_percent := float(_get_portrait_zoom_percent())
	return lerpf(
		SPECTRUM_MIN_ZOOM_ALPHA,
		SPECTRUM_MAX_ZOOM_ALPHA,
		inverse_lerp(float(PortraitLayout.ZOOM_MIN), float(PortraitLayout.ZOOM_MAX), zoom_percent)
	)


func _get_portrait_display_size() -> Vector2:
	if not _stage_speaker_id.is_empty() and _stage_character_slots.has(_stage_speaker_id):
		var slot: Dictionary = _stage_character_slots[_stage_speaker_id]
		var rect: TextureRect = slot["rect"]
		if rect != null and rect.visible and rect.size.x > 0.0:
			return rect.size

	if _portrait_state.is_empty() or not _portrait_state.get("visible", false):
		return Vector2.ZERO

	return _compute_portrait_display_rect(_portrait_state).size


func _get_dialogue_spectrum_size_ratio() -> float:
	var min_ratio := float(PortraitLayout.ZOOM_MIN) / float(PortraitLayout.ZOOM_DEFAULT)
	var max_ratio := float(PortraitLayout.ZOOM_MAX) / float(PortraitLayout.ZOOM_DEFAULT)
	var size_ratio := 1.0

	var display_size := _get_portrait_display_size()
	var reference_size := _get_reference_portrait_display_size()
	if display_size.y > 0.0 and reference_size.y > 0.0:
		size_ratio = display_size.y / reference_size.y
	elif not _portrait_state.is_empty():
		size_ratio = float(_portrait_state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT)) / float(
			PortraitLayout.ZOOM_DEFAULT
		)
	elif _portrait_has_layout:
		size_ratio = float(_portrait_zoom) / float(PortraitLayout.ZOOM_DEFAULT)

	return clampf(size_ratio, min_ratio, max_ratio)


func _get_dialogue_spectrum_scale() -> float:
	return (
		pow(_get_dialogue_spectrum_size_ratio(), SPECTRUM_HEIGHT_SCALE_POWER)
		* _get_dialogue_spectrum_zoom_size_factor()
	)


func _get_reference_portrait_display_size() -> Vector2:
	if _portrait_state.is_empty():
		return Vector2.ZERO

	var reference_state := _portrait_state.duplicate(true)
	reference_state["zoom_percent"] = PortraitLayout.ZOOM_DEFAULT
	return _compute_portrait_display_rect(reference_state).size


func _sync_dialogue_spectrum_layout(layout_offset: Vector2) -> void:
	if _dialogue_spectrum == null:
		return

	var spectrum_pos := PortraitLayout.compute_spectrum_position(
		_get_portrait_viewport_size(),
		layout_offset,
		_dialogue_spectrum_offset,
		_get_portrait_horizontal_safe_area(),
		_get_dialogue_spectrum_size_ratio(),
		float(_get_portrait_zoom_percent())
	)
	if not _dialogue_spectrum.position.is_equal_approx(spectrum_pos):
		_dialogue_spectrum.position = spectrum_pos

	var span := _get_dialogue_spectrum_span()
	if span > 0.0:
		_dialogue_spectrum.set_spectrum_layout(span, _get_dialogue_spectrum_scale())
	_dialogue_spectrum.set_peak_alpha(_get_dialogue_spectrum_peak_alpha())


func _get_dialogue_spectrum_for_speaker(speaker_id: String) -> DialogueSpectrum:
	if speaker_id.is_empty() or _is_narrator_speaker(speaker_id):
		return null
	var slot := _get_character_slot(speaker_id)
	return slot.get("spectrum") as DialogueSpectrum


func _is_portrait_rect_visually_present(rect: TextureRect) -> bool:
	return (
		rect != null
		and rect.visible
		and rect.texture != null
		and rect.modulate.a > 0.001
		and rect.size.x > 0.0
		and rect.size.y > 0.0
	)


func _is_speaker_portrait_visible_on_stage(speaker_id: String) -> bool:
	if speaker_id.is_empty() or _is_narrator_speaker(speaker_id):
		return false
	if not _stage_character_slots.has(speaker_id):
		return false

	var slot: Dictionary = _stage_character_slots[speaker_id]
	var state: Dictionary = slot.get("state", {})
	if not _is_visible_portrait_state(state):
		return false

	var portrait_opacity := clampf(
		float(slot.get("portrait_opacity", _resolve_cast_opacity_for_node(speaker_id))),
		0.0,
		1.0
	)
	if portrait_opacity <= 0.001:
		return false

	var rect: TextureRect = slot.get("rect")
	var swap_rect: TextureRect = slot.get("swap_rect")
	return _is_portrait_rect_visually_present(rect) or _is_portrait_rect_visually_present(swap_rect)


func _set_active_dialogue_spectrum(speaker_id: String) -> bool:
	var spectrum := _get_dialogue_spectrum_for_speaker(speaker_id)
	if spectrum == null:
		return false

	if _dialogue_spectrum != null and _dialogue_spectrum != spectrum:
		_dialogue_spectrum.set_noise_mode(false)
		_dialogue_spectrum.finish_line(true)
		_dialogue_spectrum.visible = false

	_dialogue_spectrum = spectrum
	_dialogue_spectrum_speaker_id = speaker_id
	_raise_character_slot(speaker_id)
	return true


func _show_dialogue_spectrum(
	line_text: String,
	speaker_color: Color,
	layout_offset: Vector2,
	spectrum_offset: Vector2 = Vector2.ZERO,
	speaker_id: String = ""
) -> void:
	var target_speaker_id := speaker_id
	if target_speaker_id.is_empty():
		target_speaker_id = _stage_speaker_id
	if not _is_speaker_portrait_visible_on_stage(target_speaker_id):
		_hide_dialogue_spectrum()
		return
	if not _set_active_dialogue_spectrum(target_speaker_id):
		return

	_dialogue_spectrum_active = true
	_dialogue_spectrum_layout_offset = layout_offset
	_dialogue_spectrum_offset = spectrum_offset
	_refresh_statement_noise_mode()
	_sync_dialogue_spectrum_layout(layout_offset)
	_dialogue_spectrum.play_line(line_text, speaker_color)


func _get_node_voice_audio_path(node: Dictionary) -> String:
	var raw_path := ""
	var metadata: Variant = node.get("metadata", {})
	if typeof(metadata) == TYPE_DICTIONARY:
		var meta: Dictionary = metadata
		raw_path = String(meta.get("voice_audio", meta.get("audio_path", ""))).strip_edges()
	if raw_path.is_empty():
		raw_path = String(node.get("voice_audio", node.get("audio_path", ""))).strip_edges()
	if raw_path.is_empty():
		return ""
	if raw_path.begins_with("res://") or raw_path.begins_with("user://"):
		return raw_path
	return "res://%s" % raw_path.trim_prefix("/")


func _stop_voice_audio() -> void:
	if _voice_player == null:
		return
	_voice_player.stop()
	_voice_player.stream = null


func _play_node_voice_audio(node: Dictionary) -> void:
	if _voice_player == null:
		return
	var audio_path := _get_node_voice_audio_path(node)
	if audio_path.is_empty():
		return
	_play_voice_audio_path(audio_path)


func _play_voice_audio_path(audio_path: String) -> void:
	if _voice_player == null or audio_path.is_empty():
		return
	var stream := load(audio_path) as AudioStream
	if stream == null:
		return
	_voice_player.stop()
	_voice_player.stream = stream
	_voice_player.play()


func _play_statement_title_pending_spectrum() -> void:
	if _statement_title_pending_spectrum.is_empty():
		return

	var pending := _statement_title_pending_spectrum
	_statement_title_pending_spectrum = {}
	var speaker_id := String(pending.get("speaker_id", ""))
	var speaker_color: Color = pending.get("speaker_color", DEFAULT_SPEAKER_COLOR)
	var layout_offset: Vector2 = pending.get("layout_offset", Vector2.ZERO)
	var spectrum_offset: Vector2 = pending.get("spectrum_offset", Vector2.ZERO)
	_show_dialogue_spectrum(
		String(pending.get("line_text", "")),
		speaker_color,
		layout_offset,
		spectrum_offset,
		speaker_id
	)


func _play_statement_title_pending_voice() -> void:
	if _statement_title_pending_voice_path.is_empty():
		return
	var audio_path := _statement_title_pending_voice_path
	_statement_title_pending_voice_path = ""
	_play_voice_audio_path(audio_path)


func _hide_dialogue_spectrum() -> void:
	_dialogue_spectrum_active = false
	_dialogue_spectrum_speaker_id = ""
	_dialogue_spectrum_offset = Vector2.ZERO
	if _dialogue_spectrum == null:
		return

	_dialogue_spectrum.set_noise_mode(false)
	_dialogue_spectrum.finish_line(true)


func _on_dialogue_visible_character_changed(visible_count: int, total_count: int) -> void:
	if _dialogue_spectrum == null or not _dialogue_spectrum_active:
		return

	_dialogue_spectrum.set_typing_progress(visible_count, total_count)
	if _is_statement_main_node_active():
		_queue_statement_phrase_selection_frame_update()
		call_deferred("_sync_statement_hover_from_mouse_position")


func _on_dialogue_typewriter_finished() -> void:
	var is_statement := _is_statement_main_node_active()
	if is_statement:
		_statement_lie_revealing = false
		_sync_statement_hover_from_mouse_position()
	if _dialogue_spectrum != null and _dialogue_spectrum_active:
		_dialogue_spectrum.finish_line()
	if is_statement:
		_refresh_statement_noise_mode()
		_refresh_statement_controls()
		call_deferred("_sync_statement_hover_from_mouse_position")


func _on_dialogue_speed_range_active_changed(is_active: bool) -> void:
	if not _is_statement_main_node_active():
		return
	_statement_lie_revealing = is_active
	_refresh_statement_noise_mode()


func _apply_speaker_portrait_state(
	speaker_id: String,
	state: Dictionary,
	texture: Texture2D,
	apply_highlight: bool = true
) -> void:
	var slot := _get_character_slot(speaker_id)
	var rect: TextureRect = slot["rect"]
	if not _apply_portrait_state_to_rect(rect, state, texture):
		if rect != null and rect.visible and rect.texture != null:
			_apply_slot_highlight(slot, _resolve_cast_opacity_for_node(speaker_id))
		return

	slot["state"] = state.duplicate(true)
	slot["portrait_opacity"] = _resolve_cast_opacity_for_node(speaker_id)
	_stage_characters[speaker_id] = true
	if speaker_id == _stage_speaker_id:
		_portrait_state = state.duplicate(true)
		_portrait_face_center = Vector2(state.get("face_center", Vector2(0.5, 0.5)))
		_portrait_zoom = int(round(float(state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT))))
		_portrait_layout_offset = Vector2(state.get("layout_offset", Vector2.ZERO))
		_portrait_has_layout = true
		if _dialogue_spectrum_active:
			_sync_dialogue_spectrum_layout(_portrait_layout_offset)
	_sync_grid_background()
	if apply_highlight:
		_tween_slot_highlight(slot, _resolve_cast_opacity_for_node(speaker_id))


func _apply_portrait_state_to_rect(rect: TextureRect, state: Dictionary, texture: Texture2D) -> bool:
	if _character_layer == null or texture == null:
		return false
	if rect == null:
		return false

	var display_rect := _compute_portrait_display_rect(state)
	if display_rect.size.x <= 0.0 or display_rect.size.y <= 0.0:
		return false

	rect.position = display_rect.position
	rect.size = display_rect.size
	rect.texture = texture
	rect.flip_h = bool(state.get("flip_h", false))
	rect.visible = true
	return true


func _reset_slot_swap_rect(slot: Dictionary) -> void:
	var swap_rect: TextureRect = slot["swap_rect"]
	if swap_rect == null:
		return
	swap_rect.visible = false
	swap_rect.texture = null
	swap_rect.flip_h = false
	swap_rect.modulate = Color.WHITE


func _animate_speaker_portrait_to(
	speaker_id: String,
	target_state: Dictionary,
	texture: Texture2D,
	on_finished: Callable = Callable(),
	animation_speed: float = PortraitTransition.ANIMATION_SPEED_DEFAULT
) -> void:
	var notify_done := _make_single_shot_callback(on_finished)
	var slot := _get_character_slot(speaker_id)
	var rect: TextureRect = slot["rect"]
	var swap_rect: TextureRect = slot["swap_rect"]
	var from_state: Dictionary = slot["state"]
	var target_alpha := _resolve_cast_opacity_for_node(speaker_id)
	_stop_slot_tween(slot, speaker_id, false)
	_stop_slot_highlight_tween(slot)

	var force_enter_fade := _stage_entering_ids.has(speaker_id)
	if force_enter_fade:
		_stage_entering_ids.erase(speaker_id)

	var needs_enter_fade := (
		force_enter_fade
		or from_state.is_empty()
		or not bool(from_state.get("visible", false))
		or not rect.visible
	)
	if needs_enter_fade:
		var new_state := target_state.duplicate(true)
		slot["state"] = new_state
		rect.modulate = Color(1, 1, 1, 0)
		if swap_rect != null:
			swap_rect.modulate = Color(1, 1, 1, 0)
		_apply_speaker_portrait_state(speaker_id, new_state, texture, false)
		var tween := _create_slot_tween(slot)
		slot["tween"] = tween
		tween.set_parallel(true)
		tween.set_ease(Tween.EASE_OUT)
		tween.set_trans(Tween.TRANS_SINE)
		var fade_in_duration := _portrait_anim_duration(PortraitTransition.DURATION_FADE_IN, animation_speed)
		var target_modulate := PortraitTransition.opacity_to_modulate(target_alpha)
		slot["portrait_opacity"] = target_alpha
		tween.tween_property(rect, "modulate", target_modulate, fade_in_duration)
		if swap_rect != null and swap_rect.visible:
			tween.tween_property(swap_rect, "modulate", target_modulate, fade_in_duration)
		tween.finished.connect(func() -> void:
			slot["tween"] = null
			_invoke_portrait_finished(notify_done)
		, CONNECT_ONE_SHOT)
		return

	var needs_geometry := PortraitTransition.geometry_changed(from_state, target_state)
	var needs_texture := PortraitTransition.texture_changed(from_state, target_state)

	if not needs_geometry and not needs_texture:
		_apply_speaker_portrait_state(speaker_id, target_state.duplicate(true), texture, false)
		var current_opacity := float(slot.get("portrait_opacity", target_alpha))
		if absf(current_opacity - target_alpha) > 0.01:
			_tween_slot_highlight(slot, target_alpha)
			var highlight_tween: Tween = slot.get("highlight_tween")
			if highlight_tween != null:
				highlight_tween.finished.connect(func() -> void:
					_invoke_portrait_finished(notify_done)
				, CONNECT_ONE_SHOT)
			else:
				_invoke_portrait_finished(notify_done)
		else:
			_invoke_portrait_finished(notify_done)
		return

	if needs_geometry:
		_tween_speaker_portrait_layout(
			speaker_id, from_state, target_state, texture, needs_texture, notify_done, animation_speed
		)
		return

	_tween_speaker_portrait_expression(
		speaker_id, from_state, target_state, texture, notify_done, animation_speed
	)


func _tween_speaker_portrait_layout(
	speaker_id: String,
	from_state: Dictionary,
	to_state: Dictionary,
	texture: Texture2D,
	swap_texture: bool,
	on_finished: Callable = Callable(),
	animation_speed: float = PortraitTransition.ANIMATION_SPEED_DEFAULT
) -> void:
	var slot := _get_character_slot(speaker_id)
	var rect: TextureRect = slot["rect"]
	var swap_rect: TextureRect = slot["swap_rect"]
	var start_state := from_state.duplicate(true)
	var end_state := to_state.duplicate(true)
	var duration := _portrait_anim_duration(
		PortraitTransition.pick_layout_duration(from_state, to_state),
		animation_speed
	)
	var current_texture := rect.texture
	var target_alpha := _resolve_cast_opacity_for_node(speaker_id)
	if swap_texture:
		duration = maxf(
			duration,
			_portrait_anim_duration(PortraitTransition.DURATION_LAYOUT_SWAP, animation_speed)
		)

	if swap_texture:
		swap_rect.modulate = Color(1, 1, 1, 0)
		var swap_start_state := PortraitTransition.interpolate_layout_state(end_state, start_state, end_state, 0.0)
		_apply_portrait_state_to_rect(swap_rect, swap_start_state, texture)

	var update_layout := func(progress: float) -> void:
		var blended_offset := Vector2(from_state.get("layout_offset", Vector2.ZERO)).lerp(
			Vector2(to_state.get("layout_offset", Vector2.ZERO)),
			progress
		)
		var parallax_state: Dictionary = {}
		if swap_texture:
			var from_blended := PortraitTransition.interpolate_layout_state(start_state, start_state, end_state, progress)
			var to_blended := PortraitTransition.interpolate_layout_state(end_state, start_state, end_state, progress)
			_apply_portrait_state_to_rect(rect, from_blended, current_texture)
			_apply_portrait_state_to_rect(swap_rect, to_blended, texture)
			parallax_state = to_blended
		else:
			var blended := PortraitTransition.interpolate_state(start_state, end_state, progress)
			_apply_portrait_state_to_rect(rect, blended, rect.texture)
			parallax_state = blended
		slot["state"] = parallax_state
		if speaker_id == _stage_speaker_id:
			_portrait_state = parallax_state
			_portrait_face_center = Vector2(parallax_state.get("face_center", Vector2(0.5, 0.5)))
			_portrait_zoom = int(round(float(parallax_state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT))))
			_portrait_layout_offset = blended_offset
			_sync_dialogue_spectrum_layout(blended_offset)
		_sync_grid_background()

	var tween := _create_slot_tween(slot)
	slot["tween"] = tween
	tween.set_parallel(true)
	tween.set_ease(Tween.EASE_OUT)
	tween.set_trans(Tween.TRANS_SINE)
	tween.tween_method(update_layout, 0.0, 1.0, duration)
	var target_modulate := PortraitTransition.opacity_to_modulate(target_alpha)
	if swap_texture:
		tween.tween_property(rect, "modulate", Color(1, 1, 1, 0), duration)
		tween.tween_property(swap_rect, "modulate", target_modulate, duration)
	elif absf(float(slot.get("portrait_opacity", target_alpha)) - target_alpha) > 0.01:
		tween.tween_property(rect, "modulate", target_modulate, duration)
	tween.finished.connect(func() -> void:
		slot["tween"] = null
		_finish_portrait_transition(slot, speaker_id, end_state, texture, on_finished)
	)


func _finish_portrait_transition(
	slot: Dictionary,
	speaker_id: String,
	end_state: Dictionary,
	texture: Texture2D,
	on_finished: Callable
) -> void:
	_reset_slot_swap_rect(slot)
	_apply_speaker_portrait_state(speaker_id, end_state, texture, false)
	# 스왑 애니 중 rect.modulate.a가 0인 채로 남는 경우가 있어 반드시 복구한다.
	_apply_slot_highlight(slot, _resolve_cast_opacity_for_node(speaker_id))
	_invoke_portrait_finished(on_finished)


func _tween_speaker_portrait_expression(
	speaker_id: String,
	_from_state: Dictionary,
	to_state: Dictionary,
	texture: Texture2D,
	on_finished: Callable = Callable(),
	animation_speed: float = PortraitTransition.ANIMATION_SPEED_DEFAULT
) -> void:
	var slot := _get_character_slot(speaker_id)
	var rect: TextureRect = slot["rect"]
	var swap_rect: TextureRect = slot["swap_rect"]
	var end_state := to_state.duplicate(true)
	var target_alpha := _resolve_cast_opacity_for_node(speaker_id)

	var tween := _create_slot_tween(slot)
	slot["tween"] = tween
	tween.set_parallel(true)
	tween.set_ease(Tween.EASE_OUT)
	tween.set_trans(Tween.TRANS_SINE)
	swap_rect.modulate = Color(1, 1, 1, 0)
	_apply_portrait_state_to_rect(swap_rect, end_state, texture)
	var expression_duration := _portrait_anim_duration(PortraitTransition.DURATION_EXPRESSION, animation_speed)
	var target_modulate := PortraitTransition.opacity_to_modulate(target_alpha)
	tween.tween_property(rect, "modulate", Color(1, 1, 1, 0), expression_duration)
	tween.tween_property(swap_rect, "modulate", target_modulate, expression_duration)
	tween.finished.connect(func() -> void:
		slot["tween"] = null
		_finish_portrait_transition(slot, speaker_id, end_state, texture, on_finished)
	)


func _stop_slot_tween(
	slot: Dictionary,
	speaker_id: String = "",
	restore_highlight: bool = true,
	reset_swap_rect: bool = true
) -> void:
	var tween: Tween = slot.get("tween")
	if tween != null:
		tween.kill()
	slot["tween"] = null
	if restore_highlight and not speaker_id.is_empty():
		_tween_slot_highlight(slot, _resolve_cast_opacity_for_node(speaker_id))
	if reset_swap_rect:
		_reset_slot_swap_rect(slot)


func _hide_character_slot(speaker_id: String, on_finished: Callable = Callable()) -> void:
	if not _stage_character_slots.has(speaker_id):
		_invoke_portrait_finished(on_finished)
		return

	var slot: Dictionary = _stage_character_slots[speaker_id]
	var rect: TextureRect = slot["rect"]
	var swap_rect: TextureRect = slot["swap_rect"]
	_stop_slot_tween(slot, speaker_id, false, false)
	_stop_slot_highlight_tween(slot)
	var rect_can_fade := rect != null and rect.visible and rect.texture != null
	var swap_can_fade := swap_rect != null and swap_rect.visible and swap_rect.texture != null
	var should_fade := rect_can_fade or swap_can_fade
	if should_fade:
		var start_rect_modulate := rect.modulate if rect_can_fade else Color(1, 1, 1, 0)
		var start_swap_modulate := swap_rect.modulate if swap_can_fade else Color(1, 1, 1, 0)
		var start_alpha := maxf(start_rect_modulate.a, start_swap_modulate.a)
		var start_opacity := minf(
			clampf(float(slot.get("portrait_opacity", _resolve_cast_opacity_for_node(speaker_id))), 0.0, 1.0),
			start_alpha
		)
		var tween := _create_slot_tween(slot)
		slot["tween"] = tween
		tween.set_ease(Tween.EASE_IN)
		tween.set_trans(Tween.TRANS_SINE)
		tween.tween_method(
			func(progress: float) -> void:
				if rect_can_fade:
					var next_rect_modulate := start_rect_modulate
					next_rect_modulate.a = lerpf(start_rect_modulate.a, 0.0, progress)
					rect.modulate = next_rect_modulate
				if swap_can_fade:
					var next_swap_modulate := start_swap_modulate
					next_swap_modulate.a = lerpf(start_swap_modulate.a, 0.0, progress)
					swap_rect.modulate = next_swap_modulate
				slot["portrait_opacity"] = lerpf(start_opacity, 0.0, progress)
				_sync_grid_background(),
			0.0,
			1.0,
			PortraitTransition.DURATION_FADE_OUT
		)
		tween.finished.connect(func() -> void:
			slot["tween"] = null
			_finalize_hide_character_slot(speaker_id)
			_invoke_portrait_finished(on_finished)
		, CONNECT_ONE_SHOT)
		return

	_finalize_hide_character_slot(speaker_id)
	_invoke_portrait_finished(on_finished)


func _finalize_hide_character_slot(speaker_id: String) -> void:
	if not _stage_character_slots.has(speaker_id):
		return

	var slot: Dictionary = _stage_character_slots[speaker_id]
	_stop_slot_tween(slot, speaker_id)
	_stop_slot_highlight_tween(slot)
	slot.erase("parallax_target_state")
	slot.erase("parallax_target_opacity")
	_parallax_target_speaker_ids.erase(speaker_id)
	slot["state"] = {}
	var spectrum: DialogueSpectrum = slot.get("spectrum")
	if spectrum != null:
		spectrum.set_noise_mode(false)
		spectrum.finish_line(true)
		spectrum.visible = false
	var rect: TextureRect = slot["rect"]
	if rect != null:
		rect.visible = false
		rect.texture = null
		rect.flip_h = false
		rect.modulate = Color.WHITE
	_reset_slot_swap_rect(slot)

	if speaker_id == _stage_speaker_id:
		_portrait_has_layout = false
		_portrait_state = {}
	if speaker_id == _dialogue_spectrum_speaker_id:
		_dialogue_spectrum_active = false
		_dialogue_spectrum_speaker_id = ""
		_dialogue_spectrum = null


func _load_portrait_texture(path: String) -> Texture2D:
	if _portrait_texture_cache.has(path):
		return _portrait_texture_cache[path] as Texture2D

	var texture := load(path) as Texture2D
	if texture != null:
		_portrait_texture_cache[path] = texture
	return texture


func _on_portrait_viewport_resized() -> void:
	_apply_portrait_layout()
	_apply_popup_layouts()
	_sync_grid_background()
	_sync_choice_layout()


func _get_choice_stage_size() -> Vector2:
	if _choice_overlay != null and _choice_overlay.size.x > 0.0 and _choice_overlay.size.y > 0.0:
		return _choice_overlay.size
	return _get_portrait_viewport_size()


func _choice_scaled_x(reference_value: float, stage_size: Vector2) -> float:
	if CHOICE_REFERENCE_STAGE_SIZE.x <= 0.0:
		return reference_value
	var width_scale := stage_size.x / CHOICE_REFERENCE_STAGE_SIZE.x
	var height_scale := 1.0
	if CHOICE_REFERENCE_STAGE_SIZE.y > 0.0:
		height_scale = stage_size.y / CHOICE_REFERENCE_STAGE_SIZE.y
	return reference_value * minf(width_scale, height_scale)


func _choice_scaled_y(reference_value: float, stage_size: Vector2) -> float:
	if CHOICE_REFERENCE_STAGE_SIZE.y <= 0.0:
		return reference_value
	return reference_value * stage_size.y / CHOICE_REFERENCE_STAGE_SIZE.y


func _get_choice_dialogue_width_scale(stage_size: Vector2) -> float:
	var dialogue_range := _get_dialogue_window_x_range(stage_size)
	var dialogue_width := maxf(dialogue_range.y - dialogue_range.x, 1.0)
	return clampf(
		dialogue_width / DialoguePanelLayout.MAX_WIDTH,
		CHOICE_DIALOGUE_WIDTH_MIN_SCALE,
		1.0
	)


func _get_choice_resolution_scale(stage_size: Vector2) -> float:
	var height_scale := 1.0
	if CHOICE_REFERENCE_STAGE_SIZE.y > 0.0:
		height_scale = clampf(
			stage_size.y / CHOICE_REFERENCE_STAGE_SIZE.y,
			CHOICE_VIEWPORT_HEIGHT_MIN_SCALE,
			1.0
		)
	return minf(_get_choice_dialogue_width_scale(stage_size), height_scale)


func _get_choice_button_size(_choice_count := 0, _character_side := "", _speaker_scale := -1.0) -> Vector2:
	var stage_size := _get_choice_stage_size()
	var margin_x := _choice_scaled_x(CHOICE_STAGE_MARGIN_X, stage_size)
	var margin_top := _choice_scaled_y(CHOICE_STAGE_MARGIN_TOP, stage_size)
	var margin_bottom := _choice_scaled_y(CHOICE_STAGE_MARGIN_BOTTOM, stage_size)
	var separation := _choice_scaled_y(CHOICE_LIST_SEPARATION, stage_size)
	var resolution_scale := _get_choice_resolution_scale(stage_size)
	var available_width := maxf(stage_size.x - margin_x * 2.0, 1.0)
	var available_height := maxf(stage_size.y - margin_top - margin_bottom, 1.0)
	var resolved_scale := _speaker_scale
	if resolved_scale < 0.0:
		resolved_scale = _get_choice_speaker_scale()
	var choice_count := maxi(_choice_count, 1)
	var width_scale := resolved_scale * _get_choice_dialogue_width_scale(stage_size)
	var min_width := minf(_choice_scaled_x(CHOICE_PANEL_MIN_WIDTH, stage_size) * width_scale, available_width)
	var max_width := minf(_choice_scaled_x(CHOICE_PANEL_MAX_WIDTH, stage_size) * width_scale, available_width)
	var target_width := minf(_choice_scaled_x(CHOICE_PANEL_WIDTH, stage_size) * width_scale, available_width)
	var target_height := _choice_scaled_y(CHOICE_BUTTON_MIN_HEIGHT, stage_size) * resolved_scale
	var max_height := maxf(
		(available_height - float(choice_count - 1) * separation) / float(choice_count),
		1.0
	)
	if max_width < min_width:
		max_width = min_width
	return Vector2(
		clampf(target_width, min_width, max_width),
		minf(target_height, max_height)
	)


func _is_visible_portrait_state(state: Dictionary) -> bool:
	return not state.is_empty() and bool(state.get("visible", false))


func _get_choice_speaker_portrait_state() -> Dictionary:
	if not _stage_speaker_id.is_empty() and _stage_character_slots.has(_stage_speaker_id):
		var slot: Dictionary = _stage_character_slots[_stage_speaker_id]
		var target_state: Dictionary = slot.get("parallax_target_state", {})
		if _is_visible_portrait_state(target_state):
			return target_state

		var state: Dictionary = slot.get("state", {})
		if _is_visible_portrait_state(state):
			return state

	if _is_visible_portrait_state(_portrait_state):
		return _portrait_state

	return {}


func _get_choice_speaker_scale() -> float:
	var zoom_percent := _get_choice_speaker_zoom_percent()
	var zoom_scale := zoom_percent / float(PortraitLayout.ZOOM_DEFAULT)
	return clampf(
		lerpf(1.0, zoom_scale, CHOICE_SPEAKER_SCALE_BLEND),
		CHOICE_SPEAKER_SCALE_MIN,
		CHOICE_SPEAKER_SCALE_MAX
	)


func _get_choice_speaker_zoom_percent() -> float:
	var state := _get_choice_speaker_portrait_state()
	if _is_visible_portrait_state(state):
		return float(state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT))
	if not _pending_dialogue.is_empty() and not bool(_pending_dialogue.get("is_narrator", false)):
		return float(_pending_dialogue.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT))
	return float(PortraitLayout.ZOOM_DEFAULT)


func _has_choice_character_anchor() -> bool:
	if _is_visible_portrait_state(_get_choice_speaker_portrait_state()):
		return true
	if _pending_dialogue.is_empty():
		return false
	return not bool(_pending_dialogue.get("is_narrator", false))


func _get_choice_character_anchor_x(stage_size: Vector2) -> float:
	var portrait_viewport_size := _get_portrait_viewport_size()
	if portrait_viewport_size.x <= 0.0:
		portrait_viewport_size.x = stage_size.x
	if portrait_viewport_size.y <= 0.0:
		portrait_viewport_size.y = stage_size.y

	var state := _get_choice_speaker_portrait_state()
	if _is_visible_portrait_state(state):
		return PortraitLayout.compute_zoom_anchor_position(
			portrait_viewport_size,
			Vector2(state.get("layout_offset", Vector2.ZERO)),
			float(state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT)),
			_get_portrait_horizontal_safe_area()
		).x

	if not _pending_dialogue.is_empty():
		return PortraitLayout.compute_zoom_anchor_position(
			portrait_viewport_size,
			Vector2(_pending_dialogue.get("layout_offset", Vector2.ZERO)),
			float(_pending_dialogue.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT)),
			_get_portrait_horizontal_safe_area()
		).x

	return stage_size.x * 0.5


func _get_portrait_used_rect(path: String, texture_size: Vector2) -> Rect2:
	if texture_size.x <= 0.0 or texture_size.y <= 0.0:
		return Rect2()
	if path.is_empty():
		return Rect2(Vector2.ZERO, texture_size)
	if _portrait_used_rect_cache.has(path):
		var cached_rect: Rect2 = _portrait_used_rect_cache[path]
		return cached_rect

	var texture := _load_portrait_texture(path)
	if texture == null:
		var fallback_rect := Rect2(Vector2.ZERO, texture_size)
		_portrait_used_rect_cache[path] = fallback_rect
		return fallback_rect

	var image := texture.get_image()
	if image == null or image.is_empty():
		var fallback_rect := Rect2(Vector2.ZERO, texture_size)
		_portrait_used_rect_cache[path] = fallback_rect
		return fallback_rect

	var raw_rect := image.get_used_rect()
	var used_rect := Rect2(
		Vector2(raw_rect.position),
		Vector2(raw_rect.size)
	)
	if used_rect.size.x <= 0.0 or used_rect.size.y <= 0.0:
		used_rect = Rect2(Vector2.ZERO, texture_size)
	_portrait_used_rect_cache[path] = used_rect
	return used_rect


func _get_choice_character_content_rect(_stage_size: Vector2) -> Rect2:
	var state := _get_choice_speaker_portrait_state()
	if not _is_visible_portrait_state(state):
		return Rect2()

	var display_rect := _compute_portrait_display_rect(state)
	var texture_size := Vector2(state.get("texture_size", Vector2.ZERO))
	if display_rect.size.x <= 0.0 or display_rect.size.y <= 0.0:
		return Rect2()
	if texture_size.x <= 0.0 or texture_size.y <= 0.0:
		return display_rect

	var used_rect := _get_portrait_used_rect(String(state.get("path", "")), texture_size)
	if used_rect.size.x <= 0.0 or used_rect.size.y <= 0.0:
		return display_rect

	if bool(state.get("flip_h", false)):
		used_rect.position = Vector2(
			texture_size.x - used_rect.position.x - used_rect.size.x,
			used_rect.position.y
		)

	var scale := Vector2(display_rect.size.x / texture_size.x, display_rect.size.y / texture_size.y)
	var content_rect := Rect2(
		display_rect.position + used_rect.position * scale,
		used_rect.size * scale
	)
	if content_rect.size.x <= 0.0 or content_rect.size.y <= 0.0:
		return display_rect
	return content_rect


func _get_choice_character_edge_x(column_side: String, stage_size: Vector2) -> float:
	var anchor_x := _get_choice_character_anchor_x(stage_size)
	var padding_x := _choice_scaled_x(CHOICE_CHARACTER_EDGE_PADDING_X, stage_size)
	var zoom_scale := _get_choice_speaker_zoom_percent() / float(PortraitLayout.ZOOM_DEFAULT)
	var half_width := _choice_scaled_x(CHOICE_FACE_REFERENCE_HALF_WIDTH, stage_size) * zoom_scale
	if column_side == "left":
		return anchor_x - half_width - padding_x
	return anchor_x + half_width + padding_x


func _get_choice_character_center_x(stage_size: Vector2) -> float:
	return _get_choice_character_anchor_x(stage_size)


func _get_dialogue_window_x_range(stage_size: Vector2) -> Vector2:
	if _dialogue_overlay != null and _dialogue_overlay.size.x > 0.0:
		var left := clampf(_dialogue_overlay.position.x, 0.0, stage_size.x)
		var right := clampf(_dialogue_overlay.position.x + _dialogue_overlay.size.x, left, stage_size.x)
		return Vector2(left, right)

	var panel_layout := _get_dialogue_panel_layout()
	var left := clampf(float(panel_layout.get("offset_left", 0.0)), 0.0, stage_size.x)
	var right := clampf(
		_get_layout_viewport_size().x + float(panel_layout.get("offset_right", 0.0)),
		left,
		stage_size.x
	)
	return Vector2(left, right)


func _get_choice_side_boundary_x(column_side: String, stage_size: Vector2) -> float:
	var dialogue_range := _get_dialogue_window_x_range(stage_size)
	if column_side == "left":
		return dialogue_range.x
	return dialogue_range.y


func _get_choice_character_reference_y(stage_size: Vector2) -> float:
	var portrait_viewport_size := _get_portrait_viewport_size()
	if portrait_viewport_size.x <= 0.0:
		portrait_viewport_size.x = stage_size.x
	if portrait_viewport_size.y <= 0.0:
		portrait_viewport_size.y = stage_size.y

	var state := _get_choice_speaker_portrait_state()
	if _is_visible_portrait_state(state):
		return PortraitLayout.compute_zoom_anchor_position(
			portrait_viewport_size,
			Vector2(state.get("layout_offset", Vector2.ZERO)),
			float(state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT)),
			_get_portrait_horizontal_safe_area()
		).y

	if not _pending_dialogue.is_empty():
		return PortraitLayout.compute_zoom_anchor_position(
			portrait_viewport_size,
			Vector2(_pending_dialogue.get("layout_offset", Vector2.ZERO)),
			float(_pending_dialogue.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT)),
			_get_portrait_horizontal_safe_area()
		).y

	return _choice_scaled_y(CHOICE_VERTICAL_STACK_CENTER_Y, stage_size)


func _get_choice_character_side(stage_size: Vector2) -> String:
	var center_x := _get_choice_character_center_x(stage_size)
	var ratio := center_x / maxf(stage_size.x, 1.0)
	if ratio < 0.5 - CHOICE_CENTER_DEADZONE:
		return "left"
	if ratio > 0.5 + CHOICE_CENTER_DEADZONE:
		return "right"
	return "center"


func _clamp_choice_slot(position: Vector2, button_size: Vector2, stage_size: Vector2) -> Vector2:
	var margin_x := _choice_scaled_x(CHOICE_STAGE_MARGIN_X, stage_size)
	var margin_top := _choice_scaled_y(CHOICE_STAGE_MARGIN_TOP, stage_size)
	var margin_bottom := _choice_scaled_y(CHOICE_STAGE_MARGIN_BOTTOM, stage_size)
	var max_x := maxf(margin_x, stage_size.x - margin_x - button_size.x)
	var max_y := maxf(margin_top, stage_size.y - margin_bottom - button_size.y)
	return Vector2(
		clampf(position.x, margin_x, max_x),
		clampf(position.y, margin_top, max_y)
	)


func _get_choice_anchor_gap_bounds(stage_size: Vector2) -> Vector2:
	var zoom_percent := clampf(
		_get_choice_speaker_zoom_percent(),
		float(PortraitLayout.ZOOM_MIN),
		float(PortraitLayout.ZOOM_MAX)
	)
	var zoom_t := inverse_lerp(
		float(PortraitLayout.ZOOM_MIN),
		float(PortraitLayout.ZOOM_MAX),
		zoom_percent
	)
	var min_gap := _choice_scaled_x(
		lerpf(CHOICE_ANCHOR_GAP_MIN_SMALL_X, CHOICE_ANCHOR_GAP_MIN_LARGE_X, zoom_t),
		stage_size
	)
	var max_gap := _choice_scaled_x(
		lerpf(CHOICE_ANCHOR_GAP_MAX_SMALL_X, CHOICE_ANCHOR_GAP_MAX_LARGE_X, zoom_t),
		stage_size
	)
	if max_gap < min_gap:
		max_gap = min_gap
	return Vector2(min_gap, max_gap)


func _get_choice_boundary_center_weight() -> float:
	var zoom_percent := clampf(
		_get_choice_speaker_zoom_percent(),
		float(PortraitLayout.ZOOM_MIN),
		float(PortraitLayout.ZOOM_MAX)
	)
	if zoom_percent <= float(PortraitLayout.ZOOM_DEFAULT):
		return lerpf(
			CHOICE_BOUNDARY_WEIGHT_SMALL,
			CHOICE_BOUNDARY_WEIGHT_AT_300,
			inverse_lerp(float(PortraitLayout.ZOOM_MIN), float(PortraitLayout.ZOOM_DEFAULT), zoom_percent)
		)
	return lerpf(
		CHOICE_BOUNDARY_WEIGHT_AT_300,
		CHOICE_BOUNDARY_WEIGHT_LARGE,
		inverse_lerp(float(PortraitLayout.ZOOM_DEFAULT), float(PortraitLayout.ZOOM_MAX), zoom_percent)
	)


func _get_choice_side_capacity(column_side: String, stage_size: Vector2) -> float:
	var character_edge_x := _get_choice_character_edge_x(column_side, stage_size)
	var boundary_x := _get_choice_side_boundary_x(column_side, stage_size)
	var min_gap := _get_choice_anchor_gap_bounds(stage_size).x
	if column_side == "left":
		return character_edge_x - min_gap - boundary_x
	return boundary_x - character_edge_x - min_gap


func _get_choice_column_side(character_side: String, button_size: Vector2, stage_size: Vector2) -> String:
	if not _has_choice_character_anchor():
		return "center"

	var preferred_side := "left" if character_side == "right" else "right"
	var fallback_side := "right" if preferred_side == "left" else "left"
	var preferred_capacity := _get_choice_side_capacity(preferred_side, stage_size)
	var fallback_capacity := _get_choice_side_capacity(fallback_side, stage_size)
	var min_width := minf(_choice_scaled_x(CHOICE_PANEL_MIN_WIDTH, stage_size), button_size.x)
	if preferred_capacity < min_width and fallback_capacity >= min_width:
		return fallback_side
	return preferred_side


func _get_choice_column_x(column_side: String, _character_side: String, button_size: Vector2, stage_size: Vector2) -> float:
	if column_side == "center":
		return _clamp_choice_slot(
			Vector2(stage_size.x * 0.5 - button_size.x * 0.5, 0.0),
			button_size,
			stage_size
		).x

	var character_center_x := _get_choice_character_center_x(stage_size)
	var character_edge_x := _get_choice_character_edge_x(column_side, stage_size)
	var boundary_x := _get_choice_side_boundary_x(column_side, stage_size)
	var gap_bounds := _get_choice_anchor_gap_bounds(stage_size)
	var min_gap := gap_bounds.x
	var max_gap := gap_bounds.y
	var target_center_x := lerpf(character_center_x, boundary_x, _get_choice_boundary_center_weight())
	var x := target_center_x - button_size.x * 0.5
	if column_side == "left":
		var min_x := maxf(boundary_x, character_edge_x - max_gap - button_size.x)
		var max_x := character_edge_x - min_gap - button_size.x
		x = clampf(x, min_x, maxf(min_x, max_x))
	else:
		var min_x := character_edge_x + min_gap
		var max_x := minf(boundary_x - button_size.x, character_edge_x + max_gap)
		x = clampf(x, min_x, maxf(min_x, max_x))
	return _clamp_choice_slot(Vector2(x, 0.0), button_size, stage_size).x


func _build_choice_vertical_slots(
	x: float,
	choice_count: int,
	button_size: Vector2,
	center_y: float = -1.0
) -> Array[Vector2]:
	var slots: Array[Vector2] = []
	var stage_size := _get_choice_stage_size()
	var margin_top := _choice_scaled_y(CHOICE_STAGE_MARGIN_TOP, stage_size)
	var margin_bottom := _choice_scaled_y(CHOICE_STAGE_MARGIN_BOTTOM, stage_size)
	var separation := _choice_scaled_y(CHOICE_LIST_SEPARATION, stage_size)
	var total_height := float(choice_count) * button_size.y + float(maxi(choice_count - 1, 0)) * separation
	var stack_center_y := center_y
	if stack_center_y < 0.0:
		if _has_choice_character_anchor():
			stack_center_y = _get_choice_character_reference_y(stage_size)
		else:
			stack_center_y = _choice_scaled_y(CHOICE_VERTICAL_STACK_CENTER_Y, stage_size)
	var min_y := margin_top
	var max_y := maxf(min_y, stage_size.y - margin_bottom - total_height)
	var y := clampf(stack_center_y - total_height * 0.5, min_y, max_y)

	for index in range(choice_count):
		slots.append(Vector2(x, y + float(index) * (button_size.y + separation)))

	return slots


func _resolve_choice_slots(choice_count: int, button_size: Vector2, character_side := "") -> Array[Vector2]:
	var slots: Array[Vector2] = []
	if choice_count <= 0:
		return slots

	var stage_size := _get_choice_stage_size()
	var resolved_character_side := character_side
	if resolved_character_side.is_empty():
		resolved_character_side = _get_choice_character_side(stage_size)

	var column_side := _get_choice_column_side(resolved_character_side, button_size, stage_size)
	var x := _get_choice_column_x(column_side, resolved_character_side, button_size, stage_size)
	return _build_choice_vertical_slots(x, choice_count, button_size)


func _get_choice_buttons() -> Array[Button]:
	var buttons: Array[Button] = []
	if _choice_list == null:
		return buttons

	for child in _choice_list.get_children():
		if child is Button:
			buttons.append(child as Button)

	return buttons


func _sync_choice_layout() -> void:
	if _choice_list == null:
		return

	_choice_list.set_anchors_preset(Control.PRESET_FULL_RECT)
	_choice_list.offset_left = 0.0
	_choice_list.offset_top = 0.0
	_choice_list.offset_right = 0.0
	_choice_list.offset_bottom = 0.0

	if not _choice_list.visible:
		return

	var buttons := _get_choice_buttons()
	if buttons.is_empty():
		return

	var stage_size := _get_choice_stage_size()
	var character_side := _get_choice_character_side(stage_size)
	var speaker_scale := _get_choice_speaker_scale()
	var visual_scale := _get_choice_resolution_scale(stage_size)
	var button_size := _get_choice_button_size(buttons.size(), character_side, speaker_scale)
	var slots := _resolve_choice_slots(buttons.size(), button_size, character_side)
	for index in range(buttons.size()):
		var button := buttons[index]
		_apply_choice_button_theme(button, visual_scale)
		button.custom_minimum_size = button_size
		button.size = button_size
		_apply_choice_button_scale(button, speaker_scale)
		if index < slots.size():
			button.position = slots[index]

	_configure_choice_focus_navigation()


func _choice_focus_neighbor_path(button: Button, buttons: Array[Button], direction: Vector2) -> NodePath:
	var neighbor := _find_choice_focus_neighbor(button, buttons, direction)
	if neighbor == null:
		return NodePath()
	return button.get_path_to(neighbor)


func _find_choice_focus_neighbor(button: Button, buttons: Array[Button], direction: Vector2) -> Button:
	var button_center := button.position + button.size * 0.5
	var best_button: Button = null
	var best_score := INF

	for candidate in buttons:
		if candidate == button:
			continue

		var delta := candidate.position + candidate.size * 0.5 - button_center
		var primary_distance := delta.dot(direction)
		if primary_distance <= 1.0:
			continue

		var perpendicular_distance := absf(delta.cross(direction))
		var score := primary_distance + perpendicular_distance * 1.35
		if score < best_score:
			best_score = score
			best_button = candidate

	return best_button


func _configure_choice_focus_navigation() -> void:
	var buttons := _get_choice_buttons()
	if buttons.is_empty():
		return

	for index in range(buttons.size()):
		var button := buttons[index]
		if buttons.size() > 1:
			button.focus_next = button.get_path_to(buttons[(index + 1) % buttons.size()])
			button.focus_previous = button.get_path_to(buttons[(index - 1 + buttons.size()) % buttons.size()])
		else:
			button.focus_next = NodePath()
			button.focus_previous = NodePath()

		button.focus_neighbor_left = _choice_focus_neighbor_path(button, buttons, Vector2.LEFT)
		button.focus_neighbor_right = _choice_focus_neighbor_path(button, buttons, Vector2.RIGHT)
		button.focus_neighbor_top = _choice_focus_neighbor_path(button, buttons, Vector2.UP)
		button.focus_neighbor_bottom = _choice_focus_neighbor_path(button, buttons, Vector2.DOWN)


func _handle_choice_shortcut_input(event: InputEvent) -> bool:
	if _choice_list == null or not _choice_list.visible:
		return false

	if _is_shortcut_action_pressed(event, "move_up") or _is_shortcut_action_pressed(event, "ui_up"):
		_move_choice_focus(Vector2.UP)
		return true
	if _is_shortcut_action_pressed(event, "move_down") or _is_shortcut_action_pressed(event, "ui_down"):
		_move_choice_focus(Vector2.DOWN)
		return true
	if _is_shortcut_action_pressed(event, "move_left") or _is_shortcut_action_pressed(event, "ui_left"):
		_move_choice_focus(Vector2.LEFT)
		return true
	if _is_shortcut_action_pressed(event, "move_right") or _is_shortcut_action_pressed(event, "ui_right"):
		_move_choice_focus(Vector2.RIGHT)
		return true
	if _is_shortcut_action_pressed(event, "interact") or _is_shortcut_action_pressed(event, "ui_accept"):
		_press_focused_choice()
		return true

	return false


func _get_focused_choice_button() -> Button:
	if _choice_list == null:
		return null

	var focus_owner := get_viewport().gui_get_focus_owner()
	if focus_owner is Button and _choice_list.is_ancestor_of(focus_owner):
		return focus_owner as Button

	var buttons := _get_choice_buttons()
	if buttons.is_empty():
		return null
	return buttons[0]


func _move_choice_focus(direction: Vector2) -> void:
	var buttons := _get_choice_buttons()
	if buttons.is_empty():
		return

	var current := _get_focused_choice_button()
	if current == null:
		current = buttons[0]

	var target := _find_choice_focus_neighbor(current, buttons, direction)
	if target == null:
		var current_index := buttons.find(current)
		if current_index < 0:
			current_index = 0
		var moves_backward := direction == Vector2.UP or direction == Vector2.LEFT
		var delta := -1 if moves_backward else 1
		target = buttons[posmod(current_index + delta, buttons.size())]

	set_preferred_focus_control(target)
	target.grab_focus()


func _press_focused_choice() -> void:
	var button := _get_focused_choice_button()
	if button == null or button.disabled:
		return

	set_preferred_focus_control(button)
	button.grab_focus()
	button.emit_signal("pressed")


func _render_choices(raw_choices: Variant) -> void:
	_clear_choices()

	if typeof(raw_choices) != TYPE_ARRAY:
		return

	var choices: Array = raw_choices
	if choices.is_empty():
		return

	_pause_skip_hold()
	_choice_list.visible = true
	var stage_size := _get_choice_stage_size()
	var character_side := _get_choice_character_side(stage_size)
	var speaker_scale := _get_choice_speaker_scale()
	var visual_scale := _get_choice_resolution_scale(stage_size)
	var button_size := _get_choice_button_size(choices.size(), character_side, speaker_scale)
	for index in choices.size():
		var choice_data: Dictionary = choices[index]
		var choice_button := Button.new()
		choice_button.name = "Choice%dButton" % (index + 1)
		choice_button.text = String(choice_data.get("text", "선택지 %d" % (index + 1)))
		choice_button.custom_minimum_size = button_size
		choice_button.size = button_size
		choice_button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		_apply_choice_button_theme(choice_button, visual_scale)
		_apply_choice_button_scale(choice_button, speaker_scale)
		_apply_choice_button_alignment(choice_button, choices.size(), character_side)
		choice_button.pressed.connect(_on_choice_pressed.bind(
			String(choice_data.get("next", "")),
			String(choice_data.get("text", ""))
		))
		_choice_list.add_child(choice_button)

	_sync_choice_layout()
	if _choice_list.get_child_count() > 0:
		set_preferred_focus_control(_choice_list.get_child(0) as Control)
	refresh_pointer_hover_mode()
	_refresh_choice_button_styles()


func _refresh_choice_button_styles() -> void:
	if _choice_list == null:
		return

	var buttons := _get_choice_buttons()
	var stage_size := _get_choice_stage_size()
	var character_side := _get_choice_character_side(stage_size)
	var speaker_scale := _get_choice_speaker_scale()
	var visual_scale := _get_choice_resolution_scale(stage_size)
	var button_size := _get_choice_button_size(buttons.size(), character_side, speaker_scale)
	for button in buttons:
		_apply_choice_button_theme(button, visual_scale)
		button.custom_minimum_size = button_size
		button.size = button_size
		_apply_choice_button_scale(button, speaker_scale)
		_apply_choice_button_alignment(button, buttons.size(), character_side)


func _clear_choices() -> void:
	if _choice_list == null:
		return

	for child in _choice_list.get_children():
		_choice_list.remove_child(child)
		child.queue_free()
	_choice_list.visible = false


func _update_advance_hint() -> void:
	if _advance_hint_bar == null or _advance_hint_icon == null or _advance_hint_label == null:
		return

	_refresh_skip_indicator()
	if _should_show_skip_indicator():
		_advance_hint_bar.visible = false
		_stop_advance_hint_pulse()
		return

	if _uses_statement_dialogue_window():
		_advance_hint_bar.visible = false
		_stop_advance_hint_pulse()
		return

	var can_advance := _can_advance_dialogue() and not _dialogue_typewriter.is_typing()
	_advance_hint_bar.visible = can_advance
	if can_advance:
		var icon := _get_input_icon(_get_advance_hint_icon_key(), INPUT_ADVANCE_ICON_HEIGHT)
		var hint_text := _get_advance_hint_text()
		_advance_hint_icon.texture = icon
		_advance_hint_icon.visible = icon != null
		if icon != null:
			_advance_hint_icon.custom_minimum_size = Vector2(icon.get_width(), icon.get_height())
		_advance_hint_label.text = hint_text
		_advance_hint_label.visible = not hint_text.is_empty()
		_ensure_advance_hint_pulse()
	else:
		_stop_advance_hint_pulse()


func _ensure_advance_hint_pulse() -> void:
	if _advance_hint_bar == null:
		return
	if _advance_hint_pulse_tween != null and _advance_hint_pulse_tween.is_valid():
		return

	_advance_hint_bar.modulate = Color.WHITE
	var tween := create_tween()
	_advance_hint_pulse_tween = tween
	tween.set_loops()
	tween.set_ease(Tween.EASE_IN_OUT)
	tween.set_trans(Tween.TRANS_SINE)
	tween.tween_property(_advance_hint_bar, "modulate:a", ADVANCE_HINT_PULSE_MIN_ALPHA, ADVANCE_HINT_PULSE_FADE_DURATION)
	tween.tween_property(_advance_hint_bar, "modulate:a", 1.0, ADVANCE_HINT_PULSE_FADE_DURATION)
	tween.tween_interval(ADVANCE_HINT_PULSE_PEAK_HOLD)


func _stop_advance_hint_pulse() -> void:
	if _advance_hint_pulse_tween != null and _advance_hint_pulse_tween.is_valid():
		_advance_hint_pulse_tween.kill()
	_advance_hint_pulse_tween = null
	if _advance_hint_bar != null:
		_advance_hint_bar.modulate = Color.WHITE


func _should_show_skip_indicator() -> bool:
	return _skip_hold_requested \
		and _is_skip_available() \
		and not _overlay_obscured \
		and not _is_menu_overlay_open()


func _refresh_skip_indicator() -> void:
	if _skip_indicator == null:
		return

	var should_show := _should_show_skip_indicator()
	_skip_indicator.visible = should_show
	if should_show:
		_apply_skip_indicator_layout()
		_ensure_skip_indicator_arrow_tween()
	else:
		_stop_skip_indicator_arrow_tween()


func _ensure_skip_indicator_arrow_tween() -> void:
	if _skip_indicator_arrow_icon == null:
		return
	if _skip_indicator_arrow_tween != null and _skip_indicator_arrow_tween.is_valid():
		return

	_skip_indicator_arrow_icon.position.x = _skip_indicator_arrow_base_x
	var tween := create_tween()
	_skip_indicator_arrow_tween = tween
	tween.set_loops()
	tween.set_ease(Tween.EASE_IN_OUT)
	tween.set_trans(Tween.TRANS_SINE)
	tween.tween_property(
		_skip_indicator_arrow_icon,
		"position:x",
		_skip_indicator_arrow_base_x + SKIP_INDICATOR_ARROW_TRAVEL,
		SKIP_INDICATOR_ARROW_DURATION
	)
	tween.tween_property(
		_skip_indicator_arrow_icon,
		"position:x",
		_skip_indicator_arrow_base_x,
		SKIP_INDICATOR_ARROW_DURATION
	)


func _stop_skip_indicator_arrow_tween() -> void:
	if _skip_indicator_arrow_tween != null and _skip_indicator_arrow_tween.is_valid():
		_skip_indicator_arrow_tween.kill()
	_skip_indicator_arrow_tween = null
	if _skip_indicator_arrow_icon != null:
		_skip_indicator_arrow_icon.position.x = _skip_indicator_arrow_base_x


func _can_advance_dialogue() -> bool:
	if _is_statement_presentation():
		if not _is_statement_main_node_active():
			var choices: Array = _current_node.get("choices", [])
			if not choices.is_empty():
				return false
		return _can_statement_advance()

	if _awaiting_portrait_for_dialogue:
		return false

	if _is_menu_overlay_open():
		return false

	var choices: Array = _current_node.get("choices", [])
	return choices.is_empty()


func _get_advance_hint_text() -> String:
	if _uses_statement_dialogue_window():
		return ""

	match _get_current_input_mode():
		"mouse":
			return "Click"
		"touch":
			return "Touch"
		"keyboard":
			return "Space"
		"gamepad":
			return ""
		_:
			return "Click"


func _get_advance_hint_icon_key() -> String:
	if _uses_statement_dialogue_window():
		return ""
	match _get_current_input_mode():
		"gamepad":
			return "xbox_a"
	return ""


func _refresh_input_hints() -> void:
	if _top_menu_bar != null:
		_top_menu_bar.add_theme_constant_override("separation", _get_top_menu_bar_separation())
	var separator_margin_left := _get_top_menu_separator_margin()
	var separator_margin_right := _get_top_menu_separator_margin_right()
	for separator in _top_menu_separators:
		if separator == null:
			continue
		separator.add_theme_constant_override("margin_left", separator_margin_left)
		separator.add_theme_constant_override("margin_right", separator_margin_right)
	for action in _top_menu_buttons.keys():
		var button := _top_menu_buttons[action] as Button
		if button != null:
			_apply_menu_button_hint(button, String(action))
			_apply_top_menu_button_style(button)
	_refresh_skip_button_state()
	_update_advance_hint()
	_refresh_statement_notebook_input_affordance()
	_apply_statement_notebook_layout()


func _apply_menu_button_hint(button: Button, action: String) -> void:
	var base_label := _get_menu_base_label(action)
	var hint := _get_menu_shortcut_hint(action)
	var icon_height := _get_menu_shortcut_icon_height(action)
	var icon := _get_input_icon(_get_menu_shortcut_icon_key(action), icon_height)
	var use_keyboard_keycap := icon == null and not hint.is_empty() and _get_current_input_mode() == "keyboard"

	button.icon = icon
	button.expand_icon = false
	button.icon_alignment = HORIZONTAL_ALIGNMENT_LEFT
	button.alignment = HORIZONTAL_ALIGNMENT_LEFT if icon != null else HORIZONTAL_ALIGNMENT_CENTER
	button.custom_minimum_size = _get_menu_button_min_size(icon_height) if icon != null else TOP_MENU_TEXT_BUTTON_MIN_SIZE
	button.add_theme_constant_override("h_separation", _get_menu_icon_text_separation() if icon != null else 0)
	button.add_theme_constant_override("icon_max_width", icon.get_width() if icon != null else 0)
	_set_keyboard_menu_hint_content(button, base_label, hint, use_keyboard_keycap)
	if use_keyboard_keycap:
		button.custom_minimum_size = _get_keyboard_keycap_button_min_size(base_label, hint)
		button.text = ""
		return
	if icon != null:
		button.text = base_label
		return

	if hint.is_empty():
		button.text = base_label
		return
	button.text = "%s (%s)" % [base_label, hint]


func _set_keyboard_menu_hint_content(button: Button, base_label: String, hint: String, visible: bool) -> void:
	var content := button.get_node_or_null("KeyboardHintContent") as Control
	if content == null:
		return

	content.visible = visible
	if not visible:
		return

	var base_label_node := content.get_node_or_null("Layout/BaseLabel") as Label
	if base_label_node != null:
		base_label_node.text = base_label

	var key_label := content.get_node_or_null("Layout/KeycapOffset/Keycap/Margin/KeyLabel") as Label
	if key_label != null:
		key_label.text = hint


func _get_menu_base_label(action: String) -> String:
	match action:
		"skip":
			return "Skip"
		"log":
			return "Log"
		"tree":
			return "Tree"
		"menu":
			return "Menu"
		_:
			return action.capitalize()


func _get_menu_shortcut_hint(action: String) -> String:
	match _get_current_input_mode():
		"keyboard":
			match action:
				"skip":
					return "Ctrl"
				"log":
					return "Shift"
				"tree":
					return "Tab"
				"menu":
					return "Esc"
		"gamepad":
			match action:
				"skip":
					return "LB"
				"log":
					return "Y"
				"tree":
					return "Select"
				"menu":
					return "Menu"
	return ""


func _get_menu_shortcut_icon_key(action: String) -> String:
	var mode := _get_current_input_mode()
	if not TOP_MENU_ICON_KEYS.has(mode):
		return ""
	var icon_keys: Dictionary = TOP_MENU_ICON_KEYS[mode]
	return String(icon_keys.get(action, ""))


func _get_menu_shortcut_icon_height(action: String) -> int:
	var mode := _get_current_input_mode()
	if not TOP_MENU_ICON_HEIGHTS.has(mode):
		return 0
	var icon_heights: Dictionary = TOP_MENU_ICON_HEIGHTS[mode]
	return int(icon_heights.get(action, 0))


func _get_menu_button_min_size(icon_height: int) -> Vector2:
	if icon_height <= 0:
		return TOP_MENU_TEXT_MIN_SIZE
	var min_height := maxf(TOP_MENU_ICON_MIN_SIZE.y, float(icon_height) + TOP_MENU_ICON_VERTICAL_PADDING)
	return Vector2(float(_get_menu_icon_min_width()), min_height)


func _get_keyboard_keycap_button_min_size(base_label: String, hint: String) -> Vector2:
	return Vector2(_measure_keyboard_menu_hint_width(base_label, hint), float(TOP_MENU_KEYBOARD_BUTTON_MIN_HEIGHT))


func _measure_keyboard_menu_hint_width(base_label: String, hint: String) -> float:
	var font := ThemeDB.fallback_font
	var label_width := font.get_string_size(base_label, HORIZONTAL_ALIGNMENT_LEFT, -1, 24).x
	var keycap_text_width := font.get_string_size(hint, HORIZONTAL_ALIGNMENT_LEFT, -1, TOP_MENU_KEYCAP_FONT_SIZE).x
	var keycap_width := keycap_text_width + float(TOP_MENU_KEYCAP_MARGIN_HORIZONTAL * 2 + 3)
	return label_width + float(TOP_MENU_KEYBOARD_HINT_SEPARATION) + keycap_width + TOP_MENU_BUTTON_CONTENT_MARGIN.x * 2.0


func _get_top_menu_bar_separation() -> int:
	var mode := _get_current_input_mode()
	return int(TOP_MENU_BAR_SEPARATION.get(mode, TOP_MENU_BAR_SEPARATION["default"]))


func _get_top_menu_separator_margin() -> int:
	var mode := _get_current_input_mode()
	return int(TOP_MENU_SEPARATOR_MARGIN.get(mode, TOP_MENU_SEPARATOR_MARGIN["default"]))


func _get_top_menu_separator_margin_right() -> int:
	var mode := _get_current_input_mode()
	if TOP_MENU_SEPARATOR_MARGIN_RIGHT.has(mode):
		return int(TOP_MENU_SEPARATOR_MARGIN_RIGHT[mode])
	return _get_top_menu_separator_margin()


func _get_menu_icon_text_separation() -> int:
	var mode := _get_current_input_mode()
	return int(TOP_MENU_ICON_TEXT_SEPARATION.get(mode, TOP_MENU_ICON_TEXT_SEPARATION["default"]))


func _get_menu_icon_min_width() -> int:
	var mode := _get_current_input_mode()
	return int(TOP_MENU_ICON_MIN_WIDTHS.get(mode, TOP_MENU_ICON_MIN_WIDTHS["default"]))


func _get_input_icon(icon_key: String, target_height: int = 0) -> Texture2D:
	if icon_key.begins_with("mui:"):
		return _get_mui_icon(icon_key.substr(4), target_height, BODY_TEXT_COLOR)
	if icon_key.is_empty() or not INPUT_ICON_PATHS.has(icon_key):
		return null

	var cache_key := icon_key if target_height <= 0 else "%s:%d" % [icon_key, target_height]
	if not _input_icon_cache.has(cache_key):
		var source_texture := load(String(INPUT_ICON_PATHS[icon_key])) as Texture2D
		if source_texture == null or target_height <= 0:
			_input_icon_cache[cache_key] = source_texture
		else:
			var source_height := source_texture.get_height()
			var source_width := source_texture.get_width()
			if source_height <= 0 or source_width <= 0:
				_input_icon_cache[cache_key] = source_texture
			else:
				var image := source_texture.get_image()
				if image == null:
					_input_icon_cache[cache_key] = source_texture
				else:
					var target_width := maxi(1, int(round(float(target_height) * float(source_width) / float(source_height))))
					image.resize(target_width, target_height, Image.INTERPOLATE_LANCZOS)
					_input_icon_cache[cache_key] = ImageTexture.create_from_image(image)
	return _input_icon_cache[cache_key] as Texture2D


func _get_speaker_profile(speaker_id: String) -> Dictionary:
	if speaker_id.is_empty() or not VisualNovelData.has_character(StringName(speaker_id)):
		return {}
	return VisualNovelData.get_character(StringName(speaker_id))


func _is_narrator_speaker(speaker_id: String) -> bool:
	if speaker_id.is_empty():
		return true
	return VisualNovelData.is_narrator_character(StringName(speaker_id))


func _get_speaker_name(speaker_id: String, speaker_profile: Dictionary) -> String:
	if _is_narrator_speaker(speaker_id):
		return ""
	if not speaker_profile.is_empty():
		return String(speaker_profile.get("display_name", speaker_id))
	return speaker_id


func _get_speaker_color(speaker_profile: Dictionary) -> Color:
	if speaker_profile.is_empty():
		return DEFAULT_SPEAKER_COLOR

	var raw_color := String(speaker_profile.get("name_color", ""))
	if Color.html_is_valid(raw_color):
		return Color.html(raw_color)
	return DEFAULT_SPEAKER_COLOR


func _is_skip_available() -> bool:
	if not _has_loaded_dialogue or _current_node.is_empty():
		return false
	return not (_is_statement_presentation() and _is_statement_main_node_active())


func _current_node_has_choices() -> bool:
	if _current_node.is_empty():
		return false

	var raw_choices: Variant = _current_node.get("choices", [])
	if typeof(raw_choices) != TYPE_ARRAY:
		return false
	var choices: Array = raw_choices
	return not choices.is_empty()


func _should_stop_skip_hold() -> bool:
	if not _is_skip_available():
		return true
	if _overlay_obscured or _is_menu_overlay_open():
		return true
	if _statement_note_open or _statement_loop_prompt_open or _statement_connection_mode_active:
		return true
	return _current_node_has_choices()


func _can_skip_hold_step() -> bool:
	return not _should_stop_skip_hold() and _can_advance_dialogue()


func _start_skip_hold() -> void:
	_skip_hold_requested = true
	if _should_stop_skip_hold():
		_pause_skip_hold()
		return

	_skip_hold_active = true
	_skip_advance_cooldown = 0.0
	_refresh_skip_hold_ui()
	_process_skip_hold(0.0)
	if _skip_hold_active:
		set_process(true)


func _pause_skip_hold() -> void:
	_skip_hold_active = false
	_skip_advance_cooldown = 0.0
	if not _dialogue_typewriter.is_typing():
		set_process(false)
	_refresh_skip_hold_ui()


func _stop_skip_hold(clear_request := true) -> void:
	if clear_request:
		_skip_hold_requested = false
	_pause_skip_hold()


func _resume_skip_hold_if_requested() -> void:
	if _skip_hold_requested:
		_start_skip_hold()
	else:
		_refresh_skip_hold_ui()


func _refresh_skip_hold_ui() -> void:
	_refresh_skip_button_state()
	_refresh_skip_indicator()
	_update_advance_hint()


func _process_skip_hold(delta: float) -> void:
	if not _skip_hold_active:
		return
	if _should_stop_skip_hold():
		_pause_skip_hold()
		return
	if not _can_skip_hold_step():
		return

	if _dialogue_typewriter.is_typing():
		_dialogue_typewriter.reveal_all()
		_skip_advance_cooldown = SKIP_HOLD_ADVANCE_INTERVAL
		_update_advance_hint()
		_refresh_statement_controls()
		return

	_skip_advance_cooldown -= delta
	if _skip_advance_cooldown > 0.0:
		return

	_skip_advance_cooldown = SKIP_HOLD_ADVANCE_INTERVAL
	_advance_dialogue()


func _refresh_skip_button_state() -> void:
	if _skip_button == null:
		return

	var available := _is_skip_available()
	if _skip_hold_active and not available:
		_skip_hold_active = false
	_skip_button.disabled = not available
	_skip_button.modulate.a = 1.0 if available else SKIP_DISABLED_OPACITY
	_skip_button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND if available else Control.CURSOR_ARROW
	_apply_skip_button_hold_visual(available)


func _handle_shortcut_input(event: InputEvent) -> bool:
	if _is_skip_shortcut_released(event):
		_stop_skip_hold()
		return true

	if event is InputEventKey:
		var key_event := event as InputEventKey
		if not key_event.pressed or key_event.echo:
			return false
		return _handle_digital_shortcut_event(key_event)

	if event is InputEventJoypadButton:
		var button_event := event as InputEventJoypadButton
		if not button_event.pressed:
			return false
		return _handle_digital_shortcut_event(button_event)

	if event is InputEventJoypadMotion:
		var motion_event := event as InputEventJoypadMotion
		if absf(motion_event.axis_value) <= _get_gamepad_deadzone():
			return false
		return _handle_digital_shortcut_event(motion_event)

	return false


func _is_skip_shortcut_released(event: InputEvent) -> bool:
	if event is InputEventJoypadMotion:
		return false
	if event.is_action_released("skip"):
		return true
	if event is InputEventKey:
		return _is_key_event_action_match(event as InputEventKey, "skip", false)
	return false


func _handle_digital_shortcut_event(event: InputEvent) -> bool:
	if _statement_connection_mode_active:
		if _is_shortcut_action_pressed(event, "move_right"):
			_move_statement_connection_selection(1)
			return true
		if _is_shortcut_action_pressed(event, "move_left"):
			_move_statement_connection_selection(-1)
			return true
		if _is_shortcut_action_pressed(event, "interact"):
			_open_statement_connection_selection()
			return true
		if _is_shortcut_action_pressed(event, "back"):
			_exit_statement_connection_mode()
			return true

	if _statement_note_open:
		if _is_shortcut_action_pressed(event, "move_down"):
			return _move_statement_notebook_focus_vertical(1)
		if _is_shortcut_action_pressed(event, "move_up"):
			return _move_statement_notebook_focus_vertical(-1)
		if _is_shortcut_action_pressed(event, "move_right"):
			return _move_statement_notebook_focus_horizontal(1)
		if _is_shortcut_action_pressed(event, "move_left"):
			return _move_statement_notebook_focus_horizontal(-1)
		if _is_shortcut_action_pressed(event, "interact"):
			return _activate_statement_notebook_focus()
		if _is_shortcut_action_pressed(event, "back"):
			_close_statement_notebook()
			return true
		return false

	if _statement_loop_prompt_open:
		return false

	if _is_shortcut_action_pressed(event, "menu"):
		_exit_statement_connection_mode()
		_toggle_menu_overlay()
		return true

	if _is_menu_overlay_open():
		return false

	if _handle_choice_shortcut_input(event):
		return true

	if _is_shortcut_action_pressed(event, "connect_mode"):
		return _enter_statement_connection_mode()

	if _uses_statement_dialogue_window():
		if _is_shortcut_action_pressed(event, "move_right"):
			_advance_statement_forward(true)
			return true
		if _is_shortcut_action_pressed(event, "move_left"):
			_retreat_dialogue(true)
			return true
		if _is_shortcut_action_pressed(event, "interact"):
			_reveal_statement_dialogue()
			return true

	if _is_shortcut_action_pressed(event, "skip"):
		_start_skip_hold()
		return true
	if _is_shortcut_action_pressed(event, "log"):
		_on_backlog_pressed()
		return true
	if _is_shortcut_action_pressed(event, "tree"):
		_on_branch_tree_pressed()
		return true
	if _is_shortcut_action_pressed(event, "interact") and _can_advance_dialogue():
		_advance_dialogue()
		return true

	return false


func _is_shortcut_action_pressed(event: InputEvent, action: StringName) -> bool:
	if not event.is_action_pressed(action):
		if event is InputEventKey:
			return _is_key_event_action_match(event as InputEventKey, action, true)
		return false
	if event is InputEventJoypadMotion:
		return Input.is_action_just_pressed(action)
	return true


func _is_key_event_action_match(key_event: InputEventKey, action: StringName, pressed: bool) -> bool:
	if key_event.pressed != pressed:
		return false
	if pressed and key_event.echo:
		return false
	if not InputMap.has_action(action):
		return false

	for mapped_event in InputMap.action_get_events(action):
		if not mapped_event is InputEventKey:
			continue
		var mapped_key_event := mapped_event as InputEventKey
		if _key_events_share_key(key_event, mapped_key_event):
			return true
	return false


func _key_events_share_key(source: InputEventKey, target: InputEventKey) -> bool:
	var source_physical := source.physical_keycode
	var source_key := source.keycode
	var target_physical := target.physical_keycode
	var target_key := target.keycode

	if target_physical != KEY_NONE and (target_physical == source_physical or target_physical == source_key):
		return true
	if target_key != KEY_NONE and (target_key == source_key or target_key == source_physical):
		return true
	return false


func _handle_pointer_advance_event(event: InputEvent) -> bool:
	if not _can_advance_dialogue():
		if event is InputEventScreenTouch and not (event as InputEventScreenTouch).pressed:
			_touch_advance_gestures.erase((event as InputEventScreenTouch).index)
		return false

	if event is InputEventScreenTouch:
		return _handle_touch_advance_event(event as InputEventScreenTouch)
	if event is InputEventScreenDrag:
		_track_touch_advance_drag(event as InputEventScreenDrag)
		return false
	if event is InputEventMouseButton:
		var mouse_event := event as InputEventMouseButton
		return (
			mouse_event.button_index == MOUSE_BUTTON_LEFT
			and mouse_event.pressed
			and mouse_event.device != InputEvent.DEVICE_ID_EMULATION
		)
	return false


func _handle_touch_advance_event(touch_event: InputEventScreenTouch) -> bool:
	if touch_event.pressed:
		_touch_advance_gestures[touch_event.index] = {
			"start": touch_event.position,
			"dragged": false,
		}
		return false

	if not _touch_advance_gestures.has(touch_event.index):
		return false

	var gesture: Dictionary = _touch_advance_gestures[touch_event.index]
	_touch_advance_gestures.erase(touch_event.index)
	if gesture.get("dragged", false):
		return false
	return touch_event.position.distance_to(gesture.start) <= TOUCH_TAP_MAX_DISTANCE_PX


func _track_touch_advance_drag(drag_event: InputEventScreenDrag) -> void:
	if not _touch_advance_gestures.has(drag_event.index):
		return

	var gesture: Dictionary = _touch_advance_gestures[drag_event.index]
	if drag_event.position.distance_to(gesture.start) > TOUCH_TAP_MAX_DISTANCE_PX:
		gesture.dragged = true


func _reveal_statement_dialogue() -> bool:
	if not _uses_statement_dialogue_window():
		return false
	if _statement_note_open or _statement_loop_prompt_open or _statement_title_playing or _awaiting_portrait_for_dialogue:
		return false
	if _dialogue_typewriter.is_typing():
		_dialogue_typewriter.reveal_all()
	return true


func _advance_dialogue() -> void:
	if not _can_advance_dialogue():
		return

	if _is_statement_presentation():
		_advance_statement_forward()
		return

	if not _dialogue_typewriter.request_advance():
		_update_advance_hint()
		return

	if not _has_loaded_dialogue:
		request_screen_change("chapter_select")
		return

	var next_id := String(_current_node.get("next", ""))
	if next_id.is_empty():
		if _try_advance_to_chained_dialogue():
			return
		request_screen_change("chapter_select")
		return

	_transition_to_node(next_id)


func _show_menu_overlay() -> void:
	if _menu_overlay == null:
		return
	if _menu_overlay.visible and not _menu_overlay_closing:
		return

	_stop_skip_hold()
	_set_floating_ui_visible(false)
	_menu_overlay_closing = false
	_menu_overlay.visible = true
	_show_menu_panel()
	_update_advance_hint()


func _hide_menu_overlay(after_close: Callable = Callable()) -> void:
	if _menu_overlay == null:
		return
	if not _menu_overlay.visible or _menu_overlay_closing:
		return

	_close_menu_panel(after_close)


func _toggle_menu_overlay() -> void:
	if _is_menu_overlay_open():
		_hide_menu_overlay()
	else:
		_show_menu_overlay()


func _is_menu_overlay_open() -> bool:
	return _menu_overlay != null and _menu_overlay.visible


func _restore_dialogue_focus() -> void:
	if _choice_list != null and _choice_list.visible and _choice_list.get_child_count() > 0:
		set_preferred_focus_control(_choice_list.get_child(0) as Control)
	else:
		refresh_input_focus_mode()


func _on_choice_pressed(next_id: String, choice_text := "") -> void:
	_pause_skip_hold()
	_append_backlog_entry("선택", choice_text, MUTED_TEXT_COLOR, "choice", _current_node_id)
	var resolved_next_id := next_id.strip_edges()
	if resolved_next_id.is_empty():
		resolved_next_id = String(_current_node.get("next", "")).strip_edges()

	if resolved_next_id.is_empty():
		if _try_advance_to_chained_dialogue():
			return
		request_screen_change("chapter_select")
		return

	_transition_to_node(resolved_next_id)


func _on_skip_button_down() -> void:
	_start_skip_hold()


func _on_skip_button_up() -> void:
	_stop_skip_hold()


func _on_backlog_pressed() -> void:
	_stop_skip_hold()
	request_overlay("backlog", _make_backlog_payload())


func _on_branch_tree_pressed() -> void:
	_stop_skip_hold()
	request_overlay("branch_tree", _make_branch_tree_payload())


func _on_menu_pressed() -> void:
	_stop_skip_hold()
	_toggle_menu_overlay()


func _on_input_mode_changed(mode: String) -> void:
	super._on_input_mode_changed(mode)
	if mode != INPUT_MODE_KEYBOARD and mode != INPUT_MODE_GAMEPAD:
		_exit_statement_connection_mode()
	call_deferred("_refresh_input_hints")
	call_deferred("_refresh_choice_button_styles")
	call_deferred("_refresh_statement_controls")
