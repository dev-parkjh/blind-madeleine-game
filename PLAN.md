# Blind Madeleine Big Refactor Plan

작성일: 2026-06-04

## 0. 목적

이 문서는 `Blind Madeleine` 프로젝트의 대규모 리팩토링을 단계별로 진행하기 위한 실행 계획서이다. 핵심 목표는 다음과 같다.

1. 캐릭터/대사 보이스, TTS, CosyVoice, `voice_audio` 등 음성 생성/재생 관련 내용을 제거한다.
2. 기존 `tools/*.html` 단일 파일 에디터를 폐기 또는 점진 대체하고, `tools/editor` 안에 Node 기반 통합 에디터를 새로 만든다.
3. 새 에디터는 현재 프로젝트 루트의 파일을 직접 읽고 쓰는 로컬 툴 서버로 동작한다.
4. Windows와 macOS를 오가며 개발하는 흐름을 고려해 Godot 미리보기, 웹 빌드 서빙, 파일 감시, 경로 처리 등을 OS별 어댑터로 분리한다.
5. PC뿐 아니라 모바일 브라우저에서도 실제로 쓸 수 있는 정교한 UI를 제공한다.
6. 단계별 작업이 끝날 때마다 변경 요약, 검증 결과, 남은 이슈를 사용자에게 보고하고, 사용자 확인 후 다음 단계로 넘어간다.

## 1. 중요한 범위 정의

### 1.1 이 계획에서 우선 제거할 "음성"

우선 제거 대상은 게임 대사에 붙는 보이스 및 음성 생성 시스템이다.

- 캐릭터 JSON의 `voice` 설정
- 대사 노드의 `voice`
- 대사 노드 또는 `metadata`의 `voice_audio`, `audio_path` 중 보이스 용도로 쓰인 필드
- `assets/voices/**`
- `tools/cosyvoice_tts_proxy.py`
- `docker-compose.cosyvoice.yml`
- `docker/cosyvoice/**`
- `run_cosyvoice_local.bat`
- `stop_cosyvoice_local.bat`
- `docs/cosyvoice-integration.md`
- 기존 에디터의 보이스 생성, 보이스 첨부, 보이스 미리듣기 UI
- Godot 런타임의 대사 보이스 플레이어와 관련 상태

### 1.2 확인 후 결정할 오디오 범위

현재 프로젝트에는 BGM, SFX, 텍스트 타자음, 옵션 화면 오디오 프리뷰가 존재한다. 한국어의 "음성"이 보통 캐릭터 보이스를 의미하므로, 1차 계획은 BGM/SFX를 유지하는 방향으로 작성한다.

다만 사용자가 "모든 오디오" 제거를 원한다면 아래도 제거 범위에 포함한다.

- `data/story_assets` 중 `kind: "bgm"`, `kind: "sfx"`
- `assets/story_assets/bgm/**`
- `assets/story_assets/sfx/**`
- `assets/sfx/dialogue_text_tick.ogg`
- `[bgm]`, `[sfx]`, `[bgm_stop]`, `[bgm_volume]` 대화 이벤트
- `GameSettings`의 BGM/SE 볼륨
- 옵션 화면의 오디오 프리뷰
- 챕터 선택 BGM과 대화 중 BGM/SFX 재생

사용자 확인 게이트:

- Stage 0 종료 시 사용자에게 "보이스/TTS만 제거" 또는 "BGM/SFX까지 포함한 모든 오디오 제거" 중 하나를 확인받는다.
- 이 확인 전에는 BGM/SFX 제거 작업을 시작하지 않는다.

## 2. 현재 프로젝트 관찰 요약

### 2.1 프로젝트 타입

- Godot 4 프로젝트
- 메인 씬: `res://scenes/main/main.tscn`
- 자동 로드 싱글톤:
  - `InputRouter`
  - `GameSettings`
  - `VisualNovelData`
- 주요 데이터 폴더:
  - `data/characters`
  - `data/items`
  - `data/story_assets`
  - `data/chapters`
  - `data/dialogues`
- 주요 에셋 폴더:
  - `assets/characters`
  - `assets/items`
  - `assets/chapters`
  - `assets/story_assets`
  - `assets/sfx`

### 2.2 기존 에디터 구성

현재 `tools` 폴더에는 아래 도구들이 있다.

- `character_editor.html`
  - 캐릭터 JSON 편집
  - 초상화 업로드 및 얼굴 중심점/프로필 크롭 편집
  - 캐릭터 색상, 설명, 메타데이터 편집
  - 보이스 설정 및 샘플 TTS 미리듣기 기능 포함
- `item_editor.html`
  - 아이템 JSON 편집
  - 이미지 업로드 및 미리보기
  - 챕터 범위 필터
  - 검증 패널
- `asset_editor.html`
  - BGM, SFX, 배경 이미지 에셋 JSON 편집
  - 미디어 업로드
  - 오디오 또는 이미지 미리보기
  - 챕터 범위 필터
- `dialogue_editor.html`
  - 대화 JSON 편집
  - 일반 대화 노드와 statement 노드 편집
  - 선택지, 다음 노드, 획득 정보, 스테이지 캐스트, 팝업 이미지 편집
  - BBCode/타이밍/이벤트 태그 삽입
  - 스테이지 초상화 레이아웃 미리보기
  - Godot 미리보기 브리지 호출
  - 보이스 생성 및 첨부 기능 포함
- `chapter_editor.html`
  - 챕터 JSON 편집
  - 대화 파일 배치 캔버스
  - `metadata.next_dialogue` 흐름 연결
  - 챕터 썸네일, 패럴렉스 레이어, 타이틀 이미지 편집
  - 검증 패널
- `godot_preview_bridge.py`
  - 브라우저에서 직접 Godot을 실행할 수 없기 때문에, 로컬 HTTP 서버로 대화 JSON을 받아 저장하고 Godot을 실행
- `run_godot_preview_bridge.bat`
  - Windows용 Godot 미리보기 브리지 실행 스크립트
- `serve_web_build.py`, `.bat`, `.sh`
  - Godot Web export 로컬 서빙
- `cosyvoice_tts_proxy.py`
  - CosyVoice FastAPI 서버와 기존 대화 에디터 사이의 JSON-to-multipart 변환 프록시

### 2.3 현재 데이터 스키마의 주요 축

새 에디터는 아래 데이터 축을 통합해서 다뤄야 한다.

- Chapter
  - `id`
  - `title`
  - `order`
  - `start_dialogue`
  - `description`
  - `dialogues`
  - `layout.positions`
  - `metadata`
  - `image`
  - `parallax`
  - `bgm`
- Dialogue
  - `id`
  - `label`
  - `description`
  - `chapters`
  - `start`
  - `nodes`
  - `statement_nodes`
  - `statement_lies`
  - `metadata.next_dialogue`
  - `metadata.next_dialogue_blackout`
  - `metadata.statement_notebook`
- Dialogue Node
  - `id`
  - `mode`
  - `speaker`
  - `speaker_mystery`
  - `text`
  - `cutscene`
  - `acquire_info`
  - `stage_cast`
  - `popups`
  - `next`
  - `choices`
  - `metadata`
- Character
  - `id`
  - `display_name`
  - `description`
  - `name_color`
  - `portraits`
  - `spectrum_offset`
  - `metadata`
  - 제거 예정: `voice`
- Item
  - `id`
  - `name`
  - `description`
  - `image`
  - `chapters`
  - `metadata`
