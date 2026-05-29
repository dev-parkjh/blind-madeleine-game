extends "res://scripts/screens/screen_base.gd"

const FALLBACK_CHAPTER_ID := "chapter_001"
const FALLBACK_CHAPTER_TITLE := "1화 - 비의 장막"
const FALLBACK_DIALOGUE_ID := "chapter_001_intro"

const TEXT_COLOR := Color(0.74, 0.74, 0.70)
const MUTED_TEXT_COLOR := Color(0.62, 0.61, 0.57)
const DESCRIPTION_COLOR := Color(0.76, 0.74, 0.68)
const LINE_COLOR := Color(0.68, 0.68, 0.64, 0.48)
const SHADOW_COLOR := Color(0.0, 0.0, 0.0, 0.82)
const PARALLAX_DEFAULT_STRENGTH := 42.0
const CHAPTER_TITLE_DEFAULT_POSITION := Vector2(0.045, 0.205)
const PARALLAX_SMOOTH_RATE := 7.5
const PARALLAX_MOTION_DECAY := 2.2
const INPUT_ICON_PATHS := {
	"xbox_a": "res://assets/icon/input/xbox_button_color_a_outline.png",
	"stick_l_left": "res://assets/icon/input/xbox_stick_l_left.png",
	"stick_l_right": "res://assets/icon/input/xbox_stick_l_right.png",
}
const KEYCAP_BACKGROUND_COLOR := Color(0.18, 0.17, 0.15, 0.88)
const KEYCAP_BORDER_COLOR := Color(0.54, 0.52, 0.46, 0.84)
const INPUT_HINT_TEXT_COLOR := Color(0.88, 0.86, 0.78, 0.92)
const SIDE_HINT_MARGIN := Vector2(30.0, 0.0)
const SIDE_HINT_KEYCAP_SIZE := Vector2(46.0, 40.0)
const SIDE_HINT_ICON_HEIGHT := 48
const SELECT_HINT_ICON_HEIGHT := 34
const SELECT_HINT_MARGIN := Vector2(28.0, 24.0)
const CHAPTER_CAROUSEL_WIDTH_RATIO := 0.84
const CHAPTER_CAROUSEL_MIN_WIDTH_RATIO := 0.72
const CHAPTER_CAROUSEL_SLIDE_DURATION := 0.34
const CHAPTER_CAROUSEL_SIDE_ALPHA := 0.32
const CHAPTER_CAROUSEL_FAR_ALPHA := 0.0
const CHAPTER_CAROUSEL_SIDE_SCALE := 0.96

var _bleed_root: Control
var _parallax_root: Control
var _chapter_carousel_root: Control
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
var _chapter_selector: ChapterIndicator
var _left_nav_hint: HBoxContainer
var _right_nav_hint: HBoxContainer
var _left_nav_keycap: PanelContainer
var _right_nav_keycap: PanelContainer
var _left_nav_icon: TextureRect
var _right_nav_icon: TextureRect
var _select_action_hint: HBoxContainer
var _select_action_icon: TextureRect
var _select_action_keycap: PanelContainer
var _select_action_label: Label
var _chapters: Array[Dictionary] = []
var _selected_chapter_index := 0
var _parallax_layers: Array[Dictionary] = []
var _parallax_enabled := false
var _parallax_strength := PARALLAX_DEFAULT_STRENGTH
var _parallax_target := Vector2.ZERO
var _parallax_offset := Vector2.ZERO
var _chapter_motion_offset := Vector2.ZERO
var _input_icon_cache: Dictionary = {}
var _chapter_carousel_items: Array[Dictionary] = []
var _chapter_carousel_tween: Tween


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


