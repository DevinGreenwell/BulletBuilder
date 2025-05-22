import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import EmailProvider from 'next-auth/providers/email';

import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/auth-email';

/* ──────────────────────────────────────────────────────────────── */
/* Internal config (NOT exported)                                   */
/* ──────────────────────────────────────────────────────────────── */
const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),

    EmailProvider({
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url }) {
        await sendVerificationEmail({ identifier, url });
      },
    }),
  ],
  session: { strategy: 'jwt' as const },
  pages: { signIn: '/signin' },
  secret: process.env.NEXTAUTH_SECRET,
  // …add callbacks, events, theme, etc. here as needed
};

/* ──────────────────────────────────────────────────────────────── */
/* Route handler (ONLY exports allowed by the App Router)          */
/* ──────────────────────────────────────────────────────────────── */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