- Story Asset
  - `id`
  - `kind`
  - `display_name`
  - `description`
  - `path`
  - `chapters`
  - `volume`
  - `fixed`
  - `metadata`

## 3. 외부 비주얼 노벨/스토리 에디터 조사 요약

조사는 "현재 프로젝트의 JSON 기반 제작 흐름에 실용적으로 가져올 수 있는 에디터 패턴" 위주로 정리한다.

### 3.1 Ren'Py

참고:

- https://www.renpy.org/doc/html/language_basics.html
- https://www.renpy.org/doc/html/menus.html
- https://www.renpy.org/doc/html/displaying_images.html
- https://www.renpy.org/doc/html/screens.html

관찰:

- 스크립트 파일에서 `label`, 대사, 이미지 표시, 선택지, 점프를 순차적으로 표현한다.
- 분기와 흐름은 명시적인 라벨 및 메뉴 구조로 이해한다.
- UI는 screen language로 별도 선언한다.
- 장점은 텍스트 작성 속도와 버전 관리 친화성이다.
- 단점은 비개발자에게 전체 구조와 리소스 연결을 시각적으로 파악하기 어렵다는 점이다.

적용 아이디어:

- 새 대화 에디터는 "문서형 빠른 작성 모드"를 제공한다.
- 노드 하나를 카드 하나로만 다루지 말고, 대화 전체를 연속 문서처럼 편집할 수 있어야 한다.
- 선택지, 다음 노드, 이벤트 태그는 텍스트 근처에서 바로 삽입할 수 있어야 한다.
- 고급 사용자를 위해 JSON/스크립트 뷰를 유지한다.

### 3.2 Twine

참고:

- https://twinery.org/
- https://twinery.org/reference/en/
- https://twinery.org/cookbook/

관찰:

- 패시지를 노드로 두고 링크를 통해 흐름을 시각화한다.
- 전체 스토리 맵에서 끊어진 링크, 고아 패시지, 분기 구조를 빠르게 파악할 수 있다.
- 편집 단위가 작고, 노드 간 연결이 직관적이다.
- 큰 프로젝트에서는 필터, 검색, 태그, 검증이 중요해진다.

적용 아이디어:

- 챕터 에디터와 대화 에디터를 분리하지 않고, "스토리 맵"에서 챕터와 대화 흐름을 함께 본다.
- 끊어진 `next`, 존재하지 않는 speaker, 누락된 start, 미사용 dialogue를 그래프에서 바로 표시한다.
- 모바일에서는 큰 캔버스 대신 리스트/경로/현재 노드 중심 탐색을 제공한다.

### 3.3 Visual Novel Maker

참고:

- https://asset.visualnovelmaker.com/help/
- https://asset.visualnovelmaker.com/help/SceneCommand.htm

관찰:

- 데이터베이스, 리소스, 씬, 명령형 이벤트를 에디터 안에서 통합한다.
- 대화, 배경, 캐릭터 표시, 음악, 선택지 같은 연출이 명령 블록 형태로 누적된다.
- 비주얼 작업자는 JSON보다 "현재 장면에 어떤 명령이 쌓였는지"를 보는 편이 이해하기 쉽다.

적용 아이디어:

- 대화 텍스트 안의 `[bg]`, `[auto_next]`, `[sfx]` 같은 이벤트 태그를 "연출 칩" 또는 "명령 블록"으로 시각화한다.
- 텍스트 원본을 보존하되, 일반 사용자는 태그 문법을 몰라도 삽입/수정할 수 있게 한다.
- 스테이지 프리뷰와 인스펙터를 항상 가까이 둔다.

### 3.4 Tuesday JS

참고:

- https://kirilllive.github.io/tuesday-js/doc_editor.html
- https://github.com/Kirilllive/tuesday-js

관찰:

- 웹 기반 비주얼 노벨 에디터 방향성이 이 프로젝트의 새 Node 에디터와 잘 맞다.
- 씬, 캐릭터, 배경, 음악, 선택지를 웹 에디터에서 조합하는 방식이 유사하다.
- 브라우저 환경에서는 미리보기와 데이터 저장, 리소스 경로 처리가 사용자 경험의 핵심이다.

적용 아이디어:

- 로컬 Node 서버가 프로젝트 경로를 이미 알고 있으므로, 사용자는 별도 프로젝트 선택 없이 바로 접속한다.
- 리소스 업로드, 경로 변환, 썸네일 생성은 서버가 맡는다.
- 모바일에서 "정밀 캔버스 작업"은 별도 확대 모드로 제공하고, 일상 편집은 폼/리스트 중심으로 유지한다.

### 3.5 Godot Web Export 기반 내장 프리뷰

참고:

- https://docs.godotengine.org/en/4.6/tutorials/export/exporting_for_web.html
- https://docs.godotengine.org/en/4.6/classes/class_javascriptbridge.html
- https://docs.godotengine.org/en/4.4/tutorials/platform/web/javascript_bridge.html
- https://docs.godotengine.org/en/4.4/tutorials/editor/command_line_tutorial.html

관찰:

- Godot Web export는 브라우저 안에서 WebAssembly/WebGL 기반으로 실행할 수 있으므로, 새 에디터 안에 iframe 또는 preview panel로 붙일 수 있다.
- Godot 4.3 이후 단일 스레드 Web export가 지원되며, 현재 프로젝트의 `export_presets.cfg`도 `variant/thread_support=false`라서 cross-origin isolation 부담이 낮다.
- 스레드 Web export를 켜면 `SharedArrayBuffer` 때문에 `Cross-Origin-Opener-Policy`와 `Cross-Origin-Embedder-Policy` 같은 헤더가 필요하다.
- Godot Web export는 기본적으로 export 시점의 `.pck` 안에 들어간 `res://data/**`를 읽는다. 따라서 에디터에서 방금 저장한 JSON을 즉시 preview하려면 단순 iframe만으로는 부족하고, 런타임 preview payload를 별도로 주입하는 경로가 필요하다.
- Web export에서 브라우저/부모 페이지와 상호작용해야 하면 `JavaScriptBridge`를 사용할 수 있다.

적용 아이디어:

- 새 에디터의 Preview 화면에 "내장 엔진 프리뷰" 탭을 둔다.
- Node 서버가 `build/web/index.html`, `.wasm`, `.pck`, `.js` 등 Web export 산출물을 같은 origin에서 서빙한다.
- iframe URL에 `?editor_preview=1&dialogue_id=...&node_id=...&preview_token=...` 형태의 preview context를 전달한다.
- Godot 런타임은 Web build일 때 URL query 또는 `JavaScriptBridge`를 통해 preview context를 읽는다.
- Godot 런타임은 preview context가 있으면 Node 서버의 `/api/runtime/preview-data/:token` 또는 정적 preview JSON을 fetch하여 최신 대화/캐릭터/아이템/에셋 데이터를 사용한다.
- fallback으로 "웹 빌드를 다시 export하고 iframe reload" 모드를 둔다. 이 방식은 느리지만 런타임 fetch 구현 전에도 사용할 수 있다.
- 데스크톱용 별도 Godot 실행 미리보기는 유지한다. Web preview는 빠른 확인, 데스크톱 preview는 최종 런타임 확인 역할로 나눈다.

## 4. 목표 UX

### 4.1 첫 화면

새 에디터의 첫 화면은 랜딩 페이지가 아니라 즉시 작업 가능한 제작 대시보드여야 한다.

첫 화면 구성:

- 상단 또는 사이드 앱 바
  - Story
  - Dialogue
  - Characters
  - Items
  - Assets
  - Chapter Visual
  - Validation
  - Preview
