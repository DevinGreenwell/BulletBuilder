// --- START OF COMPLETE src/lib/openai.ts ---

import OpenAI, { ChatCompletionMessageParam } from 'openai';

// --- OpenAI Client Initialization ---
const apiKeyFromEnv = process.env.OPENAI_API_KEY;
if (!apiKeyFromEnv) {
  console.error("FATAL ERROR: OPENAI_API_KEY environment variable is not set.");
} else {
  // Log only start/end for security verification if needed
  // console.log(`[openai.ts] Initializing OpenAI client with key ending in: ...${apiKeyFromEnv.slice(-4)}`);
}

const openai = new OpenAI({
  apiKey: apiKeyFromEnv,
});


// --- Interface Definitions ---

// For conversational bullet generation
interface GenerateBulletParams {
  messages: ChatCompletionMessageParam[];
  competency: string;
  rankCategory?: string;
  rank?: string;
}

// For category summarization
interface WeightedBulletData {
    content: string;
    competency: string; // Include competency for context in summary
    weight: number;
}
interface CategorySummaryParams {
    weightedBullets: WeightedBulletData[];
    categoryName: string;
    rankCategory: string;
    rank: string;
}


// --- Conversational Bullet Generation Function ---
export async function generateBullet({
  messages,
  competency,
  rankCategory = 'Officer',
  rank = 'O3'
}: GenerateBulletParams): Promise<string> {
  console.log(`[openai.ts] generateBullet called for Competency: ${competency}, Rank: ${rankCategory} ${rank}`);
  try {
    const competencyDescription = getCompetencyDescription(competency, rankCategory);
    const rankTitle = getRankTitle(rank);

    // Define the System Prompt for conversation
    const systemMessageContent = `You are a helpful USCG ${rankCategory} Evaluation writing assistant for a ${rankTitle}.
Your goal is to help the user craft an excellent performance bullet for the "${competency}" competency.
Competency description: ${competencyDescription}.

**Your Primary Task Flow:**
1.  Carefully analyze the user's most recent input describing their achievement.
2.  **Determine if the input contains sufficient detail:** Look for specific actions taken, measurable results or impact (quantification like numbers, percentages, time saved is ideal), and context relevant to the "${competency}" competency and the ${rankTitle} rank.
3.  **If SUFFICIENT detail IS present:** Directly generate ONE concise, impactful bullet according to USCG standards (action verb start, focuses on impact, rank-appropriate). Your response MUST start *exactly* with the phrase: "OK, here's a draft bullet:" followed by the bullet text. Do NOT ask questions if the detail is sufficient.
4.  **If SUFFICIENT detail IS NOT present:** Ask one specific, targeted clarifying question to get the missing information needed for a strong bullet. Do NOT generate a bullet draft yet. Only ask the necessary question.
5.  **Subsequent Turn:** If the user provides answers to your question, re-evaluate based on step 2 using the *entire conversation context*. 

**General Guidelines:**
- Keep the conversation strictly focused on the selected competency: "${competency}".
- Be polite, professional, and concise.
- Output *only* the required response (either the clarifying question(s) OR the "OK, here's a draft bullet:" preface + bullet text). Do not add conversational filler or explanations unless asking a question.`;

    // Construct the final messages array for the API call
    const messagesToSend: ChatCompletionMessageParam[] = [
      { role: "system", content: systemMessageContent },
      ...messages // Spread the incoming history
    ];

    console.log("[openai.ts] --- Sending messages to OpenAI (for generateBullet): ---");
    // Avoid logging full content in production if sensitive
    // console.log(JSON.stringify(messagesToSend, null, 2));
    console.log(`[openai.ts] History length: ${messagesToSend.length}`);
    console.log("------------------------------------------------------------");

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano-2025-04-14", // Or your preferred model
      messages: messagesToSend,
      temperature: 0.6,
      max_tokens: 200,
    });

    const responseContent = response.choices[0].message.content?.trim() || "Sorry, I couldn't generate a response.";
    console.log("[openai.ts] --- Received response from OpenAI (for generateBullet): ---");
    console.log(responseContent);
    console.log("--------------------------------------------------------------");

    return responseContent;

  } catch (error) {
    const err = error as InstanceType<typeof OpenAI.APIError>;
    console.error('[openai.ts] Error in generateBullet:', error);
    if (err && typeof err === 'object' && 'status' in err) {
        console.error("[openai.ts] OpenAI API Error Details:", { status: err.status, type: err.type, code: err.code, param: err.param, message: err.message });
        throw new Error(`OpenAI API Error (${err.status}): ${err.message}`);
    }
    throw new Error('Failed to get response from AI assistant');
  }
}


