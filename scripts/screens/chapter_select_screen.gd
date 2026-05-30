extends "res://scripts/screens/screen_base.gd"

const FALLBACK_CHAPTER_ID := "chapter_001"
const FALLBACK_CHAPTER_TITLE := "1화 - 비의 장막"
const FALLBACK_DIALOGUE_ID := "chapter_001_intro"

const TEXT_COLOR := Color(0.76, 0.76, 0.76)
const MUTED_TEXT_COLOR := Color(0.61, 0.61, 0.61)
const DESCRIPTION_COLOR := Color(0.77, 0.77, 0.77)
const LINE_COLOR := Color(0.64, 0.64, 0.64, 0.48)
const SHADOW_COLOR := Color(0.0, 0.0, 0.0, 0.82)
const CHAPTER_ACTION_PANEL_COLOR := Color(0.088, 0.088, 0.088, 0.88)
const CHAPTER_ACTION_BORDER_COLOR := Color(0.52, 0.52, 0.52)
const CHAPTER_ACTION_HOVER_COLOR := Color(0.145, 0.145, 0.145, 0.92)
const CHAPTER_ACTION_PRESSED_COLOR := Color(0.068, 0.068, 0.068, 0.96)
const CHAPTER_ACTION_HOVER_BORDER_COLOR := Color(0.70, 0.70, 0.70, 0.76)
const CHAPTER_ACTION_PRESSED_BORDER_COLOR := Color(0.78, 0.78, 0.78, 0.86)
const CHAPTER_ACTION_DISABLED_PANEL_COLOR := Color(0.066, 0.066, 0.066, 0.58)
const CHAPTER_ACTION_DISABLED_BORDER_COLOR := Color(0.32, 0.32, 0.32, 0.54)
const CHAPTER_VIGNETTE_EDGE_SIZE_RATIO := 0.16
const CHAPTER_VIGNETTE_MAX_ALPHA := 0.58
const CHAPTER_VIGNETTE_CORNER_BOOST := 0.12
const PARALLAX_DEFAULT_STRENGTH := 42.0
const CHAPTER_TITLE_DEFAULT_POSITION := Vector2(0.33, 0.35)
const PARALLAX_SMOOTH_RATE := 7.5
const PARALLAX_MOTION_DECAY := 2.2
const INPUT_ICON_PATHS := {
	"xbox_a": "res://assets/icon/input/xbox_button_color_a_outline.png",
	"xbox_b": "res://assets/icon/input/xbox_button_color_b_outline.png",
	"stick_l_left": "res://assets/icon/input/xbox_stick_l_left.png",
	"stick_l_right": "res://assets/icon/input/xbox_stick_l_right.png",
}
const KEYCAP_BACKGROUND_COLOR := Color(0.16, 0.16, 0.16, 0.88)
const KEYCAP_BORDER_COLOR := Color(0.54, 0.54, 0.54, 0.84)
const INPUT_HINT_TEXT_COLOR := Color(0.86, 0.86, 0.86, 0.92)
const SIDE_HINT_MARGIN := Vector2(30.0, 0.0)
const SIDE_HINT_KEYCAP_SIZE := Vector2(42.0, 38.0)
const SIDE_HINT_ICON_HEIGHT := 48
const SELECT_HINT_ICON_HEIGHT := 38
const SELECT_HINT_MARGIN := Vector2(44.0, 38.0)
const BACK_ACTION_MARGIN := Vector2(30.0, 26.0)
const BACK_BUTTON_POINTER_SIZE := Vector2(178.0, 62.0)
const BACK_BUTTON_ICON_HEIGHT := 34
const BACK_HINT_INPUT_ICON_HEIGHT := 36
const BACK_HINT_KEYCAP_SIZE := Vector2(46.0, 30.0)
const START_BUTTON_SIZE := Vector2(202.0, 64.0)
const POINTER_NAV_BUTTON_SIZE := Vector2(76.0, 118.0)
const POINTER_NAV_BUTTON_MARGIN_X := 34.0
const POINTER_NAV_BUTTON_ICON_HEIGHT := 46
const POINTER_NAV_BUTTON_BORDER_WIDTH := 3
const POINTER_NAV_BUTTON_CORNER_RADIUS := 9
const POINTER_SWIPE_MIN_DISTANCE := 82.0
const POINTER_SWIPE_MAX_VERTICAL_RATIO := 0.72
const POINTER_SWIPE_BLOCKER_PADDING := 8.0
const CHAPTER_CAROUSEL_MIN_WIDTH := 320.0
const CHAPTER_CAROUSEL_SLIDE_DURATION := 0.34
const CHAPTER_CAROUSEL_SIDE_ALPHA := 0.38
const CHAPTER_CAROUSEL_FAR_ALPHA := 0.18
const CHAPTER_CAROUSEL_SIDE_SCALE := 0.96
var _bleed_root: Control
var _chapter_carousel_root: Control
var _vignette_overlay: ChapterVignetteOverlay
var _background_texture: TextureRect
var _background_fallback: ColorRect
var _copy_group: VBoxContainer
var _copy_group_default_parent: Node
var _copy_group_default_index := -1
var _eyebrow_group: HBoxContainer
var _eyebrow_label: Label
var _eyebrow_left_rule: ChapterRule
var _eyebrow_right_rule: ChapterRule
var _title_label: Label
var _title_image_rect: TextureRect
var _divider: ChapterDivider
var _description_label: Label
var _start_button: Button
var _start_button_arrow_icon: TextureRect
var _back_button: Button
var _back_action_hint: HBoxContainer
var _back_hint_input_icon: TextureRect
var _back_hint_keycap: PanelContainer
var _back_hint_label: Label
var _chapter_selector: ChapterIndicator
var _left_nav_hint: HBoxContainer
var _right_nav_hint: HBoxContainer
var _left_nav_keycap: PanelContainer
var _right_nav_keycap: PanelContainer
var _left_nav_icon: TextureRect
var _right_nav_icon: TextureRect
var _previous_chapter_button: Button
var _next_chapter_button: Button
var _select_action_hint: HBoxContainer
var _select_action_icon: TextureRect
var _select_action_keycap: PanelContainer
var _select_action_label: Label
var _chapters: Array[Dictionary] = []
var _selected_chapter_index := 0
var _parallax_enabled := false
var _parallax_strength := PARALLAX_DEFAULT_STRENGTH
var _parallax_target := Vector2.ZERO
var _parallax_offset := Vector2.ZERO
var _chapter_motion_offset := Vector2.ZERO
var _copy_group_base_position := Vector2.ZERO
var _title_parallax_enabled := false
var _title_parallax_depth := 0.0
var _title_parallax_perspective := 0.0
var _input_icon_cache: Dictionary = {}
var _chapter_carousel_items: Array[Dictionary] = []
var _chapter_carousel_tween: Tween
var _chapter_art_fade_out_index := -1
var _pointer_swipe_tracking := false
var _pointer_swipe_consumed := false
var _pointer_swipe_index := -1
var _pointer_swipe_start := Vector2.ZERO
var _pointer_swipe_last := Vector2.ZERO


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


class ChapterVignetteOverlay:
	extends Control

	var edge_size_ratio := CHAPTER_VIGNETTE_EDGE_SIZE_RATIO
	var max_alpha := CHAPTER_VIGNETTE_MAX_ALPHA
	var corner_boost := CHAPTER_VIGNETTE_CORNER_BOOST

	func _notification(what: int) -> void:
		if what == NOTIFICATION_RESIZED:
			queue_redraw()

	func _draw() -> void:
		var width := size.x
		var height := size.y
		if width <= 0.0 or height <= 0.0:
			return

		var edge := minf(width, height) * edge_size_ratio
		if edge <= 1.0:
			return

		var edge_color := Color(0.0, 0.0, 0.0, max_alpha)
		var clear := Color(0.0, 0.0, 0.0, 0.0)

		draw_polygon(
			PackedVector2Array([
				Vector2.ZERO,
				Vector2(width, 0.0),
				Vector2(width, edge),
				Vector2(0.0, edge),
			]),
			PackedColorArray([edge_color, edge_color, clear, clear])
		)
		draw_polygon(
			PackedVector2Array([
				Vector2(0.0, height - edge),
				Vector2(width, height - edge),
				Vector2(width, height),
				Vector2(0.0, height),
			]),
			PackedColorArray([clear, clear, edge_color, edge_color])
		)
		draw_polygon(
			PackedVector2Array([
				Vector2.ZERO,
				Vector2(edge, 0.0),
				Vector2(edge, height),
				Vector2(0.0, height),
			]),
			PackedColorArray([edge_color, clear, clear, edge_color])
		)
		draw_polygon(
			PackedVector2Array([
				Vector2(width - edge, 0.0),
				Vector2(width, 0.0),
				Vector2(width, height),
				Vector2(width - edge, height),
			]),
			PackedColorArray([clear, edge_color, edge_color, clear])
		)

		if corner_boost <= 0.0:
			return

		var corner := edge * 1.12
		var corner_color := Color(0.0, 0.0, 0.0, clampf(max_alpha + corner_boost, 0.0, 1.0))
		draw_polygon(
			PackedVector2Array([
				Vector2.ZERO,
				Vector2(corner, 0.0),
				Vector2(0.0, corner),
			]),
			PackedColorArray([corner_color, clear, clear])
		)
		draw_polygon(
			PackedVector2Array([
				Vector2(width - corner, 0.0),
				Vector2(width, 0.0),
				Vector2(width, corner),
			]),
			PackedColorArray([clear, corner_color, clear])
		)
		draw_polygon(
			PackedVector2Array([
				Vector2(0.0, height - corner),
				Vector2(0.0, height),
				Vector2(corner, height),
			]),
			PackedColorArray([clear, corner_color, clear])
		)
		draw_polygon(
			PackedVector2Array([
				Vector2(width - corner, height),
				Vector2(width, height),
				Vector2(width, height - corner),
			]),
			PackedColorArray([clear, corner_color, clear])
		)


