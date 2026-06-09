# Blind Madeleine UI Prompts

이 폴더는 현재 Godot 프로젝트의 UI 구조를 기준으로 추출한 이미지 생성용 프롬프트 모음입니다.

## 사용 방법

1. `00_common_art_direction.md`의 공통 프롬프트를 먼저 복사합니다.
2. 만들고 싶은 UI 파일의 `개별 프롬프트`를 이어 붙입니다.
3. 텍스트가 필요한 UI는 이미지 생성물에 글자를 직접 넣지 말고, Godot의 Label/RichTextLabel/Button 텍스트로 얹는 것을 권장합니다.
4. 버튼/패널류는 가능하면 투명 배경 PNG 또는 9-slice용 중앙 여백이 있는 에셋으로 받습니다.

## 추출 기준

주요 UI는 다음 파일을 기준으로 정리했습니다.

- `scenes/screens/*.tscn`
- `scripts/screens/main_title_screen.gd`
- `scripts/screens/chapter_select_screen.gd`
- `scripts/screens/story_dialogue_screen.gd`
- `scripts/screens/backlog_screen.gd`
- `scripts/screens/branch_tree_screen.gd`
- `scripts/screens/options_screen.gd`
- `scripts/main/main.gd`
- `scripts/ui/rewind_transition_overlay.gd`
- `docs/scene-structure.md`
- `docs/controls-and-deployment.md`

## UI 목록

플레이어에게 직접 노출되는 UI:

- 메인 타이틀: 게임 제목, 새 게임/불러오기/엑스트라 패널, 메뉴 버튼, 라이선스/크레딧 상세 모달
- 챕터 선택: 풀블리드 챕터 아트 위 타이틀 카피, 시작/뒤로 버튼, 좌우 이동 버튼, 챕터 인디케이터, 키보드/게임패드 힌트
- 대사 화면: 하단 대사창, 화자명 라벨, 본문 영역, 진행 힌트, 음파 연출, 상단 HUD 메뉴
- 선택지: 대화/자료/지도/이동 선택 버튼, 라벨 노치, 들은 항목 체크 표시
- 진술/제시 모드: 문장 하이라이트, 좌우 이동 버튼, 제시/선택 입력 힌트, 루프 확인 모달, 진술 타이틀 오버레이
- 수사노트: 인물목록/자료목록 패널, 좌측 레일, 항목 카드, 썸네일, 태그, 닫기 버튼
- 조사 지도: 지도 보드, 위치 핀, 현재 위치 표시, 지도 닫기 버튼
- 대화 로그: 로그 패널, 로그 엔트리 카드, 선택 힌트, 선택 대화로 돌아가기 확인 모달, 되감기 전환
- 분기 트리: 챕터 캔버스, 격자, 노드 카드, 연결선, 우측 인스펙터, 이동 확인 모달, 전환 오버레이
- 옵션: 볼륨/대사/화면 섹션 패널, 슬라이더, 토글, 미리보기 패널, 저장 토스트
- 공통 오버레이: 스토리 메뉴 모달, 모바일 가로 화면 안내, 입력 모드 토스트, 블랙아웃/글리치 전환

개발/디버그 성격이라 우선순위에서 낮게 둔 UI:

- `debug_dialogue_screen`

## 파일 구성

- `00_common_art_direction.md`: 모든 이미지 생성에 붙이는 공통 스타일 기준
- `01_main_title.md`: 메인 타이틀 화면
- `02_chapter_select.md`: 챕터 선택 화면
- `03_story_dialogue_panel.md`: 대사창과 음파
- `04_choice_buttons.md`: 선택지 버튼 세트
- `05_top_hud_and_input_hints.md`: 상단 HUD, 키캡, 입력 힌트
- `06_statement_mode.md`: 진술/제시 모드
- `07_case_notebook.md`: 수사노트
- `08_investigation_map.md`: 조사 지도
- `09_backlog.md`: 대화 로그
- `10_branch_tree.md`: 분기 트리
- `11_options.md`: 옵션 화면
- `12_story_menu_and_system_overlays.md`: 메뉴/토스트/가로 안내/전환 오버레이
- `13_popup_frames.md`: 팝업 이미지와 컷신 프레임
- `14_shared_asset_sheet.md`: 공통 버튼/패널/상태 에셋 시트
