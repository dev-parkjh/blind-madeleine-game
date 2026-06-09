extends "res://scripts/screens/screen_base.gd"

const RewindTransitionOverlay = preload("res://scripts/ui/rewind_transition_overlay.gd")
const MobileLayout = preload("res://scripts/ui/mobile_layout.gd")
const GeneratedUiTheme = preload("res://scripts/ui/generated_ui_theme.gd")
const DialogueAlphaEffect = preload("res://scripts/visual_novel/dialogue_alpha_effect.gd")
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
const CHOICE_LABEL_FONT_SIZE := 22
const CHOICE_LABEL_RIGHT := 20.0
const CHOICE_LABEL_TOP := -12.0
const CHOICE_LABEL_NOTCH_PADDING := 10.0
const CHOICE_HEARD_CHECK_LEFT := 14.0
const CHOICE_HEARD_CHECK_SIZE := 28.0
const CHOICE_HEARD_CHECK_GAP := 8.0
const CHOICE_HEARD_CHECK_FONT_SIZE := 25
const CHOICE_HEARD_CHECK_FONT_MIN_SIZE := 12
const CHOICE_LIST_SEPARATION := 32.0
const CHOICE_REFERENCE_STAGE_SIZE := Vector2(1920.0, 777.0)
const CHOICE_DIALOGUE_WIDTH_MIN_SCALE := 0.46
const CHOICE_VIEWPORT_HEIGHT_MIN_SCALE := 0.52
const CHOICE_FONT_MIN_SIZE := 14
const CHOICE_LABEL_FONT_MIN_SIZE := 13
const CHOICE_LABEL_FONT_WEIGHT := 700
const CHOICE_LABEL_OUTLINE_SIZE := 1
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
const DIALOGUE_TEXT_SOUND_PATH := "res://assets/sfx/dialogue_text_tick.ogg"
const DIALOGUE_TEXT_SOUND_MUTED_METADATA_KEY := "text_sound_muted"
const DIALOGUE_TEXT_SOUND_VOLUME_DB := -4.0
const DIALOGUE_TEXT_SOUND_MOBILE_VOLUME_BOOST_DB := 6.0
const DIALOGUE_TEXT_SOUND_MIN_INTERVAL_MSEC := 100
const DIALOGUE_TEXT_SOUND_MAX_VISIBLE_STEP := 2
const DIALOGUE_TEXT_SOUND_POOL_SIZE := 8
const DEFAULT_SPEAKER_COLOR := Color(0.92, 0.9, 0.84)
const MYSTERY_SPEAKER_NAME := "???"
const MYSTERY_SPEAKER_COLOR := Color("#b8b8b8")
const BODY_TEXT_COLOR := Color(0.86, 0.84, 0.78)
const NARRATOR_TEXT_COLOR := Color("#a0a0a0")
const MUTED_TEXT_COLOR := Color(0.6, 0.58, 0.54)
const DIALOGUE_CONTENT_MARGIN_LEFT := 48
const DIALOGUE_CONTENT_MARGIN_LEFT_UNFOLDED := 62
const DIALOGUE_CONTENT_MARGIN_TOP := 46
const DIALOGUE_CONTENT_MARGIN_TOP_UNFOLDED := 62
const DIALOGUE_CONTENT_MARGIN_RIGHT := 48
const DIALOGUE_CONTENT_MARGIN_BOTTOM := 24
const DIALOGUE_CONTENT_MARGIN_BOTTOM_MOBILE := 42
const SPEAKER_LABEL_LEFT := 52.0
const SPEAKER_LABEL_TOP := -20.0
const SPEAKER_LABEL_TOP_UNFOLDED := -36.0
const SPEAKER_LABEL_NOTCH_PADDING := 12.0
const SPEAKER_LABEL_OUTLINE_COLOR := Color(0, 0, 0, 0.78)
const MENU_OVERLAY_COLOR := Color(0, 0, 0, 0.56)
const BACKGROUND_IMAGE_OPACITY_DEFAULT := 1.0
const BACKGROUND_FILTER_BLUR_DEFAULT := 3.0
const BACKGROUND_FILTER_BRIGHTNESS_DEFAULT := 0.75
const BACKGROUND_FILTER_SATURATION_DEFAULT := 0.8
const BACKGROUND_DIM_OPACITY_DEFAULT := 0.15
const BACKGROUND_IMAGE_PARALLAX_OVERSCAN_PADDING := 18.0
const BACKGROUND_IMAGE_PARALLAX_MIN_OVERSCAN := 36.0
const BACKGROUND_IMAGE_PARALLAX_MAX_OVERSCAN_RATIO := 0.16
const BACKGROUND_IMAGE_PARALLAX_SMOOTH_RATE := 9.0
const BACKGROUND_IMAGE_PARALLAX_TARGET_EPSILON_SQ := 0.25
const MENU_PANEL_WIDTH := 450.0
const MENU_PANEL_MARGIN := 42.0
const KEYCAP_BACKGROUND_COLOR := Color(0.18, 0.17, 0.15, 0.94)
const KEYCAP_BORDER_COLOR := Color(0.42, 0.4, 0.35)
const TOP_MENU_GHOST_HOVER_COLOR := Color(1, 1, 1, 0.07)
const TOP_MENU_GHOST_PRESSED_COLOR := Color(1, 1, 1, 0.11)
const TOP_MENU_GHOST_CORNER_RADIUS := 12
const TOP_MENU_BUTTON_CONTENT_MARGIN := Vector2(12, 3)
const TOP_MENU_BUTTON_CONTENT_MARGIN_MOBILE := Vector2(16, 4)
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
const STATEMENT_POINTER_NAV_FONT_SIZE := 64
const STATEMENT_POINTER_NAV_ICON_HEIGHT := 58
const STATEMENT_GAMEPAD_NAV_ICON_HEIGHT := 42
const POINTER_SCROLL_DEADZONE := 12.0
const ADVANCE_HINT_PULSE_MIN_ALPHA := 0.42
const ADVANCE_HINT_PULSE_FADE_DURATION := 0.85
const ADVANCE_HINT_PULSE_PEAK_HOLD := 0.55
const AUTO_ADVANCE_DEFAULT_DELAY := 0.35
const POINTER_TAP_MAX_DISTANCE_PX := 18.0
const STATEMENT_LIE_META_PREFIX := "statement_lie:"
const STATEMENT_LIE_TAG_NAME := "lie"
const DIALOGUE_BBCODE_TAGS := [
	"b", "i", "u", "s", "code", "font", "font_size", "font_scale", "color", "bgcolor", "fgcolor",
	"outline_size", "outline_color", "shake", "wave", "tornado", "pulse", "fade",
	"rainbow", "grow", "blink", "alpha",
	"speed", "text_speed", "type_speed", "typewriter_speed",
	"sfx", "sound", "se", "bgm", "music", "bgm_stop", "music_stop", "bgm_volume", "music_volume",
	"bg", "background", "bg_clear", "background_clear", "bg_remove", "background_remove",
	"auto_next", "auto_advance", "advance",
	"enter", "exit",
]
const DIALOGUE_EVENT_TAGS := [
	"sfx", "sound", "se", "bgm", "music", "bgm_stop", "music_stop", "bgm_volume", "music_volume",
	"bg", "background", "bg_clear", "background_clear", "bg_remove", "background_remove",
	"auto_next", "auto_advance", "advance",
	"enter", "exit",
]
const DIALOGUE_TYPEWRITER_TAGS := [
	"speed", "text_speed", "type_speed", "typewriter_speed",
]
const STATEMENT_LIE_TEXT_SIDE_PADDING := " "
const STATEMENT_LIE_TEXT_SIDE_PADDING_EXPANDED := "  "
const NOTEBOOK_MODE_STATEMENT := "statement"
const NOTEBOOK_MODE_VIEW := "view"
const NOTEBOOK_MODE_PRESENT := "present"
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
const STATEMENT_NOTE_MOBILE_LEFT_WIDTH_RATIO := 0.34
const STATEMENT_NOTE_CAPTION_LIFT := 8
const STATEMENT_NOTE_OVERLAY_COLOR := Color(0, 0, 0, 0.0)
const STATEMENT_NOTE_SPEAKER_ZOOM := 300
const STATEMENT_NOTE_SPEAKER_OPACITY := 1.0
const STATEMENT_NOTE_PANEL_ENTER_DURATION := 0.45
const TALK_CHOICE_SPEAKER_ZOOM := STATEMENT_NOTE_SPEAKER_ZOOM
const TALK_CHOICE_SPEAKER_OPACITY := STATEMENT_NOTE_SPEAKER_OPACITY
const INVESTIGATION_MAP_PANEL_MAX_SIZE := Vector2(1180.0, 760.0)
const INVESTIGATION_MAP_PANEL_MARGIN := Vector2(64.0, 54.0)
const INVESTIGATION_MAP_BOARD_MIN_HEIGHT := 420.0
const INVESTIGATION_MAP_PIN_SIZE := Vector2(42.0, 42.0)
const INVESTIGATION_MAP_PIN_LABEL_SIZE := Vector2(172.0, 32.0)
const INVESTIGATION_MAP_PIN_COLOR := Color(0.82, 0.08, 0.06)
const INVESTIGATION_MAP_PIN_DISABLED_COLOR := Color(0.38, 0.12, 0.1)
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
const STATEMENT_NOTEBOOK_METADATA_KEY := "statement_notebook"
const STATEMENT_TITLE_FADE_DURATION := 0.3
const STATEMENT_TITLE_HOLD_DURATION := 1.2
const REWIND_FADE_DURATION := 0.28
const REWIND_NEAREST_DIALOGUE_ZOOM_KEY := "__nearest_dialogue_zoom_percent"
const CHAIN_BLACKOUT_FADE_DURATION_METADATA_KEY := "next_dialogue_blackout_fade_duration"
const CHAIN_BLACKOUT_HOLD_DURATION_METADATA_KEY := "next_dialogue_blackout_hold_duration"
const CHAIN_BLACKOUT_FADE_IN_DURATION := 0.28
const CHAIN_BLACKOUT_HOLD_DURATION := 0.16
const CHAIN_BLACKOUT_FADE_OUT_DURATION := 0.34
const NODE_MODE_CUTSCENE := "cutscene"
const NODE_MODE_BLACKOUT := NODE_MODE_CUTSCENE
const NODE_MODE_STAGE := "stage"
const NODE_CUTSCENE_FADE_IN_DURATION := 0.28
const NODE_CUTSCENE_HOLD_DURATION := 0.16
const NODE_CUTSCENE_FADE_OUT_DURATION := 0.34
const NODE_BLACKOUT_FADE_IN_DURATION := NODE_CUTSCENE_FADE_IN_DURATION
const NODE_BLACKOUT_HOLD_DURATION := NODE_CUTSCENE_HOLD_DURATION
const NODE_BLACKOUT_FADE_OUT_DURATION := NODE_CUTSCENE_FADE_OUT_DURATION
const STATEMENT_LOOP_PROMPT_TEXT := "진술의 마지막 부분입니다. 처음으로 돌아갈까요?"
const STATEMENT_LOOP_PROMPT_PANEL_WIDTH := 560.0
const STATEMENT_LOOP_PROMPT_BUTTON_SIZE := Vector2(180.0, 72.0)
const SPECTRUM_PORTRAIT_WIDTH_RATIO := 0.76
const SPECTRUM_HEIGHT_SCALE_POWER := 1.12
const SPECTRUM_MIN_ZOOM_SIZE_FACTOR := 0.82
const SPECTRUM_MIN_ZOOM_ALPHA := 0.40
const SPECTRUM_MAX_ZOOM_ALPHA := 0.90
const STAGE_CAST_OPACITY_FOCUSED_DEFAULT := 1.0
const STAGE_CAST_OPACITY_UNFOCUSED_DEFAULT := 0.7
const STAGE_CAST_ZOOM_DEFAULT := 300
const STAGE_CAST_UNFOCUSED_VISUAL_SCALE := 0.9
const STAGE_CAST_ANIMATION_SPEED_DEFAULT := 1.0
const STAGE_PORTRAIT_HIGHLIGHT_DURATION := 0.28
const STAGE_CAST_OPACITY_ANIMATION_DURATION := 0.5
const STAGE_PARALLAX_ACTIVE_WEIGHT := 2.35
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
const POPUP_MOVE_DURATION := 0.35
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
	"xbox_x": "res://assets/icon/input/xbox_button_color_x_outline.png",
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
		"auto": "xbox_x",
		"log": "xbox_y",
		"tree": "xbox_view",
		"case_note": "xbox_rb",
		"menu": "xbox_menu",
	},
}
const TOP_MENU_ICON_HEIGHTS := {
	"gamepad": {
		"skip": 33,
		"auto": 27,
		"log": 27,
		"tree": 27,
		"case_note": 33,
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
const AUTO_MODE_ADVANCE_DELAY := 1.4
const AUTO_HOLD_ACTIVATION_DELAY := 0.28
const SKIP_BUTTON_HOLD_ACTIVATION_DELAY := AUTO_HOLD_ACTIVATION_DELAY
const AUTO_INDICATOR_LABEL_WIDTH := 78.0
const AUTO_INDICATOR_LABEL_OFFSET_X := 10.0
const AUTO_INDICATOR_LABEL_OFFSET_Y := 2.0
const AUTO_INDICATOR_ICON_GAP := 16.0
const AUTO_INDICATOR_ICON_GAP_MOBILE := 34.0
const AUTO_INDICATOR_TEXT := "AUTO"
const AUTO_INDICATOR_ICON := "AutoModeRounded"
const AUTO_INDICATOR_ICON_HEIGHT := 35
const AUTO_INDICATOR_POSITION_OFFSET_X := 10.0
const AUTO_INDICATOR_POSITION_OFFSET_Y := 4.0
const DEBUG_MODE_LABEL_TEXT := "디버그 모드 활성화 됨"
const DEBUG_MODE_LABEL_FONT_SIZE := 14

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


class InvestigationMapBoard:
	extends Control

	var texture: Texture2D
	var pin_positions: Array[Vector2] = []
	var current_pin_index := -1

	func configure(next_texture: Texture2D, next_pin_positions: Array[Vector2], next_current_pin_index: int) -> void:
		texture = next_texture
		pin_positions = next_pin_positions.duplicate()
		current_pin_index = next_current_pin_index
		queue_redraw()

	func _notification(what: int) -> void:
		if what == NOTIFICATION_RESIZED:
			queue_redraw()

	func _draw() -> void:
		if size.x <= 2.0 or size.y <= 2.0:
			return

		var rect := Rect2(Vector2.ZERO, size)
		draw_rect(rect, Color(0.065, 0.052, 0.043, 0.98), true)
		_draw_board_grid()
		if texture != null:
			var image_rect := _get_contained_texture_rect(texture, size)
			draw_texture_rect(texture, image_rect, false, Color(1, 1, 1, 0.68))

		var points: Array[Vector2] = []
		for normalized in pin_positions:
			points.append(Vector2(clampf(normalized.x, 0.0, 1.0) * size.x, clampf(normalized.y, 0.0, 1.0) * size.y))

		var line_color := INVESTIGATION_MAP_PIN_COLOR
		line_color.a = 0.72
		for index in range(points.size()):
			for other_index in range(index + 1, points.size()):
				draw_line(points[index], points[other_index], line_color, 2.4, true)

		for index in range(points.size()):
			var point := points[index]
			var pin_color := INVESTIGATION_MAP_PIN_DISABLED_COLOR if index == current_pin_index else INVESTIGATION_MAP_PIN_COLOR
			draw_circle(point + Vector2(2.0, 3.0), 15.0, Color(0, 0, 0, 0.42))
			draw_circle(point, 14.0, pin_color)
			draw_circle(point, 5.0, Color(1, 0.93, 0.86, 0.96))

		draw_rect(rect, Color(0.78, 0.68, 0.52, 0.38), false, 3.0)

	func _draw_board_grid() -> void:
		var grid_color := Color(0.78, 0.62, 0.42, 0.10)
		var step := 72.0
		var x := step
		while x < size.x:
			draw_line(Vector2(x, 0.0), Vector2(x, size.y), grid_color, 1.0)
			x += step
		var y := step
		while y < size.y:
			draw_line(Vector2(0.0, y), Vector2(size.x, y), grid_color, 1.0)
			y += step

	func _get_contained_texture_rect(target_texture: Texture2D, target_size: Vector2) -> Rect2:
		var texture_size := Vector2(target_texture.get_width(), target_texture.get_height())
		if texture_size.x <= 0.0 or texture_size.y <= 0.0:
			return Rect2(Vector2.ZERO, target_size)
		var scale := minf(target_size.x / texture_size.x, target_size.y / texture_size.y)
		var image_size := texture_size * scale
		return Rect2((target_size - image_size) * 0.5, image_size)


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
var _auto_indicator: Control
var _auto_indicator_label: Label
var _auto_indicator_icon: TextureRect
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
var _statement_notebook_pointer_scroll: ScrollContainer
var _statement_notebook_pointer_scroll_start_position := Vector2.ZERO
var _statement_notebook_pointer_scroll_start_vertical := 0
var _statement_notebook_pointer_scroll_dragging := false
var _statement_title_overlay: Control
var _statement_title_group: Control
var _statement_title_label: Label
var _statement_title_caption: Label
var _statement_loop_prompt_overlay: Control
var _statement_loop_prompt_yes_button: Button
var _statement_loop_prompt_no_button: Button
var _skip_button: Button
var _auto_button: Button
var _backlog_button: Button
var _branch_tree_button: Button
var _case_notebook_button: Button
var _menu_button: Button
var _menu_continue_button: Button
var _choice_list: Control
var _choice_overlay: Control
var _portrait_viewport: Control
var _effect_layer: Control
var _dialogue_overlay: Control
var _dialogue_panel: PanelContainer
var _dialogue_border_frame: DialogueBorderFrame
var _dialogue_content_margin: MarginContainer
var _dialogue_text_layout: VBoxContainer
var _dialogue_window_suppressed := false
var _debug_mode_label: Label
var _menu_overlay: Control
var _menu_scrim: ColorRect
var _menu_panel: PanelContainer
var _menu_panel_final_rect := Rect2()
var _menu_overlay_closing := false
var _investigation_map_overlay: Control
var _investigation_map_panel: PanelContainer
var _investigation_map_board: InvestigationMapBoard
var _investigation_map_title: Label
var _investigation_map_close_button: Button
var _rewind_fade_overlay: Control
var _rewind_fade_tween: Tween
var _chain_blackout_overlay: ColorRect
var _chain_blackout_tween: Tween
var _node_blackout_overlay: ColorRect
var _node_cutscene_image_rect: TextureRect
var _node_blackout_tween: Tween
var _node_blackout_transitioning := false
var _stage_node_hold_tween: Tween
var _floating_ui_canvas: CanvasLayer
var _floating_ui_layer: Control
var _floating_ui_tween: Tween
var _top_menu_bar: HBoxContainer
var _top_menu_buttons: Dictionary = {}
var _top_menu_separators: Array[MarginContainer] = []

var _background_layer: Control
var _background_image_rect: TextureRect
var _background_dim_rect: ColorRect
var _background_image_tween: Tween
var _background_image_path := ""
var _background_image_fixed := false
var _background_image_zoom := 1.0
var _background_image_focus := Vector2(0.5, 0.5)
var _background_parallax_target_offset := Vector2.ZERO
var _background_parallax_offset := Vector2.ZERO
var _background_texture_filter_cache: Dictionary = {}
var _character_layer: Control
var _popup_layer: Control
var _active_popup_items: Array[Dictionary] = []
var _dialogue_spectrum: DialogueSpectrum
var _text_sound_players: Array[AudioStreamPlayer] = []
var _text_sound_stream: AudioStream
var _text_sound_muted_for_current_node := false
var _text_sound_last_visible_count := 0
var _text_sound_last_played_msec := 0
var _text_sound_player_index := 0
var _bgm_player: AudioStreamPlayer
var _bgm_tween: Tween
var _current_bgm_base_volume_db := 0.0
var _current_bgm_content_volume_db := 0.0
var _sfx_players: Array[AudioStreamPlayer] = []
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
var _stage_focus_targets: Dictionary = {}
var _stage_characters: Dictionary = {}
var _stage_character_slots: Dictionary = {}
var _stage_entering_ids: Dictionary = {}
var _rewind_stage_zoom_state: Dictionary = {}
var _parallax_target_speaker_ids: Dictionary = {}
var _dialogue_tall_factor := 0.0
var _dialogue_mobile_factor := 0.0
var _choice_button_style_normal: StyleBox
var _choice_button_style_hover: StyleBox
var _choice_button_style_focus: StyleBox
var _choice_button_style_pressed: StyleBox

var _dialogue_id := ""
var _dialogue_metadata: Dictionary = {}
var _current_node_id := ""
var _current_node: Dictionary = {}
var _nodes_by_id: Dictionary = {}
var _talk_menu_node_id := ""
var _talk_exit_pending := false
var _talk_choice_character_shift_active := false
var _talk_choice_character_shift_speaker_id := ""
var _talk_choice_character_shift_original_state: Dictionary = {}
var _talk_choice_animation_token := 0
var _statement_node_ids: Array[String] = []
var _statement_node_index_by_id: Dictionary = {}
var _statement_current_lies: Array[Dictionary] = []
var _statement_lie_ranges: Array[Vector2i] = []
var _statement_hovered_lie_index := -1
var _statement_active_lie_index := -1
var _statement_node_history: Array[String] = []
var _statement_note_open := false
var _statement_notebook_mode := NOTEBOOK_MODE_STATEMENT
var _case_notebook_present_choices: Array[Dictionary] = []
var _statement_connection_mode_active := false
var _statement_resume_connection_mode_on_note_close := false
var _statement_lie_revealing := false
var _statement_title_playing := false
var _statement_title_preparing_reveal := false
var _statement_title_pending_spectrum: Dictionary = {}
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
var _awaiting_portrait_for_dialogue := false
var _portrait_dialogue_token := 0
var _pending_dialogue: Dictionary = {}
var _cast_batch_remaining := 0
var _cast_batch_on_finished := Callable()
var _skip_hold_requested := false
var _skip_hold_active := false
var _skip_advance_cooldown := 0.0
var _skip_mode_toggled := false
var _skip_button_press_active := false
var _skip_button_press_started_requested := false
var _skip_button_press_started_msec := 0
var _auto_mode_toggled := false
var _auto_hold_active := false
var _auto_hold_pending := false
var _auto_hold_elapsed := 0.0
var _auto_hold_source := ""
var _auto_hold_start_position := Vector2.ZERO
var _auto_hold_dragged := false
var _auto_mode_advance_scheduled := false
var _grid_background_needs_initial_snap := false
var _dialogue_chain_transitioning := false
var _auto_advance_token := 0
var _current_node_exit_speaker_ids: Array[String] = []


func setup(payload: Dictionary = {}) -> void:
	setup_payload = payload
	if is_node_ready():
		_load_dialogue_from_payload(payload)


func _ready() -> void:
	screen_id = "story_dialogue"
	screen_title = "일반 대화"
	skip_allowed = true
	_build()
	_connect_debug_mode_signal()
	_dialogue_typewriter.bind(_dialogue_text)
	_dialogue_typewriter.typewriter_finished.connect(_update_advance_hint)
	_dialogue_typewriter.typewriter_finished.connect(_on_dialogue_typewriter_finished)
	_dialogue_typewriter.visible_character_changed.connect(_on_dialogue_visible_character_changed)
	_dialogue_typewriter.speed_range_active_changed.connect(_on_dialogue_speed_range_active_changed)
	_dialogue_typewriter.dialogue_event_reached.connect(_on_dialogue_event_reached)
	_connect_game_settings_signal()
	_apply_game_settings()
	set_process(false)
	_load_dialogue_from_payload(setup_payload)
	_refresh_debug_mode_label()
	call_deferred("_sync_fixed_overlay_layout")
	call_deferred("_sync_grid_background")


func _process(delta: float) -> void:
	var typewriter_processed := _dialogue_typewriter.process(delta)
	var background_parallax_processed := _process_background_image_parallax(delta)
	if _auto_hold_pending:
		_process_auto_hold_pending(delta)
	if _skip_hold_active:
		_process_skip_hold(delta)
	if typewriter_processed or _skip_hold_active or _auto_hold_pending or background_parallax_processed:
		return

	set_process(false)


func set_overlay_obscured(obscured: bool) -> void:
	_overlay_obscured = obscured
	if obscured:
		_stop_skip_hold()
		_stop_auto_mode()
	var should_show := not obscured and not _statement_title_playing and not _statement_title_preparing_reveal and not _is_menu_overlay_open()
	_set_floating_ui_visible(should_show)
	_refresh_skip_hold_ui()


func _connect_game_settings_signal() -> void:
	var callback := Callable(self, "_on_game_setting_changed")
	if not GameSettings.is_connected("setting_changed", callback):
		GameSettings.connect("setting_changed", callback)


func _apply_game_settings() -> void:
	_dialogue_typewriter.playback_speed_multiplier = GameSettings.get_dialogue_speed_multiplier()
	_refresh_text_sound_player_volumes()
	_refresh_sfx_player_volumes()
	_refresh_bgm_player_volume_from_settings()
	if not GameSettings.is_dialogue_text_sound_enabled():
		_stop_dialogue_text_sound()
	if not GameSettings.is_dialogue_spectrum_enabled():
		_hide_dialogue_spectrum()
	if not GameSettings.is_background_image_enabled():
		_clear_background_image()


func _on_game_setting_changed(key: String) -> void:
	match key:
		GameSettings.BGM_VOLUME:
			_refresh_bgm_player_volume_from_settings()
		GameSettings.SE_VOLUME:
			_refresh_sfx_player_volumes()
		GameSettings.DIALOGUE_TEXT_SOUND_VOLUME:
			_refresh_text_sound_player_volumes()
			if not GameSettings.is_dialogue_text_sound_enabled():
				_stop_dialogue_text_sound()
		GameSettings.DIALOGUE_SPEED_STEP:
			_dialogue_typewriter.playback_speed_multiplier = GameSettings.get_dialogue_speed_multiplier()
		GameSettings.BACKGROUND_IMAGE_ENABLED:
			if not GameSettings.is_background_image_enabled():
				_clear_background_image(0.2, "fade")
		GameSettings.DIALOGUE_SPECTRUM_ENABLED:
			if not GameSettings.is_dialogue_spectrum_enabled():
				_hide_dialogue_spectrum()


func _refresh_text_sound_player_volumes() -> void:
	var volume_db := _get_text_sound_volume_db()
	for player in _text_sound_players:
		if player != null:
			player.volume_db = volume_db


func _refresh_sfx_player_volumes() -> void:
	for player in _sfx_players:
		if player == null:
			continue
		var base_volume_db := player.volume_db
		if player.has_meta("base_volume_db"):
			base_volume_db = float(player.get_meta("base_volume_db"))
		player.volume_db = _get_se_playback_volume_db(base_volume_db)


func _refresh_bgm_player_volume_from_settings() -> void:
	if _bgm_player == null or _bgm_player.stream == null:
		return
	_kill_bgm_tween()
	_bgm_player.volume_db = _get_bgm_playback_volume_db(_current_bgm_content_volume_db)


func _get_text_sound_volume_db() -> float:
	return _apply_global_volume_db(
		DIALOGUE_TEXT_SOUND_VOLUME_DB + _get_dialogue_text_sound_device_boost_db(),
		GameSettings.get_dialogue_text_sound_volume_db_offset()
	)


func _get_se_playback_volume_db(base_volume_db: float) -> float:
	return _apply_global_volume_db(base_volume_db, GameSettings.get_se_volume_db_offset())


func _get_bgm_playback_volume_db(content_volume_db: float) -> float:
	return _apply_global_volume_db(content_volume_db, GameSettings.get_bgm_volume_db_offset())


func _apply_global_volume_db(base_volume_db: float, volume_offset_db: float) -> float:
	if volume_offset_db <= -79.9:
		return -80.0
	return maxf(base_volume_db + volume_offset_db, -80.0)


func _get_dialogue_text_sound_device_boost_db() -> float:
	return DIALOGUE_TEXT_SOUND_MOBILE_VOLUME_BOOST_DB if _is_mobile_audio_target() else 0.0


func _is_mobile_audio_target() -> bool:
	if (
		OS.has_feature("android")
		or OS.has_feature("ios")
		or OS.has_feature("mobile")
		or OS.has_feature("web_android")
		or OS.has_feature("web_ios")
	):
		return true
	if OS.has_feature("web"):
		return WebDisplayBridge.is_mobile_web()
	return false


func _connect_debug_mode_signal() -> void:
	var input_router := _get_input_router()
	if input_router == null:
		return
	var enabled_callback := Callable(self, "_on_debug_mode_enabled_changed")
	if input_router.has_signal("debug_mode_enabled_changed") and not input_router.is_connected("debug_mode_enabled_changed", enabled_callback):
		input_router.connect("debug_mode_enabled_changed", enabled_callback)
	var input_callback := Callable(self, "_on_debug_command_input_consumed")
	if input_router.has_signal("debug_command_input_consumed") and not input_router.is_connected("debug_command_input_consumed", input_callback):
		input_router.connect("debug_command_input_consumed", input_callback)


func _on_debug_mode_enabled_changed(_enabled: bool) -> void:
	_stop_skip_hold()
	_stop_auto_mode()
	_refresh_debug_mode_label()


func _on_debug_command_input_consumed() -> void:
	_stop_skip_hold()
	_stop_auto_mode()


func _is_debug_mode_enabled() -> bool:
	var input_router := _get_input_router()
	if input_router == null:
		return false
	return bool(input_router.get("debug_mode_enabled"))


func _refresh_debug_mode_label() -> void:
	if _debug_mode_label == null:
		return
	_debug_mode_label.text = DEBUG_MODE_LABEL_TEXT
	_debug_mode_label.visible = _is_debug_mode_enabled()
	_apply_debug_mode_label_layout()


func _input(event: InputEvent) -> void:
	if _should_ignore_gameplay_event(event):
		return

	super._input(event)

	if _handle_statement_notebook_pointer_scroll(event):
		get_viewport().set_input_as_handled()
		return

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


func refresh_pointer_hover_mode() -> void:
	super.refresh_pointer_hover_mode()
	if not is_pointer_hover_enabled():
		_clear_statement_hover_state()


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
	_build_audio_players()
	_build_choice_overlay()
	_build_dialogue_overlay()
	_build_skip_indicator()
	_build_auto_indicator()
	_build_statement_navigation()
	_build_statement_notebook_overlay()
	_build_statement_loop_prompt_overlay()
	_build_statement_title_overlay()
	_create_choice_button_styles()
	_build_floating_menu()
	_sync_fixed_overlay_layout()

	_skip_button.button_down.connect(_on_skip_button_down)
	_skip_button.button_up.connect(_on_skip_button_up)
	_auto_button.pressed.connect(_on_auto_button_pressed)
	_backlog_button.pressed.connect(_on_backlog_pressed)
	_branch_tree_button.pressed.connect(_on_branch_tree_pressed)
	_case_notebook_button.pressed.connect(_on_case_notebook_pressed)
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


func _create_dialogue_panel_style(draw_border := true) -> StyleBox:
	return GeneratedUiTheme.asset_panel_style(
		"dialogue_panel",
		DIALOGUE_PANEL_COLOR,
		DIALOGUE_BORDER_COLOR,
		int(DIALOGUE_BORDER_WIDTH) if draw_border else 0,
		int(DIALOGUE_CORNER_RADIUS),
		15
	)


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

	_background_layer = Control.new()
	_background_layer.name = "BackgroundImageLayer"
	_background_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_background_layer.clip_contents = true
	_background_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	_portrait_viewport.add_child(_background_layer)
	_portrait_viewport.move_child(_background_layer, 0)
	_ensure_background_dim_rect()

	_popup_layer = Control.new()
	_popup_layer.name = "PopupLayer"
	_popup_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_popup_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	_portrait_viewport.add_child(_popup_layer)


func _extract_node_popups(node: Dictionary) -> Array:
	var raw_popups: Variant = node.get("popups", node.get("popup_images", []))
	var popups: Array = []
	if typeof(raw_popups) == TYPE_DICTIONARY:
		popups.append(raw_popups)
	elif typeof(raw_popups) == TYPE_ARRAY:
		popups = raw_popups
	return popups


func _popup_identity_key(popup_data: Dictionary, default_character_id: String = "") -> String:
	var explicit_id := String(popup_data.get("id", "")).strip_edges()
	if not explicit_id.is_empty():
		return "id:%s" % explicit_id

	var source := _normalize_popup_source(popup_data)
	if source == "character_profile":
		var character_id := String(
			popup_data.get("character_id", popup_data.get("target_id", default_character_id))
		).strip_edges()
		var portrait_key := String(popup_data.get("portrait", "")).strip_edges()
		return "character_profile:%s:%s" % [character_id, portrait_key]
	if source == "item":
		var item_id := String(popup_data.get("item_id", popup_data.get("target_id", ""))).strip_edges()
		return "item:%s" % item_id
	if source == "image":
		var path := String(popup_data.get("path", popup_data.get("image", ""))).strip_edges()
		return "image:%s" % path
	return ""


func _find_active_popup_by_key(identity_key: String) -> Dictionary:
	if identity_key.is_empty():
		return {}
	for item in _active_popup_items:
		if String(item.get("identity_key", "")) == identity_key:
			return item
	return {}


func _popup_item_instance_id(item: Dictionary) -> int:
	var root: Control = item.get("root")
	return root.get_instance_id() if root != null else 0


func _sync_node_popups(node: Dictionary, default_character_id: String = "") -> void:
	if _popup_layer == null:
		return

	var popups := _extract_node_popups(node)
	var desired: Array[Dictionary] = []
	for index in popups.size():
		var raw_popup: Variant = popups[index]
		if typeof(raw_popup) != TYPE_DICTIONARY:
			continue
		var popup_data: Dictionary = raw_popup
		var image_spec := _resolve_popup_image_spec(popup_data, default_character_id)
		if image_spec.is_empty():
			continue
		var identity_key := _popup_identity_key(popup_data, default_character_id)
		if identity_key.is_empty():
			identity_key = "popup:%d" % index
		desired.append({
			"index": index,
			"key": identity_key,
			"data": popup_data,
			"spec": image_spec,
		})

	if desired.is_empty():
		_clear_popup_images()
		return

	var next_active: Array[Dictionary] = []
	var reused: Dictionary = {}
	for entry in desired:
		var identity_key := String(entry.get("key", ""))
		var existing := _find_active_popup_by_key(identity_key) if not reused.has(identity_key) else {}
		if not existing.is_empty():
			reused[identity_key] = true
			_update_popup_item(existing, entry.data, entry.spec, int(entry.index), default_character_id)
			next_active.append(existing)
		else:
			var created := _create_popup_image(entry.data, entry.spec, int(entry.index), default_character_id)
			if not created.is_empty():
				next_active.append(created)

	var kept_popup_ids := {}
	for item in next_active:
		kept_popup_ids[_popup_item_instance_id(item)] = true
	for item in _active_popup_items:
		if not kept_popup_ids.has(_popup_item_instance_id(item)):
			_play_popup_exit_animation(item)

	_active_popup_items = next_active


func _show_node_popups(node: Dictionary, default_character_id: String = "") -> void:
	_sync_node_popups(node, default_character_id)


func _clear_popup_images() -> void:
	for item in _active_popup_items:
		var tween: Tween = item.get("tween")
		if tween != null:
			tween.kill()
		var root: Control = item.get("root")
		if root != null:
			root.queue_free()
	_active_popup_items.clear()


func _create_popup_image(
	popup_data: Dictionary,
	image_spec: Dictionary,
	index: int,
	default_character_id: String = ""
) -> Dictionary:
	var texture: Texture2D = image_spec.get("texture")
	if texture == null:
		return {}

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
		"identity_key": _popup_identity_key(popup_data, default_character_id),
		"tween": null,
	}
	_apply_popup_item_layout(item)
	_play_popup_enter_animation(item)
	return item


func _update_popup_item(
	item: Dictionary,
	popup_data: Dictionary,
	image_spec: Dictionary,
	index: int,
	default_character_id: String = ""
) -> void:
	item["data"] = popup_data.duplicate(true)
	item["spec"] = image_spec
	item["identity_key"] = _popup_identity_key(popup_data, default_character_id)

	var root: Control = item.get("root")
	if root != null:
		root.z_index = int(popup_data.get("z_index", index))

	var new_texture: Texture2D = image_spec.get("texture")
	var content_frame: PopupContentFrame = item.get("content_frame")
	if new_texture != null and new_texture != item.get("texture"):
		item["texture"] = new_texture
		if content_frame != null:
			content_frame.set_texture(new_texture)

	var viewport_size := _get_portrait_viewport_size()
	var targets := _resolve_popup_item_layout_targets(popup_data, image_spec, viewport_size)
	if _popup_layout_targets_need_animation(item, targets):
		_play_popup_move_animation(item, targets)
	else:
		_apply_popup_item_layout(item)


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


func _play_popup_exit_animation(item: Dictionary) -> void:
	var root: Control = item.get("root")
	if root == null:
		return

	var tween: Tween = item.get("tween")
	if tween != null and tween.is_valid():
		tween.kill()

	var duration := clampf(POPUP_TRANSITION_DURATION, 0.05, 2.0)
	tween = create_tween()
	item["tween"] = tween
	tween.set_ease(Tween.EASE_IN)
	tween.set_trans(Tween.TRANS_SINE)
	tween.tween_property(root, "modulate:a", 0.0, duration)
	tween.finished.connect(func() -> void:
		item["tween"] = null
		root.queue_free()
	, CONNECT_ONE_SHOT)


func _play_popup_move_animation(item: Dictionary, targets: Dictionary) -> void:
	var root: Control = item.get("root")
	if root == null:
		return

	var popup_data: Dictionary = item.get("data", {})
	var duration := clampf(
		float(popup_data.get("duration", POPUP_MOVE_DURATION)),
		0.0,
		2.0
	)
	if duration <= 0.0:
		_apply_popup_item_layout(item)
		return

	var tween: Tween = item.get("tween")
	if tween != null and tween.is_valid():
		tween.kill()

	var target_position: Vector2 = targets.get("position", root.position)
	var target_size: Vector2 = targets.get("size", root.size)
	var target_opacity: float = float(targets.get("opacity", root.modulate.a))

	tween = create_tween()
	item["tween"] = tween
	tween.set_parallel(true)
	tween.set_ease(Tween.EASE_IN_OUT)
	tween.set_trans(Tween.TRANS_SINE)
	tween.tween_property(root, "position", target_position, duration)
	tween.tween_property(root, "size", target_size, duration)
	tween.tween_property(root, "modulate:a", target_opacity, duration)
	tween.finished.connect(func() -> void:
		item["tween"] = null
		_apply_popup_item_layout(item)
	, CONNECT_ONE_SHOT)


func _resolve_popup_item_layout_targets(
	popup_data: Dictionary,
	spec: Dictionary,
	viewport_size: Vector2
) -> Dictionary:
	var frame_size := _resolve_popup_size(popup_data, viewport_size)
	var anchor := _resolve_popup_anchor(popup_data, viewport_size)
	var position := _clamp_popup_position_to_reference(
		anchor - frame_size * 0.5,
		frame_size,
		_get_popup_position_reference_rect(viewport_size)
	)
	return {
		"position": position,
		"size": frame_size,
		"opacity": _resolve_popup_opacity(popup_data),
		"anchor": anchor,
	}


func _popup_layout_targets_need_animation(item: Dictionary, targets: Dictionary) -> bool:
	var root: Control = item.get("root")
	if root == null:
		return false

	var target_position: Vector2 = targets.get("position", root.position)
	var target_size: Vector2 = targets.get("size", root.size)
	var target_opacity: float = float(targets.get("opacity", root.modulate.a))
	if root.position.distance_to(target_position) > 0.5:
		return true
	if root.size.distance_to(target_size) > 0.5:
		return true
	if absf(root.modulate.a - target_opacity) > 0.01:
		return true
	return false


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
	root.position = _clamp_popup_position_to_reference(
		anchor - frame_size * 0.5,
		frame_size,
		_get_popup_position_reference_rect(viewport_size)
	)
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
	var reference_rect := _get_popup_position_reference_rect(viewport_size)
	return Vector2(
		reference_rect.position.x + (normalized_anchor.x + offset.x) * reference_rect.size.x,
		reference_rect.position.y + (normalized_anchor.y + offset.y) * reference_rect.size.y
	)


func _get_popup_position_reference_rect(viewport_size: Vector2) -> Rect2:
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		return Rect2(Vector2.ZERO, viewport_size)

	var panel_layout := _get_dialogue_panel_layout()
	var left := clampf(float(panel_layout.get("offset_left", 0.0)), 0.0, viewport_size.x)
	var right := clampf(
		viewport_size.x + float(panel_layout.get("offset_right", 0.0)),
		left,
		viewport_size.x
	)
	var statement_side_reserve := _get_statement_dialogue_side_reserve(panel_layout)
	left = minf(right, left + statement_side_reserve)
	right = maxf(left, right - statement_side_reserve)
	return Rect2(Vector2(left, 0.0), Vector2(maxf(1.0, right - left), viewport_size.y))


func _clamp_popup_position_to_reference(position: Vector2, frame_size: Vector2, reference_rect: Rect2) -> Vector2:
	if reference_rect.size.x <= 0.0:
		return position

	var next_position := position
	var min_x := reference_rect.position.x
	var max_x := reference_rect.position.x + reference_rect.size.x - frame_size.x
	if max_x < min_x:
		next_position.x = reference_rect.position.x + (reference_rect.size.x - frame_size.x) * 0.5
	else:
		next_position.x = clampf(next_position.x, min_x, max_x)
	return next_position


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


func _build_audio_players() -> void:
	for index in DIALOGUE_TEXT_SOUND_POOL_SIZE:
		var player := AudioStreamPlayer.new()
		player.name = "DialogueTextSoundPlayer%d" % [index + 1]
		player.volume_db = _get_text_sound_volume_db()
		add_child(player)
		_text_sound_players.append(player)
	_load_dialogue_text_sound_stream()

	_bgm_player = AudioStreamPlayer.new()
	_bgm_player.name = "DialogueBgmPlayer"
	add_child(_bgm_player)


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

	_build_investigation_map_overlay()


func _build_investigation_map_overlay() -> void:
	_investigation_map_overlay = Control.new()
	_investigation_map_overlay.name = "InvestigationMapOverlay"
	_investigation_map_overlay.visible = false
	_investigation_map_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	_investigation_map_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	_choice_overlay.add_child(_investigation_map_overlay)

	var scrim := ColorRect.new()
	scrim.name = "Scrim"
	scrim.color = Color(0, 0, 0, 0.48)
	scrim.mouse_filter = Control.MOUSE_FILTER_STOP
	scrim.set_anchors_preset(Control.PRESET_FULL_RECT)
	_investigation_map_overlay.add_child(scrim)

	_investigation_map_panel = PanelContainer.new()
	_investigation_map_panel.name = "MapPanel"
	_investigation_map_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	_investigation_map_panel.add_theme_stylebox_override("panel", _create_investigation_map_panel_style())
	_investigation_map_overlay.add_child(_investigation_map_panel)

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.add_theme_constant_override("margin_left", 26)
	margin.add_theme_constant_override("margin_top", 22)
	margin.add_theme_constant_override("margin_right", 26)
	margin.add_theme_constant_override("margin_bottom", 24)
	_investigation_map_panel.add_child(margin)

	var layout := VBoxContainer.new()
	layout.name = "Layout"
	layout.add_theme_constant_override("separation", 16)
	margin.add_child(layout)

	var header := HBoxContainer.new()
	header.name = "Header"
	header.add_theme_constant_override("separation", 16)
	layout.add_child(header)

	_investigation_map_title = Label.new()
	_investigation_map_title.name = "Title"
	_investigation_map_title.text = "이동하기"
	_investigation_map_title.add_theme_font_size_override("font_size", 30)
	_investigation_map_title.add_theme_color_override("font_color", Color(0.95, 0.88, 0.76))
	_investigation_map_title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(_investigation_map_title)

	_investigation_map_close_button = Button.new()
	_investigation_map_close_button.name = "CloseButton"
	_investigation_map_close_button.text = "돌아가기"
	_investigation_map_close_button.custom_minimum_size = Vector2(132.0, 48.0)
	_investigation_map_close_button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	_investigation_map_close_button.add_theme_font_size_override("font_size", 20)
	_investigation_map_close_button.add_theme_stylebox_override("normal", _create_investigation_map_button_style(Color(0.18, 0.14, 0.1, 0.98), Color(0.6, 0.46, 0.32, 0.78)))
	_investigation_map_close_button.add_theme_stylebox_override("hover", _create_investigation_map_button_style(Color(0.24, 0.17, 0.12, 0.98), INVESTIGATION_MAP_PIN_COLOR))
	_investigation_map_close_button.add_theme_stylebox_override("pressed", _create_investigation_map_button_style(Color(0.12, 0.09, 0.07, 0.98), INVESTIGATION_MAP_PIN_COLOR.darkened(0.12)))
	_investigation_map_close_button.pressed.connect(_on_investigation_map_close_pressed)
	header.add_child(_investigation_map_close_button)

	_investigation_map_board = InvestigationMapBoard.new()
	_investigation_map_board.name = "Board"
	_investigation_map_board.mouse_filter = Control.MOUSE_FILTER_STOP
	_investigation_map_board.clip_contents = true
	_investigation_map_board.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_investigation_map_board.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_investigation_map_board.custom_minimum_size = Vector2(760.0, INVESTIGATION_MAP_BOARD_MIN_HEIGHT)
	_investigation_map_board.resized.connect(_position_investigation_map_pins)
	layout.add_child(_investigation_map_board)


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
	_dialogue_panel = dialogue_panel

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
	_dialogue_text.install_effect(DialogueAlphaEffect.new())
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
	_advance_hint_label.add_theme_font_size_override("font_size", _mobile_scaled_int(27, 40))
	_advance_hint_label.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	_advance_hint_bar.add_child(_advance_hint_label)

	_debug_mode_label = Label.new()
	_debug_mode_label.name = "DebugModeLabel"
	_debug_mode_label.visible = false
	_debug_mode_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_debug_mode_label.text = DEBUG_MODE_LABEL_TEXT
	_debug_mode_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_debug_mode_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_debug_mode_label.add_theme_font_size_override("font_size", DEBUG_MODE_LABEL_FONT_SIZE)
	_debug_mode_label.add_theme_color_override("font_color", Color(0.72, 0.95, 0.86, 0.84))
	_debug_mode_label.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.8))
	_debug_mode_label.add_theme_constant_override("shadow_offset_x", 0)
	_debug_mode_label.add_theme_constant_override("shadow_offset_y", 1)
	add_child(_debug_mode_label)


