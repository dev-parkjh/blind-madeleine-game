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

## 현재 포함된 범위

- `characters`, `items`, `chapters`, `dialogues`, `story_assets` JSON 목록 조회
- 개별 JSON 로드 및 저장 API
- 새 항목 생성 API와 UI 버튼
- 항목 삭제 API와 UI 버튼
- Vite React 기반 타입별 폼, JSON, 대사 노드 편집 UI
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
