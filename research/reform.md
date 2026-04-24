# Claude Code 純搬移重構規劃

## 目標

這個版本的重構只做一件事：把原本散在 `src/` 裡的 code 依功能移到清楚的 module 下面，讓 PM 和工程師可以從 repo 結構判斷功能主要該改哪裡。

這不是重寫，也不是抽象化。除了 import/export 路徑必須跟著檔案位置更新之外，原始 code 一個字都不應該改。

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
- 新增 facade、adapter、wrapper。
- 為了讓結構漂亮而拆檔、合檔、改命名。

驗收標準：

- 每個搬移檔案除了 import/export/require path 之外，內容應與原檔一致。
- 每個 commit 只做一個 module 或一組相依 module 的搬移。
- 搬移後可以用 diff 檢查：非路徑修改都必須退回。

## 目標結構

```text
src/
  app/                         # process bootstrap 與全域啟動組裝
  cli/                         # CLI args、command routing、structured IO
  backend/                     # backend/provider API clients
  session/                     # session lifecycle、transcript、resume
  app-state/                   # current process 的 in-memory AppState
  runtime/                     # agent turn loop、query engine、tool execution loop
  agent/                       # agents、subagents、tasks、team/swarm，以及 agent 專屬 tool calls
  tools/                       # LLM 可直接呼叫的通用 tool call executable code
  hooks/                       # hook schema、config、executor、hook UI/command
  skills/                      # skill load、bundled skills、SkillTool
  mcp/                         # MCP client、config、transport、MCP tools/UI/command
  plugins/                     # plugin registry、marketplace、plugin commands/options
  remote-control/              # bridge、remote session、direct connect、teleport
  context-management/          # token budget、compact、context projection
  memory/                      # project/session/team memory、autoDream
  permissions/                 # permission policy、approval UI、sandbox permission
  persistence/                 # settings、secure storage、file-backed stores
  ui/                          # terminal UI, Ink, screens, shared UI hooks
  platform/                    # shell/fs/git/os/native integration
  observability/               # analytics、diagnostics、logging、profiling
  shared/                      # 無 domain 的純 utility
```

## Module 搬移清單

以下清單是第一版要寫進規劃的「module 下面要放哪些檔案」。如果列的是資料夾，代表資料夾內既有 `.ts`, `.tsx`, `.js` 一起搬，不拆檔、不改名。

### `src/app/`

放 process 啟動、bootstrap、全域組裝。第一批搬：

```text
src/main.tsx
src/setup.ts
src/replLauncher.tsx
src/interactiveHelpers.tsx
src/entrypoints/**
src/bootstrap/**
src/projectOnboardingState.ts
src/history.ts
```

暫不搬進來：

- `src/commands/**`：先歸到 `cli/` 或各 domain command。
- `src/components/**`：放 `ui/`。

### `src/cli/`

放 CLI 輸入輸出、command registry、non-interactive mode。第一批搬：

```text
src/cli/**
src/commands.ts
src/commands/help/**
src/commands/exit/**
src/commands/version.ts
src/commands/status/**
src/commands/stats/**
src/commands/config/**
src/commands/model/**
src/commands/output-style/**
src/commands/theme/**
src/commands/keybindings/**
src/commands/privacy-settings/**
src/commands/doctor/**
src/commands/install.tsx
src/commands/upgrade/**
src/commands/release-notes/**
```

規則：

- 純 CLI 管理型 command 放 `cli/commands/`。
- 有明確 domain 的 command 搬到該 domain，例如 `commands/mcp/**` 放 `mcp/commands/`。

### `src/backend/`

放 API client、provider call、backend control plane。第一批搬：

```text
src/services/api/**
src/services/oauth/**
src/services/claudeAiLimits.ts
src/services/policyLimits/**
src/services/remoteManagedSettings/**
src/services/settingsSync/**
src/utils/api.ts
src/utils/apiPreconnect.ts
src/utils/auth.ts
src/utils/oauth.ts
src/utils/sessionIngressAuth.ts
src/constants/apiLimits.ts
src/constants/oauth.ts
```

建議子資料夾：

```text
src/backend/api/
src/backend/oauth/
src/backend/policy-limits/
src/backend/remote-managed-settings/
```

### `src/session/`

放 session id、transcript、resume、rewind、session metadata。第一批搬：

