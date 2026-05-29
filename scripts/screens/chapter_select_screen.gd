extends "res://scripts/screens/screen_base.gd"

const FALLBACK_CHAPTER_ID := "chapter_001"
const FALLBACK_CHAPTER_TITLE := "1화 - 비의 장막"
const FALLBACK_DIALOGUE_ID := "chapter_001_intro"

const TEXT_COLOR := Color(0.74, 0.74, 0.70)
const MUTED_TEXT_COLOR := Color(0.62, 0.61, 0.57)
const DESCRIPTION_COLOR := Color(0.76, 0.74, 0.68)
const LINE_COLOR := Color(0.68, 0.68, 0.64, 0.48)
const SHADOW_COLOR := Color(0.0, 0.0, 0.0, 0.82)

var _bleed_root: Control
var _background_texture: TextureRect
var _background_fallback: ColorRect
var _copy_group: VBoxContainer
var _eyebrow_label: Label
var _eyebrow_left_rule: ChapterRule
var _eyebrow_right_rule: ChapterRule
var _title_label: Label
var _divider: ChapterDivider
var _description_label: Label
var _start_button: Button
var _back_button: Button
var _chapter_selector: HBoxContainer
var _chapters: Array[Dictionary] = []
var _selected_chapter_index := 0


class ChapterVignette:
	extends Control

	func _draw() -> void:
		if size.x <= 0.0 or size.y <= 0.0:
			return

		draw_rect(Rect2(Vector2.ZERO, size), Color(0.0, 0.0, 0.0, 0.14), true)

		var strip_count := 38
		var gradient_width := size.x * 0.56
		var strip_width := gradient_width / float(strip_count)
		for index in range(strip_count):
			var t := float(index) / float(strip_count - 1)
			var alpha := lerpf(0.66, 0.0, pow(t, 1.34))
			draw_rect(
				Rect2(Vector2(strip_width * float(index), 0.0), Vector2(strip_width + 1.0, size.y)),
				Color(0.0, 0.0, 0.0, alpha),
				true
			)

		var bottom_count := 22
		var bottom_height := size.y * 0.30
		var bottom_strip := bottom_height / float(bottom_count)
		for index in range(bottom_count):
			var t := float(index) / float(bottom_count - 1)
			var alpha := lerpf(0.0, 0.42, pow(t, 1.6))
			draw_rect(
				Rect2(Vector2(0.0, size.y - bottom_height + bottom_strip * float(index)), Vector2(size.x, bottom_strip + 1.0)),
				Color(0.0, 0.0, 0.0, alpha),
				true
			)

		draw_rect(Rect2(Vector2.ZERO, Vector2(size.x, size.y * 0.14)), Color(0.0, 0.0, 0.0, 0.18), true)


class ChapterRule:
	extends Control

	var dot_on_right := true

	func _draw() -> void:
		if size.x <= 0.0:
			return

		var y := size.y * 0.5
		var color := LINE_COLOR
		draw_line(Vector2(0.0, y), Vector2(size.x, y), color, 1.0, true)
		var dot_x := size.x - 4.0 if dot_on_right else 4.0
		draw_circle(Vector2(dot_x, y), 2.2, Color(color.r, color.g, color.b, 0.86))
		var tick_x := size.x - 16.0 if dot_on_right else 16.0
		draw_line(Vector2(tick_x, y - 3.0), Vector2(tick_x, y + 3.0), Color(color.r, color.g, color.b, 0.42), 1.0, true)


class ChapterDivider:
	extends Control

	func _draw() -> void:
		if size.x <= 0.0:
			return

		var y := size.y * 0.5
		var left_end := size.x * 0.47
		var right_start := size.x * 0.53
		draw_line(Vector2(0.0, y), Vector2(left_end, y), LINE_COLOR, 1.0, true)
		draw_line(Vector2(right_start, y), Vector2(size.x, y), LINE_COLOR, 1.0, true)

		var center := Vector2(size.x * 0.5, y)
		var ornament_color := Color(LINE_COLOR.r, LINE_COLOR.g, LINE_COLOR.b, 0.82)
		var diamond := PackedVector2Array([
			center + Vector2(0.0, -7.0),
			center + Vector2(8.0, 0.0),
			center + Vector2(0.0, 7.0),
			center + Vector2(-8.0, 0.0),
		])
		draw_colored_polygon(diamond, Color(ornament_color.r, ornament_color.g, ornament_color.b, 0.18))
		draw_polyline(PackedVector2Array([diamond[0], diamond[1], diamond[2], diamond[3], diamond[0]]), ornament_color, 1.0, true)
		draw_line(center + Vector2(-25.0, 0.0), center + Vector2(-12.0, 0.0), ornament_color, 1.0, true)
		draw_line(center + Vector2(12.0, 0.0), center + Vector2(25.0, 0.0), ornament_color, 1.0, true)


