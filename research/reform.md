# Frontend / Backend 搬運重構計畫

## 目標

這份計畫描述如何把目前 `src/` 內混在一起的 CLI/TUI、runtime、agent、tools、session、memory、MCP、platform 等 code，搬成有 frontend/backend 邊界的架構。

這版的核心觀點：

- CLI 是一種 frontend。
- React/Ink terminal UI 是 frontend。
- 只跟 UI、輸入、提示、dialog、terminal rendering 有關的 code 放 `src/frontend/`。
- agent runtime、LLM loop、tool execution、session persistence、memory、MCP、permissions、platform adapter、API client 放 `src/backend/`。
- 前後端共用的 protocol/type/constant/pure util 放 `src/shared/`。
- 同時包辦 frontend/backend 的 code 第一版放 `src/unresolved-fullstack/`，不硬拆。

這仍然是搬運型重構，不是重寫。

## 硬性限制

允許：

- 搬移既有 `.ts`, `.tsx`, `.js` 檔案。
- 搬移既有資料夾。
- 更新因搬移造成的 `import ... from`, `export ... from`, dynamic `require(...)` 路徑。
- 更新 tsconfig/path alias、build script、test path 這類「找檔案」設定。

禁止：

- 改 function body。
- 改 type/interface 名稱或欄位。
- 改 runtime 邏輯。
- 改 formatting。
- 為了前後分離而拆檔、合檔、改命名。
- 假裝已經分離，但其實檔案仍同時做 UI 與 runtime。

驗收標準：

- 每個搬移檔案除了 import/export/require path 之外，內容應與原檔一致。
- 每個 PR 只搬一個 module 或一組相依 module。
- 若檔案同時包辦 frontend/backend，先進 `src/unresolved-fullstack/`。
- 搬移後用 diff 檢查：非路徑修改都必須退回。

## 目標架構

