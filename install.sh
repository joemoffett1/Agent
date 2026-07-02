#!/usr/bin/env bash
# Install the agent framework into ~/.claude (macOS / Linux / Git-Bash on Windows).
#
#   ./install.sh
#
# Copies the role files + commands + reference docs, and installs (or UPGRADES) the
# automatic-worktree-role block in ~/.claude/CLAUDE.md. Safe to re-run: it never
# clobbers your other settings, and a re-run replaces an older framework block in
# place so you always get the current mindset (reviewer runs in the feature's own
# worktree — there is no dedicated reviewer branch/worktree).
set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/.claude"
mkdir -p "$DEST/agents" "$DEST/commands"

cp "$SRC"/agents/*.md      "$DEST/agents/"
cp "$SRC"/commands/*.md    "$DEST/commands/"
cp "$SRC/AGENTS_FRAMEWORK.md" "$SRC/KICKOFF.md" "$DEST/"

CLAUDE="$DEST/CLAUDE.md"
touch "$CLAUDE"

BEGIN='<!-- BEGIN agent-framework autorole (managed by install — edits between the markers are overwritten on reinstall) -->'
END='<!-- END agent-framework autorole -->'

# Build the sentinel-wrapped block once.
block="$(mktemp)"; trap 'rm -f "$block" "$out" 2>/dev/null || true' EXIT
{ printf '%s\n' "$BEGIN"; cat "$SRC/CLAUDE-autorole.md"; printf '%s\n' "$END"; } > "$block"
out="$(mktemp)"

if grep -qF "$BEGIN" "$CLAUDE"; then
  # Managed block already present → replace between the sentinels, in place.
  awk -v b="$block" '
    BEGIN { while ((getline l < b) > 0) blk = blk l ORS }
    index($0, "BEGIN agent-framework autorole") { printf "%s", blk; skip = 1; next }
    skip && index($0, "END agent-framework autorole") { skip = 0; next }
    skip { next }
    { print }
  ' "$CLAUDE" > "$out"
  echo "Updated the autorole block in $CLAUDE"
elif grep -qF '## Agent framework' "$CLAUDE"; then
  # Legacy block (no sentinels) → replace heading..ignore-line, in place.
  awk -v b="$block" '
    BEGIN { while ((getline l < b) > 0) blk = blk l ORS }
    /^## Agent framework/ { printf "%s", blk; skip = 1; next }
    skip && /^Ignore this block/ { skip = 0; next }
    skip { next }
    { print }
  ' "$CLAUDE" > "$out"
  echo "Replaced the legacy autorole block in $CLAUDE"
else
  cp "$CLAUDE" "$out"
  [ -s "$out" ] && printf '\n' >> "$out"
  cat "$block" >> "$out"
  echo "Appended the autorole block to $CLAUDE"
fi
mv "$out" "$CLAUDE"

cat <<EOF

Installed into $DEST
  agents/   -> $(ls "$SRC"/agents | tr '\n' ' ')
  commands/ -> $(ls "$SRC"/commands | tr '\n' ' ')
  AGENTS_FRAMEWORK.md + KICKOFF.md + the autorole block in CLAUDE.md

Optional next steps (nothing here is required):
  - Fewer permission prompts: merge $SRC/settings.snippet.json into $DEST/settings.json
    (permissions only, no model/thinking pins — the framework leaves those to you).
  - New project? Open the repo and run /bootstrap <idea> (copies the kb/ KB starter in).
  - Customizing for a non-Magic repo? Read ADAPT-FOR-NEW-PROJECT.md.

The reviewer now runs inside each feature's own worktree (/role reviewer there);
there is no dedicated reviewer branch or worktree.
EOF
