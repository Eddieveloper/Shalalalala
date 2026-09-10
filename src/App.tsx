import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { DashboardBanner } from './components/DashboardBanner';
import { ActionRequiredBanner } from './components/ActionRequiredBanner';
import { TimelineGrid } from './components/TimelineGrid';
import { RecoveryModal } from './components/RecoveryModal';
import { QuickLogDrawer } from './components/QuickLogDrawer';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { DailyBloom } from './components/DailyBloom';
import { useMissedDetector } from './hooks/useMissedDetector';
import { useScheduleReminders } from './hooks/useScheduleReminders';
import { ActivityPage } from './components/ActivityPage';
import { InsightsPage } from './components/InsightsPage';
import { useRebalanceStore } from './store/useRebalanceStore';

export const AppContent: React.FC = () => {
  const [isBooting, setIsBooting] = useState(true);
  const activePage = useRebalanceStore((state) => state.activePage);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsBooting(false), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  useMissedDetector();
  useScheduleReminders();

  return (
    <div className="app-shell min-h-screen text-[var(--ink)] flex flex-col selection:bg-pink-200 selection:text-[#4a252d]">
      {isBooting && (
        <div className="welcome-screen fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-[#fff8f7]">
          <div className="heart-field" aria-hidden="true">
            {['1', '2', '3', '4', '5', '6', '7', '8'].map((heart) => <span key={heart} className={`heart heart-${heart}`}>♥</span>)}
          </div>
          <div className="hello-screen relative z-10 px-7 py-5 text-center">
            <div className="hello-wave mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#f2c4ba] bg-[#fff0ef] text-2xl text-[#d06260] shadow-[0_10px_24px_rgba(195,127,126,0.14)]">♥</div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#9a7076]">A little room for your day</p>
            <h1 className="mt-2 text-5xl font-bold tracking-[-0.07em] text-[#2d1c22]">Hello Darylle!</h1>
            <p className="mt-3 text-sm text-[#8c6870]">Let&apos;s make today feel like yours.</p>
          </div>
        </div>
      )}

      <div className={isBooting ? 'pointer-events-none opacity-0' : 'opacity-100 transition-opacity duration-500'}>
        <div className="dashboard-layout mx-auto w-full max-w-[1600px] px-3 py-3 sm:px-5 lg:px-6">
          <Sidebar />

          <div className="dashboard-workspace">
          <Header />

          <main className="dashboard-content">
            {isBooting ? (
              <div className="dashboard-main-column space-y-4">
                <div className="skeleton h-20 w-full rounded-[24px]" />
                <div className="grid gap-5 md:grid-cols-3">
                  <div className="skeleton h-44 rounded-[24px]" />
                  <div className="skeleton h-44 rounded-[24px]" />
                  <div className="skeleton h-44 rounded-[24px]" />
                </div>
                <div className="skeleton h-[420px] w-full rounded-[28px]" />
              </div>
            ) : activePage === 'activity' ? <ActivityPage /> : activePage === 'insights' ? <InsightsPage /> : activePage === 'calendar' ? <section className="dashboard-schedule-column dashboard-calendar-page"><TimelineGrid /></section> : (
              <>
                <section className="dashboard-main-column">
                  <ActionRequiredBanner />
                  <DailyBloom />
                  <DashboardBanner />
                </section>
                <section className="dashboard-schedule-column">
                  <TimelineGrid />
                </section>
              </>
            )}
          </main>

          </div>
        </div>
      </div>

      <RecoveryModal />
      <QuickLogDrawer />
      <SettingsModal />
    </div>
  );
};

export default AppContent;