```text
src/utils/sessionStorage.ts
src/utils/sessionStoragePortable.ts
src/types/logs.ts
src/assistant/sessionHistory.ts
src/commands/session/**
src/commands/resume/**
src/commands/rewind/**
src/commands/rename/**
src/commands/export/**
src/utils/conversationRecovery.ts
src/utils/concurrentSessions.ts
```

建議子資料夾：

```text
src/session/transcript/
src/session/resume/
src/session/commands/
```

### `src/app-state/`

放 current process 的 in-memory state。這不是 session transcript，也不是 task executor，而是 runtime/UI 當下共享的 `AppState` store、selector、state update helper。

第一批搬：

```text
src/state/**
```

不要放這裡：

- `src/utils/sessionStorage.ts`：這是 persisted transcript，放 `session/`。
- `src/tasks/**`：這是 background job executor，放 `agent/`。
- `src/context/**`：這是 React context，放 `ui/context/`，除非該 context 明確屬於某個 domain。

### `src/runtime/`

放 LLM turn loop、query engine、tool execution loop。第一批搬：

```text
src/QueryEngine.ts
src/query.ts
src/query/config.ts
src/query/deps.ts
src/services/tools/toolExecution.ts
src/services/tools/toolOrchestration.ts
src/services/tools/StreamingToolExecutor.ts
src/utils/queryContext.ts
src/utils/queryHelpers.ts
src/utils/queryProfiler.ts
src/utils/processUserInput/**
src/hooks/useMainLoopModel.ts
src/entrypoints/sdk/**
src/entrypoints/agentSdkTypes.ts
```

暫不搬進來：

- `src/query/tokenBudget.ts`：放 `context-management/`。
- `src/query/stopHooks.ts`：放 `hooks/`。
- `src/services/tools/toolHooks.ts`：放 `hooks/`。

### `src/agent/`

放 agent、subagent、task runtime、team/swarm，以及「會啟動或操作其他 agent/task」的 tool call executable code。

這裡的 `tools/` 子資料夾不是泛用工具層，而是 agent domain 底下的 tool calls。判斷規則是：如果這個 tool call 的主要效果是 spawn/resume/stop/read/update agent 或 task，它就屬於 `src/agent/tools/`，不是頂層 `src/tools/`。

第一批搬：

```text
src/Task.ts
src/tasks.ts
src/tasks/**
src/tools/AgentTool/**
src/tools/TaskCreateTool/**
src/tools/TaskGetTool/**
src/tools/TaskListTool/**
src/tools/TaskOutputTool/**
src/tools/TaskStopTool/**
src/tools/TaskUpdateTool/**
src/tools/TeamCreateTool/**
src/tools/TeamDeleteTool/**
src/tools/SendMessageTool/**
src/tools/shared/spawnMultiAgent.ts
src/coordinator/**
src/utils/swarm/**
src/utils/task/**
src/utils/tasks.ts
src/components/agents/**
src/components/tasks/**
src/components/TaskListV2.tsx
src/components/ResumeTask.tsx
src/commands/agents/**
src/commands/tasks/**
```

這裡符合「agent(tools 放裡面)」的切法：AgentTool、Task tools、Team tools 都進 `agent/tools/`。它們仍然是 LLM tool call 的 executable code，只是 ownership 是 agent domain。

### `src/tools/`

放 LLM 可直接呼叫、而且不屬於特定 domain 的通用 tool call executable code。

這個 module 的定義：

- 每個資料夾通常對應一個 LLM tool call，例如 Bash、Read、Edit、WebFetch。
- 主要內容是 tool schema、prompt、permission check、execute/call implementation、tool result UI。
- 這些 tool 的效果通常是操作 workspace、shell、web、LSP、notebook、todo、plan/worktree 等通用能力。
- `src/Tool.ts` 是 tool interface/type。
- `src/tools.ts` 是 tool registry，負責把可用 tool 收成清單。

不屬於這裡的 tool call：

- Agent/Task/Team 類 tool call：放 `src/agent/tools/`，因為 PM 會把它們理解成 agent 功能。
- MCP 類 tool call：放 `src/mcp/tools/`，因為 executable code 依賴 MCP client/config/resource。
- Skill 類 tool call：放 `src/skills/tool/`，因為 executable code 依賴 skill registry。

所以頂層 `src/tools/` 不是「所有 tool call 的唯一資料夾」，而是「通用 LLM tool call executable code」。domain-owned tool calls 放在各自 domain 的 `tools/` 子資料夾。

