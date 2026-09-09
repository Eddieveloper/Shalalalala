import { NutritionLog } from '../types/database';
import { RecoveryStrategy } from '../types/rebalance';

export interface NutritionStrategyInput {
  missedMeal: NutritionLog;
  remainingMealsToday: NutritionLog[];
  currentDate?: string;
  debtId?: string;
}

/**
 * Calculates net calorie deficit for a meal log.
 */
export function calculateMealDeficit(targetCalories: number, actualCalories: number | null | undefined): number {
  const actual = actualCalories ?? 0;
  return Math.max(0, targetCalories - actual);
}

/**
 * Generates 3 deterministic recovery strategies for missed or deficient nutrition windows.
 */
export function calculateNutritionStrategies(input: NutritionStrategyInput): RecoveryStrategy[] {
  const { missedMeal, remainingMealsToday, debtId } = input;
  const deficit = calculateMealDeficit(missedMeal.target_calories, missedMeal.actual_calories);

  if (deficit <= 0) {
    return [];
  }

  const strategies: RecoveryStrategy[] = [];

  // Strategy 1: Even Split across remaining meals today
  if (remainingMealsToday.length > 0) {
    const splitCount = remainingMealsToday.length;
    const addPerMeal = Math.round(deficit / splitCount);

    const evenSplitAdditions = remainingMealsToday.map((m) => ({
      mealId: m.id,
      mealType: m.meal_type,
      addCalories: addPerMeal,
      newTarget: m.target_calories + addPerMeal,
    }));

    strategies.push({
      id: `strat-nutri-split-${missedMeal.id}`,
      title: 'Even Split Across Upcoming Meals',
      badge: `+${addPerMeal} kcal / meal`,
      description: `Amortize the ${deficit} kcal deficit evenly across your ${splitCount} remaining meal${splitCount > 1 ? 's' : ''} today (${remainingMealsToday.map((m) => m.meal_type).join(', ')}).`,
      impact: `Prevents sudden binge eating while ensuring your 100% daily metabolic target is met.`,
      actionType: 'even_split',
      payload: {
        debtId,
        deficit,
        category: 'nutrition',
        evenSplitAdditions,
      },
    });
  } else {
    // If no remaining meals today, offer rollover to tomorrow's breakfast
    strategies.push({
      id: `strat-nutri-rollover-${missedMeal.id}`,
      title: 'Breakfast Macro Bump Tomorrow',
      badge: `+${deficit} kcal tomorrow`,
      description: `All meal windows for today have passed. Add ${deficit} kcal to tomorrow morning's breakfast window to restore net weekly balance.`,
      impact: 'Restores glycogen reserves without late-night digestive stress.',
      actionType: 'even_split',
      payload: {
        debtId,
        deficit,
        category: 'nutrition',
        rolloverBreakfast: true,
      },
    });
  }

  // Strategy 2: Consolidated Evening Snack Window
  const snackCalories = deficit;
  const snackWindowStart = '21:00';
  const snackWindowEnd = '21:45';

  strategies.push({
    id: `strat-nutri-snack-${missedMeal.id}`,
    title: 'Consolidated Evening Snack Slot',
    badge: `${snackCalories} kcal buffer`,
    description: `Create a dedicated nutrient-dense evening snack slot between ${snackWindowStart} and ${snackWindowEnd} for ${snackCalories} kcal (e.g. Greek yogurt, oats, whey protein, or peanut butter toast).`,
    impact: 'Consolidates the deficit into a single focused recovery window before sleep.',
    actionType: 'evening_snack',
    payload: {
      debtId,
      deficit,
      category: 'nutrition',
      snackSlot: {
        date: missedMeal.date,
        calories: snackCalories,
        startTime: snackWindowStart,
        endTime: snackWindowEnd,
      },
    },
  });

  // Strategy 3: Accept Deficit (Fasting / Cutting Mode)
  strategies.push({
    id: `strat-nutri-accept-${missedMeal.id}`,
    title: 'Accept Deficit (Intermittent Fast / Cut)',
    badge: 'Preserve Deficit',
    description: `Acknowledge the missed meal as an accidental fasting window or caloric cut of ${deficit} kcal. Future meal targets remain unchanged.`,
    impact: 'Zero schedule disruptions. Ideal if your current fitness goal prioritizes fat loss or light digestion.',
    actionType: 'accept_deficit',
    payload: {
      debtId,
      deficit,
      category: 'nutrition',
    },
  });

  return strategies;
}
