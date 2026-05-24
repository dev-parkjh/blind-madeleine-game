extends "res://scripts/screens/screen_base.gd"

const FIRST_CHAPTER_ID := "chapter_001"
const FIRST_CHAPTER_TITLE := "1화 - 비의 장막"
const FIRST_DIALOGUE_ID := "chapter_001_intro"


func _ready() -> void:
	screen_id = "chapter_select"
	screen_title = "챕터 선택"
	skip_allowed = false
	_build()


func _build() -> void:
	make_full_rect()

	var layout := VBoxContainer.new()
	layout.name = "ChapterSelectLayout"
	layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_theme_constant_override("separation", 27)
	add_child(layout)

	var header := HBoxContainer.new()
	header.name = "ChapterSelectHeader"
	header.add_theme_constant_override("separation", 18)
	layout.add_child(header)

	var title := Label.new()
	title.name = "ChapterSelectTitle"
	title.text = "챕터 선택"
	title.add_theme_font_size_override("font_size", 48)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(title)

	var back_button := Button.new()
	back_button.name = "BackButton"
	back_button.text = "뒤로"
	back_button.custom_minimum_size = Vector2(144, 84)
	back_button.pressed.connect(_on_back_pressed)
	header.add_child(back_button)

	var panel := PanelContainer.new()
	panel.name = "ChapterListPanel"
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_child(panel)

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.add_theme_constant_override("margin_left", 30)
	margin.add_theme_constant_override("margin_top", 30)
	margin.add_theme_constant_override("margin_right", 30)
	margin.add_theme_constant_override("margin_bottom", 30)
	panel.add_child(margin)

	var list := VBoxContainer.new()
	list.name = "ChapterList"
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	list.size_flags_vertical = Control.SIZE_EXPAND_FILL
	list.add_theme_constant_override("separation", 15)
	margin.add_child(list)

	var chapter_button := Button.new()
	chapter_button.name = "Chapter001Button"
	chapter_button.text = FIRST_CHAPTER_TITLE
	chapter_button.custom_minimum_size = Vector2(0, 114)
	chapter_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	chapter_button.pressed.connect(_on_first_chapter_pressed)
	list.add_child(chapter_button)
	set_preferred_focus_control(chapter_button)


func _on_first_chapter_pressed() -> void:
	var payload: Dictionary = {
		"chapter_id": FIRST_CHAPTER_ID,
		"chapter_title": FIRST_CHAPTER_TITLE,
		"dialogue_id": FIRST_DIALOGUE_ID,
	}
	request_screen_change("story_dialogue", payload)


func _on_back_pressed() -> void:
	request_screen_change("main_title")