第一批保留或搬入：

```text
src/Tool.ts
src/tools.ts
src/tools/AskUserQuestionTool/**
src/tools/BashTool/**
src/tools/BriefTool/**
src/tools/ConfigTool/**
src/tools/EnterPlanModeTool/**
src/tools/ExitPlanModeTool/**
src/tools/EnterWorktreeTool/**
src/tools/ExitWorktreeTool/**
src/tools/FileEditTool/**
src/tools/FileReadTool/**
src/tools/FileWriteTool/**
src/tools/GlobTool/**
src/tools/GrepTool/**
src/tools/LSPTool/**
src/tools/NotebookEditTool/**
src/tools/PowerShellTool/**
src/tools/REPLTool/**
src/tools/RemoteTriggerTool/**
src/tools/ScheduleCronTool/**
src/tools/SleepTool/**
src/tools/SyntheticOutputTool/**
src/tools/TodoWriteTool/**
src/tools/ToolSearchTool/**
src/tools/WebFetchTool/**
src/tools/WebSearchTool/**
src/tools/shared/gitOperationTracking.ts
src/tools/testing/**
```

不放這裡：

- `src/tools/AgentTool/**` -> `src/agent/tools/AgentTool/`
- `src/tools/TaskCreateTool/**`, `TaskGetTool`, `TaskListTool`, `TaskOutputTool`, `TaskStopTool`, `TaskUpdateTool` -> `src/agent/tools/`
- `src/tools/TeamCreateTool/**`, `TeamDeleteTool`, `SendMessageTool` -> `src/agent/tools/`
- `src/tools/SkillTool/**` -> `src/skills/tool/`
- `src/tools/MCPTool/**`, `ListMcpResourcesTool`, `ReadMcpResourceTool`, `McpAuthTool` -> `src/mcp/tools/`

### `src/hooks/`

放 hook schema、setting、executor、hook command/UI。第一批搬：

```text
src/schemas/hooks.ts
src/types/hooks.ts
src/utils/hooks.ts
src/utils/hooks/**
src/query/stopHooks.ts
src/services/tools/toolHooks.ts
src/commands/hooks/**
src/components/hooks/**
src/hooks/useDeferredHookMessages.ts
src/hooks/renderPlaceholder.ts
```

建議子資料夾：

```text
src/hooks/schema/
src/hooks/executors/
src/hooks/settings/
src/hooks/commands/
src/hooks/ui/
```

### `src/skills/`

放 skill registry、bundled skills、SkillTool、skill UI/command。第一批搬：

```text
src/skills/**
src/tools/SkillTool/**
src/commands/skills/**
src/components/skills/**
src/utils/skills/**
src/hooks/useSkillsChange.ts
src/hooks/useSkillImprovementSurvey.ts
src/utils/suggestions/skillUsageTracking.ts
src/utils/telemetry/skillLoadedEvent.ts
```

建議子資料夾：

```text
src/skills/registry/
src/skills/bundled/
src/skills/tool/
src/skills/commands/
src/skills/ui/
```

### `src/plugins/`

放 plugin registry、bundled plugins、marketplace、plugin options、plugin command/UI。第一批搬：

```text
src/plugins/**
src/utils/plugins/**
src/services/plugins/**
src/commands/plugin/**
src/commands/reload-plugins/**
src/hooks/useManagePlugins.ts
src/hooks/useMergedCommands.ts
src/hooks/useMergedTools.ts
src/hooks/useMergedClients.ts
src/hooks/usePluginRecommendationBase.tsx
src/hooks/useOfficialMarketplaceNotification.tsx
src/hooks/useLspPluginRecommendation.tsx
src/hooks/notifs/usePluginInstallationStatus.tsx
src/hooks/notifs/usePluginAutoupdateNotification.tsx
src/components/ClaudeCodeHint/**
```

建議子資料夾：

```text
src/plugins/registry/
src/plugins/marketplace/
src/plugins/options/
src/plugins/commands/
src/plugins/ui/
```

### `src/mcp/`

放 MCP config、client、transport、MCP tools/resource、MCP command/UI。第一批搬：

