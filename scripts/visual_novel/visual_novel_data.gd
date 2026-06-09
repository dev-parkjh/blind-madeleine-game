extends Node

signal reloaded(character_count: int, dialogue_count: int)
signal load_failed(path: String, message: String)
signal info_acquired(kind: String, target_id: String)
signal acquired_info_changed()

const BUILTIN_NARRATOR_ID := "narrator"

@export var character_directory := "res://data/characters"
@export var chapter_directory := "res://data/chapters"
@export var dialogue_directory := "res://data/dialogues"
@export var item_directory := "res://data/items"
@export var story_asset_directory := "res://data/story_assets"
@export var reload_on_ready := true

var characters: Dictionary = {}
var chapters: Dictionary = {}
var dialogues: Dictionary = {}
var items: Dictionary = {}
var story_assets: Dictionary = {}
var acquired_character_ids: Dictionary = {}
var acquired_item_ids: Dictionary = {}
var load_errors: Array[String] = []


func _ready() -> void:
	if reload_on_ready:
		reload()


func reload() -> bool:
	characters.clear()
	chapters.clear()
	dialogues.clear()
	items.clear()
	story_assets.clear()
	load_errors.clear()

	_load_character_files()
	_register_builtin_characters()
	_load_dialogue_files()
	_load_chapter_files()
	_load_item_files()
	_load_story_asset_files()
	reloaded.emit(characters.size(), dialogues.size())
	return load_errors.is_empty()


func apply_editor_preview_dialogue(data: Dictionary, path := "editor_preview") -> bool:
	var dialogue := _normalize_dialogue(data, path)
	if dialogue.is_empty():
		return false
	dialogues[String(dialogue["id"])] = dialogue
	return true


func has_character(character_id: StringName) -> bool:
	return characters.has(String(character_id))


func is_narrator_character(character_id: StringName) -> bool:
	return String(character_id) == BUILTIN_NARRATOR_ID


func get_character(character_id: StringName) -> Dictionary:
	return characters.get(String(character_id), {})


func get_all_characters() -> Array:
	return characters.values()


func has_chapter(chapter_id: StringName) -> bool:
	return chapters.has(String(chapter_id))


func get_chapter(chapter_id: StringName) -> Dictionary:
	return chapters.get(String(chapter_id), {})


func get_all_chapters() -> Array:
	var result := chapters.values()
	result.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		var order_a := int(a.get("order", 0))
		var order_b := int(b.get("order", 0))
		if order_a != order_b:
			return order_a < order_b
		return String(a.get("id", "")) < String(b.get("id", ""))
	)
	return result


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


func has_story_asset(asset_id: StringName) -> bool:
	return story_assets.has(String(asset_id))


func get_story_asset(asset_id: StringName) -> Dictionary:
	return story_assets.get(String(asset_id), {})


func get_all_story_assets() -> Array:
	var result := story_assets.values()
	result.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		var kind_a := String(a.get("kind", ""))
		var kind_b := String(b.get("kind", ""))
		if kind_a != kind_b:
			return kind_a < kind_b
		return String(a.get("display_name", a.get("id", ""))) < String(b.get("display_name", b.get("id", "")))
	)
	return result


func clear_acquired_info() -> void:
	var had_info := not acquired_character_ids.is_empty() or not acquired_item_ids.is_empty()
	acquired_character_ids.clear()
	acquired_item_ids.clear()
	if had_info:
		acquired_info_changed.emit()


func set_acquired_info(character_ids: Array = [], item_ids: Array = []) -> void:
	acquired_character_ids.clear()
	acquired_item_ids.clear()
	for raw_id in character_ids:
		var id := String(raw_id).strip_edges()
		if id.is_empty() or is_narrator_character(StringName(id)) or not has_character(StringName(id)):
			continue
		acquired_character_ids[id] = true
	for raw_id in item_ids:
		var id := String(raw_id).strip_edges()
		if id.is_empty() or not has_item(StringName(id)):
			continue
		acquired_item_ids[id] = true
	acquired_info_changed.emit()


