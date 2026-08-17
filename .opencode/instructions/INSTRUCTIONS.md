# Mipsys Rebuild — OpenCode Instructions

This project uses OpenCode with specialist subagents. Key patterns:

## Commands
- `/plan` — Create implementation plans for complex features
- `/tdd` — TDD workflow with write-tests-first
- `/code-review` — Review code quality and security
- `/security` — Comprehensive security review
- `/build-fix` — Fix build and TypeScript errors
- `/e2e` — Generate and run E2E tests
- `/verify` — Run full verification loop (build, lint, test)

## Agents
- `planner` — Feature planning and decomposition
- `architect` — System design and architecture decisions
- `code-reviewer` — Code quality and maintainability review
- `tdd-guide` — Test-driven development enforcement
- `build-error-resolver` — Build and type error fixes
- `e2e-runner` — Playwright E2E test generation

## Conventions
- Conventional commits (feat:, fix:, refactor:)
- Backend: NestJS 11 + Drizzle ORM
- Frontend: Next.js 16 App Router + Tailwind CSS v4
- Dark-first "war room" UI theme
- NoImplicitAny: false (backend), strict: true (frontend)