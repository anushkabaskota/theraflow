'use server';

/**
 * @fileOverview Analyzes a supervisor session summary and extracts
 * structured clinical psychology themes, therapeutic approaches,
 * risk indicators, and an overall trainee assessment.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ThemeSchema = z.object({
    title: z.string().describe('A concise clinical psychology term or concept, e.g. "Cognitive Distortions", "Attachment Insecurity", "Affect Dysregulation".'),
    description: z.string().describe('A brief clinical explanation of how this theme manifested in the session.'),
    clinicalCategory: z.string().describe('The broader clinical framework, e.g. "CBT", "Psychodynamic", "Attachment Theory", "Humanistic", "Trauma-Informed".'),
    severity: z.enum(['low', 'moderate', 'high']).describe('Clinical severity/intensity of this theme as observed in the session.'),
});

const AnalyzeSessionThemesInputSchema = z.object({
    supervisorSummary: z.string().describe('The anonymized thematic summary written for the supervisor.'),
});
export type AnalyzeSessionThemesInput = z.infer<typeof AnalyzeSessionThemesInputSchema>;

const AnalyzeSessionThemesOutputSchema = z.object({
    themes: z.array(ThemeSchema).describe('Key clinical themes identified in the session, using clinical psychology terminology.'),
    therapeuticApproaches: z.array(z.string()).describe('Therapeutic modalities and techniques observed, e.g. "Cognitive Restructuring", "Motivational Interviewing", "Reflective Listening".'),
    riskIndicators: z.array(z.string()).describe('Any clinical risk factors noted, e.g. "suicidal ideation", "self-harm risk", "substance misuse". Empty array if none.'),
    overallAssessment: z.string().describe('A brief overall clinical assessment of the trainee\'s performance and the session quality.'),
});
export type AnalyzeSessionThemesOutput = z.infer<typeof AnalyzeSessionThemesOutputSchema>;

const analyzeSessionThemesPrompt = ai.definePrompt({
    name: 'analyzeSessionThemesPrompt',
    model: 'googleai/gemini-2.5-flash',
    input: { schema: AnalyzeSessionThemesInputSchema },
    output: { schema: AnalyzeSessionThemesOutputSchema },
    prompt: `You are a senior clinical psychology supervisor with expertise in multiple therapeutic modalities.

Analyze the following anonymized session summary and extract structured clinical insights.

--- SESSION SUMMARY ---
{{{supervisorSummary}}}
--- END SUMMARY ---

Provide your analysis using proper clinical psychology terminology:

**Themes**: Identify 3-6 key clinical themes. For each theme:
- Use precise clinical psychology terms (e.g., "Cognitive Distortions", "Transference Dynamics", "Avoidant Attachment Pattern", "Affect Dysregulation", "Maladaptive Coping Mechanisms", "Ego Defenses")
- Categorize under a clinical framework (CBT, Psychodynamic, Attachment Theory, Humanistic, Trauma-Informed, Existential, Systems Theory, etc.)
- Assess severity based on clinical presentation (low = manageable, moderate = warrants monitoring, high = requires immediate attention)
- Provide a brief clinical description

**Therapeutic Approaches**: List the specific therapeutic techniques and modalities observed (e.g., "Socratic Questioning", "Empathic Reflection", "Exposure Hierarchy", "Cognitive Restructuring")

**Risk Indicators**: Note any clinical risk factors. Be specific but conservative. Return an empty array if no risks are present.

**Overall Assessment**: Provide a concise supervisory evaluation of the trainee's clinical performance, noting strengths and areas for development.`,
});

const analyzeSessionThemesFlow = ai.defineFlow(
    {
        name: 'analyzeSessionThemesFlow',
        inputSchema: AnalyzeSessionThemesInputSchema,
        outputSchema: AnalyzeSessionThemesOutputSchema,
    },
    async (input) => {
        const { output } = await analyzeSessionThemesPrompt(input);
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
                const waitSec = Math.pow(2, i + 1) * 10;
                console.log(`Rate limited. Retrying in ${waitSec}s...`);
                await new Promise(r => setTimeout(r, waitSec * 1000));
            } else {
                throw e;
            }
        }
    }
    throw new Error('Max retries exceeded');
}

export async function analyzeSessionThemes(
    input: AnalyzeSessionThemesInput
): Promise<AnalyzeSessionThemesOutput> {
    return withRetry(() => analyzeSessionThemesFlow(input));
}