func acquire_character_info(character_id: StringName) -> bool:
	var id := String(character_id).strip_edges()
	if id.is_empty() or is_narrator_character(StringName(id)):
		return false
	if not has_character(StringName(id)):
		push_warning("Cannot acquire unknown character info: %s" % id)
		return false
	if acquired_character_ids.has(id):
		return false
	acquired_character_ids[id] = true
	info_acquired.emit("character", id)
	acquired_info_changed.emit()
	return true


func acquire_item_info(item_id: StringName) -> bool:
	var id := String(item_id).strip_edges()
	if id.is_empty():
		return false
	if not has_item(StringName(id)):
		push_warning("Cannot acquire unknown item info: %s" % id)
		return false
	if acquired_item_ids.has(id):
		return false
	acquired_item_ids[id] = true
	info_acquired.emit("item", id)
	acquired_info_changed.emit()
	return true


func acquire_info_from_data(data: Dictionary) -> Dictionary:
	var acquired := {
		"characters": [],
		"items": [],
	}
	for id in _extract_acquire_info_ids(data, "character"):
		if acquire_character_info(StringName(id)):
			(acquired["characters"] as Array).append(id)
	for id in _extract_acquire_info_ids(data, "item"):
		if acquire_item_info(StringName(id)):
			(acquired["items"] as Array).append(id)
	return acquired


func acquire_info_from_metadata(metadata: Dictionary) -> Dictionary:
	return acquire_info_from_data(metadata)


func has_any_acquired_info() -> bool:
	return not acquired_character_ids.is_empty() or not acquired_item_ids.is_empty()


func get_acquired_character_ids() -> Array[String]:
	var ids: Array[String] = []
	for raw_id in acquired_character_ids.keys():
		var id := String(raw_id)
		if has_character(StringName(id)) and not is_narrator_character(StringName(id)):
			ids.append(id)
	return ids


func get_acquired_item_ids() -> Array[String]:
	var ids: Array[String] = []
	for raw_id in acquired_item_ids.keys():
		var id := String(raw_id)
		if has_item(StringName(id)):
			ids.append(id)
	return ids


func get_acquired_characters() -> Array:
	var result: Array = []
	for id in get_acquired_character_ids():
		result.append(get_character(StringName(id)))
	return result


func get_acquired_items() -> Array:
	var result: Array = []
	for id in get_acquired_item_ids():
		result.append(get_item(StringName(id)))
	return result


func get_dialogue_node(dialogue_id: StringName, node_id: StringName) -> Dictionary:
	var dialogue: Dictionary = get_dialogue(dialogue_id)
	var nodes_by_id: Dictionary = dialogue.get("_nodes_by_id", {})
	return nodes_by_id.get(String(node_id), {})


func get_dialogue_start_node(dialogue_id: StringName) -> Dictionary:
	var dialogue: Dictionary = get_dialogue(dialogue_id)
	if dialogue.is_empty():
		return {}
	return get_dialogue_node(dialogue_id, StringName(dialogue.get("start", "")))


func _extract_acquire_info_ids(data: Dictionary, kind: String) -> Array[String]:
	var ids: Array[String] = []
	var raw: Variant = data.get("acquire_info", data.get("acquired_info", data.get("acquire_on_complete", data.get("rewards", {}))))
	if typeof(raw) == TYPE_DICTIONARY:
		var reward_data: Dictionary = raw
		if kind == "character":
			_append_acquire_id_values(ids, reward_data.get("characters", reward_data.get("character_ids", [])))
		elif kind == "item":
			_append_acquire_id_values(ids, reward_data.get("items", reward_data.get("item_ids", [])))
		_append_acquire_entries(ids, reward_data.get("entries", []), kind)
	elif typeof(raw) == TYPE_ARRAY:
		_append_acquire_entries(ids, raw, kind)
	return ids


