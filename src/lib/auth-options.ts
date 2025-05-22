import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import EmailProvider from 'next-auth/providers/email';
import { sendVerificationEmail } from '@/lib/auth-email';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  pages: { signIn: '/signin' },
  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url }) {
        await sendVerificationEmail({ identifier, url });
      },
    }),
  ],
  // …callbacks, session, etc.
};
