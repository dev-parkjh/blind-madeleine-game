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
const ADVANCE_HINT_PULSE_MIN_ALPHA := 0.42
const ADVANCE_HINT_PULSE_FADE_DURATION := 0.85
const ADVANCE_HINT_PULSE_PEAK_HOLD := 0.55
const TOUCH_TAP_MAX_DISTANCE_PX := 18.0
const STATEMENT_LIE_META_PREFIX := "statement_lie:"
const STATEMENT_LIE_TEXT_SIDE_PADDING := " "
const STATEMENT_LIE_TEXT_SIDE_PADDING_EXPANDED := "  "
const STATEMENT_LIE_SELECTION_PADDING := Vector2(7.0, 8.0)
const STATEMENT_LIE_SELECTION_PADDING_UNFOLDED := Vector2(9.0, 10.0)
const STATEMENT_LIE_SELECTION_VERTICAL_OFFSET := 1.0
const STATEMENT_LIE_SELECTION_VERTICAL_OFFSET_UNFOLDED := 1.5
const STATEMENT_LIE_SELECTION_BORDER_WIDTH := 3
const STATEMENT_LIE_TEXT_SPEED_MULTIPLIER := 0.15
const STATEMENT_LIE_TEXT_EXIT_SPEED_MULTIPLIER := 0.12
const STATEMENT_ARROW_BUTTON_SIZE := Vector2(72, 108)
const STATEMENT_ARROW_SIDE_GAP := 18.0
const STATEMENT_DIALOGUE_MIN_CENTER_WIDTH := 420.0
const STATEMENT_NOTE_PANEL_WIDTH := 520.0
const STATEMENT_NOTE_PANEL_MARGIN := Vector2(36.0, 54.0)
const STATEMENT_NOTE_OVERLAY_COLOR := Color(0, 0, 0, 0.0)
const STATEMENT_NOTE_SPEAKER_ZOOM := 300
const STATEMENT_NOTE_SPEAKER_OPACITY := 1.0
const STATEMENT_NOTE_PANEL_ENTER_DURATION := 0.45
const STATEMENT_TITLE_FADE_DURATION := 0.3
const STATEMENT_TITLE_HOLD_DURATION := 1.2
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
const POPUP_FRAME_BORDER := Color(0.78, 0.68, 0.49, 0.88)
const POPUP_POSITION_PRESETS := {
	"left": Vector2(0.24, 0.38),
	"center": Vector2(0.5, 0.36),
	"right": Vector2(0.76, 0.38),
	"top_left": Vector2(0.22, 0.22),
	"top_right": Vector2(0.78, 0.22),
}
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


class StatementArrowButton:
	extends Button

	var border_color := Color.WHITE
	var border_width := 3.0
	var corner_radius := 9.0

	func configure(
		next_border_color: Color,
		next_border_width: float,
		next_corner_radius: float
	) -> void:
		border_color = next_border_color
		border_width = next_border_width
		corner_radius = next_corner_radius
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
var _advance_hint_pulse_tween: Tween
var _statement_prev_button: Button
var _statement_next_button: Button
var _statement_phrase_selection_frame: PanelContainer
var _statement_phrase_selection_frames: Array[PanelContainer] = []
var _statement_phrase_selection_color := DEFAULT_SPEAKER_COLOR
var _statement_notebook_overlay: Control
var _statement_notebook_list: VBoxContainer
var _statement_notebook_lie_title: Label
var _statement_notebook_tween: Tween
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
var _floating_ui_tween: Tween
var _top_menu_bar: HBoxContainer
var _top_menu_buttons: Dictionary = {}
var _top_menu_separators: Array[MarginContainer] = []

var _character_layer: Control
var _popup_layer: Control
var _active_popup_items: Array[Dictionary] = []
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
	_dialogue_typewriter.speed_range_active_changed.connect(_on_dialogue_speed_range_active_changed)
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

	if _handle_pointer_retreat_event(event):
		_retreat_dialogue()
		get_viewport().set_input_as_handled()
		return

	if _handle_pointer_advance_event(event):
		_advance_dialogue()
		get_viewport().set_input_as_handled()


