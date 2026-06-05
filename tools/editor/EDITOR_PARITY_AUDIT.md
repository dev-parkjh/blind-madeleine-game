# Editor Parity Audit

작성일: 2026-06-05

## 목적

React 에디터가 레거시 단일 HTML 에디터의 기능을 실제로 동등하게 제공하는지 기능 단위로 검증한다. `COMMIT_MIGRATION_LEDGER.md`는 커밋 단위 증거, `COMMIT_MIGRATION_ISSUES.md`는 누락 이슈, 이 문서는 전체 기능별 현재 판정과 다음 수정 순서를 기록한다.

## 검증 기준

- 데이터 동등성: 레거시가 저장하던 JSON 필드를 React 폼/JSON 편집/업로드 흐름에서 손상 없이 읽고 저장해야 한다.
- 조작 동등성: 레거시가 제공한 drag, crop, preview, ordering, 선택 제한, reset, upload, validation을 React에서 같은 목적과 안전성으로 제공해야 한다.
- 렌더 동등성: canvas/stage/thumbnail/rich text preview는 런타임 또는 레거시 계산식과 같은 좌표계, 종횡비, 정렬 기준을 사용해야 한다.
- 모바일 동등성: 터치 입력에서 목록/편집/검증/저장 흐름이 겹치지 않고, 정밀 조작은 대체 수단을 제공해야 한다.
- 검증 증거: `npm run check`, 코드 대조, 데이터 샘플 대조, 필요 시 요청 기반 시각 QA 결과를 함께 남긴다.

## 현재 판정

| 영역 | 레거시 원본 | React 위치 | 현재 상태 | 주요 남은 항목 |
|---|---|---|---|---|
| 공통 CRUD/저장/삭제/업로드 | `tools/*_editor.html` | `App`, Node API | mostly_parity | File System Access fallback은 의도적으로 제거. Node API 보안/로컬 실행 조건 문서 유지 필요. |
| 챕터 그래프/대화 배치 | `tools/chapter_editor.html` | `ChapterGraphEditor` | in_progress | graph canvas, `layout.positions` drag, 미배치 노드 추가, zoom/scroll pan, incoming edge 목록, `metadata.next_dialogue` edge editing, port 기반 연결, 연결 preview path, edge midpoint 퀵 메뉴, blackout edge detail, stale duration 정리, graph validation을 추가했다. 모바일 QA와 레거시 세부 상호작용 대조는 남음. CMI-012. |
| 챕터 패럴랙스/썸네일 | `tools/chapter_editor.html` | `ChapterArtEditor`, `ParallaxVisualEditor` | in_progress | title/overlay 전용 편집, title drag/resize, anchor drag position 보정, preview offset, wheel zoom, 선택 대상 nudge/axis lock, parallax path/transform validation, 시각 QA. |
| 캐릭터 초상/프로필 crop | `tools/character_editor.html`, `tools/dialogue_editor.html` | `CharacterEditor`, `ProfileCropFrame`, `SpectrumOffsetEditor` | mostly_parity | portrait center/profile face center/spectrum offset nudge toolbar를 추가했다. stage_cast canvas와 픽셀 동등성 재확인. |
| 대사 노드/choices/cutscene | `tools/dialogue_editor.html` | `DialogueNodesPanel`, `ChoicesEditor` | mostly_parity | choice preview는 레거시 canvas의 stage 좌표계, speaker anchor, zoom scale, side capacity, button slot 계산식을 적용했다. 픽셀 QA는 남음. CMI-013. |
| stage_cast 편집/상속 | `tools/dialogue_editor.html` | `StageCastEditor` | in_progress | scene preview는 이미지 natural size, face center, zoom/body blend, stack spread로 렌더하고 custom offset drag를 지원한다. stage_cast 지원값/범위 검증을 추가했다. 픽셀 QA는 남음. CMI-013. |
| statement/reaction/nested nodes | `tools/dialogue_editor.html` | `StatementFlowNavigator`, `StatementNodesEditor`, nested editors | mostly_parity | statement flow navigator, 선택 항목 상세 자동 스크롤, statement drag/drop 및 위/아래 이동, reaction 종료 토글, reaction child quick add를 추가했다. 레거시 graph 세부 상호작용과 모바일 touch QA는 남음. |
| BBCode/이벤트 태그 preview | `tools/dialogue_editor.html` | `RichTextPreview`, `EffectPreviewStrip` | mostly_parity | Godot RichTextLabel 픽셀 동등성은 bridge 기반 확인 필요. |
| 아이템 에디터 | `tools/item_editor.html` | `ItemEditor` | mostly_parity | name/description/image/upload/chapter scope/metadata, image preview, missing chapter 표시, 이미지 load/error 상태, 이미지 확장자 검증을 제공한다. 실제 media 로딩 QA는 남음. |
| 스토리 에셋 에디터 | `tools/asset_editor.html` | `StoryAssetEditor` | mostly_parity | kind alias 정규화, kind별 upload folder/accept, audio volume, background fixed, metadata 편집, image/audio preview, load/error 상태, missing chapter 표시, 저장 전 필드 정규화, kind별 확장자 검증을 맞췄다. 실제 media 로딩 QA는 남음. |
| Godot preview/import bridge | `tools/godot_preview_bridge.py`, `dialogue_editor.html` | bridge UI/API | mostly_parity | bridge 자동 시작은 범위 제외. 경로 설정/health/import failure UX 재검증. |
| 모바일 편집 흐름 | 레거시 반응형 CSS | app CSS/mobile panels | in_progress | MOB-010/011/012와 실제 viewport QA 필요. |