class ChapterIndicator:
	extends Control

	signal chapter_requested(index: int)

	const DOT_DIAMETER := 11.0
	const ACTIVE_WIDTH := 48.0
	const ACTIVE_HEIGHT := 11.0
	const GAP := 18.0
	const HIT_PADDING := 15.0
	const HEIGHT := 51.0
	const TRANSITION_DURATION := 0.24
	const ACTIVE_COLOR := Color(0.86, 0.86, 0.86, 0.58)
	const INACTIVE_COLOR := Color(0.66, 0.66, 0.66, 0.28)
	const HOVER_COLOR := Color(0.82, 0.82, 0.82, 0.42)
	const SHADOW_COLOR := Color(0.0, 0.0, 0.0, 0.24)

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
			return Vector2(0.0, HEIGHT)
		var width := DOT_DIAMETER * float(count) + GAP * float(maxi(count - 1, 0)) + (ACTIVE_WIDTH - DOT_DIAMETER)
		return Vector2(width + HIT_PADDING * 2.0, HEIGHT)


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
				var highlight_rect := Rect2(rect.position + Vector2(rect.size.y * 0.42, 1.5), Vector2(maxf(0.0, rect.size.x - rect.size.y * 0.84), 1.0))
				draw_rect(highlight_rect, highlight, true)


	func _draw_pill(rect: Rect2, color: Color) -> void:
		if color.a <= 0.0 or rect.size.x <= 0.0 or rect.size.y <= 0.0:
			return

		var snapped_rect := Rect2(
			Vector2(roundf(rect.position.x), roundf(rect.position.y)),
			Vector2(maxf(1.0, roundf(rect.size.x)), maxf(1.0, roundf(rect.size.y)))
		)
		var radius := maxi(1, int(roundf(minf(snapped_rect.size.x, snapped_rect.size.y) * 0.5)))
		var style := StyleBoxFlat.new()
		style.bg_color = color
		style.set_border_width_all(0)
		style.set_corner_radius_all(radius)
		style.anti_aliasing = true
		style.draw(get_canvas_item(), snapped_rect)


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
	if _handle_pointer_swipe_input(event):
		get_viewport().set_input_as_handled()
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
	_build_start_button()
	_build_copy_group()
	_build_chapter_selector()
	_build_back_button()
	_build_input_hints()
	_build_pointer_navigation_buttons()
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

	_vignette_overlay = ChapterVignetteOverlay.new()
	_vignette_overlay.name = "StoryVignette"
	_vignette_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_vignette_overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_bleed_root.add_child(_vignette_overlay)

func _build_start_button() -> void:
	_start_button = Button.new()
	_start_button.name = "StartChapterButton"
	_start_button.text = ""
	_start_button.expand_icon = false
	_start_button.custom_minimum_size = START_BUTTON_SIZE
	_start_button.focus_mode = Control.FOCUS_NONE
	_start_button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	_start_button.add_theme_stylebox_override("normal", _create_action_button_style(CHAPTER_ACTION_PANEL_COLOR, CHAPTER_ACTION_BORDER_COLOR))
	_start_button.add_theme_stylebox_override("hover", _create_action_button_style(CHAPTER_ACTION_HOVER_COLOR, CHAPTER_ACTION_HOVER_BORDER_COLOR))
	_start_button.add_theme_stylebox_override("pressed", _create_action_button_style(CHAPTER_ACTION_PRESSED_COLOR, CHAPTER_ACTION_PRESSED_BORDER_COLOR))
	_start_button.add_theme_stylebox_override("disabled", _create_action_button_style(CHAPTER_ACTION_DISABLED_PANEL_COLOR, CHAPTER_ACTION_DISABLED_BORDER_COLOR))
	_start_button.add_theme_stylebox_override("focus", _create_action_button_style(CHAPTER_ACTION_HOVER_COLOR, CHAPTER_ACTION_HOVER_BORDER_COLOR))
	_start_button.pressed.connect(_on_start_pressed)
	add_child(_start_button)

	_start_button_arrow_icon = _add_action_button_content(
		_start_button,
		"챕터선택",
		"ArrowForwardRounded",
		false,
		Vector4(24.0, 0.0, 20.0, 0.0)
	)


func _build_copy_group() -> void:
	_copy_group = VBoxContainer.new()
	_copy_group.name = "ChapterCopy"
	_copy_group.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_copy_group.add_theme_constant_override("separation", 18)
	add_child(_copy_group)
	_copy_group_default_parent = self
	_copy_group_default_index = _copy_group.get_index()

	_eyebrow_group = HBoxContainer.new()
	_eyebrow_group.name = "ChapterEyebrow"
	_eyebrow_group.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_eyebrow_group.alignment = BoxContainer.ALIGNMENT_CENTER
	_eyebrow_group.add_theme_constant_override("separation", 30)
	_copy_group.add_child(_eyebrow_group)

	_eyebrow_left_rule = ChapterRule.new()
	_eyebrow_left_rule.name = "LeftRule"
	_eyebrow_left_rule.dot_on_right = true
	_eyebrow_left_rule.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_eyebrow_left_rule.custom_minimum_size = Vector2(132.0, 24.0)
	_eyebrow_left_rule.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_eyebrow_group.add_child(_eyebrow_left_rule)

	_eyebrow_label = Label.new()
	_eyebrow_label.name = "ChapterNumber"
	_eyebrow_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_eyebrow_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_eyebrow_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_apply_label_shadow(_eyebrow_label, 2, 0.86)
	_eyebrow_group.add_child(_eyebrow_label)

	_eyebrow_right_rule = ChapterRule.new()
	_eyebrow_right_rule.name = "RightRule"
	_eyebrow_right_rule.dot_on_right = false
	_eyebrow_right_rule.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_eyebrow_right_rule.custom_minimum_size = Vector2(132.0, 24.0)
	_eyebrow_right_rule.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_eyebrow_group.add_child(_eyebrow_right_rule)

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

	_title_image_rect = TextureRect.new()
	_title_image_rect.name = "ChapterTitleImage"
	_title_image_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_title_image_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_title_image_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_title_image_rect.visible = false
	_copy_group.add_child(_title_image_rect)

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


func _set_copy_group_parent(parent: Node, child_index := -1) -> void:
	if _copy_group == null or parent == null:
		return

	if _copy_group.get_parent() != parent:
		var previous_parent := _copy_group.get_parent()
		if previous_parent != null:
			previous_parent.remove_child(_copy_group)
		parent.add_child(_copy_group)

	if child_index >= 0:
		parent.move_child(_copy_group, mini(child_index, parent.get_child_count() - 1))


func _restore_copy_group_parent() -> void:
	_set_copy_group_parent(_copy_group_default_parent, _copy_group_default_index)


func _apply_title_image(title_layout: Dictionary) -> void:
	if _title_label == null or _title_image_rect == null:
		return

	var image_path := _get_title_layout_image_path(title_layout)
	if image_path.is_empty():
		_title_image_rect.texture = null
		_title_image_rect.visible = false
		_set_text_title_group_visible(true)
		return

	var texture := _get_texture_from_path(image_path)
	_title_image_rect.texture = texture
	_title_image_rect.visible = texture != null
	_set_text_title_group_visible(texture == null)


func _set_text_title_group_visible(value: bool) -> void:
	if _eyebrow_group != null:
		_eyebrow_group.visible = value
	if _title_label != null:
		_title_label.visible = value
	if _divider != null:
		_divider.visible = value
	if _description_label != null:
		_description_label.visible = value