func _append_acquire_id_values(ids: Array[String], raw_values: Variant) -> void:
	if typeof(raw_values) == TYPE_STRING:
		_append_unique_acquire_id(ids, String(raw_values))
		return
	if typeof(raw_values) != TYPE_ARRAY:
		return
	for raw_id in raw_values:
		if typeof(raw_id) == TYPE_DICTIONARY:
			var entry: Dictionary = raw_id
			_append_unique_acquire_id(ids, String(entry.get("target_id", entry.get("id", entry.get("target", "")))))
		else:
			_append_unique_acquire_id(ids, String(raw_id))


func _append_acquire_entries(ids: Array[String], raw_entries: Variant, expected_kind: String) -> void:
	if typeof(raw_entries) != TYPE_ARRAY:
		return
	var entries: Array = raw_entries
	for raw_entry in entries:
		if typeof(raw_entry) != TYPE_DICTIONARY:
			continue
		var entry: Dictionary = raw_entry
		var kind := _normalize_acquire_kind(String(entry.get("kind", entry.get("type", ""))))
		if kind != expected_kind:
			continue
		_append_unique_acquire_id(ids, String(entry.get("target_id", entry.get("id", entry.get("target", "")))))


func _append_unique_acquire_id(ids: Array[String], raw_id: String) -> void:
	var id := raw_id.strip_edges()
	if id.is_empty() or ids.has(id):
		return
	ids.append(id)


func _normalize_acquire_kind(raw_kind: String) -> String:
	var kind := raw_kind.strip_edges().to_lower()
	if kind == "characters" or kind == "character_info" or kind == "person":
		return "character"
	if kind == "items" or kind == "item_info":
		return "item"
	return kind


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
		"protagonist": true,
		"portraits": {},
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


func _load_chapter_files() -> void:
	for path in _get_json_files(chapter_directory):
		var data: Dictionary = _parse_json_object(path)
		if data.is_empty():
			continue

		var chapter: Dictionary = _normalize_chapter(data, path)
		if chapter.is_empty():
			continue

		var chapter_id: String = chapter["id"]
		if chapters.has(chapter_id):
			_record_error(path, "Duplicate chapter id: %s" % chapter_id)
			continue

		chapters[chapter_id] = chapter


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


func _load_story_asset_files() -> void:
	for path in _get_json_files(story_asset_directory):
		var data: Dictionary = _parse_json_object(path)
		if data.is_empty():
			continue

		var story_asset: Dictionary = _normalize_story_asset(data, path)
		if story_asset.is_empty():
			continue

		var asset_id: String = story_asset["id"]
		if story_assets.has(asset_id):
			_record_error(path, "Duplicate story asset id: %s" % asset_id)
			continue

		story_assets[asset_id] = story_asset


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
		"description": _optional_string(data, "description", "", path),
		"name_color": _optional_string(data, "name_color", "#ffffff", path),
		"portraits": _optional_dictionary(data, "portraits", path),
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


func _normalize_story_asset(data: Dictionary, path: String) -> Dictionary:
	var asset_id := _optional_string(data, "id", "", path).strip_edges()
	if asset_id.is_empty():
		asset_id = path.get_file().get_basename()

	var kind := _normalize_story_asset_kind(_optional_string(data, "kind", "sfx", path))
	var display_name := _optional_string(data, "display_name", "", path).strip_edges()
	if display_name.is_empty():
		display_name = _optional_string(data, "name", asset_id, path).strip_edges()

	var normalized := {
		"id": asset_id,
		"kind": kind,
		"display_name": display_name,
		"description": _optional_string(data, "description", "", path),
		"path": _optional_string(data, "path", "", path),
		"loop": _optional_bool(data, "loop", kind == "bgm", path),
		"volume": _optional_float(data, "volume", 1.0, path),
		"metadata": _optional_dictionary(data, "metadata", path),
		"source_path": path,
	}
	if data.has("volume_db"):
		normalized["volume_db"] = _optional_float(data, "volume_db", 0.0, path)

	var story_asset := _copy_extra_fields(data, normalized)
	return story_asset


