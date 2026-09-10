import React from 'react';
import { BarChart3, CalendarDays, ClipboardList, LayoutGrid, Settings, Sparkles } from 'lucide-react';
import { useRebalanceStore } from '../store/useRebalanceStore';

export const Sidebar: React.FC = () => {
  const setIsSettingsOpen = useRebalanceStore((state) => state.setIsSettingsOpen);
  const activePage = useRebalanceStore((state) => state.activePage);
  const setActivePage = useRebalanceStore((state) => state.setActivePage);

  return (
    <aside className="dashboard-sidebar hidden lg:flex">
      <div className="sidebar-logo" aria-label="Rebalanced">
        <img src="/rebalance-logo-pink.png" alt="Rebalanced logo" />
      </div>

      <nav className="sidebar-nav" aria-label="Dashboard sections">
        <button onClick={() => setActivePage('today')} className={`sidebar-button ${activePage === 'today' ? 'sidebar-button-active' : ''}`} title="Today" aria-label="Today">
          <LayoutGrid className="h-[18px] w-[18px]" />
          <span>Today</span>
        </button>
        <button onClick={() => setActivePage('calendar')} className={`sidebar-button ${activePage === 'calendar' ? 'sidebar-button-active' : ''}`} title="Calendar" aria-label="Calendar">
          <CalendarDays className="h-[18px] w-[18px]" />
          <span>Calendar</span>
        </button>
        <button onClick={() => setActivePage('activity')} className={`sidebar-button ${activePage === 'activity' ? 'sidebar-button-active' : ''}`} title="Activity" aria-label="Activity">
          <ClipboardList className="h-[18px] w-[18px]" />
          <span>Activity</span>
        </button>
        <button onClick={() => setActivePage('insights')} className={`sidebar-button ${activePage === 'insights' ? 'sidebar-button-active' : ''}`} title="Insights" aria-label="Insights">
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