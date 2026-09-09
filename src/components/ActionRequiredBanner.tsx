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
      <div className="bg-slate-900/40 border border-emerald-500/20 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>All schedules and metabolic windows are in balance. Zero pending activity debt.</span>
        </div>
        <span className="text-[11px] font-semibold text-emerald-400/80 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          In Equilibrium
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
    <div className="bg-gradient-to-r from-rose-950/80 via-amber-950/40 to-slate-900 border border-rose-500/40 rounded-xl p-4 shadow-xl shadow-rose-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0 mt-0.5 sm:mt-0">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-white tracking-wide">
              Action Required: {unresolvedDebts.length} Missed Event{unresolvedDebts.length > 1 ? 's' : ''} Detected
            </h3>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Deficit Engine Active
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            {unresolvedDebts.map((d, i) => {
              const blk = blocks.find((b) => b.id === d.source_block_id);
              const label = blk ? blk.title : `${d.category} block`;
              const unit = d.category === 'nutrition' ? 'kcal' : 'm';
              return (
                <span key={d.id}>
                  {i > 0 && <span className="text-slate-500"> • </span>}
                  <strong className="text-amber-300 font-semibold">{label}</strong> (-{d.deficit_amount} {unit})
                </span>
              );
            })}
          </p>
        </div>
      </div>

      <button
        onClick={handleResolve}
        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 shrink-0"
      >
        <Sparkles className="w-4 h-4 text-slate-950 stroke-[2.5]" />
        <span>Resolve with Rebalance Engine</span>
        <ArrowRight className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
      </button>
    </div>
  );
};
