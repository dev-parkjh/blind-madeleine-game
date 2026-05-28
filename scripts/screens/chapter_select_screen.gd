extends "res://scripts/screens/screen_base.gd"

const FALLBACK_CHAPTER_ID := "chapter_001"
const FALLBACK_CHAPTER_TITLE := "1화 - 비의 장막"
const FALLBACK_DIALOGUE_ID := "chapter_001_intro"

var _chapter_list: VBoxContainer


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

	var scroll := ScrollContainer.new()
	scroll.name = "ChapterScroll"
	scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	margin.add_child(scroll)

	_chapter_list = VBoxContainer.new()
	_chapter_list.name = "ChapterList"
	_chapter_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_chapter_list.add_theme_constant_override("separation", 15)
	scroll.add_child(_chapter_list)

	_populate_chapters()


func _populate_chapters() -> void:
	for child in _chapter_list.get_children():
		child.queue_free()

	var chapters := VisualNovelData.get_all_chapters()
	if chapters.is_empty():
		chapters = [_create_fallback_chapter()]

	var first_button: Button = null
	for chapter in chapters:
		if typeof(chapter) != TYPE_DICTIONARY:
			continue
		var chapter_data: Dictionary = chapter
		var button := _create_chapter_button(chapter_data)
		_chapter_list.add_child(button)
		if first_button == null:
			first_button = button

	if first_button != null:
		set_preferred_focus_control(first_button)


func _create_chapter_button(chapter: Dictionary) -> Button:
	var chapter_id := String(chapter.get("id", ""))
	var chapter_title := String(chapter.get("title", chapter_id))
	var order := int(chapter.get("order", 0))
	var start_dialogue := String(chapter.get("start_dialogue", ""))

	var button := Button.new()
	button.name = "%sButton" % chapter_id
	button.text = ("%d. %s" % [order, chapter_title]) if order > 0 else chapter_title
	button.custom_minimum_size = Vector2(0, 114)
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	button.disabled = start_dialogue.is_empty() or not VisualNovelData.has_dialogue(StringName(start_dialogue))
	button.pressed.connect(func() -> void:
		_on_chapter_pressed(chapter)
	)
	return button


func _create_fallback_chapter() -> Dictionary:
	return {
		"id": FALLBACK_CHAPTER_ID,
		"title": FALLBACK_CHAPTER_TITLE,
		"order": 1,
		"start_dialogue": FALLBACK_DIALOGUE_ID,
		"description": "",
		"metadata": {},
	}


func _on_chapter_pressed(chapter: Dictionary) -> void:
	var payload: Dictionary = {
		"chapter_id": String(chapter.get("id", "")),
		"chapter_title": String(chapter.get("title", "")),
		"dialogue_id": String(chapter.get("start_dialogue", "")),
	}
	request_screen_change("story_dialogue", payload)


func _on_back_pressed() -> void:
	request_screen_change("main_title")
