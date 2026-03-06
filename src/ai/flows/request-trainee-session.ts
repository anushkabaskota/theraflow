'use server';

/**
 * @fileOverview Requests a booking session with a Trainee Therapist and saves it as pending.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { createAppointment } from '@/lib/firestore';

const RequestTraineeSessionInputSchema = z.object({
    patientId: z.string().describe('The ID of the patient.'),
    patientName: z.string().describe('The name of the patient.'),
    therapistId: z.string().describe('The ID of the therapist.'),
    therapistName: z.string().describe('The name of the therapist.'),
    dateTime: z.string().describe('The date and time of the appointment.'),
});
export type RequestTraineeSessionInput = z.infer<typeof RequestTraineeSessionInputSchema>;

const RequestTraineeSessionOutputSchema = z.object({
    confirmationMessage: z.string().describe('A message explaining that the request was sent to the therapist and is pending approval.'),
    bookingSuccessful: z.boolean().describe('Whether the request was successfully sent.'),
});
export type RequestTraineeSessionOutput = z.infer<typeof RequestTraineeSessionOutputSchema>;

const requestBooking = ai.defineTool({
    name: 'requestBooking',
    description: 'Creates a pending session request in the system for a patient with a trainee therapist.',
    inputSchema: z.object({
        patientId: z.string().describe('The ID of the patient.'),
        patientName: z.string().describe('The name of the patient.'),
        therapistId: z.string().describe('The ID of the therapist.'),
        therapistName: z.string().describe('The name of the therapist.'),
        dateTime: z.string().describe('The date and time of the appointment in ISO format.'),
    }),
    outputSchema: z.boolean(),
}, async (input) => {
    try {
        const startTime = new Date(input.dateTime);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

        await createAppointment({
            patientId: input.patientId,
            patientName: input.patientName,
            therapistId: input.therapistId,
            therapistName: input.therapistName,
            startTime,
            endTime,
            status: 'pending',
        });
        console.log(
            `Pending request created for ${input.patientName} with ${input.therapistName} at ${input.dateTime}`
        );
        return true;
    } catch (e) {
        console.error('Error creating request:', e);
        return false;
    }
});

export async function requestTraineeSession(
    input: RequestTraineeSessionInput
): Promise<RequestTraineeSessionOutput> {
    return requestTraineeSessionFlow(input);
}

const requestTraineeSessionPrompt = ai.definePrompt({
    name: 'requestTraineeSessionPrompt',
    input: { schema: RequestTraineeSessionInputSchema },
    output: { schema: RequestTraineeSessionOutputSchema },
    tools: [requestBooking],
    prompt: `You are an AI assistant helping a user request a therapy session with a Trainee Therapist.

  Patient Name: {{{patientName}}}
  Therapist Name: {{{therapistName}}}
  Date and Time: {{{dateTime}}}

  First, use the requestBooking tool to log the pending request.
  Then, generate a confirmation message for the user that explicitly states that their request has been sent to {{{therapistName}}} for review, and that it is currently pending approval. Let them know they will be notified once the therapist accepts or declines the session.
  Make sure to pass all the input fields to the tool.
  If the booking tool fails, inform the user that there was an error and to try again.
  `,
});

const requestTraineeSessionFlow = ai.defineFlow(
    {
        name: 'requestTraineeSessionFlow',
        inputSchema: RequestTraineeSessionInputSchema,
        outputSchema: RequestTraineeSessionOutputSchema,
    },
    async input => {
        const { output } = await requestTraineeSessionPrompt(input);
        return output!;
    }
);
