extends "res://scripts/screens/screen_base.gd"

const DEFAULT_DIALOGUE_ID_BY_CHAPTER = {
	"chapter_001": "chapter_001_intro",
}

const LAYOUT_SEPARATION := 18.0
const CHOICE_PANEL_WIDTH := 420.0
const CHOICE_OVERLAY_MARGIN_RIGHT := 27.0
const CHOICE_BUTTON_MIN_HEIGHT := 72.0
const CHOICE_LIST_SEPARATION := 20.0
const DIALOGUE_BORDER_WIDTH := 3.0
const DIALOGUE_CORNER_RADIUS := 9.0
const DIALOGUE_BORDER_COLOR := Color(0.52, 0.52, 0.52)
const DIALOGUE_PANEL_COLOR := Color(0.095, 0.09, 0.082, 0.88)
const DEFAULT_SPEAKER_COLOR := Color(0.92, 0.9, 0.84)
const BODY_TEXT_COLOR := Color(0.86, 0.84, 0.78)
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
const KEYCAP_BACKGROUND_COLOR := Color(0.18, 0.17, 0.15, 0.94)
const KEYCAP_BORDER_COLOR := Color(0.42, 0.4, 0.35)
const TOP_MENU_GHOST_HOVER_COLOR := Color(1, 1, 1, 0.07)
const TOP_MENU_GHOST_PRESSED_COLOR := Color(1, 1, 1, 0.11)
const TOP_MENU_GHOST_CORNER_RADIUS := 12
const TOP_MENU_BUTTON_CONTENT_MARGIN := Vector2(12, 3)
const FLOATING_MENU_MARGIN := Vector2(20, 12)
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
const TOUCH_TAP_MAX_DISTANCE_PX := 18.0
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
const INPUT_ICON_PATHS := {
	"xbox_a": "res://assets/icon/input/xbox_button_color_a_outline.png",
	"xbox_y": "res://assets/icon/input/xbox_button_color_y_outline.png",
	"xbox_lb": "res://assets/icon/input/xbox_lb_outline.png",
	"xbox_menu": "res://assets/icon/input/xbox_button_menu_outline.png",
	"xbox_view": "res://assets/icon/input/xbox_button_view_outline.png",
}
const TOP_MENU_ICON_KEYS := {
	"gamepad": {
		"skip": "xbox_y",
		"log": "xbox_lb",
		"tree": "xbox_view",
		"menu": "xbox_menu",
	},
}
const TOP_MENU_ICON_HEIGHTS := {
	"gamepad": {
		"skip": 27,
		"log": 33,
		"tree": 27,
		"menu": 27,
	},
}

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

var _speaker_label: Label
var _dialogue_text: RichTextLabel
var _dialogue_typewriter := DialogueTypewriter.new()
var _advance_hint_bar: HBoxContainer
var _advance_hint_icon: TextureRect
var _advance_hint_label: Label
var _skip_button: Button
var _backlog_button: Button
var _branch_tree_button: Button
var _menu_button: Button
var _menu_continue_button: Button
var _choice_list: VBoxContainer
var _choice_overlay: Control
var _portrait_viewport: Control
var _effect_layer: Control
var _dialogue_overlay: Control
var _dialogue_border_frame: DialogueBorderFrame
var _dialogue_content_margin: MarginContainer
var _dialogue_text_layout: VBoxContainer
var _menu_overlay: Control
var _floating_ui_canvas: CanvasLayer
var _floating_ui_layer: Control
var _top_menu_bar: HBoxContainer
var _top_menu_buttons: Dictionary = {}
var _top_menu_separators: Array[MarginContainer] = []

var _character_layer: Control
var _dialogue_spectrum: DialogueSpectrum
var _dialogue_spectrum_active := false
var _dialogue_spectrum_layout_offset := Vector2.ZERO
var _dialogue_spectrum_offset := Vector2.ZERO
var _portrait_texture_cache: Dictionary = {}
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
var _choice_button_style_pressed: StyleBoxFlat

var _dialogue_id := ""
var _current_node_id := ""
var _current_node: Dictionary = {}
var _nodes_by_id: Dictionary = {}
var _has_loaded_dialogue := false
var _input_icon_cache: Dictionary = {}
var _touch_advance_gestures: Dictionary = {}
var _awaiting_portrait_for_dialogue := false
var _portrait_dialogue_token := 0
var _pending_dialogue: Dictionary = {}
var _cast_batch_remaining := 0
var _cast_batch_on_finished := Callable()


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
	_load_dialogue_from_payload(setup_payload)
	call_deferred("_sync_fixed_overlay_layout")
	call_deferred("_sync_grid_background")
	set_process(false)


func _process(delta: float) -> void:
	if _dialogue_typewriter.process(delta):
		return

	set_process(false)


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
		_advance_dialogue()
		get_viewport().set_input_as_handled()


