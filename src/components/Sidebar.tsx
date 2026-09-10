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
        <button className="sidebar-button sidebar-button-active" title="Overview" aria-label="Overview">
          <LayoutGrid className="h-[18px] w-[18px]" />
        </button>
        <button className="sidebar-button" title="Schedule" aria-label="Schedule">
          <CalendarDays className="h-[18px] w-[18px]" />
        </button>
        <button className="sidebar-button" title="Activity log" aria-label="Activity log">
          <ClipboardList className="h-[18px] w-[18px]" />
        </button>
        <button className="sidebar-button" title="Progress" aria-label="Progress">
          <BarChart3 className="h-[18px] w-[18px]" />
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
        </button>
      </div>
    </aside>
  );
};