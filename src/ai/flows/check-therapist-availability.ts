'use server';

/**
 * @fileOverview This file defines a Genkit flow to check a therapist's availability
 *  by querying the Google Calendar API for open slots within a specified date range.
 *
 * - checkTherapistAvailability - A function that triggers the availability check flow.
 * - CheckTherapistAvailabilityInput - The input type for the checkTherapistAvailability function.
 * - CheckTherapistAvailabilityOutput - The return type for the checkTherapistAvailability function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckTherapistAvailabilityInputSchema = z.object({
  therapistId: z.string().describe('The ID of the therapist.'),
  startDate: z.string().describe('The start date for availability check (ISO format).'),
  endDate: z.string().describe('The end date for availability check (ISO format).'),
});
export type CheckTherapistAvailabilityInput = z.infer<typeof CheckTherapistAvailabilityInputSchema>;

const CheckTherapistAvailabilityOutputSchema = z.object({
  availableSlots: z.array(z.string()).describe('An array of available time slots (ISO format).'),
});
export type CheckTherapistAvailabilityOutput = z.infer<typeof CheckTherapistAvailabilityOutputSchema>;

export async function checkTherapistAvailability(
  input: CheckTherapistAvailabilityInput
): Promise<CheckTherapistAvailabilityOutput> {
  return checkTherapistAvailabilityFlow(input);
}

const getAvailableSlots = ai.defineTool({
  name: 'getAvailableSlots',
  description: 'Retrieves available time slots from the Google Calendar API for a given therapist and date range.',
  inputSchema: z.object({
    therapistId: z.string().describe('The ID of the therapist.'),
    startDate: z.string().describe('The start date for availability check (ISO format).'),
    endDate: z.string().describe('The end date for availability check (ISO format).'),
  }),
  outputSchema: z.array(z.string()).describe('An array of available time slots (ISO format).'),
}, async (input) => {
  // TODO: Implement the Google Calendar API call here to fetch available slots.
  // Replace this with the actual implementation.
  console.log(`Checking availability for therapist ${input.therapistId} from ${input.startDate} to ${input.endDate}`);
  const mockAvailableSlots = [
    new Date(new Date(input.startDate).getTime() + 60 * 60 * 1000).toISOString(),
    new Date(new Date(input.startDate).getTime() + 2 * 60 * 60 * 1000).toISOString(),
  ];
  return mockAvailableSlots;
});

const checkTherapistAvailabilityFlow = ai.defineFlow(
  {
    name: 'checkTherapistAvailabilityFlow',
    inputSchema: CheckTherapistAvailabilityInputSchema,
    outputSchema: CheckTherapistAvailabilityOutputSchema,
  },
  async input => {
    const availableSlots = await getAvailableSlots(input);

    return {
      availableSlots,
    };
  }
);
