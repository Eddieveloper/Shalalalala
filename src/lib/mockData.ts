import { addDays, format, subDays, subMinutes } from 'date-fns';
import { Activity, ActivityDebt, NutritionLog, Profile, ScheduleBlock } from '../types/database';

export const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

export const initialProfile: Profile = {
  id: MOCK_USER_ID,
  daily_calorie_target: 2200,
  sleep_start_time: '23:00',
  sleep_end_time: '07:00',
  max_daily_study_minutes: 360,
  created_at: new Date().toISOString(),
};

export const initialActivities: Activity[] = [
  {
    id: 'act-1',
    user_id: MOCK_USER_ID,
    title: 'Data Structures & Algorithms',
    category: 'academic',
    target_value: 90, // 90 mins
    is_compensable: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'act-2',
    user_id: MOCK_USER_ID,
    title: 'Computer Systems & Assembly',
    category: 'academic',
    target_value: 60,
    is_compensable: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'act-3',
    user_id: MOCK_USER_ID,
    title: 'Discrete Mathematics & Logic',
    category: 'academic',
    target_value: 60,
    is_compensable: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'act-4',
    user_id: MOCK_USER_ID,
    title: 'Upper Body Hypertrophy',
    category: 'fitness',
    target_value: 60,
    is_compensable: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'act-5',
    user_id: MOCK_USER_ID,
    title: 'Campus 5km Aerobic Run',
    category: 'fitness',
    target_value: 45,
    is_compensable: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'act-6',
    user_id: MOCK_USER_ID,
    title: 'High-Protein Breakfast',
    category: 'meal',
    target_value: 550,
    is_compensable: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'act-7',
    user_id: MOCK_USER_ID,
    title: 'Nutrient-Dense Lunch',
    category: 'meal',
    target_value: 750,
    is_compensable: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'act-8',
    user_id: MOCK_USER_ID,
    title: 'Post-Workout Dinner',
    category: 'meal',
    target_value: 800,
    is_compensable: true,
    created_at: new Date().toISOString(),
  },
];

