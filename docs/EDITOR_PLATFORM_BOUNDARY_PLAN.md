# Editor vs Platform Boundary Plan

Status: approved for implementation
Date: 2026-07-01

## Intent

Keep a single canonical implementation of PML parsing, layout, routing, rendering, and editor logic in PML_DSL while pml-modeller-web owns product and SaaS concerns.

## Source of truth

- Editor engine and process semantics: PML_DSL
- Product shell and business flows: pml-modeller-web

## Ownership matrix

### Owned by PML_DSL (pml-core package)

- PML grammar parsing and validation
- Diagnostics and normalization
- Layout and routing engines
- Process editing controllers
- Canonical process canvas/editor UI primitives
- Types that represent process state

### Owned by pml-modeller-web

- Authentication and sign-in methods
- Session and authorization middleware
- Projects CRUD, persistence, and ownership
- Pricing, billing, Stripe and subscriptions
- Marketing pages and conversion flows
- Share links, product onboarding, account settings
- AI orchestration endpoints and usage limits

## Hard rules

1. pml-modeller-web must only import PML editor logic from package import `pml-core`.
2. pml-modeller-web must not import from `../PML_DSL/src/**`.
3. Any editor behavior change must ship in PML_DSL first, then consumed by pml-modeller-web through package update.
4. Any web-only adaptation must be implemented as a thin adapter layer in pml-modeller-web, not forks of core logic.

## Integration contract (current)

- pml-modeller-web consumes pml-core via local file dependency:
  - package: `file:../PML_DSL`
- pml-modeller-web should pass only:
  - pml source text
  - project metadata
  - feature flags and capability settings
- pml-core should return:
  - workspace/process state
  - diagnostics
  - layout/render outputs
  - controller methods for edits

## Folder guidance in pml-modeller-web

Use this shape for clean separation:

- `src/app/**` route shells and pages
- `src/app/api/**` platform APIs
- `src/lib/**` platform services (auth, db, billing, limits)
- `src/components/**` shell UI and adapters only
- Do not place parser/layout/editor business rules in web folders

## Migration checklist (execute in order)

1. Inventory editor logic in web and classify each file as:
   - platform-shell code
   - duplicated core logic
2. Move duplicated editor logic into PML_DSL.
3. Export stable APIs from PML_DSL index.
4. Replace web-side duplicated logic with `pml-core` imports.
5. Add integration tests in web that verify package contract behavior.
6. Version bump PML_DSL package and update dependency in web.

## Delivery model

- PML_DSL release cadence: semantic versioning
- pml-modeller-web consumes pinned versions
- Breaking core changes require release note and migration note

## Definition of done

- No imports from `../PML_DSL/src/**` in web
- All editor runtime logic consumed from `pml-core`
- Web app owns only platform concerns and composition
- CI or lint rules enforce import boundary

## Current execution artifacts

- Inventory and migration queue: `docs/EDITOR_INVENTORY_2026-07-01.md`
- Multi-tenancy storage strategy: `docs/MULTI_TENANCY_STORAGE_PLAN.md`
