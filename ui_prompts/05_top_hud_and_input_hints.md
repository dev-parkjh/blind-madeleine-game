# 05 Top HUD And Input Hints

## 현재 UI

- 구현: `scripts/screens/story_dialogue_screen.gd`, `scripts/screens/chapter_select_screen.gd`, `scripts/screens/backlog_screen.gd`, `scripts/screens/branch_tree_screen.gd`
- 요소: 상단 `Skip`, `Auto`, `Log`, `Tree`, `Case`, `Menu`, 입력 힌트, 키캡, 게임패드 아이콘 자리, 선택/닫기 힌트
- 현재 스타일: 거의 투명한 텍스트 버튼, hover 시 ghost 배경, 작은 keycap

## 개별 프롬프트

```text
Create a shared top HUD and input-hint UI asset sheet for Blind Madeleine.

Components: top-right ghost menu button background for six compact commands, active state background for skip/auto, thin vertical separators, small keyboard keycaps, longer keyboard keycaps, gamepad icon backing plates, bottom-right action hint group, close hint group, side navigation hint group, and tiny pulse/advance hint marker.

Visual style: almost invisible until needed, elegant detective UI overlay. Transparent charcoal hover plates, warm ivory text-safe color references, thin black text outline support, muted silver separators, small brass/rain-blue highlights. Keycaps should look like dark enamel keys with thin warm-gray rim. Gamepad icon backing plates should be neutral and not conflict with existing Xbox icon art.

Asset sheet requirements: transparent background; no readable command labels, only blank text-safe regions and generic icon slots. Include normal, hover, active, disabled/faded variants. Keep all shapes compact and suitable for overlaying on character artwork.
```
