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
    - React 반영: 빠른 태그 삽입 팔레트에 레거시 기본 BBCode 효과, `font_scale`, `speed`, 이벤트 태그를 포함. dialogue/statement/nested node 본문에는 rich text preview를 추가해 시각 효과와 이벤트 marker를 확인할 수 있게 했다.

## 현재 마이그레이션 결과

완료:

- `tools/editor`를 Vite React + TypeScript 구조로 전환.
- Node API는 유지하고 `DELETE /api/resources/:type/:id` 추가.
- Node 서버가 `--dev` 모드에서 Vite middleware를 같은 포트로 붙이도록 변경.
- 다른 컴퓨터에서 IP로 접속할 수 있도록 기본 바인딩을 `0.0.0.0`으로 변경. 로컬 전용 실행은 `HOST=127.0.0.1 npm run dev`.
- `characters`, `items`, `chapters`, `dialogues`, `story_assets` 목록/로드/생성/저장/삭제 UI 반영.
- JSON 직접 편집과 타입별 폼 편집을 동기화.
- 대사 노드 추가/삭제, speaker/text/next/speaker_mystery/cutscene 편집, 빠른 태그 삽입 반영.
- 대사/진술/nested 대사 본문의 BBCode rich text preview와 이벤트 marker 반영.
- 대사/진술/nested 대사 choices CRUD, label/text/next, set_flags, conditions, BBCode preview, 위치 preview 반영.
- 히스토리 기반 검증 패널 추가.
- 커밋별 분석 ledger와 이슈 관리 문서, 모바일 편집 백로그를 추가.

후속 이관 필요:

- 모바일 viewport QA와 정밀 조작 UX 백로그.

## 소급 적용 기록

### 2026-06-05: 시각 좌표 편집과 모바일 조작성 보강

- 캐릭터 portrait별 center/profile center를 이미지 위 마커로 직접 드래그해 `[x, y]` 좌표를 갱신하도록 추가했다.
- 챕터 parallax 레이어 stage를 추가하고 레이어 마커를 선택/드래그해 `position`을 편집하도록 추가했다.
- 챕터 parallax 레이어 row를 선택형 accordion으로 바꿔 모바일에서 한 레이어의 세부 필드만 열리게 했다.
- 주요 숫자 필드에 40px stepper와 reset 버튼을 추가해 모바일 키보드 의존도를 줄였다.
- `COMMIT_MIGRATION_ISSUES.md`의 CMI-002, CMI-005와 `MOBILE_EDITOR_BACKLOG.md`의 MOB-008, MOB-009 상태를 갱신했다.

### 2026-06-05: stage_cast 레거시 필드와 preview 보강

- `stage_cast` 편집을 레거시 canonical 필드 중심으로 확장했다. `portrait_position`, `portrait_position_order`, `portrait_offset`, `animation_order`, `animation_speed`, `portrait_opacity`, `portrait_flip_h`, `mystery`, `character_exit`를 폼에서 직접 수정한다.
- 기존 React 이관 중 생성될 수 있던 `position`, `order`, `opacity`, `flip_h`, `exit` alias는 읽기 호환되도록 유지하고, 새 변경은 canonical 필드로 저장한다.
- 현재 캐스트 캐릭터 JSON을 로드해 portrait key select, profile center/zoom이 반영된 thumbnail preview, stage preview를 표시한다.
- 이전 노드의 같은 cast entry를 찾아 상속 출처 badge를 표시하고, mystery cast는 thumbnail/stage preview 모두 silhouette로 렌더링한다.
- `COMMIT_MIGRATION_ISSUES.md`의 CMI-003을 `mitigated`로 갱신했다.

### 2026-06-05: statement reaction nested nodes 보강

- statement node 텍스트 편집 시 `[lie]...[/lie]`와 legacy `[문구]` 형태를 감지해 `statement_lies` phrase를 보존/동기화한다.
- reaction별 `kind`, `target_id`, `label`, `next`, `statement_end`를 폼에서 편집할 수 있게 했다.
- reaction 내부 nested dialogue/cutscene node의 생성/삭제/편집을 추가했다. nested dialogue node에서도 speaker, text, next, speaker_mystery, stage_cast, acquire_info, popups를 편집한다.
- 일반 dialogue node와 statement node에도 acquire_info/popups 폼 편집을 추가했다.
- reaction target 검증을 추가해 존재하지 않는 character/item 연결과 빈 target을 검증 패널에서 표시한다.
- `COMMIT_MIGRATION_ISSUES.md`의 CMI-004를 `mitigated`로 갱신했다.

