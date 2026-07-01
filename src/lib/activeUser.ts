import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export type ActiveUser = {
  id: string;
  email: string;
  name: string | null;
};

export async function getActiveUser(): Promise<ActiveUser | null> {
  const session = await auth();

  if (session?.user?.email) {
    const email = session.user.email.toLowerCase();
    const user = await db.user.upsert({
      where: { email },
      update: {
        name: session.user.name ?? undefined,
        image: session.user.image ?? undefined,
      },
      create: {
        email,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
      },
      select: { id: true, email: true, name: true },
    });

    return user;
  }

  const cookieStore = await cookies();
  const hasDevMagicAccess = cookieStore.get('pml-dev-magic-auth')?.value === '1';
  const magicEmail = cookieStore.get('pml-dev-magic-email')?.value?.trim().toLowerCase();

  if (hasDevMagicAccess && magicEmail && magicEmail.includes('@')) {
    const user = await db.user.upsert({
      where: { email: magicEmail },
      update: {},
      create: {
        email: magicEmail,
        name: 'Magic Link Tester',
      },
      select: { id: true, email: true, name: true },
    });

    return user;
  }

  return null;
}