```text
src/services/mcp/**
src/services/mcpServerApproval.tsx
src/entrypoints/mcp.ts
src/tools/MCPTool/**
src/tools/McpAuthTool/**
src/tools/ListMcpResourcesTool/**
src/tools/ReadMcpResourceTool/**
src/components/mcp/**
src/commands/mcp/**
src/cli/handlers/mcp.tsx
src/utils/mcp/**
src/utils/mcpValidation.ts
src/utils/mcpWebSocketTransport.ts
src/utils/mcpOutputStorage.ts
src/utils/mcpInstructionsDelta.ts
src/utils/computerUse/mcpServer.ts
src/utils/claudeInChrome/mcpServer.ts
```

建議子資料夾：

```text
src/mcp/client/
src/mcp/config/
src/mcp/tools/
src/mcp/resources/
src/mcp/commands/
src/mcp/ui/
```

### `src/remote-control/`

放 bridge、remote session、direct connect、teleport、mobile remote。第一批搬：

```text
src/bridge/**
src/remote/**
src/server/**
src/commands/bridge/**
src/commands/bridge-kick.ts
src/commands/mobile/**
src/commands/remote-setup/**
src/commands/remote-env/**
src/commands/teleport/**
src/utils/teleport.tsx
src/utils/teleport/**
src/utils/background/remote/**
src/upstreamproxy/**
src/hooks/useRemoteSession.ts
src/hooks/useReplBridge.tsx
src/hooks/useTeleportResume.tsx
src/hooks/useDirectConnect.ts
```

建議子資料夾：

```text
src/remote-control/bridge/
src/remote-control/session/
src/remote-control/direct-connect/
src/remote-control/teleport/
src/remote-control/commands/
```

### `src/context-management/`

放 token budget、compact、context command、context visualization。第一批搬：

```text
src/services/compact/**
src/query/tokenBudget.ts
src/utils/tokenBudget.ts
src/utils/tokens.ts
src/utils/truncate.ts
src/utils/toolResultStorage.ts
src/utils/workloadContext.ts
src/components/messages/CompactBoundaryMessage.tsx
src/services/tokenEstimation.ts
src/commands/compact/**
src/commands/context/**
src/commands/ctx_viz/**
```

建議子資料夾：

```text
src/context-management/compact/
src/context-management/token-budget/
src/context-management/commands/
src/context-management/ui/
```

### `src/memory/`

放 project memory、session memory、team memory、autoDream。第一批搬：

```text
src/memdir/**
src/services/SessionMemory/**
src/services/autoDream/**
src/services/extractMemories/**
src/services/teamMemorySync/**
src/utils/memory/**
src/utils/memoryFileDetection.ts
src/components/memory/**
src/components/messages/UserMemoryInputMessage.tsx
src/components/messages/teamMemCollapsed.tsx
src/components/messages/teamMemSaved.ts
src/commands/memory/**
```

建議子資料夾：

```text
src/memory/project/
src/memory/session/
src/memory/team/
src/memory/consolidation/
src/memory/commands/
src/memory/ui/
```

### `src/permissions/`

放 permission rules、approval UI、sandbox permission、tool permission handlers。第一批搬：

```text
src/types/permissions.ts
src/utils/permissions/**
src/hooks/toolPermission/**
src/components/permissions/**
src/commands/permissions/**
src/commands/sandbox-toggle/**
src/utils/sandbox/**
src/utils/computerUse/**
```

工具本身仍放原 domain；permission UI 和 permission policy 放這裡。

### `src/persistence/`

放 settings、config、secure storage、local file-backed store。第一批搬：

```text
src/utils/config.ts
src/utils/configConstants.ts
src/utils/settings/**
src/utils/secureStorage/**
src/utils/filePersistence/**
src/utils/cronTasks.ts
src/utils/cronTasksLock.ts
src/utils/cronScheduler.ts
src/services/settingsSync/**
src/services/remoteManagedSettings/**
src/migrations/**
src/utils/cachePaths.ts
src/utils/lockfile.ts
src/utils/jsonRead.ts
src/utils/markdownConfigLoader.ts
```

注意：

- `utils/tasks.ts` 若作為 task store，可跟 `agent/` 一起搬；若團隊想統一 file-backed store，也可放 `persistence/tasks.ts`。
- `sessionStorage.ts` 不放這裡，因為 session 是產品功能 module，應放 `session/`。

### `src/ui/`

放 TUI、Ink、screens、React contexts、通用 UI hooks。第一批搬：

