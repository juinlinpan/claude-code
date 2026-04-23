# Claude Code Repo Overview（以 Agent Harness 角度）

## 研究範圍
這份 overview 先聚焦在「把 LLM 變成可執行 agent」的主幹架構：啟動、對話 loop、工具系統、任務/多 agent、狀態管理、外部整合。

---

## 1) CLI/Runtime 啟動與組態層
**對應路徑：** `src/main.tsx`, `src/entrypoints/init.ts`, `src/bootstrap/`

### 職責
- 啟動整個 CLI runtime（參數、模式、環境變數、初始化順序）。
- 做 session-level 初始化：設定、安全環境變數、網路/proxy/mtls、telemetry、cleanup、LSP manager 等。
- 組裝 REPL 執行上下文（model、tools、commands、權限模式、session metadata）。

### 為什麼是核心 module
它是 agent harness 的「process orchestrator」，決定整個 agent 後續可用能力與安全邊界。

---

## 2) Query/推理主迴圈（LLM Turn Engine）
**對應路徑：** `src/query.ts`, `src/query/`

### 職責
- 接收訊息流與 system/user context，驅動一次或多次回合推理。
- 處理工具呼叫、compact/context 管理、token budget、stop hooks。
- 在 streaming 過程中協調「模型輸出 ↔ 工具執行 ↔ 回填 tool result」的迴圈。

### 為什麼是核心 module
它是「agent 腦幹」：決定每一輪如何思考、何時呼叫工具、何時結束或續跑。

---

## 3) Tool Framework（能力暴露層）
**對應路徑：** `src/Tool.ts`, `src/tools.ts`, `src/tools/*`

### 職責
- 定義工具介面、schema、輸入驗證、permission context、progress 回報。
- 維護可用工具 registry（檔案、shell、web、LSP、MCP、agent 管理、task 管理等）。
- 透過 feature flag / env gate 動態裁剪工具集合。

### 為什麼是核心 module
agent harness 的核心價值在「可操作能力」。這層把 LLM 轉為可執行系統（actuator layer）。

---

## 4) Tool Orchestration（工具執行排程）
**對應路徑：** `src/services/tools/toolOrchestration.ts`, `src/services/tools/`

### 職責
- 將工具呼叫分批：可併發（read-only / concurrency-safe）與必須串行（可能改狀態）兩類。
- 控制工具併發上限、追蹤 in-progress tool IDs、套用 context modifier。
- 保證工具副作用順序與一致性。

### 為什麼是核心 module
這是 agent runtime 的「action scheduler」，直接影響正確性、效率與穩定性。

---

## 5) Task System（背景任務與生命週期）
**對應路徑：** `src/Task.ts`, `src/tasks.ts`, `src/tasks/*`

### 職責
- 抽象 task type/status（pending/running/completed/failed/killed）。
- 管理 local shell、local agent、remote agent、dream 等任務型別。
- 提供 kill/cleanup 與輸出落盤（task output file）等生命週期能力。

### 為什麼是核心 module
agent harness 不只單輪對話，還需要可持續、可中斷、可觀測的背景工作模型。

---

## 6) Multi-Agent / Delegation（子代理與協作）
**對應路徑：** `src/tools/AgentTool/*`, `src/coordinator/*`, `src/tools/shared/spawnMultiAgent.ts`

### 職責
- `AgentTool` 讓主 agent 可派工給子 agent（前景/背景、隔離模式、remote/worktree）。
- 支援 team/coordinator 模式，建立代理間通訊與任務追蹤。
- 管理 delegated agent 的 prompt、回傳、進度通知、收斂結果。

### 為什麼是核心 module
這是從「單 agent」進化成「agent swarm/harness」的關鍵能力層。

---

## 7) State & TUI（互動介面與狀態容器）
**對應路徑：** `src/state/*`, `src/ink.ts`, `src/context/*`, `src/components/*`

### 職責
- 以集中式 AppState 管理 session、權限、task、MCP、plugins、UI footer/視圖等。
- 以 Ink + React 建構 terminal UI，承載 prompt/input、任務顯示、通知與互動元件。
- 維持工具執行中與回合間的可視化與可操作性。

### 為什麼是核心 module
agent harness 在 CLI 場景下，本質上是「stateful interactive runtime」，不是單純 API wrapper。

---

## 8) MCP Integration（外部工具生態整合）
**對應路徑：** `src/services/mcp/*`, `src/tools/MCPTool/*`, `src/tools/ListMcpResourcesTool/*`

### 職責
- 管理 MCP client 連線（stdio/sse/http/ws transport）。
- 載入 MCP tools/resources/prompts，並注入到可用工具集合。
- 處理 MCP 認證、session expired、tool call 失敗、結果截斷/持久化。

### 為什麼是核心 module
它讓 agent harness 從「內建工具」擴展到「外部能力網路」，決定可擴充性上限。

---

## 9) Command + Skills + Plugins（可擴充操作面）
**對應路徑：** `src/commands.ts`, `src/skills/*`, `src/utils/plugins/*`, `src/plugins/*`

### 職責
- 提供 slash command 操作層（session、config、mcp、review、tasks...）。
- 從 markdown/frontmatter 載入 skills，並提供參數替換、tools 限制、hooks。
- 載入插件命令/技能，形成可插拔擴充機制。

### 為什麼是核心 module
這層是「人類操作入口 + 組織化最佳實踐封裝」；使 agent harness 可產品化、可客製化。

---

## 10) Remote/Bridge 連線層
**對應路徑：** `src/bridge/*`, `src/remote/*`, `src/server/*`

### 職責
- 管理 REPL bridge（與遠端控制面同步 session 與訊息）。
- 支援 direct-connect session 建立與遠端執行模式。
- 處理 inbound 控制訊息、權限回應、session 建立/續連。

### 為什麼是核心 module
這層把本地 agent harness 擴展成可遠端協作與多端整合的系統。

---

## 11) Supporting Services（橫切關注點）
**對應路徑：** `src/services/analytics/*`, `src/services/compact/*`, `src/services/autoDream/*`, `src/utils/permissions/*`, `src/utils/settings/*`

### 職責
- 觀測與實驗（analytics/growthbook）、context compact、背景記憶整理（autoDream）。
- 權限策略（allow/deny/ask/auto mode）與設定來源整合（user/project/policy）。
- 這些服務貫穿 query loop、tools、task 與 UI。

### 為什麼是核心 module
它們決定 agent harness 的「可治理性、穩定性、成本與安全性」。

---

## 總結（Agent Harness 視角）
若把這個 repo 當作一個 agent harness 系統，可以抽象成：

1. **Runtime 啟動與設定**（`main/init/bootstrap`）
2. **推理主迴圈**（`query`）
3. **工具能力層 + 排程器**（`Tool + tools + toolOrchestration`）
4. **任務與多代理執行模型**（`Task + AgentTool + coordinator`）
5. **狀態/UI 與人機互動**（`state + ink + context/components`）
6. **外部擴充/整合**（`MCP + skills/plugins + bridge/remote`）
7. **橫切治理能力**（`permissions/settings/analytics/compact/memory`）

這個分層讓它不只是「聊天 CLI」，而是一個具備：
- 可執行（tools）
- 可委派（multi-agent）
- 可觀測（analytics/task state）
- 可治理（permissions/policies）
- 可擴充（MCP/skills/plugins）

的完整 agent harness runtime。
