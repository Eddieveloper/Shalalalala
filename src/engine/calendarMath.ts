import { addDays, format, isAfter, isBefore, parse, setHours, setMinutes } from 'date-fns';
import { FreeSlot } from '../types/rebalance';
import { ScheduleBlock } from '../types/database';

/**
 * Checks whether two time intervals overlap.
 */
export function doIntervalsOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return isBefore(startA, endB) && isAfter(endA, startB);
}

/**
 * Parses an 'HH:mm' time string into a Date object on a given reference date.
 */
export function timeStringToDate(timeStr: string, referenceDate: Date): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const result = new Date(referenceDate);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Normalizes sleep window bounds for a given calendar date.
 * If sleep starts at 23:00 and ends at 07:00, sleep window spans:
 * 1) 00:00 to 07:00 of the target day
 * 2) 23:00 to 23:59 of the target day
 */
export function getDailySleepWindows(
  date: Date,
  sleepStartStr: string = '23:00',
  sleepEndStr: string = '07:00'
): { start: Date; end: Date }[] {
  const sleepWindows: { start: Date; end: Date }[] = [];

  const morningSleepStart = new Date(date);
  morningSleepStart.setHours(0, 0, 0, 0);
  const morningSleepEnd = timeStringToDate(sleepEndStr, date);

  sleepWindows.push({ start: morningSleepStart, end: morningSleepEnd });

  const eveningSleepStart = timeStringToDate(sleepStartStr, date);
  const eveningSleepEnd = new Date(date);
  eveningSleepEnd.setHours(23, 59, 59, 999);

  sleepWindows.push({ start: eveningSleepStart, end: eveningSleepEnd });

  return sleepWindows;
}

/**
 * Finds free continuous slots in the calendar for scheduling recovery blocks.
 * Filters out sleep hours and conflicting scheduled blocks.
 */
export function findFreeCalendarSlots(params: {
  existingBlocks: ScheduleBlock[];
  durationMinutes: number;
  startDate?: Date;
  daysToScan?: number;
  sleepStartStr?: string;
  sleepEndStr?: string;
  preferWeekend?: boolean;
  preferEvening?: boolean;
}): FreeSlot[] {
  const {
    existingBlocks,
    durationMinutes,
    startDate = new Date(),
    daysToScan = 7,
    sleepStartStr = '23:00',
    sleepEndStr = '07:00',
    preferWeekend = true,
    preferEvening = false,
  } = params;

  const foundSlots: FreeSlot[] = [];
  const minBufferMinutes = 15; // 15-min buffer between activities

  for (let i = 0; i < daysToScan; i++) {
    const currentDay = addDays(startDate, i);
    const dayOfWeek = currentDay.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Daily active window from sleep_end to sleep_start
    const dayWakeTime = timeStringToDate(sleepEndStr, currentDay);
    const daySleepTime = timeStringToDate(sleepStartStr, currentDay);

    // If scanning today, do not propose slots in the past
    const earliestStart = i === 0 && isAfter(new Date(), dayWakeTime)
      ? new Date(Math.ceil(new Date().getTime() / (15 * 60 * 1000)) * (15 * 60 * 1000))
      : dayWakeTime;

    if (isAfter(earliestStart, daySleepTime)) {
      continue;
    }

    // Get all blocks on this day
    const dayBlocks = existingBlocks
      .filter((block) => {
        if (block.status === 'missed') return false; // missed blocks don't occupy future time
        const blockStart = new Date(block.start_time);
        const blockEnd = new Date(block.end_time);
        return format(blockStart, 'yyyy-MM-dd') === format(currentDay, 'yyyy-MM-dd');
      })
      .map((b) => ({
        start: new Date(b.start_time),
        end: new Date(b.end_time),
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    // Candidate scan intervals (15-min step)
    let candidateStart = new Date(earliestStart);

    while (true) {
      const candidateEnd = new Date(candidateStart.getTime() + durationMinutes * 60 * 1000);

      // Check if candidate exceeds bedtime
      if (isAfter(candidateEnd, daySleepTime)) {
        break;
      }

      // Check collision with any existing block
      const hasCollision = dayBlocks.some((b) =>
        doIntervalsOverlap(
          new Date(candidateStart.getTime() - minBufferMinutes * 60 * 1000),
          new Date(candidateEnd.getTime() + minBufferMinutes * 60 * 1000),
          b.start,
          b.end
        )
      );

      if (!hasCollision) {
        const hour = candidateStart.getHours();
        const isEvening = hour >= 17 && hour < 22;

        foundSlots.push({
          start: new Date(candidateStart),
          end: new Date(candidateEnd),
          durationMinutes,
          dateStr: format(candidateStart, 'yyyy-MM-dd'),
          isWeekend,
          isEvening,
        });

        // Step by at least the duration or 60 min to avoid near-duplicate slots
        candidateStart = new Date(candidateStart.getTime() + Math.max(45, durationMinutes) * 60 * 1000);
      } else {
        // Step forward 15 minutes
        candidateStart = new Date(candidateStart.getTime() + 15 * 60 * 1000);
      }
    }
  }

  // Sort slots by preference
  return foundSlots.sort((a, b) => {
    if (preferWeekend && a.isWeekend !== b.isWeekend) {
      return a.isWeekend ? -1 : 1;
    }
    if (preferEvening && a.isEvening !== b.isEvening) {
      return a.isEvening ? -1 : 1;
    }
    return a.start.getTime() - b.start.getTime();
  });
}
