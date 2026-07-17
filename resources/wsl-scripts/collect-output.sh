#!/usr/bin/env bash
# Ironcore Lab output collector. Deployed alongside run-exercise.sh to
# ~/.ironcore-lab/bin/collect-output.sh. Invoked as: collect-output.sh <rundir>
#
# Prints every file under <rundir>/out as a "FILE:<relpath>:<base64>" line.
#
# This exists as a deployed FILE rather than inline `bash -lc "<script>"` text
# specifically because it needs a `find | while read` loop, and loop
# constructs passed as inline text through wsl.exe's Windows->Linux argument
# handoff have been observed to arrive corrupted (silently empty variables, or
# outright bash syntax errors quoting one of the loop's own values) even
# though the exact same logic works flawlessly as a real script file. Simple
# sequential (non-looping) inline scripts are unaffected — only this
# collection step needed to move out.
set -u
RUNDIR="$1"
cd "$RUNDIR" || exit 90

find out -type f 2>/dev/null | while IFS= read -r f; do
  printf 'FILE:%s:' "$f"
  base64 -w0 "$f"
  printf '\n'
done
