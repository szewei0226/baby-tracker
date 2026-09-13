CREATE TABLE IF NOT EXISTS medication_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  thumbnail_data TEXT,
  dose TEXT NOT NULL,
  unit TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('scheduled', 'prn')),
  schedule_mode TEXT CHECK (schedule_mode IN ('specific_times', 'interval', 'daily_frequency')),
  schedule_definition TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_medication_plans_status ON medication_plans(status);

CREATE TABLE IF NOT EXISTS medication_administrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medication_id INTEGER NOT NULL REFERENCES medication_plans(id) ON DELETE CASCADE,
  scheduled_at TEXT,
  actual_at TEXT,
  dose TEXT NOT NULL,
  unit TEXT NOT NULL,
  given_by TEXT,
  status TEXT NOT NULL CHECK (status IN ('given', 'skipped')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (status = 'skipped' OR (actual_at IS NOT NULL AND given_by IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_medication_administrations_medication ON medication_administrations(medication_id);
CREATE INDEX IF NOT EXISTS idx_medication_administrations_actual_at ON medication_administrations(actual_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_medication_administrations_scheduled_unique
  ON medication_administrations(medication_id, scheduled_at)
  WHERE scheduled_at IS NOT NULL;
