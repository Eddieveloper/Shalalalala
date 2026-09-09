import React, { useState, useEffect } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Utensils,
  X,
  Zap,
} from 'lucide-react';
import { useRebalanceStore } from '../store/useRebalanceStore';
import { useNutritionLogs, useScheduleBlocks } from '../hooks/useSchedule';
import { MealType } from '../types/database';

export const QuickLogDrawer: React.FC = () => {
  const quickLog = useRebalanceStore((s) => s.quickLog);
  const closeQuickLog = useRebalanceStore((s) => s.closeQuickLog);
  const selectedDate = useRebalanceStore((s) => s.selectedDate);

  const activeTimer = useRebalanceStore((s) => s.activeTimer);
  const startStudyTimer = useRebalanceStore((s) => s.startStudyTimer);
  const pauseStudyTimer = useRebalanceStore((s) => s.pauseStudyTimer);
  const resumeStudyTimer = useRebalanceStore((s) => s.resumeStudyTimer);
  const stopStudyTimer = useRebalanceStore((s) => s.stopStudyTimer);

  const { updateBlock } = useScheduleBlocks();
  const { data: meals = [], updateMeal, createMeal } = useNutritionLogs(selectedDate);

  // Active Tab state
  const [activeTab, setActiveTab] = useState<'study' | 'workout' | 'meal'>('meal');

  // Meal Form State
  const [calorieInput, setCalorieInput] = useState<string>('650');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');

  // Study Form State (manual fallback)
  const [manualStudyMinutes, setManualStudyMinutes] = useState<string>('60');

  // Workout Form State
  const [workoutMinutes, setWorkoutMinutes] = useState<string>('60');

  useEffect(() => {
    if (quickLog.type) {
      setActiveTab(quickLog.type);
    }
    if (quickLog.block) {
      if (quickLog.block.category === 'academic') {
        setActiveTab('study');
        setManualStudyMinutes(String(quickLog.block.target_value));
      } else if (quickLog.block.category === 'fitness') {
        setActiveTab('workout');
        setWorkoutMinutes(String(quickLog.block.target_value));
      } else if (quickLog.block.category === 'meal') {
        setActiveTab('meal');
        setCalorieInput(String(quickLog.block.target_value));
      }
    }
  }, [quickLog]);

  if (!quickLog.isOpen) return null;

  // Format stopwatch seconds
  const formatStopwatch = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. Submit Meal
  const handleSaveMeal = async () => {
    const calories = parseInt(calorieInput, 10);
    if (isNaN(calories) || calories <= 0) return;

    // Find existing meal log for today or create new
    const existing = meals.find((m) => m.meal_type === selectedMealType);

    if (existing) {
      await updateMeal({
        id: existing.id,
        updates: {
          actual_calories: calories,
          status: 'logged',
        },
      });
    } else {
      await createMeal({
        user_id: '00000000-0000-0000-0000-000000000001',
        date: selectedDate,
        meal_type: selectedMealType,
        target_calories: calories,
        actual_calories: calories,
        status: 'logged',
        window_start: '12:00',
        window_end: '13:00',
      });
    }

    // If there was a linked block, also mark it complete
    if (quickLog.block && quickLog.block.category === 'meal') {
      await updateBlock({
        id: quickLog.block.id,
        updates: {
          actual_value: calories,
          status: 'completed',
        },
      });
    }

    closeQuickLog();
  };

  // 2. Submit Workout (1-Click or custom)
  const handleSaveWorkout = async (customMins?: number) => {
    const mins = customMins ?? (parseInt(workoutMinutes, 10) || 60);

    if (quickLog.block) {
      await updateBlock({
        id: quickLog.block.id,
        updates: {
          actual_value: mins,
          status: 'completed',
        },
      });
    }

    closeQuickLog();
  };

  // 3. Save Study Minutes
  const handleSaveManualStudy = async () => {
    const mins = parseInt(manualStudyMinutes, 10);
    if (isNaN(mins) || mins <= 0) return;

    if (quickLog.block) {
      await updateBlock({
        id: quickLog.block.id,
        updates: {
          actual_value: mins,
          status: 'completed',
        },
      });
    }
    closeQuickLog();
  };

  const handleStopAndCommitTimer = async () => {
    const { blockId, elapsedMinutes } = stopStudyTimer();
    const targetId = blockId || quickLog.block?.id;
    if (targetId) {
      await updateBlock({
        id: targetId,
        updates: {
          actual_value: Math.max(1, elapsedMinutes),
          status: 'completed',
        },
      });
    }
    closeQuickLog();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#261b1f]/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-[28px] border-t border-[#f3d7d4] bg-[#fffaf8] shadow-[0_30px_80px_rgba(76,45,49,0.14)] sm:max-w-lg sm:rounded-[28px] sm:border">
        <div className="relative border-b border-[#f4dfe1] bg-[#fff5f3] px-6 pb-2 pt-3">
          <div className="mb-3 h-1.5 w-12 rounded-full bg-[#e8c7c4] sm:hidden" />
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-[#f0c7c0] bg-[#fff0ee] p-1.5 text-[#d25d5d]">
                <Zap className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-[#2d1d22]">Quick log</h3>
            </div>
            <button
              onClick={closeQuickLog}
              className="rounded-full p-1.5 text-[#6d4f58] transition hover:bg-[#fbe9e5]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid w-full grid-cols-3 gap-1 rounded-2xl bg-[#fff1ef] p-1 text-xs font-semibold text-[#725d63]">
            <button
              onClick={() => setActiveTab('meal')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 transition-all ${
                activeTab === 'meal'
                  ? 'bg-[#f7b1a4] text-[#2d1d22]'
                  : 'hover:bg-[#fbeae6]'
              }`}
            >
              <Flame className="h-3.5 w-3.5" /> Calories
            </button>
            <button
              onClick={() => setActiveTab('study')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 transition-all ${
                activeTab === 'study'
                  ? 'bg-[#eec7d8] text-[#2d1d22]'
                  : 'hover:bg-[#fbeae6]'
              }`}
            >
              <Clock className="h-3.5 w-3.5" /> Study
            </button>
            <button
              onClick={() => setActiveTab('workout')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 transition-all ${
                activeTab === 'workout'
                  ? 'bg-[#f8d9b9] text-[#2d1d22]'
                  : 'hover:bg-[#fbeae6]'
              }`}
            >
              <Dumbbell className="h-3.5 w-3.5" /> Workout
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* TAB 1: MEAL CALORIES */}
          {activeTab === 'meal' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Meal Window
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedMealType(type)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                        selectedMealType === type
                          ? 'border-[#f0c2b6] bg-[#fff0ef] text-[#2d1d22]'
                          : 'border-[#f1d9d6] bg-[#fffaf8] text-[#6b575d] hover:border-[#e7b7ae]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Calories Consumed (kcal)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={calorieInput}
                    onChange={(e) => setCalorieInput(e.target.value)}
                    className="w-full rounded-xl border border-[#f0d7d3] bg-[#fff5f3] px-4 py-3 font-mono text-2xl font-black text-[#2f1d23] outline-none transition focus:border-[#e39b97]"
                    placeholder="e.g. 700"
                  />
                  <span className="absolute right-4 top-3.5 text-sm font-bold text-[#7a5d63]">kcal</span>
                </div>

                {/* Quick numeric presets */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {[250, 450, 650, 800, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCalorieInput(String(preset))}
                      className="rounded-lg border border-[#f0d7d3] bg-[#fff5f3] px-2.5 py-1 text-[11px] font-semibold text-[#4f3d43] transition hover:bg-[#fdf0ee]"
                    >
                      {preset} kcal
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveMeal}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f7b1a4] px-4 py-3 text-sm font-bold text-[#2d1d22] transition hover:bg-[#f29d90]"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Log Calories & Balance Window</span>
              </button>
            </div>
          )}

          {/* TAB 2: LIVE STUDY STOPWATCH */}
          {activeTab === 'study' && (
            <div className="space-y-4 text-center">
              <div className="rounded-2xl border border-[#f0d7d3] bg-[#fff7f5] p-6">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#d16979]">
                  {quickLog.block?.title || activeTimer.blockTitle || 'Deep Work Study Focus'}
                </span>
                <div className="my-3 font-mono text-5xl font-black tracking-widest text-[#2d1d22]">
                  {formatStopwatch(activeTimer.elapsedSeconds)}
                </div>

                <div className="flex items-center justify-center gap-3 mt-4">
                  {!activeTimer.isRunning ? (
                    <button
                      onClick={() => {
                        if (quickLog.block) {
                          startStudyTimer(quickLog.block);
                        } else {
                          resumeStudyTimer();
                        }
                      }}
                      className="flex items-center gap-2 rounded-xl bg-[#e7c2d7] px-5 py-2.5 text-xs font-bold text-[#2d1d22] transition hover:bg-[#dcb7c9]"
                    >
                      <Play className="w-4 h-4" /> Start Live Stopwatch
                    </button>
                  ) : (
                    <button
                      onClick={pauseStudyTimer}
                      className="flex items-center gap-2 rounded-xl bg-[#f6c39e] px-5 py-2.5 text-xs font-bold text-[#2d1d22] transition hover:bg-[#efb683]"
                    >
                      <Pause className="w-4 h-4" /> Pause
                    </button>
                  )}

                  {activeTimer.elapsedSeconds > 0 && (
                    <button
                      onClick={handleStopAndCommitTimer}
                      className="flex items-center gap-2 rounded-xl bg-[#b7d9c2] px-5 py-2.5 text-xs font-bold text-[#2d1d22] transition hover:bg-[#abd1b7]"
                    >
                      <Check className="w-4 h-4 stroke-[3]" /> Save Session ({Math.round(activeTimer.elapsedSeconds / 60)}m)
                    </button>
                  )}
                </div>
              </div>

              {/* Manual input fallback */}
              <div className="border-t border-[#f1d9d6] pt-3 text-left">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6b575d]">
                  Or Log Minutes Manually
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={manualStudyMinutes}
                    onChange={(e) => setManualStudyMinutes(e.target.value)}
                    className="flex-1 rounded-xl border border-[#f0d7d3] bg-[#fff5f3] px-4 py-2 font-mono text-sm text-[#2f1d23] outline-none transition focus:border-[#e39b97]"
                    placeholder="Minutes"
                  />
                  <button
                    onClick={handleSaveManualStudy}
                    className="rounded-xl border border-[#f0d7d3] bg-[#fff5f3] px-4 py-2 text-xs font-bold text-[#4f3d43] transition hover:bg-[#fdf0ee]"
                  >
                    Commit Minutes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WORKOUT COMPLETION */}
          {activeTab === 'workout' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl border border-[#f0d7d3] bg-[#fffaf8] p-4">
                <Dumbbell className="mt-0.5 h-5 w-5 shrink-0 text-[#6fa98f]" />
                <div>
                  <h4 className="text-sm font-bold text-[#2d1d22]">
                    {quickLog.block?.title || 'Scheduled Workout Session'}
                  </h4>
                  <p className="mt-0.5 text-xs text-[#7a5d63]">
                    Target duration: {quickLog.block?.target_value ?? 60} minutes
                  </p>
                </div>
              </div>

              {/* 1-Click Fast Completion Button */}
              <button
                onClick={() => handleSaveWorkout(quickLog.block?.target_value ?? 60)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#b7d9c2] px-4 py-3.5 text-sm font-bold text-[#2d1d22] transition hover:bg-[#abd1b7]"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>1-Click Complete Full Workout ({quickLog.block?.target_value ?? 60}m)</span>
              </button>

              <div className="border-t border-[#f1d9d6] pt-3">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6b575d]">
                  Or Log Custom Workout Duration
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={workoutMinutes}
                    onChange={(e) => setWorkoutMinutes(e.target.value)}
                    className="flex-1 rounded-xl border border-[#f0d7d3] bg-[#fff5f3] px-4 py-2 font-mono text-sm text-[#2f1d23] outline-none transition focus:border-[#e39b97]"
                    placeholder="Duration in minutes"
                  />
                  <button
                    onClick={() => handleSaveWorkout()}
                    className="rounded-xl border border-[#f0d7d3] bg-[#fff5f3] px-4 py-2 text-xs font-bold text-[#4f3d43] transition hover:bg-[#fdf0ee]"
                  >
                    Log Custom
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
