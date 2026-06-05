# Vite React Editor Migration Log

작성일: 2026-06-05  
브랜치: `codex/renewal-editor`

## 목표

기존 `tools/*.html` 단일 파일 에디터를 `tools/editor`의 Node 기반 로컬 서버 + Vite React 앱으로 마이그레이션한다. Git 기록을 시간순으로 확인해 기능 축을 놓치지 않도록 하고, 이후 문제가 생겼을 때 어떤 기능이 어느 단계에서 반영됐는지 추적할 수 있게 남긴다.

## Material 3 Expressive 기준

참조한 공식 문서:

- https://m3.material.io/
- https://developer.android.com/design/ui/wear/guides/get-started/design-language
- https://developer.android.com/design/ui/wear/guides/get-started/levels-expression
- https://developer.android.com/design/ui/wear/guides/get-started

반영 기준:

- 색상: 기존 보라/금색 단일 톤을 그대로 반복하지 않고 `primary`, `secondary`, `tertiary`, `error`, `surface container` 계층을 분리했다.
- 형태: 작업 UI의 밀도는 유지하되, 주요 선택 상태와 버튼 상태에서 원형/완만한 형태가 더 단단한 형태로 바뀌는 shape morphing 느낌을 적용했다.
- 모션: 긴 장식 애니메이션 대신 hover/focus/selection 상태 전환에 짧은 easing을 적용했다.
- 타이포그래피: Pretendard variable font를 유지하고, 히어로성 대형 타이포를 피했다. 에디터이므로 본문과 컨트롤 가독성을 우선했다.
- 적응형: 데스크톱에서는 내비게이션, 목록, 작업영역, 검증 패널을 4컬럼으로 배치하고, 좁은 화면에서는 수평 rail + 단일 컬럼으로 전환했다.
- 사용자 편의성: 저장 가능 상태, JSON 오류, 검증 이슈, 히스토리 반영 범위를 항상 확인할 수 있게 했다.

## Git 기록 분석 요약

아래 항목은 `git log --reverse -- tools` 기준으로 확인한 기능 누적 순서다.

1. `013bd7b` 대사 에디터 시작
   - `tools/dialogue_editor.html` 추가.
   - 대사 JSON 로딩/저장, 기본 speaker/text/choices 흐름이 출발점.
   - React 반영: `dialogues` 타입, JSON 편집, 일반 대사 노드 추가/삭제.

2. `f4c2e07` 캐릭터 에디터 추가
   - `tools/character_editor.html` 추가.
   - 캐릭터 display name, portrait, 색상, 데이터 에셋 관리가 시작됨.
   - React 반영: `characters` 타입 폼, `display_name`, `name_color`, `portraits` 요약, 캐릭터 참조 검증.

3. `e6057b1` - `17967f4` 초상/타이포/반응형 대사 미리보기 확장
   - 캐릭터별 초상 선택, 확대/위치 편집, 게임 레이아웃에 맞춘 미리보기, 다크 스크롤바, 반응형 패널.
   - React 반영: 초상 경로 요약과 검증, 작업 패널 반응형 구조. 상세 이미지 편집 캔버스는 후속 이관 대상.

4. `127f35a` - `c5d966d` 타이프라이터, spectrum, `stage_cast`
   - 다중 캐릭터 등장/퇴장, stage_cast 상속, portrait offset, 무대 검증이 추가됨.
   - React 반영: 노드 편집 패널에 `stage_cast` 키 요약, 검증 로직에 존재하지 않는 캐릭터/음수 `portrait_zoom` 탐지.

5. `47bd1fd` - `960e687` 대사 표시 규칙 보강
   - 파이프 딜레이, 음파 동기화, 나레이션 스타일, opacity 해석 수정.
   - React 반영: BBCode/이벤트 태그 삽입 팔레트와 텍스트 기반 검증. 렌더 미리보기 애니메이션은 후속 대상.

6. `76f9ab7` 아이템 에디터 추가
   - `tools/item_editor.html` 추가.
   - 아이템 JSON, 이미지, 챕터 스코프 관리.
   - React 반영: `items` 타입 폼, `chapters` 체크리스트, 이미지 `res://` 경로 검증.

7. `f4e8fe9` - `23dc236` 진술 모드
   - 거짓 구절, statement node, reaction group, acquire_info, popups, character_exit, 반응별 중첩 nodes가 누적됨.
   - React 반영: `statement_nodes` 개수 요약, 기본 진술 노드 생성, `[lie]` 태그 삽입, `acquire_info`/`popups`/중첩 nodes 검증.

8. `078dd58` - `8d9f173` 대사 선택 UI와 챕터 에디터
   - 대사 label/description, 챕터 JSON, 그래프 layout, start dialogue 관리.
   - React 반영: `dialogues.label`, `dialogues.description`, `chapters` 타입 폼, `start_dialogue`, `dialogues` 체크리스트 검증.