func _get_title_image_minimum_size(width: float, fallback_height: float) -> Vector2:
	var height := fallback_height
	if _title_image_rect != null and _title_image_rect.texture != null:
		var texture_size := _title_image_rect.texture.get_size()
		if texture_size.x > 0.0 and texture_size.y > 0.0:
			height = width * texture_size.y / texture_size.x
	return Vector2(width, height)


func _build_chapter_selector() -> void:
	_chapter_selector = ChapterIndicator.new()
	_chapter_selector.name = "ChapterSelector"
	_chapter_selector.visible = false
	_chapter_selector.chapter_requested.connect(_select_chapter)
	add_child(_chapter_selector)


func _build_back_button() -> void:
	_back_button = Button.new()
	_back_button.name = "BackButton"
	_back_button.text = ""
	_back_button.expand_icon = false
	_back_button.custom_minimum_size = BACK_BUTTON_POINTER_SIZE
	_back_button.focus_mode = Control.FOCUS_NONE
	_back_button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	_back_button.add_theme_stylebox_override("normal", _create_action_button_style(CHAPTER_ACTION_PANEL_COLOR, CHAPTER_ACTION_BORDER_COLOR))
	_back_button.add_theme_stylebox_override("hover", _create_action_button_style(CHAPTER_ACTION_HOVER_COLOR, CHAPTER_ACTION_HOVER_BORDER_COLOR))
	_back_button.add_theme_stylebox_override("pressed", _create_action_button_style(CHAPTER_ACTION_PRESSED_COLOR, CHAPTER_ACTION_PRESSED_BORDER_COLOR))
	_back_button.add_theme_stylebox_override("focus", _create_action_button_style(CHAPTER_ACTION_HOVER_COLOR, CHAPTER_ACTION_HOVER_BORDER_COLOR))
	_back_button.pressed.connect(_on_back_pressed)
	add_child(_back_button)

	_add_action_button_content(
		_back_button,
		"돌아가기",
		"ChevronLeftRounded",
		true,
		Vector4(8.0, 0.0, 20.0, 0.0)
	)

	_back_action_hint = HBoxContainer.new()
	_back_action_hint.name = "BackActionHint"
	_back_action_hint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_back_action_hint.alignment = BoxContainer.ALIGNMENT_CENTER
	_back_action_hint.add_theme_constant_override("separation", 9)
	add_child(_back_action_hint)

	_back_hint_input_icon = _create_input_icon_rect("BackGamepadIcon", "xbox_b", BACK_HINT_INPUT_ICON_HEIGHT)
	_back_action_hint.add_child(_back_hint_input_icon)

	_back_hint_label = Label.new()
	_back_hint_label.name = "BackLabel"
	_back_hint_label.text = "돌아가기"
	_back_hint_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_back_hint_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_back_hint_label.add_theme_font_size_override("font_size", 25)
	_back_hint_label.add_theme_color_override("font_color", INPUT_HINT_TEXT_COLOR)
	_apply_label_shadow(_back_hint_label, 2, 0.72)
	_back_action_hint.add_child(_back_hint_label)

	_back_hint_keycap = _create_keycap("ESC", BACK_HINT_KEYCAP_SIZE, 15)
	_back_action_hint.add_child(_back_hint_keycap)

	_refresh_back_action_display()


func _add_action_button_content(
	button: Button,
	label_text: String,
	icon_name: String,
	icon_first: bool,
	margins: Vector4
) -> TextureRect:
	var margin := MarginContainer.new()
	margin.name = "ContentMargin"
	margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	margin.add_theme_constant_override("margin_left", int(margins.x))
	margin.add_theme_constant_override("margin_top", int(margins.y))
	margin.add_theme_constant_override("margin_right", int(margins.z))
	margin.add_theme_constant_override("margin_bottom", int(margins.w))
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	button.add_child(margin)

	var layout := HBoxContainer.new()
	layout.name = "Content"
	layout.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layout.alignment = BoxContainer.ALIGNMENT_CENTER
	layout.add_theme_constant_override("separation", 8)
	layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	margin.add_child(layout)

	var icon := _create_mui_icon_rect("ActionIcon", icon_name, BACK_BUTTON_ICON_HEIGHT, INPUT_HINT_TEXT_COLOR)
	var label := Label.new()
	label.name = "ActionLabel"
	label.text = label_text
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 24)
	label.add_theme_color_override("font_color", INPUT_HINT_TEXT_COLOR)
	_apply_label_shadow(label, 2, 0.72)

	if icon_first:
		layout.add_child(icon)
		layout.add_child(label)
	else:
		layout.add_child(label)
		layout.add_child(icon)

	return icon


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
	_select_action_label.add_theme_font_size_override("font_size", 25)
	_select_action_label.add_theme_color_override("font_color", INPUT_HINT_TEXT_COLOR)
	_apply_label_shadow(_select_action_label, 2, 0.82)
	_select_action_hint.add_child(_select_action_label)

	_select_action_keycap = _create_keycap("Space", Vector2(88.0, 38.0), 18)
	_select_action_hint.add_child(_select_action_keycap)

	_refresh_input_hints()


func _build_pointer_navigation_buttons() -> void:
	_previous_chapter_button = _create_pointer_nav_button("PreviousChapterButton", "ChevronLeftRounded")
	_previous_chapter_button.pressed.connect(_on_previous_chapter_pressed)
	add_child(_previous_chapter_button)

	_next_chapter_button = _create_pointer_nav_button("NextChapterButton", "ChevronRightRounded")
	_next_chapter_button.pressed.connect(_on_next_chapter_pressed)
	add_child(_next_chapter_button)


func _create_pointer_nav_button(node_name: String, icon_name: String) -> Button:
	var button := Button.new()
	button.name = node_name
	button.text = ""
	button.icon = _get_mui_icon(icon_name, POINTER_NAV_BUTTON_ICON_HEIGHT, INPUT_HINT_TEXT_COLOR)
	button.expand_icon = false
	button.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
	button.alignment = HORIZONTAL_ALIGNMENT_CENTER
	button.custom_minimum_size = POINTER_NAV_BUTTON_SIZE
	button.focus_mode = Control.FOCUS_NONE
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.add_theme_constant_override("h_separation", 0)
	button.add_theme_constant_override("icon_max_width", 0)
	button.add_theme_stylebox_override("normal", _create_pointer_nav_button_style(CHAPTER_ACTION_PANEL_COLOR, CHAPTER_ACTION_BORDER_COLOR))
	button.add_theme_stylebox_override("hover", _create_pointer_nav_button_style(CHAPTER_ACTION_HOVER_COLOR, CHAPTER_ACTION_BORDER_COLOR))
	button.add_theme_stylebox_override("pressed", _create_pointer_nav_button_style(CHAPTER_ACTION_PRESSED_COLOR, CHAPTER_ACTION_BORDER_COLOR))
	button.add_theme_stylebox_override("disabled", _create_pointer_nav_button_style(CHAPTER_ACTION_DISABLED_PANEL_COLOR, CHAPTER_ACTION_DISABLED_BORDER_COLOR))
	return button


func _create_side_nav_hint(node_name: String, key_text: String, icon_key: String) -> HBoxContainer:
	var hint := HBoxContainer.new()
	hint.name = node_name
	hint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hint.alignment = BoxContainer.ALIGNMENT_CENTER

	var keycap := _create_keycap(key_text, SIDE_HINT_KEYCAP_SIZE, 20)
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

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	margin.add_theme_constant_override("margin_left", 9)
	margin.add_theme_constant_override("margin_top", 3)
	margin.add_theme_constant_override("margin_right", 9)
	margin.add_theme_constant_override("margin_bottom", 4)
	keycap.add_child(margin)

	var label := Label.new()
	label.name = "KeyLabel"
	label.text = text
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	label.size_flags_vertical = Control.SIZE_EXPAND_FILL
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", INPUT_HINT_TEXT_COLOR)
	_apply_label_shadow(label, 1, 0.62)
	margin.add_child(label)

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


func _create_mui_icon_rect(node_name: String, icon_name: String, icon_height: int, color: Color) -> TextureRect:
	var icon := TextureRect.new()
	icon.name = node_name
	icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	icon.expand_mode = TextureRect.EXPAND_KEEP_SIZE
	icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	icon.texture = _get_mui_icon(icon_name, icon_height, color)
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


