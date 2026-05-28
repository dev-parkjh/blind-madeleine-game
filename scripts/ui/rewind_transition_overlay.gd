extends Control

const BACKGROUND_COLOR := Color(0, 0, 0, 1)
const TEXT_COLOR := Color(0.92, 0.92, 0.88, 1.0)
const TEXT_GLITCH_COLOR := Color(1.0, 1.0, 1.0, 0.28)
const SCANLINE_COLOR := Color(1.0, 1.0, 1.0, 0.045)
const STREAK_COLOR := Color(1.0, 1.0, 1.0, 0.18)
const TEXT := "REWIND <<"
const FONT_SIZE := 34
const LABEL_JITTER := 2.0
const STREAK_COUNT := 24

var _label: Label
var _elapsed := 0.0
var _streaks: Array[Dictionary] = []
var _rng := RandomNumberGenerator.new()


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	set_anchors_preset(Control.PRESET_FULL_RECT)
	_build_label()
	restart()
	set_process(true)


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		_layout_label()


func restart() -> void:
	_elapsed = 0.0
	_rng.seed = 9241
	_make_streaks()
	_layout_label()
	queue_redraw()


func _process(delta: float) -> void:
	_elapsed += delta
	_update_label_glitch()
	queue_redraw()


func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, size), BACKGROUND_COLOR)
	_draw_scanlines()
	_draw_streaks()
	_draw_glitch_blocks()


func _build_label() -> void:
	_label = Label.new()
	_label.name = "RewindLabel"
	_label.text = TEXT
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_label.add_theme_font_size_override("font_size", FONT_SIZE)
	_label.add_theme_color_override("font_color", TEXT_COLOR)
	_label.add_theme_color_override("font_outline_color", Color.BLACK)
	_label.add_theme_constant_override("outline_size", 4)
	add_child(_label)


func _layout_label() -> void:
	if _label == null:
		return
	var label_size := _label.get_combined_minimum_size()
	_label.size = label_size
	_label.position = (size - label_size) * 0.5


func _update_label_glitch() -> void:
	if _label == null:
		return

	var label_size := _label.get_combined_minimum_size()
	var base_position := (size - label_size) * 0.5
	var phase := int(_elapsed * 28.0)
	var x_jitter := 0.0
	var y_jitter := 0.0
	if phase % 5 == 0:
		x_jitter = randf_range(-LABEL_JITTER, LABEL_JITTER)
	if phase % 7 == 0:
		y_jitter = randf_range(-LABEL_JITTER, LABEL_JITTER)
	_label.position = base_position + Vector2(x_jitter, y_jitter)
	_label.modulate.a = 0.78 + sin(_elapsed * 38.0) * 0.1


func _draw_scanlines() -> void:
	if size.x <= 0.0 or size.y <= 0.0:
		return
	for y in range(0, int(size.y), 7):
		var alpha := 0.025
		if int(_elapsed * 18.0 + y) % 11 == 0:
			alpha = 0.075
		draw_line(Vector2(0.0, y), Vector2(size.x, y), Color(SCANLINE_COLOR.r, SCANLINE_COLOR.g, SCANLINE_COLOR.b, alpha), 1.0)


func _draw_streaks() -> void:
	if _streaks.is_empty():
		return
	var sweep := fmod(_elapsed * 0.9, 1.0)
	for streak in _streaks:
		var y := float(streak.get("y", 0.0)) * size.y
		var length := float(streak.get("length", 0.1)) * size.x
		var speed := float(streak.get("speed", 0.5))
		var offset := float(streak.get("offset", 0.0))
		var x := fmod((sweep * speed + offset), 1.0) * (size.x + length) - length
		var alpha := float(streak.get("alpha", 0.1))
		draw_line(Vector2(x, y), Vector2(x + length, y), Color(STREAK_COLOR.r, STREAK_COLOR.g, STREAK_COLOR.b, alpha), 1.0)


func _draw_glitch_blocks() -> void:
	if int(_elapsed * 20.0) % 6 != 0:
		return
	var center := size * 0.5
	for index in range(5):
		var width := randf_range(28.0, 130.0)
		var height := randf_range(1.0, 3.0)
		var position := Vector2(
			center.x + randf_range(-220.0, 220.0),
			center.y + randf_range(-34.0, 34.0)
		)
		draw_rect(Rect2(position, Vector2(width, height)), TEXT_GLITCH_COLOR)


func _make_streaks() -> void:
	_streaks.clear()
	for index in STREAK_COUNT:
		_streaks.append({
			"y": _rng.randf_range(0.08, 0.92),
			"length": _rng.randf_range(0.04, 0.22),
			"speed": _rng.randf_range(0.35, 1.2),
			"offset": _rng.randf(),
			"alpha": _rng.randf_range(0.05, 0.18),
		})
