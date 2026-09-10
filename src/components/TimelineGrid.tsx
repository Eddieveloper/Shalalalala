import React, { useEffect, useState } from 'react';
import {
  format,
  parseISO,
  startOfWeek,
  addDays,
  differenceInMinutes,
  isSameDay,
  getHours,
  getMinutes,
} from 'date-fns';
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  MoreVertical,
  Plus,
  Play,
  RotateCcw,
  Sparkles,
  Utensils,
  XCircle,
} from 'lucide-react';
import { ScheduleBlock, ActivityCategory, BlockStatus } from '../types/database';
import { useScheduleBlocks } from '../hooks/useSchedule';
import { useRebalanceStore } from '../store/useRebalanceStore';
import { TimeWheelPicker } from './TimeControls';
import { useSubjects } from '../hooks/useSchedule';

export const TimelineGrid: React.FC = () => {
  const selectedDate = useRebalanceStore((s) => s.selectedDate);
  const viewMode = useRebalanceStore((s) => s.viewMode);
  const setSelectedDate = useRebalanceStore((s) => s.setSelectedDate);
  const openQuickLog = useRebalanceStore((s) => s.openQuickLog);
  const startStudyTimer = useRebalanceStore((s) => s.startStudyTimer);

  const { data: allBlocks = [], updateBlock, createBlock, deleteBlock } = useScheduleBlocks();
    const { data: subjects = [] } = useSubjects();
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [newBlock, setNewBlock] = useState({
    title: '',
    category: 'academic' as ActivityCategory,
    startTime: '09:00',
    endTime: '10:00',
    targetValue: '60',
  });

  // Active quick action popover menu
  const [activeMenuBlockId, setActiveMenuBlockId] = useState<string | null>(null);

  useEffect(() => {
    const openAddBlock = () => setIsAddingBlock(true);
    window.addEventListener('open-add-block', openAddBlock);
    return () => window.removeEventListener('open-add-block', openAddBlock);
  }, []);

  const currentDateObj = parseISO(selectedDate);

  // Category visual color mappings
  const getCategoryTheme = (category: ActivityCategory, isBuffer: boolean = false) => {
    switch (category) {
      case 'academic':
        return {
          bg: 'bg-[#fdf2f5] hover:bg-[#fceef2]',
          border: isBuffer ? 'border-dashed border-[#ef9cb1]' : 'border-[#f0c7d4] hover:border-[#ea9db4]',
          text: 'text-[#3b212a]',
          badge: 'bg-[#ffe7f0] text-[#c86289] border-[#f0bfd5]',
          accent: 'bg-[#d96a8d]',
          icon: BookOpen,
          unit: 'min',
        };
      case 'fitness':
        return {
          bg: 'bg-[#fff8f4] hover:bg-[#fff1ed]',
          border: isBuffer ? 'border-dashed border-[#efae9c]' : 'border-[#f4d7cf] hover:border-[#eb9d8c]',
          text: 'text-[#3d2f2d]',
          badge: 'bg-[#fff1eb] text-[#d46d5d] border-[#f1d0c5]',
          accent: 'bg-[#e27b66]',
          icon: Dumbbell,
          unit: 'min',
        };
      case 'meal':
        return {
          bg: 'bg-[#fffaf3] hover:bg-[#fff3dd]',
          border: isBuffer ? 'border-dashed border-[#e9c07a]' : 'border-[#f1d88a] hover:border-[#e4b95f]',
          text: 'text-[#3a2d1f]',
          badge: 'bg-[#fff4d9] text-[#b77c24] border-[#f0d89e]',
          accent: 'bg-[#d39a3f]',
          icon: Utensils,
          unit: 'kcal',
        };
    }
  };

  const getStatusBadge = (status: BlockStatus) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: CheckCircle2,
        };
      case 'missed':
        return {
          label: 'Missed (In Debt)',
          className: 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse-subtle',
          icon: XCircle,
        };
      case 'compensated':
        return {
          label: 'Rebalanced',
          className: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          icon: Sparkles,
        };
      case 'scheduled':
      default:
        return {
          label: 'Scheduled',
          className: 'bg-slate-700/50 text-slate-300 border-slate-600',
          icon: Clock,
        };
    }
  };

  // Block quick actions
  const handleComplete = async (block: ScheduleBlock, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveMenuBlockId(null);
    await updateBlock({
      id: block.id,
      updates: {
        status: 'completed',
        actual_value: block.target_value,
      },
    });
  };

  const handleMarkMissed = async (block: ScheduleBlock, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveMenuBlockId(null);
    await updateBlock({
      id: block.id,
      updates: {
        status: 'missed',
        actual_value: 0,
      },
    });
  };

  const handleCustomLog = (block: ScheduleBlock, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveMenuBlockId(null);
    const type = block.category === 'academic' ? 'study' : block.category === 'fitness' ? 'workout' : 'meal';
    openQuickLog({ type, block });
  };

  const handleBlockClick = (block: ScheduleBlock) => setEditingBlock(block);

  const handleSaveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingBlock) return;
    const form = new FormData(event.currentTarget);
    await updateBlock({ id: editingBlock.id, updates: { title: String(form.get('title')), start_time: `${selectedDate}T${String(form.get('start'))}:00.000Z`, end_time: `${selectedDate}T${String(form.get('end'))}:00.000Z`, target_value: Number(form.get('target')) || 0, status: form.get('status') as BlockStatus } });
    setEditingBlock(null);
  };

  const handleStartTimer = (block: ScheduleBlock, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveMenuBlockId(null);
    startStudyTimer(block);
  };

  const handleCreateBlock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newBlock.title.trim()) return;
    const form = event.currentTarget as HTMLFormElement;

    await createBlock({
      user_id: '00000000-0000-0000-0000-000000000001',
      activity_id: null,
      title: newBlock.title.trim(),
      category: newBlock.category,
        subject_id: newBlock.category === 'academic' ? (String(new FormData(form).get('subjectId') || '') || null) : null,
      start_time: `${selectedDate}T${newBlock.startTime}:00.000Z`,
      end_time: `${selectedDate}T${newBlock.endTime}:00.000Z`,
      target_value: Number(newBlock.targetValue) || 0,
      actual_value: 0,
      status: 'scheduled',
      is_buffer: false,
      reschedule_metadata: {},
    });
    setNewBlock((current) => ({ ...current, title: '' }));
    setIsAddingBlock(false);
  };

  // Day View Render (24-hour vertical timeline)
  const renderDayView = () => {
    const dayBlocks = allBlocks
      .filter((b) => isSameDay(parseISO(b.start_time), currentDateObj))
      .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());

    // 24 hours (00:00 to 23:00)
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="relative rounded-[28px] border border-[#f3d7d4] bg-white/85 p-4 shadow-[0_18px_50px_rgba(204,153,153,0.09)] lg:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-[#f5dfe1] pb-4">
          <div>
            <h2 className="flex items-center gap-2 text-3xl font-bold text-[#2c1c21]">
              <span>{format(currentDateObj, 'EEEE, MMMM do, yyyy')}</span>
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#8d666d]">({dayBlocks.length} planned activities)</span>
            </h2>
            <p className="mt-1 text-xs text-[#7a5d62]">
              {dayBlocks.length === 0 ? 'Your day is open. Add the first block when you are ready.' : 'Click any block to log progress, start a timer, or mark it complete.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
            <button
              onClick={() => setIsAddingBlock((value) => !value)}
              className="flex items-center gap-1.5 rounded-xl bg-[#f86f6a] px-3 py-2 font-bold text-white transition hover:bg-[#ee6963]"
            >
              <Plus className="h-3.5 w-3.5" /> Add block
            </button>
          </div>
        </div>

        {isAddingBlock && (
          <form onSubmit={handleCreateBlock} className="schedule-add-popover mb-5 grid gap-3 rounded-2xl border border-[#ead5d1] bg-[#fffdfa] p-4 shadow-[0_18px_40px_rgba(87,52,57,0.14)] md:grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.7fr_auto] md:items-end">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#765c64]">
              Block name
              <input required value={newBlock.title} onChange={(event) => setNewBlock({ ...newBlock, title: event.target.value })} placeholder="Study, meal, workout..." className="mt-1 w-full rounded-lg border border-[#efd6d2] bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-[#2f1d23] outline-none focus:border-[#e39b97]" />
            </label>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#765c64]">
              Category
              <select value={newBlock.category} onChange={(event) => setNewBlock({ ...newBlock, category: event.target.value as ActivityCategory })} className="mt-1 w-full rounded-lg border border-[#efd6d2] bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-[#2f1d23] outline-none focus:border-[#e39b97]"><option value="academic">Academic</option><option value="fitness">Fitness</option><option value="meal">Meal</option></select>
            </label>
            {newBlock.category === 'academic' && <label className="text-[11px] font-bold uppercase tracking-wider text-[#765c64]">Subject<select name="subjectId" className="mt-1 w-full rounded-lg border border-[#efd6d2] bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-[#2f1d23] outline-none focus:border-[#e39b97]"><option value="">No subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>}
            <TimeWheelPicker label="Start" value={newBlock.startTime} onChange={(startTime) => setNewBlock({ ...newBlock, startTime })} />
            <TimeWheelPicker label="End" value={newBlock.endTime} onChange={(endTime) => setNewBlock({ ...newBlock, endTime })} />
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#765c64]">Target<input type="number" min="0" value={newBlock.targetValue} onChange={(event) => setNewBlock({ ...newBlock, targetValue: event.target.value })} className="mt-1 w-full rounded-lg border border-[#efd6d2] bg-white px-3 py-2 font-mono text-sm font-normal tracking-normal text-[#2f1d23] outline-none focus:border-[#e39b97]" /></label>
            <button type="submit" className="rounded-lg bg-[#b7d9c2] px-3 py-2 text-xs font-bold text-[#2d1d22]">Create</button>
          </form>
        )}

        {dayBlocks.length === 0 ? (
          <div className="schedule-empty-state" role="button" tabIndex={0} onClick={() => setIsAddingBlock(true)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setIsAddingBlock(true); }}>
            <p>Nothing planned yet</p>
            <span>Start by adding a class, study session, meal, or workout.</span>
          </div>
        ) : (
        <div className="relative divide-y divide-[#f3dfe1]">
          {hours.map((hour) => {
            // Find blocks that fall within or start in this hour
            const matchingBlocks = dayBlocks.filter((b) => {
              const startH = getHours(parseISO(b.start_time));
              return startH === hour;
            });

            return (
              <div key={hour} className="group relative flex items-start gap-4 py-3 min-h-[64px] hover:bg-slate-800/20 transition-colors rounded-lg px-2">
                {/* Time Axis Column */}
                <div className="w-16 shrink-0 pt-0.5 text-right font-mono text-xs font-semibold text-[#9a707a] transition-colors group-hover:text-[#573b43]">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>

                {/* Blocks Container */}
                <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {matchingBlocks.map((block) => {
                    const theme = getCategoryTheme(block.category, block.is_buffer);
                    const statusTheme = getStatusBadge(block.status);
                    const durationMins = differenceInMinutes(parseISO(block.end_time), parseISO(block.start_time));
                    const isMenuOpen = activeMenuBlockId === block.id;

                    return (
                      <div
                        key={block.id}
                        onClick={() => handleBlockClick(block)}
                        className={`calendar-block group/card relative cursor-pointer border p-3 shadow-[0_6px_18px_rgba(192,136,131,0.06)] transition-all hover:-translate-y-0.5 ${theme.bg} ${theme.border}`}
                        style={{ minHeight: `${Math.max(64, durationMins * 1.05)}px` }}
                      >
                        <span className={`calendar-block-accent ${theme.accent}`} />
                        {/* Buffer badge */}
                        {block.is_buffer && (
                          <div className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Rebalance Buffer
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`rounded-xl border p-1.5 ${theme.badge}`}>
                              <theme.icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="break-words text-sm font-bold leading-snug text-[#2d1d23] tracking-tight">
                                {block.title}
                              </h4>
                              {block.subject_id && <p className="mt-0.5 text-[10px] font-semibold text-[#9a6574]">{subjects.find((subject) => subject.id === block.subject_id)?.name}</p>}
                              <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-[#7f636b]">
                                <span>{format(parseISO(block.start_time), 'h:mm a')} – {format(parseISO(block.end_time), 'h:mm a')}</span>
                                <span>•</span>
                                <span>{durationMins}m duration</span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions Dropdown Trigger */}
                          <div className="block-actions relative">
                            <button onClick={(e) => handleComplete(block, e)} className="block-action block-action-check" title="Mark complete" aria-label="Mark complete"><Check className="h-3.5 w-3.5" /></button>
                            <button onClick={(e) => handleMarkMissed(block, e)} className="block-action block-action-close" title="Mark missed" aria-label="Mark missed"><XCircle className="h-3.5 w-3.5" /></button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingBlock(block);
                              }}
                              className="block-action block-action-more"
                              title="Block Options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                          </div>
                        </div>

                        {/* Bottom Row: Values & Status Badge */}
                        <div className="mt-3 flex items-center justify-between border-t border-[#eedfe0] pt-2">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-[#7d646c]">Progress:</span>
                            <span className="font-mono font-bold text-[#2b1a20]">
                              {block.actual_value || 0}
                            </span>
                            <span className="text-[#7d646c]">/ {block.target_value} {theme.unit}</span>
                          </div>

                          <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusTheme.className}`}>
                            <statusTheme.icon className="h-3 w-3" />
                            <span>{statusTheme.label}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        )}

        {editingBlock && <div className="block-edit-overlay" onClick={() => setEditingBlock(null)}><form className="block-edit-dialog" onSubmit={handleSaveEdit} onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><p className="page-kicker">Edit block</p><h3>{editingBlock.title}</h3></div><button type="button" onClick={() => setEditingBlock(null)}>Close</button></div><label>Title<input name="title" defaultValue={editingBlock.title} /></label><div className="grid grid-cols-2 gap-3"><label>Start<input name="start" type="time" defaultValue={format(parseISO(editingBlock.start_time), 'HH:mm')} /></label><label>End<input name="end" type="time" defaultValue={format(parseISO(editingBlock.end_time), 'HH:mm')} /></label></div><label>Target<input name="target" type="number" defaultValue={editingBlock.target_value} /></label><label>Status<select name="status" defaultValue={editingBlock.status}><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="missed">Missed</option></select></label><div className="flex justify-between gap-2"><button type="button" className="text-[#c55b62]" onClick={async () => { await deleteBlock(editingBlock.id); setEditingBlock(null); }}>Delete block</button><button type="submit" className="rounded-lg bg-[#f86f6a] px-4 py-2 text-xs font-bold text-white">Save changes</button></div></form></div>}
      </div>
    );
  };

  // Week View Render (7 columns)
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDateObj, { weekStartsOn: 1 }); // Monday start
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 lg:p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">
              Week of {format(weekStart, 'MMM d, yyyy')}
            </h2>
            <p className="text-xs text-slate-400">
              Overview of university study loads, fitness volume, and meal windows across the 7-day cycle.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, currentDateObj);
            const dayBlocks = allBlocks
              .filter((b) => isSameDay(parseISO(b.start_time), day))
              .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());

            return (
              <div
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                className={`rounded-xl p-3 border transition-all cursor-pointer flex flex-col min-h-[360px] ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500 shadow-cyan-950/40 shadow-lg'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Column Day Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <div className="text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      {format(day, 'EEE')}
                    </span>
                    <span className={`text-base font-extrabold ${isToday ? 'text-cyan-400' : 'text-white'}`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                    {dayBlocks.length}
                  </span>
                </div>

                {/* Day Blocks List */}
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {dayBlocks.length === 0 ? (
                    <div className="text-[11px] text-slate-600 italic text-center py-6">
                      No blocks scheduled
                    </div>
                  ) : (
                    dayBlocks.map((b) => {
                      const theme = getCategoryTheme(b.category, b.is_buffer);
                      return (
                        <div
                          key={b.id}
                          className={`rounded-lg p-2 border text-xs text-left ${theme.bg} ${theme.border} hover:scale-[1.02] transition-transform`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span>{format(parseISO(b.start_time), 'HH:mm')}</span>
                            <span className="uppercase font-bold tracking-wider">{b.status}</span>
                          </div>
                          <p className="font-semibold text-white line-clamp-1">{b.title}</p>
                          <div className="text-[10px] text-slate-300 mt-1 flex justify-between">
                            <span>Target: {b.target_value}</span>
                            <span>Done: {b.actual_value}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return viewMode === 'day' ? renderDayView() : renderWeekView();
};
