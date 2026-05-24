extends "res://scripts/screens/screen_base.gd"


func _ready() -> void:
	screen_id = "branch_tree"
	screen_title = "분기트리"
	skip_allowed = false
	_build()


func _build() -> void:
	make_full_rect()

	var layout := VBoxContainer.new()
	layout.name = "BranchTreeLayout"
	layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_theme_constant_override("separation", 12)
	add_child(layout)

	var header := HBoxContainer.new()
	header.name = "BranchTreeHeader"
	header.add_theme_constant_override("separation", 12)
	layout.add_child(header)

	var title := Label.new()
	title.name = "BranchTreeTitle"
	title.text = "분기트리"
	title.add_theme_font_size_override("font_size", 28)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(title)

	var close_button := Button.new()
	close_button.name = "CloseButton"
	close_button.text = "닫기"
	close_button.pressed.connect(request_close)
	header.add_child(close_button)

	var scroll := ScrollContainer.new()
	scroll.name = "BranchTreeScroll"
	scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_child(scroll)

	var tree_canvas := Control.new()
	tree_canvas.name = "BranchTreeCanvas"
	tree_canvas.custom_minimum_size = Vector2(1180, 720)
	tree_canvas.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	tree_canvas.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.add_child(tree_canvas)

	var route_columns := HBoxContainer.new()
	route_columns.name = "RouteColumns"
	route_columns.set_anchors_preset(Control.PRESET_FULL_RECT)
	route_columns.add_theme_constant_override("separation", 18)
	tree_canvas.add_child(route_columns)

	for column_index in 3:
		var column := VBoxContainer.new()
		column.name = "RouteColumn%d" % (column_index + 1)
		column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		column.size_flags_vertical = Control.SIZE_EXPAND_FILL
		column.add_theme_constant_override("separation", 12)
		route_columns.add_child(column)
		_add_branch_node(column, "BranchNodeTemplate%d" % (column_index + 1))


func _add_branch_node(parent: VBoxContainer, node_name: String) -> void:
	var button := Button.new()
	button.name = node_name
	button.text = "분기 노드"
	button.disabled = true
	button.custom_minimum_size = Vector2(220, 72)
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	parent.add_child(button)
