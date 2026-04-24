# Frontend / Backend Structure Proposal

## 原則

這版從「專案已經有 frontend」的角度規劃。CLI/TUI 不是 backend；CLI 是一種 frontend，React/Ink terminal UI 也是 frontend。所有只跟畫面、輸入、提示、dialog、terminal rendering 有關的 code，都應該放到 `src/frontend/`。

Backend 指的是 agent runtime、LLM turn loop、tool execution、session persistence、memory、MCP、remote-control server side、permission policy、platform adapter、API client 等不依賴 UI 呈現的核心能力。

這仍然是搬運型重構：

- 只搬既有 code。
- 只改 import/export/require 路徑。
- 不重寫 function body。
- 不拆檔、不合檔、不改命名。
- 如果某個檔案同時包辦 frontend/backend，先放到「未規劃前後分離」區塊，不在第一版硬拆。

## Repo 目標結構

```text
repo/
  src/
    backend/
      app/
      runtime/
      agent/
      tools/
      session/
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
      shared/
    frontend/
      cli/
      tui/
      ui/
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
  research/
  assets/
```

## 分層定義

### `src/backend/`

放不應該依賴 terminal UI 或 browser DOM 的核心能力。Backend 可以被 CLI frontend、未來 Web frontend、SDK、remote-control 共同呼叫。

Backend 包含：

- LLM runtime。
- agent/subagent/task execution。
- LLM tool call executable code。
- session transcript。
- MCP client/server integration。
- memory/compact。
- permission policy。
- backend/provider API client。
- OS/shell/git/fs adapter。

### `src/frontend/`

放使用者介面。現在的 frontend 是 CLI/TUI，不是 Web，但仍然是 frontend。

Frontend 包含：

- CLI args / command routing / stdout formatting。
- Ink/React terminal UI。
- terminal screens。
- dialogs。
- UI hooks。
- React context。
- UI state selectors/presentation state。
- voice/buddy/output style 等只服務互動體驗的 code。

### `src/shared/`

只放前後端都能安全共用的低階型別、protocol、DTO、constants、pure utility。不能放 Node-only runtime，也不能放 React/Ink component。

### `src/unresolved-fullstack/`

第一版不能硬拆的 fullstack code 放這裡。這些檔案通常同時做：

- CLI/frontend wiring。
- runtime/backend 啟動。
- UI rendering。
- domain action。

因為本次規則是「搬運，不改 code」，所以這些檔案先標記為未規劃前後分離，後續再用專門 PR 拆責任。

## `src/backend/app/`

功能：backend process/bootstrap 中不依賴 UI 的啟動狀態。

搬入：

```text
src/bootstrap/**
src/projectOnboardingState.ts
```

不直接搬：

```text
src/main.tsx
src/replLauncher.tsx
src/interactiveHelpers.tsx
src/setup.ts
```

這些同時做 CLI/TUI 啟動與 runtime wiring，先放 `src/unresolved-fullstack/app/`。

## `src/backend/runtime/`

功能：LLM turn loop、QueryEngine、tool execution loop、SDK runtime、process user input。

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
src/query/tokenBudget.ts -> src/backend/context-management/
src/query/stopHooks.ts -> src/backend/hooks/
src/services/tools/toolHooks.ts -> src/backend/hooks/
```

## `src/backend/agent/`

功能：agent、subagent、task runtime、team/swarm、agent-owned tool calls。

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
```

Frontend pieces moved separately:

```text
src/components/agents/** -> src/frontend/tui/agent/
src/components/tasks/** -> src/frontend/tui/tasks/
src/components/teams/** -> src/frontend/tui/teams/
src/commands/agents/** -> src/frontend/commands/agents/
src/commands/tasks/** -> src/frontend/commands/tasks/
src/commands/ultraplan.tsx -> src/frontend/commands/ultraplan.tsx
```

## `src/backend/tools/`

