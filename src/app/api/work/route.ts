// src/app/api/work/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 200 });
  
  try {
    const works = await prisma.work.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(works);
  } catch (error) {
    console.error('Error fetching work records:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error fetching records" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    
    const work = await prisma.work.create({
      data: {
        userId: session.user.id,
        content: data.content || [],
        evaluationData: data.evaluationData || undefined,
        bulletWeights: data.bulletWeights || undefined,
        summaries: data.summaries || undefined
      },
    });
    
    return NextResponse.json(work);
  } catch (error) {
    console.error('Error in POST /api/work:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const url = new URL(request.url);
    
    // Look for ID in both the query parameter and the request body
    const idFromQuery = url.searchParams.get('id');
    const idFromBody = data.id;
    const id = idFromQuery || idFromBody;
    
    if (!id) {
      return NextResponse.json({ error: "Missing work ID" }, { status: 400 });
    }
    
    // First check if the work exists and belongs to this user
    const existingWork = await prisma.work.findUnique({
      where: { id },
    });
    
    if (!existingWork) {
      return NextResponse.json({ error: "Work not found" }, { status: 404 });
    }
    
    if (existingWork.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to update this work" }, { status: 403 });
    }
    
    // Now update the work - remove id from the data object to avoid Prisma errors
    const { id: _ignoredId, ...updateData } = data;
    
    const updatedWork = await prisma.work.update({
      where: { id },
      data: {
        content: updateData.content || undefined,
        evaluationData: updateData.evaluationData || undefined,
        bulletWeights: updateData.bulletWeights || undefined,
        summaries: updateData.summaries || undefined
      },
    });
    
    return NextResponse.json(updatedWork);
  } catch (error) {
    console.error('Error in PUT /api/work:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  if (!id) {
    return NextResponse.json({ error: "Missing work ID" }, { status: 400 });
  }
  
  try {
    // First check if the work exists and belongs to this user
    const existingWork = await prisma.work.findUnique({
      where: { id },
    });
    
    if (!existingWork) {
      return NextResponse.json({ error: "Work not found" }, { status: 404 });
    }
    
    if (existingWork.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to delete this work" }, { status: 403 });
    }
    
    // Now delete the work
    await prisma.work.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/work:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}