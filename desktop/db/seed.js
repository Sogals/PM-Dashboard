#!/usr/bin/env node
/**
 * Seed script — run via: npm run seed
 * Creates/populates meridian-pm.db in the current directory.
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', 'meridian-pm.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

console.log('Seeding database at:', DB_PATH);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

// ── Clear existing data ──────────────────────────────────────────────────────
db.exec(`
  DELETE FROM change_history;
  DELETE FROM risks;
  DELETE FROM late_parts;
  DELETE FROM job_notes;
  DELETE FROM job_milestones;
  DELETE FROM job_options;
  DELETE FROM jobs;
  DELETE FROM customers;
  DELETE FROM machine_types;
  DELETE FROM status_config;
  DELETE FROM milestone_templates;
`);

// ── Machine types ─────────────────────────────────────────────────────────────
const insertMachineType = db.prepare('INSERT INTO machine_types (name) VALUES (?)');
const machineTypes = [
  'Gen 6 2500',
  'Gen 6 1700',
  'Gen 5 1700',
  'Gen 5 1200',
  'Gen 5 2500',
];
const machineTypeMap = {};
for (const name of machineTypes) {
  const result = insertMachineType.run(name);
  machineTypeMap[name] = result.lastInsertRowid;
}

// ── Status configs ────────────────────────────────────────────────────────────
const insertStatus = db.prepare(
  'INSERT INTO status_config (type, value, color, display_order) VALUES (?, ?, ?, ?)'
);
const projectStatuses = [
  ['IN PROCUREMENT', '#3B82F6', 1],
  ['IN ENGINEERING', '#F59E0B', 2],
  ['SHIPPED (SOLD)', '#10B981', 3],
  ['SHIPPED (NOT SOLD)', '#6B7280', 4],
];
for (const [value, color, order] of projectStatuses) {
  insertStatus.run('projectStatus', value, color, order);
}

const salesStatuses = [
  ['SOLD', '#10B981', 1],
  ['FORECAST', '#F59E0B', 2],
  ['DEMO', '#8B5CF6', 3],
  ['CLAIMED', '#F97316', 4],
];
for (const [value, color, order] of salesStatuses) {
  insertStatus.run('salesStatus', value, color, order);
}

// ── Milestone templates ───────────────────────────────────────────────────────
const insertTemplate = db.prepare(
  'INSERT INTO milestone_templates (name, category, display_order) VALUES (?, ?, ?)'
);

const operationsTemplates = [
  'Module Scheduled',
  'MA Created',
  'Module Staged',
  'Assembly Started',
  'Test Started',
  'Crating Ordered',
  'Machine Crated',
  'Ready To Ship',
];
operationsTemplates.forEach((name, i) => insertTemplate.run(name, 'operations', i));

const engineeringTemplates = ['Super Copy', 'Eng Release', 'Sold Options'];
engineeringTemplates.forEach((name, i) => insertTemplate.run(name, 'engineering', i));

const commercialTemplates = [
  'Order Entered',
  'Order Flipped',
  'Down Payment',
  'OA Letter',
  'Prior To Ship Pay',
  'Ready To Ship',
  'Final Payment',
];
commercialTemplates.forEach((name, i) => insertTemplate.run(name, 'commercial', i));

// ── Customers ─────────────────────────────────────────────────────────────────
const insertCustomer = db.prepare('INSERT INTO customers (name) VALUES (?)');
const customerNames = [
  'Amcor Osh. South',
  'Print Pro - Wrightstown',
  'Clear Film',
  'CNG Legacy',
  'PPC',
  'ProAmpac - Quebec',
  'Print - Stock',
  'Print - Stock (GP Bowling Green)',
  'Meridian on the Move (New Unit)',
  'Print - Stock (Mark B)',
  'Print - Stock (Garlock Return)',
  'Legacy',
  'Japs-Olson',
  'Crosslink',
];
const customerMap = {};
for (const name of customerNames) {
  const result = insertCustomer.run(name);
  customerMap[name] = result.lastInsertRowid;
}

// ── Jobs ──────────────────────────────────────────────────────────────────────
const insertJob = db.prepare(`
  INSERT INTO jobs (
    project_ng, module_number, sales_status, project_status,
    customer_id, machine_type_id,
    assembly_date, test_date, ship_date,
    orig_assembly_date, orig_test_date, orig_ship_date,
    slip_days
  ) VALUES (
    @project_ng, @module_number, @sales_status, @project_status,
    @customer_id, @machine_type_id,
    @assembly_date, @test_date, @ship_date,
    @orig_assembly_date, @orig_test_date, @orig_ship_date,
    @slip_days
  )
`);

const jobs = [
  {
    project_ng: 'NG4477341', module_number: 'RC02-00010',
    sales_status: 'SOLD', project_status: 'IN PROCUREMENT',
    customer: 'Amcor Osh. South', machine_type: 'Gen 6 2500',
    assembly_date: '2026-02-16', test_date: '2026-03-09', ship_date: '2026-04-10',
    orig_assembly_date: '2026-02-16', orig_test_date: '2026-03-09', orig_ship_date: '2026-04-10',
    slip_days: 0,
  },
  {
    project_ng: 'NG4480194', module_number: 'RC02-00015',
    sales_status: 'SOLD', project_status: 'IN PROCUREMENT',
    customer: 'Print Pro - Wrightstown', machine_type: 'Gen 6 2500',
    assembly_date: '2026-03-09', test_date: '2026-03-30', ship_date: '2026-04-17',
    orig_assembly_date: '2026-03-09', orig_test_date: '2026-03-30', orig_ship_date: '2026-04-17',
    slip_days: 0,
  },
  {
    project_ng: 'NG4480190', module_number: 'RC02-00012',
    sales_status: 'SOLD', project_status: 'IN PROCUREMENT',
    customer: 'Clear Film', machine_type: 'Gen 6 1700',
    assembly_date: '2026-03-30', test_date: '2026-04-20', ship_date: '2026-05-08',
    orig_assembly_date: '2026-03-30', orig_test_date: '2026-04-20', orig_ship_date: '2026-05-08',
    slip_days: 0,
  },
  {
    project_ng: 'NG4484160', module_number: 'RC02-00017',
    sales_status: 'SOLD', project_status: 'IN PROCUREMENT',
    customer: 'CNG Legacy', machine_type: 'Gen 6 2500',
    assembly_date: '2026-04-13', test_date: '2026-05-04', ship_date: '2026-05-15',
    orig_assembly_date: '2026-04-13', orig_test_date: '2026-05-04', orig_ship_date: '2026-05-15',
    slip_days: 0,
  },
  {
    project_ng: 'NG4480192', module_number: 'RC02-00013',
    sales_status: 'SOLD', project_status: 'IN PROCUREMENT',
    customer: 'PPC', machine_type: 'Gen 6 1700',
    assembly_date: '2026-04-20', test_date: '2026-05-11', ship_date: '2026-05-29',
    orig_assembly_date: '2026-04-20', orig_test_date: '2026-05-11', orig_ship_date: '2026-05-29',
    slip_days: 0,
  },
  {
    project_ng: 'NG4493593', module_number: 'RC02-00018',
    sales_status: 'SOLD', project_status: 'IN ENGINEERING',
    customer: 'ProAmpac - Quebec', machine_type: 'Gen 6 2500',
    assembly_date: '2026-05-11', test_date: '2026-05-25', ship_date: '2026-06-01',
    orig_assembly_date: '2026-05-11', orig_test_date: '2026-05-25', orig_ship_date: '2026-06-01',
    slip_days: 0,
  },
  {
    project_ng: 'NG4493599', module_number: 'RC02-00019',
    sales_status: 'FORECAST', project_status: 'IN ENGINEERING',
    customer: 'Print - Stock', machine_type: 'Gen 6 2500',
    assembly_date: '2026-05-18', test_date: '2026-06-08', ship_date: '2026-06-15',
    orig_assembly_date: '2026-05-18', orig_test_date: '2026-06-08', orig_ship_date: '2026-06-15',
    slip_days: 0,
  },
  {
    project_ng: 'NG4480193', module_number: 'RC02-00014',
    sales_status: 'SOLD', project_status: 'IN PROCUREMENT',
    customer: 'Print - Stock (GP Bowling Green)', machine_type: 'Gen 6 2500',
    assembly_date: '2026-05-08', test_date: '2026-06-01', ship_date: '2026-06-19',
    orig_assembly_date: '2026-05-08', orig_test_date: '2026-06-01', orig_ship_date: '2026-06-19',
    slip_days: 0,
  },
  {
    project_ng: 'NG4480188', module_number: 'RC02-00011',
    sales_status: 'SOLD', project_status: 'IN PROCUREMENT',
    customer: 'Meridian on the Move (New Unit)', machine_type: 'Gen 6 1700',
    assembly_date: '2026-06-02', test_date: '2026-06-22', ship_date: '2026-07-10',
    orig_assembly_date: '2026-06-02', orig_test_date: '2026-06-22', orig_ship_date: '2026-07-10',
    slip_days: 0,
  },
  {
    project_ng: 'NG4493600', module_number: 'RC02-00020',
    sales_status: 'CLAIMED', project_status: 'IN ENGINEERING',
    customer: 'Print - Stock (Mark B)', machine_type: 'Gen 6 1700',
    assembly_date: '2026-06-08', test_date: '2026-07-06', ship_date: '2026-07-13',
    orig_assembly_date: '2026-06-08', orig_test_date: '2026-07-06', orig_ship_date: '2026-07-13',
    slip_days: 0,
  },
  {
    project_ng: 'NG4480196', module_number: 'RC02-00016',
    sales_status: 'CLAIMED', project_status: 'IN PROCUREMENT',
    customer: 'Print - Stock', machine_type: 'Gen 6 2500',
    assembly_date: '2026-06-22', test_date: '2026-07-13', ship_date: '2026-07-24',
    orig_assembly_date: '2026-06-22', orig_test_date: '2026-07-13', orig_ship_date: '2026-07-24',
    slip_days: 0,
  },
  {
    project_ng: 'NG4454777', module_number: 'RC02-00002',
    sales_status: 'DEMO', project_status: 'SHIPPED (SOLD)',
    customer: 'Print - Stock (Garlock Return)', machine_type: 'Gen 6 2500',
    assembly_date: null, test_date: null, ship_date: '2025-09-26',
    orig_assembly_date: null, orig_test_date: null, orig_ship_date: '2025-09-03',
    slip_days: 23,
  },
  {
    project_ng: 'NG4465604', module_number: 'RC02-00004',
    sales_status: 'SOLD', project_status: 'SHIPPED (SOLD)',
    customer: 'Legacy', machine_type: 'Gen 6 2500',
    assembly_date: null, test_date: null, ship_date: '2025-09-29',
    orig_assembly_date: null, orig_test_date: null, orig_ship_date: '2025-09-11',
    slip_days: 18,
  },
  {
    project_ng: 'NG4464671', module_number: 'RC01-00145',
    sales_status: 'SOLD', project_status: 'SHIPPED (SOLD)',
    customer: 'Japs-Olson', machine_type: 'Gen 5 1700',
    assembly_date: null, test_date: null, ship_date: '2025-09-30',
    orig_assembly_date: null, orig_test_date: null, orig_ship_date: '2025-08-22',
    slip_days: 39,
  },
  {
    project_ng: 'NG4473202', module_number: 'RC01-00143',
    sales_status: 'SOLD', project_status: 'SHIPPED (SOLD)',
    customer: 'Crosslink', machine_type: 'Gen 5 1200',
    assembly_date: null, test_date: null, ship_date: '2025-09-30',
    orig_assembly_date: null, orig_test_date: null, orig_ship_date: '2025-08-20',
    slip_days: 41,
  },
];

// Get milestone templates for seeding
const templates = db.prepare('SELECT * FROM milestone_templates ORDER BY category, display_order').all();
const insertMilestone = db.prepare(`
  INSERT INTO job_milestones (job_id, name, category, display_order)
  VALUES (?, ?, ?, ?)
`);

for (const job of jobs) {
  const customerId = customerMap[job.customer];
  const machineTypeId = machineTypeMap[job.machine_type];

  const result = insertJob.run({
    project_ng: job.project_ng,
    module_number: job.module_number,
    sales_status: job.sales_status,
    project_status: job.project_status,
    customer_id: customerId || null,
    machine_type_id: machineTypeId || null,
    assembly_date: job.assembly_date,
    test_date: job.test_date,
    ship_date: job.ship_date,
    orig_assembly_date: job.orig_assembly_date,
    orig_test_date: job.orig_test_date,
    orig_ship_date: job.orig_ship_date,
    slip_days: job.slip_days,
  });

  const jobId = result.lastInsertRowid;

  // Insert milestones from templates
  for (const tmpl of templates) {
    insertMilestone.run(jobId, tmpl.name, tmpl.category, tmpl.display_order);
  }
}

db.close();
console.log('Seed complete. Jobs inserted:', jobs.length);
