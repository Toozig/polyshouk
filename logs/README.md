# Local dev logs (for agents)

When you run `npm run dev`, output is appended here automatically.

## Files

| File | Contents |
|------|----------|
| `dev-server.log` | Compile errors, CSS/module resolution failures, Prisma errors, HTTP 500 traces from `next dev` |
| `runtime-issues.jsonl` | Browser `error` and `unhandledrejection` events (dev only, one JSON object per line) |

## Agent workflow

Before guessing about UI or runtime problems:

1. Read `logs/dev-server.log` (tail the last session block between `--- dev session` markers).
2. Read `logs/runtime-issues.jsonl` if the bug is client-side or intermittent.
3. Optionally read the latest Cursor terminal capture under `.cursor/projects/.../terminals/` for the current session.

## Manual notes

To record something agents cannot infer (layout bugs, wrong copy, screenshots described in words), append a line to `runtime-issues.jsonl`:

```json
{"type":"manual","message":"Create event button shows double border","url":"/events","at":"2026-05-27T12:00:00.000Z"}
```

Or run from the project root:

```sh
echo '{"type":"manual","message":"describe the issue","url":"/events"}' >> logs/runtime-issues.jsonl
```

Log files are gitignored; this README is committed.