```text
src/components/**
src/screens/**
src/ink/**
src/ink.ts
src/context/**
src/hooks/**
src/vim/**
src/keybindings/**
src/outputStyles/**
src/moreright/**
src/buddy/**
src/voice/**
src/services/voice.ts
src/services/voiceKeyterms.ts
src/services/voiceStreamSTT.ts
src/dialogLaunchers.tsx
src/context.ts
```

例外：

- 明確屬於 domain 的 components/commands/hooks，優先搬到 domain 下的 `ui/` 或 `commands/`。
- 例如 `components/mcp/**` 放 `mcp/ui/`，`components/memory/**` 放 `memory/ui/`，`components/permissions/**` 放 `permissions/ui/`。

### `src/platform/`

放與作業系統、shell、git、fs、native runtime 有關的檔案。第一批搬：

```text
src/native-ts/**
src/utils/bash/**
src/utils/shell/**
src/utils/powershell/**
src/utils/git/**
src/utils/github/**
src/utils/fsOperations.ts
src/utils/windowsPaths.ts
src/utils/xdg.ts
src/utils/which.ts
src/utils/platform.ts
src/utils/subprocessEnv.ts
src/utils/Shell.ts
src/utils/cwd.ts
src/utils/process.ts
src/utils/execFileNoThrow.ts
src/utils/execFileNoThrowPortable.ts
src/utils/execSyncWrapper.ts
src/utils/findExecutable.ts
src/utils/genericProcessUtils.ts
src/utils/file.ts
src/utils/glob.ts
src/utils/path.ts
```

### `src/observability/`

放 analytics、diagnostics、logging、profiling、usage display support。第一批搬：

```text
src/services/analytics/**
src/services/diagnosticTracking.ts
src/services/internalLogging.ts
src/utils/telemetry/**
src/utils/telemetryAttributes.ts
src/utils/log.ts
src/utils/errorLogSink.ts
src/utils/debug.ts
src/utils/debugFilter.ts
src/utils/diagLogs.ts
src/utils/startupProfiler.ts
src/utils/headlessProfiler.ts
src/utils/fpsTracker.ts
src/cost-tracker.ts
src/costHook.ts
src/commands/cost/**
src/commands/usage/**
src/commands/extra-usage/**
src/commands/feedback/**
```

### `src/shared/`

只放無 domain 意義的純 utility。第一批可搬：

```text
src/utils/array.ts
src/utils/async.ts
src/utils/errors.ts
src/utils/format.ts
src/utils/generators.ts
src/utils/json.ts
src/utils/memoize.ts
src/utils/sleep.ts
src/utils/string.ts
src/utils/uuid.ts
src/utils/withResolvers.ts
src/utils/yaml.ts
src/utils/xml.ts
src/utils/zodToJsonSchema.ts
src/constants/**
src/types/**
```

規則：

- 如果檔名看得出 domain，例如 `mcpValidation.ts`, `sessionStorage.ts`, `memoryFileDetection.ts`，不要放 shared。
- `src/constants/**` 與 `src/types/**` 可先整包放 `shared/`，再用 domain exception 搬走，例如 `types/logs.ts` 到 `session/`、`types/permissions.ts` 到 `permissions/`、`types/hooks.ts` 到 `hooks/`、`constants/apiLimits.ts` 到 `backend/`。
- shared 只收純函式、低階型別、跨 domain 基礎工具。

## 搬移順序

建議從低風險、邊界清楚的 module 開始：

1. `backend/`
2. `observability/`
3. `platform/`
4. `session/`
5. `app-state/`
6. `plugins/`
7. `mcp/`
8. `skills/`
9. `hooks/`
10. `remote-control/`
11. `context-management/`
12. `memory/`
13. `agent/`
14. `runtime/`
15. `ui/`
16. `cli/`

原因：

- `runtime/`, `ui/`, `cli/` import 範圍最大，放後面比較容易控制 diff。
- `backend/`, `platform/`, `observability/` 多半是被呼叫端，先搬可以累積 import path 更新經驗。
- `mcp/`, `skills/`, `hooks/`, `remote-control/` 是功能邊界清楚的 domain，適合一個 module 一個 PR。

## 每次搬移的標準流程

1. 建立目標資料夾。
2. 用 `git mv` 搬移該 module 清單中的檔案。
3. 只更新 import/export/require path。
4. 執行 typecheck 或 build。
5. 檢查 diff，確認沒有非路徑修改。
6. 在 PR description 列出「搬了哪些檔案」和「沒有改哪些行為」。