功能：LLM 可直接呼叫的通用 tool call executable code。這不是 frontend。tool 裡如果有 `UI.tsx`，第一版因搬運限制先跟 tool 留一起；後續前後分離時再搬到 frontend。

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
src/tools/AgentTool/** -> src/backend/agent/tools/
src/tools/Task*Tool/** -> src/backend/agent/tools/
src/tools/Team*Tool/** -> src/backend/agent/tools/
src/tools/SendMessageTool/** -> src/backend/agent/tools/
src/tools/SkillTool/** -> src/backend/skills/tool/
src/tools/MCPTool/** -> src/backend/mcp/tools/
src/tools/ListMcpResourcesTool/** -> src/backend/mcp/tools/
src/tools/ReadMcpResourceTool/** -> src/backend/mcp/tools/
src/tools/McpAuthTool/** -> src/backend/mcp/tools/
```

## `src/backend/session/`

功能：session id、transcript、resume、rewind、session metadata、session history。

搬入：

```text
src/utils/sessionStorage.ts
src/utils/sessionStoragePortable.ts
src/types/logs.ts
src/assistant/sessionHistory.ts
src/utils/conversationRecovery.ts
src/utils/concurrentSessions.ts
src/utils/crossProjectResume.ts
src/utils/listSessionsImpl.ts
src/utils/transcriptSearch.ts
```

Frontend command/UI:

```text
src/commands/session/** -> src/frontend/commands/session/
src/commands/resume/** -> src/frontend/commands/resume/
src/commands/rewind/** -> src/frontend/commands/rewind/
src/commands/rename/** -> src/frontend/commands/rename/
src/commands/export/** -> src/frontend/commands/export/
```

## `src/backend/context-management/`

功能：token budget、context compact、micro compact、context projection、tool result storage。

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
```

Frontend command/UI:

```text
src/components/messages/CompactBoundaryMessage.tsx -> src/frontend/tui/messages/
src/commands/compact/** -> src/frontend/commands/compact/
src/commands/context/** -> src/frontend/commands/context/
src/commands/ctx_viz/** -> src/frontend/commands/ctx_viz/
```

## `src/backend/memory/`

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
```

Frontend command/UI:

```text
src/components/memory/** -> src/frontend/tui/memory/
src/components/messages/UserMemoryInputMessage.tsx -> src/frontend/tui/messages/
src/components/messages/teamMemCollapsed.tsx -> src/frontend/tui/messages/
src/components/messages/teamMemSaved.ts -> src/frontend/tui/messages/
src/commands/memory/** -> src/frontend/commands/memory/
```

## `src/backend/mcp/`

功能：MCP config、client、transport、resources/tools/prompts、MCP auth。

搬入：

```text
src/services/mcp/**
src/entrypoints/mcp.ts
src/tools/MCPTool/**
src/tools/McpAuthTool/**
src/tools/ListMcpResourcesTool/**
src/tools/ReadMcpResourceTool/**
src/utils/mcp/**
src/utils/mcpValidation.ts
src/utils/mcpWebSocketTransport.ts
src/utils/mcpOutputStorage.ts
src/utils/mcpInstructionsDelta.ts
src/utils/computerUse/mcpServer.ts
src/utils/claudeInChrome/mcpServer.ts
```

Frontend command/UI:

```text
src/services/mcpServerApproval.tsx -> src/frontend/tui/mcp/
src/components/mcp/** -> src/frontend/tui/mcp/
src/commands/mcp/** -> src/frontend/commands/mcp/
src/cli/handlers/mcp.tsx -> src/frontend/cli/handlers/mcp.tsx
```

## `src/backend/skills/`

功能：skill registry、bundled skills、MCP-provided skills、SkillTool executable code。

搬入：

```text
src/skills/**
src/tools/SkillTool/**
src/utils/skills/**
src/utils/suggestions/skillUsageTracking.ts
src/utils/telemetry/skillLoadedEvent.ts
```

Frontend command/UI:

```text
src/commands/skills/** -> src/frontend/commands/skills/
src/components/skills/** -> src/frontend/tui/skills/
src/hooks/useSkillsChange.ts -> src/frontend/hooks/
src/hooks/useSkillImprovementSurvey.ts -> src/frontend/hooks/
```

## `src/backend/plugins/`

功能：plugin registry、bundled plugins、marketplace、plugin options。

搬入：

```text
src/plugins/**
src/utils/plugins/**
src/services/plugins/**
src/utils/dxt/**
```

Frontend command/UI:

```text
src/commands/plugin/** -> src/frontend/commands/plugin/
src/commands/reload-plugins/** -> src/frontend/commands/reload-plugins/
src/hooks/useManagePlugins.ts -> src/frontend/hooks/
src/hooks/useMergedCommands.ts -> src/frontend/hooks/
src/hooks/useMergedTools.ts -> src/frontend/hooks/
src/hooks/useMergedClients.ts -> src/frontend/hooks/
src/hooks/usePluginRecommendationBase.tsx -> src/frontend/hooks/
src/hooks/useOfficialMarketplaceNotification.tsx -> src/frontend/hooks/
src/hooks/useLspPluginRecommendation.tsx -> src/frontend/hooks/
src/hooks/notifs/usePluginInstallationStatus.tsx -> src/frontend/hooks/notifs/
src/hooks/notifs/usePluginAutoupdateNotification.tsx -> src/frontend/hooks/notifs/
src/components/ClaudeCodeHint/** -> src/frontend/tui/plugin-hints/
```

## `src/backend/hooks/`

功能：hook schema、hook config、hook executor、tool/session/compact lifecycle hooks。

搬入：

```text
src/schemas/hooks.ts
src/types/hooks.ts
src/utils/hooks.ts
src/utils/hooks/**
src/query/stopHooks.ts
src/services/tools/toolHooks.ts
```

Frontend command/UI:

```text
src/commands/hooks/** -> src/frontend/commands/hooks/
src/components/hooks/** -> src/frontend/tui/hooks/
src/hooks/useDeferredHookMessages.ts -> src/frontend/hooks/
src/hooks/renderPlaceholder.ts -> src/frontend/hooks/
```

## `src/backend/permissions/`

功能：permission rules、approval policy、sandbox permission、computer-use permission。

搬入：

```text
src/types/permissions.ts
src/utils/permissions/**
src/utils/sandbox/**
src/utils/computerUse/**
src/utils/classifierApprovals.ts
src/utils/classifierApprovalsHook.ts
```

Frontend command/UI:

```text
src/hooks/toolPermission/** -> src/frontend/hooks/toolPermission/
src/components/permissions/** -> src/frontend/tui/permissions/
src/commands/permissions/** -> src/frontend/commands/permissions/
src/commands/sandbox-toggle/** -> src/frontend/commands/sandbox-toggle/
```

例外：

```text
src/utils/computerUse/mcpServer.ts -> src/backend/mcp/computer-use/
```

## `src/backend/persistence/`

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

## `src/backend/remote-control/`

功能：bridge、remote session、direct connect、teleport、mobile remote、upstream proxy。

搬入：

```text
src/bridge/**
src/remote/**
src/server/**
src/upstreamproxy/**
src/utils/teleport.tsx
src/utils/teleport/**
src/utils/background/remote/**
src/utils/deepLink/**
```

Frontend command/hooks:

```text
src/commands/bridge/** -> src/frontend/commands/bridge/
src/commands/bridge-kick.ts -> src/frontend/commands/bridge-kick.ts
src/commands/mobile/** -> src/frontend/commands/mobile/
src/commands/remote-setup/** -> src/frontend/commands/remote-setup/
src/commands/remote-env/** -> src/frontend/commands/remote-env/
src/commands/teleport/** -> src/frontend/commands/teleport/
src/hooks/useRemoteSession.ts -> src/frontend/hooks/
src/hooks/useReplBridge.tsx -> src/frontend/hooks/
src/hooks/useTeleportResume.tsx -> src/frontend/hooks/
src/hooks/useDirectConnect.ts -> src/frontend/hooks/
```

## `src/backend/platform/`

功能：OS/shell/git/fs/native integration。這些不是 task，也不是 frontend，是 tool/task/runtime 會用到的底層 adapter/helper。

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

## `src/backend/observability/`

功能：analytics、diagnostics、logs、profiling、cost/usage tracking。

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
```

Frontend command/UI:

```text
src/commands/cost/** -> src/frontend/commands/cost/
src/commands/usage/** -> src/frontend/commands/usage/
src/commands/extra-usage/** -> src/frontend/commands/extra-usage/
src/commands/feedback/** -> src/frontend/commands/feedback/
src/commands/heapdump/** -> src/frontend/commands/heapdump/
src/commands/debug-tool-call/** -> src/frontend/commands/debug-tool-call/
src/commands/ant-trace/** -> src/frontend/commands/ant-trace/
src/commands/break-cache/** -> src/frontend/commands/break-cache/
```

## `src/backend/backend-api/`

功能：external/backend/provider API client、OAuth、model config、limits。

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

## `src/frontend/cli/`

功能：CLI 作為 frontend 的輸入輸出層。包含 args、structured output、stdout/stderr、CLI-only command routing。

搬入：

```text
src/cli/**
src/commands.ts
src/history.ts
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

## `src/frontend/tui/`

功能：React/Ink Terminal UI。這是目前主要 frontend，不是 backend。

搬入：

```text
src/components/**
src/screens/**
src/ink/**
src/ink.ts
src/context/**
src/context.ts
src/dialogLaunchers.tsx
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

Domain-specific UI can be nested under:

```text
src/frontend/tui/mcp/
src/frontend/tui/memory/
src/frontend/tui/permissions/
src/frontend/tui/agent/
src/frontend/tui/tasks/
```

## `src/frontend/hooks/`

功能：React hooks、notification hooks、UI side-effect hooks。

搬入：

```text
src/hooks/**
```

例外：hook 若是 backend executor/config，例如 `src/utils/hooks/**`，放 `src/backend/hooks/`。

## `src/frontend/state/`

功能：frontend current process AppState。這裡保存 TUI/runtime 當下共享的 in-memory state。

搬入：

```text
src/state/**
```

注意：如果未來 Web frontend 出現，這裡是 CLI/TUI frontend state，不是 Web state。Web 會有自己的 `frontend/src/state/`。

## `src/frontend/voice/`

功能：voice mode 的 frontend/input UI 與 voice service glue。

搬入：

```text
src/voice/**
src/context/voice.tsx
src/hooks/useVoice.ts
src/hooks/useVoiceEnabled.ts
src/hooks/useVoiceIntegration.tsx
```

## `src/shared/`

功能：frontend/backend 都能共用的 protocol、types、constants、pure utils。

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
src/types/logs.ts -> src/backend/session/
src/types/permissions.ts -> src/backend/permissions/
src/types/hooks.ts -> src/backend/hooks/
src/constants/apiLimits.ts -> src/backend/backend-api/
src/constants/oauth.ts -> src/backend/backend-api/
src/constants/tools.ts -> src/backend/tools/
```

## `src/unresolved-fullstack/`

功能：目前同時包辦 frontend/backend 的 code。因為本次只搬運，不改 code，所以這些檔案第一版先放這裡，避免假裝已經前後分離。

搬入：

```text
src/main.tsx
src/setup.ts
src/replLauncher.tsx
src/interactiveHelpers.tsx
```

可能也先放這裡的類型：

```text
src/commands/** 中同時 render UI 並直接執行 domain action 的 command
src/tools/** 中同時包含 executable code 與 UI.tsx 的 tool folder
src/components/** 中直接呼叫 backend side effect 的 component
src/hooks/** 中同時操作 UI state 與 runtime side effect 的 hook
```

後續真的要前後分離時，再拆成：

```text
frontend -> 只負責 input/render/navigation
backend  -> 提供 callable service/API/runtime action
shared   -> DTO/schema/type
```

## 原本 `src/*` 頂層搬遷表

| 原本位置 | 新位置 |
| --- | --- |
| `src/assistant/**` | `src/backend/session/` |
| `src/bootstrap/**` | `src/backend/app/bootstrap/` |
| `src/bridge/**` | `src/backend/remote-control/bridge/` |
| `src/buddy/**` | `src/frontend/tui/buddy/` |
| `src/cli/**` | `src/frontend/cli/` |
| `src/commands/**` | 多數到 `src/frontend/commands/`；domain action 仍由 backend 提供 |
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
| `src/schemas/**` | backend domain schema |
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

## 未來 Web Frontend 擴展

現在的 frontend 是 CLI/TUI。未來如果要接網頁 React frontend，新增 repo-root `frontend/`，不要塞進 `src/frontend/`。`src/frontend/` 保留給現有 CLI/TUI frontend，`frontend/` 是 browser frontend。

建議：

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

Web client 呼叫 backend/control plane 的 client。不要直接 import CLI runtime code。Web 和 CLI/TUI frontend 都應透過 HTTP/WebSocket/SDK protocol 呼叫 backend。

### `packages/protocol/`

Web frontend、CLI frontend、backend 共用型別：

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

這裡只放 DTO/schema/type，不放 runtime implementation，避免 Web bundle 拉進 Node/Bun-only code。

### `packages/sdk-client/`

Web frontend 若要控制 CLI/remote session，可做 browser-safe SDK client：

```text
packages/sdk-client/
  src/
    httpClient.ts
    websocketClient.ts
    sessionsClient.ts
    tasksClient.ts
    agentsClient.ts
```

## 前後分離後的長期邊界

長期應該變成：

```text
src/backend/
  提供 runtime service、session service、agent service、tool service

src/frontend/
  CLI/TUI frontend，只呼叫 backend service，不直接包 business logic

frontend/
  Web frontend，只呼叫 HTTP/WebSocket/SDK API

src/shared/ 或 packages/protocol/
  共享 DTO/schema/type
```

第一版先不要硬拆 fullstack code。先把 fullstack code 標在 `src/unresolved-fullstack/`，保留後續拆分空間。
