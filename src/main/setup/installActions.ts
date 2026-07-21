import { spawn } from 'child_process'
import { mkdtemp, readFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { dirname, join } from 'path'
import { APT_PACKAGES, type ToolchainInstallProgressEvent, type WslInstallProgressEvent } from '@shared/setup-types'
import { WSL_DISTRO, decodeWslOutput } from '../wsl/wslBridge'

interface LaunchResult {
  launched: boolean
  error?: string
}

function detachedSpawn(command: string, args: string[]): LaunchResult {
  try {
    const child = spawn(command, args, { detached: true, stdio: 'ignore', windowsHide: false })
    child.on('error', () => {
      /* fire-and-forget: nothing to update once we've already reported launched: true */
    })
    child.unref()
    return { launched: true }
  } catch (err) {
    return { launched: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ---------------------------------------------------------------------------
// Toolchain install (apt-get inside WSL)
// ---------------------------------------------------------------------------

let toolchainInstallRunning = false

const PHASE_UPDATE_MARKER = '__IRONCORE_PHASE_UPDATE__'
const PHASE_INSTALL_MARKER = '__IRONCORE_PHASE_INSTALL__'

/** Matches apt's machine-readable `-o APT::Status-Fd=1` lines, e.g.
 *  `pmstatus:make:40.0000:Installing make (amd64)` - the percent is already
 *  whole-transaction-relative (0-100 across every package), not per-package. */
const PMSTATUS_RE = /^pmstatus:[^:]*:([\d.]+):(.*)$/

/**
 * Runs the toolchain install as root directly inside WSL - `wsl.exe -u root`
 * needs no Linux password at all (root has no separate auth boundary from
 * wsl.exe's perspective; the real security boundary already got crossed when
 * Windows let this user run wsl.exe in the first place). That means no `sudo`
 * prompt, no TTY requirement, and therefore no need for a visible terminal
 * window - the whole thing can run as a background pipe with real progress
 * parsed out of apt's own status-fd output and streamed to the renderer.
 */
export function runToolchainInstall(onProgress: (evt: ToolchainInstallProgressEvent) => void): LaunchResult {
  if (toolchainInstallRunning) {
    return { launched: false, error: 'A toolchain install is already running.' }
  }

  const script = [
    'export DEBIAN_FRONTEND=noninteractive',
    `echo '${PHASE_UPDATE_MARKER}'`,
    'apt-get update -o APT::Status-Fd=1',
    `echo '${PHASE_INSTALL_MARKER}'`,
    `apt-get install -y -o APT::Status-Fd=1 ${APT_PACKAGES.join(' ')}`
  ].join(' && ')

  let child: ReturnType<typeof spawn>
  try {
    child = spawn('wsl.exe', ['-d', WSL_DISTRO, '-u', 'root', '--', 'bash', '-lc', script], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    })
  } catch (err) {
    return { launched: false, error: err instanceof Error ? err.message : String(err) }
  }

  toolchainInstallRunning = true
  let phase: 'updating' | 'installing' = 'updating'
  let linesSeen = 0
  const stdoutChunks: Buffer[] = []
  const stderrChunks: Buffer[] = []

  const handleChunk = (): void => {
    const text = decodeWslOutput(stdoutChunks)
    const lines = text.split('\n')
    // Re-parse the whole buffer each time (cheap - apt output here is tiny)
    // rather than trying to stitch partial multi-byte chunks together.
    for (let i = linesSeen; i < lines.length - 1; i++) {
      const line = lines[i].replace(/\r/g, '')
      if (line.includes(PHASE_UPDATE_MARKER)) {
        phase = 'updating'
        onProgress({ phase: 'updating', percent: 3, message: 'Updating package lists…' })
        continue
      }
      if (line.includes(PHASE_INSTALL_MARKER)) {
        phase = 'installing'
        onProgress({ phase: 'installing', percent: 10, message: 'Installing packages…' })
        continue
      }
      const match = PMSTATUS_RE.exec(line)
      if (match && phase === 'installing') {
        const pct = Number.parseFloat(match[1])
        const overall = Math.min(99, Math.round(10 + pct * 0.9))
        onProgress({ phase: 'installing', percent: overall, message: match[2].trim() || 'Installing packages…' })
      }
    }
    linesSeen = Math.max(0, lines.length - 1)
  }

  child.stdout?.on('data', (chunk: Buffer) => {
    stdoutChunks.push(chunk)
    handleChunk()
  })
  child.stderr?.on('data', (chunk: Buffer) => {
    stderrChunks.push(chunk)
  })

  child.on('close', (exitCode) => {
    toolchainInstallRunning = false
    if (exitCode === 0) {
      onProgress({ phase: 'done', percent: 100, message: 'Toolchain installed.' })
    } else {
      const stderrText = decodeWslOutput(stderrChunks).trim()
      const stdoutText = decodeWslOutput(stdoutChunks).trim()
      const tail = (stderrText || stdoutText).split('\n').slice(-5).join('\n')
      onProgress({ phase: 'error', percent: 0, message: tail || `apt-get exited with code ${exitCode}` })
    }
  })

  child.on('error', (err) => {
    toolchainInstallRunning = false
    onProgress({ phase: 'error', percent: 0, message: `Failed to launch wsl.exe: ${err.message}` })
  })

  return { launched: true }
}

// ---------------------------------------------------------------------------
// WSL / Ubuntu install
// ---------------------------------------------------------------------------

/**
 * Elevates via a real Windows UAC consent prompt (Start-Process -Verb RunAs).
 * There's no way around that prompt, and there shouldn't be - installing WSL
 * touches Windows optional features, and silently self-elevating would be a
 * genuine security problem. `--no-launch` stops it from auto-launching the
 * distro into an interactive "create a Linux username and password" wizard
 * afterward (that wizard reads from stdin, which a background process here
 * can't supply); Ironcore Lab's own WSL calls never depend on that default
 * user being set up. Output is redirected (by the elevated shell itself,
 * since Start-Process can't combine -Verb RunAs with stdio redirection) to a
 * log file that `pollWslInstallProgress` below tails for status text/percent.
 */
export function launchWslInstall(logPath: string): LaunchResult {
  const inner = `wsl.exe --install -d Ubuntu --no-launch > "${logPath}" 2>&1 & echo IRONCORE_EXIT=%errorlevel% >> "${logPath}"`
  return detachedSpawn('powershell.exe', [
    '-NoProfile',
    '-Command',
    `Start-Process -FilePath cmd.exe -ArgumentList '/c ${inner.replace(/'/g, "''")}' -Verb RunAs -WindowStyle Hidden`
  ])
}

export async function makeWslInstallLogPath(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'ironcore-wsl-install-'))
  return join(dir, 'install.log')
}

/**
 * Polls the log file `launchWslInstall` writes to, decoding it the same way
 * `wsl.exe`'s own piped output needs decoding, and pushes elapsed-time +
 * best-effort percent/status to the renderer every tick. wsl.exe's install
 * progress text format isn't a stable, documented contract, so percent
 * parsing is opportunistic (last "NN%"-shaped token seen) - elapsed time
 * always ticks regardless, so the UI never looks frozen even if no percent
 * can be parsed on a given machine.
 */
export function pollWslInstallProgress(
  logPath: string,
  onProgress: (evt: WslInstallProgressEvent) => void
): () => void {
  const startedAt = Date.now()
  let lastPercent: number | null = null
  let stopped = false

  const cleanupDir = (): void => {
    void rm(dirname(logPath), { recursive: true, force: true }).catch(() => {})
  }

  const tick = async (): Promise<void> => {
    if (stopped) return
    const elapsedMs = Date.now() - startedAt
    let raw = ''
    try {
      const buf = await readFile(logPath)
      raw = decodeWslOutput([buf])
    } catch {
      onProgress({ phase: 'waiting-for-approval', percent: null, message: 'Waiting for permission prompt…', elapsedMs })
      return
    }

    const exitMatch = /IRONCORE_EXIT=(\d+)/.exec(raw)
    const cleanedLines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('IRONCORE_EXIT='))
    const lastLine = cleanedLines.at(-1) ?? 'Installing…'

    const percentMatches = [...raw.matchAll(/(\d{1,3}(?:\.\d+)?)\s*%/g)]
    if (percentMatches.length > 0) {
      const parsed = Number.parseFloat(percentMatches.at(-1)![1])
      if (Number.isFinite(parsed)) lastPercent = Math.min(100, Math.max(0, Math.round(parsed)))
    }

    if (exitMatch) {
      stopped = true
      clearInterval(interval)
      const code = Number.parseInt(exitMatch[1], 10)
      if (code === 0) {
        onProgress({ phase: 'done', percent: 100, message: 'WSL + Ubuntu installed.', elapsedMs })
      } else {
        onProgress({ phase: 'error', percent: lastPercent, message: lastLine, elapsedMs })
      }
      cleanupDir()
      return
    }

    onProgress({ phase: 'installing', percent: lastPercent, message: lastLine, elapsedMs })
  }

  const interval = setInterval(() => {
    void tick()
  }, 700)
  void tick()

  return () => {
    stopped = true
    clearInterval(interval)
    cleanupDir()
  }
}
