extends "res://scripts/screens/screen_base.gd"

const DEFAULT_DIALOGUE_ID_BY_CHAPTER = {
	"chapter_001": "chapter_001_intro",
}

const DIALOGUE_PANEL_MIN_HEIGHT := 190.0
const DIALOGUE_BORDER_COLOR := Color(0.52, 0.52, 0.52)
const DIALOGUE_PANEL_COLOR := Color(0.095, 0.09, 0.082, 0.98)
const DEFAULT_SPEAKER_COLOR := Color(0.92, 0.9, 0.84)
const BODY_TEXT_COLOR := Color(0.86, 0.84, 0.78)
const MUTED_TEXT_COLOR := Color(0.6, 0.58, 0.54)
const MENU_OVERLAY_COLOR := Color(0, 0, 0, 0.56)
const KEYCAP_BACKGROUND_COLOR := Color(0.18, 0.17, 0.15, 0.94)
const KEYCAP_BORDER_COLOR := Color(0.42, 0.4, 0.35)
const TOP_MENU_GHOST_HOVER_COLOR := Color(1, 1, 1, 0.07)
const TOP_MENU_GHOST_PRESSED_COLOR := Color(1, 1, 1, 0.11)
const TOP_MENU_GHOST_CORNER_RADIUS := 8
const TOP_MENU_BUTTON_CONTENT_MARGIN := Vector2(8, 2)
const FLOATING_MENU_MARGIN := Vector2(10, 8)
const TOP_MENU_TEXT_OUTLINE_COLOR := Color(0, 0, 0, 1)
const TOP_MENU_TEXT_OUTLINE_SIZE := 1
const TOP_MENU_KEYCAP_FONT_SIZE := 9
const TOP_MENU_KEYCAP_MARGIN_HORIZONTAL := 4
const TOP_MENU_KEYCAP_MARGIN_VERTICAL := 0
const TOP_MENU_KEYCAP_CORNER_RADIUS := 2
const TOP_MENU_KEYCAP_LINE_SPACING := -3
const TOP_MENU_KEYCAP_Y_OFFSET := 2
const TOP_MENU_KEYBOARD_BUTTON_MIN_HEIGHT := 28
const TOP_MENU_KEYBOARD_HINT_SEPARATION := 8
const TOP_MENU_SEPARATOR_MARGIN := {
	"default": 1,
	"keyboard": 2,
	"gamepad": 2,
}
const TOP_MENU_SEPARATOR_MARGIN_RIGHT := {
	"gamepad": 1,
}
const TOP_MENU_TEXT_MIN_SIZE := Vector2(56, 34)
const TOP_MENU_TEXT_BUTTON_MIN_SIZE := Vector2(0, 34)
const TOP_MENU_ICON_MIN_SIZE := Vector2(78, 42)
const TOP_MENU_ICON_VERTICAL_PADDING := 10.0
const TOP_MENU_BAR_SEPARATION := {
	"default": 6,
	"keyboard": 4,
	"gamepad": 4,
}
const TOP_MENU_ICON_TEXT_SEPARATION := {
	"default": 4,
	"gamepad": 5,
}
const TOP_MENU_ICON_MIN_WIDTHS := {
	"default": 78,
	"gamepad": 0,
}
const INPUT_ADVANCE_ICON_HEIGHT := 30
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
		"skip": 18,
		"log": 22,
		"tree": 18,
		"menu": 18,
	},
}

var _chapter_label: Label
var _speaker_label: Label
var _dialogue_text: Label
var _advance_hint_bar: HBoxContainer
var _advance_hint_icon: TextureRect
var _advance_hint_label: Label
var _skip_button: Button
var _backlog_button: Button
var _branch_tree_button: Button
var _menu_button: Button
var _menu_continue_button: Button
var _choice_list: VBoxContainer
var _menu_overlay: Control
var _top_menu_bar: HBoxContainer
var _top_menu_buttons: Dictionary = {}
var _top_menu_separators: Array[MarginContainer] = []

var _dialogue_id := ""
var _current_node_id := ""
var _current_node: Dictionary = {}
var _nodes_by_id: Dictionary = {}
var _has_loaded_dialogue := false
var _input_icon_cache: Dictionary = {}


