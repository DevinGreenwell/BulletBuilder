# USCG Evaluation Document Analysis

## Overview
This document provides an analysis of the USCG evaluation documents for both officer and enlisted personnel. The analysis will inform the development of a web application that generates performance bullets and evaluation reports based on rank-specific guidelines.

## Officer Evaluation Documents
The Officer Evaluation Report (OER) system uses specific competencies and performance dimensions to evaluate officers. The key components include:

1. **Performance of Duties**: Evaluates technical knowledge, organizational skills, and professional competence
2. **Leadership Skills**: Assesses leadership abilities, teamwork, and personnel development
3. **Personal and Professional Qualities**: Evaluates character, integrity, and professional growth

## Enlisted Evaluation Documents
The Enlisted Evaluation Report system varies by rank, with increasing leadership responsibilities at higher ranks:

### E4 - Third Class Petty Officer
- **Military**: Military bearing, customs, courtesies, and traditions
- **Performance**: Quality of work, technical proficiency, initiative
- **Professional Qualities**: Decision making, military readiness, self-awareness, team building
- **Leadership**: Respect for others, accountability, influencing others, effective communication

### E5 - Second Class Petty Officer
- Similar to E4 with slightly higher expectations for leadership
- More emphasis on directing others and enforcing standards

### E6 - First Class Petty Officer
- Increased focus on directing others and enforcing standards
- Higher expectations for technical expertise and mentoring others
- More emphasis on accountability and responsibility

### E7 - Chief Petty Officer
- Introduces **Strategic Thinking** competency
- Adds **Chiefs Mess Leadership and Participation**
- Higher expectations for workforce management
- Greater emphasis on partnering across organizational boundaries

### E8 - Senior Chief Petty Officer
- Similar to E7 with higher expectations
- Greater emphasis on strategic leadership
- More focus on developing and implementing organizational objectives
- Higher standards for mentoring and developing others

## Key Differences Between Officer and Enlisted Evaluations
1. **Structure**: Officers use OER format while enlisted personnel use rank-specific evaluation forms
2. **Competencies**: Different competencies are evaluated based on rank and position
3. **Leadership Expectations**: Increasing leadership responsibilities at higher ranks
4. **Evaluation Frequency**: Officers typically evaluated semi-annually, Chiefs (E7-E8) annually

## Implications for Application Development
1. Need to implement a rank selection feature that distinguishes between officer and enlisted personnel
2. Bullet generation must be tailored to rank-specific competencies and expectations
3. Different evaluation report formats needed for officers vs. enlisted personnel
4. Evaluation criteria should reflect the increasing leadership responsibilities at higher ranks
