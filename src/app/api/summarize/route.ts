// --- START OF COMPLETE src/app/api/summarize/route.ts ---

import { NextRequest, NextResponse } from 'next/server';
// Import the category summarization function (potentially renamed)
import { generateCategorySummary } from '@/lib/openai';



// Define the structure expected from the frontend request body
// Matches the payload sent from OERPreview.tsx's handleSummarizeCategory
interface SummarizeRequestBody {
  bullets: { content: string; competency: string; weight: number }[]; // Expecting bullets with content, competency, and numerical weight
  categoryName: string;
  rankCategory: string;
  rank: string;
}

// Define the structure of API responses for type safety
interface SuccessResponse {
    success: true;
    summary: string;
}

interface ErrorResponse {
    success: false;
    error: string;
}

// POST handler for the /api/summarize route
export async function POST(request: NextRequest) {
    console.log("[api/summarize] Received POST request for Category Summarization");
    try {
        // 1. Parse the incoming request body
        const body = await request.json() as SummarizeRequestBody;
        console.log("[api/summarize] Request body parsed:", { category: body.categoryName, numBullets: body.bullets?.length });

        const { bullets, categoryName, rankCategory, rank } = body;

        // 2. Basic Server-Side Validation
        if (!categoryName || !rankCategory || !rank || !Array.isArray(bullets) || bullets.length === 0) {
             console.error("[api/summarize] Validation failed: Missing required fields in request body.");
            return NextResponse.json<ErrorResponse>(
                { error: 'Missing required fields: categoryName, rankCategory, rank, or non-empty bullets array.', success: false },
                { status: 400 } // Bad Request
            );
        }

        // Optional: Server-side weight validation (Frontend should primarily handle this)
        const totalWeight = bullets.reduce((sum, b) => sum + (b.weight || 0), 0);
        // Using a tolerance for potential floating point issues if weights weren't integers
        if (Math.abs(totalWeight - 100) > 0.1) {
             console.warn(`[api/summarize] Incoming weights for category "${categoryName}" sum to ${totalWeight}, not 100.`);
             // Decide whether to return an error or proceed if frontend validation missed it
             // For now, we'll proceed but log the warning. Consider returning 400 error if strictness needed.
             // return NextResponse.json<ErrorResponse>({ error: `Weights must sum to 100 (received ${totalWeight})`, success: false }, { status: 400 });
        }

        console.log(`[api/summarize] Calling generateCategorySummary for category: ${categoryName}`);

        // 3. Call the AI Logic function from openai.ts
        // Ensure the function name matches what you used in openai.ts
        const summary = await generateCategorySummary({
            // Pass the data in the format expected by the AI function
            weightedBullets: bullets, // Array of {content, competency, weight}
            categoryName: categoryName,
            rankCategory: rankCategory,
            rank: rank,
        });
        console.log(`[api/summarize] Summary generated successfully for ${categoryName}.`);

        // 4. Return the successful response
        return NextResponse.json<SuccessResponse>({
            summary: summary,
            success: true
        });

    } catch (error) {
        // 5. Handle any errors during the process
        console.error('[api/summarize] Error during category summarization processing:', error);

        // Determine a user-friendly error message
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary due to an unknown server error.';

        // Return a generic error response to the client
        return NextResponse.json<ErrorResponse>(
            // Avoid leaking detailed internal errors to the client if possible
            { error: 'Failed to generate category summary.', success: false },
            { status: 500 } // Internal Server Error
        );
    }
}
// --- END OF COMPLETE src/app/api/summarize/route.ts ---