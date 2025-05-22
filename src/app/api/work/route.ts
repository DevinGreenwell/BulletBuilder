import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const workSchema = z.object({
  content: z.any(),
});

/* ------------------------------------------------------------------ */
/* GET  /api/work  – return all work records for the signed-in user   */
/* ------------------------------------------------------------------ */
export async function GET() {
  try {
    console.log('[GET] /api/work');

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const work = await prisma.work.findMany({
      where: { userId: session.user.email }, // Replace 'userId' with the correct field name from your Prisma schema
      orderBy: { createdAt: 'desc' },
    });

    /*  Important: return the array itself, not wrapped in { work: … }
        – BulletEditor expects getWork() to resolve to WorkRecord[]           */
    return NextResponse.json(work);
  } catch (error) {
    console.error('Error in GET /api/work:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/* POST /api/work  – save a new work record for the signed-in user    */
/* ------------------------------------------------------------------ */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const parsed = workSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const newWork = await prisma.work.create({
      data: {
        userId: session.user.email,
        userEmail: session.user.email,
        title: json.title || 'Untitled', // Provide a default title if not present
        content: parsed.data.content, // Ensure 'content' is defined in the Prisma schema
      },
    });

    /*  Return the single record so the caller can update state immediately  */
    return NextResponse.json(newWork);
  } catch (error) {
    console.error('Error in POST /api/work:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
