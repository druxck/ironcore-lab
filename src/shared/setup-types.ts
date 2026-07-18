export type RequiredTool = 'gcc' | 'clang' | 'gdb' | 'valgrind' | 'make' | 'cmake' | 'strace' | 'ltrace'

export const REQUIRED_TOOLS: RequiredTool[] = [
  'gcc',
  'clang',
  'gdb',
  'valgrind',
  'make',
  'cmake',
  'strace',
  'ltrace'
]

export interface ToolStatus {
  tool: RequiredTool
  installed: boolean
  version?: string
}

export type WslDistroState = 'not-installed' | 'stopped' | 'running' | 'unknown'

export interface EnvironmentStatus {
  wslInstalled: boolean
  distroName: string | null
  distroState: WslDistroState
  tools: ToolStatus[]
  allToolsPresent: boolean
  runnerDeployed: boolean
  checkedAt: string
}

export const APT_PACKAGES = ['build-essential', 'clang', 'gdb', 'valgrind', 'make', 'cmake', 'strace', 'ltrace']

export const INSTALL_COMMAND = `sudo apt-get update && sudo apt-get install -y ${APT_PACKAGES.join(' ')}`

/**
 * Pushed (not request/response) progress events, sent main -> renderer while
 * a background install is running. See IpcEventMap below for the channels.
 */
export interface ToolchainInstallProgressEvent {
  phase: 'updating' | 'installing' | 'done' | 'error'
  /** 0-100, overall across the whole install (not per-package). */
  percent: number
  message: string
}

export interface WslInstallProgressEvent {
  phase: 'waiting-for-approval' | 'installing' | 'done' | 'error'
  /** 0-100 when parseable from wsl.exe's own output, null otherwise (still show elapsed time). */
  percent: number | null
  message: string
  elapsedMs: number
}

export interface IpcEventMap {
  'setup:toolchainInstallProgress': ToolchainInstallProgressEvent
  'setup:wslInstallProgress': WslInstallProgressEvent
}

export type IpcEvent = keyof IpcEventMap
