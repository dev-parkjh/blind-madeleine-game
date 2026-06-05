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
- action: Node API로 JSON CRUD와 asset upload를 통합했다. 프로젝트 핸들 방식은 의도적으로 제거했으며, README에 Node 서버 실행을 전제로 기록했다.

### CMI-002: 캐릭터 초상 중심/profile crop 캔버스 조작 누락

- status: open
- source commits: `01171c3`, `f7f39b2`, `d464bac`, `88eadfd`
- legacy behavior: 초상 이미지 업로드 후 canvas에서 center/profile crop/zoom을 직접 조작했다.
- risk: 숫자 입력만 있으면 레거시보다 조작성은 낮고, profile 중심과 stage_cast preview가 어긋날 수 있다.
- action: portrait key/path upload, center, profile center, profile zoom 편집을 React 폼에 추가했다. 이미지 위에서 center/profile center 마커를 터치/마우스로 드래그해 좌표를 갱신하는 직접 조작 UI를 추가했다.
- remaining: profile zoom이 적용된 crop frame preview는 아직 미구현이므로 레거시 동등성 기준에서는 open.

### CMI-003: 대사 `stage_cast` 상세 편집과 상속 검증 불완전

- status: mitigated
- source commits: `6477d25`, `c5d966d`, `3e72403`, `23dc236`, `ef0b51e`, `9757b21`
- legacy behavior: stage_cast 상속, position/order/flip/profile/portrait_zoom/mystery/fixed 연동을 UI에서 다뤘다.
- risk: 현재 React 에디터는 stage_cast 키 요약과 기본 검증만 제공해 상세 편집 누락이 크다.
- action: stage_cast 상세 row editor를 추가했다. 캐릭터 추가/삭제, portrait, portrait_position/custom offset/position_order, animation_order/speed, portrait_opacity, portrait_zoom, flip, mystery, character_exit를 편집할 수 있다. 이전 노드에서 상속되는 cast를 badge로 표시하고, 캐릭터 JSON을 로드해 profile thumbnail과 stage preview를 표시한다. mystery 항목은 silhouette filter로 미리보기된다.
- remaining: 레거시의 canvas 기반 face-anchor drag와 동일한 정밀 조작은 CMI-002의 crop/frame 작업에 남겨둔다.

### CMI-004: statement reaction 상세 편집과 중첩 nodes 흐름 누락

- status: mitigated
- source commits: `f4e8fe9`, `75bcb77`, `7919da6`, `567302e`, `23dc236`, `d8d5fdf`
- legacy behavior: statement_lies, reactions, reaction별 nested nodes, notebook acquire_info가 UI에서 편집됐다.
- risk: 진술 흐름이 JSON 직접 편집에 의존하면 reaction chain 손상 가능성이 있다.
- action: statement_nodes 텍스트 편집, `[lie]...[/lie]`와 legacy `[문구]` phrase 동기화, reaction kind/target/label/next/statement_end 편집, reaction별 nested dialogue/cutscene node CRUD를 추가했다. 중첩 node에서도 speaker/text/next/speaker_mystery/stage_cast/acquire_info/popups를 편집할 수 있다. reaction target 검증도 추가했다.
- remaining: 레거시의 statement graph canvas와 reaction path 선택 시 자동 스크롤 같은 고급 탐색 UX는 동일하지 않지만, 저장 데이터 편집 기능은 React 폼에서 기본 대응 완료.

### CMI-005: 챕터 패럴랙스 드래그 캔버스와 썸네일 자동 저장 누락