func _normalize_story_asset_kind(raw_kind: String) -> String:
	var kind := raw_kind.strip_edges().to_lower()
	if kind in ["bgm", "music", "background_music"]:
		return "bgm"
	if kind in ["sfx", "sound", "se", "effect", "effect_sound"]:
		return "sfx"
	if kind in ["bg", "image", "background", "background_image", "background_img"]:
		return "background"
	return "sfx"


func _normalize_chapter(data: Dictionary, path: String) -> Dictionary:
	var chapter_id := _optional_string(data, "id", "", path).strip_edges()
	if chapter_id.is_empty():
		chapter_id = path.get_file().get_basename()

	var title := _optional_string(data, "title", "", path).strip_edges()
	if title.is_empty():
		title = _optional_string(data, "name", "", path).strip_edges()
	if title.is_empty():
		title = _optional_string(data, "display_name", chapter_id, path)

	var start_dialogue := _optional_string(data, "start_dialogue", "", path).strip_edges()
	if start_dialogue.is_empty():
		start_dialogue = _optional_string(data, "dialogue_id", "", path).strip_edges()
	if start_dialogue.is_empty():
		start_dialogue = _optional_string(data, "first_dialogue", "", path).strip_edges()
	if not start_dialogue.is_empty() and not dialogues.has(start_dialogue):
		_record_error(path, "Chapter '%s' points to missing start_dialogue '%s'." % [chapter_id, start_dialogue])

	var chapter := _copy_extra_fields(data, {
		"id": chapter_id,
		"title": title,
		"order": _optional_int(data, "order", 0, path),
		"start_dialogue": start_dialogue,
		"description": _optional_string(data, "description", "", path),
		"metadata": _optional_dictionary(data, "metadata", path),
		"source_path": path,
	})
	return chapter


func _normalize_dialogue(data: Dictionary, path: String) -> Dictionary:
	var dialogue_id := _resolve_dialogue_id(data, path)
	if dialogue_id.is_empty():
		return {}

	var nodes: Array[Dictionary] = []
	var statement_nodes: Array[Dictionary] = []
	var statement_node_ids: Array[String] = []
	var reaction_nodes: Array[Dictionary] = []
	var nodes_by_id: Dictionary = {}

	var raw_nodes := _optional_array(data, "nodes", path) if data.has("nodes") else []
	_normalize_dialogue_node_array(raw_nodes, path, "nodes", "@", nodes, nodes_by_id)
	_normalize_statement_nodes(data, path, statement_nodes, statement_node_ids, nodes_by_id)

	if nodes.is_empty() and statement_node_ids.is_empty():
		_record_error(path, "At least one node or statement node is required.")
		return {}

	_resolve_sequential_next_nodes(nodes)
	var reaction_parent_nodes: Array[Dictionary] = []
	reaction_parent_nodes.append_array(nodes)
	reaction_parent_nodes.append_array(statement_nodes)
	_normalize_statement_reaction_nodes(reaction_parent_nodes, path, reaction_nodes, nodes_by_id)

	var default_start := ""
	if not nodes.is_empty():
		default_start = String(nodes[0]["id"])
	elif not statement_node_ids.is_empty():
		default_start = statement_node_ids[0]
	var start_node := _optional_string(data, "start", default_start, path)
	if not nodes_by_id.has(start_node):
		_record_error(path, "Start node does not exist: %s" % start_node)
		start_node = default_start

	var link_nodes: Array[Dictionary] = []
	link_nodes.append_array(nodes)
	link_nodes.append_array(statement_nodes)
	link_nodes.append_array(reaction_nodes)
	_validate_dialogue_links(path, link_nodes, nodes_by_id)

	var dialogue := _copy_extra_fields(data, {
		"id": dialogue_id,
		"label": _resolve_dialogue_label(data, dialogue_id, path),
		"start": start_node,
		"nodes": nodes,
		"statement_nodes": statement_nodes,
		"_statement_node_ids": statement_node_ids,
		"_nodes_by_id": nodes_by_id,
		"metadata": _optional_dictionary(data, "metadata", path),
		"source_path": path,
	})
	return dialogue


