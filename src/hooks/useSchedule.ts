import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured, localStore, supabase } from '../lib/supabase';
import { ActivityDebt, BlockStatus, NutritionLog, Profile, ScheduleBlock } from '../types/database';
import { RecoveryStrategy } from '../types/rebalance';
import { MOCK_USER_ID } from '../lib/mockData';

export const QUERY_KEYS = {
  profile: ['profile'],
  blocks: (date?: string) => ['schedule_blocks', date ?? 'all'],
  nutritionLogs: (date?: string) => ['nutrition_logs', date ?? 'all'],
  debts: ['activity_debts'],
  activities: ['activities'],
};

// 1. Profile Hook
export function useProfile() {
  const queryClient = useQueryClient();

  const query = useQuery<Profile>({
    queryKey: QUERY_KEYS.profile,
    queryFn: async () => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('profiles').select('*').single();
        if (error) throw error;
        return data;
      }
      return localStore.getProfile();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', MOCK_USER_ID)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      return localStore.updateProfile(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
    },
  });

  return { ...query, updateProfile: updateMutation.mutateAsync };
}

// 2. Schedule Blocks Hook
export function useScheduleBlocks(dateStr?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<ScheduleBlock[]>({
    queryKey: QUERY_KEYS.blocks(dateStr),
    queryFn: async () => {
      if (isSupabaseConfigured && supabase) {
        let queryBuilder = supabase.from('schedule_blocks').select('*').order('start_time', { ascending: true });
        if (dateStr) {
          const dayStart = `${dateStr}T00:00:00.000Z`;
          const dayEnd = `${dateStr}T23:59:59.999Z`;
          queryBuilder = queryBuilder.gte('start_time', dayStart).lte('start_time', dayEnd);
        }
        const { data, error } = await queryBuilder;
        if (error) throw error;
        return data;
      }
      const all = localStore.getBlocks();
      if (!dateStr) return all;
      return all.filter((b) => b.start_time.startsWith(dateStr));
    },
  });

  const updateBlockMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ScheduleBlock> }) => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('schedule_blocks')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      return localStore.updateBlock(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule_blocks'] });
    },
  });

  const createBlockMutation = useMutation({
    mutationFn: async (block: Omit<ScheduleBlock, 'id' | 'created_at'>) => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('schedule_blocks')
          .insert(block)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      return localStore.addBlock(block);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule_blocks'] });
    },
  });

  return {
    ...query,
    updateBlock: updateBlockMutation.mutateAsync,
    createBlock: createBlockMutation.mutateAsync,
  };
}

// 3. Nutrition Logs Hook
export function useNutritionLogs(dateStr?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<NutritionLog[]>({
    queryKey: QUERY_KEYS.nutritionLogs(dateStr),
    queryFn: async () => {
      if (isSupabaseConfigured && supabase) {
        let qb = supabase.from('nutrition_logs').select('*');
        if (dateStr) qb = qb.eq('date', dateStr);
        const { data, error } = await qb;
        if (error) throw error;
        return data;
      }
      const all = localStore.getNutritionLogs();
      if (!dateStr) return all;
      return all.filter((m) => m.date === dateStr);
    },
  });

  const updateMealMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<NutritionLog> }) => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('nutrition_logs')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      return localStore.updateNutritionLog(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition_logs'] });
    },
  });

  const createMealMutation = useMutation({
    mutationFn: async (meal: Omit<NutritionLog, 'id'>) => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('nutrition_logs')
          .insert(meal)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      return localStore.addNutritionLog(meal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition_logs'] });
    },
  });

  return {
    ...query,
    updateMeal: updateMealMutation.mutateAsync,
    createMeal: createMealMutation.mutateAsync,
  };
}

// 4. Activity Debts Hook
export function useActivityDebts() {
  const queryClient = useQueryClient();

  const query = useQuery<ActivityDebt[]>({
    queryKey: QUERY_KEYS.debts,
    queryFn: async () => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('activity_debts')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      }
      return localStore.getDebts();
    },
  });

  const createDebtMutation = useMutation({
    mutationFn: async (debt: Omit<ActivityDebt, 'id' | 'created_at'>) => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('activity_debts')
          .insert(debt)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      return localStore.addDebt(debt);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.debts });
    },
  });

  const resolveDebtMutation = useMutation({
    mutationFn: async ({ debtId, status = 'resolved' }: { debtId: string; status?: 'resolved' | 'forgiven' }) => {
      const updates = {
        status,
        resolved_at: new Date().toISOString(),
      };
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('activity_debts')
          .update(updates)
          .eq('id', debtId)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      return localStore.updateDebt(debtId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.debts });
    },
  });

  return {
    ...query,
    createDebt: createDebtMutation.mutateAsync,
    resolveDebt: resolveDebtMutation.mutateAsync,
  };
}