// --- Category Summarization Function ---
export async function generateCategorySummary({
    weightedBullets,
    categoryName,
    rankCategory,
    rank,
}: CategorySummaryParams): Promise<string> {
    console.log(`[openai.ts] generateCategorySummary called for category: ${categoryName}`);
    try {
        const rankTitle = getRankTitle(rank);
        const categoryDescription = getCategoryDescription(categoryName, rankCategory);

        // Format the bullets including their original competency and weights
        const bulletListString = weightedBullets
            .filter(b => b.weight > 0) // Exclude 0-weight bullets from the prompt
            .sort((a, b) => b.weight - a.weight) // Sort by weight descending
            .map(b => `- [${b.competency}] (Weight: ${b.weight}%) ${b.content}`) // Include competency name
            .join('\n');

        if (!bulletListString) {
            return "No weighted bullets were provided for this category.";
        }

        // Define the System Prompt for Category Summarization
        const systemPrompt = `You are a USCG ${rankCategory} Evaluation writing expert for a ${rankTitle}. Your task is to synthesize multiple performance bullets into a single, cohesive paragraph summarizing performance for the main evaluation category: "${categoryName}".

${categoryDescription ? `Category Description: ${categoryDescription}` : ''}

Instructions:
- Read the following bullet points, their original competency, and their assigned percentage weights.
- Synthesize these points into a single, coherent paragraph (around 300 tokens) suitable for summarizing the "${categoryName}" section of an evaluation report while applying rules 1 through 5 below.
    Rule 1) You **MUST** use the following abbreviations: demonstrated = "demo'd", demonstrating = "demo'ing", communication = "comm", with = "w/", and = "&", member = "mbr", vessel = "vsl", operations = "ops", training = "trng", equipment = "eqpt", management = "mgmt", administrative = "admin", professional = "prof", leadership = "ldrshp", development = "dev", and performance = "perf". Use these abbreviations (and common variations) consistently throughhout the paragraph for all iterations of the words.
    Rule 2) **DO NOT** usethese words or phrases: "Additionally", "Furthermore", "Moreover", "In addition", "Also", "As well as", "Likewise", "Besides", "Too", "Along with", "In conjunction with", "On top of that", "Not to mention", "In summary", "Overall", or "Consequently".
    Rule 3) Give significantly more emphasis, detail, and prominence in the paragraph to the points derived from bullets with higher percentage weights. Avoid specific mention of competencies, but focus on the overall category performance. Bullets with lower weights should be mentioned more briefly or integrated subordinately.
    Rule 4) Do not use name, rank or pronouns like "he", "she", "they", "them", "his", "her", or "their" in the paragraph. Craft the paragraph so that only the performance is highlighted, not the individual.
    Rule 5) There is no need to provide opening or closing statements. Only the actions, impacts and results of the performance need to be included. The paragraph should be a summary of the bullets provided, not an introduction or conclusion.
- The paragraph should capture the essence of the performance in the "${categoryName}" area. Do not simply repeat the bullets or mention the weights explicitly in the output.
- Maintain a formal and objective tone appropriate for professional military evaluations.
- The final paragraph should be concise yet comprehensive based on the weighted input.
- This is a style example: "Unwavering commitment to compliance standards as lead inspector for multiple deep-draft drydock projects; keen eye for detail led to discovery of overlooked structural damage at critical juncture of hull exam; effective comm's of regulatory requirements helped overcome objections, fostering full compliance; comprehensive documentation facilitated swift repairs, mitigating further schedule impacts. Led 04 foreign pax new construction Initial Certificate of Compliance (ICOC) exams w/ teams of 06+ MIs, requiring resource coordination across industry & CG units; ensured safe global operations of commercial vsls valued at $3.9B, carrying >24K pax & generating $200M+ annual US economic impact. Spearheaded improved ICOC structural fire protection (SFP) exam process to include shipyard oversight audits; novel approach immediately identified discrepancies across authorities, garnering industry accolades for improved safety & efficiency. Collaborated on Proceedings article detailing ACTEUR's global ICOC contributions; extensive research & interviews captured complex new construction landscape for 30K+ readers, elevating USCG's international profile. Influential unit social media presence has documented reach of 80K+ views w/500+ followers."

Input Bullets (Category: ${categoryName}):
${bulletListString}

Generate *only* the summary paragraph as plain text, without any introductory phrases like "Here is the summary:" or concluding remarks.`;

        console.log("[openai.ts] --- Sending prompt for CATEGORY summarization: ---");
        // console.log(systemPrompt); // Uncomment for deep debugging if needed
        console.log(`[openai.ts] Summarizing ${weightedBullets.length} bullets for ${categoryName}`);
        console.log("-------------------------------------------------------------");

        // Call the OpenAI API
        const response = await openai.chat.completions.create({
            model: "gpt-4.1-nano-2025-04-14", //Or you preferred model
            messages: [
                { role: "system", content: `You are a highly skilled writing assistant specialized in summarizing USCG performance bullets for main evaluation categories according to specified weights for ${rankCategory === 'Officer' ? 'an Officer' : 'Enlisted personnel'}.` },
                { role: "user", content: systemPrompt } // The user prompt contains the detailed task and data
            ],
            temperature: 0.5, // Keep lower temp for factual summary
            max_tokens: 500, // Allow reasonable length
        });

        const summaryContent = response.choices[0].message.content?.trim() || "Could not generate category summary.";
        console.log("[openai.ts] --- Received category summary from OpenAI: ---");
        console.log(summaryContent);
        console.log("-------------------------------------------------------");

        return summaryContent;
        } catch (error) {
        const err = error as InstanceType<typeof OpenAI.APIError>;
        console.error('[openai.ts] Error generating category summary:', error);
        if (err && typeof err === 'object' && 'status' in err) {
            console.error("[openai.ts] OpenAI API Error Details:", { status: err.status, type: err.type, code: err.code, param: err.param, message: err.message });
            throw new Error(`OpenAI API Error (${err.status}) for category summary: ${err.message}`);
        }
        throw new Error('Failed to generate category summary from AI assistant');
    }
}


