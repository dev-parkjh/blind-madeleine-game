# 10 Branch Tree

## 현재 UI

- 구현: `scripts/screens/branch_tree_screen.gd`
- 요소: `BranchArchivePanel`, `TreePanel`, `ChapterCanvas`, 그리드, 연결선, `DialogueNodeLayer`, 노드 카드, `InspectorPanel`, 챕터 커버 프리뷰, 이동 버튼, 이동 확인 모달, 루트 전환 오버레이
- 현재 스타일: 사건 파일/챕터 캔버스, 어두운 격자, 노드 카드, 우측 인스펙터

## 개별 프롬프트

```text
Create a branch tree archive UI for Blind Madeleine.

Composition: 1920x1080 mockup. Large dark archive panel with header. Main content split into a wide left tree canvas and a narrower right inspector. The tree canvas has a dark technical grid, subtle canvas watermark area, branching dialogue node cards, curved or angled connection lines with arrowheads, current node highlight, start node highlight, selected node focus. The right inspector has chapter metadata blocks, image preview frame, selected dialogue title/meta/preview blank areas, and a full-width move button. Include a centered move-confirm modal.

Visual style: detective case-board meets software archive. Use charcoal technical canvas, muted silver grid, pale current-route line, aged file label details, small red thread accents, restrained shadows. It should feel like reviewing an investigation timeline, not a colorful flowchart app.

Asset sheet requirements: transparent background; archive panel, tree surface, grid tile sample, connection line styles, dialogue node card normal/hover/selected/current/start, inspector panel, preview frame, move button states, confirmation modal, transition overlay style frame. No readable text.
```
