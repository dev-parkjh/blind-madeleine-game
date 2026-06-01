extends Node

signal input_scheme_changed(scheme: String)
signal input_mode_changed(mode: String)
signal pointer_moved(position: Vector2, scheme: String)
signal primary_pressed(position: Vector2, scheme: String)
signal primary_released(position: Vector2, scheme: String)
signal secondary_pressed(position: Vector2, scheme: String)
signal secondary_released(position: Vector2, scheme: String)
signal action_pressed(action: String, scheme: String)
signal debug_mode_enabled_changed(enabled: bool)
signal debug_command_input_consumed()

const SCHEME_MOUSE_KEYBOARD := "mouse_keyboard"
const SCHEME_GAMEPAD := "gamepad"

const MODE_MOUSE := "mouse"
const MODE_KEYBOARD := "keyboard"
const MODE_GAMEPAD := "gamepad"
const DEBUG_TRIGGER_THRESHOLD := 0.55
const DEBUG_KEY_SEQUENCE := [
	KEY_D,
	KEY_E,
	KEY_B,
	KEY_U,
	KEY_G,
]

const DIGITAL_ACTIONS := [
	"interact",
	"skip",
	"auto",
	"log",
	"tree",
	"menu",
	"back",
	"connect_mode",
	"notebook",
	"pause",
	"focus_next",
	"focus_previous",
]

@export var gamepad_deadzone := 0.18
@export var synthetic_mouse_guard_msec := 250
@export var mouse_mode_activation_distance_px := 18.0

var current_scheme := SCHEME_MOUSE_KEYBOARD
var current_mode := MODE_MOUSE
var pointer_position := Vector2.ZERO
var debug_mode_enabled := false
var _ignore_mouse_input_until_msec := 0
var _blocked_input_frame := -1
var _mouse_mode_activation_distance := 0.0
var _debug_activation_latched := false
var _debug_key_sequence_index := 0


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	set_process(true)
	set_process_input(true)
	_ensure_default_input_map()
	var visible_size := get_viewport().get_visible_rect().size
	pointer_position = visible_size * 0.5


func _process(_delta: float) -> void:
	if _is_current_input_frame_blocked():
		return

	if poll_debug_activation_combo():
		return

	for action in DIGITAL_ACTIONS:
		if Input.is_action_just_pressed(action):
			action_pressed.emit(action, current_scheme)


func _input(event: InputEvent) -> void:
	if handle_debug_keyboard_sequence_event(event):
		get_viewport().set_input_as_handled()
		return

	if _consume_mode_transition_event(event):
		get_viewport().set_input_as_handled()
		return

	if event is InputEventMouseMotion:
		if _should_ignore_synthetic_mouse_event(event):
			return
		_set_scheme(SCHEME_MOUSE_KEYBOARD)
		pointer_position = event.position
		pointer_moved.emit(pointer_position, current_scheme)
	elif event is InputEventMouseButton:
		if _should_ignore_synthetic_mouse_event(event):
			return

		_set_scheme(SCHEME_MOUSE_KEYBOARD)
		pointer_position = event.position

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
		get_viewport().set_input_as_handled()
		return
	elif event is InputEventScreenDrag:
		get_viewport().set_input_as_handled()
		return
	elif event is InputEventJoypadButton:
		_set_scheme(SCHEME_GAMEPAD)
		_start_mouse_input_guard()
	elif event is InputEventJoypadMotion and absf(event.axis_value) > gamepad_deadzone:
		_set_scheme(SCHEME_GAMEPAD)
		_start_mouse_input_guard()
	elif event is InputEventKey and event.pressed and not event.echo:
		_set_scheme(SCHEME_MOUSE_KEYBOARD)


func _set_scheme(next_scheme: String) -> void:
	if current_scheme == next_scheme:
		return
	current_scheme = next_scheme
	input_scheme_changed.emit(current_scheme)


func _set_mode(next_mode: String) -> bool:
	if current_mode == next_mode:
		return false
	current_mode = next_mode
	_reset_mouse_mode_activation_tracking()
	input_mode_changed.emit(current_mode)
	return true


