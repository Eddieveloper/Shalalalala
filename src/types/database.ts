export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ActivityCategory = 'academic' | 'fitness' | 'meal';
export type DebtCategory = 'academic' | 'fitness' | 'nutrition';
export type BlockStatus = 'scheduled' | 'completed' | 'missed' | 'compensated';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealStatus = 'pending' | 'logged' | 'skipped';
export type DebtStatus = 'unresolved' | 'resolved' | 'forgiven';

export interface Profile {
  id: string;
  daily_calorie_target: number;
  sleep_start_time: string; // 'HH:mm'
  sleep_end_time: string;   // 'HH:mm'
  max_daily_study_minutes: number;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  title: string;
  category: ActivityCategory;
  target_value: number; // minutes or calories
  is_compensable: boolean;
  created_at: string;
}

export interface UniversitySubject {
  id: string;
  user_id: string;
  name: string;
  course_code: string;
  professor: string | null;
  credits: number;
  color: string;
  created_at: string;
}

export interface ScheduleBlock {
  id: string;
  user_id: string;
  activity_id: string | null;
  subject_id?: string | null;
  title: string;
  category: ActivityCategory;
  start_time: string; // ISO 8601 string
  end_time: string;   // ISO 8601 string
  target_value: number;
  actual_value: number;
  status: BlockStatus;
  is_buffer: boolean;
  reschedule_metadata: Json;
  created_at: string;
}

export interface NutritionLog {
  id: string;
  user_id: string;
  date: string; // 'YYYY-MM-DD'
  meal_type: MealType;
  target_calories: number;
  actual_calories: number | null;
  status: MealStatus;
  window_start: string; // 'HH:mm'
  window_end: string;   // 'HH:mm'
}

export interface ActivityDebt {
  id: string;
  user_id: string;
  source_block_id: string | null;
  category: DebtCategory;
  deficit_amount: number;
  status: DebtStatus;
  resolved_at: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      activities: {
        Row: Activity;
        Insert: Omit<Activity, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Activity>;
      };
      university_subjects: {
        Row: UniversitySubject;
        Insert: Omit<UniversitySubject, 'id' | 'created_at'> & { id?: string };
        Update: Partial<UniversitySubject>;
      };
      schedule_blocks: {
        Row: ScheduleBlock;
        Insert: Omit<ScheduleBlock, 'id' | 'created_at'> & { id?: string };
        Update: Partial<ScheduleBlock>;
      };
      nutrition_logs: {
        Row: NutritionLog;
        Insert: Omit<NutritionLog, 'id'> & { id?: string };
        Update: Partial<NutritionLog>;
      };
      activity_debts: {
        Row: ActivityDebt;
        Insert: Omit<ActivityDebt, 'id' | 'created_at'> & { id?: string };
        Update: Partial<ActivityDebt>;
      };
    };
  };
}
