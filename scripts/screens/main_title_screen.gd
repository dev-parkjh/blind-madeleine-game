extends "res://scripts/screens/screen_base.gd"

const MobileLayout = preload("res://scripts/ui/mobile_layout.gd")

var _save_list: VBoxContainer
var _title_layout: VBoxContainer
var _game_title_label: Label
var _menu_columns: HBoxContainer


func _ready() -> void:
	screen_id = "main_title"
	screen_title = "메인 타이틀"
	skip_allowed = false
	_build()


func _notification(what: int) -> void:
	super._notification(what)
	if what == NOTIFICATION_RESIZED:
		_apply_responsive_layout()


func _build() -> void:
	make_full_rect()

	var layout := VBoxContainer.new()
	layout.name = "TitleLayout"
	layout.set_anchors_preset(Control.PRESET_FULL_RECT)
	layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_theme_constant_override("separation", 36)
	add_child(layout)
	_title_layout = layout

	var title := Label.new()
	title.name = "GameTitle"
	title.text = "Blind Madeleine"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 63)
	layout.add_child(title)
	_game_title_label = title

	var menu := HBoxContainer.new()
	menu.name = "MenuColumns"
	menu.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	menu.size_flags_vertical = Control.SIZE_EXPAND_FILL
	menu.add_theme_constant_override("separation", 27)
	layout.add_child(menu)
	_menu_columns = menu

	var new_game_panel := _create_panel("NewGamePanel", "새 게임", "챕터 선택")
	menu.add_child(new_game_panel)
	var new_game_list: VBoxContainer = new_game_panel.get_node("Margin/Content/List")
	_add_new_game_button(new_game_list)
	_add_web_fullscreen_button(new_game_list)

	var save_panel := _create_panel("LoadGamePanel", "불러오기", "세이브 선택")
	menu.add_child(save_panel)
	_save_list = save_panel.get_node("Margin/Content/List")
	_add_disabled_button(_save_list, "SaveSelectItem", "세이브 데이터 없음")
	_apply_responsive_layout()


func _create_panel(panel_name: String, heading: String, list_name: String) -> PanelContainer:
	var panel := PanelContainer.new()
	panel.name = panel_name
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	panel.size_flags_vertical = Control.SIZE_EXPAND_FILL

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.add_theme_constant_override("margin_left", 30)
	margin.add_theme_constant_override("margin_top", 30)
	margin.add_theme_constant_override("margin_right", 30)
	margin.add_theme_constant_override("margin_bottom", 30)
	panel.add_child(margin)

	var content := VBoxContainer.new()
	content.name = "Content"
	content.add_theme_constant_override("separation", 21)
	margin.add_child(content)

	var label := Label.new()
	label.name = "Heading"
	label.text = heading
	label.add_theme_font_size_override("font_size", 36)
	content.add_child(label)

	var list := VBoxContainer.new()
	list.name = "List"
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	list.size_flags_vertical = Control.SIZE_EXPAND_FILL
	list.add_theme_constant_override("separation", 12)
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
	button.custom_minimum_size = Vector2(0, _mobile_scaled_float(108.0, 150.0))
	button.add_theme_font_size_override("font_size", _mobile_scaled_int(24, 32))
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	button.pressed.connect(_on_new_game_pressed)
	parent.add_child(button)
	set_preferred_focus_control(button)


func _add_web_fullscreen_button(parent: VBoxContainer) -> void:
	if not WebDisplayBridge.can_request_fullscreen_landscape():
		return

	var button := Button.new()
	button.name = "FullscreenButton"
	button.text = "전체화면으로 플레이"
	button.icon = _get_mui_icon("FullscreenRounded", 36, Color(0.92, 0.9, 0.84))
	button.expand_icon = true
	button.custom_minimum_size = Vector2(0, _mobile_scaled_float(96.0, 136.0))
	button.add_theme_font_size_override("font_size", _mobile_scaled_int(22, 30))
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	button.pressed.connect(_on_web_fullscreen_pressed)
	parent.add_child(button)


func _add_disabled_button(parent: VBoxContainer, node_name: String, text: String) -> void:
	var button := Button.new()
	button.name = node_name
	button.text = text
	button.disabled = true
	button.custom_minimum_size = Vector2(0, _mobile_scaled_float(96.0, 136.0))
	button.add_theme_font_size_override("font_size", _mobile_scaled_int(22, 30))
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	parent.add_child(button)


func _on_new_game_pressed() -> void:
	VisualNovelData.clear_acquired_info()
	request_screen_change("chapter_select", {"new_game_blackout": true})


func _on_web_fullscreen_pressed() -> void:
	WebDisplayBridge.request_fullscreen_landscape()


func _apply_responsive_layout() -> void:
	if _title_layout != null:
		var margin_x := _mobile_scaled_float(42.0, 56.0)
		var margin_y := _mobile_scaled_float(36.0, 48.0)
		_title_layout.set_anchors_preset(Control.PRESET_FULL_RECT)
		_title_layout.offset_left = margin_x
		_title_layout.offset_top = margin_y
		_title_layout.offset_right = -margin_x
		_title_layout.offset_bottom = -margin_y
		_title_layout.add_theme_constant_override("separation", _mobile_scaled_int(36, 44))
	if _game_title_label != null:
		_game_title_label.add_theme_font_size_override("font_size", _mobile_scaled_int(63, 76))
	if _menu_columns != null:
		_menu_columns.add_theme_constant_override("separation", _mobile_scaled_int(27, 34))

	for panel_name in ["NewGamePanel", "LoadGamePanel"]:
		var panel := get_node_or_null("TitleLayout/MenuColumns/%s" % panel_name) as PanelContainer
		if panel == null:
			continue
		var margin := panel.get_node_or_null("Margin") as MarginContainer
		if margin != null:
			var panel_margin := _mobile_scaled_int(30, 38)
			margin.add_theme_constant_override("margin_left", panel_margin)
			margin.add_theme_constant_override("margin_top", panel_margin)
			margin.add_theme_constant_override("margin_right", panel_margin)
			margin.add_theme_constant_override("margin_bottom", panel_margin)
		var content := panel.get_node_or_null("Margin/Content") as VBoxContainer
		if content != null:
			content.add_theme_constant_override("separation", _mobile_scaled_int(21, 26))
		var heading := panel.get_node_or_null("Margin/Content/Heading") as Label
		if heading != null:
			heading.add_theme_font_size_override("font_size", _mobile_scaled_int(36, 44))
		var list := panel.get_node_or_null("Margin/Content/List") as VBoxContainer
		if list != null:
			list.add_theme_constant_override("separation", _mobile_scaled_int(12, 18))
			for child in list.get_children():
				if child is Button:
					_apply_menu_button_metrics(child as Button)


func _apply_menu_button_metrics(button: Button) -> void:
	var is_primary := button.name == "NewGameButton"
	var base_height := 108.0 if is_primary else 96.0
	var target_height := 150.0 if is_primary else 136.0
	button.custom_minimum_size = Vector2(0, _mobile_scaled_float(base_height, target_height))
	button.add_theme_font_size_override("font_size", _mobile_scaled_int(24 if is_primary else 22, 32 if is_primary else 30))


func _mobile_scaled_float(base_value: float, target_value: float) -> float:
	return MobileLayout.scaled_float(base_value, target_value, _get_layout_size())


func _mobile_scaled_int(base_value: int, target_value: int) -> int:
	return MobileLayout.scaled_int(base_value, target_value, _get_layout_size())


func _get_layout_size() -> Vector2:
	if size.x > 0.0 and size.y > 0.0:
		return size
	return get_viewport().get_visible_rect().size