func _gui_input(event: InputEvent) -> void:
	if _should_ignore_gameplay_event(event):
		return

	if event is InputEventMouseMotion:
		_sync_statement_hover_from_mouse_position()

	if _handle_pointer_retreat_event(event):
		_retreat_dialogue()
		accept_event()
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
	_build_statement_navigation()
	_build_statement_notebook_overlay()
	_build_statement_loop_prompt_overlay()
	_build_statement_title_overlay()
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

	var background := ColorRect.new()
	background.name = "Background"
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	background.color = _parse_popup_color(popup_data.get("background_color", null), POPUP_FRAME_BACKGROUND)
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_child(background)

	var image_rect := TextureRect.new()
	image_rect.name = "Image"
	image_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	image_rect.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	image_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	image_rect.stretch_mode = TextureRect.STRETCH_SCALE
	image_rect.texture = texture
	root.add_child(image_rect)

	var border := Panel.new()
	border.name = "Border"
	border.mouse_filter = Control.MOUSE_FILTER_IGNORE
	border.set_anchors_preset(Control.PRESET_FULL_RECT)
	border.add_theme_stylebox_override("panel", _create_popup_border_style(popup_data))
	root.add_child(border)

	var item := {
		"root": root,
		"image_rect": image_rect,
		"texture": texture,
		"data": popup_data.duplicate(true),
		"spec": image_spec,
		"tween": null,
	}
	_active_popup_items.append(item)
	_apply_popup_item_layout(item)
	_play_popup_enter_animation(item)


func _create_popup_border_style(popup_data: Dictionary) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0, 0, 0, 0)
	style.border_color = _parse_popup_color(popup_data.get("border_color", null), POPUP_FRAME_BORDER)
	style.set_border_width_all(maxi(int(popup_data.get("border_width", 2)), 0))
	style.set_corner_radius_all(maxi(int(popup_data.get("corner_radius", 8)), 0))
	return style


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
	var image_rect: TextureRect = item.get("image_rect")
	var texture: Texture2D = item.get("texture")
	if root == null or image_rect == null or texture == null:
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

	if bool(spec.get("crop", false)):
		_apply_popup_crop_layout(image_rect, texture, frame_size, spec)
	else:
		_apply_popup_fit_layout(image_rect, texture, frame_size, popup_data)