- 프로젝트 상태
  - 프로젝트 루트 경로
  - Godot 실행 파일 감지 상태
  - 데이터 파일 개수
  - 검증 오류 개수
  - 마지막 저장/백업 시간
- 최근 수정 항목
  - 최근 대화
  - 최근 챕터
  - 최근 캐릭터/아이템/에셋
- 빠른 액션
  - 새 대화
  - 새 캐릭터
  - 새 아이템
  - 새 배경 에셋
  - 현재 챕터 미리보기

### 4.2 Story 맵

목표:

- 챕터와 대화 파일 간 흐름을 한눈에 본다.
- 기존 `chapter_editor.html`의 대화 캔버스 기능을 더 정돈해서 통합한다.

필수 기능:

- 챕터 목록과 순서 편집
- 챕터별 dialogue 배치
- `start_dialogue` 선택
- `metadata.next_dialogue` 연결 편집
- 연결선 선택 시 blackout 여부와 fade/hold duration 편집
- 검색, 필터, 오류 강조
- 미배치 dialogue 표시
- 끊어진 연결, 순환, 시작점 없음, 미사용 dialogue 경고
- 노드 더블 클릭으로 Dialogue 편집 화면 이동

### 4.3 Dialogue 편집

목표:

- 긴 비주얼 노벨 대사를 빠르게 쓰고, 선택지/연출/스테이지 상태를 편하게 조정한다.

데스크톱 레이아웃:

- 왼쪽: 노드 아웃라인
  - 일반 노드
  - statement 노드
  - reaction 노드
  - 검색/필터
  - 오류 배지
- 중앙: 문서형 대화 편집
  - speaker 선택
  - text 편집
  - 선택지 inline 편집
  - 다음 노드 inline 편집
  - cutscene, auto_next, background 등 연출 칩
  - BBCode 미리보기
- 오른쪽: 인스펙터와 프리뷰
  - 스테이지 캐스트
  - 팝업 이미지
  - 획득 정보
  - statement lie/reaction
  - Godot 미리보기 버튼
  - 검증 결과

모바일 레이아웃:

- 하단 탭
  - Outline
  - Edit
  - Stage
  - Validate
- 인스펙터는 전체 화면 시트로 표시
- 긴 텍스트 편집은 키보드가 올라와도 저장/닫기 버튼이 가려지지 않게 한다.
- 노드 이동은 큰 터치 타깃과 이전/다음 버튼을 제공한다.
- 스테이지 편집은 "정밀 편집 모드"에서 핀치 줌, 드래그, 좌표 입력을 함께 제공한다.

### 4.4 Characters

필수 기능:

- 캐릭터 목록, 검색, 색상 스와치
- 캐릭터 생성/복제/삭제
- 이름, 설명, 색상, 메타데이터 편집
- 초상화 상태 추가/삭제/이름 변경
- 초상화 업로드
- 얼굴 중심점 지정
- 프로필 크롭 미리보기
- 사용 위치 표시
  - 이 캐릭터가 등장하는 dialogue/node
  - stage_cast 사용 위치
  - statement notebook 사용 위치

제거할 기능:

- 보이스 설정 폼
- 로컬 TTS URL
- 샘플 미리듣기
- `voice` JSON 편집

### 4.5 Items

필수 기능:

- 아이템 목록, 검색, 챕터 필터
- 이름, 설명, 이미지, 챕터 범위, 메타데이터 편집
- 이미지 업로드 및 경로 자동 저장
- 사용 위치 표시
  - acquire_info
  - statement notebook
  - statement lie reaction target
  - popup source item

### 4.6 Assets

보이스/TTS 제거 후에도 BGM/SFX를 유지하는 경우:

- `background`, `bgm`, `sfx` 에셋을 계속 지원한다.
- 다만 "음성"과 혼동되지 않도록 UI 라벨을 "연출 에셋" 또는 "배경/사운드 에셋"으로 명확히 한다.
- BGM/SFX 제거가 확정되면 `background`만 지원하는 "배경 에셋"으로 축소한다.

필수 기능:

- 에셋 목록, 종류 필터, 챕터 필터
- 업로드 시 `assets/story_assets/{kind}/{id}.{ext}`로 복사
- Godot `res://` 경로 자동 생성
- 이미지 썸네일
- 오디오 유지 시 BGM/SFX 미리듣기
- 사용 위치 역참조

### 4.7 Chapter Visual

목표:

- 기존 챕터 이미지/패럴렉스 편집 기능을 보존하되 UI를 더 안정적으로 만든다.

필수 기능:

- 16:9 프리뷰
- 배경, 스프라이트, 타이틀 이미지 레이어
- 레이어 순서, 위치, 앵커, 스케일, 회전, 깊이, perspective, opacity, visible
- overlay 참조 이미지
- 썸네일 생성
- 모바일 정밀 편집 모드
- 변경 전/후 preview
- 런타임 데이터와 저장 데이터 차이 검증

## 5. 기술 아키텍처 제안

### 5.1 폴더 구조

목표 구조:

```text
tools/editor/
  package.json
  tsconfig.json
  vite.config.ts
  playwright.config.ts
  vitest.config.ts
  src/
    client/
      main.tsx
      app/
      routes/
      components/
      features/
      styles/
    server/
      index.ts
      config/
      api/
      services/
      adapters/
      watchers/
    shared/
      schema/
      model/
      validation/
      paths/
      ids/
  scripts/
    dev.ts
    build.ts
    migrate-voice-removal.ts
  tests/
    unit/
    integration/
    e2e/
  README.md
```

### 5.2 클라이언트

권장 스택:

- Vite
- TypeScript
- React
- React Router
- TanStack Query 또는 가벼운 자체 API hook
- `@xyflow/react` 또는 동급 그래프 라이브러리
- CodeMirror 6 계열 JSON/텍스트 편집기
- Zod 기반 공유 스키마
- Vitest
- Playwright

선택 이유:

- 기존 에디터 기능이 많아 컴포넌트 분리가 필요하다.
- 그래프 편집, 폼 인스펙터, 미리보기, 검증 패널을 동시에 다루기 좋다.
- Vite 기반이면 `tools/editor` 단독 개발 서버와 번들링이 단순하다.
- 모바일 대응 CSS와 상태 관리를 체계적으로 만들기 좋다.

구현 전 확인:

- 로컬 Node 버전 확인
- 현재 프로젝트에 package manager 선호가 있는지 확인
- Windows/macOS에서 동일하게 동작하는 스크립트 작성

### 5.3 서버

권장 스택:

- Node.js
- TypeScript
- Fastify 또는 Node 내장 HTTP 기반 경량 서버
- Zod 또는 JSON Schema 검증
- 파일 작업은 `fs/promises`
- 파일 감시는 `fs.watch` 또는 `chokidar`
- 이미지 썸네일/크롭이 필요하면 `sharp` 검토

서버 책임:

- 프로젝트 루트 감지
- 안전한 경로 정규화
- JSON 파일 읽기/쓰기
- 원자적 저장
- 백업 생성
- 미디어 업로드
- 이미지 크기/썸네일 메타데이터 추출
- 전체 데이터 인덱스 생성
- 참조 관계 계산
- 검증 실행
- Godot 실행 및 상태 확인
- Web export 서빙
- 파일 변경 이벤트를 클라이언트에 전달

### 5.4 API 설계 초안

