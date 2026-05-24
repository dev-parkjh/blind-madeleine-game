extends Node

signal input_scheme_changed(scheme: String)
signal input_mode_changed(mode: String)
signal pointer_moved(position: Vector2, scheme: String)
signal primary_pressed(position: Vector2, scheme: String)
signal primary_released(position: Vector2, scheme: String)
signal secondary_pressed(position: Vector2, scheme: String)
signal secondary_released(position: Vector2, scheme: String)
signal action_pressed(action: String, scheme: String)

const SCHEME_MOUSE_KEYBOARD := "mouse_keyboard"
const SCHEME_TOUCH := "touch"
const SCHEME_GAMEPAD := "gamepad"

const MODE_MOUSE := "mouse"
const MODE_TOUCH := "touch"
const MODE_KEYBOARD := "keyboard"
const MODE_GAMEPAD := "gamepad"

const DIGITAL_ACTIONS := [
	"interact",
	"back",
	"notebook",
	"pause",
	"focus_next",
	"focus_previous",
]

@export var gamepad_deadzone := 0.18

var current_scheme := SCHEME_MOUSE_KEYBOARD
var current_mode := MODE_MOUSE
var pointer_position := Vector2.ZERO
var _suppress_digital_actions_once := false


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	set_process(true)
	set_process_input(true)
	_ensure_default_input_map()
	var visible_size := get_viewport().get_visible_rect().size
	pointer_position = visible_size * 0.5


func _process(_delta: float) -> void:
	if _suppress_digital_actions_once:
		_suppress_digital_actions_once = false
		return

	for action in DIGITAL_ACTIONS:
		if Input.is_action_just_pressed(action):
			action_pressed.emit(action, current_scheme)


func _input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		_set_scheme(SCHEME_MOUSE_KEYBOARD)
		var mode_changed := _set_mode(MODE_MOUSE)
		pointer_position = event.position
		if mode_changed:
			get_viewport().set_input_as_handled()
		else:
			pointer_moved.emit(pointer_position, current_scheme)
	elif event is InputEventMouseButton:
		_set_scheme(SCHEME_MOUSE_KEYBOARD)
		var mode_changed := _set_mode(MODE_MOUSE)
		pointer_position = event.position
		if mode_changed:
			get_viewport().set_input_as_handled()
			return

		if event.button_index == MOUSE_BUTTON_LEFT:
			if event.pressed:
				primary_pressed.emit(pointer_position, current_scheme)
			else:
				primary_released.emit(pointer_position, current_scheme)
		elif event.button_index == MOUSE_BUTTON_RIGHT:
			if event.pressed:
				secondary_pressed.emit(pointer_position, current_scheme)
			else:
				secondary_released.emit(pointer_position, current_scheme)
	elif event is InputEventScreenTouch:
		_set_scheme(SCHEME_TOUCH)
		var mode_changed := _set_mode(MODE_TOUCH)
		pointer_position = event.position
		if mode_changed:
			get_viewport().set_input_as_handled()
			return

		if event.pressed:
			primary_pressed.emit(pointer_position, current_scheme)
		else:
			primary_released.emit(pointer_position, current_scheme)
	elif event is InputEventScreenDrag:
		_set_scheme(SCHEME_TOUCH)
		var mode_changed := _set_mode(MODE_TOUCH)
		pointer_position = event.position
		if mode_changed:
			get_viewport().set_input_as_handled()
		else:
			pointer_moved.emit(pointer_position, current_scheme)
	elif event is InputEventJoypadButton:
		_set_scheme(SCHEME_GAMEPAD)
		if _set_mode(MODE_GAMEPAD):
			get_viewport().set_input_as_handled()
	elif event is InputEventJoypadMotion and absf(event.axis_value) > gamepad_deadzone:
		_set_scheme(SCHEME_GAMEPAD)
		if _set_mode(MODE_GAMEPAD):
			get_viewport().set_input_as_handled()
	elif event is InputEventKey and event.pressed and not event.echo:
		_set_scheme(SCHEME_MOUSE_KEYBOARD)
		if _set_mode(MODE_KEYBOARD):
			get_viewport().set_input_as_handled()


func _set_scheme(next_scheme: String) -> void:
	if current_scheme == next_scheme:
		return
	current_scheme = next_scheme
	input_scheme_changed.emit(current_scheme)


func _set_mode(next_mode: String) -> bool:
	if current_mode == next_mode:
		return false
	current_mode = next_mode
	_suppress_digital_actions_once = true
	input_mode_changed.emit(current_mode)
	return true