func _refresh_selected_chapter(animate_carousel := false, previous_chapter_index := -1) -> void:
	var chapter := _get_selected_chapter()
	if chapter.is_empty():
		return

	var order := int(chapter.get("order", _selected_chapter_index + 1))
	var title := String(chapter.get("title", chapter.get("id", ""))).strip_edges()
	var description := _format_description_text(String(chapter.get("description", "")).strip_edges())
	var can_start := _can_start_chapter(chapter)
	var title_layout := _get_chapter_title_layout(chapter)

	_eyebrow_label.text = "챕터 %d" % maxi(1, order)
	_title_label.text = title if not title.is_empty() else "제목 없음"
	_description_label.text = description if not description.is_empty() else "챕터 설명이 아직 없습니다."
	_apply_title_image(title_layout)
	_start_button.disabled = not can_start
	_start_button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND if can_start else Control.CURSOR_ARROW

	_apply_chapter_art(chapter, previous_chapter_index, animate_carousel)

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

	var parallax_root := Control.new()
	parallax_root.name = "ParallaxOverlay"
	parallax_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	parallax_root.clip_contents = true
	parallax_root.visible = false
	parallax_root.modulate.a = 1.0
	parallax_root.set_anchors_and_offsets_preset(Control.PRESET_TOP_LEFT)
	root.add_child(parallax_root)

	var texture_rect := TextureRect.new()
	texture_rect.name = "ThumbnailCover"
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

	var dim_overlay := ColorRect.new()
	dim_overlay.name = "DimOverlay"
	dim_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	dim_overlay.color = Color(0.0, 0.0, 0.0, 1.0)
	dim_overlay.modulate.a = 0.0
	dim_overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.add_child(dim_overlay)

	var order := int(chapter.get("order", index + 1))
	var number_label := Label.new()
	number_label.name = "ChapterNumber"
	number_label.text = "CHAPTER %02d" % maxi(1, order)
	number_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	number_label.add_theme_font_size_override("font_size", 22)
	number_label.add_theme_color_override("font_color", Color(0.66, 0.66, 0.66, 0.72))
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
	title_label.add_theme_color_override("font_color", Color(0.84, 0.84, 0.84, 0.86))
	_apply_label_shadow(title_label, 4, 0.82)
	placeholder.add_child(title_label)

	var item := {
		"root": root,
		"image": texture_rect,
		"placeholder": placeholder,
		"dim_overlay": dim_overlay,
		"parallax_root": parallax_root,
		"parallax_layers": [],
		"parallax_strength": PARALLAX_DEFAULT_STRENGTH,
	}
	var parallax_config := _get_parallax_config(chapter)
	if not parallax_config.is_empty() and bool(parallax_config.get("enabled", true)):
		_build_chapter_item_parallax_layers(item, parallax_config)
	_set_chapter_item_cover_alpha(item, 1.0)
	return item


func _layout_chapter_carousel(animated := false) -> void:
	if _chapter_carousel_root == null or _chapter_carousel_items.is_empty():
		return

	var available_size := get_viewport().get_visible_rect().size
	if available_size.x <= 0.0 or available_size.y <= 0.0:
		available_size = _chapter_carousel_root.size
	if available_size.x <= 0.0 or available_size.y <= 0.0:
		return

	var slide_rect := _get_current_chapter_slide_rect(available_size)
	var item_width := slide_rect.size.x
	var item_size := slide_rect.size

	if animated:
		_begin_chapter_carousel_tween()
	elif _chapter_carousel_tween != null and _chapter_carousel_tween.is_valid():
		return

	_sync_chapter_parallax_root_visibility()
	_tween_chapter_thumbnail_covers(animated)

	var slide_delay := 0.0
	for index in range(_chapter_carousel_items.size()):
		var item := _chapter_carousel_items[index]
		var root := item.get("root") as Control
		if root == null:
			continue

		var offset := float(index - _selected_chapter_index)
		var target_position := slide_rect.position + Vector2(item_width * offset, 0.0)
		var target_dim_alpha := _get_carousel_item_dim_alpha(index)
		var target_scale := Vector2.ONE if index == _selected_chapter_index else Vector2(CHAPTER_CAROUSEL_SIDE_SCALE, CHAPTER_CAROUSEL_SIDE_SCALE)

		root.pivot_offset = item_size * 0.5
		root.modulate.a = 1.0
		if animated and _chapter_carousel_tween != null:
			_tween_carousel_property(root, "position", target_position, CHAPTER_CAROUSEL_SLIDE_DURATION, slide_delay)
			_tween_carousel_property(root, "size", item_size, CHAPTER_CAROUSEL_SLIDE_DURATION, slide_delay)
			_tween_chapter_item_dim_alpha(item, target_dim_alpha, CHAPTER_CAROUSEL_SLIDE_DURATION, slide_delay)
			_tween_carousel_property(root, "scale", target_scale, CHAPTER_CAROUSEL_SLIDE_DURATION, slide_delay)
		else:
			root.position = target_position
			root.size = item_size
			_set_chapter_item_dim_alpha(item, target_dim_alpha)
			root.scale = target_scale

		_layout_chapter_item_parallax_root(item, item_size)

	var selected_item := _chapter_carousel_items[_selected_chapter_index]
	var selected_root := selected_item.get("root") as Control
	if selected_root != null and selected_root.get_parent() == _chapter_carousel_root:
		_chapter_carousel_root.move_child(selected_root, _chapter_carousel_root.get_child_count() - 1)


func _get_chapter_carousel_item_width(available_size: Vector2) -> float:
	if available_size.x <= 0.0 or available_size.y <= 0.0:
		return CHAPTER_CAROUSEL_MIN_WIDTH

	var reference_aspect := DialoguePanelLayout.REFERENCE_WIDTH / DialoguePanelLayout.REFERENCE_HEIGHT
	var viewport_aspect := available_size.x / available_size.y
	if viewport_aspect <= reference_aspect:
		return available_size.x

	var reference_width_at_height := available_size.y * reference_aspect
	return clampf(reference_width_at_height, minf(CHAPTER_CAROUSEL_MIN_WIDTH, available_size.x), available_size.x)


func _get_current_chapter_slide_rect(available_size: Vector2) -> Rect2:
	if available_size.x <= 0.0 or available_size.y <= 0.0:
		return Rect2(Vector2.ZERO, Vector2.ZERO)

	var item_width := _get_chapter_carousel_item_width(available_size)
	return Rect2(
		Vector2((available_size.x - item_width) * 0.5, 0.0),
		Vector2(item_width, available_size.y)
	)


func _tween_carousel_property(target: Object, property: String, final_value: Variant, duration: float, delay := 0.0) -> void:
	if _chapter_carousel_tween == null:
		return

	var tweener := _chapter_carousel_tween.parallel().tween_property(target, property, final_value, duration)
	if delay > 0.0:
		tweener.set_delay(delay)


func _layout_chapter_item_parallax_root(item: Dictionary, item_size: Vector2) -> void:
	var parallax_root := item.get("parallax_root") as Control
	if parallax_root == null:
		return

	parallax_root.position = Vector2.ZERO
	parallax_root.size = item_size
	parallax_root.pivot_offset = item_size * 0.5
	_layout_parallax_layers_for_item(item)


func _sync_chapter_parallax_root_visibility() -> void:
	for item in _chapter_carousel_items:
		var parallax_root := item.get("parallax_root") as Control
		if parallax_root == null:
			continue

		parallax_root.visible = _chapter_item_has_parallax(item)
		parallax_root.modulate.a = 1.0


func _set_chapter_item_dim_alpha(item: Dictionary, alpha: float) -> void:
	if item.is_empty():
		return

	var dim_overlay := item.get("dim_overlay") as CanvasItem
	if dim_overlay != null:
		dim_overlay.modulate.a = clampf(alpha, 0.0, 1.0)


func _tween_chapter_item_dim_alpha(item: Dictionary, alpha: float, duration: float, delay := 0.0) -> void:
	if item.is_empty() or _chapter_carousel_tween == null:
		return

	var dim_overlay := item.get("dim_overlay") as CanvasItem
	if dim_overlay == null:
		return

	var tweener := _chapter_carousel_tween.parallel().tween_property(
		dim_overlay,
		"modulate:a",
		clampf(alpha, 0.0, 1.0),
		duration
	)
	if delay > 0.0:
		tweener.set_delay(delay)


func _set_chapter_item_cover_alpha(item: Dictionary, alpha: float) -> void:
	if item.is_empty():
		return

	var cover_alpha := clampf(alpha, 0.0, 1.0)
	var image := item.get("image") as CanvasItem
	if image != null:
		image.modulate.a = cover_alpha
	var placeholder := item.get("placeholder") as CanvasItem
	if placeholder != null:
		placeholder.modulate.a = cover_alpha


func _tween_chapter_item_cover_alpha(item: Dictionary, alpha: float, duration: float, delay := 0.0) -> void:
	if item.is_empty() or _chapter_carousel_tween == null:
		return

	for node_key in ["image", "placeholder"]:
		var canvas_item := item.get(node_key) as CanvasItem
		if canvas_item == null:
			continue
		var tweener := _chapter_carousel_tween.parallel().tween_property(
			canvas_item,
			"modulate:a",
			clampf(alpha, 0.0, 1.0),
			duration
		)
		if delay > 0.0:
			tweener.set_delay(delay)


