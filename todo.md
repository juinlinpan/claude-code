# src_remake 重構 Todo

根據 `research/` 下的研究文件，規劃將現有 `src/` 以更清晰的 frontend / backend 邊界重建成 `src_remake/`。

---

## 原則

- **只搬運，不重寫**：只移動既有 `.ts` / `.tsx` 檔案，只修改 import/export/require 路徑，不改 function body、type 名稱、runtime 邏輯。
- **每個 PR 只搬一個 module 或一組相依 module**。
- **搬完後用 diff 驗證**：非路徑修改全部退回。
- 若檔案同時包辦 frontend/backend，先進 `src_remake/unresolved-fullstack/`，不在第一版硬拆。

---

## 目標結構

```text
src_remake/
  backend/
    app/
    runtime/
    agent/
    tools/
    session/
    context-management/
    memory/
    mcp/
    skills/
    plugins/
    hooks/
    permissions/
    persistence/
    remote-control/
    platform/
    observability/
    backend-api/
  frontend/
    cli/
    tui/
    hooks/
    state/
    commands/
    voice/
    shared/
  shared/
    protocol/
    types/
    constants/
    utils/
  unresolved-fullstack/
```

---

## Phase 0：前置作業與歸類確認

目的：在動 code 之前，確認所有 `src/*` 都有新位置。

- [ ] 確認 `research/new_structure.md` 已描述所有 module 的目標位置
- [ ] 確認 `research/reform.md` 的搬遷總表涵蓋所有頂層 `src/*`
- [ ] 確認每個 fullstack 檔案都已標記進 `unresolved-fullstack/`
- [ ] 建立 `src_remake/` 頂層資料夾（含 `backend/`、`frontend/`、`shared/`、`unresolved-fullstack/` 空資料夾）
- [ ] 建立 `src_remake/` 下所有子資料夾骨架（見目標結構）
- [ ] 在 `src_remake/` 加入 `README.md`，說明分層邊界定義

---

## Phase 1：搬 shared 與低風險 backend

目的：先搬被依賴端，降低後續搬移衝突。

### 1-1 `src_remake/shared/types/`

來源：`src/types/**`（domain exception 另搬）

- [ ] git mv 搬移所有 `src/types/*.ts`
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 1-2 `src_remake/shared/constants/`

來源：`src/constants/**`（domain exception 另搬）

- [ ] git mv 搬移所有 `src/constants/*.ts`
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 1-3 `src_remake/shared/utils/`

來源：`src/utils/*.ts`（無 domain 的 pure utility，排除 settings/permissions/sandbox/sessionStorage 等）

- [ ] 識別無 domain 依賴的 pure util 清單
- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 1-4 `src_remake/shared/protocol/`

來源：後續新增或由 shared types 搬入，第一版可先建空資料夾

- [ ] 建立空資料夾並放 `.gitkeep`

### 1-5 `src_remake/backend/platform/`

來源：`src/native-ts/**`、`src/utils/bash/**`、`src/utils/git/**`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 1-6 `src_remake/backend/observability/`

來源：`src/services/analytics/**`、`src/utils/telemetry/**`、`src/cost-tracker.ts`、`src/costHook.ts`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 1-7 `src_remake/backend/backend-api/`

來源：`src/services/api/**`、`src/utils/model/**`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 1-8 `src_remake/backend/persistence/`

來源：`src/utils/settings/**`、`src/utils/secureStorage/**`、`src/migrations/**`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

---

## Phase 2：搬 backend domain

目的：把核心 runtime/domain 能力搬到 backend。

### 2-1 `src_remake/backend/session/`

來源：`src/utils/sessionStorage.ts`、`src/utils/sessionStoragePortable.ts`、`src/assistant/sessionHistory.ts`、`src/utils/conversationRecovery.ts`、`src/utils/concurrentSessions.ts`、`src/utils/crossProjectResume.ts`、`src/utils/listSessionsImpl.ts`、`src/utils/transcriptSearch.ts`、`src/types/logs.ts`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 2-2 `src_remake/backend/context-management/`

來源：`src/services/compact/**`、`src/query/tokenBudget.ts`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 2-3 `src_remake/backend/memory/`

來源：`src/memdir/**`、`src/services/SessionMemory/**`、`src/services/autoDream/**`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 2-4 `src_remake/backend/mcp/`

來源：`src/services/mcp/**`、`src/tools/MCPTool/**`、`src/tools/ListMcpResourcesTool/**`、`src/tools/ReadMcpResourceTool/**`、`src/tools/McpAuthTool/**`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 2-5 `src_remake/backend/skills/`

來源：`src/skills/**`、`src/tools/SkillTool/**`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 2-6 `src_remake/backend/plugins/`

來源：`src/plugins/**`、`src/utils/plugins/**`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 2-7 `src_remake/backend/hooks/`

來源：`src/utils/hooks/**`、`src/schemas/hooks.ts`、`src/query/stopHooks.ts`、`src/services/tools/toolHooks.ts`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 2-8 `src_remake/backend/permissions/`

來源：`src/utils/permissions/**`、`src/utils/sandbox/**`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 2-9 `src_remake/backend/remote-control/`

來源：`src/bridge/**`、`src/remote/**`、`src/server/**`、`src/upstreamproxy/**`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 2-10 `src_remake/backend/agent/`

