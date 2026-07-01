# Multi-Tenancy and File Storage Plan

Status: proposed implementation plan
Date: 2026-07-01

## 1) Current state (verified)

Today, your process files are already stored in PostgreSQL:

- `Project.pmlSource` stores full PML text in DB text column.
- `Snapshot.pmlSource` stores historical versions in DB text column.

References:
- `prisma/schema.prisma` defines `Project.pmlSource` and `Snapshot.pmlSource`.
- `src/app/api/projects/route.ts` creates projects with `pmlSource`.

This is the right baseline for an editor-first SaaS.

## 2) Recommendation

Use a **hybrid storage strategy**:

1. **Database (Postgres):** source of truth for live editable PML and metadata.
2. **Object storage (S3/R2/GCS):** derived artifacts only (exports, previews, backups, large archives).

Why this is best for your use case:

- PML is plain text and usually small/medium sized, ideal for transactional DB reads/writes.
- You need row-level auth checks for project ownership and tenancy boundaries.
- You need indexed metadata filtering (owner, plan, org, updatedAt, public/private).
- Exports and binaries belong in object storage, not in relational rows.

## 3) Tenancy model

Adopt **organization-scoped tenancy** with user membership.

Important: support both operating modes from day one.

- `private individual` mode: user works in a personal organization (`isPersonal=true`).
- `shared organization` mode: user belongs to one or more team organizations.

This keeps one tenancy model while preserving the single-user experience.

### Core model

- `Organization` (tenant account)
- `OrganizationMember` (user membership + role)
- `Workspace` (optional subdivision inside org)
- `Project` belongs to `workspaceId` (or directly to org for first cut)

### Roles

- `owner`
- `admin`
- `editor`
- `viewer`

### Plan/billing ownership

- Move plan and subscription ownership from `User` to `Organization`.
- Keep user-level fallback only for personal free tier during migration.

## 4) Proposed schema evolution (phase-safe)

Phase A (additive, no breaking changes):

1. Add `Organization` table.
2. Add `OrganizationMember` table.
3. Add nullable `organizationId` on `Project`, `Snapshot`, `UsageRecord`, `Subscription`.
4. Backfill existing user-owned projects to personal orgs.

Phase B (enforcement):

1. Require `organizationId` non-null for new writes.
2. Scope all project queries by membership.
3. Add DB composite indexes for tenant access patterns.

Phase C (cleanup):

1. Deprecate direct `userId` ownership on `Project` for shared plans.
2. Retain `createdByUserId` and `updatedByUserId` audit fields.

## 5) Query safety rules

Every project query must include tenancy scope:

- `where: { organizationId: activeOrgId, ... }`
- Never query by `id` alone from external request context.

Enforce in one place:

- Add `getActiveTenant()` helper (org + membership + role).
- Add `tenantDb` helpers for project list/read/update/create.

## 6) File storage policy

### Store in database

- PML source (`Project.pmlSource`)
- Current editable state
- Small JSON metadata and audit fields
- Snapshot metadata

### Store in object storage

- Exported SVG/PNG/PDF/BPMN files
- OG image variants
- Large zipped archives
- Optional cold snapshots older than retention window

## 7) Snapshot/version strategy

Short term:

- Keep snapshots in DB text (`Snapshot.pmlSource`).

Scale path:

- Keep latest N snapshots in DB (fast rollback).
- Offload older snapshots to object storage with pointer fields:
  - `storageKey`
  - `storageProvider`
  - `byteSize`

## 8) Subscription and limits for multi-tenancy

Current limit checks are user-based. Move to org-based counters:

- Usage rollups by `organizationId` + billing window.
- Seat limits from membership count.
- Plan entitlements evaluated at org scope.

Compatibility rule during migration:

- If no active team org exists, evaluate limits against the user's personal org (private individual mode).

## 9) Security and isolation guardrails

- Add row-level checks in service layer before every project mutation.
- Sign share links with tenant + project claims.
- Include `organizationId` in audit events.
- Add soft-delete (`deletedAt`) to org/project/snapshot for recovery.

## 10) Migration plan (practical)

### Step 1: additive schema

- Add org tables and nullable org foreign keys.
- Create one personal org per existing user.

### Step 2: backfill script

- For each user:
  - create personal org
  - assign owner membership
  - set `Project.organizationId`
  - set `Snapshot.organizationId`
  - set `UsageRecord.organizationId`

### Step 3: runtime switch

- Resolve active org on login/session.
- Update project APIs to filter by active org.

### Step 4: billing switch

- Move subscription relation to org.
- Update checkout/portal routes to org context.

### Step 5: enforcement

- Make `organizationId` required on writes.
- Add tests that cross-tenant access is denied.

## 11) What to do now (recommended next sprint)

1. Introduce `Organization` + `OrganizationMember` schema (additive only).
2. Add `getActiveTenant()` resolver and update `api/projects` route to org-scoped reads/writes.
3. Keep `pmlSource` in DB as-is.
4. Defer object storage integration until export/share volume justifies it.

## 12) Decision summary

- Yes, keep process files in database for now. That is correct for your app.
- For multi-tenancy subscriptions, add organization-level tenancy and move billing/limits to org scope.
- Use object storage only for generated artifacts and long-term archives, not live source text.