func _set_dialogue_overlay_visible(visible: bool) -> void:
	_dialogue_window_suppressed = not visible
	if _dialogue_overlay != null:
		_dialogue_overlay.visible = visible
	if _dialogue_panel != null:
		_dialogue_panel.visible = visible
	if _dialogue_border_frame != null:
		_dialogue_border_frame.visible = visible
	if _dialogue_content_margin != null:
		_dialogue_content_margin.visible = visible
	if _dialogue_text_layout != null:
		_dialogue_text_layout.visible = visible
	if _dialogue_text != null:
		_dialogue_text.visible = visible
		if not visible:
			_dialogue_text.text = ""
			_dialogue_text.visible_characters = -1
			_dialogue_text.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if not visible:
		if _speaker_label != null:
			_speaker_label.visible = false
		if _statement_connection_hint != null:
			_statement_connection_hint.visible = false
		if _advance_hint_bar != null:
			_advance_hint_bar.visible = false
			_stop_advance_hint_pulse()


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
	_skip_indicator_label.add_theme_font_size_override("font_size", _mobile_scaled_int(27, 40))
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


func _build_auto_indicator() -> void:
	_auto_indicator = Control.new()
	_auto_indicator.name = "AutoModeIndicator"
	_auto_indicator.visible = false
	_auto_indicator.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_auto_indicator.clip_contents = false
	add_child(_auto_indicator)

	_auto_indicator_label = Label.new()
	_auto_indicator_label.name = "AutoLabel"
	_auto_indicator_label.text = AUTO_INDICATOR_TEXT
	_auto_indicator_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_auto_indicator_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_auto_indicator_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_auto_indicator_label.add_theme_font_size_override("font_size", _mobile_scaled_int(27, 40))
	_auto_indicator_label.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	_apply_top_menu_text_outline(_auto_indicator_label)
	_auto_indicator.add_child(_auto_indicator_label)

	_auto_indicator_icon = TextureRect.new()
	_auto_indicator_icon.name = "AutoIcon"
	_auto_indicator_icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_auto_indicator_icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_auto_indicator_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_auto_indicator.add_child(_auto_indicator_icon)

	_apply_auto_indicator_content_layout()


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


func _create_statement_arrow_style(background: Color) -> StyleBox:
	return GeneratedUiTheme.asset_button_style(
		"chapter_button",
		background,
		DIALOGUE_BORDER_COLOR,
		int(DIALOGUE_BORDER_WIDTH),
		int(DIALOGUE_CORNER_RADIUS),
		Vector4(0.0, 0.0, 0.0, 0.0)
	)


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


func _handle_statement_notebook_pointer_scroll(event: InputEvent) -> bool:
	if not _statement_note_open:
		return false

	if event is InputEventMouseButton:
		var mouse_event := event as InputEventMouseButton
		if mouse_event.button_index != MOUSE_BUTTON_LEFT:
			return false
		if mouse_event.pressed:
			var scroll := _get_statement_notebook_scroll_at_position(mouse_event.position)
			if scroll == null:
				return false
			_statement_notebook_pointer_scroll = scroll
			_statement_notebook_pointer_scroll_start_position = mouse_event.position
			_statement_notebook_pointer_scroll_start_vertical = scroll.scroll_vertical
			_statement_notebook_pointer_scroll_dragging = false
			_stop_statement_notebook_scroll_tweens()
			return false

		if _statement_notebook_pointer_scroll == null:
			return false
		var was_dragging := _statement_notebook_pointer_scroll_dragging
		_reset_statement_notebook_pointer_scroll()
		return was_dragging

	if event is InputEventMouseMotion:
		var motion_event := event as InputEventMouseMotion
		var scroll := _statement_notebook_pointer_scroll
		if scroll == null or not is_instance_valid(scroll):
			return false
		if (motion_event.button_mask & MOUSE_BUTTON_MASK_LEFT) == 0:
			_reset_statement_notebook_pointer_scroll()
			return false

		var delta := motion_event.position - _statement_notebook_pointer_scroll_start_position
		if not _statement_notebook_pointer_scroll_dragging and delta.length() < POINTER_SCROLL_DEADZONE:
			return false

		_statement_notebook_pointer_scroll_dragging = true
		scroll.scroll_vertical = int(roundf(clampf(
			float(_statement_notebook_pointer_scroll_start_vertical) - delta.y,
			0.0,
			_get_scroll_vertical_max(scroll)
		)))
		return true

	return false


func _get_statement_notebook_scroll_at_position(position: Vector2) -> ScrollContainer:
	for raw_scroll in [_statement_notebook_character_scroll, _statement_notebook_item_scroll]:
		var scroll := raw_scroll as ScrollContainer
		if scroll != null \
			and is_instance_valid(scroll) \
			and scroll.is_visible_in_tree() \
			and scroll.get_global_rect().has_point(position):
			return scroll
	return null


func _reset_statement_notebook_pointer_scroll() -> void:
	_statement_notebook_pointer_scroll = null
	_statement_notebook_pointer_scroll_start_position = Vector2.ZERO
	_statement_notebook_pointer_scroll_start_vertical = 0
	_statement_notebook_pointer_scroll_dragging = false


func _get_scroll_vertical_max(scroll: ScrollContainer) -> float:
	if scroll == null or not is_instance_valid(scroll):
		return 0.0
	var scroll_bar := scroll.get_v_scroll_bar()
	if scroll_bar == null:
		return 0.0
	return maxf(0.0, scroll_bar.max_value - scroll_bar.page)


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


func _create_statement_notebook_panel_style() -> StyleBox:
	return GeneratedUiTheme.asset_panel_style(
		"overlay_panel",
		STATEMENT_NOTE_PANEL_COLOR,
		STATEMENT_NOTE_BORDER_COLOR,
		int(DIALOGUE_BORDER_WIDTH),
		int(DIALOGUE_CORNER_RADIUS),
		15
	)


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


func _create_statement_notebook_ghost_style(background: Color, border: Color) -> StyleBox:
	if border.a <= 0.0 and background.a <= 0.0:
		return GeneratedUiTheme.ghost_style(4)
	return GeneratedUiTheme.asset_button_style("options_button", background, border, 1 if border.a > 0.0 else 0, 4, Vector4(0.0, 0.0, 0.0, 0.0))


func _create_investigation_map_panel_style() -> StyleBox:
	return GeneratedUiTheme.asset_panel_style(
		"overlay_panel",
		Color(0.085, 0.07, 0.055, 0.97),
		Color(0.64, 0.48, 0.32, 0.82),
		3,
		10,
		16
	)


func _create_investigation_map_button_style(background: Color, border: Color) -> StyleBox:
	return GeneratedUiTheme.asset_button_style("options_button", background, border, 2, 7, Vector4(12, 6, 12, 6))


func _create_investigation_map_pin_style(background: Color, border: Color) -> StyleBox:
	return GeneratedUiTheme.asset_button_style(
		"choice_pressed",
		background,
		border,
		3,
		int(INVESTIGATION_MAP_PIN_SIZE.x * 0.5),
		Vector4(0.0, 0.0, 0.0, 0.0)
	)


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
	_sync_investigation_map_layout()
	_apply_dialogue_overlay_layout()
	_apply_statement_navigation_layout()
	_apply_statement_notebook_layout()
	_apply_fixed_overlay_layout(_statement_loop_prompt_overlay)
	_apply_viewport_overlay_layout(_statement_title_overlay)
	_apply_viewport_overlay_layout(_menu_overlay)
	_apply_viewport_overlay_layout(_chain_blackout_overlay)
	_apply_viewport_overlay_layout(_node_blackout_overlay)
	_layout_menu_overlay_panel(true)
	_apply_skip_indicator_layout()
	_apply_auto_indicator_layout()
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
	_apply_auto_indicator_layout()
	_sync_speaker_label_layout()
	_apply_statement_connection_hint_layout()
	_apply_debug_mode_label_layout()
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
	var icon_height := _scaled_int(SKIP_INDICATOR_ICON_HEIGHT, scale)
	var icon_texture := _get_mui_icon(SKIP_INDICATOR_ICON, icon_height, MUTED_TEXT_COLOR)
	var icon_size := Vector2(icon_height, icon_height)
	if icon_texture != null:
		icon_size = Vector2(icon_texture.get_width(), icon_texture.get_height())
	_skip_indicator_label.add_theme_font_size_override("font_size", _mobile_scaled_int(27, 40))
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


func _apply_auto_indicator_layout() -> void:
	if _auto_indicator == null:
		return

	_apply_auto_indicator_content_layout()
	var panel_layout := _get_dialogue_panel_layout()
	var viewport_size := _get_layout_viewport_size()
	var statement_side_reserve := _get_statement_dialogue_side_reserve(panel_layout)
	var panel_right := viewport_size.x + float(panel_layout.get("offset_right", 0.0)) - statement_side_reserve
	var horizontal_spacing_scale := _get_dialogue_horizontal_spacing_scale()
	var bottom_spacing_scale := _get_dialogue_bottom_spacing_scale()
	var right_margin := float(_scaled_int(DIALOGUE_CONTENT_MARGIN_RIGHT, horizontal_spacing_scale))
	var content_bottom_margin := float(_scaled_int(DIALOGUE_CONTENT_MARGIN_BOTTOM, bottom_spacing_scale))
	var outer_bottom_margin := float(panel_layout.get("bottom_margin", 0.0))
	_auto_indicator.position = Vector2(
		roundf(panel_right - right_margin - _auto_indicator.size.x + AUTO_INDICATOR_POSITION_OFFSET_X * horizontal_spacing_scale),
		roundf(viewport_size.y - outer_bottom_margin - content_bottom_margin - _auto_indicator.size.y + AUTO_INDICATOR_POSITION_OFFSET_Y * bottom_spacing_scale)
	)


func _apply_auto_indicator_content_layout() -> void:
	if _auto_indicator == null or _auto_indicator_label == null or _auto_indicator_icon == null:
		return

	var scale := _get_dialogue_horizontal_spacing_scale()
	var label_width := roundf(AUTO_INDICATOR_LABEL_WIDTH * scale)
	var label_offset_x := roundf(AUTO_INDICATOR_LABEL_OFFSET_X * scale)
	var label_offset_y := roundf(AUTO_INDICATOR_LABEL_OFFSET_Y * scale)
	var icon_gap := roundf(
		lerpf(AUTO_INDICATOR_ICON_GAP, AUTO_INDICATOR_ICON_GAP_MOBILE, _get_mobile_ui_factor()) * scale
	)
	var icon_height := _scaled_int(AUTO_INDICATOR_ICON_HEIGHT, scale)
	var icon_texture := _get_mui_icon(AUTO_INDICATOR_ICON, icon_height, MUTED_TEXT_COLOR)
	var icon_size := Vector2(icon_height, icon_height)
	if icon_texture != null:
		icon_size = Vector2(icon_texture.get_width(), icon_texture.get_height())

	_auto_indicator_label.add_theme_font_size_override("font_size", _mobile_scaled_int(27, 40))
	var indicator_size := Vector2(
		label_offset_x + label_width + icon_gap + icon_size.x,
		maxf(_auto_indicator_label.get_combined_minimum_size().y, icon_size.y)
	)
	_auto_indicator.size = indicator_size
	_auto_indicator_label.position = Vector2(label_offset_x, label_offset_y)
	_auto_indicator_label.size = Vector2(label_width, maxf(indicator_size.y - label_offset_y, 0.0))
	_auto_indicator_icon.texture = icon_texture
	_auto_indicator_icon.size = icon_size
	_auto_indicator_icon.position = Vector2(
		label_offset_x + label_width + icon_gap,
		roundf((indicator_size.y - icon_size.y) * 0.5)
	)


func _get_statement_dialogue_side_reserve(panel_layout: Dictionary) -> float:
	if not _uses_statement_dialogue_window():
		return 0.0

	var panel_width := float(panel_layout.get("width", _get_layout_viewport_size().x))
	var max_side_reserve := maxf(0.0, (panel_width - STATEMENT_DIALOGUE_MIN_CENTER_WIDTH) * 0.5)
	return minf(_get_statement_arrow_button_base_size().x + STATEMENT_ARROW_SIDE_GAP, max_side_reserve)


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
	var base_button_size := _get_statement_arrow_button_base_size()
	var button_width := minf(base_button_size.x, statement_side_reserve)
	var button_size := Vector2(button_width, panel_height)
	_statement_prev_button.custom_minimum_size = Vector2(button_width, base_button_size.y)
	_statement_next_button.custom_minimum_size = Vector2(button_width, base_button_size.y)
	var arrow_font_size := _mobile_scaled_int(STATEMENT_POINTER_NAV_FONT_SIZE, 76)
	_statement_prev_button.add_theme_font_size_override("font_size", arrow_font_size)
	_statement_next_button.add_theme_font_size_override("font_size", arrow_font_size)
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


func _get_statement_arrow_button_base_size() -> Vector2:
	return Vector2(
		_mobile_scaled_float(STATEMENT_ARROW_BUTTON_SIZE.x, 112.0),
		_mobile_scaled_float(STATEMENT_ARROW_BUTTON_SIZE.y, 156.0)
	)


func _apply_statement_notebook_layout() -> void:
	if _statement_notebook_overlay == null:
		return

	_apply_viewport_overlay_layout(_statement_notebook_overlay)
	_apply_statement_notebook_metrics()
	var panel := _statement_notebook_overlay.get_node_or_null("NotebookPanel") as Control
	if panel == null:
		return

	var viewport_size := _statement_notebook_overlay.size
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		viewport_size = get_viewport().get_visible_rect().size
	var safe_rect := _get_statement_notebook_safe_rect(viewport_size)
	var panel_width := minf(_get_statement_notebook_panel_width(), safe_rect.size.x)
	var panel_height := maxf(1.0, safe_rect.size.y)
	panel.size = Vector2(panel_width, panel_height)
	panel.position = _get_statement_notebook_panel_final_position(panel.size)
	if _statement_notebook_columns != null:
		var previous_columns := _statement_notebook_columns.columns
		_statement_notebook_columns.columns = 1 if panel_width < _get_statement_notebook_single_column_width() else 2
		if previous_columns != _statement_notebook_columns.columns and not _statement_notebook_focus_entries.is_empty():
			_configure_statement_notebook_focus_navigation()
	_queue_statement_notebook_rail_sync()
	_queue_statement_notebook_scroll_padding_update()
	if _statement_note_open:
		_set_floating_ui_visible(true)


func _apply_statement_notebook_metrics() -> void:
	if _statement_notebook_overlay == null:
		return
	_refresh_statement_notebook_header_text()

	var panel := _statement_notebook_overlay.get_node_or_null("NotebookPanel") as PanelContainer
	if panel != null:
		panel.custom_minimum_size = Vector2(_mobile_scaled_float(STATEMENT_NOTE_PANEL_MIN_WIDTH, 760.0), 0.0)
		panel.add_theme_stylebox_override("panel", _create_statement_notebook_panel_style())

	var margin := _statement_notebook_overlay.get_node_or_null("NotebookPanel/Margin") as MarginContainer
	if margin != null:
		margin.add_theme_constant_override("margin_left", _mobile_scaled_int(STATEMENT_NOTE_PANEL_CONTENT_MARGIN_LEFT, 14))
		margin.add_theme_constant_override("margin_top", _mobile_scaled_int(10, 14))
		margin.add_theme_constant_override("margin_right", _mobile_scaled_int(28, 36))
		margin.add_theme_constant_override("margin_bottom", _mobile_scaled_int(18, 24))

	var body := _statement_notebook_overlay.get_node_or_null("NotebookPanel/Margin/NotebookBody") as HBoxContainer
	if body != null:
		body.add_theme_constant_override("separation", _mobile_scaled_int(STATEMENT_NOTE_RAIL_GAP, 22))

	if _statement_notebook_rail != null and is_instance_valid(_statement_notebook_rail):
		_statement_notebook_rail.custom_minimum_size = Vector2(_mobile_scaled_float(STATEMENT_NOTE_RAIL_WIDTH, 42.0), 0.0)

	var layout := _statement_notebook_overlay.get_node_or_null("NotebookPanel/Margin/NotebookBody/NotebookLayout") as VBoxContainer
	if layout != null:
		layout.add_theme_constant_override("separation", _mobile_scaled_int(14, 18))

	var header := _statement_notebook_overlay.get_node_or_null("NotebookPanel/Margin/NotebookBody/NotebookLayout/Header") as HBoxContainer
	if header != null:
		header.add_theme_constant_override("separation", _mobile_scaled_int(16, 20))

	var title_row := _statement_notebook_overlay.get_node_or_null("NotebookPanel/Margin/NotebookBody/NotebookLayout/Header/TitleRow") as HBoxContainer
	if title_row != null:
		title_row.add_theme_constant_override("separation", _mobile_scaled_int(12, 14))

	var title := _statement_notebook_overlay.get_node_or_null("NotebookPanel/Margin/NotebookBody/NotebookLayout/Header/TitleRow/Title") as Label
	if title != null:
		title.add_theme_font_size_override("font_size", _mobile_scaled_int(38, 48))

	var caption_offset := _statement_notebook_overlay.get_node_or_null("NotebookPanel/Margin/NotebookBody/NotebookLayout/Header/TitleRow/CaptionOffset") as MarginContainer
	if caption_offset != null:
		caption_offset.add_theme_constant_override("margin_bottom", _mobile_scaled_int(STATEMENT_NOTE_CAPTION_LIFT, 10))

	var caption := _statement_notebook_overlay.get_node_or_null("NotebookPanel/Margin/NotebookBody/NotebookLayout/Header/TitleRow/CaptionOffset/Caption") as Label
	if caption != null:
		caption.add_theme_font_size_override("font_size", _mobile_scaled_int(13, 16))

	if _statement_notebook_input_hint != null:
		_statement_notebook_input_hint.custom_minimum_size.y = _mobile_scaled_float(STATEMENT_CONNECTION_HINT_MIN_HEIGHT, 62.0)
		_statement_notebook_input_hint.add_theme_constant_override("separation", _mobile_scaled_int(STATEMENT_CONNECTION_HINT_SEPARATION, 12))
		if _statement_notebook_input_hint.visible:
			_rebuild_statement_notebook_input_hint(true)

	if _statement_notebook_close_button != null:
		var close_icon_size := _mobile_scaled_int(26, 38)
		_statement_notebook_close_button.icon = _get_mui_icon("CloseRounded", close_icon_size, STATEMENT_NOTE_TEXT_COLOR)
		_statement_notebook_close_button.custom_minimum_size = Vector2(
			_mobile_scaled_float(40.0, 64.0),
			_mobile_scaled_float(40.0, 64.0)
		)
		_statement_notebook_close_button.add_theme_constant_override("icon_max_width", close_icon_size)

	if _statement_notebook_columns != null:
		_statement_notebook_columns.add_theme_constant_override("h_separation", _mobile_scaled_int(24, 34))
		_statement_notebook_columns.add_theme_constant_override("v_separation", _mobile_scaled_int(16, 24))

	_apply_statement_notebook_column_metrics(_statement_notebook_character_list)
	_apply_statement_notebook_column_metrics(_statement_notebook_item_list)
	_apply_statement_notebook_entry_metrics(_statement_notebook_character_list)
	_apply_statement_notebook_entry_metrics(_statement_notebook_item_list)


func _refresh_statement_notebook_header_text() -> void:
	if _statement_notebook_overlay == null:
		return
	var title := _statement_notebook_overlay.get_node_or_null("NotebookPanel/Margin/NotebookBody/NotebookLayout/Header/TitleRow/Title") as Label
	if title != null:
		title.text = _get_statement_notebook_title_text()
	var caption := _statement_notebook_overlay.get_node_or_null("NotebookPanel/Margin/NotebookBody/NotebookLayout/Header/TitleRow/CaptionOffset/Caption") as Label
	if caption != null:
		caption.text = _get_statement_notebook_caption_text()


func _get_statement_notebook_title_text() -> String:
	match _statement_notebook_mode:
		NOTEBOOK_MODE_PRESENT:
			return "자료 제시"
		NOTEBOOK_MODE_VIEW:
			return "사건수첩"
	return "수사노트"


func _get_statement_notebook_caption_text() -> String:
	match _statement_notebook_mode:
		NOTEBOOK_MODE_PRESENT:
			return "PRESENT EVIDENCE"
		NOTEBOOK_MODE_VIEW:
			return "CASE NOTEBOOK"
	return "CASE NOTEBOOK"


func _apply_statement_notebook_column_metrics(list: VBoxContainer) -> void:
	if list == null:
		return

	var column := list.get_parent()
	if column is MarginContainer:
		column = column.get_parent()
	if column is ScrollContainer:
		column = column.get_parent()
	var root := column as VBoxContainer
	if root == null:
		return

	root.add_theme_constant_override("separation", _mobile_scaled_int(12, 16))
	var header := root.get_node_or_null("Header") as HBoxContainer
	if header != null:
		header.add_theme_constant_override("separation", _mobile_scaled_int(10, 12))
	var title := root.get_node_or_null("Header/Title") as Label
	if title != null:
		title.add_theme_font_size_override("font_size", _mobile_scaled_int(24, 34))
	var count := root.get_node_or_null("Header/Count") as Label
	if count != null:
		count.add_theme_font_size_override("font_size", _mobile_scaled_int(18, 25))

	var scroll := root.get_node_or_null("Scroll") as ScrollContainer
	if scroll != null:
		scroll.add_theme_constant_override("scrollbar_spacing", _mobile_scaled_int(STATEMENT_NOTE_SCROLLBAR_SPACING, 10))
	list.add_theme_constant_override("separation", _mobile_scaled_int(10, 18))


func _apply_statement_notebook_entry_metrics(list: VBoxContainer) -> void:
	if list == null:
		return

	var card_height := _mobile_scaled_float(STATEMENT_NOTE_CARD_MIN_HEIGHT, 156.0)
	var thumb_size := _mobile_scaled_float(STATEMENT_NOTE_CARD_THUMB_SIZE, 108.0)
	for child in list.get_children():
		if child is Button:
			var button := child as Button
			button.custom_minimum_size = Vector2(0.0, card_height)
			var content := button.get_node_or_null("Content") as MarginContainer
			if content != null:
				content.add_theme_constant_override("margin_left", _mobile_scaled_int(14, 22))
				content.add_theme_constant_override("margin_top", _mobile_scaled_int(10, 16))
				content.add_theme_constant_override("margin_right", _mobile_scaled_int(12, 18))
				content.add_theme_constant_override("margin_bottom", _mobile_scaled_int(10, 16))
			var row := button.get_node_or_null("Content/Row") as HBoxContainer
			if row != null:
				row.add_theme_constant_override("separation", _mobile_scaled_int(14, 22))
			var thumb := button.get_node_or_null("Content/Row/Thumb") as PanelContainer
			if thumb != null:
				thumb.custom_minimum_size = Vector2(thumb_size, thumb_size)
			var icon := button.get_node_or_null("Content/Row/Thumb/Icon") as TextureRect
			if icon != null:
				icon.custom_minimum_size = Vector2(thumb_size, thumb_size)
			var name_label := button.get_node_or_null("Content/Row/Text/Name") as Label
			if name_label != null:
				name_label.add_theme_font_size_override("font_size", _mobile_scaled_int(22, 36))
			var subtitle_label := button.get_node_or_null("Content/Row/Text/Subtitle") as Label
			if subtitle_label != null:
				subtitle_label.add_theme_font_size_override("font_size", _mobile_scaled_int(15, 26))
			var tag := button.get_node_or_null("Content/Row/Tag") as PanelContainer
			if tag != null:
				tag.custom_minimum_size = Vector2(
					_mobile_scaled_float(62.0, 94.0),
					_mobile_scaled_float(28.0, 44.0)
				)
			var tag_margin := button.get_node_or_null("Content/Row/Tag/MarginContainer") as MarginContainer
			if tag_margin == null:
				tag_margin = button.get_node_or_null("Content/Row/Tag/Margin") as MarginContainer
			if tag_margin != null:
				tag_margin.add_theme_constant_override("margin_left", _mobile_scaled_int(8, 10))
				tag_margin.add_theme_constant_override("margin_right", _mobile_scaled_int(8, 10))
				tag_margin.add_theme_constant_override("margin_top", _mobile_scaled_int(3, 4))
				tag_margin.add_theme_constant_override("margin_bottom", _mobile_scaled_int(3, 4))
			var tag_label := button.get_node_or_null("Content/Row/Tag/MarginContainer/TagLabel") as Label
			if tag_label == null:
				tag_label = button.get_node_or_null("Content/Row/Tag/Margin/TagLabel") as Label
			if tag_label != null:
				tag_label.add_theme_font_size_override("font_size", _mobile_scaled_int(14, 20))
		elif child is Label:
			var label := child as Label
			label.custom_minimum_size = Vector2(0.0, card_height)
			label.add_theme_font_size_override("font_size", _mobile_scaled_int(18, 27))


func _get_statement_notebook_panel_width() -> float:
	return _mobile_scaled_float(STATEMENT_NOTE_PANEL_WIDTH, 4096.0)


func _get_statement_notebook_single_column_width() -> float:
	return _mobile_scaled_float(STATEMENT_NOTE_SINGLE_COLUMN_WIDTH, 940.0)


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
	var mobile_factor := _get_mobile_ui_factor()
	var top := minf(
		lerpf(_get_statement_notebook_top_limit(), _get_statement_notebook_mobile_top_limit(), mobile_factor),
		maxf(0.0, dialogue_top_limit - 1.0)
	)
	var right := _get_statement_notebook_next_button_right_edge(viewport_size, panel_layout)
	var center_offset := lerpf(
		viewport_size.x * 0.5 + _get_statement_dialogue_side_reserve(panel_layout) * STATEMENT_NOTE_CENTER_OFFSET_SCALE,
		viewport_size.x * STATEMENT_NOTE_MOBILE_LEFT_WIDTH_RATIO + _get_statement_dialogue_side_reserve(panel_layout) * 0.25,
		mobile_factor
	)
	var desktop_left := clampf(center_offset, 0.0, maxf(0.0, right - 1.0))
	var mobile_left := clampf(float(panel_layout.get("offset_left", 0.0)), 0.0, maxf(0.0, right - 1.0))
	var left := lerpf(desktop_left, mobile_left, mobile_factor)
	return Rect2(Vector2(left, top), Vector2(right - left, maxf(1.0, dialogue_top_limit - top)))


func _get_statement_notebook_top_limit() -> float:
	return maxf(STATEMENT_NOTE_PANEL_MARGIN.y, _get_statement_notebook_menu_bottom() + LAYOUT_SEPARATION)


func _get_statement_notebook_mobile_top_limit() -> float:
	return _mobile_scaled_float(18.0, 24.0)


func _get_statement_notebook_menu_bottom() -> float:
	var menu_height := _get_top_menu_text_min_size().y
	if _top_menu_bar != null:
		var minimum_size := _top_menu_bar.get_combined_minimum_size()
		menu_height = maxf(menu_height, maxf(_top_menu_bar.size.y, minimum_size.y))
	return _get_floating_menu_margin().y + menu_height


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
	var mobile_factor := clampf(float(panel_layout.get("mobile_factor", tall_factor)), 0.0, 1.0)
	_dialogue_mobile_factor = mobile_factor
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
	left_spacing_scale = maxf(left_spacing_scale, lerpf(1.0, 1.16, mobile_factor))
	top_spacing_scale = maxf(top_spacing_scale, lerpf(1.0, 1.14, mobile_factor))
	bottom_spacing_scale = maxf(bottom_spacing_scale, lerpf(1.0, 1.22, mobile_factor))
	text_spacing_scale = maxf(text_spacing_scale, lerpf(1.0, 1.28, mobile_factor))

	if _dialogue_content_margin != null:
		_dialogue_content_margin.add_theme_constant_override("margin_left", _scaled_int(DIALOGUE_CONTENT_MARGIN_LEFT, left_spacing_scale))
		_dialogue_content_margin.add_theme_constant_override("margin_top", _scaled_int(DIALOGUE_CONTENT_MARGIN_TOP, top_spacing_scale))
		_dialogue_content_margin.add_theme_constant_override("margin_right", _scaled_int(DIALOGUE_CONTENT_MARGIN_RIGHT, horizontal_spacing_scale))
		_dialogue_content_margin.add_theme_constant_override(
			"margin_bottom",
			int(roundf(lerpf(
				float(DIALOGUE_CONTENT_MARGIN_BOTTOM),
				float(DIALOGUE_CONTENT_MARGIN_BOTTOM_MOBILE),
				_dialogue_mobile_factor
			)))
		)

	if _dialogue_text_layout != null:
		_dialogue_text_layout.add_theme_constant_override("separation", _scaled_int(12, text_spacing_scale))

	if _advance_hint_bar != null:
		_advance_hint_bar.add_theme_constant_override("separation", _mobile_scaled_int(9, 12))

	if _speaker_label != null:
		_speaker_label.add_theme_font_size_override("font_size", DialogueTypography.speaker_font_size_for_layout(panel_layout))
		_speaker_label.add_theme_constant_override("outline_size", DialogueTypography.speaker_outline_size_for_layout(panel_layout))

	if _dialogue_text != null:
		var body_font_size := DialogueTypography.body_font_size_for_layout(panel_layout)
		_dialogue_text.add_theme_font_size_override("normal_font_size", body_font_size)
		_dialogue_text.add_theme_font_size_override("bold_font_size", body_font_size)
		_dialogue_text.add_theme_constant_override("line_separation", DialogueTypography.body_line_spacing_for_layout(panel_layout))

	if _advance_hint_label != null:
		_advance_hint_label.add_theme_font_size_override("font_size", _mobile_scaled_int(27, 40))

	if _advance_hint_icon != null:
		var icon_size := float(_get_advance_hint_icon_height())
		_advance_hint_icon.custom_minimum_size = Vector2(icon_size, icon_size)

	if _statement_connection_hint != null:
		_apply_statement_connection_hint_metrics()


func _get_dialogue_horizontal_spacing_scale() -> float:
	return maxf(
		lerpf(1.0, 1.16, _dialogue_tall_factor),
		lerpf(1.0, 1.18, _dialogue_mobile_factor)
	)


func _get_dialogue_bottom_spacing_scale() -> float:
	return maxf(
		lerpf(1.0, 1.45, _dialogue_tall_factor),
		lerpf(1.0, 1.75, _dialogue_mobile_factor)
	)


func _scaled_int(base_value: int, scale: float) -> int:
	return int(roundf(float(base_value) * scale))


func _mobile_scaled_float(base_value: float, target_value: float) -> float:
	return lerpf(base_value, target_value, _get_mobile_ui_factor())


func _mobile_scaled_int(base_value: int, target_value: int) -> int:
	return int(roundf(_mobile_scaled_float(float(base_value), float(target_value))))


func _get_mobile_ui_factor() -> float:
	return clampf(MobileLayout.mobile_factor(_get_layout_viewport_size()), 0.0, 1.0)


func _should_hide_floating_ui_for_statement_notebook() -> bool:
	return _statement_note_open and _get_mobile_ui_factor() > 0.01


func _get_speaker_label_top() -> float:
	return lerpf(SPEAKER_LABEL_TOP, SPEAKER_LABEL_TOP_UNFOLDED, _dialogue_tall_factor)


func _apply_statement_connection_hint_layout() -> void:
	if _statement_connection_hint == null:
		return

	var hint_size := _statement_connection_hint.get_combined_minimum_size()
	hint_size.x = maxf(hint_size.x, 1.0)
	hint_size.y = maxf(hint_size.y, _get_statement_connection_hint_min_height())
	var hint_margin := _get_statement_connection_hint_margin()
	_statement_connection_hint.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	_statement_connection_hint.offset_left = -hint_size.x - hint_margin.x
	_statement_connection_hint.offset_top = -hint_size.y - hint_margin.y
	_statement_connection_hint.offset_right = -hint_margin.x
	_statement_connection_hint.offset_bottom = -hint_margin.y


func _apply_statement_connection_hint_metrics() -> void:
	if _statement_connection_hint == null:
		return

	_statement_connection_hint.custom_minimum_size.y = _get_statement_connection_hint_min_height()
	_statement_connection_hint.add_theme_constant_override("separation", _get_statement_connection_hint_separation())
	_apply_statement_connection_hint_font_size(_get_statement_connection_hint_font_size())
	for child in _statement_connection_hint.get_children():
		if child is TextureRect:
			_apply_statement_connection_hint_icon_metrics(child as TextureRect)
		elif child is MarginContainer:
			_apply_statement_connection_hint_keycap_metrics(child as MarginContainer)


