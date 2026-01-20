'use server';
/**
 * @fileOverview Initiates the therapy session booking process for patients through a chat interface.
 *
 * - initiateBooking - A function to start the booking process.
 * - InitiateBookingInput - The input type for the initiateBooking function (empty object).
 * - InitiateBookingOutput - The return type for the initiateBooking function (string).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InitiateBookingInputSchema = z.object({});
export type InitiateBookingInput = z.infer<typeof InitiateBookingInputSchema>;

const InitiateBookingOutputSchema = z.string().describe('Response to the user');
export type InitiateBookingOutput = z.infer<typeof InitiateBookingOutputSchema>;

export async function initiateBooking(input: InitiateBookingInput): Promise<InitiateBookingOutput> {
  return initiateBookingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'initiateBookingPrompt',
  input: {schema: InitiateBookingInputSchema},
  output: {schema: InitiateBookingOutputSchema},
  prompt: `You are a helpful assistant that helps patients book therapy sessions. Start by asking the patient for their preferred date range to book a session.`,
});

const initiateBookingFlow = ai.defineFlow(
  {
    name: 'initiateBookingFlow',
    inputSchema: InitiateBookingInputSchema,
    outputSchema: InitiateBookingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
