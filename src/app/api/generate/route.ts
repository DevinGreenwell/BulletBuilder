import { NextRequest, NextResponse } from 'next/server';
import { generateBullet } from '@/lib/openai';
import type { ChatCompletionMessageParam } from 'openai'; // <-- Import directly from 'openai'

interface GenerateRequestBody {
  achievement?: string; // Make optional since we might use history instead
  competency: string;
  rankCategory?: string;
  rank?: string;
  history?: ChatCompletionMessageParam[]; // Chat history (array of messages)
}

export async function POST(request: NextRequest) {
  console.log("--- /api/generate: Request received ---");
  try {
    const body = await request.json() as GenerateRequestBody;
    
    // Basic validation
    if (!body.competency) {
      return NextResponse.json(
        { error: 'Competency is required', success: false },
        { status: 400 }
      );
    }
    
    // Check if we have either achievement or history (or both)
    if (!body.achievement && (!body.history || body.history.length === 0)) {
      return NextResponse.json(
        { error: 'Either achievement or conversation history is required', success: false },
        { status: 400 }
      );
    }
    
    // Log the initial request details (safely)
    if (body.history && body.history.length > 0) {
      console.log("Request with conversation history (first message):", 
        body.history[0].content.substring(0, 100) + (body.history[0].content.length > 100 ? '...' : ''));
      console.log(`History length: ${body.history.length} messages`);
    } else {
      console.log("Request with achievement:", body.achievement);
    }

    const { competency, rankCategory = 'Officer', rank = 'O3' } = body;

    console.log(`Calling generateBullet for ${rankCategory} ${rank}, competency: ${competency}`);

    // Prepare messages - either use history if provided or create a single message from achievement
    const messages = body.history || [];
    
    // Call the updated generateBullet function
    const responseContent = await generateBullet({
      messages,
      competency,
      achievement: body.achievement,
      rankCategory,
      rank
    });
    
    console.log("generateBullet successful. Result length:", responseContent.length);

    // Return the response
    return NextResponse.json({
      response: responseContent,
      success: true
    });

  } catch (error) {
    console.error('--- ERROR in /api/generate ---:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sending error response:', errorMessage);
    
    return NextResponse.json(
      { error: `Failed to process message: ${errorMessage}`, success: false },
      { status: 500 }
    );
  }
}