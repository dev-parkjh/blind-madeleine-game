# Commit Migration Issue Register

작성일: 2026-06-05

이 문서는 커밋별 분석 중 최종 레거시 에디터와 비교해 문제가 될 수 있는 항목을 관리한다. 모든 커밋 분석/해체/적용이 완료된 뒤 `status: open` 항목을 우선순위대로 처리한다.

## 상태 규칙

- `open`: 기능 누락, 로직 오류, 충돌 가능성이 있어 처리 필요.
- `in_progress`: 현재 구현 중.
- `mitigated`: 현재 React/Node 에디터에서 기본 대응 완료. 레거시와 완전 동일하지 않을 수 있음.
- `closed`: 검증까지 완료.

## 이슈

### CMI-001: File System Access 기반 저장 흐름과 Node API 저장 흐름 충돌

- status: mitigated
- source commits: `013bd7b`, `f4c2e07`, `76f9ab7`, `8d9f173`, `ed2d8d0`
- legacy behavior: 브라우저 단일 HTML이 File System Access API 또는 HTTP directory fallback으로 JSON/바이너리를 읽고 저장했다.
- risk: React 에디터가 Node API를 쓰면서 기존 다운로드 fallback, 프로젝트 핸들 저장 IndexedDB 흐름이 사라진다.
- action: Node API로 JSON CRUD와 asset upload를 통합했다. 프로젝트 핸들 방식은 의도적으로 제거했으며, README에 Node 서버 실행을 전제로 기록했다. 모든 리소스 폼에 legacy 파일명/ID 편집에 해당하는 `ID / filename` 필드를 추가했고, 저장 API는 JSON `id`가 현재 파일명과 다르면 새 파일명으로 저장한 뒤 기존 파일을 삭제한다. 대상 파일이 이미 있으면 409로 저장을 거부하며, 저장 성공 후 클라이언트 선택 ID도 새 summary ID로 갱신한다.
- remaining: 파일명 변경 후 연결된 외부 참조 자동 갱신은 레거시도 제공하지 않으므로 검증 경고로 관리한다.

### CMI-002: 캐릭터 초상 중심/profile crop 캔버스 조작 누락

- status: mitigated
- source commits: `01171c3`, `f7f39b2`, `d464bac`, `88eadfd`
- legacy behavior: 초상 이미지 업로드 후 canvas에서 center/profile crop/zoom을 직접 조작했다.
- risk: 숫자 입력만 있으면 레거시보다 조작성은 낮고, profile 중심과 stage_cast preview가 어긋날 수 있다.
- action: portrait key/path upload, center, profile face center, profile zoom, profile offset 편집을 React 폼에 추가했다. 이미지 위에서 center/profile face center 마커를 터치/마우스로 드래그해 좌표를 갱신하는 직접 조작 UI를 추가했다. profile crop canvas는 런타임과 같은 square cover crop, zoom `1..6`, offset anchor 계산을 사용하며 드래그로 `profile.offset`을 갱신한다. `spectrum_offset`은 legacy 300x380 canvas, face anchor 0.5/0.34, 300% portrait zoom 기준으로 직접 드래그/nudge 편집할 수 있게 했다. character metadata 전체 JSON 편집과 저장 전 legacy export 정규화도 복구해 string portrait shorthand, `profile.center`, 기본 center/profile/spectrum 축약을 처리한다. string portrait shorthand는 폼/stage_cast preview에서도 경로로 안전하게 표시하고 편집 시 객체 portrait로 승격한다. stage_cast의 profile thumbnail preview도 같은 crop canvas 계산을 사용한다.
- remaining: 레거시 동등 기능은 기본 대응 완료. 모바일 정밀 nudge toolbar는 `MOBILE_EDITOR_BACKLOG.md`의 MOB-011로 계속 관리한다.

### CMI-003: 대사 `stage_cast` 상세 편집과 상속 검증 불완전

