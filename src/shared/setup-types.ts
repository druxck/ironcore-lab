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

export const INSTALL_COMMAND =
  'sudo apt-get update && sudo apt-get install -y build-essential clang gdb valgrind make cmake strace ltrace'
