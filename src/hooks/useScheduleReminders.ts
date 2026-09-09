import { useEffect, useRef } from 'react';
import { addMinutes, format, isAfter, isBefore, parseISO } from 'date-fns';
import { useScheduleBlocks } from './useSchedule';

const REMINDER_WINDOW_MINUTES = 15;

export function useScheduleReminders() {
  const { data: blocks = [] } = useScheduleBlocks();
  const remindedBlocks = useRef(new Set<string>());

  useEffect(() => {
    const checkReminders = () => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (window.localStorage.getItem('rebalance_reminders_enabled') !== 'true') return;
      if (Notification.permission !== 'granted') return;

      const now = new Date();
      for (const block of blocks) {
        if (block.status !== 'scheduled' || remindedBlocks.current.has(block.id)) continue;
        const start = parseISO(block.start_time);
        if (isAfter(start, now) && isBefore(start, addMinutes(now, REMINDER_WINDOW_MINUTES))) {
          new Notification(`Coming up at ${format(start, 'h:mm a')}`, {
            body: block.title,
            tag: `rebalance-${block.id}`,
          });
          remindedBlocks.current.add(block.id);
        }
      }
    };

    checkReminders();
    const interval = window.setInterval(checkReminders, 30_000);
    return () => window.clearInterval(interval);
  }, [blocks]);
}