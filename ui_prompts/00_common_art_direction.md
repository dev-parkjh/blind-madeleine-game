# 00 Common Art Direction

## 공통 프롬프트

아래 문단을 모든 개별 프롬프트 앞에 붙여 사용하세요.

```text
Create polished 2D game UI assets for "Blind Madeleine", a Korean detective visual novel. Visual direction: cinematic mystery noir, modern Korean city, rain-slick streets, detective office case files, memory and madeleine motif, subtle melancholy, elegant but practical. Match an anime visual novel with high-detail painted backgrounds and characters, not cartoonish, not chibi.

Use a restrained palette: charcoal black, warm black, rain blue-gray, muted silver, aged paper beige, dark brass, tiny red warning-light accents. Suggested colors: #0B0B0B, #171512, #1D2734, #6F7478, #BDBDB8, #D8C8A7, #8A6E46, #B3121C. Keep the UI readable over both dark rainy night scenes and bright daytime park scenes.

Materials and surfaces: translucent smoky glass, wet asphalt sheen, thin brushed-metal border, slightly worn evidence folder paper, matte black lacquer, subtle dust and film grain, faint rain streaks, red string/case-board accents, small brass pin details. Geometry: clean rectangular panels, 8-10 px radius, thin 1-3 px borders, restrained shadows, dense information layout, mobile-friendly touch targets.

Design for a 1920x1080 Godot visual novel UI. Leave generous blank safe areas for Korean text rendered by the game engine. Do not draw real readable Korean or English text, do not invent logos, do not bake UI labels into the image. Use blank text bars, subtle placeholder lines, or empty title spaces only. All components should feel like the same game UI kit.

Output should be high-resolution PNG-ready UI art. Prefer transparent background for asset sheets and isolated components. For full screen mockups, keep the background simple or use a neutral dark placeholder so the UI can be inspected. Make panel centers low-detail and low-contrast so dynamic text remains readable.

Avoid: cute pastel UI, fantasy gold ornamentation, loud cyberpunk neon, purple gradients, cream-only palette, plastic mobile-app buttons, giant rounded pills, heavy skeuomorphic bevels, illegible clutter, fake text, watermarks, logos, unrelated icons.
```

## 구현 메모

- 텍스트는 Godot에서 렌더링하는 편이 안전합니다.
- 패널/버튼은 `normal`, `hover`, `focus`, `pressed`, `disabled` 상태를 함께 받으면 교체가 쉽습니다.
- 중앙이 늘어나는 버튼/패널은 9-slice 처리가 가능하도록 가장자리 장식과 중앙 질감을 분리해 달라고 요청하세요.
- 밝은 챕터 배경에서도 읽히도록 패널의 평균 명도는 어둡게, 테두리와 포커스만 밝게 두는 방향이 좋습니다.
