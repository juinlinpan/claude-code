# src_remake

`src_remake/` 是平行於既有 `src/` 的重構工作區，目標是依研究文件逐步把 monolith 重新整理成 frontend/backend/shared 分層。

## 目前策略

- 不直接改寫既有 `src/` 的執行入口。
- 先建立新架構與模組路由表，再用小批次搬運方式擴張。
- 新搬入的模組在早期可以暫時依賴既有 `src/`，等 shared/platform/persistence 成熟後再收斂。

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

- `backend/app/projectOnboardingState.ts`
- `backend/app/index.ts`
- `module-map.ts`

## 搬運規則

- 保持每一步都小而可驗證。
- 優先處理 leaf module 與 pure utility。
- 避免在還沒建立 shared 基礎前就大規模搬動 runtime 與 frontend。