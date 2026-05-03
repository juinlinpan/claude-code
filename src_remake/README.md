# src_remake

`src_remake/` 是平行於既有 `src/` 的重構工作區，目標是依研究文件逐步把 monolith 重新整理成 frontend/backend/shared 分層。

## 目前策略

- 不直接改寫既有 `src/` 的執行入口。
- 先建立新架構與模組路由表，再用小批次搬運方式擴張。
- 新搬入的模組在早期可以暫時依賴既有 `src/`，等 shared/platform/persistence 成熟後再收斂。

## Import 與 legacy 相依規則

- `src_remake/shared/**` 只能依賴 external package 或 `src_remake/shared/**`；不要直接回指 legacy `src/`。
- `src_remake/backend/**` 目前可以暫時依賴 legacy `src/`，但只限尚未在 `src_remake/` 建立對應落點的 utility 或 adapter。
- 若 `src_remake/` 模組仍需引用 legacy `src/`，應把理由記錄在 `remake_todo_list.md` 的當輪 slice，方便後續回收。
- `src_remake/frontend/**` 與 `src_remake/backend/**` 都不應新增對 `src_remake/unresolved-fullstack/**` 的依賴；該目錄只用來暫存待拆分模組。
- 新 round 優先搬 pure constants、types、leaf utilities；只有在 shared foundations 足夠後才擴大 legacy import 收斂。

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

## 已開始搬運

- `shared/constants/common.ts`
- `shared/constants/messages.ts`
- `shared/types/ids.ts`
- `backend/app/projectOnboardingState.ts`
- `backend/app/index.ts`
- `module-map.ts`

## 搬運規則

- 保持每一步都小而可驗證。
- 優先處理 leaf module 與 pure utility。
- 避免在還沒建立 shared 基礎前就大規模搬動 runtime 與 frontend。