func _ready() -> void:
	screen_id = "chapter_select"
	screen_title = "챕터 선택"
	skip_allowed = false
	_build()


func _notification(what: int) -> void:
	super._notification(what)
	if what == NOTIFICATION_RESIZED:
		_update_layout()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		_on_back_pressed()
	elif event.is_action_pressed("ui_left"):
		get_viewport().set_input_as_handled()
		_select_relative_chapter(-1)
	elif event.is_action_pressed("ui_right"):
		get_viewport().set_input_as_handled()
		_select_relative_chapter(1)


func _build() -> void:
	make_full_rect()

	_build_background()
	_build_start_hotspot()
	_build_copy_group()
	_build_chapter_selector()
	_build_back_button()
	_populate_chapters()

	call_deferred("_update_layout")


func _build_background() -> void:
	_bleed_root = Control.new()
	_bleed_root.name = "FullBleedChapterArt"
	_bleed_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_bleed_root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(_bleed_root)

	_background_fallback = ColorRect.new()
	_background_fallback.name = "BackgroundFallback"
	_background_fallback.color = Color(0.025, 0.029, 0.037)
	_background_fallback.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_background_fallback.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_bleed_root.add_child(_background_fallback)

	_background_texture = TextureRect.new()
	_background_texture.name = "ChapterBackground"
	_background_texture.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_background_texture.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_background_texture.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	_background_texture.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_bleed_root.add_child(_background_texture)

	var vignette := ChapterVignette.new()
	vignette.name = "TextVignette"
	vignette.mouse_filter = Control.MOUSE_FILTER_IGNORE
	vignette.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_bleed_root.add_child(vignette)


func _build_start_hotspot() -> void:
	_start_button = Button.new()
	_start_button.name = "StartChapterHotspot"
	_start_button.text = ""
	_start_button.tooltip_text = "챕터 시작"
	_start_button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	_start_button.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_start_button.add_theme_stylebox_override("normal", _create_transparent_button_style())
	_start_button.add_theme_stylebox_override("hover", _create_transparent_button_style())
	_start_button.add_theme_stylebox_override("pressed", _create_transparent_button_style())
	_start_button.add_theme_stylebox_override("focus", _create_transparent_button_style())
	_start_button.pressed.connect(_on_start_pressed)
	add_child(_start_button)
	set_preferred_focus_control(_start_button)


func _build_copy_group() -> void:
	_copy_group = VBoxContainer.new()
	_copy_group.name = "ChapterCopy"
	_copy_group.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_copy_group.add_theme_constant_override("separation", 18)
	add_child(_copy_group)

	var eyebrow := HBoxContainer.new()
	eyebrow.name = "ChapterEyebrow"
	eyebrow.mouse_filter = Control.MOUSE_FILTER_IGNORE
	eyebrow.alignment = BoxContainer.ALIGNMENT_CENTER
	eyebrow.add_theme_constant_override("separation", 30)
	_copy_group.add_child(eyebrow)

	_eyebrow_left_rule = ChapterRule.new()
	_eyebrow_left_rule.name = "LeftRule"
	_eyebrow_left_rule.dot_on_right = true
	_eyebrow_left_rule.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_eyebrow_left_rule.custom_minimum_size = Vector2(132.0, 24.0)
	_eyebrow_left_rule.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	eyebrow.add_child(_eyebrow_left_rule)

	_eyebrow_label = Label.new()
	_eyebrow_label.name = "ChapterNumber"
	_eyebrow_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_eyebrow_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_eyebrow_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_apply_label_shadow(_eyebrow_label, 2, 0.86)
	eyebrow.add_child(_eyebrow_label)

	_eyebrow_right_rule = ChapterRule.new()
	_eyebrow_right_rule.name = "RightRule"
	_eyebrow_right_rule.dot_on_right = false
	_eyebrow_right_rule.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_eyebrow_right_rule.custom_minimum_size = Vector2(132.0, 24.0)
	_eyebrow_right_rule.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	eyebrow.add_child(_eyebrow_right_rule)

	_title_label = Label.new()
	_title_label.name = "ChapterTitle"
	_title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_title_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_title_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_title_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_title_label.add_theme_color_override("font_color", TEXT_COLOR)
	_title_label.add_theme_color_override("font_outline_color", Color(0.0, 0.0, 0.0, 0.70))
	_title_label.add_theme_constant_override("outline_size", 3)
	_apply_label_shadow(_title_label, 6, 0.92)
	_copy_group.add_child(_title_label)

	_divider = ChapterDivider.new()
	_divider.name = "TitleDivider"
	_divider.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_divider.custom_minimum_size = Vector2(0.0, 34.0)
	_divider.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	_copy_group.add_child(_divider)

	_description_label = Label.new()
	_description_label.name = "ChapterDescription"
	_description_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_description_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_description_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_description_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_description_label.add_theme_color_override("font_color", DESCRIPTION_COLOR)
	_description_label.add_theme_constant_override("line_spacing", 10)
	_apply_label_shadow(_description_label, 3, 0.86)
	_copy_group.add_child(_description_label)