### 2026-06-05: parallax visual transform handles 보강

- 챕터 parallax stage에 실제 레이어 이미지를 겹쳐 렌더링해 위치 판단을 숫자 폼에만 의존하지 않도록 했다.
- 선택 레이어에 position drag, anchor handle, scale handle, rotation handle을 추가했다.
- 레거시 편집기와 같이 layer position은 `-0.5..1.5` 범위를 허용한다.
- 선택 레이어 요약에 anchor/scale/rotation 값을 표시해 포인터 조작 결과를 즉시 확인할 수 있게 했다.
- `COMMIT_MIGRATION_ISSUES.md`의 CMI-005 action/remaining을 갱신했다.
- `MOBILE_EDITOR_BACKLOG.md`에 커밋별 모바일 영향도 확인 규칙과 시각 핸들 정밀 조작/긴 중첩 폼/업로드 저장 충돌 방지 소급 항목을 추가했다.

### 2026-06-05: parallax snapshot restore와 thumbnail auto-save 보강

- 챕터 아트 편집 영역에 `image/hasParallax/parallax` 스냅샷 복원 버튼을 추가했다. 복원 시 다른 챕터 필드는 유지하고 아트 설정만 열었을 때의 상태로 되돌린다.
- 저장 기준 JSON 스냅샷을 앱 상태에 보관해, 복원 결과가 저장본과 같으면 dirty 상태가 자동으로 해제되도록 했다.
- 레거시와 같은 1920x1080 canvas 썸네일 렌더링을 추가했다. depth/order 순서, background cover, anchor, scale_x/scale_y, rotation, opacity, visible, thumbnail_excluded를 반영한다.
- 챕터 저장 시 `assets/chapters/<chapter>/thumbnail.png`를 자동 생성/업로드하고, 수동 썸네일 생성 버튼도 같은 경로를 사용한다.
- parallax layer 폼에 `thumbnail_excluded` 토글을 추가하고 `COMMIT_MIGRATION_ISSUES.md`의 CMI-005를 `mitigated`로 갱신했다.

### 2026-06-05: character profile crop canvas 보강

- 캐릭터 초상 편집에 profile crop canvas를 추가했다. 런타임의 square cover crop과 동일하게 `profile.zoom`, `profile.offset`, `profile.center` override를 반영한다.
- crop canvas drag로 `profile.offset`을 편집하고, zoom in/out/reset 버튼과 offset 숫자 stepper를 추가했다.
- 기존 `Profile center`는 런타임 명칭에 맞춰 `Profile face center`로 정리하고, 기본 portrait center와 별도로 profile crop face center override를 조정할 수 있게 유지했다.
- stage_cast의 profile thumbnail preview도 CSS 근사 대신 동일한 crop canvas 계산을 사용하도록 교체했다.
- `COMMIT_MIGRATION_ISSUES.md`의 CMI-002를 `mitigated`로 갱신했다.

### 2026-06-05: Godot preview bridge 설정 UI 보강

- React 대사 노드 패널에 Godot preview 설정 섹션을 추가했다. bridge endpoint와 Godot executable path를 입력하고 localStorage에 유지한다.
- `godot_preview_endpoint` query parameter를 읽어 endpoint를 갱신하는 레거시 동작을 React 에디터에도 반영했다.
- `tools/godot_preview_bridge.py`에 `/config` endpoint를 추가해 UI에서 전달한 Godot 실행 경로를 bridge 런타임 설정으로 저장한다.
- bridge `health`, `config`, `preview` 응답에 configured Godot 경로와 resolved Godot 경로를 표시해 설정 오류를 즉시 확인할 수 있게 했다.
- `COMMIT_MIGRATION_ISSUES.md`의 CMI-007을 `mitigated`로 갱신했다.

### 2026-06-05: BBCode rich text preview 보강

