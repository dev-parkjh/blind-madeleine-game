# 06 Statement Mode

## 현재 UI

- 구현: `scripts/screens/story_dialogue_screen.gd`, 보조 `scripts/screens/statement_screen.gd`
- 요소: 문장/거짓말 구간 선택 프레임, 좌우 진술 이동 버튼, 제시/선택 입력 힌트, 진술 루프 확인 모달, 진술 타이틀 오버레이
- 현재 스타일: 대사창과 같은 웜블랙 패널, 선택 프레임은 화자색의 반투명 테두리

## 개별 프롬프트

```text
Create a UI kit for the statement/present-evidence mode of Blind Madeleine.

Components: highlight frame for selecting a suspicious phrase inside dialogue text, previous/next side arrow buttons, keyboard/gamepad hint strip for "present/select/back" actions, a centered confirmation modal for looping a statement, and a dramatic statement title overlay style frame. Use transparent background for components and one 1920x1080 mockup showing how they sit around the dialogue panel.

Visual style: courtroom-lite interrogation inside a detective VN, not legal drama fantasy. The phrase selection frame should be precise and elegant: translucent speaker-color fill, sharp thin border, slight glow, no heavy block covering text. Arrow buttons should feel like dark glass tabs attached to the dialogue area. The loop modal should match the dialogue panel material.

For the title overlay, create a dark cinematic intertitle with subtle rain streaks, faint typewriter/case-file texture, and an empty title safe area. Do not render readable text.
```
