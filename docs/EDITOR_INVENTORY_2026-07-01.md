# Editor Integration Inventory (2026-07-01)

Goal: classify current web files by ownership and provide a concrete migration queue that keeps editor logic canonical in PML_DSL (pml-core) and platform logic in pml-modeller-web.

## Summary

- Boundary violation check (`PML_DSL/src` deep imports): none detected.
- Current integration is mostly correct: web imports editor runtime from `pml-core` package.
- Main gap is not duplication yet; it is missing consolidation of editor composition paths and incomplete project-editor wiring.

## Classification by file

### Platform-only (keep in pml-modeller-web)

- src/app/api/projects/route.ts
- src/lib/activeUser.ts
- src/lib/auth.ts
- src/lib/db.ts
- src/lib/limits.ts
- src/lib/stripe.ts
- src/app/api/stripe/checkout/route.ts
- src/app/api/stripe/webhook/route.ts
- src/app/api/stripe/portal/route.ts
- src/app/auth/signin/page.tsx
- src/components/DashboardWorkspace.tsx
- src/app/dashboard/page.tsx
- src/app/dashboard/settings/page.tsx
- src/components/SiteHeader.tsx
- src/components/PlatformHeader.tsx
- src/app/page.tsx
- src/app/about/page.tsx
- src/app/features/page.tsx
- src/app/pricing/page.tsx

Rationale: auth, persistence, billing, marketing, and shell UX are product concerns.

### Core-consumer adapter (keep thin in web)

- src/app/demo/page.tsx
- src/components/chat/AiAssistantWorkspace.tsx
- src/components/chat/ChatPanel.tsx
- src/components/chat/ConversationMessage.tsx
- src/components/chat/PatchProposalCard.tsx
- src/components/chat/ConversationTabBar.tsx
- src/components/chat/ConversationContext.tsx
- src/components/chat/ConversationContext.tsx

Rationale: these files compose pml-core with web APIs and UI flows; they should not host parser/layout/controller logic.

### Candidate to move or formalize in pml-core contract

- src/lib/ai/schemas.ts

Risk: patch operation schema can drift from pml-core patch semantics over time.

Recommendation: export canonical patch operation types (and optionally validation schema) from pml-core, then web imports that contract.

## Hotspots and required actions

### Hotspot A: duplicate composition path risk

Files:
- src/app/demo/page.tsx
- src/app/dashboard/[projectId]/page.tsx

Issue:
- Demo page builds full editor composition logic.
- Project page is placeholder and will likely duplicate demo logic when implemented.

Action:
1. Introduce one reusable web adapter component, e.g. `src/components/ProcessWorkspaceShell.tsx`, that accepts:
   - initialPml
   - mode defaults
   - readOnly flags
   - optional AI panel toggle
2. Use it in both demo and dashboard project routes.
3. Keep controller/render internals sourced from `pml-core` only.

Priority: P1

### Hotspot B: AI patch contract drift risk

Files:
- src/lib/ai/schemas.ts
- src/components/chat/ConversationContext.tsx
- src/components/chat/AiAssistantWorkspace.tsx

Issue:
- Web defines patch schema locally and maps raw patch objects with `any` in conversation logic.

Action:
1. Add canonical patch contract export in pml-core (types first, schema optional).
2. Replace local `PmlPatchOp` derivation with imported contract.
3. Remove `any` usage in patch proposal mapping and acceptance flows.
4. Implement actual patch apply path in `AiAssistantWorkspace` using controller APIs.

Priority: P1

### Hotspot C: project editor route not wired

Files:
- src/app/dashboard/[projectId]/page.tsx
- src/app/api/projects/route.ts

Issue:
- Project route is placeholder; real persisted project data is not loaded into editor yet.

Action:
1. Add `GET /api/projects/:id` endpoint for project fetch and ownership checks.
2. Add `PATCH /api/projects/:id` endpoint for autosave updates.
3. Replace placeholder with workspace shell using fetched `pmlSource`.
4. Add save state indicator wired to API (saving/saved/error).

Priority: P0

## Ordered execution plan

### Phase 1 (now)

1. Implement project read/update API endpoints.
2. Build one reusable workspace shell adapter component in web.
3. Replace demo route internals with adapter usage.
4. Replace dashboard project placeholder with same adapter.

### Phase 2

1. Move patch contract ownership to pml-core exports.
2. Update web AI schema and conversation layer to consume canonical contract.
3. Complete patch-accept apply flow through ProcessController.

### Phase 3

1. Add integration tests in web:
   - demo loads workspace
   - project route loads persisted source
   - project save updates source
   - AI patch accept updates source and state
2. Keep lint boundary rule active (`no-restricted-imports` for PML_DSL src internals).

## Non-goals

- Do not move auth, billing, or persistence into pml-core.
- Do not deep-import from PML_DSL src internals.
- Do not maintain dual editor implementations in web and core.

## Definition of completion

- One shared workspace adapter path used by demo and project routes.
- Project route is fully functional with persisted source load/save.
- AI patch contract sourced from pml-core.
- No web-side parser/layout/controller logic duplication.