func _apply_statement_connection_hint_font_size(font_size: int) -> void:
	if _statement_connection_hint == null:
		return

	for child in _statement_connection_hint.get_children():
		if child is Label:
			(child as Label).add_theme_font_size_override("font_size", font_size)


func _apply_debug_mode_label_layout() -> void:
	if _debug_mode_label == null:
		return

	var label_size := _debug_mode_label.get_combined_minimum_size()
	label_size.x = maxf(label_size.x, 1.0)
	label_size.y = maxf(label_size.y, 1.0)

	var panel_layout := _get_dialogue_panel_layout()
	var viewport_size := _get_layout_viewport_size()
	var outer_bottom_margin := float(panel_layout.get("bottom_margin", 0.0))
	var region_top := viewport_size.y - outer_bottom_margin
	var region_bottom := viewport_size.y
	var y := region_top + maxf(0.0, (region_bottom - region_top - label_size.y) * 0.5)

	var overlay_left := 0.0
	var overlay_width := viewport_size.x
	if _dialogue_overlay != null and _dialogue_overlay.size.x > 0.0:
		overlay_left = _dialogue_overlay.position.x
		overlay_width = _dialogue_overlay.size.x
	else:
		var statement_side_reserve := _get_statement_dialogue_side_reserve(panel_layout)
		overlay_left = float(panel_layout.get("offset_left", 0.0)) + statement_side_reserve
		overlay_width = viewport_size.x + float(panel_layout.get("offset_right", 0.0)) - statement_side_reserve - overlay_left

	_debug_mode_label.position = Vector2(
		roundf(overlay_left + maxf(0.0, (overlay_width - label_size.x) * 0.5)),
		roundf(y)
	)
	_debug_mode_label.size = label_size


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
		var camera_zoom := _get_node_camera_zoom_percent(_current_node)
		var fallback_zoom := float(camera_zoom if camera_zoom > 0 else PortraitLayout.ZOOM_DEFAULT)
		return {
			"enabled": false,
			"cast_count": 0,
			"focus_face_position": baseline_position,
			"focus_zoom_percent": fallback_zoom,
			"grid_zoom_percent": fallback_zoom,
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

	for speaker_id in _get_stage_camera_focus_target_ids():
		var cast_id := String(speaker_id)
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
		"active": true,
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
	var role_weight := STAGE_PARALLAX_ACTIVE_WEIGHT

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

	for speaker_id in _get_stage_camera_focus_target_ids():
		var cast_id := String(speaker_id)

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


func sync_story_grid_background_immediate() -> void:
	if not is_node_ready():
		call_deferred("sync_story_grid_background_immediate")
		return
	_sync_grid_background(true)


func _sync_grid_background(force_immediate := false) -> void:
	var grid := _get_story_grid_background()
	var viewport_size := get_viewport().get_visible_rect().size
	var metrics := _get_stage_parallax_metrics()
	var immediate := force_immediate or _grid_background_needs_initial_snap
	if grid != null and grid.visible:
		grid.sync_stage(
			viewport_size,
			float(metrics.get("grid_zoom_percent", PortraitLayout.ZOOM_MIN)),
			_to_viewport_position(Vector2(metrics.get("focus_face_position", Vector2.ZERO))),
			float(metrics.get("focus_zoom_percent", PortraitLayout.ZOOM_MIN)),
			bool(metrics.get("enabled", false)),
			_to_viewport_position(Vector2(metrics.get("baseline_face_position", Vector2.ZERO))),
			float(metrics.get("spread_ratio", 0.0)),
			int(metrics.get("cast_count", 0)),
			_to_viewport_position(Vector2(metrics.get("zoom_pivot_position", viewport_size * 0.5))),
			immediate
		)

	_sync_background_image_parallax(metrics, immediate)
	if immediate:
		_grid_background_needs_initial_snap = false


func _process_background_image_parallax(delta: float) -> bool:
	if _background_image_rect == null or _background_image_fixed:
		return false

	var distance_sq := _background_parallax_offset.distance_squared_to(_background_parallax_target_offset)
	if distance_sq <= BACKGROUND_IMAGE_PARALLAX_TARGET_EPSILON_SQ:
		_background_parallax_offset = _background_parallax_target_offset
		_apply_background_image_parallax_layout(_background_parallax_offset)
		return false

	var weight := 1.0 - exp(-BACKGROUND_IMAGE_PARALLAX_SMOOTH_RATE * delta)
	_background_parallax_offset = _background_parallax_offset.lerp(_background_parallax_target_offset, weight)
	_apply_background_image_parallax_layout(_background_parallax_offset)
	return true


func _sync_background_image_parallax(metrics: Dictionary = {}, immediate := false) -> void:
	if _background_image_rect == null:
		return

	var target_offset := Vector2.ZERO
	if not _background_image_fixed:
		var resolved_metrics := metrics
		if resolved_metrics.is_empty():
			resolved_metrics = _get_stage_parallax_metrics()
		target_offset = _compute_background_image_parallax_offset(resolved_metrics)

	if immediate or _background_image_fixed:
		_background_parallax_target_offset = target_offset
		_background_parallax_offset = target_offset
		_apply_background_image_parallax_layout(_background_parallax_offset)
		return

	if target_offset.distance_squared_to(_background_parallax_target_offset) > BACKGROUND_IMAGE_PARALLAX_TARGET_EPSILON_SQ:
		_background_parallax_target_offset = target_offset
		set_process(true)
	_apply_background_image_parallax_layout(_background_parallax_offset)


func _compute_background_image_parallax_offset(metrics: Dictionary) -> Vector2:
	var viewport_size := _get_background_layer_size()
	if viewport_size.x <= 1.0 or viewport_size.y <= 1.0:
		return Vector2.ZERO

	var grid := _get_story_grid_background()
	if grid == null:
		return Vector2.ZERO

	return grid.compute_stage_parallax_target_offset(
		viewport_size,
		Vector2(metrics.get("focus_face_position", viewport_size * 0.5)),
		float(metrics.get("focus_zoom_percent", PortraitLayout.ZOOM_MIN)),
		bool(metrics.get("enabled", false)),
		Vector2(metrics.get("baseline_face_position", viewport_size * 0.5)),
		float(metrics.get("spread_ratio", 0.0)),
		int(metrics.get("cast_count", 0))
	)


func _apply_background_image_parallax_layout(offset: Vector2 = Vector2.ZERO) -> void:
	if _background_image_rect == null:
		return

	var viewport_size := _get_background_layer_size()
	if viewport_size.x <= 1.0 or viewport_size.y <= 1.0:
		return

	var overscan := 0.0 if _background_image_fixed else _get_background_image_parallax_overscan(viewport_size)
	var bleed := Vector2(overscan, overscan)
	for child in _background_layer.get_children():
		if child is TextureRect and String(child.name).begins_with("BackgroundImage"):
			_apply_background_image_rect_parallax_layout(child as TextureRect, viewport_size, bleed, offset)


func _apply_background_image_rect_parallax_layout(rect: TextureRect, viewport_size: Vector2, bleed: Vector2, offset: Vector2) -> void:
	if rect == null:
		return

	rect.set_anchors_preset(Control.PRESET_TOP_LEFT)
	var texture_size := _get_background_texture_size(rect)
	var cover_size := _get_background_image_cover_size(viewport_size + bleed * 2.0, texture_size)
	var image_size := cover_size * clampf(_background_image_zoom, 1.0, 6.0)
	var focus := Vector2(
		clampf(_background_image_focus.x, 0.0, 1.0),
		clampf(_background_image_focus.y, 0.0, 1.0)
	)
	rect.position = viewport_size * 0.5 - Vector2(image_size.x * focus.x, image_size.y * focus.y) - offset
	rect.size = image_size


func _get_background_texture_size(rect: TextureRect) -> Vector2:
	if rect != null and rect.texture != null:
		var size := rect.texture.get_size()
		if size.x > 0.0 and size.y > 0.0:
			return size
	return Vector2(16.0, 9.0)


func _get_background_image_cover_size(target_size: Vector2, texture_size: Vector2) -> Vector2:
	if target_size.x <= 0.0 or target_size.y <= 0.0:
		return Vector2.ZERO
	if texture_size.x <= 0.0 or texture_size.y <= 0.0:
		return target_size
	var cover_scale := maxf(target_size.x / texture_size.x, target_size.y / texture_size.y)
	return texture_size * cover_scale


func _get_background_layer_size() -> Vector2:
	if _background_layer != null and _background_layer.size.x > 1.0 and _background_layer.size.y > 1.0:
		return _background_layer.size
	return _get_layout_viewport_size()


func _get_background_image_parallax_overscan(viewport_size: Vector2) -> float:
	var horizontal_ratio := 0.055
	var vertical_ratio := 0.04
	var grid := _get_story_grid_background()
	if grid != null:
		horizontal_ratio = grid.max_horizontal_offset_ratio
		vertical_ratio = grid.max_vertical_offset_ratio

	var max_offset := maxf(viewport_size.x * horizontal_ratio, viewport_size.y * vertical_ratio)
	var max_overscan := maxf(BACKGROUND_IMAGE_PARALLAX_MIN_OVERSCAN, minf(viewport_size.x, viewport_size.y) * BACKGROUND_IMAGE_PARALLAX_MAX_OVERSCAN_RATIO)
	return clampf(max_offset + BACKGROUND_IMAGE_PARALLAX_OVERSCAN_PADDING, BACKGROUND_IMAGE_PARALLAX_MIN_OVERSCAN, max_overscan)


func _create_choice_button_styles() -> void:
	_choice_button_style_normal = _create_choice_button_style(DIALOGUE_PANEL_COLOR, DIALOGUE_BORDER_COLOR, 1.0, "choice_normal")
	var hover_bg := DIALOGUE_PANEL_COLOR.lerp(DEFAULT_SPEAKER_COLOR, 0.08)
	var hover_border := DIALOGUE_BORDER_COLOR.lerp(DEFAULT_SPEAKER_COLOR, 0.35)
	_choice_button_style_hover = _create_choice_button_style(hover_bg, hover_border, 1.0, "choice_hover")
	var focus_bg := DIALOGUE_PANEL_COLOR.lerp(DEFAULT_SPEAKER_COLOR, 0.12)
	var focus_border := DIALOGUE_BORDER_COLOR.lerp(DEFAULT_SPEAKER_COLOR, 0.58)
	_choice_button_style_focus = _create_choice_button_style(focus_bg, focus_border, 1.0, "choice_focus")
	var pressed_bg := DIALOGUE_PANEL_COLOR.darkened(0.04)
	_choice_button_style_pressed = _create_choice_button_style(pressed_bg, DIALOGUE_BORDER_COLOR, 1.0, "choice_pressed")
	_refresh_statement_loop_prompt_button_styles()


func _get_choice_button_visual_scale(visual_scale: float) -> float:
	return clampf(visual_scale, CHOICE_DIALOGUE_WIDTH_MIN_SCALE, 1.0)


func _get_choice_button_content_margin_x(visual_scale: float) -> float:
	return maxf(8.0, float(CHOICE_BUTTON_CONTENT_MARGIN_X) * _get_choice_button_visual_scale(visual_scale))


func _get_choice_button_content_margin_y(visual_scale: float) -> float:
	return maxf(4.0, float(CHOICE_BUTTON_CONTENT_MARGIN_Y) * _get_choice_button_visual_scale(visual_scale))


func _create_choice_button_style(bg_color: Color, border_color: Color, visual_scale := 1.0, asset_key := "choice_normal") -> StyleBox:
	var resolved_scale := _get_choice_button_visual_scale(visual_scale)
	return GeneratedUiTheme.asset_button_style(
		asset_key,
		bg_color,
		border_color,
		maxi(1, int(roundf(float(CHOICE_BUTTON_BORDER_WIDTH) * resolved_scale))),
		maxi(4, int(roundf(float(CHOICE_BUTTON_CORNER_RADIUS) * resolved_scale))),
		Vector4(
			_get_choice_button_content_margin_x(visual_scale),
			_get_choice_button_content_margin_y(visual_scale),
			_get_choice_button_content_margin_x(visual_scale),
			_get_choice_button_content_margin_y(visual_scale)
		)
	)


func _create_choice_button_background_style(bg_color: Color, visual_scale := 1.0) -> StyleBoxFlat:
	var resolved_scale := _get_choice_button_visual_scale(visual_scale)
	var style := GeneratedUiTheme.button_style(
		bg_color,
		Color.TRANSPARENT,
		0,
		maxi(4, int(roundf(float(CHOICE_BUTTON_CORNER_RADIUS) * resolved_scale))),
		Vector4(
			_get_choice_button_content_margin_x(visual_scale),
			_get_choice_button_content_margin_y(visual_scale),
			_get_choice_button_content_margin_x(visual_scale),
			_get_choice_button_content_margin_y(visual_scale)
		)
	)
	style.shadow_size = 0
	style.draw_center = true
	return style


func _build_choice_button_content(button: Button) -> void:
	if (
		button.get_node_or_null("ChoiceContent") != null
		and button.get_node_or_null("ChoiceLabel") != null
		and button.get_node_or_null("ChoiceHeardCheck") != null
	):
		return

	button.text = ""
	button.clip_contents = false

	var margin := MarginContainer.new()
	margin.name = "ChoiceContent"
	margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	margin.clip_contents = false
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	button.add_child(margin)

	var text_label := RichTextLabel.new()
	text_label.name = "Text"
	text_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	text_label.clip_contents = false
	text_label.fit_content = false
	text_label.scroll_active = false
	text_label.bbcode_enabled = false
	text_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	text_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	text_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	text_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	text_label.size_flags_vertical = Control.SIZE_EXPAND_FILL
	text_label.add_theme_font_override("normal_font", DialogueTypography.body_font())
	text_label.add_theme_font_override("bold_font", DialogueTypography.build_font(DialogueTypography.BODY_FONT_PATH, 800))
	text_label.add_theme_font_size_override("normal_font_size", CHOICE_FONT_SIZE)
	text_label.add_theme_font_size_override("bold_font_size", CHOICE_FONT_SIZE)
	text_label.add_theme_constant_override("line_separation", 0)
	text_label.add_theme_color_override("default_color", BODY_TEXT_COLOR)
	text_label.install_effect(DialogueAlphaEffect.new())
	text_label.install_effect(DialogueBlinkEffect.new())
	text_label.install_effect(DialogueGrowEffect.new())
	margin.add_child(text_label)

	var border := DialogueBorderFrame.new()
	border.name = "ChoiceBorderFrame"
	border.mouse_filter = Control.MOUSE_FILTER_IGNORE
	border.clip_contents = false
	border.set_anchors_preset(Control.PRESET_FULL_RECT)
	border.z_index = 1
	button.add_child(border)

	var label := RichTextLabel.new()
	label.name = "ChoiceLabel"
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	label.visible = false
	label.clip_contents = false
	label.fit_content = false
	label.scroll_active = false
	label.bbcode_enabled = false
	label.autowrap_mode = TextServer.AUTOWRAP_OFF
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	label.z_index = 2
	label.add_theme_font_override("normal_font", DialogueTypography.build_font(DialogueTypography.BODY_FONT_PATH, CHOICE_LABEL_FONT_WEIGHT))
	label.add_theme_font_override("bold_font", DialogueTypography.build_font(DialogueTypography.BODY_FONT_PATH, 800))
	label.add_theme_font_size_override("normal_font_size", CHOICE_LABEL_FONT_SIZE)
	label.add_theme_font_size_override("bold_font_size", CHOICE_LABEL_FONT_SIZE)
	label.add_theme_constant_override("line_separation", 0)
	label.add_theme_constant_override("outline_size", CHOICE_LABEL_OUTLINE_SIZE)
	label.add_theme_color_override("default_color", BODY_TEXT_COLOR)
	label.add_theme_color_override("font_outline_color", SPEAKER_LABEL_OUTLINE_COLOR)
	label.install_effect(DialogueAlphaEffect.new())
	label.install_effect(DialogueBlinkEffect.new())
	label.install_effect(DialogueGrowEffect.new())
	button.add_child(label)

	var heard_check := Label.new()
	heard_check.name = "ChoiceHeardCheck"
	heard_check.mouse_filter = Control.MOUSE_FILTER_IGNORE
	heard_check.visible = false
	heard_check.text = "✓"
	heard_check.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	heard_check.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	heard_check.z_index = 3
	heard_check.add_theme_font_override("font", DialogueTypography.build_font(DialogueTypography.BODY_FONT_PATH, 800))
	heard_check.add_theme_font_size_override("font_size", CHOICE_HEARD_CHECK_FONT_SIZE)
	heard_check.add_theme_constant_override("outline_size", CHOICE_LABEL_OUTLINE_SIZE)
	heard_check.add_theme_color_override("font_color", DEFAULT_SPEAKER_COLOR)
	heard_check.add_theme_color_override("font_outline_color", SPEAKER_LABEL_OUTLINE_COLOR)
	button.add_child(heard_check)
	button.mouse_entered.connect(_on_choice_button_mouse_entered.bind(button))
	button.mouse_exited.connect(_on_choice_button_mouse_exited.bind(button))
	button.focus_entered.connect(_on_choice_button_focus_changed.bind(button))
	button.focus_exited.connect(_on_choice_button_focus_changed.bind(button))
	button.button_down.connect(_on_choice_button_down.bind(button))
	button.button_up.connect(_on_choice_button_up.bind(button))


func _get_choice_button_label(button: Button) -> RichTextLabel:
	return button.get_node_or_null("ChoiceLabel") as RichTextLabel


func _get_choice_button_text_label(button: Button) -> RichTextLabel:
	return button.get_node_or_null("ChoiceContent/Text") as RichTextLabel


func _get_choice_button_heard_check(button: Button) -> Label:
	return button.get_node_or_null("ChoiceHeardCheck") as Label


func _get_choice_button_border_frame(button: Button) -> DialogueBorderFrame:
	return button.get_node_or_null("ChoiceBorderFrame") as DialogueBorderFrame


func _get_choice_heard_check_reserved_width(button: Button, visual_scale := -1.0) -> float:
	if button == null or not bool(button.get_meta("choice_heard_check_visible", false)):
		return 0.0
	if visual_scale <= 0.0:
		visual_scale = float(button.get_meta("choice_visual_scale", 1.0))
	var resolved_scale := _get_choice_button_visual_scale(visual_scale)
	return (CHOICE_HEARD_CHECK_LEFT + CHOICE_HEARD_CHECK_SIZE + CHOICE_HEARD_CHECK_GAP) * resolved_scale


func _apply_choice_button_content_layout(button: Button, visual_scale := 1.0) -> void:
	var margin := button.get_node_or_null("ChoiceContent") as MarginContainer
	if margin == null:
		return
	button.set_meta("choice_visual_scale", visual_scale)
	var margin_x := int(roundf(_get_choice_button_content_margin_x(visual_scale)))
	var margin_y := int(roundf(_get_choice_button_content_margin_y(visual_scale)))
	var heard_check_space := int(roundf(_get_choice_heard_check_reserved_width(button, visual_scale)))
	var margin_left := margin_x + heard_check_space
	margin.add_theme_constant_override("margin_left", margin_left)
	margin.add_theme_constant_override("margin_right", margin_x)
	margin.add_theme_constant_override("margin_top", margin_y)
	margin.add_theme_constant_override("margin_bottom", margin_y)
	_sync_choice_button_text_label_layout(button, float(margin_left), float(margin_y), float(margin_x))
	_sync_choice_button_heard_check_layout(button, visual_scale)
	_sync_choice_button_label_layout(button, visual_scale)
	_sync_choice_button_border_layout(button, visual_scale)


func _sync_choice_button_text_label_layout(
	button: Button,
	margin_left: float,
	margin_y: float,
	margin_right := -1.0
) -> void:
	var text_label := _get_choice_button_text_label(button)
	if text_label == null:
		return
	if margin_right < 0.0:
		margin_right = margin_left
	var content_size := Vector2(
		maxf(1.0, button.size.x - margin_left - margin_right),
		maxf(1.0, button.size.y - margin_y * 2.0)
	)
	text_label.custom_minimum_size = content_size
	text_label.size = content_size


func _sync_choice_button_heard_check_layout(button: Button, visual_scale := -1.0) -> void:
	var heard_check := _get_choice_button_heard_check(button)
	if heard_check == null:
		return
	if visual_scale <= 0.0:
		visual_scale = float(button.get_meta("choice_visual_scale", 1.0))
	var resolved_scale := _get_choice_button_visual_scale(visual_scale)
	var mark_size := maxf(16.0, CHOICE_HEARD_CHECK_SIZE * resolved_scale)
	var left := maxf(8.0, CHOICE_HEARD_CHECK_LEFT * resolved_scale)
	heard_check.position = Vector2(
		roundf(left),
		roundf(maxf(0.0, (button.size.y - mark_size) * 0.5))
	)
	heard_check.size = Vector2(roundf(mark_size), roundf(mark_size))


func _sync_choice_button_label_layout(button: Button, visual_scale := -1.0) -> void:
	var label := _get_choice_button_label(button)
	if label == null:
		return
	if visual_scale <= 0.0:
		visual_scale = float(button.get_meta("choice_visual_scale", 1.0))
	var resolved_scale := _get_choice_button_visual_scale(visual_scale)
	var right_margin := maxf(10.0, CHOICE_LABEL_RIGHT * resolved_scale)
	var label_width := maxf(1.0, button.size.x - right_margin * 2.0)
	var label_font_size := label.get_theme_font_size(&"normal_font_size")
	if label_font_size <= 0:
		label_font_size = CHOICE_LABEL_FONT_SIZE
	var label_height := maxf(float(label_font_size) + 8.0 * resolved_scale, label.get_minimum_size().y)
	label.position = Vector2(roundf(right_margin), roundf(CHOICE_LABEL_TOP * resolved_scale))
	label.custom_minimum_size = Vector2(0.0, roundf(label_height))
	label.size = Vector2(roundf(label_width), roundf(label_height))
	_sync_choice_button_border_notch(button, visual_scale)


func _sync_choice_button_border_layout(button: Button, visual_scale := -1.0) -> void:
	var border := _get_choice_button_border_frame(button)
	if border == null:
		return
	if visual_scale <= 0.0:
		visual_scale = float(button.get_meta("choice_visual_scale", 1.0))
	var resolved_scale := _get_choice_button_visual_scale(visual_scale)
	border.set_anchors_preset(Control.PRESET_FULL_RECT)
	border.offset_left = 0.0
	border.offset_top = 0.0
	border.offset_right = 0.0
	border.offset_bottom = 0.0
	border.configure(
		_get_choice_button_border_state_color(button),
		maxf(1.0, float(CHOICE_BUTTON_BORDER_WIDTH) * resolved_scale),
		maxf(4.0, float(CHOICE_BUTTON_CORNER_RADIUS) * resolved_scale)
	)
	_sync_choice_button_border_notch(button, visual_scale)


func _sync_choice_button_border_notch(button: Button, visual_scale := -1.0) -> void:
	var border := _get_choice_button_border_frame(button)
	var label := _get_choice_button_label(button)
	if border == null:
		return
	if label == null or not label.visible:
		border.set_notch(0.0, 0.0, false)
		return
	if visual_scale <= 0.0:
		visual_scale = float(button.get_meta("choice_visual_scale", 1.0))
	var resolved_scale := _get_choice_button_visual_scale(visual_scale)
	var content_width := maxf(label.get_content_width(), label.get_minimum_size().x)
	content_width = minf(content_width, label.size.x)
	var notch_padding := CHOICE_LABEL_NOTCH_PADDING * resolved_scale
	var label_right := label.position.x + label.size.x
	var notch_left := label_right - content_width - notch_padding
	var notch_width := content_width + notch_padding * 2.0
	border.set_notch(notch_left, notch_width, true)


func _set_choice_button_border_colors(
	button: Button,
	normal: Color,
	hover: Color,
	focus: Color,
	pressed: Color,
	disabled: Color
) -> void:
	button.set_meta("choice_border_colors", {
		"normal": normal,
		"hover": hover,
		"focus": focus,
		"pressed": pressed,
		"disabled": disabled,
	})
	_refresh_choice_button_border_state(button)


func _get_choice_button_border_state_color(button: Button) -> Color:
	var colors: Dictionary = button.get_meta("choice_border_colors", {})
	if button.disabled:
		return colors.get("disabled", DIALOGUE_BORDER_COLOR)
	if bool(button.get_meta("choice_button_down", false)):
		return colors.get("pressed", DIALOGUE_BORDER_COLOR)
	if button.has_focus():
		return colors.get("focus", DIALOGUE_BORDER_COLOR)
	if bool(button.get_meta("choice_hovered", false)):
		return colors.get("hover", DIALOGUE_BORDER_COLOR)
	return colors.get("normal", DIALOGUE_BORDER_COLOR)


func _refresh_choice_button_border_state(button: Button) -> void:
	_sync_choice_button_border_layout(button)


func _on_choice_button_mouse_entered(button: Button) -> void:
	button.set_meta("choice_hovered", true)
	_refresh_choice_button_border_state(button)


func _on_choice_button_mouse_exited(button: Button) -> void:
	button.set_meta("choice_hovered", false)
	_refresh_choice_button_border_state(button)


func _on_choice_button_focus_changed(button: Button) -> void:
	_refresh_choice_button_border_state(button)


func _on_choice_button_down(button: Button) -> void:
	button.set_meta("choice_button_down", true)
	_refresh_choice_button_border_state(button)


func _on_choice_button_up(button: Button) -> void:
	button.set_meta("choice_button_down", false)
	_refresh_choice_button_border_state(button)


func _apply_choice_button_content_colors(button: Button) -> void:
	var label := _get_choice_button_label(button)
	if label != null:
		label.add_theme_color_override("default_color", BODY_TEXT_COLOR)
		label.add_theme_color_override("font_outline_color", SPEAKER_LABEL_OUTLINE_COLOR)
	var text_label := _get_choice_button_text_label(button)
	if text_label != null:
		text_label.add_theme_color_override("default_color", BODY_TEXT_COLOR)
	var heard_check := _get_choice_button_heard_check(button)
	if heard_check != null:
		var check_color: Color = button.get_meta("choice_heard_check_color", _get_current_choice_heard_check_color())
		heard_check.add_theme_color_override("font_color", check_color)
		heard_check.add_theme_color_override("font_outline_color", SPEAKER_LABEL_OUTLINE_COLOR)


func _set_choice_button_content(button: Button, choice_data: Dictionary, fallback_text: String) -> void:
	_build_choice_button_content(button)
	var label_text := String(choice_data.get("label", "")).strip_edges()
	var show_heard_check := _should_show_choice_heard_check(choice_data) and _is_choice_topic_heard(choice_data)
	button.set_meta("choice_label_text", label_text)
	button.set_meta("choice_body_text", String(choice_data.get("text", fallback_text)))
	button.set_meta("choice_heard_check_visible", show_heard_check)
	button.set_meta("choice_heard_check_color", _get_current_choice_heard_check_color())
	_refresh_choice_button_content_text(button)


func _refresh_choice_button_content_text(button: Button) -> void:
	var heard_check := _get_choice_button_heard_check(button)
	if heard_check != null:
		heard_check.visible = bool(button.get_meta("choice_heard_check_visible", false))
		heard_check.text = "✓"
		_sync_choice_button_heard_check_layout(button)

	var label := _get_choice_button_label(button)
	if label != null:
		var label_text := String(button.get_meta("choice_label_text", "")).strip_edges()
		label.visible = not label_text.is_empty()
		if label.visible:
			var display_label := _resolve_dialogue_character_color_tags(label_text)
			if _line_uses_dialogue_bbcode(display_label):
				display_label = _dialogue_typewriter.prepare_static_bbcode_line(display_label, label)
				label.bbcode_enabled = true
				label.bbcode_text = display_label
			else:
				label.bbcode_enabled = false
				label.text = display_label
		else:
			label.bbcode_enabled = false
			label.text = ""
		_sync_choice_button_label_layout(button)

	var text_label := _get_choice_button_text_label(button)
	if text_label == null:
		return

	var raw_text := String(button.get_meta("choice_body_text", ""))
	var display_text := _resolve_dialogue_character_color_tags(raw_text)
	if _line_uses_dialogue_bbcode(display_text):
		display_text = _dialogue_typewriter.prepare_static_bbcode_line(display_text, text_label)
		text_label.bbcode_enabled = true
		text_label.bbcode_text = display_text
	else:
		text_label.bbcode_enabled = false
		text_label.text = display_text
	_apply_choice_button_content_colors(button)
	_apply_choice_button_content_layout(button, float(button.get_meta("choice_visual_scale", 1.0)))


func _apply_choice_button_theme(button: Button, visual_scale := 1.0) -> void:
	var use_cached_styles := is_equal_approx(_get_choice_button_visual_scale(visual_scale), 1.0)
	var has_custom_border := _get_choice_button_border_frame(button) != null
	var normal_bg := DIALOGUE_PANEL_COLOR
	var hover_bg := DIALOGUE_PANEL_COLOR.lerp(DEFAULT_SPEAKER_COLOR, 0.08)
	var hover_border := DIALOGUE_BORDER_COLOR.lerp(DEFAULT_SPEAKER_COLOR, 0.45)
	var focus_bg := DIALOGUE_PANEL_COLOR.lerp(DEFAULT_SPEAKER_COLOR, 0.12)
	var focus_border := DIALOGUE_BORDER_COLOR.lerp(DEFAULT_SPEAKER_COLOR, 0.58)
	var pressed_bg := DIALOGUE_PANEL_COLOR.darkened(0.04)
	button.flat = false
	button.focus_mode = Control.FOCUS_ALL
	if has_custom_border:
		button.add_theme_stylebox_override("normal", _create_choice_button_background_style(normal_bg, visual_scale))
		button.add_theme_stylebox_override("hover", _create_choice_button_background_style(hover_bg, visual_scale))
		button.add_theme_stylebox_override("pressed", _create_choice_button_background_style(pressed_bg, visual_scale))
		button.add_theme_stylebox_override("focus", _create_choice_button_background_style(focus_bg, visual_scale))
		button.add_theme_stylebox_override("disabled", _create_choice_button_background_style(normal_bg, visual_scale))
		_set_choice_button_border_colors(
			button,
			DIALOGUE_BORDER_COLOR,
			hover_border,
			focus_border,
			DIALOGUE_BORDER_COLOR,
			DIALOGUE_BORDER_COLOR
		)
	elif use_cached_styles:
		button.add_theme_stylebox_override("normal", _choice_button_style_normal)
		button.add_theme_stylebox_override("hover", _choice_button_style_hover)
		button.add_theme_stylebox_override("pressed", _choice_button_style_pressed)
		button.add_theme_stylebox_override("focus", _choice_button_style_focus)
		button.add_theme_stylebox_override("disabled", _choice_button_style_normal)
	else:
		button.add_theme_stylebox_override("normal", _create_choice_button_style(DIALOGUE_PANEL_COLOR, DIALOGUE_BORDER_COLOR, visual_scale, "choice_normal"))
		button.add_theme_stylebox_override("hover", _create_choice_button_style(hover_bg, hover_border, visual_scale, "choice_hover"))
		button.add_theme_stylebox_override("pressed", _create_choice_button_style(pressed_bg, DIALOGUE_BORDER_COLOR, visual_scale, "choice_pressed"))
		button.add_theme_stylebox_override("focus", _create_choice_button_style(focus_bg, focus_border, visual_scale, "choice_focus"))
		button.add_theme_stylebox_override("disabled", _create_choice_button_style(DIALOGUE_PANEL_COLOR, DIALOGUE_BORDER_COLOR, visual_scale, "choice_disabled"))
	button.alignment = HORIZONTAL_ALIGNMENT_CENTER
	button.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	button.add_theme_font_size_override("font_size", CHOICE_FONT_SIZE)
	button.add_theme_color_override("font_color", BODY_TEXT_COLOR)
	button.add_theme_color_override("font_hover_color", DEFAULT_SPEAKER_COLOR)
	button.add_theme_color_override("font_focus_color", DEFAULT_SPEAKER_COLOR)
	button.add_theme_color_override("font_pressed_color", DEFAULT_SPEAKER_COLOR)
	_apply_choice_button_content_layout(button, visual_scale)
	_apply_choice_button_content_colors(button)


func _apply_choice_button_scale(button: Button, speaker_scale: float) -> void:
	var resolved_scale := speaker_scale
	if resolved_scale <= 0.0:
		resolved_scale = _get_choice_speaker_scale()
	var mobile_factor := _get_mobile_ui_factor()
	var font_scale := resolved_scale * lerpf(1.0, 1.16, mobile_factor)
	var text_size := maxi(CHOICE_FONT_MIN_SIZE, int(roundf(float(CHOICE_FONT_SIZE) * font_scale)))
	var label_size := maxi(CHOICE_LABEL_FONT_MIN_SIZE, int(roundf(float(CHOICE_LABEL_FONT_SIZE) * font_scale)))
	button.add_theme_font_size_override("font_size", text_size)
	var label := _get_choice_button_label(button)
	if label != null:
		label.add_theme_font_size_override("normal_font_size", label_size)
		label.add_theme_font_size_override("bold_font_size", label_size)
		label.add_theme_constant_override("outline_size", CHOICE_LABEL_OUTLINE_SIZE)
		_sync_choice_button_label_layout(button)
	var text_label := _get_choice_button_text_label(button)
	if text_label != null:
		text_label.add_theme_font_size_override("normal_font_size", text_size)
		text_label.add_theme_font_size_override("bold_font_size", text_size)
		_refresh_choice_button_content_text(button)
	var heard_check := _get_choice_button_heard_check(button)
	if heard_check != null:
		var check_size := maxi(
			CHOICE_HEARD_CHECK_FONT_MIN_SIZE,
			int(roundf(float(CHOICE_HEARD_CHECK_FONT_SIZE) * font_scale))
		)
		heard_check.add_theme_font_size_override("font_size", check_size)
		_sync_choice_button_heard_check_layout(button)


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
	_auto_button = _add_top_menu_button(_top_menu_bar, "AutoButton", "Auto", "auto")
	_add_menu_separator(_top_menu_bar)
	_backlog_button = _add_top_menu_button(_top_menu_bar, "BacklogButton", "Log", "log")
	_add_menu_separator(_top_menu_bar)
	_branch_tree_button = _add_top_menu_button(_top_menu_bar, "BranchTreeButton", "Tree", "tree")
	_add_menu_separator(_top_menu_bar)
	_case_notebook_button = _add_top_menu_button(_top_menu_bar, "CaseNotebookButton", "Case", "case_note")
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
		var menu_margin := _get_floating_menu_margin()
		_top_menu_bar.offset_left = 0.0
		_top_menu_bar.offset_top = menu_margin.y
		_top_menu_bar.offset_right = -menu_margin.x
		_top_menu_bar.offset_bottom = 0.0


func _set_floating_ui_visible(visible: bool, animated: bool = false) -> void:
	if visible and (
		_overlay_obscured
		or _is_menu_overlay_open()
		or _statement_title_playing
		or _statement_title_preparing_reveal
		or _dialogue_chain_transitioning
		or _node_blackout_transitioning
		or _should_hide_floating_ui_for_statement_notebook()
	):
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


func _get_floating_menu_margin() -> Vector2:
	return Vector2(
		_mobile_scaled_float(FLOATING_MENU_MARGIN.x, 26.0),
		_mobile_scaled_float(FLOATING_MENU_MARGIN.y, 16.0)
	)


func _get_top_menu_text_min_size() -> Vector2:
	return Vector2(
		_mobile_scaled_float(TOP_MENU_TEXT_MIN_SIZE.x, 136.0),
		_mobile_scaled_float(TOP_MENU_TEXT_MIN_SIZE.y, 82.0)
	)


func _get_top_menu_text_button_min_size() -> Vector2:
	return Vector2(
		TOP_MENU_TEXT_BUTTON_MIN_SIZE.x,
		_get_top_menu_text_min_size().y
	)


func _get_top_menu_font_size() -> int:
	return _mobile_scaled_int(24, 40)


func _get_top_menu_keycap_font_size() -> int:
	return _mobile_scaled_int(TOP_MENU_KEYCAP_FONT_SIZE, 18)


func _add_top_menu_button(parent: HBoxContainer, node_name: String, text: String, action: String) -> Button:
	var button := Button.new()
	button.name = node_name
	button.text = text
	button.flat = true
	button.alignment = HORIZONTAL_ALIGNMENT_CENTER
	button.focus_mode = Control.FOCUS_NONE
	button.custom_minimum_size = _get_top_menu_text_min_size()
	button.expand_icon = false
	button.icon_alignment = HORIZONTAL_ALIGNMENT_LEFT
	button.add_theme_font_size_override("font_size", _get_top_menu_font_size())
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
	label.add_theme_font_size_override("font_size", _get_top_menu_font_size())
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
	key_label.add_theme_font_size_override("font_size", _get_top_menu_keycap_font_size())
	key_label.add_theme_constant_override("line_spacing", TOP_MENU_KEYCAP_LINE_SPACING)
	key_label.add_theme_color_override("font_color", DEFAULT_SPEAKER_COLOR)
	_apply_top_menu_text_outline(key_label)
	key_margin.add_child(key_label)


func _create_keycap_style() -> StyleBoxFlat:
	var style := GeneratedUiTheme.keycap_style(TOP_MENU_KEYCAP_CORNER_RADIUS, 2)
	style.bg_color = KEYCAP_BACKGROUND_COLOR
	style.border_color = KEYCAP_BORDER_COLOR
	return style


func _create_top_menu_button_stylebox(background_color: Color) -> StyleBox:
	var radius := _mobile_scaled_int(TOP_MENU_GHOST_CORNER_RADIUS, 15)
	var style: StyleBox = GeneratedUiTheme.ghost_style(radius)
	if background_color.a > 0.001:
		style = GeneratedUiTheme.asset_button_style("hud_button_focus", background_color, Color(1, 1, 1, 0.16), 1, radius)
	style.set_content_margin(SIDE_LEFT, _mobile_scaled_int(int(TOP_MENU_BUTTON_CONTENT_MARGIN.x), int(TOP_MENU_BUTTON_CONTENT_MARGIN_MOBILE.x)))
	style.set_content_margin(SIDE_RIGHT, _mobile_scaled_int(int(TOP_MENU_BUTTON_CONTENT_MARGIN.x), int(TOP_MENU_BUTTON_CONTENT_MARGIN_MOBILE.x)))
	style.set_content_margin(SIDE_TOP, _mobile_scaled_int(int(TOP_MENU_BUTTON_CONTENT_MARGIN.y), int(TOP_MENU_BUTTON_CONTENT_MARGIN_MOBILE.y)))
	style.set_content_margin(SIDE_BOTTOM, _mobile_scaled_int(int(TOP_MENU_BUTTON_CONTENT_MARGIN.y), int(TOP_MENU_BUTTON_CONTENT_MARGIN_MOBILE.y)))
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


func _apply_auto_button_visual() -> void:
	if _auto_button == null:
		return

	if _is_auto_mode_active():
		var active_style := _create_top_menu_button_stylebox(SKIP_BUTTON_ACTIVE_COLOR)
		_auto_button.flat = false
		_auto_button.add_theme_stylebox_override("normal", active_style)
		_auto_button.add_theme_stylebox_override("hover", active_style)
		_auto_button.add_theme_stylebox_override("pressed", active_style)
		_auto_button.add_theme_stylebox_override("focus", active_style)
		_apply_menu_button_text_color(_auto_button, DEFAULT_SPEAKER_COLOR, DEFAULT_SPEAKER_COLOR)
	else:
		_apply_top_menu_button_style(_auto_button)
		_apply_menu_button_text_color(_auto_button, BODY_TEXT_COLOR, DEFAULT_SPEAKER_COLOR)


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
	var options_button := _add_menu_overlay_button(menu_layout, "OptionsButton", "Options")
	var chapter_button := _add_menu_overlay_button(menu_layout, "ChapterSelectButton", "Chapter Select")
	var title_button := _add_menu_overlay_button(menu_layout, "TitleButton", "Title")
	_menu_continue_button = continue_button
	continue_button.pressed.connect(_hide_menu_overlay)
	options_button.pressed.connect(func() -> void:
		_hide_menu_overlay(func() -> void:
			request_overlay("options", {"overlay_mode": true})
		)
	)
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
	button.custom_minimum_size = Vector2(0, _get_menu_overlay_button_height())
	button.add_theme_font_size_override("font_size", _mobile_scaled_int(24, 30))
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	parent.add_child(button)
	return button


func _layout_menu_overlay_panel(apply_immediate: bool) -> void:
	if _menu_overlay == null or _menu_panel == null:
		return
	_apply_menu_overlay_metrics()

	var viewport_size := _menu_overlay.size
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		viewport_size = get_viewport().get_visible_rect().size
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		return

	var minimum_size := _menu_panel.get_combined_minimum_size()
	var panel_margin := _get_menu_overlay_margin()
	var panel_width := minf(
		_get_menu_overlay_panel_width(),
		maxf(280.0, viewport_size.x - panel_margin * 2.0)
	)
	var panel_height := minf(
		maxf(1.0, minimum_size.y),
		maxf(1.0, viewport_size.y - panel_margin * 2.0)
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


func _apply_menu_overlay_metrics() -> void:
	if _menu_panel == null:
		return

	_menu_panel.custom_minimum_size = Vector2(_get_menu_overlay_panel_width(), 0)
	var margin := _menu_panel.get_node_or_null("Margin") as MarginContainer
	if margin != null:
		var side_margin := _mobile_scaled_int(33, 42)
		var vertical_margin := _mobile_scaled_int(27, 34)
		margin.add_theme_constant_override("margin_left", side_margin)
		margin.add_theme_constant_override("margin_top", vertical_margin)
		margin.add_theme_constant_override("margin_right", side_margin)
		margin.add_theme_constant_override("margin_bottom", vertical_margin)

	var layout := _menu_panel.get_node_or_null("Margin/MenuLayout") as VBoxContainer
	if layout != null:
		layout.add_theme_constant_override("separation", _mobile_scaled_int(15, 20))

	var title := _menu_panel.get_node_or_null("Margin/MenuLayout/MenuTitle") as Label
	if title != null:
		title.add_theme_font_size_override("font_size", _mobile_scaled_int(36, 44))

	if layout != null:
		for child in layout.get_children():
			if child is Button:
				var button := child as Button
				button.custom_minimum_size = Vector2(0, _get_menu_overlay_button_height())
				button.add_theme_font_size_override("font_size", _mobile_scaled_int(24, 30))


func _get_menu_overlay_panel_width() -> float:
	return _mobile_scaled_float(MENU_PANEL_WIDTH, 620.0)


func _get_menu_overlay_margin() -> float:
	return _mobile_scaled_float(MENU_PANEL_MARGIN, 36.0)


func _get_menu_overlay_button_height() -> float:
	return _mobile_scaled_float(69.0, 128.0)


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
	_stop_auto_mode()
	_cancel_stage_node_hold()
	_cancel_chained_dialogue_blackout_transition()
	_cancel_node_blackout_transition()
	VisualNovelData.reload()
	_apply_editor_preview_dialogue_from_payload(payload)
	_invalidate_statement_notebook_content()
	_dialogue_id = _resolve_dialogue_id(payload)
	var target_node_id := _resolve_target_node_id(payload)
	_restore_acquired_info_from_payload(payload)
	_restore_story_state_from_payload(payload)
	var rewind_backlog_entries := _read_rewind_backlog_entries(payload, _dialogue_id)
	var rewind_media_entries := _read_rewind_media_entries(payload, _dialogue_id)
	if rewind_media_entries.is_empty():
		rewind_media_entries = rewind_backlog_entries
	_dialogue_metadata = {}
	_backlog_entries.clear()
	_nodes_by_id.clear()
	_talk_menu_node_id = ""
	_talk_exit_pending = false
	_talk_choice_animation_token += 1
	_clear_talk_choice_character_shift_state()
	_statement_node_ids.clear()
	_statement_node_index_by_id.clear()
	_statement_current_lies.clear()
	_statement_lie_ranges.clear()
	_statement_node_history.clear()
	_statement_hovered_lie_index = -1
	_statement_active_lie_index = -1
	_statement_notebook_mode = NOTEBOOK_MODE_STATEMENT
	_case_notebook_present_choices.clear()
	_statement_connection_mode_active = false
	_statement_resume_connection_mode_on_note_close = false
	_statement_lie_revealing = false
	_statement_title_playing = false
	_statement_title_preparing_reveal = false
	_statement_title_pending_spectrum = {}
	_statement_reveal_layout_active = false
	_grid_background_needs_initial_snap = true
	_rewind_stage_zoom_state.clear()
	_hide_statement_loop_prompt(false)
	_current_node = {}
	_current_node_id = ""
	_current_node_exit_speaker_ids.clear()
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

	if not _begin_dialogue_session(_dialogue_id, target_node_id, rewind_media_entries):
		_show_empty_dialogue_state(payload)
	_play_rewind_fade_from_payload(payload)


func _apply_editor_preview_dialogue_from_payload(payload: Dictionary) -> void:
	if not bool(payload.get("editor_preview", false)):
		return

	var dialogue_data: Variant = payload.get("dialogue_data", {})
	if typeof(dialogue_data) != TYPE_DICTIONARY:
		return
	VisualNovelData.apply_editor_preview_dialogue(dialogue_data as Dictionary, "editor_preview_payload")


func _begin_dialogue_session(dialogue_id: String, target_node_id := "", rewind_entries: Array = []) -> bool:
	var dialogue: Dictionary = VisualNovelData.get_dialogue(StringName(dialogue_id))
	if dialogue.is_empty():
		return false

	var switching_dialogue := not _dialogue_id.is_empty() and _dialogue_id != dialogue_id
	if switching_dialogue:
		_backlog_entries.clear()

	_dialogue_id = dialogue_id
	VisualNovelData.mark_dialogue_seen(_dialogue_id)
	_dialogue_metadata = _read_dialogue_metadata(dialogue)
	_nodes_by_id = dialogue.get("_nodes_by_id", {})
	_collect_statement_nodes(dialogue)
	_talk_menu_node_id = _get_configured_talk_menu_node_id()
	_talk_exit_pending = false
	_talk_choice_animation_token += 1
	_clear_talk_choice_character_shift_state()
	if _is_statement_presentation():
		_stop_auto_mode()
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

	if not rewind_entries.is_empty() and not _current_node_id.is_empty():
		_restore_rewind_media_state(_current_node_id, rewind_entries)
		_rewind_stage_zoom_state = _infer_rewind_stage_zoom_state(_current_node_id, rewind_entries)

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


func _get_presentation_mode() -> String:
	var mode := String(_dialogue_metadata.get("presentation_mode", "normal")).strip_edges().to_lower()
	if mode in ["statement", "진술"]:
		return "statement"
	if mode in ["investigation", "investigate", "search", "조사", "조사모드"]:
		return "investigation"
	if mode in ["talk", "conversation", "dialogue_topics", "대화", "자율대화"]:
		return "talk"
	return "normal"


func _is_statement_presentation() -> bool:
	return _get_presentation_mode() == "statement"


func _is_talk_presentation() -> bool:
	return _get_presentation_mode() == "talk"


func _is_investigation_presentation() -> bool:
	return _get_presentation_mode() == "investigation"


func _uses_talk_menu_flow() -> bool:
	return _is_talk_presentation() or _is_investigation_presentation()


func _get_configured_talk_menu_node_id() -> String:
	for key in ["talk_menu_node", "talk_menu_node_id", "conversation_menu_node", "topic_menu_node"]:
		var node_id := String(_dialogue_metadata.get(key, "")).strip_edges()
		if not node_id.is_empty() and _nodes_by_id.has(node_id):
			return node_id
	return ""


func _get_dialogue_locations() -> Dictionary:
	var locations: Dictionary = {}
	for location in _get_dialogue_location_list():
		var location_id := _get_location_id(location)
		if location_id.is_empty():
			continue
		locations[location_id] = location
	return locations


func _get_dialogue_location_list() -> Array[Dictionary]:
	var raw_locations: Variant = _dialogue_metadata.get("locations", _dialogue_metadata.get("places", {}))
	var locations: Array[Dictionary] = []
	if typeof(raw_locations) == TYPE_ARRAY:
		for raw_location in raw_locations as Array:
			if typeof(raw_location) != TYPE_DICTIONARY:
				continue
			var location: Dictionary = (raw_location as Dictionary).duplicate(true)
			var location_id := _get_location_id(location)
			if location_id.is_empty():
				continue
			location["id"] = location_id
			locations.append(location)
	elif typeof(raw_locations) == TYPE_DICTIONARY:
		var location_map: Dictionary = raw_locations
		for raw_id in location_map.keys():
			var location_id := String(raw_id).strip_edges()
			if location_id.is_empty():
				continue
			var raw_location: Variant = location_map[raw_id]
			if typeof(raw_location) == TYPE_DICTIONARY:
				var location: Dictionary = (raw_location as Dictionary).duplicate(true)
				location["id"] = String(location.get("id", location_id)).strip_edges()
				locations.append(location)
			else:
				locations.append({
					"id": location_id,
					"node": String(raw_location).strip_edges(),
				})
	return locations


func _get_location_id(location: Dictionary) -> String:
	for key in ["id", "location_id", "place_id", "key"]:
		var value := String(location.get(key, "")).strip_edges()
		if not value.is_empty():
			return value
	return ""


func _get_location_node_id(location: Dictionary) -> String:
	for key in ["node", "node_id", "start_node", "start", "target", "next"]:
		var node_id := String(location.get(key, "")).strip_edges()
		if not node_id.is_empty():
			return node_id
	return ""


func _resolve_location_node_id(location_id: String) -> String:
	var clean_id := location_id.strip_edges()
	if clean_id.is_empty():
		return ""
	var locations := _get_dialogue_locations()
	if locations.has(clean_id):
		var node_id := _get_location_node_id(locations[clean_id])
		if not node_id.is_empty() and _nodes_by_id.has(node_id):
			return node_id
	if _nodes_by_id.has(clean_id):
		return clean_id
	return ""


func _get_location_label(location: Dictionary) -> String:
	for key in ["label", "name", "title"]:
		var label := String(location.get(key, "")).strip_edges()
		if not label.is_empty():
			return label
	return _get_location_id(location)


func _get_current_location_id() -> String:
	for location in _get_dialogue_location_list():
		var location_id := _get_location_id(location)
		var node_id := _get_location_node_id(location)
		if not location_id.is_empty() and node_id == _current_node_id:
			return location_id
	return ""


func _location_conditions_met(location: Dictionary) -> bool:
	return VisualNovelData.story_conditions_met(location.get("conditions", []), {
		"dialogue_id": _dialogue_id,
		"node_id": _current_node_id,
		"location": location,
	})


func _get_available_investigation_locations() -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for raw_location in _get_dialogue_location_list():
		if not _location_conditions_met(raw_location):
			continue
		var location := raw_location.duplicate(true)
		var location_id := _get_location_id(location)
		var node_id := _get_location_node_id(location)
		if location_id.is_empty() or node_id.is_empty() or not _nodes_by_id.has(node_id):
			continue
		location["id"] = location_id
		location["node"] = node_id
		result.append(location)
	return result


func _get_investigation_map_metadata() -> Dictionary:
	var raw_map: Variant = _dialogue_metadata.get("map", _dialogue_metadata.get("investigation_map", _dialogue_metadata.get("movement_map", {})))
	if typeof(raw_map) == TYPE_DICTIONARY:
		return raw_map
	if typeof(raw_map) == TYPE_STRING:
		return {"image": String(raw_map)}
	return {}


func _get_investigation_map_title() -> String:
	var map_data := _get_investigation_map_metadata()
	for key in ["title", "label", "name"]:
		var title := String(map_data.get(key, "")).strip_edges()
		if not title.is_empty():
			return title
	return "이동하기"


func _get_investigation_map_image_path() -> String:
	var map_data := _get_investigation_map_metadata()
	for key in ["image", "path", "background", "map_image"]:
		var path := String(map_data.get(key, "")).strip_edges()
		if not path.is_empty():
			return _normalize_resource_path(path)
	for key in ["map_image", "investigation_map_image", "movement_map_image"]:
		var path := String(_dialogue_metadata.get(key, "")).strip_edges()
		if not path.is_empty():
			return _normalize_resource_path(path)
	return ""


func _load_investigation_map_texture() -> Texture2D:
	return _load_node_cutscene_texture(_get_investigation_map_image_path())


func _get_location_map_position(location: Dictionary, index: int, count: int) -> Vector2:
	for key in ["position", "pin", "map_position", "point", "coords"]:
		if location.has(key):
			var parsed := _read_normalized_map_point(location[key])
			if parsed.x >= 0.0:
				return parsed
	var parsed_from_fields := _read_normalized_map_point(location)
	if parsed_from_fields.x >= 0.0:
		return parsed_from_fields

	var safe_count := maxi(count, 1)
	var angle := -PI * 0.5 + TAU * float(index) / float(safe_count)
	return Vector2(
		clampf(0.5 + cos(angle) * 0.32, 0.12, 0.88),
		clampf(0.5 + sin(angle) * 0.26, 0.16, 0.84)
	)


func _read_normalized_map_point(raw_point: Variant) -> Vector2:
	if typeof(raw_point) == TYPE_ARRAY:
		var point_array: Array = raw_point
		if point_array.size() >= 2:
			return Vector2(clampf(float(point_array[0]), 0.0, 1.0), clampf(float(point_array[1]), 0.0, 1.0))
	if typeof(raw_point) == TYPE_DICTIONARY:
		var point_data: Dictionary = raw_point
		var has_x := point_data.has("x") or point_data.has("left")
		var has_y := point_data.has("y") or point_data.has("top")
		if has_x and has_y:
			return Vector2(
				clampf(float(point_data.get("x", point_data.get("left", 0.5))), 0.0, 1.0),
				clampf(float(point_data.get("y", point_data.get("top", 0.5))), 0.0, 1.0)
			)
	return Vector2(-1.0, -1.0)


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


func _get_chained_next_dialogue_blackout() -> bool:
	return _read_metadata_bool(_dialogue_metadata, "next_dialogue_blackout")


func _get_chained_next_dialogue_blackout_fade_duration() -> float:
	return maxf(
		_read_metadata_float(
			_dialogue_metadata,
			CHAIN_BLACKOUT_FADE_DURATION_METADATA_KEY,
			CHAIN_BLACKOUT_FADE_IN_DURATION
		),
		0.0
	)


func _get_chained_next_dialogue_blackout_hold_duration() -> float:
	return maxf(
		_read_metadata_float(
			_dialogue_metadata,
			CHAIN_BLACKOUT_HOLD_DURATION_METADATA_KEY,
			CHAIN_BLACKOUT_HOLD_DURATION
		),
		0.0
	)


func _read_metadata_bool(metadata: Dictionary, key: String, default_value := false) -> bool:
	return _read_variant_bool(metadata.get(key, default_value), default_value)


func _read_variant_bool(value: Variant, default_value := false) -> bool:
	match typeof(value):
		TYPE_BOOL:
			return bool(value)
		TYPE_INT, TYPE_FLOAT:
			return not is_zero_approx(float(value))
		TYPE_STRING:
			var normalized := String(value).strip_edges().to_lower()
			if normalized in ["1", "true", "yes", "y", "on"]:
				return true
			if normalized in ["0", "false", "no", "n", "off", ""]:
				return false
	return default_value


func _read_metadata_float(metadata: Dictionary, key: String, default_value := 0.0) -> float:
	var value: Variant = metadata.get(key, default_value)
	return _read_variant_float(value, default_value)


func _read_variant_float(value: Variant, default_value := 0.0) -> float:
	match typeof(value):
		TYPE_INT, TYPE_FLOAT:
			return float(value)
		TYPE_STRING:
			var normalized := String(value).strip_edges()
			if _is_numeric_text(normalized):
				return float(normalized)
	return default_value


func _is_blackout_node(node: Dictionary) -> bool:
	if node.is_empty():
		return false
	var mode := String(node.get("mode", node.get("type", "dialogue"))).strip_edges().to_lower()
	if mode in [NODE_MODE_CUTSCENE, "blackout", "dark", "fade_black", "fade-to-black", "암전", "컷씬"]:
		return true
	return _read_variant_bool(node.get("blackout_enabled", node.get("is_blackout", false)), false)


func _is_stage_node(node: Dictionary) -> bool:
	if node.is_empty():
		return false
	var mode := String(node.get("mode", node.get("type", "dialogue"))).strip_edges().to_lower()
	if mode in [NODE_MODE_STAGE, "stage_cast", "stagecast", "character_motion", "character_movement", "motion", "move", "무대", "캐릭터 이동", "캐릭터이동"]:
		return true

	var has_stage_cast := node.has("stage_cast") and typeof(node.get("stage_cast", {})) == TYPE_DICTIONARY
	var speaker := String(node.get("speaker", "")).strip_edges()
	var text := String(node.get("text", "")).strip_edges()
	var choices_data: Variant = node.get("choices", [])
	var has_choices := typeof(choices_data) == TYPE_ARRAY and not (choices_data as Array).is_empty()
	return has_stage_cast and speaker.is_empty() and text.is_empty() and not has_choices


func _advance_from_non_dialogue_node(node_id: String) -> void:
	if node_id != _current_node_id:
		return

	_complete_current_node_progression()
	var next_id := String(_current_node.get("next", "")).strip_edges()
	if next_id.is_empty():
		if not _try_advance_to_chained_dialogue():
			request_screen_change("chapter_select")
		return

	if not _nodes_by_id.has(next_id):
		request_screen_change("chapter_select")
		return

	_transition_to_node(next_id)


func _get_node_blackout_duration(
	node: Dictionary,
	blackout_keys: Array[String],
	node_keys: Array[String],
	default_value: float
) -> float:
	var cutscene_data: Variant = node.get("cutscene", {})
	if typeof(cutscene_data) == TYPE_DICTIONARY:
		var cutscene: Dictionary = cutscene_data
		for key in blackout_keys:
			if cutscene.has(key):
				return maxf(_read_variant_float(cutscene[key], default_value), 0.0)

	var blackout_data: Variant = node.get("blackout", {})
	if typeof(blackout_data) == TYPE_DICTIONARY:
		var blackout: Dictionary = blackout_data
		for key in blackout_keys:
			if blackout.has(key):
				return maxf(_read_variant_float(blackout[key], default_value), 0.0)

	for key in node_keys:
		if node.has(key):
			return maxf(_read_variant_float(node[key], default_value), 0.0)

	return default_value


func _get_node_cutscene_image_path(node: Dictionary) -> String:
	for data_key in ["cutscene", "blackout"]:
		var raw_data: Variant = node.get(data_key, {})
		if typeof(raw_data) != TYPE_DICTIONARY:
			continue
		var data: Dictionary = raw_data
		for image_key in ["image", "path", "src", "file"]:
			if not data.has(image_key):
				continue
			var path := String(data[image_key]).strip_edges()
			if not path.is_empty():
				return _normalize_resource_path(path)

	for image_key in ["cutscene_image", "cutscene_image_path", "blackout_image", "image", "path"]:
		if not node.has(image_key):
			continue
		var path := String(node[image_key]).strip_edges()
		if not path.is_empty():
			return _normalize_resource_path(path)

	return ""


func _load_node_cutscene_texture(image_path: String) -> Texture2D:
	if image_path.is_empty():
		return null
	if not ResourceLoader.exists(image_path) and not FileAccess.file_exists(image_path):
		return null
	return load(image_path) as Texture2D


func _apply_node_cutscene_image(node: Dictionary) -> void:
	if _node_cutscene_image_rect == null or not is_instance_valid(_node_cutscene_image_rect):
		return

	_node_cutscene_image_rect.texture = null
	_node_cutscene_image_rect.visible = false
	var image_path := _get_node_cutscene_image_path(node)
	if image_path.is_empty():
		return

	var texture := _load_node_cutscene_texture(image_path)
	if texture == null:
		return

	_node_cutscene_image_rect.texture = texture
	_node_cutscene_image_rect.visible = true


func _get_node_blackout_fade_in_duration(node: Dictionary) -> float:
	return _get_node_blackout_duration(
		node,
		["fade_in", "fade_in_duration", "fadeIn", "in"],
		["blackout_fade_in", "blackout_fade_in_duration", "fade_in_duration"],
		NODE_BLACKOUT_FADE_IN_DURATION
	)


func _get_node_blackout_hold_duration(node: Dictionary) -> float:
	return _get_node_blackout_duration(
		node,
		["hold", "hold_duration", "duration", "wait"],
		["blackout_hold", "blackout_hold_duration", "hold_duration"],
		NODE_BLACKOUT_HOLD_DURATION
	)


func _get_node_blackout_fade_out_duration(node: Dictionary) -> float:
	return _get_node_blackout_duration(
		node,
		["fade_out", "fade_out_duration", "fadeOut", "out"],
		["blackout_fade_out", "blackout_fade_out_duration", "fade_out_duration"],
		NODE_BLACKOUT_FADE_OUT_DURATION
	)


func _show_blackout_node(node: Dictionary) -> void:
	_node_blackout_transitioning = true
	_stop_skip_hold()
	_cancel_pending_auto_advance()
	_stop_dialogue_text_sound()
	_pending_dialogue = {}
	_portrait_dialogue_token += 1
	_awaiting_portrait_for_dialogue = false
	_clear_choices()
	_clear_popup_images()
	_hide_dialogue_spectrum()
	_set_dialogue_overlay_visible(false)
	_prepare_dialogue_presentation("", DEFAULT_SPEAKER_COLOR)
	_set_floating_ui_visible(false)
	_refresh_skip_button_state()
	_refresh_statement_controls()
	_refresh_auto_mode_ui()

	var fade_in_duration := _get_node_blackout_fade_in_duration(node)
	var hold_duration := _get_node_blackout_hold_duration(node)
	var fade_out_duration := _get_node_blackout_fade_out_duration(node)
	_ensure_node_blackout_overlay()
	if _node_blackout_overlay == null:
		_finish_blackout_node(_current_node_id, fade_out_duration)
		return
	_apply_node_cutscene_image(node)

	if _node_blackout_tween != null and _node_blackout_tween.is_valid():
		_node_blackout_tween.kill()

	var start_alpha := clampf(_node_blackout_overlay.modulate.a, 0.0, 1.0)
	_node_blackout_overlay.modulate.a = start_alpha
	_node_blackout_tween = create_tween()
	_node_blackout_tween.set_ease(Tween.EASE_IN_OUT)
	_node_blackout_tween.set_trans(Tween.TRANS_SINE)
	var has_tween_step := false
	if fade_in_duration > 0.0 and start_alpha < 0.999:
		_node_blackout_tween.tween_property(_node_blackout_overlay, "modulate:a", 1.0, fade_in_duration)
		has_tween_step = true
	else:
		_node_blackout_overlay.modulate.a = 1.0
	if hold_duration > 0.0:
		_node_blackout_tween.tween_interval(hold_duration)
		has_tween_step = true
	var node_id := _current_node_id
	if not has_tween_step:
		_node_blackout_tween.kill()
		_node_blackout_tween = null
		_finish_blackout_node(node_id, fade_out_duration)
		return
	var tween := _node_blackout_tween
	tween.finished.connect(func() -> void:
		if _node_blackout_tween == tween:
			_node_blackout_tween = null
		_finish_blackout_node(node_id, fade_out_duration)
	, CONNECT_ONE_SHOT)


func _finish_blackout_node(node_id: String, fade_out_duration: float) -> void:
	if not _node_blackout_transitioning or node_id != _current_node_id:
		return

	_complete_current_node_progression()
	var next_id := String(_current_node.get("next", "")).strip_edges()
	if next_id.is_empty():
		_fade_out_node_blackout(fade_out_duration, func() -> void:
			if not _try_advance_to_chained_dialogue():
				request_screen_change("chapter_select")
		)
		return

	if not _nodes_by_id.has(next_id):
		_fade_out_node_blackout(fade_out_duration, func() -> void:
			request_screen_change("chapter_select")
		)
		return

	_show_node(next_id)
	if _is_blackout_node(_current_node):
		return
	_fade_out_node_blackout(fade_out_duration)


func _fade_out_node_blackout(duration: float, on_finished: Callable = Callable()) -> void:
	if _node_blackout_overlay == null or not is_instance_valid(_node_blackout_overlay):
		_complete_node_blackout(on_finished)
		return

	if _node_blackout_tween != null and _node_blackout_tween.is_valid():
		_node_blackout_tween.kill()
	if duration <= 0.0:
		_node_blackout_overlay.modulate.a = 0.0
		_node_blackout_tween = null
		_complete_node_blackout(on_finished)
		return
	_node_blackout_tween = create_tween()
	_node_blackout_tween.set_ease(Tween.EASE_OUT)
	_node_blackout_tween.set_trans(Tween.TRANS_SINE)
	_node_blackout_tween.tween_property(_node_blackout_overlay, "modulate:a", 0.0, duration)
	var tween := _node_blackout_tween
	tween.finished.connect(func() -> void:
		if _node_blackout_tween == tween:
			_node_blackout_tween = null
		_complete_node_blackout(on_finished)
	, CONNECT_ONE_SHOT)


func _complete_node_blackout(on_finished: Callable = Callable()) -> void:
	_node_blackout_transitioning = false
	_node_blackout_tween = null
	_clear_node_blackout_overlay()
	if not _statement_title_playing and not _statement_title_preparing_reveal and not _dialogue_chain_transitioning:
		_set_floating_ui_visible(true, true)
	_refresh_statement_controls()
	_update_advance_hint()
	_schedule_auto_mode_advance_if_ready()
	if on_finished.is_valid():
		on_finished.call()


func _ensure_node_blackout_overlay() -> void:
	if _node_blackout_overlay != null and is_instance_valid(_node_blackout_overlay):
		_node_blackout_overlay.visible = true
		_node_blackout_overlay.move_to_front()
		_ensure_node_cutscene_image_rect()
		return

	_node_blackout_overlay = ColorRect.new()
	_node_blackout_overlay.name = "DialogueNodeBlackout"
	_node_blackout_overlay.color = Color.BLACK
	_node_blackout_overlay.modulate.a = 0.0
	_node_blackout_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	_node_blackout_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_node_blackout_overlay)
	_apply_viewport_overlay_layout(_node_blackout_overlay)
	_ensure_node_cutscene_image_rect()
	_node_blackout_overlay.move_to_front()


func _ensure_node_cutscene_image_rect() -> void:
	if _node_blackout_overlay == null or not is_instance_valid(_node_blackout_overlay):
		return
	if _node_cutscene_image_rect != null and is_instance_valid(_node_cutscene_image_rect):
		if _node_cutscene_image_rect.get_parent() == _node_blackout_overlay:
			_node_cutscene_image_rect.set_anchors_preset(Control.PRESET_FULL_RECT)
			_node_cutscene_image_rect.offset_left = 0.0
			_node_cutscene_image_rect.offset_top = 0.0
			_node_cutscene_image_rect.offset_right = 0.0
			_node_cutscene_image_rect.offset_bottom = 0.0
			return

	_node_cutscene_image_rect = TextureRect.new()
	_node_cutscene_image_rect.name = "DialogueNodeCutsceneImage"
	_node_cutscene_image_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_node_cutscene_image_rect.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	_node_cutscene_image_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_node_cutscene_image_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	_node_cutscene_image_rect.visible = false
	_node_cutscene_image_rect.set_anchors_preset(Control.PRESET_FULL_RECT)
	_node_blackout_overlay.add_child(_node_cutscene_image_rect)


func _clear_node_blackout_overlay() -> void:
	if _node_blackout_overlay != null and is_instance_valid(_node_blackout_overlay):
		_node_blackout_overlay.queue_free()
	_node_blackout_overlay = null
	_node_cutscene_image_rect = null


func _cancel_node_blackout_transition() -> void:
	_node_blackout_transitioning = false
	if _node_blackout_tween != null and _node_blackout_tween.is_valid():
		_node_blackout_tween.kill()
	_node_blackout_tween = null
	_clear_node_blackout_overlay()


func _grant_node_acquire_info(node: Dictionary) -> void:
	if node.is_empty():
		return
	var acquired := VisualNovelData.acquire_info_from_data(node)
	var acquired_characters := acquired.get("characters", []) as Array
	var acquired_items := acquired.get("items", []) as Array
	if not acquired_characters.is_empty() or not acquired_items.is_empty():
		_invalidate_statement_notebook_content()
		_refresh_case_notebook_button_state()


func _apply_story_flags_from_data(data: Dictionary) -> void:
	if data.is_empty():
		return
	var raw_flags: Variant = data.get("set_flags", data.get("flags", {}))
	if typeof(raw_flags) == TYPE_DICTIONARY:
		VisualNovelData.set_story_flags(raw_flags as Dictionary)


func _apply_story_flags_on_complete_from_data(data: Dictionary) -> void:
	if data.is_empty():
		return
	var raw_flags: Variant = data.get(
		"set_flags_on_complete",
		data.get("complete_flags", data.get("flags_on_complete", {}))
	)
	if typeof(raw_flags) == TYPE_DICTIONARY:
		VisualNovelData.set_story_flags(raw_flags as Dictionary)


func _complete_current_node_progression() -> void:
	_apply_story_flags_on_complete_from_data(_current_node)


func _try_advance_to_chained_dialogue() -> bool:
	if _dialogue_chain_transitioning:
		return true

	var next_dialogue_id := _get_chained_next_dialogue_id()
	if next_dialogue_id.is_empty() or next_dialogue_id == _dialogue_id:
		return false
	if not VisualNovelData.has_dialogue(StringName(next_dialogue_id)):
		return false

	var next_dialogue: Dictionary = VisualNovelData.get_dialogue(StringName(next_dialogue_id))
	var next_metadata := _read_dialogue_metadata(next_dialogue)
	var next_is_statement := String(next_metadata.get("presentation_mode", "normal")).strip_edges().to_lower() == "statement"
	if _get_chained_next_dialogue_blackout():
		_start_chained_dialogue_blackout(next_dialogue_id, next_is_statement)
		return true

	if not next_is_statement:
		_clear_stage_characters()
	_close_statement_notebook(false)
	_restore_statement_stage_after_note()
	return _begin_dialogue_session(next_dialogue_id)


func _start_chained_dialogue_blackout(next_dialogue_id: String, next_is_statement: bool) -> void:
	_dialogue_chain_transitioning = true
	_stop_skip_hold()
	var fade_duration := _get_chained_next_dialogue_blackout_fade_duration()
	var hold_duration := _get_chained_next_dialogue_blackout_hold_duration()
	_stop_bgm(fade_duration)
	_set_floating_ui_visible(false)
	_update_advance_hint()
	_refresh_statement_controls()
	_ensure_chain_blackout_overlay()
	if _chain_blackout_overlay == null:
		_finish_chained_dialogue_blackout(next_dialogue_id, next_is_statement)
		return

	if _chain_blackout_tween != null and _chain_blackout_tween.is_valid():
		_chain_blackout_tween.kill()
	_chain_blackout_overlay.modulate.a = 0.0
	if fade_duration <= 0.0 and hold_duration <= 0.0:
		_chain_blackout_overlay.modulate.a = 1.0
		_finish_chained_dialogue_blackout(next_dialogue_id, next_is_statement)
		return

	_chain_blackout_tween = create_tween()
	_chain_blackout_tween.set_ease(Tween.EASE_IN_OUT)
	_chain_blackout_tween.set_trans(Tween.TRANS_SINE)
	if fade_duration > 0.0:
		_chain_blackout_tween.tween_property(_chain_blackout_overlay, "modulate:a", 1.0, fade_duration)
	else:
		_chain_blackout_overlay.modulate.a = 1.0
	if hold_duration > 0.0:
		_chain_blackout_tween.tween_interval(hold_duration)
	var tween := _chain_blackout_tween
	tween.finished.connect(func() -> void:
		if _chain_blackout_tween == tween:
			_chain_blackout_tween = null
		_finish_chained_dialogue_blackout(next_dialogue_id, next_is_statement)
	, CONNECT_ONE_SHOT)


func _finish_chained_dialogue_blackout(next_dialogue_id: String, next_is_statement: bool) -> void:
	if not next_is_statement:
		_clear_stage_characters()
	_close_statement_notebook(false)
	_restore_statement_stage_after_note()
	_stop_bgm()
	if not _begin_dialogue_session(next_dialogue_id):
		_dialogue_chain_transitioning = false
		_clear_chain_blackout_overlay()
		request_screen_change("chapter_select")
		return
	_fade_out_chained_dialogue_blackout()


func _fade_out_chained_dialogue_blackout() -> void:
	if _chain_blackout_overlay == null or not is_instance_valid(_chain_blackout_overlay):
		_complete_chained_dialogue_blackout()
		return

	if _chain_blackout_tween != null and _chain_blackout_tween.is_valid():
		_chain_blackout_tween.kill()
	_chain_blackout_tween = create_tween()
	_chain_blackout_tween.set_ease(Tween.EASE_OUT)
	_chain_blackout_tween.set_trans(Tween.TRANS_SINE)
	_chain_blackout_tween.tween_property(_chain_blackout_overlay, "modulate:a", 0.0, CHAIN_BLACKOUT_FADE_OUT_DURATION)
	var tween := _chain_blackout_tween
	tween.finished.connect(func() -> void:
		if _chain_blackout_tween == tween:
			_chain_blackout_tween = null
		_complete_chained_dialogue_blackout()
	, CONNECT_ONE_SHOT)


func _complete_chained_dialogue_blackout() -> void:
	_dialogue_chain_transitioning = false
	_clear_chain_blackout_overlay()
	if not _statement_title_playing and not _statement_title_preparing_reveal:
		_set_floating_ui_visible(true, true)
	_refresh_statement_controls()
	_update_advance_hint()
	_schedule_auto_mode_advance_if_ready()


func _ensure_chain_blackout_overlay() -> void:
	if _chain_blackout_overlay != null and is_instance_valid(_chain_blackout_overlay):
		_chain_blackout_overlay.visible = true
		_chain_blackout_overlay.move_to_front()
		return

	_chain_blackout_overlay = ColorRect.new()
	_chain_blackout_overlay.name = "DialogueChainBlackout"
	_chain_blackout_overlay.color = Color.BLACK
	_chain_blackout_overlay.modulate.a = 0.0
	_chain_blackout_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	_chain_blackout_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_chain_blackout_overlay)
	_apply_viewport_overlay_layout(_chain_blackout_overlay)
	_chain_blackout_overlay.move_to_front()


