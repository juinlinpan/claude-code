# Claude Code `src/` 模組整理（後端視角）

## 結論

這個 `src/` 不是典型的前後端分離系統，而是一個把下面幾層放在同一個程序裡的 monolith：

- 終端 UI / TUI
- agent harness / runtime
- tool 與 task 執行層
- 本地持久化層
- remote session / bridge 介面層
- LLM provider 串聯層

如果用後端角度看，它的核心不是 web server，而是 **agent runtime**。

---

## 1. 哪些偏前端？哪些偏後端？

### 偏前端 / UI

- `src/components/`
  - 終端 UI 元件、dialog、message rendering、permissions UI、task panel。
- `src/ink/`
  - 自製 terminal renderer，等於這個專案的 UI framework。
- `src/screens/`
  - `REPL`、`ResumeConversation`、`Doctor` 之類的畫面。
- `src/context/`
  - React context，管理通知、overlay、modal、stats。
- `src/hooks/`
  - 大量 REPL/TUI 互動 hook。
- `src/state/`
  - AppState store，偏前端狀態管理。
- `src/keybindings/`, `src/vim/`
  - 輸入模式、快捷鍵、vim 互動。

### 偏後端 / runtime

- `src/main.tsx`, `src/entrypoints/`, `src/bootstrap/`
  - 啟動、session bootstrap、全域 runtime state。
- `src/query.ts`, `src/query/`, `src/QueryEngine.ts`
  - LLM turn engine。
- `src/Tool.ts`, `src/tools.ts`, `src/tools/`
  - tool 定義、registry、執行入口。
- `src/services/tools/`
  - tool orchestration、hooks、streaming execution。
- `src/Task.ts`, `src/tasks.ts`, `src/tasks/`
  - 背景 task runtime。
- `src/tools/AgentTool/*`, `src/coordinator/`, `src/utils/swarm/*`
  - subagent / multi-agent / swarm。
- `src/services/mcp/*`
  - MCP transport / client / auth / resources。
- `src/bridge/`, `src/remote/`, `src/server/`
  - remote session、bridge、transport。
- `src/utils/settings/`, `src/utils/config.ts`, `src/utils/sessionStorage.ts`, `src/utils/tasks.ts`
  - 設定與本地持久化。
- `src/utils/permissions/*`, `src/utils/sandbox/*`
  - 權限與 sandbox。
- `src/memdir/`, `src/services/SessionMemory/`, `src/services/autoDream/`, `src/services/compact/`
  - memory、compact、背景整理。

### 混合層

- `src/commands/`
  - 有些是 UI command，有些其實是 runtime control plane。
- `src/bootstrap/`
  - 雖然偏 runtime，但也被 UI 大量讀取。

---

## 2. 主要功能與模組地圖

| 模組 | 定位 | 主要功能 |
| --- | --- | --- |
| `main.tsx`, `entrypoints/`, `bootstrap/` | Harness 核心 | 啟動 CLI、初始化 session、settings、plugins、skills、telemetry |
| `query.ts`, `query/`, `QueryEngine.ts` | Harness 核心 | LLM turn loop、streaming、tool/result 迴圈、compact、retry |
| `Tool.ts`, `tools.ts`, `tools/*` | Harness 核心 | 所有 tool 的 schema、registry、執行入口 |
| `services/tools/*` | Harness 核心 | tool scheduling、permission/hook、tool execution pipeline |
| `Task.ts`, `tasks.ts`, `tasks/*` | Harness 核心 | shell task、agent task、remote task、dream task |
| `tools/AgentTool/*`, `coordinator/`, `utils/swarm/*` | Harness 核心 | subagent、team/swarm、delegation |
| `components/`, `ink/`, `screens/`, `hooks/`, `state/` | 前端/TUI | 終端互動介面 |
| `services/api/*` | 外部服務整合 | backend API client、provider client、session ingress、files |
| `services/mcp/*` | 協定整合 | MCP client、resource、tool integration |
| `bridge/*`, `remote/*`, `server/*`, `utils/teleport*` | Remote control | remote session、bridge worker、websocket / HTTP transport |
| `utils/settings/*`, `utils/config.ts`, `utils/sessionStorage.ts`, `utils/tasks.ts` | Persistence | transcript、config、task store、local state |
| `memdir/`, `services/SessionMemory/`, `services/autoDream/` | Memory persistence | 記憶檔案、session memory、background consolidation |

