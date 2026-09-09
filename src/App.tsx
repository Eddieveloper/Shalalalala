import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { DashboardBanner } from './components/DashboardBanner';
import { ActionRequiredBanner } from './components/ActionRequiredBanner';
import { TimelineGrid } from './components/TimelineGrid';
import { RecoveryModal } from './components/RecoveryModal';
import { QuickLogDrawer } from './components/QuickLogDrawer';
import { SettingsModal } from './components/SettingsModal';
import { useMissedDetector } from './hooks/useMissedDetector';

export const AppContent: React.FC = () => {
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsBooting(false), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  useMissedDetector();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#fffaf8_0%,_#fff4f2_100%)] text-[var(--ink)] flex flex-col selection:bg-pink-200 selection:text-[#4a252d]">
      {isBooting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#fff8f7]">
          <div className="hello-screen flex items-center gap-4 rounded-[30px] border border-[#f7d7d2] bg-white/85 px-7 py-5 shadow-[0_18px_40px_rgba(195,127,126,0.12)] backdrop-blur-sm">
            <div className="hello-wave flex h-10 w-10 items-center justify-center rounded-full border border-[#f2c4ba] bg-[#fff0ef] text-lg text-[#d06260]">👋</div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#9a7076]">Welcome back</p>
              <h1 className="text-4xl font-bold tracking-[-0.06em] text-[#2d1c22]">Hello Darylle!</h1>
            </div>
          </div>
        </div>
      )}

      <div className={isBooting ? 'pointer-events-none opacity-0' : 'opacity-100 transition-opacity duration-500'}>
        <div className="mx-auto w-full max-w-[1500px] px-4 py-4 lg:px-8">
          <Header />

          <main className="flex-1 w-full py-6 space-y-6">
            {isBooting ? (
              <div className="space-y-4">
                <div className="skeleton h-20 w-full rounded-[24px]" />
                <div className="grid gap-5 md:grid-cols-3">
                  <div className="skeleton h-44 rounded-[24px]" />
                  <div className="skeleton h-44 rounded-[24px]" />
                  <div className="skeleton h-44 rounded-[24px]" />
                </div>
                <div className="skeleton h-[420px] w-full rounded-[28px]" />
              </div>
            ) : (
              <>
                <ActionRequiredBanner />
                <DashboardBanner />
                <TimelineGrid />
              </>
            )}
          </main>

          <footer className="border-t border-[#f2d6d1] py-6 px-2 text-center text-[11px] tracking-[0.2em] uppercase text-[#7a5a61]">
            <p className="mx-auto max-w-3xl">
              Rebalanced • Coral Journal • Academic debt, calories, and recovery in one front page.
            </p>
          </footer>
        </div>
      </div>

      <RecoveryModal />
      <QuickLogDrawer />
      <SettingsModal />
    </div>
  );
};

export default AppContent;