func _start_mouse_input_guard() -> void:
	_ignore_mouse_input_until_msec = Time.get_ticks_msec() + synthetic_mouse_guard_msec


func should_ignore_gameplay_event(event: InputEvent) -> bool:
	if _is_current_input_frame_blocked():
		return true
	if _is_raw_touch_event(event):
		return true
	if event is InputEventMouseMotion or event is InputEventMouseButton:
		return _should_ignore_synthetic_mouse_event(event)

	var next_mode := _get_mode_for_event(event)
	return not next_mode.is_empty() and next_mode != current_mode


func set_debug_mode_enabled(enabled: bool) -> bool:
	if debug_mode_enabled == enabled:
		return false
	debug_mode_enabled = enabled
	_block_current_input_frame()
	debug_mode_enabled_changed.emit(debug_mode_enabled)
	return true


func activate_debug_mode() -> bool:
	return set_debug_mode_enabled(true)


func toggle_debug_mode() -> bool:
	debug_mode_enabled = not debug_mode_enabled
	_debug_activation_latched = true
	_block_current_input_frame()
	debug_mode_enabled_changed.emit(debug_mode_enabled)
	return true


func poll_debug_activation_combo() -> bool:
	if not is_debug_activation_combo_pressed():
		_debug_activation_latched = false
		return false

	if _debug_activation_latched:
		return false

	return toggle_debug_mode()


func handle_debug_keyboard_sequence_event(event: InputEvent) -> bool:
	if not event is InputEventKey:
		return false

	var key_event := event as InputEventKey
	if not key_event.ctrl_pressed:
		_debug_key_sequence_index = 0
		return false
	if not key_event.pressed or key_event.echo:
		return false

	if _is_keyboard_modifier_key(key_event):
		return false

	var expected_key: Key = DEBUG_KEY_SEQUENCE[_debug_key_sequence_index]
	if _key_event_matches_physical_or_logical_key(key_event, expected_key):
		_debug_key_sequence_index += 1
		_consume_debug_keyboard_sequence_input()
		if _debug_key_sequence_index >= DEBUG_KEY_SEQUENCE.size():
			_debug_key_sequence_index = 0
			toggle_debug_mode()
		return true

	if _key_event_matches_physical_or_logical_key(key_event, DEBUG_KEY_SEQUENCE[0]):
		_debug_key_sequence_index = 1
		_consume_debug_keyboard_sequence_input()
		return true

	_debug_key_sequence_index = 0
	return false


func _consume_debug_keyboard_sequence_input() -> void:
	_set_scheme(SCHEME_MOUSE_KEYBOARD)
	_set_mode(MODE_KEYBOARD)
	_block_current_input_frame()
	debug_command_input_consumed.emit()


func _is_keyboard_modifier_key(key_event: InputEventKey) -> bool:
	return _key_event_matches_physical_or_logical_key(key_event, KEY_CTRL)


func _key_event_matches_physical_or_logical_key(key_event: InputEventKey, target_key: Key) -> bool:
	return key_event.physical_keycode == target_key or key_event.keycode == target_key


func is_debug_activation_combo_pressed() -> bool:
	for device in Input.get_connected_joypads():
		if _is_debug_activation_combo_pressed_for_device(int(device)):
			return true
	return false


func are_debug_activation_triggers_pressed() -> bool:
	for device in Input.get_connected_joypads():
		if _are_debug_activation_triggers_pressed_for_device(int(device)):
			return true
	return false


func is_any_debug_activation_trigger_pressed() -> bool:
	for device in Input.get_connected_joypads():
		if _is_any_debug_activation_trigger_pressed_for_device(int(device)):
			return true
	return false


func is_debug_activation_event(event: InputEvent) -> bool:
	if event is InputEventJoypadButton:
		var button_event := event as InputEventJoypadButton
		return button_event.button_index == JOY_BUTTON_START or button_event.button_index == JOY_BUTTON_BACK
	if event is InputEventJoypadMotion:
		var motion_event := event as InputEventJoypadMotion
		if absf(motion_event.axis_value) <= gamepad_deadzone:
			return false
		return motion_event.axis == JOY_AXIS_TRIGGER_LEFT or motion_event.axis == JOY_AXIS_TRIGGER_RIGHT
	return false


