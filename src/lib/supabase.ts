import { createClient } from '@supabase/supabase-js';
import { Database, Profile, Activity, ScheduleBlock, NutritionLog, ActivityDebt, UniversitySubject } from '../types/database';
import { initialProfile, MOCK_USER_ID } from './mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://oorlrfbibvtnwnfoytis.supabase.co'
);

export const supabase: any = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!)
  : null;

// Local Storage Key constants
const STORAGE_KEYS = {
  PROFILE: 'rebalance_profile_v1',
  ACTIVITIES: 'rebalance_activities_v1',
  BLOCKS: 'rebalance_blocks_v1',
  NUTRITION: 'rebalance_nutrition_v1',
  DEBTS: 'rebalance_debts_v1',
  SUBJECTS: 'rebalance_subjects_v1',
};

/**
 * Local Data Store with fallback persistence to localStorage.
 * Ensures the app operates immediately and deterministically even without live Supabase credentials.
 */
class LocalDataStore {
  private profile: Profile;
  private activities: Activity[];
  private blocks: ScheduleBlock[];
  private nutritionLogs: NutritionLog[];
  private debts: ActivityDebt[];
  private subjects: UniversitySubject[];

  constructor() {
    this.profile = this.load(STORAGE_KEYS.PROFILE, initialProfile);
    this.activities = this.load(STORAGE_KEYS.ACTIVITIES, []);

    this.blocks = this.load(STORAGE_KEYS.BLOCKS, []);
    this.nutritionLogs = this.load(STORAGE_KEYS.NUTRITION, []);
    this.debts = this.load(STORAGE_KEYS.DEBTS, []);
    this.subjects = this.load(STORAGE_KEYS.SUBJECTS, []);

    const hasLegacyDemoBlocks = this.blocks.some(
      (block) => block.id.startsWith('block-today-') || block.id.startsWith('block-tmrw-')
    );
    if (hasLegacyDemoBlocks) {
      this.activities = [];
      this.blocks = [];
      this.nutritionLogs = [];
      this.debts = [];
      this.save(STORAGE_KEYS.ACTIVITIES, this.activities);
      this.save(STORAGE_KEYS.BLOCKS, this.blocks);
      this.save(STORAGE_KEYS.NUTRITION, this.nutritionLogs);
      this.save(STORAGE_KEYS.DEBTS, this.debts);
    }
  }

  private load<T>(key: string, fallback: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return fallback;
  }

  private save(key: string, data: any) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  // Profile operations
  getProfile(): Profile {
    return { ...this.profile };
  }

  updateProfile(updates: Partial<Profile>): Profile {
    this.profile = { ...this.profile, ...updates };
    this.save(STORAGE_KEYS.PROFILE, this.profile);
    return { ...this.profile };
  }

  // Activities
  getActivities(): Activity[] {
    return [...this.activities];
  }

  // Schedule Blocks
  getBlocks(): ScheduleBlock[] {
    return [...this.blocks];
  }

  addBlock(block: Omit<ScheduleBlock, 'id' | 'created_at'>): ScheduleBlock {
    const newBlock: ScheduleBlock = {
      ...block,
      id: 'block-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    this.blocks.push(newBlock);
    this.save(STORAGE_KEYS.BLOCKS, this.blocks);
    return newBlock;
  }

  updateBlock(id: string, updates: Partial<ScheduleBlock>): ScheduleBlock | null {
    const index = this.blocks.findIndex((b) => b.id === id);
    if (index === -1) return null;
    this.blocks[index] = { ...this.blocks[index], ...updates };
    this.save(STORAGE_KEYS.BLOCKS, this.blocks);
    return { ...this.blocks[index] };
  }

  deleteBlock(id: string): boolean {
    const index = this.blocks.findIndex((b) => b.id === id);
    if (index === -1) return false;
    this.blocks.splice(index, 1);
    this.save(STORAGE_KEYS.BLOCKS, this.blocks);
    return true;
  }

  getSubjects(): UniversitySubject[] {
    return [...this.subjects];
  }

  addSubject(subject: Omit<UniversitySubject, 'id' | 'created_at'>): UniversitySubject {
    const newSubject: UniversitySubject = {
      ...subject,
      id: 'subject-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    this.subjects.push(newSubject);
    this.save(STORAGE_KEYS.SUBJECTS, this.subjects);
    return newSubject;
  }

  deleteSubject(id: string): boolean {
    const index = this.subjects.findIndex((subject) => subject.id === id);
    if (index === -1) return false;
    this.subjects.splice(index, 1);
    this.save(STORAGE_KEYS.SUBJECTS, this.subjects);
    return true;
  }

  // Nutrition Logs
  getNutritionLogs(): NutritionLog[] {
    return [...this.nutritionLogs];
  }

  updateNutritionLog(id: string, updates: Partial<NutritionLog>): NutritionLog | null {
    const index = this.nutritionLogs.findIndex((m) => m.id === id);
    if (index === -1) return null;
    this.nutritionLogs[index] = { ...this.nutritionLogs[index], ...updates };
    this.save(STORAGE_KEYS.NUTRITION, this.nutritionLogs);
    return { ...this.nutritionLogs[index] };
  }

  addNutritionLog(log: Omit<NutritionLog, 'id'>): NutritionLog {
    const newLog: NutritionLog = {
      ...log,
      id: 'nutri-' + Math.random().toString(36).substring(2, 9),
    };
    this.nutritionLogs.push(newLog);
    this.save(STORAGE_KEYS.NUTRITION, this.nutritionLogs);
    return newLog;
  }

  // Activity Debts
  getDebts(): ActivityDebt[] {
    return [...this.debts];
  }

  addDebt(debt: Omit<ActivityDebt, 'id' | 'created_at'>): ActivityDebt {
    // Prevent duplicate unresolved debts for the same source block
    if (debt.source_block_id) {
      const existing = this.debts.find(
        (d) => d.source_block_id === debt.source_block_id && d.status === 'unresolved'
      );
      if (existing) return existing;
    }
    const newDebt: ActivityDebt = {
      ...debt,
      id: 'debt-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    this.debts.unshift(newDebt);
    this.save(STORAGE_KEYS.DEBTS, this.debts);
    return newDebt;
  }

  updateDebt(id: string, updates: Partial<ActivityDebt>): ActivityDebt | null {
    const index = this.debts.findIndex((d) => d.id === id);
    if (index === -1) return null;
    this.debts[index] = { ...this.debts[index], ...updates };
    this.save(STORAGE_KEYS.DEBTS, this.debts);
    return { ...this.debts[index] };
  }

  // Reset the local workspace without restoring demo records.
  resetDefaults(): void {
    this.profile = { ...initialProfile };
    this.activities = [];
    this.blocks = [];
    this.nutritionLogs = [];
    this.debts = [];
    this.subjects = [];
    this.save(STORAGE_KEYS.PROFILE, this.profile);
    this.save(STORAGE_KEYS.ACTIVITIES, this.activities);
    this.save(STORAGE_KEYS.BLOCKS, this.blocks);
    this.save(STORAGE_KEYS.NUTRITION, this.nutritionLogs);
    this.save(STORAGE_KEYS.DEBTS, this.debts);
    this.save(STORAGE_KEYS.SUBJECTS, this.subjects);
  }
}

export const localStore = new LocalDataStore();
