CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  phone TEXT,
  region TEXT
);

CREATE TABLE IF NOT EXISTS machine_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS status_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,  -- 'salesStatus' or 'projectStatus'
  value TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_ng TEXT NOT NULL UNIQUE,
  module_number TEXT,
  sales_status TEXT NOT NULL DEFAULT 'SOLD',
  project_status TEXT NOT NULL DEFAULT 'IN PROCUREMENT',
  customer_id INTEGER REFERENCES customers(id),
  machine_type_id INTEGER REFERENCES machine_types(id),
  assembly_date TEXT,
  test_date TEXT,
  ship_date TEXT,
  orig_assembly_date TEXT,
  orig_test_date TEXT,
  orig_ship_date TEXT,
  slip_days INTEGER DEFAULT 0,
  shipping_type TEXT DEFAULT 'Standard',
  arranged_by TEXT DEFAULT 'Customer',
  power_spec TEXT,
  sales_rep TEXT,
  planner TEXT,
  assembly_tech TEXT,
  test_tech TEXT,
  priority TEXT DEFAULT 'Normal',
  tags TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS job_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  count INTEGER DEFAULT 1,
  description TEXT NOT NULL,
  is_highlighted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS job_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,  -- 'engineering', 'operations', 'commercial'
  is_complete INTEGER DEFAULT 0,
  completed_at TEXT,
  due_date TEXT,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS job_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  note_date TEXT NOT NULL,
  content TEXT NOT NULL,
  is_highlighted INTEGER DEFAULT 0,
  author TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS late_parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  dock_date TEXT,
  description TEXT NOT NULL,
  resolved INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS risks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Open',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS change_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT,
  changed_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS milestone_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);
