# 12 Story Menu And System Overlays

## 현재 UI

- 구현: `scripts/screens/story_dialogue_screen.gd`, `scripts/main/main.gd`, `scripts/ui/rewind_transition_overlay.gd`
- 요소: 스토리 메뉴 모달, 모바일 가로 화면 안내, 입력 모드 토스트, 신규 게임 블랙아웃, 되감기 글리치, 분기 이동 전환

## 개별 프롬프트

```text
Create system overlay UI assets for Blind Madeleine.

Components: centered story menu modal with four large blank buttons, dark scrim, mobile landscape-required notice panel with one primary button, small input-mode toast, full-screen blackout transition style frame, rewind glitch transition style frame, and branch-route transition style frame.

Visual style: minimal, cinematic, detective noir. Menu modal uses the same warm-black dialogue material and thin silver border. The mobile notice should be clear and calm, not playful. The input toast should be a small smoky strip with warm ivory glow. The blackout frame is pure black with a faint rain/film grain edge. The rewind glitch frame has scanlines, horizontal white streaks, subtle VHS-like interference, and an empty central label safe area. The branch transition frame should feel like a route line being redrawn in darkness, with pale line flashes and tiny red node dots.

Asset sheet requirements: transparent components where possible; separate modal panel, modal button states, notice panel, notice button, toast panel, blackout texture frame, rewind scanline/streak texture, branch transition texture. Do not render readable text.
```