export function generateInitialScheduleAndLogs(baseDate: Date = new Date()): {
  blocks: ScheduleBlock[];
  nutritionLogs: NutritionLog[];
  debts: ActivityDebt[];
} {
  const dateStr = format(baseDate, 'yyyy-MM-dd');
  const now = baseDate;

  // Helper to construct ISO strings on baseDate
  const makeTime = (hours: number, minutes: number, dayOffset: number = 0): string => {
    const d = addDays(baseDate, dayOffset);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  // Schedule blocks for today
  const blocks: ScheduleBlock[] = [
    {
      id: 'block-today-1',
      user_id: MOCK_USER_ID,
      activity_id: 'act-6',
      title: 'Breakfast Window (Oatmeal, Eggs & Berries)',
      category: 'meal',
      start_time: makeTime(8, 0),
      end_time: makeTime(8, 45),
      target_value: 550,
      actual_value: 580,
      status: 'completed',
      is_buffer: false,
      reschedule_metadata: {},
      created_at: now.toISOString(),
    },
    {
      id: 'block-today-2',
      user_id: MOCK_USER_ID,
      activity_id: 'act-1',
      title: 'Data Structures (Graph Traversal & BFS)',
      category: 'academic',
      start_time: makeTime(9, 30),
      end_time: makeTime(11, 0),
      target_value: 90,
      actual_value: 90,
      status: 'completed',
      is_buffer: false,
      reschedule_metadata: {},
      created_at: now.toISOString(),
    },
    {
      id: 'block-today-3',
      user_id: MOCK_USER_ID,
      activity_id: 'act-7',
      title: 'Lunch Window (Chicken Rice Bowl)',
      category: 'meal',
      start_time: makeTime(12, 15),
      end_time: makeTime(13, 0),
      target_value: 750,
      actual_value: 0,
      // Intentionally set as missed to demonstrate the rebalancing engine immediately!
      status: 'missed',
      is_buffer: false,
      reschedule_metadata: { missed_reason: 'Lecture ran overtime' },
      created_at: now.toISOString(),
    },
    {
      id: 'block-today-4',
      user_id: MOCK_USER_ID,
      activity_id: 'act-3',
      title: 'Discrete Math (Combinatorics & Induction)',
      category: 'academic',
      start_time: makeTime(14, 0),
      end_time: makeTime(15, 0),
      target_value: 60,
      actual_value: 0,
      // Intentionally set as missed to showcase the Academic Debt Amortization engine!
      status: 'missed',
      is_buffer: false,
      reschedule_metadata: { missed_reason: 'Student council emergency meeting' },
      created_at: now.toISOString(),
    },
    {
      id: 'block-today-5',
      user_id: MOCK_USER_ID,
      activity_id: 'act-4',
      title: 'Upper Body Hypertrophy (Chest & Back)',
      category: 'fitness',
      start_time: makeTime(16, 30),
      end_time: makeTime(17, 30),
      target_value: 60,
      actual_value: 0,
      status: 'scheduled',
      is_buffer: false,
      reschedule_metadata: {},
      created_at: now.toISOString(),
    },
    {
      id: 'block-today-6',
      user_id: MOCK_USER_ID,
      activity_id: 'act-8',
      title: 'Dinner Window (Salmon & Sweet Potato)',
      category: 'meal',
      start_time: makeTime(19, 0),
      end_time: makeTime(20, 0),
      target_value: 800,
      actual_value: 0,
      status: 'scheduled',
      is_buffer: false,
      reschedule_metadata: {},
      created_at: now.toISOString(),
    },
    {
      id: 'block-today-7',
      user_id: MOCK_USER_ID,
      activity_id: 'act-2',
      title: 'Computer Systems (Cache Memory Architecture)',
      category: 'academic',
      start_time: makeTime(20, 30),
      end_time: makeTime(21, 30),
      target_value: 60,
      actual_value: 0,
      status: 'scheduled',
      is_buffer: false,
      reschedule_metadata: {},
      created_at: now.toISOString(),
    },
    // Tomorrow upcoming blocks for spreading
    {
      id: 'block-tmrw-1',
      user_id: MOCK_USER_ID,
      activity_id: 'act-3',
      title: 'Discrete Math (Graph Coloring)',
      category: 'academic',
      start_time: makeTime(10, 0, 1),
      end_time: makeTime(11, 0, 1),
      target_value: 60,
      actual_value: 0,
      status: 'scheduled',
      is_buffer: false,
      reschedule_metadata: {},
      created_at: now.toISOString(),
    },
    {
      id: 'block-tmrw-2',
      user_id: MOCK_USER_ID,
      activity_id: 'act-1',
      title: 'Data Structures (Dynamic Programming)',
      category: 'academic',
      start_time: makeTime(14, 0, 1),
      end_time: makeTime(15, 30, 1),
      target_value: 90,
      actual_value: 0,
      status: 'scheduled',
      is_buffer: false,
      reschedule_metadata: {},
      created_at: now.toISOString(),
    },
    {
      id: 'block-tmrw-3',
      user_id: MOCK_USER_ID,
      activity_id: 'act-3',
      title: 'Discrete Math (Recurrence Relations)',
      category: 'academic',
      start_time: makeTime(16, 0, 2),
      end_time: makeTime(17, 0, 2),
      target_value: 60,
      actual_value: 0,
      status: 'scheduled',
      is_buffer: false,
      reschedule_metadata: {},
      created_at: now.toISOString(),
    },
  ];

  // Nutrition logs for today
  const nutritionLogs: NutritionLog[] = [
    {
      id: 'nutri-today-1',
      user_id: MOCK_USER_ID,
      date: dateStr,
      meal_type: 'breakfast',
      target_calories: 550,
      actual_calories: 580,
      status: 'logged',
      window_start: '08:00',
      window_end: '08:45',
    },
    {
      id: 'nutri-today-2',
      user_id: MOCK_USER_ID,
      date: dateStr,
      meal_type: 'lunch',
      target_calories: 750,
      actual_calories: null,
      status: 'skipped',
      window_start: '12:15',
      window_end: '13:00',
    },
    {
      id: 'nutri-today-3',
      user_id: MOCK_USER_ID,
      date: dateStr,
      meal_type: 'dinner',
      target_calories: 800,
      actual_calories: null,
      status: 'pending',
      window_start: '19:00',
      window_end: '20:00',
    },
    {
      id: 'nutri-today-4',
      user_id: MOCK_USER_ID,
      date: dateStr,
      meal_type: 'snack',
      target_calories: 100,
      actual_calories: null,
      status: 'pending',
      window_start: '21:00',
      window_end: '21:30',
    },
  ];

  // Initial unresolved activity debts matching the missed items
  const debts: ActivityDebt[] = [
    {
      id: 'debt-initial-1',
      user_id: MOCK_USER_ID,
      source_block_id: 'block-today-4',
      category: 'academic',
      deficit_amount: 60, // 60 minutes missed Discrete Math
      status: 'unresolved',
      resolved_at: null,
      created_at: subMinutes(now, 45).toISOString(),
    },
    {
      id: 'debt-initial-2',
      user_id: MOCK_USER_ID,
      source_block_id: 'block-today-3',
      category: 'nutrition',
      deficit_amount: 750, // 750 kcal missed Lunch
      status: 'unresolved',
      resolved_at: null,
      created_at: subMinutes(now, 90).toISOString(),
    },
  ];

  return { blocks, nutritionLogs, debts };
}