---

## 3. 後端中的 harness 是哪些？

如果只抓 **agent harness**，核心是下面這些。

### 3.1 啟動與 bootstrap

- `src/main.tsx`
- `src/entrypoints/init.ts`
- `src/bootstrap/state.ts`

職責：

- 載入 settings / auth / plugins / skills
- 建立 session 與 runtime state
- 啟動 REPL 或非互動模式

### 3.2 Query / LLM turn engine

- `src/query.ts`
- `src/query/config.ts`
- `src/query/deps.ts`
- `src/query/tokenBudget.ts`
- `src/query/stopHooks.ts`

職責：

- 組裝 messages
- 串接 system/user context
- 處理 streaming response
- 跑 tool loop
- 控制 token budget、compact、fallback、stop hooks

### 3.3 Tool framework + orchestration

- `src/Tool.ts`
- `src/tools.ts`
- `src/services/tools/toolExecution.ts`
- `src/services/tools/toolOrchestration.ts`
- `src/services/tools/toolHooks.ts`

職責：

- tool schema registry
- tool execution pipeline
- permission 檢查
- pre/post hooks
- progress / telemetry

### 3.4 Task runtime

- `src/Task.ts`
- `src/tasks.ts`
- `src/tasks/LocalShellTask/*`
- `src/tasks/LocalAgentTask/*`
- `src/tasks/RemoteAgentTask/*`
- `src/tasks/DreamTask/*`

職責：

- 管理長時間執行任務
- 追蹤 task status / output file / cleanup
- 把 shell、subagent、dream、remote work 從主 turn loop 抽離

### 3.5 Multi-agent / delegation / swarm

- `src/tools/AgentTool/*`
- `src/coordinator/coordinatorMode.ts`
- `src/tools/shared/spawnMultiAgent.ts`
- `src/utils/swarm/*`

職責：

- spawn subagent
- resume background agent
- teammate / team / swarm 同步
- worker permission bridge

### 3.6 Memory / compact / background loops

- `src/services/compact/*`
- `src/services/SessionMemory/*`
- `src/services/autoDream/*`
- `src/memdir/*`

職責：

- compact context
- 維護 session memory
- dream consolidation
- 維護 project memory files

---

## 4. 哪些算介面層？

這裡要拆成兩個概念：

- **API / 介面**：runtime 跟後端服務、remote session、control plane 的邊界
- **LLM provider 串聯**：runtime 跟模型供應商之間的 adapter / client layer

所以不是所有外部 HTTP 呼叫都該直接歸到 API。

### 4.1 LLM provider 串聯

這層比較準確的名稱是 **provider integration**，不是狹義的後端 API。

- `src/services/api/client.ts`
  - 統一建立模型 client
  - 支援 Anthropic 1P、Bedrock、Vertex、Foundry
- `src/services/api/claude.ts`
  - 實際送 message / tool calls 到模型
- `src/services/api/withRetry.ts`
  - provider call 的 retry / fallback

用架構語言，它是：

- model transport
- provider adapter
- inference client

### 4.2 Claude Code backend API

這層才比較像「CLI 對自家後端的 API client」。

- `src/services/api/bootstrap.ts`
  - 啟動時抓 bootstrap data / model options
- `src/services/api/filesApi.ts`
  - 和 Claude Code backend 的 Files API 溝通
- `src/services/api/sessionIngress.ts`
  - session log、session hydration、ingress auth
