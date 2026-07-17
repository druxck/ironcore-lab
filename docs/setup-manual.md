# Ironcore Lab — WSL setup

Ironcore Lab compiles and runs your C code inside a real Linux toolchain via
WSL, rather than a toy simulator, so compiler errors, memory bugs, and
sanitizer/valgrind output are all the genuine article.

The in-app Setup Wizard has one-click **Install WSL + Ubuntu** and **Install
C Toolchain** buttons that do the steps below for you — each one just opens
the real Windows/WSL prompt (UAC consent, or a `sudo` password prompt) rather
than trying to script around it, since neither of those can be (or should be)
bypassed silently. This doc is the manual fallback and an explanation of what
those buttons actually do.

## 1. Confirm WSL + Ubuntu

```powershell
wsl -l -v
```

You should see an `Ubuntu` entry. If WSL itself isn't installed, the Setup
Wizard's **Install WSL + Ubuntu** button runs the equivalent of an elevated

```powershell
wsl --install -d Ubuntu
```

— Windows will show its own permission (UAC) prompt first; approve it to
continue. This can take a few minutes and, on some machines, still ends in a
manual reboot before the distro is usable, since the app can't detect or
trigger a reboot for you. Once you're back (after rebooting if needed), open
Ironcore Lab and click **Recheck**.

## 2. Install the toolchain

The Setup Wizard's **Install C Toolchain** button opens a real terminal
window running the command below inside Ubuntu, so `sudo` has an actual
console to prompt your password into (nothing shows on screen while typing —
that's normal). To do it yourself instead, open your Ubuntu shell
(`wsl -d Ubuntu`) and run:

```bash
sudo apt-get update && sudo apt-get install -y build-essential clang gdb valgrind make cmake strace ltrace
```

This installs:

| Tool | Used for |
|---|---|
| `build-essential` (gcc, make, libc headers) | Compiling every exercise |
| `clang` | Alternate compiler diagnostics/cross-checking |
| `gdb` | Guided debugging lessons in Memory Wing and beyond |
| `valgrind` | Memory-leak detection lessons |
| `cmake` | Later build-system lessons |
| `strace` / `ltrace` | Systems-programming arc (Machine Room) |

## 3. Recheck in-app

Back in Ironcore Lab's Setup Wizard, click **Recheck**. Once every tool shows
green, the Lab Map unlocks.

## Troubleshooting

- **`wsl.exe` not found at all** — WSL isn't installed. See step 1.
- **Distro shows but commands hang** — the distro may be in a bad state; try
  `wsl --shutdown` from PowerShell, then relaunch Ironcore Lab.
- **`apt-get` asks for a password and nothing happens in-app** — expected.
  Whether launched via the **Install C Toolchain** button or run by hand, the
  install always happens in its own real terminal window, never streamed
  through the app, so a `sudo` prompt never gets stuck waiting on a window
  that can't receive keyboard input. Type your password into that terminal,
  not into Ironcore Lab.
- **The "Install WSL + Ubuntu" / "Install C Toolchain" buttons don't do
  anything** — some restricted/managed Windows environments block launching
  elevated or new-console processes from other apps. Fall back to the manual
  commands in steps 1–2 above.