- status: mitigated
- source commits: `6477d25`, `c5d966d`, `3e72403`, `23dc236`, `ef0b51e`, `9757b21`
- legacy behavior: stage_cast 상속, position/order/flip/profile/portrait_zoom/mystery/fixed 연동을 UI에서 다뤘다.
- risk: 현재 React 에디터는 stage_cast 키 요약과 기본 검증만 제공해 상세 편집 누락이 크다.
- action: stage_cast 상세 row editor를 추가했다. 캐릭터 추가/삭제, portrait, portrait_position/custom offset/position_order, animation_order/speed, portrait_opacity, portrait_zoom, flip, mystery, character_exit를 편집할 수 있다. 이전 노드에서 상속되는 cast를 badge로 표시하고, 캐릭터 JSON을 로드해 profile thumbnail과 stage preview를 표시한다. speaker 변경이나 `speaker_mystery` 활성화 시 legacy처럼 speaker용 stage_cast 기본 엔트리를 자동 보강해 speaker anchor 기반 preview가 비어 버리지 않게 했다. mystery 항목은 silhouette filter로 미리보기된다. 검증 패널은 stage_cast 캐릭터 ID, portrait key, position 지원값, custom offset, position/animation order, animation_speed, portrait_opacity, portrait_zoom 범위를 검사한다.
- remaining: 저장 데이터 편집 기능은 기본 대응 완료. stage_cast/choice preview의 픽셀 단위 확인은 CMI-013에서 관리한다.

### CMI-004: statement reaction 상세 편집과 중첩 nodes 흐름 누락

- status: mitigated
- source commits: `f4e8fe9`, `75bcb77`, `7919da6`, `567302e`, `23dc236`, `d8d5fdf`
- legacy behavior: statement_lies, reactions, reaction별 nested nodes, notebook acquire_info가 UI에서 편집됐다.
- risk: 진술 흐름이 JSON 직접 편집에 의존하면 reaction chain 손상 가능성이 있다.
- action: statement_nodes 텍스트 편집, `[lie]...[/lie]`와 legacy `[문구]` phrase 동기화, reaction kind/target/label/next/statement_end 편집, reaction별 nested dialogue/cutscene node CRUD를 추가했다. 중첩 node에서도 speaker/text/next/speaker_mystery/stage_cast/acquire_info/popups를 편집할 수 있다. statement flow navigator를 추가해 진술 카드, reaction group, nested node를 한눈에 탐색하고 선택 항목 상세 폼으로 자동 스크롤한다. statement 순서 drag/drop 및 위/아래 이동, reaction 종료 토글, reaction child quick add도 지원한다. reaction target, nested choices/nodes 구조, acquire_info/acquired_info/acquire_on_complete/rewards 참조/중복 검증과 canonical `acquire_info` 편집도 추가했다. legacy `lies`/`mystery_speaker` alias는 읽기와 검증 대상으로 포함하고 편집 시 `statement_lies`/`speaker_mystery`로 정규화한다.
- remaining: 레거시 graph 세부 상호작용과 모바일 touch QA 대조가 남아 있다.

### CMI-005: 챕터 패럴랙스 드래그 캔버스와 썸네일 자동 저장 누락

- status: in_progress
- source commits: `69d4fcb`, `64c505f`, `076f60b`, `c575d35`, `e29af53`, `6f5e2ef`, `9c40b73`
- legacy behavior: 챕터 에디터가 레이어 위치/앵커/스케일/회전/깊이/썸네일을 시각적으로 편집했다.
- risk: 숫자 폼만 있으면 정확도는 있으나 레이아웃 판단이 어렵고 썸네일 자동 저장이 빠진다.
- action: parallax layer CRUD, position/anchor/order/scale/scale_x/scale_y/rotation/depth/perspective/motion_strength/opacity/visible/floating/thumbnail_excluded 편집과 layer/thumbnail upload를 추가했다. React stage에서 배경 레이어 중복 렌더링을 제거하고, 숨김 레이어를 미리보기에서 제외하며, 레거시와 같은 이미지 종횡비 기반 width/height 계산을 적용했다. 비선택 레이어는 stage에서 선택만 되고 이동 drag는 시작하지 않도록 제한했다. legacy alias(`type`, `image`, `texture`, `x/y`, `center/focus/pivot`, `scaleX/width_scale/height_scale`, `motionStrength/shake_strength/floating_strength`)는 stage/form/thumbnail/validation에서 읽고 편집 시 canonical 키로 갱신한다. anchor drag는 레거시처럼 anchor 변경과 position 보정을 함께 적용한다. `parallax.overlay`와 `parallax.title`은 전용 편집 폼과 stage 미리보기에 반영하며 title은 선택 후 stage에서 이동/scale 조작할 수 있다. 선택 layer/title nudge toolbar와 X/Y drag axis lock을 추가해 모바일에서도 위치/scale/rotation을 정밀 조정할 수 있다. layer scale drag와 uniform scale 입력은 `scale_x`/`scale_y`까지 함께 갱신한다. Ctrl+wheel zoom은 선택된 레이어/title에만 적용한다. 우클릭 drag preview offset과 depth/perspective 표시를 복구하고 pointer up 시 원점으로 되돌린다. 챕터 아트 `image/parallax` 스냅샷 복원과 1920x1080 canvas 기반 `assets/chapters/<chapter>/thumbnail.png` 수동 생성/저장 시 자동 생성을 추가했다. 검증 패널은 chapter thumbnail, parallax overlay/title/layer path 확장자, 활성 layer path 누락, position/anchor/scale/depth/perspective/motion_strength/opacity 수치 범위를 검사한다.
- remaining: 실제 viewport별 시각 QA가 남아 있다. 썸네일 렌더와 React stage 계산식이 계속 같은 결과를 내는지 반복 확인해야 한다.