## PM 功能索引

| PM 想改的功能 | 第一個要看的 module |
| --- | --- |
| CLI 參數、啟動模式 | `src/cli/`, `src/app/` |
| slash command | `src/cli/commands/` 或對應 domain 的 `commands/` |
| current process state / AppState | `src/app-state/` |
| 對話/agent 主流程 | `src/runtime/` |
| 一般 tools | `src/tools/` |
| agent / subagent / tasks | `src/agent/` |
| MCP server/tool/resource | `src/mcp/` |
| hooks | `src/hooks/` |
| skills | `src/skills/` |
| plugins / marketplace | `src/plugins/` |
| remote control / mobile / bridge | `src/remote-control/` |
| context compact / token budget | `src/context-management/` |
| memory | `src/memory/` |
| permissions / sandbox | `src/permissions/` |
| session history / resume / rewind | `src/session/` |
| API / model / backend | `src/backend/` |
| TUI 畫面 | `src/ui/` 或各 domain 的 `ui/` |
| analytics / logs / usage | `src/observability/` |
| shell / git / native integration | `src/platform/` |

## 原本 `src/*` 搬遷總表

這張表用來檢查原本 `src/` 下的每個頂層檔案與資料夾都有去處。若該頂層資料夾內有明確 domain exception，以前面各 module 的清單為準。

| 原本位置 | 新位置 | 備註 |
| --- | --- | --- |
| `src/assistant/**` | `src/session/` | 目前主要是 `sessionHistory.ts` |
| `src/bootstrap/**` | `src/app/bootstrap/` | process/session bootstrap state |
| `src/bridge/**` | `src/remote-control/bridge/` | remote bridge / REPL bridge |
| `src/buddy/**` | `src/ui/buddy/` | TUI companion UI |
| `src/cli/**` | `src/cli/` | 例外：`cli/handlers/mcp.tsx` 可放 `mcp/commands/`；transport 若只服務 remote 可放 `remote-control/` |
| `src/commands/**` | 分散到各 domain 的 `commands/` | 例如 `commands/mcp` -> `mcp/commands`，`commands/memory` -> `memory/commands`，純 CLI 管理型 -> `cli/commands` |
| `src/components/**` | `src/ui/components/` 或各 domain `ui/` | 例如 `components/mcp` -> `mcp/ui`，`components/permissions` -> `permissions/ui` |
| `src/constants/**` | `src/shared/constants/` | domain constants 例外搬到對應 module，例如 `apiLimits` -> `backend/` |
| `src/context/**` | `src/ui/context/` | React context，不是 context-management |
| `src/coordinator/**` | `src/agent/coordinator/` | team/swarm/coordinator agent |
| `src/entrypoints/**` | `src/app/entrypoints/` | 例外：`entrypoints/mcp.ts` -> `mcp/entrypoints/`，`entrypoints/sdk/**` -> `runtime/sdk/` |
| `src/hooks/**` | `src/ui/hooks/` 或各 domain hooks | domain hooks 依前面清單搬，例如 skills/remote/hooks |
| `src/ink/**` | `src/ui/ink/` | terminal renderer |
| `src/keybindings/**` | `src/ui/keybindings/` | TUI input/keybinding |
| `src/memdir/**` | `src/memory/project/` | project/team memory files |
| `src/migrations/**` | `src/persistence/migrations/` | settings/config/data migration |
| `src/moreright/**` | `src/ui/moreright/` | TUI behavior |
| `src/native-ts/**` | `src/platform/native-ts/` | native/ported TS implementation |
| `src/outputStyles/**` | `src/ui/outputStyles/` | output style loading/display |
| `src/plugins/**` | `src/plugins/bundled/` | bundled plugin definitions |
| `src/query/**` | `src/runtime/query/` | 例外：`tokenBudget.ts` -> `context-management/`，`stopHooks.ts` -> `hooks/` |
| `src/remote/**` | `src/remote-control/session/` | remote session manager/websocket |
| `src/schemas/**` | domain schema | 目前 `schemas/hooks.ts` -> `hooks/schema/` |
| `src/screens/**` | `src/ui/screens/` | TUI screens |
| `src/server/**` | `src/remote-control/direct-connect/` | direct connect server |
| `src/services/**` | 分散到 domain | `api` -> `backend`，`mcp` -> `mcp`，`compact` -> `context-management`，`analytics` -> `observability`，`SessionMemory/autoDream/teamMemorySync/extractMemories` -> `memory` |
| `src/skills/**` | `src/skills/` | skill registry/bundled skills |
| `src/state/**` | `src/app-state/` | in-memory AppState |
| `src/tasks/**` | `src/agent/tasks/` | background job executors |
| `src/tools/**` | `src/tools/` 或 domain `tools/` | Agent tools -> `agent/tools`，MCP tools -> `mcp/tools`，SkillTool -> `skills/tool` |
| `src/types/**` | `src/shared/types/` | domain types 例外搬到對應 module，例如 `logs`/`permissions`/`hooks` |
| `src/upstreamproxy/**` | `src/remote-control/upstreamproxy/` | remote/proxy transport |
| `src/utils/**` | 分散到 domain 或 `shared/` | 依檔名 domain 搬；無 domain 的純 utility 才放 `shared/utils/` |
| `src/vim/**` | `src/ui/vim/` | TUI input mode |
| `src/voice/**` | `src/ui/voice/` | voice mode UI/state |
| `src/commands.ts` | `src/cli/commands.ts` | command registry |
| `src/context.ts` | `src/ui/context.ts` | prompt/user context assembly，若 runtime 強依賴可放 `runtime/context.ts` |
| `src/cost-tracker.ts` | `src/observability/cost-tracker.ts` | cost/usage tracking |
| `src/costHook.ts` | `src/observability/costHook.ts` | cost hook |
| `src/dialogLaunchers.tsx` | `src/ui/dialogLaunchers.tsx` | TUI dialog launch helpers |
| `src/history.ts` | `src/app/history.ts` | CLI input/history bootstrap support |
| `src/ink.ts` | `src/ui/ink.ts` | Ink entry export |
| `src/interactiveHelpers.tsx` | `src/app/interactiveHelpers.tsx` | app startup/render helpers |
| `src/main.tsx` | `src/app/main.tsx` | main process entry |
| `src/projectOnboardingState.ts` | `src/app/projectOnboardingState.ts` | onboarding bootstrap state |
| `src/query.ts` | `src/runtime/query.ts` | LLM turn loop |
| `src/QueryEngine.ts` | `src/runtime/QueryEngine.ts` | runtime query engine |
| `src/replLauncher.tsx` | `src/app/replLauncher.tsx` | REPL launch wiring |
| `src/setup.ts` | `src/app/setup.ts` | setup entry/helper |
| `src/Task.ts` | `src/agent/Task.ts` | task types/base helpers |
| `src/tasks.ts` | `src/agent/tasks.ts` | task registry |
| `src/Tool.ts` | `src/tools/Tool.ts` | generic tool interface/type |
| `src/tools.ts` | `src/tools/tools.ts` | generic tool registry |

