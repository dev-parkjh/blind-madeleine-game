@tool
extends RichTextEffect
class_name DialogueBlinkEffect

var bbcode = "blink"


func _process_custom_fx(char_fx: CharFXTransform) -> bool:
	var frequency := maxf(0.1, float(char_fx.env.get("freq", 3.4)))
	var min_alpha := clampf(float(char_fx.env.get("min", 0.12)), 0.0, 1.0)
	var phase := char_fx.elapsed_time * TAU * frequency + float(char_fx.range.x) * 0.08
	var amount := sin(phase) * 0.5 + 0.5
	char_fx.color.a *= lerpf(min_alpha, 1.0, amount)
	return true