func setup(payload: Dictionary = {}) -> void:
	setup_payload = payload
	if is_node_ready():
		_load_dialogue_from_payload(payload)


func _ready() -> void:
	screen_id = "story_dialogue"
	screen_title = "일반 대화"
	skip_allowed = true
	_build()
	_load_dialogue_from_payload(setup_payload)


func _input(event: InputEvent) -> void:
	if _should_ignore_gameplay_event(event):
		return

	super._input(event)

	if _handle_shortcut_input(event):
		get_viewport().set_input_as_handled()


func _unhandled_input(event: InputEvent) -> void:
	if _should_ignore_gameplay_event(event):
		return

	if _is_pointer_advance_event(event):
		_advance_dialogue()
		get_viewport().set_input_as_handled()


func _gui_input(event: InputEvent) -> void:
	if _should_ignore_gameplay_event(event):
		return

	if _is_pointer_advance_event(event):
		_advance_dialogue()
		accept_event()


func _build() -> void:
	make_full_rect()

	var layout := VBoxContainer.new()
	layout.name = "StoryDialogueLayout"
	layout.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layout.set_anchors_preset(Control.PRESET_FULL_RECT)
	layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_theme_constant_override("separation", 12)
	add_child(layout)

	var stage := Control.new()
	stage.name = "Stage"
	stage.mouse_filter = Control.MOUSE_FILTER_IGNORE
	stage.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	stage.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_child(stage)

	var background_layer := ColorRect.new()
	background_layer.name = "BackgroundLayer"
	background_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	background_layer.color = Color(0.075, 0.07, 0.065)
	background_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	stage.add_child(background_layer)

	var character_layer := Control.new()
	character_layer.name = "CharacterLayer"
	character_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	character_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	stage.add_child(character_layer)

	var effect_layer := Control.new()
	effect_layer.name = "EffectLayer"
	effect_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	effect_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	stage.add_child(effect_layer)

	var stage_margin := MarginContainer.new()
	stage_margin.name = "StageMargin"
	stage_margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	stage_margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	stage_margin.add_theme_constant_override("margin_left", 18)
	stage_margin.add_theme_constant_override("margin_top", 14)
	stage_margin.add_theme_constant_override("margin_right", 18)
	stage_margin.add_theme_constant_override("margin_bottom", 14)
	stage.add_child(stage_margin)

	_chapter_label = Label.new()
	_chapter_label.name = "ChapterLabel"
	_chapter_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_chapter_label.text = ""
	_chapter_label.add_theme_font_size_override("font_size", 18)
	_chapter_label.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	_chapter_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	stage_margin.add_child(_chapter_label)

	var dialogue_panel := PanelContainer.new()
	dialogue_panel.name = "DialoguePanel"
	dialogue_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	dialogue_panel.custom_minimum_size = Vector2(0, DIALOGUE_PANEL_MIN_HEIGHT)
	dialogue_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	dialogue_panel.add_theme_stylebox_override("panel", _create_dialogue_panel_style())
	layout.add_child(dialogue_panel)

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	margin.add_theme_constant_override("margin_left", 22)
	margin.add_theme_constant_override("margin_top", 16)
	margin.add_theme_constant_override("margin_right", 22)
	margin.add_theme_constant_override("margin_bottom", 16)
	dialogue_panel.add_child(margin)

	var text_layout := VBoxContainer.new()
	text_layout.name = "TextLayout"
	text_layout.mouse_filter = Control.MOUSE_FILTER_IGNORE
	text_layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	text_layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	text_layout.add_theme_constant_override("separation", 8)
	margin.add_child(text_layout)

	_speaker_label = Label.new()
	_speaker_label.name = "SpeakerName"
	_speaker_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_speaker_label.text = ""
	_speaker_label.add_theme_font_size_override("font_size", 20)
	_speaker_label.add_theme_color_override("font_color", DEFAULT_SPEAKER_COLOR)
	text_layout.add_child(_speaker_label)

	_dialogue_text = Label.new()
	_dialogue_text.name = "DialogueText"
	_dialogue_text.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_dialogue_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_dialogue_text.text = ""
	_dialogue_text.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	_dialogue_text.add_theme_font_size_override("font_size", 22)
	_dialogue_text.add_theme_color_override("font_color", BODY_TEXT_COLOR)
	_dialogue_text.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_dialogue_text.size_flags_vertical = Control.SIZE_EXPAND_FILL
	text_layout.add_child(_dialogue_text)

	_choice_list = VBoxContainer.new()
	_choice_list.name = "ChoiceList"
	_choice_list.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_choice_list.visible = false
	_choice_list.add_theme_constant_override("separation", 8)
	text_layout.add_child(_choice_list)

	_advance_hint_bar = HBoxContainer.new()
	_advance_hint_bar.name = "AdvanceHintBar"
	_advance_hint_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_advance_hint_bar.alignment = BoxContainer.ALIGNMENT_END
	_advance_hint_bar.add_theme_constant_override("separation", 6)
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
	_advance_hint_label.add_theme_font_size_override("font_size", 18)
	_advance_hint_label.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	_advance_hint_bar.add_child(_advance_hint_label)

	_build_floating_menu()

	_skip_button.pressed.connect(_on_skip_pressed)
	_backlog_button.pressed.connect(_on_backlog_pressed)
	_branch_tree_button.pressed.connect(_on_branch_tree_pressed)
	_menu_button.pressed.connect(_on_menu_pressed)

	_build_menu_overlay()
	_refresh_input_hints()


