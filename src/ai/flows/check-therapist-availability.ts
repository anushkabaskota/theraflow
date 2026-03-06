'use server';

/**
 * @fileOverview This file defines a Genkit flow to check a therapist's availability
 *  by parsing ambiguous user dates with Gemini, querying the firestore DB, and suggesting alternatives.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAvailableSlots as getSlotsFromDB } from '@/lib/firestore';

const CheckTherapistAvailabilityInputSchema = z.object({
  therapistId: z.string().describe('The ID of the therapist.'),
  userInput: z.string().describe('The raw user input requesting a time.'),
  currentDateTime: z.string().describe('The current system date and time (ISO string) to provide temporal context.'),
});
export type CheckTherapistAvailabilityInput = z.infer<typeof CheckTherapistAvailabilityInputSchema>;

const CheckTherapistAvailabilityOutputSchema = z.object({
  formattedSlots: z.string().describe('A conversational response presenting the slots, or suggesting alternatives.'),
  availableSlots: z.array(z.string()).describe('An array of available time slots (ISO format).'),
});
export type CheckTherapistAvailabilityOutput = z.infer<typeof CheckTherapistAvailabilityOutputSchema>;

const checkAvailabilityTool = ai.defineTool({
  name: 'checkAvailabilityTool',
  description: 'Retrieves available time slots from the database for a given therapist and date range. Date strings MUST be in ISO format.',
  inputSchema: z.object({
    therapistId: z.string().describe('The ID of the therapist.'),
    startDate: z.string().describe('The start date for availability check (ISO format).'),
    endDate: z.string().describe('The end date for availability check (ISO format).'),
  }),
  outputSchema: z.array(z.string()).describe('An array of available time slots (ISO format).'),
}, async (input) => {
  console.log(`Checking DB availability for therapist ${input.therapistId} from ${input.startDate} to ${input.endDate}`);
  const slots = await getSlotsFromDB(input.therapistId, input.startDate, input.endDate);
  return slots.map(slot => slot.toISOString());
});

const checkTherapistAvailabilityPrompt = ai.definePrompt({
  name: 'checkTherapistAvailabilityPrompt',
  input: { schema: CheckTherapistAvailabilityInputSchema },
  output: { schema: CheckTherapistAvailabilityOutputSchema },
  tools: [checkAvailabilityTool],
  prompt: `You are an intelligent booking assistant trying to find an available therapy session time for a patient.
  The patient said: "{{userInput}}"
  The current system date and time is: "{{currentDateTime}}"
  The therapist ID you must query is: "{{therapistId}}"
  
  Instructions:
  1. Determine the date range (startDate and endDate in ISO 8601 format) to check based on what the user asked. Keep in mind what the current date is.
  2. Use the "checkAvailabilityTool" to fetch available time slots for "{{therapistId}}" from the database.
      - If the user asks for a specific date (e.g. "today", "tomorrow", "next Monday"), check that specific date (start of day to end of day).
      - If the user is ambiguous or requests an extended period (e.g. "this week", "next week"), check the appropriate 7-day range.
  3. If NO slots are found for their specific requested time:
      - Automatically use the "checkAvailabilityTool" **AGAIN** to search the next 7 days from the current date for any available slots to offer as alternatives.
  4. Formulate a polite, conversational response ("formattedSlots") presenting the available slots to the user.
      - If you found exact matches, present them clearly.
      - If you had to find alternatives, politely inform them their requested time wasn't available, but suggest the alternatives found.
      - Make sure times are nicely formatted for a human (e.g., "Monday, March 9th at 2:00 PM").
  5. Finally, return the RAW array of ISO date strings in "availableSlots" exactly as returned by the tool (this is used by the UI to render buttons).
  6. If absolutely NO slots exist at all, return an empty array for availableSlots, and inform the user.
  `,
  config: {
    temperature: 0.1,
  }
});

export const checkTherapistAvailabilityFlow = ai.defineFlow(
  {
    name: 'checkTherapistAvailabilityFlow',
    inputSchema: CheckTherapistAvailabilityInputSchema,
    outputSchema: CheckTherapistAvailabilityOutputSchema,
  },
  async input => {
    const { output } = await checkTherapistAvailabilityPrompt(input);
    return output!;
  }
);

export async function checkTherapistAvailability(
  input: CheckTherapistAvailabilityInput
): Promise<CheckTherapistAvailabilityOutput> {
  return checkTherapistAvailabilityFlow(input);
}
