import React from 'react';
import { format } from 'date-fns';
import { useRebalanceStore } from '../store/useRebalanceStore';
import { useScheduleBlocks } from '../hooks/useSchedule';

export const DailyBloom: React.FC = () => {
  const selectedDate = useRebalanceStore((state) => state.selectedDate);
  const setSelectedDate = useRebalanceStore((state) => state.setSelectedDate);
  const date = new Date(`${selectedDate}T12:00:00`);
  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
  const { data: blocks = [] } = useScheduleBlocks(selectedDate);
  const completedTasks = blocks.filter((block) => block.status === 'completed').length;
  const progress = blocks.length > 0 ? completedTasks / blocks.length : 0;

  return (
    <section className="daily-briefing" aria-label="Daily briefing">
      <div>
        <p className="daily-briefing-kicker">{isToday ? 'Today' : 'Selected day'}</p>
        <h2>{format(date, 'EEEE, MMMM d')}</h2>
        <p className="daily-briefing-state">{blocks.length === 0 ? 'Your day is currently open.' : `${completedTasks} of ${blocks.length} task${blocks.length === 1 ? '' : 's'} complete.`}</p>
      </div>
      <div
        className="briefing-flower"
        aria-hidden="true"
        style={{
          '--tulip-progress': progress,
          '--stem-progress': Math.min(1, Math.max(0, (progress - 0.08) / 0.3)),
          '--leaf-progress': Math.min(1, Math.max(0, (progress - 0.34) / 0.28)),
          '--flower-progress': Math.min(1, Math.max(0, (progress - 0.62) / 0.38)),
        } as React.CSSProperties}
      >
        <span className="tulip-ground" />
        <span className="tulip-seed" />
        <span className="tulip-stem" />
        <span className="tulip-leaf tulip-leaf-left" />
        <span className="tulip-leaf tulip-leaf-right" />
        <span className="tulip-bloom tulip-bloom-left" />
        <span className="tulip-bloom tulip-bloom-center" />
        <span className="tulip-bloom tulip-bloom-right" />
      </div>
      {!isToday && <button className="daily-briefing-today" onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}>Back to today</button>}
    </section>
  );
};
