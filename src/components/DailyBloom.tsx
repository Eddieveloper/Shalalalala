import React from 'react';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { useRebalanceStore } from '../store/useRebalanceStore';

export const DailyBloom: React.FC = () => {
  const selectedDate = useRebalanceStore((state) => state.selectedDate);
  const setSelectedDate = useRebalanceStore((state) => state.setSelectedDate);
  const date = new Date(`${selectedDate}T12:00:00`);
  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

  return (
    <section className="daily-briefing" aria-label="Daily briefing">
      <div>
        <p className="daily-briefing-kicker">{isToday ? 'Today' : 'Selected day'}</p>
        <h2>{format(date, 'EEEE, MMMM d')}</h2>
        <p className="daily-briefing-state">Your day is currently open.</p>
        <button className="daily-briefing-action" onClick={() => window.dispatchEvent(new CustomEvent('open-add-block'))}>
          <Plus className="h-4 w-4" /> Add your first block
        </button>
      </div>
      <div className="briefing-flower" aria-hidden="true"><span>✿</span></div>
      {!isToday && <button className="daily-briefing-today" onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}>Back to today</button>}
    </section>
  );
};
