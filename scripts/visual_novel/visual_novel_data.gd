extends Node

signal reloaded(character_count: int, dialogue_count: int)
signal load_failed(path: String, message: String)

const BUILTIN_NARRATOR_ID := "narrator"

@export var character_directory := "res://data/characters"
@export var dialogue_directory := "res://data/dialogues"
@export var item_directory := "res://data/items"
@export var reload_on_ready := true

var characters: Dictionary = {}
var dialogues: Dictionary = {}
var items: Dictionary = {}
var load_errors: Array[String] = []


func _ready() -> void:
	if reload_on_ready:
		reload()


func reload() -> bool:
	characters.clear()
	dialogues.clear()
	items.clear()
	load_errors.clear()

	_load_character_files()
	_register_builtin_characters()
	_load_dialogue_files()
	_load_item_files()
	reloaded.emit(characters.size(), dialogues.size())
	return load_errors.is_empty()


func has_character(character_id: StringName) -> bool:
	return characters.has(String(character_id))


func is_narrator_character(character_id: StringName) -> bool:
	return String(character_id) == BUILTIN_NARRATOR_ID


func get_character(character_id: StringName) -> Dictionary:
	return characters.get(String(character_id), {})


func get_all_characters() -> Array:
	return characters.values()


func has_dialogue(dialogue_id: StringName) -> bool:
	return dialogues.has(String(dialogue_id))


func get_dialogue(dialogue_id: StringName) -> Dictionary:
	return dialogues.get(String(dialogue_id), {})


func get_all_dialogues() -> Array:
	return dialogues.values()


func has_item(item_id: StringName) -> bool:
	return items.has(String(item_id))


func get_item(item_id: StringName) -> Dictionary:
	return items.get(String(item_id), {})


func get_all_items() -> Array:
	return items.values()


func get_dialogue_node(dialogue_id: StringName, node_id: StringName) -> Dictionary:
	var dialogue: Dictionary = get_dialogue(dialogue_id)
	var nodes_by_id: Dictionary = dialogue.get("_nodes_by_id", {})
	return nodes_by_id.get(String(node_id), {})


func get_dialogue_start_node(dialogue_id: StringName) -> Dictionary:
	var dialogue: Dictionary = get_dialogue(dialogue_id)
	if dialogue.is_empty():
		return {}
	return get_dialogue_node(dialogue_id, StringName(dialogue.get("start", "")))


func _load_character_files() -> void:
	for path in _get_json_files(character_directory):
		var data: Dictionary = _parse_json_object(path)
		if data.is_empty():
			continue

		var profile: Dictionary = _normalize_character(data, path)
		if profile.is_empty():
			continue

		var character_id: String = profile["id"]
		if is_narrator_character(StringName(character_id)):
			_record_error(path, "The narrator is a built-in character and cannot be defined in data/characters.")
			continue
		if characters.has(character_id):
			_record_error(path, "Duplicate character id: %s" % character_id)
			continue

		characters[character_id] = profile


func _register_builtin_characters() -> void:
	characters[BUILTIN_NARRATOR_ID] = _create_builtin_narrator_profile()


func _create_builtin_narrator_profile() -> Dictionary:
	return {
		"id": BUILTIN_NARRATOR_ID,
		"display_name": "",
		"name_color": "#b8b8b8",
		"portraits": {},
		"voice": {},
		"metadata": {
			"builtin": true,
			"narrator": true,
		},
		"source_path": "<builtin:narrator>",
	}


func _load_dialogue_files() -> void:
	for path in _get_json_files(dialogue_directory):
		var data: Dictionary = _parse_json_object(path)
		if data.is_empty():
			continue

		var dialogue: Dictionary = _normalize_dialogue(data, path)
		if dialogue.is_empty():
			continue

		var dialogue_id: String = dialogue["id"]
		if dialogues.has(dialogue_id):
			_record_error(path, "Duplicate dialogue id: %s" % dialogue_id)
			continue

		dialogues[dialogue_id] = dialogue


func _load_item_files() -> void:
	for path in _get_json_files(item_directory):
		var data: Dictionary = _parse_json_object(path)
		if data.is_empty():
			continue

		var item: Dictionary = _normalize_item(data, path)
		if item.is_empty():
			continue

		var item_id: String = item["id"]
		if items.has(item_id):
			_record_error(path, "Duplicate item id: %s" % item_id)
			continue

		items[item_id] = item


func _get_json_files(directory_path: String) -> Array[String]:
	var paths: Array[String] = []
	var dir := DirAccess.open(directory_path)
	if dir == null:
		_record_error(directory_path, "Directory not found.")
		return paths

	dir.list_dir_begin()
	var file_name := dir.get_next()
	while file_name != "":
		if not dir.current_is_dir() and file_name.get_extension().to_lower() == "json":
			paths.append("%s/%s" % [directory_path.trim_suffix("/"), file_name])
		file_name = dir.get_next()
	dir.list_dir_end()

	paths.sort()
	return paths