func _apply_popup_crop_layout(
	image_rect: TextureRect,
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
	image_rect.position = anchor - Vector2(center.x * image_size.x, center.y * image_size.y)
	image_rect.size = image_size


func _apply_popup_fit_layout(
	image_rect: TextureRect,
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
	image_rect.position = anchor - image_size * 0.5
	image_rect.size = image_size


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


func _build_statement_navigation() -> void:
	_statement_prev_button = _create_statement_arrow_button("StatementPreviousButton", "‹")
	_statement_next_button = _create_statement_arrow_button("StatementNextButton", "›")
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
	frame_style.bg_color = Color(
		_statement_phrase_selection_color.r,
		_statement_phrase_selection_color.g,
		_statement_phrase_selection_color.b,
		0.13
	)
	frame_style.border_color = Color(
		_statement_phrase_selection_color.r,
		_statement_phrase_selection_color.g,
		_statement_phrase_selection_color.b,
		0.95
	)
	frame_style.set_border_width_all(STATEMENT_LIE_SELECTION_BORDER_WIDTH)
	frame_style.set_corner_radius_all(4)
	frame.add_theme_stylebox_override("panel", frame_style)


func _create_statement_arrow_button(node_name: String, text: String) -> Button:
	var button := StatementArrowButton.new()
	button.name = node_name
	button.text = text
	button.visible = false
	button.focus_mode = Control.FOCUS_NONE
	button.mouse_default_cursor_shape = Control.CURSOR_ARROW
	button.custom_minimum_size = STATEMENT_ARROW_BUTTON_SIZE
	button.add_theme_font_size_override("font_size", 64)
	button.add_theme_color_override("font_color", BODY_TEXT_COLOR)
	button.add_theme_color_override("font_hover_color", DEFAULT_SPEAKER_COLOR)
	button.add_theme_color_override("font_pressed_color", DEFAULT_SPEAKER_COLOR)
	button.add_theme_color_override("font_disabled_color", BODY_TEXT_COLOR)
	button.configure(
		DIALOGUE_BORDER_COLOR,
		DIALOGUE_BORDER_WIDTH,
		DIALOGUE_CORNER_RADIUS
	)

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
	style.set_border_width_all(0)
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
	panel.custom_minimum_size = Vector2(STATEMENT_NOTE_PANEL_WIDTH, 0)
	panel.add_theme_stylebox_override("panel", _create_dialogue_panel_style())
	_statement_notebook_overlay.add_child(panel)

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.add_theme_constant_override("margin_left", 27)
	margin.add_theme_constant_override("margin_top", 24)
	margin.add_theme_constant_override("margin_right", 27)
	margin.add_theme_constant_override("margin_bottom", 24)
	panel.add_child(margin)

	var layout := VBoxContainer.new()
	layout.name = "NotebookLayout"
	layout.add_theme_constant_override("separation", 18)
	margin.add_child(layout)

	var header := HBoxContainer.new()
	header.name = "Header"
	header.add_theme_constant_override("separation", 12)
	layout.add_child(header)

	var title := Label.new()
	title.name = "Title"
	title.text = "사건수첩"
	title.add_theme_font_size_override("font_size", 34)
	title.add_theme_color_override("font_color", DEFAULT_SPEAKER_COLOR)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(title)

	var close_button := Button.new()
	close_button.name = "CloseButton"
	close_button.text = "×"
	close_button.custom_minimum_size = Vector2(54, 54)
	close_button.focus_mode = Control.FOCUS_ALL
	close_button.pressed.connect(_close_statement_notebook)
	header.add_child(close_button)

	_statement_notebook_lie_title = Label.new()
	_statement_notebook_lie_title.name = "ActivePhrase"
	_statement_notebook_lie_title.text = ""
	_statement_notebook_lie_title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_statement_notebook_lie_title.add_theme_font_size_override("font_size", 22)
	_statement_notebook_lie_title.add_theme_color_override("font_color", BODY_TEXT_COLOR)
	layout.add_child(_statement_notebook_lie_title)

	var scroll := ScrollContainer.new()
	scroll.name = "EntryScroll"
	scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_child(scroll)

	_statement_notebook_list = VBoxContainer.new()
	_statement_notebook_list.name = "EntryList"
	_statement_notebook_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_statement_notebook_list.add_theme_constant_override("separation", 10)
	scroll.add_child(_statement_notebook_list)


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
	_apply_dialogue_overlay_layout()
	_apply_statement_navigation_layout()
	_apply_statement_notebook_layout()
	_apply_fixed_overlay_layout(_statement_loop_prompt_overlay)
	_apply_viewport_overlay_layout(_statement_title_overlay)
	_apply_viewport_overlay_layout(_menu_overlay)
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
	# This screen is hosted inside Main's SafeArea, so viewport overlays need a negative local origin.
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
	_dialogue_overlay.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	_dialogue_overlay.offset_left = float(panel_layout.get("offset_left", 0.0)) + statement_side_reserve
	_dialogue_overlay.offset_top = -float(panel_layout.get("height", DialoguePanelLayout.BASE_MIN_HEIGHT))
	_dialogue_overlay.offset_right = float(panel_layout.get("offset_right", 0.0)) - statement_side_reserve
	_dialogue_overlay.offset_bottom = 0.0
	_apply_dialogue_scale(panel_layout)
	_sync_speaker_label_layout()
	if _is_statement_presentation():
		_set_statement_phrase_selection_visible(false)
		_queue_statement_phrase_selection_frame_update()


func _get_statement_dialogue_side_reserve(panel_layout: Dictionary) -> float:
	if not _is_statement_reveal_layout_active():
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
	var panel_top := viewport_size.y - float(panel_layout.get("height", DialoguePanelLayout.BASE_MIN_HEIGHT))
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
	var panel_width := minf(STATEMENT_NOTE_PANEL_WIDTH, maxf(320.0, viewport_size.x - STATEMENT_NOTE_PANEL_MARGIN.x * 2.0))
	var panel_height := maxf(320.0, viewport_size.y - STATEMENT_NOTE_PANEL_MARGIN.y * 2.0)
	panel.size = Vector2(panel_width, panel_height)
	panel.position = _get_statement_notebook_panel_final_position(panel.size)


func _get_statement_notebook_panel_final_position(panel_size: Vector2) -> Vector2:
	var viewport_size := _statement_notebook_overlay.size if _statement_notebook_overlay != null else _get_layout_viewport_size()
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		viewport_size = get_viewport().get_visible_rect().size
	var panel_layout := _get_dialogue_panel_layout()
	var dialogue_right := clampf(
		viewport_size.x + float(panel_layout.get("offset_right", 0.0)),
		0.0,
		viewport_size.x
	)
	var min_x := STATEMENT_NOTE_PANEL_MARGIN.x
	var max_x := maxf(min_x, viewport_size.x - panel_size.x - STATEMENT_NOTE_PANEL_MARGIN.x)
	var target_x := dialogue_right - panel_size.x - STATEMENT_NOTE_PANEL_MARGIN.x
	return Vector2(clampf(target_x, min_x, max_x), STATEMENT_NOTE_PANEL_MARGIN.y)


func _get_statement_notebook_panel_enter_position(panel_size: Vector2) -> Vector2:
	var final_position := _get_statement_notebook_panel_final_position(panel_size)
	var viewport_size := _statement_notebook_overlay.size if _statement_notebook_overlay != null else _get_layout_viewport_size()
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		viewport_size = get_viewport().get_visible_rect().size
	var panel_layout := _get_dialogue_panel_layout()
	var dialogue_right := clampf(
		viewport_size.x + float(panel_layout.get("offset_right", 0.0)),
		0.0,
		viewport_size.x
	)
	return Vector2(maxf(final_position.x, dialogue_right), final_position.y)


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
		var body_font_size := DialogueTypography.body_font_size_for_layout(panel_layout)
		_dialogue_text.add_theme_font_size_override("normal_font_size", body_font_size)
		_dialogue_text.add_theme_font_size_override("bold_font_size", body_font_size)
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
	var pressed_bg := DIALOGUE_PANEL_COLOR.darkened(0.04)
	_choice_button_style_pressed = _create_choice_button_style(pressed_bg, DIALOGUE_BORDER_COLOR)
	_refresh_statement_loop_prompt_button_styles()


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


func _refresh_statement_loop_prompt_button_styles() -> void:
	for button in [_statement_loop_prompt_yes_button, _statement_loop_prompt_no_button]:
		if button == null:
			continue
		_apply_choice_button_theme(button)
		button.alignment = HORIZONTAL_ALIGNMENT_CENTER


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
	_apply_viewport_overlay_layout(_menu_overlay)


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
	_dialogue_metadata = {}
	_nodes_by_id.clear()
	_statement_node_ids.clear()
	_statement_node_index_by_id.clear()
	_statement_current_lies.clear()
	_statement_lie_ranges.clear()
	_statement_node_history.clear()
	_statement_hovered_lie_index = -1
	_statement_active_lie_index = -1
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

	if _dialogue_id.is_empty():
		_show_empty_dialogue_state(payload)
		return

	if not _begin_dialogue_session(_dialogue_id):
		_show_empty_dialogue_state(payload)


func _begin_dialogue_session(dialogue_id: String) -> bool:
	var dialogue: Dictionary = VisualNovelData.get_dialogue(StringName(dialogue_id))
	if dialogue.is_empty():
		return false

	_dialogue_id = dialogue_id
	_dialogue_metadata = _read_dialogue_metadata(dialogue)
	_nodes_by_id = dialogue.get("_nodes_by_id", {})
	_collect_statement_nodes(dialogue)
	_current_node_id = String(dialogue.get("start", ""))
	if _is_statement_presentation() and not _statement_node_ids.is_empty():
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
	_dialogue_spectrum.set_noise_mode(has_active_statement_lie)


func _get_chained_next_dialogue_id() -> String:
	return String(_dialogue_metadata.get("next_dialogue", "")).strip_edges()


func _grant_node_acquire_info(node: Dictionary) -> void:
	if node.is_empty():
		return
	VisualNovelData.acquire_info_from_data(node)


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
	_statement_title_pending_spectrum = {}
	_statement_reveal_layout_active = false
	_statement_current_lies.clear()
	_statement_lie_ranges.clear()
	_statement_hovered_lie_index = -1
	_statement_active_lie_index = -1
	_statement_lie_revealing = false
	_refresh_statement_controls()
	_set_statement_phrase_selection_visible(false)
	_clear_choices()
	_hide_dialogue_spectrum()
	_clear_popup_images()

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

	_hide_statement_loop_prompt(false)
	_current_node_id = node_id
	_current_node = _nodes_by_id[node_id]
	_clear_popup_images()
	_prune_statement_stage_characters_for_node(_current_node)
	_statement_hovered_lie_index = -1
	_statement_active_lie_index = -1
	_statement_current_lies.clear()
	_statement_lie_ranges.clear()
	_statement_lie_revealing = false
	_set_statement_phrase_selection_visible(false)
	_refresh_statement_controls()
	_refresh_statement_noise_mode()

	var speaker_id := String(_current_node.get("speaker", ""))
	var speaker_profile := _get_speaker_profile(speaker_id)
	var is_narrator := _is_narrator_speaker(speaker_id)
	var speaker_name := _get_speaker_name(speaker_id, speaker_profile)
	var speaker_color := _get_speaker_color(speaker_profile)
	_grant_node_acquire_info(_current_node)
	var line_text := String(_current_node.get("text", ""))
	_show_node_popups(_current_node, speaker_id)
	var layout_offset := Vector2.ZERO
	if not is_narrator:
		var cast_entry := {}
		if _current_node.has("stage_cast"):
			var stage_cast: Dictionary = _current_node.get("stage_cast", {})
			if stage_cast.has(speaker_id):
				cast_entry = stage_cast[speaker_id]
		layout_offset = _resolve_cast_layout_offset(speaker_id, cast_entry)

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
	var line_text := String(_pending_dialogue.get("line_text", ""))
	var speaker_color: Color = _pending_dialogue.get("speaker_color", DEFAULT_SPEAKER_COLOR)
	var layout_offset: Vector2 = _pending_dialogue.get("layout_offset", Vector2.ZERO)
	var spectrum_offset: Vector2 = _pending_dialogue.get("spectrum_offset", Vector2.ZERO)
	var is_narrator := bool(_pending_dialogue.get("is_narrator", false))

	var body_text_color := NARRATOR_TEXT_COLOR if is_narrator else BODY_TEXT_COLOR
	if _is_statement_presentation():
		_render_statement_dialogue_line(speaker_name, line_text, speaker_color, body_text_color)
	else:
		_render_dialogue_line(speaker_name, line_text, speaker_color, body_text_color)
	if not is_narrator:
		if _statement_title_preparing_reveal:
			_statement_title_pending_spectrum = {
				"line_text": line_text,
				"speaker_color": speaker_color,
				"layout_offset": layout_offset,
				"spectrum_offset": spectrum_offset,
			}
			_hide_dialogue_spectrum()
		else:
			_show_dialogue_spectrum(line_text, speaker_color, layout_offset, spectrum_offset)
	_render_choices(_current_node.get("choices", []))
	if _statement_title_preparing_reveal:
		set_process(false)
	_refresh_statement_controls()
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


func _render_dialogue_line(
	speaker_name: String,
	line_text: String,
	speaker_color: Color,
	body_text_color: Color = BODY_TEXT_COLOR,
) -> void:
	_dialogue_text.bbcode_enabled = false
	_dialogue_text.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var show_speaker := not speaker_name.is_empty()
	_speaker_label.visible = show_speaker
	_speaker_label.text = speaker_name
	_speaker_label.add_theme_color_override("font_color", speaker_color)
	_dialogue_text.add_theme_color_override("default_color", body_text_color)
	_dialogue_typewriter.start_line(line_text)
	set_process(true)
	_sync_speaker_label_layout()


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
			if index + 1 < text.length():
				var next := text[index + 1]
				var could_be_number := (next >= "0" and next <= "9") or next == "."
				if could_be_number:
					var close_index := text.find("|", index + 1)
					if close_index >= 0:
						index = close_index + 1
						consumed_custom_pause = true
			if not consumed_custom_pause:
				index += 1
			continue
		display += ch
		index += 1
	return display


func _escape_statement_bbcode(text: String) -> String:
	return text.replace("[", "[lb]").replace("]", "[rb]")


func _refresh_statement_controls() -> void:
	var visible := _is_statement_reveal_layout_active()
	if _statement_prev_button != null:
		_statement_prev_button.visible = visible
		_apply_statement_arrow_button_state(_statement_prev_button, _can_statement_retreat(true))
	if _statement_next_button != null:
		_statement_next_button.visible = visible
		_apply_statement_arrow_button_state(_statement_next_button, _can_statement_button_advance(true))
	if _dialogue_text != null:
		_dialogue_text.mouse_filter = Control.MOUSE_FILTER_STOP if visible else Control.MOUSE_FILTER_IGNORE
	_update_advance_hint()


func _apply_statement_arrow_button_state(button: Button, enabled: bool) -> void:
	button.disabled = not enabled
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND if enabled else Control.CURSOR_ARROW
	button.modulate.a = 1.0 if enabled else 0.5


func _can_statement_advance(ignore_title_lock := false) -> bool:
	if not _is_statement_presentation() or _statement_note_open or _awaiting_portrait_for_dialogue or _statement_loop_prompt_open:
		return false
	if _statement_title_playing and not ignore_title_lock:
		return false
	if _dialogue_typewriter.is_typing():
		return true
	return _has_statement_forward_target()


func _can_statement_button_advance(ignore_title_lock := false) -> bool:
	if not _is_statement_presentation() or _statement_note_open or _awaiting_portrait_for_dialogue or _statement_loop_prompt_open:
		return false
	if _statement_title_playing and not ignore_title_lock:
		return false
	return _has_statement_forward_target()


func _has_statement_forward_target() -> bool:
	if not _statement_node_ids.is_empty() and _is_statement_main_node_id(_current_node_id):
		return true
	if _is_statement_end_node(_current_node):
		return true
	if not String(_current_node.get("next", "")).strip_edges().is_empty():
		return true
	for index in range(_statement_node_history.size() - 1, -1, -1):
		if _is_statement_main_node_id(String(_statement_node_history[index])):
			return true
	return false


func _can_statement_retreat(ignore_title_lock := false) -> bool:
	if not _is_statement_presentation() or _statement_note_open or _awaiting_portrait_for_dialogue or _statement_loop_prompt_open:
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
	_retreat_dialogue(true)


func _on_statement_next_button_pressed() -> void:
	_advance_statement_forward(true)


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
			_show_statement_loop_prompt()
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
	_statement_lie_revealing = false
	_set_statement_phrase_selection_visible(false)
	_show_statement_title_then_node(_statement_node_ids[0])


func _on_dialogue_text_gui_input(event: InputEvent) -> void:
	if not _is_statement_presentation():
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
			_retreat_dialogue()
			accept_event()
		elif mouse_event.button_index == MOUSE_BUTTON_LEFT and _statement_hovered_lie_index < 0:
			_advance_dialogue()
			accept_event()


func _on_dialogue_meta_hover_started(meta: Variant) -> void:
	if not _is_statement_presentation() or _statement_loop_prompt_open:
		return
	var lie_index := _parse_statement_lie_meta(meta)
	if lie_index < 0:
		return
	_statement_hovered_lie_index = lie_index
	_refresh_statement_noise_mode()


func _on_dialogue_meta_hover_ended(meta: Variant) -> void:
	if not _is_statement_presentation() or _statement_loop_prompt_open:
		return
	var lie_index := _parse_statement_lie_meta(meta)
	if lie_index < 0 or lie_index != _statement_hovered_lie_index:
		return
	_statement_hovered_lie_index = -1
	_refresh_statement_noise_mode()


func _on_dialogue_meta_clicked(meta: Variant) -> void:
	if not _is_statement_presentation() or _statement_loop_prompt_open:
		return
	var lie_index := _parse_statement_lie_meta(meta)
	if lie_index < 0:
		return
	_open_statement_notebook(lie_index)


func _sync_statement_hover_from_mouse_position() -> void:
	if not _is_statement_presentation() or _dialogue_text == null or _statement_note_open or _statement_loop_prompt_open:
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


func _open_statement_notebook(lie_index: int) -> void:
	if _statement_loop_prompt_open:
		return
	if lie_index < 0 or lie_index >= _statement_current_lies.size() or _statement_notebook_overlay == null:
		return
	if _dialogue_typewriter.is_typing():
		_dialogue_typewriter.reveal_all()
	_statement_active_lie_index = lie_index
	_statement_note_open = true
	_update_statement_phrase_selection_frame()
	_populate_statement_notebook()
	_prepare_statement_notebook_open_animation()
	_slide_statement_character_for_note(true)
	_refresh_statement_controls()
	_refresh_statement_noise_mode()
	if _statement_notebook_list != null and _statement_notebook_list.get_child_count() > 0 and _is_navigation_input_mode_active():
		set_preferred_focus_control(_statement_notebook_list.get_child(0) as Control)


func _close_statement_notebook(restore_character: bool = true) -> void:
	_hide_statement_notebook_overlay_immediate()
	_statement_note_open = false
	_statement_active_lie_index = -1
	_statement_hovered_lie_index = -1
	_set_statement_phrase_selection_visible(false)
	if restore_character:
		_slide_statement_character_for_note(false)
	_refresh_statement_controls()
	_refresh_statement_noise_mode()


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


func _get_statement_notebook_characters() -> Array:
	if VisualNovelData.has_any_acquired_info():
		return VisualNovelData.get_acquired_characters()
	return VisualNovelData.get_all_characters()


func _get_statement_notebook_items() -> Array:
	if VisualNovelData.has_any_acquired_info():
		return VisualNovelData.get_acquired_items()
	return VisualNovelData.get_all_items()


func _populate_statement_notebook() -> void:
	if _statement_notebook_list == null:
		return

	for child in _statement_notebook_list.get_children():
		_statement_notebook_list.remove_child(child)
		child.queue_free()

	var lie := _statement_current_lies[_statement_active_lie_index] if _statement_active_lie_index >= 0 else {}
	var phrase := String(lie.get("phrase", ""))
	if _statement_notebook_lie_title != null:
		_statement_notebook_lie_title.text = "「%s」" % phrase

	_add_statement_notebook_section("인물")
	var character_count := 0
	for character in _get_statement_notebook_characters():
		if typeof(character) != TYPE_DICTIONARY:
			continue
		var profile: Dictionary = character
		var character_id := String(profile.get("id", ""))
		if character_id.is_empty() or VisualNovelData.is_narrator_character(StringName(character_id)):
			continue
		character_count += 1
		_add_statement_notebook_entry(
			String(profile.get("display_name", character_id)),
			character_id,
			"character",
			character_id
		)
	if character_count == 0:
		_add_statement_notebook_empty("획득한 인물 정보 없음")

	_add_statement_notebook_section("아이템")
	var item_count := 0
	for item in _get_statement_notebook_items():
		if typeof(item) != TYPE_DICTIONARY:
			continue
		var item_profile: Dictionary = item
		var item_id := String(item_profile.get("id", ""))
		if item_id.is_empty():
			continue
		item_count += 1
		_add_statement_notebook_entry(
			String(item_profile.get("name", item_id)),
			item_id,
			"item",
			item_id
		)
	if item_count == 0:
		_add_statement_notebook_empty("획득한 아이템 정보 없음")


func _add_statement_notebook_section(text: String) -> void:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", 20)
	label.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	_statement_notebook_list.add_child(label)


func _add_statement_notebook_empty(text: String) -> void:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", 18)
	label.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	_statement_notebook_list.add_child(label)


func _add_statement_notebook_entry(label: String, sub_label: String, kind: String, target_id: String) -> void:
	var button := Button.new()
	button.text = "%s  %s" % [label, sub_label]
	button.alignment = HORIZONTAL_ALIGNMENT_LEFT
	button.focus_mode = Control.FOCUS_ALL
	button.custom_minimum_size = Vector2(0, 58)
	button.add_theme_font_size_override("font_size", 22)
	button.pressed.connect(_on_statement_notebook_entry_selected.bind(kind, target_id))
	_statement_notebook_list.add_child(button)


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
	if not _statement_note_hidden_character_states.is_empty():
		_invoke_portrait_finished(on_finished)
		return

	var speaker_id := _get_statement_note_speaker_id()
	if speaker_id.is_empty():
		_invoke_portrait_finished(on_finished)
		return

	var cast_ids: Array[String] = []
	var target_opacities: Dictionary = {}
	for raw_id in _stage_characters.keys():
		var cast_id := String(raw_id)
		if cast_id == speaker_id or cast_id.is_empty() or not _stage_character_slots.has(cast_id):
			continue

		var slot: Dictionary = _stage_character_slots[cast_id]
		var state: Dictionary = slot.get("state", {})
		var rect: TextureRect = slot.get("rect")
		var swap_rect: TextureRect = slot.get("swap_rect")
		var rect_visible := rect != null and rect.visible and rect.texture != null
		var state_visible := not state.is_empty() and bool(state.get("visible", false))
		if not rect_visible and not state_visible:
			continue

		_stop_slot_tween(slot, cast_id, false)
		_stop_slot_highlight_tween(slot)
		_statement_note_hidden_character_states[cast_id] = {
			"state": state.duplicate(true),
			"portrait_opacity": float(slot.get("portrait_opacity", _resolve_cast_opacity_for_node(cast_id))),
		}
		slot.erase("parallax_target_state")
		slot.erase("parallax_target_opacity")
		_parallax_target_speaker_ids.erase(cast_id)
		if swap_rect != null:
			swap_rect.visible = false
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
		if rect == null or rect.texture == null:
			finish_one.call()
			continue

		var start_opacity := clampf(float(slot.get("portrait_opacity", _resolve_cast_opacity_for_node(cast_id))), 0.0, 1.0)
		var target_opacity := clampf(float(target_opacities.get(cast_id, start_opacity)), 0.0, 1.0)
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
	if _is_statement_presentation():
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
	if _is_statement_presentation():
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
	_stage_entering_ids.clear()
	_statement_character_shift_active = false
	_statement_character_shift_speaker_id = ""
	_statement_character_shift_original_state = {}
	_statement_note_hidden_character_states.clear()
	_clear_parallax_targets()
	_stage_characters.clear()
	_clear_popup_images()
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
	cast_entry: Dictionary
) -> Vector2:
	var position := ""
	if cast_entry.has("portrait_position"):
		position = String(cast_entry.get("portrait_position", "")).strip_edges()
	if position.is_empty():
		position = "same"

	var key := PortraitLayout.normalize_position(position)
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

	var layout_offset := _resolve_cast_layout_offset(cast_id, cast_entry)

	var target_state := PortraitTransition.build_state(
		portrait_path,
		Vector2(texture.get_width(), texture.get_height()),
		portrait_entry.get("center", Vector2(0.5, 0.5)),
		float(zoom_percent),
		layout_offset,
		true
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

	_refresh_statement_noise_mode()
	_dialogue_spectrum_active = true
	_dialogue_spectrum_layout_offset = layout_offset
	_dialogue_spectrum_offset = spectrum_offset
	_sync_dialogue_spectrum_layout(layout_offset)
	_dialogue_spectrum.play_line(line_text, speaker_color)


func _play_statement_title_pending_spectrum() -> void:
	if _statement_title_pending_spectrum.is_empty():
		return

	var pending := _statement_title_pending_spectrum
	_statement_title_pending_spectrum = {}
	var speaker_color: Color = pending.get("speaker_color", DEFAULT_SPEAKER_COLOR)
	var layout_offset: Vector2 = pending.get("layout_offset", Vector2.ZERO)
	var spectrum_offset: Vector2 = pending.get("spectrum_offset", Vector2.ZERO)
	_show_dialogue_spectrum(
		String(pending.get("line_text", "")),
		speaker_color,
		layout_offset,
		spectrum_offset
	)


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
	if _is_statement_presentation():
		_queue_statement_phrase_selection_frame_update()
		call_deferred("_sync_statement_hover_from_mouse_position")


func _on_dialogue_typewriter_finished() -> void:
	var is_statement := _is_statement_presentation()
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
	if not _is_statement_presentation():
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
	_stop_slot_highlight_tween(slot)
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
	_apply_popup_layouts()
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


func _can_advance_dialogue() -> bool:
	if _is_statement_presentation():
		return _can_statement_advance()

	if _awaiting_portrait_for_dialogue:
		return false

	if _is_menu_overlay_open():
		return false

	var choices: Array = _current_node.get("choices", [])
	return choices.is_empty()


func _get_advance_hint_text() -> String:
	if _is_statement_presentation():
		match _get_current_input_mode():
			"mouse":
				return "Left / Right"
			"touch":
				return ""
			"keyboard":
				return "Space / D"
			"gamepad":
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

	if _is_statement_presentation():
		if event.is_action_pressed("move_right") or event.is_action_pressed("ui_right") or event.is_action_pressed("interact"):
			_advance_dialogue()
			return true
		if event.is_action_pressed("move_left") or event.is_action_pressed("ui_left") or event.is_action_pressed("back"):
			_retreat_dialogue()
			return true

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


func _handle_pointer_retreat_event(event: InputEvent) -> bool:
	if not _is_statement_presentation() or not _can_statement_retreat():
		return false
	if event is InputEventMouseButton:
		var mouse_event := event as InputEventMouseButton
		return (
			mouse_event.button_index == MOUSE_BUTTON_RIGHT
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
	call_deferred("_refresh_statement_controls")
