# Blind Madeleine Editor Renewal Plan

작성일: 2026-06-05

## 목표

이 브랜치는 `main` 기준에서 새 에디터 리뉴얼 안건을 검토하고 구현하기 위한 작업 공간이다.

1. 기존 `tools/*.html` 단일 파일 에디터를 통합형 에디터로 재설계한다.
2. 캐릭터, 아이템, 챕터, 대사, 스토리 에셋 편집 흐름을 같은 정보 구조와 검증 패널 안에서 다룬다.
3. BGM과 SE는 `data/story_assets`와 `[bgm]`, `[sfx]`, `[se]` 이벤트 태그 흐름으로 계속 유지한다.
4. Godot 런타임 데이터 스키마와 에디터 저장 포맷이 같은 규칙을 공유하도록 정리한다.
5. PC와 모바일 브라우저에서 모두 사용할 수 있는 밀도 높은 작업 UI를 만든다.

## 유지할 범위

- `data/story_assets`의 `bgm`, `sfx` 항목
- `assets/story_assets/bgm/**`
- `assets/story_assets/sfx/**`
- `assets/sfx/dialogue_text_tick.ogg`
- 대사 이벤트 태그 `[bgm]`, `[bgm_stop]`, `[bgm_volume]`, `[sfx]`, `[se]`
- 옵션 화면의 BGM/SE 볼륨과 미리듣기
- 챕터 선택 화면 BGM

## 리뉴얼 방향

- 데이터 로딩, 저장, 검증을 에디터 공통 계층으로 분리한다.
- 경로 처리는 `res://` 기준으로 통일하고, 저장 전 상대 경로/리소스 경로를 검증한다.
- 캐릭터 초상, 챕터 이미지, 아이템 이미지, 스토리 에셋 업로드는 같은 파일 저장 API를 사용한다.
- 대사 편집은 노드 목록, statement 모드, stage cast, popup, acquire info, event tag 삽입을 한 화면에서 빠르게 왕복할 수 있게 구성한다.
- BGM/SE 선택은 스토리 에셋 레지스트리에서 고르게 하고, 직접 경로 입력은 고급 옵션으로 둔다.

## 검증

- 캐릭터/챕터/아이템/대사/스토리 에셋 JSON 파싱
- 대사 저장 후 Godot 런타임 로더와 필드 호환성 확인
- BGM/SE 이벤트 태그 삽입 및 저장 포맷 확인
- 모바일 폭과 데스크톱 폭에서 텍스트 겹침, 버튼 크기, 패널 스크롤 확인
