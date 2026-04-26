# Claude Code 行為與 Session 管控分析

> 本文專門分析 `src/` 原始碼中 Claude Code 在不同情境下的行為，重點放在「一個 session 能承載什麼狀態、如何處理回合、工具、中斷、排隊、背景任務與排程」。  
> 檔名依需求保留為 `behaver.md`。

## 主要結論

Claude Code 的 session 不是單純的一問一答 transcript，而是一個可持續運轉的 runtime：

- `QueryEngine` 擁有一段 conversation 的生命週期與可變訊息狀態。
- `query.ts` 負責模型回合、工具結果回填、遞迴續跑、自動 compact、max turn、stop hook、queued command attachment。
- 工具呼叫可以串行、並行、被 permission/hook 擋下、被使用者中斷，或在錯誤時補 synthetic `tool_result` 以維持 API 對話結構。
- React/Ink UI 不直接等同 runtime；使用者輸入、任務通知、cron 結果會進入全域 command queue，再由 UI 或非 React loop 在合適時機消化。
- session 可被 resume、compact、background、foreground，也可承接 cron/scheduled task 與 subagent 的結果。

核心檔案：

```text
src/QueryEngine.ts
src/query.ts
src/services/tools/StreamingToolExecutor.ts
src/services/tools/toolOrchestration.ts
src/services/tools/toolExecution.ts
src/utils/messageQueueManager.ts
src/utils/queueProcessor.ts
src/hooks/useQueueProcessor.ts
src/hooks/useCancelRequest.ts
src/hooks/useSessionBackgrounding.ts
src/utils/cronScheduler.ts
src/utils/processUserInput/processSlashCommand.tsx
src/tasks/LocalAgentTask/LocalAgentTask.tsx
```

## 它是 queue / bus，還是單純 blocking loop？

比較準確的判斷是：Claude Code 不是完整 event bus 架構，也不是單純「agent 心無旁騖把工具呼叫完，user 才能插嘴」。它是 **turn-based agent loop**，外圍加上幾個輕量容器來控管插隊、排程與中斷：

- **模型主流程是 turn-based**：`query.ts` 仍然以「模型輸出 -> tool_use -> tool_result -> 下一輪模型」為核心。
- **使用者輸入與系統事件會進 command queue**：`messageQueueManager.ts` 裡有 module-level `commandQueue`，用來承接 user prompt、task notification、cron result、background agent result、orphaned permission 等。
- **queue 有 priority**：`now > next > later`。使用者輸入通常優先於背景通知，避免 system/task event 餓死 user input。
- **React/Ink 只在安全時機 drain queue**：`useQueueProcessor.ts` 會等 query idle、沒有 active local JSX UI、queue 有項目時才處理。
- **工具也有自己的 execution queue**：`StreamingToolExecutor.ts` 用 `TrackedTool[]` 管工具狀態，依 `isConcurrencySafe()` 決定並行或串行。
- **中斷靠 AbortController tree**：Escape、Ctrl+C、新 prompt interrupt 都會透過 abort signal 影響目前 query 或工具；工具若不可 cancel，仍可能 block 到安全點。

所以它的事件模型比較像：

```text
user / cron / task / background result
  -> commandQueue
  -> queueProcessor 在 turn boundary 或 idle 時 drain
  -> QueryEngine.submitMessage()
  -> query.ts turn loop
  -> tool executor queue
  -> tool_result 回填
  -> 下一輪模型或完成
```

這不是傳統意義上的 pub/sub event bus，因為沒有到處 broadcast topic、也沒有中央 event dispatcher 對每種事件做 routing。它更像是幾個明確用途的 queue：

| 容器 | 管什麼 | 作用 |
|---|---|---|
| `commandQueue` | user prompt、task notification、cron result、background result | 控制什麼時候把外部事件送回主 session |
| `StreamingToolExecutor.tools` | assistant 已產生的 tool_use | 控制工具並行、串行、progress、cancel |
| `AbortController` tree | query/tool/subtool cancellation | 控制 interrupt、user rejection、sibling error |
| session transcript queue/write queue | message persistence | 控制 resume 與 parent chain 一致性 |

關鍵限制是：user 的新輸入通常不會任意插進模型 streaming 的中間。它大多有三種路徑：

