import { cache } from 'react';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export type ActiveUser = {
  id: string;
  email: string;
  name: string | null;
};

/**
 * Look up a user by email, writing only when something actually changed.
 * The previous version used db.user.upsert() unconditionally — that opens a
 * transaction and issues a write on every single request (including every
 * Next.js Link-hover prefetch), even when nothing about the user differs
 * from what's already stored. Read first; only touch the row when needed.
 */
async function findOrCreateUser(
  email: string,
  fields: { name?: string | null; image?: string | null }
): Promise<ActiveUser> {
  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, image: true },
  });

  if (!existing) {
    return db.user.create({
      data: { email, name: fields.name ?? null, image: fields.image ?? null },
      select: { id: true, email: true, name: true },
    });
  }

  const nameChanged = fields.name !== undefined && fields.name !== existing.name;
  const imageChanged = fields.image !== undefined && fields.image !== existing.image;
  if (!nameChanged && !imageChanged) {
    return existing;
  }

  return db.user.update({
    where: { id: existing.id },
    data: {
      ...(nameChanged ? { name: fields.name } : {}),
      ...(imageChanged ? { image: fields.image } : {}),
    },
    select: { id: true, email: true, name: true },
  });
}

export const getActiveUser = cache(async (): Promise<ActiveUser | null> => {
  const session = await auth();

  if (session?.user?.email) {
    const email = session.user.email.toLowerCase();
    return findOrCreateUser(email, {
      name: session.user.name ?? null,
      image: session.user.image ?? null,
    });
  }

  const cookieStore = await cookies();
  const hasDevMagicAccess = cookieStore.get('pml-dev-magic-auth')?.value === '1';
  const magicEmail = cookieStore.get('pml-dev-magic-email')?.value?.trim().toLowerCase();

  if (hasDevMagicAccess && magicEmail && magicEmail.includes('@')) {
    const existing = await db.user.findUnique({
      where: { email: magicEmail },
      select: { id: true, email: true, name: true },
    });
    if (existing) return existing;

    return db.user.create({
      data: { email: magicEmail, name: 'Magic Link Tester' },
      select: { id: true, email: true, name: true },
    });
  }

  return null;
});
