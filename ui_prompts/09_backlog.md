# 09 Backlog

## 현재 UI

- 구현: `scripts/screens/backlog_screen.gd`
- 요소: `BacklogPanel`, 헤더, close button/hint, `BacklogEntryList`, 일반 로그 엔트리, 선택지 로그 엔트리, 선택 힌트, 돌아가기 확인 모달, `ReturnBlackout`
- 현재 스타일: 검은 모달 패널, 로그 카드, 선택지 엔트리는 낮은 불투명도

## 개별 프롬프트

```text
Create a dialogue backlog overlay UI for Blind Madeleine.

Composition: 1920x1080 overlay mockup with dark scrim and a large centered panel. Header has empty Korean title area, tiny English caption placeholder, close button or close hint. Below it, scrollable list of dialogue log entry cards. Each card has a small index area on the right or corner, speaker name blank area, body text blank lines, and a subtle separator. Include a dimmed choice-entry card style. Include a bottom-right select/back hint group and a centered confirmation dialog for returning to a selected entry.

Visual style: archived transcript, detective evidence log, dark smoked glass, thin silver border, subtle case-file paper grain, restrained hover/focus glow. The return confirmation modal should feel serious, with a primary and secondary action button.

Asset sheet requirements: transparent background; backlog panel, header rule, close ghost button, close hint keycap, regular entry card normal/hover/focus, dim choice entry card, select hint strip, confirmation modal, primary/secondary modal buttons. No readable text.
```