1. **排隊**：先進 `commandQueue`，等目前 query 結束或 boundary 到了再處理。
2. **中斷接手**：透過 abort 停掉目前 turn/tool，補齊 synthetic `tool_result` 後讓新 prompt 接手。
3. **作為 attachment drain**：在工具 round 後、下一輪模型前，把 queued command 轉成 attachment 進入上下文。

因此邏輯不是完全簡單，但它的複雜度集中在「turn boundary、queue drain、abort cleanup、tool_result closure」這幾個點，而不是一套泛用事件匯流排。

## 重構直覺：`query.ts` 可以變成 `agent.ts` 嗎？

可以，但要把責任邊界切乾淨。

比較合理的抽象是：把目前 `query.ts` 的核心 ReAct loop 視為未來的 `agent.ts` / `AgentRuntime`。它只負責「拿到一串 messages 後，專心跑 agent loop 到穩定邊界」：

```text
input messages
  -> call model
  -> assistant respond
  -> 如果有 tool_use，執行工具
  -> append tool_result
  -> 再 call model
  -> 直到 final assistant / abort / maxTurns / error
  -> return 新增 messages 與狀態
```

也就是 `agent.ts` 應該負責：

- 呼叫模型。
- 執行 ReAct/tool-call loop。
- 保證每個 `tool_use` 都有對應 `tool_result`。
- 回傳新增 messages、usage、stop reason、error status。
- 尊重 abort signal。

但它不應該負責：

- 使用者什麼時候可以插嘴。
- cron 什麼時候觸發。
- background agent 結果什麼時候回主線。
- queued commands 什麼時候 drain。
- `/resume` 要載入哪段 transcript。
- session 要不要 compact。
- UI 何時顯示 permission dialog。

這些應該是外層 `session.ts` / `SessionController` 的責任。更乾淨的架構會像：

```text
session.ts
  - 擁有 session state
  - 擁有 command queue
  - 決定何時呼叫 agent.run(messages)
  - 處理 user input / cron / task notification / resume / background
  - 控制 abort / interrupt / priority / queue drain

agent.ts
  - 純 agent turn loop
  - 接收 messages + tools + abortSignal
  - 呼叫 model
  - 執行 tool calls
  - 保證 tool_use 都有 tool_result
  - 回傳新增 messages / status / usage

toolExecutor.ts
  - 並行/串行工具
  - permission
  - progress
  - cancellation

contextManager.ts
  - compact
  - token budget
  - memory / attachment 注入
```

所以可以把想法濃縮成一句話：

> `query.ts` 的核心可以變成 `agent.ts`，只負責 ReAct/tool-call loop；`session.ts` 則負責決定何時把哪些 messages 丟給 agent。

但要注意，現在的 `query.ts` 不是純 agent。它已經混入不少 session concern：

- queued command attachment drain。
- compact / reactive compact。
- stop hook。
- max turns。
- token budget continuation。
- task summary。
- resume consistency。
- progress / attachment persistence。

因此如果未來重構，不能直接把整個 `query.ts` 改名成 `agent.ts`。更安全的做法是從 `query.ts` 裡抽出純 loop，把 session 控制、context 管理、queue drain、persistence 逐步搬到外層 controller。

理想上，`AgentRuntime` 應該是一個比較可測的單元：

```ts
type AgentRunInput = {
  messages: Message[]
  tools: Tools
  abortSignal: AbortSignal
  limits: {
    maxTurns?: number
  }
}

type AgentRunResult = {
  status: 'completed' | 'aborted' | 'max_turns' | 'error'
  newMessages: Message[]
  usage: Usage
  stopReason?: string
}
```

而 `SessionController` 則像狀態機：

```text
idle
  -> queue has user prompt
  -> running agent
  -> background event arrives: enqueue
  -> user interrupts: abort current run
  -> agent reaches boundary
  -> drain next command
  -> running agent
```

這樣切完後，agent 的心智模型會很簡單：**拿 messages，跑到 stable boundary，交還控制權**。複雜的 session 排程則集中在 session controller。

## Session 模型

### 1. Conversation owner

`QueryEngine` 註解明確指出：「one QueryEngine per conversation」，每次 `submitMessage()` 是同一 conversation 裡的新 turn。它保存：

