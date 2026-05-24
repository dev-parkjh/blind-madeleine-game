extends Control

signal requested_screen_change(screen_id: String, payload: Dictionary)
signal close_requested

@export var screen_id := ""
@export var screen_title := ""
@export var skip_allowed := false

var setup_payload: Dictionary = {}


func setup(payload: Dictionary = {}) -> void:
	setup_payload = payload


func request_screen_change(next_screen_id: String, payload: Dictionary = {}) -> void:
	requested_screen_change.emit(next_screen_id, payload)


func request_close() -> void:
	close_requested.emit()


func make_full_rect() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	size_flags_horizontal = Control.SIZE_EXPAND_FILL
	size_flags_vertical = Control.SIZE_EXPAND_FILL
