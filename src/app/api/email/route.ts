import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: 'Missing e-mail' }, { status: 400 });
  }

  const result = await sendWelcomeEmail(email);
  return NextResponse.json(result);
}