// --- Helper Functions ---

function getRankTitle(rank: string): string {
  const rankTitles: Record<string, string> = {
    'O1': 'Ensign (ENS)', 'O2': 'Lieutenant Junior Grade (LTJG)', 'O3': 'Lieutenant (LT)',
    'O4': 'Lieutenant Commander (LCDR)', 'O5': 'Commander (CDR)', 'O6': 'Captain (CAPT)',
    'W2': 'Chief Warrant Officer (CWO2)', 'W3': 'Chief Warrant Officer (CWO3)', 'W4': 'Chief Warrant Officer (CWO4)',
    'E4': 'Petty Officer Third Class (PO3)', 'E5': 'Petty Officer Second Class (PO2)', 'E6': 'Petty Officer First Class (PO1)',
    'E7': 'Chief Petty Officer (CPO)', 'E8': 'Senior Chief Petty Officer (SCPO)',
  };
  return rankTitles[rank] || rank;
}

function getCompetencyDescription(competency: string, rankCategory: string): string {
  const officerCompetencyDescriptions: Record<string, string> = {
    'Planning & Preparedness': 'Ability to anticipate, determine goals, identify relevant information, set priorities and deadlines, and create a shared vision of the unit\'s and Coast Guard\'s future.',
    'Using Resources': 'Ability to manage time, materials, information, money, and people (i.e. all CG components as well as external publics).',
    'Results/Effectiveness': 'Quality, quantity, timeliness and impact of work.',
    'Adaptability': 'Ability to modify work methods and priorities in response to new information, changing conditions, political realities, or unexpected obstacles.',
    'Professional Competence': 'Ability to acquire, apply, and share technical and administrative knowledge and skills associated with description of duties (includes operational aspects such as marine safety, seamanship, airmanship, SAR, etc., as appropriate).',
    'Speaking and Listening': 'Ability to speak effectively and listen to understand.',
    'Writing': 'Ability to express facts and ideas clearly and convincingly.',
    'Looking Out For Others': 'Ability to consider and respond to others personal needs, capabilities, and achievements; support for and application of work-life concepts and skills.',
    'Developing Others': 'Ability to use mentoring, counseling, and training to provide opportunities for others\' professional development.',
    'Directing Others': 'Ability to influence or direct others in accomplishing tasks or missions.',
    'Teamwork': 'Ability to manage, lead, and participate in teams, encourage cooperation, and develop esprit de corps.',
    'Workplace Climate': 'Ability to create and maintain a positive environment where differences of all personnel are included, valued, and respected in alignment with Civil Rights and Human Resource policies. Capacity to optimize diverse perspectives to improve team contributions to mission performance.',
    'Evaluations': 'The extent to which an officer, as Reported-on Officer and rater, conducted or required others to conduct accurate, timely evaluations for enlisted, civilian and officer personnel.',
    'Initiative': 'Ability to originate and act on new ideas, pursue opportunities to learn and develop, and seek responsibility without guidance and supervision.',
    'Judgment': 'Ability to make sound decisions and provide valid recommendations by using facts, experience, political acumen, common sense, risk assessment, and analytical thought.',
    'Responsibility': 'Ability to act ethically, courageously, and dependably and inspire the same in others; accountability for own and subordinates\' actions.',
    'Professional Presence': 'Ability to bring credit to the Coast Guard through one\'s actions, competence, demeanor, and appearance. Extent to which an officer displayed the Coast Guard\'s core values of honor, respect, and devotion to duty.',
    'Health and Well Being': 'Ability to invest in the Coast Guard\'s future by caring for the physical health, safety, and emotional well-being of self and others.'
  };
  const enlistedCompetencyDescriptions: Record<string, string> = {
    'Military Bearing': 'The degree to which the member adhered to uniform and grooming standards, and projected a professional image that brought credit to the Coast Guard.',
    'Customs, Courtesies, and Traditions': 'The extent to which the member conformed to military customs, courtesies, traditions, and protocols.',
    'Quality of Work': 'The degree to which the member utilized knowledge, skills, and expertise to effectively organize and prioritize tasks. Completed quality work and met customer needs.',
    'Technical Proficiency': 'The degree to which the member demonstrated technical competency and proficiency for rating or current assignment.',
    'Initiative': 'The degree to which the member was a self-starter and completed meaningful accomplishments.',
    'Strategic Thinking': 'The degree to which the member led or influenced the development and implementation of unit or organizational objectives.', // E7+
    'Decision Making and Problem Solving': 'The degree to which the member made sound decisions and provided valid recommendations by using facts, experience, risk assessment, and analytical thought.',
    'Military Readiness': 'The degree to which the member effectively identified and managed stress, and engaged in activities that promoted physical fitness and emotional well-being.',
    'Self-Awareness and Learning': 'The degree to which the member continued to assess self, develop professionally, improve current skills and knowledge, and acquire new skills.',
    'Team Building': 'The degree to which the member promoted teamwork, cooperation, and collaboration among peers, subordinates, and superiors.',
    'Partnering': 'The degree to which the member collaborated across organizational boundaries with stakeholders to enhance and execute assigned duties and tasks.', // E7+
    'Respect for Others': 'The degree to which the member fostered an environment that supported diversity, fairness, dignity, compassion, and creativity.',
    'Accountability and Responsibility': 'The degree to which the member took responsibility of assigned duties and work area. Held self and others accountable to Coast Guard standards.',
    'Influencing Others': 'The effectiveness of the member to persuade and motivate others to achieve a desired outcome.',
    'Workforce Management': 'The degree to which the member effectively managed, mentored, and directed assigned personnel in accordance with Coast Guard policy.', // E7+
    'Effective Communication': 'The degree to which the member effectively utilized all forms of communication in formal and informal settings.',
    'Chiefs Mess Leadership and Participation': 'The degree to which this CPO/SCPO supported the Chiefs Mess and the MCPOCG\'s Mission, Vision, Guiding Principles, and Standing Orders.' // E7+
  };
  const description = rankCategory === 'Officer'
    ? officerCompetencyDescriptions[competency]
    : enlistedCompetencyDescriptions[competency];
  return description || 'Perform duties related to this competency effectively.';
}

function getCategoryDescription(categoryName: string, rankCategory: string): string {
    const officerDescriptions: Record<string, string> = {
        'Performance of Duties': 'Measures an Officer\'s ability to manage, get things done, and communicate effectively.',
        'Leadership Skills': 'Measures an Officer\'s ability to support, develop, direct and influence others.',
        'Personal and Professional Qualities': 'Measures an Officer\'s character and professional growth.',
    };
     const enlistedDescriptions: Record<string, string> = {
        'Military': 'Measures adherence to military standards, bearing, customs and traditions.',
        'Performance': 'Measures job proficiency, quality of work, initiative and technical skill.',
        'Professional Qualities': 'Measures personal attributes like decision making, readiness, learning, and teamwork.',
        'Leadership': 'Measures ability to guide, influence, communicate with, and ensure accountability of others.',
    };
    const description = rankCategory === 'Officer'
        ? officerDescriptions[categoryName]
        : enlistedDescriptions[categoryName];
    return description || ''; // Return empty if no specific description found
}

// --- END OF COMPLETE src/lib/openai.ts ---