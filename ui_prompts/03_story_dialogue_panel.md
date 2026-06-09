# 03 Story Dialogue Panel

## 현재 UI

- 구현: `scripts/screens/story_dialogue_screen.gd`
- 요소: 하단 `DialoguePanel`, `DialogueBorderFrame`, `SpeakerName`, `DialogueText`, `AdvanceHintBar`, `DialogueSpectrum`
- 기준 크기: 1920x1080 화면에서 하단 대사창 약 1600x285, 모바일/폴더블에서 더 커짐
- 현재 색: 따뜻한 블랙 `Color(0.095, 0.09, 0.082, 0.88)`, 테두리 회색, 본문 웜그레이

## 개별 프롬프트

```text
Create a VN dialogue window UI kit for Blind Madeleine.

Composition: transparent asset sheet plus one 1920x1080 placement mockup. The main dialogue window is a wide bottom panel with 8-10 px rounded corners, smoky warm-black translucent fill, thin muted-silver border, subtle shadow, and low-detail center for readable Korean text. Include a speaker-name label plate that can sit slightly above or overlap the upper-left area, an optional top border notch for choice labels, a small advance hint area at bottom-right, and a mobile taller variant.

Also include a voice spectrum visual style frame: thin vertical bars and dots in the speaker accent color, softly glowing but not neon, able to appear behind a speaking portrait or near the dialogue panel. Include a "lie/noise" variant with broken waveform, static scratches, and red-tinted glitch specks.

Visual style: intimate detective interrogation, rain on glass, warm office lamp reflected on black lacquer, thin metal rim. No real text. Leave the body text area clean and dark.

Asset sheet requirements: transparent background; dialogue panel normal, dialogue panel without border center, separate border frame, speaker label plate, advance hint icon slot, spectrum normal sample, spectrum lie/noise sample, mobile dialogue panel variant.
```