func _clear_chain_blackout_overlay() -> void:
	if _chain_blackout_overlay != null and is_instance_valid(_chain_blackout_overlay):
		_chain_blackout_overlay.queue_free()
	_chain_blackout_overlay = null


func _cancel_chained_dialogue_blackout_transition() -> void:
	_dialogue_chain_transitioning = false
	if _chain_blackout_tween != null and _chain_blackout_tween.is_valid():
		_chain_blackout_tween.kill()
	_chain_blackout_tween = null
	_clear_chain_blackout_overlay()


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


func _restore_story_state_from_payload(payload: Dictionary) -> void:
	if not bool(payload.get("rewind_story_state", false)):
		return
	VisualNovelData.set_story_state_snapshot({
		"flags": payload.get("rewind_story_flags", {}),
		"seen_dialogue_ids": payload.get("rewind_seen_dialogue_ids", []),
		"seen_dialogue_node_ids": payload.get("rewind_seen_dialogue_node_ids", []),
		"heard_dialogue_topic_ids": payload.get("rewind_heard_dialogue_topic_ids", []),
	})


func _read_rewind_backlog_entries(payload: Dictionary, dialogue_id: String) -> Array[Dictionary]:
	return _read_rewind_entries_from_payload(payload, dialogue_id, "rewind_backlog_entries")


func _read_rewind_media_entries(payload: Dictionary, dialogue_id: String) -> Array[Dictionary]:
	return _read_rewind_entries_from_payload(payload, dialogue_id, "rewind_media_entries")


func _read_rewind_entries_from_payload(payload: Dictionary, dialogue_id: String, key: String) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	var raw_entries: Variant = payload.get(key, [])
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


func _restore_rewind_media_state(target_node_id: String, rewind_entries: Array) -> void:
	_stop_all_sfx()
	_stop_bgm()
	_clear_background_image()

	var state := _infer_rewind_media_state(target_node_id, rewind_entries)
	var bgm_event: Dictionary = state.get("bgm_event", {})
	if not bgm_event.is_empty():
		_play_bgm_from_event(bgm_event, true)

	var background_event: Dictionary = state.get("background_event", {})
	if not background_event.is_empty():
		_apply_background_event(background_event, true)


func _infer_rewind_stage_zoom_state(target_node_id: String, rewind_entries: Array) -> Dictionary:
	var state := {}
	var cast_zoom_state := {}
	var nearest_dialogue_zoom := -1
	var cutoff_index := _find_rewind_target_entry_index(target_node_id, rewind_entries)
	if cutoff_index < 0:
		cutoff_index = rewind_entries.size()

	for index in cutoff_index:
		var raw_entry: Variant = rewind_entries[index]
		if typeof(raw_entry) != TYPE_DICTIONARY:
			continue
		var entry: Dictionary = raw_entry
		if String(entry.get("kind", "")).strip_edges() != "dialogue":
			continue

		var node_id := String(entry.get("node_id", "")).strip_edges()
		if node_id.is_empty() or not _nodes_by_id.has(node_id):
			continue

		var node: Dictionary = _nodes_by_id[node_id]
		var dialogue_zoom := _apply_rewind_node_zoom_state(node, cast_zoom_state)
		if dialogue_zoom > 0:
			nearest_dialogue_zoom = dialogue_zoom

	for cast_id in cast_zoom_state.keys():
		state[cast_id] = cast_zoom_state[cast_id]
	if nearest_dialogue_zoom > 0:
		state[REWIND_NEAREST_DIALOGUE_ZOOM_KEY] = nearest_dialogue_zoom
	return state


func _apply_rewind_node_zoom_state(node: Dictionary, cast_zoom_state: Dictionary) -> int:
	var speaker_id := String(node.get("speaker", "")).strip_edges()
	var is_narrator := _is_narrator_speaker(speaker_id)
	var preserve_zoom := _should_preserve_stage_zoom_for_node(node)
	var dialogue_zoom := -1
	var cast_data: Variant = node.get("stage_cast", {})
	if typeof(cast_data) == TYPE_DICTIONARY:
		var cast: Dictionary = cast_data
		for key in cast.keys():
			var cast_id := String(key)
			if cast_id.is_empty() or _is_narrator_speaker(cast_id):
				continue
			var entry: Variant = cast[key]
			if typeof(entry) != TYPE_DICTIONARY:
				continue

			var cast_entry: Dictionary = entry
			if String(cast_entry.get("portrait", "")).strip_edges().is_empty():
				continue
			if preserve_zoom:
				continue

			var zoom := _resolve_rewind_dialogue_cast_zoom(cast_id, speaker_id, cast_entry)
			cast_zoom_state[cast_id] = zoom
			if cast_id == speaker_id:
				dialogue_zoom = zoom

	for cast_id in _get_exit_speaker_ids_from_node_events(node):
		cast_zoom_state.erase(cast_id)

	if not is_narrator and not preserve_zoom and dialogue_zoom <= 0:
		if cast_zoom_state.has(speaker_id):
			dialogue_zoom = _snap_stage_zoom_value(cast_zoom_state[speaker_id])
		elif not speaker_id.is_empty():
			dialogue_zoom = PortraitLayout.snap_zoom_percent(PortraitLayout.ZOOM_DEFAULT)
	return dialogue_zoom