- `mutableMessages`：目前 session 的訊息鏈。
- `abortController`：目前 query/turn 的取消控制。
- `permissionDenials`：SDK 回傳用的拒絕紀錄。
- `readFileState`：讀檔 cache / file state。
- `loadedNestedMemoryPaths`、`discoveredSkillNames`：跨單次 submit 內部流程的記憶與 skill discovery 狀態。

也就是說，Claude Code 的 session 層不只是「歷史訊息陣列」，而是一個持有工具狀態、permission 狀態、檔案讀取狀態、模型用量與 transcript 持久化策略的 runtime object。

### 2. Transcript persistence

`QueryEngine.submitMessage()` 會依 `isSessionPersistenceDisabled()` 決定是否寫入 session storage。它對不同 message 類型採不同寫入策略：

- user / system / compact boundary 會較嚴格等待寫入。
- assistant streaming message 多採 fire-and-forget，避免阻塞 generator。
- progress / attachment 也會 inline record，避免 resume 時訊息鏈斷裂。
- compact boundary 前會先 flush preserved segment，避免 resume 載回 compact 前的完整歷史。

這表示 session persistence 的目的不是單純存檔，而是讓 `/resume`、SDK replay、compact 後重建、queued command replay 都能接回正確 parent chain。

## 情境分析：從簡單到複雜

## A. 只是問一個問題

流程大致是：

```text
使用者 prompt
  -> processUserInput
  -> QueryEngine.submitMessage()
  -> query.ts 呼叫模型 streaming
  -> assistant message 逐步 yield
  -> transcript record
  -> result message 回傳
```

特性：

- 不需要工具時，`query.ts` 在模型 stop 後直接完成。
- stop hook 仍可能介入最後結果。
- 若輸出超過 max output tokens，`query.ts` 可能自動用 meta message 要模型「從中斷處繼續」。
- 若 prompt 太長，可能先做 context collapse 或 reactive compact，再 retry。

Session 能力：

- 保留上下文。
- 累積 usage / cost / model usage。
- 可在 SDK 模式 yield partial stream event。
- 可被 max turn / budget / stop hook 攔停。

## B. 請它編輯檔案

編輯檔案通常會觸發工具：

```text
assistant 產生 tool_use
  -> runToolUse()
  -> permission / hook / validation
  -> 實際工具執行
  -> user tool_result 回填
  -> query.ts 進入下一輪模型回合
```

特性：

- `toolExecution.ts` 會先做 schema validation、permission check、hook check。
- permission 可以 allow / deny / ask。
- hook 可以修改 input、直接 allow/deny，或阻止 continuation。
- tool result 必須回填成 `tool_result`，否則 Anthropic API 對話結構會壞掉。
- edit 類工具被使用者拒絕時，會回傳類似「user rejected」的 synthetic result，而不是讓 assistant message 懸空。

Session 能力：

- session 記住工具結果與檔案變化 attachment。
- 可把 permission denial 回報到 SDK result。
- 編輯後的檔案變動可作為 attachment 進入下一輪模型上下文。

## C. 它使用一個工具，而且工具很快

最簡單的工具回合是：

```text
assistant: tool_use(Read)
user: tool_result(...)
assistant: 根據結果回答
```

`query.ts` 會把 tool results 併回 `messagesForQuery`，然後用新的 state `transition: next_turn` 繼續 while loop。這裡的「下一輪」不一定代表使用者看到新的 prompt，而是同一次使用者請求內部的 agent loop。

Session 能力：

- 單次使用者輸入可包含多個模型 turn。
- maxTurns 限制的是這種內部 turn 數。
- `turnCount` 會隨 tool round 增加。

## D. 它使用多個工具

Claude Code 有兩種工具 orchestration：

### 舊/一般批次：`toolOrchestration.ts`

它會把 tool calls 分批：

- concurrency-safe 的連續工具批次並行。
- 非 concurrency-safe 工具單獨串行。
- 並行批次有最大併發數，預設由 `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY` 控制，未設定時為 `10`。

### Streaming tool executor：`StreamingToolExecutor.ts`

它在 tool_use block 還在 streaming 時就可以把工具加入 queue：

- concurrent-safe 工具可和其他 safe 工具並行。
- non-concurrent 工具需要獨占。
- 結果會 buffer，盡量維持工具出現順序。
- progress message 可即時 yield。
- Bash tool 失敗時會 abort sibling subprocesses。

