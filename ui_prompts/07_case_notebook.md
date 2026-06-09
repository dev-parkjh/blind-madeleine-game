# 07 Case Notebook

## 현재 UI

- 구현: `scripts/screens/story_dialogue_screen.gd`
- 요소: `StatementNotebookOverlay`, `NotebookPanel`, 좌측 `NotebookRail`, `CharacterColumn`, `ItemColumn`, 엔트리 카드, 썸네일, 태그, 닫기 버튼, 입력 힌트
- 현재 색: 검은 패널, 회색 테두리, 카드형 리스트, 작은 썸네일과 태그

## 개별 프롬프트

```text
Create a case notebook overlay UI for Blind Madeleine.

Composition: 1920x1080 overlay mockup plus transparent component sheet. A large investigation notebook panel floats over the story screen. It has a narrow left rail with tiny ticks and circles, a header with empty title and caption areas, a close button, a thin rule, and two columns for people and evidence. Each column has a small header with count area, scrollable entry cards, thumbnail slots, name/subtitle blank text areas, and a small tag capsule.

Visual style: modern detective case file, black leather binder, smoked glass, aged paper edge, subtle brass binding rail, muted silver rules, tiny red thread accent. It should feel premium and serious but not old-fashioned fantasy. Entry cards should be compact, scannable, and readable over dark UI.

Asset sheet requirements: transparent background; notebook panel, left rail, column header, entry card normal/hover/focus/pressed, thumbnail shell, tag chip, close ghost button, empty-state plate, input hint strip. No readable text.
```
