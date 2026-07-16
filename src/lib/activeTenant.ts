import { cache } from 'react';
import { OrganizationRole } from '@prisma/client';
import { db } from '@/lib/db';
import { getActiveUser, type ActiveUser } from '@/lib/activeUser';

type TenantOrganization = {
  id: string;
  name: string;
  isPersonal: boolean;
  createdAt: Date;
};

export type ActiveTenant = {
  user: ActiveUser;
  organization: TenantOrganization;
  role: OrganizationRole;
  mode: 'personal' | 'organization';
};

// Wrapped in React's cache() for request-level memoization — if this is
// called more than once within the same request (e.g. a shared layout and
// the page both resolving the tenant), later calls reuse the first result
// instead of re-querying. Only dedupes calls with the same argument
// reference/shape (effectively: repeated no-arg calls, the common case);
// calls passing different preferredOrganizationId values still each query.
export const getActiveTenant = cache(async (options?: {
  preferredOrganizationId?: string | null;
}): Promise<ActiveTenant | null> => {
  const user = await getActiveUser();
  if (!user) return null;

  const memberships = await ensureMemberships(user);
  if (memberships.length === 0) return null;

  const preferredOrganizationId = options?.preferredOrganizationId ?? null;

  const selectedMembership =
    (preferredOrganizationId
      ? memberships.find((membership) => membership.organizationId === preferredOrganizationId)
      : null) ??
    memberships.find((membership) => membership.organization.isPersonal) ??
    memberships[0];

  return {
    user,
    organization: {
      id: selectedMembership.organization.id,
      name: selectedMembership.organization.name,
      isPersonal: selectedMembership.organization.isPersonal,
      createdAt: selectedMembership.organization.createdAt,
    },
    role: selectedMembership.role,
    mode: selectedMembership.organization.isPersonal ? 'personal' : 'organization',
  };
});

async function ensureMemberships(user: ActiveUser) {
  let memberships = await listMemberships(user.id);
  if (memberships.length > 0) return memberships;

  await createPersonalOrganization(user);
  memberships = await listMemberships(user.id);
  return memberships;
}

async function listMemberships(userId: string) {
  return db.organizationMember.findMany({
    where: { userId },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          isPersonal: true,
          createdAt: true,
        },
      },
    },
    orderBy: [
      { role: 'asc' },
      { createdAt: 'asc' },
    ],
  });
}

async function createPersonalOrganization(user: ActiveUser) {
  const organizationName = buildPersonalOrganizationName(user);

  try {
    await db.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          isPersonal: true,
          ownerUserId: user.id,
        },
        select: { id: true },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: OrganizationRole.OWNER,
        },
      });
    });
  } catch {
    // If two requests race, one may fail after the other creates the personal org.
    // Re-querying memberships in the caller handles this safely.
  }
}

function buildPersonalOrganizationName(user: ActiveUser) {
  const displayName = user.name?.trim();
  if (displayName) return `${displayName} Personal`;

  const emailPrefix = user.email.split('@')[0]?.trim();
  if (emailPrefix) return `${emailPrefix} Personal`;

  return 'Personal Workspace';
}
