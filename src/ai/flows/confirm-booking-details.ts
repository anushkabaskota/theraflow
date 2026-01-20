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
import { createAppointment } from '@/lib/firestore';

const ConfirmBookingDetailsInputSchema = z.object({
  patientId: z.string().describe('The ID of the patient.'),
  patientName: z.string().describe('The name of the patient.'),
  therapistId: z.string().describe('The ID of the therapist.'),
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
  description: 'Creates a booking in the system for a patient with a therapist at a specific date and time.',
  inputSchema: z.object({
    patientId: z.string().describe('The ID of the patient.'),
    patientName: z.string().describe('The name of the patient.'),
    therapistId: z.string().describe('The ID of the therapist.'),
    therapistName: z.string().describe('The name of the therapist.'),
    dateTime: z.string().describe('The date and time of the appointment in ISO format.'),
  }),
  outputSchema: z.boolean(),
  async handler(input) {
    try {
        const startTime = new Date(input.dateTime);
        // Assume 1-hour sessions
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); 
        
        await createAppointment({
          patientId: input.patientId,
          patientName: input.patientName,
          therapistId: input.therapistId,
          therapistName: input.therapistName,
          startTime,
          endTime,
          status: 'confirmed',
        });
        console.log(
          `Booking created for ${input.patientName} with ${input.therapistName} at ${input.dateTime}`
        );
        return true;
    } catch(e) {
        console.error('Error creating booking:', e);
        return false;
    }
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
  Then, use the createBooking tool to book the appointment. You must pass all the input fields (patientId, patientName, therapistId, therapistName, dateTime) to the tool.
  Finally, generate a confirmation message for the user, and a boolean for whether the booking was successful.
  If the booking tool fails, inform the user that there was an error and to try again.
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