func _dialogue_id_from_path(path: String) -> String:
	return path.get_file().get_basename()


func _resolve_dialogue_id(data: Dictionary, path: String) -> String:
	return _optional_string(data, "id", _dialogue_id_from_path(path), path).strip_edges()


func _resolve_dialogue_label(data: Dictionary, fallback: String, path: String) -> String:
	var label := _optional_string(data, "label", "", path).strip_edges()
	if label.is_empty():
		label = _optional_string(data, "title", "", path).strip_edges()
	if label.is_empty():
		label = _optional_string(data, "display_name", "", path).strip_edges()
	if label.is_empty():
		label = _optional_string(data, "name", fallback, path).strip_edges()
	return label


func _resolve_node_id(data: Dictionary, path: String, index: int, auto_id_prefix := "@") -> String:
	var node_id := _optional_string(data, "id", "", path).strip_edges()
	if node_id.is_empty():
		node_id = "%s%d" % [auto_id_prefix, index]
	return node_id


func _resolve_sequential_next_nodes(nodes: Array[Dictionary]) -> void:
	for index in nodes.size():
		var node: Dictionary = nodes[index]
		var sequential_next_id := ""
		if index + 1 < nodes.size():
			sequential_next_id = String(nodes[index + 1]["id"])

		var choices: Array = node.get("choices", [])
		if not choices.is_empty():
			_resolve_sequential_choice_next_nodes(choices, sequential_next_id)
			continue

		var next_id := String(node.get("next", "")).strip_edges()
		if not next_id.is_empty():
			continue

		if sequential_next_id.is_empty():
			continue

		node["next"] = sequential_next_id


func _resolve_sequential_choice_next_nodes(choices: Array, sequential_next_id: String) -> void:
	if sequential_next_id.is_empty():
		return

	for raw_choice in choices:
		if typeof(raw_choice) != TYPE_DICTIONARY:
			continue

		var choice: Dictionary = raw_choice
		var next_id := String(choice.get("next", "")).strip_edges()
		if next_id.is_empty():
			choice["next"] = sequential_next_id


func _normalize_dialogue_node_array(
	raw_nodes: Array,
	path: String,
	field_name: String,
	auto_id_prefix: String,
	nodes: Array[Dictionary],
	nodes_by_id: Dictionary
) -> void:
	for index in raw_nodes.size():
		var raw_node: Variant = raw_nodes[index]
		if typeof(raw_node) != TYPE_DICTIONARY:
			_record_error(path, "%s[%d] must be an object." % [field_name, index])
			continue

		var node_data: Dictionary = raw_node
		var node: Dictionary = _normalize_dialogue_node(node_data, path, index, auto_id_prefix)
		if node.is_empty():
			continue

		var node_id: String = node["id"]
		if nodes_by_id.has(node_id):
			_record_error(path, "Duplicate node id: %s" % node_id)
			continue

		nodes.append(node)
		nodes_by_id[node_id] = node


