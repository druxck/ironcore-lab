#!/usr/bin/env bash
# Ironcore Lab runner. Deployed by the Setup Wizard to ~/.ironcore-lab/bin/run-exercise.sh
# inside WSL. Invoked as: run-exercise.sh <rundir>
#
# Expects <rundir> to already contain:
#   source.c        - the user's C source
#   mode.txt        - one of: run | test | sanitize | valgrind | gdb-batch
#   limits.txt      - two lines: timeoutSeconds, memoryLimitMb
#   cases.txt       - one caseId per line (skipped for gdb-batch)
#   stdin/<id>.txt  - stdin content for each case
#   gdb-commands.txt (gdb-batch mode only)
#
# Writes all results under <rundir>/out/. Never touches anything outside <rundir>.
set -u
RUNDIR="$1"
cd "$RUNDIR" || exit 90

mkdir -p out stdin
MODE="$(head -n1 mode.txt)"
TIMEOUT_S="$(sed -n '1p' limits.txt)"
MEM_MB="$(sed -n '2p' limits.txt)"

COMPILE_FLAGS="-Wall -Wextra -g -O0"
if [ "$MODE" != "valgrind" ]; then
  COMPILE_FLAGS="$COMPILE_FLAGS -fsanitize=address,undefined -fno-omit-frame-pointer"
fi

CC="$(command -v gcc || command -v clang)"
"$CC" $COMPILE_FLAGS -o out/solution source.c > out/compile.log 2>&1
echo $? > out/compile.exitcode

if [ "$(cat out/compile.exitcode)" != "0" ]; then
  touch out/DONE
  exit 0
fi

# NOTE: deliberately no `ulimit -v` (virtual address space) anywhere below.
# AddressSanitizer reserves a large shadow-memory region (hundreds of MB of
# *virtual* address space, not physical RAM) for any sanitizer-instrumented
# binary, and valgrind does the same for its own instrumentation - a `ulimit
# -v` sized for the student's actual program (e.g. 256MB) makes ASan's own
# startup allocation fail ("ReserveShadowMemoryRange failed... Perhaps you're
# using ulimit -v") or makes valgrind's address-space manager abort with
# out_of_memory, before the student's code ever runs. Actual resident memory
# is capped instead: via ASAN_OPTIONS=hard_rss_limit_mb for sanitizer builds,
# and left to ulimit -t/-u plus the outer `timeout` for valgrind builds (which
# have no sanitizers compiled in to carry an equivalent RSS cap).
run_one_case() {
  local case_id="$1"
  local stdin_file="stdin/${case_id}.txt"
  [ -f "$stdin_file" ] || stdin_file=/dev/null

  local start_ns end_ns
  start_ns=$(date +%s%N)

  (
    ulimit -t 5
    ulimit -f 10240
    ulimit -u 64
    if [ "$MODE" = "valgrind" ]; then
      timeout -k 1 "${TIMEOUT_S}s" valgrind \
        --error-exitcode=99 --leak-check=full --track-origins=yes \
        --log-file="out/${case_id}.valgrind.log" \
        ./out/solution < "$stdin_file" > "out/${case_id}.stdout" 2> "out/${case_id}.stderr"
    else
      ASAN_OPTIONS="hard_rss_limit_mb=${MEM_MB}:exitcode=134" \
        timeout -k 1 "${TIMEOUT_S}s" ./out/solution < "$stdin_file" \
        > "out/${case_id}.stdout" 2> "out/${case_id}.stderr"
    fi
  )
  local exit_code=$?
  end_ns=$(date +%s%N)

  echo "$exit_code" > "out/${case_id}.exitcode"
  echo $(( (end_ns - start_ns) / 1000000 )) > "out/${case_id}.duration_ms"
}

if [ "$MODE" = "gdb-batch" ]; then
  (
    ulimit -t 5
    ASAN_OPTIONS="hard_rss_limit_mb=${MEM_MB}" \
      timeout -k 1 "${TIMEOUT_S}s" gdb -batch -x gdb-commands.txt --args ./out/solution \
      > out/gdb.log 2>&1
  )
  echo $? > out/gdb.exitcode
else
  while IFS= read -r case_id; do
    [ -z "$case_id" ] && continue
    run_one_case "$case_id"
  done < cases.txt
fi

touch out/DONE
exit 0
