# USCG Evaluation Web Application Architecture

## Overview
The USCG Evaluation Web Application will be a Next.js application that helps USCG members generate performance bullets and create Officer Evaluation Reports based on their achievements. The application will feature an LLM-powered chat interface for generating bullets, an editing interface for refining bullets, and functionality to compile selected bullets into a complete OER.

## Technology Stack
- **Frontend Framework**: Next.js with React
- **Styling**: Tailwind CSS
- **Database**: Cloudflare D1 (SQLite-compatible)
- **Deployment**: Cloudflare Workers
- **LLM Integration**: API-based integration with a language model

## Application Components

### 1. User Interface Components
- **Chat Interface**: For users to input achievements and receive generated bullets
- **Bullet Editor**: For reviewing and editing generated bullets
- **Bullet Library**: For storing and categorizing saved bullets
- **OER Preview**: For viewing the compiled Officer Evaluation Report
- **Navigation**: For moving between different sections of the application

### 2. Backend Services
- **Bullet Generation Service**: Processes user inputs and generates performance bullets
- **OER Compilation Service**: Compiles selected bullets into a formatted OER
- **Database Service**: Manages storage and retrieval of bullets and reports
- **Authentication Service** (optional): Manages user accounts and access control

### 3. Database Schema

#### Users Table (if authentication is implemented)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  rank TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Bullets Table
```sql
CREATE TABLE bullets (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  category TEXT,
  subcategory TEXT,
  content TEXT,
  original_input TEXT,
  is_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Reports Table
```sql
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT,
  marking_period_start TEXT,
  marking_period_end TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Report_Bullets Table (Junction table)
```sql
CREATE TABLE report_bullets (
  report_id TEXT,
  bullet_id TEXT,
  position INTEGER,
  PRIMARY KEY (report_id, bullet_id),
  FOREIGN KEY (report_id) REFERENCES reports(id),
  FOREIGN KEY (bullet_id) REFERENCES bullets(id)
);
```

## Application Flow

1. **User Input Flow**:
   - User enters achievements/activities in the chat interface
   - Application processes input using LLM to generate relevant bullets
   - Generated bullets are displayed to the user for review
   - User can edit, save, or discard generated bullets
   - Saved bullets are stored in the bullet library

2. **OER Creation Flow**:
   - User selects bullets from the bullet library to include in the OER
   - User arranges selected bullets in desired order
   - Application compiles bullets into appropriate sections of the OER
   - User can preview the complete OER
   - User can export the OER in a printable format

## LLM Integration

The application will integrate with a language model API to:

1. **Generate Performance Bullets**:
   - Process user inputs describing achievements
   - Format bullets according to USCG standards
   - Align bullets with appropriate competency areas
   - Ensure bullets highlight impact and results

2. **Provide Writing Guidance**:
   - Offer suggestions for improving bullet quality
   - Provide examples of effective bullets for each competency
   - Help users focus on key achievements and impact

## Prompt Engineering

The LLM will be provided with:
- Detailed descriptions of each competency area
- Examples of effective bullets for each competency
- Guidelines for USCG evaluation writing standards
- Context about the user's rank and role (if provided)

Example prompt structure:
```
You are a USCG evaluation writing assistant. Your task is to generate performance bullets based on the following achievement:

[User Input]

Generate a bullet that aligns with the [Competency Area] competency. 
The bullet should:
- Begin with an action verb
- Highlight measurable impact
- Be concise and specific
- Follow USCG writing standards

Competency description: [Description from OER Competencies]
```

## Responsive Design

The application will be designed to work on:
- Desktop computers (primary use case)
- Tablets
- Mobile devices (with adapted layout)

## Security Considerations

- User data will be stored securely in the database
- No PII will be shared with external services without explicit consent
- Authentication will be implemented if user accounts are required
- All API communications will be encrypted

## Future Enhancements

Potential future features:
- Bullet templates for common achievements
- Collaborative editing for supervisors and subordinates
- Integration with official USCG systems (if applicable)
- Analytics on bullet effectiveness and usage patterns
- Support for additional evaluation forms and ranks