class ChapterIndicator:
	extends Control

	signal chapter_requested(index: int)

	const DOT_DIAMETER := 7.0
	const ACTIVE_WIDTH := 32.0
	const ACTIVE_HEIGHT := 7.0
	const GAP := 12.0
	const HIT_PADDING := 10.0
	const TRANSITION_DURATION := 0.24
	const ACTIVE_COLOR := Color(0.92, 0.90, 0.82, 0.96)
	const INACTIVE_COLOR := Color(0.74, 0.72, 0.65, 0.52)
	const HOVER_COLOR := Color(0.92, 0.90, 0.82, 0.74)
	const SHADOW_COLOR := Color(0.0, 0.0, 0.0, 0.48)

	var count := 0
	var selected_index := 0
	var _progresses: Array[float] = []
	var _hovered_index := -1
	var _transition_tween: Tween

	func _init() -> void:
		mouse_filter = Control.MOUSE_FILTER_STOP
		mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		custom_minimum_size = get_preferred_size()


	func set_count(value: int, initial_index := 0) -> void:
		count = maxi(0, value)
		selected_index = clampi(initial_index, 0, maxi(count - 1, 0))
		_hovered_index = -1
		_progresses.clear()
		for index in range(count):
			_progresses.append(1.0 if index == selected_index else 0.0)
		visible = count > 1
		custom_minimum_size = get_preferred_size()
		update_minimum_size()
		queue_redraw()


	func set_selected_index(value: int, animated := true) -> void:
		if count <= 0:
			return

		var next_index := clampi(value, 0, count - 1)
		selected_index = next_index
		_ensure_progress_count()

		if _transition_tween != null and _transition_tween.is_valid():
			_transition_tween.kill()
		_transition_tween = null

		if not animated:
			for index in range(count):
				_progresses[index] = 1.0 if index == selected_index else 0.0
			custom_minimum_size = get_preferred_size()
			update_minimum_size()
			queue_redraw()
			return

		_transition_tween = create_tween()
		_transition_tween.set_parallel(true)
		_transition_tween.set_ease(Tween.EASE_OUT)
		_transition_tween.set_trans(Tween.TRANS_CUBIC)
		for index in range(count):
			var target := 1.0 if index == selected_index else 0.0
			_transition_tween.tween_method(
				_set_indicator_progress.bind(index),
				_get_indicator_progress(index),
				target,
				TRANSITION_DURATION
			)
		_transition_tween.finished.connect(func() -> void:
			_transition_tween = null
		)


	func get_preferred_size() -> Vector2:
		if count <= 0:
			return Vector2(0.0, 34.0)
		var width := DOT_DIAMETER * float(count) + GAP * float(maxi(count - 1, 0)) + (ACTIVE_WIDTH - DOT_DIAMETER)
		return Vector2(width + HIT_PADDING * 2.0, 34.0)


	func _notification(what: int) -> void:
		if what == NOTIFICATION_MOUSE_EXIT:
			if _hovered_index != -1:
				_hovered_index = -1
				queue_redraw()


	func _gui_input(event: InputEvent) -> void:
		if count <= 1:
			return

		if event is InputEventMouseMotion:
			var hovered := _get_index_at_position((event as InputEventMouseMotion).position)
			if hovered != _hovered_index:
				_hovered_index = hovered
				queue_redraw()
		elif event is InputEventMouseButton:
			var mouse_event := event as InputEventMouseButton
			if mouse_event.button_index == MOUSE_BUTTON_LEFT and mouse_event.pressed:
				var clicked := _get_index_at_position(mouse_event.position)
				if clicked >= 0:
					accept_event()
					chapter_requested.emit(clicked)


	func _draw() -> void:
		if count <= 1:
			return

		var rects := _get_indicator_rects()
		for index in range(rects.size()):
			var rect: Rect2 = rects[index]
			var progress := _get_indicator_progress(index)
			var color := INACTIVE_COLOR.lerp(ACTIVE_COLOR, progress)
			if index == _hovered_index and index != selected_index:
				color = color.lerp(HOVER_COLOR, 0.48)

			_draw_pill(Rect2(rect.position + Vector2(0.0, 1.5), rect.size), SHADOW_COLOR)
			_draw_pill(rect, color)

			if progress > 0.01:
				var highlight := Color(1.0, 1.0, 1.0, 0.12 * progress)
				var highlight_rect := Rect2(rect.position + Vector2(rect.size.y * 0.35, 1.0), Vector2(maxf(0.0, rect.size.x - rect.size.y * 0.7), 1.0))
				draw_rect(highlight_rect, highlight, true)


	func _draw_pill(rect: Rect2, color: Color) -> void:
		var radius := rect.size.y * 0.5
		if rect.size.x <= rect.size.y:
			draw_circle(rect.position + Vector2(radius, radius), radius, color)
			return

		draw_rect(Rect2(rect.position + Vector2(radius, 0.0), Vector2(rect.size.x - rect.size.y, rect.size.y)), color, true)
		draw_circle(rect.position + Vector2(radius, radius), radius, color)
		draw_circle(rect.position + Vector2(rect.size.x - radius, radius), radius, color)


	func _get_indicator_rects() -> Array[Rect2]:
		var rects: Array[Rect2] = []
		if count <= 0:
			return rects

		_ensure_progress_count()
		var widths: Array[float] = []
		var total_width := 0.0
		for index in range(count):
			var progress := _get_indicator_progress(index)
			var item_width := lerpf(DOT_DIAMETER, ACTIVE_WIDTH, progress)
			widths.append(item_width)
			total_width += item_width
		total_width += GAP * float(maxi(count - 1, 0))

		var x := (size.x - total_width) * 0.5
		var center_y := size.y * 0.5
		for index in range(count):
			var progress := _get_indicator_progress(index)
			var item_width := widths[index]
			var item_height := lerpf(DOT_DIAMETER, ACTIVE_HEIGHT, progress)
			rects.append(Rect2(Vector2(x, center_y - item_height * 0.5), Vector2(item_width, item_height)))
			x += item_width + GAP
		return rects


	func _get_index_at_position(position: Vector2) -> int:
		var rects := _get_indicator_rects()
		for index in range(rects.size()):
			if rects[index].grow(HIT_PADDING).has_point(position):
				return index
		return -1


	func _set_indicator_progress(value: float, index: int) -> void:
		if index < 0 or index >= _progresses.size():
			return

		_progresses[index] = clampf(value, 0.0, 1.0)
		custom_minimum_size = get_preferred_size()
		queue_redraw()


	func _get_indicator_progress(index: int) -> float:
		if index < 0 or index >= _progresses.size():
			return 1.0 if index == selected_index else 0.0
		return _progresses[index]


	func _ensure_progress_count() -> void:
		while _progresses.size() < count:
			var index := _progresses.size()
			_progresses.append(1.0 if index == selected_index else 0.0)
		while _progresses.size() > count:
			_progresses.pop_back()


