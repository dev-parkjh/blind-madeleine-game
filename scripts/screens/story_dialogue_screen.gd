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

var _chapter_label: Label
var _speaker_label: Label
var _dialogue_text: Label
var _next_button: Button
var _skip_button: Button
var _backlog_button: Button
var _branch_tree_button: Button
var _choice_list: VBoxContainer

var _dialogue_id := ""
var _current_node_id := ""
var _current_node: Dictionary = {}
var _nodes_by_id: Dictionary = {}
var _has_loaded_dialogue := false


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


func _build() -> void:
	make_full_rect()

	var layout := VBoxContainer.new()
	layout.name = "StoryDialogueLayout"
	layout.set_anchors_preset(Control.PRESET_FULL_RECT)
	layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_theme_constant_override("separation", 12)
	add_child(layout)

	var stage := Control.new()
	stage.name = "Stage"
	stage.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	stage.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_child(stage)

	var background_layer := ColorRect.new()
	background_layer.name = "BackgroundLayer"
	background_layer.color = Color(0.075, 0.07, 0.065)
	background_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	stage.add_child(background_layer)

	var character_layer := Control.new()
	character_layer.name = "CharacterLayer"
	character_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	stage.add_child(character_layer)

	var effect_layer := Control.new()
	effect_layer.name = "EffectLayer"
	effect_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	stage.add_child(effect_layer)

	var stage_margin := MarginContainer.new()
	stage_margin.name = "StageMargin"
	stage_margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	stage_margin.add_theme_constant_override("margin_left", 18)
	stage_margin.add_theme_constant_override("margin_top", 14)
	stage_margin.add_theme_constant_override("margin_right", 18)
	stage_margin.add_theme_constant_override("margin_bottom", 14)
	stage.add_child(stage_margin)

	_chapter_label = Label.new()
	_chapter_label.name = "ChapterLabel"
	_chapter_label.text = ""
	_chapter_label.add_theme_font_size_override("font_size", 18)
	_chapter_label.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	stage_margin.add_child(_chapter_label)

	var dialogue_panel := PanelContainer.new()
	dialogue_panel.name = "DialoguePanel"
	dialogue_panel.custom_minimum_size = Vector2(0, DIALOGUE_PANEL_MIN_HEIGHT)
	dialogue_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	dialogue_panel.add_theme_stylebox_override("panel", _create_dialogue_panel_style())
	layout.add_child(dialogue_panel)

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.add_theme_constant_override("margin_left", 22)
	margin.add_theme_constant_override("margin_top", 16)
	margin.add_theme_constant_override("margin_right", 22)
	margin.add_theme_constant_override("margin_bottom", 16)
	dialogue_panel.add_child(margin)

	var text_layout := VBoxContainer.new()
	text_layout.name = "TextLayout"
	text_layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	text_layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	text_layout.add_theme_constant_override("separation", 8)
	margin.add_child(text_layout)

	_speaker_label = Label.new()
	_speaker_label.name = "SpeakerName"
	_speaker_label.text = ""
	_speaker_label.add_theme_font_size_override("font_size", 20)
	_speaker_label.add_theme_color_override("font_color", DEFAULT_SPEAKER_COLOR)
	text_layout.add_child(_speaker_label)

	_dialogue_text = Label.new()
	_dialogue_text.name = "DialogueText"
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
	_choice_list.visible = false
	_choice_list.add_theme_constant_override("separation", 8)
	text_layout.add_child(_choice_list)

	var command_bar := HBoxContainer.new()
	command_bar.name = "CommandBar"
	command_bar.alignment = BoxContainer.ALIGNMENT_END
	command_bar.add_theme_constant_override("separation", 8)
	text_layout.add_child(command_bar)

	_next_button = _add_command_button(command_bar, "NextButton", "다음")
	_skip_button = _add_command_button(command_bar, "SkipButton", "스킵")
	_backlog_button = _add_command_button(command_bar, "BacklogButton", "지난 대화")
	_branch_tree_button = _add_command_button(command_bar, "BranchTreeButton", "분기트리")

	_next_button.pressed.connect(_on_next_pressed)
	_skip_button.pressed.connect(_on_skip_pressed)
	_backlog_button.disabled = true
	_branch_tree_button.disabled = true

	set_preferred_focus_control(_next_button)


func _create_dialogue_panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = DIALOGUE_PANEL_COLOR
	style.border_color = DIALOGUE_BORDER_COLOR
	style.set_border_width_all(2)
	style.set_corner_radius_all(6)
	style.shadow_color = Color(0, 0, 0, 0.34)
	style.shadow_size = 10
	return style


func _add_command_button(parent: HBoxContainer, node_name: String, text: String) -> Button:
	var button := Button.new()
	button.name = node_name
	button.text = text
	button.focus_mode = Control.FOCUS_ALL
	button.custom_minimum_size = Vector2(72, 46)
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
	_next_button.text = "챕터 선택"
	_next_button.disabled = false
	_skip_button.disabled = false


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
	_update_next_button()


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


func _update_next_button() -> void:
	var choices: Array = _current_node.get("choices", [])
	var next_id := String(_current_node.get("next", ""))

	_next_button.disabled = not choices.is_empty()
	_next_button.text = "다음" if not next_id.is_empty() else "챕터 선택"
	if not _next_button.disabled:
		set_preferred_focus_control(_next_button)


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


func _on_next_pressed() -> void:
	if not _has_loaded_dialogue:
		request_screen_change("chapter_select")
		return

	var next_id := String(_current_node.get("next", ""))
	if next_id.is_empty():
		request_screen_change("chapter_select")
		return

	_show_node(next_id)


func _on_choice_pressed(next_id: String) -> void:
	if next_id.is_empty():
		request_screen_change("chapter_select")
		return

	_show_node(next_id)


func _on_skip_pressed() -> void:
	request_screen_change("chapter_select")
