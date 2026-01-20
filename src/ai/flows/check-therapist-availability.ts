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
import { getTherapistAvailability as getSlotsFromDB } from '@/lib/firestore';
import { isWithinInterval, parseISO } from 'date-fns';

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
  description: 'Retrieves available time slots from the database for a given therapist and date range.',
  inputSchema: z.object({
    therapistId: z.string().describe('The ID of the therapist.'),
    startDate: z.string().describe('The start date for availability check (ISO format).'),
    endDate: z.string().describe('The end date for availability check (ISO format).'),
  }),
  outputSchema: z.array(z.string()).describe('An array of available time slots (ISO format).'),
}, async (input) => {
  console.log(`Checking DB availability for therapist ${input.therapistId} from ${input.startDate} to ${input.endDate}`);
  
  const allSlots = await getSlotsFromDB(input.therapistId);
  
  const start = parseISO(input.startDate);
  const end = parseISO(input.endDate);

  const filteredSlots = allSlots.filter(slot => 
    isWithinInterval(slot, { start, end })
  );

  return filteredSlots.map(slot => slot.toISOString());
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