func _ready() -> void:
	screen_id = "chapter_select"
	screen_title = "챕터 선택"
	skip_allowed = false
	set_process(false)
	_build()


func _notification(what: int) -> void:
	super._notification(what)
	if what == NOTIFICATION_RESIZED:
		_update_layout()


func _process(delta: float) -> void:
	if not _parallax_enabled:
		return

	var input_offset := _get_sensor_parallax_offset()
	if input_offset == Vector2.ZERO:
		input_offset = _get_pointer_parallax_offset()

	_chapter_motion_offset = _chapter_motion_offset.move_toward(Vector2.ZERO, delta * PARALLAX_MOTION_DECAY)
	_parallax_target = (input_offset + _chapter_motion_offset).limit_length(1.4)
	var weight := 1.0 - exp(-PARALLAX_SMOOTH_RATE * delta)
	_parallax_offset = _parallax_offset.lerp(_parallax_target, weight)
	_layout_parallax_layers()


func _input(event: InputEvent) -> void:
	super._input(event)
	if _should_ignore_gameplay_event(event):
		return
	if _handle_navigation_input(event):
		get_viewport().set_input_as_handled()


func _unhandled_input(event: InputEvent) -> void:
	if _handle_navigation_input(event):
		get_viewport().set_input_as_handled()


func _handle_navigation_input(event: InputEvent) -> bool:
	if event.is_action_pressed("ui_cancel"):
		_on_back_pressed()
		return true

	if not _is_navigation_input_mode_active():
		return false

	if event.is_action_pressed("ui_left") or event.is_action_pressed("move_left"):
		_select_relative_chapter(-1)
		return true
	if event.is_action_pressed("ui_right") or event.is_action_pressed("move_right"):
		_select_relative_chapter(1)
		return true
	if event.is_action_pressed("ui_accept") or event.is_action_pressed("interact"):
		_on_start_pressed()
		return true

	return false


func _build() -> void:
	make_full_rect()

	_build_background()
	_build_start_hotspot()
	_build_copy_group()
	_build_chapter_selector()
	_build_back_button()
	_build_input_hints()
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
	_background_texture.visible = false
	_bleed_root.add_child(_background_texture)

	_chapter_carousel_root = Control.new()
	_chapter_carousel_root.name = "ChapterImageCarousel"
	_chapter_carousel_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_chapter_carousel_root.clip_contents = false
	_chapter_carousel_root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_bleed_root.add_child(_chapter_carousel_root)

	_parallax_root = Control.new()
	_parallax_root.name = "ChapterParallaxLayers"
	_parallax_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_parallax_root.clip_contents = true
	_parallax_root.visible = false
	_parallax_root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_bleed_root.add_child(_parallax_root)

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
	_chapter_selector = ChapterIndicator.new()
	_chapter_selector.name = "ChapterSelector"
	_chapter_selector.visible = false
	_chapter_selector.chapter_requested.connect(_select_chapter)
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


func _build_input_hints() -> void:
	_left_nav_hint = _create_side_nav_hint("LeftChapterHint", "A", "stick_l_left")
	add_child(_left_nav_hint)

	_right_nav_hint = _create_side_nav_hint("RightChapterHint", "D", "stick_l_right")
	add_child(_right_nav_hint)

	_select_action_hint = HBoxContainer.new()
	_select_action_hint.name = "ChapterSelectActionHint"
	_select_action_hint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_select_action_hint.alignment = BoxContainer.ALIGNMENT_END
	_select_action_hint.add_theme_constant_override("separation", 10)
	add_child(_select_action_hint)

	_select_action_icon = _create_input_icon_rect("SelectGamepadIcon", "xbox_a", SELECT_HINT_ICON_HEIGHT)
	_select_action_hint.add_child(_select_action_icon)

	_select_action_label = Label.new()
	_select_action_label.name = "SelectLabel"
	_select_action_label.text = "챕터선택"
	_select_action_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_select_action_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_select_action_label.add_theme_font_size_override("font_size", 23)
	_select_action_label.add_theme_color_override("font_color", INPUT_HINT_TEXT_COLOR)
	_apply_label_shadow(_select_action_label, 2, 0.82)
	_select_action_hint.add_child(_select_action_label)

	_select_action_keycap = _create_keycap("Space", Vector2(78.0, 34.0), 18)
	_select_action_hint.add_child(_select_action_keycap)

	_refresh_input_hints()


func _create_side_nav_hint(node_name: String, key_text: String, icon_key: String) -> HBoxContainer:
	var hint := HBoxContainer.new()
	hint.name = node_name
	hint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hint.alignment = BoxContainer.ALIGNMENT_CENTER

	var keycap := _create_keycap(key_text, SIDE_HINT_KEYCAP_SIZE, 22)
	hint.add_child(keycap)

	var icon := _create_input_icon_rect("%sIcon" % node_name, icon_key, SIDE_HINT_ICON_HEIGHT)
	hint.add_child(icon)

	if key_text == "A":
		_left_nav_keycap = keycap
		_left_nav_icon = icon
	else:
		_right_nav_keycap = keycap
		_right_nav_icon = icon

	return hint


