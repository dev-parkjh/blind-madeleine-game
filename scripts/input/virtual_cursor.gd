extends ColorRect

const SIZE := Vector2(18.0, 18.0)


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	custom_minimum_size = SIZE
	size = SIZE
	pivot_offset = SIZE * 0.5
	color = Color(0.95, 0.82, 0.38, 0.95)
	visible = false


func set_cursor_position(position: Vector2) -> void:
	global_position = position - (SIZE * 0.5)