func _create_dialogue_panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = DIALOGUE_PANEL_COLOR
	style.border_color = DIALOGUE_BORDER_COLOR
	style.set_border_width_all(2)
	style.set_corner_radius_all(6)
	style.shadow_color = Color(0, 0, 0, 0.34)
	style.shadow_size = 10
	return style


func _build_floating_menu() -> void:
	var ui_layer := Control.new()
	ui_layer.name = "FloatingUILayer"
	ui_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	ui_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(ui_layer)

	_top_menu_bar = HBoxContainer.new()
	_top_menu_bar.name = "DialogueMenuBar"
	_top_menu_bar.mouse_filter = Control.MOUSE_FILTER_STOP
	_top_menu_bar.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	_top_menu_bar.offset_top = FLOATING_MENU_MARGIN.y
	_top_menu_bar.offset_right = -FLOATING_MENU_MARGIN.x
	_top_menu_bar.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	_top_menu_bar.alignment = BoxContainer.ALIGNMENT_END
	_top_menu_bar.add_theme_constant_override("separation", int(TOP_MENU_BAR_SEPARATION["default"]))
	ui_layer.add_child(_top_menu_bar)

	_skip_button = _add_top_menu_button(_top_menu_bar, "SkipButton", "Skip", "skip")
	_add_menu_separator(_top_menu_bar)
	_backlog_button = _add_top_menu_button(_top_menu_bar, "BacklogButton", "Log", "log")
	_add_menu_separator(_top_menu_bar)
	_branch_tree_button = _add_top_menu_button(_top_menu_bar, "BranchTreeButton", "Tree", "tree")
	_add_menu_separator(_top_menu_bar)
	_menu_button = _add_top_menu_button(_top_menu_bar, "MenuButton", "Menu", "menu")


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
	button.add_theme_font_size_override("font_size", 16)
	button.add_theme_color_override("font_color", BODY_TEXT_COLOR)
	button.add_theme_color_override("font_hover_color", DEFAULT_SPEAKER_COLOR)
	button.add_theme_color_override("font_pressed_color", DEFAULT_SPEAKER_COLOR)
	_apply_top_menu_text_outline(button)
	button.add_theme_constant_override("h_separation", 4)
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
	label.add_theme_font_size_override("font_size", 16)
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
	style.set_border_width_all(1)
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
	return _get_current_input_mode() == "mouse"


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
	separator.add_theme_font_size_override("font_size", 16)
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
	panel.custom_minimum_size = Vector2(300, 0)
	panel.add_theme_stylebox_override("panel", _create_dialogue_panel_style())
	center.add_child(panel)

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.add_theme_constant_override("margin_left", 22)
	margin.add_theme_constant_override("margin_top", 18)
	margin.add_theme_constant_override("margin_right", 22)
	margin.add_theme_constant_override("margin_bottom", 18)
	panel.add_child(margin)

	var menu_layout := VBoxContainer.new()
	menu_layout.name = "MenuLayout"
	menu_layout.add_theme_constant_override("separation", 10)
	margin.add_child(menu_layout)

	var title := Label.new()
	title.name = "MenuTitle"
	title.text = "Menu"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 24)
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
	button.custom_minimum_size = Vector2(0, 46)
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	parent.add_child(button)
	return button


