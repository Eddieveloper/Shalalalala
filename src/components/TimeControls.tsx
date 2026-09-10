import React, { useEffect, useState } from 'react';
import { Globe2, Sun } from 'lucide-react';

interface TimeWheelPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function shiftTime(value: string, amount: number) {
  const [hours, minutes] = value.split(':').map(Number);
  const total = (hours * 60 + minutes + amount + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export const TimeWheelPicker: React.FC<TimeWheelPickerProps> = ({ label, value, onChange }) => {
  const [isRolling, setIsRolling] = useState(false);

  const handleWheel = (event: React.WheelEvent<HTMLInputElement>) => {
    event.preventDefault();
    onChange(shiftTime(value, event.deltaY > 0 ? 15 : -15));
    setIsRolling(true);
  };

  useEffect(() => {
    if (!isRolling) return;
    const timer = window.setTimeout(() => setIsRolling(false), 320);
    return () => window.clearTimeout(timer);
  }, [isRolling, value]);

  return (
    <label className="time-wheel-label">
      <span>{label}</span>
      <span className={`time-wheel-shell ${isRolling ? 'time-wheel-rolling' : ''}`}>
        <span className="time-wheel-mark">↕</span>
        <input
          type="time"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onWheel={handleWheel}
          onKeyDown={(event) => {
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
              event.preventDefault();
              onChange(shiftTime(value, event.key === 'ArrowUp' ? -15 : 15));
              setIsRolling(true);
            }
          }}
          className="time-wheel-input"
          aria-label={`${label} time. Scroll to adjust by 15 minutes.`}
        />
      </span>
    </label>
  );
};

export const EarthSunClock: React.FC = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const angle = (minutes / 1440) * 360 - 90;

  return (
    <div className="earth-sun-clock" aria-label={`Local time ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}>
      <div className="earth-clock-orbit"><span className="earth-clock-sun" style={{ transform: `rotate(${angle}deg) translateX(42px) rotate(${-angle}deg)` }}><Sun /></span></div>
      <div className="earth-clock-globe"><Globe2 /></div>
      <span className="earth-clock-time">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  );
};