func _build_chapter_selector() -> void:
	_chapter_selector = HBoxContainer.new()
	_chapter_selector.name = "ChapterSelector"
	_chapter_selector.visible = false
	_chapter_selector.add_theme_constant_override("separation", 10)
	add_child(_chapter_selector)


func _build_back_button() -> void:
	_back_button = Button.new()
	_back_button.name = "BackButton"
	_back_button.tooltip_text = "뒤로"
	_back_button.icon = _get_mui_icon("ChevronLeftRounded", 36, Color(0.86, 0.85, 0.80))
	_back_button.custom_minimum_size = Vector2(66.0, 66.0)
	_back_button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	_back_button.add_theme_constant_override("h_separation", 0)
	_back_button.add_theme_stylebox_override("normal", _create_ghost_button_style(Color(0.0, 0.0, 0.0, 0.18)))
	_back_button.add_theme_stylebox_override("hover", _create_ghost_button_style(Color(1.0, 1.0, 1.0, 0.10)))
	_back_button.add_theme_stylebox_override("pressed", _create_ghost_button_style(Color(1.0, 1.0, 1.0, 0.16)))
	_back_button.pressed.connect(_on_back_pressed)
	add_child(_back_button)


func _populate_chapters() -> void:
	_chapters.clear()

	var chapters := VisualNovelData.get_all_chapters()
	if chapters.is_empty():
		chapters = [_create_fallback_chapter()]

	for chapter in chapters:
		if typeof(chapter) != TYPE_DICTIONARY:
			continue
		var chapter_data: Dictionary = chapter
		_chapters.append(chapter_data)

	if _chapters.is_empty():
		_chapters.append(_create_fallback_chapter())

	_selected_chapter_index = 0
	_rebuild_chapter_selector()
	_refresh_selected_chapter()


func _rebuild_chapter_selector() -> void:
	for child in _chapter_selector.get_children():
		child.queue_free()

	_chapter_selector.visible = _chapters.size() > 1
	if not _chapter_selector.visible:
		return

	for index in range(_chapters.size()):
		var chapter := _chapters[index]
		var order := int(chapter.get("order", index + 1))
		var button := Button.new()
		button.name = "Chapter%02dSelector" % order
		button.text = "%02d" % order
		button.custom_minimum_size = Vector2(54.0, 42.0)
		button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		button.add_theme_font_size_override("font_size", 18)
		button.pressed.connect(func() -> void:
			_select_chapter(index)
		)
		_chapter_selector.add_child(button)


func _refresh_selected_chapter() -> void:
	var chapter := _get_selected_chapter()
	if chapter.is_empty():
		return

	var order := int(chapter.get("order", _selected_chapter_index + 1))
	var title := String(chapter.get("title", chapter.get("id", ""))).strip_edges()
	var description := _format_description_text(String(chapter.get("description", "")).strip_edges())
	var start_dialogue := String(chapter.get("start_dialogue", "")).strip_edges()
	var can_start := not start_dialogue.is_empty() and VisualNovelData.has_dialogue(StringName(start_dialogue))

	_eyebrow_label.text = "챕터 %d" % maxi(1, order)
	_title_label.text = title if not title.is_empty() else "제목 없음"
	_description_label.text = description if not description.is_empty() else "챕터 설명이 아직 없습니다."
	_start_button.disabled = not can_start
	_start_button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND if can_start else Control.CURSOR_ARROW

	var texture := _get_chapter_cover_texture(chapter)
	_background_texture.texture = texture
	_background_texture.visible = texture != null

	_update_chapter_selector_theme()
	_update_layout()


