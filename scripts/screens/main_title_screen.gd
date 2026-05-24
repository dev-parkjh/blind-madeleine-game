extends "res://scripts/screens/screen_base.gd"

var _save_list: VBoxContainer


func _ready() -> void:
	screen_id = "main_title"
	screen_title = "메인 타이틀"
	skip_allowed = false
	_build()


func _build() -> void:
	make_full_rect()

	var layout := VBoxContainer.new()
	layout.name = "TitleLayout"
	layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_theme_constant_override("separation", 24)
	add_child(layout)

	var title := Label.new()
	title.name = "GameTitle"
	title.text = "Blind Madeleine"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 42)
	layout.add_child(title)

	var menu := HBoxContainer.new()
	menu.name = "MenuColumns"
	menu.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	menu.size_flags_vertical = Control.SIZE_EXPAND_FILL
	menu.add_theme_constant_override("separation", 18)
	layout.add_child(menu)

	var new_game_panel := _create_panel("NewGamePanel", "새 게임", "챕터 선택")
	menu.add_child(new_game_panel)
	var new_game_list: VBoxContainer = new_game_panel.get_node("Margin/Content/List")
	_add_new_game_button(new_game_list)

	var save_panel := _create_panel("LoadGamePanel", "불러오기", "세이브 선택")
	menu.add_child(save_panel)
	_save_list = save_panel.get_node("Margin/Content/List")
	_add_disabled_button(_save_list, "SaveSelectItem", "세이브 데이터 없음")


func _create_panel(panel_name: String, heading: String, list_name: String) -> PanelContainer:
	var panel := PanelContainer.new()
	panel.name = panel_name
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	panel.size_flags_vertical = Control.SIZE_EXPAND_FILL

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.add_theme_constant_override("margin_left", 20)
	margin.add_theme_constant_override("margin_top", 20)
	margin.add_theme_constant_override("margin_right", 20)
	margin.add_theme_constant_override("margin_bottom", 20)
	panel.add_child(margin)

	var content := VBoxContainer.new()
	content.name = "Content"
	content.add_theme_constant_override("separation", 14)
	margin.add_child(content)

	var label := Label.new()
	label.name = "Heading"
	label.text = heading
	label.add_theme_font_size_override("font_size", 24)
	content.add_child(label)

	var list := VBoxContainer.new()
	list.name = "List"
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	list.size_flags_vertical = Control.SIZE_EXPAND_FILL
	list.add_theme_constant_override("separation", 8)
	content.add_child(list)

	var list_marker := Label.new()
	list_marker.name = list_name
	list_marker.text = ""
	list_marker.visible = false
	content.add_child(list_marker)

	return panel


func _add_new_game_button(parent: VBoxContainer) -> void:
	var button := Button.new()
	button.name = "NewGameButton"
	button.text = "새 게임"
	button.custom_minimum_size = Vector2(0, 72)
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	button.pressed.connect(_on_new_game_pressed)
	parent.add_child(button)
	button.grab_focus()


func _add_disabled_button(parent: VBoxContainer, node_name: String, text: String) -> void:
	var button := Button.new()
	button.name = node_name
	button.text = text
	button.disabled = true
	button.custom_minimum_size = Vector2(0, 64)
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	parent.add_child(button)


func _on_new_game_pressed() -> void:
	request_screen_change("chapter_select")
