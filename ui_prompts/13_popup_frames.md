# 13 Popup Frames

## 현재 UI

- 구현: `scripts/screens/story_dialogue_screen.gd`
- 요소: `PopupContentFrame`, 노드 팝업 이미지, 컷신 이미지/블랙아웃 프레임
- 용도: 대사 중 삽입되는 이미지, 사건 자료 확대, 컷신 이미지 표시

## 개별 프롬프트

```text
Create popup and cutscene frame UI assets for Blind Madeleine.

Components: floating popup image frame, small evidence-photo frame, large cutscene image matte, rounded crop mask visual, subtle close/inspect affordance area, and optional pinned-paper corner detail. Provide variants for rectangular photo, square evidence item, and wide cutscene still.

Visual style: evidence photos viewed during a noir visual novel. Black paper matte, thin silver/brass frame, faint fingerprints, rain-speckled glass, small red thread or pin detail, soft drop shadow. The frame should enhance artwork without covering it. Keep the center fully transparent or very clean so an image can be placed underneath.

Asset sheet requirements: transparent background; frame-only PNG components with empty center, shadow-only layer, corner pin details, small caption plate with no text, cutscene matte frame. No readable text or decorative logos.
```