Session 能力：

- 多工具不是單純 `Promise.all`，而是有工具安全性分類、順序保證、錯誤傳播與 UI progress。
- 不安全工具會保守串行，避免檔案/狀態競爭。
- 並行工具的 context modifier 目前有限制，程式註解指出 concurrent tools 尚未完整支援 context modifiers。

## E. 工具呼叫很耗時

長工具執行時，session 會同時管理幾件事：

- `setInProgressToolUseIDs` 更新 UI 狀態。
- progress message 可被 yield 到 UI。
- `AbortController` 可取消工具。
- 若工具支援 interrupt behavior 為 `cancel`，使用者輸入/ESC 可以取消它。
- 若工具 interrupt behavior 是 `block`，中斷會被延後或不直接殺掉工具。

`StreamingToolExecutor.updateInterruptibleState()` 會檢查目前執行中的工具是否全都可 cancel，進而告訴 UI 現在是否有 interruptible tool in progress。

Session 能力：

- 長工具不是黑盒阻塞；可顯示 progress、可被中斷、可產生 synthetic result 補齊 transcript。
- sibling error 可以取消其他相關工具，尤其 Bash 類工具。
- 使用者 interrupt 不一定等於整個 process 掛掉，而是透過 abort reason 區分。

## F. 使用者在工具執行中打斷

中斷有不同語意：

```text
ESC / Ctrl+C / 新輸入
  -> useCancelRequest 或 runtime abort
  -> abortController.abort(reason)
  -> query.ts 檢查 aborted
  -> StreamingToolExecutor 補 tool_result
  -> session 停在可 resume 的一致狀態
```

重要差異：

- `reason === "interrupt"`：通常表示使用者提交了新訊息，中斷訊息本身可不再額外寫入，因為下一個 queued user message 已提供上下文。
- 其他 abort：會產生 user interruption message。
- 工具若已產生 `tool_use`，即使中斷也要補 `tool_result`，避免對話斷鏈。

Session 能力：

- 可區分「使用者拒絕工具」、「使用者送新 prompt 打斷」、「runtime/model error」。
- 中斷時會做 cleanup，例如部分 MCP/computer use cleanup。
- 可避免 phantom interrupt，把真正 runtime error 顯示出來。

## G. React/Ink 回合中被打斷

React/Ink UI 不是直接把所有 input 丟進模型。它透過 command queue 和 query guard 協調。

相關檔案：

```text
src/hooks/useQueueProcessor.ts
src/utils/queueProcessor.ts
src/utils/messageQueueManager.ts
src/hooks/useCancelRequest.ts
```

行為：

- `useQueueProcessor` 用 `useSyncExternalStore` 訂閱 command queue 和 query guard。
- 只有在沒有 active query、沒有 active local JSX UI 時才處理 queue。
- slash command 和 bash mode 逐個處理。
- 一般 prompt / task notification 會依 mode batch drain。
- Escape 優先取消 active task；若沒有 active task，才 pop queue。

這表示 React render loop 中的「打斷」不是直接改正在跑的 generator，而是：

1. UI keybinding 觸發取消或 queue 操作。
2. active query 用 abort signal 停止。
3. idle 時由 queue processor 處理下一批 queued commands。

Session 能力：

- UI 可以在 runtime 忙碌時先收下使用者輸入。
- 排隊資料會記錄 queue-operation，避免 resume 找不到 conversation。
- queued command 有 priority：`now` > `next` > `later`。
- system/task notification 不會隨便混入使用者可編輯 input。

## H. 使用者連續輸入多個問題

`messageQueueManager.ts` 是 module-level singleton queue，所有來源都走這裡：

- 使用者 prompt。
- task notification。
- orphaned permission。
- cron/scheduled task result。
- background agent result。
- channel message。

Queue 行為：

- `enqueue()` 預設 priority `next`，偏向使用者輸入。
- `enqueuePendingNotification()` 預設 priority `later`，避免系統通知餓死使用者輸入。
- `dequeue()` 依 priority 選最高，priority 相同 FIFO。
- `popAllEditable()` 可把 queued prompt 拉回 input buffer 給使用者編輯。

Session 能力：

