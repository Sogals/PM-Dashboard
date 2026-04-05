/**
 * dashboard.js — Dashboard page logic
 */

(async function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in60 = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

  // ── Load all jobs ──────────────────────────────────────────────────────────
  const res = await window.api.jobs.getAll({});
  if (!res.ok) {
    console.error('Failed to load jobs:', res.error);
    return;
  }

  const allJobs = res.data;
  const activeJobs = allJobs.filter(j =>
    j.project_status !== 'SHIPPED (SOLD)' && j.project_status !== 'SHIPPED (NOT SOLD)'
  );

  // ── KPIs ───────────────────────────────────────────────────────────────────
  document.getElementById('kpi-total').textContent = activeJobs.length;
  document.getElementById('kpi-procurement').textContent =
    activeJobs.filter(j => j.project_status === 'IN PROCUREMENT').length;
  document.getElementById('kpi-engineering').textContent =
    activeJobs.filter(j => j.project_status === 'IN ENGINEERING').length;
  document.getElementById('kpi-at-risk').textContent =
    activeJobs.filter(j => (j.slip_days || 0) > 0).length;

  // ── Active Jobs Table ──────────────────────────────────────────────────────
  const tbody = document.getElementById('active-jobs-tbody');
  document.getElementById('active-jobs-count').textContent = `${activeJobs.length} jobs`;

  if (activeJobs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding:20px">No active jobs</td></tr>';
  } else {
    tbody.innerHTML = activeJobs.map(job => {
      const slip = job.slip_days || 0;
      const slipClass = slip === 0 ? 'slip-0' : slip <= 14 ? 'slip-low' : 'slip-high';
      const slipText = slip === 0 ? '—' : `+${slip}d`;
      return `
        <tr class="clickable" onclick="navigate('job', {id: ${job.id}})">
          <td><span class="fw-600">${esc(job.project_ng)}</span>
            <div style="font-size:10px;color:var(--text-muted)">${esc(job.module_number || '')}</div>
          </td>
          <td>${esc(job.customer_name || '—')}</td>
          <td>${esc(job.machine_type_name || '—')}</td>
          <td>${projectStatusBadge(job.project_status)}</td>
          <td>${formatDate(job.ship_date)}</td>
          <td class="${slipClass}">${slipText}</td>
        </tr>`;
    }).join('');
  }

  // ── Upcoming Shipments ─────────────────────────────────────────────────────
  const upcoming = allJobs
    .filter(j => {
      if (!j.ship_date) return false;
      const d = new Date(j.ship_date);
      return d >= today && d <= in60;
    })
    .sort((a, b) => a.ship_date.localeCompare(b.ship_date));

  const upcomingList = document.getElementById('upcoming-list');
  if (upcoming.length === 0) {
    upcomingList.innerHTML = '<div class="text-muted text-center" style="padding:20px;font-size:12px">No shipments in next 60 days</div>';
  } else {
    upcomingList.innerHTML = upcoming.map(job => {
      const shipDate = new Date(job.ship_date);
      const daysUntil = Math.ceil((shipDate - today) / (1000 * 60 * 60 * 24));
      const soonClass = daysUntil <= 14 ? 'soon' : '';
      return `
        <div class="shipment-item" onclick="navigate('job', {id: ${job.id}})">
          <div class="shipment-date-badge ${soonClass}">${formatShort(job.ship_date)}</div>
          <div class="shipment-info">
            <div class="shipment-ng">${esc(job.project_ng)}</div>
            <div class="shipment-cust">${esc(job.customer_name || '—')} · ${daysUntil}d away</div>
          </div>
        </div>`;
    }).join('');
  }

  // ── Recent Notes ───────────────────────────────────────────────────────────
  const noteRes = await window.api.db.query(`
    SELECT jn.*, j.project_ng, c.name AS customer_name
    FROM job_notes jn
    JOIN jobs j ON jn.job_id = j.id
    LEFT JOIN customers c ON j.customer_id = c.id
    ORDER BY jn.created_at DESC
    LIMIT 8
  `);

  const notesList = document.getElementById('recent-notes-list');
  if (!noteRes.ok || noteRes.data.length === 0) {
    notesList.innerHTML = '<div class="text-muted text-center" style="padding:20px;font-size:12px">No notes yet</div>';
  } else {
    notesList.innerHTML = noteRes.data.map(note => `
      <div class="recent-note-item" onclick="navigate('job', {id: ${note.job_id}})">
        <div class="recent-note-job">${esc(note.project_ng)} — ${esc(note.customer_name || '')}</div>
        <div class="recent-note-text">${esc(note.content)}</div>
        <div class="recent-note-meta">${note.note_date}${note.author ? ' · ' + esc(note.author) : ''}</div>
      </div>`).join('');
  }

  // ── New Job Modal ──────────────────────────────────────────────────────────
  await loadNewJobModal();

  document.getElementById('btn-new-job').addEventListener('click', () => {
    document.getElementById('new-job-modal').classList.remove('hidden');
  });

  document.getElementById('modal-close-new-job').addEventListener('click', closeNewJobModal);
  document.getElementById('new-job-cancel').addEventListener('click', closeNewJobModal);

  document.getElementById('new-job-save').addEventListener('click', async () => {
    const ngVal = document.getElementById('new-project-ng').value.trim();
    if (!ngVal) {
      showError('Project NG # is required');
      return;
    }

    const data = {
      project_ng: ngVal,
      module_number: document.getElementById('new-module-number').value.trim() || null,
      customer_id: document.getElementById('new-customer-id').value || null,
      machine_type_id: document.getElementById('new-machine-type-id').value || null,
      sales_status: document.getElementById('new-sales-status').value,
      project_status: document.getElementById('new-project-status').value,
      assembly_date: document.getElementById('new-assembly-date').value || null,
      test_date: document.getElementById('new-test-date').value || null,
      ship_date: document.getElementById('new-ship-date').value || null,
    };

    const createRes = await window.api.jobs.create(data);
    if (!createRes.ok) {
      showError(createRes.error);
      return;
    }

    navigate('job', { id: createRes.lastInsertRowid });
  });

  function showError(msg) {
    const el = document.getElementById('new-job-error');
    el.textContent = msg;
    el.style.display = 'block';
  }

  function closeNewJobModal() {
    document.getElementById('new-job-modal').classList.add('hidden');
  }

  async function loadNewJobModal() {
    const [custRes, machRes] = await Promise.all([
      window.api.db.query('SELECT id, name FROM customers ORDER BY name'),
      window.api.db.query('SELECT id, name FROM machine_types ORDER BY name'),
    ]);

    const custSel = document.getElementById('new-customer-id');
    if (custRes.ok) {
      custRes.data.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        custSel.appendChild(opt);
      });
    }

    const machSel = document.getElementById('new-machine-type-id');
    if (machRes.ok) {
      machRes.data.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name;
        machSel.appendChild(opt);
      });
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatDate(d) {
    if (!d) return '—';
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatShort(d) {
    if (!d) return '—';
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function projectStatusBadge(status) {
    const map = {
      'IN PROCUREMENT': 'badge-blue',
      'IN ENGINEERING': 'badge-amber',
      'SHIPPED (SOLD)': 'badge-green',
      'SHIPPED (NOT SOLD)': 'badge-gray',
    };
    const cls = map[status] || 'badge-gray';
    return `<span class="badge ${cls}">${esc(status)}</span>`;
  }

  // Expose db query for notes section
  if (!window.api.db) {
    window.api.db = {
      query: (sql, params) => window.api.dbQuery(sql, params),
    };
  }

})();

// Patch for db.query since preload exposes separate handlers
// We call via the generic ipcRenderer.invoke via preload
if (window.api && !window.api.db) {
  window.api.db = {
    query: (sql, params) => window.api.dbQuery ? window.api.dbQuery(sql, params) : Promise.resolve({ ok: false, error: 'no db query' }),
  };
}