func _tween_chapter_thumbnail_covers(animated: bool) -> void:
	for item in _chapter_carousel_items:
		var target_alpha := 0.0 if _chapter_item_has_parallax(item) else 1.0
		if animated and _chapter_carousel_tween != null:
			_tween_chapter_item_cover_alpha(item, target_alpha, CHAPTER_CAROUSEL_SLIDE_DURATION)
		else:
			_set_chapter_item_cover_alpha(item, target_alpha)


func _begin_chapter_carousel_tween() -> void:
	if _chapter_carousel_tween != null and _chapter_carousel_tween.is_valid():
		_chapter_carousel_tween.kill()
	_chapter_carousel_tween = create_tween()
	_chapter_carousel_tween.set_parallel(true)
	_chapter_carousel_tween.set_ease(Tween.EASE_OUT)
	_chapter_carousel_tween.set_trans(Tween.TRANS_CUBIC)
	_chapter_carousel_tween.finished.connect(func() -> void:
		_finalize_chapter_art_transition()
		_chapter_carousel_tween = null
	)


func _get_carousel_item_alpha(index: int) -> float:
	var distance := absi(index - _selected_chapter_index)
	if distance == 0:
		return 1.0
	if distance == 1:
		return CHAPTER_CAROUSEL_SIDE_ALPHA
	return CHAPTER_CAROUSEL_FAR_ALPHA


func _get_carousel_item_dim_alpha(index: int) -> float:
	return 1.0 - _get_carousel_item_alpha(index)


func _update_layout(animate_carousel := false) -> void:
	if _bleed_root == null or _copy_group == null:
		return

	_update_full_bleed_offsets()

	var available_size := size
	if available_size.x <= 0.0 or available_size.y <= 0.0:
		return

	var slide_rect := _get_current_chapter_slide_rect(available_size)
	var ui_origin := slide_rect.position
	var copy_available_size := slide_rect.size
	var copy_origin := ui_origin
	var copy_parent_control := _copy_group.get_parent() as Control
	if copy_parent_control != null and copy_parent_control != self:
		copy_origin = Vector2.ZERO
		if copy_parent_control.size.x > 0.0 and copy_parent_control.size.y > 0.0:
			copy_available_size = copy_parent_control.size
	var title_layout := _get_chapter_title_layout(_get_selected_chapter())
	var title_visible := _is_title_layout_visible(title_layout)
	var uses_custom_title_layout := _uses_custom_title_layout(title_layout)
	_copy_group.visible = title_visible
	_copy_group.modulate.a = clampf(float(title_layout.get("opacity", 1.0)), 0.0, 1.0) if title_visible else 0.0
	_copy_group.alignment = BoxContainer.ALIGNMENT_BEGIN if uses_custom_title_layout else BoxContainer.ALIGNMENT_CENTER

	var copy_wide := copy_available_size.x >= copy_available_size.y * 1.05
	var copy_max_width := minf(660.0, maxf(220.0, copy_available_size.x * 0.92))
	var copy_min_width := minf(400.0, copy_max_width)
	var copy_width := clampf(copy_available_size.x * (0.34 if copy_wide else 0.84), copy_min_width, copy_max_width)
	var copy_x := clampf(copy_available_size.x * (0.045 if copy_wide else 0.08), 24.0, minf(138.0, maxf(24.0, copy_available_size.x - copy_width)))
	var copy_y := clampf(copy_available_size.y * (0.205 if copy_wide else 0.15), 82.0, 230.0)
	var copy_bottom_margin := clampf(copy_available_size.y * 0.10, 54.0, 110.0)
	var copy_height := copy_available_size.y - copy_y - copy_bottom_margin

	if uses_custom_title_layout:
		var title_position := _get_title_layout_position(title_layout)
		var title_scale_x := _get_title_layout_scale_x(title_layout)
		copy_width = clampf(copy_available_size.x * 0.34 * title_scale_x, 220.0, copy_available_size.x * 1.2)
		copy_x = copy_available_size.x * title_position.x
		copy_y = copy_available_size.y * title_position.y
		copy_height = copy_available_size.y - copy_y - copy_bottom_margin
	else:
		copy_x = (copy_available_size.x - copy_width) * 0.5
		copy_y = 0.0
		copy_height = copy_available_size.y

	copy_height = maxf(copy_height, 120.0)

	_copy_group_base_position = copy_origin + Vector2(copy_x, copy_y)
	_copy_group.position = _copy_group_base_position
	_copy_group.size = Vector2(copy_width, copy_height)
	_copy_group.pivot_offset = _copy_group.size * 0.5
	_copy_group.scale = Vector2.ONE
	if uses_custom_title_layout:
		var custom_title_scale_x := _get_title_layout_scale_x(title_layout)
		var custom_title_scale_y := _get_title_layout_scale_y(title_layout)
		_copy_group.scale.y = custom_title_scale_y / maxf(custom_title_scale_x, 0.001)

	var title_size := int(clampf(copy_width * (0.198 if copy_wide else 0.155), 64.0, 126.0))
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
	if _title_image_rect != null:
		_title_image_rect.custom_minimum_size = _get_title_image_minimum_size(copy_width, float(title_size) * 1.85)
	_divider.custom_minimum_size = Vector2(divider_width, 34.0)
	_description_label.add_theme_font_size_override("font_size", description_size)

	if _chapter_selector != null and _chapter_selector.visible:
		var selector_size := _chapter_selector.get_preferred_size()
		selector_size.x = minf(selector_size.x, maxf(0.0, slide_rect.size.x - 48.0))
		var selector_bottom_margin := clampf(slide_rect.size.y * 0.05, 36.0, 58.0)
		_chapter_selector.position = ui_origin + Vector2(
			(slide_rect.size.x - selector_size.x) * 0.5,
			slide_rect.size.y - selector_bottom_margin - selector_size.y
		)
		_chapter_selector.size = selector_size

	_layout_input_hints(slide_rect)

	if _back_button != null:
		var back_size := _back_button.custom_minimum_size
		_back_button.position = ui_origin + BACK_ACTION_MARGIN
		_back_button.size = back_size
	if _back_action_hint != null and _back_action_hint.visible:
		var back_hint_size := _get_control_minimum_size(_back_action_hint)
		_back_action_hint.position = ui_origin + BACK_ACTION_MARGIN
		_back_action_hint.size = back_hint_size

	_layout_chapter_carousel(animate_carousel)
	_layout_parallax_layers()
	_layout_title_parallax(available_size)


func _refresh_input_hints() -> void:
	var mode := _get_current_input_mode()
	var keyboard_mode := mode == INPUT_MODE_KEYBOARD
	var gamepad_mode := mode == INPUT_MODE_GAMEPAD
	var navigation_mode := keyboard_mode or gamepad_mode
	var pointer_mode := _is_pointer_navigation_mode()
	var show_side_hints := navigation_mode and _chapters.size() > 1
	var show_pointer_navigation := pointer_mode and _chapters.size() > 1
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

	if _start_button != null:
		_start_button.visible = pointer_mode
		_start_button.disabled = not can_start
		_start_button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND if can_start else Control.CURSOR_ARROW
		_start_button.modulate.a = 1.0 if can_start else 0.48

	if _previous_chapter_button != null:
		_previous_chapter_button.visible = show_pointer_navigation
		_previous_chapter_button.disabled = not can_move_left
		_previous_chapter_button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND if can_move_left else Control.CURSOR_ARROW
		_previous_chapter_button.modulate.a = 1.0 if can_move_left else 0.36
	if _next_chapter_button != null:
		_next_chapter_button.visible = show_pointer_navigation
		_next_chapter_button.disabled = not can_move_right
		_next_chapter_button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND if can_move_right else Control.CURSOR_ARROW
		_next_chapter_button.modulate.a = 1.0 if can_move_right else 0.36

	_refresh_back_action_display()
	call_deferred("_update_layout")


