'use server';

import { getAvailableSlots } from '@/lib/firestore';
import { createAppointment } from '@/lib/firestore';

export async function fetchAvailableSlots(
    therapistId: string,
    date: string
): Promise<string[]> {
    // Query a single day: startDate = endDate = the selected date
    const slots = await getAvailableSlots(therapistId, date, date);
    return slots.map((slot) => slot.toISOString());
}

export async function bookAppointment(
    patientId: string,
    patientName: string,
    therapistId: string,
    therapistName: string,
    slotISO: string,
    isTrainee: boolean
): Promise<{ success: boolean; message: string }> {
    try {
        const startTime = new Date(slotISO);
        // 1-hour sessions
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

        await createAppointment({
            patientId,
            patientName,
            therapistId,
            therapistName,
            startTime,
            endTime,
            status: isTrainee ? 'pending' : 'confirmed',
        });

        const dateStr = startTime.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const timeStr = startTime.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        });

        if (isTrainee) {
            return {
                success: true,
                message: `Your session request with ${therapistName} on ${dateStr} at ${timeStr} has been sent and is pending approval. You'll be notified once it's confirmed.`,
            };
        }

        return {
            success: true,
            message: `Your session with ${therapistName} on ${dateStr} at ${timeStr} has been confirmed!`,
        };
    } catch (error) {
        console.error('Error booking appointment:', error);
        return {
            success: false,
            message: 'Failed to book the appointment. Please try again.',
        };
    }
}
