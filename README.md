# Claude agent framework — portable kit

Two self-contained tiers of the same planner → builder → reviewer/verifier → integrator agent
framework. **Pick one folder, copy it, and run the installer inside it** — each folder contains
everything it needs.

| Folder | For | Model | Thinking | Effort | Parallel worktrees |
|--------|-----|-------|----------|--------|--------------------|
| **`max/`** | Claude **Max** plans | Opus | ultrathink / think-hard | high | 3–5+ |
| **`standard/`** | non-Max (e.g. **Pro**) | Sonnet | think-hard / think | medium | 1–2 |

You **cannot use Opus on Pro**, so the `standard` tier uses Sonnet. Otherwise the two tiers are
identical — same roles, commands, flow, and self-propelling handoff.

## Use it
1. Copy the `max/` **or** `standard/` folder to wherever you want it (or to another machine).
2. Inside that folder, run the installer:
   - Windows: `powershell -ExecutionPolicy Bypass -File install.ps1`
   - macOS / Linux: `chmod +x install.sh && ./install.sh`
3. Follow its printed next step (merge `settings.snippet.json`), then open a repo and either work
   in a worktree or run `/bootstrap <idea>`.

Each tier folder has its own `README.md` with full details. You only ever need one folder.
