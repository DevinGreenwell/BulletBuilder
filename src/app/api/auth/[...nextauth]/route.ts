import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/auth-email';
import type { User, Account, Profile } from 'next-auth';

export const authOptions = {
  debug: true, // Enable debug mode
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error', // Optional: create an error page
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      async sendVerificationRequest({ identifier, url }) {
        await sendVerificationEmail({ identifier, url });
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: { user: User; account: Account | null; profile?: Profile }) {
      console.log('Sign in callback:', { user, account, profile });
      return true;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }): Promise<string> {
      console.log('Redirect callback:', { url, baseUrl });
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async session({ session, token }: { session: any; token: any }) {
      console.log('Session callback:', { session, token });
      return session;
    },
    async jwt({ token, account, profile }: { token: any; account?: any; profile?: any }) {
      console.log('JWT callback:', { token, account, profile });
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };