import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle, ShieldAlert, Sparkles, Zap } from 'lucide-react';
import { useActivityDebts, useScheduleBlocks } from '../hooks/useSchedule';
import { useRebalanceStore } from '../store/useRebalanceStore';
import { calculateAcademicStrategies, calculateFitnessStrategies } from '../engine/academicMath';
import { calculateNutritionStrategies } from '../engine/nutritionMath';
import { format } from 'date-fns';
import { NutritionLog, ScheduleBlock } from '../types/database';

export const ActionRequiredBanner: React.FC = () => {
  const { data: debts = [] } = useActivityDebts();
  const { data: blocks = [] } = useScheduleBlocks();
  const unresolvedDebts = debts.filter((d) => d.status === 'unresolved');

  const openRecoveryModal = useRebalanceStore((s) => s.openRecoveryModal);
  const activePrompt = useRebalanceStore((s) => s.activePrompt);
  const promptQueue = useRebalanceStore((s) => s.promptQueue);

  if (unresolvedDebts.length === 0 && !activePrompt && promptQueue.length === 0) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[22px] border border-[#f3d7d4] bg-white/80 px-4 py-3 text-xs text-[#4d3a41] shadow-[0_12px_28px_rgba(194,126,122,0.08)]">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-[#fef0ef] p-1.5 text-[#d96461]">
            <CheckCircle className="h-4 w-4" />
          </div>
          <span>All schedules and metabolic windows are in balance. Zero pending activity debt.</span>
        </div>
        <span className="rounded-full border border-[#f5c4bf] bg-[#fff0ee] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#c75d5f]">
          In equilibrium
        </span>
      </div>
    );
  }

  // Handle clicking "Resolve" on the banner
  const handleResolve = () => {
    // If there is an active prompt already in Zustand, open modal
    if (activePrompt) {
      openRecoveryModal(activePrompt);
      return;
    }

    // Otherwise construct prompt from first unresolved debt
    const firstDebt = unresolvedDebts[0];
    if (!firstDebt) return;

    const linkedBlock = blocks.find((b) => b.id === firstDebt.source_block_id);
    const title = linkedBlock?.title || `${firstDebt.category.toUpperCase()} Deficit`;

    let strategies = [];
    if (firstDebt.category === 'academic') {
      const mockBlock: ScheduleBlock = linkedBlock || {
        id: firstDebt.source_block_id || 'debt-block',
        user_id: firstDebt.user_id,
        activity_id: null,
        title,
        category: 'academic',
        start_time: firstDebt.created_at,
        end_time: firstDebt.created_at,
        target_value: firstDebt.deficit_amount,
        actual_value: 0,
        status: 'missed',
        is_buffer: false,
        reschedule_metadata: {},
        created_at: firstDebt.created_at,
      };
      const upcoming = blocks.filter((b) => b.category === 'academic' && b.status === 'scheduled');
      strategies = calculateAcademicStrategies({
        missedBlock: mockBlock,
        upcomingStudyBlocksInWeek: upcoming,
        allCalendarBlocks: blocks,
        debtId: firstDebt.id,
      });
    } else if (firstDebt.category === 'nutrition') {
      const mockMeal: NutritionLog = {
        id: firstDebt.source_block_id || 'debt-meal',
        user_id: firstDebt.user_id,
        date: format(new Date(), 'yyyy-MM-dd'),
        meal_type: 'lunch',
        target_calories: firstDebt.deficit_amount,
        actual_calories: 0,
        status: 'skipped',
        window_start: '12:00',
        window_end: '13:00',
      };
      strategies = calculateNutritionStrategies({
        missedMeal: mockMeal,
        remainingMealsToday: [],
        debtId: firstDebt.id,
      });
    } else {
      const mockBlock: ScheduleBlock = linkedBlock || {
        id: firstDebt.source_block_id || 'debt-fit',
        user_id: firstDebt.user_id,
        activity_id: null,
        title,
        category: 'fitness',
        start_time: firstDebt.created_at,
        end_time: firstDebt.created_at,
        target_value: firstDebt.deficit_amount,
        actual_value: 0,
        status: 'missed',
        is_buffer: false,
        reschedule_metadata: {},
        created_at: firstDebt.created_at,
      };
      strategies = calculateFitnessStrategies({
        missedBlock: mockBlock,
        allCalendarBlocks: blocks,
        debtId: firstDebt.id,
      });
    }

    openRecoveryModal({
      id: `prompt-resolve-${firstDebt.id}`,
      debtId: firstDebt.id,
      sourceBlockId: firstDebt.source_block_id,
      title,
      category: firstDebt.category,
      deficitAmount: firstDebt.deficit_amount,
      unit: firstDebt.category === 'nutrition' ? 'kcal' : 'min',
      missedTimeDisplay: 'Earlier today',
      strategies,
      rawBlock: linkedBlock,
    });
  };

  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-[26px] border border-[#f3d7d4] bg-gradient-to-r from-[#fffaf8] via-[#fff5f4] to-[#fff0ef] p-4 shadow-[0_16px_30px_rgba(208,127,125,0.08)] sm:flex-row sm:items-center">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 rounded-2xl border border-[#f7c0bb] bg-[#fff1ef] p-2 text-[#d35d59]">
          <ShieldAlert className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-[#341d23]">
              Action required: {unresolvedDebts.length} missed event{unresolvedDebts.length > 1 ? 's' : ''} detected
            </h3>
            <span className="rounded-full border border-[#f6bfbb] bg-[#fff0ee] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#c65d5e]">
              deficit engine active
            </span>
          </div>
          <p className="mt-1 text-xs text-[#725b62]">
            {unresolvedDebts.map((d, i) => {
              const blk = blocks.find((b) => b.id === d.source_block_id);
              const label = blk ? blk.title : `${d.category} block`;
              const unit = d.category === 'nutrition' ? 'kcal' : 'm';
              return (
                <span key={d.id}>
                  {i > 0 && <span className="text-[#bca5aa]"> • </span>}
                  <strong className="font-semibold text-[#d66760]">{label}</strong> (-{d.deficit_amount} {unit})
                </span>
              );
            })}
          </p>
        </div>
      </div>

      <button
        onClick={handleResolve}
        className="flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f78f94] via-[#f16d6d] to-[#e78f7a] px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.15em] text-white shadow-[0_12px_26px_rgba(245,105,104,0.25)] transition hover:translate-y-[-1px] sm:w-auto"
      >
        <Sparkles className="h-4 w-4 text-white" />
        <span>Resolve with journal engine</span>
        <ArrowRight className="h-3.5 w-3.5 text-white" />
      </button>
    </div>
  );
};
