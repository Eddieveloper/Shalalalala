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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,171,160,0.18),_transparent_24%),linear-gradient(180deg,_#fffaf8_0%,_#fff3f0_100%)] text-[var(--ink)] flex flex-col selection:bg-pink-200 selection:text-[#4a252d]">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-4 lg:px-8">
        <Header />

        <main className="flex-1 w-full py-6 space-y-6">
          <ActionRequiredBanner />
          <DashboardBanner />
          <TimelineGrid />
        </main>

        <footer className="border-t border-[#f2d6d1] py-6 px-2 text-center text-xs tracking-[0.18em] uppercase text-[#7a5a61]">
          <p className="mx-auto max-w-3xl">
            Rebalanced • Coral Journal • Academic debt, calories, and recovery in one front page.
          </p>
        </footer>
      </div>

      <RecoveryModal />
      <QuickLogDrawer />
      <SettingsModal />
    </div>
  );
};

export default AppContent;