- 支援「Claude 正在跑，但我又輸入下一句」。
- 支援系統通知和使用者 prompt 同時存在。
- 支援把 queued command 作為 attachment 插進同一個 ongoing turn，但 slash command 會排除，必須等 turn 結束走 command path。

## I. Background / foreground session

`useSessionBackgrounding.ts` 支援把目前 session 背景化：

- Ctrl+B 類操作可把目前 query 交給 background task。
- foregrounded task 的 messages 會同步回 main view。
- foregrounded task 若仍 running，main view 的 loading 和 abort controller 會接到該 task。
- task 完成或 abort 後會回到 background 狀態。

`LocalAgentTask` 則負責 local agent task 狀態：

- `abortController`
- `messages`
- `progress`
- `pendingMessages`
- `isBackgrounded`
- `retain`
- `diskLoaded`
- output file path

Session 能力：

- 一個主 session 可把長任務放到背景繼續跑。
- UI 可前景查看某個 background task transcript。
- foreground 時 Escape 可取消該 task。
- background agent 完成後會 enqueue task notification 給主模型。

## J. Subagent / worker / task 通知

背景 agent 完成時，`LocalAgentTask.enqueueAgentNotification()` 會把 XML-like notification 放入 command queue：

```text
<task-notification>
  <task-id>...</task-id>
  <output-file>...</output-file>
  <status>completed|failed|killed</status>
  <summary>...</summary>
  ...
</task-notification>
```

這個 notification 不是立刻打斷主模型，而是：

- priority 預設 `later`。
- 若主模型 turn 內有合適時機，`query.ts` 可把 queued notification 作為 attachment drain。
- 若主模型 idle，`useQueueProcessor` 會啟動下一次處理。

Session 能力：

- 支援多 agent 背景執行。
- 支援 agent 完成後非同步回報。
- 支援只把對應 `agentId` 的 notification drain 給該 subagent，避免全域 queue 污染。

## K. Cron job / scheduled task

`cronScheduler.ts` 是非 React scheduler core，負責 `.claude/scheduled_tasks.json`：

- 每秒 check。
- watch scheduled task file。
- 用 lock 避免多個 session 同時 fire 同一批 task。
- 支援 missed one-shot task。
- 支援 recurring task、permanent task、session-only task。
- 支援 jitter，避免大量 session 同一秒打爆。
- 可由 REPL、SDK、daemon caller 共用。

觸發後的 prompt 不是直接同步跑模型，而是呼叫 `onFire(prompt)`。在 assistant/Kairos 模式中，`processSlashCommand.tsx` 對 forked command 有 fire-and-forget 背景路徑：

- 排程任務可啟動背景 subagent。
- 背景 subagent 完成後把 `<scheduled-task-result>` enqueue 回主 queue。
- `isMeta: true` 讓結果不出現在一般 queue preview / transcript。
- `skipSlashCommands: true` 避免結果文字被誤當 slash command。

Session 能力：

- session 可以被時間喚醒。
- cron 結果能回流進主 agent，由主 agent 決定是否通知使用者。
- 多個 startup scheduled tasks 可並行跑，不阻塞使用者輸入。
- missed task 可在啟動時提示處理。

## L. Resume / restore

Resume 相關路徑分散在：

```text
src/commands/resume/*
src/utils/sessionRestore.ts
src/utils/sessionStorage.ts
src/utils/conversationRecovery.ts
src/assistant/sessionHistory.ts
```

從 `QueryEngine` 和 `query.ts` 註解可看出幾個 resume 關鍵：

- queue-operation 也會被 record，否則只有 queue 操作時 `/resume` 可能找不到 conversation。
- progress / attachment 需要 inline record，否則 dedup 和 parent uuid chain 可能錯位。
- compact boundary 必須在 session storage 中正確保留 preserved segment。
- 工具中斷時必須補 missing tool_result，否則 resume 後模型歷史不合法。

Session 能力：

- 可以從 transcript 重建對話。
- compact 後可只載入保留段與摘要。
- SDK 可 replay user messages。
- queued command attachment 可以 replay 成 user message。

## M. Permission 與 session policy

工具不是一產生就直接執行。`toolExecution.ts` 會經過：

1. tool 是否存在。
2. input schema 是否 valid。
3. hook / PreToolUse。
4. permission mode。
5. classifier / rule / interactive prompt。
6. tool 實際執行。

Permission 結果會影響 session：