### CMI-006: 스토리 에셋 업로드와 BGM/SFX/background kind 정규화 충돌

- status: mitigated
- source commits: `ed2d8d0`, `ef5fa3a`, `9e7a661`, `4e51baa`
- legacy behavior: kind alias를 정규화하고 BGM/SFX/background 경로, loop, volume, fixed를 관리했다.
- risk: 잘못된 폴더에 업로드하거나 kind alias를 놓치면 Godot loader와 충돌한다.
- action: `story_assets` 폼에 kind/path/upload/volume/fixed/metadata와 image/audio preview를 추가하고 업로드 경로를 kind별 폴더로 생성한다. kind alias는 legacy처럼 `bgm`/`sfx`/`background`로 정규화하며, 저장 시 background는 `fixed`, audio asset은 `volume`만 남기도록 legacy export 정책에 맞춘다. dialogue/item/story asset chapter scope alias(`chapters`, `chapter_ids`, `metadata.chapters`, `metadata.chapter_ids`)는 폼/검증/저장 전 정규화에서 모두 읽고 canonical `chapters`로 반영한다. Media preview는 load/error 상태를 표시하고, 검증 패널은 kind별 이미지/오디오 확장자 범위와 story asset chapter scope를 검사한다.

### CMI-007: Godot preview bridge 연동 누락

- status: mitigated
- source commit: `7b6a2f6`
- legacy behavior: `tools/godot_preview_bridge.py`의 `/preview`로 현재 dialogue JSON을 보내 Godot를 실행했다.
- risk: React 에디터에서 preview 호출이 없으면 런타임 확인 왕복이 늦어진다.
- action: 대사 노드 탭에 Godot preview 버튼과 bridge health 확인 버튼/상태 표시를 추가했다. bridge endpoint는 query/localStorage/UI 설정을 지원하며 기본값은 `http://127.0.0.1:51234`다. `tools/godot_preview_bridge.py`에 `/config` endpoint를 추가해 React UI에서 Godot 실행 파일 경로를 전달하고 health/preview가 그 경로를 사용하게 했다.
- remaining: 레거시 동등 기능은 기본 대응 완료. bridge 프로세스 자체를 에디터 Node 서버에서 자동 시작하는 기능은 보안/프로세스 관리 이슈로 별도 범위에 둔다.

### CMI-008: BBCode/이벤트 태그 시각 미리보기 누락

- status: mitigated
- source commits: `d96602d`, `0ec9313`, `7681254`, `ec98348`
- legacy behavior: 우클릭 메뉴에서 BBCode 효과 태그 삽입과 일부 애니메이션 preview를 제공했다.
- risk: 태그 문법은 삽입 가능하지만 렌더링 효과 확인이 어렵다.
- action: 대사 텍스트의 주요 BBCode/이벤트 태그를 감지해 preview chip으로 표시한다. 추가로 React rich text preview parser를 구현해 일반 dialogue node, statement node, statement reaction nested node 본문에서 `[b]`, `[i]`, `[u]`, `[s]`, `[color]`, `[bgcolor]`, `[outline_*]`, `[alpha]`, `[font_scale]`, `[font_scale from=... to=...]`, `[shake]`, `[wave]`, `[tornado]`, `[pulse]`, `[fade]`, `[rainbow]`, `[grow]`, `[blink]`, `[lie]`, `[speed]`를 시각화한다. BGM/SFX/background/auto_next 계열 이벤트 태그는 런타임처럼 본문 텍스트에서는 제거하되 위치 확인용 marker로 표시한다. 빠른 태그 삽입 팔레트도 레거시 기본 효과와 이벤트 태그 범위로 확장했다.
- remaining: Godot RichTextLabel과 픽셀 단위로 완전 동일한 렌더링은 Godot preview bridge로 확인한다.

