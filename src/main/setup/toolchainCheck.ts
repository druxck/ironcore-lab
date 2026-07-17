import { execInWsl, spawnWsl, WSL_DISTRO } from '../wsl/wslBridge'
import {
  REQUIRED_TOOLS,
  type EnvironmentStatus,
  type RequiredTool,
  type ToolStatus,
  type WslDistroState
} from '@shared/setup-types'

interface DistroInfo {
  installed: boolean
  name: string | null
  state: WslDistroState
}

/**
 * `wsl -l -v` prints a table like:
 *   NAME                   STATE           VERSION
 * * Ubuntu                 Running         2
 *   docker-desktop         Stopped         2
 * The leading `*` marks the default distro. We look specifically for our
 * target distro name rather than assuming it's the default.
 */
async function detectDistro(): Promise<DistroInfo> {
  const result = await spawnWsl(['-l', '-v'], 10_000)
  if (result.exitCode !== 0 && !result.stdout) {
    return { installed: false, name: null, state: 'not-installed' }
  }

  const lines = result.stdout
    .split(/\r?\n/)
    .map((rawLine) => rawLine.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 0)

  for (const line of lines) {
    const cleaned = line.replace(/^\*/, '').trim()
    if (cleaned.toLowerCase().startsWith(WSL_DISTRO.toLowerCase())) {
      const parts = cleaned.split(' ')
      const stateRaw = (parts[1] ?? '').toLowerCase()
      const state: WslDistroState =
        stateRaw === 'running' ? 'running' : stateRaw === 'stopped' ? 'stopped' : 'unknown'
      return { installed: true, name: WSL_DISTRO, state }
    }
  }

  return { installed: false, name: null, state: 'not-installed' }
}

async function detectTools(): Promise<ToolStatus[]> {
  const checkScript = REQUIRED_TOOLS.map(
    (tool) => `printf '${tool}:'; command -v ${tool} >/dev/null 2>&1 && echo present || echo missing`
  ).join('\n')

  const result = await execInWsl(checkScript, { timeoutMs: 15_000 })
  const lines = result.stdout.split(/\r?\n/)
  const presence = new Map<string, boolean>()
  for (const line of lines) {
    const match = /^(\S+):(present|missing)$/.exec(line.trim())
    if (match) presence.set(match[1], match[2] === 'present')
  }

  return REQUIRED_TOOLS.map((tool) => ({
    tool,
    installed: presence.get(tool) ?? false
  }))
}

async function checkRunnerDeployed(): Promise<boolean> {
  const result = await execInWsl('test -x "$HOME/.ironcore-lab/bin/run-exercise.sh" && echo yes || echo no', {
    timeoutMs: 8_000
  })
  return result.stdout.trim() === 'yes'
}

export async function getEnvironmentStatus(): Promise<EnvironmentStatus> {
  const distro = await detectDistro()

  if (!distro.installed || distro.state === 'not-installed') {
    return {
      wslInstalled: distro.installed,
      distroName: distro.name,
      distroState: distro.state,
      tools: REQUIRED_TOOLS.map((tool: RequiredTool) => ({ tool, installed: false })),
      allToolsPresent: false,
      runnerDeployed: false,
      checkedAt: new Date().toISOString()
    }
  }

  const [tools, runnerDeployed] = await Promise.all([detectTools(), checkRunnerDeployed()])

  return {
    wslInstalled: true,
    distroName: distro.name,
    distroState: distro.state,
    tools,
    allToolsPresent: tools.every((t) => t.installed),
    runnerDeployed,
    checkedAt: new Date().toISOString()
  }
}