func _is_debug_activation_combo_pressed_for_device(device: int) -> bool:
	return Input.is_joy_button_pressed(device, JOY_BUTTON_START) \
		and Input.is_joy_button_pressed(device, JOY_BUTTON_BACK) \
		and _are_debug_activation_triggers_pressed_for_device(device)


func _are_debug_activation_triggers_pressed_for_device(device: int) -> bool:
	return Input.get_joy_axis(device, JOY_AXIS_TRIGGER_LEFT) > DEBUG_TRIGGER_THRESHOLD \
		and Input.get_joy_axis(device, JOY_AXIS_TRIGGER_RIGHT) > DEBUG_TRIGGER_THRESHOLD


func _is_any_debug_activation_trigger_pressed_for_device(device: int) -> bool:
	return Input.get_joy_axis(device, JOY_AXIS_TRIGGER_LEFT) > DEBUG_TRIGGER_THRESHOLD \
		or Input.get_joy_axis(device, JOY_AXIS_TRIGGER_RIGHT) > DEBUG_TRIGGER_THRESHOLD


func _get_mode_for_event(event: InputEvent) -> String:
	if event is InputEventMouseMotion:
		if _should_activate_mouse_mode_from_motion(event as InputEventMouseMotion):
			return MODE_MOUSE
		return ""
	if event is InputEventMouseButton:
		if _should_ignore_synthetic_mouse_event(event):
			return ""
		return MODE_MOUSE
	if _is_raw_touch_event(event):
		return ""
	if event is InputEventJoypadButton:
		return MODE_GAMEPAD
	if event is InputEventJoypadMotion and absf((event as InputEventJoypadMotion).axis_value) > gamepad_deadzone:
		return MODE_GAMEPAD
	if event is InputEventKey:
		var key_event := event as InputEventKey
		if key_event.pressed and not key_event.echo:
			return MODE_KEYBOARD
	return ""


func _consume_mode_transition_event(event: InputEvent) -> bool:
	var next_mode := _get_mode_for_event(event)
	if next_mode.is_empty() or next_mode == current_mode:
		return false

	_set_scheme(_get_scheme_for_mode(next_mode))
	if next_mode == MODE_GAMEPAD:
		_start_mouse_input_guard()
	_set_mode(next_mode)
	_block_current_input_frame()
	return true


func _get_scheme_for_mode(mode: String) -> String:
	match mode:
		MODE_GAMEPAD:
			return SCHEME_GAMEPAD
		_:
			return SCHEME_MOUSE_KEYBOARD


func _block_current_input_frame() -> void:
	_blocked_input_frame = Engine.get_process_frames()


func _is_current_input_frame_blocked() -> bool:
	return Engine.get_process_frames() == _blocked_input_frame


func _should_ignore_synthetic_mouse_event(event: InputEvent) -> bool:
	if not (event is InputEventMouseMotion or event is InputEventMouseButton):
		return false
	return current_mode == MODE_GAMEPAD and Time.get_ticks_msec() < _ignore_mouse_input_until_msec


func _is_raw_touch_event(event: InputEvent) -> bool:
	return event is InputEventScreenTouch or event is InputEventScreenDrag


func _reset_mouse_mode_activation_tracking() -> void:
	_mouse_mode_activation_distance = 0.0


func _should_activate_mouse_mode_from_motion(event: InputEventMouseMotion) -> bool:
	if _should_ignore_synthetic_mouse_event(event):
		return false
	if current_mode == MODE_MOUSE:
		return true
	if mouse_mode_activation_distance_px <= 0.0:
		return true

	_mouse_mode_activation_distance += event.relative.length()
	return _mouse_mode_activation_distance >= mouse_mode_activation_distance_px