來源：`src/Task.ts`、`src/tasks.ts`、`src/tasks/**`、`src/coordinator/**`、`src/tools/AgentTool/**`、`src/tools/Task*Tool/**`、`src/tools/Team*Tool/**`、`src/tools/SendMessageTool/**`、`src/tools/shared/spawnMultiAgent.ts`、`src/utils/swarm/**`、`src/utils/task/**`、`src/utils/tasks.ts`、`src/utils/forkedAgent.ts`、`src/utils/teammate*.ts`、`src/utils/teamDiscovery.ts`、`src/utils/teamMemoryOps.ts`、`src/utils/directMemberMessage.ts`、`src/utils/inProcessTeammateHelpers.ts`、`src/utils/ultraplan/**`、`src/services/AgentSummary/**`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 2-11 `src_remake/backend/tools/`

來源：`src/Tool.ts`、`src/tools.ts`、其餘 `src/tools/*Tool/**`（非 agent/mcp/skill）、`src/services/lsp/**`、`src/utils/todo/**`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 2-12 `src_remake/backend/runtime/`

來源：`src/QueryEngine.ts`、`src/query.ts`、`src/query/config.ts`、`src/query/deps.ts`、`src/services/tools/toolExecution.ts`、`src/services/tools/toolOrchestration.ts`、`src/services/tools/StreamingToolExecutor.ts`、相關 util（`queryContext.ts`、`queryHelpers.ts`、`queryProfiler.ts`、`processUserInput/**`、`messages/**`、`messages.ts`、`messagePredicates.ts`、`messageQueueManager.ts`、`contentArray.ts`、`controlMessageCompat.ts`、`embeddedTools.ts`、`groupToolUses.ts`、`toolPool.ts`、`toolErrors.ts`、`toolSchemaCache.ts`）、`src/entrypoints/sdk/**`、`src/entrypoints/agentSdkTypes.ts`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 2-13 `src_remake/backend/app/`

來源：`src/bootstrap/**`、`src/projectOnboardingState.ts`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

---

## Phase 3：搬 frontend CLI/TUI

目的：把現有 CLI/TUI 以 frontend 身分整理出來。

### 3-1 `src_remake/frontend/tui/`

來源：`src/components/**`、`src/screens/**`、`src/ink/**`、`src/outputStyles/**`、`src/moreright/**`、`src/buddy/**`、`src/ink.ts`、`src/dialogLaunchers.tsx`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 3-2 `src_remake/frontend/tui/context/`

來源：`src/context/**`、`src/context.ts`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 3-3 `src_remake/frontend/tui/keybindings/` 與 `vim/`

來源：`src/keybindings/**`、`src/vim/**`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 3-4 `src_remake/frontend/hooks/`

來源：`src/hooks/**`（排除 `useMainLoopModel.ts`，已進 backend/runtime）

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 3-5 `src_remake/frontend/state/`

來源：`src/state/**`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 3-6 `src_remake/frontend/voice/`

來源：`src/voice/**`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 3-7 `src_remake/frontend/commands/`

來源：`src/commands/**`、`src/commands.ts`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

### 3-8 `src_remake/frontend/cli/`

來源：`src/cli/**`、`src/history.ts`

- [ ] git mv 搬移
- [ ] 更新 import 路徑
- [ ] typecheck 通過

---

## Phase 4：標記 unresolved-fullstack

目的：不在搬運階段硬拆複雜的 fullstack 檔案。

- [ ] git mv `src/main.tsx` -> `src_remake/unresolved-fullstack/main.tsx`
- [ ] git mv `src/setup.ts` -> `src_remake/unresolved-fullstack/setup.ts`
- [ ] git mv `src/replLauncher.tsx` -> `src_remake/unresolved-fullstack/replLauncher.tsx`
- [ ] git mv `src/interactiveHelpers.tsx` -> `src_remake/unresolved-fullstack/interactiveHelpers.tsx`
- [ ] 檢視 `src/commands/**` 中同時 render UI 又直接做 runtime action 的 command，標記並移入 `unresolved-fullstack/`
- [ ] 更新 import 路徑
- [ ] typecheck 通過

---

## Phase 5：Build 與 Typecheck 全局驗證

- [ ] 執行 `tsc --noEmit`（或對應 typecheck 指令），確認整個 `src_remake/` 無 TS 錯誤
- [ ] 執行 build（如 `npm run build`）確認可打包
- [ ] 執行現有測試，確認無迴歸

---

## Phase 6：設定檔更新

- [ ] 更新 `tsconfig.json` 的 `paths` alias 與 `rootDir`/`include` 指向 `src_remake/`
- [ ] 更新 build script（`package.json` 等）中所有 `src/` 路徑指向 `src_remake/`
- [ ] 更新 jest/vitest 的 `moduleNameMapper` 與 `roots`
- [ ] 更新 `.eslintrc` / `.eslintignore` 等 linter 路徑

---

## Phase 7：清理舊 src/（可選，待確認）

> 確認 `src_remake/` 完全可以取代 `src/` 後才執行。

- [ ] 確認無任何 import 仍指向舊 `src/`
- [ ] 刪除舊 `src/` 資料夾
- [ ] 最終 typecheck + build + test

---

## 每次搬移的標準流程

1. 建立目標資料夾。
2. 用 `git mv` 搬移 module 清單中的檔案。
3. 只更新 import/export/require path。
4. 執行 typecheck 或 build。
5. 用 `git diff` 確認沒有非路徑修改。
6. 在 PR description 列出「搬了哪些檔案」和「沒有改哪些行為」。

---

## 參考文件

- `research/new_structure.md`：目標架構全覽（module 詳細清單）
- `research/reform.md`：搬移順序、規則、驗收標準
- `research/modules.md`：各 module 功能定義
- `research/harness.md`：Agent Harness 角度的 repo overview
- `research/behavior.md`：後端視角的模組地圖
