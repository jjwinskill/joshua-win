#!/bin/sh
# Stops a `git push` from a checkout that fails lint or format, so the agent fixes it first (G49).
# An agent pushed with lint failing during phase 3's retro, because a pipe hid the exit code.
input=$(cat)
case "$input" in
  *"git push"*) ;;
  *) exit 0 ;;
esac
cwd=$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).cwd??"."))')
cd "$cwd" 2>/dev/null || exit 0
[ -d node_modules ] || exit 0
if ! output=$(pnpm lint 2>&1 && pnpm format:check 2>&1); then
  printf 'Fix these before pushing:\n%s\n' "$output" | tail -30 >&2
  exit 2
fi