```text
GET    /api/project
GET    /api/index
GET    /api/validation
POST   /api/validation/run

GET    /api/characters
GET    /api/characters/:id
PUT    /api/characters/:id
POST   /api/characters
DELETE /api/characters/:id

GET    /api/items
GET    /api/items/:id
PUT    /api/items/:id
POST   /api/items
DELETE /api/items/:id

GET    /api/assets
GET    /api/assets/:id
PUT    /api/assets/:id
POST   /api/assets
DELETE /api/assets/:id

GET    /api/dialogues
GET    /api/dialogues/:id
PUT    /api/dialogues/:id
POST   /api/dialogues
DELETE /api/dialogues/:id

GET    /api/chapters
GET    /api/chapters/:id
PUT    /api/chapters/:id
POST   /api/chapters
DELETE /api/chapters/:id

POST   /api/uploads/character-portrait
POST   /api/uploads/item-image
POST   /api/uploads/story-asset
POST   /api/uploads/chapter-layer

POST   /api/preview/godot
GET    /api/preview/godot/health
GET    /api/preview/web/health
POST   /api/preview/web/export
POST   /api/preview/web/serve
POST   /api/preview/web/session
GET    /api/preview/web/session/:token
GET    /api/preview/web/frame/:token
POST   /api/preview/web/reload

GET    /api/files/media?path=res://...
GET    /api/files/thumbnail?path=res://...
GET    /api/runtime/preview-data/:token
GET    /api/events
```

주의:

- 모든 파일 경로는 프로젝트 루트 내부로 제한한다.
- `res://`와 상대 경로 변환은 `shared/paths`에서만 처리한다.
- 클라이언트가 절대 경로를 직접 만들지 않게 한다.
- 저장 전 검증과 저장 후 재로드 검증을 모두 수행한다.

### 5.5 저장 정책

필수 정책:

- JSON은 안정적인 pretty print로 저장한다.
- 저장 전 기존 파일을 `.backup` 또는 `.bak/YYYYMMDD-HHMMSS`에 보관한다.
- 임시 파일에 먼저 쓴 뒤 rename으로 교체한다.
- 저장 결과는 다시 읽어서 파싱 가능 여부를 확인한다.
- 클라이언트에는 dirty state, 충돌 감지, 외부 변경 알림을 제공한다.

### 5.6 Godot 미리보기 OS 어댑터

기존 Python 브리지의 역할을 Node 서버로 흡수한다.

공통 기능:

- 현재 대화 JSON 저장
- 현재 dialogue id와 node id로 Godot 실행
- 프로젝트 루트는 `tools/editor` 기준 상위 두 단계 또는 서버 실행 cwd로 감지
- Godot 실행 파일 자동 탐색
- 실패 시 구체적인 복구 가이드 제공

Windows 후보:

- `GODOT_BIN`
- `GODOT_EXECUTABLE`
- `godot`
- `godot4`
- `godot.exe`
- `godot4.exe`
- 프로젝트 루트의 `Godot*.exe`
- 일반 설치 경로는 구현 중 필요 시 추가

macOS 후보:

- `GODOT_BIN`
- `GODOT_EXECUTABLE`
- `godot`
- `godot4`
- `/Applications/Godot.app/Contents/MacOS/Godot`
- `/Applications/Godot_mono.app/Contents/MacOS/Godot`
- 사용자 지정 설정 파일

Linux 후보:

- `GODOT_BIN`
- `GODOT_EXECUTABLE`
- `godot`
- `godot4`
- `flatpak run org.godotengine.Godot`

실행 명령 형태:

```text
godot --path <project-root> -- --editor-preview-dialogue <dialogue-id> --editor-preview-node <node-id>
```

### 5.7 에디터 내장 Web 엔진 프리뷰

목표:

- 에디터 화면 안에서 실제 Godot Web export를 실행하여 대사, 스테이지, 선택지, statement 흐름을 확인한다.
- 기존 "Godot을 별도 프로세스로 실행"하는 프리뷰보다 빠른 확인 루프를 제공한다.
- 사용자는 Dialogue 화면 오른쪽 또는 Preview route에서 iframe으로 실제 게임 화면을 본다.

구성:

- Node 서버
  - `build/web` 산출물 서빙
  - Web export가 없으면 export 필요 상태 반환
  - preview session 생성
  - 최신 편집 데이터를 preview token에 묶어 보관
  - iframe URL 생성
  - iframe reload 이벤트 발행
- 클라이언트
  - Preview panel 또는 Preview route에 iframe 표시
  - 현재 dialogue/node를 preview session으로 전송
  - 저장 후 "엔진 프리뷰 새로고침" 버튼 제공
  - Web export가 오래된 경우 "웹 프리뷰 빌드 갱신" 버튼 제공
- Godot 런타임
  - Web feature일 때 URL query 또는 `JavaScriptBridge`로 preview context 읽기
  - preview context가 있으면 Node 서버에서 preview data fetch
  - fetch한 데이터로 `VisualNovelData` 또는 별도 preview data provider를 override
  - 기존 desktop command-line preview와 같은 payload 형태로 `story_dialogue` 화면 진입

권장 구현 순서:

1. 단순 iframe 프리뷰
   - 기존 `build/web/index.html`을 Node 서버가 서빙한다.
   - 에디터 안에서 게임 첫 화면이 뜨는지 확인한다.
2. Export/serve 통합
   - Web export가 없거나 오래되면 Node 서버가 `godot --headless --path <project-root> --export-debug Web build/web/index.html`을 실행할 수 있게 한다.
   - export templates 미설치, Godot 경로 오류, preset 누락을 구체적으로 표시한다.
3. Query 기반 preview context
   - iframe src를 `/preview/game?dialogue_id=...&node_id=...&preview_token=...`로 구성한다.
   - Godot Web build가 URL query를 읽도록 `Main._read_editor_preview_payload()`를 확장한다.
4. Live preview data 주입
   - Node 서버가 `/api/runtime/preview-data/:token`에서 현재 dialogue, characters, items, story_assets, chapters subset을 반환한다.
   - Godot Web build가 preview mode에서 이 JSON을 fetch한다.
   - fetch 완료 후 story 화면을 시작한다.
5. 빠른 reload
   - 저장할 때마다 preview token을 갱신하고 iframe을 reload한다.
   - 장기적으로는 `postMessage` 또는 `JavaScriptBridge` callback으로 전체 iframe reload 없이 현재 노드만 바꾸는 방식을 검토한다.

주의:

- Web export의 `.pck`는 export 시점 데이터를 포함한다. "방금 수정한 JSON"을 보려면 live preview data 주입 또는 재export가 필요하다.
- iframe은 같은 Node 서버 origin에서 제공한다. 이렇게 하면 CORS와 mixed-content 문제를 줄일 수 있다.
- 현재 Web preset은 `variant/thread_support=false`라서 단일 스레드 프리뷰에 적합하다.
- 향후 thread support를 켜면 Node 서버가 cross-origin isolation 헤더를 제공해야 한다.
- Web export의 canvas가 키보드/터치 입력을 캡처할 수 있으므로, 에디터 단축키와 iframe focus 상태를 분리해야 한다.
- 모바일에서는 WebGL 메모리와 화면 크기 제약이 있으므로 "저해상도 프리뷰" 또는 "프리뷰 접기" 옵션을 제공한다.

## 6. 단계별 작업 계획

각 Stage는 아래 형식으로 진행한다.

