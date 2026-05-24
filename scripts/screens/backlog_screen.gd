extends "res://scripts/screens/screen_base.gd"


func _ready() -> void:
	screen_id = "backlog"
	screen_title = "지난 대화 보기"
	skip_allowed = false
	_build()


func _build() -> void:
	make_full_rect()

	var layout := VBoxContainer.new()
	layout.name = "BacklogLayout"
	layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_theme_constant_override("separation", 12)
	add_child(layout)

	var header := HBoxContainer.new()
	header.name = "BacklogHeader"
	header.add_theme_constant_override("separation", 12)
	layout.add_child(header)

	var title := Label.new()
	title.name = "BacklogTitle"
	title.text = "지난 대화 보기"
	title.add_theme_font_size_override("font_size", 28)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(title)

	var close_button := Button.new()
	close_button.name = "CloseButton"
	close_button.text = "닫기"
	close_button.pressed.connect(request_close)
	header.add_child(close_button)

	var scroll := ScrollContainer.new()
	scroll.name = "BacklogScroll"
	scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_child(scroll)

	var list := VBoxContainer.new()
	list.name = "BacklogEntryList"
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	list.add_theme_constant_override("separation", 8)
	scroll.add_child(list)

	var placeholder := PanelContainer.new()
	placeholder.name = "BacklogEntryTemplate"
	list.add_child(placeholder)

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.add_theme_constant_override("margin_left", 16)
	margin.add_theme_constant_override("margin_top", 12)
	margin.add_theme_constant_override("margin_right", 16)
	margin.add_theme_constant_override("margin_bottom", 12)
	placeholder.add_child(margin)

	var text := Label.new()
	text.name = "EntryText"
	text.text = "Backlog entry placeholder."
	text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	margin.add_child(text)
