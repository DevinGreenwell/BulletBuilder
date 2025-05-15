// --- START OF CORRECTED src/app/api/generate/route.ts ---
import { NextRequest, NextResponse } from 'next/server';
import { generateBullet } from '@/lib/openai';
import type { ChatCompletionMessageParam } from 'openai'; // Correct type import

interface GenerateRequestBody {
  achievement?: string; // This can be the very first message from the user if no history
  competency: string;
  rankCategory?: string;
  rank?: string;
  history?: ChatCompletionMessageParam[]; // Full conversation history (user + assistant messages)
}

export async function POST(request: NextRequest) {
  console.log("--- /api/generate: Request received ---");
  try {
    const body = await request.json() as GenerateRequestBody;

    // --- Validation ---
    if (!body.competency) {
      console.error("[api/generate] Validation Failed: Competency is required.");
      return NextResponse.json(
        { error: 'Competency is required', success: false },
        { status: 400 }
      );
    }

    // history will contain all prior messages.
    // The 'achievement' field might be used by the client to send the LATEST user message
    // if it's not already appended to the history array before sending.
    // Or, the client might always ensure the latest user message is the last item in 'history'.
    // For robustness, let's assume 'history' if present, is the source of truth for conversation.
    // If 'history' is empty or not present, AND 'achievement' is present, then 'achievement' is the first user message.

    let messagesToProcess: ChatCompletionMessageParam[];

    if (body.history && body.history.length > 0) {
      messagesToProcess = body.history;
      console.log(
        `[api/generate] Using provided history. Last message: "${
          messagesToProcess[messagesToProcess.length - 1].content.substring(0,50)
        }..." (${messagesToProcess.length} total messages)`
      );
    } else if (body.achievement) {
      messagesToProcess = [{ role: 'user', content: body.achievement }];
      console.log(`[api/generate] No history provided, using achievement as first message: "${body.achievement.substring(0,50)}..."`);
    } else {
      console.error("[api/generate] Validation Failed: Neither achievement nor history provided.");
      return NextResponse.json(
        { error: 'Either an initial achievement or conversation history is required', success: false },
        { status: 400 }
      );
    }
    // --- End Validation and Message Preparation ---

    const { competency, rankCategory = 'Officer', rank = 'O3' } = body;

    console.log(`[api/generate] Calling generateBullet for ${rankCategory} ${rank}, competency: ${competency}`);

    // Call the updated generateBullet function
    const responseContent = await generateBullet({
      messages: messagesToProcess, // This is now guaranteed to be ChatCompletionMessageParam[]
      competency,
      rankCategory,
      rank
    });

    console.log("[api/generate] generateBullet successful. Response content length:", responseContent.length);

    return NextResponse.json({
      response: responseContent,
      success: true
    });

  } catch (error) {
    console.error('--- ERROR in /api/generate ---:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    console.error('Sending error response:', errorMessage);

    return NextResponse.json(
      // Avoid leaking too many details from internal errors to the client
      { error: 'Failed to process your message. Please try again.', success: false },
      { status: 500 }
    );
  }
}
// --- END OF CORRECTED src/app/api/generate/route.ts ---