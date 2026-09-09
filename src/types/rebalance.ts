import { ActivityCategory, ActivityDebt, BlockStatus, DebtCategory, NutritionLog, ScheduleBlock } from './database';

export type RecoveryActionType =
  // Nutrition strategies
  | 'even_split'
  | 'evening_snack'
  | 'accept_deficit'
  // Academic strategies
  | 'spread_academic'
  | 'weekend_buffer'
  | 'forgive_academic'
  // Fitness strategies
  | 'fitness_reschedule'
  | 'fitness_split'
  | 'forgive_fitness';

export interface RecoveryStrategy {
  id: string;
  title: string;
  badge: string;
  description: string;
  impact: string;
  actionType: RecoveryActionType;
  payload: {
    debtId?: string;
    blockId?: string;
    deficit: number;
    category: DebtCategory;
    // Specific payloads
    evenSplitAdditions?: { mealId: string; mealType: string; addCalories: number; newTarget: number }[];
    snackSlot?: {
      date: string;
      calories: number;
      startTime: string;
      endTime: string;
    };
    spreadDistributions?: {
      targetBlockId: string;
      targetBlockTitle: string;
      addedMinutes: number;
      newTargetMinutes: number;
      newEndTime: string;
    }[];
    bufferSlot?: {
      date: string;
      startTime: string;
      endTime: string;
      durationMinutes: number;
      title: string;
    };
    fitnessRescheduleSlot?: {
      date: string;
      startTime: string;
      endTime: string;
      durationMinutes: number;
      title: string;
    };
    [key: string]: any;
  };
}

export interface PendingRecoveryPrompt {
  id: string; // unique prompt id
  debtId: string;
  sourceBlockId?: string | null;
  nutritionLogId?: string | null;
  title: string;
  category: DebtCategory;
  deficitAmount: number;
  unit: string; // 'min' or 'kcal'
  missedTimeDisplay: string;
  strategies: RecoveryStrategy[];
  rawBlock?: ScheduleBlock;
  rawMeal?: NutritionLog;
}

export interface FreeSlot {
  start: Date;
  end: Date;
  durationMinutes: number;
  dateStr: string;
  isWeekend: boolean;
  isEvening: boolean;
}

export interface DaySummaryStats {
  date: string;
  caloriesConsumed: number;
  calorieTarget: number;
  studyMinutesCompleted: number;
  studyMinutesTarget: number;
  fitnessCompletedCount: number;
  fitnessScheduledCount: number;
  unresolvedDebtsCount: number;
}
