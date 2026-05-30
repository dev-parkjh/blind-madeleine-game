@tool
extends RichTextEffect
class_name DialogueGrowEffect

var bbcode = "grow"


func _process_custom_fx(char_fx: CharFXTransform) -> bool:
	var duration := maxf(0.05, float(char_fx.env.get("duration", 1.05)))
	var from_scale := maxf(0.05, float(char_fx.env.get("from", 0.78)))
	var to_scale := maxf(0.05, float(char_fx.env.get("to", 1.34)))
	var delay := maxf(0.0, float(char_fx.env.get("delay", 0.018)))
	var progress := clampf((char_fx.elapsed_time - float(char_fx.range.x) * delay) / duration, 0.0, 1.0)
	var eased := 1.0 - pow(1.0 - progress, 3.0)
	var scale := lerpf(from_scale, to_scale, eased)
	char_fx.transform = char_fx.transform.scaled(Vector2(scale, scale))
	char_fx.offset.y -= 9.0 * (scale - 1.0)
	return true
