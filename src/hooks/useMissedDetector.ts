import { useEffect, useRef } from 'react';
import { addMinutes, format, isAfter, parseISO } from 'date-fns';
import { useRebalanceStore } from '../store/useRebalanceStore';
import { useActivityDebts, useNutritionLogs, useProfile, useScheduleBlocks } from './useSchedule';
import { calculateAcademicStrategies, calculateFitnessStrategies } from '../engine/academicMath';
import { calculateNutritionStrategies } from '../engine/nutritionMath';
import { PendingRecoveryPrompt, RecoveryStrategy } from '../types/rebalance';
import { ScheduleBlock, NutritionLog } from '../types/database';

export function useMissedDetector() {
  const { data: blocks = [] } = useScheduleBlocks();
  const { data: meals = [] } = useNutritionLogs();
  const { data: debts = [] } = useActivityDebts();
  const { data: profile } = useProfile();

  const { updateBlock } = useScheduleBlocks();
  const { updateMeal } = useNutritionLogs();
  const { createDebt } = useActivityDebts();

  const enqueuePrompt = useRebalanceStore((s) => s.enqueuePrompt);
  const promptQueue = useRebalanceStore((s) => s.promptQueue);
  const activePrompt = useRebalanceStore((s) => s.activePrompt);

  const processingRef = useRef(false);

  const checkMissedEvents = async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');

      // 1. Check Schedule Blocks:
      // If current time > block.end_time + 15 minutes AND block.status === 'scheduled'
      for (const block of blocks) {
        if (block.status === 'scheduled') {
          const blockEnd = parseISO(block.end_time);
          const gracePeriodEnd = addMinutes(blockEnd, 15);

          if (isAfter(now, gracePeriodEnd)) {
            // A. Mark block status as 'missed'
            await updateBlock({
              id: block.id,
              updates: { status: 'missed' },
            });

            // B. Calculate deficit
            const deficit = Math.max(0, block.target_value - (block.actual_value || 0));
            const debtCategory = block.category === 'meal' ? 'nutrition' : block.category;

            // C. Insert activity_debts record
            const newDebt = await createDebt({
              user_id: block.user_id,
              source_block_id: block.id,
              category: debtCategory,
              deficit_amount: deficit,
              status: 'unresolved',
              resolved_at: null,
            });

            // D. Generate strategies based on category
            let strategies: RecoveryStrategy[] = [];
            if (block.category === 'academic') {
              const upcomingStudyBlocks = blocks.filter(
                (b) =>
                  b.id !== block.id &&
                  b.category === 'academic' &&
                  b.status === 'scheduled' &&
                  isAfter(parseISO(b.start_time), now)
              );

              strategies = calculateAcademicStrategies({
                missedBlock: block,
                upcomingStudyBlocksInWeek: upcomingStudyBlocks,
                allCalendarBlocks: blocks,
                profile,
                currentDate: now,
                debtId: newDebt.id,
              });
            } else if (block.category === 'fitness') {
              strategies = calculateFitnessStrategies({
                missedBlock: block,
                allCalendarBlocks: blocks,
                profile,
                currentDate: now,
                debtId: newDebt.id,
              });
            } else if (block.category === 'meal') {
              const remainingMeals = meals.filter(
                (m) => m.date === todayStr && m.status === 'pending'
              );
              const fakeMealLog: NutritionLog = {
                id: block.id,
                user_id: block.user_id,
                date: todayStr,
                meal_type: 'lunch',
                target_calories: block.target_value,
                actual_calories: block.actual_value,
                status: 'skipped',
                window_start: format(parseISO(block.start_time), 'HH:mm'),
                window_end: format(parseISO(block.end_time), 'HH:mm'),
              };
              strategies = calculateNutritionStrategies({
                missedMeal: fakeMealLog,
                remainingMealsToday: remainingMeals,
                currentDate: todayStr,
                debtId: newDebt.id,
              });
            }

            // E. Push interactive recovery prompt to global Zustand store
            const prompt: PendingRecoveryPrompt = {
              id: `prompt-${block.id}-${Date.now()}`,
              debtId: newDebt.id,
              sourceBlockId: block.id,
              title: block.title,
              category: debtCategory,
              deficitAmount: deficit,
              unit: block.category === 'meal' ? 'kcal' : 'min',
              missedTimeDisplay: format(blockEnd, 'h:mm a'),
              strategies,
              rawBlock: block,
            };

            enqueuePrompt(prompt);
          }
        }
      }

      // 2. Also check unresolved debts from database that might not yet be in the UI prompt queue
      // This guarantees that any existing unresolved debt gets surfaced immediately on initial load!
      const unresolvedDebts = debts.filter((d) => d.status === 'unresolved');
      for (const debt of unresolvedDebts) {
        const isAlreadyQueued =
          activePrompt?.debtId === debt.id ||
          promptQueue.some((p) => p.debtId === debt.id);

        if (!isAlreadyQueued) {
          const linkedBlock = blocks.find((b) => b.id === debt.source_block_id);
          const blockTitle = linkedBlock?.title || `${debt.category.toUpperCase()} Session`;

          let strategies: RecoveryStrategy[] = [];
          if (debt.category === 'academic') {
            const mockBlock: ScheduleBlock = linkedBlock || {
              id: debt.source_block_id || 'synthetic-block',
              user_id: debt.user_id,
              activity_id: null,
              title: blockTitle,
              category: 'academic',
              start_time: debt.created_at,
              end_time: debt.created_at,
              target_value: debt.deficit_amount,
              actual_value: 0,
              status: 'missed',
              is_buffer: false,
              reschedule_metadata: {},
              created_at: debt.created_at,
            };

            const upcomingStudyBlocks = blocks.filter(
              (b) =>
                b.category === 'academic' &&
                b.status === 'scheduled' &&
                isAfter(parseISO(b.start_time), now)
            );

            strategies = calculateAcademicStrategies({
              missedBlock: mockBlock,
              upcomingStudyBlocksInWeek: upcomingStudyBlocks,
              allCalendarBlocks: blocks,
              profile,
              currentDate: now,
              debtId: debt.id,
            });
          } else if (debt.category === 'nutrition') {
            const remainingMeals = meals.filter(
              (m) => m.date === todayStr && m.status === 'pending'
            );
            const mockMeal: NutritionLog = {
              id: debt.source_block_id || 'synthetic-meal',
              user_id: debt.user_id,
              date: todayStr,
              meal_type: 'lunch',
              target_calories: debt.deficit_amount,
              actual_calories: 0,
              status: 'skipped',
              window_start: '12:00',
              window_end: '13:00',
            };

            strategies = calculateNutritionStrategies({
              missedMeal: mockMeal,
              remainingMealsToday: remainingMeals,
              currentDate: todayStr,
              debtId: debt.id,
            });
          } else if (debt.category === 'fitness') {
            const mockBlock: ScheduleBlock = linkedBlock || {
              id: debt.source_block_id || 'synthetic-fit',
              user_id: debt.user_id,
              activity_id: null,
              title: blockTitle,
              category: 'fitness',
              start_time: debt.created_at,
              end_time: debt.created_at,
              target_value: debt.deficit_amount,
              actual_value: 0,
              status: 'missed',
              is_buffer: false,
              reschedule_metadata: {},
              created_at: debt.created_at,
            };

            strategies = calculateFitnessStrategies({
              missedBlock: mockBlock,
              allCalendarBlocks: blocks,
              profile,
              currentDate: now,
              debtId: debt.id,
            });
          }

          if (strategies.length > 0) {
            enqueuePrompt({
              id: `prompt-debt-${debt.id}`,
              debtId: debt.id,
              sourceBlockId: debt.source_block_id,
              title: blockTitle,
              category: debt.category,
              deficitAmount: debt.deficit_amount,
              unit: debt.category === 'nutrition' ? 'kcal' : 'min',
              missedTimeDisplay: format(parseISO(debt.created_at), 'h:mm a'),
              strategies,
              rawBlock: linkedBlock,
            });
          }
        }
      }
    } catch (err) {
      console.error('Error in checkMissedEvents:', err);
    } finally {
      processingRef.current = false;
    }
  };

  // Run client-side timer every 60 seconds (also runs on mount)
  useEffect(() => {
    checkMissedEvents();
    const intervalId = setInterval(checkMissedEvents, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [blocks, meals, debts, profile]);

  return {
    triggerScan: checkMissedEvents,
  };
}