9. `38d2707` - `3dd1567` MUI 아이콘과 저장 완료 토스트
   - 로컬 `assets/icon/mui/*.svg`를 툴 UI에 적용하고 저장 완료 토스트 추가.
   - React 반영: `/repo/assets/icon/mui` 정적 라우트 유지, 모든 주요 액션 버튼에 아이콘 적용, toast 상태 유지.

10. `d005438` - `88eadfd` 음성 기능 추가 후 제거
    - CosyVoice/TTS 프록시, voice metadata, 음성 미리듣기가 추가됐다가 `88eadfd`에서 제거됨.
    - React 반영: 음성 생성/재생 UI는 추가하지 않음. `metadata.voice_profile`은 데이터 흔적 확인용 필드만 남김.

11. `69d4fcb` - `9c40b73` 챕터 패럴랙스와 썸네일
    - 챕터 에디터에 패럴랙스 레이어, 썸네일, 타이틀 이미지, anchor, floating, motion_strength가 추가됨.
    - React 반영: 챕터 preview에서 `parallax.layers` 개수를 요약. 상세 캔버스/드래그 편집은 후속 이관 대상.

12. `ab8ec8d` UUID 전환
    - 게임 데이터 ID가 UUID 기반으로 전환됨.
    - React 반영: 새 리소스 생성 시 `crypto.randomUUID()` 사용.

13. `ed2d8d0` - `9e7a661` 스토리 에셋과 이벤트 태그
    - `tools/asset_editor.html` 추가. BGM/SFX/background, volume, loop, bgm_stop, bgm_volume, bg_clear, blur/brightness/saturate/dim 이벤트가 추가됨.
    - React 반영: `story_assets` 타입 폼, kind/path/volume 검증, 대사 텍스트에서 `[bgm]`, `[sfx]`, `[se]`, `[bg]` ID 참조 검증, 태그 삽입 팔레트.

14. `7b6a2f6` Godot 미리보기 브리지
    - `tools/godot_preview_bridge.py`와 실행 배치가 추가됨.
    - React 반영: 이번 단계에서는 API/UI 구조만 준비. Godot preview 호출 버튼과 bridge API 연동은 후속 대상.

15. `b9ee700` 챕터 스코프 필드
    - 에셋/아이템/대사에 `chapters` 스코프와 챕터 필터 UI가 추가됨.
    - React 반영: 대사/아이템/스토리 에셋에 `chapters` 체크리스트와 존재 검증 반영.

16. `b3a8095` - `9757b21` mystery speaker, fixed background, font_scale 확장
    - `speaker_mystery`, stage_cast mystery, background fixed, font_scale from/to가 추가됨.
    - React 반영: 노드 편집에 `speaker_mystery`, `[font_scale from=... to=...]` 삽입, story asset `fixed` 검증 대상 유지.

17. `4e51baa` - `24192fe` blackout/cutscene
    - blackout 노드가 `cutscene` 노드로 확장되고 이미지 연출이 추가됨.
    - React 반영: 일반 노드와 별도로 `cutscene` 모드 추가, `fade_in`, `hold`, `fade_out`, `image` 편집.

18. `ec98348` 최종 텍스트 효과 보강
    - font_scale from/to와 선택지 label BBCode가 확장됨.
    - React 반영: 빠른 태그 삽입 팔레트에 `font_scale`, `color`, `speed`, `lie` 포함.

## 현재 마이그레이션 결과

완료:

- `tools/editor`를 Vite React + TypeScript 구조로 전환.
- Node API는 유지하고 `DELETE /api/resources/:type/:id` 추가.
- Node 서버가 `--dev` 모드에서 Vite middleware를 같은 포트로 붙이도록 변경.
- 다른 컴퓨터에서 IP로 접속할 수 있도록 기본 바인딩을 `0.0.0.0`으로 변경. 로컬 전용 실행은 `HOST=127.0.0.1 npm run dev`.
- `characters`, `items`, `chapters`, `dialogues`, `story_assets` 목록/로드/생성/저장/삭제 UI 반영.
- JSON 직접 편집과 타입별 폼 편집을 동기화.
- 대사 노드 추가/삭제, speaker/text/next/speaker_mystery/cutscene 편집, 빠른 태그 삽입 반영.
- 히스토리 기반 검증 패널 추가.

후속 이관 필요:

- 챕터 패럴랙스 레이어 드래그 캔버스와 썸네일 자동 저장.
- 캐릭터 초상 crop/center/zoom 직접 조작 UI.
- 아이템/에셋 파일 업로드와 `res://` 경로 자동 생성.
- 대사 statement reaction 상세 편집 UI.
- Godot 미리보기 브리지 호출 버튼과 preview node jump.
- BBCode 애니메이션 시각 미리보기.

## 검증 기록

- Node 서버 문법 검사: `node --check server/resource-store.mjs`, `node --check server/server.mjs`
- API 스모크 테스트 대상: `/api/health`, `/api/project/summary`
- 현재 환경 이슈: Codex 앱 내 PATH에 `npm`, `pnpm`, `yarn`, `corepack`이 없어 Vite 의존성 설치와 `npm run build`는 이 환경에서 실행하지 못했다. `package.json`에는 필요한 의존성과 스크립트를 기록했다.
