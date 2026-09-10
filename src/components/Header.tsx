import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { useRebalanceStore } from '../store/useRebalanceStore';
import { useScheduleBlocks } from '../hooks/useSchedule';

export const Header: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
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

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

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
    <header className="sticky top-0 z-30 mb-6 rounded-[28px] border border-[#f3d7d4] bg-white/80 px-4 py-3 shadow-[0_10px_35px_rgba(166,91,95,0.08)] backdrop-blur-xl lg:px-6">
      <div className="mx-auto flex flex-col items-center justify-between gap-3 md:flex-row">
        <div className="flex w-full items-center justify-between gap-4 md:w-auto">
          <div className="flex items-center gap-3">
            <div className="brand-mark flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[#190b18] shadow-[0_10px_24px_rgba(240,116,111,0.25)] ring-2 ring-white">
              <img src="/rebalance-logo-pink.png" alt="Rebalanced logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold tracking-[-0.06em] text-[#341d23]">Rebalanced</span>
                <span className="rounded-full border border-[#f5b7b0] bg-[#fff1ef] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#c65959]">
                  Coral Journal
                </span>
              </div>
              <p className="hidden text-[11px] uppercase tracking-[0.18em] text-[#82666e] sm:block">Academic, fitness, and calorie recovery</p>
            </div>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="rounded-xl border border-[#f3d7d4] bg-[#fff8f6] p-2 text-[#6b4c54] transition hover:border-[#f1b1ac] hover:bg-[#fff0ee] md:hidden"
            title="Settings"
          >
            <SettingsIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex w-full items-center justify-center gap-3 md:w-auto">
          <div className="flex items-center rounded-2xl border border-[#f2d8d3] bg-[#fff7f5] p-1 shadow-inner shadow-[#f5d0ca]/40">
            <button
              onClick={() => handleDateShift(-1)}
              className="rounded-xl p-1.5 text-[#5f4650] transition hover:bg-[#ffe9e6] hover:text-[#2b1c21]"
              title="Previous Day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#432d35] transition hover:text-[#b1464c]"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-[#dd614f]" />
              <span>{format(parseISO(selectedDate), 'EEE, MMM d')}</span>
              {selectedDate === format(new Date(), 'yyyy-MM-dd') && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#f36f6b]" />
              )}
            </button>

            <button
              onClick={() => handleDateShift(1)}
              className="rounded-xl p-1.5 text-[#5f4650] transition hover:bg-[#ffe9e6] hover:text-[#2b1c21]"
              title="Next Day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex rounded-2xl border border-[#f2d8d3] bg-[#fff7f5] p-0.5 text-xs font-semibold text-[#6a535b] shadow-inner shadow-[#f5d0ca]/30">
            <button
              onClick={() => setViewMode('day')}
              className={`rounded-xl px-3 py-1.5 transition-all ${
                viewMode === 'day'
                  ? 'bg-[#f86f6a] text-white shadow-[0_8px_20px_rgba(248,111,106,0.25)]'
                  : 'hover:bg-[#ffe9e6]'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`rounded-xl px-3 py-1.5 transition-all ${
                viewMode === 'week'
                  ? 'bg-[#f86f6a] text-white shadow-[0_8px_20px_rgba(248,111,106,0.25)]'
                  : 'hover:bg-[#ffe9e6]'
              }`}
            >
              Week
            </button>
          </div>
        </div>

        <div className="flex w-full items-center justify-end gap-3 md:w-auto">
          {activeTimer.blockId && (
            <div className="flex items-center gap-2 rounded-2xl border border-[#f0c0bb] bg-[#fff2f1] px-3 py-1.5 shadow-[0_8px_18px_rgba(238,115,116,0.09)]">
              <Clock className="h-4 w-4 text-[#d75a60] animate-spin" style={{ animationDuration: '4s' }} />
              <div className="flex flex-col text-left">
                <span className="max-w-[110px] truncate text-[10px] font-medium uppercase tracking-[0.18em] text-[#8d6670]">
                  {activeTimer.blockTitle}
                </span>
                <span className="font-mono text-xs font-bold text-[#2e1d23] tracking-wider">
                  {formatTimer(activeTimer.elapsedSeconds)}
                </span>
              </div>
              <div className="ml-1 flex items-center gap-1">
                {activeTimer.isRunning ? (
                  <button
                    onClick={pauseStudyTimer}
                    className="rounded-lg bg-[#f8dcdc] p-1 text-[#8d3e4b] hover:bg-[#f6c7c5]"
                    title="Pause Stopwatch"
                  >
                    <Pause className="h-3 w-3" />
                  </button>
                ) : (
                  <button
                    onClick={resumeStudyTimer}
                    className="rounded-lg bg-[#f6beaa] p-1 text-[#692b33] hover:bg-[#f2a793]"
                    title="Resume Stopwatch"
                  >
                    <Play className="h-3 w-3" />
                  </button>
                )}
                <button
                  onClick={handleStopTimer}
                  className="rounded-lg bg-[#f8c7d0] p-1 text-[#7b2e3d] hover:bg-[#f5b2bf]"
                  title="Finish and Save Study Session"
                >
                  <Square className="h-3 w-3 fill-current" />
                </button>
              </div>
            </div>
          )}

          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-right">
              <p className="font-mono text-sm font-bold tracking-wider text-[#2e1d23]">{format(currentTime, 'HH:mm:ss')}</p>
              <p className="text-[9px] uppercase tracking-[0.16em] text-[#8d6670]">Local time</p>
            </div>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="hidden items-center gap-1.5 rounded-xl border border-[#f1d8d3] bg-[#fff9f8] px-3 py-1.5 text-xs font-semibold text-[#4f3740] transition hover:border-[#e9b5b1] hover:bg-[#fff1ef] md:flex"
          >
            <SettingsIcon className="h-3.5 w-3.5 text-[#c0625d]" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
