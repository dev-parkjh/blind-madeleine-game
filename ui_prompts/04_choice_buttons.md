# 04 Choice Buttons

## 현재 UI

- 구현: `scripts/screens/story_dialogue_screen.gd`
- 요소: `ChoiceOverlay`, `ChoiceList`, `ChoiceNButton`, `ChoiceBorderFrame`, `ChoiceLabel`, `ChoiceHeardCheck`
- 상태: normal, hover, focus, pressed, disabled
- 레이아웃: 선택지 본문 중앙, 상단 오른쪽 라벨 노치, 왼쪽 들은 항목 체크 표시 가능

## 개별 프롬프트

```text
Create a transparent UI asset sheet for visual novel choice buttons in Blind Madeleine.

Asset sheet composition: several wide rectangular choice buttons, each with an empty central text area, optional small top-right label tab/notch, optional left-side heard/check marker slot, and custom border states. Include states: normal, hover, keyboard/gamepad focus, pressed, disabled, already-heard. Include 1-choice, 2-choice, and 4-choice stack examples. Include a smaller mobile-scaled version.

Visual style: the same smoky warm-black dialogue material, but slightly more tactile. Thin silver border, subtle illuminated focus edge, understated brass pin or clipped-corner detail, tiny red accent only for important/visited state. The label notch should look like a small evidence tag clipped into the border. The heard/check marker should be a small elegant mark area, not a large emoji.

No readable text. Use blank bars or empty areas only. Keep the center flat and dark for Godot RichTextLabel overlay. Make the states clearly different but subtle enough for a detective VN.
```
