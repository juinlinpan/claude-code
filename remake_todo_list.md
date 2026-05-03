# src_remake Remake Todo List

## 目標

- 在不破壞既有 `src/` 執行路徑的前提下，於 `src_remake/` 建立新的分層結構。
- 依 `research/new_structure.md` 與 `research/reform.md` 的搬運原則推進，不先重寫 runtime 邏輯。
- 先從低風險、邊界清楚的模組開始搬，逐步降低後續大模組的相依複雜度。

## 搬運原則

- 目前階段以平行重構為主：`src/` 保持原狀，`src_remake/` 逐步建立新結構。
- 第一階段允許新檔暫時依賴既有 `src/` 內的 utility，等 shared/platform/persistence 穩定後再回收這些 legacy import。
- 先搬 shared 與低風險 backend，再搬 session/context/memory，最後處理 runtime、tools、agent 與 frontend。
- 若檔案同時扮演 frontend/backend，先記錄在 `src_remake/unresolved-fullstack/` 對應區塊，不硬拆。

## Phase 0: 對齊目標結構

- [x] 建立 `src_remake/` 根目錄。
- [x] 建立 backend/frontend/shared/unresolved-fullstack 分層骨架。
- [x] 寫出初版 remake 計畫與模組路由表。
- [ ] 補一份 top-level import/legacy 相依規則。

## Phase 1: Shared 與低風險 Backend

- [x] 建立 `src_remake/shared/constants/` 並挑出第一批 pure constants。
- [x] 建立 `src_remake/shared/types/` 並搬第一批 cross-layer types。
- [ ] 建立 `src_remake/backend/platform/` 的 legacy adapter 收納區。
- [ ] 建立 `src_remake/backend/persistence/` 的設定與檔案存取入口。
- [x] 搬入 `projectOnboardingState` 到 `src_remake/backend/app/` 作為第一個新模組。
- [ ] 盤點 `src/bootstrap/` 可直接搬入 `src_remake/backend/app/` 的 leaf module。

## Phase 2: Backend Domain

- [ ] `session/`: transcript、resume、session history。
- [ ] `context-management/`: token budget、compact、message budgeting。
- [ ] `memory/`: memdir、session memory、autoDream。
- [ ] `mcp/`: MCP transport、tool/resource 整合。
- [ ] `permissions/`: policy、sandbox、approval flow。
- [ ] `plugins/` 與 `skills/`: registry 與載入層。
- [ ] `tools/`: 通用 tool executable code。
- [ ] `agent/`: task、subagent、swarm。
- [ ] `runtime/`: QueryEngine、query loop、tool orchestration。

## Phase 3: Frontend

- [ ] `frontend/cli/`: CLI command registry 與輸出層。
- [ ] `frontend/commands/`: slash/command UI layer。
- [ ] `frontend/tui/`: components、screens、ink。
- [ ] `frontend/hooks/` 與 `frontend/state/`: React/TUI 狀態管理。
- [ ] `frontend/voice/`: voice mode 與相關 UI。

## Phase 4: Fullstack 邊界清理

- [ ] 標記第一批 unresolved fullstack 檔案。
- [ ] 建立拆分清單：`main.tsx`, `setup.ts`, `replLauncher.tsx`, `interactiveHelpers.tsx`。
- [ ] 為每個 unresolved 模組寫出未來拆分策略：frontend/backend/shared。

## 目前已開始的實作

- 新增 `src_remake/README.md`，作為新結構的入口說明。
- 新增 `src_remake/module-map.ts`，把研究文件整理成可追蹤的程式化路由表。
- 新增 `src_remake/backend/app/projectOnboardingState.ts`，作為第一個搬入新結構的模組。
- 新增 `src_remake/shared/constants/common.ts` 與 `src_remake/shared/types/ids.ts`，建立第一批 shared foundations。

## 下一步

1. 先補 `shared/constants` 與 `shared/types` 的第一批基礎檔案，減少 `src_remake/backend/app/` 對 legacy `src/` 的依賴。
2. 接著盤點 `src/bootstrap/` 中可直接平移的 leaf modules，擴大 `backend/app/`。
3. 等 shared/platform/persistence 有最小可用基底後，再開始 session/context-management 的搬運。