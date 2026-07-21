# Ironcore Lab: WSL setup

Ironcore Lab compiles and runs your C code inside a real Linux toolchain via
WSL, rather than a toy simulator, so compiler errors, memory bugs, and
sanitizer/valgrind output are all the genuine article.

The in-app Setup Wizard has one-click **Install WSL + Ubuntu** and **Install
C Toolchain** buttons that run in the background with a live progress bar:
no terminal window to babysit, no password to type into anything. This doc is
the manual fallback and an explanation of what those buttons actually do.

## 1. Confirm WSL + Ubuntu

```powershell
wsl -l -v
```

You should see an `Ubuntu` entry. If WSL itself isn't installed, the Setup
Wizard's **Install WSL + Ubuntu** button runs the equivalent of an elevated

```powershell
wsl --install -d Ubuntu --no-launch
```

Windows will still show its own permission (UAC) prompt first. That's a
genuine OS security boundary and can't be (or shouldn't be) bypassed. Approve
it and the rest happens invisibly in the background; the Setup Wizard shows a
progress bar with elapsed time (and a percentage, when Windows reports one)
so you're never just staring at a blank screen wondering if anything is
happening. This can take a few minutes and, on some machines, still ends in a
manual reboot before the distro is usable, since the app can't detect or
trigger a reboot for you. Once you're back (after rebooting if needed), the
wizard rechecks automatically.

## 2. Install the toolchain

The Setup Wizard's **Install C Toolchain** button installs the packages below
directly as root inside WSL, in the background, with a live progress bar
driven by apt's own status output: no visible terminal, no `sudo` password
prompt (running as root sidesteps `sudo` entirely). To do it yourself
instead, open your Ubuntu shell (`wsl -d Ubuntu`) and run:

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

Once the toolchain install's progress bar reaches "Done", the Setup Wizard
rechecks automatically; no extra click needed. If you ran the commands
yourself instead, click **Recheck**. Once every tool shows green, the Lab Map
unlocks.

## Troubleshooting

- **`wsl.exe` not found at all:** WSL isn't installed. See step 1.
- **Distro shows but commands hang:** the distro may be in a bad state; try
  `wsl --shutdown` from PowerShell, then relaunch Ironcore Lab.
- **The "Install WSL + Ubuntu" / "Install C Toolchain" buttons don't do
  anything:** some restricted/managed Windows environments block launching
  elevated or background processes from other apps. Fall back to the manual
  commands in steps 1-2 above.
- **The WSL install progress bar shows elapsed time but no percentage**:
  expected on some Windows builds; `wsl --install`'s own progress text isn't a
  stable, documented format, so the percentage is best-effort. The elapsed
  timer keeps ticking regardless so you can tell it's still working.