func _create_keycap(text: String, minimum_size: Vector2, font_size: int) -> PanelContainer:
	var keycap := PanelContainer.new()
	keycap.name = "KeyboardKeycap"
	keycap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	keycap.custom_minimum_size = minimum_size
	keycap.add_theme_stylebox_override("panel", _create_keycap_style())

	var center := CenterContainer.new()
	center.name = "Center"
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	keycap.add_child(center)

	var label := Label.new()
	label.name = "KeyLabel"
	label.text = text
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", INPUT_HINT_TEXT_COLOR)
	_apply_label_shadow(label, 1, 0.62)
	center.add_child(label)

	return keycap


func _create_input_icon_rect(node_name: String, icon_key: String, icon_height: int) -> TextureRect:
	var icon := TextureRect.new()
	icon.name = node_name
	icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	icon.expand_mode = TextureRect.EXPAND_KEEP_SIZE
	icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	icon.texture = _get_input_icon(icon_key, icon_height)
	if icon.texture != null:
		icon.custom_minimum_size = icon.texture.get_size()
	return icon


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
	_rebuild_chapter_carousel()
	_rebuild_chapter_selector()
	_refresh_selected_chapter()


func _rebuild_chapter_selector() -> void:
	if _chapter_selector == null:
		return

	_chapter_selector.set_count(_chapters.size(), _selected_chapter_index)
	_refresh_input_hints()


func _refresh_selected_chapter(animate_carousel := false) -> void:
	var chapter := _get_selected_chapter()
	if chapter.is_empty():
		return

	var order := int(chapter.get("order", _selected_chapter_index + 1))
	var title := String(chapter.get("title", chapter.get("id", ""))).strip_edges()
	var description := _format_description_text(String(chapter.get("description", "")).strip_edges())
	var can_start := _can_start_chapter(chapter)

	_eyebrow_label.text = "챕터 %d" % maxi(1, order)
	_title_label.text = title if not title.is_empty() else "제목 없음"
	_description_label.text = description if not description.is_empty() else "챕터 설명이 아직 없습니다."
	_start_button.disabled = not can_start
	_start_button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND if can_start else Control.CURSOR_ARROW

	_apply_chapter_art(chapter)

	_update_chapter_selector_theme()
	_refresh_input_hints()
	_update_layout(animate_carousel)


func _update_chapter_selector_theme() -> void:
	if _chapter_selector == null:
		return

	_chapter_selector.set_selected_index(_selected_chapter_index)


func _rebuild_chapter_carousel() -> void:
	_chapter_carousel_items.clear()
	if _chapter_carousel_root == null:
		return

	if _chapter_carousel_tween != null and _chapter_carousel_tween.is_valid():
		_chapter_carousel_tween.kill()
	_chapter_carousel_tween = null

	for child in _chapter_carousel_root.get_children():
		_chapter_carousel_root.remove_child(child)
		child.queue_free()

	for index in range(_chapters.size()):
		var chapter := _chapters[index]
		var item := _create_chapter_carousel_item(chapter, index)
		_chapter_carousel_root.add_child(item["root"])
		_chapter_carousel_items.append(item)

	_layout_chapter_carousel(false)


func _create_chapter_carousel_item(chapter: Dictionary, index: int) -> Dictionary:
	var root := Control.new()
	root.name = "ChapterCarouselItem%02d" % (index + 1)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.clip_contents = true

	var fallback := ColorRect.new()
	fallback.name = "Fallback"
	fallback.color = Color(0.038, 0.04, 0.046)
	fallback.mouse_filter = Control.MOUSE_FILTER_IGNORE
	fallback.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.add_child(fallback)

	var texture_rect := TextureRect.new()
	texture_rect.name = "Image"
	texture_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	texture_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	texture_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	texture_rect.texture = _get_chapter_cover_texture(chapter)
	texture_rect.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.add_child(texture_rect)

	var placeholder := VBoxContainer.new()
	placeholder.name = "Placeholder"
	placeholder.mouse_filter = Control.MOUSE_FILTER_IGNORE
	placeholder.alignment = BoxContainer.ALIGNMENT_CENTER
	placeholder.add_theme_constant_override("separation", 14)
	placeholder.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	placeholder.visible = texture_rect.texture == null
	root.add_child(placeholder)

	var order := int(chapter.get("order", index + 1))
	var number_label := Label.new()
	number_label.name = "ChapterNumber"
	number_label.text = "CHAPTER %02d" % maxi(1, order)
	number_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	number_label.add_theme_font_size_override("font_size", 22)
	number_label.add_theme_color_override("font_color", Color(0.74, 0.72, 0.65, 0.72))
	_apply_label_shadow(number_label, 2, 0.72)
	placeholder.add_child(number_label)

	var title_label := Label.new()
	title_label.name = "ChapterTitle"
	title_label.text = String(chapter.get("title", chapter.get("id", ""))).strip_edges()
	if title_label.text.is_empty():
		title_label.text = "제목 없음"
	title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	title_label.add_theme_font_size_override("font_size", 42)
	title_label.add_theme_color_override("font_color", Color(0.88, 0.86, 0.78, 0.86))
	_apply_label_shadow(title_label, 4, 0.82)
	placeholder.add_child(title_label)

	return {
		"root": root,
		"image": texture_rect,
		"placeholder": placeholder,
	}