func _gui_input(event: InputEvent) -> void:
	if _should_ignore_gameplay_event(event):
		return

	if _handle_pointer_advance_event(event):
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
	_build_choice_overlay()
	_build_dialogue_overlay()
	_create_choice_button_styles()
	_build_floating_menu()
	_sync_fixed_overlay_layout()

	_skip_button.pressed.connect(_on_skip_pressed)
	_backlog_button.pressed.connect(_on_backlog_pressed)
	_branch_tree_button.pressed.connect(_on_branch_tree_pressed)
	_menu_button.pressed.connect(_on_menu_pressed)

	_build_menu_overlay()
	_refresh_input_hints()


func _create_portrait_rect(rect_name: String) -> TextureRect:
	var rect := TextureRect.new()
	rect.name = rect_name
	rect.visible = false
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


func _build_dialogue_spectrum() -> void:
	_dialogue_spectrum = DialogueSpectrum.new()
	_dialogue_spectrum.name = "DialogueSpectrum"
	_dialogue_spectrum.visible = false
	_effect_layer.add_child(_dialogue_spectrum)


func _build_choice_overlay() -> void:
	_choice_overlay = Control.new()
	_choice_overlay.name = "ChoiceOverlay"
	_choice_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_choice_overlay)

	var side_margin := MarginContainer.new()
	side_margin.name = "ChoiceSideMargin"
	side_margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	side_margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	side_margin.add_theme_constant_override("margin_right", int(CHOICE_OVERLAY_MARGIN_RIGHT))
	_choice_overlay.add_child(side_margin)

	var choice_row := HBoxContainer.new()
	choice_row.name = "ChoiceRow"
	choice_row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	choice_row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	choice_row.size_flags_vertical = Control.SIZE_EXPAND_FILL
	side_margin.add_child(choice_row)

	var choice_spacer := Control.new()
	choice_spacer.name = "ChoiceSpacer"
	choice_spacer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	choice_spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	choice_row.add_child(choice_spacer)

	var choice_column := VBoxContainer.new()
	choice_column.name = "ChoiceColumn"
	choice_column.mouse_filter = Control.MOUSE_FILTER_IGNORE
	choice_column.size_flags_horizontal = Control.SIZE_SHRINK_END
	choice_column.size_flags_vertical = Control.SIZE_EXPAND_FILL
	choice_row.add_child(choice_column)

	var choice_spacer_top := Control.new()
	choice_spacer_top.name = "ChoiceSpacerTop"
	choice_spacer_top.mouse_filter = Control.MOUSE_FILTER_IGNORE
	choice_spacer_top.size_flags_vertical = Control.SIZE_EXPAND_FILL
	choice_column.add_child(choice_spacer_top)

	_choice_list = VBoxContainer.new()
	_choice_list.name = "ChoiceList"
	_choice_list.visible = false
	_choice_list.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_choice_list.add_theme_constant_override("separation", int(CHOICE_LIST_SEPARATION))
	_choice_list.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	_choice_list.custom_minimum_size.x = CHOICE_PANEL_WIDTH
	choice_column.add_child(_choice_list)

	var choice_spacer_bottom := Control.new()
	choice_spacer_bottom.name = "ChoiceSpacerBottom"
	choice_spacer_bottom.mouse_filter = Control.MOUSE_FILTER_IGNORE
	choice_spacer_bottom.size_flags_vertical = Control.SIZE_EXPAND_FILL
	choice_column.add_child(choice_spacer_bottom)


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

	_dialogue_text = RichTextLabel.new()
	_dialogue_text.name = "DialogueText"
	_dialogue_text.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_dialogue_text.bbcode_enabled = false
	_dialogue_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_dialogue_text.scroll_active = false
	_dialogue_text.text = ""
	_dialogue_text.add_theme_font_override("normal_font", DialogueTypography.body_font())
	_dialogue_text.add_theme_font_size_override("normal_font_size", DialogueTypography.body_font_size())
	_dialogue_text.add_theme_constant_override("line_separation", DialogueTypography.body_line_spacing())
	_dialogue_text.add_theme_color_override("default_color", BODY_TEXT_COLOR)
	_dialogue_text.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_dialogue_text.size_flags_vertical = Control.SIZE_EXPAND_FILL
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


func _sync_fixed_overlay_layout() -> void:
	_apply_fullscreen_overlay_layout(_effect_layer)
	_apply_fullscreen_overlay_layout(_portrait_viewport)
	_sync_grid_background()
	_apply_fixed_overlay_layout(_choice_overlay)
	_apply_dialogue_overlay_layout()
	_apply_floating_ui_layout()


func _apply_fullscreen_overlay_layout(node: Control) -> void:
	if node == null:
		return

	node.set_anchors_preset(Control.PRESET_FULL_RECT)
	node.offset_left = 0.0
	node.offset_top = 0.0
	node.offset_right = 0.0
	node.offset_bottom = 0.0


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
	_dialogue_overlay.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	_dialogue_overlay.offset_left = float(panel_layout.get("offset_left", 0.0))
	_dialogue_overlay.offset_top = -float(panel_layout.get("height", DialoguePanelLayout.BASE_MIN_HEIGHT))
	_dialogue_overlay.offset_right = float(panel_layout.get("offset_right", 0.0))
	_dialogue_overlay.offset_bottom = 0.0
	_apply_dialogue_scale(panel_layout)
	_sync_speaker_label_layout()


