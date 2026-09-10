import React from 'react';
import { Check, CircleAlert, Clock3 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useActivityDebts, useScheduleBlocks } from '../hooks/useSchedule';

export const ActivityPage: React.FC = () => {
  const { data: blocks = [] } = useScheduleBlocks();
  const { data: debts = [] } = useActivityDebts();
  const ordered = [...blocks].sort((a, b) => parseISO(b.start_time).getTime() - parseISO(a.start_time).getTime());

  return <section className="page-panel">
    <div className="page-heading"><div><p className="page-kicker">Activity</p><h1>What you&apos;ve done</h1><p>Completed and missed blocks stay here so the day remains visible.</p></div><span className="page-count">{ordered.length} total</span></div>
    {debts.filter((debt) => debt.status === 'unresolved').length > 0 && <div className="activity-debt-note"><CircleAlert className="h-4 w-4" /> {debts.filter((debt) => debt.status === 'unresolved').length} item(s) need attention from earlier days.</div>}
    <div className="activity-list">
      {ordered.length === 0 ? <div className="page-empty"><Clock3 className="h-5 w-5" /><p>No activity yet.</p><span>Your completed and missed blocks will appear here.</span></div> : ordered.map((block) => <article key={block.id} className={`activity-row ${block.status}`}><div className={`activity-status ${block.status === 'completed' ? 'is-complete' : ''}`}>{block.status === 'completed' ? <Check className="h-4 w-4" /> : <span />}</div><div className="activity-row-main"><strong>{block.title}</strong><span>{format(parseISO(block.start_time), 'MMM d')} · {format(parseISO(block.start_time), 'h:mm a')}–{format(parseISO(block.end_time), 'h:mm a')}</span></div><span className="activity-category">{block.category}</span><span className="activity-state">{block.status}</span></article>)}
    </div>
  </section>;
};