1. 작업 시작 전 변경 범위를 사용자에게 짧게 알린다.
2. 코드와 데이터 수정 또는 신규 구현을 진행한다.
3. 자체 검증을 수행한다.
4. 사용자에게 변경 요약, 수정 파일, 검증 결과, 확인 질문을 제공한다.
5. 사용자가 확인하면 다음 Stage로 넘어간다.

### Stage 0. 기준선 확정과 제거 범위 확인

목표:

- 현재 기능과 제거 범위를 확정한다.
- 이후 단계에서 되돌릴 수 있도록 기준선을 만든다.

작업:

- `rg`로 voice, tts, cosyvoice, audio, bgm, sfx 사용처 전체 목록화
- 기존 에디터 기능 목록 정리
- Godot 런타임 보이스 재생 경로 정리
- 데이터 파일 내 `voice` 및 `voice_audio` 존재 여부 확인
- `assets/voices` 존재 여부 확인
- BGM/SFX를 유지할지, 모든 오디오를 제거할지 사용자 확인
- 현재 Git 상태 확인

수정 예상 파일:

- 원칙적으로 없음
- 필요 시 조사 결과를 `PLAN.md`에 업데이트

검증:

- 조사 목록이 스크립트, 데이터, 문서, 도구, Docker 파일을 모두 포함하는지 확인

사용자 확인:

- "보이스/TTS만 제거"로 진행할지
- "BGM/SFX까지 포함한 모든 오디오 제거"로 진행할지

Stage 완료 보고 템플릿:

```text
Stage 0 완료.
요약:
- 보이스/TTS 사용처 n개 확인
- BGM/SFX 사용처 n개 확인
- 제거 범위 후보 정리
검증:
- rg 기반 전체 검색 완료
확인 필요:
- BGM/SFX 유지 여부
```

### Stage 1. 음성/TTS 제거

목표:

- 캐릭터 보이스, 대사 보이스, CosyVoice, 보이스 재생 런타임을 제거한다.

작업:

- `VisualNovelData`에서 캐릭터 기본값과 로더의 `voice` 필드 제거
- 대화 노드 정규화에서 `voice` 보존 로직 제거
- `story_dialogue_screen.gd`에서 `_voice_player`, `_statement_title_pending_voice_path`, `_build_voice_player`, `_stop_voice_audio`, `_play_node_voice_audio`, `_play_voice_audio_path`, `_get_node_voice_audio_path`, `_play_statement_title_pending_voice` 관련 코드 제거
- statement title에서 pending voice 처리 제거
- back/rewind/advance 시 보이스 stop 호출 제거
- 기존 에디터 HTML의 voice UI는 이 단계에서 바로 수정하지 않고, 새 에디터로 대체할 예정이면 폐기 목록으로만 관리한다.
- `tools/cosyvoice_tts_proxy.py` 제거
- `docker-compose.cosyvoice.yml` 제거
- `docker/cosyvoice/**` 제거
- `run_cosyvoice_local.bat`, `stop_cosyvoice_local.bat` 제거
- `docs/cosyvoice-integration.md` 제거
- README와 `docs/visual-novel-data.md`에서 CosyVoice 및 voice 설명 제거
- 데이터 마이그레이션 스크립트 작성 또는 일회성 정리:
  - `data/characters/*.json`의 `voice` 제거
  - `data/dialogues/*.json`의 node `voice` 제거
  - `metadata.voice_audio` 제거
  - `voice_audio` 또는 보이스 목적의 `audio_path` 제거
- `assets/voices/**`가 있으면 제거 후보로 보고 후 삭제

주의:

- BGM/SFX 유지가 확정된 경우 `AudioStreamPlayer` 전체를 검색해서 무조건 제거하면 안 된다.
- `dialogue_spectrum.gd`는 실제 보이스 오디오가 아니라 타입라이터/화자 시각 효과일 수 있다. 사용자에게 "보이스 시각화 이름까지 제거/리네임할지" 확인한다.
- `audio_path`가 보이스 외 다른 용도로 쓰이는지 확인 후 제거한다.

수정 예상 파일:

- `scripts/visual_novel/visual_novel_data.gd`
- `scripts/screens/story_dialogue_screen.gd`
- `README.md`
- `docs/visual-novel-data.md`
- `tools/cosyvoice_tts_proxy.py`
- `docker-compose.cosyvoice.yml`
- `docker/cosyvoice/**`
- `run_cosyvoice_local.bat`
- `stop_cosyvoice_local.bat`
- `docs/cosyvoice-integration.md`
- `data/characters/*.json`
- `data/dialogues/*.json`

검증:

- `rg -n "cosy|Cosy|tts|TTS|voice|voice_audio|assets/voices"` 실행
- Godot 프로젝트가 파싱 가능한지 확인
- 가능하면 Godot headless 또는 최소 데이터 로더 실행 확인
- 데이터 JSON 전체 파싱 확인
- 보이스 제거 후 대화 시작, statement 진입, rewind, backlog 이동이 깨지지 않는지 확인

사용자 확인:

- 보이스 제거 결과와 삭제 파일 목록 확인
- `dialogue_spectrum` 명칭/시각 효과 유지 여부 확인

### Stage 2. `tools/editor` Node 프로젝트 스캐폴딩

목표:

- 새 에디터의 개발 기반을 만든다.

작업:

- `tools/editor/package.json` 생성
- TypeScript, Vite, 테스트 설정 추가
- 서버 엔트리와 클라이언트 엔트리 분리
- `npm run dev`로 서버와 Vite를 함께 실행하는 스크립트 구성
- `npm run build`, `npm run test`, `npm run lint` 구성
- `.gitignore` 업데이트 필요 여부 확인
- `tools/editor/README.md` 작성

권장 스크립트:

```json
{
  "scripts": {
    "dev": "tsx src/server/index.ts",
    "build": "vite build && tsc -p tsconfig.server.json",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "typecheck": "tsc --noEmit"
  }
}
```

수정 예상 파일:

- `tools/editor/package.json`
- `tools/editor/src/server/index.ts`
- `tools/editor/src/client/main.tsx`
- `tools/editor/src/shared/**`
- `tools/editor/vite.config.ts`
- `tools/editor/tsconfig*.json`
- `tools/editor/README.md`

검증:

- `npm install`
- `npm run typecheck`
- `npm run test`
- `npm run dev`
- 브라우저에서 `http://localhost:<port>` 접속

사용자 확인:

- 스택과 폴더 구조 확인
- 개발 서버 실행 방식 확인

### Stage 3. 프로젝트 파일 접근 계층 구축

목표:

- 브라우저 File System Access API 의존을 제거하고, Node 서버가 현재 프로젝트 파일을 직접 관리하게 한다.

작업:

- project root resolver 구현
- `res://` 경로 변환 구현
- 안전한 path guard 구현
- JSON read/write 서비스 구현
- atomic write 구현
- 백업 정책 구현
- 파일 목록 인덱싱 구현
- 파일 변경 watcher 구현
- SSE 또는 WebSocket 이벤트 구현

핵심 모듈:

- `src/server/services/projectRoot.ts`
- `src/server/services/fileStore.ts`
- `src/server/services/jsonStore.ts`
- `src/server/services/backupStore.ts`
- `src/server/watchers/projectWatcher.ts`
- `src/shared/paths/resPath.ts`

검증:

- 임시 fixture 프로젝트로 read/write unit test
- 경로 탈출 시도 차단 테스트
- JSON 저장 후 재파싱 테스트
- 외부 변경 감지 테스트

사용자 확인:

- 백업 폴더 위치와 저장 정책 확인

### Stage 4. 공유 데이터 모델과 검증기 구축

