'use server';

/**
 * @fileOverview AI flow to present available time slots to the patient in a clear, readable format.
 *
 * - presentAvailableSlots - A function that handles the presentation of available time slots.
 * - PresentAvailableSlotsInput - The input type for the presentAvailableSlots function.
 * - PresentAvailableSlotsOutput - The return type for the presentAvailableSlots function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PresentAvailableSlotsInputSchema = z.object({
  availableSlots: z.array(
    z.object({
      start: z.string().describe('The start time of the available slot in ISO format.'),
      end: z.string().describe('The end time of the available slot in ISO format.'),
    })
  ).describe('An array of available time slots.'),
});
export type PresentAvailableSlotsInput = z.infer<typeof PresentAvailableSlotsInputSchema>;

const PresentAvailableSlotsOutputSchema = z.object({
  formattedSlots: z.string().describe('A clear, readable string of available time slots.'),
});
export type PresentAvailableSlotsOutput = z.infer<typeof PresentAvailableSlotsOutputSchema>;

export async function presentAvailableSlots(input: PresentAvailableSlotsInput): Promise<PresentAvailableSlotsOutput> {
  return presentAvailableSlotsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'presentAvailableSlotsPrompt',
  input: {schema: PresentAvailableSlotsInputSchema},
  output: {schema: PresentAvailableSlotsOutputSchema},
  prompt: `You are a helpful assistant that formats a list of available time slots into a human-readable format for a patient to choose from.

  Here are the available time slots:
  {{#each availableSlots}}
  - {{formatTime start}} - {{formatTime end}}
  {{/each}}
  
  Make sure to format the output so it is easy to read.
  `, 
  templateHelpers: {
    formatTime: (time: string) => {
      return new Date(time).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'});
    },
  },
});

const presentAvailableSlotsFlow = ai.defineFlow(
  {
    name: 'presentAvailableSlotsFlow',
    inputSchema: PresentAvailableSlotsInputSchema,
    outputSchema: PresentAvailableSlotsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
