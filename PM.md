# PM.md — Engineering Playbook

This file is the living engineering standards document. **Section 1** carries forward to every future project. **Section 2** is a project-specific decisions log. There is no `PM.md` yet.

---

## Section 1 — Universal Standards

> Copy this section into every new project's `PM.md`. Start a fresh Section 2.

### Architecture Rules

- **DI via InheritedWidget** — never global singletons or service locators (GetIt, Provider globals). Services are injected through `AppServices.of(context)`.
- **Domain-split services** — one service class per domain (auth, rooms, bookings). Never split by technical layer (e.g. no single "DatabaseService").
- **Typed models always** — return `Room`, `Booking`, `UserRole` — never raw `Map<String, dynamic>` between layers.
- **No barrel files** — no central `services.dart` or `models.dart` re-exporting everything.

### Tooling Conventions

- **Backend: Supabase** — auth, database, RPC functions, RLS policies.
- **Credentials: `flutter_dotenv`** — load from `.env` at runtime. Never hardcode credentials. `.env` is gitignored; `.env.example` is committed.
- **Dev workflow: Claude Code** — `plan.md` tracks progress, specs live in `docs/superpowers/specs/`, plans in `docs/superpowers/plans/`.

### Code Standards

- **Typed return values** — service methods return typed objects, never raw maps.
- **Explicit exceptions** — throw named exceptions (`AuthException`, etc.) not generic `Exception('message')`.
- **No speculative abstractions** — no interfaces, base classes, or generics unless two concrete implementations exist today.

### Process Standards

- **Spec before implementation** — every non-trivial task needs a spec in `docs/superpowers/specs/` approved before code is written.
- **`plan.md` is the source of truth** — task status, approach, files changed, and last session note all live in `plan.md`. Update it before ending any session.
- **PM commands** — use `/pm <question>` for decision advice, `/pm-status` for project health, `/catchup` to resume a session.

### Promotion Rule

At project wrap-up: any decision in the Decisions Log that was never revisited or regretted gets promoted to Section 1. Do this once at the end, not mid-project.

---

## Section 2 — Decisions Log

> Project-specific. Do not copy to future projects.

### 2026-05-06 — Chose `flutter_dotenv` for credential management
**Why:** Simple runtime `.env` loading with no build-step magic. Familiar pattern from web development.
**Trade-off:** Requires declaring `.env` as a Flutter asset. Credentials are in plaintext at runtime (acceptable for mobile; not for server-side).

### 2026-05-18 — Chose username-based auth over email-based login
**Why:** Better UX for homestay context — guests remember short usernames more reliably than email addresses.
**Trade-off:** Requires an extra Supabase RPC (`get_email_by_username`) on every login to resolve username→email before `signInWithPassword`. Acceptable at this scale.

### 2026-05-18 — Chose `InheritedWidget` over GetIt/Provider for DI
**Why:** No extra package. InheritedWidget is Flutter's built-in DI mechanism — zero dependencies, easy to test, context-scoped.
**Trade-off:** More boilerplate than GetIt. Worth it for the simplicity and testability.

### 2026-05-18 — Chose Supabase over Firebase
**Why:** Postgres-based — SQL queries, RLS policies, and RPC functions are more expressive than Firestore. Open source and self-hostable if needed.
**Trade-off:** Slightly less mature Flutter SDK than Firebase. No significant issues encountered.
