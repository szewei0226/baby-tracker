export interface Env {
  DB: import("@cloudflare/workers-types").D1Database;
  ASSETS?: import("@cloudflare/workers-types").Fetcher;
  PIN_HASH?: string;
}

export interface Session {
  id: number;
  token: string;
  expires_at: string;
  created_at: string;
}

export type TimerStatus = "active" | "paused" | "completed";

export interface Pause {
  paused_at: string;
  resumed_at: string | null;
}

export interface SleepEntry {
  id: number;
  status: TimerStatus;
  started_at: string;
  ended_at: string | null;
  pauses: string;
  duration_seconds: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type FeedType = "breast" | "formula" | "expressed";
export type BreastSide = "left" | "right";

export interface FeedEntry {
  id: number;
  type: FeedType;
  status: TimerStatus;
  side: BreastSide | null;
  started_at: string;
  ended_at: string | null;
  pauses: string;
  duration_seconds: number | null;
  amount_ml: number | null;
  is_tracked: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type NappyType = "wet" | "dirty" | "both";

export interface NappyEntry {
  id: number;
  type: NappyType;
  occurred_at: string;
  notes: string | null;
  created_at: string;
}

export interface GrowthEntry {
  id: number;
  weight_grams: number | null;
  height_mm: number | null;
  measured_at: string;
  notes: string | null;
  created_at: string;
}

export interface PumpEntry {
  id: number;
  status: TimerStatus;
  started_at: string;
  ended_at: string | null;
  pauses: string;
  duration_seconds: number | null;
  amount_ml: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyTask {
  id: number;
  name: string;
  frequency_days: number;
  start_date: string | null;
  created_at: string;
}

export interface DailyTaskCompletion {
  id: number;
  task_id: number;
  completed_at: string;
  created_at: string;
}

export interface DailyTaskWithStatus extends DailyTask {
  is_due: boolean;
  is_completed_today: boolean;
  last_completed_at: string | null;
  next_due_date: string | null;
}

export type MedicationType = "scheduled" | "prn";
export type MedicationScheduleMode =
  | "specific_times"
  | "interval"
  | "daily_frequency";
export type MedicationStatus = "active" | "completed";
export type MedicationAdministrationStatus = "given" | "skipped";
export type MedicationCaregiver = "dad" | "mum" | "helper" | "other";

export type MedicationScheduleDefinition =
  | { mode: "specific_times"; times: string[] }
  | { mode: "interval"; interval_hours: number; anchor_time: string }
  | { mode: "daily_frequency"; times: string[] };

export interface MedicationPlanInput {
  name: string;
  thumbnail_data?: string | null;
  dose: string;
  unit: string;
  type: MedicationType;
  schedule_mode?: MedicationScheduleMode | null;
  schedule_definition?: MedicationScheduleDefinition | null;
  start_date: string;
  end_date?: string | null;
  notes?: string | null;
  status?: MedicationStatus;
}

export interface MedicationPlan {
  id: number;
  name: string;
  thumbnail_data: string | null;
  dose: string;
  unit: string;
  type: MedicationType;
  schedule_mode: MedicationScheduleMode | null;
  schedule_definition: MedicationScheduleDefinition | null;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  status: MedicationStatus;
  created_at: string;
  updated_at: string;
}

export interface MedicationAdministrationInput {
  scheduled_at?: string | null;
  actual_at?: string | null;
  dose: string;
  unit: string;
  given_by?: MedicationCaregiver | null;
  status: MedicationAdministrationStatus;
  notes?: string | null;
}

export interface MedicationAdministration extends MedicationAdministrationInput {
  id: number;
  medication_id: number;
  created_at: string;
  updated_at: string;
}

export type AppBindings = {
  Bindings: Env;
};