목표:

- 기존 데이터 스키마를 코드로 명확히 정의하고, 에디터와 서버가 같은 규칙을 쓰게 한다.

작업:

- Character schema
- Item schema
- StoryAsset schema
- Chapter schema
- Dialogue schema
- DialogueNode schema
- Statement schema
- Parallax schema
- 레거시 호환 normalize 함수 구현
- 참조 관계 인덱스 구현
- 검증 오류 모델 구현

검증 항목:

- 존재하지 않는 speaker
- 존재하지 않는 portrait
- 존재하지 않는 item/character acquire target
- 존재하지 않는 dialogue next
- 존재하지 않는 chapter start_dialogue
- `chapter.dialogues`에 없는 start dialogue
- 미사용 dialogue
- 순환 next_dialogue
- 끊어진 choice next
- statement lie reaction target 오류
- 누락된 이미지/미디어 파일
- 잘못된 `res://` 경로
- 중복 id
- 빈 id

보이스 제거 검증:

- character에 `voice`가 있으면 warning 또는 자동 제거 후보로 표시
- dialogue node에 `voice`가 있으면 warning 또는 자동 제거 후보로 표시
- `metadata.voice_audio`가 있으면 warning 또는 자동 제거 후보로 표시

검증:

- 현재 `data/**` 전체를 fixture로 사용한 validation test
- 알려진 오류를 fixture로 만들어 오류 메시지 snapshot 테스트

사용자 확인:

- warning과 error의 구분 기준 확인

### Stage 5. 앱 셸과 대시보드 구현

목표:

- 새 에디터의 기본 사용자 경험을 확정한다.

작업:

- 반응형 앱 셸 구현
- 데스크톱 사이드바/탑바 구현
- 모바일 하단 탭 구현
- 현재 프로젝트 상태 카드
- 데이터 카운트
- 검증 오류 요약
- 최근 파일 목록
- 빠른 액션
- 서버 연결 상태 표시

UI 원칙:

- 작업 도구이므로 마케팅식 랜딩 페이지를 만들지 않는다.
- 화면 첫 진입부터 편집 가능한 정보가 보여야 한다.
- 카드 중첩을 피하고, 반복 항목에만 카드 UI를 사용한다.
- 버튼은 아이콘과 명확한 라벨을 사용하되, 작은 도구 버튼은 tooltip을 제공한다.
- 모바일에서 버튼과 입력 요소는 터치 타깃을 충분히 확보한다.

검증:

- 데스크톱 1440x900
- 노트북 1280x800
- 태블릿 834x1194
- 모바일 390x844
- Playwright screenshot 비교

사용자 확인:

- 정보 구조와 첫 화면 흐름 확인

### Stage 6. 리소스 관리 화면 구현

목표:

- Characters, Items, Assets를 새 에디터에서 통합 관리한다.

작업:

- 공통 resource list 컴포넌트
- 검색, 챕터 필터, 사용처 필터
- Character editor
- Portrait uploader
- Portrait crop/center editor
- Item editor
- Item image uploader
- Story asset editor
- Background preview
- 오디오 유지 시 BGM/SFX preview
- 사용 위치 패널
- 변경 사항 저장/취소
- 삭제 전 영향 범위 표시

보이스 제거 반영:

- Character 화면에서 voice 영역은 만들지 않는다.
- 레거시 `voice` 필드가 남아 있으면 "제거 예정 필드"로 검증 패널에만 표시한다.

검증:

- 새 캐릭터 생성 후 Godot 데이터 로더 호환 확인
- 초상화 업로드 후 `res://assets/characters/<id>/<name>.<ext>` 저장 확인
- 아이템 이미지 업로드 확인
- 에셋 업로드 확인
- 삭제 시 참조 경고 확인

사용자 확인:

- 캐릭터/아이템/에셋 편집 플로우 확인

### Stage 7. Dialogue 편집기 핵심 구현

목표:

- 기존 `dialogue_editor.html`의 핵심 제작 기능을 새 UI로 이전한다.

작업:

- Dialogue list
- 새 dialogue 생성
- dialogue metadata 편집
- 일반 nodes 편집
- statement_nodes 편집
- reaction nested nodes 편집
- node reorder/duplicate/delete
- speaker 선택
- speaker mystery
- text editor
- BBCode 삽입 메뉴
- event tag 삽입 메뉴
- choices 편집
- next 편집
- cutscene 편집
- acquire_info 편집
- popups 편집
- stage_cast 편집
- JSON 고급 편집 탭
- 자동 저장은 처음에는 비활성화하고 수동 저장으로 안정화

중요 UX:

- 긴 대사를 연속 문서처럼 읽고 고칠 수 있게 한다.
- 노드 카드만 나열하지 않고, 현재 노드 주변 문맥을 보여준다.
- 선택지와 다음 이동은 텍스트와 가까운 위치에서 편집한다.
- 이벤트 태그는 raw text를 망가뜨리지 않는 명령 칩으로 시각화한다.

검증:

- 기존 dialogue 파일 열기
- 저장 후 diff가 불필요하게 커지지 않는지 확인
- node id 변경 시 next/choice 참조 업데이트
- statement reaction 저장/로드 왕복
- BBCode 원문 보존
- validation panel 연동

사용자 확인:

- 대화 작성 UX 확인
- 기존 HTML 에디터 대비 누락된 필수 기능 확인

### Stage 8. Stage Preview와 연출 인스펙터 구현

목표:

- 대화 노드의 화면 연출을 에디터 안에서 이해하고 조정할 수 있게 한다.

작업:

- 16:9 stage preview
- 배경 이벤트 태그 반영
- speaker portrait 반영
- stage_cast portrait 위치, zoom, opacity, flip, mystery 반영
- popup preview
- dialogue panel approximate preview
- text BBCode approximate preview
- portrait layout drag editor
- 모바일 정밀 편집 모드

주의:

- Godot 렌더링과 100% 동일할 필요는 없지만, 제작 판단에 충분히 가까워야 한다.
- 실제 런타임 확인은 Stage 10의 내장 Web 엔진 프리뷰와 데스크톱 Godot Preview로 연결한다.

검증:

- 각 portrait_position 조합 확인
- center/zoom/profile crop 확인
- mystery silhouette 확인
- popup 위치 확인
- 모바일에서 드래그/입력 충돌 확인

사용자 확인:

- 프리뷰 정확도와 편집감 확인

### Stage 9. Story Map과 Chapter Visual 구현

목표:

- 기존 `chapter_editor.html`의 캔버스와 챕터 비주얼 기능을 새 에디터로 이전한다.

작업:

- Chapter list
- Chapter metadata editor
- Dialogue graph editor
- Dialogue placement
- next_dialogue 연결
- blackout 연결 속성
- 미배치 dialogue shelf
- graph 자동 레이아웃 옵션
- Chapter parallax editor
- layer upload
- layer transform controls
- overlay image
- title image
- thumbnail generation

검증:

- 기존 chapter 파일 열기
- dialogue positions 왕복 저장
- next_dialogue 저장 확인
- blackout duration 저장 확인
- parallax layer 왕복 저장
- thumbnail 생성 결과 확인
- 모바일에서 canvas 대체 플로우 확인

사용자 확인:

- 챕터 맵 사용성 확인
- 패럴렉스 편집 사용성 확인

### Stage 10. Godot Preview와 운영 도구 통합

목표:

