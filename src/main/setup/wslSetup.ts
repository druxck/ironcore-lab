import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import { join } from 'path'
import { base64Encode, execInWsl, getWslHomeDir } from '../wsl/wslBridge'
import { getResourcesRoot } from '../paths'
import { getEnvironmentStatus as checkEnvironmentStatus } from './toolchainCheck'
import type { EnvironmentStatus } from '@shared/setup-types'

const DEPLOYED_SCRIPTS = ['run-exercise.sh', 'collect-output.sh']

function computeHash(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex')
}

/**
 * Idempotent: only rewrites a script inside WSL if its hash has changed since
 * the last deploy (e.g. after an app update), so this is cheap to call on
 * every launch. Uses a resolved absolute $HOME (single-quoted, no shell
 * expansion needed) rather than literal "$HOME" - see getWslHomeDir's doc
 * comment for why that matters.
 */
export async function deployRunnerScript(): Promise<{ deployed: boolean }> {
  const home = await getWslHomeDir()
  const labHome = `${home}/.ironcore-lab`

  await execInWsl(`mkdir -p '${labHome}/bin' '${labHome}/runs' '${labHome}/workspace'`, { timeoutMs: 8_000 })

  let allDeployed = true
  for (const scriptName of DEPLOYED_SCRIPTS) {
    const scriptPath = join(getResourcesRoot(), 'wsl-scripts', scriptName)
    const scriptContent = readFileSync(scriptPath, 'utf8')
    const hash = computeHash(scriptContent)
    const remotePath = `${labHome}/bin/${scriptName}`

    const check = await execInWsl(`cat '${remotePath}.sha256' 2>/dev/null || true`, { timeoutMs: 8_000 })
    if (check.stdout.trim() === hash) continue

    const deployScript = [
      `echo '${base64Encode(scriptContent)}' | base64 -d > '${remotePath}'`,
      `chmod +x '${remotePath}'`,
      `printf '%s' '${hash}' > '${remotePath}.sha256'`
    ].join('\n')

    const result = await execInWsl(deployScript, { timeoutMs: 15_000 })
    if (result.exitCode !== 0) allDeployed = false
  }

  return { deployed: allDeployed }
}

export async function getEnvironmentStatus(): Promise<EnvironmentStatus> {
  return checkEnvironmentStatus()
}

/** Called on every app launch: cheap re-check, and deploy the runner if the toolchain is ready. */
export async function verifyAndPrepareEnvironment(): Promise<EnvironmentStatus> {
  const status = await getEnvironmentStatus()
  if (status.allToolsPresent) {
    const { deployed } = await deployRunnerScript()
    return { ...status, runnerDeployed: deployed }
  }
  return status
}