## 이번 수정 반영

- 챕터 그래프 캔버스를 React 챕터 폼에 추가했다.
- 챕터 dialogue node drag로 `layout.positions`를 draft에 저장한다.
- 미배치 dialogue를 그래프에서 바로 추가하고 zoom/scroll pan을 제공한다.
- graph edge 연결/삭제가 dialogue `metadata.next_dialogue`에 즉시 저장된다.
- graph node의 input/output port 기반 연결 시작/대상 선택과 연결 preview path를 복구했다.
- graph edge blackout/fade/hold duration 편집을 추가했다.
- graph edge 연결 해제 또는 blackout 비활성화 시 stale fade/hold duration을 제거한다.
- graph validation으로 start dialogue membership, stale layout position, next_dialogue target, blackout duration을 검사한다.
- 챕터 폼에 legacy `metadata` JSON 편집을 복구하고, `dialogue_ids`, `dialogue_id`/`first_dialogue`, `bgm_id`/`chapter_bgm`/`chapter_select_bgm` alias를 폼/그래프/저장 전 정규화/검증/요약에서 canonical 필드와 동일하게 읽도록 했다.
- 대사 전역 폼에 legacy `start`, `metadata.presentation_mode`, `metadata.next_dialogue`, `metadata.statement_notebook`, metadata JSON 편집을 복구했다. 저장 시 기본 start와 빈 metadata는 레거시 export처럼 생략하고, 검증은 `start`, 문자열형 `statement_nodes` 링크, statement notebook 참조를 런타임 해석과 같은 기준으로 검사한다.
- 일반 대사 노드의 legacy text sound muted alias(`text_sound_muted`, `typewriter_sound_muted`, `dialogue_text_sound_muted`)를 읽고, 편집 시 canonical `metadata.text_sound_muted`로 저장한다.
- 모든 리소스 폼에 legacy 파일명/ID 편집에 해당하는 `ID / filename` 필드를 추가했다. 저장 API는 JSON `id`가 현재 파일명과 다르면 대상 파일명으로 rename하고, 충돌 시 저장을 거부한다.
- choice layout preview가 레거시 canvas의 speaker anchor, zoom scale, side capacity, button slot 계산식을 사용한다.
- stage_cast scene preview가 이미지 natural size, face center, zoom/body anchor blend, position stack spread를 사용한다.
- stage_cast custom position 인물을 preview에서 직접 드래그해 `portrait_offset`을 갱신한다.
- speaker 변경이나 `speaker_mystery` 활성화 시 legacy처럼 speaker용 `stage_cast` 기본 엔트리를 자동 보강해 speaker anchor 기반 choice/stage preview가 비어 버리지 않게 했다.
- item/story asset metadata JSON 편집을 폼에 추가했다.
- story asset kind alias와 저장 전 background/audio 필드 정규화를 legacy export 정책에 맞췄다.
- item/story asset preview와 missing chapter scope 표시를 복구했다.
- dialogue/item/story asset chapter scope는 legacy alias(`chapters`, `chapter_ids`, `metadata.chapters`, `metadata.chapter_ids`)를 폼/검증/저장 전 정규화에서 모두 읽고 canonical `chapters`로 반영한다.
- portrait center/profile face center nudge toolbar를 추가했다.
- 캐릭터 `spectrum_offset`을 legacy 300x380 canvas, face anchor 0.5/0.34, 300% portrait zoom 기준으로 직접 drag/nudge 편집할 수 있게 하고, character metadata 전체 JSON 편집을 복구했다.
- 캐릭터 저장 전 정규화는 legacy export처럼 기본 portrait center/profile/spectrum offset을 축약하고, string portrait shorthand와 `profile.center`를 손상 없이 보존한다. string portrait shorthand는 폼/stage_cast preview에서도 경로로 표시하고 편집 시 객체 portrait로 승격한다.
- statement flow navigator로 진술/reaction/nested node 탐색, 선택 상세 자동 스크롤, statement 순서 이동, reaction child quick add를 복구했다.
- parallax 선택 layer/title nudge toolbar와 X/Y drag axis lock을 추가했다.
- stage_cast custom position nudge toolbar를 추가했다.
- 패럴랙스 stage의 CSS background 중복 렌더링을 제거했다.
- 숨김 레이어를 stage 미리보기에서 제외했다.
- 비선택 레이어는 stage에서 선택만 되고 이동 drag가 시작되지 않도록 제한했다.
- 패럴랙스 레이어는 legacy alias(`type`, `image`, `texture`, `x/y`, `center/focus/pivot`, `motionStrength/shake_strength/floating_strength`)를 stage, form, thumbnail, validation에서 모두 읽고, 편집 시 canonical `kind/path/position/anchor/motion_strength` 계열로 갱신한다.
- 이미지 실제 종횡비를 읽어 레거시의 stage width/height 계산식을 React stage에 적용했다.
- anchor drag가 레거시처럼 anchor와 position을 함께 보정하도록 수정했다.
- `scale_x`/`scale_y` 편집 필드를 React 패럴랙스 레이어 폼에 추가했다.
- 패럴랙스 layer scale drag와 uniform scale 입력은 `scale_x`/`scale_y`가 이미 있는 레이어에서도 실제 크기가 바뀌도록 세 값을 함께 갱신한다.
- `parallax.overlay`와 `parallax.title`을 전용 폼과 stage 미리보기에 반영한다.
- title은 stage에서 선택 후 이동/scale 조작할 수 있게 했다.
- Ctrl+wheel zoom은 선택된 레이어/title에만 적용되도록 복구했다.
- 우클릭 drag preview offset과 depth/perspective 표시를 복구하고 pointer up 시 원점으로 되돌린다.
- JSON parse 오류는 줄/열, 오류 줄 excerpt, textarea 커서 이동 버튼을 제공한다.
- stage_cast mini index로 preview sprite와 상세 row 선택 상태를 동기화하고 선택 row 자동 스크롤을 제공한다.
- parallax layer mini index로 stage 선택, index 선택, accordion 상세 row 선택을 동기화하고 선택 row 자동 스크롤을 제공한다.
- item/story asset media preview에 load/error 상태 표시를 추가하고, item image 및 story asset kind별 확장자 검증을 추가했다.
- chapter thumbnail과 parallax overlay/title/layer path, position/anchor/scale/depth/perspective/motion_strength/opacity 검증을 추가했다.
- stage_cast position/custom offset/order/speed/opacity/zoom 검증과 cutscene/popup image 검증을 추가했다.
- cutscene/blackout 노드는 `mode/type`, `blackout_enabled/is_blackout`, `cutscene/blackout`, top-level image/duration alias를 읽고 편집 시 canonical `mode: "cutscene"` + `cutscene` 객체로 정리한다.
- acquire_info는 객체형, legacy 보상 배열형, 런타임 alias(`acquired_info`, `acquire_on_complete`, `rewards`, `entries`)를 모두 읽고, character/item 참조, narrator 무효값, 빈 ID, 중복 ID를 검증한다. 편집 시 canonical `acquire_info`로 정리한다.
- statement reaction은 legacy `lies`와 canonical `statement_lies`를 모두 읽고, 편집 시 `statement_lies`로 정리한다. `speaker_mystery`도 legacy `mystery_speaker`를 읽고 편집 시 canonical 키로 저장한다.
- popup 검증은 `popups`와 legacy `popup_images` alias를 함께 보고, source별 target/path 필수 조건과 source/position/transition/image_mode 지원값, offset/size/scale/opacity/image_zoom 범위를 검사한다. 편집 시 canonical `popups`로 정리한다.
- choices 검증은 런타임 로더 기준에 맞춰 choices/choice.nodes 배열 구조, choice 객체 여부, set_flags 객체, conditions 배열을 검사한다.
- popup preview는 1920x1080 좌표계와 레거시 position preset을 사용하고 direct image/item/character profile source를 실제 frame 안에 렌더한다. frame drag는 `position: custom`과 offset을 갱신하고, 선택 popup에는 nudge toolbar를 제공한다.
- choices editor는 레거시 drag handle 기반 정렬과 버튼 기반 정렬을 모두 제공한다.
- project summary에 검증용 최소 메타데이터를 추가해 stage_cast/popup character portrait key와 popup item image 존재 여부를 레거시 validation처럼 검사한다.

## 다음 반복 우선순위

1. stage_cast와 choice layout preview의 픽셀 QA를 Godot/legacy canvas 기준으로 수행한다.
2. 패럴랙스 stage/thumbnail, stage_cast, choice preview, 챕터 그래프는 요청 기반 실제 viewport QA로 최종 확인한다.
3. 모바일 390x844, 430x932, 768x1024에서 터치 타깃과 텍스트 overflow를 요청 기반 viewport QA로 확인한다.
4. story asset media preview의 실제 재생/이미지 로딩을 요청 기반 viewport QA로 확인한다.

## 검증 로그

- 2026-06-05: `npm run check` 통과.
- 2026-06-05: `npm run build` 통과. `/repo/assets/fonts/PretendardVariable.ttf`는 Vite 런타임 해석 경고로 남음.
- 2026-06-05: `git diff --check` 통과.
