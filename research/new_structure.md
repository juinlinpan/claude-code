# New Structure Proposal

## 原則

這份文件描述重整後 repo 應該長什麼樣子。這是「搬運型重構」：只搬既有 code，並更新 import/export/require 路徑；不重寫 function body，不拆檔，不合檔，不改命名，不改 runtime 行為。

重整目標是讓 PM 和工程師能從資料夾名稱判斷功能位置，同時確保原本 `src/` 下所有 code 都有新位置。

## 建議 Repo 結構

```text
repo/
  src/
    app/
    app-state/
    cli/
    backend/
    runtime/
    agent/
    tools/
    hooks/
    skills/
    mcp/
    plugins/
    remote-control/
    context-management/
    memory/
    permissions/
    persistence/
    ui/
    platform/
    observability/
    shared/
  research/
  assets/
```

未來如果要接 Web React frontend，再新增：

```text
repo/
  frontend/
  packages/
```

詳細設計見文末「未來 Web Frontend 擴展」。

## `src/app/`

功能：process 啟動、bootstrap、全域 wiring、REPL launch。這層是程式進入點，不放 domain business logic。

搬入：

```text
src/main.tsx
src/setup.ts
src/replLauncher.tsx
src/interactiveHelpers.tsx
src/projectOnboardingState.ts
src/history.ts
src/bootstrap/**
src/entrypoints/**
```

例外：

```text
src/entrypoints/mcp.ts -> src/mcp/entrypoints/mcp.ts
src/entrypoints/sdk/** -> src/runtime/sdk/**
src/entrypoints/agentSdkTypes.ts -> src/runtime/sdk/agentSdkTypes.ts
```

## `src/app-state/`

功能：current process 的 in-memory AppState。這不是 persisted session log，也不是 task executor，而是 runtime/UI 當下共享的狀態樹。

搬入：

```text
src/state/**
```

典型用途：

- current messages
- active tasks 狀態
- modal/dialog 狀態
- permission prompt 狀態
- MCP connection 狀態
- tool progress
- teammate view state

## `src/cli/`

功能：CLI args、command registry、structured IO、non-interactive mode、純 CLI 管理型 commands。

