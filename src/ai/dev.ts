import { config } from 'dotenv';
config();

import '@/ai/flows/patient-initiates-booking.ts';
import '@/ai/flows/check-therapist-availability.ts';
import '@/ai/flows/confirm-booking-details.ts';
import '@/ai/flows/summarize-chat-for-therapist.ts';
import '@/ai/flows/present-available-slots.ts';