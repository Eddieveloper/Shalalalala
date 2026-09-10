import React from 'react';
import { Activity, BookOpen, CheckCircle2, Flame, HeartPulse } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { useNutritionLogs, useScheduleBlocks } from '../hooks/useSchedule';

export const InsightsPage: React.FC = () => {
  const { data: blocks = [] } = useScheduleBlocks();
  const { data: meals = [] } = useNutritionLogs();
  const weekStart = subDays(new Date(), 6);
  const recent = blocks.filter((block) => parseISO(block.start_time) >= weekStart);
  const completed = recent.filter((block) => block.status === 'completed').length;
  const studyMinutes = recent.filter((block) => block.category === 'academic').reduce((sum, block) => sum + (block.actual_value || 0), 0);
  const scheduledMinutes = recent.filter((block) => block.category === 'academic').reduce((sum, block) => sum + block.target_value, 0);
  const calories = meals.filter((meal) => meal.date >= format(weekStart, 'yyyy-MM-dd')).reduce((sum, meal) => sum + (meal.actual_calories || 0), 0);

  const stats = [{ label: 'Study this week', value: `${(studyMinutes / 60).toFixed(1)}h`, note: `${Math.round((studyMinutes / Math.max(1, scheduledMinutes)) * 100)}% of planned time`, icon: BookOpen }, { label: 'Activities completed', value: `${completed}`, note: `${recent.length} scheduled this week`, icon: CheckCircle2 }, { label: 'Calories logged', value: `${calories}`, note: 'Across logged meals', icon: Flame }, { label: 'Consistency', value: recent.length ? `${Math.round((completed / recent.length) * 100)}%` : '—', note: 'Completed vs scheduled', icon: HeartPulse }];

  return <section className="page-panel"><div className="page-heading"><div><p className="page-kicker">Insights</p><h1>Your week, at a glance</h1><p>Simple patterns from the last seven days.</p></div><Activity className="page-heading-mark" /></div><div className="insight-grid">{stats.map(({ label, value, note, icon: Icon }) => <article className="insight-stat" key={label}><Icon className="h-5 w-5" /><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</div><div className="insight-note"><strong>Keep the signal useful.</strong><span>As you add more blocks, this page will show steadier patterns in study, movement, meals, and recovery.</span></div></section>;
};