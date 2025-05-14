// src/app/api/oer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer'; // Keep using the current puppeteer import

// Define the structure of a single bullet object
interface Bullet {
  id?: string;
  isApplied: boolean;
  category: string;
  competency: string;
  content: string;
}

// Define the structure of the incoming request body
interface OerRequestBody {
  officerName: string;
  startDate?: string | Date;
  endDate?: string | Date;
  markingPeriodStart?: string | Date; // For backward compatibility
  markingPeriodEnd?: string | Date; // For backward compatibility
  bullets: Bullet[];
  rankCategory: string;
  rank: string;
  unitName?: string;
  position?: string;
  employeeId?: string;
}

// Helper function to get Enlisted Report Titles
function getEnlistedReportTitle(rank: string): string {
  const rankTitles: Record<string, string> = {
    'E4': 'Third Class Petty Officer Evaluation Report', 
    'E5': 'Second Class Petty Officer Evaluation Report',
    'E6': 'First Class Petty Officer Evaluation Report', 
    'E7': 'Chief Petty Officer Evaluation Report',
    'E8': 'Senior Chief Petty Officer Evaluation Report',
  };
  return rankTitles[rank] || 'Enlisted Evaluation Report';
}

// Helper function to render a section of bullets
function renderBulletSection(title: string, bullets: Bullet[]): string {
  if (bullets.length === 0) {
    return `
      <div class="section">
        <div class="section-title">${title.toUpperCase()}</div>
        <p style="padding-left: 20px; font-style: italic; color: #555;">No bullets applied to this section.</p>
      </div>
    `;
  }
  return `
    <div class="section">
      <div class="section-title">${title.toUpperCase()}</div>
      ${bullets.map((bullet) => `
        <div class="competency">
          <div class="competency-title">${bullet.competency}</div>
          <div class="bullet">${bullet.content}</div>
        </div>
      `).join('')}
    </div>
  `;
}

