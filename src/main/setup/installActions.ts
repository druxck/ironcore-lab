import { spawn } from 'child_process'
import { INSTALL_COMMAND } from '@shared/setup-types'
import { WSL_DISTRO } from '../wsl/wslBridge'

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

/**
 * Elevates via a real Windows UAC consent prompt (Start-Process -Verb RunAs).
 * There's no way around that prompt, and there shouldn't be — installing WSL
 * touches Windows optional features, and silently self-elevating would be a
 * genuine security problem. If the machine's WSL feature isn't already
 * enabled, this can still end in a manual reboot before the distro is usable;
 * Recheck in the Setup Wizard reflects the real state either way.
 */
export function launchWslInstall(): LaunchResult {
  return detachedSpawn('powershell.exe', [
    '-NoProfile',
    '-Command',
    "Start-Process -FilePath wsl.exe -ArgumentList '--install -d Ubuntu' -Verb RunAs"
  ])
}

/**
 * Opens a real, visible, interactive console running the apt-get install
 * inside WSL, so `sudo` gets a real TTY to prompt the user's password into.
 * That prompt can't be scripted around from an Electron app without storing
 * the user's password, which we will never do — this just saves the user
 * from having to open a terminal and copy the command themselves.
 */
export function launchToolchainInstallTerminal(): LaunchResult {
  const script = `${INSTALL_COMMAND}; echo; echo '==== Done. Close this window, then click Recheck in Ironcore Lab. ===='; read -n 1 -s -r`
  return detachedSpawn('cmd.exe', [
    '/c',
    'start',
    '"Ironcore Lab Setup"',
    'wsl.exe',
    '-d',
    WSL_DISTRO,
    '--',
    'bash',
    '-lc',
    script
  ])
}