- allow：工具執行。
- deny：回傳 error tool_result，記錄 denial。
- ask：交給 UI permission dialog。
- updatedInput：hook 或 permission 可修改工具 input。
- permission feedback 可加到 tool_result。

Session 能力：

- 權限決策是 session-aware，可以記錄拒絕、套用規則、被 hook 改寫。
- headless/SDK 和 interactive path 共享部分 permission 語意。
- permission denial 會出現在 SDK result 的 `permission_denials`。

## N. Stop hook / continuation / compact

模型完成後不一定真正結束。`query.ts` 還可能：

- 執行 post-sampling hook。
- 執行 stop hook。
- 若 stop hook blocking，注入 blocking error，讓模型再跑一輪。
- 若 max output tokens，注入 meta recovery message。
- 若 prompt too long，嘗試 context collapse 或 reactive compact。
- 若 token budget 要求，注入 nudge message 讓模型收斂或繼續。

Session 能力：

- 一個使用者 prompt 可以演化成多輪內部 correction loop。
- hooks 可以阻止 continuation 或要求模型修正。
- compact 是 session lifecycle 的一部分，不是外部清理工作。

## O. Headless / SDK 模式

`QueryEngine` 原本就被設計成可用於 headless/SDK path：

- 以 async generator yield `SDKMessage`。
- 支援 `includePartialMessages`。
- 支援 `replayUserMessages`。
- 支援 `jsonSchema` 與 synthetic structured output。
- 支援 max turns / max budget / task budget。
- session persistence 可開關。

差異：

- interactive mode 有 React/Ink permission UI、queue processor、keyboard interrupt。
- SDK/headless 沒有 UI 時，permission 和 elicitation 需要由 host 提供 handler 或以非互動方式處理。

Session 能力：

- 同一套 query lifecycle 可跑 CLI/TUI，也可跑 SDK。
- session id、usage、permission denial、structured output 都能回傳給 caller。

## Session 管控能力總表

| 能力 | 行為 | 主要檔案 |
|---|---|---|
| 多 turn conversation | 同一 session 內多次 `submitMessage()` | `QueryEngine.ts` |
| 單 prompt 多模型輪 | tool result 後自動遞迴下一輪 | `query.ts` |
| transcript persistence | 記錄 user/assistant/system/progress/attachment | `QueryEngine.ts`, `sessionStorage.ts` |
| resume | 從 session log 重建對話 | `sessionRestore.ts`, `conversationRecovery.ts` |
| tool permission | allow/deny/ask/update input | `toolExecution.ts`, `toolHooks.ts` |
| 並行工具 | concurrency-safe batch / streaming executor | `toolOrchestration.ts`, `StreamingToolExecutor.ts` |
| 長工具 progress | progress message 即時 yield | `StreamingToolExecutor.ts`, `toolExecution.ts` |
| 中斷 | abort signal + synthetic tool_result | `query.ts`, `StreamingToolExecutor.ts`, `useCancelRequest.ts` |
| command queue | user input / notification / cron result 排隊 | `messageQueueManager.ts` |
| React/Ink queue drain | idle 時處理 queue | `useQueueProcessor.ts`, `queueProcessor.ts` |
| background session | Ctrl+B 背景化/前景查看 | `useSessionBackgrounding.ts` |
| background agent | task notification 回主 queue | `LocalAgentTask.tsx` |
| cron | scheduled task file + lock + jitter | `cronScheduler.ts`, `cronTasks.ts` |
| compact | prompt too long / auto compact recovery | `query.ts` |
| stop hook | completion 後可阻止或要求修正 | `query.ts`, `stopHooks.ts` |
| SDK replay | replay user / partial messages / result object | `QueryEngine.ts` |

## 可能的極端情境

### 1. 使用者正在等一個很慢的 Bash，突然輸入新問題

預期行為：

- UI 會把新問題放入 queue，或觸發 interrupt。
- 若 Bash interrupt behavior 可 cancel，abort signal 會取消工具。
- `StreamingToolExecutor` 補 synthetic `tool_result`。
- `query.ts` 若 abort reason 是 `interrupt`，不額外注入 interruption message。
- 下一個 queued prompt 接手 session。

風險：

- 若工具本身不響應 abort，process 層仍可能拖延。
- non-cancel 工具會 block interrupt。

