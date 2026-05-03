export type RemakePhase =
  | 'phase-0-structure'
  | 'phase-1-foundations'
  | 'phase-2-backend-domain'
  | 'phase-3-frontend'
  | 'phase-4-unresolved'

export type ModuleRoute = {
  phase: RemakePhase
  newPath: string
  notes: string
  sources: string[]
}

export const moduleRouteMap: Record<string, ModuleRoute> = {
  sharedConstants: {
    phase: 'phase-1-foundations',
    newPath: 'src_remake/shared/constants',
    notes: 'Pure constants and small config literals that can move without runtime changes.',
    sources: [
      'src/constants/common.ts',
      'src/constants/messages.ts',
      'src/constants/errorIds.ts',
      'src/constants/toolLimits.ts',
      'src/constants/turnCompletionVerbs.ts',
    ],
  },
  sharedTypes: {
    phase: 'phase-1-foundations',
    newPath: 'src_remake/shared/types',
    notes: 'Cross-layer branded IDs and other pure type helpers.',
    sources: ['src_remake/shared/types/ids.ts', 'src/types/**'],
  },
  backendApp: {
    phase: 'phase-1-foundations',
    newPath: 'src_remake/backend/app',
    notes: 'Backend bootstrap state and project onboarding. Prefer leaf modules first.',
    sources: ['src/bootstrap/**', 'src/projectOnboardingState.ts'],
  },
  backendRuntime: {
    phase: 'phase-2-backend-domain',
    newPath: 'src_remake/backend/runtime',
    notes: 'Query loop, QueryEngine, tool orchestration, and message processing.',
    sources: ['src/QueryEngine.ts', 'src/query.ts', 'src/query/**', 'src/services/tools/**'],
  },
  backendAgent: {
    phase: 'phase-2-backend-domain',
    newPath: 'src_remake/backend/agent',
    notes: 'Tasks, subagents, swarm, and agent-owned execution.',
    sources: ['src/Task.ts', 'src/tasks.ts', 'src/tasks/**', 'src/coordinator/**'],
  },
  backendTools: {
    phase: 'phase-2-backend-domain',
    newPath: 'src_remake/backend/tools',
    notes: 'LLM-executable tools. UI-bearing tool folders remain transitional until later separation.',
    sources: ['src/Tool.ts', 'src/tools.ts', 'src/tools/**'],
  },
  backendSession: {
    phase: 'phase-2-backend-domain',
    newPath: 'src_remake/backend/session',
    notes: 'Transcript, restore, resume, and session history.',
    sources: ['src/assistant/sessionHistory.ts', 'src/utils/sessionStorage.ts', 'src/utils/sessionRestore.ts'],
  },
  backendContextManagement: {
    phase: 'phase-2-backend-domain',
    newPath: 'src_remake/backend/context-management',
    notes: 'Token budget, compact pipeline, and message budgeting.',
    sources: ['src/query/tokenBudget.ts', 'src/services/compact/**'],
  },
  backendMemory: {
    phase: 'phase-2-backend-domain',
    newPath: 'src_remake/backend/memory',
    notes: 'Project memory, session memory, and background consolidation.',
    sources: ['src/memdir/**', 'src/services/SessionMemory/**', 'src/services/autoDream/**'],
  },
  backendMcp: {
    phase: 'phase-2-backend-domain',
    newPath: 'src_remake/backend/mcp',
    notes: 'MCP transport, tools, resources, and auth integration.',
    sources: ['src/services/mcp/**', 'src/tools/MCPTool/**'],
  },
  backendPlatform: {
    phase: 'phase-1-foundations',
    newPath: 'src_remake/backend/platform',
    notes: 'Shell, git, fs, and native adapters. Good candidate for early migration.',
    sources: ['src/native-ts/**', 'src/utils/bash/**', 'src/utils/git/**'],
  },
  backendPersistence: {
    phase: 'phase-1-foundations',
    newPath: 'src_remake/backend/persistence',
    notes: 'Settings, secure storage, migration, and other local persistence.',
    sources: ['src/utils/settings/**', 'src/utils/secureStorage/**', 'src/migrations/**'],
  },
  backendPermissions: {
    phase: 'phase-2-backend-domain',
    newPath: 'src_remake/backend/permissions',
    notes: 'Permission policy and sandbox enforcement.',
    sources: ['src/utils/permissions/**', 'src/utils/sandbox/**'],
  },
  backendRemoteControl: {
    phase: 'phase-2-backend-domain',
    newPath: 'src_remake/backend/remote-control',
    notes: 'Bridge, remote sessions, and server-side control plane.',
    sources: ['src/bridge/**', 'src/remote/**', 'src/server/**'],
  },
  backendObservability: {
    phase: 'phase-1-foundations',
    newPath: 'src_remake/backend/observability',
    notes: 'Analytics, logs, telemetry, and diagnostics.',
    sources: ['src/services/analytics/**', 'src/utils/telemetry/**'],
  },
  backendApi: {
    phase: 'phase-1-foundations',
    newPath: 'src_remake/backend/backend-api',
    notes: 'Provider and backend API clients.',
    sources: ['src/services/api/**', 'src/utils/model/**'],
  },
  frontendCli: {
    phase: 'phase-3-frontend',
    newPath: 'src_remake/frontend/cli',
    notes: 'CLI argument handling and stdout-oriented frontend entrypoints.',
    sources: ['src/cli/**', 'src/commands.ts'],
  },
  frontendTui: {
    phase: 'phase-3-frontend',
    newPath: 'src_remake/frontend/tui',
    notes: 'Ink and React-based terminal UI.',
    sources: ['src/components/**', 'src/screens/**', 'src/ink/**'],
  },
  frontendHooks: {
    phase: 'phase-3-frontend',
    newPath: 'src_remake/frontend/hooks',
    notes: 'UI-facing React hooks only. Mixed hooks should wait.',
    sources: ['src/hooks/**'],
  },
  frontendState: {
    phase: 'phase-3-frontend',
    newPath: 'src_remake/frontend/state',
    notes: 'Frontend app state and selectors.',
    sources: ['src/state/**', 'src/context/**'],
  },
  frontendCommands: {
    phase: 'phase-3-frontend',
    newPath: 'src_remake/frontend/commands',
    notes: 'Command UI layer and slash-command presentation.',
    sources: ['src/commands/**'],
  },
  frontendVoice: {
    phase: 'phase-3-frontend',
    newPath: 'src_remake/frontend/voice',
    notes: 'Voice mode and related input/presentation modules.',
    sources: ['src/voice/**'],
  },
  unresolvedFullstack: {
    phase: 'phase-4-unresolved',
    newPath: 'src_remake/unresolved-fullstack',
    notes: 'Modules that mix UI, runtime bootstrapping, and domain execution.',
    sources: ['src/main.tsx', 'src/setup.ts', 'src/replLauncher.tsx', 'src/interactiveHelpers.tsx'],
  },
}

export const initialRemakeTargets = [
  'sharedConstants',
  'sharedTypes',
  'backendApp',
  'backendPlatform',
  'backendPersistence',
  'backendObservability',
  'backendApi',
] as const