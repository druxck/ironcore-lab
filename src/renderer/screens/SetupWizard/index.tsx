import { useEffect, useRef, useState } from 'react'
import {
  INSTALL_COMMAND,
  type EnvironmentStatus,
  type ToolchainInstallProgressEvent,
  type WslInstallProgressEvent
} from '@shared/setup-types'

interface Props {
  status: EnvironmentStatus | null
  onRecheck: () => Promise<void>
}

function ProgressBar({ percent, tone }: { percent: number | null; tone: 'amber' | 'alert' }): JSX.Element {
  const barColor = tone === 'amber' ? 'bg-lab-amber' : 'bg-lab-alert'
  return (
    <div className="h-2 w-full overflow-hidden rounded bg-black/40">
      {percent === null ? (
        <div className={`h-full w-1/3 rounded ${barColor} progress-indeterminate`} />
      ) : (
        <div
          className={`h-full rounded ${barColor} transition-[width] duration-300 ease-out`}
          style={{ width: `${Math.max(2, percent)}%` }}
        />
      )}
    </div>
  )
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.round(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds}s`
  return `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`
}

export default function SetupWizard({ status, onRecheck }: Props): JSX.Element {
  const [rechecking, setRechecking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [wslProgress, setWslProgress] = useState<WslInstallProgressEvent | null>(null)
  const [wslLaunchError, setWslLaunchError] = useState<string | null>(null)
  const [toolchainProgress, setToolchainProgress] = useState<ToolchainInstallProgressEvent | null>(null)
  const [toolchainLaunchError, setToolchainLaunchError] = useState<string | null>(null)
  const autoRecheckedWsl = useRef(false)
  const autoRecheckedToolchain = useRef(false)

  useEffect(() => {
    const offToolchain = window.lab.on('setup:toolchainInstallProgress', setToolchainProgress)
    const offWsl = window.lab.on('setup:wslInstallProgress', setWslProgress)
    return () => {
      offToolchain()
      offWsl()
    }
  }, [])

  useEffect(() => {
    if (toolchainProgress?.phase === 'done' && !autoRecheckedToolchain.current) {
      autoRecheckedToolchain.current = true
      void onRecheck()
    }
  }, [toolchainProgress, onRecheck])

  useEffect(() => {
    if (wslProgress?.phase === 'done' && !autoRecheckedWsl.current) {
      autoRecheckedWsl.current = true
      void onRecheck()
    }
  }, [wslProgress, onRecheck])

  async function handleRecheck(): Promise<void> {
    setRechecking(true)
    await onRecheck()
    setRechecking(false)
  }

  async function handleCopy(): Promise<void> {
    await navigator.clipboard.writeText(INSTALL_COMMAND)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleOpenDocs(): Promise<void> {
    await window.lab.invoke('setup:openSetupDocs', undefined)
  }

  async function handleInstallWsl(): Promise<void> {
    setWslLaunchError(null)
    autoRecheckedWsl.current = false
    setWslProgress({
      phase: 'waiting-for-approval',
      percent: null,
      message: 'Waiting for the Windows permission prompt…',
      elapsedMs: 0
    })
    const result = await window.lab.invoke('setup:launchWslInstall', undefined)
    if (!result.launched) {
      setWslProgress(null)
      setWslLaunchError(
        `Couldn't launch the installer automatically (${result.error ?? 'unknown error'}). Use the command below instead.`
      )
    }
  }

  async function handleInstallToolchain(): Promise<void> {
    setToolchainLaunchError(null)
    autoRecheckedToolchain.current = false
    setToolchainProgress({ phase: 'updating', percent: 0, message: 'Starting…' })
    const result = await window.lab.invoke('setup:launchToolchainInstall', undefined)
    if (!result.launched) {
      setToolchainProgress(null)
      setToolchainLaunchError(
        `Couldn't start the install automatically (${result.error ?? 'unknown error'}). Use the command below instead.`
      )
    }
  }

  const wslMissing = !status?.wslInstalled
  const wslRunning = wslProgress !== null && wslProgress.phase !== 'done' && wslProgress.phase !== 'error'
  const toolchainRunning =
    toolchainProgress !== null && toolchainProgress.phase !== 'done' && toolchainProgress.phase !== 'error'

  return (
    <div className="blueprint-grid flex h-screen items-center justify-center bg-lab-bg p-6">
      <div className="crt-scanlines w-full max-w-2xl rounded border border-lab-wire bg-lab-panel/90 p-6">
        <h1 className="glow-text-phosphor font-blueprint text-xl text-lab-phosphor">Meridian Computing Laboratory</h1>
        <p className="mt-1 text-sm text-lab-phosphorDim">
          The lab&apos;s been dark a long time. Before anything can be restored, the workshop needs power - a real C
          toolchain running inside WSL.
        </p>

        {wslMissing ? (
          <div className="mt-5 rounded border border-lab-alert/40 bg-lab-alert/5 p-4">
            <div className="glow-text-alert text-sm font-semibold text-lab-alert">WSL / Ubuntu not detected</div>
            <p className="mt-1 text-sm text-lab-phosphorDim">
              Ironcore Lab needs WSL2 with an Ubuntu distro installed. Windows requires a one-time administrator
              permission prompt for that step - that part can&apos;t be automated away - but everything else runs in
              the background with no terminal window to babysit.
            </p>
            <button
              type="button"
              onClick={handleInstallWsl}
              disabled={wslRunning}
              className="mt-3 rounded border border-lab-alert/50 bg-lab-alert/10 px-4 py-2 text-sm text-lab-alert hover:bg-lab-alert/20 disabled:opacity-50"
            >
              {wslRunning ? 'Installing…' : 'Install WSL + Ubuntu'}
            </button>

            {wslProgress && (
              <div className="mt-3">
                <ProgressBar percent={wslProgress.percent} tone="alert" />
                <div className="mt-1 flex items-center justify-between text-xs text-lab-phosphorDim">
                  <span>{wslProgress.message}</span>
                  <span>
                    {wslProgress.percent !== null ? `${wslProgress.percent}% · ` : ''}
                    {formatElapsed(wslProgress.elapsedMs)}
                  </span>
                </div>
                {wslProgress.phase === 'done' && (
                  <p className="mt-1 text-xs text-lab-phosphor">
                    Installed. If Windows asks for a restart, restart and come back - otherwise rechecking now.
                  </p>
                )}
                {wslProgress.phase === 'error' && (
                  <p className="mt-1 text-xs text-lab-alert">Install failed: {wslProgress.message}</p>
                )}
              </div>
            )}
            {wslLaunchError && <p className="mt-2 text-xs text-lab-phosphorDim">{wslLaunchError}</p>}

            <div className="mt-4 text-xs text-lab-phosphorDim/70">Or run it yourself in an elevated PowerShell:</div>
            <pre className="mt-1 overflow-x-auto rounded bg-black/40 p-2 text-xs text-lab-phosphor">
              wsl --install -d Ubuntu
            </pre>
          </div>
        ) : (
          <div className="mt-5">
            <div className="mb-2 text-sm font-semibold text-lab-phosphor">
              Toolchain status ({status?.distroName})
            </div>
            <ul className="grid grid-cols-2 gap-1">
              {status?.tools.map((tool) => (
                <li key={tool.tool} className="flex items-center gap-2 text-sm">
                  <span className={tool.installed ? 'text-lab-phosphor' : 'text-lab-alert'}>
                    {tool.installed ? '●' : '○'}
                  </span>
                  <span className={tool.installed ? 'text-lab-phosphorDim' : 'text-lab-alert'}>{tool.tool}</span>
                </li>
              ))}
            </ul>

            {!status?.allToolsPresent && (
              <div className="mt-4 rounded border border-lab-amber/30 bg-black/30 p-3">
                <div className="text-xs text-lab-phosphorDim">
                  Missing tools install automatically in the background - no terminal window, no password prompt to
                  type into.
                </div>
                <button
                  type="button"
                  onClick={handleInstallToolchain}
                  disabled={toolchainRunning}
                  className="mt-2 rounded border border-lab-amber/50 bg-lab-amber/10 px-4 py-2 text-sm text-lab-amber hover:bg-lab-amber/20 disabled:opacity-50"
                >
                  {toolchainRunning ? 'Installing…' : 'Install C Toolchain'}
                </button>

                {toolchainProgress && (
                  <div className="mt-3">
                    <ProgressBar
                      percent={toolchainProgress.phase === 'updating' ? null : toolchainProgress.percent}
                      tone="amber"
                    />
                    <div className="mt-1 flex items-center justify-between text-xs text-lab-phosphorDim">
                      <span>{toolchainProgress.message}</span>
                      <span>{toolchainProgress.phase === 'installing' ? `${toolchainProgress.percent}%` : ''}</span>
                    </div>
                    {toolchainProgress.phase === 'done' && (
                      <p className="mt-1 text-xs text-lab-phosphor">Done - rechecking automatically.</p>
                    )}
                    {toolchainProgress.phase === 'error' && (
                      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded bg-black/40 p-2 text-xs text-lab-alert">
                        {toolchainProgress.message}
                      </pre>
                    )}
                  </div>
                )}
                {toolchainLaunchError && <p className="mt-2 text-xs text-lab-phosphorDim">{toolchainLaunchError}</p>}

                <div className="mt-3 text-xs text-lab-phosphorDim/70">Or run it yourself:</div>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 overflow-x-auto whitespace-nowrap rounded bg-black/50 p-2 text-xs text-lab-amber">
                    {INSTALL_COMMAND}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 rounded border border-lab-amber/40 px-2 py-1 text-xs text-lab-amber hover:bg-lab-amber/10"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handleRecheck}
            disabled={rechecking}
            className="rounded border border-lab-phosphorDim/60 px-4 py-2 text-sm text-lab-phosphor hover:bg-lab-phosphorDim/20 disabled:opacity-50"
          >
            {rechecking ? 'Rechecking…' : 'Recheck'}
          </button>
          <button
            type="button"
            onClick={handleOpenDocs}
            className="text-xs text-lab-phosphorDim underline hover:text-lab-phosphor"
          >
            Open full setup guide
          </button>
        </div>

        {status && (
          <div className="mt-3 text-xs text-lab-phosphorDim/70">
            Last checked: {new Date(status.checkedAt).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  )
}
