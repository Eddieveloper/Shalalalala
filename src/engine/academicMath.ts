import { format } from 'date-fns';
import { Profile, ScheduleBlock } from '../types/database';
import { RecoveryStrategy } from '../types/rebalance';
import { findFreeCalendarSlots } from './calendarMath';

export interface AcademicStrategyInput {
  missedBlock: ScheduleBlock;
  upcomingStudyBlocksInWeek: ScheduleBlock[];
  allCalendarBlocks: ScheduleBlock[];
  profile?: Profile;
  currentDate?: Date;
  debtId?: string;
}

/**
 * Calculates academic recovery strategies for missed study blocks.
 */
export function calculateAcademicStrategies(input: AcademicStrategyInput): RecoveryStrategy[] {
  const {
    missedBlock,
    upcomingStudyBlocksInWeek,
    allCalendarBlocks,
    profile,
    currentDate = new Date(),
    debtId,
  } = input;

  const missedMinutes = Math.max(0, missedBlock.target_value - (missedBlock.actual_value || 0));
  if (missedMinutes <= 0) return [];

  const strategies: RecoveryStrategy[] = [];

  // Strategy 1: Spread across upcoming study blocks (capped at +30m per session)
  if (upcomingStudyBlocksInWeek.length > 0) {
    const sessionCap = 30;
    const rawPerSession = Math.ceil(missedMinutes / upcomingStudyBlocksInWeek.length);
    const addedMinutes = Math.min(sessionCap, rawPerSession);
    const totalAbsorbed = addedMinutes * upcomingStudyBlocksInWeek.length;
    const unabsorbed = Math.max(0, missedMinutes - totalAbsorbed);

    const distributions = upcomingStudyBlocksInWeek.map((target) => {
      const originalEnd = new Date(target.end_time);
      const newEnd = new Date(originalEnd.getTime() + addedMinutes * 60 * 1000);
      return {
        targetBlockId: target.id,
        targetBlockTitle: target.title,
        addedMinutes,
        newTargetMinutes: target.target_value + addedMinutes,
        newEndTime: newEnd.toISOString(),
      };
    });

    strategies.push({
      id: `strat-acad-spread-${missedBlock.id}`,
      title: 'Spread Over Upcoming Sessions',
      badge: `+${addedMinutes}m / session (Capped)`,
      description: `Amortize ${Math.min(missedMinutes, totalAbsorbed)} mins equally across ${upcomingStudyBlocksInWeek.length} scheduled study block${upcomingStudyBlocksInWeek.length > 1 ? 's' : ''} this week (${upcomingStudyBlocksInWeek.map((b) => b.title).join(', ')}).${unabsorbed > 0 ? ` (Remaining ${unabsorbed}m forgiven to avoid burnout).` : ''}`,
      impact: `Capped at max +30m/day to prevent cognitive fatigue and protect sleep schedule.`,
      actionType: 'spread_academic',
      payload: {
        debtId,
        blockId: missedBlock.id,
        deficit: missedMinutes,
        category: 'academic',
        spreadDistributions: distributions,
        unabsorbedMinutes: unabsorbed,
      },
    });
  } else {
    // If no upcoming blocks are already on the calendar, offer spreading into tomorrow morning/afternoon
    strategies.push({
      id: `strat-acad-spread-fallback-${missedBlock.id}`,
      title: 'Extend Tomorrow Study Schedule',
      badge: `+${Math.min(30, missedMinutes)}m buffer`,
      description: `No existing study blocks found later this week for this subject. Allocate an extra 30-minute block tomorrow evening.`,
      impact: 'Quickly halts deficit progression before semester deadlines compound.',
      actionType: 'spread_academic',
      payload: {
        debtId,
        blockId: missedBlock.id,
        deficit: missedMinutes,
        category: 'academic',
      },
    });
  }

  // Strategy 2: Weekend Buffer Block
  // Find an open slot on Saturday/Sunday or free evening
  const freeSlots = findFreeCalendarSlots({
    existingBlocks: allCalendarBlocks,
    durationMinutes: missedMinutes,
    startDate: currentDate,
    daysToScan: 7,
    sleepStartStr: profile?.sleep_start_time || '23:00',
    sleepEndStr: profile?.sleep_end_time || '07:00',
    preferWeekend: true,
  });

  const optimalSlot = freeSlots[0];
  const slotDateStr = optimalSlot ? format(optimalSlot.start, 'EEE, MMM d @ HH:mm') : 'Saturday 10:00 AM';

  strategies.push({
    id: `strat-acad-buffer-${missedBlock.id}`,
    title: 'Schedule Weekend / Evening Buffer Block',
    badge: `${missedMinutes}m Focus Slot`,
    description: `Auto-schedule a standalone ${missedMinutes}-minute deep work buffer on ${slotDateStr}. Protected against your sleep window (${profile?.sleep_start_time || '23:00'} - ${profile?.sleep_end_time || '07:00'}).`,
    impact: 'Clears 100% of study debt in a single contiguous session without touching weekday evenings.',
    actionType: 'weekend_buffer',
    payload: {
      debtId,
      blockId: missedBlock.id,
      deficit: missedMinutes,
      category: 'academic',
      bufferSlot: optimalSlot
        ? {
            date: format(optimalSlot.start, 'yyyy-MM-dd'),
            startTime: optimalSlot.start.toISOString(),
            endTime: optimalSlot.end.toISOString(),
            durationMinutes: missedMinutes,
            title: `${missedBlock.title} [Recovery Block]`,
          }
        : {
            date: format(new Date(), 'yyyy-MM-dd'),
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + missedMinutes * 60000).toISOString(),
            durationMinutes: missedMinutes,
            title: `${missedBlock.title} [Recovery Block]`,
          },
    },
  });

  // Strategy 3: Forgive Debt
  strategies.push({
    id: `strat-acad-forgive-${missedBlock.id}`,
    title: 'Forgive Deficit (Protect Mental Well-Being)',
    badge: 'Write Off Debt',
    description: `Acknowledge that life happens. Mark this ${missedMinutes}m study deficit as forgiven without shifting workload or increasing future pressure.`,
    impact: 'Prevents the toxic "debt snowball" trap. Keeps your upcoming calendar realistic and stress-free.',
    actionType: 'forgive_academic',
    payload: {
      debtId,
      blockId: missedBlock.id,
      deficit: missedMinutes,
      category: 'academic',
    },
  });

  return strategies;
}