export async function POST(request: NextRequest) {
  console.log("[oer/route.ts] Received POST request");
  let browser = null; // Define browser outside try block for finally clause

  try {
    const body = await request.json() as OerRequestBody;
    console.log("[oer/route.ts] Request body parsed:", { 
      officerName: body.officerName, 
      rank: body.rank, 
      numBullets: body.bullets?.length 
    });

    // Handle various date field names for compatibility
    const markingPeriodStart = body.startDate || body.markingPeriodStart;
    const markingPeriodEnd = body.endDate || body.markingPeriodEnd;

    const {
      officerName, bullets, rankCategory, rank, unitName, position
    } = body;

    // --- Input Validation ---
    if (!officerName || !markingPeriodStart || !markingPeriodEnd || !Array.isArray(bullets) || !rankCategory || !rank) {
      console.error("[oer/route.ts] Validation Failed: Missing required fields.");
      return NextResponse.json(
        { error: 'Missing required fields (Name, Dates, Bullets, Rank Info)', success: false },
        { status: 400 }
      );
    }

    const appliedBullets = bullets.filter((bullet) => bullet.isApplied);
    console.log(`[oer/route.ts] Found ${appliedBullets.length} applied bullets.`);

    if (appliedBullets.length === 0) {
      return NextResponse.json(
        { error: 'No applied bullets found. Please apply bullets before generating report.', success: false },
        { status: 400 }
      );
    }

    // --- Generate HTML content conditionally ---
    let htmlSections = '';
    let reportTitle = '';
    let nameLabel = '';
    let fullHtml: string;

// Update the styles variable to use Times New Roman
const styles = `
  <style>
    body { 
      font-family: 'Times New Roman', Times, serif; 
      line-height: 1.4; 
      max-width: 8.5in; 
      margin: 0 auto; 
      padding: 0.5in; 
      font-size: 11pt; 
    }
    .header { 
      text-align: center; 
      margin-bottom: 20px; 
      border-bottom: 2px solid #000; 
      padding-bottom: 10px; 
    }
    .header h1 { 
      font-size: 14pt; 
      margin: 0 0 5px 0; 
      text-transform: uppercase; 
      font-family: 'Times New Roman', Times, serif;
    }
    .header h2 {
      font-size: 13pt;
      margin: 0 0 8px 0;
      font-family: 'Times New Roman', Times, serif;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-family: 'Times New Roman', Times, serif;
    }
    .info-table td {
      padding: 4px;
      border: 1px solid #000;
    }
    .info-table td:first-child {
      width: 20%;
      font-weight: bold;
    }
    .header h3 {
    }
    .category-title {
      font-size: 12pt;
      font-weight: bold;
      margin: 20px 0 10px 0;
      text-transform: uppercase;
      font-family: 'Times New Roman', Times, serif;
    }
    .competency-box {
      border: 1px solid #000;
      margin-bottom: 15px;
      page-break-inside: avoid;
    }
    .competency-header {
      border-bottom: 1px solid #000;
      padding:  1px 1px 5px 10px;
      background-color:rgb(221, 226, 251);
      font-weight: bold;
      font-family: 'Times New Roman', Times, serif;
    }
    .competency-description {
      font-style: italic;
      margin-bottom: 0;
      font-family: 'Times New Roman', Times, serif;
    }
    .bullet-list {
      padding: 5px 10px;
      font-family: 'Times New Roman', Times, serif;
    }
    .bullet-item {
      margin-bottom: 5px;
      padding-left: 15px;
      position: relative;
    }
    .bullet-item:before {
      content: "•";
      position: absolute;
      left: 0;
    }
    .goals-section {
      margin-top: 30px;
      font-family: 'Times New Roman', Times, serif;
    }
    .goals-title {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .footer { 
      margin-top: 25px; 
      text-align: center; 
      font-size: 8pt; 
      color: #666; 
      font-family: 'Times New Roman', Times, serif;
    }
    @media print { 
      body { 
        padding: 0; 
        font-size: 11pt;
        font-family: 'Times New Roman', Times, serif;
      } 
      @page { 
        margin: 0.5in; 
      } 
    }
  </style>
`;
function renderCompetencySectionWithDescription(competency: string, description: string, bullets: Bullet[]): string {
  if (bullets.length === 0) {
    return `
      <div class="competency-box">
        <div class="competency-header">
          <p><strong>${competency}:</strong> <span class="competency-description" style="font-weight: normal;">${description}</span></p>
        </div>
        <div class="bullet-list">
          <p style="font-style: italic; color: #555;">No bullets applied to this competency.</p>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="competency-box">
      <div class="competency-header">
        <p><strong>${competency}:</strong> <span class="competency-description" style="font-weight: normal;">${description}</span></p>
      </div>
      <div class="bullet-list">
        ${bullets.map((bullet) => `
          <div class="bullet-item">${bullet.content}</div>
        `).join('')}
      </div>
    </div>
  `;
}

// Add this function to get competency descriptions
function getCompetencyDescription(competency: string): string {
  const descriptions: Record<string, string> = {
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
  
  return descriptions[competency] || '';
}

// Modify the HTML template generation in the POST function

// For Officer category, use the updated format
if (rankCategory === 'Officer') {
  // Group bullets by competency
  const competencyBullets: Record<string, Bullet[]> = {};
  
  appliedBullets.forEach(bullet => {
    if (!competencyBullets[bullet.competency]) {
      competencyBullets[bullet.competency] = [];
    }
    competencyBullets[bullet.competency].push(bullet);
  });
  
  const performanceDuties = [
    'Planning & Preparedness', 'Using Resources', 'Results/Effectiveness',
    'Adaptability', 'Professional Competence', 'Speaking and Listening', 'Writing'
  ];
  
  const leadershipSkills = [
    'Looking Out For Others', 'Developing Others', 'Directing Others',
    'Teamwork', 'Workplace Climate', 'Evaluations'
  ];
  
  const personalQualities = [
    'Initiative', 'Judgment', 'Responsibility',
    'Professional Presence', 'Health and Well Being'
  ];
  
  // Generate sections for each competency
  let performanceSection = '';
  let leadershipSection = '';
  let personalSection = '';
  
  // Performance of Duties
  performanceDuties.forEach(comp => {
    const bullets = competencyBullets[comp] || [];
    const description = getCompetencyDescription(comp);
    performanceSection += renderCompetencySectionWithDescription(comp, description, bullets);
  });
  
  // Leadership Skills
  leadershipSkills.forEach(comp => {
    const bullets = competencyBullets[comp] || [];
    const description = getCompetencyDescription(comp);
    leadershipSection += renderCompetencySectionWithDescription(comp, description, bullets);
  });
  
  // Personal & Professional Qualities
  personalQualities.forEach(comp => {
    const bullets = competencyBullets[comp] || [];
    const description = getCompetencyDescription(comp);
    personalSection += renderCompetencySectionWithDescription(comp, description, bullets);
  });
  
  // Create the full HTML
  fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8"><title>Officer Support Form</title>${styles}
    </head>
    <body>
      <div class="header">
        <h1>UNITED STATES COAST GUARD</h1>
        <h2>OFFICER SUPPORT FORM</h2>
      </div>
      
      <table class="info-table">
        <tr>
          <td>Name</td>
          <td>${officerName}</td>
        </tr>
        <tr>
          <td>Unit</td>
          <td>${unitName || ''}</td>
        </tr>
        <tr>
          <td>Position</td>
          <td>${position || ''}</td>
        </tr>
        <tr>
          <td>Marking Period</td>
          <td>${new Date(markingPeriodStart).toLocaleDateString()} to ${new Date(markingPeriodEnd).toLocaleDateString()}</td>
        </tr>
      </table>
      
      <div class="category-title">PERFORMANCE OF DUTIES</div>
      ${performanceSection}
      
      <div class="category-title">LEADERSHIP SKILLS</div>
      ${leadershipSection}
      
      <div class="category-title">PERSONAL AND PROFESSIONAL QUALITIES</div>
      ${personalSection}
      
      
      <div class="footer">
        <p>Officer Support Form | Date Generated: ${new Date().toLocaleDateString()}</p>
      </div>
    </body>
    </html>`;
} else {
  // Keep the existing enlisted format
  reportTitle = getEnlistedReportTitle(rank);
  nameLabel = 'Member Name';
  // ... [keep your existing enlisted format code]
      const militaryBullets = appliedBullets.filter((b) => b.category === 'Military');
      const enlistedPerformanceBullets = appliedBullets.filter((b) => b.category === 'Performance');
      const professionalQualitiesBullets = appliedBullets.filter((b) => b.category === 'Professional Qualities');
      const enlistedLeadershipBullets = appliedBullets.filter((b) => b.category === 'Leadership');
      htmlSections = `
        ${renderBulletSection('Military', militaryBullets)}
        ${renderBulletSection('Performance', enlistedPerformanceBullets)}
        ${renderBulletSection('Professional Qualities', professionalQualitiesBullets)}
      ${renderBulletSection('Leadership', enlistedLeadershipBullets)}
      `;
    
    // Add unit name and position to header if provided
    const additionalInfo = [];
    if (unitName) additionalInfo.push(`<strong>Unit:</strong> ${unitName}`);
    if (position) additionalInfo.push(`<strong>Position:</strong> ${position}`);
    const additionalInfoHtml = additionalInfo.length > 0 
      ? additionalInfo.join('<br/>') + '<br/>' 
      : '';

    fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8"><title>${reportTitle}</title>${styles}
      </head>
      <body>
        <div class="header">
          <h1>UNITED STATES COAST GUARD</h1><h2>${reportTitle}</h2>
          <p><strong>${nameLabel}:</strong> ${officerName}<br/>
          ${additionalInfoHtml}
          <strong>Marking Period:</strong> ${new Date(markingPeriodStart).toLocaleDateString()} to ${new Date(markingPeriodEnd).toLocaleDateString()}</p>
        </div>
        ${htmlSections}
            <div class="footer">
              <p>Evaluation Support Form | Date Generated: ${new Date().toLocaleDateString()}</p>
            </div>
          </body></html>`;
      }

    // --- Attempt to generate PDF using Puppeteer with improved error handling ---
    console.log("[oer/route.ts] Attempting to launch Puppeteer...");
    
    try {
      // First attempt: Try to use Puppeteer normally
      try {
        browser = await puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
          headless: true
        });
      } catch (browserError) {
        console.error("[oer/route.ts] Error launching browser normally:", browserError);
        console.log("[oer/route.ts] Attempting to launch with explicit Chrome path...");
        
        // Second attempt: Try specific Chrome paths based on platform
        const chromePath = process.platform === 'darwin' 
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          : process.platform === 'win32'
            ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
            : '/usr/bin/google-chrome';
            
        browser = await puppeteer.launch({
          executablePath: chromePath,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
          headless: true
        });
      }
      
      // If we get here, a browser launched successfully
      const page = await browser.newPage();
      console.log("[oer/route.ts] Setting HTML content...");
      await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });
      
      console.log("[oer/route.ts] Generating PDF buffer...");
      const pdfBuffer = await page.pdf({
        format: 'Letter',
        printBackground: true,
        margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }
      });
      console.log("[oer/route.ts] PDF generation complete. Buffer size:", pdfBuffer.length);
      
      // Generate dynamic filename
      const filePrefix = rankCategory === 'Officer' ? 'OER' : `EER_${rank}`;
      const safeName = officerName.replace(/[^a-zA-Z0-9]/g, '_');
      const dateSuffix = new Date().toISOString().split('T')[0];
      const fileName = `${filePrefix}_${safeName}_${dateSuffix}.pdf`;

      // Return the PDF buffer with correct headers
      const response = new NextResponse(pdfBuffer);
      response.headers.set('Content-Type', 'application/pdf'); 
      response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
      console.log("[oer/route.ts] Sending PDF response.");
      return response;
      
    } catch (puppeteerError) {
      console.error('[oer/route.ts] All Puppeteer attempts failed:', puppeteerError);
      
      // Fallback to HTML response if PDF generation fails
      console.log("[oer/route.ts] Falling back to HTML response");
      const response = new NextResponse(fullHtml);
      response.headers.set('Content-Type', 'text/html');
      return response;
    }

  } catch (error) {
    console.error('[oer/route.ts] Error processing request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request', success: false },
      { status: 500 }
    );
  } finally {
    // Ensure browser is closed even if errors occur
    if (browser !== null) {
      try {
        console.log("[oer/route.ts] Closing browser in finally block.");
        await browser.close();
      } catch (closeError) {
        console.error("[oer/route.ts] Error closing browser:", closeError);
      }
    }
  }
}