# Multi-Tenancy Migration Runbook

Date: 2026-07-01
Scope: additive schema migration with no production behavior break

## Objective

Introduce organization tenancy tables and optional org foreign keys while keeping existing user-owned project flows working.

## Pre-checks

1. Confirm DB backup exists.
2. Confirm all current project reads/writes still use `userId` ownership.
3. Confirm no code assumes organization columns are non-null.

## Step 1: Generate migration

From `pml-modeller-web`:

```bash
npx prisma migrate dev --name add_organization_tenancy_additive
npx prisma generate
```

If you are applying in production pipelines:

```bash
npx prisma migrate deploy
npx prisma generate
```

## Step 2: Backfill personal organizations

For each existing user:

1. Create `Organization` with:
   - `name = "<user email> Personal"`
   - `isPersonal = true`
   - `ownerUserId = user.id`
2. Create `OrganizationMember` with role `OWNER`.
3. Set `organizationId` on:
   - all user projects
   - all snapshots of those projects
   - all usage records for that user
   - optional subscription row

## Step 3: Verification queries

1. Every project has non-null `organizationId` after backfill.
2. Every user has at least one organization membership.
3. No orphan organization memberships.

## Step 4: Runtime rollout

1. Introduce active-tenant resolver in app runtime.
2. Keep fallback to user ownership until org-scoped APIs are fully switched.
3. Move query filters from `userId` to `organizationId` once backfill is complete and verified.

## Step 5: Follow-up hardening

1. Make `Project.organizationId` required in a later migration.
2. Move subscription limits and billing checks to org context.
3. Add cross-tenant access tests.

## Rollback

Because this migration is additive:

- App can continue operating on `userId` model if tenant runtime is disabled.
- If needed, revert runtime code first, then drop additive usage; schema rollback is not required for immediate recovery.
