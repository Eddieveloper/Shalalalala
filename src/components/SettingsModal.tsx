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
import { useProfile, useSubjects } from '../hooks/useSchedule';
import { useRebalanceStore } from '../store/useRebalanceStore';
import { localStore } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export const SettingsModal: React.FC = () => {
  const isSettingsOpen = useRebalanceStore((s) => s.isSettingsOpen);
  const setIsSettingsOpen = useRebalanceStore((s) => s.setIsSettingsOpen);

  const { data: profile, updateProfile } = useProfile();
  const { data: registeredSubjects = [], createSubject, deleteSubject } = useSubjects();
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
  const [subjectForm, setSubjectForm] = useState({ name: '', courseCode: '', professor: '', credits: '3', color: '#d86894' });

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
    if (confirm('Clear your local schedule, meals, subjects, and activity history?')) {
      localStore.resetDefaults();
      queryClient.invalidateQueries();
      setIsSettingsOpen(false);
    }
  };

  const handleAddSubject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!subjectForm.name.trim() || !subjectForm.courseCode.trim()) return;
    await createSubject({ user_id: '00000000-0000-0000-0000-000000000001', name: subjectForm.name.trim(), course_code: subjectForm.courseCode.trim(), professor: subjectForm.professor.trim() || null, credits: Number(subjectForm.credits) || 3, color: subjectForm.color });
    setSubjectForm({ name: '', courseCode: '', professor: '', credits: '3', color: '#d86894' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#261b1f]/55 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-[#f1d7d1] bg-[#fffaf8] shadow-[0_28px_80px_rgba(110,66,69,0.12)]">
        <div className="flex items-center justify-between border-b border-[#f4dfe1] bg-[#fff5f3] p-6">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-[#f5cac5] bg-[#fff0ee] p-2 text-[#d7625d]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2f1d22]">System settings & guardrails</h3>
              <p className="text-xs text-[#7a5d63]">Configure calorie thresholds, sleep windows, and academic subjects.</p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="rounded-full p-1.5 text-[#6d4f58] transition hover:bg-[#fbe9e5]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Settings Body Form */}
        <form onSubmit={handleSave} className="flex-1 space-y-6 overflow-y-auto p-6 text-xs">
          {/* Section 1: Sleep Window Guardrail */}
          <div className="space-y-3 rounded-[22px] border border-[#f0dcd8] bg-[#fffaf8] p-4">
            <div className="flex items-center gap-2 font-bold text-[#341d23]">
              <Moon className="h-4 w-4 text-[#d1655c]" />
              <span>Protected sleep window</span>
            </div>
            <p className="text-[#765f66]">
              The recovery engine's free-slot detector will strictly avoid scheduling study buffers or workouts during these hours to protect mental health and circadian rhythm.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Bedtime (Start)</label>
                <input
                  type="time"
                  value={sleepStart}
                  onChange={(e) => setSleepStart(e.target.value)}
                  className="w-full rounded-xl border border-[#f0d7d3] bg-[#fff5f3] px-3 py-2 font-mono text-[#2f1d23] outline-none ring-0 transition focus:border-[#e39b97]"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Wake Time (End)</label>
                <input
                  type="time"
                  value={sleepEnd}
                  onChange={(e) => setSleepEnd(e.target.value)}
                  className="w-full rounded-xl border border-[#f0d7d3] bg-[#fff5f3] px-3 py-2 font-mono text-[#2f1d23] outline-none ring-0 transition focus:border-[#e39b97]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Nutrition & Calorie Targets */}
          <div className="space-y-3 rounded-[22px] border border-[#f0dcd8] bg-[#fffaf8] p-4">
            <div className="flex items-center gap-2 font-bold text-[#341d23]">
              <Flame className="h-4 w-4 text-[#d48a53]" />
              <span>Daily calories & meal windows</span>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Daily Calorie Target (kcal)</label>
              <input
                type="number"
                value={calorieTarget}
                onChange={(e) => setCalorieTarget(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-xl border border-[#f0d7d3] bg-[#fff5f3] px-3 py-2 font-mono text-base font-bold text-[#2f1d23] outline-none transition focus:border-[#e39b97]"
              />
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div>
                <span className="mb-1 block font-semibold text-[#5e4b52]">Breakfast</span>
                <input
                  type="time"
                  value={breakfastStart}
                  onChange={(e) => setBreakfastStart(e.target.value)}
                  className="w-full rounded-lg border border-[#f0d7d3] bg-[#fff5f3] px-2 py-1 font-mono text-[11px] text-[#2f1d23] outline-none transition focus:border-[#e39b97]"
                />
              </div>
              <div>
                <span className="mb-1 block font-semibold text-[#5e4b52]">Lunch</span>
                <input
                  type="time"
                  value={lunchStart}
                  onChange={(e) => setLunchStart(e.target.value)}
                  className="w-full rounded-lg border border-[#f0d7d3] bg-[#fff5f3] px-2 py-1 font-mono text-[11px] text-[#2f1d23] outline-none transition focus:border-[#e39b97]"
                />
              </div>
              <div>
                <span className="mb-1 block font-semibold text-[#5e4b52]">Dinner</span>
                <input
                  type="time"
                  value={dinnerStart}
                  onChange={(e) => setDinnerStart(e.target.value)}
                  className="w-full rounded-lg border border-[#f0d7d3] bg-[#fff5f3] px-2 py-1 font-mono text-[11px] text-[#2f1d23] outline-none transition focus:border-[#e39b97]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-[22px] border border-[#f0dcd8] bg-[#fffaf8] p-4">
            <div className="flex items-center gap-2 font-bold text-[#341d23]"><BookOpen className="h-4 w-4 text-[#d86894]" /><span>University / subjects</span></div>
            <div className="space-y-2">{registeredSubjects.length === 0 ? <p className="text-[#7d6870]">No subjects registered yet.</p> : registeredSubjects.map((subject) => <div key={subject.id} className="flex items-center justify-between rounded-xl border border-[#f0d7d3] bg-[#fff5f3] p-3"><div><strong className="text-[#2f1d23]">{subject.name}</strong><p className="text-[11px] text-[#7d6870]">{subject.course_code} · {subject.credits} credits{subject.professor ? ` · ${subject.professor}` : ''}</p></div><button type="button" className="text-[11px] font-bold text-[#c55b62]" onClick={() => deleteSubject(subject.id)}>Remove</button></div>)}</div>
            <form onSubmit={handleAddSubject} className="grid gap-2 md:grid-cols-2"><input required placeholder="Subject name" value={subjectForm.name} onChange={(event) => setSubjectForm({ ...subjectForm, name: event.target.value })} className="rounded-lg border border-[#f0d7d3] bg-[#fff5f3] px-3 py-2 text-[#2f1d23]" /><input required placeholder="Course code" value={subjectForm.courseCode} onChange={(event) => setSubjectForm({ ...subjectForm, courseCode: event.target.value })} className="rounded-lg border border-[#f0d7d3] bg-[#fff5f3] px-3 py-2 text-[#2f1d23]" /><input placeholder="Professor (optional)" value={subjectForm.professor} onChange={(event) => setSubjectForm({ ...subjectForm, professor: event.target.value })} className="rounded-lg border border-[#f0d7d3] bg-[#fff5f3] px-3 py-2 text-[#2f1d23]" /><input type="number" min="1" max="8" placeholder="Credits" value={subjectForm.credits} onChange={(event) => setSubjectForm({ ...subjectForm, credits: event.target.value })} className="rounded-lg border border-[#f0d7d3] bg-[#fff5f3] px-3 py-2 text-[#2f1d23]" /><button type="submit" className="rounded-lg bg-[#f5d5dc] px-3 py-2 text-xs font-bold text-[#452630] md:col-span-2">Add subject</button></form>
          </div>

          {/* Section 3: Academic Subjects & Targets */}
          <div className="space-y-3 rounded-[22px] border border-[#f0dcd8] bg-[#fffaf8] p-4">
            <div className="flex items-center gap-2 font-bold text-[#341d23]">
              <BookOpen className="h-4 w-4 text-[#d86894]" />
              <span>Weekly academic subjects & burnout ceiling</span>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Max Daily Study Minutes (Burnout Cap)</label>
              <input
                type="number"
                value={maxStudyMinutes}
                onChange={(e) => setMaxStudyMinutes(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-xl border border-[#f0d7d3] bg-[#fff5f3] px-3 py-2 font-mono text-[#2f1d23] outline-none transition focus:border-[#e39b97]"
              />
              <span className="mt-0.5 block text-[10px] text-[#7d6870]">
                The spread algorithm will never increase daily study load beyond this ceiling.
              </span>
            </div>

            <div className="space-y-2 pt-2">
              <span className="block font-semibold text-[#4a3940]">Registered university subjects:</span>
              {subjects.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl border border-[#f0d7d3] bg-[#fff5f3] p-2.5">
                  <span className="font-semibold text-[#2f1d23]">{s.name}</span>
                  <span className="font-mono font-bold text-[#d4686a]">{s.weeklyTargetHours}h / week</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Data Management & Reset */}
          <div className="flex items-center justify-between rounded-2xl border border-[#f3d6d3] bg-[#fff6f4] p-4">
            <div>
              <span className="block font-bold text-[#341d23]">Clear local workspace</span>
              <span className="text-[11px] text-[#7d6870]">
                Removes your schedule, meals, subjects, and activity history from this browser.
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetData}
              className="flex items-center gap-1.5 rounded-xl border border-[#f0d7d3] bg-[#fff5f3] px-3 py-1.5 text-[11px] font-semibold text-[#4d3940] transition hover:bg-[#fdf0ee]"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Data
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#f3d6d3] bg-[#fff6f4] p-4">
          <div>
            {savedToast && (
              <span className="flex items-center gap-1 text-xs font-bold text-[#38836d]">
                <Check className="w-4 h-4" /> Guardrails updated successfully
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-[#f86f6a] px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_24px_rgba(248,111,106,0.22)] transition hover:bg-[#ee6963]"
          >
            <Save className="w-4 h-4" /> Save Guardrails
          </button>
        </div>
      </div>
    </div>
  );
};
