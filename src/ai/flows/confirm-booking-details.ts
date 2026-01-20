'use server';

/**
 * @fileOverview Confirms booking details and uses the create_booking tool to reserve the slot.
 *
 * - confirmBookingDetails - A function that confirms the booking details and reserves the slot.
 * - ConfirmBookingDetailsInput - The input type for the confirmBookingDetails function.
 * - ConfirmBookingDetailsOutput - The return type for the confirmBookingDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConfirmBookingDetailsInputSchema = z.object({
  patientName: z.string().describe('The name of the patient.'),
  therapistName: z.string().describe('The name of the therapist.'),
  dateTime: z.string().describe('The date and time of the appointment.'),
});
export type ConfirmBookingDetailsInput = z.infer<typeof ConfirmBookingDetailsInputSchema>;

const ConfirmBookingDetailsOutputSchema = z.object({
  confirmationMessage: z.string().describe('A confirmation message for the booking.'),
  bookingSuccessful: z.boolean().describe('Whether the booking was successful.'),
});
export type ConfirmBookingDetailsOutput = z.infer<typeof ConfirmBookingDetailsOutputSchema>;

const createBooking = ai.defineTool({
  name: 'createBooking',
  description: 'Creates a booking in the system.',
  inputSchema: z.object({
    patientName: z.string().describe('The name of the patient.'),
    therapistName: z.string().describe('The name of the therapist.'),
    dateTime: z.string().describe('The date and time of the appointment.'),
  }),
  outputSchema: z.boolean(),
  async handler(input) {
    // TODO: Implement the actual booking creation logic here.
    // This is a placeholder implementation that always returns true.
    console.log(
      `Creating booking for ${input.patientName} with ${input.therapistName} at ${input.dateTime}`
    );
    return true;
  },
});

export async function confirmBookingDetails(
  input: ConfirmBookingDetailsInput
): Promise<ConfirmBookingDetailsOutput> {
  return confirmBookingDetailsFlow(input);
}

const confirmBookingDetailsPrompt = ai.definePrompt({
  name: 'confirmBookingDetailsPrompt',
  input: {schema: ConfirmBookingDetailsInputSchema},
  output: {schema: ConfirmBookingDetailsOutputSchema},
  tools: [createBooking],
  prompt: `You are an AI assistant confirming booking details for a therapy session.

  Patient Name: {{{patientName}}}
  Therapist Name: {{{therapistName}}}
  Date and Time: {{{dateTime}}}

  First, confirm these details to the user.
  Then, use the createBooking tool to book the appointment.
  Finally, generate a confirmation message for the user, and a boolean for whether the booking was successful.
  `,
});

const confirmBookingDetailsFlow = ai.defineFlow(
  {
    name: 'confirmBookingDetailsFlow',
    inputSchema: ConfirmBookingDetailsInputSchema,
    outputSchema: ConfirmBookingDetailsOutputSchema,
  },
  async input => {
    const {output} = await confirmBookingDetailsPrompt(input);
    return output!;
  }
);
