import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: true,
  logger: {
    error(code, ...message) {
      console.error('[Auth][error]', code, ...message);
    },
    warn(code, ...message) {
      console.warn('[Auth][warn]', code, ...message);
    },
    debug(code, ...message) {
      console.log('[Auth][debug]', code, ...message);
    },
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_ID ?? '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_SECRET ?? '',
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID ?? process.env.GITHUB_ID ?? '',
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? process.env.GITHUB_SECRET ?? '',
    }),
  ],
  session: { strategy: 'database' },
  pages: {
    signIn: '/auth/signin',
  },
});
