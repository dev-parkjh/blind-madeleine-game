# Mobile Editor Backlog

작성일: 2026-06-05

이 문서는 React 에디터 마이그레이션 중 모바일/터치 환경에서 편집 편의성을 보장하기 위한 소급 작업 목록이다. 커밋별 분석과 기능 이관이 끝난 뒤 `COMMIT_MIGRATION_ISSUES.md`와 함께 처리한다.

## 목표

- 모바일 브라우저에서도 캐릭터, 챕터, 대사, 아이템, 스토리 에셋을 최소한의 왕복으로 편집할 수 있어야 한다.
- 작은 화면에서 목록, 편집 폼, JSON, 검증 패널이 서로 가리지 않아야 한다.
- 터치로 파일 업로드, 노드 선택, 태그 삽입, 저장/삭제가 안전하게 동작해야 한다.

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
- action: 모바일에서 태그 팔레트를 가로 스크롤 chip row로 전환했다.

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

- status: open
- problem: center, scale, rotation, depth 같은 숫자 필드는 모바일에서 직접 입력이 불편하다.
- required: stepper, range slider, reset 버튼을 주요 숫자 필드에 추가한다.

### MOB-009: 패럴랙스 레이어 모바일 조작

- status: open
- problem: 레이어 row가 길어 모바일에서 정보 스캔이 어렵다.
- required: 레이어별 accordion을 두고, 위치/앵커/스케일 등 세부 항목은 접힘 섹션으로 구성한다.

### MOB-010: 터치 타깃과 텍스트 overflow QA

- status: open
- problem: 에디터는 한국어/UUID/긴 경로가 많아 버튼과 chip overflow가 발생하기 쉽다.
- required: 주요 viewport 390x844, 430x932, 768x1024 기준으로 텍스트 겹침과 터치 타깃 40px 이상을 검증한다.