func _load_dialogue_from_payload(payload: Dictionary) -> void:
	if _chapter_label != null:
		_chapter_label.text = String(payload.get("chapter_title", ""))

	VisualNovelData.reload()
	_dialogue_id = _resolve_dialogue_id(payload)
	_nodes_by_id.clear()
	_current_node = {}
	_current_node_id = ""
	_has_loaded_dialogue = false

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
	_clear_choices()

	var chapter_title := String(payload.get("chapter_title", ""))
	var body := "대화 데이터가 아직 없습니다."
	if not chapter_title.is_empty():
		body = "%s의 대화 데이터가 아직 없습니다." % chapter_title

	_render_dialogue_line("시스템", body, MUTED_TEXT_COLOR)
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
	var speaker_name := _get_speaker_name(speaker_id, speaker_profile)
	var speaker_color := _get_speaker_color(speaker_profile)
	var line_text := String(_current_node.get("text", ""))

	_render_dialogue_line(speaker_name, line_text, speaker_color)
	_render_choices(_current_node.get("choices", []))
	_update_advance_hint()


func _render_dialogue_line(speaker_name: String, line_text: String, speaker_color: Color) -> void:
	_speaker_label.text = speaker_name
	_speaker_label.add_theme_color_override("font_color", speaker_color)
	_dialogue_text.text = line_text


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
		choice_button.custom_minimum_size = Vector2(0, 48)
		choice_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		choice_button.pressed.connect(_on_choice_pressed.bind(String(choice_data.get("next", ""))))
		_choice_list.add_child(choice_button)

	if _choice_list.get_child_count() > 0:
		set_preferred_focus_control(_choice_list.get_child(0) as Control)


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

	var can_advance := _can_advance_dialogue()
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
	var label_width := font.get_string_size(base_label, HORIZONTAL_ALIGNMENT_LEFT, -1, 16).x
	var keycap_text_width := font.get_string_size(hint, HORIZONTAL_ALIGNMENT_LEFT, -1, TOP_MENU_KEYCAP_FONT_SIZE).x
	var keycap_width := keycap_text_width + float(TOP_MENU_KEYCAP_MARGIN_HORIZONTAL * 2 + 2)
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


func _get_speaker_name(speaker_id: String, speaker_profile: Dictionary) -> String:
	if not speaker_profile.is_empty():
		return String(speaker_profile.get("display_name", speaker_id))
	if not speaker_id.is_empty():
		return speaker_id
	return "서술"


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


func _is_pointer_advance_event(event: InputEvent) -> bool:
	if not _can_advance_dialogue():
		return false

	if event is InputEventMouseButton:
		var mouse_event := event as InputEventMouseButton
		return mouse_event.button_index == MOUSE_BUTTON_LEFT and mouse_event.pressed

	if event is InputEventScreenTouch:
		var touch_event := event as InputEventScreenTouch
		return touch_event.pressed

	return false


func _advance_dialogue() -> void:
	if not _can_advance_dialogue():
		return

	if not _has_loaded_dialogue:
		request_screen_change("chapter_select")
		return

	var next_id := String(_current_node.get("next", ""))
	if next_id.is_empty():
		request_screen_change("chapter_select")
		return

	_show_node(next_id)


func _show_menu_overlay() -> void:
	if _menu_overlay == null:
		return

	_menu_overlay.visible = true
	_update_advance_hint()
	if _menu_continue_button != null and _is_navigation_input_mode_active():
		set_preferred_focus_control(_menu_continue_button)


func _hide_menu_overlay() -> void:
	if _menu_overlay == null:
		return

	_menu_overlay.visible = false
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

	_show_node(next_id)


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
	_refresh_input_hints()
