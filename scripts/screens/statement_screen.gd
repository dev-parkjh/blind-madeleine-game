extends "res://scripts/screens/screen_base.gd"


func _ready() -> void:
	screen_id = "statement"
	screen_title = "진술"
	skip_allowed = false
	_build()


func _build() -> void:
	make_full_rect()

	var layout := VBoxContainer.new()
	layout.name = "StatementLayout"
	layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_theme_constant_override("separation", 12)
	add_child(layout)

	var header := HBoxContainer.new()
	header.name = "StatementHeader"
	header.add_theme_constant_override("separation", 12)
	layout.add_child(header)

	var title := Label.new()
	title.name = "StatementTitle"
	title.text = "진술"
	title.add_theme_font_size_override("font_size", 28)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(title)

	var skip_state := Label.new()
	skip_state.name = "SkipState"
	skip_state.text = "스킵 불가"
	skip_state.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	header.add_child(skip_state)

	var statement_panel := PanelContainer.new()
	statement_panel.name = "StatementPanel"
	statement_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	statement_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_child(statement_panel)

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.add_theme_constant_override("margin_left", 22)
	margin.add_theme_constant_override("margin_top", 22)
	margin.add_theme_constant_override("margin_right", 22)
	margin.add_theme_constant_override("margin_bottom", 22)
	statement_panel.add_child(margin)

	var statement_text := RichTextLabel.new()
	statement_text.name = "StatementText"
	statement_text.bbcode_enabled = true
	statement_text.text = "Statement text placeholder."
	statement_text.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	statement_text.size_flags_vertical = Control.SIZE_EXPAND_FILL
	margin.add_child(statement_text)

	var navigation := HBoxContainer.new()
	navigation.name = "StatementNavigation"
	navigation.add_theme_constant_override("separation", 8)
	layout.add_child(navigation)

	_add_nav_button(navigation, "PreviousStatementButton", "이전")
	_add_nav_button(navigation, "NextStatementButton", "다음")
	_add_nav_button(navigation, "OpenBacklogButton", "지난 대화")


func _add_nav_button(parent: HBoxContainer, node_name: String, text: String) -> void:
	var button := Button.new()
	button.name = node_name
	button.text = text
	button.custom_minimum_size = Vector2(120, 56)
	parent.add_child(button)