func _apply_dialogue_scale(panel_layout: Dictionary) -> void:
	var tall_factor := clampf(float(panel_layout.get("tall_factor", 0.0)), 0.0, 1.0)
	_dialogue_tall_factor = tall_factor
	var horizontal_spacing_scale := lerpf(1.0, 1.16, tall_factor)
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
	var bottom_spacing_scale := lerpf(1.0, 1.28, tall_factor)
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
		_dialogue_text.add_theme_font_size_override("normal_font_size", DialogueTypography.body_font_size_for_layout(panel_layout))
		_dialogue_text.add_theme_constant_override("line_separation", DialogueTypography.body_line_spacing_for_layout(panel_layout))

	if _advance_hint_label != null:
		_advance_hint_label.add_theme_font_size_override("font_size", _scaled_int(27, horizontal_spacing_scale))

	if _advance_hint_icon != null:
		var icon_size := float(_scaled_int(INPUT_ADVANCE_ICON_HEIGHT, horizontal_spacing_scale))
		_advance_hint_icon.custom_minimum_size = Vector2(icon_size, icon_size)


func _scaled_int(base_value: int, scale: float) -> int:
	return int(roundf(float(base_value) * scale))


func _get_speaker_label_top() -> float:
	return lerpf(SPEAKER_LABEL_TOP, SPEAKER_LABEL_TOP_UNFOLDED, _dialogue_tall_factor)


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
			"focus_zoom_percent": float(PortraitLayout.ZOOM_MIN),
			"grid_zoom_percent": float(PortraitLayout.ZOOM_MIN),
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
	return {
		"speaker_id": cast_id,
		"position": PortraitLayout.compute_face_position(viewport_size, layout_offset, safe_area),
		"zoom_percent": float(state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT)),
		"grid_zoom_percent": float(state.get("zoom_percent", PortraitLayout.ZOOM_DEFAULT)),
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
	if not slot.has("parallax_target_opacity"):
		var rect: TextureRect = slot.get("rect")
		if rect != null and rect.visible:
			target_opacity = maxf(target_opacity, clampf(rect.modulate.a, 0.0, 1.0))

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
		positions.append(PortraitLayout.compute_face_position(viewport_size, layout_offset, safe_area))

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
	var pressed_bg := DIALOGUE_PANEL_COLOR.darkened(0.04)
	_choice_button_style_pressed = _create_choice_button_style(pressed_bg, DIALOGUE_BORDER_COLOR)


func _create_choice_button_style(bg_color: Color, border_color: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = bg_color
	style.border_color = border_color
	style.set_border_width_all(3)
	style.set_corner_radius_all(9)
	style.content_margin_left = 18
	style.content_margin_right = 18
	style.content_margin_top = 12
	style.content_margin_bottom = 12
	style.draw_center = true
	return style


func _apply_choice_button_theme(button: Button) -> void:
	button.flat = false
	button.focus_mode = Control.FOCUS_ALL
	button.add_theme_stylebox_override("normal", _choice_button_style_normal)
	button.add_theme_stylebox_override("hover", _choice_button_style_hover)
	button.add_theme_stylebox_override("pressed", _choice_button_style_pressed)
	button.add_theme_stylebox_override("focus", _choice_button_style_normal)
	button.add_theme_stylebox_override("disabled", _choice_button_style_normal)
	button.alignment = HORIZONTAL_ALIGNMENT_LEFT
	button.add_theme_font_size_override("font_size", 30)
	button.add_theme_color_override("font_color", BODY_TEXT_COLOR)
	button.add_theme_color_override("font_hover_color", DEFAULT_SPEAKER_COLOR)
	button.add_theme_color_override("font_pressed_color", DEFAULT_SPEAKER_COLOR)


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


func _set_floating_ui_visible(visible: bool) -> void:
	if _floating_ui_canvas != null:
		_floating_ui_canvas.visible = visible


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

	var scrim := ColorRect.new()
	scrim.name = "Scrim"
	scrim.color = MENU_OVERLAY_COLOR
	scrim.mouse_filter = Control.MOUSE_FILTER_STOP
	scrim.set_anchors_preset(Control.PRESET_FULL_RECT)
	_menu_overlay.add_child(scrim)

	var center := CenterContainer.new()
	center.name = "Center"
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	_menu_overlay.add_child(center)

	var panel := PanelContainer.new()
	panel.name = "MenuPanel"
	panel.custom_minimum_size = Vector2(450, 0)
	panel.add_theme_stylebox_override("panel", _create_dialogue_panel_style())
	center.add_child(panel)

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.add_theme_constant_override("margin_left", 33)
	margin.add_theme_constant_override("margin_top", 27)
	margin.add_theme_constant_override("margin_right", 33)
	margin.add_theme_constant_override("margin_bottom", 27)
	panel.add_child(margin)

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
		_hide_menu_overlay()
		request_screen_change("chapter_select")
	)
	title_button.pressed.connect(func() -> void:
		_hide_menu_overlay()
		request_screen_change("main_title")
	)