func _parse_json_object(path: String) -> Dictionary:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		_record_error(path, "Could not open file.")
		return {}

	var text := file.get_as_text()
	var json := JSON.new()
	var parse_error: Error = json.parse(text)
	if parse_error != OK:
		_record_error(path, "JSON parse error at line %d: %s" % [json.get_error_line(), json.get_error_message()])
		return {}

	var parsed: Variant = json.data
	if typeof(parsed) != TYPE_DICTIONARY:
		_record_error(path, "Root value must be a JSON object.")
		return {}

	var object: Dictionary = parsed
	return object


func _normalize_character(data: Dictionary, path: String) -> Dictionary:
	var character_id := _required_string(data, "id", path)
	if character_id.is_empty():
		return {}

	var profile := _copy_extra_fields(data, {
		"id": character_id,
		"display_name": _optional_string(data, "display_name", character_id, path),
		"name_color": _optional_string(data, "name_color", "#ffffff", path),
		"portraits": _optional_dictionary(data, "portraits", path),
		"voice": _optional_dictionary(data, "voice", path),
		"metadata": _optional_dictionary(data, "metadata", path),
		"source_path": path,
	})
	return profile


func _normalize_item(data: Dictionary, path: String) -> Dictionary:
	var item_id := _optional_string(data, "id", "", path).strip_edges()
	if item_id.is_empty():
		item_id = path.get_file().get_basename()

	var item_name := _optional_string(data, "name", "", path)
	if item_name.strip_edges().is_empty():
		item_name = _optional_string(data, "display_name", item_id, path)

	var item := _copy_extra_fields(data, {
		"id": item_id,
		"name": item_name,
		"description": _optional_string(data, "description", "", path),
		"image": _optional_string(data, "image", "", path),
		"metadata": _optional_dictionary(data, "metadata", path),
		"source_path": path,
	})
	return item


func _normalize_dialogue(data: Dictionary, path: String) -> Dictionary:
	var dialogue_id := _resolve_dialogue_id(data, path)
	if dialogue_id.is_empty():
		return {}

	var raw_nodes := _required_array(data, "nodes", path)
	if raw_nodes.is_empty():
		return {}

	var nodes: Array[Dictionary] = []
	var nodes_by_id: Dictionary = {}

	for index in raw_nodes.size():
		var raw_node: Variant = raw_nodes[index]
		if typeof(raw_node) != TYPE_DICTIONARY:
			_record_error(path, "nodes[%d] must be an object." % index)
			continue

		var node_data: Dictionary = raw_node
		var node: Dictionary = _normalize_dialogue_node(node_data, path, index)
		if node.is_empty():
			continue

		var node_id: String = node["id"]
		if nodes_by_id.has(node_id):
			_record_error(path, "Duplicate node id: %s" % node_id)
			continue

		nodes.append(node)
		nodes_by_id[node_id] = node

	if nodes.is_empty():
		return {}

	_resolve_sequential_next_nodes(nodes)

	var start_node := _optional_string(data, "start", String(nodes[0]["id"]), path)
	if not nodes_by_id.has(start_node):
		_record_error(path, "Start node does not exist: %s" % start_node)
		start_node = String(nodes[0]["id"])

	_validate_dialogue_links(path, nodes, nodes_by_id)

	var dialogue := _copy_extra_fields(data, {
		"id": dialogue_id,
		"start": start_node,
		"nodes": nodes,
		"_nodes_by_id": nodes_by_id,
		"metadata": _optional_dictionary(data, "metadata", path),
		"source_path": path,
	})
	return dialogue


func _dialogue_id_from_path(path: String) -> String:
	return path.get_file().get_basename()


func _resolve_dialogue_id(data: Dictionary, path: String) -> String:
	var dialogue_id := _optional_string(data, "id", "", path).strip_edges()
	if dialogue_id.is_empty():
		dialogue_id = _dialogue_id_from_path(path)
	return dialogue_id


func _resolve_node_id(data: Dictionary, path: String, index: int) -> String:
	var node_id := _optional_string(data, "id", "", path).strip_edges()
	if node_id.is_empty():
		node_id = "@%d" % index
	return node_id


func _resolve_sequential_next_nodes(nodes: Array[Dictionary]) -> void:
	for index in nodes.size():
		var node: Dictionary = nodes[index]
		var choices: Array = node.get("choices", [])
		if not choices.is_empty():
			continue

		var next_id := String(node.get("next", "")).strip_edges()
		if not next_id.is_empty():
			continue

		if index + 1 >= nodes.size():
			continue

		node["next"] = String(nodes[index + 1]["id"])