func _resolve_rewind_dialogue_cast_zoom(
	_cast_id: String,
	_speaker_id: String,
	cast_entry: Dictionary
) -> int:
	if cast_entry.has("portrait_zoom"):
		return PortraitLayout.snap_zoom_percent(int(cast_entry.get("portrait_zoom")))
	return PortraitLayout.snap_zoom_percent(STAGE_CAST_ZOOM_DEFAULT)


func _infer_rewind_media_state(target_node_id: String, rewind_entries: Array) -> Dictionary:
	var state := {
		"bgm_event": {},
		"background_event": {},
	}
	var cutoff_index := _find_rewind_target_entry_index(target_node_id, rewind_entries)
	if cutoff_index < 0:
		cutoff_index = rewind_entries.size()

	for index in cutoff_index:
		var raw_entry: Variant = rewind_entries[index]
		if typeof(raw_entry) != TYPE_DICTIONARY:
			continue
		var entry: Dictionary = raw_entry
		if String(entry.get("kind", "")).strip_edges() != "dialogue":
			continue

		var node_id := String(entry.get("node_id", "")).strip_edges()
		if node_id.is_empty() or not _nodes_by_id.has(node_id):
			continue

		var node: Dictionary = _nodes_by_id[node_id]
		for event in _extract_dialogue_media_events(String(node.get("text", ""))):
			_apply_dialogue_media_event_to_state(state, event)
	return state


func _find_rewind_target_entry_index(target_node_id: String, rewind_entries: Array) -> int:
	var clean_target_id := target_node_id.strip_edges()
	if clean_target_id.is_empty():
		return -1
	for index in range(rewind_entries.size() - 1, -1, -1):
		var raw_entry: Variant = rewind_entries[index]
		if typeof(raw_entry) != TYPE_DICTIONARY:
			continue
		var entry: Dictionary = raw_entry
		if String(entry.get("kind", "")).strip_edges() != "dialogue":
			continue
		if String(entry.get("node_id", "")).strip_edges() == clean_target_id:
			return index
	return -1


func _extract_dialogue_media_events(line_text: String) -> Array[Dictionary]:
	var events: Array[Dictionary] = []
	var cursor := 0
	while cursor < line_text.length():
		var open_index := line_text.find("[", cursor)
		if open_index < 0:
			break
		var close_index := line_text.find("]", open_index + 1)
		if close_index < 0:
			break

		var tag_body := line_text.substr(open_index + 1, close_index - open_index - 1)
		var event := _parse_dialogue_media_event_tag(tag_body)
		if not event.is_empty():
			events.append(event)
		cursor = close_index + 1
	return events


func _consume_leading_background_events(line_text: String) -> Dictionary:
	var events: Array[Dictionary] = []
	var display := ""
	var index := 0

	while index < line_text.length():
		var ch := line_text[index]

		if ch == "[":
			var close_index := line_text.find("]", index + 1)
			if close_index < 0:
				break

			var tag_body := line_text.substr(index + 1, close_index - index - 1)
			var event := _parse_dialogue_media_event_tag(tag_body)
			if not event.is_empty():
				if _is_background_media_event(event):
					events.append(event)
				else:
					display += line_text.substr(index, close_index - index + 1)
				index = close_index + 1
				continue

			var tag_name := _get_dialogue_bbcode_tag_name(tag_body)
			display += line_text.substr(index, close_index - index + 1)
			index = close_index + 1
			if tag_name == "lb" or tag_name == "rb":
				break
			continue

		if ch == "\\":
			break

		if ch == "|":
			var next_index := _get_typewriter_pause_next_index(line_text, index)
			display += line_text.substr(index, next_index - index)
			index = next_index
			continue

		break

	display += line_text.substr(index)
	return {
		"text": display,
		"events": events,
	}


func _get_typewriter_pause_next_index(text: String, index: int) -> int:
	var close_index := text.find("|", index + 1)
	if close_index >= 0:
		var token := text.substr(index + 1, close_index - index - 1)
		if _is_typewriter_custom_pause_token(token):
			return close_index + 1
	return index + 1


func _is_background_media_event(event: Dictionary) -> bool:
	var event_name := String(event.get("name", "")).strip_edges().to_lower()
	return event_name in ["bg", "background", "bg_clear", "background_clear", "bg_remove", "background_remove"]


func _apply_leading_background_events(events: Array) -> void:
	for raw_event in events:
		if typeof(raw_event) != TYPE_DICTIONARY:
			continue
		var event: Dictionary = raw_event
		var event_name := String(event.get("name", "")).strip_edges().to_lower()
		match event_name:
			"bg", "background":
				_apply_background_event(event)
			"bg_clear", "background_clear", "bg_remove", "background_remove":
				_clear_background_image_from_event(event)


func _parse_dialogue_media_event_tag(tag_body: String) -> Dictionary:
	var body := tag_body.strip_edges()
	if body.is_empty() or body.begins_with("/"):
		return {}

	var tag_name := _get_dialogue_bbcode_tag_name(body)
	if not DIALOGUE_EVENT_TAGS.has(tag_name):
		return {}

	var attr_text := body.substr(mini(tag_name.length(), body.length())).strip_edges()
	var attrs := _parse_dialogue_media_event_attributes(attr_text)
	var event := {
		"name": tag_name,
		"attributes": attrs,
	}
	for key in attrs.keys():
		event[key] = attrs[key]
	return event


func _parse_dialogue_media_event_attributes(attr_text: String) -> Dictionary:
	var attrs := {}
	var text := attr_text.strip_edges()
	if text.is_empty():
		return attrs

	if text.begins_with("="):
		attrs["path"] = _unquote_dialogue_media_event_value(text.substr(1).strip_edges())
		return attrs

	for token in _tokenize_dialogue_media_event_attributes(text):
		var separator_index := token.find("=")
		if separator_index >= 0:
			var key := token.substr(0, separator_index).strip_edges().to_lower()
			var value := token.substr(separator_index + 1).strip_edges()
			if not key.is_empty():
				attrs[key] = _unquote_dialogue_media_event_value(value)
			continue

		var clean_token := _unquote_dialogue_media_event_value(token.strip_edges())
		if clean_token.is_empty():
			continue
		if not attrs.has("path") and (
			clean_token.begins_with("res://")
			or clean_token.begins_with("user://")
			or clean_token.begins_with("/")
		):
			attrs["path"] = clean_token
		else:
			attrs[clean_token.to_lower()] = true
	return attrs


func _tokenize_dialogue_media_event_attributes(text: String) -> Array[String]:
	var tokens: Array[String] = []
	var current := ""
	var quote := ""
	for i in text.length():
		var ch := text[i]
		if not quote.is_empty():
			current += ch
			if ch == quote:
				quote = ""
			continue
		if ch == "\"" or ch == "'":
			quote = ch
			current += ch
			continue
		if ch.strip_edges().is_empty():
			if not current.is_empty():
				tokens.append(current)
				current = ""
			continue
		current += ch
	if not current.is_empty():
		tokens.append(current)
	return tokens


func _unquote_dialogue_media_event_value(value: String) -> String:
	var clean_value := value.strip_edges()
	if clean_value.length() >= 2:
		var first := clean_value[0]
		var last := clean_value[clean_value.length() - 1]
		if (first == "\"" and last == "\"") or (first == "'" and last == "'"):
			return clean_value.substr(1, clean_value.length() - 2)
	return clean_value


func _apply_dialogue_media_event_to_state(state: Dictionary, event: Dictionary) -> void:
	var event_name := String(event.get("name", "")).strip_edges().to_lower()
	match event_name:
		"bgm", "music":
			state["bgm_event"] = event.duplicate(true)
		"bgm_stop", "music_stop":
			state["bgm_event"] = {}
		"bgm_volume", "music_volume":
			_apply_bgm_volume_event_to_state(state, event)
		"bg", "background":
			var action := _get_dialogue_event_string(event, ["action", "mode"], "").to_lower()
			if action in ["clear", "remove", "hide", "stop", "off"]:
				state["background_event"] = {}
			else:
				state["background_event"] = event.duplicate(true)
		"bg_clear", "background_clear", "bg_remove", "background_remove":
			state["background_event"] = {}


func _apply_bgm_volume_event_to_state(state: Dictionary, event: Dictionary) -> void:
	var raw_bgm_event: Variant = state.get("bgm_event", {})
	if typeof(raw_bgm_event) != TYPE_DICTIONARY:
		return
	var bgm_event: Dictionary = raw_bgm_event
	if bgm_event.is_empty():
		return
	state["bgm_event"] = _merge_bgm_volume_event(bgm_event, event)


func _merge_bgm_volume_event(bgm_event: Dictionary, volume_event: Dictionary) -> Dictionary:
	var updated := bgm_event.duplicate(true)
	var attrs: Dictionary = {}
	var raw_attrs: Variant = updated.get("attributes", {})
	if typeof(raw_attrs) == TYPE_DICTIONARY:
		attrs = (raw_attrs as Dictionary).duplicate(true)

	var raw_db := _get_dialogue_event_string(volume_event, ["volume_db", "db"], "")
	if not raw_db.is_empty() and _is_numeric_text(raw_db):
		attrs.erase("volume")
		attrs.erase("bgm_volume_multiplier")
		attrs.erase("db")
		attrs["volume_db"] = raw_db
		updated.erase("volume")
		updated.erase("bgm_volume_multiplier")
		updated.erase("db")
		updated["volume_db"] = raw_db
		updated["attributes"] = attrs
		return updated

	var raw_volume := _get_dialogue_event_string(volume_event, ["volume"], "")
	if not raw_volume.is_empty() and _is_numeric_text(raw_volume):
		attrs.erase("volume_db")
		attrs.erase("db")
		attrs.erase("volume")
		attrs["bgm_volume_multiplier"] = raw_volume
		updated.erase("volume_db")
		updated.erase("db")
		updated.erase("volume")
		updated["bgm_volume_multiplier"] = raw_volume
		updated["attributes"] = attrs
	return updated


func _to_clean_string_array(raw_value: Variant) -> Array:
	var result := []
	if typeof(raw_value) == TYPE_STRING:
		for token in String(raw_value).replace(",", " ").replace(";", " ").split(" ", false):
			var token_id := String(token).strip_edges()
			if not token_id.is_empty() and not token_id in result:
				result.append(token_id)
		return result
	if typeof(raw_value) != TYPE_ARRAY:
		return result
	for raw_id in raw_value as Array:
		var id := String(raw_id).strip_edges()
		if not id.is_empty() and not id in result:
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
	_cancel_pending_auto_advance()
	_has_loaded_dialogue = false
	_current_node = {}
	_current_node_id = ""
	_current_node_exit_speaker_ids.clear()
	_text_sound_muted_for_current_node = false
	_reset_dialogue_text_sound_state()
	_awaiting_portrait_for_dialogue = false
	_pending_dialogue = {}
	_statement_title_pending_spectrum = {}
	_statement_reveal_layout_active = false
	_statement_current_lies.clear()
	_statement_lie_ranges.clear()
	_statement_hovered_lie_index = -1
	_statement_active_lie_index = -1
	_statement_notebook_mode = NOTEBOOK_MODE_STATEMENT
	_case_notebook_present_choices.clear()
	_statement_connection_mode_active = false
	_statement_resume_connection_mode_on_note_close = false
	_statement_lie_revealing = false
	_refresh_statement_controls()
	_set_statement_phrase_selection_visible(false)
	_clear_choices()
	_hide_dialogue_spectrum()
	_stop_dialogue_text_sound()
	_stop_bgm()
	_stop_all_sfx()
	_clear_popup_images()
	_clear_background_image()

	var chapter_title := String(payload.get("chapter_title", ""))
	var body := "대화 데이터가 아직 없습니다."
	if not chapter_title.is_empty():
		body = "%s의 대화 데이터가 아직 없습니다." % chapter_title

	_set_dialogue_overlay_visible(true)
	_render_dialogue_line("시스템", body, MUTED_TEXT_COLOR)
	_clear_stage_characters()
	_refresh_skip_button_state()
	_update_advance_hint()


func _show_node(node_id: String) -> void:
	_cancel_stage_node_hold()
	_cancel_pending_auto_advance()
	_stop_dialogue_text_sound()
	if not _nodes_by_id.has(node_id):
		_show_empty_dialogue_state(setup_payload)
		return

	_hide_statement_loop_prompt(false)
	_current_node_id = node_id
	_current_node = _nodes_by_id[node_id]
	VisualNovelData.mark_dialogue_node_seen(_dialogue_id, _current_node_id)
	_apply_story_flags_from_data(_current_node)
	_current_node_exit_speaker_ids.clear()
	_text_sound_muted_for_current_node = _is_node_text_sound_muted(_current_node)
	_reset_dialogue_text_sound_state()
	_prune_statement_stage_characters_for_node(_current_node)
	_statement_hovered_lie_index = -1
	_statement_active_lie_index = -1
	_case_notebook_present_choices.clear()
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

	if _is_blackout_node(_current_node):
		_show_blackout_node(_current_node)
		return
	if _is_stage_node(_current_node):
		_show_stage_node(_current_node)
		return

	_set_dialogue_overlay_visible(true)
	var speaker_id := String(_current_node.get("speaker", ""))
	var speaker_profile := _get_speaker_profile(speaker_id)
	var is_narrator := _is_narrator_speaker(speaker_id)
	var speaker_mystery := _is_node_speaker_mystery(_current_node, speaker_id)
	var speaker_name := MYSTERY_SPEAKER_NAME if speaker_mystery else _get_speaker_name(speaker_id, speaker_profile)
	var speaker_color := MYSTERY_SPEAKER_COLOR if speaker_mystery else _get_speaker_color(speaker_profile)
	_grant_node_acquire_info(_current_node)
	var line_text := String(_current_node.get("text", ""))
	var leading_background := _consume_leading_background_events(line_text)
	line_text = String(leading_background.get("text", line_text))
	_apply_leading_background_events(leading_background.get("events", []))
	_show_node_popups(_current_node, speaker_id)
	var layout_offset := Vector2.ZERO
	var node_camera_zoom := _get_node_camera_zoom_percent(_current_node)
	var zoom_percent := node_camera_zoom if node_camera_zoom > 0 else PortraitLayout.ZOOM_DEFAULT
	if not is_narrator:
		var cast_entry := {}
		if _current_node.has("stage_cast"):
			var stage_cast: Dictionary = _current_node.get("stage_cast", {})
			if stage_cast.has(speaker_id):
				cast_entry = stage_cast[speaker_id]
		layout_offset = _resolve_cast_layout_offset(speaker_id, cast_entry)
		if cast_entry.has("portrait_zoom") or node_camera_zoom <= 0:
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
	_configure_stage_focus_targets_for_node(_current_node, speaker_id, is_narrator)

	if is_narrator:
		_stage_speaker_id = ""
		_play_stage_cast_animations(_current_node, on_portrait_ready)
		_hide_dialogue_spectrum()
	else:
		_stage_speaker_id = speaker_id
		_raise_character_slot(speaker_id)
		_play_stage_cast_animations(_current_node, on_portrait_ready)
	_sync_grid_background()


func _show_stage_node(node: Dictionary) -> void:
	_stop_skip_hold()
	_pending_dialogue = {}
	_portrait_dialogue_token += 1
	_awaiting_portrait_for_dialogue = true
	_clear_choices()
	_hide_dialogue_spectrum()
	_set_dialogue_overlay_visible(false)
	_prepare_dialogue_presentation("", DEFAULT_SPEAKER_COLOR)
	_refresh_skip_button_state()
	_refresh_statement_controls()
	_refresh_auto_mode_ui()

	_stage_speaker_id = ""
	_apply_stage_flags(node, "", true, false)
	_configure_stage_focus_targets_for_node(node, "", true)
	var node_id := _current_node_id
	_play_stage_cast_animations(node, func() -> void:
		if node_id != _current_node_id:
			return
		_rewind_stage_zoom_state.clear()
		_wait_then_advance_stage_node(node_id)
	)
	_sync_grid_background()


func _wait_then_advance_stage_node(node_id: String) -> void:
	if node_id != _current_node_id:
		return

	_cancel_stage_node_hold()
	var hold_duration := _get_stage_node_hold_duration(_current_node)
	if hold_duration <= 0.0:
		_finish_stage_node(node_id)
		return

	_stage_node_hold_tween = create_tween()
	_stage_node_hold_tween.tween_interval(hold_duration)
	var tween := _stage_node_hold_tween
	tween.finished.connect(func() -> void:
		if _stage_node_hold_tween == tween:
			_stage_node_hold_tween = null
		_finish_stage_node(node_id)
	, CONNECT_ONE_SHOT)


func _cancel_stage_node_hold() -> void:
	if _stage_node_hold_tween != null and _stage_node_hold_tween.is_valid():
		_stage_node_hold_tween.kill()
	_stage_node_hold_tween = null


func _finish_stage_node(node_id: String) -> void:
	if node_id != _current_node_id:
		return
	_awaiting_portrait_for_dialogue = false
	_advance_from_non_dialogue_node(node_id)


func _get_stage_node_hold_duration(node: Dictionary) -> float:
	for key in ["stage_hold", "stage_wait", "hold", "wait", "duration"]:
		if node.has(key):
			return maxf(_read_variant_float(node[key], 0.0), 0.0)

	var stage_data: Variant = node.get("stage", {})
	if typeof(stage_data) == TYPE_DICTIONARY:
		var stage: Dictionary = stage_data
		for key in ["hold", "wait", "duration"]:
			if stage.has(key):
				return maxf(_read_variant_float(stage[key], 0.0), 0.0)
	return 0.0


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
	_rewind_stage_zoom_state.clear()


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
	_schedule_auto_mode_advance_if_ready()
	_refresh_auto_mode_ui()


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
	if _dialogue_window_suppressed:
		return

	var display_line_text := _resolve_dialogue_character_color_tags(line_text)
	_dialogue_typewriter.playback_speed_multiplier = GameSettings.get_dialogue_speed_multiplier()
	_dialogue_text.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var show_speaker := not speaker_name.is_empty()
	_speaker_label.visible = show_speaker
	_speaker_label.text = speaker_name
	_speaker_label.add_theme_color_override("font_color", speaker_color)
	_dialogue_text.add_theme_color_override("default_color", body_text_color)
	if _line_uses_dialogue_bbcode(display_line_text):
		_dialogue_text.bbcode_enabled = true
		_reset_dialogue_text_sound_state()
		_dialogue_typewriter.start_bbcode_line(display_line_text)
	else:
		_dialogue_text.bbcode_enabled = false
		_reset_dialogue_text_sound_state()
		_dialogue_typewriter.start_line(display_line_text)
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
	var story_state := VisualNovelData.get_story_state_snapshot()
	entry["story_flags"] = story_state.get("flags", {})
	entry["seen_dialogue_ids"] = story_state.get("seen_dialogue_ids", [])
	entry["seen_dialogue_node_ids"] = story_state.get("seen_dialogue_node_ids", [])
	entry["heard_dialogue_topic_ids"] = story_state.get("heard_dialogue_topic_ids", [])
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


func _make_debug_dialogue_payload() -> Dictionary:
	return {
		"dialogue_id": _dialogue_id,
		"current_node_id": _current_node_id,
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
	if _dialogue_window_suppressed:
		return

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
	return _build_statement_bbcode_text_from_lie_tags(line_text, node, speaker_color)


func _build_statement_bbcode_text_from_lie_tags(line_text: String, node: Dictionary, speaker_color: Color) -> Dictionary:
	var bbcode := ""
	var lies: Array[Dictionary] = []
	var ranges: Array[Vector2i] = []
	var visible_index := 0
	var phrase_index := 0
	var cursor := 0
	var lie_color := _get_statement_lie_bbcode_color(speaker_color)

	while cursor < line_text.length():
		var open_index := _find_next_statement_lie_open_tag(line_text, cursor)
		if open_index < 0:
			var tail := _make_statement_display_segment(line_text.substr(cursor))
			bbcode += String(tail.get("bbcode", ""))
			visible_index += String(tail.get("visible_text", "")).length()
			break

		var before := _make_statement_display_segment(line_text.substr(cursor, open_index - cursor))
		var before_text := String(before.get("visible_text", ""))
		bbcode += String(before.get("bbcode", ""))
		visible_index += before_text.length()

		var open_end := line_text.find("]", open_index + 1)
		if open_end < 0:
			var rest := _make_statement_display_segment(line_text.substr(open_index))
			bbcode += String(rest.get("bbcode", ""))
			visible_index += String(rest.get("visible_text", "")).length()
			break

		var lie_close := _find_statement_lie_close_tag(line_text, open_end + 1)
		if lie_close.is_empty():
			var unmatched := _make_statement_display_segment(line_text.substr(open_index))
			bbcode += String(unmatched.get("bbcode", ""))
			visible_index += String(unmatched.get("visible_text", "")).length()
			break

		var close_open := int(lie_close.get("open", -1))
		var close_end := int(lie_close.get("end", open_end + 1))
		var phrase_source := line_text.substr(open_end + 1, close_open - open_end - 1)
		var appended := _append_statement_lie_bbcode(
			bbcode,
			lies,
			ranges,
			line_text,
			phrase_source,
			before_text,
			close_end,
			visible_index,
			phrase_index,
			node,
			lie_color
		)
		bbcode = String(appended.get("bbcode", bbcode))
		visible_index = int(appended.get("visible_index", visible_index))
		phrase_index = int(appended.get("phrase_index", phrase_index))
		cursor = close_end

	return {
		"bbcode_text": bbcode,
		"lies": lies,
		"ranges": ranges,
	}


func _append_statement_lie_bbcode(
	current_bbcode: String,
	lies: Array[Dictionary],
	ranges: Array[Vector2i],
	line_text: String,
	phrase_source: String,
	before_text: String,
	next_start_index: int,
	visible_index: int,
	phrase_index: int,
	node: Dictionary,
	lie_color: String
) -> Dictionary:
	var phrase_visible_text := _get_statement_visible_text(phrase_source)
	var phrase := phrase_visible_text.strip_edges()
	if phrase.is_empty():
		var empty_segment := _make_statement_display_segment(phrase_source)
		return {
			"bbcode": current_bbcode + String(empty_segment.get("bbcode", "")),
			"visible_index": visible_index + String(empty_segment.get("visible_text", "")).length(),
			"phrase_index": phrase_index,
		}

	var bbcode := current_bbcode
	var lie := _get_statement_lie_config(node, phrase_index, phrase)
	var lie_id := String(lie.get("id", "lie_%d" % phrase_index))
	lie["id"] = lie_id
	lie["phrase"] = phrase
	lie["index"] = phrase_index
	lies.append(lie)
	var left_padding := _get_statement_lie_side_padding_for_previous_text(before_text)
	var right_padding := _get_statement_lie_side_padding_for_next_text(line_text, next_start_index)
	bbcode += _escape_statement_bbcode(left_padding)
	visible_index += left_padding.length()
	var phrase_start := visible_index
	ranges.append(Vector2i(phrase_start, phrase_start + phrase_visible_text.length()))
	var phrase_bbcode := String(_make_statement_display_segment(phrase_source).get("bbcode", ""))
	bbcode += "[url=%s%d][shake rate=22.0 level=6 connected=1][color=%s][b]%s[/b][/color][/shake][/url]" % [
		STATEMENT_LIE_META_PREFIX,
		phrase_index,
		lie_color,
		phrase_bbcode,
	]
	visible_index += phrase_visible_text.length()
	bbcode += _escape_statement_bbcode(right_padding)
	visible_index += right_padding.length()
	return {
		"bbcode": bbcode,
		"visible_index": visible_index,
		"phrase_index": phrase_index + 1,
	}


func _find_next_statement_lie_open_tag(text: String, start_index: int) -> int:
	var cursor := maxi(start_index, 0)
	while cursor < text.length():
		var open_index := text.find("[", cursor)
		if open_index < 0:
			return -1
		var close_index := text.find("]", open_index + 1)
		if close_index < 0:
			return -1
		var tag_body := text.substr(open_index + 1, close_index - open_index - 1)
		if _get_dialogue_bbcode_tag_name(tag_body) == STATEMENT_LIE_TAG_NAME and not tag_body.strip_edges().begins_with("/"):
			return open_index
		cursor = close_index + 1
	return -1


func _find_statement_lie_close_tag(text: String, start_index: int) -> Dictionary:
	var cursor := maxi(start_index, 0)
	var depth := 1
	while cursor < text.length():
		var open_index := text.find("[", cursor)
		if open_index < 0:
			return {}
		var close_index := text.find("]", open_index + 1)
		if close_index < 0:
			return {}
		var tag_body := text.substr(open_index + 1, close_index - open_index - 1)
		if _get_dialogue_bbcode_tag_name(tag_body) == STATEMENT_LIE_TAG_NAME:
			if tag_body.strip_edges().begins_with("/"):
				depth -= 1
				if depth <= 0:
					return {
						"open": open_index,
						"end": close_index + 1,
					}
			else:
				depth += 1
		cursor = close_index + 1
	return {}


func _make_statement_display_segment(source: String) -> Dictionary:
	var bbcode := ""
	var index := 0
	while index < source.length():
		var ch := source[index]
		if ch == "[":
			var close_index := source.find("]", index + 1)
			if close_index >= 0:
				var tag_body := source.substr(index + 1, close_index - index - 1)
				var tag_name := _get_dialogue_bbcode_tag_name(tag_body)
				if _is_statement_passthrough_bbcode_tag(tag_body, tag_name):
					var resolved_tag := _resolve_dialogue_character_color_tag(tag_body)
					bbcode += resolved_tag if not resolved_tag.is_empty() else source.substr(index, close_index - index + 1)
				else:
					bbcode += _escape_statement_bbcode(source.substr(index, close_index - index + 1))
				index = close_index + 1
				continue
			bbcode += "[lb]"
			index += 1
			continue
		if ch == "]":
			bbcode += "[rb]"
			index += 1
			continue
		bbcode += ch
		index += 1

	return {
		"bbcode": bbcode,
		"visible_text": _get_statement_visible_text(source),
	}


func _is_statement_passthrough_bbcode_tag(tag_body: String, tag_name: String) -> bool:
	if tag_name.is_empty() or tag_name == STATEMENT_LIE_TAG_NAME:
		return false
	if tag_name == "lb" or tag_name == "rb":
		return true
	return DIALOGUE_BBCODE_TAGS.has(tag_name)


func _get_statement_visible_text(source: String) -> String:
	return _strip_dialogue_bbcode_tags(_strip_typewriter_pauses(source))


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


func _resolve_dialogue_character_color_tags(text: String) -> String:
	var display := ""
	var index := 0
	while index < text.length():
		var open_index := text.find("[", index)
		if open_index < 0:
			display += text.substr(index)
			break

		display += text.substr(index, open_index - index)
		var close_index := text.find("]", open_index + 1)
		if close_index < 0:
			display += text.substr(open_index)
			break

		var tag_body := text.substr(open_index + 1, close_index - open_index - 1)
		var resolved_tag := _resolve_dialogue_character_color_tag(tag_body)
		if resolved_tag.is_empty():
			display += text.substr(open_index, close_index - open_index + 1)
		else:
			display += resolved_tag
		index = close_index + 1
	return display


func _resolve_dialogue_character_color_tag(tag_body: String) -> String:
	var body := tag_body.strip_edges()
	if body.is_empty() or body.begins_with("/"):
		return ""
	if _get_dialogue_bbcode_tag_name(body) != "color":
		return ""

	var color_value := _get_dialogue_color_tag_value(body)
	var character_id := _get_dialogue_character_color_id(color_value)
	if character_id.is_empty():
		return ""

	return "[color=%s]" % _get_dialogue_character_color_value(character_id)


func _get_dialogue_color_tag_value(tag_body: String) -> String:
	var equal_index := tag_body.find("=")
	if equal_index < 0:
		return ""
	return _unquote_dialogue_color_value(tag_body.substr(equal_index + 1).strip_edges())


func _unquote_dialogue_color_value(value: String) -> String:
	var clean_value := value.strip_edges()
	if clean_value.length() >= 2:
		var first := clean_value[0]
		var last := clean_value[clean_value.length() - 1]
		if (first == "\"" and last == "\"") or (first == "'" and last == "'"):
			return clean_value.substr(1, clean_value.length() - 2)
	return clean_value


func _get_dialogue_character_color_id(value: String) -> String:
	var color_value := value.strip_edges()
	var lower_value := color_value.to_lower()
	for prefix in ["character:", "char:", "speaker:"]:
		if lower_value.begins_with(prefix):
			return color_value.substr(prefix.length()).strip_edges()
	return ""


func _get_dialogue_character_color_value(character_id: String) -> String:
	var profile := _get_speaker_profile(character_id.strip_edges())
	var color := _get_speaker_color(profile)
	return "#%s" % color.to_html(false)


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
				if DIALOGUE_BBCODE_TAGS.has(tag_name) or tag_name == STATEMENT_LIE_TAG_NAME:
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
	var next_text := _get_statement_visible_text(line_text.substr(start_index))
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
		lie = _find_statement_lie_config_in_array(lie_array, phrase_index, phrase)
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


func _find_statement_lie_config_in_array(lie_array: Array, phrase_index: int, phrase: String) -> Dictionary:
	var clean_phrase := phrase.strip_edges()
	if phrase_index >= 0 and phrase_index < lie_array.size() and typeof(lie_array[phrase_index]) == TYPE_DICTIONARY:
		var indexed_lie: Dictionary = lie_array[phrase_index]
		var indexed_phrase := String(indexed_lie.get("phrase", "")).strip_edges()
		if indexed_phrase.is_empty() or indexed_phrase == clean_phrase:
			return indexed_lie.duplicate(true)

	for raw_lie in lie_array:
		if typeof(raw_lie) != TYPE_DICTIONARY:
			continue
		var candidate: Dictionary = raw_lie
		if String(candidate.get("phrase", "")).strip_edges() == clean_phrase:
			return candidate.duplicate(true)

	if phrase_index >= 0 and phrase_index < lie_array.size() and typeof(lie_array[phrase_index]) == TYPE_DICTIONARY:
		return (lie_array[phrase_index] as Dictionary).duplicate(true)
	return {}


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
		"mouse", "keyboard", "gamepad":
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
	_apply_statement_connection_hint_metrics()
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
	var icon := _get_input_icon(icon_key, _get_statement_connection_hint_icon_height(icon_height))
	if icon == null:
		_add_statement_connection_hint_label(icon_key)
		return

	var icon_rect := TextureRect.new()
	icon_rect.set_meta("input_icon_key", icon_key)
	icon_rect.set_meta("input_icon_base_height", icon_height)
	icon_rect.texture = icon
	icon_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	icon_rect.custom_minimum_size = Vector2(icon.get_width(), icon.get_height())
	icon_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	icon_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_statement_connection_hint.add_child(icon_rect)


func _apply_statement_connection_hint_icon_metrics(icon_rect: TextureRect) -> void:
	if not icon_rect.has_meta("input_icon_key") or not icon_rect.has_meta("input_icon_base_height"):
		return

	var icon_key := String(icon_rect.get_meta("input_icon_key"))
	var base_height := int(icon_rect.get_meta("input_icon_base_height"))
	var icon := _get_input_icon(icon_key, _get_statement_connection_hint_icon_height(base_height))
	if icon == null:
		return
	icon_rect.texture = icon
	icon_rect.custom_minimum_size = Vector2(icon.get_width(), icon.get_height())


func _add_statement_connection_hint_keycap(text: String) -> void:
	var keycap_offset := MarginContainer.new()
	keycap_offset.name = "KeycapOffset"
	keycap_offset.mouse_filter = Control.MOUSE_FILTER_IGNORE
	keycap_offset.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	keycap_offset.add_theme_constant_override("margin_top", _get_statement_connection_hint_keycap_y_offset())
	_statement_connection_hint.add_child(keycap_offset)

	var keycap := PanelContainer.new()
	keycap.name = "Keycap"
	keycap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	keycap.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	keycap.add_theme_stylebox_override("panel", _create_keycap_style())
	keycap_offset.add_child(keycap)

	var key_margin := MarginContainer.new()
	key_margin.name = "Margin"
	key_margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var keycap_margin_x := _get_statement_connection_hint_keycap_margin_horizontal()
	var keycap_margin_y := _get_statement_connection_hint_keycap_margin_vertical()
	key_margin.add_theme_constant_override("margin_left", keycap_margin_x)
	key_margin.add_theme_constant_override("margin_top", keycap_margin_y)
	key_margin.add_theme_constant_override("margin_right", keycap_margin_x)
	key_margin.add_theme_constant_override("margin_bottom", keycap_margin_y)
	keycap.add_child(key_margin)

	var key_label := Label.new()
	key_label.name = "KeyLabel"
	key_label.text = text
	key_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	key_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	key_label.add_theme_font_size_override("font_size", _get_statement_connection_hint_keycap_font_size())
	key_label.add_theme_constant_override("line_spacing", TOP_MENU_KEYCAP_LINE_SPACING)
	key_label.add_theme_color_override("font_color", DEFAULT_SPEAKER_COLOR)
	_apply_top_menu_text_outline(key_label)
	key_margin.add_child(key_label)


func _apply_statement_connection_hint_keycap_metrics(keycap_offset: MarginContainer) -> void:
	keycap_offset.add_theme_constant_override("margin_top", _get_statement_connection_hint_keycap_y_offset())
	var key_margin := keycap_offset.get_node_or_null("Keycap/Margin") as MarginContainer
	if key_margin != null:
		var keycap_margin_x := _get_statement_connection_hint_keycap_margin_horizontal()
		var keycap_margin_y := _get_statement_connection_hint_keycap_margin_vertical()
		key_margin.add_theme_constant_override("margin_left", keycap_margin_x)
		key_margin.add_theme_constant_override("margin_top", keycap_margin_y)
		key_margin.add_theme_constant_override("margin_right", keycap_margin_x)
		key_margin.add_theme_constant_override("margin_bottom", keycap_margin_y)
	var key_label := keycap_offset.get_node_or_null("Keycap/Margin/KeyLabel") as Label
	if key_label != null:
		key_label.add_theme_font_size_override("font_size", _get_statement_connection_hint_keycap_font_size())


func _get_statement_connection_hint_min_height() -> float:
	return _mobile_scaled_float(STATEMENT_CONNECTION_HINT_MIN_HEIGHT, 68.0)


func _get_statement_connection_hint_separation() -> int:
	return _mobile_scaled_int(STATEMENT_CONNECTION_HINT_SEPARATION, 14)


func _get_statement_connection_hint_margin() -> Vector2:
	return Vector2(
		_mobile_scaled_float(STATEMENT_CONNECTION_HINT_MARGIN.x, 22.0),
		_mobile_scaled_float(STATEMENT_CONNECTION_HINT_MARGIN.y, 14.0)
	)


func _get_statement_connection_hint_icon_height(base_height: int) -> int:
	return _mobile_scaled_int(base_height, maxi(base_height + 8, int(roundf(float(base_height) * 1.28))))


func _get_statement_connection_hint_font_size() -> int:
	return _mobile_scaled_int(STATEMENT_CONNECTION_HINT_FONT_SIZE, 34)


func _get_statement_connection_hint_keycap_font_size() -> int:
	return _mobile_scaled_int(STATEMENT_CONNECTION_HINT_KEYCAP_FONT_SIZE, 22)


func _get_statement_connection_hint_keycap_margin_horizontal() -> int:
	return _mobile_scaled_int(STATEMENT_CONNECTION_HINT_KEYCAP_MARGIN_HORIZONTAL, 11)


func _get_statement_connection_hint_keycap_margin_vertical() -> int:
	return _mobile_scaled_int(STATEMENT_CONNECTION_HINT_KEYCAP_MARGIN_VERTICAL, 3)


func _get_statement_connection_hint_keycap_y_offset() -> int:
	return _mobile_scaled_int(STATEMENT_CONNECTION_HINT_KEYCAP_Y_OFFSET, 4)


func _get_statement_notebook_input_hint_font_size() -> int:
	return _mobile_scaled_int(STATEMENT_NOTE_INPUT_HINT_FONT_SIZE, 32)


func _get_statement_notebook_hint_icon_height(base_height: int) -> int:
	return _mobile_scaled_int(base_height, maxi(base_height + 8, int(roundf(float(base_height) * 1.28))))


func _get_statement_notebook_hint_keycap_font_size() -> int:
	return _mobile_scaled_int(STATEMENT_NOTE_INPUT_HINT_KEYCAP_FONT_SIZE, 21)


func _get_statement_notebook_hint_keycap_margin_horizontal() -> int:
	return _mobile_scaled_int(STATEMENT_NOTE_INPUT_HINT_KEYCAP_MARGIN_HORIZONTAL, 10)


func _get_statement_notebook_hint_keycap_margin_vertical() -> int:
	return _mobile_scaled_int(STATEMENT_CONNECTION_HINT_KEYCAP_MARGIN_VERTICAL, 3)


func _get_statement_notebook_hint_keycap_y_offset() -> int:
	return _mobile_scaled_int(STATEMENT_CONNECTION_HINT_KEYCAP_Y_OFFSET, 4)


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
			_add_statement_notebook_hint_label(_get_statement_notebook_select_hint_text())
			_add_statement_notebook_hint_keycap("Space")
			_add_statement_notebook_hint_separator()
			_add_statement_notebook_hint_label("닫기")
			_add_statement_notebook_hint_keycap("Esc")
		INPUT_MODE_GAMEPAD:
			_add_statement_notebook_hint_icon("xbox_a", _get_statement_notebook_hint_icon_height(STATEMENT_NOTE_INPUT_HINT_ICON_HEIGHT))
			_add_statement_notebook_hint_label(_get_statement_notebook_select_hint_text())
			_add_statement_notebook_hint_separator()
			_add_statement_notebook_hint_icon("xbox_b", _get_statement_notebook_hint_icon_height(STATEMENT_NOTE_INPUT_HINT_ICON_HEIGHT))
			_add_statement_notebook_hint_label("닫기")


func _get_statement_notebook_select_hint_text() -> String:
	match _statement_notebook_mode:
		NOTEBOOK_MODE_PRESENT:
			return "제시"
		NOTEBOOK_MODE_VIEW:
			return "보기"
	return "연결"


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
	keycap_offset.add_theme_constant_override("margin_top", _get_statement_notebook_hint_keycap_y_offset())
	_statement_notebook_input_hint.add_child(keycap_offset)

	var keycap := PanelContainer.new()
	keycap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	keycap.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	keycap.add_theme_stylebox_override("panel", _create_keycap_style())
	keycap_offset.add_child(keycap)

	var key_margin := MarginContainer.new()
	key_margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var keycap_margin_x := _get_statement_notebook_hint_keycap_margin_horizontal()
	var keycap_margin_y := _get_statement_notebook_hint_keycap_margin_vertical()
	key_margin.add_theme_constant_override("margin_left", keycap_margin_x)
	key_margin.add_theme_constant_override("margin_top", keycap_margin_y)
	key_margin.add_theme_constant_override("margin_right", keycap_margin_x)
	key_margin.add_theme_constant_override("margin_bottom", keycap_margin_y)
	keycap.add_child(key_margin)

	var key_label := Label.new()
	key_label.text = text
	key_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	key_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	key_label.add_theme_font_size_override("font_size", _get_statement_notebook_hint_keycap_font_size())
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
				STATEMENT_POINTER_NAV_FONT_SIZE,
				false
			)
			_configure_statement_navigation_button(
				_statement_next_button,
				"",
				"stick_l_right",
				STATEMENT_GAMEPAD_NAV_ICON_HEIGHT,
				STATEMENT_POINTER_NAV_FONT_SIZE,
				false
			)
		_:
			_configure_statement_navigation_button(
				_statement_prev_button,
				"",
				"mui:KeyboardArrowLeftRounded",
				STATEMENT_POINTER_NAV_ICON_HEIGHT,
				STATEMENT_POINTER_NAV_FONT_SIZE,
				mode == "mouse"
			)
			_configure_statement_navigation_button(
				_statement_next_button,
				"",
				"mui:KeyboardArrowRightRounded",
				STATEMENT_POINTER_NAV_ICON_HEIGHT,
				STATEMENT_POINTER_NAV_FONT_SIZE,
				mode == "mouse"
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
	if _dialogue_chain_transitioning or _node_blackout_transitioning:
		return false
	if not _is_statement_presentation() or _statement_note_open or _statement_connection_mode_active or _awaiting_portrait_for_dialogue or _statement_loop_prompt_open:
		return false
	if _statement_title_playing and not ignore_title_lock:
		return false
	if _dialogue_typewriter.is_typing():
		return true
	return _has_statement_forward_target()


func _can_statement_button_advance(ignore_title_lock := false) -> bool:
	if _dialogue_chain_transitioning or _node_blackout_transitioning:
		return false
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
	if _dialogue_chain_transitioning or _node_blackout_transitioning:
		return false
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
	return mode == "mouse"


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
	if _should_ignore_gameplay_event(event):
		return
	if not _uses_statement_dialogue_window():
		return
	if _statement_loop_prompt_open:
		accept_event()
		return
	if _statement_note_open:
		accept_event()
		return

	if event is InputEventMouseMotion:
		var motion_event := event as InputEventMouseMotion
		_sync_statement_hover_from_mouse_position()
		if (motion_event.button_mask & MOUSE_BUTTON_MASK_LEFT) != 0:
			_track_auto_hold_drag(motion_event.position)
		return

	if event is InputEventMouseButton:
		var mouse_event := event as InputEventMouseButton
		if not mouse_event.pressed:
			return
		if mouse_event.button_index == MOUSE_BUTTON_RIGHT:
			accept_event()
		elif mouse_event.button_index == MOUSE_BUTTON_LEFT:
			var clicked_lie_index := _get_statement_lie_index_at_pointer_position(mouse_event.position)
			if _dialogue_typewriter.is_typing() or clicked_lie_index < 0:
				_reveal_statement_dialogue()
				accept_event()
		return


func _on_dialogue_meta_hover_started(meta: Variant) -> void:
	if not is_pointer_hover_enabled():
		_clear_statement_hover_state()
		return
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

	var next_hovered_index := -1
	for pointer_position in pointer_positions:
		next_hovered_index = _get_statement_lie_index_at_pointer_position(pointer_position)
		if next_hovered_index >= 0:
			break

	if next_hovered_index == _statement_hovered_lie_index:
		return
	_statement_hovered_lie_index = next_hovered_index
	_refresh_statement_noise_mode()


func _should_sync_statement_mouse_hover() -> bool:
	if _statement_connection_mode_active:
		return false
	return is_pointer_hover_enabled()


func _clear_statement_hover_state() -> void:
	if _statement_hovered_lie_index < 0:
		return
	_statement_hovered_lie_index = -1
	_refresh_statement_noise_mode()


func _get_statement_lie_index_at_pointer_position(pointer_position: Vector2) -> int:
	if not _is_statement_main_node_active() or _dialogue_text == null:
		return -1
	var to_dialogue_local := _dialogue_text.get_global_transform_with_canvas().affine_inverse()
	var local_pointer: Vector2 = to_dialogue_local * pointer_position
	for index in _statement_lie_ranges.size():
		var lie_range := _statement_lie_ranges[index]
		if not _is_statement_lie_range_visible(lie_range):
			continue
		var local_rects := _compute_dialogue_visible_range_rects(lie_range)
		if local_rects.is_empty():
			continue
		if _is_point_in_any_rect(local_pointer, local_rects):
			return index
	return -1


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
	_statement_notebook_mode = NOTEBOOK_MODE_STATEMENT
	_case_notebook_present_choices.clear()
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


func _open_case_notebook_view() -> void:
	if not _can_open_case_notebook_view() or _statement_notebook_overlay == null:
		_refresh_case_notebook_button_state()
		return
	_open_case_notebook(NOTEBOOK_MODE_VIEW, [])


func _open_case_notebook_present(choices: Array[Dictionary]) -> void:
	if _statement_notebook_overlay == null or _statement_note_open:
		return
	var present_choices := _get_present_choices(choices)
	if present_choices.is_empty() or not VisualNovelData.has_any_acquired_info():
		_render_choices(_current_node.get("choices", []))
		return
	_clear_choices(false)
	_open_case_notebook(NOTEBOOK_MODE_PRESENT, present_choices)


func _open_case_notebook(mode: String, present_choices: Array[Dictionary]) -> void:
	if _dialogue_typewriter.is_typing():
		_dialogue_typewriter.reveal_all()
	_stop_skip_hold()
	_stop_auto_mode()
	_statement_notebook_mode = mode
	_case_notebook_present_choices.clear()
	for choice in present_choices:
		_case_notebook_present_choices.append(choice.duplicate(true))
	_statement_connection_mode_active = false
	_statement_resume_connection_mode_on_note_close = false
	_statement_active_lie_index = -1
	_statement_note_open = true
	_set_statement_phrase_selection_visible(false)
	_ensure_statement_notebook_populated(true)
	_refresh_statement_notebook_header_text()
	_refresh_statement_notebook_input_affordance()
	_prepare_statement_notebook_open_animation()
	_set_floating_ui_visible(false)
	_play_statement_notebook_open_animation()
	_refresh_statement_controls()
	var focus_target := _get_first_statement_notebook_focus_control()
	if focus_target != null and _is_navigation_input_mode_active():
		set_preferred_focus_control(focus_target)
		focus_target.grab_focus()


func _close_case_notebook(return_to_choices := false) -> void:
	var was_note_open := _statement_note_open
	_reset_statement_notebook_pointer_scroll()
	_hide_statement_notebook_overlay_immediate()
	var focus_owner := get_viewport().gui_get_focus_owner()
	if (
		focus_owner != null
		and _statement_notebook_overlay != null
		and _statement_notebook_overlay.is_ancestor_of(focus_owner)
	):
		focus_owner.release_focus()
	_statement_note_open = false
	_statement_notebook_mode = NOTEBOOK_MODE_STATEMENT
	_case_notebook_present_choices.clear()
	_statement_active_lie_index = -1
	_statement_hovered_lie_index = -1
	_set_statement_phrase_selection_visible(false)
	if was_note_open:
		_set_floating_ui_visible(true, true)
	_refresh_statement_controls()
	_refresh_case_notebook_button_state()
	if return_to_choices and _is_investigation_presentation():
		_render_choices(_current_node.get("choices", []))


func _close_statement_notebook(restore_character: bool = true) -> void:
	if _statement_notebook_mode != NOTEBOOK_MODE_STATEMENT:
		_close_case_notebook(restore_character)
		return
	var was_note_open := _statement_note_open
	var resume_connection_mode := (
		restore_character
		and _statement_resume_connection_mode_on_note_close
		and _can_resume_statement_connection_mode_after_note()
	)
	var resume_lie_index := _statement_active_lie_index
	_reset_statement_notebook_pointer_scroll()
	_hide_statement_notebook_overlay_immediate()
	var focus_owner := get_viewport().gui_get_focus_owner()
	if (
		focus_owner != null
		and _statement_notebook_overlay != null
		and _statement_notebook_overlay.is_ancestor_of(focus_owner)
	):
		focus_owner.release_focus()
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
	if was_note_open:
		_set_floating_ui_visible(true, true)
	_refresh_statement_controls()
	_refresh_statement_noise_mode()
	_refresh_case_notebook_button_state()


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
	if _statement_notebook_mode != NOTEBOOK_MODE_STATEMENT:
		return VisualNovelData.get_acquired_characters()
	if _has_statement_notebook_metadata_scope():
		return _get_statement_notebook_scoped_characters()
	if VisualNovelData.has_any_acquired_info():
		return VisualNovelData.get_acquired_characters()
	return VisualNovelData.get_all_characters()


func _get_statement_notebook_items() -> Array:
	if _statement_notebook_mode != NOTEBOOK_MODE_STATEMENT:
		return VisualNovelData.get_acquired_items()
	if _has_statement_notebook_metadata_scope():
		return _get_statement_notebook_scoped_items()
	if VisualNovelData.has_any_acquired_info():
		return VisualNovelData.get_acquired_items()
	return VisualNovelData.get_all_items()


func _has_statement_notebook_metadata_scope() -> bool:
	var raw_scope: Variant = _dialogue_metadata.get(STATEMENT_NOTEBOOK_METADATA_KEY, null)
	return typeof(raw_scope) == TYPE_DICTIONARY


func _get_statement_notebook_scoped_characters() -> Array:
	var result: Array = []
	for id in _get_statement_notebook_scope_ids("characters", "character_ids"):
		if not VisualNovelData.has_character(StringName(id)):
			continue
		if VisualNovelData.is_narrator_character(StringName(id)):
			continue
		result.append(VisualNovelData.get_character(StringName(id)))
	return result


func _get_statement_notebook_scoped_items() -> Array:
	var result: Array = []
	for id in _get_statement_notebook_scope_ids("items", "item_ids"):
		if not VisualNovelData.has_item(StringName(id)):
			continue
		result.append(VisualNovelData.get_item(StringName(id)))
	return result


func _get_statement_notebook_scope_ids(primary_key: String, legacy_key: String) -> Array[String]:
	var ids: Array[String] = []
	var raw_scope: Variant = _dialogue_metadata.get(STATEMENT_NOTEBOOK_METADATA_KEY, {})
	if typeof(raw_scope) != TYPE_DICTIONARY:
		return ids

	var scope: Dictionary = raw_scope
	var raw_ids: Variant = scope.get(primary_key, scope.get(legacy_key, []))
	if typeof(raw_ids) == TYPE_STRING:
		_append_unique_statement_notebook_scope_id(ids, String(raw_ids))
	elif typeof(raw_ids) == TYPE_ARRAY:
		var raw_array: Array = raw_ids
		for raw_id in raw_array:
			_append_unique_statement_notebook_scope_id(ids, String(raw_id))
	return ids


func _append_unique_statement_notebook_scope_id(ids: Array[String], raw_id: String) -> void:
	var id := raw_id.strip_edges()
	if id.is_empty() or ids.has(id):
		return
	ids.append(id)


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
		_get_statement_notebook_content_source_key(),
		_join_statement_notebook_signature_ids(character_ids),
		_join_statement_notebook_signature_ids(item_ids),
	]