func _add_menu_overlay_button(parent: VBoxContainer, node_name: String, text: String) -> Button:
	var button := Button.new()
	button.name = node_name
	button.text = text
	button.custom_minimum_size = Vector2(0, 69)
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	parent.add_child(button)
	return button


func _load_dialogue_from_payload(payload: Dictionary) -> void:
	VisualNovelData.reload()
	_dialogue_id = _resolve_dialogue_id(payload)
	_nodes_by_id.clear()
	_current_node = {}
	_current_node_id = ""
	_has_loaded_dialogue = false
	_clear_stage_characters()

	if _dialogue_id.is_empty():
		_show_empty_dialogue_state(payload)
		return

	var dialogue: Dictionary = VisualNovelData.get_dialogue(StringName(_dialogue_id))
	if dialogue.is_empty():
		_show_empty_dialogue_state(payload)
		return

	_nodes_by_id = dialogue.get("_nodes_by_id", {})
	_current_node_id = String(dialogue.get("start", ""))
	_has_loaded_dialogue = not _nodes_by_id.is_empty() and not _current_node_id.is_empty()

	if not _has_loaded_dialogue:
		_show_empty_dialogue_state(payload)
		return

	_show_node(_current_node_id)


func _resolve_dialogue_id(payload: Dictionary) -> String:
	var explicit_id := String(payload.get("dialogue_id", "")).strip_edges()
	if not explicit_id.is_empty() and VisualNovelData.has_dialogue(StringName(explicit_id)):
		return explicit_id

	var chapter_id := String(payload.get("chapter_id", "")).strip_edges()
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


func _show_empty_dialogue_state(payload: Dictionary) -> void:
	_has_loaded_dialogue = false
	_current_node = {}
	_current_node_id = ""
	_awaiting_portrait_for_dialogue = false
	_pending_dialogue = {}
	_clear_choices()
	_hide_dialogue_spectrum()

	var chapter_title := String(payload.get("chapter_title", ""))
	var body := "대화 데이터가 아직 없습니다."
	if not chapter_title.is_empty():
		body = "%s의 대화 데이터가 아직 없습니다." % chapter_title

	_render_dialogue_line("시스템", body, MUTED_TEXT_COLOR)
	_clear_stage_characters()
	_skip_button.disabled = false
	_update_advance_hint()


