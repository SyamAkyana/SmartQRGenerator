# SmartQR — AI Agent Execution Rules

This file defines the operational guidelines for AI coding agents working on SmartQR.

## Source of Truth

The canonical specification is `SmartQR_AI_Agent_Development_Specification.md`.
All implementation must strictly conform to its architectural decisions, security requirements, and phase plan.

## Core Rules

1. **Phase Discipline:** Never implement future phases unless explicitly instructed.
2. **Security Precedence:** Security requirements always win over developer convenience or test simplifications.
3. **No Credential Leakage:** Never commit secrets, passwords, or connection strings. Use `.env` (gitignored) and maintain `.env.example`.
4. **Ownership Verification:** Every authenticated resource operation must verify `resource.userId === session.user.id`. Never trust client-provided IDs.
5. **No Internal IDs in Public URLs:** Public QR and file routes must only use random, URL-safe short codes.
6. **Server-Side Validation:** All user input must be validated server-side using Zod schemas. Client validation is only for UX.
7. **Storage Abstraction:** File operations must use the `StorageProvider` interface. Never invoke `fs` directly from business logic.
8. **Testing Requirement:** Every meaningful feature must have unit, integration, and E2E tests before declaring a phase complete.
9. **No Silently Removed Functionality:** Do not delete or rewrite working code unless specifically requested.

## Definition of Done

A phase or feature is complete only when:
- [x] Implementation complete
- [x] Input validation enforced server-side
- [x] Authorization and ownership verified
- [x] Error handling sanitized (no leaked traces/secrets)
- [x] Unit tests passing
- [x] Integration tests passing
- [x] E2E tests passing
- [x] `npm run typecheck` passes with zero errors
- [x] `npm run lint` passes with zero errors

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
