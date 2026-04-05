'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// ── Database setup ─────────────────────────────────────────────────────────────
let db;

function getDbPath() {
  if (app.isPackaged) {
    return path.join(app.getPath('userData'), 'meridian-pm.db');
  }
  // Development: use local file next to main.js
  const localDb = path.join(__dirname, 'meridian-pm.db');
  return localDb;
}

function initDatabase() {
  const Database = require('better-sqlite3');
  const dbPath = getDbPath();
  console.log('Database path:', dbPath);

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run schema
  const schemaPath = path.join(__dirname, 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);

  // Auto-seed if empty
  const count = db.prepare('SELECT COUNT(*) as c FROM jobs').get();
  if (count.c === 0) {
    console.log('Database empty — running auto-seed...');
    try {
      require('./db/seed.js');
      // Re-open after seed closes
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
    } catch (e) {
      console.error('Auto-seed failed:', e.message);
    }
  }
}

// ── Window ─────────────────────────────────────────────────────────────────────
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Meridian PM',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Open DevTools in dev mode
  if (!app.isPackaged) {
    // mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC: Navigation ───────────────────────────────────────────────────────────
ipcMain.handle('navigate', (event, page, params) => {
  const pageMap = {
    dashboard: 'index.html',
    orders: 'orders.html',
    gantt: 'gantt.html',
    job: 'job.html',
    admin: 'admin.html',
  };
  const file = pageMap[page] || 'index.html';
  let url = path.join(__dirname, 'renderer', file);
  if (params && Object.keys(params).length > 0) {
    const qs = new URLSearchParams(params).toString();
    mainWindow.loadURL(`file://${url}?${qs}`);
  } else {
    mainWindow.loadFile(url);
  }
  return true;
});

// ── IPC: Generic query/run ────────────────────────────────────────────────────
ipcMain.handle('db:query', (event, sql, params = []) => {
  try {
    return { ok: true, data: db.prepare(sql).all(...params) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('db:run', (event, sql, params = []) => {
  try {
    const result = db.prepare(sql).run(...params);
    return { ok: true, lastInsertRowid: result.lastInsertRowid, changes: result.changes };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ── IPC: Jobs ─────────────────────────────────────────────────────────────────
ipcMain.handle('jobs:getAll', (event, filters = {}) => {
  try {
    let sql = `
      SELECT j.*,
             c.name AS customer_name,
             mt.name AS machine_type_name
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN machine_types mt ON j.machine_type_id = mt.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.search) {
      sql += ` AND (j.project_ng LIKE ? OR c.name LIKE ? OR j.module_number LIKE ?)`;
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }
    if (filters.project_status) {
      sql += ` AND j.project_status = ?`;
      params.push(filters.project_status);
    }
    if (filters.sales_status) {
      sql += ` AND j.sales_status = ?`;
      params.push(filters.sales_status);
    }
    if (filters.machine_type) {
      sql += ` AND mt.name = ?`;
      params.push(filters.machine_type);
    }

    sql += ` ORDER BY j.ship_date ASC NULLS LAST, j.id ASC`;

    return { ok: true, data: db.prepare(sql).all(...params) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('jobs:getById', (event, id) => {
  try {
    const job = db.prepare(`
      SELECT j.*,
             c.name AS customer_name,
             mt.name AS machine_type_name
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN machine_types mt ON j.machine_type_id = mt.id
      WHERE j.id = ?
    `).get(id);

    if (!job) return { ok: false, error: 'Job not found' };

    job.options = db.prepare('SELECT * FROM job_options WHERE job_id = ? ORDER BY id').all(id);
    job.milestones = db.prepare('SELECT * FROM job_milestones WHERE job_id = ? ORDER BY category, display_order').all(id);
    job.notes = db.prepare('SELECT * FROM job_notes WHERE job_id = ? ORDER BY note_date DESC, id DESC').all(id);
    job.lateParts = db.prepare('SELECT * FROM late_parts WHERE job_id = ? ORDER BY dock_date ASC').all(id);
    job.risks = db.prepare('SELECT * FROM risks WHERE job_id = ? ORDER BY created_at DESC').all(id);
    job.history = db.prepare('SELECT * FROM change_history WHERE job_id = ? ORDER BY changed_at DESC LIMIT 50').all(id);

    return { ok: true, data: job };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('jobs:create', (event, data) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO jobs (
        project_ng, module_number, sales_status, project_status,
        customer_id, machine_type_id,
        assembly_date, test_date, ship_date,
        orig_assembly_date, orig_test_date, orig_ship_date,
        slip_days, shipping_type, arranged_by,
        power_spec, sales_rep, planner, assembly_tech, test_tech, priority, tags
      ) VALUES (
        @project_ng, @module_number, @sales_status, @project_status,
        @customer_id, @machine_type_id,
        @assembly_date, @test_date, @ship_date,
        @orig_assembly_date, @orig_test_date, @orig_ship_date,
        @slip_days, @shipping_type, @arranged_by,
        @power_spec, @sales_rep, @planner, @assembly_tech, @test_tech, @priority, @tags
      )
    `);

    const result = stmt.run({
      project_ng: data.project_ng,
      module_number: data.module_number || null,
      sales_status: data.sales_status || 'SOLD',
      project_status: data.project_status || 'IN PROCUREMENT',
      customer_id: data.customer_id || null,
      machine_type_id: data.machine_type_id || null,
      assembly_date: data.assembly_date || null,
      test_date: data.test_date || null,
      ship_date: data.ship_date || null,
      orig_assembly_date: data.assembly_date || null,
      orig_test_date: data.test_date || null,
      orig_ship_date: data.ship_date || null,
      slip_days: data.slip_days || 0,
      shipping_type: data.shipping_type || 'Standard',
      arranged_by: data.arranged_by || 'Customer',
      power_spec: data.power_spec || null,
      sales_rep: data.sales_rep || null,
      planner: data.planner || null,
      assembly_tech: data.assembly_tech || null,
      test_tech: data.test_tech || null,
      priority: data.priority || 'Normal',
      tags: data.tags || null,
    });

    const jobId = result.lastInsertRowid;

    // Add default milestones from templates
    const templates = db.prepare('SELECT * FROM milestone_templates ORDER BY category, display_order').all();
    const insertMilestone = db.prepare(
      'INSERT INTO job_milestones (job_id, name, category, display_order) VALUES (?, ?, ?, ?)'
    );
    for (const tmpl of templates) {
      insertMilestone.run(jobId, tmpl.name, tmpl.category, tmpl.display_order);
    }

    return { ok: true, lastInsertRowid: jobId };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('jobs:update', (event, id, data) => {
  try {
    const old = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
    if (!old) return { ok: false, error: 'Job not found' };

    const allowed = [
      'project_ng', 'module_number', 'sales_status', 'project_status',
      'customer_id', 'machine_type_id',
      'assembly_date', 'test_date', 'ship_date',
      'orig_assembly_date', 'orig_test_date', 'orig_ship_date',
      'slip_days', 'shipping_type', 'arranged_by',
      'power_spec', 'sales_rep', 'planner', 'assembly_tech', 'test_tech',
      'priority', 'tags',
    ];

    const sets = [];
    const vals = [];
    const historyInsert = db.prepare(`
      INSERT INTO change_history (job_id, field_name, old_value, new_value, changed_by)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const key of allowed) {
      if (key in data) {
        sets.push(`${key} = ?`);
        vals.push(data[key]);
        if (String(old[key]) !== String(data[key])) {
          historyInsert.run(id, key, old[key], data[key], data._changedBy || 'user');
        }
      }
    }

    if (sets.length === 0) return { ok: true, changes: 0 };

    sets.push('updated_at = datetime(\'now\')');
    vals.push(id);

    const result = db.prepare(`UPDATE jobs SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
    return { ok: true, changes: result.changes };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('jobs:delete', (event, id) => {
  try {
    const result = db.prepare('DELETE FROM jobs WHERE id = ?').run(id);
    return { ok: true, changes: result.changes };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ── IPC: Notes ────────────────────────────────────────────────────────────────
ipcMain.handle('notes:getByJob', (event, jobId) => {
  try {
    const data = db.prepare(
      'SELECT * FROM job_notes WHERE job_id = ? ORDER BY note_date DESC, id DESC'
    ).all(jobId);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('notes:add', (event, jobId, data) => {
  try {
    const result = db.prepare(`
      INSERT INTO job_notes (job_id, note_date, content, is_highlighted, author)
      VALUES (?, ?, ?, ?, ?)
    `).run(jobId, data.note_date, data.content, data.is_highlighted ? 1 : 0, data.author || null);
    return { ok: true, lastInsertRowid: result.lastInsertRowid };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ── IPC: Milestones ───────────────────────────────────────────────────────────
ipcMain.handle('milestones:toggle', (event, id) => {
  try {
    const m = db.prepare('SELECT * FROM job_milestones WHERE id = ?').get(id);
    if (!m) return { ok: false, error: 'Milestone not found' };
    const newVal = m.is_complete ? 0 : 1;
    const completedAt = newVal ? new Date().toISOString().split('T')[0] : null;
    db.prepare('UPDATE job_milestones SET is_complete = ?, completed_at = ? WHERE id = ?')
      .run(newVal, completedAt, id);
    return { ok: true, is_complete: newVal };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ── IPC: Late Parts ───────────────────────────────────────────────────────────
ipcMain.handle('lateParts:getByJob', (event, jobId) => {
  try {
    const data = db.prepare('SELECT * FROM late_parts WHERE job_id = ? ORDER BY dock_date ASC').all(jobId);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('lateParts:add', (event, jobId, data) => {
  try {
    const result = db.prepare(
      'INSERT INTO late_parts (job_id, dock_date, description, resolved) VALUES (?, ?, ?, ?)'
    ).run(jobId, data.dock_date || null, data.description, data.resolved ? 1 : 0);
    return { ok: true, lastInsertRowid: result.lastInsertRowid };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ── IPC: Risks ────────────────────────────────────────────────────────────────
ipcMain.handle('risks:getByJob', (event, jobId) => {
  try {
    const data = db.prepare('SELECT * FROM risks WHERE job_id = ? ORDER BY created_at DESC').all(jobId);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('risks:add', (event, jobId, data) => {
  try {
    const result = db.prepare(
      'INSERT INTO risks (job_id, description, severity, status) VALUES (?, ?, ?, ?)'
    ).run(jobId, data.description, data.severity || 'Medium', data.status || 'Open');
    return { ok: true, lastInsertRowid: result.lastInsertRowid };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ── IPC: Admin ────────────────────────────────────────────────────────────────
ipcMain.handle('admin:getStatuses', () => {
  try {
    const data = db.prepare('SELECT * FROM status_config ORDER BY type, display_order').all();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('admin:getMachineTypes', () => {
  try {
    const data = db.prepare('SELECT * FROM machine_types ORDER BY name').all();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('admin:getTemplates', () => {
  try {
    const data = db.prepare('SELECT * FROM milestone_templates ORDER BY category, display_order').all();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('admin:addMachineType', (event, data) => {
  try {
    const result = db.prepare('INSERT INTO machine_types (name, description) VALUES (?, ?)').run(
      data.name, data.description || null
    );
    return { ok: true, lastInsertRowid: result.lastInsertRowid };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('admin:addStatus', (event, data) => {
  try {
    const maxOrder = db.prepare(
      'SELECT MAX(display_order) as m FROM status_config WHERE type = ?'
    ).get(data.type);
    const order = (maxOrder.m || 0) + 1;
    const result = db.prepare(
      'INSERT INTO status_config (type, value, color, display_order) VALUES (?, ?, ?, ?)'
    ).run(data.type, data.value, data.color || '#6B7280', order);
    return { ok: true, lastInsertRowid: result.lastInsertRowid };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('admin:addTemplate', (event, data) => {
  try {
    const maxOrder = db.prepare(
      'SELECT MAX(display_order) as m FROM milestone_templates WHERE category = ?'
    ).get(data.category);
    const order = (maxOrder.m !== null ? maxOrder.m : -1) + 1;
    const result = db.prepare(
      'INSERT INTO milestone_templates (name, category, display_order) VALUES (?, ?, ?)'
    ).run(data.name, data.category, order);
    return { ok: true, lastInsertRowid: result.lastInsertRowid };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('admin:deleteMachineType', (event, id) => {
  try {
    db.prepare('DELETE FROM machine_types WHERE id = ?').run(id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('admin:deleteStatus', (event, id) => {
  try {
    db.prepare('DELETE FROM status_config WHERE id = ?').run(id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('admin:deleteTemplate', (event, id) => {
  try {
    db.prepare('DELETE FROM milestone_templates WHERE id = ?').run(id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});
