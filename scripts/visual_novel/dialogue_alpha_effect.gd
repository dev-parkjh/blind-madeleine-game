@tool
extends RichTextEffect
class_name DialogueAlphaEffect

var bbcode = "alpha"


func _process_custom_fx(char_fx: CharFXTransform) -> bool:
	var value := clampf(float(char_fx.env.get("value", char_fx.env.get("amount", 0.45))), 0.0, 1.0)
	char_fx.color.a *= value
	return true