func _normalize_statement_nodes(
	data: Dictionary,
	path: String,
	statement_nodes: Array[Dictionary],
	statement_node_ids: Array[String],
	nodes_by_id: Dictionary
) -> void:
	var raw_statement_nodes: Variant = data.get("statement_nodes", data.get("statements", []))
	if raw_statement_nodes == null:
		return

	if typeof(raw_statement_nodes) != TYPE_ARRAY:
		_record_error(path, "Field 'statement_nodes' must be an array.")
		return

	var raw_array: Array = raw_statement_nodes
	for index in raw_array.size():
		var raw_entry: Variant = raw_array[index]
		if typeof(raw_entry) == TYPE_STRING:
			var linked_node_id := String(raw_entry).strip_edges()
			if linked_node_id.is_empty():
				_record_error(path, "statement_nodes[%d] cannot be empty." % index)
				continue
			if not nodes_by_id.has(linked_node_id):
				_record_error(path, "statement_nodes[%d] points to missing node '%s'." % [index, linked_node_id])
				continue
			if statement_node_ids.has(linked_node_id):
				_record_error(path, "statement_nodes[%d] duplicates node '%s'." % [index, linked_node_id])
				continue
			statement_node_ids.append(linked_node_id)
			continue

		if typeof(raw_entry) != TYPE_DICTIONARY:
			_record_error(path, "statement_nodes[%d] must be a node object." % index)
			continue

		var node_data: Dictionary = raw_entry
		var node := _normalize_dialogue_node(node_data, path, index, "@statement_")
		if node.is_empty():
			continue

		var node_id: String = node["id"]
		if nodes_by_id.has(node_id):
			_record_error(path, "Duplicate node id: %s" % node_id)
			continue
		if statement_node_ids.has(node_id):
			_record_error(path, "statement_nodes[%d] duplicates node '%s'." % [index, node_id])
			continue

		statement_nodes.append(node)
		nodes_by_id[node_id] = node
		statement_node_ids.append(node_id)


func _normalize_statement_reaction_nodes(
	parent_nodes: Array[Dictionary],
	path: String,
	reaction_nodes: Array[Dictionary],
	nodes_by_id: Dictionary
) -> void:
	for parent_index in parent_nodes.size():
		var parent_node: Dictionary = parent_nodes[parent_index]
		var parent_node_id := String(parent_node.get("id", ""))
		var statement_lies: Variant = parent_node.get("statement_lies", parent_node.get("lies", []))
		if typeof(statement_lies) != TYPE_ARRAY:
			continue

		var lie_array: Array = statement_lies
		for lie_index in lie_array.size():
			var raw_lie: Variant = lie_array[lie_index]
			if typeof(raw_lie) != TYPE_DICTIONARY:
				continue

			var lie: Dictionary = raw_lie
			var reactions: Variant = lie.get("reactions", [])
			if typeof(reactions) != TYPE_ARRAY:
				continue

			var reaction_array: Array = reactions
			for reaction_index in reaction_array.size():
				var raw_reaction: Variant = reaction_array[reaction_index]
				if typeof(raw_reaction) != TYPE_DICTIONARY:
					continue

				var reaction: Dictionary = raw_reaction
				var raw_child_nodes: Variant = reaction.get("nodes", reaction.get("children", []))
				if raw_child_nodes == null:
					raw_child_nodes = []
				if typeof(raw_child_nodes) != TYPE_ARRAY:
					_record_error(
						path,
						"Statement reaction %d:%d in node '%s' must define 'nodes' as an array." % [
							lie_index,
							reaction_index,
							parent_node_id,
						]
					)
					continue

				var child_nodes: Array[Dictionary] = []
				var raw_child_array: Array = raw_child_nodes
				var auto_prefix := "@reaction_%d_%d_%d_" % [parent_index, lie_index, reaction_index]
				_normalize_dialogue_node_array(
					raw_child_array,
					path,
					"statement_lies[%d].reactions[%d].nodes" % [lie_index, reaction_index],
					auto_prefix,
					child_nodes,
					nodes_by_id
				)
				_resolve_sequential_next_nodes(child_nodes)
				if bool(reaction.get("statement_end", reaction.get("ends_statement", false))) and not child_nodes.is_empty():
					child_nodes[child_nodes.size() - 1]["statement_end"] = true
				reaction["nodes"] = child_nodes
				if not child_nodes.is_empty() and String(reaction.get("next", "")).strip_edges().is_empty():
					reaction["next"] = String(child_nodes[0]["id"])
				reaction_nodes.append_array(child_nodes)