### 2. 模型一次發出多個 Read/Grep

預期行為：

- 被判定 concurrency-safe 的工具可並行。
- 結果仍按工具出現順序 yield。
- 任一 read 類失敗通常不會取消其他 read。

風險：

- concurrent context modifier 尚未完整支援。

### 3. 模型一次發出 mkdir、cd、edit、test 這類有狀態序列

預期行為：

- 非 concurrency-safe 工具會串行。
- Bash error 會取消 sibling subprocesses。
- 後續模型會看到錯誤 tool_result。

風險：

- 若模型把彼此依賴的工作錯誤標成 concurrency-safe 工具，仍要靠工具自己的 `isConcurrencySafe()` 保守判定。

### 4. 背景 agent 完成時主 agent 正在跑

預期行為：

- 背景 agent enqueue task notification。
- 如果主 turn 內有 attachment drain 時機，notification 可變成 attachment。
- 否則等主 turn idle 後由 queue processor 跑。
- 使用者 prompt priority 通常高於 task notification。

### 5. cron 在啟動時一次 fire 多個任務

預期行為：

- scheduler 發現 due task。
- Kairos/assistant mode 中 forked command 走 fire-and-forget。
- 多個 subagent 可並行跑。
- 結果各自 enqueue `<scheduled-task-result>`。

風險：

- MCP server 尚未 ready 時，背景 runner 會 polling 等待一段時間，但仍可能遇到外部服務初始化問題。

### 6. prompt 太長或圖片太大

預期行為：

- `query.ts` 可能 withheld error。
- 先嘗試 context collapse。
- 再嘗試 reactive compact。
- media size error 可能透過 compact strip/retry。
- 失敗後才 surface error。

### 7. resume 到一個工具被中斷的 session

預期行為：

- 如果中斷時已補 synthetic `tool_result`，resume 的 message chain 仍合法。
- 如果 progress/attachment 已 inline record，parent uuid chain 不會錯位。

風險：

- 程式註解多次提到 orphan conversation、dedup 錯位、compact boundary tail 等問題，表示 session log 一致性是高風險區。

## 對重構 session runtime 的啟示

如果未來要把 `src/` 拆成更清楚的 frontend/backend，session 管控至少要保留以下邊界：

### Backend runtime 應擁有

- `QueryEngine`
- model turn loop
- tool execution / orchestration
- abort tree
- transcript persistence
- compact / resume
- permission policy core
- cron scheduler core
- background agent runtime

### Frontend/TUI 應擁有

- keybinding
- prompt input state
- permission dialog rendering
- queue preview / editable pop
- background task panel
- foreground/background task view

### Shared protocol 應定義

- message / attachment / progress schema
- queued command schema
- task notification schema
- permission request/decision schema
- session event schema

## 目前架構最重要的設計點

1. **所有工具結果都必須閉合**
   一旦 assistant 產生 `tool_use`，session 必須產生對應 `tool_result`，即使是錯誤、中斷、拒絕、fallback。

2. **queue 是跨 React 與非 React 的橋**
   UI、SDK、background task、cron、subagent 都可能塞訊息進 queue；runtime 只在安全時機 drain。

3. **中斷不是單一布林值**
   abort reason 會影響是否顯示 interruption message、是否取消工具、是否讓 queued prompt 接手。

4. **session log 是可恢復狀態機，不只是歷史文字**
   queue operation、progress、attachment、compact boundary 都會影響 resume 是否正確。

5. **背景任務不是另一個孤立功能**
   background agent、scheduled task、task notification 都回流到同一個 session loop。

6. **React/Ink 只是控制面**
   真正的 session lifecycle 在 `QueryEngine` / `query.ts` / tools / queue；UI 透過 hooks 訂閱與操作。

## 後續可深入的方向

- 逐一畫出 `QueryEngine.submitMessage()` 的 state machine。
- 分析 `ToolUseContext` 裡每個欄位在 session 中的生命週期。
- 分析 `/resume` 如何挑選 latest log、如何處理 compact boundary。
- 分析 permission mode：default / plan / auto / bypass 在 session 上的差異。
- 分析 AgentTool、TaskCreateTool、SendMessageTool 如何把 subagent 事件映射回主 session。
- 將 `messageQueueManager` 的 priority 與 drain 條件畫成完整 queue lifecycle。
