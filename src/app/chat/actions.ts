'use server';

import { initiateBooking } from '@/ai/flows/patient-initiates-booking';
import { checkTherapistAvailability } from '@/ai/flows/check-therapist-availability';
import { confirmBookingDetails } from '@/ai/flows/confirm-booking-details';
import { requestTraineeSession } from '@/ai/flows/request-trainee-session';

export async function startBooking(): Promise<string> {
  try {
    return await initiateBooking({});
  } catch (error: any) {
    console.error("Error starting booking:", error);
    if (error.message?.includes('429') || error.message?.includes('Quota exceeded') || String(error).includes('429')) {
      return "Hello! I'm currently experiencing high traffic (rate limit exceeded). Please wait a few seconds and try sending a message.";
    }
    return "Hello! I'm here to help you book a session. When would you like to schedule it?";
  }
}

export async function findSlots(
  userInput: string,
  therapistId: string = 'therapist_default_id'
): Promise<{ formattedSlots: string; availableSlots: string[] }> {

  const currentDateTime = new Date().toISOString();

  try {
    const result = await checkTherapistAvailability({
      therapistId,
      userInput,
      currentDateTime,
    });

    return result;
  } catch (error: any) {
    console.error("Error finding slots using AI:", error);

    let errorMessage = "I'm sorry, I encountered an error checking the schedule. Please try asking again or select a different time.";

    if (error.message?.includes('429') || error.message?.includes('Quota exceeded') || String(error).includes('429')) {
      errorMessage = "I'm sorry, I am currently experiencing high traffic and hit a rate limit. Please wait 10 seconds and try your request again.";
    }

    return {
      formattedSlots: errorMessage,
      availableSlots: [],
    };
  }
}


export async function bookSlot(
  dateTime: string,
  patientId: string,
  patientName: string,
  therapistId: string,
  therapistName: string,
  isTrainee: boolean = false
): Promise<{ confirmationMessage: string; bookingSuccessful: boolean }> {

  if (isTrainee) {
    return await requestTraineeSession({
      patientId,
      patientName,
      therapistId,
      therapistName,
      dateTime,
    });
  }

  const bookingResult = await confirmBookingDetails({
    patientId,
    patientName,
    therapistId,
    therapistName,
    dateTime,
  });

  return bookingResult;
}