- `src/services/api/usage.ts`
- `src/services/api/metricsOptOut.ts`
- `src/services/api/referral.ts`
- `src/services/api/overageCreditGrant.ts`

這些比較適合視為：

- backend-facing client interface
- control/data plane API wrappers

### 4.3 Remote / bridge 介面

這層是 runtime 跟遠端執行環境溝通的介面。

- `src/bridge/codeSessionApi.ts`
  - `POST /v1/code/sessions`
  - `POST /v1/code/sessions/{id}/bridge`
- `src/utils/teleport/api.ts`
  - teleport / remote session 相關介面
- `src/remote/RemoteSessionManager.ts`
  - WebSocket + HTTP 跟遠端 session 溝通
- `src/bridge/*`
  - bridge worker lifecycle、heartbeat、session spawn、token refresh

這一層不是單純「外部 API 呼叫」，而是整個 remote execution 的 interface layer。

### 4.4 MCP integration 介面

- `src/services/mcp/*`
- `src/tools/MCPTool/*`
- `src/tools/ListMcpResourcesTool/*`
- `src/tools/ReadMcpResourceTool/*`

這層也不太適合直接叫 API，比較像：

- protocol integration layer
- capability bridge
- external tool/resource interface

因為它對接的是 MCP protocol 與外部能力，不一定是傳統 HTTP backend API。

---

## 5. 哪些算 CRUD？

這裡的 CRUD 不該指「LLM 去改專案 code 的 tool」。

那類東西比較像：

- actuator
- code mutation tools
- project manipulation interface

真正比較像後端 CRUD 的，應該是 **對持久化狀態的讀寫控制**，即使底層不是 DB，而是 JSON / JSONL / markdown / keychain / 本地檔案。

### 5.1 這些不是 persistence CRUD，而是專案操作工具

- `src/tools/FileReadTool/*`
- `src/tools/FileWriteTool/*`
- `src/tools/FileEditTool/*`
- `src/tools/NotebookEditTool/*`
- `src/tools/BashTool/*`
- `src/tools/PowerShellTool/*`

它們讓 LLM 操作使用者的 workspace / project files。

從後端角度看，這些比較像：

- filesystem actuator
- project mutation interface
- agent execution tools

不是 application state 的 CRUD。

### 5.2 Transcript / session log CRUD

主要模組：

- `src/utils/sessionStorage.ts`
- `src/services/api/sessionIngress.ts`

偏 CRUD 的操作：

- Create / Append
  - session transcript append 到 `.jsonl`
  - remote session 可透過 `appendSessionLog(...)`
- Read
  - `getTranscriptPath(...)`
  - 載入 transcript / session logs
- Update
  - 較少做 in-place update，通常是 append-only 或 rewrite
- Delete
  - `removeTranscriptMessage(...)`
  - compact / tombstone / resume 流程會重寫 transcript

這組比較像 append-heavy event store。

### 5.3 Task store CRUD

主要模組：

- `src/utils/tasks.ts`

明確的 CRUD：

- Create
  - `createTask(...)`
- Read
  - `getTask(...)`
  - `listTasks(...)`
- Update
  - `updateTask(...)`
- Delete
  - `deleteTask(...)`

底層存放：

- `~/.claude/tasks/<taskListId>/<taskId>.json`

這是整個 repo 裡最像典型後端 CRUD store 的部分。

### 5.4 Scheduled task / cron CRUD

主要模組：

- `src/utils/cronTasks.ts`
- `src/utils/cronScheduler.ts`
- `src/utils/cronTasksLock.ts`

明確的 CRUD：

- Create
  - `addCronTask(...)`
- Read
  - `readCronTasks(...)`
  - `listAllCronTasks(...)`
- Update
  - `writeCronTasks(...)`
  - recurring 任務觸發後會更新 `lastFiredAt`
- Delete
  - `removeCronTasks(...)`

底層存放：

- `<project>/.claude/scheduled_tasks.json`

### 5.5 Settings / config CRUD

主要模組：