func _layout_chapter_carousel(animated := false) -> void:
	if _chapter_carousel_root == null or _chapter_carousel_items.is_empty():
		return

	var available_size := size
	if available_size.x <= 0.0 or available_size.y <= 0.0:
		available_size = get_viewport().get_visible_rect().size
	if available_size.x <= 0.0 or available_size.y <= 0.0:
		return

	var width_ratio := CHAPTER_CAROUSEL_WIDTH_RATIO
	if available_size.x < available_size.y:
		width_ratio = CHAPTER_CAROUSEL_MIN_WIDTH_RATIO
	var item_width := maxf(1.0, available_size.x * width_ratio)
	var item_size := Vector2(item_width, available_size.y)
	var center_x := (available_size.x - item_width) * 0.5

	if animated:
		_begin_chapter_carousel_tween()
	elif _chapter_carousel_tween != null and _chapter_carousel_tween.is_valid():
		return

	for index in range(_chapter_carousel_items.size()):
		var item := _chapter_carousel_items[index]
		var root := item.get("root") as Control
		if root == null:
			continue

		var offset := float(index - _selected_chapter_index)
		var target_position := Vector2(center_x + item_width * offset, 0.0)
		var target_alpha := _get_carousel_item_alpha(index)
		var target_scale := Vector2.ONE if index == _selected_chapter_index else Vector2(CHAPTER_CAROUSEL_SIDE_SCALE, CHAPTER_CAROUSEL_SIDE_SCALE)

		root.pivot_offset = item_size * 0.5
		if animated and _chapter_carousel_tween != null:
			_chapter_carousel_tween.parallel().tween_property(root, "position", target_position, CHAPTER_CAROUSEL_SLIDE_DURATION)
			_chapter_carousel_tween.parallel().tween_property(root, "size", item_size, CHAPTER_CAROUSEL_SLIDE_DURATION)
			_chapter_carousel_tween.parallel().tween_property(root, "modulate:a", target_alpha, CHAPTER_CAROUSEL_SLIDE_DURATION)
			_chapter_carousel_tween.parallel().tween_property(root, "scale", target_scale, CHAPTER_CAROUSEL_SLIDE_DURATION)
		else:
			root.position = target_position
			root.size = item_size
			root.modulate.a = target_alpha
			root.scale = target_scale

	var selected_item := _chapter_carousel_items[_selected_chapter_index]
	var selected_root := selected_item.get("root") as Control
	if selected_root != null and selected_root.get_parent() == _chapter_carousel_root:
		_chapter_carousel_root.move_child(selected_root, _chapter_carousel_root.get_child_count() - 1)


func _begin_chapter_carousel_tween() -> void:
	if _chapter_carousel_tween != null and _chapter_carousel_tween.is_valid():
		_chapter_carousel_tween.kill()
	_chapter_carousel_tween = create_tween()
	_chapter_carousel_tween.set_parallel(true)
	_chapter_carousel_tween.set_ease(Tween.EASE_OUT)
	_chapter_carousel_tween.set_trans(Tween.TRANS_CUBIC)
	_chapter_carousel_tween.finished.connect(func() -> void:
		_chapter_carousel_tween = null
	)


func _get_carousel_item_alpha(index: int) -> float:
	var distance := absi(index - _selected_chapter_index)
	if distance == 0:
		return 1.0
	if distance == 1:
		return CHAPTER_CAROUSEL_SIDE_ALPHA
	return CHAPTER_CAROUSEL_FAR_ALPHA


func _update_layout(animate_carousel := false) -> void:
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
	var copy_bottom_margin := clampf(available_size.y * 0.10, 54.0, 110.0)
	var copy_height := available_size.y - copy_y - copy_bottom_margin

	if not wide:
		copy_x = (available_size.x - copy_width) * 0.5
		copy_height = minf(copy_height, available_size.y * 0.58)

	var title_layout := _get_chapter_title_layout(_get_selected_chapter())
	if _uses_custom_title_layout(title_layout):
		var title_position := _get_title_layout_position(title_layout)
		copy_x = available_size.x * title_position.x
		copy_y = available_size.y * title_position.y
		copy_height = available_size.y - copy_y - copy_bottom_margin

	copy_height = maxf(copy_height, 120.0)

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
		var selector_size := _chapter_selector.get_preferred_size()
		selector_size.x = minf(selector_size.x, maxf(0.0, available_size.x - 48.0))
		var selector_bottom_margin := clampf(available_size.y * 0.05, 36.0, 58.0)
		_chapter_selector.position = Vector2((available_size.x - selector_size.x) * 0.5, available_size.y - selector_bottom_margin - selector_size.y)
		_chapter_selector.size = selector_size

	_layout_input_hints(available_size)

	if _back_button != null:
		var back_size := Vector2(66.0, 66.0)
		_back_button.position = Vector2(6.0, 6.0)
		_back_button.size = back_size

	_layout_chapter_carousel(animate_carousel)
	_layout_parallax_layers()