func _get_statement_notebook_content_source_key() -> String:
	if _statement_notebook_mode != NOTEBOOK_MODE_STATEMENT:
		return "%s_acquired" % _statement_notebook_mode
	if _has_statement_notebook_metadata_scope():
		return "configured"
	return "acquired" if VisualNovelData.has_any_acquired_info() else "all"


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


func _create_statement_notebook_entry_style(background: Color, border: Color, border_width: int) -> StyleBox:
	return GeneratedUiTheme.asset_button_style("backlog_entry", background, border, border_width, 4, Vector4(0.0, 0.0, 0.0, 0.0))


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


func _create_statement_notebook_thumb_style() -> StyleBox:
	return GeneratedUiTheme.asset_surface_style(
		"backlog_entry",
		Color(0, 0, 0, 0.24),
		Color(STATEMENT_NOTE_BORDER_COLOR.r, STATEMENT_NOTE_BORDER_COLOR.g, STATEMENT_NOTE_BORDER_COLOR.b, 0.32),
		1,
		4,
		3
	)


func _create_statement_notebook_tag_style() -> StyleBox:
	return GeneratedUiTheme.asset_surface_style(
		"options_button",
		Color(STATEMENT_NOTE_ACCENT_COLOR.r, STATEMENT_NOTE_ACCENT_COLOR.g, STATEMENT_NOTE_ACCENT_COLOR.b, 0.08),
		Color(STATEMENT_NOTE_ACCENT_COLOR.r, STATEMENT_NOTE_ACCENT_COLOR.g, STATEMENT_NOTE_ACCENT_COLOR.b, 0.58),
		1,
		3,
		2
	)


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
	return _get_mui_icon(
		"PersonRounded",
		int(roundf(_mobile_scaled_float(STATEMENT_NOTE_CARD_THUMB_SIZE, 96.0) * 0.72)),
		STATEMENT_NOTE_TEXT_COLOR
	)


func _get_statement_notebook_character_profile_thumbnail(profile: Dictionary) -> Texture2D:
	var character_id := String(profile.get("id", "")).strip_edges()
	if character_id.is_empty():
		return null
	var spec := _resolve_character_profile_popup_spec(character_id)
	if spec.is_empty():
		return null
	return _create_statement_notebook_profile_thumbnail(
		spec,
		int(roundf(_mobile_scaled_float(STATEMENT_NOTE_CARD_THUMB_SIZE, 96.0) * 2.0))
	)


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
	return _get_mui_icon(
		"ArticleRounded",
		int(roundf(_mobile_scaled_float(STATEMENT_NOTE_CARD_THUMB_SIZE, 96.0) * 0.66)),
		STATEMENT_NOTE_TEXT_COLOR
	)


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
	if _statement_notebook_mode == NOTEBOOK_MODE_VIEW:
		return
	if _statement_notebook_mode == NOTEBOOK_MODE_PRESENT:
		var choice := _find_case_notebook_present_choice(kind, target_id)
		if choice.is_empty():
			_close_case_notebook(true)
			return
		_close_case_notebook(false)
		_on_choice_pressed(choice)
		return
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


func _clear_talk_choice_character_shift_state() -> void:
	_talk_choice_character_shift_active = false
	_talk_choice_character_shift_speaker_id = ""
	_talk_choice_character_shift_original_state = {}


func _should_shift_talk_speaker_for_choices() -> bool:
	if _character_layer == null or not _uses_talk_menu_flow() or _current_node.is_empty():
		return false
	var speaker_id := _get_talk_choice_speaker_id()
	if speaker_id.is_empty() or _is_narrator_speaker(speaker_id):
		return false
	if _talk_choice_character_shift_active and speaker_id == _talk_choice_character_shift_speaker_id:
		return false
	return _stage_character_slots.has(speaker_id)


func _get_talk_choice_speaker_id() -> String:
	var speaker_id := String(_current_node.get("speaker", "")).strip_edges()
	if speaker_id.is_empty() or _is_narrator_speaker(speaker_id):
		return ""
	return speaker_id


func _shift_talk_speaker_to_left_preset(on_finished: Callable = Callable()) -> void:
	if _talk_choice_character_shift_active or not _should_shift_talk_speaker_for_choices():
		_invoke_portrait_finished(on_finished)
		return

	var speaker_id := _get_talk_choice_speaker_id()
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
	target_state["zoom_percent"] = PortraitLayout.snap_zoom_percent(TALK_CHOICE_SPEAKER_ZOOM)
	target_state["visible"] = true
	_talk_choice_character_shift_active = true
	_talk_choice_character_shift_speaker_id = speaker_id
	_talk_choice_character_shift_original_state = current_state.duplicate(true)
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


func _apply_stage_flags(node: Dictionary, speaker_id: String, is_narrator: bool, respect_delayed_enters := true) -> void:
	_stage_entering_ids.clear()
	var delayed_enter_ids := _get_enter_speaker_ids_from_node_events(node) if respect_delayed_enters else []

	for cast_id in _collect_characters_appearing_on_node(node, speaker_id, is_narrator):
		if _stage_characters.has(cast_id):
			continue
		if cast_id in delayed_enter_ids:
			continue
		_add_stage_character(cast_id)
		_stage_entering_ids[cast_id] = true


func _configure_stage_focus_targets_for_node(node: Dictionary, speaker_id: String, is_narrator: bool) -> void:
	_stage_focus_targets.clear()
	if node.is_empty():
		return

	if _node_has_explicit_stage_focus_targets(node):
		for cast_id in _read_stage_focus_target_ids(node):
			if cast_id.is_empty() or _is_narrator_speaker(cast_id):
				continue
			_stage_focus_targets[cast_id] = true
		return

	if is_narrator or speaker_id.is_empty() or _is_narrator_speaker(speaker_id):
		return
	if _is_protagonist_character(speaker_id):
		return
	_stage_focus_targets[speaker_id] = true


func _node_has_explicit_stage_focus_targets(node: Dictionary) -> bool:
	for key in ["focus_targets", "focus_characters", "spotlight_targets", "attention_targets", "camera_focus_targets"]:
		if node.has(key):
			return true
	return false


func _read_stage_focus_target_ids(node: Dictionary) -> Array:
	for key in ["focus_targets", "focus_characters", "spotlight_targets", "attention_targets", "camera_focus_targets"]:
		if node.has(key):
			return _to_clean_string_array(node.get(key))
	return []


func _is_stage_focus_target(cast_id: String) -> bool:
	return _stage_focus_targets.has(cast_id)


func _get_stage_camera_focus_target_ids() -> Array[String]:
	var ids: Array[String] = []
	var source_ids := _stage_focus_targets.keys() if not _stage_focus_targets.is_empty() else _stage_characters.keys()
	for speaker_id in source_ids:
		var cast_id := String(speaker_id)
		if cast_id.is_empty() or _is_narrator_speaker(cast_id):
			continue
		if not _stage_characters.has(cast_id):
			continue
		if not cast_id in ids:
			ids.append(cast_id)
	return ids


func _is_protagonist_character(character_id: String) -> bool:
	if character_id.is_empty() or not VisualNovelData.has_character(StringName(character_id)):
		return false

	var profile := VisualNovelData.get_character(StringName(character_id))
	for key in ["protagonist", "is_protagonist", "main_character"]:
		if profile.has(key) and _read_variant_bool(profile.get(key), false):
			return true

	var metadata: Variant = profile.get("metadata", {})
	if typeof(metadata) == TYPE_DICTIONARY:
		var metadata_dict: Dictionary = metadata
		for key in ["protagonist", "is_protagonist", "main_character"]:
			if metadata_dict.has(key) and _read_variant_bool(metadata_dict.get(key), false):
				return true
	return false


func _get_enter_speaker_ids_from_node_events(node: Dictionary) -> Array[String]:
	return _get_stage_event_speaker_ids_from_node_events(node, "enter")


func _get_exit_speaker_ids_from_node_events(node: Dictionary) -> Array[String]:
	return _get_stage_event_speaker_ids_from_node_events(node, "exit")


func _get_stage_event_speaker_ids_from_node_events(node: Dictionary, event_tag: String) -> Array[String]:
	var ids: Array[String] = []
	if node.is_empty():
		return ids

	for event in _extract_dialogue_media_events(String(node.get("text", ""))):
		var event_name := String(event.get("name", "")).strip_edges().to_lower()
		if event_name != event_tag:
			continue
		for speaker_id in _get_stage_event_speaker_ids_from_event(event):
			if not speaker_id in ids:
				ids.append(speaker_id)
	return ids


func _get_transition_exit_speaker_ids(next_node: Dictionary) -> Array[String]:
	var ids: Array[String] = []
	for cast_id in _current_node_exit_speaker_ids:
		if _stage_characters.has(cast_id) and not cast_id in ids:
			ids.append(cast_id)
	if not _is_statement_presentation():
		return ids
	if _is_blackout_node(next_node):
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
	_stage_focus_targets.clear()
	_dialogue_spectrum_active = false
	_dialogue_spectrum_speaker_id = ""
	_dialogue_spectrum = null
	_stage_entering_ids.clear()
	_rewind_stage_zoom_state.clear()
	_talk_choice_animation_token += 1
	_clear_talk_choice_character_shift_state()
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
		"mystery": false,
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
	if _talk_choice_character_shift_active and cast_id == _talk_choice_character_shift_speaker_id:
		return TALK_CHOICE_SPEAKER_OPACITY
	if not _is_stage_focus_target(cast_id):
		return STAGE_CAST_OPACITY_UNFOCUSED_DEFAULT
	if cast_entry.has("portrait_opacity"):
		return clampf(float(cast_entry.get("portrait_opacity")), 0.0, 1.0)
	return STAGE_CAST_OPACITY_FOCUSED_DEFAULT


func _resolve_cast_opacity_for_node(cast_id: String) -> float:
	if _current_node.is_empty():
		return STAGE_CAST_OPACITY_UNFOCUSED_DEFAULT
	var cast_entry: Dictionary = {}
	var cast_data: Variant = _current_node.get("stage_cast", {})
	if typeof(cast_data) == TYPE_DICTIONARY and cast_data.has(cast_id):
		var raw_entry: Variant = cast_data[cast_id]
		if typeof(raw_entry) == TYPE_DICTIONARY:
			cast_entry = raw_entry
	return _resolve_cast_portrait_opacity(cast_id, cast_entry)


func _resolve_cast_mystery_for_node(cast_id: String, node: Dictionary = {}) -> bool:
	if cast_id.is_empty() or _is_narrator_speaker(cast_id):
		return false
	var source_node := _current_node if node.is_empty() else node
	var has_cast_entry := false

	var cast_data: Variant = source_node.get("stage_cast", {})
	if typeof(cast_data) == TYPE_DICTIONARY:
		var cast_dict: Dictionary = cast_data
		if cast_dict.has(cast_id):
			has_cast_entry = true
			var raw_entry: Variant = cast_dict[cast_id]
			if typeof(raw_entry) == TYPE_DICTIONARY:
				var cast_entry: Dictionary = raw_entry
				if cast_entry.has("mystery"):
					return bool(cast_entry.get("mystery", false))
				if cast_entry.has("portrait_mystery"):
					return bool(cast_entry.get("portrait_mystery", false))

	if cast_id == String(source_node.get("speaker", "")).strip_edges():
		return _is_node_speaker_mystery(source_node, cast_id)
	if has_cast_entry:
		return false
	if _stage_character_slots.has(cast_id):
		var slot: Dictionary = _stage_character_slots[cast_id]
		return bool(slot.get("mystery", false))
	return false


func _sync_stage_mystery_flags_for_node(node: Dictionary) -> void:
	for speaker_id in _stage_characters.keys():
		var cast_id := String(speaker_id)
		if cast_id.is_empty() or _is_narrator_speaker(cast_id):
			continue
		var slot := _get_character_slot(cast_id)
		_apply_slot_mystery(slot, _resolve_cast_mystery_for_node(cast_id, node))


func _apply_slot_mystery(slot: Dictionary, mystery: bool) -> void:
	slot["mystery"] = mystery
	if slot.has("portrait_opacity"):
		_apply_slot_highlight(slot, float(slot.get("portrait_opacity", 1.0)))


func _get_slot_portrait_modulate(slot: Dictionary, opacity: float) -> Color:
	var modulate := PortraitTransition.opacity_to_modulate(opacity)
	if bool(slot.get("mystery", false)):
		return Color(0, 0, 0, modulate.a)
	return modulate


func _get_slot_portrait_transparent_modulate(slot: Dictionary, opacity: float) -> Color:
	var modulate := _get_slot_portrait_modulate(slot, opacity)
	modulate.a = 0.0
	return modulate


func _refresh_stage_highlights(active_speaker_id: String, all_dim: bool = false, instant: bool = false) -> void:
	for speaker_id in _stage_characters.keys():
		var cid := String(speaker_id)
		if _should_skip_highlight_tween(cid):
			continue
		var slot := _get_character_slot(cid)
		var alpha := STAGE_CAST_OPACITY_UNFOCUSED_DEFAULT if all_dim else _resolve_cast_opacity_for_node(cid)
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
	var modulate := _get_slot_portrait_modulate(slot, opacity)
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
		_apply_slot_mystery(slot, bool(job.get("mystery", false)))
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
	var preserve_zoom := _should_preserve_stage_zoom_for_node(node)
	_sync_stage_mystery_flags_for_node(node)

	if typeof(cast_data) == TYPE_DICTIONARY and not cast_data.is_empty():
		for key in cast_data.keys():
			var cast_id := String(key)
			if not _stage_characters.has(cast_id):
				continue
			var entry: Variant = cast_data[key]
			if typeof(entry) != TYPE_DICTIONARY:
				continue
			var job := _build_cast_animation_job(cast_id, entry, preserve_zoom)
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
			var enter_job := _build_cast_animation_job(cid, entry, preserve_zoom)
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


func _should_preserve_stage_zoom_for_node(node: Dictionary) -> bool:
	var speaker_id := String(node.get("speaker", "")).strip_edges()
	if _is_narrator_speaker(speaker_id):
		return true
	return not _node_has_visible_stage_portrait(node, speaker_id)


func _node_has_visible_stage_portrait(node: Dictionary, speaker_id: String) -> bool:
	if speaker_id.is_empty():
		return false
	var cast_data: Variant = node.get("stage_cast", {})
	if typeof(cast_data) != TYPE_DICTIONARY:
		return false
	var cast: Dictionary = cast_data
	if not cast.has(speaker_id) or typeof(cast[speaker_id]) != TYPE_DICTIONARY:
		return false
	var cast_entry: Dictionary = cast[speaker_id]
	return not String(cast_entry.get("portrait", "")).strip_edges().is_empty()


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
	cast_entry: Dictionary,
	preserve_zoom := false
) -> Dictionary:
	var profile := _get_speaker_profile(cast_id)
	var portrait_key := String(cast_entry.get("portrait", "")).strip_edges()
	var portrait_path := ""
	var texture: Texture2D = null
	var face_center := Vector2(0.5, 0.5)
	if portrait_key.is_empty():
		if not _stage_character_slots.has(cast_id):
			return {}
		var slot := _get_character_slot(cast_id)
		var state: Dictionary = slot.get("state", {})
		if state.is_empty() or not state.get("visible", false):
			return {}
		portrait_path = String(state.get("path", ""))
		face_center = Vector2(state.get("face_center", Vector2(0.5, 0.5)))
		var rect: TextureRect = slot.get("rect")
		if rect != null:
			texture = rect.texture
		if texture == null and not portrait_path.is_empty():
			texture = _load_portrait_texture(portrait_path)
	else:
		var portrait_entry := PortraitLayout.resolve_portrait_entry(profile, portrait_key)
		if portrait_entry.is_empty():
			return {}

		portrait_path = String(portrait_entry.get("path", ""))
		face_center = Vector2(portrait_entry.get("center", Vector2(0.5, 0.5)))
		texture = _load_portrait_texture(portrait_path)
	if texture == null:
		return {}

	var zoom_percent := _resolve_cast_zoom_percent(cast_id, cast_entry, preserve_zoom)

	var position_key := _resolve_cast_position_key(cast_entry)
	var layout_offset := _resolve_cast_layout_offset(cast_id, cast_entry)

	var target_state := PortraitTransition.build_state(
		portrait_path,
		Vector2(texture.get_width(), texture.get_height()),
		face_center,
		float(zoom_percent),
		layout_offset,
		true,
		_resolve_cast_flip_h(cast_entry)
	)
	_apply_cast_focus_visual_state(cast_id, target_state)
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
		"mystery": _resolve_cast_mystery_for_node(cast_id),
		"position_key": position_key,
		"position_order": _resolve_cast_position_order(cast_entry),
		"base_layout_offset": layout_offset,
	}


func _apply_cast_focus_visual_state(cast_id: String, state: Dictionary) -> void:
	state["visual_scale"] = 1.0 if _is_stage_focus_target(cast_id) else STAGE_CAST_UNFOCUSED_VISUAL_SCALE


func _resolve_cast_zoom_percent(cast_id: String, cast_entry: Dictionary, preserve_zoom := false) -> int:
	if cast_entry.has("portrait_zoom"):
		return PortraitLayout.snap_zoom_percent(int(cast_entry.get("portrait_zoom")))

	var node_camera_zoom := _get_node_camera_zoom_percent(_current_node)
	if node_camera_zoom > 0:
		return node_camera_zoom

	if preserve_zoom:
		var preserved_zoom := _get_preserved_stage_zoom_percent(cast_id)
		if preserved_zoom > 0:
			return preserved_zoom

	return PortraitLayout.snap_zoom_percent(PortraitLayout.ZOOM_DEFAULT)


func _get_node_camera_zoom_percent(node: Dictionary) -> int:
	if node.is_empty():
		return -1

	for key in ["camera_zoom_percent", "focus_zoom_percent", "dialogue_zoom_percent"]:
		if node.has(key):
			return _snap_stage_zoom_value(node.get(key))

	var metadata: Variant = node.get("metadata", {})
	if typeof(metadata) == TYPE_DICTIONARY:
		var meta: Dictionary = metadata
		for key in ["camera_zoom_percent", "focus_zoom_percent", "dialogue_zoom_percent"]:
			if meta.has(key):
				return _snap_stage_zoom_value(meta.get(key))

	return -1


func _get_preserved_stage_zoom_percent(cast_id: String) -> int:
	var existing_zoom := _get_existing_stage_zoom_percent(cast_id)
	if existing_zoom > 0:
		return existing_zoom
	if _rewind_stage_zoom_state.has(cast_id):
		return _snap_stage_zoom_value(_rewind_stage_zoom_state[cast_id])
	if _rewind_stage_zoom_state.has(REWIND_NEAREST_DIALOGUE_ZOOM_KEY):
		return _snap_stage_zoom_value(_rewind_stage_zoom_state[REWIND_NEAREST_DIALOGUE_ZOOM_KEY])
	return -1


func _get_existing_stage_zoom_percent(cast_id: String) -> int:
	if cast_id.is_empty() or not _stage_character_slots.has(cast_id):
		return -1
	var slot: Dictionary = _stage_character_slots[cast_id]
	var state: Dictionary = slot.get("state", {})
	if state.is_empty() or not state.has("zoom_percent"):
		return -1
	return _snap_stage_zoom_value(state.get("zoom_percent"))


func _snap_stage_zoom_value(raw_zoom: Variant) -> int:
	return PortraitLayout.snap_zoom_percent(int(round(float(raw_zoom))))


func _resolve_cast_animation_speed(cast_id: String, cast_entry: Dictionary) -> float:
	if cast_entry.has("animation_speed"):
		return PortraitTransition.normalize_animation_speed(cast_entry.get("animation_speed"))
	return PortraitTransition.normalize_animation_speed(STAGE_CAST_ANIMATION_SPEED_DEFAULT)


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
	if not GameSettings.is_dialogue_spectrum_enabled():
		_hide_dialogue_spectrum()
		return

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


func _read_text_sound_bool(value: Variant, default_value := false) -> bool:
	match typeof(value):
		TYPE_BOOL:
			return bool(value)
		TYPE_INT, TYPE_FLOAT:
			return float(value) != 0.0
		TYPE_STRING:
			var text := String(value).strip_edges().to_lower()
			if text in ["true", "1", "yes", "on"]:
				return true
			if text in ["false", "0", "no", "off"]:
				return false
	return default_value


func _is_node_text_sound_muted(node: Dictionary) -> bool:
	for key in [
		DIALOGUE_TEXT_SOUND_MUTED_METADATA_KEY,
		"typewriter_sound_muted",
		"dialogue_text_sound_muted",
	]:
		if node.has(key):
			return _read_text_sound_bool(node.get(key), false)

	var metadata: Variant = node.get("metadata", {})
	if typeof(metadata) == TYPE_DICTIONARY:
		var meta: Dictionary = metadata
		for key in [
			DIALOGUE_TEXT_SOUND_MUTED_METADATA_KEY,
			"typewriter_sound_muted",
			"dialogue_text_sound_muted",
		]:
			if meta.has(key):
				return _read_text_sound_bool(meta.get(key), false)

	return false


func _reset_dialogue_text_sound_state() -> void:
	_text_sound_last_visible_count = 0
	_text_sound_last_played_msec = 0
	_text_sound_player_index = 0


func _load_dialogue_text_sound_stream() -> bool:
	if _text_sound_stream != null:
		return true
	_text_sound_stream = load(DIALOGUE_TEXT_SOUND_PATH) as AudioStream
	if _text_sound_stream == null:
		return false
	_set_audio_stream_loop(_text_sound_stream, false)
	for player in _text_sound_players:
		if player != null:
			player.stream = _text_sound_stream
	return true


func _stop_dialogue_text_sound() -> void:
	for player in _text_sound_players:
		if player != null:
			player.stop()


func _maybe_play_dialogue_text_sound(visible_count: int, total_count: int) -> void:
	var previous_count := _text_sound_last_visible_count
	_text_sound_last_visible_count = maxi(visible_count, 0)
	if _text_sound_muted_for_current_node or not GameSettings.is_dialogue_text_sound_enabled():
		return
	if total_count <= 0 or visible_count <= previous_count:
		return

	var visible_step := visible_count - previous_count
	if visible_step > DIALOGUE_TEXT_SOUND_MAX_VISIBLE_STEP:
		return
	if _text_sound_players.is_empty() or not _load_dialogue_text_sound_stream():
		return

	var now_msec := Time.get_ticks_msec()
	var min_interval_msec := GameSettings.get_dialogue_text_sound_interval_msec(DIALOGUE_TEXT_SOUND_MIN_INTERVAL_MSEC)
	if _text_sound_last_played_msec > 0 and now_msec - _text_sound_last_played_msec < min_interval_msec:
		return

	_text_sound_last_played_msec = now_msec
	var player := _text_sound_players[_text_sound_player_index % _text_sound_players.size()]
	_text_sound_player_index = (_text_sound_player_index + 1) % _text_sound_players.size()
	if player == null:
		return
	player.stream = _text_sound_stream
	player.volume_db = _get_text_sound_volume_db()
	player.play()


func _on_dialogue_event_reached(event: Dictionary) -> void:
	var event_name := String(event.get("name", "")).strip_edges().to_lower()
	match event_name:
		"sfx", "sound", "se":
			_play_sfx_from_event(event)
		"bgm", "music":
			_play_bgm_from_event(event)
		"bgm_stop", "music_stop":
			_stop_bgm_from_event(event)
		"bgm_volume", "music_volume":
			_set_bgm_volume_from_event(event)
		"bg", "background":
			_apply_background_event(event)
		"bg_clear", "background_clear", "bg_remove", "background_remove":
			_clear_background_image_from_event(event)
		"auto_next", "auto_advance", "advance":
			_schedule_auto_advance_from_event(event)
		"enter":
			_record_stage_enter_from_event(event)
		"exit":
			_record_stage_exit_from_event(event)


func _record_stage_enter_from_event(event: Dictionary) -> void:
	var changed := false
	for speaker_id in _get_stage_event_speaker_ids_from_event(event):
		if _stage_characters.has(speaker_id):
			continue
		if not _current_node_has_stage_cast_portrait(speaker_id):
			continue
		_add_stage_character(speaker_id)
		_stage_entering_ids[speaker_id] = true
		changed = true
	if changed:
		_play_stage_cast_animations(_current_node)


func _record_stage_exit_from_event(event: Dictionary) -> void:
	for speaker_id in _get_stage_event_speaker_ids_from_event(event):
		if not _stage_characters.has(speaker_id):
			continue
		if not speaker_id in _current_node_exit_speaker_ids:
			_current_node_exit_speaker_ids.append(speaker_id)


func _get_stage_event_speaker_ids_from_event(event: Dictionary) -> Array[String]:
	var ids: Array[String] = []
	for key in ["id", "ids", "character", "characters", "character_id", "character_ids", "speaker", "speaker_id", "target", "targets"]:
		_append_stage_event_speaker_ids(ids, _get_dialogue_event_string(event, [key], ""))

	return ids


func _append_stage_event_speaker_ids(ids: Array[String], raw_text: String) -> void:
	var clean_text := raw_text.strip_edges()
	if clean_text.is_empty():
		return
	for token in clean_text.replace(",", " ").replace(";", " ").split(" ", false):
		var speaker_id := String(token).strip_edges()
		if speaker_id.is_empty() or _is_narrator_speaker(speaker_id):
			continue
		if not speaker_id in ids:
			ids.append(speaker_id)


func _current_node_has_stage_cast_portrait(speaker_id: String) -> bool:
	if speaker_id.is_empty() or _is_narrator_speaker(speaker_id):
		return false
	var cast_data: Variant = _current_node.get("stage_cast", {})
	if typeof(cast_data) != TYPE_DICTIONARY:
		return false
	var cast: Dictionary = cast_data
	if not cast.has(speaker_id):
		return false
	var raw_entry: Variant = cast[speaker_id]
	if typeof(raw_entry) != TYPE_DICTIONARY:
		return false
	var entry: Dictionary = raw_entry
	return not String(entry.get("portrait", "")).strip_edges().is_empty()


func _cancel_pending_auto_advance() -> void:
	_auto_advance_token += 1
	_auto_mode_advance_scheduled = false


func _schedule_auto_advance_from_event(event: Dictionary) -> void:
	if _current_node_id.strip_edges().is_empty():
		return

	var delay := maxf(
		_get_dialogue_event_float(
			event,
			["delay", "wait", "duration", "time"],
			AUTO_ADVANCE_DEFAULT_DELAY
		),
		0.0
	)
	_schedule_auto_advance(delay, _current_node_id, true, false)


func _schedule_auto_advance(delay: float, node_id: String, interrupt_typing: bool, auto_mode_step: bool) -> void:
	_auto_advance_token += 1
	var token := _auto_advance_token
	_auto_mode_advance_scheduled = auto_mode_step
	if delay <= 0.0:
		call_deferred("_perform_scheduled_auto_advance", token, node_id, interrupt_typing, auto_mode_step)
		return

	var timer := get_tree().create_timer(delay)
	timer.timeout.connect(func() -> void:
		_perform_scheduled_auto_advance(token, node_id, interrupt_typing, auto_mode_step)
	)


func _perform_scheduled_auto_advance(token: int, node_id: String, interrupt_typing: bool, auto_mode_step: bool) -> void:
	if token != _auto_advance_token:
		return
	if node_id != _current_node_id:
		return
	if auto_mode_step:
		_auto_mode_advance_scheduled = false
		if not _is_auto_mode_active():
			return
		if _dialogue_typewriter.is_typing():
			return
	if _is_statement_presentation():
		if not _can_statement_button_advance():
			return
		_auto_advance_token += 1
		_advance_statement_forward(true)
		return
	if not _can_advance_dialogue():
		return

	_auto_advance_token += 1
	if _dialogue_typewriter.is_typing():
		if not interrupt_typing:
			return
		_dialogue_typewriter.cancel()
		_hide_dialogue_spectrum()
		if not _skip_hold_active:
			set_process(false)
	_advance_dialogue()


func _play_sfx_from_event(event: Dictionary) -> void:
	var asset := _get_story_asset_from_event(event, "sfx")
	var audio_path := _resolve_story_asset_path(event, asset)
	if audio_path.is_empty():
		return
	var stream := load(audio_path) as AudioStream
	if stream == null:
		return

	var player := AudioStreamPlayer.new()
	player.name = "DialogueSfxPlayer"
	player.stream = stream
	var base_volume_db := _get_dialogue_event_volume_db(event, _get_story_asset_volume_db(asset, 0.0))
	player.set_meta("base_volume_db", base_volume_db)
	player.volume_db = _get_se_playback_volume_db(base_volume_db)
	add_child(player)
	_sfx_players.append(player)
	player.finished.connect(func() -> void:
		_dispose_sfx_player(player)
	, CONNECT_ONE_SHOT)
	player.play()


