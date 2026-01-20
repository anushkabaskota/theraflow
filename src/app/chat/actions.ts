'use server';

import { initiateBooking } from '@/ai/flows/patient-initiates-booking';
import { checkTherapistAvailability } from '@/ai/flows/check-therapist-availability';
import { presentAvailableSlots } from '@/ai/flows/present-available-slots';
import { confirmBookingDetails } from '@/ai/flows/confirm-booking-details';
import { parse, addDays, nextSunday, formatISO } from 'date-fns';

async function simpleDateParser(text: string): Promise<{ startDate: string; endDate: string }> {
  const now = new Date();
  const lowerText = text.toLowerCase();

  if (lowerText.includes('today')) {
    return { startDate: formatISO(now), endDate: formatISO(now) };
  }
  if (lowerText.includes('tomorrow')) {
    const tomorrow = addDays(now, 1);
    return { startDate: formatISO(tomorrow), endDate: formatISO(tomorrow) };
  }
  if (lowerText.includes('this week')) {
    const endOfWeek = nextSunday(now);
    return { startDate: formatISO(now), endDate: formatISO(endOfWeek) };
  }
  if (lowerText.includes('next week')) {
    const startOfNextWeek = nextSunday(now);
    const endOfNextWeek = nextSunday(startOfNextWeek);
    return { startDate: formatISO(startOfNextWeek), endDate: formatISO(endOfNextWeek) };
  }

  try {
    const parsedDate = parse(text, 'MMMM do', new Date());
    if (!isNaN(parsedDate.getTime())) {
      return { startDate: formatISO(parsedDate), endDate: formatISO(parsedDate) };
    }
  } catch (e) {
    // Ignore parsing errors and fall through
  }
  
  // Fallback to next 7 days
  return { startDate: formatISO(now), endDate: formatISO(addDays(now, 7)) };
}

export async function startBooking(): Promise<string> {
  return initiateBooking({});
}

export async function findSlots(
  userInput: string
): Promise<{ formattedSlots: string; availableSlots: string[] }> {
  const { startDate, endDate } = await simpleDateParser(userInput);
  const therapistId = 'therapist_default_id'; // In a real app, this would be dynamic

  const availability = await checkTherapistAvailability({
    therapistId,
    startDate,
    endDate,
  });

  if (availability.availableSlots.length === 0) {
    return {
      formattedSlots: "I'm sorry, I couldn't find any available slots for that period. Would you like to try another date range?",
      availableSlots: [],
    };
  }

  const presentation = await presentAvailableSlots({
    availableSlots: availability.availableSlots.map(slot => ({ start: slot, end: slot }))
  });

  return {
    formattedSlots: presentation.formattedSlots,
    availableSlots: availability.availableSlots,
  };
}


export async function bookSlot(
  dateTime: string,
  patientId: string,
  patientName: string,
  therapistId: string,
  therapistName: string
): Promise<{ confirmationMessage: string; bookingSuccessful: boolean }> {
  
  const bookingResult = await confirmBookingDetails({
    patientId,
    patientName,
    therapistId,
    therapistName,
    dateTime,
  });

  return bookingResult;
}