- `src/utils/settings/settings.ts`
- `src/utils/config.ts`

明確的 CRUD：

- Read
  - `getSettingsForSource(...)`
  - `getGlobalConfig()`
- Update / Upsert
  - `updateSettingsForSource(...)`
  - `saveGlobalConfig(...)`
- Delete
  - 多半不是單獨 delete API，而是透過 merge-with-`undefined` 刪 key

這組本質上是 configuration store CRUD。

### 5.6 Credentials / secure storage CRUD

主要模組：

- `src/utils/secureStorage/index.ts`
- `src/utils/secureStorage/plainTextStorage.ts`
- `src/utils/secureStorage/macOsKeychainStorage.ts`

明確的 CRUD：

- Read
  - `read()` / `readAsync()`
- Update
  - `update(...)`
- Delete
  - `delete()`

底層不是 DB，而是：

- macOS keychain
- 或 `~/.claude/.credentials.json`

### 5.7 Plugin option CRUD

主要模組：

- `src/utils/plugins/pluginOptionsStorage.ts`

明確的 CRUD：

- Read
  - `loadPluginOptions(...)`
- Update / Save
  - `savePluginOptions(...)`
- Delete
  - `deletePluginOptions(...)`

而且它是分層持久化：

- sensitive options 進 secure storage
- non-sensitive options 進 `settings.json`

### 5.8 Memory 檔案持久化控制

主要模組：

- `src/memdir/*`
- `src/services/SessionMemory/*`
- `src/services/autoDream/*`

這組也有持久化控制，但比較不像標準 CRUD service，比較像：

- memory file generation
- consolidation
- markdown knowledge store maintenance

也就是「對記憶檔案的持久化維護」，不是傳統 entity CRUD。

---

## 6. 如何持久化？

這個 repo 幾乎是 **檔案系統持久化為主**，沒有明顯的內建 DB layer，也沒有 ORM。

### 6.1 Session transcript / conversation log

- `src/utils/sessionStorage.ts`
- `src/utils/sessionStoragePortable.ts`

形式：

- `~/.claude/projects/<project>/<sessionId>.jsonl`
- `~/.claude/projects/<project>/<sessionId>/subagents/.../agent-<agentId>.jsonl`

用途：

- resume conversation
- 還原訊息歷史
- 子代理與背景任務恢復

### 6.2 Tasks

- `src/utils/tasks.ts`

形式：

- `~/.claude/tasks/<taskListId>/<taskId>.json`
- `~/.claude/tasks/<taskListId>/.highwatermark`

### 6.3 Settings

- `src/utils/settings/settings.ts`

主要來源：

- `~/.claude/settings.json`
- `~/.claude/cowork_settings.json`
- `<project>/.claude/settings.json`
- `<project>/.claude/settings.local.json`
- managed settings: `managed-settings.json` + `managed-settings.d/*.json`
- 另外還能疊 remote managed settings / MDM / HKCU/HKLM

### 6.4 Credentials / secure storage

- `src/utils/secureStorage/index.ts`
- `src/utils/secureStorage/plainTextStorage.ts`
- `src/utils/secureStorage/macOsKeychainStorage.ts`

策略：

- macOS 優先 keychain
- 其他平台落在 `~/.claude/.credentials.json`

### 6.5 Scheduled tasks

- `src/utils/cronTasks.ts`

形式：

- durable: `<project>/.claude/scheduled_tasks.json`
- session-only: 在 `bootstrap/state.ts` 記憶體內，不落盤

### 6.6 Memory

- `src/memdir/*`
- `src/services/SessionMemory/*`

形式：

- project/session memory 寫在 `~/.claude/projects/.../memory/` 一帶
- session memory 主要是 markdown file，不是 DB

### 6.7 File persistence / remote outputs

- `src/utils/filePersistence/filePersistence.ts`
- `src/services/api/filesApi.ts`

模式：

- BYOC 模式會掃描本地 outputs 再上傳到 Files API
- 代表除了本地檔案，也存在遠端檔案持久化