func _dispose_sfx_player(player: AudioStreamPlayer) -> void:
	if player == null:
		return
	_sfx_players.erase(player)
	player.queue_free()


func _stop_all_sfx() -> void:
	for player in _sfx_players.duplicate():
		if player != null:
			player.stop()
			player.queue_free()
	_sfx_players.clear()


func _play_bgm_from_event(event: Dictionary, immediate := false) -> void:
	if _bgm_player == null:
		return
	var asset := _get_story_asset_from_event(event, "bgm")
	var audio_path := _resolve_story_asset_path(event, asset)
	if audio_path.is_empty():
		return
	var stream := load(audio_path) as AudioStream
	if stream == null:
		return

	var base_volume_db := _get_story_asset_volume_db(asset, 0.0)
	_current_bgm_base_volume_db = base_volume_db
	var target_content_volume_db := _get_bgm_start_volume_db(event, base_volume_db)
	_current_bgm_content_volume_db = target_content_volume_db
	var target_volume_db := _get_bgm_playback_volume_db(target_content_volume_db)
	_set_audio_stream_loop(stream, true)
	_kill_bgm_tween()
	_bgm_player.stop()
	_bgm_player.stream = stream
	_bgm_player.volume_db = target_volume_db

	var fade_duration := 0.0 if immediate else _get_dialogue_event_duration(event, 0.0)
	if fade_duration <= 0.0 or _get_dialogue_event_string(event, ["transition"], "fade") == "none":
		_bgm_player.play()
		return

	_bgm_player.volume_db = -80.0
	_bgm_player.play()
	_bgm_tween = create_tween()
	_bgm_tween.tween_property(_bgm_player, "volume_db", target_volume_db, fade_duration)
	_bgm_tween.finished.connect(func() -> void:
		_bgm_tween = null
	, CONNECT_ONE_SHOT)


func _stop_bgm_from_event(event: Dictionary) -> void:
	_stop_bgm(_get_dialogue_event_duration(event, 0.0))


func _set_bgm_volume_from_event(event: Dictionary) -> void:
	if _bgm_player == null or _bgm_player.stream == null:
		return

	var asset := _get_story_asset_from_event(event, "bgm")
	var base_volume_db := _get_story_asset_volume_db(asset, _current_bgm_base_volume_db)
	var target_content_volume_db := _get_bgm_volume_event_volume_db(event, base_volume_db, _current_bgm_content_volume_db)
	_current_bgm_content_volume_db = target_content_volume_db
	var target_volume_db := _get_bgm_playback_volume_db(target_content_volume_db)
	var fade_duration := _get_dialogue_event_duration(event, 0.0)
	_kill_bgm_tween()
	if fade_duration <= 0.0 or not _bgm_player.playing or _get_dialogue_event_string(event, ["transition"], "fade") == "none":
		_bgm_player.volume_db = target_volume_db
		return

	_bgm_tween = create_tween()
	_bgm_tween.tween_property(_bgm_player, "volume_db", target_volume_db, fade_duration)
	_bgm_tween.finished.connect(func() -> void:
		_bgm_tween = null
	, CONNECT_ONE_SHOT)


func _stop_bgm(fade_duration := 0.0) -> void:
	if _bgm_player == null:
		return
	_kill_bgm_tween()
	if fade_duration <= 0.0 or not _bgm_player.playing:
		_bgm_player.stop()
		_bgm_player.stream = null
		_bgm_player.volume_db = 0.0
		_current_bgm_base_volume_db = 0.0
		_current_bgm_content_volume_db = 0.0
		return

	_bgm_tween = create_tween()
	_bgm_tween.tween_property(_bgm_player, "volume_db", -80.0, fade_duration)
	_bgm_tween.finished.connect(func() -> void:
		if _bgm_player != null:
			_bgm_player.stop()
			_bgm_player.stream = null
			_bgm_player.volume_db = 0.0
		_current_bgm_base_volume_db = 0.0
		_current_bgm_content_volume_db = 0.0
		_bgm_tween = null
	, CONNECT_ONE_SHOT)


func _kill_bgm_tween() -> void:
	if _bgm_tween != null:
		_bgm_tween.kill()
		_bgm_tween = null


func _apply_background_event(event: Dictionary, immediate := false) -> void:
	var action := _get_dialogue_event_string(event, ["action", "mode"], "").to_lower()
	if action in ["clear", "remove", "hide", "stop", "off"]:
		if immediate:
			_clear_background_image()
		else:
			_clear_background_image_from_event(event)
		return

	if not GameSettings.is_background_image_enabled():
		if immediate:
			_clear_background_image()
		else:
			_clear_background_image_from_event(event)
		return

	var asset := _get_story_asset_from_event(event, "background")
	var image_path := _resolve_story_asset_path(event, asset)
	if image_path.is_empty():
		return
	var texture := load(image_path) as Texture2D
	if texture == null:
		return
	_show_background_image(texture, image_path, event, _is_background_image_fixed(event, asset), immediate)


func _show_background_image(texture: Texture2D, image_path: String, event: Dictionary, fixed: bool, immediate := false) -> void:
	if _background_layer == null:
		return

	_kill_background_image_tween()
	var previous_rect := _background_image_rect
	var filter_settings := _get_background_filter_settings(event)
	var display_texture := _get_background_display_texture(texture, image_path, filter_settings)
	if previous_rect != null and image_path == _background_image_path:
		_transition_existing_background_image(display_texture, image_path, event, fixed, immediate)
		return

	var next_rect := _create_background_image_rect(display_texture)
	_background_image_rect = next_rect
	_background_image_path = image_path
	_background_image_fixed = fixed
	_background_image_zoom = _get_background_image_zoom(event)
	_background_image_focus = _get_background_image_focus(event)
	_sync_background_image_parallax(_get_stage_parallax_metrics(), immediate or previous_rect == null)

	var opacity := clampf(_get_dialogue_event_float(event, ["opacity", "alpha"], BACKGROUND_IMAGE_OPACITY_DEFAULT), 0.0, 1.0)
	var dim_opacity := _get_background_dim_opacity(event)
	var transition := "none" if immediate else _get_dialogue_event_string(event, ["transition"], "fade").to_lower()
	var duration := 0.0 if immediate else _get_dialogue_event_duration(event, 0.35)
	if transition == "none" or duration <= 0.0:
		if previous_rect != null:
			previous_rect.queue_free()
		next_rect.modulate.a = opacity
		_set_background_dim_opacity(dim_opacity)
		return

	next_rect.modulate.a = 0.0
	var dim_rect := _ensure_background_dim_rect()
	dim_rect.visible = true
	_background_image_tween = create_tween()
	_background_image_tween.set_parallel(true)
	_background_image_tween.set_ease(Tween.EASE_IN_OUT)
	_background_image_tween.set_trans(Tween.TRANS_SINE)
	_background_image_tween.tween_property(next_rect, "modulate:a", opacity, duration)
	_background_image_tween.tween_property(dim_rect, "modulate:a", dim_opacity, duration)
	if previous_rect != null:
		_background_image_tween.tween_property(previous_rect, "modulate:a", 0.0, duration)
	_background_image_tween.finished.connect(func() -> void:
		if previous_rect != null:
			previous_rect.queue_free()
		if _background_dim_rect != null:
			_background_dim_rect.visible = _background_dim_rect.modulate.a > 0.001
		_background_image_tween = null
	, CONNECT_ONE_SHOT)


func _transition_existing_background_image(display_texture: Texture2D, image_path: String, event: Dictionary, fixed: bool, immediate := false) -> void:
	var current_rect := _background_image_rect
	if current_rect == null:
		return

	_background_image_path = image_path
	_background_image_fixed = fixed
	_background_image_zoom = _get_background_image_zoom(event)
	_background_image_focus = _get_background_image_focus(event)
	_sync_background_image_parallax(_get_stage_parallax_metrics(), immediate)

	var opacity := clampf(_get_dialogue_event_float(event, ["opacity", "alpha"], BACKGROUND_IMAGE_OPACITY_DEFAULT), 0.0, 1.0)
	var dim_opacity := _get_background_dim_opacity(event)
	var transition := "none" if immediate else _get_dialogue_event_string(event, ["transition"], "fade").to_lower()
	var duration := 0.0 if immediate else _get_dialogue_event_duration(event, 0.35)
	if transition == "none" or duration <= 0.0:
		current_rect.texture = display_texture
		current_rect.modulate.a = opacity
		_set_background_dim_opacity(dim_opacity)
		return

	if current_rect.texture == display_texture:
		var current_dim_rect := _ensure_background_dim_rect()
		current_dim_rect.visible = true
		_background_image_tween = create_tween()
		_background_image_tween.set_parallel(true)
		_background_image_tween.set_ease(Tween.EASE_IN_OUT)
		_background_image_tween.set_trans(Tween.TRANS_SINE)
		_background_image_tween.tween_property(current_rect, "modulate:a", opacity, duration)
		_background_image_tween.tween_property(current_dim_rect, "modulate:a", dim_opacity, duration)
		_background_image_tween.finished.connect(func() -> void:
			if _background_dim_rect != null:
				_background_dim_rect.visible = _background_dim_rect.modulate.a > 0.001
			_background_image_tween = null
		, CONNECT_ONE_SHOT)
		return

	var overlay_rect := _create_background_image_rect(display_texture)
	overlay_rect.name = "BackgroundImageTransition"
	overlay_rect.modulate.a = 0.0
	_sync_background_image_parallax(_get_stage_parallax_metrics(), false)

	var dim_rect := _ensure_background_dim_rect()
	dim_rect.visible = true
	_background_image_tween = create_tween()
	_background_image_tween.set_parallel(true)
	_background_image_tween.set_ease(Tween.EASE_IN_OUT)
	_background_image_tween.set_trans(Tween.TRANS_SINE)
	var start_opacity := clampf(current_rect.modulate.a, 0.0, 1.0)
	var update_blend_alpha := func(progress: float) -> void:
		var clean_progress := clampf(progress, 0.0, 1.0)
		var overlay_alpha := opacity * clean_progress
		var current_alpha := 0.0
		if clean_progress < 0.999:
			current_alpha = start_opacity * (1.0 - clean_progress) / maxf(1.0 - overlay_alpha, 0.001)
		current_rect.modulate.a = clampf(current_alpha, 0.0, 1.0)
		overlay_rect.modulate.a = clampf(overlay_alpha, 0.0, 1.0)
	_background_image_tween.tween_method(update_blend_alpha, 0.0, 1.0, duration)
	_background_image_tween.tween_property(dim_rect, "modulate:a", dim_opacity, duration)
	_background_image_tween.finished.connect(func() -> void:
		current_rect.texture = display_texture
		current_rect.modulate.a = opacity
		overlay_rect.queue_free()
		if _background_dim_rect != null:
			_background_dim_rect.visible = _background_dim_rect.modulate.a > 0.001
		_background_image_tween = null
	, CONNECT_ONE_SHOT)


func _create_background_image_rect(texture: Texture2D) -> TextureRect:
	var rect := TextureRect.new()
	rect.name = "BackgroundImage"
	rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	rect.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	rect.stretch_mode = TextureRect.STRETCH_SCALE
	rect.texture = texture
	rect.modulate.a = 1.0
	_background_layer.add_child(rect)
	_ensure_background_dim_rect().move_to_front()
	return rect


func _clear_background_image_from_event(event: Dictionary) -> void:
	var transition := _get_dialogue_event_string(event, ["transition"], "fade").to_lower()
	_clear_background_image(_get_dialogue_event_duration(event, 0.35), transition)


func _clear_background_image(duration := 0.0, transition := "none") -> void:
	_kill_background_image_tween()
	var rect := _background_image_rect
	_background_image_rect = null
	_background_image_path = ""
	_background_image_fixed = false
	_background_image_zoom = 1.0
	_background_image_focus = Vector2(0.5, 0.5)
	_background_parallax_target_offset = Vector2.ZERO
	_background_parallax_offset = Vector2.ZERO
	if rect == null:
		_set_background_dim_opacity(0.0)
		return

	if transition == "none" or duration <= 0.0:
		rect.queue_free()
		_set_background_dim_opacity(0.0)
		return

	_background_image_tween = create_tween()
	_background_image_tween.set_parallel(true)
	_background_image_tween.set_ease(Tween.EASE_IN_OUT)
	_background_image_tween.set_trans(Tween.TRANS_SINE)
	_background_image_tween.tween_property(rect, "modulate:a", 0.0, duration)
	if _background_dim_rect != null:
		_background_image_tween.tween_property(_background_dim_rect, "modulate:a", 0.0, duration)
	_background_image_tween.finished.connect(func() -> void:
		rect.queue_free()
		if _background_dim_rect != null:
			_background_dim_rect.visible = false
		_background_image_tween = null
	, CONNECT_ONE_SHOT)


func _kill_background_image_tween() -> void:
	if _background_image_tween != null:
		_background_image_tween.kill()
		_background_image_tween = null
	if _background_layer == null:
		return
	for child in _background_layer.get_children():
		if child != _background_image_rect and child != _background_dim_rect:
			child.queue_free()


func _ensure_background_dim_rect() -> ColorRect:
	if _background_dim_rect != null and is_instance_valid(_background_dim_rect):
		if _background_dim_rect.get_parent() != null and _background_dim_rect.get_parent() == _background_layer:
			_background_dim_rect.move_to_front()
		return _background_dim_rect

	_background_dim_rect = ColorRect.new()
	_background_dim_rect.name = "BackgroundDim"
	_background_dim_rect.color = Color(0, 0, 0, 1)
	_background_dim_rect.modulate.a = 0.0
	_background_dim_rect.visible = false
	_background_dim_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_background_dim_rect.set_anchors_preset(Control.PRESET_FULL_RECT)
	if _background_layer != null:
		_background_layer.add_child(_background_dim_rect)
	return _background_dim_rect


func _set_background_dim_opacity(opacity: float) -> void:
	var dim_rect := _ensure_background_dim_rect()
	var clean_opacity := clampf(opacity, 0.0, 1.0)
	dim_rect.modulate.a = clean_opacity
	dim_rect.visible = clean_opacity > 0.001


func _get_background_dim_opacity(event: Dictionary) -> float:
	var raw_dim := _get_dialogue_event_string(
		event,
		["dim", "darkness", "darken", "overlay", "overlay_opacity", "black_overlay"],
		""
	)
	if raw_dim.is_empty():
		return BACKGROUND_DIM_OPACITY_DEFAULT
	return _parse_dialogue_event_ratio(raw_dim, BACKGROUND_DIM_OPACITY_DEFAULT)


func _get_background_image_zoom(event: Dictionary) -> float:
	return clampf(
		_get_dialogue_event_float(event, ["zoom", "scale", "background_zoom"], 1.0),
		1.0,
		6.0
	)


func _get_background_image_focus(event: Dictionary) -> Vector2:
	return Vector2(
		clampf(_get_dialogue_event_float(event, ["x", "focus_x", "center_x", "offset_x"], 0.5), 0.0, 1.0),
		clampf(_get_dialogue_event_float(event, ["y", "focus_y", "center_y", "offset_y"], 0.5), 0.0, 1.0)
	)


func _is_background_image_fixed(event: Dictionary, asset: Dictionary) -> bool:
	var fixed := _get_background_asset_fixed(asset)
	if _has_dialogue_event_value(event, ["fixed", "background_fixed", "static", "locked"]):
		return _get_dialogue_event_bool(event, ["fixed", "background_fixed", "static", "locked"], fixed)
	if _has_dialogue_event_value(event, ["parallax", "parallax_enabled", "floating"]):
		return not _get_dialogue_event_bool(event, ["parallax", "parallax_enabled", "floating"], not fixed)
	return fixed


func _get_background_asset_fixed(asset: Dictionary) -> bool:
	if asset.is_empty():
		return false

	for key in ["fixed", "background_fixed", "static", "locked"]:
		if asset.has(key):
			return _read_variant_bool(asset.get(key), false)

	for key in ["parallax", "parallax_enabled", "floating"]:
		if asset.has(key):
			return not _read_variant_bool(asset.get(key), true)

	var raw_metadata: Variant = asset.get("metadata", {})
	if typeof(raw_metadata) == TYPE_DICTIONARY:
		var metadata: Dictionary = raw_metadata
		for key in ["fixed", "background_fixed", "static", "locked"]:
			if metadata.has(key):
				return _read_variant_bool(metadata.get(key), false)
		for key in ["parallax", "parallax_enabled", "floating"]:
			if metadata.has(key):
				return not _read_variant_bool(metadata.get(key), true)

	return false


func _get_background_filter_settings(event: Dictionary) -> Dictionary:
	return {
		"blur": _get_dialogue_event_pixel_float(
			event,
			["blur", "blur_px", "background_blur", "filter_blur"],
			BACKGROUND_FILTER_BLUR_DEFAULT,
			12.0
		),
		"brightness": _get_dialogue_event_factor(
			event,
			["brightness", "bright", "filter_brightness"],
			BACKGROUND_FILTER_BRIGHTNESS_DEFAULT,
			2.0
		),
		"saturation": _get_dialogue_event_factor(
			event,
			["saturate", "saturation", "filter_saturate", "filter_saturation"],
			BACKGROUND_FILTER_SATURATION_DEFAULT,
			2.0
		),
	}


func _get_background_display_texture(source_texture: Texture2D, image_path: String, settings: Dictionary) -> Texture2D:
	if source_texture == null:
		return null

	var blur := float(settings.get("blur", BACKGROUND_FILTER_BLUR_DEFAULT))
	var brightness := float(settings.get("brightness", BACKGROUND_FILTER_BRIGHTNESS_DEFAULT))
	var saturation := float(settings.get("saturation", BACKGROUND_FILTER_SATURATION_DEFAULT))
	if blur <= 0.001 and is_equal_approx(brightness, 1.0) and is_equal_approx(saturation, 1.0):
		return source_texture

	var cache_key := "%s|blur=%.3f|brightness=%.3f|saturation=%.3f" % [
		image_path,
		blur,
		brightness,
		saturation,
	]
	if _background_texture_filter_cache.has(cache_key):
		return _background_texture_filter_cache[cache_key] as Texture2D

	var image := source_texture.get_image()
	if image == null:
		return source_texture
	image = image.duplicate()
	image.convert(Image.FORMAT_RGBA8)

	var original_width := image.get_width()
	var original_height := image.get_height()
	if original_width <= 0 or original_height <= 0:
		return source_texture

	if blur > 0.001:
		var blur_scale := clampf(1.0 / (1.0 + blur * 0.45), 0.12, 1.0)
		var blurred_width := maxi(1, int(round(float(original_width) * blur_scale)))
		var blurred_height := maxi(1, int(round(float(original_height) * blur_scale)))
		if blurred_width != original_width or blurred_height != original_height:
			image.resize(blurred_width, blurred_height, Image.INTERPOLATE_LANCZOS)

	if not is_equal_approx(brightness, 1.0) or not is_equal_approx(saturation, 1.0):
		_apply_background_image_color_filter(image, brightness, saturation)

	if blur > 0.001 and (image.get_width() != original_width or image.get_height() != original_height):
		image.resize(original_width, original_height, Image.INTERPOLATE_LANCZOS)

	var filtered_texture := ImageTexture.create_from_image(image)
	_background_texture_filter_cache[cache_key] = filtered_texture
	return filtered_texture


func _apply_background_image_color_filter(image: Image, brightness: float, saturation: float) -> void:
	image.adjust_bcs(brightness, 1.0, saturation)


func _get_story_asset_from_event(event: Dictionary, expected_kind := "") -> Dictionary:
	var asset_id := _get_dialogue_event_string(event, ["id", "asset", "asset_id", "story_asset"], "")
	var asset := _get_story_asset_by_id(asset_id)
	if asset.is_empty():
		asset = _get_story_asset_by_path(_get_dialogue_event_string(event, ["path", "audio", "image", "file", "src"], ""))

	var kind := String(asset.get("kind", "")).strip_edges().to_lower()
	if not expected_kind.is_empty() and kind != expected_kind:
		return {}
	return asset


func _get_story_asset_by_id(asset_id: String) -> Dictionary:
	var clean_asset_id := asset_id.strip_edges()
	if clean_asset_id.is_empty():
		return {}
	if not VisualNovelData.has_method("get_story_asset"):
		return {}

	var raw_asset: Variant = VisualNovelData.call("get_story_asset", StringName(clean_asset_id))
	if typeof(raw_asset) != TYPE_DICTIONARY:
		return {}
	return raw_asset as Dictionary


func _get_story_asset_by_path(raw_path: String) -> Dictionary:
	var clean_path := _normalize_resource_path(raw_path)
	if clean_path.is_empty():
		return {}
	if not VisualNovelData.has_method("get_all_story_assets"):
		return {}

	var raw_assets: Variant = VisualNovelData.call("get_all_story_assets")
	if typeof(raw_assets) != TYPE_ARRAY:
		return {}
	for raw_asset in raw_assets as Array:
		if typeof(raw_asset) != TYPE_DICTIONARY:
			continue
		var asset: Dictionary = raw_asset
		if _normalize_resource_path(String(asset.get("path", ""))) == clean_path:
			return asset
	return {}


func _resolve_story_asset_path(event: Dictionary, asset: Dictionary) -> String:
	var raw_path := _get_dialogue_event_string(event, ["path", "audio", "image", "file", "src"], "")
	if raw_path.is_empty() and not asset.is_empty():
		raw_path = String(asset.get("path", "")).strip_edges()
	return _normalize_resource_path(raw_path)


func _get_story_asset_volume_db(asset: Dictionary, default_value := 0.0) -> float:
	if asset.is_empty():
		return default_value
	if asset.has("volume_db"):
		return float(asset.get("volume_db", default_value))
	if asset.has("volume"):
		var volume := float(asset.get("volume", 1.0))
		if volume >= 0.0 and volume <= 1.0:
			return linear_to_db(maxf(volume, 0.0001))
		return volume
	return default_value


func _get_dialogue_event_attributes(event: Dictionary) -> Dictionary:
	var raw_attrs: Variant = event.get("attributes", {})
	if typeof(raw_attrs) == TYPE_DICTIONARY:
		return raw_attrs
	return {}


func _get_dialogue_event_string(event: Dictionary, keys: Array, default_value := "") -> String:
	var attrs := _get_dialogue_event_attributes(event)
	for raw_key in keys:
		var key := String(raw_key)
		if attrs.has(key):
			return String(attrs[key]).strip_edges()
		if event.has(key):
			return String(event[key]).strip_edges()
	return default_value


func _has_dialogue_event_value(event: Dictionary, keys: Array) -> bool:
	var attrs := _get_dialogue_event_attributes(event)
	for raw_key in keys:
		var key := String(raw_key)
		if attrs.has(key) or event.has(key):
			return true
	return false


func _get_dialogue_event_bool(event: Dictionary, keys: Array, default_value := false, empty_value := true) -> bool:
	var attrs := _get_dialogue_event_attributes(event)
	for raw_key in keys:
		var key := String(raw_key)
		if attrs.has(key):
			var attr_value: Variant = attrs[key]
			if typeof(attr_value) == TYPE_STRING and String(attr_value).strip_edges().is_empty():
				return empty_value
			return _read_variant_bool(attr_value, default_value)
		if event.has(key):
			var event_value: Variant = event[key]
			if typeof(event_value) == TYPE_STRING and String(event_value).strip_edges().is_empty():
				return empty_value
			return _read_variant_bool(event_value, default_value)
	return default_value


func _get_dialogue_event_float(event: Dictionary, keys: Array, default_value := 0.0) -> float:
	var raw_value := _get_dialogue_event_string(event, keys, "")
	if raw_value.is_empty() or not _is_numeric_text(raw_value):
		return default_value
	return float(raw_value)


func _get_dialogue_event_pixel_float(event: Dictionary, keys: Array, default_value: float, max_value: float) -> float:
	var raw_value := _get_dialogue_event_string(event, keys, "")
	if raw_value.is_empty():
		return clampf(default_value, 0.0, max_value)
	return _parse_dialogue_event_pixel_float(raw_value, default_value, max_value)


func _get_dialogue_event_factor(event: Dictionary, keys: Array, default_value: float, max_value: float) -> float:
	var raw_value := _get_dialogue_event_string(event, keys, "")
	if raw_value.is_empty():
		return clampf(default_value, 0.0, max_value)
	return _parse_dialogue_event_factor(raw_value, default_value, max_value)


func _parse_dialogue_event_ratio(raw_value: String, default_value: float) -> float:
	var clean_value := raw_value.strip_edges()
	if clean_value.is_empty():
		return clampf(default_value, 0.0, 1.0)

	var is_percent := clean_value.ends_with("%")
	if is_percent:
		clean_value = clean_value.trim_suffix("%").strip_edges()
	if not _is_numeric_text(clean_value):
		return clampf(default_value, 0.0, 1.0)

	var value := float(clean_value)
	if is_percent or value > 1.0:
		value *= 0.01
	return clampf(value, 0.0, 1.0)


func _parse_dialogue_event_pixel_float(raw_value: String, default_value: float, max_value: float) -> float:
	var clean_value := raw_value.strip_edges().to_lower()
	if clean_value.ends_with("px"):
		clean_value = clean_value.trim_suffix("px").strip_edges()
	if not _is_numeric_text(clean_value):
		return clampf(default_value, 0.0, max_value)
	return clampf(float(clean_value), 0.0, max_value)


func _parse_dialogue_event_factor(raw_value: String, default_value: float, max_value: float) -> float:
	var clean_value := raw_value.strip_edges()
	if clean_value.is_empty():
		return clampf(default_value, 0.0, max_value)

	var is_percent := clean_value.ends_with("%")
	if is_percent:
		clean_value = clean_value.trim_suffix("%").strip_edges()
	if not _is_numeric_text(clean_value):
		return clampf(default_value, 0.0, max_value)

	var value := float(clean_value)
	if is_percent or value > max_value:
		value *= 0.01
	return clampf(value, 0.0, max_value)


func _get_dialogue_event_duration(event: Dictionary, default_value := 0.0) -> float:
	return maxf(_get_dialogue_event_float(event, ["duration", "fade", "time"], default_value), 0.0)


func _get_bgm_start_volume_db(event: Dictionary, base_volume_db: float) -> float:
	var raw_multiplier := _get_dialogue_event_string(event, ["bgm_volume_multiplier", "volume_multiplier", "multiplier"], "")
	if not raw_multiplier.is_empty() and _is_numeric_text(raw_multiplier):
		return base_volume_db + linear_to_db(maxf(float(raw_multiplier), 0.0001))
	return _get_dialogue_event_volume_db(event, base_volume_db)


func _get_bgm_volume_event_volume_db(event: Dictionary, base_volume_db: float, default_value: float) -> float:
	var raw_db := _get_dialogue_event_string(event, ["volume_db", "db"], "")
	if not raw_db.is_empty() and _is_numeric_text(raw_db):
		return float(raw_db)

	var raw_multiplier := _get_dialogue_event_string(
		event,
		["bgm_volume_multiplier", "volume_multiplier", "multiplier", "volume"],
		""
	)
	if raw_multiplier.is_empty() or not _is_numeric_text(raw_multiplier):
		return default_value
	return base_volume_db + linear_to_db(maxf(float(raw_multiplier), 0.0001))


func _get_dialogue_event_volume_db(event: Dictionary, default_value := 0.0) -> float:
	var raw_db := _get_dialogue_event_string(event, ["volume_db", "db"], "")
	if not raw_db.is_empty() and _is_numeric_text(raw_db):
		return float(raw_db)

	var raw_volume := _get_dialogue_event_string(event, ["volume"], "")
	if raw_volume.is_empty() or not _is_numeric_text(raw_volume):
		return default_value

	var volume := float(raw_volume)
	if volume >= 0.0 and volume <= 1.0:
		return linear_to_db(maxf(volume, 0.0001))
	return volume


func _normalize_resource_path(raw_path: String) -> String:
	var path := raw_path.strip_edges()
	if path.is_empty():
		return ""
	if path.begins_with("res://") or path.begins_with("user://"):
		return path
	return "res://%s" % path.trim_prefix("/")


func _set_audio_stream_loop(stream: AudioStream, loop: bool) -> void:
	if stream == null:
		return
	if _set_object_property_if_present(stream, "loop", loop):
		return
	_set_object_property_if_present(stream, "loop_mode", 1 if loop else 0)


func _set_object_property_if_present(object: Object, property_name: String, value: Variant) -> bool:
	for property in object.get_property_list():
		if String(property.get("name", "")) == property_name:
			object.set(property_name, value)
			return true
	return false


func _is_numeric_text(text: String) -> bool:
	var clean_text := text.strip_edges()
	if clean_text.is_empty():
		return false

	var has_digit := false
	var has_decimal_point := false
	for i in clean_text.length():
		var ch := clean_text[i]
		if ch >= "0" and ch <= "9":
			has_digit = true
			continue
		if ch == "." and not has_decimal_point:
			has_decimal_point = true
			continue
		if ch == "-" and i == 0:
			continue
		return false
	return has_digit


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


func _hide_dialogue_spectrum() -> void:
	_dialogue_spectrum_active = false
	_dialogue_spectrum_speaker_id = ""
	_dialogue_spectrum_offset = Vector2.ZERO
	if _dialogue_spectrum == null:
		return

	_dialogue_spectrum.set_noise_mode(false)
	_dialogue_spectrum.finish_line(true)


func _on_dialogue_visible_character_changed(visible_count: int, total_count: int) -> void:
	_maybe_play_dialogue_text_sound(visible_count, total_count)
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
	_schedule_auto_mode_advance_if_ready()


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
		_apply_slot_mystery(slot, _resolve_cast_mystery_for_node(speaker_id))
		var target_modulate := _get_slot_portrait_modulate(slot, target_alpha)
		var transparent_modulate := _get_slot_portrait_transparent_modulate(slot, target_alpha)
		rect.modulate = transparent_modulate
		if swap_rect != null:
			swap_rect.modulate = transparent_modulate
		_apply_speaker_portrait_state(speaker_id, new_state, texture, false)
		rect.modulate = transparent_modulate
		if swap_rect != null:
			swap_rect.modulate = transparent_modulate
		var tween := _create_slot_tween(slot)
		slot["tween"] = tween
		tween.set_parallel(true)
		tween.set_ease(Tween.EASE_OUT)
		tween.set_trans(Tween.TRANS_SINE)
		var fade_in_duration := _portrait_anim_duration(PortraitTransition.DURATION_FADE_IN, animation_speed)
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
		var current_opacity := float(slot.get("portrait_opacity", target_alpha))
		_apply_speaker_portrait_state(speaker_id, target_state.duplicate(true), texture, false)
		if absf(current_opacity - target_alpha) > 0.01:
			slot["portrait_opacity"] = current_opacity
			_tween_slot_highlight(
				slot,
				target_alpha,
				_portrait_anim_duration(STAGE_CAST_OPACITY_ANIMATION_DURATION, animation_speed)
			)
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
	_apply_slot_mystery(slot, _resolve_cast_mystery_for_node(speaker_id))
	var target_modulate := _get_slot_portrait_modulate(slot, target_alpha)
	var transparent_modulate := _get_slot_portrait_transparent_modulate(slot, target_alpha)
	if swap_texture:
		duration = maxf(
			duration,
			_portrait_anim_duration(PortraitTransition.DURATION_LAYOUT_SWAP, animation_speed)
		)

	if swap_texture:
		swap_rect.modulate = transparent_modulate
		var swap_start_state := PortraitTransition.interpolate_layout_state(end_state, start_state, end_state, 0.0)
		_apply_portrait_state_to_rect(swap_rect, swap_start_state, texture)
		swap_rect.modulate = transparent_modulate

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
	if swap_texture:
		tween.tween_property(rect, "modulate", transparent_modulate, duration)
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
	_apply_slot_mystery(slot, _resolve_cast_mystery_for_node(speaker_id))
	var target_modulate := _get_slot_portrait_modulate(slot, target_alpha)
	var transparent_modulate := _get_slot_portrait_transparent_modulate(slot, target_alpha)

	var tween := _create_slot_tween(slot)
	slot["tween"] = tween
	tween.set_parallel(true)
	tween.set_ease(Tween.EASE_OUT)
	tween.set_trans(Tween.TRANS_SINE)
	swap_rect.modulate = transparent_modulate
	_apply_portrait_state_to_rect(swap_rect, end_state, texture)
	swap_rect.modulate = transparent_modulate
	var expression_duration := _portrait_anim_duration(PortraitTransition.DURATION_EXPRESSION, animation_speed)
	tween.tween_property(rect, "modulate", transparent_modulate, expression_duration)
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
	slot["mystery"] = false
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
	target_height = maxf(
		target_height,
		_mobile_scaled_float(CHOICE_BUTTON_MIN_HEIGHT, 132.0) * resolved_scale
	)
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
		button.custom_minimum_size = button_size
		button.size = button_size
		_apply_choice_button_theme(button, visual_scale)
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


func _handle_investigation_map_shortcut_input(event: InputEvent) -> bool:
	if not _is_investigation_map_open():
		return false
	if _is_shortcut_action_pressed(event, "back") or _is_shortcut_action_pressed(event, "ui_cancel"):
		_on_investigation_map_close_pressed()
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


func _get_available_choices(raw_choices: Variant) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	if typeof(raw_choices) != TYPE_ARRAY:
		return result

	var choices: Array = raw_choices
	for index in choices.size():
		var raw_choice: Variant = choices[index]
		if typeof(raw_choice) != TYPE_DICTIONARY:
			continue
		var choice: Dictionary = (raw_choice as Dictionary).duplicate(true)
		choice["_choice_index"] = index
		if _choice_conditions_met(choice):
			result.append(choice)
	return result


func _choice_conditions_met(choice_data: Dictionary) -> bool:
	return VisualNovelData.story_conditions_met(choice_data.get("conditions", []), {
		"dialogue_id": _dialogue_id,
		"node_id": _current_node_id,
		"choice": choice_data,
		"choice_index": int(choice_data.get("_choice_index", -1)),
	})


func _get_choice_topic_id(choice_data: Dictionary) -> String:
	for key in ["topic_id", "choice_id", "id"]:
		var value := String(choice_data.get(key, "")).strip_edges()
		if not value.is_empty():
			return value
	var choice_index := int(choice_data.get("_choice_index", -1))
	if choice_index >= 0 and not _dialogue_id.is_empty() and not _current_node_id.is_empty():
		return "%s:%s:%d" % [_dialogue_id, _current_node_id, choice_index]
	return ""


func _choice_tracks_heard(choice_data: Dictionary) -> bool:
	return bool(choice_data.get("track_heard", choice_data.get("track_topic", true)))


func _choice_exits_talk(choice_data: Dictionary) -> bool:
	return bool(choice_data.get("exit_talk", choice_data.get("talk_end", choice_data.get("end_talk", false))))


func _get_choice_present_target(choice_data: Dictionary) -> Dictionary:
	var raw_present: Variant = choice_data.get("present", choice_data.get("presentation", choice_data.get("present_target", null)))
	if typeof(raw_present) == TYPE_DICTIONARY:
		var present: Dictionary = raw_present
		var kind := String(present.get("kind", present.get("type", present.get("target_type", "")))).strip_edges().to_lower()
		var target_id := String(present.get("target_id", present.get("id", present.get("target", "")))).strip_edges()
		if kind in ["evidence", "clue", "자료"]:
			kind = "item"
		if kind in ["person", "profile", "인물"]:
			kind = "character"
		if kind in ["item", "character"] and not target_id.is_empty():
			return {"kind": kind, "id": target_id}
	elif typeof(raw_present) == TYPE_STRING:
		var present_id := String(raw_present).strip_edges()
		if not present_id.is_empty():
			return {"kind": "item", "id": present_id}

	for key in ["present_item", "present_item_id", "present_evidence", "present_evidence_id", "evidence_id", "clue_id"]:
		var item_id := String(choice_data.get(key, "")).strip_edges()
		if not item_id.is_empty():
			return {"kind": "item", "id": item_id}
	for key in ["present_character", "present_character_id", "present_profile", "present_profile_id"]:
		var character_id := String(choice_data.get(key, "")).strip_edges()
		if not character_id.is_empty():
			return {"kind": "character", "id": character_id}

	var present_kind := String(choice_data.get("present_kind", choice_data.get("presentation_kind", ""))).strip_edges().to_lower()
	var present_id := String(choice_data.get("present_id", choice_data.get("presentation_id", ""))).strip_edges()
	if present_kind in ["evidence", "clue", "자료"]:
		present_kind = "item"
	if present_kind in ["person", "profile", "인물"]:
		present_kind = "character"
	if present_kind in ["item", "character"] and not present_id.is_empty():
		return {"kind": present_kind, "id": present_id}
	return {}


func _choice_is_present_default(choice_data: Dictionary) -> bool:
	return bool(choice_data.get("present_default", choice_data.get("default_present", choice_data.get("wrong_present", false))))


func _choice_is_present_action(choice_data: Dictionary) -> bool:
	return _choice_is_present_default(choice_data) or not _get_choice_present_target(choice_data).is_empty()


func _get_present_choices(choices: Array[Dictionary]) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for choice in choices:
		if _choice_is_present_action(choice):
			result.append(choice)
	return result


func _find_case_notebook_present_choice(kind: String, target_id: String) -> Dictionary:
	var default_choice: Dictionary = {}
	for choice in _case_notebook_present_choices:
		if _choice_is_present_default(choice):
			default_choice = choice
		var target := _get_choice_present_target(choice)
		if String(target.get("kind", "")) == kind and String(target.get("id", "")) == target_id:
			return choice
	return default_choice


func _get_choice_move_to_location_id(choice_data: Dictionary) -> String:
	for key in ["move_to", "move_location", "travel_to", "to_location", "destination_location", "place_id", "location_id"]:
		var location_id := String(choice_data.get(key, "")).strip_edges()
		if not location_id.is_empty():
			return location_id
	return ""


func _resolve_choice_destination_node_id(choice_data: Dictionary) -> String:
	var move_location_id := _get_choice_move_to_location_id(choice_data)
	if not move_location_id.is_empty():
		var location_node_id := _resolve_location_node_id(move_location_id)
		if not location_node_id.is_empty():
			return location_node_id

	var next_id := String(choice_data.get("next", "")).strip_edges()
	if not next_id.is_empty():
		return next_id
	return String(_current_node.get("next", "")).strip_edges()


func _current_node_ends_talk() -> bool:
	return bool(_current_node.get("talk_end", _current_node.get("end_talk", _current_node.get("exit_talk", false))))


func _should_show_choice_heard_check(choice_data: Dictionary) -> bool:
	return _choice_tracks_heard(choice_data) and bool(choice_data.get("show_heard_check", choice_data.get("show_check", true)))


func _get_current_choice_heard_check_color() -> Color:
	if _current_node.is_empty():
		return DEFAULT_SPEAKER_COLOR

	var speaker_id := String(_current_node.get("speaker", "")).strip_edges()
	if speaker_id.is_empty() or _is_narrator_speaker(speaker_id):
		return DEFAULT_SPEAKER_COLOR
	if _is_node_speaker_mystery(_current_node, speaker_id):
		return MYSTERY_SPEAKER_COLOR
	return _get_speaker_color(_get_speaker_profile(speaker_id))


func _is_choice_topic_heard(choice_data: Dictionary) -> bool:
	var topic_id := _get_choice_topic_id(choice_data)
	if topic_id.is_empty():
		return false
	return VisualNovelData.is_dialogue_topic_heard(_dialogue_id, _current_node_id, topic_id)


