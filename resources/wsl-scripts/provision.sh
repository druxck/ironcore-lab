#!/usr/bin/env bash
# Ironcore Lab toolchain provisioning. Run this once inside your WSL Ubuntu
# distro (the Setup Wizard shows this same command with a copy button):
#
#   sudo apt-get update && sudo apt-get install -y build-essential clang gdb valgrind make cmake strace ltrace
#
# It's also fine to run this file directly:  bash provision.sh
set -euo pipefail
sudo apt-get update
sudo apt-get install -y build-essential clang gdb valgrind make cmake strace ltrace
echo "Ironcore Lab toolchain installed. Return to the app and click Recheck."