### `src/services/*` 詳細搬遷

| 原本位置 | 新位置 | 備註 |
| --- | --- | --- |
| `src/services/AgentSummary/**` | `src/agent/summary/` |  |
| `src/services/analytics/**` | `src/observability/analytics/` |  |
| `src/services/api/**` | `src/backend/api/` |  |
| `src/services/autoDream/**` | `src/memory/consolidation/autoDream/` |  |
| `src/services/compact/**` | `src/context-management/compact/` |  |
| `src/services/extractMemories/**` | `src/memory/extraction/` |  |
| `src/services/lsp/**` | `src/platform/lsp/` |  |
| `src/services/MagicDocs/**` | `src/runtime/magic-docs/` |  |
| `src/services/mcp/**` | `src/mcp/client/` |  |
| `src/services/oauth/**` | `src/backend/oauth/` |  |
| `src/services/plugins/**` | `src/plugins/services/` |  |
| `src/services/policyLimits/**` | `src/backend/policy-limits/` |  |
| `src/services/PromptSuggestion/**` | `src/ui/prompt-suggestion/` |  |
| `src/services/remoteManagedSettings/**` | `src/persistence/remote-managed-settings/` |  |
| `src/services/SessionMemory/**` | `src/memory/session/` |  |
| `src/services/settingsSync/**` | `src/persistence/settings-sync/` |  |
| `src/services/teamMemorySync/**` | `src/memory/team/sync/` |  |
| `src/services/tips/**` | `src/ui/tips/` |  |
| `src/services/tools/**` | `src/runtime/tools/` | 例外：`toolHooks.ts` -> `hooks/` |
| `src/services/toolUseSummary/**` | `src/runtime/tool-use-summary/` |  |
| `src/services/claudeAiLimits.ts` | `src/backend/limits/claudeAiLimits.ts` |  |
| `src/services/diagnosticTracking.ts` | `src/observability/diagnosticTracking.ts` |  |
| `src/services/internalLogging.ts` | `src/observability/internalLogging.ts` |  |
| `src/services/mcpServerApproval.tsx` | `src/mcp/ui/mcpServerApproval.tsx` |  |
| `src/services/tokenEstimation.ts` | `src/context-management/token-estimation.ts` |  |
| `src/services/vcr.ts` | `src/observability/vcr.ts` |  |
| `src/services/voice.ts` | `src/ui/voice/voice.ts` |  |
| `src/services/voiceKeyterms.ts` | `src/ui/voice/voiceKeyterms.ts` |  |
| `src/services/voiceStreamSTT.ts` | `src/ui/voice/voiceStreamSTT.ts` |  |