- status: mitigated
- source commits: `69d4fcb`, `64c505f`, `076f60b`, `c575d35`, `e29af53`, `6f5e2ef`, `9c40b73`
- legacy behavior: 챕터 에디터가 레이어 위치/앵커/스케일/회전/깊이/썸네일을 시각적으로 편집했다.
- risk: 숫자 폼만 있으면 정확도는 있으나 레이아웃 판단이 어렵고 썸네일 자동 저장이 빠진다.
- action: parallax layer CRUD, position/anchor/order/scale/rotation/depth/perspective/opacity/visible/floating/thumbnail_excluded 편집과 layer/thumbnail upload를 추가했다. 레이어 위치를 배경 stage 위 마커로 선택/드래그할 수 있게 했고 선택 레이어 accordion을 추가했다. stage 위에 실제 레이어 이미지를 겹쳐 렌더링하고 선택 레이어의 position, anchor, scale, rotation을 포인터 핸들로 직접 조작할 수 있게 했다. 챕터 아트 `image/hasParallax/parallax` 스냅샷 복원과 1920x1080 canvas 기반 `assets/chapters/<chapter>/thumbnail.png` 수동 생성/저장 시 자동 생성을 추가했다.
- remaining: 레거시 동등 기능은 기본 대응 완료. 실제 canvas 결과의 시각 QA는 요청 시 브라우저에서 확인한다.

### CMI-006: 스토리 에셋 업로드와 BGM/SFX/background kind 정규화 충돌

- status: mitigated
- source commits: `ed2d8d0`, `ef5fa3a`, `9e7a661`, `4e51baa`
- legacy behavior: kind alias를 정규화하고 BGM/SFX/background 경로, loop, volume, fixed를 관리했다.
- risk: 잘못된 폴더에 업로드하거나 kind alias를 놓치면 Godot loader와 충돌한다.
- action: `story_assets` 폼에 kind/path/upload/volume/loop/fixed를 추가하고 업로드 경로를 kind별 폴더로 생성한다.

### CMI-007: Godot preview bridge 연동 누락

- status: open
- source commit: `7b6a2f6`
- legacy behavior: `tools/godot_preview_bridge.py`의 `/preview`로 현재 dialogue JSON을 보내 Godot를 실행했다.
- risk: React 에디터에서 preview 호출이 없으면 런타임 확인 왕복이 늦어진다.
- action: 대사 노드 탭에 Godot preview 버튼과 bridge health 확인 버튼/상태 표시를 추가했다. bridge 기본 포트 `51234`로 POST한다.
- remaining: Godot 경로 설정 UI는 미구현이므로 레거시 동등성 기준에서는 open.

### CMI-008: BBCode/이벤트 태그 시각 미리보기 누락

- status: open
- source commits: `d96602d`, `0ec9313`, `7681254`, `ec98348`
- legacy behavior: 우클릭 메뉴에서 BBCode 효과 태그 삽입과 일부 애니메이션 preview를 제공했다.
- risk: 태그 문법은 삽입 가능하지만 렌더링 효과 확인이 어렵다.
- action: 대사 텍스트의 주요 BBCode/이벤트 태그를 감지해 preview chip으로 표시한다. shake/wave/lie/alpha/font/color/event 태그 상태를 빠르게 확인할 수 있다.
- remaining: 레거시처럼 실제 RichTextLabel 렌더링과 동일한 BBCode 렌더 preview는 미구현이므로 레거시 동등성 기준에서는 open.

### CMI-009: asset upload가 Godot `.import` 파일을 생성하지 않음

- status: open
- source commits: 에셋 추가가 포함된 다수 커밋
- legacy behavior: 실제 repo에는 Godot import 산출물 `.import`가 함께 존재한다.
- risk: 새 파일 업로드 후 Godot가 import를 다시 생성하기 전까지 export/runtime에서 누락될 수 있다.
- action: 파일 업로드 완료 toast에 Godot 재import 필요 안내를 추가했다.
- remaining: Godot import trigger 또는 `.import` 자동 생성은 미구현이므로 레거시 동등성 기준에서는 open.

### CMI-010: LAN 바인딩으로 인한 저장 API 노출

- status: mitigated
- source commit: `57794cc` 이후 LAN 설정
- legacy behavior: 단일 HTML 또는 localhost 서버가 주로 로컬에서 사용됐다.
- risk: `0.0.0.0` 바인딩은 같은 네트워크에서 JSON 저장/삭제 API를 열어 둔다.
- action: README에 신뢰 네트워크에서만 실행하라고 기록했다. `HOST=127.0.0.1 npm run dev`로 로컬 전용 실행 가능.
- remaining: 인증/토큰 보호는 미구현.
