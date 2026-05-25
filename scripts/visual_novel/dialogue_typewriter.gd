class_name DialogueTypewriter
extends RefCounted

signal typewriter_finished
signal visible_character_changed(visible_count: int, total_count: int)

var seconds_per_character: float = 0.036

var _label: RichTextLabel
var _is_typing := false
var _typing_accumulator := 0.0
var _total_characters := 0
var _last_visible_character_count := 0


func bind(label: RichTextLabel) -> void:
	_label = label


func start_line(text: String) -> void:
	if _label == null:
		return

	_label.text = text
	_label.visible_characters = 0
	_total_characters = _label.get_total_character_count()
	_last_visible_character_count = 0
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
	return seconds_per_character
