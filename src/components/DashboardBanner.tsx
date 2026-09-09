import React from 'react';
import { BookOpen, CheckCircle2, Dumbbell, Flame, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { useProfile, useScheduleBlocks, useNutritionLogs, useActivityDebts } from '../hooks/useSchedule';
import { useRebalanceStore } from '../store/useRebalanceStore';

export const DashboardBanner: React.FC = () => {
  const selectedDate = useRebalanceStore((s) => s.selectedDate);
  const { data: profile } = useProfile();
  const { data: blocks = [] } = useScheduleBlocks(selectedDate);
  const { data: meals = [] } = useNutritionLogs(selectedDate);
  const { data: debts = [] } = useActivityDebts();

  // 1. Calorie Progress Calculations
  const targetCalories = profile?.daily_calorie_target ?? 2200;
  const consumedCalories = meals.reduce((acc, m) => acc + (m.actual_calories || 0), 0);
  const caloriePercent = Math.min(100, Math.round((consumedCalories / targetCalories) * 100));
  const calorieDeficit = Math.max(0, targetCalories - consumedCalories);

  // 2. Study Hours Logged vs Target
  const academicBlocks = blocks.filter((b) => b.category === 'academic');
  const studyTargetMins = academicBlocks.reduce((acc, b) => acc + b.target_value, 0);
  const studyLoggedMins = academicBlocks.reduce((acc, b) => acc + (b.actual_value || 0), 0);
  const studyTargetHours = (studyTargetMins / 60).toFixed(1);
  const studyLoggedHours = (studyLoggedMins / 60).toFixed(1);
  const studyPercent = studyTargetMins > 0 ? Math.min(100, Math.round((studyLoggedMins / studyTargetMins) * 100)) : 100;

  // 3. Workout Status Badge
  const fitnessBlocks = blocks.filter((b) => b.category === 'fitness');
  const fitnessCompleted = fitnessBlocks.filter((b) => b.status === 'completed').length;
  const fitnessTotal = fitnessBlocks.length;

  let workoutBadge = {
    label: 'Rest / Deload Day',
    color: 'bg-slate-800/80 text-slate-300 border-slate-700',
    icon: Dumbbell,
  };

  if (fitnessTotal > 0) {
    if (fitnessCompleted >= fitnessTotal) {
      workoutBadge = {
        label: `Workout Completed (${fitnessCompleted}/${fitnessTotal})`,
        color: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-emerald-950/50 shadow-md',
        icon: CheckCircle2,
      };
    } else {
      workoutBadge = {
        label: `Workout Scheduled (${fitnessCompleted}/${fitnessTotal})`,
        color: 'bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-amber-950/50 shadow-md',
        icon: Dumbbell,
      };
    }
  }

  const unresolvedDebts = debts.filter((d) => d.status === 'unresolved');

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-[#f5d9d6] bg-white/80 p-5 shadow-[0_18px_55px_rgba(196,146,146,0.10)] backdrop-blur-sm">
      <div className="pointer-events-none absolute -right-8 -top-10 h-56 w-56 rounded-full bg-[#ffd9d3]/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 left-1/4 h-52 w-52 rounded-full bg-[#ffe7e1]/80 blur-3xl" />

      <div className="relative z-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-[24px] border border-[#f4d5d1] bg-gradient-to-br from-[#fffaf8] to-[#fff0ee] p-4 text-[#402a31] shadow-[0_10px_25px_rgba(221,126,124,0.08)] transition hover:border-[#eaa8a1]">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-xl border border-[#f7c3bb] bg-[#ffece8] p-1.5 text-[#d9635d]">
                  <Flame className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9e6a72]">Nutrition velocity</span>
              </div>
              <span className="text-xs font-bold text-[#d9635d]">{caloriePercent}%</span>
            </div>

            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-[-0.06em] text-[#2e1c23]">{consumedCalories}</span>
              <span className="text-xs text-[#7d6169]">/ {targetCalories} kcal</span>
            </div>
            <p className="text-[11px] text-[#705b63]">
              {calorieDeficit > 0 ? (
                <span><strong className="text-[#d9635d]">{calorieDeficit} kcal</strong> remaining to target</span>
              ) : (
                <span className="font-semibold text-[#2d9f6b]">Daily metabolic target hit!</span>
              )}
            </p>
          </div>

          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full border border-[#f1d9d5] bg-[#fef4f2] p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#f5a6a3] via-[#f57f7d] to-[#e39f85] transition-all duration-500"
              style={{ width: `${caloriePercent}%` }}
            />
          </div>
        </div>

        <div className="rounded-[24px] border border-[#f2d4d0] bg-gradient-to-br from-[#fffaf8] to-[#fff1f7] p-4 text-[#402a31] shadow-[0_10px_25px_rgba(221,126,124,0.08)] transition hover:border-[#eaa8a1]">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-xl border border-[#f7c8d6] bg-[#fff0f6] p-1.5 text-[#d46397]">
                  <BookOpen className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9d7180]">Academic focus</span>
              </div>
              <span className="text-xs font-bold text-[#d46397]">{studyPercent}%</span>
            </div>

            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-[-0.06em] text-[#2e1c23]">{studyLoggedHours}h</span>
              <span className="text-xs text-[#7d6169]">/ {studyTargetHours}h target</span>
            </div>
            <p className="text-[11px] text-[#705b63]">
              {studyLoggedMins >= studyTargetMins && studyTargetMins > 0 ? (
                <span className="font-semibold text-[#2d9f6b]">Target achieved for tonight’s sprint.</span>
              ) : (
                <span>{Math.max(0, studyTargetMins - studyLoggedMins)} mins focus remaining today</span>
              )}
            </p>
          </div>

          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full border border-[#efd5e1] bg-[#fff5fa] p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#f3a7cc] via-[#ee7bb2] to-[#d77a9b] transition-all duration-500"
              style={{ width: `${studyPercent}%` }}
            />
          </div>
        </div>

        <div className="rounded-[24px] border border-[#f3d8d2] bg-gradient-to-br from-[#fffaf8] to-[#fff9f3] p-4 text-[#402a31] shadow-[0_10px_25px_rgba(221,126,124,0.08)] transition hover:border-[#eaa8a1]">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-xl border border-[#f5d0c8] bg-[#fff1ee] p-1.5 text-[#d76e60]">
                  <Dumbbell className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8d6970]">Training & health</span>
              </div>
              {unresolvedDebts.length > 0 && (
                <span className="flex items-center gap-1 rounded-full border border-[#f5b9b5] bg-[#fff1ef] px-2 py-0.5 text-[10px] font-bold text-[#d15d65]">
                  <AlertTriangle className="h-3 w-3" />
                  {unresolvedDebts.length} debt
                </span>
              )}
            </div>

            <div className="mt-1">
              <div className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold ${workoutBadge.color}`}>
                <workoutBadge.icon className="h-3.5 w-3.5" />
                <span>{workoutBadge.label}</span>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-[#705b63]">
              Sleep window configured: <span className="font-semibold text-[#342326]">{profile?.sleep_start_time ?? '23:00'} - {profile?.sleep_end_time ?? '07:00'}</span>
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[#f1dad8] pt-2 text-[11px] text-[#725e63]">
            <span>Recovery engine status</span>
            <span className="flex items-center gap-1 font-semibold text-[#d16063]">
              <Sparkles className="h-3 w-3" /> Auto-amortizer active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