### CMI-009: asset upload가 Godot `.import` 파일을 생성하지 않음

- status: mitigated
- source commits: 에셋 추가가 포함된 다수 커밋
- legacy behavior: 실제 repo에는 Godot import 산출물 `.import`가 함께 존재한다.
- risk: 새 파일 업로드 후 Godot가 import를 다시 생성하기 전까지 export/runtime에서 누락될 수 있다.
- action: 파일 업로드 완료 toast에 Godot 재import 필요 안내를 추가했다. 추가로 `tools/godot_preview_bridge.py`에 `/import` endpoint를 추가해 Godot의 `--headless --import` 명령을 실행하도록 했다. React 에디터의 일반 파일 업로드와 챕터 썸네일 자동/수동 생성은 업로드 후 bridge import trigger를 호출하고, 성공/대기 상태를 toast에 표시한다.
- remaining: bridge가 실행 중이고 Godot editor binary가 설정되어 있어야 즉시 import된다. bridge가 없거나 Godot 경로가 없으면 업로드는 유지되고 import 대기 상태로 표시된다.

### CMI-010: LAN 바인딩으로 인한 저장 API 노출

- status: mitigated
- source commit: `57794cc` 이후 LAN 설정
- legacy behavior: 단일 HTML 또는 localhost 서버가 주로 로컬에서 사용됐다.
- risk: `0.0.0.0` 바인딩은 같은 네트워크에서 JSON 저장/삭제 API를 열어 둔다.
- action: README에 신뢰 네트워크에서만 실행하라고 기록했다. `HOST=127.0.0.1 npm run dev`로 로컬 전용 실행 가능.
- remaining: 인증/토큰 보호는 미구현.

### CMI-011: 대사 choices 전용 편집 UI와 선택지 BBCode preview 누락

- status: mitigated
- source commits: `013bd7b`, `078dd58`, `8d9f173`, `ec98348`
- legacy behavior: 대사 노드의 choices, choice label/text, next 연결, 선택지 배치 preview를 전용 UI에서 편집했고 `ec98348` 이후 선택지 label/text도 BBCode를 지원했다.
- risk: React 에디터에서 choices가 JSON 직접 편집에 의존하면 선택지 분기와 label BBCode를 누락하거나 next 연결을 깨뜨릴 수 있다.
- action: dialogue node, statement node, reaction nested node에 choices editor를 추가했다. 선택지 추가/삭제, drag/drop 순서 변경, 위/아래 버튼 순서 변경, label/text/next 편집, `set_flags` 객체 JSON, `conditions` 배열 JSON 편집을 지원한다. label/text에는 CMI-008의 rich text preview를 붙여 선택지 BBCode를 즉시 확인할 수 있게 했다. 대사 전역 `start`, `metadata.presentation_mode`, `metadata.next_dialogue`, `metadata.statement_notebook`, metadata JSON 편집을 복구했고 저장 시 기본 start와 빈 metadata는 레거시 export처럼 생략한다. 일반 대사 노드의 text sound muted alias(`text_sound_muted`, `typewriter_sound_muted`, `dialogue_text_sound_muted`)는 읽기/검증하고 편집 시 canonical `metadata.text_sound_muted`로 저장한다. next select는 레거시처럼 `node.id` 또는 자동 resolved ID(`@0`, `@statement_0`, `@reaction_..._0`)를 후보로 표시한다. 선택지 위치 preview는 speaker/stage_cast 기준으로 왼쪽/오른쪽/중앙 열을 시각화한다. 검증 로직은 dialogue start, 문자열형 statement_nodes 링크, statement notebook 참조, node.next와 choice.next가 현재 노드 목록의 resolved ID에 있는지 검사하고, choice/choice.nodes 배열 구조, choice 객체 여부, `set_flags` 객체, `conditions` 배열, label/text 태그도 확인한다.
- remaining: 저장 데이터 편집 기능은 React 폼에서 기본 대응 완료. 레거시 canvas preview와 완전히 같은 speaker scale/portrait edge 계산은 CMI-013의 픽셀 QA에서 확인한다.

