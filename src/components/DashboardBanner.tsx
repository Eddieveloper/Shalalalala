import React from 'react';
import { BookOpen, CheckCircle2, Dumbbell, Flame, AlertTriangle } from 'lucide-react';
import { useProfile, useScheduleBlocks, useNutritionLogs, useActivityDebts } from '../hooks/useSchedule';
import { useRebalanceStore } from '../store/useRebalanceStore';

export const DashboardBanner: React.FC = () => {
  const selectedDate = useRebalanceStore((s) => s.selectedDate);
  const { data: profile } = useProfile();
  const { data: blocks = [] } = useScheduleBlocks(selectedDate);
  const { data: meals = [] } = useNutritionLogs(selectedDate);
  const { data: debts = [] } = useActivityDebts();
  const targetCalories = profile?.daily_calorie_target ?? 2200;
  const consumedCalories = meals.reduce((total, meal) => total + (meal.actual_calories || 0), 0);
  const caloriePercent = Math.min(100, Math.round((consumedCalories / targetCalories) * 100));
  const calorieDeficit = Math.max(0, targetCalories - consumedCalories);
  const academicBlocks = blocks.filter((block) => block.category === 'academic');
  const studyTargetMins = academicBlocks.reduce((total, block) => total + block.target_value, 0);
  const studyLoggedMins = academicBlocks.reduce((total, block) => total + (block.actual_value || 0), 0);
  const studyPercent = studyTargetMins > 0 ? Math.min(100, Math.round((studyLoggedMins / studyTargetMins) * 100)) : 0;
  const fitnessBlocks = blocks.filter((block) => block.category === 'fitness');
  const fitnessCompleted = fitnessBlocks.filter((block) => block.status === 'completed').length;
  const unresolvedDebts = debts.filter((debt) => debt.status === 'unresolved');
  const recoveryLabel = fitnessBlocks.length === 0 ? 'Recovery day' : fitnessCompleted === fitnessBlocks.length ? 'Movement complete' : `${fitnessBlocks.length - fitnessCompleted} movement block${fitnessBlocks.length - fitnessCompleted === 1 ? '' : 's'} remaining`;

  return (
    <div className="metric-grid">
      <article className="metric-item">
        <div className="metric-heading"><div className="flex items-center gap-2"><div className="metric-icon metric-icon-calories"><Flame className="h-4 w-4" /></div><span className="metric-label">Calories</span></div></div>
        <div className="metric-value-row"><span className="metric-value">{consumedCalories}</span><span className="metric-unit">/ {targetCalories} kcal</span></div>
        <p className="metric-note">{calorieDeficit > 0 ? <><strong className="text-[#d9635d]">{calorieDeficit} kcal</strong> remaining</> : <span className="font-semibold text-[#2d9f6b]">Daily target reached</span>}</p>
        <div className="metric-bar"><span className="metric-bar-calories" style={{ width: `${caloriePercent}%` }} /></div>
      </article>
      <article className="metric-item">
        <div className="metric-heading"><div className="flex items-center gap-2"><div className="metric-icon metric-icon-study"><BookOpen className="h-4 w-4" /></div><span className="metric-label">Study</span></div></div>
        <div className="metric-value-row"><span className="metric-value">{(studyLoggedMins / 60).toFixed(1)}h</span><span className="metric-unit">/ {(studyTargetMins / 60).toFixed(1)}h planned</span></div>
        <p className="metric-note">{studyTargetMins === 0 ? 'No study blocks planned' : studyLoggedMins >= studyTargetMins ? <span className="font-semibold text-[#2d9f6b]">Study target reached</span> : `${studyTargetMins - studyLoggedMins} min remaining`}</p>
        <div className="metric-bar"><span className="metric-bar-study" style={{ width: `${studyPercent}%` }} /></div>
      </article>
      <article className="metric-item">
        <div className="metric-heading"><div className="flex items-center gap-2"><div className="metric-icon metric-icon-recovery"><Dumbbell className="h-4 w-4" /></div><span className="metric-label">Recovery</span></div>{unresolvedDebts.length > 0 && <span className="metric-alert"><AlertTriangle className="h-3 w-3" /> {unresolvedDebts.length}</span>}</div>
        <div className="mt-3 flex items-center gap-2 text-sm font-bold text-[#3f3034]"><CheckCircle2 className="h-4 w-4 text-[#6fa98f]" />{recoveryLabel}</div>
        <p className="metric-note">Sleep window: <strong className="text-[#342326]">{profile?.sleep_start_time ?? '23:00'} - {profile?.sleep_end_time ?? '07:00'}</strong></p>
      </article>
    </div>
  );
};