/**
 * Calculates fitness recovery strategies for missed workout blocks.
 */
export function calculateFitnessStrategies(params: {
  missedBlock: ScheduleBlock;
  allCalendarBlocks: ScheduleBlock[];
  profile?: Profile;
  currentDate?: Date;
  debtId?: string;
}): RecoveryStrategy[] {
  const { missedBlock, allCalendarBlocks, profile, currentDate = new Date(), debtId } = params;
  const missedMinutes = Math.max(0, missedBlock.target_value - (missedBlock.actual_value || 0));

  const freeSlots = findFreeCalendarSlots({
    existingBlocks: allCalendarBlocks,
    durationMinutes: missedMinutes,
    startDate: currentDate,
    daysToScan: 7,
    sleepStartStr: profile?.sleep_start_time || '23:00',
    sleepEndStr: profile?.sleep_end_time || '07:00',
    preferWeekend: true,
  });

  const optimalSlot = freeSlots[0];
  const slotDateStr = optimalSlot ? format(optimalSlot.start, 'EEE, MMM d @ HH:mm') : 'Tomorrow 07:30 AM';

  return [
    {
      id: `strat-fit-reschedule-${missedBlock.id}`,
      title: 'Reschedule to Next Open Active Slot',
      badge: `${missedMinutes}m Workout Slot`,
      description: `Move this workout session to ${slotDateStr} during an open recovery slot without conflicting with lectures or rest.`,
      impact: 'Preserves your weekly physical conditioning volume without overtraining.',
      actionType: 'fitness_reschedule',
      payload: {
        debtId,
        blockId: missedBlock.id,
        deficit: missedMinutes,
        category: 'fitness',
        fitnessRescheduleSlot: optimalSlot
          ? {
              date: format(optimalSlot.start, 'yyyy-MM-dd'),
              startTime: optimalSlot.start.toISOString(),
              endTime: optimalSlot.end.toISOString(),
              durationMinutes: missedMinutes,
              title: `${missedBlock.title} [Rescheduled]`,
            }
          : undefined,
      },
    },
    {
      id: `strat-fit-split-${missedBlock.id}`,
      title: 'Split Volume (+15m onto next 2 sessions)',
      badge: '+15m / next 2 sessions',
      description: `Add a 15-minute high-density superset or cardio finisher to your next two scheduled workouts.`,
      impact: 'Recovers training volume incrementally without needing a separate gym visit.',
      actionType: 'fitness_split',
      payload: {
        debtId,
        blockId: missedBlock.id,
        deficit: missedMinutes,
        category: 'fitness',
      },
    },
    {
      id: `strat-fit-forgive-${missedBlock.id}`,
      title: 'Forgive & Count as Deload / Recovery Day',
      badge: 'Deload & Rest',
      description: `Treat this missed session as an intentional biological deload day for joint recovery and central nervous system recharge.`,
      impact: 'Lowers injury risk and resets mental fatigue.',
      actionType: 'forgive_fitness',
      payload: {
        debtId,
        blockId: missedBlock.id,
        deficit: missedMinutes,
        category: 'fitness',
      },
    },
  ];
}