func _update_chapter_selector_theme() -> void:
	if _chapter_selector == null:
		return

	for index in range(_chapter_selector.get_child_count()):
		var button := _chapter_selector.get_child(index)
		if not button is Button:
			continue
		var chapter_button := button as Button
		var selected := index == _selected_chapter_index
		var fill := Color(0.82, 0.80, 0.72, 0.18 if selected else 0.06)
		var border := Color(0.78, 0.76, 0.68, 0.72 if selected else 0.32)
		chapter_button.add_theme_color_override("font_color", Color(0.90, 0.88, 0.80, 0.95 if selected else 0.58))
		chapter_button.add_theme_stylebox_override("normal", _create_selector_button_style(fill, border))
		chapter_button.add_theme_stylebox_override("hover", _create_selector_button_style(Color(0.82, 0.80, 0.72, 0.24), Color(0.84, 0.82, 0.74, 0.82)))
		chapter_button.add_theme_stylebox_override("pressed", _create_selector_button_style(Color(0.82, 0.80, 0.72, 0.30), Color(0.88, 0.86, 0.78, 0.92)))


func _update_layout() -> void:
	if _bleed_root == null or _copy_group == null:
		return

	_update_full_bleed_offsets()

	var viewport_size := get_viewport().get_visible_rect().size
	var available_size := size
	if available_size.x <= 0.0 or available_size.y <= 0.0:
		return

	var wide := viewport_size.x >= viewport_size.y * 1.05
	var copy_width := clampf(available_size.x * (0.34 if wide else 0.84), 400.0, 660.0)
	var copy_x := clampf(available_size.x * (0.045 if wide else 0.08), 24.0, 138.0)
	var copy_y := clampf(available_size.y * (0.205 if wide else 0.15), 82.0, 230.0)
	var copy_height := available_size.y - copy_y - clampf(available_size.y * 0.10, 54.0, 110.0)

	if not wide:
		copy_x = (available_size.x - copy_width) * 0.5
		copy_height = minf(copy_height, available_size.y * 0.58)

	_copy_group.position = Vector2(copy_x, copy_y)
	_copy_group.size = Vector2(copy_width, copy_height)

	var title_size := int(clampf(copy_width * (0.198 if wide else 0.155), 64.0, 126.0))
	var eyebrow_size := int(clampf(copy_width * 0.044, 20.0, 29.0))
	var description_size := int(clampf(copy_width * 0.040, 19.0, 27.0))
	var divider_width := clampf(copy_width * 0.72, 260.0, 430.0)
	var rule_width := clampf(copy_width * 0.22, 82.0, 136.0)

	_eyebrow_label.add_theme_font_size_override("font_size", eyebrow_size)
	_eyebrow_label.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	_eyebrow_left_rule.custom_minimum_size = Vector2(rule_width, 24.0)
	_eyebrow_right_rule.custom_minimum_size = Vector2(rule_width, 24.0)
	_title_label.add_theme_font_size_override("font_size", title_size)
	_title_label.custom_minimum_size = Vector2(0.0, float(title_size) * 1.28)
	_divider.custom_minimum_size = Vector2(divider_width, 34.0)
	_description_label.add_theme_font_size_override("font_size", description_size)

	if _chapter_selector != null and _chapter_selector.visible:
		_chapter_selector.position = Vector2(copy_x, available_size.y - 62.0)
		_chapter_selector.size = Vector2(copy_width, 46.0)

	if _back_button != null:
		var back_size := Vector2(66.0, 66.0)
		_back_button.position = Vector2(6.0, 6.0)
		_back_button.size = back_size


func _update_full_bleed_offsets() -> void:
	if _bleed_root == null or not is_inside_tree():
		return

	var viewport_size := get_viewport().get_visible_rect().size
	var origin := get_global_rect().position
	_bleed_root.offset_left = -origin.x
	_bleed_root.offset_top = -origin.y
	_bleed_root.offset_right = viewport_size.x - origin.x - size.x
	_bleed_root.offset_bottom = viewport_size.y - origin.y - size.y


func _select_relative_chapter(delta: int) -> void:
	if _chapters.size() <= 1:
		return

	_select_chapter(posmod(_selected_chapter_index + delta, _chapters.size()))


func _select_chapter(index: int) -> void:
	if _chapters.is_empty():
		return

	_selected_chapter_index = clampi(index, 0, _chapters.size() - 1)
	_refresh_selected_chapter()


