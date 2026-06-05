# Mobile Editor Backlog

작성일: 2026-06-05

이 문서는 React 에디터 마이그레이션 중 모바일/터치 환경에서 편집 편의성을 보장하기 위한 소급 작업 목록이다. 커밋별 분석과 기능 이관이 끝난 뒤 `COMMIT_MIGRATION_ISSUES.md`와 함께 처리한다.

## 목표

- 모바일 브라우저에서도 캐릭터, 챕터, 대사, 아이템, 스토리 에셋을 최소한의 왕복으로 편집할 수 있어야 한다.
- 작은 화면에서 목록, 편집 폼, JSON, 검증 패널이 서로 가리지 않아야 한다.
- 터치로 파일 업로드, 노드 선택, 태그 삽입, 저장/삭제가 안전하게 동작해야 한다.

## 소급 운영 방식

커밋별 기능 분석/이관을 진행할 때마다 레거시 기능의 데이터 동등성뿐 아니라 모바일 편집 영향도도 함께 확인한다. 즉시 처리하지 못하는 항목은 아래 MOB 이슈로 등록하고, `COMMIT_MIGRATION_ISSUES.md`의 기능 이슈가 정리된 뒤 같은 우선순위 방식으로 소급 처리한다.

확인 기준:

- 입력 방식: 마우스 전용 hover/drag가 터치에서도 동작하거나, 동일한 대체 조작이 있어야 한다.
- 화면 구조: 목록, 폼, preview, 검증 결과가 390px 폭에서 서로 밀거나 겹치지 않아야 한다.
- 정밀 편집: 좌표, scale, rotation, crop처럼 세밀한 값은 stepper/reset/drag 보조 UI를 제공해야 한다.
- 긴 데이터: UUID, `res://` 경로, nested node, stage_cast row가 overflow 없이 확인/수정 가능해야 한다.
- 위험 액션: 저장, 삭제, 되돌리기, 업로드는 현재 대상과 결과 경로를 모바일에서도 명확히 보여야 한다.

## 백로그

### MOB-001: 모바일 패널 전환 모드

- status: mitigated
- problem: 현재 좁은 화면에서는 navigation rail, collection, workspace가 세로로 쌓이지만, 긴 목록과 긴 폼을 오가면 스크롤 왕복이 길어진다.
- required: 모바일에서는 `목록 / 편집 / 검증` segmented view로 전환하고, 상단 sticky controls에서 즉시 이동할 수 있게 한다.
- action: `목록 / 편집 / 검증` 모바일 segmented switch를 추가하고 선택 패널만 표시하도록 했다.

### MOB-002: 하단 저장 액션 바

- status: mitigated
- problem: 저장/삭제/새로고침 버튼이 상단에 있어 긴 JSON이나 패럴랙스 레이어 편집 중 접근성이 떨어진다.
- required: 모바일 화면에서는 하단 sticky action bar에 `저장`, `되돌리기`, `검증`, `새 항목`을 배치한다.
- action: 모바일 하단 action bar에 `목록`, `검증`, `새 항목`, `저장`을 배치했다.

### MOB-003: 대사 노드 모바일 편집

- status: mitigated
- problem: 노드 목록과 노드 편집기가 한 화면에 세로로 길게 쌓이면 선택한 노드 맥락을 잃기 쉽다.
- required: 노드 목록 선택 시 편집 패널로 자동 이동하고, 이전/다음 노드 stepper를 제공한다.
- action: 노드 편집 툴바에 이전/다음 stepper를 추가했다. 리소스 선택 시 편집 패널로 이동한다.

### MOB-004: 태그 삽입 팔레트 터치 최적화

- status: mitigated
- problem: 긴 태그 버튼이 작은 화면에서 줄바꿈되며 텍스트 편집 영역을 밀어낸다.
- required: 태그 팔레트를 bottom sheet 또는 horizontally scrollable chip row로 전환한다.
- action: 모바일에서 태그 팔레트를 가로 스크롤 chip row로 전환했다. BBCode/effect/event 태그 버튼이 레거시 범위로 늘어나도 각 버튼은 고정 터치 폭을 유지하고, 노드 본문 아래 rich text preview가 별도 줄에서 wrap되도록 했다.

### MOB-005: JSON 편집 안전장치

- status: mitigated
- problem: 모바일 키보드에서 긴 JSON 편집은 실수 가능성이 크고 커서 이동이 어렵다.
- required: JSON 탭은 모바일에서 기본 접힘 상태로 두고, 오류 위치/라인 표시와 JSON format 버튼을 제공한다.
- action: JSON format 버튼과 JSON 오류 inline alert를 추가했다.
- remaining: 오류 line/column 하이라이트는 미구현.

### MOB-006: 검증 패널 접근성

- status: mitigated
- problem: 데스크톱 오른쪽 inspector가 모바일에서 숨겨져 이슈 확인이 늦어진다.
- required: 모바일에서는 검증 summary badge를 top bar에 표시하고, 검증 목록을 별도 탭/시트로 연다.
- action: 모바일 `검증` 패널 전환 버튼에 이슈 수를 표시하고 inspector를 모바일 패널로 열 수 있게 했다.

