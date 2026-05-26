class_name DialogueTypewriter
extends RefCounted

signal typewriter_finished
signal visible_character_changed(visible_count: int, total_count: int)
signal speed_range_active_changed(is_active: bool)

var seconds_per_character: float = 0.036
var pause_character: String = "|"
var seconds_per_pause: float = 0.5
var escape_character: String = "\\"
var default_speed_multiplier: float = 1.0

var _label: RichTextLabel
var _is_typing := false
var _typing_accumulator := 0.0
var _total_characters := 0
var _last_visible_character_count := 0
var _pause_by_index: Dictionary = {}
var _speed_ranges: Array[Dictionary] = []
var _is_speed_range_active := false
var _drop_next_process_delta := false


func bind(label: RichTextLabel) -> void:
	_label = label


func start_line(text: String) -> void:
	if _label == null:
		return

	var parsed := _parse_text_with_pauses(text)
	_label.text = parsed.display_text
	_start_parsed_line(parsed.pause_by_index, [])


func start_bbcode_line(text: String, speed_ranges: Array[Dictionary] = []) -> void:
	if _label == null:
		return

	var parsed := _parse_rich_text_with_pauses(text)
	_label.bbcode_text = parsed.display_text
	_start_parsed_line(parsed.pause_by_index, speed_ranges)


func _start_parsed_line(pause_by_index: Dictionary, speed_ranges: Array[Dictionary]) -> void:
	_label.visible_characters = 0
	_total_characters = _label.get_total_character_count()
	_last_visible_character_count = 0
	_pause_by_index = pause_by_index
	_speed_ranges = speed_ranges.duplicate(true)
	_set_speed_range_active(false)
	_typing_accumulator = _seconds_for_next_character()
	_is_typing = _total_characters > 0
	_refresh_speed_range_active()
	visible_character_changed.emit(0, _total_characters)

	if not _is_typing:
		reveal_all()


func process(delta: float) -> bool:
	if not _is_typing:
		return false

	if _drop_next_process_delta:
		delta = 0.0
		_drop_next_process_delta = false

	_typing_accumulator += delta
	while _last_visible_character_count < _total_characters:
		_refresh_speed_range_active()
		var next_character_delay := _seconds_for_next_character()
		if _typing_accumulator < next_character_delay:
			break

		_typing_accumulator -= next_character_delay
		_set_visible_character_count(_last_visible_character_count + 1)

	_refresh_speed_range_active()
	if _last_visible_character_count >= _total_characters:
		_finish_typewriter()

	return _is_typing


func request_advance() -> bool:
	if _is_typing:
		reveal_all()
		return false

	return true


func reveal_all() -> void:
	if _label == null:
		return

	_set_visible_character_count(_total_characters)
	_label.visible_characters = -1
	_finish_typewriter()


func cancel() -> void:
	if not _is_typing:
		return
	_is_typing = false
	_typing_accumulator = 0.0
	_drop_next_process_delta = false
	_set_speed_range_active(false)


func is_typing() -> bool:
	return _is_typing


func prepare_to_resume() -> void:
	if not _is_typing:
		return
	_typing_accumulator = 0.0
	_drop_next_process_delta = true
	_refresh_speed_range_active()


func _set_visible_character_count(visible_count: int) -> void:
	var clamped_count := clampi(visible_count, 0, _total_characters)
	if clamped_count == _last_visible_character_count:
		return

	_last_visible_character_count = clamped_count
	_label.visible_characters = clamped_count
	_refresh_speed_range_active()
	visible_character_changed.emit(clamped_count, _total_characters)


func _finish_typewriter() -> void:
	var was_typing := _is_typing
	_is_typing = false
	_set_speed_range_active(false)
	if was_typing:
		typewriter_finished.emit()


func _seconds_for_next_character() -> float:
	var extra := float(_pause_by_index.get(_last_visible_character_count, 0.0))
	return seconds_per_character / maxf(_current_speed_multiplier(), 0.01) + extra


func _current_speed_multiplier() -> float:
	for speed_range in _speed_ranges:
		var start := int(speed_range.get("start", -1))
		var end := int(speed_range.get("end", -1))
		if start < 0 or end <= start:
			continue
		if _last_visible_character_count >= start and _last_visible_character_count < end:
			return float(speed_range.get("speed_multiplier", default_speed_multiplier))
		if _last_visible_character_count > 0:
			var last_visible_character_index := _last_visible_character_count - 1
			if last_visible_character_index >= start and last_visible_character_index < end:
				return float(speed_range.get("exit_speed_multiplier", speed_range.get("speed_multiplier", default_speed_multiplier)))
	return default_speed_multiplier


func _refresh_speed_range_active() -> void:
	if not _is_typing:
		_set_speed_range_active(false)
		return
	_set_speed_range_active(not is_equal_approx(_current_speed_multiplier(), default_speed_multiplier))


func _set_speed_range_active(is_active: bool) -> void:
	if _is_speed_range_active == is_active:
		return
	_is_speed_range_active = is_active
	speed_range_active_changed.emit(is_active)


func _parse_text_with_pauses(text: String) -> Dictionary:
	var display := ""
	var pauses := {}
	var visible_index := 0
	var i := 0
	while i < text.length():
		var ch := text[i]

		if ch == escape_character and i + 1 < text.length():
			var next := text[i + 1]
			if next == pause_character or next == escape_character:
				display += next
				visible_index += 1
				i += 2
				continue

		if ch == pause_character:
			# Supports:
			# - "|" => default pause
			# - "||" => two default pauses
			# - "|0.2|" => custom pause seconds (float)
			var consumed := false
			if i + 1 < text.length():
				var next := text[i + 1]
				var could_be_number := (next >= "0" and next <= "9") or next == "."
				if could_be_number:
					var j := i + 1
					while j < text.length() and text[j] != pause_character:
						j += 1
					if j < text.length() and text[j] == pause_character:
						var num_text := text.substr(i + 1, j - (i + 1))
						var parsed := float(num_text)
						if parsed > 0.0:
							pauses[visible_index] = float(pauses.get(visible_index, 0.0)) + parsed
						else:
							pauses[visible_index] = float(pauses.get(visible_index, 0.0)) + seconds_per_pause
						i = j + 1
						consumed = true
			if not consumed:
				pauses[visible_index] = float(pauses.get(visible_index, 0.0)) + seconds_per_pause
				i += 1
			continue

		display += ch
		visible_index += 1
		i += 1
	return {
		"display_text": display,
		"pause_by_index": pauses,
	}


func _parse_rich_text_with_pauses(text: String) -> Dictionary:
	var display := ""
	var pauses := {}
	var visible_index := 0
	var i := 0
	while i < text.length():
		var ch := text[i]

		if ch == "[":
			var close_index := text.find("]", i)
			if close_index >= 0:
				var tag := text.substr(i, close_index - i + 1)
				display += tag
				var tag_name := text.substr(i + 1, close_index - i - 1).strip_edges().to_lower()
				if tag_name == "lb" or tag_name == "rb":
					visible_index += 1
				i = close_index + 1
				continue

		if ch == escape_character and i + 1 < text.length():
			var next := text[i + 1]
			if next == pause_character or next == escape_character:
				display += next
				visible_index += 1
				i += 2
				continue

		if ch == pause_character:
			var consumed := false
			if i + 1 < text.length():
				var next := text[i + 1]
				var could_be_number := (next >= "0" and next <= "9") or next == "."
				if could_be_number:
					var j := i + 1
					while j < text.length() and text[j] != pause_character:
						j += 1
					if j < text.length() and text[j] == pause_character:
						var num_text := text.substr(i + 1, j - (i + 1))
						var parsed := float(num_text)
						pauses[visible_index] = float(pauses.get(visible_index, 0.0)) + (parsed if parsed > 0.0 else seconds_per_pause)
						i = j + 1
						consumed = true
			if not consumed:
				pauses[visible_index] = float(pauses.get(visible_index, 0.0)) + seconds_per_pause
				i += 1
			continue

		display += ch
		visible_index += 1
		i += 1

	return {
		"display_text": display,
		"pause_by_index": pauses,
	}