func _layout_input_hints(layout_rect: Rect2) -> void:
	var available_size := layout_rect.size
	if available_size.x <= 0.0 or available_size.y <= 0.0:
		return

	var layout_origin := layout_rect.position
	var side_margin_x := clampf(available_size.x * 0.018, 18.0, SIDE_HINT_MARGIN.x)
	var side_center_y := available_size.y * 0.5
	if _left_nav_hint != null:
		var left_size := _get_control_minimum_size(_left_nav_hint)
		_left_nav_hint.position = layout_origin + Vector2(side_margin_x, side_center_y - left_size.y * 0.5)
		_left_nav_hint.size = left_size
	if _right_nav_hint != null:
		var right_size := _get_control_minimum_size(_right_nav_hint)
		_right_nav_hint.position = layout_origin + Vector2(available_size.x - side_margin_x - right_size.x, side_center_y - right_size.y * 0.5)
		_right_nav_hint.size = right_size

	if _previous_chapter_button != null and _previous_chapter_button.visible:
		var previous_size := _get_control_minimum_size(_previous_chapter_button)
		_previous_chapter_button.position = layout_origin + Vector2(
			clampf(available_size.x * 0.018, 18.0, POINTER_NAV_BUTTON_MARGIN_X),
			side_center_y - previous_size.y * 0.5
		)
		_previous_chapter_button.size = previous_size
	if _next_chapter_button != null and _next_chapter_button.visible:
		var next_size := _get_control_minimum_size(_next_chapter_button)
		_next_chapter_button.position = layout_origin + Vector2(
			available_size.x - clampf(available_size.x * 0.018, 18.0, POINTER_NAV_BUTTON_MARGIN_X) - next_size.x,
			side_center_y - next_size.y * 0.5
		)
		_next_chapter_button.size = next_size

	if _select_action_hint != null:
		var select_size := _get_control_minimum_size(_select_action_hint)
		var margin_x := clampf(available_size.x * 0.022, 18.0, SELECT_HINT_MARGIN.x)
		var margin_y := clampf(available_size.y * 0.025, 18.0, SELECT_HINT_MARGIN.y)
		_select_action_hint.position = layout_origin + Vector2(
			maxf(18.0, available_size.x - margin_x - select_size.x),
			maxf(18.0, available_size.y - margin_y - select_size.y)
		)
		_select_action_hint.size = select_size

	if _start_button != null and _start_button.visible:
		var start_size := _get_control_minimum_size(_start_button)
		start_size.x = maxf(start_size.x, START_BUTTON_SIZE.x)
		start_size.y = maxf(start_size.y, START_BUTTON_SIZE.y)
		var margin_x := clampf(available_size.x * 0.022, 18.0, SELECT_HINT_MARGIN.x)
		var margin_y := clampf(available_size.y * 0.025, 18.0, SELECT_HINT_MARGIN.y)
		_start_button.position = layout_origin + Vector2(
			maxf(18.0, available_size.x - margin_x - start_size.x),
			maxf(18.0, available_size.y - margin_y - start_size.y)
		)
		_start_button.size = start_size


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


func _handle_pointer_swipe_input(event: InputEvent) -> bool:
	if not _is_pointer_navigation_mode() or _chapters.size() <= 1:
		_reset_pointer_swipe()
		return false

	if event is InputEventScreenTouch:
		var touch_event := event as InputEventScreenTouch
		if touch_event.pressed:
			_begin_pointer_swipe(touch_event.position, touch_event.index)
			return false
		if _pointer_swipe_tracking and touch_event.index == _pointer_swipe_index:
			return _finish_pointer_swipe(touch_event.position)
		return false

	if event is InputEventScreenDrag:
		var drag_event := event as InputEventScreenDrag
		if _pointer_swipe_tracking and drag_event.index == _pointer_swipe_index:
			_pointer_swipe_last = drag_event.position
			return _try_consume_pointer_swipe(drag_event.position)
		return false

	if event is InputEventMouseButton:
		var mouse_button := event as InputEventMouseButton
		if mouse_button.button_index != MOUSE_BUTTON_LEFT:
			return false
		if mouse_button.pressed:
			_begin_pointer_swipe(mouse_button.position, -1)
			return false
		if _pointer_swipe_tracking:
			return _finish_pointer_swipe(mouse_button.position)
		return false

	if event is InputEventMouseMotion:
		var mouse_motion := event as InputEventMouseMotion
		if _pointer_swipe_tracking and (mouse_motion.button_mask & MOUSE_BUTTON_MASK_LEFT) != 0:
			_pointer_swipe_last = mouse_motion.position
			return _try_consume_pointer_swipe(mouse_motion.position)
		return false

	return false


func _begin_pointer_swipe(position: Vector2, pointer_index: int) -> void:
	if _is_position_over_swipe_blocker(position):
		_reset_pointer_swipe()
		return

	_pointer_swipe_tracking = true
	_pointer_swipe_consumed = false
	_pointer_swipe_index = pointer_index
	_pointer_swipe_start = position
	_pointer_swipe_last = position


func _finish_pointer_swipe(position: Vector2) -> bool:
	if not _pointer_swipe_tracking:
		return false

	_pointer_swipe_last = position
	var consumed := _try_consume_pointer_swipe(position)
	if _pointer_swipe_consumed:
		consumed = true
	_reset_pointer_swipe()
	return consumed


func _try_consume_pointer_swipe(position: Vector2) -> bool:
	if not _pointer_swipe_tracking or _pointer_swipe_consumed:
		return false

	var delta := position - _pointer_swipe_start
	if absf(delta.x) < POINTER_SWIPE_MIN_DISTANCE:
		return false
	if absf(delta.y) > absf(delta.x) * POINTER_SWIPE_MAX_VERTICAL_RATIO:
		return false

	_pointer_swipe_consumed = true
	_select_relative_chapter(1 if delta.x < 0.0 else -1)
	return true


func _reset_pointer_swipe() -> void:
	_pointer_swipe_tracking = false
	_pointer_swipe_consumed = false
	_pointer_swipe_index = -1
	_pointer_swipe_start = Vector2.ZERO
	_pointer_swipe_last = Vector2.ZERO


func _is_position_over_swipe_blocker(position: Vector2) -> bool:
	for control in [
		_start_button,
		_back_button,
		_back_action_hint,
		_previous_chapter_button,
		_next_chapter_button,
		_chapter_selector,
	]:
		if control != null and control.is_visible_in_tree() and control.get_global_rect().grow(POINTER_SWIPE_BLOCKER_PADDING).has_point(position):
			return true
	return false


func _is_pointer_navigation_mode() -> bool:
	var mode := _get_current_input_mode()
	return mode.is_empty() or mode == INPUT_MODE_MOUSE or mode == "touch"


func _refresh_back_action_display() -> void:
	var mode := _get_current_input_mode()
	var keyboard_mode := mode == INPUT_MODE_KEYBOARD
	var gamepad_mode := mode == INPUT_MODE_GAMEPAD
	var pointer_mode := _is_pointer_navigation_mode()
	var navigation_mode := keyboard_mode or gamepad_mode

	if _back_button != null:
		_back_button.visible = pointer_mode
	if _back_action_hint != null:
		_back_action_hint.visible = navigation_mode
	if _back_hint_input_icon != null:
		_back_hint_input_icon.visible = gamepad_mode
	if _back_hint_keycap != null:
		_back_hint_keycap.visible = keyboard_mode
	if _back_hint_label != null:
		_back_hint_label.visible = navigation_mode

	if gamepad_mode:
		if _back_hint_input_icon != null and _back_hint_input_icon.get_parent() == _back_action_hint:
			_back_action_hint.move_child(_back_hint_input_icon, 0)
		if _back_hint_label != null and _back_hint_label.get_parent() == _back_action_hint:
			_back_action_hint.move_child(_back_hint_label, 1)
		return

	if keyboard_mode:
		if _back_hint_label != null and _back_hint_label.get_parent() == _back_action_hint:
			_back_action_hint.move_child(_back_hint_label, 0)
		if _back_hint_keycap != null and _back_hint_keycap.get_parent() == _back_action_hint:
			_back_action_hint.move_child(_back_hint_keycap, 1)
		return


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
	_refresh_selected_chapter(direction != 0, previous_index)


func _get_selected_chapter() -> Dictionary:
	if _chapters.is_empty():
		return {}

	return _chapters[clampi(_selected_chapter_index, 0, _chapters.size() - 1)]


func _can_start_chapter(chapter: Dictionary) -> bool:
	if chapter.is_empty():
		return false
	var start_dialogue := String(chapter.get("start_dialogue", "")).strip_edges()
	return not start_dialogue.is_empty() and VisualNovelData.has_dialogue(StringName(start_dialogue))


func _apply_chapter_art(chapter: Dictionary, previous_chapter_index := -1, animated := false) -> void:
	_restore_copy_group_parent()
	_title_parallax_enabled = false
	_title_parallax_depth = 0.0
	_title_parallax_perspective = 0.0
	_chapter_art_fade_out_index = previous_chapter_index if animated else -1

	var selected_item := _get_chapter_carousel_item(_selected_chapter_index)
	var parallax_config := _get_parallax_config(chapter)
	var has_parallax := _chapter_item_has_parallax(selected_item)

	if has_parallax:
		_background_texture.texture = null
		_background_texture.visible = false
		if _chapter_carousel_root != null:
			_chapter_carousel_root.visible = true
		_parallax_strength = clampf(float(parallax_config.get("strength", PARALLAX_DEFAULT_STRENGTH)), 0.0, 120.0)
		selected_item["parallax_strength"] = _parallax_strength
		var selected_parallax_root := selected_item.get("parallax_root") as Control
		if selected_parallax_root != null:
			selected_parallax_root.visible = true
			selected_parallax_root.modulate.a = 1.0
		var title_layout := _get_title_layout_from_config(parallax_config)
		if _uses_custom_title_layout(title_layout):
			_title_parallax_enabled = bool(title_layout.get("floating", false))
			_title_parallax_depth = clampf(float(title_layout.get("depth", title_layout.get("parallax", 0.0))), -2.0, 2.0)
			_title_parallax_perspective = clampf(float(title_layout.get("perspective", 0.0)), -1.0, 1.0)
			_apply_title_layer_depth_order(selected_item, title_layout)
		_update_parallax_processing_state()
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
	_update_parallax_processing_state()