func _refresh_input_hints() -> void:
	var mode := _get_current_input_mode()
	var keyboard_mode := mode == INPUT_MODE_KEYBOARD
	var gamepad_mode := mode == INPUT_MODE_GAMEPAD
	var navigation_mode := keyboard_mode or gamepad_mode
	var show_side_hints := navigation_mode and _chapters.size() > 1
	var can_move_left := _selected_chapter_index > 0
	var can_move_right := _selected_chapter_index < _chapters.size() - 1
	var can_start := _can_start_chapter(_get_selected_chapter())

	if _left_nav_hint != null:
		_left_nav_hint.visible = show_side_hints
		_left_nav_hint.modulate.a = 1.0 if can_move_left else 0.28
	if _right_nav_hint != null:
		_right_nav_hint.visible = show_side_hints
		_right_nav_hint.modulate.a = 1.0 if can_move_right else 0.28
	if _left_nav_keycap != null:
		_left_nav_keycap.visible = keyboard_mode
	if _right_nav_keycap != null:
		_right_nav_keycap.visible = keyboard_mode
	if _left_nav_icon != null:
		_left_nav_icon.visible = gamepad_mode
	if _right_nav_icon != null:
		_right_nav_icon.visible = gamepad_mode

	if _select_action_hint != null:
		_select_action_hint.visible = navigation_mode
		_select_action_hint.modulate.a = 1.0 if can_start else 0.42
	if _select_action_icon != null:
		_select_action_icon.visible = gamepad_mode
	if _select_action_keycap != null:
		_select_action_keycap.visible = keyboard_mode
	if _select_action_label != null:
		_select_action_label.visible = navigation_mode
	_apply_select_action_hint_order(mode)
	call_deferred("_update_layout")


func _layout_input_hints(available_size: Vector2) -> void:
	if available_size.x <= 0.0 or available_size.y <= 0.0:
		return

	var side_margin_x := clampf(available_size.x * 0.018, 18.0, SIDE_HINT_MARGIN.x)
	var side_center_y := available_size.y * 0.5
	if _left_nav_hint != null:
		var left_size := _get_control_minimum_size(_left_nav_hint)
		_left_nav_hint.position = Vector2(side_margin_x, side_center_y - left_size.y * 0.5)
		_left_nav_hint.size = left_size
	if _right_nav_hint != null:
		var right_size := _get_control_minimum_size(_right_nav_hint)
		_right_nav_hint.position = Vector2(available_size.x - side_margin_x - right_size.x, side_center_y - right_size.y * 0.5)
		_right_nav_hint.size = right_size

	if _select_action_hint != null:
		var select_size := _get_control_minimum_size(_select_action_hint)
		var margin_x := clampf(available_size.x * 0.022, 18.0, SELECT_HINT_MARGIN.x)
		var margin_y := clampf(available_size.y * 0.025, 18.0, SELECT_HINT_MARGIN.y)
		_select_action_hint.position = Vector2(
			maxf(18.0, available_size.x - margin_x - select_size.x),
			maxf(18.0, available_size.y - margin_y - select_size.y)
		)
		_select_action_hint.size = select_size


func _get_control_minimum_size(control: Control) -> Vector2:
	if control == null:
		return Vector2.ZERO
	var minimum_size := control.get_combined_minimum_size()
	return Vector2(maxf(1.0, minimum_size.x), maxf(1.0, minimum_size.y))


func _apply_select_action_hint_order(mode: String) -> void:
	if _select_action_hint == null:
		return

	if mode == INPUT_MODE_GAMEPAD:
		if _select_action_icon != null and _select_action_icon.get_parent() == _select_action_hint:
			_select_action_hint.move_child(_select_action_icon, 0)
		if _select_action_label != null and _select_action_label.get_parent() == _select_action_hint:
			_select_action_hint.move_child(_select_action_label, 1)
		return

	if _select_action_label != null and _select_action_label.get_parent() == _select_action_hint:
		_select_action_hint.move_child(_select_action_label, 0)
	if _select_action_keycap != null and _select_action_keycap.get_parent() == _select_action_hint:
		_select_action_hint.move_child(_select_action_keycap, 1)


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

	_select_chapter(clampi(_selected_chapter_index + delta, 0, _chapters.size() - 1))


func _select_chapter(index: int) -> void:
	if _chapters.is_empty():
		return

	var previous_index := _selected_chapter_index
	var next_index := clampi(index, 0, _chapters.size() - 1)
	if next_index == previous_index:
		_refresh_input_hints()
		return

	_selected_chapter_index = next_index
	var direction := 0
	if _selected_chapter_index > previous_index:
		direction = 1
	elif _selected_chapter_index < previous_index:
		direction = -1
	if direction != 0:
		_chapter_motion_offset = Vector2(float(direction) * 0.85, 0.0)
	_refresh_selected_chapter(direction != 0)


func _get_selected_chapter() -> Dictionary:
	if _chapters.is_empty():
		return {}

	return _chapters[clampi(_selected_chapter_index, 0, _chapters.size() - 1)]


