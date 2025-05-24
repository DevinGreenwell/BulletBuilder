// src/app/api/user-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user exists in database
    await ensureUserExists(session.user.id, session.user.email);

    const userData = await prisma.work.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 1 // Get the most recent save
    });

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, title } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Ensure user exists in database before creating work
    await ensureUserExists(session.user.id, session.user.email);

    const userData = await prisma.work.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || '',
        title: title || 'USCG Evaluation Data',
        content: content,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error creating user data:', error);
    return NextResponse.json(
      { error: 'Failed to create user data' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, content, title } = body;

    if (!id || !content) {
      return NextResponse.json(
        { error: 'ID and content are required' }, 
        { status: 400 }
      );
    }

    // Ensure user exists in database
    await ensureUserExists(session.user.id, session.user.email);

    // Verify ownership
    const existingWork = await prisma.work.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    });

    if (!existingWork) {
      return NextResponse.json(
        { error: 'Work not found or unauthorized' }, 
        { status: 404 }
      );
    }

    const updateData: any = {
      content: content,
      updatedAt: new Date()
    };

    if (title !== undefined) {
      updateData.title = title;
    }

    const userData = await prisma.work.update({
      where: { id: id },
      data: updateData
    });

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error updating user data:', error);
    return NextResponse.json(
      { error: 'Failed to update user data' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existingWork = await prisma.work.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    });

    if (!existingWork) {
      return NextResponse.json(
        { error: 'Work not found or unauthorized' }, 
        { status: 404 }
      );
    }

    await prisma.work.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user data:', error);
    return NextResponse.json(
      { error: 'Failed to delete user data' }, 
      { status: 500 }
    );
  }
}

// Helper function to ensure user exists in database
async function ensureUserExists(userId: string, userEmail?: string | null) {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      // Create user if they don't exist
      await prisma.user.create({
        data: {
          id: userId,
          email: userEmail || '',
          name: null,
          image: null,
          emailVerified: null
        }
      });
      console.log('Created missing user:', userId);
    }
  } catch (error) {
    // If user creation fails due to unique constraint, that's okay - user might have been created by another request
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      console.log('User already exists (created by another request)');
    } else {
      console.error('Error ensuring user exists:', error);
      throw error;
    }
  }
}