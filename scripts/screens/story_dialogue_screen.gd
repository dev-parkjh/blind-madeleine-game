extends "res://scripts/screens/screen_base.gd"


func _ready() -> void:
	screen_id = "story_dialogue"
	screen_title = "일반 대화"
	skip_allowed = true
	_build()


func _build() -> void:
	make_full_rect()

	var layout := VBoxContainer.new()
	layout.name = "StoryDialogueLayout"
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

	var dialogue_panel := PanelContainer.new()
	dialogue_panel.name = "DialoguePanel"
	dialogue_panel.custom_minimum_size = Vector2(0, 170)
	layout.add_child(dialogue_panel)

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.add_theme_constant_override("margin_left", 20)
	margin.add_theme_constant_override("margin_top", 16)
	margin.add_theme_constant_override("margin_right", 20)
	margin.add_theme_constant_override("margin_bottom", 16)
	dialogue_panel.add_child(margin)

	var text_layout := VBoxContainer.new()
	text_layout.name = "TextLayout"
	text_layout.add_theme_constant_override("separation", 8)
	margin.add_child(text_layout)

	var speaker := Label.new()
	speaker.name = "SpeakerName"
	speaker.text = "SpeakerName"
	speaker.add_theme_font_size_override("font_size", 20)
	text_layout.add_child(speaker)

	var body := RichTextLabel.new()
	body.name = "DialogueText"
	body.bbcode_enabled = true
	body.fit_content = true
	body.text = "Dialogue text placeholder."
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	text_layout.add_child(body)

	var command_bar := HBoxContainer.new()
	command_bar.name = "CommandBar"
	command_bar.add_theme_constant_override("separation", 8)
	text_layout.add_child(command_bar)

	_add_command_button(command_bar, "NextButton", "다음")
	_add_command_button(command_bar, "SkipButton", "스킵")
	_add_command_button(command_bar, "BacklogButton", "지난 대화")
	_add_command_button(command_bar, "BranchTreeButton", "분기트리")

	var choices := VBoxContainer.new()
	choices.name = "ChoiceList"
	choices.visible = false
	text_layout.add_child(choices)


func _add_command_button(parent: HBoxContainer, node_name: String, text: String) -> void:
	var button := Button.new()
	button.name = node_name
	button.text = text
	button.focus_mode = Control.FOCUS_ALL
	parent.add_child(button)
