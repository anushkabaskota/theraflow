'use server';

/**
 * @fileOverview Summarizes the chat conversation for the therapist.
 *
 * - summarizeChatForTherapist - A function that summarizes the chat conversation.
 * - SummarizeChatForTherapistInput - The input type for the summarizeChatForTherapist function.
 * - SummarizeChatForTherapistOutput - The return type for the summarizeChatForTherapist function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeChatForTherapistInputSchema = z.object({
  chatHistory: z.string().describe('The complete chat history between the patient and the AI assistant.'),
});
export type SummarizeChatForTherapistInput = z.infer<typeof SummarizeChatForTherapistInputSchema>;

const SummarizeChatForTherapistOutputSchema = z.object({
  summary: z.string().describe('A brief summary of the patient\'s needs and preferences.'),
});
export type SummarizeChatForTherapistOutput = z.infer<typeof SummarizeChatForTherapistOutputSchema>;

export async function summarizeChatForTherapist(input: SummarizeChatForTherapistInput): Promise<SummarizeChatForTherapistOutput> {
  return summarizeChatForTherapistFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeChatForTherapistPrompt',
  input: {schema: SummarizeChatForTherapistInputSchema},
  output: {schema: SummarizeChatForTherapistOutputSchema},
  prompt: `You are an AI assistant summarizing a chat conversation for a therapist. Provide a brief overview of the patient\'s needs and preferences based on the following chat history:\n\n{{{chatHistory}}}`,
});

const summarizeChatForTherapistFlow = ai.defineFlow(
  {
    name: 'summarizeChatForTherapistFlow',
    inputSchema: SummarizeChatForTherapistInputSchema,
    outputSchema: SummarizeChatForTherapistOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
