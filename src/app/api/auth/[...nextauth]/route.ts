import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/auth-email';

export const authOptions = {
    pages: {
    signIn: '/auth/signin',
  },
    adapter: PrismaAdapter(prisma),  // ← NEW
  providers: [
    EmailProvider({
      // Your verification URL will be generated automatically
      async sendVerificationRequest({ identifier, url }) {
        await sendVerificationEmail({ identifier, url });
      },
    }),
  ],
  // …any other NextAuth options (session, callbacks, etc.)
};

export const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