func _get_selected_chapter() -> Dictionary:
	if _chapters.is_empty():
		return {}

	return _chapters[clampi(_selected_chapter_index, 0, _chapters.size() - 1)]


func _get_chapter_cover_texture(chapter: Dictionary) -> Texture2D:
	var image_path := _get_chapter_cover_path(chapter)
	if image_path.is_empty():
		return null

	if _can_load_imported_texture(image_path):
		var imported_texture := load(image_path) as Texture2D
		if imported_texture != null:
			return imported_texture

	return _load_source_image_texture(image_path)


func _get_chapter_cover_path(chapter: Dictionary) -> String:
	for key in ["image", "cover", "background", "thumbnail"]:
		var value := String(chapter.get(key, "")).strip_edges()
		if not value.is_empty():
			return value

	var metadata: Variant = chapter.get("metadata", {})
	if typeof(metadata) == TYPE_DICTIONARY:
		for key in ["image", "cover", "background", "thumbnail"]:
			var value := String((metadata as Dictionary).get(key, "")).strip_edges()
			if not value.is_empty():
				return value

	return ""


func _can_load_imported_texture(image_path: String) -> bool:
	var import_path := "%s.import" % image_path
	if not FileAccess.file_exists(import_path):
		return ResourceLoader.exists(image_path)

	var import_file := FileAccess.open(import_path, FileAccess.READ)
	if import_file == null:
		return ResourceLoader.exists(image_path)

	var import_text := import_file.get_as_text()
	var marker := 'path="'
	var path_start := import_text.find(marker)
	if path_start < 0:
		return ResourceLoader.exists(image_path)

	path_start += marker.length()
	var path_end := import_text.find('"', path_start)
	if path_end < 0:
		return ResourceLoader.exists(image_path)

	var remap_path := import_text.substr(path_start, path_end - path_start)
	return FileAccess.file_exists(remap_path)


func _load_source_image_texture(image_path: String) -> Texture2D:
	if not FileAccess.file_exists(image_path):
		return null

	var image := Image.new()
	var err := image.load(image_path)
	if err != OK:
		return null

	return ImageTexture.create_from_image(image)


func _format_description_text(description: String) -> String:
	var normalized := description.replace("\r\n", "\n").replace("\r", "\n")
	while normalized.contains("\n\n"):
		normalized = normalized.replace("\n\n", "\n")
	return normalized


func _create_fallback_chapter() -> Dictionary:
	return {
		"id": FALLBACK_CHAPTER_ID,
		"title": FALLBACK_CHAPTER_TITLE,
		"order": 1,
		"start_dialogue": FALLBACK_DIALOGUE_ID,
		"description": "",
		"metadata": {},
	}


func _apply_label_shadow(label: Label, y_offset: int, alpha: float) -> void:
	label.add_theme_color_override("font_shadow_color", Color(SHADOW_COLOR.r, SHADOW_COLOR.g, SHADOW_COLOR.b, alpha))
	label.add_theme_constant_override("shadow_offset_x", 0)
	label.add_theme_constant_override("shadow_offset_y", y_offset)
	label.add_theme_constant_override("shadow_outline_size", 2)


func _create_transparent_button_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.0, 0.0, 0.0, 0.0)
	style.border_color = Color(0.0, 0.0, 0.0, 0.0)
	style.set_border_width_all(0)
	style.set_content_margin_all(0.0)
	return style


func _create_ghost_button_style(color: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.border_color = Color(1.0, 1.0, 1.0, 0.10)
	style.set_border_width_all(1)
	style.set_corner_radius_all(6)
	style.set_content_margin_all(0.0)
	return style


func _create_selector_button_style(fill: Color, border: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = fill
	style.border_color = border
	style.set_border_width_all(1)
	style.set_corner_radius_all(4)
	style.content_margin_left = 10.0
	style.content_margin_right = 10.0
	style.content_margin_top = 5.0
	style.content_margin_bottom = 5.0
	return style


func _on_start_pressed() -> void:
	_on_chapter_pressed(_get_selected_chapter())


func _on_chapter_pressed(chapter: Dictionary) -> void:
	if chapter.is_empty():
		return

	var payload: Dictionary = {
		"chapter_id": String(chapter.get("id", "")),
		"chapter_title": String(chapter.get("title", "")),
		"dialogue_id": String(chapter.get("start_dialogue", "")),
	}
	request_screen_change("story_dialogue", payload)


func _on_back_pressed() -> void:
	request_screen_change("main_title")
