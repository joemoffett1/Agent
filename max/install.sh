#!/usr/bin/env bash
# Installs this tier of the agent framework into ~/.claude.
#   ./install.sh
set -e

SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/.claude"
mkdir -p "$DEST/agents" "$DEST/commands"

cp "$SRC"/commands/*.md "$DEST/commands/"
cp "$SRC/AGENTS_FRAMEWORK.md" "$DEST/"
cp "$SRC"/agents/*.md "$DEST/agents/"
cp "$SRC/KICKOFF.md" "$DEST/"

# Append the auto-role block to ~/.claude/CLAUDE.md (idempotent).
CLAUDE="$DEST/CLAUDE.md"
MARKER='## Agent framework — automatic worktree roles'
touch "$CLAUDE"
if ! grep -qF "$MARKER" "$CLAUDE"; then
  printf '\n' >> "$CLAUDE"
  cat "$SRC/CLAUDE-autorole.md" >> "$CLAUDE"
  echo "Appended auto-role block to $CLAUDE"
else
  echo "Auto-role block already present in $CLAUDE (skipped)"
fi

echo ""
echo "Installed into $DEST"
echo "Agents: $DEST/agents  |  Commands: $DEST/commands  |  KICKOFF.md + AGENTS_FRAMEWORK.md in $DEST"
echo ""
echo "NEXT (manual, so your existing settings aren't clobbered):"
echo "  Merge $SRC/settings.snippet.json into $DEST/settings.json"
echo "  Optional HTML docs: see kb/KB-INTEGRATION.md"
echo "  New project? Open a repo and run /bootstrap <idea>. Customizing? Read ADAPT-FOR-NEW-PROJECT.md"