func _can_start_chapter(chapter: Dictionary) -> bool:
	if chapter.is_empty():
		return false
	var start_dialogue := String(chapter.get("start_dialogue", "")).strip_edges()
	return not start_dialogue.is_empty() and VisualNovelData.has_dialogue(StringName(start_dialogue))


func _apply_chapter_art(chapter: Dictionary) -> void:
	_clear_parallax_layers()

	var parallax_config := _get_parallax_config(chapter)
	if not parallax_config.is_empty() and bool(parallax_config.get("enabled", true)):
		_build_parallax_layers(parallax_config)

	if not _parallax_layers.is_empty():
		_background_texture.texture = null
		_background_texture.visible = false
		if _chapter_carousel_root != null:
			_chapter_carousel_root.visible = false
		_parallax_root.visible = true
		_parallax_strength = clampf(float(parallax_config.get("strength", PARALLAX_DEFAULT_STRENGTH)), 0.0, 120.0)
		_parallax_enabled = true
		set_process(true)
		_layout_parallax_layers()
		return

	_background_texture.texture = null
	_background_texture.visible = false
	if _chapter_carousel_root != null:
		_chapter_carousel_root.visible = true
	_parallax_enabled = false
	_parallax_target = Vector2.ZERO
	_parallax_offset = Vector2.ZERO
	_chapter_motion_offset = Vector2.ZERO
	if _parallax_root != null:
		_parallax_root.visible = false
	set_process(false)


func _clear_parallax_layers() -> void:
	_parallax_layers.clear()
	if _parallax_root == null:
		return

	for child in _parallax_root.get_children():
		_parallax_root.remove_child(child)
		child.queue_free()


func _build_parallax_layers(config: Dictionary) -> void:
	if _parallax_root == null:
		return

	var raw_layers: Variant = config.get("layers", [])
	if typeof(raw_layers) != TYPE_ARRAY:
		return

	var index := 0
	for raw_layer in raw_layers:
		if typeof(raw_layer) != TYPE_DICTIONARY:
			continue
		var layer: Dictionary = raw_layer
		if not bool(layer.get("visible", true)):
			continue
		var image_path := String(layer.get("path", layer.get("image", ""))).strip_edges()
		if image_path.is_empty():
			continue
		var texture := _get_texture_from_path(image_path)
		if texture == null:
			continue

		var texture_rect := TextureRect.new()
		texture_rect.name = "ParallaxLayer%02d" % index
		texture_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
		texture_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		texture_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED if String(layer.get("kind", "sprite")) == "background" else TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		texture_rect.texture = texture
		texture_rect.modulate = Color(1.0, 1.0, 1.0, clampf(float(layer.get("opacity", 1.0)), 0.0, 1.0))
		_parallax_root.add_child(texture_rect)

		_parallax_layers.append({
			"node": texture_rect,
			"kind": String(layer.get("kind", "sprite")),
			"position": _get_layer_position(layer),
			"scale": clampf(float(layer.get("scale", 1.0)), 0.05, 3.0),
			"depth": clampf(float(layer.get("depth", layer.get("parallax", 0.0))), -2.0, 2.0),
			"perspective": clampf(float(layer.get("perspective", 0.0)), -1.0, 1.0),
			"texture_size": texture.get_size(),
		})
		index += 1


func _layout_parallax_layers() -> void:
	if _parallax_root == null or _parallax_layers.is_empty():
		return

	var available_size := size
	if available_size.x <= 0.0 or available_size.y <= 0.0:
		available_size = get_viewport().get_visible_rect().size
	if available_size.x <= 0.0 or available_size.y <= 0.0:
		return

	for entry in _parallax_layers:
		var node := entry.get("node") as TextureRect
		if node == null:
			continue

		var kind := String(entry.get("kind", "sprite"))
		var position: Vector2 = entry.get("position", Vector2(0.5, 0.5))
		var scale := float(entry.get("scale", 1.0))
		var depth := float(entry.get("depth", 0.0))
		var perspective := float(entry.get("perspective", 0.0))
		var parallax_shift := Vector2(-_parallax_offset.x, -_parallax_offset.y) * _parallax_strength * depth
		var center := Vector2(available_size.x * position.x, available_size.y * position.y) + parallax_shift
		var layer_size := Vector2.ZERO

		if kind == "background":
			var overscan := absf(_parallax_strength * depth) * 2.0 + 18.0
			layer_size = available_size * scale + Vector2(overscan * 2.0, overscan * 2.0)
			node.rotation = 0.0
		else:
			var texture_size: Vector2 = entry.get("texture_size", Vector2(1.0, 1.0))
			if texture_size.x <= 0.0 or texture_size.y <= 0.0:
				texture_size = Vector2(1.0, 1.0)
			var target_height := available_size.y * scale
			layer_size = texture_size * (target_height / texture_size.y)
			node.rotation = deg_to_rad(perspective * _parallax_offset.x * 4.0)

		node.size = layer_size
		node.pivot_offset = layer_size * 0.5
		node.position = center - layer_size * 0.5


func _get_parallax_config(chapter: Dictionary) -> Dictionary:
	var raw: Variant = chapter.get("parallax", {})
	if typeof(raw) == TYPE_DICTIONARY:
		return raw
	return {}


