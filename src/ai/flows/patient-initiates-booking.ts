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

// The output of the exported function is just the string.
export type InitiateBookingOutput = string;

// This is the object schema for the prompt's structured output.
const InitiateBookingFlowOutputSchema = z.object({
  response: z.string().describe('Response to the user'),
});

export async function initiateBooking(input: InitiateBookingInput): Promise<InitiateBookingOutput> {
  const result = await initiateBookingFlow(input);
  return result.response;
}

const prompt = ai.definePrompt({
  name: 'initiateBookingPrompt',
  input: {schema: InitiateBookingInputSchema},
  output: {schema: InitiateBookingFlowOutputSchema}, // Use the object schema here.
  prompt: `You are a helpful assistant that helps patients book therapy sessions. Start by asking the patient for their preferred date range to book a session.`,
});

const initiateBookingFlow = ai.defineFlow(
  {
    name: 'initiateBookingFlow',
    inputSchema: InitiateBookingInputSchema,
    outputSchema: InitiateBookingFlowOutputSchema, // The flow returns the object.
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