- `d96602d`, `0ec9313`, `7681254`, `ec98348`의 BBCode/effect/event tag 변경을 다시 확인하고 React 노드 패널에 stack 기반 rich text parser를 추가했다.
- 일반 dialogue node, statement node, statement reaction nested node 본문 아래에 preview를 배치했다.
- `[b]`, `[i]`, `[u]`, `[s]`, `[color]`, `[bgcolor]`, `[outline_*]`, `[alpha]`, `[font_scale]`, `[font_scale from=... to=...]`, `[shake]`, `[wave]`, `[tornado]`, `[pulse]`, `[fade]`, `[rainbow]`, `[grow]`, `[blink]`, `[lie]`, `[speed]`를 React element로 렌더링한다.
- BGM/SFX/background/auto_next 계열 이벤트 태그는 본문 텍스트에서 제거하고 위치 확인용 marker로 표시한다.
- 빠른 태그 삽입 팔레트를 레거시 기본 효과와 이벤트 태그 범위로 확장했다.
- node 목록과 nested node summary는 BBCode/event tag를 제거한 보이는 문장 기준으로 표시한다.
- `COMMIT_MIGRATION_ISSUES.md`의 CMI-008을 `mitigated`로 갱신하고, 선택지 choices 편집/BBCode preview는 CMI-011로 분리했다.
- `MOBILE_EDITOR_BACKLOG.md`에 rich text preview의 모바일 줄바꿈/터치 팔레트 영향도를 갱신했다.

### 2026-06-05: choices editor와 선택지 BBCode preview 보강

- `013bd7b`, `078dd58`, `8d9f173`, `ec98348`의 choices 편집 흐름을 다시 확인하고 React 노드 패널에 choices editor를 추가했다.
- 일반 dialogue node, statement node, statement reaction nested node에서 선택지 추가/삭제, 위/아래 순서 변경, label/text/next 편집을 지원한다.
- `set_flags`는 객체 JSON, `conditions`는 배열 JSON으로 편집하며 invalid JSON은 inline 오류로 표시한다.
- choice label/text에 rich text preview를 붙여 선택지 BBCode 표시를 확인할 수 있게 했다.
- next select는 레거시 resolved ID 규칙과 맞춰 `node.id` 또는 자동 ID prefix(`@`, `@statement_`, `@reaction_..._`)를 후보로 표시한다.
- 선택지 위치 preview를 추가해 speaker/stage_cast 위치 기준으로 왼쪽/오른쪽/중앙 열 배치를 확인할 수 있게 했다.
- validation은 node.next와 choice.next의 resolved ID 존재 여부, choice set_flags/conditions 타입, choice label/text 태그를 검사하도록 보강했다.
- `COMMIT_MIGRATION_ISSUES.md`의 CMI-011을 `mitigated`로 갱신했다.
- `MOBILE_EDITOR_BACKLOG.md`에 choices accordion, 선택지 preview, JSON field의 모바일 대응 내용을 갱신했다.

### 2026-06-05: Godot asset import trigger 보강

- Godot 공식 import 흐름을 확인해 `.import` 파일만 임의 생성하지 않고 Godot editor import pipeline을 실행하는 방식으로 처리했다.
- `tools/godot_preview_bridge.py`에 `/import` endpoint를 추가했다. bridge는 요청된 `res://` 경로가 프로젝트 안에 존재하는지 확인한 뒤 `godot --headless --path <project> --import`를 실행한다.
- React 에디터의 일반 파일 업로드는 업로드 완료 후 `/import`를 호출하고, 성공하면 `Godot import 완료`, 실패하면 `Godot import 대기: ...`를 toast에 표시한다.
- 챕터 썸네일 수동 생성과 저장 시 자동 생성도 같은 import trigger를 사용하도록 `uploadChapterThumbnailForDraft`에 uploader 주입을 추가했다.
- `COMMIT_MIGRATION_ISSUES.md`의 CMI-009를 `mitigated`로 갱신했다.

## 검증 기록

- Node 서버 문법 검사: `node --check server/resource-store.mjs`, `node --check server/server.mjs`
- API 스모크 테스트 대상: `/api/health`, `/api/project/summary`
- 2026-06-05: `npm run check` 통과.
- 2026-06-05: `npm run build` 통과. Vite가 `/repo/assets/fonts/PretendardVariable.ttf`는 런타임 정적 경로로 해석한다고 경고했지만 번들은 생성됐다.
- 2026-06-05: profile crop canvas 보강 후 `npm run check`, `npm run build`, `git diff --check` 통과.
- 2026-06-05: `npm run check`, `npm run build`, `git diff --check` 통과.
- 2026-06-05: Godot bridge 설정 UI 보강 후 `npm run check`, `npm run build`, `python3 -m py_compile tools/godot_preview_bridge.py`, `git diff --check` 통과.
- 2026-06-05: BBCode rich text preview 보강 후 `npm run check`, `npm run build`, `git diff --check` 통과.
- 2026-06-05: choices editor 보강 후 `npm run check`, `npm run build`, `git diff --check` 통과.
- 2026-06-05: Godot asset import trigger 보강 후 `npm run check`, `npm run build`, `python3 -m py_compile tools/godot_preview_bridge.py`, `git diff --check` 통과.