func _get_chapter_title_layout(chapter: Dictionary) -> Dictionary:
	var parallax_config := _get_parallax_config(chapter)
	var raw: Variant = parallax_config.get("title", {})
	if typeof(raw) == TYPE_DICTIONARY:
		return raw
	return {}


func _uses_custom_title_layout(layout: Dictionary) -> bool:
	if layout.is_empty():
		return false
	if layout.has("enabled"):
		return bool(layout.get("enabled", false))
	return layout.has("position") or layout.has("x") or layout.has("y")


func _get_title_layout_position(layout: Dictionary) -> Vector2:
	var raw: Variant = layout.get("position", [])
	if typeof(raw) == TYPE_ARRAY and (raw as Array).size() >= 2:
		var values := raw as Array
		return Vector2(
			clampf(float(values[0]), -0.5, 1.5),
			clampf(float(values[1]), -0.5, 1.5)
		)

	return Vector2(
		clampf(float(layout.get("x", CHAPTER_TITLE_DEFAULT_POSITION.x)), -0.5, 1.5),
		clampf(float(layout.get("y", CHAPTER_TITLE_DEFAULT_POSITION.y)), -0.5, 1.5)
	)


func _get_layer_position(layer: Dictionary) -> Vector2:
	var raw: Variant = layer.get("position", [])
	if typeof(raw) == TYPE_ARRAY and (raw as Array).size() >= 2:
		var values := raw as Array
		return Vector2(
			clampf(float(values[0]), -0.5, 1.5),
			clampf(float(values[1]), -0.5, 1.5)
		)

	return Vector2(
		clampf(float(layer.get("x", 0.5)), -0.5, 1.5),
		clampf(float(layer.get("y", 0.5)), -0.5, 1.5)
	)


func _get_pointer_parallax_offset() -> Vector2:
	var viewport_size := get_viewport().get_visible_rect().size
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		return Vector2.ZERO

	var mouse := get_viewport().get_mouse_position()
	if not Rect2(Vector2.ZERO, viewport_size).has_point(mouse):
		return Vector2.ZERO

	return Vector2(
		clampf(mouse.x / viewport_size.x * 2.0 - 1.0, -1.0, 1.0),
		clampf(mouse.y / viewport_size.y * 2.0 - 1.0, -1.0, 1.0)
	)


func _get_sensor_parallax_offset() -> Vector2:
	var gravity := Input.get_gravity()
	if gravity.length() < 0.08:
		return Vector2.ZERO

	return Vector2(
		clampf(gravity.x / 6.0, -1.0, 1.0),
		clampf(-gravity.y / 6.0, -1.0, 1.0)
	)


func _get_chapter_cover_texture(chapter: Dictionary) -> Texture2D:
	var image_path := _get_chapter_cover_path(chapter)
	if image_path.is_empty():
		return null

	return _get_texture_from_path(image_path)


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


func _get_texture_from_path(image_path: String) -> Texture2D:
	if image_path.is_empty():
		return null

	if _can_load_imported_texture(image_path):
		var imported_texture := load(image_path) as Texture2D
		if imported_texture != null:
			return imported_texture

	return _load_source_image_texture(image_path)


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


func _create_keycap_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = KEYCAP_BACKGROUND_COLOR
	style.border_color = KEYCAP_BORDER_COLOR
	style.set_border_width_all(1)
	style.set_corner_radius_all(5)
	return style


func _get_input_icon(icon_key: String, target_height: int) -> Texture2D:
	if icon_key.is_empty() or not INPUT_ICON_PATHS.has(icon_key):
		return null

	var cache_key := "%s:%d" % [icon_key, target_height]
	if not _input_icon_cache.has(cache_key):
		_input_icon_cache[cache_key] = _load_scaled_texture(String(INPUT_ICON_PATHS[icon_key]), target_height)
	return _input_icon_cache[cache_key] as Texture2D


func _load_scaled_texture(path: String, target_height: int) -> Texture2D:
	var source_texture := load(path) as Texture2D
	if source_texture == null or target_height <= 0:
		return source_texture

	var source_height := source_texture.get_height()
	var source_width := source_texture.get_width()
	if source_height <= 0 or source_width <= 0:
		return source_texture

	var image := source_texture.get_image()
	if image == null:
		return source_texture

	var target_width := maxi(1, int(round(float(target_height) * float(source_width) / float(source_height))))
	image.resize(target_width, target_height, Image.INTERPOLATE_LANCZOS)
	return ImageTexture.create_from_image(image)


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


func _on_input_mode_changed(mode: String) -> void:
	super._on_input_mode_changed(mode)
	_refresh_input_hints()


func _on_start_pressed() -> void:
	_on_chapter_pressed(_get_selected_chapter())


func _on_chapter_pressed(chapter: Dictionary) -> void:
	if not _can_start_chapter(chapter):
		return

	var payload: Dictionary = {
		"chapter_id": String(chapter.get("id", "")),
		"chapter_title": String(chapter.get("title", "")),
		"dialogue_id": String(chapter.get("start_dialogue", "")),
	}
	request_screen_change("story_dialogue", payload)


func _on_back_pressed() -> void:
	request_screen_change("main_title")
