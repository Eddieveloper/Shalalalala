import React, { useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Settings as SettingsIcon,
  Square,
  Zap,
} from 'lucide-react';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { useRebalanceStore } from '../store/useRebalanceStore';
import { isSupabaseConfigured } from '../lib/supabase';
import { useScheduleBlocks } from '../hooks/useSchedule';

export const Header: React.FC = () => {
  const selectedDate = useRebalanceStore((s) => s.selectedDate);
  const setSelectedDate = useRebalanceStore((s) => s.setSelectedDate);
  const viewMode = useRebalanceStore((s) => s.viewMode);
  const setViewMode = useRebalanceStore((s) => s.setViewMode);
  const setIsSettingsOpen = useRebalanceStore((s) => s.setIsSettingsOpen);

  const activeTimer = useRebalanceStore((s) => s.activeTimer);
  const pauseStudyTimer = useRebalanceStore((s) => s.pauseStudyTimer);
  const resumeStudyTimer = useRebalanceStore((s) => s.resumeStudyTimer);
  const stopStudyTimer = useRebalanceStore((s) => s.stopStudyTimer);
  const tickStudyTimer = useRebalanceStore((s) => s.tickStudyTimer);

  const { updateBlock } = useScheduleBlocks();

  // Timer ticker interval
  useEffect(() => {
    if (!activeTimer.isRunning) return;
    const interval = setInterval(() => {
      tickStudyTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimer.isRunning, tickStudyTimer]);

  const handleDateShift = (delta: number) => {
    const current = parseISO(selectedDate);
    const updated = delta > 0 ? addDays(current, delta) : subDays(current, Math.abs(delta));
    setSelectedDate(format(updated, 'yyyy-MM-dd'));
  };

  const handleStopTimer = async () => {
    const { blockId, elapsedMinutes } = stopStudyTimer();
    if (blockId && elapsedMinutes > 0) {
      await updateBlock({
        id: blockId,
        updates: {
          actual_value: elapsedMinutes,
          status: 'completed',
        },
      });
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
              <Zap className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">Rebalance</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Recovery Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Academic, Fitness & Calorie Deficit Amortizer</p>
            </div>
          </div>

          {/* Mobile Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 md:hidden transition-colors"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Date Navigation & Day/Week Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-center">
          <div className="flex items-center bg-slate-800/90 rounded-lg p-1 border border-slate-700/60 shadow-inner">
            <button
              onClick={() => handleDateShift(-1)}
              className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
              className="px-3 py-1 text-xs font-semibold text-slate-200 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>{format(parseISO(selectedDate), 'EEE, MMM d')}</span>
              {selectedDate === format(new Date(), 'yyyy-MM-dd') && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              )}
            </button>

            <button
              onClick={() => handleDateShift(1)}
              className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60 text-xs font-medium text-slate-400">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'day'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'hover:text-slate-200'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'week'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'hover:text-slate-200'
              }`}
            >
              7-Day Week
            </button>
          </div>
        </div>

        {/* Right: Active Timer / Supabase Status / Settings */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Active Study Timer Pill */}
          {activeTimer.blockId && (
            <div className="flex items-center gap-2 bg-blue-950/80 border border-blue-500/40 px-3 py-1.5 rounded-xl shadow-lg shadow-blue-950/50 animate-pulse-subtle">
              <Clock className="w-4 h-4 text-blue-400 animate-spin" style={{ animationDuration: '4s' }} />
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-blue-300 font-medium truncate max-w-[110px]">
                  {activeTimer.blockTitle}
                </span>
                <span className="font-mono text-xs font-bold text-white tracking-wider">
                  {formatTimer(activeTimer.elapsedSeconds)}
                </span>
              </div>
              <div className="flex items-center gap-1 ml-1">
                {activeTimer.isRunning ? (
                  <button
                    onClick={pauseStudyTimer}
                    className="p-1 rounded bg-blue-800/60 hover:bg-blue-700 text-blue-200"
                    title="Pause Stopwatch"
                  >
                    <Pause className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={resumeStudyTimer}
                    className="p-1 rounded bg-emerald-700/80 hover:bg-emerald-600 text-white"
                    title="Resume Stopwatch"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={handleStopTimer}
                  className="p-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200"
                  title="Finish and Save Study Session"
                >
                  <Square className="w-3 h-3 fill-rose-300" />
                </button>
              </div>
            </div>
          )}

          {/* Supabase Status Indicator */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              isSupabaseConfigured
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title={isSupabaseConfigured ? 'Connected to live Supabase backend' : 'Running in Local Storage Sandbox mode'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSupabaseConfigured ? 'bg-emerald-400' : 'bg-cyan-400'
              }`}
            />
            <span>{isSupabaseConfigured ? 'Supabase Live' : 'Local Sandbox'}</span>
          </div>

          {/* Settings Trigger */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
