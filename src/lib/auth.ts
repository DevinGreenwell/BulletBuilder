// src/lib/auth.ts
import { type NextAuthOptions, DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import GoogleProvider from 'next-auth/providers/google';
import { customEmailProvider } from './customEmailProvider';
import type { Provider } from 'next-auth/providers/index';

// Debugging logs for environment variables
console.log('EMAIL_SERVER_HOST:', process.env.EMAIL_SERVER_HOST);
console.log('EMAIL_SERVER_PORT:', process.env.EMAIL_SERVER_PORT);
console.log('EMAIL_SERVER_USER:', process.env.EMAIL_SERVER_USER);
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('EMAIL_SERVER_PASSWORD is set:', !!process.env.EMAIL_SERVER_PASSWORD);

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: { id: string } & DefaultSession['user'];
  }
}

export const authOptions: NextAuthOptions = {
  debug: true, // Enable debug logs for NextAuth
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    customEmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        }
      },
      from: process.env.EMAIL_FROM || 'noreply@uscg-eval-app.com',
    }) as unknown as Provider, // Use proper Provider type instead of any
  ],
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request', // Used for check email page
    error: '/auth/error',
  },
  // Using database strategy
  session: { 
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, user }) {
      if (user?.id) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET!,
};