'use server';

/**
 * @fileOverview Generates session notes from a meeting transcription.
 * Creates two versions:
 * 1. Detailed notes for the trainee's reference
 * 2. Anonymized thematic summary for the supervisor (no personal info)
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateSessionNotesInputSchema = z.object({
    transcription: z.string().describe('The full meeting transcription text.'),
    patientName: z.string().describe('The name of the patient/client.'),
    therapistName: z.string().describe('The name of the trainee therapist.'),
    sessionDate: z.string().describe('The date of the session.'),
});
export type GenerateSessionNotesInput = z.infer<typeof GenerateSessionNotesInputSchema>;

const GenerateSessionNotesOutputSchema = z.object({
    detailedNotes: z.string().describe('Detailed session notes for the trainee, including specific observations, client statements, therapeutic interventions used, and follow-up recommendations.'),
    supervisorSummary: z.string().describe('An anonymized thematic summary for the supervisor. Must NOT include any personally identifiable information about the client. Focuses on conversation themes, therapeutic approaches used, areas for growth, and clinical observations.'),
});
export type GenerateSessionNotesOutput = z.infer<typeof GenerateSessionNotesOutputSchema>;

const generateSessionNotesPrompt = ai.definePrompt({
    name: 'generateSessionNotesPrompt',
    model: 'googleai/gemini-2.5-flash',
    input: { schema: GenerateSessionNotesInputSchema },
    output: { schema: GenerateSessionNotesOutputSchema },
    prompt: `You are an expert clinical supervisor assistant. You are given the transcription of a therapy session.

Session Date: {{{sessionDate}}}
Therapist (Trainee): {{{therapistName}}}
Client: {{{patientName}}}

--- TRANSCRIPTION ---
{{{transcription}}}
--- END TRANSCRIPTION ---

Generate TWO versions of session notes:

**1. Detailed Notes (for the trainee's personal reference):**
- Include specific observations about the client
- Note key statements and disclosures made by the client
- Document therapeutic techniques and interventions used
- Include the trainee's apparent approach and style
- Note any breakthroughs, resistances, or notable moments
- Suggest follow-up topics for the next session
- Use clear headings and bullet points for readability
- Format with Markdown

**2. Supervisor Summary (anonymised, for supervisor review):**
- CRITICAL: Do NOT include ANY personally identifiable information about the client
- Replace the client's name with "the client"
- Do NOT include specific personal details (addresses, workplaces, family names, etc.)
- Focus on:
  - Main themes and topics discussed (e.g., anxiety, grief, relationship issues)
  - Therapeutic techniques and approaches observed
  - Quality of therapeutic alliance
  - Areas where the trainee showed strength
  - Areas for improvement or further development
  - Clinical risk indicators if any
  - Suggested supervision discussion points
- Use clear headings and bullet points
- Format with Markdown`,
});

const generateSessionNotesFlow = ai.defineFlow(
    {
        name: 'generateSessionNotesFlow',
        inputSchema: GenerateSessionNotesInputSchema,
        outputSchema: GenerateSessionNotesOutputSchema,
    },
    async (input) => {
        const { output } = await generateSessionNotesPrompt(input);
        return output!;
    }
);

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (e: any) {
            const is429 = e?.message?.includes('429') || e?.status === 429;
            if (is429 && i < maxRetries - 1) {
                const waitSec = Math.pow(2, i + 1) * 10; // 20s, 40s, 80s
                console.log(`Rate limited. Retrying in ${waitSec}s...`);
                await new Promise(r => setTimeout(r, waitSec * 1000));
            } else {
                throw e;
            }
        }
    }
    throw new Error('Max retries exceeded');
}

export async function generateSessionNotes(
    input: GenerateSessionNotesInput
): Promise<GenerateSessionNotesOutput> {
    return withRetry(() => generateSessionNotesFlow(input));
}

