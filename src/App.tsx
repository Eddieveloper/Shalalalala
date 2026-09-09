import React from 'react';
import { Header } from './components/Header';
import { DashboardBanner } from './components/DashboardBanner';
import { ActionRequiredBanner } from './components/ActionRequiredBanner';
import { TimelineGrid } from './components/TimelineGrid';
import { RecoveryModal } from './components/RecoveryModal';
import { QuickLogDrawer } from './components/QuickLogDrawer';
import { SettingsModal } from './components/SettingsModal';
import { useMissedDetector } from './hooks/useMissedDetector';

export const AppContent: React.FC = () => {
  // Activate missed activity detection engine hook
  useMissedDetector();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Fixed Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Action Required Banner for Pending Missed Debts */}
        <ActionRequiredBanner />

        {/* Dashboard Top Summary Banner */}
        <DashboardBanner />

        {/* Calendar Timeline Grid (24-hour day or 7-day week view) */}
        <TimelineGrid />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-500">
        <p className="max-w-xl mx-auto">
          Rebalance Productivity Engine • Automatic Academic Debt Amortization & Caloric Recovery Engine • Powered by React, Tailwind CSS, Zustand, TanStack Query & Supabase.
        </p>
      </footer>

      {/* Modals and Drawers */}
      <RecoveryModal />
      <QuickLogDrawer />
      <SettingsModal />
    </div>
  );
};

export default AppContent;