搬入：

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
src/commands/env/**
src/commands/clear/**
src/commands/color/**
src/commands/desktop/**
src/commands/copy/**
src/commands/terminalSetup/**
src/commands/onboarding/**
src/commands/reset-limits/**
src/commands/rate-limit-options/**
src/commands/oauth-refresh/**
src/commands/mock-limits/**
src/commands/good-claude/**
src/commands/perf-issue/**
src/commands/issue/**
src/commands/share/**
src/commands/stickers/**
src/commands/tag/**
src/commands/security-review.ts
src/commands/brief.ts
src/commands/advisor.ts
src/commands/btw/**
src/commands/branch/**
src/commands/effort/**
src/commands/fast/**
```

規則：

- command 若只是 CLI 設定/狀態/幫助，放 `cli/commands/`。
- command 若明確屬於 domain，放對應 domain，例如 `mcp/commands/`, `memory/commands/`, `remote-control/commands/`。

## `src/backend/`

功能：backend API、LLM/provider API、OAuth、usage/limits、model config、remote managed settings。

搬入：

```text
src/services/api/**
src/services/oauth/**
src/services/claudeAiLimits.ts
src/services/policyLimits/**
src/constants/apiLimits.ts
src/constants/oauth.ts
src/utils/api.ts
src/utils/apiPreconnect.ts
src/utils/auth.ts
src/utils/oauth.ts
src/utils/sessionIngressAuth.ts
src/utils/model/**
src/utils/aws.ts
src/utils/awsAuthStatusManager.ts
src/utils/billing.ts
src/utils/betas.ts
```

建議子結構：

```text
src/backend/
  api/
  oauth/
  model/
  limits/
  policy-limits/
```

## `src/runtime/`

功能：LLM turn loop、QueryEngine、tool execution loop、SDK runtime、process user input、runtime message helpers。

搬入：

```text
src/QueryEngine.ts
src/query.ts
src/query/config.ts
src/query/deps.ts
src/services/tools/toolExecution.ts
src/services/tools/toolOrchestration.ts
src/services/tools/StreamingToolExecutor.ts
src/services/toolUseSummary/**
src/services/MagicDocs/**
src/utils/queryContext.ts
src/utils/queryHelpers.ts
src/utils/queryProfiler.ts
src/utils/processUserInput/**
src/utils/messages/**
src/utils/messages.ts
src/utils/messagePredicates.ts
src/utils/messageQueueManager.ts
src/utils/contentArray.ts
src/utils/controlMessageCompat.ts
src/utils/embeddedTools.ts
src/utils/groupToolUses.ts
src/utils/toolPool.ts
src/utils/toolErrors.ts
src/utils/toolSchemaCache.ts
src/hooks/useMainLoopModel.ts
src/entrypoints/sdk/**
src/entrypoints/agentSdkTypes.ts
```

例外：

```text
src/query/tokenBudget.ts -> src/context-management/
src/query/stopHooks.ts -> src/hooks/
src/services/tools/toolHooks.ts -> src/hooks/
```

## `src/agent/`

功能：agent、subagent、task runtime、team/swarm、agent-owned tool calls。`agent/tools/` 裡的 code 仍是 LLM tool call executable code，只是 ownership 是 agent domain。

搬入：

```text
src/Task.ts
src/tasks.ts
src/tasks/**
src/coordinator/**
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
src/utils/swarm/**
src/utils/task/**
src/utils/tasks.ts
src/utils/forkedAgent.ts
src/utils/teammate.ts
src/utils/teammateContext.ts
src/utils/teammateMailbox.ts
src/utils/teamDiscovery.ts
src/utils/teamMemoryOps.ts
src/utils/directMemberMessage.ts
src/utils/inProcessTeammateHelpers.ts
src/utils/ultraplan/**
src/services/AgentSummary/**
src/components/agents/**
src/components/tasks/**
src/components/teams/**
src/components/TaskListV2.tsx
src/components/ResumeTask.tsx
src/components/TeammateViewHeader.tsx
src/commands/agents/**
src/commands/tasks/**
src/commands/ultraplan.tsx
src/commands/backfill-sessions/**
```

建議子結構：

```text
src/agent/
  tools/
  tasks/
  coordinator/
  swarm/
  teammate/
  summary/
  commands/
  ui/
```

## `src/tools/`

功能：LLM 可直接呼叫、且不屬於特定 domain 的通用 tool call executable code。這些 module 通常不能獨立執行，而是由 runtime 載入、驗證 input、跑 permission，再執行 tool。

搬入：

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
src/tools/testing/**
src/tools/shared/gitOperationTracking.ts
src/tools/utils.ts
src/utils/todo/**
src/services/lsp/**
```

不放這裡：

```text
src/tools/AgentTool/** -> src/agent/tools/AgentTool/
src/tools/Task*Tool/** -> src/agent/tools/
src/tools/Team*Tool/** -> src/agent/tools/
src/tools/SendMessageTool/** -> src/agent/tools/
src/tools/SkillTool/** -> src/skills/tool/
src/tools/MCPTool/** -> src/mcp/tools/
src/tools/ListMcpResourcesTool/** -> src/mcp/tools/
src/tools/ReadMcpResourceTool/** -> src/mcp/tools/
src/tools/McpAuthTool/** -> src/mcp/tools/
```

## `src/hooks/`

功能：hook schema、hook config、hook executor、tool/session/compact lifecycle hooks、hook command/UI。

搬入：

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

## `src/skills/`

功能：skill registry、bundled skills、MCP-provided skills、SkillTool、skill UI/commands。

搬入：

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

## `src/mcp/`

功能：MCP config、client、transport、resources/tools/prompts、MCP auth、MCP command/UI。

搬入：

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

## `src/plugins/`

功能：plugin registry、bundled plugins、marketplace、plugin options、plugin command/UI。

搬入：

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

## `src/remote-control/`

功能：bridge、remote session、direct connect、teleport、mobile remote、upstream proxy。

搬入：

```text
src/bridge/**
src/remote/**
src/server/**
src/upstreamproxy/**
src/commands/bridge/**
src/commands/bridge-kick.ts
src/commands/mobile/**
src/commands/remote-setup/**
src/commands/remote-env/**
src/commands/teleport/**
src/utils/teleport.tsx
src/utils/teleport/**
src/utils/background/remote/**
src/utils/deepLink/**
src/hooks/useRemoteSession.ts
src/hooks/useReplBridge.tsx
src/hooks/useTeleportResume.tsx
src/hooks/useDirectConnect.ts
```

## `src/context-management/`

功能：token budget、context compact、micro compact、compact UI/message、tool result storage、context commands。

搬入：

```text
src/services/compact/**
src/services/tokenEstimation.ts
src/query/tokenBudget.ts
src/utils/tokenBudget.ts
src/utils/tokens.ts
src/utils/truncate.ts
src/utils/toolResultStorage.ts
src/utils/workloadContext.ts
src/utils/context.ts
src/utils/contextAnalysis.ts
src/utils/contextSuggestions.ts
src/components/messages/CompactBoundaryMessage.tsx
src/commands/compact/**
src/commands/context/**
src/commands/ctx_viz/**
```

## `src/memory/`

功能：project memory、session memory、team memory、memory extraction、autoDream/background consolidation。

搬入：

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

## `src/permissions/`

功能：permission rules、approval UI、sandbox permission、tool permission handlers、computer-use permission。

搬入：

```text
src/types/permissions.ts
src/utils/permissions/**
src/hooks/toolPermission/**
src/components/permissions/**
src/commands/permissions/**
src/commands/sandbox-toggle/**
src/utils/sandbox/**
src/utils/computerUse/**
src/utils/classifierApprovals.ts
src/utils/classifierApprovalsHook.ts
```

例外：

```text
src/utils/computerUse/mcpServer.ts -> src/mcp/computer-use/
```

## `src/persistence/`

功能：settings、config、secure storage、file-backed stores、cron store、migrations、remote managed settings。

搬入：

```text
src/utils/config.ts
src/utils/configConstants.ts
src/utils/settings/**
src/utils/secureStorage/**
src/utils/filePersistence/**
src/utils/cron.ts
src/utils/cronTasks.ts
src/utils/cronTasksLock.ts
src/utils/cronScheduler.ts
src/utils/cronJitterConfig.ts
src/utils/cachePaths.ts
src/utils/lockfile.ts
src/utils/jsonRead.ts
src/utils/markdownConfigLoader.ts
src/services/settingsSync/**
src/services/remoteManagedSettings/**
src/migrations/**
```

不放這裡：

```text
src/utils/sessionStorage.ts -> src/session/
src/utils/tasks.ts -> src/agent/
```

## `src/ui/`

功能：Terminal UI/TUI、Ink renderer、screens、React contexts、shared UI hooks、voice UI、buddy UI、output styles。

搬入：

```text
src/components/**
src/screens/**
src/ink/**
src/ink.ts
src/context/**
src/context.ts
src/dialogLaunchers.tsx
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
src/services/PromptSuggestion/**
src/services/tips/**
src/utils/suggestions/**
src/utils/claudeInChrome/**
src/utils/displayTags.ts
src/utils/highlightMatch.tsx
src/utils/horizontalScroll.ts
src/utils/hyperlink.ts
src/utils/ink.ts
src/utils/keyboardShortcuts.ts
src/utils/logoV2Utils.ts
src/utils/pasteStore.ts
src/utils/textHighlighting.ts
src/utils/theme.ts
src/utils/systemTheme.ts
src/utils/terminal.ts
src/utils/terminalPanel.ts
src/utils/tmuxSocket.ts
src/utils/fullscreen.ts
```

例外：domain-specific UI 優先放 domain。例如 `components/mcp/**` 放 `mcp/ui/`，`components/permissions/**` 放 `permissions/ui/`。

## `src/platform/`

功能：OS/shell/git/fs/native integration。這些不是 task，也不是 tool，而是 tool/task/runtime 會用到的底層平台 adapter/helper。

搬入：

```text
src/native-ts/**
src/utils/bash/**
src/utils/shell/**
src/utils/powershell/**
src/utils/git/**
src/utils/github/**
src/utils/nativeInstaller/**
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
src/utils/fileRead.ts
src/utils/fileReadCache.ts
src/utils/fileStateCache.ts
src/utils/glob.ts
src/utils/path.ts
src/utils/diff.ts
src/utils/git.ts
src/utils/gitDiff.ts
src/utils/gitSettings.ts
src/utils/githubRepoPathMapping.ts
src/utils/getWorktreePaths.ts
src/utils/getWorktreePathsPortable.ts
src/utils/detectRepository.ts
src/utils/editor.ts
src/utils/ide.ts
src/utils/idePathConversion.ts
src/utils/jetbrains.ts
src/utils/iTermBackup.ts
src/utils/localInstaller.ts
src/utils/pdf.ts
src/utils/pdfUtils.ts
```

## `src/observability/`

功能：analytics、diagnostics、logs、profiling、cost/usage tracking、debug tools。

搬入：

```text
src/services/analytics/**
src/services/diagnosticTracking.ts
src/services/internalLogging.ts
src/services/vcr.ts
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
src/utils/doctorDiagnostic.ts
src/utils/doctorContextWarnings.ts
src/utils/heapDumpService.ts
src/utils/heatmap.ts
src/cost-tracker.ts
src/costHook.ts
src/commands/cost/**
src/commands/usage/**
src/commands/extra-usage/**
src/commands/feedback/**
src/commands/heapdump/**
src/commands/debug-tool-call/**
src/commands/ant-trace/**
src/commands/break-cache/**
```

## `src/shared/`

功能：沒有明確 domain 的純 utility、共用 constants/types。若檔名看得出 domain，就不要放 shared。

搬入：

```text
src/constants/**
src/types/**
src/utils/array.ts
src/utils/async.ts
src/utils/binaryCheck.ts
src/utils/browser.ts
src/utils/bufferedWriter.ts
src/utils/CircularBuffer.ts
src/utils/crypto.ts
src/utils/Cursor.ts
src/utils/env.ts
src/utils/envDynamic.ts
src/utils/envUtils.ts
src/utils/envValidation.ts
src/utils/errors.ts
src/utils/format.ts
src/utils/formatBriefTimestamp.ts
src/utils/frontmatterParser.ts
src/utils/generators.ts
src/utils/generatedFiles.ts
src/utils/gracefulShutdown.ts
src/utils/hash.ts
src/utils/imagePaste.ts
src/utils/imageResizer.ts
src/utils/imageStore.ts
src/utils/imageValidation.ts
src/utils/intl.ts
src/utils/json.ts
src/utils/lazySchema.ts
src/utils/managedEnv.ts
src/utils/managedEnvConstants.ts
src/utils/markdown.ts
src/utils/memoize.ts
src/utils/modifiers.ts
src/utils/notebook.ts
src/utils/objectGroupBy.ts
src/utils/peerAddress.ts
src/utils/preflightChecks.tsx
src/utils/privacyLevel.ts
src/utils/sleep.ts
src/utils/systemDirectories.ts
src/utils/systemPrompt.ts
src/utils/systemPromptType.ts
src/utils/taggedId.ts
src/utils/tempfile.ts
src/utils/timeouts.ts
src/utils/treeify.ts
src/utils/user.ts
src/utils/userAgent.ts
src/utils/userPromptKeywords.ts
src/utils/uuid.ts
src/utils/warningHandler.ts
src/utils/withResolvers.ts
src/utils/words.ts
src/utils/yaml.ts
src/utils/xml.ts
src/utils/zodToJsonSchema.ts
```

Domain exceptions:

```text
src/types/logs.ts -> src/session/
src/types/permissions.ts -> src/permissions/
src/types/hooks.ts -> src/hooks/
src/constants/apiLimits.ts -> src/backend/
src/constants/oauth.ts -> src/backend/
src/constants/tools.ts -> src/tools/
```

## 原本 `src/*` 頂層搬遷表

| 原本位置 | 新位置 |
| --- | --- |
| `src/assistant/**` | `src/session/` |
| `src/bootstrap/**` | `src/app/bootstrap/` |
| `src/bridge/**` | `src/remote-control/bridge/` |
| `src/buddy/**` | `src/ui/buddy/` |
| `src/cli/**` | `src/cli/` |
| `src/commands/**` | 分散到各 domain 的 `commands/` |
| `src/components/**` | `src/ui/components/` 或各 domain `ui/` |
| `src/constants/**` | `src/shared/constants/`，domain exception 另搬 |
| `src/context/**` | `src/ui/context/` |
| `src/coordinator/**` | `src/agent/coordinator/` |
| `src/entrypoints/**` | `src/app/entrypoints/`，MCP/SDK 例外另搬 |
| `src/hooks/**` | `src/ui/hooks/` 或各 domain hooks |
| `src/ink/**` | `src/ui/ink/` |
| `src/keybindings/**` | `src/ui/keybindings/` |
| `src/memdir/**` | `src/memory/project/` |
| `src/migrations/**` | `src/persistence/migrations/` |
| `src/moreright/**` | `src/ui/moreright/` |
| `src/native-ts/**` | `src/platform/native-ts/` |
| `src/outputStyles/**` | `src/ui/outputStyles/` |
| `src/plugins/**` | `src/plugins/bundled/` |
| `src/query/**` | `src/runtime/query/`，compact/hooks 例外另搬 |
| `src/remote/**` | `src/remote-control/session/` |
| `src/schemas/**` | domain schema |
| `src/screens/**` | `src/ui/screens/` |
| `src/server/**` | `src/remote-control/direct-connect/` |
| `src/services/**` | 分散到 domain，見各 module |
| `src/skills/**` | `src/skills/` |
| `src/state/**` | `src/app-state/` |
| `src/tasks/**` | `src/agent/tasks/` |
| `src/tools/**` | `src/tools/` 或 domain `tools/` |
| `src/types/**` | `src/shared/types/`，domain exception 另搬 |
| `src/upstreamproxy/**` | `src/remote-control/upstreamproxy/` |
| `src/utils/**` | 分散到 domain 或 `src/shared/utils/` |
| `src/vim/**` | `src/ui/vim/` |
| `src/voice/**` | `src/ui/voice/` |
| `src/commands.ts` | `src/cli/commands.ts` |
| `src/context.ts` | `src/ui/context.ts` |
| `src/cost-tracker.ts` | `src/observability/cost-tracker.ts` |
| `src/costHook.ts` | `src/observability/costHook.ts` |
| `src/dialogLaunchers.tsx` | `src/ui/dialogLaunchers.tsx` |
| `src/history.ts` | `src/app/history.ts` |
| `src/ink.ts` | `src/ui/ink.ts` |
| `src/interactiveHelpers.tsx` | `src/app/interactiveHelpers.tsx` |
| `src/main.tsx` | `src/app/main.tsx` |
| `src/projectOnboardingState.ts` | `src/app/projectOnboardingState.ts` |
| `src/query.ts` | `src/runtime/query.ts` |
| `src/QueryEngine.ts` | `src/runtime/QueryEngine.ts` |
| `src/replLauncher.tsx` | `src/app/replLauncher.tsx` |
| `src/setup.ts` | `src/app/setup.ts` |
| `src/Task.ts` | `src/agent/Task.ts` |
| `src/tasks.ts` | `src/agent/tasks.ts` |
| `src/Tool.ts` | `src/tools/Tool.ts` |
| `src/tools.ts` | `src/tools/tools.ts` |

## 未來 Web Frontend 擴展

目前 React 是 Terminal UI，不是 Web frontend。若之後要接網頁前端，建議新增 `frontend/`，不要把 Web app 放進目前 `src/ui/`。原因是 `src/ui/` 依賴 Ink/terminal renderer，而 Web React 會依賴 DOM/router/browser build。

建議擴展：

```text
repo/
  frontend/
    src/
      app/
      pages/
      components/
      features/
      api/
      state/
      styles/
      main.tsx
    package.json
    vite.config.ts
  packages/
    protocol/
    sdk-client/
```

### `frontend/src/app/`

Web app bootstrap，例如 router、provider、layout、auth shell。

### `frontend/src/pages/`

頁面層，例如 sessions、agents、memory、mcp、settings、tasks。

### `frontend/src/features/`

用產品功能切分：

```text
frontend/src/features/sessions/
frontend/src/features/agents/
frontend/src/features/tasks/
frontend/src/features/mcp/
frontend/src/features/memory/
frontend/src/features/settings/
frontend/src/features/permissions/
```

### `frontend/src/api/`

Web client 呼叫 backend/control plane 的 client。不要直接 import CLI runtime code。Web 和 CLI 之間應透過 HTTP/WebSocket/SDK protocol 溝通。

### `packages/protocol/`

若 CLI runtime 和 Web frontend 要共享型別，建議放 protocol package：

```text
packages/protocol/
  src/
    session.ts
    task.ts
    agent.ts
    mcp.ts
    memory.ts
    permissions.ts
```

這裡只放 DTO/schema/type，不放 runtime implementation，避免 Web bundle accidentally 拉進 CLI/Node-only code。

### `packages/sdk-client/`

Web frontend 若要控制 CLI/remote session，可做一個 browser-safe SDK client：

```text
packages/sdk-client/
  src/
    httpClient.ts
    websocketClient.ts
    sessionsClient.ts
    tasksClient.ts
    agentsClient.ts
```

### Web 與現有 CLI 的邊界

建議保留：

```text
src/
  runtime/
  agent/
  tools/
  mcp/
  memory/
  remote-control/
```

作為 Node/Bun runtime。Web frontend 不直接 import 這些 module，而是呼叫：

```text
HTTP API / WebSocket / SDK protocol
```

未來若要讓 Web 控制 session，可在 `src/remote-control/` 或新增 `src/server-api/` 放 server endpoint，但仍維持搬運原則：第一階段先不重寫，只保留架構位置。

### 為什麼保留 `frontend/`

- 避免 Ink React 和 DOM React 混在一起。
- 避免 browser bundle 引入 Node/Bun-only code。
- Web frontend 可以獨立 build/deploy。
- `packages/protocol/` 可以共享型別，不共享 runtime。
- CLI/TUI 和 Web UI 可以同時存在，指向同一套 remote-control/session API。