func _show_node(node_id: String) -> void:
	if not _nodes_by_id.has(node_id):
		_show_empty_dialogue_state(setup_payload)
		return

	_current_node_id = node_id
	_current_node = _nodes_by_id[node_id]

	var speaker_id := String(_current_node.get("speaker", ""))
	var speaker_profile := _get_speaker_profile(speaker_id)
	var is_narrator := _is_narrator_speaker(speaker_id)
	var speaker_name := _get_speaker_name(speaker_id, speaker_profile)
	var speaker_color := _get_speaker_color(speaker_profile)
	var line_text := String(_current_node.get("text", ""))
	var layout_offset := Vector2.ZERO
	if not is_narrator:
		var cast_entry := {}
		if _current_node.has("stage_cast"):
			var stage_cast: Dictionary = _current_node.get("stage_cast", {})
			if stage_cast.has(speaker_id):
				cast_entry = stage_cast[speaker_id]
		layout_offset = _resolve_cast_layout_offset(speaker_id, cast_entry, _current_node)

	_pending_dialogue = {
		"speaker_name": speaker_name,
		"line_text": line_text,
		"speaker_color": speaker_color,
		"layout_offset": layout_offset,
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
		_play_stage_cast_animations(_current_node, "", {}, on_portrait_ready)
		_hide_dialogue_spectrum()
	else:
		_stage_speaker_id = speaker_id
		_raise_character_slot(speaker_id)
		_play_stage_cast_animations(_current_node, speaker_id, speaker_profile, on_portrait_ready)
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
	var line_text := String(_pending_dialogue.get("line_text", ""))
	var speaker_color: Color = _pending_dialogue.get("speaker_color", DEFAULT_SPEAKER_COLOR)
	var layout_offset: Vector2 = _pending_dialogue.get("layout_offset", Vector2.ZERO)
	var spectrum_offset: Vector2 = _pending_dialogue.get("spectrum_offset", Vector2.ZERO)
	var is_narrator := bool(_pending_dialogue.get("is_narrator", false))

	_render_dialogue_line(speaker_name, line_text, speaker_color)
	if not is_narrator:
		_show_dialogue_spectrum(line_text, speaker_color, layout_offset, spectrum_offset)
	_render_choices(_current_node.get("choices", []))
	_update_advance_hint()


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


func _render_dialogue_line(speaker_name: String, line_text: String, speaker_color: Color) -> void:
	var show_speaker := not speaker_name.is_empty()
	_speaker_label.visible = show_speaker
	_speaker_label.text = speaker_name
	_speaker_label.add_theme_color_override("font_color", speaker_color)
	_dialogue_typewriter.start_line(line_text)
	set_process(true)
	_sync_speaker_label_layout()


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
		var speaker_portrait := String(node.get("portrait", "")).strip_edges()
		if not speaker_portrait.is_empty() and not speaker_id in ids:
			ids.append(speaker_id)
		elif bool(node.get("character_enter", false)) and not speaker_id in ids:
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
			if cast_portrait.is_empty() and cast_id == speaker_id:
				cast_portrait = String(node.get("portrait", "")).strip_edges()
			if not cast_portrait.is_empty() and not cast_id in ids:
				ids.append(cast_id)

	return ids


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

	# 구형 노드 단위 퇴장(화자만) — 하위 호환
	if bool(node.get("character_exit", false)):
		var speaker_id := String(node.get("speaker", ""))
		if (
			not speaker_id.is_empty()
			and not _is_narrator_speaker(speaker_id)
			and _stage_characters.has(speaker_id)
			and not speaker_id in ids
		):
			ids.append(speaker_id)

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
	var exiting := _get_exit_speaker_ids_from_node(_current_node)
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
	_stage_entering_ids.clear()
	_clear_parallax_targets()
	_stage_characters.clear()
	for speaker_id in _stage_character_slots.keys():
		_finalize_hide_character_slot(String(speaker_id))
	_stage_character_slots.clear()
	_portrait_has_layout = false
	_portrait_state = {}


func _get_character_slot(speaker_id: String) -> Dictionary:
	if _stage_character_slots.has(speaker_id):
		return _stage_character_slots[speaker_id]

	var rect := _create_portrait_rect("Portrait_%s" % speaker_id)
	var swap_rect := _create_portrait_rect("PortraitSwap_%s" % speaker_id)
	_character_layer.add_child(rect)
	_character_layer.add_child(swap_rect)
	var slot := {
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
	var rect: TextureRect = slot["rect"]
	var swap_rect: TextureRect = slot["swap_rect"]
	if _character_layer == null:
		return
	_character_layer.move_child(rect, -1)
	_character_layer.move_child(swap_rect, -1)


func _is_node_speaker_cast(cast_id: String, node: Dictionary) -> bool:
	var speaker_id := String(node.get("speaker", ""))
	return not speaker_id.is_empty() and cast_id == speaker_id


func _resolve_cast_portrait_opacity(
	cast_id: String,
	cast_entry: Dictionary,
	fallback_node: Dictionary
) -> float:
	if cast_entry.has("portrait_opacity"):
		return clampf(float(cast_entry.get("portrait_opacity")), 0.0, 1.0)
	if not fallback_node.is_empty() and fallback_node.has("portrait_opacity"):
		return clampf(float(fallback_node.get("portrait_opacity")), 0.0, 1.0)
	if _is_node_speaker_cast(cast_id, fallback_node):
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
	return _resolve_cast_portrait_opacity(cast_id, cast_entry, _current_node)


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


func _apply_slot_highlight(slot: Dictionary, alpha: float) -> void:
	var rect: TextureRect = slot["rect"]
	var swap_rect: TextureRect = slot["swap_rect"]
	if rect != null and rect.visible:
		rect.modulate = Color(1, 1, 1, alpha)
	if swap_rect != null and swap_rect.visible:
		swap_rect.modulate = Color(1, 1, 1, alpha)


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

	var start_alpha := rect.modulate.a
	if absf(start_alpha - target_alpha) < 0.01:
		_apply_slot_highlight(slot, target_alpha)
		return

	_stop_slot_highlight_tween(slot)
	var tween := _create_slot_tween(slot)
	slot["highlight_tween"] = tween
	tween.set_ease(Tween.EASE_OUT)
	tween.set_trans(Tween.TRANS_SINE)
	tween.tween_method(
		func(progress: float) -> void:
			_apply_slot_highlight(slot, lerpf(start_alpha, target_alpha, progress)),
		0.0,
		1.0,
		duration
	)


func _play_stage_cast_animations(
	node: Dictionary,
	speaker_id: String,
	speaker_profile: Dictionary,
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
			var fallback := node if cast_id == speaker_id else {}
			var job := _build_cast_animation_job(cast_id, entry, fallback)
			if not job.is_empty():
				jobs.append(job)
	elif _stage_characters.has(speaker_id):
		var job := _build_cast_animation_job(speaker_id, {}, node)
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
			var fallback := node if cid == speaker_id else {}
			var enter_job := _build_cast_animation_job(cid, entry, fallback)
			if not enter_job.is_empty():
				jobs.append(enter_job)

	if jobs.is_empty():
		_refresh_stage_highlights(_stage_speaker_id, false)
		_invoke_portrait_finished(on_finished)
		return

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


func _resolve_cast_layout_offset(
	cast_id: String,
	cast_entry: Dictionary,
	fallback_node: Dictionary
) -> Vector2:
	var position := ""
	if cast_entry.has("portrait_position"):
		position = String(cast_entry.get("portrait_position", "")).strip_edges()
	elif not fallback_node.is_empty():
		position = String(fallback_node.get("portrait_position", "")).strip_edges()
	if position.is_empty():
		position = "same"

	var key := PortraitLayout.normalize_position(position)
	if key == "custom":
		var offset_source: Variant = null
		if cast_entry.has("portrait_offset"):
			offset_source = cast_entry.get("portrait_offset")
		elif not fallback_node.is_empty() and fallback_node.has("portrait_offset"):
			offset_source = fallback_node.get("portrait_offset")
		return PortraitLayout.get_layout_offset("custom", offset_source)

	if key == "same":
		if _stage_character_slots.has(cast_id):
			var slot_state: Dictionary = _stage_character_slots[cast_id].get("state", {})
			if not slot_state.is_empty() and slot_state.get("visible", false):
				return Vector2(slot_state.get("layout_offset", Vector2.ZERO))
		return PortraitLayout.get_layout_offset("center", null)

	return PortraitLayout.get_layout_offset(key, null)


func _build_cast_animation_job(
	cast_id: String,
	cast_entry: Dictionary,
	fallback_node: Dictionary
) -> Dictionary:
	var profile := _get_speaker_profile(cast_id)
	var portrait_key := String(cast_entry.get("portrait", "")).strip_edges()
	if portrait_key.is_empty() and not fallback_node.is_empty():
		portrait_key = String(fallback_node.get("portrait", "")).strip_edges()
	if portrait_key.is_empty():
		return {}

	var portrait_entry := PortraitLayout.resolve_portrait_entry(profile, portrait_key)
	if portrait_entry.is_empty():
		return {}

	var portrait_path := String(portrait_entry.get("path", ""))
	var texture := _load_portrait_texture(portrait_path)
	if texture == null:
		return {}

	var zoom_percent := _resolve_cast_zoom_percent(cast_id, cast_entry, fallback_node)

	var layout_offset := _resolve_cast_layout_offset(cast_id, cast_entry, fallback_node)

	var target_state := PortraitTransition.build_state(
		portrait_path,
		Vector2(texture.get_width(), texture.get_height()),
		portrait_entry.get("center", Vector2(0.5, 0.5)),
		float(zoom_percent),
		layout_offset,
		true
	)
	var order := int(cast_entry.get("animation_order", 1))
	var animation_speed := _resolve_cast_animation_speed(cast_id, cast_entry, fallback_node)
	var portrait_opacity := _resolve_cast_portrait_opacity(cast_id, cast_entry, fallback_node)

	return {
		"speaker_id": cast_id,
		"order": maxi(order, 1),
		"state": target_state,
		"texture": texture,
		"animation_speed": animation_speed,
		"portrait_opacity": portrait_opacity,
	}


func _resolve_cast_zoom_percent(cast_id: String, cast_entry: Dictionary, fallback_node: Dictionary) -> int:
	if cast_entry.has("portrait_zoom"):
		return PortraitLayout.snap_zoom_percent(int(cast_entry.get("portrait_zoom")))
	if not fallback_node.is_empty() and fallback_node.has("portrait_zoom"):
		return PortraitLayout.snap_zoom_percent(int(fallback_node.get("portrait_zoom")))
	if _is_node_speaker_cast(cast_id, fallback_node):
		return PortraitLayout.snap_zoom_percent(PortraitLayout.ZOOM_DEFAULT)
	return PortraitLayout.snap_zoom_percent(STAGE_CAST_ZOOM_BYSTANDER_DEFAULT)


func _resolve_cast_animation_speed(cast_id: String, cast_entry: Dictionary, fallback_node: Dictionary) -> float:
	if cast_entry.has("animation_speed"):
		return PortraitTransition.normalize_animation_speed(cast_entry.get("animation_speed"))
	if not fallback_node.is_empty() and fallback_node.has("animation_speed"):
		return PortraitTransition.normalize_animation_speed(fallback_node.get("animation_speed"))
	if _is_node_speaker_cast(cast_id, fallback_node):
		return PortraitTransition.ANIMATION_SPEED_DEFAULT
	return PortraitTransition.normalize_animation_speed(STAGE_CAST_ANIMATION_SPEED_BYSTANDER_DEFAULT)


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


func _render_portrait_for_speaker(
	speaker_id: String,
	speaker_profile: Dictionary,
	node: Dictionary,
	on_finished: Callable = Callable()
) -> void:
	var portrait_key := String(node.get("portrait", "")).strip_edges()
	if portrait_key.is_empty():
		_invoke_portrait_finished(on_finished)
		return

	var portrait_entry := PortraitLayout.resolve_portrait_entry(speaker_profile, portrait_key)
	if portrait_entry.is_empty():
		_invoke_portrait_finished(on_finished)
		return

	var portrait_path := String(portrait_entry.get("path", ""))
	var texture := _load_portrait_texture(portrait_path)
	if texture == null:
		_invoke_portrait_finished(on_finished)
		return

	var cast_entry := {}
	if node.has("stage_cast"):
		var stage_cast: Dictionary = node.get("stage_cast", {})
		if stage_cast.has(speaker_id):
			cast_entry = stage_cast[speaker_id]

	var target_state := PortraitTransition.build_state(
		portrait_path,
		Vector2(texture.get_width(), texture.get_height()),
		portrait_entry.get("center", Vector2(0.5, 0.5)),
		float(PortraitLayout.snap_zoom_percent(int(node.get("portrait_zoom", PortraitLayout.ZOOM_DEFAULT)))),
		_resolve_cast_layout_offset(speaker_id, cast_entry, node),
		true
	)
	var animation_speed := _resolve_cast_animation_speed(speaker_id, cast_entry, node)
	_animate_speaker_portrait_to(speaker_id, target_state, texture, on_finished, animation_speed)


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
		_get_dialogue_spectrum_size_ratio()
	)
	_dialogue_spectrum.position = spectrum_pos

	var span := _get_dialogue_spectrum_span()
	if span > 0.0:
		_dialogue_spectrum.set_spectrum_layout(span, _get_dialogue_spectrum_scale())
	_dialogue_spectrum.set_peak_alpha(_get_dialogue_spectrum_peak_alpha())


func _show_dialogue_spectrum(
	line_text: String,
	speaker_color: Color,
	layout_offset: Vector2,
	spectrum_offset: Vector2 = Vector2.ZERO
) -> void:
	if _dialogue_spectrum == null:
		return

	_dialogue_spectrum_active = true
	_dialogue_spectrum_layout_offset = layout_offset
	_dialogue_spectrum_offset = spectrum_offset
	_sync_dialogue_spectrum_layout(layout_offset)
	_dialogue_spectrum.play_line(line_text, speaker_color)


func _hide_dialogue_spectrum() -> void:
	if _dialogue_spectrum == null:
		return

	_dialogue_spectrum_active = false
	_dialogue_spectrum_offset = Vector2.ZERO
	_dialogue_spectrum.finish_line(true)


func _on_dialogue_visible_character_changed(visible_count: int, total_count: int) -> void:
	if _dialogue_spectrum == null or not _dialogue_spectrum_active:
		return

	_dialogue_spectrum.set_typing_progress(visible_count, total_count)


func _on_dialogue_typewriter_finished() -> void:
	if _dialogue_spectrum == null or not _dialogue_spectrum_active:
		return

	_dialogue_spectrum.finish_line()


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
	rect.visible = true
	return true


func _reset_slot_swap_rect(slot: Dictionary) -> void:
	var swap_rect: TextureRect = slot["swap_rect"]
	if swap_rect == null:
		return
	swap_rect.visible = false
	swap_rect.texture = null
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
		tween.tween_property(rect, "modulate:a", target_alpha, fade_in_duration)
		if swap_rect != null and swap_rect.visible:
			tween.tween_property(swap_rect, "modulate:a", target_alpha, fade_in_duration)
		tween.finished.connect(func() -> void:
			slot["tween"] = null
			_invoke_portrait_finished(notify_done)
		, CONNECT_ONE_SHOT)
		return

	var needs_geometry := PortraitTransition.geometry_changed(from_state, target_state)
	var needs_texture := PortraitTransition.texture_changed(from_state, target_state)

	if not needs_geometry and not needs_texture:
		_apply_speaker_portrait_state(speaker_id, target_state.duplicate(true), texture, false)
		var current_alpha: float = rect.modulate.a
		if absf(current_alpha - target_alpha) > 0.01:
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
	if swap_texture:
		tween.tween_property(rect, "modulate:a", 0.0, duration)
		tween.tween_property(swap_rect, "modulate:a", target_alpha, duration)
	elif absf(rect.modulate.a - target_alpha) > 0.01:
		tween.tween_property(rect, "modulate:a", target_alpha, duration)
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
	tween.tween_property(rect, "modulate:a", 0.0, expression_duration)
	tween.tween_property(swap_rect, "modulate:a", target_alpha, expression_duration)
	tween.finished.connect(func() -> void:
		slot["tween"] = null
		_finish_portrait_transition(slot, speaker_id, end_state, texture, on_finished)
	)


func _stop_slot_tween(slot: Dictionary, speaker_id: String = "", restore_highlight: bool = true) -> void:
	var tween: Tween = slot.get("tween")
	if tween != null:
		tween.kill()
	slot["tween"] = null
	var rect: TextureRect = slot.get("rect")
	if rect != null and rect.visible and rect.texture != null and rect.modulate.a < 0.01:
		var alpha := STAGE_CAST_OPACITY_BYSTANDER_DEFAULT
		if not speaker_id.is_empty():
			alpha = _resolve_cast_opacity_for_node(speaker_id)
		_apply_slot_highlight(slot, alpha)
	if restore_highlight and not speaker_id.is_empty():
		_tween_slot_highlight(slot, _resolve_cast_opacity_for_node(speaker_id))
	_reset_slot_swap_rect(slot)


func _hide_character_slot(speaker_id: String, on_finished: Callable = Callable()) -> void:
	if not _stage_character_slots.has(speaker_id):
		_invoke_portrait_finished(on_finished)
		return

	var slot: Dictionary = _stage_character_slots[speaker_id]
	var state: Dictionary = slot["state"]
	var rect: TextureRect = slot["rect"]
	var swap_rect: TextureRect = slot["swap_rect"]
	var should_fade: bool = rect.visible and rect.texture != null
	if should_fade:
		_stop_slot_tween(slot, speaker_id, false)
		_stop_slot_highlight_tween(slot)
		var tween := _create_slot_tween(slot)
		slot["tween"] = tween
		tween.set_parallel(true)
		tween.set_ease(Tween.EASE_IN)
		tween.set_trans(Tween.TRANS_SINE)
		tween.tween_property(rect, "modulate:a", 0.0, PortraitTransition.DURATION_FADE_OUT)
		if swap_rect != null and swap_rect.visible:
			tween.tween_property(swap_rect, "modulate:a", 0.0, PortraitTransition.DURATION_FADE_OUT)
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
	slot.erase("parallax_target_state")
	slot.erase("parallax_target_opacity")
	_parallax_target_speaker_ids.erase(speaker_id)
	slot["state"] = {}
	var rect: TextureRect = slot["rect"]
	if rect != null:
		rect.visible = false
		rect.texture = null
		rect.modulate = Color.WHITE
	_reset_slot_swap_rect(slot)

	if speaker_id == _stage_speaker_id:
		_portrait_has_layout = false
		_portrait_state = {}


func _load_portrait_texture(path: String) -> Texture2D:
	if _portrait_texture_cache.has(path):
		return _portrait_texture_cache[path] as Texture2D

	var texture := load(path) as Texture2D
	if texture != null:
		_portrait_texture_cache[path] = texture
	return texture


func _on_portrait_viewport_resized() -> void:
	_apply_portrait_layout()
	_sync_grid_background()


func _render_choices(raw_choices: Variant) -> void:
	_clear_choices()

	if typeof(raw_choices) != TYPE_ARRAY:
		return

	var choices: Array = raw_choices
	if choices.is_empty():
		return

	_choice_list.visible = true
	for index in choices.size():
		var choice_data: Dictionary = choices[index]
		var choice_button := Button.new()
		choice_button.name = "Choice%dButton" % (index + 1)
		choice_button.text = String(choice_data.get("text", "선택지 %d" % (index + 1)))
		choice_button.custom_minimum_size = Vector2(CHOICE_PANEL_WIDTH, CHOICE_BUTTON_MIN_HEIGHT)
		choice_button.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		_apply_choice_button_theme(choice_button)
		choice_button.pressed.connect(_on_choice_pressed.bind(String(choice_data.get("next", ""))))
		_choice_list.add_child(choice_button)

	if _choice_list.get_child_count() > 0:
		set_preferred_focus_control(_choice_list.get_child(0) as Control)
	refresh_pointer_hover_mode()
	_refresh_choice_button_styles()


func _refresh_choice_button_styles() -> void:
	if _choice_list == null:
		return

	for child in _choice_list.get_children():
		if child is Button:
			_apply_choice_button_theme(child as Button)


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


func _can_advance_dialogue() -> bool:
	if _awaiting_portrait_for_dialogue:
		return false

	if _is_menu_overlay_open():
		return false

	var choices: Array = _current_node.get("choices", [])
	return choices.is_empty()


func _get_advance_hint_text() -> String:
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
	_update_advance_hint()


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
					return "Y"
				"log":
					return "LB"
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


func _handle_shortcut_input(event: InputEvent) -> bool:
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

	return false


func _handle_digital_shortcut_event(event: InputEvent) -> bool:
	if event.is_action_pressed("menu"):
		_toggle_menu_overlay()
		return true

	if _is_menu_overlay_open():
		return false

	if event.is_action_pressed("skip"):
		_on_skip_pressed()
		return true
	if event.is_action_pressed("log"):
		_on_backlog_pressed()
		return true
	if event.is_action_pressed("tree"):
		_on_branch_tree_pressed()
		return true
	if event.is_action_pressed("interact") and _can_advance_dialogue():
		_advance_dialogue()
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


func _advance_dialogue() -> void:
	if not _can_advance_dialogue():
		return

	if not _dialogue_typewriter.request_advance():
		_update_advance_hint()
		return

	if not _has_loaded_dialogue:
		request_screen_change("chapter_select")
		return

	var next_id := String(_current_node.get("next", ""))
	if next_id.is_empty():
		request_screen_change("chapter_select")
		return

	_transition_to_node(next_id)


func _show_menu_overlay() -> void:
	if _menu_overlay == null:
		return

	_set_floating_ui_visible(false)
	_menu_overlay.visible = true
	_update_advance_hint()
	if _menu_continue_button != null and _is_navigation_input_mode_active():
		set_preferred_focus_control(_menu_continue_button)


func _hide_menu_overlay() -> void:
	if _menu_overlay == null:
		return

	_menu_overlay.visible = false
	_set_floating_ui_visible(true)
	_update_advance_hint()
	_restore_dialogue_focus()


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


func _on_choice_pressed(next_id: String) -> void:
	if next_id.is_empty():
		request_screen_change("chapter_select")
		return

	_transition_to_node(next_id)


func _on_skip_pressed() -> void:
	request_screen_change("chapter_select")


func _on_backlog_pressed() -> void:
	request_overlay("backlog")


func _on_branch_tree_pressed() -> void:
	request_overlay("branch_tree")


func _on_menu_pressed() -> void:
	_toggle_menu_overlay()


func _on_input_mode_changed(mode: String) -> void:
	super._on_input_mode_changed(mode)
	call_deferred("_refresh_input_hints")
	call_deferred("_refresh_choice_button_styles")
