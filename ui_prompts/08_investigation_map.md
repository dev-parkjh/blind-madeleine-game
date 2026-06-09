# 08 Investigation Map

## 현재 UI

- 구현: `scripts/screens/story_dialogue_screen.gd`
- 요소: `InvestigationMapOverlay`, `MapPanel`, `Board`, 위치 핀 버튼, 위치 라벨, 닫기 버튼
- 현재 색: 갈색 웜블랙 지도 패널, 붉은 핀, 보드 격자와 연결선

## 개별 프롬프트

```text
Create an investigation map modal UI for Blind Madeleine.

Composition: centered modal panel for 1920x1080, with dark scrim behind it. Inside the panel: header with empty title safe area and close/back button, large map board area, subtle grid, optional faded map texture area, several red location pin buttons, current-location disabled pin style, small blank label plates beneath pins, and thin route/relationship lines between locations.

Visual style: detective office corkboard/map table translated into clean game UI. Warm charcoal-brown panel, aged map paper texture, rain-stained edges, brass frame, red enamel pins, soft shadows, thin muted-gold grid, faint pencil route lines. Keep it readable and not too busy.

Asset sheet requirements: transparent background; map panel frame, board background, grid overlay, route line sample, pin normal/hover/pressed/disabled/current states, pin label plate, close/back button. Do not render readable place names.
```
