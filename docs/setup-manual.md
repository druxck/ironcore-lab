# Ironcore Lab — manual WSL setup

Ironcore Lab compiles and runs your C code inside a real Linux toolchain via
WSL, rather than a toy simulator, so compiler errors, memory bugs, and
sanitizer/valgrind output are all the genuine article.

## 1. Confirm WSL + Ubuntu

```powershell
wsl -l -v
```

You should see an `Ubuntu` entry. If WSL itself isn't installed, install it
from an elevated PowerShell prompt and reboot when prompted:

```powershell
wsl --install -d Ubuntu
```

The app does not do this step for you — it requires elevation and often a
reboot, both outside what an app should do unattended.

## 2. Install the toolchain

Open your Ubuntu shell (`wsl -d Ubuntu`) and run:

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
- **`apt-get` asks for a password and nothing happens in-app** — this is
  expected in v1; the install step is intentionally done in your own
  terminal, not streamed through the app, so a sudo prompt never gets stuck
  waiting on a window that can't receive keyboard input.
