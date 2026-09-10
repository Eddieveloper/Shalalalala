import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { EarthSunClock } from './TimeControls';

const BLOOM_DURATION_MS = 10 * 60 * 1000;

function getDailyBloomStart(dateKey: string) {
  const storageKey = `rebalance_daily_bloom_v2_${dateKey}`;
  const savedStart = window.localStorage.getItem(storageKey);
  if (savedStart) return Number(savedStart);

  const start = Date.now();
  window.localStorage.setItem(storageKey, String(start));
  return start;
}

export const DailyBloom: React.FC = () => {
  const [now, setNow] = useState(() => new Date());
  const dateKey = format(now, 'yyyy-MM-dd');
  const [bloomStart, setBloomStart] = useState<number | null>(null);

  useEffect(() => {
    setBloomStart(getDailyBloomStart(dateKey));
  }, [dateKey]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (bloomStart === null) return null;

  const progress = Math.min(1, Math.max(0, (now.getTime() - bloomStart) / BLOOM_DURATION_MS));
  const percent = Math.round(progress * 100);
  const isComplete = progress >= 1;
  const stage = isComplete ? 'In full bloom' : progress < 0.34 ? 'Opening gently' : progress < 0.7 ? 'Unfurling' : 'Nearly there';
  const remainingMinutes = Math.max(0, Math.ceil((BLOOM_DURATION_MS - (now.getTime() - bloomStart)) / 60000));

  return (
    <section className="daily-bloom" aria-label="Daily flower bloom">
      <div className="bloom-copy">
        <div className="bloom-kicker">Today&apos;s small ritual</div>
        <h2>Give the day a little room to bloom.</h2>
        <p>{isComplete ? 'You gave it time. It is fully here.' : `${stage}. Come back in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'} to see it open further.`}</p>
        <div className="bloom-progress-row">
          <div className="bloom-progress-track"><span style={{ width: `${percent}%` }} /></div>
          <strong>{percent}%</strong>
        </div>
      </div>

      <EarthSunClock />

      <div className={`bloom-illustration ${isComplete ? 'bloom-complete' : ''}`} style={{ '--bloom-progress': progress } as React.CSSProperties} aria-hidden="true">
        <div className="bloom-sun" />
        <div className="bloom-flower">
          <span className="petal petal-a" />
          <span className="petal petal-b" />
          <span className="petal petal-c" />
          <span className="petal petal-d" />
          <span className="petal petal-e" />
          <span className="flower-center" />
        </div>
        <div className="bloom-stem" />
        <div className="bloom-leaf bloom-leaf-left" />
        <div className="bloom-leaf bloom-leaf-right" />
      </div>
    </section>
  );
};