- Node 툴 서버 하나만 켜도 에디터, 내장 Web 엔진 프리뷰, 데스크톱 Godot 미리보기, 웹 빌드 확인을 사용할 수 있게 한다.
- 가능하면 대사 편집 화면 안에서 iframe으로 실제 Godot Web export를 실행하여 현재 dialogue/node를 확인한다.

작업:

- `/api/preview/godot/health`
- `/api/preview/godot`
- `/api/preview/web/health`
- `/api/preview/web/session`
- `/api/preview/web/frame/:token`
- `/api/runtime/preview-data/:token`
- Godot executable resolver
- OS별 child process spawn 옵션
- preview 실행 로그
- 실패 복구 메시지
- editor setting 파일
- web build serve 기능 이전
- 필요 시 export command wrapper 추가
- iframe 기반 내장 엔진 프리뷰 UI 추가
- Web export 산출물 상태 확인
- Web export가 없거나 오래되었을 때 빌드 갱신 버튼 제공
- iframe focus, reload, error state 처리
- Godot Web build가 query string preview context를 읽도록 런타임 preview payload 확장
- Godot Web build가 Node 서버에서 최신 preview data를 fetch하도록 preview data provider 추가
- live preview data fetch 구현 전까지는 fallback으로 Web export 재빌드 후 iframe reload를 지원

설정 파일 후보:

```text
tools/editor/.editor-local.json
```

예시:

```json
{
  "godot": {
    "executable": "C:/path/to/Godot.exe",
    "previewPort": 51234,
    "webPreset": "Web",
    "webExportPath": "build/web/index.html"
  },
  "server": {
    "host": "127.0.0.1",
    "port": 5177
  }
}
```

검증:

- Windows에서 Godot preview 실행
- macOS에서 Godot preview 실행
- Godot 미설치/경로 오류 메시지 확인
- 현재 dialogue/node preview 인자 전달 확인
- 웹 빌드 서빙 확인
- 에디터 iframe 안에서 `build/web/index.html` 실행 확인
- 현재 `export_presets.cfg`의 `Web` preset과 `variant/thread_support=false` 상태 확인
- Web export가 없을 때 빌드 필요 UI 확인
- Web export 갱신 후 iframe reload 확인
- query string으로 dialogue/node preview context 전달 확인
- live preview data endpoint가 최신 저장 JSON을 반환하는지 확인
- Godot Web build가 preview data를 받아 현재 dialogue/node에서 시작하는지 확인
- iframe focus 상태에서 에디터 단축키가 오작동하지 않는지 확인
- 모바일 viewport에서 iframe 크기, 터치 입력, 닫기/새로고침 UI 확인

사용자 확인:

- Windows/macOS 양쪽 실행 방식 확인
- 내장 Web 엔진 프리뷰가 대사 작성 흐름에 충분히 편한지 확인
- Web preview를 기본 preview로 둘지, 별도 탭으로 둘지 확인

### Stage 11. 모바일 사용성 정교화

목표:

- 모바일 브라우저에서 "열리기만 하는" 수준이 아니라 실제 제작이 가능하게 만든다.

작업:

- 작은 화면 전용 navigation
- 노드 아웃라인 drawer
- 인스펙터 bottom sheet
- 스테이지 정밀 편집 전체화면
- 큰 터치 타깃
- 키보드 open 상태 대응
- 길어진 select/search picker 대응
- 그래프 캔버스 대체 리스트 제공
- unsaved changes 보호
- 스크롤 위치 유지
- 텍스트 영역 자동 높이 조절

검증:

- iPhone 폭 390px
- Android 폭 360px
- 태블릿 세로/가로
- 터치 기반 drag
- 긴 대사 입력
- 드로어/시트 닫기
- 파일 업로드 버튼

사용자 확인:

- 실제 모바일 작업 흐름 확인

### Stage 12. 테스트, 문서, 마이그레이션 정리

목표:

- 새 에디터를 안정적으로 유지할 수 있게 한다.

작업:

- Unit tests
- API integration tests
- Validation tests
- Playwright e2e tests
- README 업데이트
- `docs/visual-novel-data.md` 업데이트
- 새 에디터 사용법 문서
- migration guide
- voice removal migration 결과 문서화
- troubleshooting 문서

검증:

- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- Godot 실행 확인
- JSON 전체 파싱
- `rg`로 제거 대상 잔여 검색

사용자 확인:

- 문서와 테스트 기준 확인

### Stage 13. 기존 tools 정리

목표:

- 새 에디터가 기능을 충분히 대체한 뒤 기존 단일 HTML 에디터를 정리한다.

작업:

- 기존 HTML 에디터를 바로 삭제할지, `tools/legacy`로 이동할지 사용자 확인
- README의 Data tools 섹션을 새 에디터 기준으로 변경
- old Godot preview bridge 제거
- old web serve scripts 유지/삭제 결정
- legacy 파일 삭제 시 기능 대체 체크리스트 확인

삭제 후보:

- `tools/character_editor.html`
- `tools/item_editor.html`
- `tools/asset_editor.html`
- `tools/dialogue_editor.html`
- `tools/chapter_editor.html`
- `tools/godot_preview_bridge.py`
- `tools/run_godot_preview_bridge.bat`
- `tools/serve_web_build.py`
- `tools/serve_web_build.bat`
- `tools/serve_web_build.sh`

주의:

- 새 에디터가 완전히 안정화되기 전에는 기존 HTML 도구를 삭제하지 않는다.
- 삭제 대신 `tools/legacy` 이동도 가능하다.

검증:

- README의 도구 경로가 모두 새 경로를 가리키는지 확인
- `rg "character_editor.html|dialogue_editor.html|cosyvoice"` 잔여 확인
- 새 에디터로 기존 작업이 모두 가능한지 최종 점검

사용자 확인:

- 기존 tools 삭제 또는 legacy 이동 승인

## 7. 기능 이전 매트릭스

| 기존 기능 | 현재 위치 | 새 위치 | 상태 |
|---|---|---|---|
| 캐릭터 목록/편집 | `character_editor.html` | `tools/editor` Characters | 이전 |
| 캐릭터 초상화 업로드 | `character_editor.html` | Characters Portraits | 이전 |
| 얼굴 중심점/프로필 크롭 | `character_editor.html`, `dialogue_editor.html` | Characters + Stage Preview | 이전 |
| 캐릭터 보이스 설정 | `character_editor.html` | 없음 | 제거 |
| 보이스 샘플 생성 | `character_editor.html` | 없음 | 제거 |
| 아이템 목록/편집 | `item_editor.html` | Items | 이전 |
| 아이템 이미지 업로드 | `item_editor.html` | Items | 이전 |
| 연출 에셋 편집 | `asset_editor.html` | Assets | 이전 |
| BGM/SFX 편집 | `asset_editor.html` | Assets 또는 제거 | 사용자 확인 |
| 배경 에셋 편집 | `asset_editor.html` | Assets | 이전 |
| 대화 노드 편집 | `dialogue_editor.html` | Dialogue | 이전 |
| Statement 편집 | `dialogue_editor.html` | Dialogue Statement | 이전 |
| Lie/reaction 편집 | `dialogue_editor.html` | Dialogue Statement | 이전 |
| BBCode 삽입 | `dialogue_editor.html` | Dialogue Text Toolbar | 이전 |
| 이벤트 태그 삽입 | `dialogue_editor.html` | Dialogue Direction Chips | 이전 |
| 대사 보이스 생성/첨부 | `dialogue_editor.html` | 없음 | 제거 |
| Godot 대화 미리보기 | `dialogue_editor.html` + Python bridge | Node Preview API | 이전 |
| 에디터 내장 엔진 프리뷰 | 없음 또는 별도 Web build 수동 확인 | iframe Web Preview + Preview Data API | 신규 |
| 챕터 대화 캔버스 | `chapter_editor.html` | Story Map | 이전 |
| next_dialogue 연결 | `chapter_editor.html` | Story Map | 이전 |
| blackout 연결 속성 | `chapter_editor.html` | Story Map Edge Inspector | 이전 |
| 챕터 패럴렉스 | `chapter_editor.html` | Chapter Visual | 이전 |
| 썸네일 생성 | `chapter_editor.html` | Chapter Visual Server API | 이전 |
| Web build 서빙 | `serve_web_build.py` | Node Preview API | 이전 또는 유지 |