```text
src/
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

完整 module 內容見 `research/new_structure.md`。

## 搬移階段

### Phase 0: 文件同步與歸類確認

目的：先確認所有 `src/*` 都有新位置，不開始搬 code。

工作：

- 維護 `research/new_structure.md` 作為目標架構。
- 維護本文件作為搬移計畫。
- 確認每個頂層 `src/*` 都出現在搬遷總表。
- 確認 fullstack code 先標到 `src/unresolved-fullstack/`。

驗收：

- PM 可以從 `new_structure.md` 判斷功能歸屬。
- 工程師可以從本文件知道搬移順序。

### Phase 1: 搬 shared 與低風險 backend

目的：先搬被依賴端，降低後續搬移衝突。

建議順序：

1. `src/shared/`
2. `src/backend/platform/`
3. `src/backend/observability/`
4. `src/backend/backend-api/`
5. `src/backend/persistence/`

原因：

- 這些多半是 leaf/helper/client。
- 通常不直接 render UI。
- 搬完後可讓後續 domain import 更穩定。

### Phase 2: 搬 backend domain

目的：把核心 runtime/domain 能力搬到 backend。

建議順序：

1. `src/backend/session/`
2. `src/backend/context-management/`
3. `src/backend/memory/`
4. `src/backend/mcp/`
5. `src/backend/skills/`
6. `src/backend/plugins/`
7. `src/backend/hooks/`
8. `src/backend/permissions/`
9. `src/backend/remote-control/`
10. `src/backend/agent/`
11. `src/backend/tools/`
12. `src/backend/runtime/`

注意：

- `runtime/`, `tools/`, `agent/` import 範圍最大，靠後搬。
- tool folder 中的 `UI.tsx` 第一版可先跟 tool 留在 backend tools，因為本次不拆檔。後續若做真正前後分離，再移到 frontend。
- MCP/Skill/Agent tool calls 仍是 backend executable code，不是 frontend。

### Phase 3: 搬 frontend CLI/TUI

目的：把現有 CLI/TUI 以 frontend 身分整理出來。

建議順序：

1. `src/frontend/tui/`
2. `src/frontend/hooks/`
3. `src/frontend/state/`
4. `src/frontend/voice/`
5. `src/frontend/commands/`
6. `src/frontend/cli/`

注意：

- CLI command 是 frontend，因為它處理使用者輸入、stdout/stderr、互動流程。
- command 如果同時直接執行 domain action，第一版仍可搬到 frontend commands；後續再把 domain action 抽到 backend service。
- React/Ink 相關全部屬於 frontend。

### Phase 4: 標記 unresolved fullstack

目的：不在搬運階段硬拆複雜檔案。

第一版先放：

```text
src/main.tsx
src/setup.ts
src/replLauncher.tsx
src/interactiveHelpers.tsx
```

也可放：

```text
src/commands/** 中同時 render UI 並直接做 runtime action 的 command
src/tools/** 中同時包含 executable code 與 UI.tsx 的 tool folder
src/components/** 中直接呼叫 backend side effect 的 component
src/hooks/** 中同時操作 UI state 與 runtime side effect 的 hook
```

後續真正前後分離時，再拆成：

```text
frontend -> input/render/navigation
backend  -> service/API/runtime action
shared   -> DTO/schema/type
```

## Module 搬移摘要

### Backend

| Module | 功能 | 主要來源 |
| --- | --- | --- |
| `src/backend/app/` | backend bootstrap state | `src/bootstrap/**`, `src/projectOnboardingState.ts` |
| `src/backend/runtime/` | LLM turn loop、QueryEngine、tool execution loop | `src/QueryEngine.ts`, `src/query.ts`, `src/services/tools/**` |
| `src/backend/agent/` | agents、tasks、swarm、agent-owned tools | `src/Task.ts`, `src/tasks.ts`, `src/tasks/**`, `src/tools/AgentTool/**` |
| `src/backend/tools/` | 通用 LLM tool call executable code | `src/Tool.ts`, `src/tools.ts`, `src/tools/*Tool/**` |
| `src/backend/session/` | transcript、resume、session history | `src/utils/sessionStorage.ts`, `src/assistant/sessionHistory.ts` |
| `src/backend/context-management/` | token budget、compact | `src/services/compact/**`, `src/query/tokenBudget.ts` |
| `src/backend/memory/` | project/session/team memory | `src/memdir/**`, `src/services/SessionMemory/**`, `src/services/autoDream/**` |
| `src/backend/mcp/` | MCP client/config/tools/resources | `src/services/mcp/**`, `src/tools/MCPTool/**` |
| `src/backend/skills/` | skill registry、SkillTool | `src/skills/**`, `src/tools/SkillTool/**` |
| `src/backend/plugins/` | plugin registry、marketplace | `src/plugins/**`, `src/utils/plugins/**` |
| `src/backend/hooks/` | hook schema/config/executor | `src/utils/hooks/**`, `src/schemas/hooks.ts` |
| `src/backend/permissions/` | permission policy、sandbox | `src/utils/permissions/**`, `src/utils/sandbox/**` |
| `src/backend/persistence/` | settings、secure storage、migrations | `src/utils/settings/**`, `src/utils/secureStorage/**`, `src/migrations/**` |
| `src/backend/remote-control/` | bridge、remote session、teleport | `src/bridge/**`, `src/remote/**`, `src/server/**` |
| `src/backend/platform/` | shell/git/fs/native adapters | `src/native-ts/**`, `src/utils/bash/**`, `src/utils/git/**` |
| `src/backend/observability/` | analytics、logs、diagnostics | `src/services/analytics/**`, `src/utils/telemetry/**` |
| `src/backend/backend-api/` | provider/backend API client | `src/services/api/**`, `src/utils/model/**` |

### Frontend

| Module | 功能 | 主要來源 |
| --- | --- | --- |
| `src/frontend/cli/` | CLI frontend、args、stdout、command registry | `src/cli/**`, `src/commands.ts` |
| `src/frontend/tui/` | React/Ink terminal UI | `src/components/**`, `src/screens/**`, `src/ink/**` |
| `src/frontend/hooks/` | React/UI hooks | `src/hooks/**` |
| `src/frontend/state/` | frontend in-memory AppState | `src/state/**` |
| `src/frontend/commands/` | slash/CLI command UI layer | `src/commands/**` |
| `src/frontend/voice/` | voice mode UI/input | `src/voice/**`, voice hooks |
| `src/frontend/shared/` | frontend-only helpers | UI-only utils |

### Shared

| Module | 功能 | 主要來源 |
| --- | --- | --- |
| `src/shared/protocol/` | frontend/backend DTO/schema | 後續新增或由 shared types 搬入 |
| `src/shared/types/` | cross-layer types | `src/types/**`，domain exception 除外 |
| `src/shared/constants/` | cross-layer constants | `src/constants/**`，domain exception 除外 |
| `src/shared/utils/` | pure utility | 無 domain 的 `src/utils/*.ts` |

### Unresolved Fullstack

| Module | 功能 | 主要來源 |
| --- | --- | --- |
| `src/unresolved-fullstack/` | 暫放同時包辦 frontend/backend 的 code | `src/main.tsx`, `src/setup.ts`, `src/replLauncher.tsx`, `src/interactiveHelpers.tsx` |

## PM 功能索引

| PM 想改的功能 | 第一個要看的位置 |
| --- | --- |
| CLI 參數、stdout、command routing | `src/frontend/cli/` |
| Terminal UI / dialog / screens | `src/frontend/tui/` |
| React hooks / notification hooks | `src/frontend/hooks/` |
| current process UI state | `src/frontend/state/` |
| 對話/agent 主流程 | `src/backend/runtime/` |
| LLM tool call executable code | `src/backend/tools/` |
| agent / subagent / tasks | `src/backend/agent/` |
| MCP server/tool/resource | `src/backend/mcp/` |
| hooks executor/config | `src/backend/hooks/` |
| skills | `src/backend/skills/` |
| plugins / marketplace | `src/backend/plugins/` |
| remote control / mobile / bridge | `src/backend/remote-control/` |
| context compact / token budget | `src/backend/context-management/` |
| memory | `src/backend/memory/` |
| permissions / sandbox | `src/backend/permissions/` |
| session history / resume / rewind | `src/backend/session/` |
| model/backend API | `src/backend/backend-api/` |
| analytics / logs / usage | `src/backend/observability/` |
| shell / git / native integration | `src/backend/platform/` |
| 同時包前後端、尚未拆分 | `src/unresolved-fullstack/` |

## 原本 `src/*` 搬遷總表

| 原本位置 | 新位置 |
| --- | --- |
| `src/assistant/**` | `src/backend/session/` |
| `src/bootstrap/**` | `src/backend/app/bootstrap/` |
| `src/bridge/**` | `src/backend/remote-control/bridge/` |
| `src/buddy/**` | `src/frontend/tui/buddy/` |
| `src/cli/**` | `src/frontend/cli/` |
| `src/commands/**` | `src/frontend/commands/`，domain action 仍由 backend 提供 |
| `src/components/**` | `src/frontend/tui/components/` 或 domain UI |
| `src/constants/**` | `src/shared/constants/`，domain exception 另搬 |
| `src/context/**` | `src/frontend/tui/context/` |
| `src/coordinator/**` | `src/backend/agent/coordinator/` |
| `src/entrypoints/**` | `src/backend/app/entrypoints/`，MCP/SDK 例外另搬 |
| `src/hooks/**` | `src/frontend/hooks/`，backend hook executor 例外另搬 |
| `src/ink/**` | `src/frontend/tui/ink/` |
| `src/keybindings/**` | `src/frontend/tui/keybindings/` |
| `src/memdir/**` | `src/backend/memory/project/` |
| `src/migrations/**` | `src/backend/persistence/migrations/` |
| `src/moreright/**` | `src/frontend/tui/moreright/` |
| `src/native-ts/**` | `src/backend/platform/native-ts/` |
| `src/outputStyles/**` | `src/frontend/tui/outputStyles/` |
| `src/plugins/**` | `src/backend/plugins/bundled/` |
| `src/query/**` | `src/backend/runtime/query/`，compact/hooks 例外另搬 |
| `src/remote/**` | `src/backend/remote-control/session/` |
| `src/schemas/**` | backend domain schema，目前 hooks schema -> `src/backend/hooks/` |
| `src/screens/**` | `src/frontend/tui/screens/` |
| `src/server/**` | `src/backend/remote-control/direct-connect/` |
| `src/services/**` | 分散到 backend domain；voice/tips/prompt UI 例外到 frontend |
| `src/skills/**` | `src/backend/skills/` |
| `src/state/**` | `src/frontend/state/` |
| `src/tasks/**` | `src/backend/agent/tasks/` |
| `src/tools/**` | `src/backend/tools/` 或 backend domain tools |
| `src/types/**` | `src/shared/types/`，domain exception 另搬 |
| `src/upstreamproxy/**` | `src/backend/remote-control/upstreamproxy/` |
| `src/utils/**` | 分散到 backend/frontend/shared |
| `src/vim/**` | `src/frontend/tui/vim/` |
| `src/voice/**` | `src/frontend/voice/` |
| `src/commands.ts` | `src/frontend/cli/commands.ts` |
| `src/context.ts` | `src/frontend/tui/context.ts` |
| `src/cost-tracker.ts` | `src/backend/observability/cost-tracker.ts` |
| `src/costHook.ts` | `src/backend/observability/costHook.ts` |
| `src/dialogLaunchers.tsx` | `src/frontend/tui/dialogLaunchers.tsx` |
| `src/history.ts` | `src/frontend/cli/history.ts` |
| `src/ink.ts` | `src/frontend/tui/ink.ts` |
| `src/interactiveHelpers.tsx` | `src/unresolved-fullstack/interactiveHelpers.tsx` |
| `src/main.tsx` | `src/unresolved-fullstack/main.tsx` |
| `src/projectOnboardingState.ts` | `src/backend/app/projectOnboardingState.ts` |
| `src/query.ts` | `src/backend/runtime/query.ts` |
| `src/QueryEngine.ts` | `src/backend/runtime/QueryEngine.ts` |
| `src/replLauncher.tsx` | `src/unresolved-fullstack/replLauncher.tsx` |
| `src/setup.ts` | `src/unresolved-fullstack/setup.ts` |
| `src/Task.ts` | `src/backend/agent/Task.ts` |
| `src/tasks.ts` | `src/backend/agent/tasks.ts` |
| `src/Tool.ts` | `src/backend/tools/Tool.ts` |
| `src/tools.ts` | `src/backend/tools/tools.ts` |

## 每次搬移的標準流程

1. 建立目標資料夾。
2. 用 `git mv` 搬移該 module 清單中的檔案。
3. 只更新 import/export/require path。
4. 執行 typecheck 或 build。
5. 檢查 diff，確認沒有非路徑修改。
6. 在 PR description 列出「搬了哪些檔案」和「沒有改哪些行為」。

## 最小可交付版本

第一版不用真的搬完整個 repo。最小可交付範圍：

- `research/new_structure.md` 描述目標結構。
- `research/reform.md` 描述搬移順序與規則。
- 先挑低風險 module 試搬，例如 `src/shared/`, `src/backend/platform/`, `src/backend/observability/`。
- 建立 diff 檢查規則：除了 import/export/require path，不允許其他 code diff。

完成後，團隊可以持續依照 frontend/backend 邊界搬運，而不是在每次 PR 重新討論架構。