func _normalize_dialogue_node(data: Dictionary, path: String, index: int, auto_id_prefix := "@") -> Dictionary:
	var node_id := _resolve_node_id(data, path, index, auto_id_prefix)
	var raw_mode := _optional_string(data, "mode", "", path)
	if raw_mode.strip_edges().is_empty():
		raw_mode = _optional_string(data, "type", "dialogue", path)
	var node_mode := _normalize_dialogue_node_mode(raw_mode)

	var speaker := _optional_string(data, "speaker", "", path)
	if node_mode == "dialogue" and not speaker.is_empty() and not characters.has(speaker):
		_record_error(path, "Unknown speaker '%s' in node '%s'." % [speaker, node_id])

	var node := _copy_extra_fields(data, {
		"id": node_id,
		"mode": node_mode,
		"speaker": speaker,
		"speaker_mystery": _optional_bool(data, "speaker_mystery", false, path),
		"text": _optional_string(data, "text", "", path),
		"portrait": _optional_string(data, "portrait", "", path),
		"next": _optional_string(data, "next", "", path),
		"choices": _normalize_choices(data.get("choices", []), path, node_id),
		"metadata": _optional_dictionary(data, "metadata", path),
	})
	return node


func _normalize_dialogue_node_mode(value: String) -> String:
	var normalized := value.strip_edges().to_lower()
	if normalized in ["cutscene", "blackout", "dark", "fade_black", "fade-to-black", "암전", "컷씬"]:
		return "cutscene"
	if normalized in ["stage", "stage_cast", "stagecast", "character_motion", "character_movement", "motion", "move", "무대", "캐릭터 이동", "캐릭터이동"]:
		return "stage"
	return "dialogue"


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
			"label": _optional_string(choice_data, "label", "", path),
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

		var statement_lies: Variant = node.get("statement_lies", node.get("lies", []))
		if typeof(statement_lies) == TYPE_ARRAY:
			for lie_index in (statement_lies as Array).size():
				var raw_lie: Variant = (statement_lies as Array)[lie_index]
				if typeof(raw_lie) != TYPE_DICTIONARY:
					continue
				var lie: Dictionary = raw_lie
				var reactions: Variant = lie.get("reactions", [])
				if typeof(reactions) != TYPE_ARRAY:
					continue
				for reaction_index in (reactions as Array).size():
					var raw_reaction: Variant = (reactions as Array)[reaction_index]
					if typeof(raw_reaction) != TYPE_DICTIONARY:
						continue
					var reaction: Dictionary = raw_reaction
					var reaction_next := String(reaction.get("next", "")).strip_edges()
					if not reaction_next.is_empty() and not nodes_by_id.has(reaction_next):
						_record_error(
							path,
							"Statement reaction %d:%d in node '%s' points to missing node '%s'." % [
								lie_index,
								reaction_index,
								node_id,
								reaction_next,
							]
						)


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


func _optional_int(data: Dictionary, key: String, default_value: int, path: String) -> int:
	if not data.has(key) or data[key] == null:
		return default_value

	var value: Variant = data[key]
	if typeof(value) == TYPE_INT:
		return int(value)
	if typeof(value) == TYPE_FLOAT:
		return int(value)
	if typeof(value) == TYPE_STRING and String(value).is_valid_int():
		return String(value).to_int()

	_record_error(path, "Field '%s' must be an integer." % key)
	return default_value


func _optional_float(data: Dictionary, key: String, default_value: float, path: String) -> float:
	if not data.has(key) or data[key] == null:
		return default_value

	var value: Variant = data[key]
	if typeof(value) == TYPE_FLOAT or typeof(value) == TYPE_INT:
		return float(value)
	if typeof(value) == TYPE_STRING and String(value).is_valid_float():
		return String(value).to_float()

	_record_error(path, "Field '%s' must be a number." % key)
	return default_value


func _optional_bool(data: Dictionary, key: String, default_value: bool, path: String) -> bool:
	if not data.has(key) or data[key] == null:
		return default_value

	var value: Variant = data[key]
	if typeof(value) == TYPE_BOOL:
		return bool(value)
	if typeof(value) == TYPE_STRING:
		var text := String(value).strip_edges().to_lower()
		if text in ["true", "1", "yes", "on"]:
			return true
		if text in ["false", "0", "no", "off"]:
			return false

	_record_error(path, "Field '%s' must be a boolean." % key)
	return default_value


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