### CMI-012: 챕터 그래프 캔버스와 dialogue edge 편집 누락

- status: in_progress
- source commits: `078dd58`, `8d9f173`, `b9ee700`, `4e51baa`
- legacy behavior: 챕터 에디터는 대화 파일을 챕터 캔버스에 배치하고 `layout.positions`를 드래그로 저장했다. 노드 간 연결은 dialogue `metadata.next_dialogue`에 저장하며, 연결선 선택/삭제와 `metadata.next_dialogue_blackout`, fade/hold duration도 edge detail에서 편집했다.
- risk: React 챕터 폼은 `dialogues` 체크리스트와 `start_dialogue` 선택만 제공하므로 그래프 위치, 연결, blackout edge metadata를 JSON 직접 편집이나 대사 에디터 왕복에 의존한다. 챕터 흐름 손상 가능성이 크다.
- action: React 챕터 폼에 `ChapterGraphEditor`를 추가했다. 챕터에 포함된 dialogue를 캔버스 카드로 렌더링하고 드래그로 `layout.positions`를 draft에 저장한다. 미배치 dialogue 추가, 자동 배치, 캔버스 제거, 연결 source/target 선택, 포트 기반 연결 시작/대상 선택, 연결 preview path, `metadata.next_dialogue` 즉시 저장, edge 선택/삭제, edge midpoint 퀵 메뉴, `metadata.next_dialogue_blackout`, fade/hold duration 편집, incoming edge 목록, zoom/scroll pan을 지원한다. 연결 해제 또는 blackout 비활성화 시 stale fade/hold duration을 제거한다. 챕터 `metadata` JSON 편집을 복구하고 legacy alias(`dialogue_ids`, `dialogue_id`/`first_dialogue`, `bgm_id`/`chapter_bgm`/`chapter_select_bgm`)를 폼/그래프/저장 전 정규화/검증/요약에서 canonical 필드와 동일하게 읽도록 했다. 검증 패널은 start dialogue membership, layout position, stale position, dialogue `metadata.next_dialogue`, blackout duration을 검사한다.
- remaining: 모바일 canvas QA와 레거시 graph 세부 상호작용 대조가 남아 있다.

### CMI-013: stage_cast와 choice layout preview 계산식 동등성 불완전

- status: in_progress
- source commits: `1ab5f24`, `6477d25`, `c5d966d`, `17967f4`, `ec98348`
- legacy behavior: 대사 에디터는 canvas에서 1920x1080 런타임 좌표계, portrait face anchor, zoom/body blend, custom offset drag, speaker side에 따른 choice slot 계산을 사용했다.
- risk: React preview가 단순 DOM 배치에 머물면 실제 게임 위치와 다르게 보여 stage_cast/choice 배치를 잘못 판단할 수 있다.
- action: choice layout preview는 레거시 canvas의 1920x777 stage 좌표계, dialogue range, speaker anchor, zoom scale, button width/height, gap, side capacity 계산식을 React DOM slot 배치에 적용했다. stage_cast scene preview는 이미지 natural size, portrait face center, zoom/body anchor blend, position stack spread를 사용해 `PortraitLayout.compute_display_rect_with_zoom`과 같은 기준으로 인물을 배치한다. custom position 인물은 preview에서 직접 드래그하거나 nudge toolbar로 `portrait_offset`을 갱신할 수 있다. 런타임이 지원하지 않는 `far_left`/`far_right` 선택지는 React 폼에서 제거했다. popup preview는 1920x1080 stage 좌표계, position preset, offset, size/width/height, scale, opacity, image fit/cover/zoom, character profile crop fallback을 사용하며 frame drag 시 레거시처럼 `position: custom`과 offset을 갱신한다. cutscene/blackout node는 런타임 alias를 읽고 canonical `cutscene` 객체로 편집하며, cutscene image/popup image 경로와 duration도 검증한다. popup은 레거시 source별 저장 조건에 맞춰 character/item/image target, item image 존재, character portrait key, source/position/transition/image_mode 지원값, offset/size/scale/opacity/image_zoom 범위까지 검사한다.
- remaining: Godot/legacy canvas 픽셀 QA가 남아 있다.