func _ensure_default_input_map() -> void:
	_add_action("move_left", [_key(KEY_A), _key(KEY_LEFT), _joy_button(JOY_BUTTON_DPAD_LEFT), _joy_axis(JOY_AXIS_LEFT_X, -1.0)])
	_add_action("move_right", [_key(KEY_D), _key(KEY_RIGHT), _joy_button(JOY_BUTTON_DPAD_RIGHT), _joy_axis(JOY_AXIS_LEFT_X, 1.0)])
	_add_action("move_up", [_key(KEY_W), _key(KEY_UP), _joy_button(JOY_BUTTON_DPAD_UP), _joy_axis(JOY_AXIS_LEFT_Y, -1.0)])
	_add_action("move_down", [_key(KEY_S), _key(KEY_DOWN), _joy_button(JOY_BUTTON_DPAD_DOWN), _joy_axis(JOY_AXIS_LEFT_Y, 1.0)])
	_add_action("interact", [_key(KEY_SPACE), _key(KEY_ENTER), _key(KEY_E), _mouse_button(MOUSE_BUTTON_LEFT), _joy_button(JOY_BUTTON_A)])
	_add_action("back", [_key(KEY_ESCAPE), _key(KEY_Q), _mouse_button(MOUSE_BUTTON_RIGHT), _joy_button(JOY_BUTTON_B)])
	_add_action("notebook", [_key(KEY_TAB), _key(KEY_N), _joy_button(JOY_BUTTON_X)])
	_add_action("pause", [_key(KEY_P), _joy_button(JOY_BUTTON_START)])
	_add_action("focus_next", [_key(KEY_TAB), _joy_button(JOY_BUTTON_RIGHT_SHOULDER)])
	_add_action("focus_previous", [_key(KEY_BACKTAB), _joy_button(JOY_BUTTON_LEFT_SHOULDER)])
	_add_action("ui_left", [_key(KEY_A), _key(KEY_LEFT), _joy_button(JOY_BUTTON_DPAD_LEFT), _joy_axis(JOY_AXIS_LEFT_X, -1.0), _joy_axis(JOY_AXIS_RIGHT_X, -1.0)])
	_add_action("ui_right", [_key(KEY_D), _key(KEY_RIGHT), _joy_button(JOY_BUTTON_DPAD_RIGHT), _joy_axis(JOY_AXIS_LEFT_X, 1.0), _joy_axis(JOY_AXIS_RIGHT_X, 1.0)])
	_add_action("ui_up", [_key(KEY_W), _key(KEY_UP), _joy_button(JOY_BUTTON_DPAD_UP), _joy_axis(JOY_AXIS_LEFT_Y, -1.0), _joy_axis(JOY_AXIS_RIGHT_Y, -1.0)])
	_add_action("ui_down", [_key(KEY_S), _key(KEY_DOWN), _joy_button(JOY_BUTTON_DPAD_DOWN), _joy_axis(JOY_AXIS_LEFT_Y, 1.0), _joy_axis(JOY_AXIS_RIGHT_Y, 1.0)])
	_add_action("ui_accept", [_key(KEY_SPACE), _key(KEY_ENTER), _key(KEY_E), _joy_button(JOY_BUTTON_A)])
	_add_action("ui_cancel", [_key(KEY_ESCAPE), _key(KEY_Q), _joy_button(JOY_BUTTON_B)])
	_add_action("ui_focus_next", [_key(KEY_TAB), _joy_button(JOY_BUTTON_RIGHT_SHOULDER)])
	_add_action("ui_focus_prev", [_key(KEY_BACKTAB), _joy_button(JOY_BUTTON_LEFT_SHOULDER)])


func _add_action(action: StringName, events: Array[InputEvent], deadzone: float = 0.35) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action, deadzone)
	for event in events:
		if not InputMap.action_has_event(action, event):
			InputMap.action_add_event(action, event)


func _key(keycode: Key) -> InputEventKey:
	var event := InputEventKey.new()
	event.physical_keycode = keycode
	return event


func _mouse_button(button_index: MouseButton) -> InputEventMouseButton:
	var event := InputEventMouseButton.new()
	event.button_index = button_index
	return event


func _joy_button(button_index: JoyButton) -> InputEventJoypadButton:
	var event := InputEventJoypadButton.new()
	event.button_index = button_index
	return event


func _joy_axis(axis: JoyAxis, value: float) -> InputEventJoypadMotion:
	var event := InputEventJoypadMotion.new()
	event.axis = axis
	event.axis_value = value
	return event