### MOB-007: 파일 업로드 후 경로 확인

- status: mitigated
- problem: 모바일 파일 picker는 파일명이 길거나 확장자 추론이 불안정할 수 있다.
- required: 업로드 완료 후 `res://` 경로를 복사/확인할 수 있는 inline confirmation row를 표시한다.
- action: 업로드 필드 아래에 마지막 `res://` 경로를 inline code row로 표시한다.

### MOB-008: 숫자 필드 터치 조작

- status: mitigated
- problem: center, scale, rotation, depth 같은 숫자 필드는 모바일에서 직접 입력이 불편하다.
- required: stepper, range slider, reset 버튼을 주요 숫자 필드에 추가한다.
- action: 캐릭터 초상 center/profile face center/profile zoom/profile offset, 챕터 parallax strength/layer position/anchor/order/scale/rotation/depth/perspective/opacity에 40px stepper와 reset 버튼을 추가했다. 좌표류는 이미지/stage 위 drag marker 또는 crop canvas drag와 숫자 stepper를 함께 제공한다.

### MOB-009: 패럴랙스 레이어 모바일 조작

- status: mitigated
- problem: 레이어 row가 길어 모바일에서 정보 스캔이 어렵다.
- required: 레이어별 accordion을 두고, 위치/앵커/스케일 등 세부 항목은 접힘 섹션으로 구성한다.
- action: 선택된 패럴랙스 레이어만 세부 폼이 열리는 accordion 구조를 추가했다. 시각 stage에서 레이어 마커/이미지를 터치하면 해당 레이어가 선택되고 세부 폼이 열린다. 선택 레이어의 position, anchor, scale, rotation은 터치 가능한 stage handle로 직접 조작할 수 있다. 레이어별 `thumbnail_excluded` 토글과 챕터 아트 스냅샷 복원/썸네일 생성 버튼도 같은 영역에 배치했다.

### MOB-010: 터치 타깃과 텍스트 overflow QA

- status: open
- problem: 에디터는 한국어/UUID/긴 경로가 많아 버튼과 chip overflow가 발생하기 쉽다.
- required: 주요 viewport 390x844, 430x932, 768x1024 기준으로 텍스트 겹침과 터치 타깃 40px 이상을 검증한다.
- action: BBCode rich text preview header는 모바일에서 세로 배치로 전환하고, event marker와 preview body는 `overflow-wrap`과 `max-width`를 적용했다.

### MOB-011: 시각 편집 핸들의 모바일 정밀 조작

- status: open
- problem: portrait marker와 parallax transform handle은 터치 입력을 받지만, 작은 stage에서는 손가락이 대상을 가려 세밀한 좌표/스케일/회전 조작이 어렵다.
- required: 선택 대상 전용 nudge toolbar를 추가해 X/Y 0.01 이동, scale 0.05 증감, rotation 1도/15도 증감, center/reset, 축 잠금 같은 대체 조작을 제공한다.
- action: profile crop canvas에는 zoom in/out/reset 버튼과 offset 숫자 stepper를 추가했다.
- remaining: portrait center/profile face center/parallax transform의 전용 nudge toolbar와 축 잠금은 미구현.

### MOB-012: 긴 중첩 폼의 모바일 탐색

- status: open
- problem: stage_cast, statement reaction nested nodes, parallax layer처럼 중첩 row가 많은 화면은 모바일에서 현재 편집 위치를 잃기 쉽다.
- required: 섹션별 sticky mini index 또는 접힘 상태 요약을 제공하고, 노드/레이어 선택 시 해당 accordion까지 자동 스크롤되게 한다.

### MOB-013: 모바일 업로드/저장 충돌 방지

- status: open
- problem: 모바일 네트워크나 파일 picker 지연 중 저장을 누르면 업로드 전 경로와 저장 데이터가 어긋날 수 있다.
- required: 업로드 진행 중 대상 필드와 저장 버튼 상태를 잠그고, 완료 후 변경된 `res://` 경로를 저장 전 변경사항으로 명확히 표시한다.
- action: 업로드 필드는 busy 상태에서 입력을 잠그고, 챕터 썸네일 수동 생성 버튼도 생성 중 중복 실행을 막는다.
- remaining: 전역 저장 버튼의 저장 중 잠금과 모든 업로드/저장 작업의 통합 pending 상태 표시는 미구현.

### MOB-014: BBCode rich text preview 모바일 편집성

- status: mitigated
- problem: BBCode 효과와 이벤트 marker가 본문 입력 아래에 추가되면 모바일에서 노드 편집 높이가 늘어나고 긴 `res://` 경로 marker가 overflow될 수 있다.
- required: preview는 입력을 가리지 않아야 하며, tag summary와 event marker는 좁은 폭에서 줄바꿈 또는 ellipsis로 처리되어야 한다.
- action: preview header를 모바일에서 세로 배치하고, preview body는 `white-space: pre-wrap`, `overflow-wrap: anywhere`를 적용했다. event marker는 inline-flex와 `max-width: 100%`를 사용하고 상세 값은 ellipsis 처리한다.
- remaining: 실제 390x844, 430x932, 768x1024 viewport 시각 QA는 MOB-010에서 계속 관리한다.