func _mark_choice_topic_heard(choice_data: Dictionary) -> void:
	if not _choice_tracks_heard(choice_data):
		return
	var topic_id := _get_choice_topic_id(choice_data)
	if topic_id.is_empty():
		return
	VisualNovelData.mark_dialogue_topic_heard(_dialogue_id, _current_node_id, topic_id)


func _render_choices(raw_choices: Variant) -> void:
	_clear_choices()

	var choices := _get_available_choices(raw_choices)
	if choices.is_empty():
		return

	if _is_investigation_presentation() and not _current_node_ends_talk():
		var action_choices := _build_investigation_action_choices(choices)
		if not action_choices.is_empty():
			if _uses_talk_menu_flow():
				_talk_menu_node_id = _current_node_id
			_render_choice_buttons(action_choices)
			return

	if _uses_talk_menu_flow() and not _current_node_ends_talk():
		_talk_menu_node_id = _current_node_id
	_render_choice_buttons(choices)


func _render_choice_buttons(choices: Array[Dictionary]) -> void:
	if _choice_list == null:
		return
	_pause_skip_hold()
	var delay_for_talk_shift := _should_shift_talk_speaker_for_choices()
	_choice_list.visible = not delay_for_talk_shift
	var stage_size := _get_choice_stage_size()
	var character_side := _get_choice_character_side(stage_size)
	var speaker_scale := _get_choice_speaker_scale()
	var visual_scale := _get_choice_resolution_scale(stage_size)
	var button_size := _get_choice_button_size(choices.size(), character_side, speaker_scale)
	for index in choices.size():
		var choice_data: Dictionary = choices[index]
		var choice_button := Button.new()
		choice_button.name = "Choice%dButton" % (index + 1)
		_set_choice_button_content(choice_button, choice_data, "선택지 %d" % (index + 1))
		choice_button.custom_minimum_size = button_size
		choice_button.size = button_size
		choice_button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		_apply_choice_button_theme(choice_button, visual_scale)
		_apply_choice_button_scale(choice_button, speaker_scale)
		_apply_choice_button_alignment(choice_button, choices.size(), character_side)
		choice_button.pressed.connect(_on_choice_pressed.bind(choice_data))
		_choice_list.add_child(choice_button)

	if delay_for_talk_shift:
		_show_choices_after_talk_shift()
		return

	_finalize_rendered_choices()


func _build_investigation_action_choices(choices: Array[Dictionary]) -> Array[Dictionary]:
	var actions: Array[Dictionary] = []
	if not _get_investigation_talk_choices(choices).is_empty():
		actions.append(_make_investigation_action_choice("talk", "대화", "대화하기"))
	if _has_present_choices(choices):
		actions.append(_make_investigation_action_choice("present", "자료", "자료 제시"))
	if _has_investigation_move_targets(choices):
		actions.append(_make_investigation_action_choice("move", "지도", "이동하기"))
	return actions


func _make_investigation_action_choice(action: String, label: String, text: String) -> Dictionary:
	return {
		"label": label,
		"text": text,
		"_investigation_action": action,
		"track_heard": false,
		"show_heard_check": false,
	}


func _get_investigation_talk_choices(choices: Array[Dictionary]) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for choice in choices:
		if _get_choice_move_to_location_id(choice).is_empty() and not _choice_is_present_action(choice):
			result.append(choice)
	return result


func _get_investigation_move_choices(choices: Array[Dictionary]) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for choice in choices:
		if not _get_choice_move_to_location_id(choice).is_empty():
			result.append(choice)
	return result


func _has_investigation_move_targets(choices: Array[Dictionary]) -> bool:
	var current_location_id := _get_current_location_id()
	for location in _get_available_investigation_locations():
		if _get_location_id(location) != current_location_id:
			return true
	return not _get_investigation_move_choices(choices).is_empty()


func _has_present_choices(choices: Array[Dictionary]) -> bool:
	return not _get_present_choices(choices).is_empty() and VisualNovelData.has_any_acquired_info()


func _show_investigation_talk_choices() -> void:
	var choices := _get_investigation_talk_choices(_get_available_choices(_current_node.get("choices", [])))
	if choices.is_empty():
		_render_choices(_current_node.get("choices", []))
		return
	_clear_choices()
	choices.append(_make_investigation_action_choice("back", "조사", "목록으로 돌아가기"))
	_render_choice_buttons(choices)


func _show_investigation_move_choices() -> void:
	var choices := _get_investigation_move_choices(_get_available_choices(_current_node.get("choices", [])))
	if choices.is_empty():
		_render_choices(_current_node.get("choices", []))
		return
	_clear_choices()
	choices.append(_make_investigation_action_choice("back", "조사", "목록으로 돌아가기"))
	_render_choice_buttons(choices)


func _handle_investigation_choice_action(choice_data: Dictionary) -> bool:
	var action := String(choice_data.get("_investigation_action", "")).strip_edges()
	if action.is_empty():
		return false
	match action:
		"talk":
			_show_investigation_talk_choices()
		"present":
			_open_case_notebook_present(_get_available_choices(_current_node.get("choices", [])))
		"move":
			_show_investigation_map()
		"back":
			_render_choices(_current_node.get("choices", []))
		_:
			return false
	return true


func _show_choices_after_talk_shift() -> void:
	if _choice_list == null:
		return

	_talk_choice_animation_token += 1
	var animation_token := _talk_choice_animation_token
	var node_id := _current_node_id
	_shift_talk_speaker_to_left_preset(func() -> void:
		if animation_token != _talk_choice_animation_token or node_id != _current_node_id:
			return
		if _choice_list == null or _choice_list.get_child_count() == 0:
			return
		_choice_list.visible = true
		_finalize_rendered_choices()
	)


func _finalize_rendered_choices() -> void:
	if _choice_list == null or not _choice_list.visible:
		return

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
		button.custom_minimum_size = button_size
		button.size = button_size
		_apply_choice_button_theme(button, visual_scale)
		_apply_choice_button_scale(button, speaker_scale)
		_apply_choice_button_alignment(button, buttons.size(), character_side)


func _clear_choices(hide_investigation_map := true) -> void:
	_talk_choice_animation_token += 1
	_clear_talk_choice_character_shift_state()
	if hide_investigation_map:
		_hide_investigation_map()
	if _choice_list == null:
		return

	for child in _choice_list.get_children():
		_choice_list.remove_child(child)
		child.queue_free()
	_choice_list.visible = false


func _show_investigation_map() -> void:
	var locations := _get_available_investigation_locations()
	if locations.is_empty():
		_show_investigation_move_choices()
		return
	_clear_choices(false)
	_refresh_investigation_map(locations)
	_sync_investigation_map_layout()
	_investigation_map_overlay.visible = true
	_update_advance_hint()

	var focus_target: Control = _get_first_investigation_map_pin_button()
	if focus_target == null:
		focus_target = _investigation_map_close_button
	if focus_target != null:
		set_preferred_focus_control(focus_target)
		focus_target.grab_focus()


func _hide_investigation_map() -> void:
	if _investigation_map_overlay != null:
		_investigation_map_overlay.visible = false
	if _investigation_map_board != null:
		for child in _investigation_map_board.get_children():
			_investigation_map_board.remove_child(child)
			child.queue_free()
		_investigation_map_board.configure(null, [], -1)


func _is_investigation_map_open() -> bool:
	return _investigation_map_overlay != null and _investigation_map_overlay.visible


func _refresh_investigation_map(locations: Array[Dictionary]) -> void:
	if _investigation_map_board == null:
		return
	for child in _investigation_map_board.get_children():
		_investigation_map_board.remove_child(child)
		child.queue_free()

	var current_location_id := _get_current_location_id()
	var positions: Array[Vector2] = []
	var current_index := -1
	for index in range(locations.size()):
		var location := locations[index]
		var location_id := _get_location_id(location)
		positions.append(_get_location_map_position(location, index, locations.size()))
		if location_id == current_location_id:
			current_index = index

	_investigation_map_title.text = _get_investigation_map_title()
	_investigation_map_board.configure(_load_investigation_map_texture(), positions, current_index)

	for index in range(locations.size()):
		var location := locations[index]
		var location_id := _get_location_id(location)
		var label := _get_location_label(location)
		var disabled := location_id == current_location_id

		var pin_button := Button.new()
		pin_button.name = "Pin%sButton" % [index + 1]
		pin_button.text = "●"
		pin_button.z_index = 2
		pin_button.tooltip_text = label
		pin_button.custom_minimum_size = INVESTIGATION_MAP_PIN_SIZE
		pin_button.size = INVESTIGATION_MAP_PIN_SIZE
		pin_button.disabled = disabled
		pin_button.mouse_default_cursor_shape = Control.CURSOR_ARROW if disabled else Control.CURSOR_POINTING_HAND
		pin_button.focus_mode = Control.FOCUS_NONE if disabled else Control.FOCUS_ALL
		pin_button.set_meta("pin_position", positions[index])
		pin_button.add_theme_font_size_override("font_size", 22)
		pin_button.add_theme_color_override("font_color", Color(1, 0.94, 0.86, 1))
		pin_button.add_theme_stylebox_override("normal", _create_investigation_map_pin_style(INVESTIGATION_MAP_PIN_DISABLED_COLOR if disabled else INVESTIGATION_MAP_PIN_COLOR, Color(1, 0.78, 0.66, 0.92)))
		pin_button.add_theme_stylebox_override("hover", _create_investigation_map_pin_style(INVESTIGATION_MAP_PIN_COLOR.lightened(0.12), Color(1, 0.9, 0.78, 1)))
		pin_button.add_theme_stylebox_override("pressed", _create_investigation_map_pin_style(INVESTIGATION_MAP_PIN_COLOR.darkened(0.12), Color(1, 0.7, 0.58, 1)))
		pin_button.add_theme_stylebox_override("disabled", _create_investigation_map_pin_style(INVESTIGATION_MAP_PIN_DISABLED_COLOR, Color(0.66, 0.46, 0.38, 0.62)))
		pin_button.pressed.connect(_on_investigation_map_pin_pressed.bind(location_id))
		_investigation_map_board.add_child(pin_button)

		var pin_label := Label.new()
		pin_label.name = "Pin%sLabel" % [index + 1]
		pin_label.text = "%s%s" % [label, " (현재)" if disabled else ""]
		pin_label.z_index = 1
		pin_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		pin_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		pin_label.clip_text = true
		pin_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
		pin_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
		pin_label.size = INVESTIGATION_MAP_PIN_LABEL_SIZE
		pin_label.set_meta("pin_position", positions[index])
		pin_label.add_theme_font_size_override("font_size", 18)
		pin_label.add_theme_color_override("font_color", Color(0.98, 0.91, 0.78, 0.96))
		pin_label.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.86))
		pin_label.add_theme_constant_override("outline_size", 3)
		_investigation_map_board.add_child(pin_label)

	_position_investigation_map_pins()


func _sync_investigation_map_layout() -> void:
	if _investigation_map_overlay == null:
		return
	_investigation_map_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	_investigation_map_overlay.offset_left = 0.0
	_investigation_map_overlay.offset_top = 0.0
	_investigation_map_overlay.offset_right = 0.0
	_investigation_map_overlay.offset_bottom = 0.0
	if _investigation_map_panel == null:
		return

	var viewport_size := get_viewport_rect().size
	var max_panel_size := Vector2(
		maxf(320.0, viewport_size.x - INVESTIGATION_MAP_PANEL_MARGIN.x * 2.0),
		maxf(360.0, viewport_size.y - INVESTIGATION_MAP_PANEL_MARGIN.y * 2.0)
	)
	var panel_size := Vector2(
		minf(INVESTIGATION_MAP_PANEL_MAX_SIZE.x, max_panel_size.x),
		minf(INVESTIGATION_MAP_PANEL_MAX_SIZE.y, max_panel_size.y)
	)
	_investigation_map_panel.position = (viewport_size - panel_size) * 0.5
	_investigation_map_panel.size = panel_size
	if _investigation_map_board != null:
		_investigation_map_board.custom_minimum_size = Vector2(
			maxf(panel_size.x - 52.0, 320.0),
			maxf(panel_size.y - 126.0, INVESTIGATION_MAP_BOARD_MIN_HEIGHT)
		)
	_position_investigation_map_pins()


func _position_investigation_map_pins() -> void:
	if _investigation_map_board == null:
		return
	var board_size := _investigation_map_board.size
	if board_size.x <= 0.0 or board_size.y <= 0.0:
		return
	for child in _investigation_map_board.get_children():
		if not child.has_meta("pin_position") or not (child is Control):
			continue
		var control := child as Control
		var normalized: Vector2 = child.get_meta("pin_position")
		var center := Vector2(clampf(normalized.x, 0.0, 1.0) * board_size.x, clampf(normalized.y, 0.0, 1.0) * board_size.y)
		if child is Button:
			control.size = INVESTIGATION_MAP_PIN_SIZE
			control.position = center - INVESTIGATION_MAP_PIN_SIZE * 0.5
		else:
			control.size = INVESTIGATION_MAP_PIN_LABEL_SIZE
			control.position = center + Vector2(-INVESTIGATION_MAP_PIN_LABEL_SIZE.x * 0.5, INVESTIGATION_MAP_PIN_SIZE.y * 0.42)


func _get_first_investigation_map_pin_button() -> Button:
	if _investigation_map_board == null:
		return null
	for child in _investigation_map_board.get_children():
		if child is Button and not (child as Button).disabled:
			return child as Button
	return null


func _on_investigation_map_close_pressed() -> void:
	_hide_investigation_map()
	_render_choices(_current_node.get("choices", []))


func _on_investigation_map_pin_pressed(location_id: String) -> void:
	var node_id := _resolve_location_node_id(location_id)
	if node_id.is_empty():
		return
	_hide_investigation_map()
	_clear_choices(false)
	_transition_to_node(node_id)


func _update_advance_hint() -> void:
	if _advance_hint_bar == null or _advance_hint_icon == null or _advance_hint_label == null:
		return

	if _dialogue_window_suppressed:
		_refresh_skip_indicator()
		_refresh_auto_indicator()
		_advance_hint_bar.visible = false
		_stop_advance_hint_pulse()
		return

	_refresh_skip_indicator()
	_refresh_auto_indicator()
	if _should_show_skip_indicator() or _should_show_auto_indicator():
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
		var icon_height := _get_advance_hint_icon_height()
		var icon := _get_input_icon(_get_advance_hint_icon_key(), icon_height)
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
		and not _dialogue_window_suppressed \
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
	if _dialogue_chain_transitioning or _node_blackout_transitioning:
		return false

	if _is_statement_presentation():
		if not _is_statement_main_node_active():
			if not _get_available_choices(_current_node.get("choices", [])).is_empty():
				return false
		return _can_statement_advance()

	if _awaiting_portrait_for_dialogue:
		return false

	if _is_menu_overlay_open():
		return false
	if _statement_note_open:
		return false
	if _is_investigation_map_open():
		return false

	return _get_available_choices(_current_node.get("choices", [])).is_empty()


func _get_advance_hint_text() -> String:
	if _uses_statement_dialogue_window():
		return ""

	match _get_current_input_mode():
		"mouse":
			return "Next"
		"keyboard":
			return "Space"
		"gamepad":
			return ""
		_:
			return "Next"


func _get_advance_hint_icon_key() -> String:
	if _uses_statement_dialogue_window():
		return ""
	match _get_current_input_mode():
		"gamepad":
			return "xbox_a"
	return ""


func _get_advance_hint_icon_height() -> int:
	return _mobile_scaled_int(INPUT_ADVANCE_ICON_HEIGHT, 56)


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
		for child in separator.get_children():
			if child is Label:
				(child as Label).add_theme_font_size_override("font_size", _get_top_menu_font_size())
	for action in _top_menu_buttons.keys():
		var button := _top_menu_buttons[action] as Button
		if button != null:
			_apply_menu_button_hint(button, String(action))
			_apply_top_menu_button_style(button)
	_refresh_skip_button_state()
	_refresh_auto_button_state()
	_refresh_case_notebook_button_state()
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
	button.custom_minimum_size = _get_menu_button_min_size(icon_height) if icon != null else _get_top_menu_text_button_min_size()
	button.add_theme_font_size_override("font_size", _get_top_menu_font_size())
	button.add_theme_constant_override("h_separation", _get_menu_icon_text_separation() if icon != null else 0)
	button.add_theme_constant_override("icon_max_width", icon.get_width() if icon != null else 0)
	_apply_keyboard_menu_hint_metrics(button)
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


func _apply_keyboard_menu_hint_metrics(button: Button) -> void:
	var content := button.get_node_or_null("KeyboardHintContent") as Control
	if content == null:
		return

	var layout := content.get_node_or_null("Layout") as HBoxContainer
	if layout != null:
		layout.add_theme_constant_override("separation", _mobile_scaled_int(TOP_MENU_KEYBOARD_HINT_SEPARATION, 16))

	var base_label := content.get_node_or_null("Layout/BaseLabel") as Label
	if base_label != null:
		base_label.add_theme_font_size_override("font_size", _get_top_menu_font_size())

	var keycap_offset := content.get_node_or_null("Layout/KeycapOffset") as MarginContainer
	if keycap_offset != null:
		keycap_offset.add_theme_constant_override("margin_top", _mobile_scaled_int(TOP_MENU_KEYCAP_Y_OFFSET, 5))

	var key_margin := content.get_node_or_null("Layout/KeycapOffset/Keycap/Margin") as MarginContainer
	if key_margin != null:
		var keycap_margin_x := _mobile_scaled_int(TOP_MENU_KEYCAP_MARGIN_HORIZONTAL, 8)
		key_margin.add_theme_constant_override("margin_left", keycap_margin_x)
		key_margin.add_theme_constant_override("margin_right", keycap_margin_x)

	var key_label := content.get_node_or_null("Layout/KeycapOffset/Keycap/Margin/KeyLabel") as Label
	if key_label != null:
		key_label.add_theme_font_size_override("font_size", _get_top_menu_keycap_font_size())


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
		"auto":
			return "Auto"
		"log":
			return "Log"
		"tree":
			return "Tree"
		"case_note":
			return "Case"
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
				"auto":
					return "F"
				"log":
					return "Shift"
				"tree":
					return "Tab"
				"case_note":
					return "R"
				"menu":
					return "Esc"
		"gamepad":
			match action:
				"skip":
					return "LB"
				"auto":
					return "X"
				"log":
					return "Y"
				"tree":
					return "Select"
				"case_note":
					return "RB"
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
	var base_height := int(icon_heights.get(action, 0))
	if base_height <= 0:
		return 0
	return _mobile_scaled_int(base_height, maxi(base_height + 8, int(roundf(float(base_height) * 1.28))))


func _get_menu_button_min_size(icon_height: int) -> Vector2:
	if icon_height <= 0:
		return _get_top_menu_text_min_size()
	var min_height := maxf(
		_mobile_scaled_float(TOP_MENU_ICON_MIN_SIZE.y, 86.0),
		float(icon_height) + _mobile_scaled_float(TOP_MENU_ICON_VERTICAL_PADDING, 18.0)
	)
	return Vector2(float(_get_menu_icon_min_width()), min_height)


func _get_keyboard_keycap_button_min_size(base_label: String, hint: String) -> Vector2:
	return Vector2(
		_measure_keyboard_menu_hint_width(base_label, hint),
		_mobile_scaled_float(TOP_MENU_KEYBOARD_BUTTON_MIN_HEIGHT, 82.0)
	)


func _measure_keyboard_menu_hint_width(base_label: String, hint: String) -> float:
	var font := ThemeDB.fallback_font
	var label_width := font.get_string_size(base_label, HORIZONTAL_ALIGNMENT_LEFT, -1, _get_top_menu_font_size()).x
	var keycap_text_width := font.get_string_size(hint, HORIZONTAL_ALIGNMENT_LEFT, -1, _get_top_menu_keycap_font_size()).x
	var keycap_margin := _mobile_scaled_int(TOP_MENU_KEYCAP_MARGIN_HORIZONTAL, 8)
	var keycap_width := keycap_text_width + float(keycap_margin * 2 + 3)
	return label_width + float(_mobile_scaled_int(TOP_MENU_KEYBOARD_HINT_SEPARATION, 16)) + keycap_width + _mobile_scaled_float(TOP_MENU_BUTTON_CONTENT_MARGIN.x, 18.0) * 2.0


func _get_top_menu_bar_separation() -> int:
	var mode := _get_current_input_mode()
	var base_value := int(TOP_MENU_BAR_SEPARATION.get(mode, TOP_MENU_BAR_SEPARATION["default"]))
	return _mobile_scaled_int(base_value, base_value + 4)


func _get_top_menu_separator_margin() -> int:
	var mode := _get_current_input_mode()
	var base_value := int(TOP_MENU_SEPARATOR_MARGIN.get(mode, TOP_MENU_SEPARATOR_MARGIN["default"]))
	return _mobile_scaled_int(base_value, base_value + 2)


func _get_top_menu_separator_margin_right() -> int:
	var mode := _get_current_input_mode()
	if TOP_MENU_SEPARATOR_MARGIN_RIGHT.has(mode):
		return int(TOP_MENU_SEPARATOR_MARGIN_RIGHT[mode])
	return _get_top_menu_separator_margin()


func _get_menu_icon_text_separation() -> int:
	var mode := _get_current_input_mode()
	var base_value := int(TOP_MENU_ICON_TEXT_SEPARATION.get(mode, TOP_MENU_ICON_TEXT_SEPARATION["default"]))
	return _mobile_scaled_int(base_value, base_value + 3)


func _get_menu_icon_min_width() -> int:
	var mode := _get_current_input_mode()
	var base_value := int(TOP_MENU_ICON_MIN_WIDTHS.get(mode, TOP_MENU_ICON_MIN_WIDTHS["default"]))
	return _mobile_scaled_int(base_value, maxi(base_value, 132))


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


func _is_node_speaker_mystery(node: Dictionary, speaker_id: String) -> bool:
	if speaker_id.is_empty() or _is_narrator_speaker(speaker_id):
		return false
	return bool(node.get("speaker_mystery", node.get("mystery_speaker", false)))


func _get_speaker_color(speaker_profile: Dictionary) -> Color:
	if speaker_profile.is_empty():
		return DEFAULT_SPEAKER_COLOR

	var raw_color := String(speaker_profile.get("name_color", ""))
	if Color.html_is_valid(raw_color):
		return Color.html(raw_color)
	return DEFAULT_SPEAKER_COLOR


func _is_skip_available() -> bool:
	if _dialogue_chain_transitioning or _node_blackout_transitioning:
		return false
	if not _has_loaded_dialogue or _current_node.is_empty():
		return false
	return not (_is_statement_presentation() and _is_statement_main_node_active())


func _is_auto_mode_active() -> bool:
	return _auto_mode_toggled or _auto_hold_active


func _is_auto_toggle_available() -> bool:
	if _dialogue_chain_transitioning or _node_blackout_transitioning:
		return false
	if not _has_loaded_dialogue or _current_node.is_empty():
		return false
	if _overlay_obscured or _is_menu_overlay_open():
		return false
	if _awaiting_portrait_for_dialogue or _statement_title_playing or _statement_title_preparing_reveal:
		return false
	if _statement_note_open or _statement_loop_prompt_open or _statement_connection_mode_active:
		return false
	return not _is_statement_presentation()


func _is_auto_available() -> bool:
	if not _is_auto_toggle_available():
		return false
	if _current_node_has_choices():
		return false
	return true


func _can_auto_advance_step() -> bool:
	if not _is_auto_available():
		return false
	if _is_statement_presentation():
		return _can_statement_button_advance()
	return _can_advance_dialogue()


func _toggle_auto_mode() -> void:
	if _auto_mode_toggled:
		_set_auto_mode_toggled(false)
		return
	if not _is_auto_toggle_available():
		_refresh_auto_mode_ui()
		return
	_set_auto_mode_toggled(true)


func _set_auto_mode_toggled(enabled: bool) -> void:
	if _auto_mode_toggled == enabled:
		if enabled:
			_schedule_auto_mode_advance_if_ready()
		_refresh_auto_mode_ui()
		return

	_auto_mode_toggled = enabled
	_cancel_auto_hold_pending()
	if enabled:
		_stop_skip_hold()
		_schedule_auto_mode_advance_if_ready()
	else:
		_cancel_pending_auto_advance()
	_refresh_auto_mode_ui()


func _stop_auto_mode() -> void:
	_cancel_auto_hold_pending()
	if not _auto_mode_toggled and not _auto_hold_active:
		_refresh_auto_mode_ui()
		return

	_auto_mode_toggled = false
	_auto_hold_active = false
	_cancel_pending_auto_advance()
	_refresh_auto_mode_ui()


func _begin_auto_hold_pending(source: String, position := Vector2.ZERO) -> bool:
	if _auto_mode_toggled or not _is_auto_available():
		return false

	_auto_hold_pending = true
	_auto_hold_elapsed = 0.0
	_auto_hold_source = source
	_auto_hold_start_position = position
	_auto_hold_dragged = false
	set_process(true)
	return true


func _process_auto_hold_pending(delta: float) -> void:
	if not _auto_hold_pending:
		return
	if not _is_auto_available() or _auto_hold_dragged:
		_cancel_auto_hold_pending()
		return

	_auto_hold_elapsed += delta
	if _auto_hold_elapsed < AUTO_HOLD_ACTIVATION_DELAY:
		return

	_auto_hold_pending = false
	_auto_hold_active = true
	_stop_skip_hold()
	_refresh_auto_mode_ui()
	_schedule_auto_mode_advance_if_ready()


func _cancel_auto_hold_pending() -> void:
	_auto_hold_pending = false
	_auto_hold_elapsed = 0.0
	_auto_hold_source = ""
	_auto_hold_start_position = Vector2.ZERO
	_auto_hold_dragged = false


func _finish_auto_hold_release(source: String) -> bool:
	if _auto_hold_pending and _auto_hold_source == source:
		var should_advance := not _auto_hold_dragged and _can_advance_dialogue()
		_cancel_auto_hold_pending()
		return should_advance

	if _auto_hold_active and (_auto_hold_source == source or _auto_hold_source.is_empty()):
		_auto_hold_active = false
		_cancel_auto_hold_pending()
		if not _is_auto_mode_active():
			_cancel_pending_auto_advance()
		else:
			_schedule_auto_mode_advance_if_ready()
		_refresh_auto_mode_ui()
		return false

	return false


func _track_auto_hold_drag(position: Vector2) -> void:
	if not _auto_hold_pending:
		return
	if position.distance_to(_auto_hold_start_position) > POINTER_TAP_MAX_DISTANCE_PX:
		_auto_hold_dragged = true


func _schedule_auto_mode_advance_if_ready() -> void:
	if not _is_auto_mode_active() or _auto_mode_advance_scheduled:
		return
	if not _can_auto_advance_step() or _dialogue_typewriter.is_typing():
		return

	_schedule_auto_advance(AUTO_MODE_ADVANCE_DELAY, _current_node_id, false, true)


func _should_show_auto_indicator() -> bool:
	return _is_auto_mode_active() \
		and _has_loaded_dialogue \
		and not _current_node.is_empty() \
		and not _dialogue_window_suppressed \
		and not _overlay_obscured \
		and not _is_menu_overlay_open() \
		and not _is_statement_presentation()


func _refresh_auto_indicator() -> void:
	if _auto_indicator == null:
		return

	var should_show := _should_show_auto_indicator()
	_auto_indicator.visible = should_show
	if should_show:
		_apply_auto_indicator_layout()


func _refresh_auto_button_state() -> void:
	if _auto_button == null:
		return

	var available := _is_auto_toggle_available()
	var active := _is_auto_mode_active()
	_auto_button.disabled = not available and not active
	_auto_button.modulate.a = 1.0 if available or active else SKIP_DISABLED_OPACITY
	_auto_button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND if available or active else Control.CURSOR_ARROW
	_apply_auto_button_visual()


func _refresh_auto_mode_ui() -> void:
	_refresh_auto_button_state()
	_refresh_auto_indicator()
	_update_advance_hint()


func _current_node_has_choices() -> bool:
	if _current_node.is_empty():
		return false

	var raw_choices: Variant = _current_node.get("choices", [])
	if typeof(raw_choices) != TYPE_ARRAY:
		return false
	return not _get_available_choices(raw_choices).is_empty()


func _should_stop_skip_hold() -> bool:
	if _dialogue_chain_transitioning or _node_blackout_transitioning:
		return true
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
	_stop_auto_mode()
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
		_skip_mode_toggled = false
		_skip_hold_requested = false
		_clear_mouse_skip_button_press()
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
	_refresh_auto_button_state()
	_refresh_case_notebook_button_state()


func _can_open_case_notebook_view() -> bool:
	if _dialogue_chain_transitioning or _node_blackout_transitioning:
		return false
	if not _has_loaded_dialogue or _current_node.is_empty():
		return false
	if _overlay_obscured or _is_menu_overlay_open() or _statement_note_open or _statement_loop_prompt_open:
		return false
	if _statement_title_playing or _statement_title_preparing_reveal or _awaiting_portrait_for_dialogue:
		return false
	if _is_statement_presentation():
		return false
	return VisualNovelData.has_any_acquired_info()


func _refresh_case_notebook_button_state() -> void:
	if _case_notebook_button == null:
		return
	var available := _can_open_case_notebook_view()
	_case_notebook_button.disabled = not available
	_case_notebook_button.modulate.a = 1.0 if available else SKIP_DISABLED_OPACITY
	_case_notebook_button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND if available else Control.CURSOR_ARROW


func _begin_mouse_skip_button_press() -> void:
	if not _is_skip_available():
		_refresh_skip_hold_ui()
		return

	_skip_button_press_active = true
	var started_toggled := _skip_mode_toggled
	_skip_button_press_started_requested = started_toggled or _skip_hold_requested
	_skip_button_press_started_msec = Time.get_ticks_msec()
	if started_toggled:
		_skip_mode_toggled = false
		_skip_hold_requested = false
		_pause_skip_hold()
		return
	if _skip_button_press_started_requested:
		return

	_skip_mode_toggled = false
	_start_skip_hold()


func _finish_mouse_skip_button_press() -> void:
	if not _skip_button_press_active:
		_stop_skip_hold()
		return

	var started_requested := _skip_button_press_started_requested
	var elapsed_sec := float(Time.get_ticks_msec() - _skip_button_press_started_msec) / 1000.0
	var was_hold_press := elapsed_sec >= SKIP_BUTTON_HOLD_ACTIVATION_DELAY
	_clear_mouse_skip_button_press()

	if was_hold_press or started_requested:
		_stop_skip_hold()
		return

	_skip_mode_toggled = true
	_refresh_skip_hold_ui()


func _clear_mouse_skip_button_press() -> void:
	_skip_button_press_active = false
	_skip_button_press_started_requested = false
	_skip_button_press_started_msec = 0


func _handle_shortcut_input(event: InputEvent) -> bool:
	if _is_skip_shortcut_released(event):
		_stop_skip_hold()
		return true
	if _is_auto_hold_shortcut_released(event):
		return _handle_auto_hold_shortcut_release()

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
	if _handle_debug_activation_input(event):
		return true

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

	if _handle_investigation_map_shortcut_input(event):
		return true

	if _is_shortcut_action_pressed(event, "menu"):
		_exit_statement_connection_mode()
		_toggle_menu_overlay()
		return true

	if _is_menu_overlay_open():
		return false

	if _is_shortcut_action_pressed(event, "auto"):
		_toggle_auto_mode()
		return true

	if _handle_choice_shortcut_input(event):
		return true

	if _is_shortcut_action_pressed(event, "connect_mode"):
		if _can_open_case_notebook_view():
			_open_case_notebook_view()
			return true
		return _enter_statement_connection_mode()

	if _uses_statement_dialogue_window():
		if _is_shortcut_action_pressed(event, "move_right"):
			_advance_statement_forward(true)
			return true
		if _is_shortcut_action_pressed(event, "move_left"):
			_retreat_dialogue(true)
			return true
		if _is_shortcut_action_pressed(event, "interact"):
			_confirm_statement_dialogue()
			return true

	if _is_shortcut_action_pressed(event, "interact") and _confirm_statement_dialogue():
		return true

	if _is_auto_hold_shortcut_pressed(event):
		return _begin_auto_hold_pending("digital")

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


func _handle_debug_activation_input(event: InputEvent) -> bool:
	var input_router := _get_input_router()
	if input_router == null:
		return false

	if input_router.has_method("poll_debug_activation_combo") and bool(input_router.call("poll_debug_activation_combo")):
		_refresh_debug_mode_label()
		return true

	if not input_router.has_method("is_debug_activation_event") or not bool(input_router.call("is_debug_activation_event", event)):
		return false

	var has_debug_trigger := input_router.has_method("are_debug_activation_triggers_pressed") \
		and bool(input_router.call("are_debug_activation_triggers_pressed"))
	if not has_debug_trigger and input_router.has_method("is_any_debug_activation_trigger_pressed"):
		has_debug_trigger = bool(input_router.call("is_any_debug_activation_trigger_pressed"))
	if has_debug_trigger:
		if input_router.has_method("poll_debug_activation_combo"):
			input_router.call("poll_debug_activation_combo")
		_refresh_debug_mode_label()
		return true

	return false


func _is_shortcut_action_pressed(event: InputEvent, action: StringName) -> bool:
	if event is InputEventJoypadMotion:
		var input_router := _get_input_router()
		if input_router != null and input_router.has_method("is_action_pressed_once"):
			return bool(input_router.call("is_action_pressed_once", event, action))
		if not event.is_action_pressed(action):
			return false
		return Input.is_action_just_pressed(action)

	if not event.is_action_pressed(action):
		if event is InputEventKey:
			return _is_key_event_action_match(event as InputEventKey, action, true)
		return false
	return true


func _is_auto_hold_shortcut_pressed(event: InputEvent) -> bool:
	if not event.is_action_pressed("auto_hold"):
		if event is InputEventKey:
			return _is_key_event_action_match(event as InputEventKey, "auto_hold", true)
		return false
	return true


func _is_auto_hold_shortcut_released(event: InputEvent) -> bool:
	if event is InputEventJoypadMotion:
		return false
	if event.is_action_released("auto_hold"):
		return true
	if event is InputEventKey:
		return _is_key_event_action_match(event as InputEventKey, "auto_hold", false)
	return false


func _handle_auto_hold_shortcut_release() -> bool:
	var was_pending := _auto_hold_pending and _auto_hold_source == "digital"
	var was_active := _auto_hold_active and _auto_hold_source == "digital"
	var should_advance := _finish_auto_hold_release("digital")
	if should_advance:
		if _uses_statement_dialogue_window():
			_confirm_statement_dialogue()
		else:
			_advance_dialogue()
	return was_pending or was_active


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
		if event is InputEventMouseButton and not (event as InputEventMouseButton).pressed:
			_finish_auto_hold_release("mouse")
		return false

	if event is InputEventMouseMotion:
		var motion_event := event as InputEventMouseMotion
		if (motion_event.button_mask & MOUSE_BUTTON_MASK_LEFT) != 0:
			_track_auto_hold_drag(motion_event.position)
		return false
	if event is InputEventMouseButton:
		var mouse_event := event as InputEventMouseButton
		if mouse_event.button_index != MOUSE_BUTTON_LEFT:
			return false
		if mouse_event.pressed:
			if _begin_auto_hold_pending("mouse", mouse_event.position):
				return false
			return true
		return _finish_auto_hold_release("mouse")
	return false


func _reveal_statement_dialogue() -> bool:
	if not _uses_statement_dialogue_window():
		return false
	if _statement_note_open or _statement_loop_prompt_open or _statement_title_playing or _awaiting_portrait_for_dialogue:
		return false
	if _dialogue_typewriter.is_typing():
		_dialogue_typewriter.reveal_all()
	return true


func _confirm_statement_dialogue() -> bool:
	if not _is_statement_presentation():
		return false
	if _uses_statement_dialogue_window():
		return _reveal_statement_dialogue()
	if _is_statement_main_node_active() or not _can_statement_advance():
		return false
	_advance_statement_forward()
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

	_complete_current_node_progression()
	var next_id := String(_current_node.get("next", ""))
	if next_id.is_empty():
		if _try_return_to_talk_menu():
			return
		if _try_advance_to_chained_dialogue():
			return
		request_screen_change("chapter_select")
		return

	_transition_to_node(next_id)


func _try_return_to_talk_menu() -> bool:
	if not _uses_talk_menu_flow():
		return false
	if _talk_exit_pending:
		_talk_exit_pending = false
		return false
	if _current_node_ends_talk():
		return false
	if _talk_menu_node_id.is_empty() or _talk_menu_node_id == _current_node_id:
		return false
	if not _nodes_by_id.has(_talk_menu_node_id):
		return false
	_transition_to_node(_talk_menu_node_id)
	return true


func _show_menu_overlay() -> void:
	if _menu_overlay == null:
		return
	if _menu_overlay.visible and not _menu_overlay_closing:
		return

	_cancel_pending_auto_advance()
	_stop_skip_hold()
	_stop_auto_mode()
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


func _on_choice_pressed(choice_data: Dictionary) -> void:
	_pause_skip_hold()
	if _handle_investigation_choice_action(choice_data):
		return
	var choice_text := String(choice_data.get("text", ""))
	_append_backlog_entry("선택", choice_text, MUTED_TEXT_COLOR, "choice", _current_node_id)
	_complete_current_node_progression()
	_apply_story_flags_from_data(choice_data)
	_mark_choice_topic_heard(choice_data)
	if _uses_talk_menu_flow():
		_talk_exit_pending = _choice_exits_talk(choice_data)
	var resolved_next_id := _resolve_choice_destination_node_id(choice_data)

	if resolved_next_id.is_empty():
		if _try_return_to_talk_menu():
			return
		if _try_advance_to_chained_dialogue():
			return
		request_screen_change("chapter_select")
		return

	_transition_to_node(resolved_next_id)


func _on_skip_button_down() -> void:
	if _get_current_input_mode() == INPUT_MODE_MOUSE:
		_begin_mouse_skip_button_press()
		return

	_skip_mode_toggled = false
	_start_skip_hold()


func _on_skip_button_up() -> void:
	if _skip_button_press_active:
		_finish_mouse_skip_button_press()
		return

	_skip_mode_toggled = false
	_stop_skip_hold()


func _on_auto_button_pressed() -> void:
	_toggle_auto_mode()


func _on_case_notebook_pressed() -> void:
	_open_case_notebook_view()


func _on_backlog_pressed() -> void:
	_cancel_pending_auto_advance()
	_stop_skip_hold()
	_stop_auto_mode()
	if _is_debug_mode_enabled():
		request_overlay("debug_dialogue", _make_debug_dialogue_payload())
	else:
		request_overlay("backlog", _make_backlog_payload())


func _on_branch_tree_pressed() -> void:
	_cancel_pending_auto_advance()
	_stop_skip_hold()
	_stop_auto_mode()
	request_overlay("branch_tree", _make_branch_tree_payload())


func _on_menu_pressed() -> void:
	_stop_skip_hold()
	_stop_auto_mode()
	_toggle_menu_overlay()


func _on_input_mode_changed(mode: String) -> void:
	super._on_input_mode_changed(mode)
	_stop_skip_hold()
	_stop_auto_mode()
	if mode != INPUT_MODE_KEYBOARD and mode != INPUT_MODE_GAMEPAD:
		_exit_statement_connection_mode()
	call_deferred("_refresh_input_hints")
	call_deferred("_refresh_choice_button_styles")
	call_deferred("_refresh_statement_controls")
