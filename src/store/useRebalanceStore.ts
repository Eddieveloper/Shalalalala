import { create } from 'zustand';
import { format } from 'date-fns';
import { NutritionLog, ScheduleBlock } from '../types/database';
import { PendingRecoveryPrompt } from '../types/rebalance';

interface QuickLogState {
  isOpen: boolean;
  type: 'study' | 'workout' | 'meal' | null;
  block: ScheduleBlock | null;
  meal: NutritionLog | null;
}

interface ActiveStudyTimer {
  blockId: string | null;
  blockTitle: string | null;
  elapsedSeconds: number;
  isRunning: boolean;
}

interface RebalanceStoreState {
  // Calendar & View State
  selectedDate: string; // 'yyyy-MM-dd'
  viewMode: 'day' | 'week';
  isSettingsOpen: boolean;

  // Recovery Engine & Prompts
  activePrompt: PendingRecoveryPrompt | null;
  promptQueue: PendingRecoveryPrompt[];
  isRecoveryModalOpen: boolean;

  // Quick Log Drawer
  quickLog: QuickLogState;

  // Active Study Timer
  activeTimer: ActiveStudyTimer;

  // Selected Block Detail
  selectedBlock: ScheduleBlock | null;

  // Actions
  setSelectedDate: (date: string) => void;
  setViewMode: (mode: 'day' | 'week') => void;
  setIsSettingsOpen: (open: boolean) => void;
  setSelectedBlock: (block: ScheduleBlock | null) => void;

  // Recovery Prompt Actions
  enqueuePrompt: (prompt: PendingRecoveryPrompt) => void;
  dequeuePrompt: () => void;
  openRecoveryModal: (prompt: PendingRecoveryPrompt) => void;
  closeRecoveryModal: () => void;
  clearPrompt: (promptId: string) => void;

  // Quick Log Actions
  openQuickLog: (params: {
    type: 'study' | 'workout' | 'meal';
    block?: ScheduleBlock | null;
    meal?: NutritionLog | null;
  }) => void;
  closeQuickLog: () => void;

  // Active Timer Actions
  startStudyTimer: (block: ScheduleBlock) => void;
  pauseStudyTimer: () => void;
  resumeStudyTimer: () => void;
  stopStudyTimer: () => { blockId: string | null; elapsedMinutes: number };
  tickStudyTimer: () => void;
}

export const useRebalanceStore = create<RebalanceStoreState>((set, get) => ({
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  viewMode: 'day',
  isSettingsOpen: false,

  activePrompt: null,
  promptQueue: [],
  isRecoveryModalOpen: false,

  quickLog: {
    isOpen: false,
    type: null,
    block: null,
    meal: null,
  },

  activeTimer: {
    blockId: null,
    blockTitle: null,
    elapsedSeconds: 0,
    isRunning: false,
  },

  selectedBlock: null,

  setSelectedDate: (date) => set({ selectedDate: date }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setSelectedBlock: (block) => set({ selectedBlock: block }),

  enqueuePrompt: (prompt) => {
    const { promptQueue, activePrompt } = get();
    // Prevent duplicate prompts for the same debt
    const alreadyExists = promptQueue.some((p) => p.debtId === prompt.debtId) || activePrompt?.debtId === prompt.debtId;
    if (alreadyExists) return;

    if (!activePrompt) {
      set({ activePrompt: prompt, isRecoveryModalOpen: true });
    } else {
      set({ promptQueue: [...promptQueue, prompt] });
    }
  },

  dequeuePrompt: () => {
    const { promptQueue } = get();
    if (promptQueue.length > 0) {
      const [next, ...rest] = promptQueue;
      set({ activePrompt: next, promptQueue: rest, isRecoveryModalOpen: true });
    } else {
      set({ activePrompt: null, isRecoveryModalOpen: false });
    }
  },

  openRecoveryModal: (prompt) => {
    set({ activePrompt: prompt, isRecoveryModalOpen: true });
  },

  closeRecoveryModal: () => {
    set({ isRecoveryModalOpen: false });
  },

  clearPrompt: (promptId) => {
    const { promptQueue, activePrompt, dequeuePrompt } = get();
    if (activePrompt?.id === promptId) {
      dequeuePrompt();
    } else {
      set({ promptQueue: promptQueue.filter((p) => p.id !== promptId) });
    }
  },

  openQuickLog: ({ type, block = null, meal = null }) => {
    set({
      quickLog: {
        isOpen: true,
        type,
        block,
        meal,
      },
    });
  },

  closeQuickLog: () => {
    set((state) => ({
      quickLog: {
        ...state.quickLog,
        isOpen: false,
      },
    }));
  },

  startStudyTimer: (block) => {
    set({
      activeTimer: {
        blockId: block.id,
        blockTitle: block.title,
        elapsedSeconds: (block.actual_value || 0) * 60,
        isRunning: true,
      },
    });
  },

  pauseStudyTimer: () => {
    set((state) => ({
      activeTimer: {
        ...state.activeTimer,
        isRunning: false,
      },
    }));
  },

  resumeStudyTimer: () => {
    set((state) => ({
      activeTimer: {
        ...state.activeTimer,
        isRunning: true,
      },
    }));
  },

  stopStudyTimer: () => {
    const { activeTimer } = get();
    const minutes = Math.round(activeTimer.elapsedSeconds / 60);
    const blockId = activeTimer.blockId;
    set({
      activeTimer: {
        blockId: null,
        blockTitle: null,
        elapsedSeconds: 0,
        isRunning: false,
      },
    });
    return { blockId, elapsedMinutes: minutes };
  },

  tickStudyTimer: () => {
    set((state) => {
      if (!state.activeTimer.isRunning) return state;
      return {
        activeTimer: {
          ...state.activeTimer,
          elapsedSeconds: state.activeTimer.elapsedSeconds + 1,
        },
      };
    });
  },
}));