// 5. Unified Strategy Executor Hook
export function useApplyRecoveryStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (strategy: RecoveryStrategy) => {
      const { actionType, payload } = strategy;
      const debtId = payload.debtId;

      switch (actionType) {
        case 'even_split': {
          // Update targets for upcoming meals
          if (payload.evenSplitAdditions && payload.evenSplitAdditions.length > 0) {
            for (const item of payload.evenSplitAdditions) {
              if (isSupabaseConfigured && supabase) {
                await supabase
                  .from('nutrition_logs')
                  .update({ target_calories: item.newTarget })
                  .eq('id', item.mealId);
              } else {
                localStore.updateNutritionLog(item.mealId, { target_calories: item.newTarget });
              }
            }
          }
          break;
        }

        case 'evening_snack': {
          if (payload.snackSlot) {
            const snackLog = {
              user_id: MOCK_USER_ID,
              date: payload.snackSlot.date,
              meal_type: 'snack' as const,
              target_calories: payload.snackSlot.calories,
              actual_calories: null,
              status: 'pending' as const,
              window_start: payload.snackSlot.startTime,
              window_end: payload.snackSlot.endTime,
            };
            if (isSupabaseConfigured && supabase) {
              await supabase.from('nutrition_logs').insert(snackLog);
            } else {
              localStore.addNutritionLog(snackLog);
            }

            // Also create a visible calendar block for the snack window
            const snackBlock: Omit<ScheduleBlock, 'id' | 'created_at'> = {
              user_id: MOCK_USER_ID,
              activity_id: null,
              title: `Evening Snack (${payload.snackSlot.calories} kcal Buffer)`,
              category: 'meal',
              start_time: `${payload.snackSlot.date}T${payload.snackSlot.startTime}:00.000Z`,
              end_time: `${payload.snackSlot.date}T${payload.snackSlot.endTime}:00.000Z`,
              target_value: payload.snackSlot.calories,
              actual_value: 0,
              status: 'scheduled',
              is_buffer: true,
              reschedule_metadata: { source_debt_id: debtId },
            };
            if (isSupabaseConfigured && supabase) {
              await supabase.from('schedule_blocks').insert(snackBlock);
            } else {
              localStore.addBlock(snackBlock);
            }
          }
          break;
        }

        case 'accept_deficit': {
          // Intentionally keep future targets intact
          break;
        }

        case 'spread_academic': {
          if (payload.spreadDistributions && payload.spreadDistributions.length > 0) {
            for (const dist of payload.spreadDistributions) {
              const updates = {
                target_value: dist.newTargetMinutes,
                end_time: dist.newEndTime,
                reschedule_metadata: { added_recovery_minutes: dist.addedMinutes },
              };
              if (isSupabaseConfigured && supabase) {
                await supabase.from('schedule_blocks').update(updates).eq('id', dist.targetBlockId);
              } else {
                localStore.updateBlock(dist.targetBlockId, updates);
              }
            }
          }
          break;
        }

        case 'weekend_buffer': {
          if (payload.bufferSlot) {
            const bufferBlock: Omit<ScheduleBlock, 'id' | 'created_at'> = {
              user_id: MOCK_USER_ID,
              activity_id: null,
              title: payload.bufferSlot.title,
              category: 'academic',
              start_time: payload.bufferSlot.startTime,
              end_time: payload.bufferSlot.endTime,
              target_value: payload.bufferSlot.durationMinutes,
              actual_value: 0,
              status: 'scheduled',
              is_buffer: true,
              reschedule_metadata: { source_debt_id: debtId },
            };
            if (isSupabaseConfigured && supabase) {
              await supabase.from('schedule_blocks').insert(bufferBlock);
            } else {
              localStore.addBlock(bufferBlock);
            }
          }
          break;
        }

        case 'forgive_academic':
        case 'forgive_fitness': {
          // Will be marked as 'forgiven' below
          break;
        }

        case 'fitness_reschedule': {
          if (payload.fitnessRescheduleSlot) {
            const fitBlock: Omit<ScheduleBlock, 'id' | 'created_at'> = {
              user_id: MOCK_USER_ID,
              activity_id: null,
              title: payload.fitnessRescheduleSlot.title,
              category: 'fitness',
              start_time: payload.fitnessRescheduleSlot.startTime,
              end_time: payload.fitnessRescheduleSlot.endTime,
              target_value: payload.fitnessRescheduleSlot.durationMinutes,
              actual_value: 0,
              status: 'scheduled',
              is_buffer: true,
              reschedule_metadata: { source_debt_id: debtId },
            };
            if (isSupabaseConfigured && supabase) {
              await supabase.from('schedule_blocks').insert(fitBlock);
            } else {
              localStore.addBlock(fitBlock);
            }
          }
          break;
        }
      }

      // Mark the debt as resolved or forgiven
      if (debtId) {
        const finalStatus = actionType.startsWith('forgive_') || actionType === 'accept_deficit'
          ? 'forgiven'
          : 'resolved';

        const debtUpdates = {
          status: finalStatus as any,
          resolved_at: new Date().toISOString(),
        };

        if (isSupabaseConfigured && supabase) {
          await supabase.from('activity_debts').update(debtUpdates).eq('id', debtId);
        } else {
          localStore.updateDebt(debtId, debtUpdates);
        }
      }

      return strategy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule_blocks'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition_logs'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.debts });
    },
  });
}