### 6.8 Global config / plugin / telemetry cache

- `src/utils/config.ts`
- `src/utils/plugins/*`
- `src/services/analytics/*`

也大量使用 `~/.claude/...` 下的 JSON、cache、telemetry、plugin 目錄。

### 6.9 不是用什麼？

從 `src/` 來看：

- 沒有明顯的 PostgreSQL / MySQL / SQLite repository layer
- 沒有 ORM / DB migration
- 沒有典型 server-side DAO / repository 分層

所以更準確的說法是：

> 這是一個 file-backed local runtime，不是 DB-backed backend。

---

## 7. 有沒有特殊排程、容器、遠端執行？

### 7.1 有排程，但不是雲端 job scheduler

關鍵模組：

- `src/utils/cronScheduler.ts`
- `src/utils/cronTasks.ts`
- `src/utils/cronTasksLock.ts`
- `src/tools/ScheduleCronTool/*`

特點：

- 每個 project 使用 `<project>/.claude/scheduled_tasks.json`
- scheduler 以 1 秒 tick 檢查
- 用 `.claude/scheduled_tasks.lock` 避免同一 project 多個 Claude session 同時驅動
- 支援 missed-task recovery
- 支援 durable / session-only 兩種任務

這比較像 **local embedded scheduler**，不是 Kubernetes CronJob 或外部 queue worker。

### 7.2 有背景 autonomous job

- `src/services/autoDream/autoDream.ts`
- `src/services/SessionMemory/sessionMemory.ts`
- `src/utils/backgroundHousekeeping.ts`

特點：

- dream 會用 forked subagent 做 background consolidation
- session memory 會定期抽取重點
- 都屬於 harness 內建 background maintenance

### 7.3 有 remote/container session 接入能力

關鍵模組：

- `src/bridge/bridgeMain.ts`
- `src/bridge/codeSessionApi.ts`
- `src/remote/RemoteSessionManager.ts`
- `src/utils/teleport/api.ts`
- `src/services/api/client.ts` 中也會帶 `CLAUDE_CODE_CONTAINER_ID` / `CLAUDE_CODE_REMOTE_SESSION_ID`

比較準確的判斷是：

- 有完整的 remote session client / bridge worker 能力
- 能建立 code session、拿 bridge credentials、heartbeat、透過 websocket 溝通
- 也知道 remote container / remote session 這種環境

但我沒有在這份 repo 裡看到：

- Docker Compose / Kubernetes manifest
- 容器排程器本體
- 內建的 cluster scheduler

所以應該說：

> 有遠端容器/工作節點的接入能力，但沒有把容器編排器本身實作在這個 repo 裡。

---

## 8. 以後端視角，最值得先讀哪些檔案？

如果你只想抓系統骨架，建議先讀：

1. `src/main.tsx`
2. `src/query.ts`
3. `src/Tool.ts`
4. `src/tools.ts`
5. `src/services/tools/toolExecution.ts`
6. `src/services/tools/toolOrchestration.ts`
7. `src/Task.ts`
8. `src/tasks.ts`
9. `src/services/api/client.ts`
10. `src/services/mcp/client.ts`
11. `src/utils/sessionStorage.ts`
12. `src/utils/tasks.ts`
13. `src/utils/cronScheduler.ts`
14. `src/bridge/bridgeMain.ts`
15. `src/remote/RemoteSessionManager.ts`

---

## 9. 最後的架構判斷

如果硬要用後端術語總結，Claude Code 的 `src/` 比較像：

- agent harness / runtime
- tool-driven execution backend
- file-based persistence system
- remote session client + bridge control plane
- LLM provider integration layer

而不是：

- 傳統 MVC web backend
- DB-centric service backend
- 單純前端 app

最接近的理解方式是：

> 這是一個把終端 UI、agent runtime、本地持久化、remote session client、LLM provider integration 全部塞在同一個程序裡的 monolith。
