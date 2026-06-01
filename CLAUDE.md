# CLAUDE.md

## plan.md — Keep It Current

`plan.md` is the single source of truth for development progress.

**Rule:** Whenever any file is edited or a task changes status during a session, update `plan.md` before finishing:
- Mark completed tasks with `**Status:** Completed`
- Update in-progress task status if it changed
- Fill in the `**Last session:**` field with today's date (YYYY-MM-DD) and a one-line summary of what was accomplished

**`plan.md` task template:**

```markdown
## Task N: [Title]

**Status:** [Planning | Design in progress | Design approved | In progress | Completed]

**Approach:** [one sentence]

**Files to change:**
- `path/file` — reason

**Last session:** [YYYY-MM-DD] — [one-line summary of what was done]

**Spec:** [path to spec file, if applicable]
```

New tasks are appended to the bottom of `plan.md` using this template.