## 8. 주요 리스크와 대응

### 8.1 기존 HTML 에디터가 너무 많은 기능을 갖고 있음

대응:

- 한 번에 완전 대체하지 않는다.
- 기능 이전 매트릭스를 유지한다.
- 새 에디터가 기능을 대체할 때마다 사용자 확인을 받는다.

### 8.2 `story_dialogue_screen.gd`가 매우 크고 보이스 제거가 회귀를 만들 수 있음

대응:

- voice 관련 함수와 호출부를 먼저 정확히 목록화한다.
- BGM/SFX와 섞인 오디오 코드는 분리해서 다룬다.
- 작은 패치 단위로 제거하고 매번 `rg`와 Godot 실행으로 확인한다.

### 8.3 데이터 인코딩 깨짐

현재 일부 README/JSON 출력에서 한글이 깨져 보이는 파일이 있다. 실제 파일 인코딩인지 콘솔 출력 문제인지 확인이 필요하다.

대응:

- 저장 시 항상 UTF-8을 사용한다.
- Node 서버에서 JSON read/write 인코딩을 고정한다.
- 새 에디터에서 깨진 문자열을 임의로 복구하지 않는다.
- 필요하면 별도 Stage로 인코딩 복구 계획을 세운다.

### 8.4 모바일에서 그래프 캔버스가 쓰기 어려움

대응:

- 모바일에서는 그래프를 핵심 편집 UI로 강제하지 않는다.
- 경로 리스트, 현재 노드 중심, 검색 이동, drawer 인스펙터를 제공한다.
- 정밀 배치 작업만 별도 전체화면 캔버스로 제공한다.

### 8.5 OS별 Godot 경로 차이

대응:

- 자동 탐색과 사용자 설정을 모두 지원한다.
- 실행 실패 메시지에 실제 탐색 후보와 설정 방법을 보여준다.
- Windows/macOS 검증을 별도 체크포인트로 둔다.

### 8.6 Web export iframe 프리뷰가 최신 데이터를 보지 못할 수 있음

Godot Web export는 export 시점의 `.pck` 데이터를 기본으로 읽는다. 에디터가 JSON을 저장해도 이미 빌드된 `.pck`에는 반영되지 않을 수 있다.

대응:

- 1차 fallback은 Web export 재빌드 후 iframe reload로 둔다.
- 최종 목표는 preview token 기반 live preview data endpoint를 추가하는 것이다.
- Godot Web preview mode에서 Node 서버의 `/api/runtime/preview-data/:token`을 fetch하여 최신 dialogue/node를 주입한다.
- 데이터 주입이 실패하면 iframe 안에서 명확한 preview error 화면 또는 에디터 에러 패널을 보여준다.
- preview data provider는 일반 게임 런타임에 영향을 주지 않도록 `editor_preview` 모드에서만 활성화한다.

### 8.7 Web export 보안 헤더와 브라우저 제약

스레드 Web export를 사용하면 `SharedArrayBuffer` 때문에 cross-origin isolation 헤더가 필요하다. 브라우저/플랫폼에 따라 WebGL, WebAssembly, 메모리, 오디오 정책이 다를 수 있다.

대응:

- 현재 preset처럼 `variant/thread_support=false`를 기본 preview preset으로 유지한다.
- Node 서버는 필요 시 `Cross-Origin-Opener-Policy`와 `Cross-Origin-Embedder-Policy` 헤더를 켤 수 있게 옵션화한다.
- iframe은 같은 origin에서 제공한다.
- 모바일에서는 iframe preview를 접거나 저해상도/작은 canvas 모드로 실행할 수 있게 한다.
- Web preview가 실패해도 데스크톱 Godot preview를 fallback으로 제공한다.

## 9. 단계별 사용자 확인 규칙

각 단계 완료 시 반드시 아래 형식으로 보고한다.

```text
Stage N 완료.

수정 요약:
- ...

수정/추가 파일:
- ...

검증:
- 성공: ...
- 실패 또는 미실행: ...

남은 이슈:
- ...

확인 요청:
- 이 상태로 다음 Stage로 진행해도 될까요?
```

사용자가 수정 요청을 하면:

- 같은 Stage 안에서 반영한다.
- 반영 후 다시 요약과 검증 결과를 보고한다.
- 사용자가 확인하기 전에는 다음 Stage로 넘어가지 않는다.

## 10. 완료 기준

전체 리팩토링은 아래 조건을 만족해야 완료로 본다.

- 보이스/TTS/CosyVoice 관련 코드, 데이터, 문서, 도구가 제거되었다.
- BGM/SFX 유지 또는 제거 범위가 사용자 확인에 따라 정확히 반영되었다.
- `tools/editor` Node 프로젝트가 존재한다.
- 새 에디터에서 캐릭터, 아이템, 에셋, 대화, 챕터, 패럴렉스 핵심 편집이 가능하다.
- 새 에디터는 프로젝트 루트를 자동으로 사용하고 별도 폴더 선택을 요구하지 않는다.
- Windows/macOS에서 Godot 미리보기를 실행할 수 있다.
- 에디터 안 iframe에서 Godot Web export 기반 내장 엔진 프리뷰를 실행할 수 있다.
- 내장 엔진 프리뷰가 현재 dialogue/node preview context를 받아 실제 대사 화면으로 진입할 수 있다.
- live preview data 주입 또는 Web export 재빌드 fallback 중 하나 이상으로 최신 편집 내용을 확인할 수 있다.
- 모바일 폭에서도 주요 제작 흐름이 가능하다.
- 기존 HTML 에디터 삭제 또는 legacy 이동 여부가 확정되었다.
- README와 문서가 새 흐름을 설명한다.
- 전체 데이터 JSON이 파싱되고 검증기가 실행된다.
- 테스트와 수동 확인 결과가 단계별로 기록되어 있다.

## 11. 바로 다음 작업

다음 실제 작업은 Stage 0부터 시작한다.

첫 실행 체크리스트:

- `git status --short`
- `rg -n "cosy|Cosy|tts|TTS|voice|voice_audio|assets/voices" .`
- `rg -n "bgm|sfx|AudioStreamPlayer|audio_path|AudioServer|DIALOGUE_TEXT_SOUND" scripts scenes data tools docs README.md`
- `Select-String -Path export_presets.cfg -Pattern "name=|platform=|export_path=|variant/thread_support|progressive_web_app"`
- `Test-Path build/web/index.html`
- 기존 에디터 기능 목록 업데이트
- BGM/SFX 유지 여부 사용자 확인
- Web 내장 엔진 프리뷰를 Stage 10의 필수 목표로 둘지, 선택 목표로 둘지 사용자 확인

Stage 0 사용자 확인 후 Stage 1로 넘어간다.