func _ensure_default_input_map() -> void:
	_add_action("move_left", [_key(KEY_A), _key(KEY_LEFT), _joy_button(JOY_BUTTON_DPAD_LEFT), _joy_axis(JOY_AXIS_LEFT_X, -1.0)])
	_add_action("move_right", [_key(KEY_D), _key(KEY_RIGHT), _joy_button(JOY_BUTTON_DPAD_RIGHT), _joy_axis(JOY_AXIS_LEFT_X, 1.0)])
	_add_action("move_up", [_key(KEY_W), _key(KEY_UP), _joy_button(JOY_BUTTON_DPAD_UP), _joy_axis(JOY_AXIS_LEFT_Y, -1.0)])
	_add_action("move_down", [_key(KEY_S), _key(KEY_DOWN), _joy_button(JOY_BUTTON_DPAD_DOWN), _joy_axis(JOY_AXIS_LEFT_Y, 1.0)])
	_add_action("interact", [_key(KEY_SPACE), _key(KEY_ENTER), _mouse_button(MOUSE_BUTTON_LEFT), _joy_button(JOY_BUTTON_A)])
	_add_action("skip", [_key(KEY_CTRL), _joy_button(JOY_BUTTON_LEFT_SHOULDER)])
	_add_action("auto", [_key(KEY_F), _joy_button(JOY_BUTTON_X)])
	_add_action("auto_hold", [_key(KEY_SPACE), _joy_button(JOY_BUTTON_A)])
	_add_action("log", [_key(KEY_SHIFT), _joy_button(JOY_BUTTON_Y)])
	_add_action("tree", [_key(KEY_TAB), _joy_button(JOY_BUTTON_BACK)])
	_add_action("menu", [_key(KEY_ESCAPE), _joy_button(JOY_BUTTON_START)])
	_add_action("back", [_key(KEY_ESCAPE), _key(KEY_Q), _key(KEY_BACKSPACE), _mouse_button(MOUSE_BUTTON_RIGHT), _joy_button(JOY_BUTTON_B)])
	_add_action("connect_mode", [_key(KEY_R), _joy_button(JOY_BUTTON_RIGHT_SHOULDER)])
	_add_action("notebook", [_key(KEY_TAB), _key(KEY_N)])
	_add_action("pause", [_key(KEY_P), _joy_button(JOY_BUTTON_START)])
	_add_action("focus_next", [_key(KEY_TAB), _joy_button(JOY_BUTTON_RIGHT_SHOULDER)])
	_add_action("focus_previous", [_key(KEY_BACKTAB), _joy_button(JOY_BUTTON_LEFT_SHOULDER)])
	_add_action("ui_left", [_key(KEY_A), _key(KEY_LEFT), _joy_button(JOY_BUTTON_DPAD_LEFT), _joy_axis(JOY_AXIS_LEFT_X, -1.0), _joy_axis(JOY_AXIS_RIGHT_X, -1.0)])
	_add_action("ui_right", [_key(KEY_D), _key(KEY_RIGHT), _joy_button(JOY_BUTTON_DPAD_RIGHT), _joy_axis(JOY_AXIS_LEFT_X, 1.0), _joy_axis(JOY_AXIS_RIGHT_X, 1.0)])
	_add_action("ui_up", [_key(KEY_W), _key(KEY_UP), _joy_button(JOY_BUTTON_DPAD_UP), _joy_axis(JOY_AXIS_LEFT_Y, -1.0), _joy_axis(JOY_AXIS_RIGHT_Y, -1.0)])
	_add_action("ui_down", [_key(KEY_S), _key(KEY_DOWN), _joy_button(JOY_BUTTON_DPAD_DOWN), _joy_axis(JOY_AXIS_LEFT_Y, 1.0), _joy_axis(JOY_AXIS_RIGHT_Y, 1.0)])
	_add_action("ui_accept", [_key(KEY_SPACE), _key(KEY_ENTER), _joy_button(JOY_BUTTON_A)])
	_add_action("ui_cancel", [_key(KEY_ESCAPE), _key(KEY_Q), _key(KEY_BACKSPACE), _joy_button(JOY_BUTTON_B)])
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
