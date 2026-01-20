# **App Name**: TheraFlow

## Core Features:

- Authentication and Role Selection: Secure user authentication using Firebase Auth with Google OAuth, redirecting first-time users to role selection (therapist/patient).
- Patient Booking Initiation: Patients can initiate therapy session bookings via a chat interface connected to an AI agent.
- AI-Powered Availability Check: The AI agent uses a tool to check therapist's availability by querying the Google Calendar API for open slots within a specified date range.
- Slot Presentation: Present 5-7 available slots to the patient in a clear and readable format in the chat interface.
- Booking Confirmation: Upon patient selection, the AI tool confirms the details and utilizes the create_booking tool to reserve the slot. Confirmed bookings create appointments in the Firestore database
- Automated Confirmation Email: Send an automated confirmation email with appointment details and a calendar invite (.ics file) using Resend or SendGrid.
- Appointment Display: Display upcoming appointments in the dashboard.

## Style Guidelines:

- Primary color: White (#FFFFFF) for a clean and spacious feel, similar to Notion's interface.
- Secondary color: Light gray (#F5F5F5) for backgrounds and subtle dividers to provide visual structure without harsh lines.
- Accent colors: Use a muted palette of blues (#ADD8E6), greens (#90EE90), and yellows (#FFFACD) sparingly for highlights and tags, mirroring Notion's approach to categorization.
- Body and headline font: 'Inter', a grotesque-style sans-serif, to maintain a modern, machined, objective, neutral look
- Use clear and professional icons for navigation and actions.
- Implement a consistent 4px/8px grid system for spacing and alignment.
- Incorporate smooth entrance animations for chat bubbles.