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

  const stepMinutes = sessionDurationMinutes + mandatoryBreakMinutes;

  // Normalize both dates to midnight to prevent the loop from
  // iterating an extra day when endDate has a non-midnight time.
  let currentDate = startOfDay(startDate);
  const normalizedEndDate = startOfDay(endDate);

  while (isBefore(currentDate, addDays(normalizedEndDate, 1))) {
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

      // Generate slots, session must END by workEndTime (inclusive)
      while (!isAfter(addMinutes(slotTime, sessionDurationMinutes), workEndTime)) {
        const slotEndTime = addMinutes(slotTime, sessionDurationMinutes);

        let overlapsWithLunch = false;
        if (lunchInterval) {
          const startsDuringLunch = !isBefore(slotTime, lunchInterval.start) && isBefore(slotTime, lunchInterval.end);
          const endsDuringLunch = isAfter(slotEndTime, lunchInterval.start) && !isAfter(slotEndTime, lunchInterval.end);
          const containsLunch = isBefore(slotTime, lunchInterval.start) && isAfter(slotEndTime, lunchInterval.end);
          overlapsWithLunch = startsDuringLunch || endsDuringLunch || containsLunch;
        }

        if (overlapsWithLunch && lunchInterval) {
          // Jump to end of lunch break and restart the grid from there
          slotTime = lunchInterval.end;
        } else if (!overlapsWithLunch) {
          slots.push(slotTime);
          slotTime = addMinutes(slotTime, stepMinutes);
        } else {
          slotTime = addMinutes(slotTime, stepMinutes);
        }
      }
    }
    currentDate = addDays(currentDate, 1);
  }

  return slots;
}
