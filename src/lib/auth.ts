import NextAuth, { type NextAuthOptions, DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import GoogleProvider from 'next-auth/providers/google';
import { customEmailProvider } from './customEmailProvider';

// Add types for extended session
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: { id: string } & DefaultSession['user'];
  }
}

// Validate environment variables
const validateEnv = () => {
  const requiredEnvs = [
    'NEXTAUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'EMAIL_SERVER_HOST',
    'EMAIL_SERVER_PORT',
    'EMAIL_SERVER_USER',
    'EMAIL_SERVER_PASSWORD',
  ];
  
  // Only enforce in production
  if (process.env.NODE_ENV === 'production') {
    for (const env of requiredEnvs) {
      if (!process.env[env]) {
        throw new Error(`Environment variable ${env} is missing`);
      }
    }
  }
};

// Only log in development
if (process.env.NODE_ENV === 'development') {
  console.log('EMAIL_SERVER_HOST:', process.env.EMAIL_SERVER_HOST);
  console.log('EMAIL_SERVER_PORT:', process.env.EMAIL_SERVER_PORT);
  console.log('EMAIL_SERVER_USER:', process.env.EMAIL_SERVER_USER);
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('EMAIL_SERVER_PASSWORD is set:', !!process.env.EMAIL_SERVER_PASSWORD);
}

// Validate environment variables
validateEnv();

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
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
    }) as any, // Type assertion to satisfy TypeScript
  ],
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },
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
  secret: process.env.NEXTAUTH_SECRET,
  // Additional security options
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};

export default NextAuth(authOptions);