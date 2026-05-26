class_name DialogueTypewriter
extends RefCounted

signal typewriter_finished
signal visible_character_changed(visible_count: int, total_count: int)

var seconds_per_character: float = 0.036
var pause_character: String = "|"
var seconds_per_pause: float = 0.5
var escape_character: String = "\\"

var _label: RichTextLabel
var _is_typing := false
var _typing_accumulator := 0.0
var _total_characters := 0
var _last_visible_character_count := 0
var _pause_by_index: Dictionary = {}


func bind(label: RichTextLabel) -> void:
	_label = label


func start_line(text: String) -> void:
	if _label == null:
		return

	var parsed := _parse_text_with_pauses(text)
	_label.text = parsed.display_text
	_label.visible_characters = 0
	_total_characters = _label.get_total_character_count()
	_last_visible_character_count = 0
	_pause_by_index = parsed.pause_by_index
	_typing_accumulator = _seconds_for_next_character()
	_is_typing = _total_characters > 0
	visible_character_changed.emit(0, _total_characters)

	if not _is_typing:
		reveal_all()


func process(delta: float) -> bool:
	if not _is_typing:
		return false

	_typing_accumulator += delta
	while _last_visible_character_count < _total_characters:
		var next_character_delay := _seconds_for_next_character()
		if _typing_accumulator < next_character_delay:
			break

		_typing_accumulator -= next_character_delay
		_set_visible_character_count(_last_visible_character_count + 1)

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


func is_typing() -> bool:
	return _is_typing


func _set_visible_character_count(visible_count: int) -> void:
	var clamped_count := clampi(visible_count, 0, _total_characters)
	if clamped_count == _last_visible_character_count:
		return

	_last_visible_character_count = clamped_count
	_label.visible_characters = clamped_count
	visible_character_changed.emit(clamped_count, _total_characters)


func _finish_typewriter() -> void:
	var was_typing := _is_typing
	_is_typing = false
	if was_typing:
		typewriter_finished.emit()


func _seconds_for_next_character() -> float:
	var extra := float(_pause_by_index.get(_last_visible_character_count, 0.0))
	return seconds_per_character + extra


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
