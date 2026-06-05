# Blind Madeleine Local Editor

Node 기반 통합 에디터입니다. 기존 `tools/*.html` 단일 파일 에디터를 대체하기 위해 `data/**` JSON을 로컬 API로 읽고 쓰고, 화면은 Vite + React + TypeScript로 구성합니다.

## 실행

```bash
cd tools/editor
npm install
npm run dev
```

기본 서버는 `0.0.0.0:5177`에 바인딩됩니다. 같은 컴퓨터에서는 `http://127.0.0.1:5177`, 같은 네트워크의 다른 컴퓨터에서는 `http://<에디터 실행 컴퓨터 IP>:5177`로 접속할 수 있습니다. `npm run dev`는 같은 Node 서버 안에서 API와 Vite middleware를 함께 실행합니다.

빌드 후 실행:

```bash
cd tools/editor
npm run build
npm run start
```

포트를 바꾸려면 `PORT=5180 npm run dev`처럼 실행합니다. 같은 컴퓨터에서만 열고 싶다면 `HOST=127.0.0.1 npm run dev`처럼 실행합니다.

주의: 이 에디터는 로컬 프로젝트의 `data/**` JSON을 저장/삭제할 수 있으므로 신뢰하는 네트워크에서만 실행해야 합니다.

## Godot 미리보기

대사 노드의 `Godot` 버튼은 preview bridge가 실행 중일 때 동작합니다.
에디터 서버는 기본적으로 OS를 감지해 로컬 preview bridge를 자동 실행합니다. 이미 `127.0.0.1:51234` bridge가 떠 있으면 재사용하고, `GODOT_PREVIEW_ENDPOINT`로 외부 bridge를 지정한 경우에는 자동 실행하지 않습니다. 자동 실행을 끄려면 `GODOT_PREVIEW_AUTO_START=0 npm run start`처럼 실행합니다.

같은 bridge는 에셋 업로드 후 Godot import도 처리합니다. Bridge가 실행 중이고 Godot 실행 파일 경로가 설정되어 있으면 업로드 완료 후 `godot --headless --import`가 자동 실행되어 `<asset>.import`와 `.godot/imported` 캐시가 갱신됩니다. Bridge가 없으면 업로드는 유지되고 화면에는 import 대기 상태가 표시됩니다.

자동 실행이 실패했거나 bridge만 별도로 띄우고 싶다면 아래 스크립트를 사용합니다.

```bash
tools/run_godot_preview_bridge.bat
# macOS/Linux
tools/run_godot_preview_bridge.sh
```

Godot 실행 파일이 `PATH`에 없다면 bridge 실행 시 경로를 넘기거나, 에디터의 대사 노드 패널에서 `Godot preview 설정`을 열어 `Godot executable path`를 입력한 뒤 `설정`을 누릅니다.

```bash
tools/run_godot_preview_bridge.bat "C:\path\to\Godot.exe"
# macOS
tools/run_godot_preview_bridge.sh "/Applications/Godot.app"
```

bridge는 에디터 서버가 실행 중인 컴퓨터에서 실행합니다. 에디터 UI의 bridge endpoint 기본값은 같은 origin의 `/api/godot-preview`이며, 에디터 서버가 내부적으로 `http://127.0.0.1:51234` bridge로 프록시합니다. 다른 포트나 호스트를 쓰는 경우 서버 실행 시 `GODOT_PREVIEW_ENDPOINT=http://127.0.0.1:51235 npm run start`처럼 지정하거나, UI의 `Godot preview 설정`에서 직접 endpoint를 바꿀 수 있습니다. URL query `?godot_preview_endpoint=...`도 지원합니다.

대사 노드의 `stage_cast` 무대 캐스트 미리보기에서 `PC`, `Fold7`, `Fold7 펼침`은 Godot Web export를 iframe으로 표시합니다. 처음 사용 전 또는 런타임 코드/에셋이 바뀐 뒤에는 해당 미리보기 영역의 `웹 빌드` 버튼으로 `build/web/index.html`을 갱신하세요. 일반 편집 중에는 `새로고침`이 현재 대사 draft를 preview payload로 전달하므로 매번 웹 export를 다시 만들 필요는 없습니다.

## 현재 포함된 범위

- `characters`, `items`, `chapters`, `dialogues`, `story_assets` JSON 목록 조회
- 개별 JSON 로드 및 저장 API
- 새 항목 생성 API와 UI 버튼
- 항목 삭제 API와 UI 버튼
- Vite React 기반 타입별 폼, JSON, 대사 노드 편집 UI
- 대사/진술/nested 대사 본문의 BBCode rich text preview와 이벤트 marker
- 대사/진술/nested 대사 choices 편집, 선택지 BBCode preview, next 검증
- Material Design 3 Expressive 방향의 작업 UI
- 로컬 `assets/icon/mui` SVG 아이콘과 `assets/fonts/PretendardVariable.ttf` 사용
- 마이그레이션 기록: `MIGRATION_LOG.md`
- 커밋별 분석 로그: `COMMIT_MIGRATION_LEDGER.md`
- 커밋 분석 이슈 관리: `COMMIT_MIGRATION_ISSUES.md`
- 모바일 편집 소급 백로그: `MOBILE_EDITOR_BACKLOG.md`

## API

- `GET /api/health`
- `GET /api/project/summary`
- `GET /api/resources`
- `GET /api/resources/:type`
- `POST /api/resources/:type`
- `GET /api/resources/:type/:id`
- `PUT /api/resources/:type/:id`
- `DELETE /api/resources/:type/:id`

Godot preview bridge:

- `GET /health`
- `GET /config`
- `POST /config`
- `POST /import`
- `POST /preview`
- `POST /web-preview/build`
- `POST /web-preview/prepare`
- `GET /web-preview/*`

에디터 서버 프록시:

- `GET /api/godot-preview/health`
- `POST /api/godot-preview/config`
- `POST /api/godot-preview/import`
- `POST /api/godot-preview/preview`
- `POST /api/godot-preview/web-preview/build`
- `POST /api/godot-preview/web-preview/prepare`
- `GET /api/godot-preview/web-preview/*`
