#!/usr/bin/env bash
#
# Regression tests for a 6502 program.
#
#   ./test.sh              run every case in tests/
#   ./test.sh cases/       run every case in another directory
#
# A case is a .prg (loaded) or a .bas (typed in), with a sibling .expect file
# holding one `expect <pattern>` line per thing that must appear in the output.
#
# One machine, one boot, a snapshot restored per case. Nothing sleeps.

set -euo pipefail

cases=${1:-tests}
port=6510
state=$(mktemp)

# One machine for the whole run, with the clock pinned so a run here and a run
# on a build server land in the same place.
# Its console goes to the bit bucket: the assertions below read the console
# through the debug server, so anything it echoes here is just noise.
6502 run --headless --quiet --debug --debug-port "$port" \
  --rtc 2026-01-01T00:00:00 --timeout 300s >/dev/null &
emulator=$!
trap 'kill $emulator 2>/dev/null || true; rm -f "$state"' EXIT

until 6502 dbg info --port "$port" >/dev/null 2>&1; do sleep 0.1; done

# Boot to the prompt once and photograph the machine there. Restoring that is
# about a millisecond against the five million cycles a boot costs — and it is
# exact, so one case cannot leak into the next.
6502 dbg wait --serial 'OK' --run turbo --timeout 30s --port "$port" >/dev/null
6502 dbg state save "$state" --port "$port" >/dev/null

failed=0

for case in "$cases"/*.prg "$cases"/*.bas; do
  [ -e "$case" ] || continue
  expect="${case%.*}.expect"
  [ -e "$expect" ] || { echo "FAIL $case — no $expect"; failed=1; continue; }

  6502 dbg state load "$state" --port "$port" >/dev/null
  6502 dbg run --port "$port" >/dev/null

  if [ "${case##*.}" = "prg" ]; then
    6502 dbg load program "$case" --port "$port" >/dev/null
  else
    # A stored program line prints nothing back, so each line waits for its own
    # echo rather than for the prompt.
    while IFS= read -r line || [ -n "$line" ]; do
      [ -n "$line" ] || continue
      6502 dbg send "$line\r" --wait "^${line%% *}" --timeout 20s --port "$port" >/dev/null
    done < "$case"
  fi

  output=$(6502 dbg send 'RUN\r' --wait 'OK' --timeout 30s --port "$port" | tr -d '\r')

  problems=()
  while read -r directive pattern; do
    [ "$directive" = "expect" ] || continue
    grep -qE "$pattern" <<<"$output" || problems+=("expected /$pattern/")
  done < "$expect"

  if [ ${#problems[@]} -eq 0 ]; then
    echo "ok   $case"
  else
    echo "FAIL $case"
    printf '       %s\n' "${problems[@]}"
    sed 's/^/     | /' <<<"$output"
    failed=1
  fi
done

exit $failed
