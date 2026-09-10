import React from 'react';
import { BarChart3, CalendarDays, ClipboardList, LayoutGrid, Settings, Sparkles } from 'lucide-react';
import { useRebalanceStore } from '../store/useRebalanceStore';

export const Sidebar: React.FC = () => {
  const setIsSettingsOpen = useRebalanceStore((state) => state.setIsSettingsOpen);

  return (
    <aside className="dashboard-sidebar hidden lg:flex">
      <div className="sidebar-logo" aria-label="Rebalanced">
        <img src="/rebalance-logo-pink.png" alt="Rebalanced logo" />
      </div>

      <nav className="sidebar-nav" aria-label="Dashboard sections">
        <button className="sidebar-button sidebar-button-active" title="Today" aria-label="Today">
          <LayoutGrid className="h-[18px] w-[18px]" />
          <span>Today</span>
        </button>
        <button className="sidebar-button" title="Calendar" aria-label="Calendar">
          <CalendarDays className="h-[18px] w-[18px]" />
          <span>Calendar</span>
        </button>
        <button className="sidebar-button" title="Activity" aria-label="Activity">
          <ClipboardList className="h-[18px] w-[18px]" />
          <span>Activity</span>
        </button>
        <button className="sidebar-button" title="Insights" aria-label="Insights">
          <BarChart3 className="h-[18px] w-[18px]" />
          <span>Insights</span>
        </button>
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-pulse" aria-hidden="true"><Sparkles className="h-4 w-4" /></div>
        <button
          className="sidebar-button"
          title="Settings"
          aria-label="Settings"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings className="h-[18px] w-[18px]" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};