func _get_chapter_carousel_item(index: int) -> Dictionary:
	if index < 0 or index >= _chapter_carousel_items.size():
		return {}
	return _chapter_carousel_items[index]


func _chapter_item_has_parallax(item: Dictionary) -> bool:
	if item.is_empty():
		return false
	var raw_layers: Variant = item.get("parallax_layers", [])
	return typeof(raw_layers) == TYPE_ARRAY and (raw_layers as Array).size() > 0


func _finalize_chapter_art_transition() -> void:
	for item in _chapter_carousel_items:
		var parallax_root := item.get("parallax_root") as Control
		var has_parallax := _chapter_item_has_parallax(item)
		if parallax_root != null:
			parallax_root.visible = has_parallax
			parallax_root.modulate.a = 1.0
		_set_chapter_item_cover_alpha(item, 0.0 if has_parallax else 1.0)

	_chapter_art_fade_out_index = -1
	_update_parallax_processing_state()


func _update_parallax_processing_state() -> void:
	var has_active_parallax := false
	for index in range(_chapter_carousel_items.size()):
		if (index == _selected_chapter_index or index == _chapter_art_fade_out_index) and _chapter_item_has_parallax(_chapter_carousel_items[index]):
			has_active_parallax = true
			break

	_parallax_enabled = has_active_parallax
	if has_active_parallax:
		set_process(true)
		return

	_parallax_target = Vector2.ZERO
	_parallax_offset = Vector2.ZERO
	_chapter_motion_offset = Vector2.ZERO
	set_process(false)


func _build_chapter_item_parallax_layers(item: Dictionary, config: Dictionary) -> bool:
	var parallax_root := item.get("parallax_root") as Control
	if parallax_root == null:
		return false

	var raw_layers: Variant = config.get("layers", [])
	if typeof(raw_layers) != TYPE_ARRAY:
		return false

	var entries: Array[Dictionary] = []
	var source_index := 0
	for raw_layer in raw_layers:
		if typeof(raw_layer) != TYPE_DICTIONARY:
			source_index += 1
			continue
		var layer: Dictionary = raw_layer
		if not bool(layer.get("visible", true)):
			source_index += 1
			continue
		var image_path := String(layer.get("path", layer.get("image", ""))).strip_edges()
		if image_path.is_empty():
			source_index += 1
			continue
		var texture := _get_texture_from_path(image_path)
		if texture == null:
			source_index += 1
			continue

		var texture_rect := TextureRect.new()
		texture_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
		texture_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		var layer_kind := String(layer.get("kind", "sprite"))
		texture_rect.stretch_mode = TextureRect.STRETCH_SCALE
		texture_rect.texture = texture
		texture_rect.modulate = Color(1.0, 1.0, 1.0, clampf(float(layer.get("opacity", 1.0)), 0.0, 1.0))
		var layer_depth := clampf(float(layer.get("depth", layer.get("parallax", 0.0))), -2.0, 2.0)
		entries.append({
			"source_index": source_index,
			"order": float(layer.get("order", source_index)),
			"depth": layer_depth,
			"node": texture_rect,
			"layer": layer,
			"texture_size": texture.get_size(),
		})
		source_index += 1

	entries.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		var depth_a := float(a.get("depth", 0.0))
		var depth_b := float(b.get("depth", 0.0))
		if not is_equal_approx(depth_a, depth_b):
			return depth_a < depth_b
		var order_a := float(a.get("order", 0.0))
		var order_b := float(b.get("order", 0.0))
		if not is_equal_approx(order_a, order_b):
			return order_a < order_b
		return int(a.get("source_index", 0)) < int(b.get("source_index", 0))
	)

	var parallax_layers: Array[Dictionary] = []
	var layer_index := 0
	for entry in entries:
		var texture_rect := entry.get("node") as TextureRect
		if texture_rect == null:
			continue
		var entry_layer: Dictionary = entry.get("layer", {})
		texture_rect.name = "ParallaxLayer%02d" % layer_index
		parallax_root.add_child(texture_rect)

		parallax_layers.append({
			"node": texture_rect,
			"kind": String(entry_layer.get("kind", "sprite")),
			"position": _get_layer_position(entry_layer),
			"anchor": _get_layer_anchor(entry_layer),
			"scale": _get_layer_scale(entry_layer),
			"scale_x": _get_layer_scale_x(entry_layer),
			"scale_y": _get_layer_scale_y(entry_layer),
			"rotation": clampf(float(entry_layer.get("rotation", entry_layer.get("angle", 0.0))), -180.0, 180.0),
			"depth": float(entry.get("depth", 0.0)),
			"order": float(entry.get("order", layer_index)),
			"source_index": int(entry.get("source_index", layer_index)),
			"perspective": clampf(float(entry_layer.get("perspective", 0.0)), -1.0, 1.0),
			"texture_size": entry.get("texture_size", Vector2(1.0, 1.0)),
		})
		layer_index += 1

	item["parallax_layers"] = parallax_layers
	item["parallax_strength"] = clampf(float(config.get("strength", PARALLAX_DEFAULT_STRENGTH)), 0.0, 120.0)
	parallax_root.visible = false
	parallax_root.modulate.a = 1.0
	return not parallax_layers.is_empty()


func _apply_title_layer_depth_order(item: Dictionary, title_layout: Dictionary) -> void:
	if not _is_title_layout_visible(title_layout):
		return

	var parallax_root := item.get("parallax_root") as Control
	if parallax_root == null:
		return

	var raw_layers: Variant = item.get("parallax_layers", [])
	var parallax_layers: Array = raw_layers if typeof(raw_layers) == TYPE_ARRAY else []
	var title_depth := clampf(float(title_layout.get("depth", title_layout.get("parallax", 0.0))), -2.0, 2.0)
	var title_order := _get_title_layout_order(title_layout, float(parallax_layers.size()))
	var insert_index := 0
	for entry in parallax_layers:
		var layer_depth := float(entry.get("depth", 0.0))
		var layer_order := float(entry.get("order", insert_index))
		if layer_depth < title_depth or (is_equal_approx(layer_depth, title_depth) and layer_order <= title_order):
			insert_index += 1

	_set_copy_group_parent(parallax_root, insert_index)


func _layout_parallax_layers() -> void:
	for item in _chapter_carousel_items:
		_layout_parallax_layers_for_item(item)

	var available_size := get_viewport().get_visible_rect().size
	if available_size.x <= 0.0 or available_size.y <= 0.0:
		available_size = size
	_layout_title_parallax(available_size)


func _layout_parallax_layers_for_item(item: Dictionary) -> void:
	if not _chapter_item_has_parallax(item):
		return

	var parallax_root := item.get("parallax_root") as Control
	if parallax_root == null or not parallax_root.visible:
		return

	var available_size := parallax_root.size
	if available_size.x <= 0.0 or available_size.y <= 0.0:
		var item_root := item.get("root") as Control
		if item_root != null:
			available_size = item_root.size
	if available_size.x <= 0.0 or available_size.y <= 0.0:
		return

	var strength := clampf(float(item.get("parallax_strength", PARALLAX_DEFAULT_STRENGTH)), 0.0, 120.0)
	var raw_layers: Variant = item.get("parallax_layers", [])
	if typeof(raw_layers) != TYPE_ARRAY:
		return

	for raw_entry in (raw_layers as Array):
		if typeof(raw_entry) != TYPE_DICTIONARY:
			continue
		var entry: Dictionary = raw_entry
		var node := entry.get("node") as TextureRect
		if node == null:
			continue

		var kind := String(entry.get("kind", "sprite"))
		var position: Vector2 = entry.get("position", Vector2(0.5, 0.5))
		var anchor: Vector2 = entry.get("anchor", Vector2(0.5, 0.5))
		var scale_x := float(entry.get("scale_x", entry.get("scale", 1.0)))
		var scale_y := float(entry.get("scale_y", entry.get("scale", 1.0)))
		var rotation := float(entry.get("rotation", 0.0))
		var depth := float(entry.get("depth", 0.0))
		var perspective := float(entry.get("perspective", 0.0))
		var parallax_shift := Vector2(-_parallax_offset.x, -_parallax_offset.y) * strength * depth
		var center := Vector2(available_size.x * position.x, available_size.y * position.y) + parallax_shift
		var layer_size := Vector2.ZERO

		if kind == "background":
			var overscan := absf(strength * depth) * 2.0 + 18.0
			var background_texture_size: Vector2 = entry.get("texture_size", Vector2(1.0, 1.0))
			var base_size := _get_background_cover_size(available_size + Vector2(overscan * 2.0, overscan * 2.0), background_texture_size)
			layer_size = Vector2(base_size.x * scale_x, base_size.y * scale_y)
			node.rotation = 0.0
		else:
			var texture_size: Vector2 = entry.get("texture_size", Vector2(1.0, 1.0))
			if texture_size.x <= 0.0 or texture_size.y <= 0.0:
				texture_size = Vector2(1.0, 1.0)
			layer_size = Vector2(
				available_size.y * scale_x * (texture_size.x / texture_size.y),
				available_size.y * scale_y
			)
			node.rotation = deg_to_rad(rotation + perspective * _parallax_offset.x * 4.0)

		node.size = layer_size
		node.pivot_offset = Vector2(layer_size.x * anchor.x, layer_size.y * anchor.y)
		node.position = center - node.pivot_offset