### `src/utils/*` 詳細搬遷

| 原本位置 | 新位置 | 備註 |
| --- | --- | --- |
| `src/utils/background/**` | `src/remote-control/background/` |  |
| `src/utils/bash/**` | `src/platform/bash/` |  |
| `src/utils/claudeInChrome/**` | `src/mcp/claude-in-chrome/` 或 `src/ui/chrome/` | MCP server 放 `mcp/`，setup/rendering 放 `ui/` |
| `src/utils/computerUse/**` | `src/permissions/computer-use/` | 其中 MCP server 可放 `mcp/computer-use/` |
| `src/utils/deepLink/**` | `src/remote-control/deep-link/` |  |
| `src/utils/dxt/**` | `src/plugins/dxt/` |  |
| `src/utils/filePersistence/**` | `src/persistence/filePersistence/` |  |
| `src/utils/git/**` | `src/platform/git/` |  |
| `src/utils/github/**` | `src/platform/github/` |  |
| `src/utils/hooks/**` | `src/hooks/` |  |
| `src/utils/mcp/**` | `src/mcp/utils/` |  |
| `src/utils/memory/**` | `src/memory/utils/` |  |
| `src/utils/messages/**` | `src/runtime/messages/` |  |
| `src/utils/model/**` | `src/backend/model/` |  |
| `src/utils/nativeInstaller/**` | `src/platform/nativeInstaller/` |  |
| `src/utils/permissions/**` | `src/permissions/` |  |
| `src/utils/plugins/**` | `src/plugins/` |  |
| `src/utils/powershell/**` | `src/platform/powershell/` |  |
| `src/utils/processUserInput/**` | `src/runtime/processUserInput/` |  |
| `src/utils/sandbox/**` | `src/permissions/sandbox/` |  |
| `src/utils/secureStorage/**` | `src/persistence/secureStorage/` |  |
| `src/utils/settings/**` | `src/persistence/settings/` |  |
| `src/utils/shell/**` | `src/platform/shell/` |  |
| `src/utils/skills/**` | `src/skills/utils/` |  |
| `src/utils/suggestions/**` | `src/ui/suggestions/` | skill usage tracking 可放 `skills/` |
| `src/utils/swarm/**` | `src/agent/swarm/` |  |
| `src/utils/task/**` | `src/agent/task/` |  |
| `src/utils/telemetry/**` | `src/observability/telemetry/` |  |
| `src/utils/teleport/**` | `src/remote-control/teleport/` |  |
| `src/utils/todo/**` | `src/tools/todo/` |  |
| `src/utils/ultraplan/**` | `src/agent/ultraplan/` |  |
| `src/utils/*.ts`, `src/utils/*.tsx` | domain 或 `src/shared/utils/` | 檔名有明確 domain 就搬 domain；否則放 shared |

## 最小可交付版本

第一版不用真的搬完整個 repo。最小可交付範圍是：

- 文件明確定義「只搬 code，不改 code」。
- 每個 module 有搬移清單。
- 先挑 2 到 3 個低風險 module 試搬，例如 `backend/`, `observability/`, `platform/`。
- 建立 diff 檢查規則：除了 import/export/require path，不允許其他 code diff。

完成後，團隊就能用同一套規則繼續搬其他 module，而不是在每次 PR 重新討論結構。

