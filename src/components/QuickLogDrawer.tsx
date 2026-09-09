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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-lg bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
        {/* Drawer Drag handle / Header */}
        <div className="pt-3 pb-2 px-6 flex flex-col items-center border-b border-slate-800 relative bg-slate-900/90">
          <div className="w-12 h-1.5 rounded-full bg-slate-700 mb-3 sm:hidden" />
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-base text-white">Quick Log & Live Tracking</h3>
            </div>
            <button
              onClick={closeQuickLog}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1 w-full bg-slate-800/80 p-1 rounded-xl mt-3 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('meal')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'meal'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Calories
            </button>
            <button
              onClick={() => setActiveTab('study')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'study'
                  ? 'bg-blue-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Study Timer
            </button>
            <button
              onClick={() => setActiveTab('workout')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'workout'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" /> Workout
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
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
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
                    className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-3 text-2xl font-black text-white font-mono placeholder-slate-600 outline-none"
                    placeholder="e.g. 700"
                  />
                  <span className="absolute right-4 top-3.5 text-sm font-bold text-slate-400">kcal</span>
                </div>

                {/* Quick numeric presets */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {[250, 450, 650, 800, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCalorieInput(String(preset))}
                      className="text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700"
                    >
                      {preset} kcal
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveMeal}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all mt-4"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Log Calories & Balance Window</span>
              </button>
            </div>
          )}

          {/* TAB 2: LIVE STUDY STOPWATCH */}
          {activeTab === 'study' && (
            <div className="space-y-4 text-center">
              <div className="bg-slate-950/80 p-6 rounded-2xl border border-blue-500/30">
                <span className="text-xs uppercase font-bold text-blue-400 tracking-wider block mb-1">
                  {quickLog.block?.title || activeTimer.blockTitle || 'Deep Work Study Focus'}
                </span>
                <div className="font-mono text-5xl font-black text-white tracking-widest my-3">
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
                      className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                      <Play className="w-4 h-4" /> Start Live Stopwatch
                    </button>
                  ) : (
                    <button
                      onClick={pauseStudyTimer}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2"
                    >
                      <Pause className="w-4 h-4" /> Pause
                    </button>
                  )}

                  {activeTimer.elapsedSeconds > 0 && (
                    <button
                      onClick={handleStopAndCommitTimer}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      <Check className="w-4 h-4 stroke-[3]" /> Save Session ({Math.round(activeTimer.elapsedSeconds / 60)}m)
                    </button>
                  )}
                </div>
              </div>

              {/* Manual input fallback */}
              <div className="pt-3 border-t border-slate-800 text-left">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Or Log Minutes Manually
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={manualStudyMinutes}
                    onChange={(e) => setManualStudyMinutes(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 font-mono text-sm text-white"
                    placeholder="Minutes"
                  />
                  <button
                    onClick={handleSaveManualStudy}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold"
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
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
                <Dumbbell className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-white">
                    {quickLog.block?.title || 'Scheduled Workout Session'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Target duration: {quickLog.block?.target_value ?? 60} minutes
                  </p>
                </div>
              </div>

              {/* 1-Click Fast Completion Button */}
              <button
                onClick={() => handleSaveWorkout(quickLog.block?.target_value ?? 60)}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>1-Click Complete Full Workout ({quickLog.block?.target_value ?? 60}m)</span>
              </button>

              <div className="pt-3 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Or Log Custom Workout Duration
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={workoutMinutes}
                    onChange={(e) => setWorkoutMinutes(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 font-mono text-sm text-white"
                    placeholder="Duration in minutes"
                  />
                  <button
                    onClick={() => handleSaveWorkout()}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold"
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
