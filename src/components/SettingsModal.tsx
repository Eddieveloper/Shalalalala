import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Check,
  Clock,
  Database,
  Flame,
  Moon,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';
import { useProfile } from '../hooks/useSchedule';
import { useRebalanceStore } from '../store/useRebalanceStore';
import { localStore } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export const SettingsModal: React.FC = () => {
  const isSettingsOpen = useRebalanceStore((s) => s.isSettingsOpen);
  const setIsSettingsOpen = useRebalanceStore((s) => s.setIsSettingsOpen);

  const { data: profile, updateProfile } = useProfile();
  const queryClient = useQueryClient();

  const [calorieTarget, setCalorieTarget] = useState<number>(2200);
  const [sleepStart, setSleepStart] = useState<string>('23:00');
  const [sleepEnd, setSleepEnd] = useState<string>('07:00');
  const [maxStudyMinutes, setMaxStudyMinutes] = useState<number>(360);

  // Meal windows configuration
  const [breakfastStart, setBreakfastStart] = useState<string>('08:00');
  const [breakfastEnd, setBreakfastEnd] = useState<string>('08:45');
  const [lunchStart, setLunchStart] = useState<string>('12:15');
  const [lunchEnd, setLunchEnd] = useState<string>('13:00');
  const [dinnerStart, setDinnerStart] = useState<string>('19:00');
  const [dinnerEnd, setDinnerEnd] = useState<string>('20:00');

  // Academic subjects targets
  const [subjects, setSubjects] = useState([
    { name: 'Data Structures & Algorithms', weeklyTargetHours: 8 },
    { name: 'Computer Systems Architecture', weeklyTargetHours: 6 },
    { name: 'Discrete Mathematics & Logic', weeklyTargetHours: 6 },
  ]);

  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    if (profile) {
      setCalorieTarget(profile.daily_calorie_target);
      setSleepStart(profile.sleep_start_time);
      setSleepEnd(profile.sleep_end_time);
      setMaxStudyMinutes(profile.max_daily_study_minutes);
    }
  }, [profile]);

  if (!isSettingsOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      daily_calorie_target: calorieTarget,
      sleep_start_time: sleepStart,
      sleep_end_time: sleepEnd,
      max_daily_study_minutes: maxStudyMinutes,
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleResetData = () => {
    if (confirm('Reset schedule, nutrition logs, and debts back to the default university student demo state?')) {
      localStore.resetDefaults();
      queryClient.invalidateQueries();
      setIsSettingsOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">System Settings & Algorithm Guardrails</h3>
              <p className="text-xs text-slate-400">Configure calorie thresholds, sleep windows, and academic subjects.</p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body Form */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Section 1: Sleep Window Guardrail */}
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <Moon className="w-4 h-4 text-cyan-400" />
              <span>Protected Sleep Window (Algorithm Guardrail)</span>
            </div>
            <p className="text-slate-400">
              The recovery engine's free-slot detector will strictly avoid scheduling study buffers or workouts during these hours to protect mental health and circadian rhythm.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Bedtime (Start)</label>
                <input
                  type="time"
                  value={sleepStart}
                  onChange={(e) => setSleepStart(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Wake Time (End)</label>
                <input
                  type="time"
                  value={sleepEnd}
                  onChange={(e) => setSleepEnd(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Nutrition & Calorie Targets */}
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Daily Caloric & Meal Windows</span>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Daily Calorie Target (kcal)</label>
              <input
                type="number"
                value={calorieTarget}
                onChange={(e) => setCalorieTarget(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-base font-bold"
              />
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div>
                <span className="font-semibold text-slate-300 block mb-1">Breakfast</span>
                <input
                  type="time"
                  value={breakfastStart}
                  onChange={(e) => setBreakfastStart(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-[11px]"
                />
              </div>
              <div>
                <span className="font-semibold text-slate-300 block mb-1">Lunch</span>
                <input
                  type="time"
                  value={lunchStart}
                  onChange={(e) => setLunchStart(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-[11px]"
                />
              </div>
              <div>
                <span className="font-semibold text-slate-300 block mb-1">Dinner</span>
                <input
                  type="time"
                  value={dinnerStart}
                  onChange={(e) => setDinnerStart(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Academic Subjects & Targets */}
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Weekly Academic Subjects & Burnout Ceiling</span>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Max Daily Study Minutes (Burnout Cap)</label>
              <input
                type="number"
                value={maxStudyMinutes}
                onChange={(e) => setMaxStudyMinutes(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                The spread algorithm will never increase daily study load beyond this ceiling.
              </span>
            </div>

            <div className="space-y-2 pt-2">
              <span className="font-semibold text-slate-300 block">Registered University Subjects:</span>
              {subjects.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="font-semibold text-white">{s.name}</span>
                  <span className="font-mono text-cyan-400 font-bold">{s.weeklyTargetHours}h / week</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Data Management & Reset */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-300 block">Reset University Demo State</span>
              <span className="text-[11px] text-slate-500">
                Restores sample courses, workouts, meals, and active missed debt scenarios.
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetData}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 font-semibold text-[11px]"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Data
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <div>
            {savedToast && (
              <span className="text-emerald-400 flex items-center gap-1 text-xs font-bold animate-fade-in">
                <Check className="w-4 h-4" /> Guardrails updated successfully
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Guardrails
          </button>
        </div>
      </div>
    </div>
  );
};
