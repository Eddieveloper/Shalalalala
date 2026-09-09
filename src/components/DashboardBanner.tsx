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
    <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 rounded-2xl p-5 border border-slate-800 shadow-xl relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
        {/* 1. Daily Calorie Progress */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 flex flex-col justify-between hover:border-amber-500/40 transition-colors group">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Flame className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Nutrition Velocity</span>
              </div>
              <span className="text-xs font-semibold text-amber-400">
                {caloriePercent}%
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-black text-white tracking-tight">{consumedCalories}</span>
              <span className="text-xs text-slate-400">/ {targetCalories} kcal</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {calorieDeficit > 0 ? (
                <span><strong className="text-amber-300">{calorieDeficit} kcal</strong> remaining to target</span>
              ) : (
                <span className="text-emerald-400 font-medium">Daily metabolic target hit!</span>
              )}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 w-full bg-slate-950/80 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${caloriePercent}%` }}
            />
          </div>
        </div>

        {/* 2. Academic Study Tracker */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 flex flex-col justify-between hover:border-blue-500/40 transition-colors group">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Academic Focus</span>
              </div>
              <span className="text-xs font-semibold text-blue-400">
                {studyPercent}%
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-black text-white tracking-tight">{studyLoggedHours}h</span>
              <span className="text-xs text-slate-400">/ {studyTargetHours}h target</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {studyLoggedMins >= studyTargetMins && studyTargetMins > 0 ? (
                <span className="text-emerald-400 font-medium">Target achieved for university modules</span>
              ) : (
                <span>{Math.max(0, studyTargetMins - studyLoggedMins)} mins focus remaining today</span>
              )}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 w-full bg-slate-950/80 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500"
              style={{ width: `${studyPercent}%` }}
            />
          </div>
        </div>

        {/* 3. Workout & Deficit Balance Card */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 flex flex-col justify-between hover:border-emerald-500/40 transition-colors group">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Training & Health</span>
              </div>
              {unresolvedDebts.length > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  {unresolvedDebts.length} Deficits
                </span>
              )}
            </div>

            <div className="mt-1">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${workoutBadge.color}`}>
                <workoutBadge.icon className="w-3.5 h-3.5" />
                <span>{workoutBadge.label}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-3">
              Sleep window configured: <span className="text-slate-200 font-semibold">{profile?.sleep_start_time ?? '23:00'} - {profile?.sleep_end_time ?? '07:00'}</span>
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-slate-400">
            <span>Recovery Engine Status:</span>
            <span className="text-cyan-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Auto-Amortizer Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
