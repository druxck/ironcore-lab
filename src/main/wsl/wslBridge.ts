import { spawn } from 'child_process'

export const WSL_DISTRO = 'Ubuntu'

export interface WslExecResult {
  stdout: string
  stderr: string
  exitCode: number | null
  timedOut: boolean
}

export interface WslExecOptions {
  /** Outer safety-net timeout. The runner script has its own inner `timeout` guard;
   * this only fires if WSL itself wedges (e.g. the distro is unresponsive). */
  timeoutMs?: number
  distro?: string
}

/**
 * wsl.exe writes UTF-16LE to stdout/stderr when they're redirected/piped
 * (as opposed to attached to a real console), regardless of what the inner
 * Linux command produced. Node's child_process sees raw bytes either way, so
 * every wsl.exe invocation needs this decoded correctly or output silently
 * turns to mojibake. Chunks are buffered raw and decoded once at the end so
 * multi-byte code units never get split across a chunk boundary either.
 */
export function decodeWslOutput(chunks: Buffer[]): string {
  const buf = Buffer.concat(chunks)
  if (buf.length === 0) return ''
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return buf.toString('utf16le', 2)
  }
  const sampleLen = Math.min(buf.length, 200)
  let nullCount = 0
  for (let i = 1; i < sampleLen; i += 2) {
    if (buf[i] === 0) nullCount++
  }
  if (sampleLen >= 4 && nullCount / (sampleLen / 2) > 0.6) {
    return buf.toString('utf16le')
  }
  return buf.toString('utf8')
}

/**
 * Runs raw `wsl.exe <args>`, decoding output correctly regardless of whether
 * this particular wsl.exe build emits UTF-16LE or UTF-8 to the pipe.
 */
export function spawnWsl(args: string[], timeoutMs = 30_000): Promise<WslExecResult> {
  return new Promise((resolve) => {
    const child = spawn('wsl.exe', args, { windowsHide: true })

    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []
    let timedOut = false

    const killer = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, timeoutMs)

    child.stdout.on('data', (chunk: Buffer) => {
      stdoutChunks.push(chunk)
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderrChunks.push(chunk)
    })

    child.on('close', (exitCode) => {
      clearTimeout(killer)
      resolve({
        stdout: decodeWslOutput(stdoutChunks),
        stderr: decodeWslOutput(stderrChunks),
        exitCode,
        timedOut
      })
    })

    child.on('error', (err) => {
      clearTimeout(killer)
      resolve({
        stdout: decodeWslOutput(stdoutChunks),
        stderr: `${decodeWslOutput(stderrChunks)}\n[ironcore] failed to spawn wsl.exe: ${err.message}`,
        exitCode: null,
        timedOut
      })
    })
  })
}

/**
 * Runs `bash -lc <script>` inside the given WSL distro. `script` is passed as a
 * single argv element (spawn with shell:false), so Windows-side *command-line*
 * quoting never comes into play. wsl.exe's own Windows→Linux argument handoff
 * is still fragile with nested double quotes inside that single element (see
 * getWslHomeDir below) - avoid them; prefer single-quoted literal paths and
 * base64-embed anything with content you don't control.
 */
export function execInWsl(script: string, options: WslExecOptions = {}): Promise<WslExecResult> {
  const distro = options.distro ?? WSL_DISTRO
  const timeoutMs = options.timeoutMs ?? 30_000
  return spawnWsl(['-d', distro, '--', 'bash', '-lc', script], timeoutMs)
}

export function base64Encode(text: string): string {
  return Buffer.from(text, 'utf8').toString('base64')
}

export function base64Decode(text: string): string {
  return Buffer.from(text, 'base64').toString('utf8')
}

let cachedHomeDir: string | null = null

/**
 * Resolves the WSL user's absolute $HOME once and caches it, so callers can
 * build plain single-quoted paths (e.g. '/home/austin/.ironcore-lab') instead
 * of embedding a literal "$HOME" that needs double-quote shell expansion.
 * That matters because nested double quotes inside a single wsl.exe argv
 * element get corrupted crossing the Windows→Linux interop boundary - e.g.
 * `find "$HOME/x"` nested inside an outer `"$(...)"` can arrive at bash with
 * literal `"` characters baked into the path instead of being stripped.
 * Single-quoted literal paths with no embedded expansion sidestep that
 * entirely, which is why this exists rather than just using "$HOME" inline.
 */
export async function getWslHomeDir(): Promise<string> {
  if (cachedHomeDir) return cachedHomeDir
  const result = await execInWsl('echo $HOME', { timeoutMs: 8_000 })
  const home = result.stdout.trim()
  if (!home) throw new Error('Could not resolve $HOME inside WSL')
  cachedHomeDir = home
  return home
}