func _layout_title_parallax(_available_size: Vector2) -> void:
	if _copy_group == null:
		return

	if not _title_parallax_enabled or not _copy_group.visible:
		_copy_group.position = _copy_group_base_position
		_copy_group.rotation = 0.0
		return

	var parallax_shift := Vector2(-_parallax_offset.x, -_parallax_offset.y) * _parallax_strength * _title_parallax_depth
	_copy_group.position = _copy_group_base_position + parallax_shift
	_copy_group.pivot_offset = _copy_group.size * 0.5
	_copy_group.rotation = deg_to_rad(_title_parallax_perspective * _parallax_offset.x * 4.0)


func _get_parallax_config(chapter: Dictionary) -> Dictionary:
	var raw: Variant = chapter.get("parallax", {})
	if typeof(raw) == TYPE_DICTIONARY:
		return raw
	return {}


func _get_chapter_title_layout(chapter: Dictionary) -> Dictionary:
	var parallax_config := _get_parallax_config(chapter)
	return _get_title_layout_from_config(parallax_config)


func _get_title_layout_from_config(parallax_config: Dictionary) -> Dictionary:
	var raw: Variant = parallax_config.get("title", {})
	if typeof(raw) == TYPE_DICTIONARY:
		return raw
	return {}


func _is_title_layout_visible(layout: Dictionary) -> bool:
	if layout.has("enabled"):
		return bool(layout.get("enabled", false))
	return true


func _uses_custom_title_layout(layout: Dictionary) -> bool:
	if layout.is_empty():
		return false
	if layout.has("enabled"):
		return bool(layout.get("enabled", false))
	return layout.has("position") or layout.has("x") or layout.has("y") or not _get_title_layout_image_path(layout).is_empty()


func _get_title_layout_order(layout: Dictionary, fallback: float) -> float:
	if not layout.has("order"):
		return fallback
	return float(layout.get("order", fallback))


func _get_title_layout_scale(layout: Dictionary) -> float:
	return clampf(float(layout.get("scale", 1.0)), 0.2, 2.4)


func _get_title_layout_scale_x(layout: Dictionary) -> float:
	var fallback := _get_title_layout_scale(layout)
	for key in ["scale_x", "scaleX", "width_scale", "widthScale"]:
		if layout.has(key):
			return clampf(float(layout.get(key)), 0.2, 2.4)
	return fallback


func _get_title_layout_scale_y(layout: Dictionary) -> float:
	var fallback := _get_title_layout_scale(layout)
	for key in ["scale_y", "scaleY", "height_scale", "heightScale"]:
		if layout.has(key):
			return clampf(float(layout.get(key)), 0.2, 2.4)
	return fallback


func _get_title_layout_image_path(layout: Dictionary) -> String:
	for key in ["image", "path", "texture"]:
		var value := String(layout.get(key, "")).strip_edges()
		if not value.is_empty():
			return value
	return ""


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


func _get_layer_scale(layer: Dictionary) -> float:
	return clampf(float(layer.get("scale", 1.0)), 0.05, 3.0)


func _get_layer_scale_x(layer: Dictionary) -> float:
	var fallback := _get_layer_scale(layer)
	for key in ["scale_x", "scaleX", "width_scale", "widthScale"]:
		if layer.has(key):
			return clampf(float(layer.get(key)), 0.05, 3.0)
	return fallback


func _get_layer_scale_y(layer: Dictionary) -> float:
	var fallback := _get_layer_scale(layer)
	for key in ["scale_y", "scaleY", "height_scale", "heightScale"]:
		if layer.has(key):
			return clampf(float(layer.get(key)), 0.05, 3.0)
	return fallback


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


func _get_layer_anchor(layer: Dictionary) -> Vector2:
	var raw: Variant = layer.get("anchor", layer.get("center", layer.get("focus", layer.get("pivot", []))))
	if typeof(raw) == TYPE_ARRAY and (raw as Array).size() >= 2:
		var values := raw as Array
		return Vector2(
			clampf(float(values[0]), 0.0, 1.0),
			clampf(float(values[1]), 0.0, 1.0)
		)

	var anchor_x: Variant = layer.get("anchor_x", layer.get("center_x", layer.get("focus_x", layer.get("pivot_x", 0.5))))
	var anchor_y: Variant = layer.get("anchor_y", layer.get("center_y", layer.get("focus_y", layer.get("pivot_y", 0.5))))
	return Vector2(
		clampf(float(anchor_x), 0.0, 1.0),
		clampf(float(anchor_y), 0.0, 1.0)
	)


func _get_background_cover_size(target_size: Vector2, texture_size: Vector2) -> Vector2:
	if target_size.x <= 0.0 or target_size.y <= 0.0:
		return Vector2.ZERO
	if texture_size.x <= 0.0 or texture_size.y <= 0.0:
		return target_size

	var cover_scale := maxf(target_size.x / texture_size.x, target_size.y / texture_size.y)
	return texture_size * cover_scale


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
		if not value.is_empty() and _texture_path_exists(value):
			return value

	var metadata: Variant = chapter.get("metadata", {})
	if typeof(metadata) == TYPE_DICTIONARY:
		for key in ["image", "cover", "background", "thumbnail"]:
			var value := String((metadata as Dictionary).get(key, "")).strip_edges()
			if not value.is_empty() and _texture_path_exists(value):
				return value

	var chapter_id := String(chapter.get("id", "")).strip_edges()
	if not chapter_id.is_empty():
		for filename in ["thumbnail.png", "image.png", "cover.png", "background.png"]:
			var candidate := "res://assets/chapters/%s/%s" % [chapter_id, filename]
			if _texture_path_exists(candidate):
				return candidate

	var parallax_config := _get_parallax_config(chapter)
	var parallax_thumbnail := _get_parallax_cover_path(parallax_config)
	if not parallax_thumbnail.is_empty():
		return parallax_thumbnail

	return ""


func _get_parallax_cover_path(parallax_config: Dictionary) -> String:
	var raw_layers: Variant = parallax_config.get("layers", [])
	if typeof(raw_layers) != TYPE_ARRAY:
		return ""

	var first_visible := ""
	for raw_layer in (raw_layers as Array):
		if typeof(raw_layer) != TYPE_DICTIONARY:
			continue
		var layer: Dictionary = raw_layer
		if not bool(layer.get("visible", true)):
			continue
		var image_path := String(layer.get("path", layer.get("image", ""))).strip_edges()
		if image_path.is_empty() or not _texture_path_exists(image_path):
			continue
		if String(layer.get("kind", "sprite")) == "background":
			return image_path
		if first_visible.is_empty():
			first_visible = image_path

	return first_visible


func _texture_path_exists(image_path: String) -> bool:
	if image_path.is_empty():
		return false
	if FileAccess.file_exists(image_path):
		return true
	return ResourceLoader.exists(image_path)


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


func _create_action_button_style(bg_color: Color, border_color: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = bg_color
	style.border_color = border_color
	style.set_border_width_all(1)
	style.set_corner_radius_all(6)
	style.set_content_margin_all(0.0)
	return style


func _create_pointer_nav_button_style(bg_color: Color, border_color: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = bg_color
	style.border_color = border_color
	style.set_border_width_all(POINTER_NAV_BUTTON_BORDER_WIDTH)
	style.set_corner_radius_all(POINTER_NAV_BUTTON_CORNER_RADIUS)
	style.set_content_margin_all(0.0)
	return style


func _on_input_mode_changed(mode: String) -> void:
	super._on_input_mode_changed(mode)
	_refresh_input_hints()


func _on_start_pressed() -> void:
	_on_chapter_pressed(_get_selected_chapter())


func _on_previous_chapter_pressed() -> void:
	_select_relative_chapter(-1)


func _on_next_chapter_pressed() -> void:
	_select_relative_chapter(1)


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