func _normalize_dialogue_node(data: Dictionary, path: String, index: int) -> Dictionary:
	var node_id := _resolve_node_id(data, path, index)

	var speaker := _optional_string(data, "speaker", "", path)
	if not speaker.is_empty() and not characters.has(speaker):
		_record_error(path, "Unknown speaker '%s' in node '%s'." % [speaker, node_id])

	var node := _copy_extra_fields(data, {
		"id": node_id,
		"speaker": speaker,
		"text": _optional_string(data, "text", "", path),
		"portrait": _optional_string(data, "portrait", "", path),
		"next": _optional_string(data, "next", "", path),
		"choices": _normalize_choices(data.get("choices", []), path, node_id),
		"metadata": _optional_dictionary(data, "metadata", path),
	})
	return node


func _normalize_choices(raw_choices: Variant, path: String, node_id: String) -> Array[Dictionary]:
	var choices: Array[Dictionary] = []
	if raw_choices == null:
		return choices

	if typeof(raw_choices) != TYPE_ARRAY:
		_record_error(path, "choices in node '%s' must be an array." % node_id)
		return choices

	var choice_array: Array = raw_choices
	for index in choice_array.size():
		var raw_choice: Variant = choice_array[index]
		if typeof(raw_choice) != TYPE_DICTIONARY:
			_record_error(path, "choices[%d] in node '%s' must be an object." % [index, node_id])
			continue

		var choice_data: Dictionary = raw_choice
		var choice := _copy_extra_fields(choice_data, {
			"text": _optional_string(choice_data, "text", "", path),
			"next": _optional_string(choice_data, "next", "", path),
			"conditions": _optional_array(choice_data, "conditions", path),
			"set_flags": _optional_dictionary(choice_data, "set_flags", path),
		})
		choices.append(choice)

	return choices


func _validate_dialogue_links(path: String, nodes: Array[Dictionary], nodes_by_id: Dictionary) -> void:
	for node in nodes:
		var node_id: String = node["id"]
		var next_id := String(node.get("next", ""))
		if not next_id.is_empty() and not nodes_by_id.has(next_id):
			_record_error(path, "Node '%s' points to missing next node '%s'." % [node_id, next_id])

		var choices: Array = node.get("choices", [])
		for choice in choices:
			var choice_next := String(choice.get("next", ""))
			if not choice_next.is_empty() and not nodes_by_id.has(choice_next):
				_record_error(path, "Choice in node '%s' points to missing next node '%s'." % [node_id, choice_next])


func _copy_extra_fields(source: Dictionary, normalized: Dictionary) -> Dictionary:
	var result := normalized.duplicate(true)
	for key in source.keys():
		if not result.has(key):
			result[key] = source[key]
	return result


func _required_string(data: Dictionary, key: String, path: String) -> String:
	if not data.has(key):
		_record_error(path, "Missing required string field: %s" % key)
		return ""

	var value: Variant = data[key]
	if typeof(value) != TYPE_STRING:
		_record_error(path, "Field '%s' must be a string." % key)
		return ""

	var text := String(value).strip_edges()
	if text.is_empty():
		_record_error(path, "Field '%s' cannot be empty." % key)
	return text


func _optional_string(data: Dictionary, key: String, default_value: String, path: String) -> String:
	if not data.has(key) or data[key] == null:
		return default_value

	var value: Variant = data[key]
	if typeof(value) != TYPE_STRING:
		_record_error(path, "Field '%s' must be a string." % key)
		return default_value

	return String(value)


func _required_array(data: Dictionary, key: String, path: String) -> Array:
	if not data.has(key):
		_record_error(path, "Missing required array field: %s" % key)
		return []

	var value: Variant = data[key]
	if typeof(value) != TYPE_ARRAY:
		_record_error(path, "Field '%s' must be an array." % key)
		return []

	var result: Array = value
	return result


func _optional_array(data: Dictionary, key: String, path: String) -> Array:
	if not data.has(key) or data[key] == null:
		return []

	var value: Variant = data[key]
	if typeof(value) != TYPE_ARRAY:
		_record_error(path, "Field '%s' must be an array." % key)
		return []

	var result: Array = value
	return result


func _optional_dictionary(data: Dictionary, key: String, path: String) -> Dictionary:
	if not data.has(key) or data[key] == null:
		return {}

	var value: Variant = data[key]
	if typeof(value) != TYPE_DICTIONARY:
		_record_error(path, "Field '%s' must be an object." % key)
		return {}

	var result: Dictionary = value
	return result


func _record_error(path: String, message: String) -> void:
	var full_message := "%s: %s" % [path, message]
	load_errors.append(full_message)
	load_failed.emit(path, message)
	push_warning(full_message)
