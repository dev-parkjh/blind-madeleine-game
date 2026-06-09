# 02 Chapter Select

## 현재 UI

- 구현: `scripts/screens/chapter_select_screen.gd`
- 요소: `FullBleedChapterArt`, `ChapterCopy`, 챕터 번호/제목/설명, `TitleDivider`, `StartChapterButton`, `BackButton`, 좌우 포인터 네비게이션, 챕터 인디케이터, 키보드/게임패드 힌트
- 배경 톤: 비 오는 도시 야경, 밝은 공원 장면 모두 사용

## 개별 프롬프트

```text
Create a chapter selection UI overlay kit for Blind Madeleine, designed to sit above full-bleed anime chapter artwork.

Composition: 1920x1080 mockup with no characters, only UI overlay components on a neutral dark transparent-friendly background. Include a centered chapter copy group: slim eyebrow rules on left and right, small empty chapter number label, large empty chapter title safe area, ornamental divider, and two-line description safe area. Include a start chapter button, a back button, left/right navigation arrow buttons, a bottom or side chapter carousel indicator with selected state, and keyboard/gamepad hint components.

Visual style: cinematic title-card noir. Use thin rain-wet silver lines, small diamond divider, tiny red warning-light dots, dark brass pins, smoky shadows, and slight lens-vignette feeling. The UI must remain legible over both dark stormy rooftop art and bright sunny park art, so use dark translucent backing only where needed and strong but elegant outline shadows.

Asset sheet requirements: transparent background; separate components for eyebrow rule left/right, divider ornament, title safe plate, description shadow plate, start button states, back button states, left/right nav button states, carousel dot/pill states, keycap states. Do not render readable text.
```
