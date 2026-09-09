import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  HelpCircle,
  Info,
  ShieldCheck,
  Sparkles,
  Utensils,
  X,
  Zap,
} from 'lucide-react';
import { useRebalanceStore } from '../store/useRebalanceStore';
import { useApplyRecoveryStrategy } from '../hooks/useSchedule';
import { RecoveryStrategy } from '../types/rebalance';

export const RecoveryModal: React.FC = () => {
  const isRecoveryModalOpen = useRebalanceStore((s) => s.isRecoveryModalOpen);
  const activePrompt = useRebalanceStore((s) => s.activePrompt);
  const promptQueue = useRebalanceStore((s) => s.promptQueue);
  const closeRecoveryModal = useRebalanceStore((s) => s.closeRecoveryModal);
  const dequeuePrompt = useRebalanceStore((s) => s.dequeuePrompt);

  const applyStrategyMutation = useApplyRecoveryStrategy();
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);

  if (!isRecoveryModalOpen || !activePrompt) {
    return null;
  }

  const { title, category, deficitAmount, unit, missedTimeDisplay, strategies } = activePrompt;

  const getCategoryDetails = () => {
    switch (category) {
      case 'academic':
        return {
          icon: BookOpen,
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          gradient: 'from-blue-600/20 to-cyan-500/10',
          deficitLabel: `-${deficitAmount} min study deficit`,
        };
      case 'fitness':
        return {
          icon: Dumbbell,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          gradient: 'from-emerald-600/20 to-teal-500/10',
          deficitLabel: `-${deficitAmount} min training deficit`,
        };
      case 'nutrition':
      default:
        return {
          icon: Utensils,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          gradient: 'from-amber-600/20 to-rose-500/10',
          deficitLabel: `-${deficitAmount} kcal metabolic deficit`,
        };
    }
  };

  const catDetails = getCategoryDetails();

  const handleSelectAndApply = async (strategy: RecoveryStrategy) => {
    setSelectedStrategyId(strategy.id);
    try {
      await applyStrategyMutation.mutateAsync(strategy);
      // Advance to next prompt in queue if available
      dequeuePrompt();
    } catch (err) {
      console.error('Failed to apply recovery strategy:', err);
    } finally {
      setSelectedStrategyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header Banner */}
        <div className={`p-6 border-b border-slate-800 bg-gradient-to-r ${catDetails.gradient} relative`}>
          <button
            onClick={closeRecoveryModal}
            className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Dismiss for now"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
              Activity Debt Detected
            </span>
            {promptQueue.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                +{promptQueue.length} more in queue
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {title}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Missed window: <span className="text-slate-300 font-semibold">{missedTimeDisplay}</span>
              </p>
            </div>

            {/* Exact Deficit Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-sm font-extrabold shadow-inner shrink-0">
              <catDetails.icon className="w-4 h-4 text-rose-400" />
              <span>{catDetails.deficitLabel}</span>
            </div>
          </div>
        </div>

        {/* Engine Sub-title */}
        <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-medium">
              Choose an automated recovery strategy to rebalance your schedule:
            </span>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            3 Deterministic Options
          </span>
        </div>

        {/* Strategy Cards Container */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {strategies.map((strategy, index) => {
            const isApplying = applyStrategyMutation.isPending && selectedStrategyId === strategy.id;

            return (
              <div
                key={strategy.id}
                className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/70 hover:border-cyan-500/60 rounded-2xl p-4 transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black flex items-center justify-center shrink-0">
                        {index + 1}
                      </div>
                      <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {strategy.title}
                      </h4>
                    </div>

                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shrink-0">
                      {strategy.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-3 pl-8">
                    {strategy.description}
                  </p>

                  <div className="pl-8 flex items-start gap-2 text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-300 font-semibold">Strategic Impact:</strong> {strategy.impact}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-end">
                  <button
                    disabled={applyStrategyMutation.isPending}
                    onClick={() => handleSelectAndApply(strategy)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isApplying ? (
                      <>
                        <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Applying Rebalance...</span>
                      </>
                    ) : (
                      <>
                        <span>Apply This Strategy</span>
                        <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Sleep window & burnout limits are strictly respected.
          </span>
          <button
            onClick={closeRecoveryModal}
            className="text-slate-400 hover:text-white font-medium transition-colors"
          >
            Decide Later
          </button>
        </div>
      </div>
    </div>
  );
};
