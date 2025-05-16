# USCG Evaluation Web Application Deployment Guide

## Application Overview
The USCG Officer Evaluation Report Generator is a web application that helps USCG members generate performance bullets and create Officer Evaluation Reports based on their achievements. The application features:

1. A chat interface for generating performance bullets based on user inputs
2. A bullet editor for reviewing, editing, and managing generated bullets
3. An OER preview for compiling selected bullets into a complete Officer Evaluation Report

## Technical Stack
- **Frontend Framework**: Next.js with React
- **Styling**: Tailwind CSS
- **Database**: Cloudflare D1 (SQLite-compatible)
- **Deployment**: Cloudflare Workers
- **LLM Integration**: OpenAI API

## Deployment Instructions

### Local Development
1. Clone the repository
2. Install dependencies:
   ```
   cd uscg-eval-app
   pnpm install
   ```
3. Create a `.env.local` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```
   pnpm run dev
   ```
5. Access the application at http://localhost:3000

### Production Deployment
1. Build the application:
   ```
   pnpm run build
   ```
2. Deploy to Cloudflare Workers:
   ```
   pnpm run deploy
   ```
3. Set environment variables in Cloudflare Dashboard:
   - OPENAI_API_KEY: Your OpenAI API key

## Configuration

### OpenAI API Configuration
The application uses the OpenAI API to generate performance bullets. You need to:
1. Obtain an API key from OpenAI
2. Set the API key as an environment variable
3. Optionally adjust the model parameters in `/src/lib/openai.ts`

### Database Configuration
The application is set up to use Cloudflare D1 database. To enable:
1. Uncomment the database configuration in `wrangler.toml`
2. Uncomment the database code in relevant files
3. Run database migrations:
   ```
   wrangler d1 migrations apply DB --local
   ```

## Usage Guide

### Generating Bullets
1. Select a competency area from the dropdown
2. Enter your achievement in the text input
3. Click "Send" to generate a bullet
4. Click "Add to Bullets" to save the generated bullet

### Managing Bullets
1. Review generated bullets organized by category
2. Edit bullets as needed
3. Click "Apply to OER" for bullets you want to include in your report

### Creating OER
1. Fill in the required officer information
2. Review the applied bullets in each section
3. Click "Generate OER Document" to create the report
4. Download or view the generated OER

## Maintenance

### Adding New Features
The application is built with a modular architecture that makes it easy to add new features:
- Add new components in `/src/components/`
- Add new API routes in `/src/app/api/`
- Modify the database schema in `/migrations/`

### Updating Dependencies
Regularly update dependencies to ensure security and performance:
```
pnpm update
```

## Troubleshooting
- If bullets aren't generating, check your OpenAI API key and quota
- If the application fails to start, check for syntax errors in recent changes
- For database issues, try resetting the local database: `rm -rf .wrangler/state/v3`
