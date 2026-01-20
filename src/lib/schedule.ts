import {
  addMinutes,
  isWithinInterval,
  parse,
  set,
  startOfDay,
  addDays,
  getDay,
  isBefore,
  isAfter,
} from 'date-fns';
import type { TherapistSchedule } from '@/types';

function parseTime(timeStr: string, date: Date): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return set(date, { hours, minutes, seconds: 0, milliseconds: 0 });
}

export function generateSlots(
  schedule: TherapistSchedule,
  startDate: Date,
  endDate: Date
): Date[] {
  const slots: Date[] = [];
  const {
    workingDays,
    workingHours,
    sessionDurationMinutes,
    mandatoryBreakMinutes,
    lunchBreak,
  } = schedule;

  if (!workingDays || workingDays.length === 0) {
    return [];
  }
  
  const totalSlotAndBreakTime = sessionDurationMinutes + mandatoryBreakMinutes;

  let currentDate = startOfDay(startDate);

  while (isBefore(currentDate, addDays(endDate, 1))) {
    if (workingDays.includes(getDay(currentDate))) {
      const workStartTime = parseTime(workingHours.start, currentDate);
      const workEndTime = parseTime(workingHours.end, currentDate);

      const lunchInterval =
        lunchBreak.enabled && lunchBreak.start && lunchBreak.end
          ? {
              start: parseTime(lunchBreak.start, currentDate),
              end: parseTime(lunchBreak.end, currentDate),
            }
          : null;

      let slotTime = workStartTime;

      while (isBefore(addMinutes(slotTime, sessionDurationMinutes), addMinutes(workEndTime, 1))) {
        const slotEndTime = addMinutes(slotTime, sessionDurationMinutes);

        const slotInterval = { start: slotTime, end: slotEndTime };

        let overlapsWithLunch = false;
        if (lunchInterval) {
          // Check if slot starts or ends during lunch, or if lunch is contained within the slot
          const startsDuringLunch = isAfter(slotInterval.start, lunchInterval.start) && isBefore(slotInterval.start, lunchInterval.end);
          const endsDuringLunch = isAfter(slotInterval.end, lunchInterval.start) && isBefore(slotInterval.end, lunchInterval.end);
          const containsLunch = isBefore(slotInterval.start, lunchInterval.start) && isAfter(slotInterval.end, lunchInterval.end);

          overlapsWithLunch = startsDuringLunch || endsDuringLunch || containsLunch;
        }

        if (!overlapsWithLunch) {
          slots.push(slotTime);
        }

        slotTime = addMinutes(slotTime, totalSlotAndBreakTime);
      }
    }
    currentDate = addDays(currentDate, 1);
  }

  return slots;
}
