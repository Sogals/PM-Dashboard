/**
 * job.js — Job detail page
 */

(async function () {
  // Parse job ID from query string
  const params = new URLSearchParams(location.search);
  const jobId = params.get('id');

  if (!jobId) {
    navigate('orders');
    return;
  }

  let job = null;
  let editMode = false;
  let customers = [];
  let machineTypes = [];

  // Load reference data
  const [custRes, machRes] = await Promise.all([
    window.api.db.query('SELECT id, name FROM customers ORDER BY name'),
    window.api.db.query('SELECT id, name FROM machine_types ORDER BY name'),
  ]);
  if (custRes.ok) customers = custRes.data;
  if (machRes.ok) machineTypes = machRes.data;

  await loadJob();

  // ── Edit / Save / Cancel buttons ─────────────────────────────────────────
  document.getElementById('btn-edit').addEventListener('click', () => {
    enterEditMode();
  });

  document.getElementById('btn-save').addEventListener('click', async () => {
    await saveJob();
  });

  document.getElementById('btn-cancel').addEventListener('click', () => {
    exitEditMode();
    renderJob();
  });

  document.getElementById('btn-delete').addEventListener('click', async () => {
    if (!confirm(`Delete job ${job.project_ng}? This cannot be undone.`)) return;
    const res = await window.api.jobs.delete(job.id);
    if (res.ok) navigate('orders');
    else alert('Error: ' + res.error);
  });

  // ── Load & Render ─────────────────────────────────────────────────────────
  async function loadJob() {
    const res = await window.api.jobs.getById(parseInt(jobId));
    if (!res.ok) {
      document.getElementById('job-body').innerHTML =
        `<div class="empty-state"><div class="empty-icon">❌</div><p>Job not found: ${res.error}</p></div>`;
      return;
    }
    job = res.data;
    document.getElementById('page-title').textContent = job.project_ng;
    document.getElementById('btn-edit').style.display = '';
    document.getElementById('btn-delete').style.display = '';
    renderJob();
  }

  function renderJob() {
    const slip = job.slip_days || 0;
    const slipClass = slip === 0 ? 'slip-0' : slip <= 14 ? 'slip-low' : 'slip-high';
    const slipText = slip === 0 ? 'On schedule' : `+${slip} days slipped`;

    const engineering = job.milestones.filter(m => m.category === 'engineering');
    const operations  = job.milestones.filter(m => m.category === 'operations');
    const commercial  = job.milestones.filter(m => m.category === 'commercial');

    document.getElementById('job-body').innerHTML = `

      <!-- Baseball card header -->
      <div class="job-header-card">
        <div class="job-title-row">
          <div class="job-title-left">
            <div class="job-ng">${esc(job.project_ng)}</div>
            <div class="job-customer">${esc(job.customer_name || 'No customer')}</div>
            <div class="job-machine">${esc(job.machine_type_name || 'No machine type')}
              ${job.module_number ? ' · ' + esc(job.module_number) : ''}</div>
            <div class="job-badges">
              ${projectStatusBadge(job.project_status)}
              ${salesStatusBadge(job.sales_status)}
              <span class="badge ${slip > 0 ? (slip <= 14 ? 'badge-amber' : 'badge-red') : 'badge-gray'}">${esc(slipText)}</span>
            </div>
          </div>
        </div>
        <div class="job-dates-row">
          <div class="job-date-item">
            <label>Assembly</label>
            <span>${formatDate(job.assembly_date)}</span>
            ${job.orig_assembly_date && job.orig_assembly_date !== job.assembly_date
              ? `<div style="font-size:10px;color:var(--text-muted)">Orig: ${formatDate(job.orig_assembly_date)}</div>` : ''}
          </div>
          <div class="job-date-item">
            <label>Test</label>
            <span>${formatDate(job.test_date)}</span>
            ${job.orig_test_date && job.orig_test_date !== job.test_date
              ? `<div style="font-size:10px;color:var(--text-muted)">Orig: ${formatDate(job.orig_test_date)}</div>` : ''}
          </div>
          <div class="job-date-item">
            <label>Ship</label>
            <span>${formatDate(job.ship_date)}</span>
            ${job.orig_ship_date && job.orig_ship_date !== job.ship_date
              ? `<div style="font-size:10px;color:var(--text-muted)">Orig: ${formatDate(job.orig_ship_date)}</div>` : ''}
          </div>
        </div>
      </div>

      <!-- Options & Team row -->
      <div class="job-detail-grid">
        <!-- Options -->
        <div class="job-detail-section">
          <div class="section-title">Options / Accessories</div>
          <div id="options-list" class="options-list">
            ${renderOptions(job.options)}
          </div>
          <div class="add-option-row" style="margin-top:12px;">
            <input type="text" id="new-option-desc" class="search-input" style="flex:1;min-width:0"
                   placeholder="Add option description..." />
            <button class="btn btn-outline btn-sm" id="btn-add-option">+ Add</button>
          </div>
        </div>

        <!-- Team & Details -->
        <div class="job-detail-section">
          <div class="section-title">Team</div>
          <div class="info-grid">
            <div class="info-item">
              <label>Sales Rep</label>
              <span>${esc(job.sales_rep || '—')}</span>
            </div>
            <div class="info-item">
              <label>Planner</label>
              <span>${esc(job.planner || '—')}</span>
            </div>
            <div class="info-item">
              <label>Assembly Tech</label>
              <span>${esc(job.assembly_tech || '—')}</span>
            </div>
            <div class="info-item">
              <label>Test Tech</label>
              <span>${esc(job.test_tech || '—')}</span>
            </div>
          </div>

          <div class="section-title" style="margin-top:16px;">Power & Shipping</div>
          <div class="info-grid">
            <div class="info-item">
              <label>Power Spec</label>
              <span>${esc(job.power_spec || '—')}</span>
            </div>
            <div class="info-item">
              <label>Shipping Type</label>
              <span>${esc(job.shipping_type || '—')}</span>
            </div>
            <div class="info-item">
              <label>Arranged By</label>
              <span>${esc(job.arranged_by || '—')}</span>
            </div>
            <div class="info-item">
              <label>Priority</label>
              <span>${esc(job.priority || 'Normal')}</span>
            </div>
          </div>
          ${job.tags ? `<div class="mt-12 text-muted" style="font-size:12px;">Tags: ${esc(job.tags)}</div>` : ''}
        </div>
      </div>

      <!-- Milestones -->
      <div class="job-detail-section">
        <div class="section-title">Milestones</div>
        <div class="tabs" id="milestone-tabs">
          <button class="tab-btn active" data-tab="engineering">Engineering (${engineering.filter(m=>m.is_complete).length}/${engineering.length})</button>
          <button class="tab-btn" data-tab="operations">Operations (${operations.filter(m=>m.is_complete).length}/${operations.length})</button>
          <button class="tab-btn" data-tab="commercial">Commercial (${commercial.filter(m=>m.is_complete).length}/${commercial.length})</button>
        </div>
        <div id="tab-engineering" class="tab-panel active">
          ${renderMilestoneList(engineering)}
        </div>
        <div id="tab-operations" class="tab-panel">
          ${renderMilestoneList(operations)}
        </div>
        <div id="tab-commercial" class="tab-panel">
          ${renderMilestoneList(commercial)}
        </div>
      </div>

      <!-- Notes & Late Parts & Risks row -->
      <div class="job-detail-grid">

        <!-- Notes -->
        <div class="job-detail-section full-width" style="grid-column:1/-1">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div class="section-title" style="margin:0;border:none;padding:0">Notes</div>
            <button class="btn btn-outline btn-sm" id="btn-add-note">+ Add Note</button>
          </div>
          <div id="notes-list" class="notes-list">
            ${renderNotes(job.notes)}
          </div>
        </div>

      </div>

      <!-- Late Parts & Risks -->
      <div class="job-detail-grid">
        <!-- Late Parts -->
        <div class="job-detail-section">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div class="section-title" style="margin:0;border:none;padding:0">Late Parts</div>
            <button class="btn btn-outline btn-sm" id="btn-add-latepart">+ Add</button>
          </div>
          <div id="lateparts-section">
            ${renderLateParts(job.lateParts)}
          </div>
        </div>

        <!-- Risks -->
        <div class="job-detail-section">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div class="section-title" style="margin:0;border:none;padding:0">Risks</div>
            <button class="btn btn-outline btn-sm" id="btn-add-risk">+ Add</button>
          </div>
          <div id="risks-section">
            ${renderRisks(job.risks)}
          </div>
        </div>
      </div>

    `;

    // Wire up tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      });
    });

    // Wire up milestone checkboxes
    document.querySelectorAll('.milestone-checkbox').forEach(cb => {
      cb.addEventListener('change', async () => {
        const mid = parseInt(cb.dataset.id);
        const res = await window.api.milestones.toggle(mid);
        if (res.ok) {
          // Reload job to refresh
          await loadJob();
        }
      });
    });

    // Wire up add option
    document.getElementById('btn-add-option').addEventListener('click', async () => {
      const desc = document.getElementById('new-option-desc').value.trim();
      if (!desc) return;
      await window.api.db.run(
        'INSERT INTO job_options (job_id, count, description) VALUES (?, 1, ?)',
        [job.id, desc]
      );
      document.getElementById('new-option-desc').value = '';
      await loadJob();
    });

    // Wire up add note
    document.getElementById('btn-add-note').addEventListener('click', openNoteModal);

    // Wire up add late part
    document.getElementById('btn-add-latepart').addEventListener('click', openLatePartModal);

    // Wire up add risk
    document.getElementById('btn-add-risk').addEventListener('click', openRiskModal);
  }

  function renderOptions(options) {
    if (!options || options.length === 0) {
      return '<div class="text-muted" style="font-size:12px;padding:8px 0">No options added</div>';
    }
    return options.map(opt => `
      <div class="option-item ${opt.is_highlighted ? 'highlighted' : ''}">
        <span class="option-count">${opt.count}x</span>
        <span>${esc(opt.description)}</span>
      </div>`).join('');
  }

  function renderMilestoneList(milestones) {
    if (!milestones || milestones.length === 0) {
      return '<div class="text-muted" style="font-size:12px;padding:8px 0">No milestones</div>';
    }
    const done = milestones.filter(m => m.is_complete).length;
    const pct = milestones.length > 0 ? Math.round((done / milestones.length) * 100) : 0;
    return `
      <div class="milestone-progress">
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <span style="font-size:11px;color:var(--text-muted);white-space:nowrap">${done}/${milestones.length} complete</span>
      </div>
      <ul class="milestone-list">
        ${milestones.map(m => `
          <li class="milestone-item ${m.is_complete ? 'complete' : ''}">
            <input type="checkbox" class="milestone-checkbox" data-id="${m.id}" ${m.is_complete ? 'checked' : ''} />
            <label>${esc(m.name)}</label>
            ${m.completed_at ? `<span class="completed-date">${m.completed_at}</span>` : ''}
          </li>`).join('')}
      </ul>`;
  }

  function renderNotes(notes) {
    if (!notes || notes.length === 0) {
      return '<div class="text-muted" style="font-size:12px;padding:8px 0">No notes yet. Click "+ Add Note" to add one.</div>';
    }
    return notes.map(n => `
      <div class="note-item ${n.is_highlighted ? 'highlighted' : ''}">
        <div class="note-meta">
          <span class="note-date">${n.note_date}</span>
          ${n.author ? `<span class="note-author">· ${esc(n.author)}</span>` : ''}
          ${n.is_highlighted ? '<span class="badge badge-amber" style="font-size:10px">Highlighted</span>' : ''}
        </div>
        <div class="note-content">${esc(n.content)}</div>
      </div>`).join('');
  }

  function renderLateParts(parts) {
    if (!parts || parts.length === 0) {
      return '<div class="text-muted" style="font-size:12px;padding:8px 0">No late parts</div>';
    }
    return `
      <table style="font-size:12px;">
        <thead><tr><th>Dock Date</th><th>Description</th><th>Status</th></tr></thead>
        <tbody>
          ${parts.map(p => `
            <tr>
              <td>${p.dock_date || '—'}</td>
              <td>${esc(p.description)}</td>
              <td><span class="badge ${p.resolved ? 'badge-green' : 'badge-amber'}">${p.resolved ? 'Resolved' : 'Pending'}</span></td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  }

  function renderRisks(risks) {
    if (!risks || risks.length === 0) {
      return '<div class="text-muted" style="font-size:12px;padding:8px 0">No risks</div>';
    }
    return `
      <table style="font-size:12px;">
        <thead><tr><th>Description</th><th>Severity</th><th>Status</th></tr></thead>
        <tbody>
          ${risks.map(r => `
            <tr>
              <td>${esc(r.description)}</td>
              <td><span class="severity-${(r.severity||'').toLowerCase()}">${esc(r.severity)}</span></td>
              <td><span class="${r.status === 'Open' ? 'risk-open' : 'risk-closed'}">${esc(r.status)}</span></td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  }

  // ── Edit Mode ─────────────────────────────────────────────────────────────
  function enterEditMode() {
    editMode = true;
    document.getElementById('btn-edit').classList.add('hidden');
    document.getElementById('btn-save').classList.remove('hidden');
    document.getElementById('btn-cancel').classList.remove('hidden');
    document.getElementById('btn-delete').classList.add('hidden');
    renderEditForm();
  }

  function exitEditMode() {
    editMode = false;
    document.getElementById('btn-edit').classList.remove('hidden');
    document.getElementById('btn-save').classList.add('hidden');
    document.getElementById('btn-cancel').classList.add('hidden');
    document.getElementById('btn-delete').classList.remove('hidden');
  }

  function renderEditForm() {
    const custOptions = customers.map(c =>
      `<option value="${c.id}" ${job.customer_id === c.id ? 'selected' : ''}>${esc(c.name)}</option>`
    ).join('');

    const machOptions = machineTypes.map(m =>
      `<option value="${m.id}" ${job.machine_type_id === m.id ? 'selected' : ''}>${esc(m.name)}</option>`
    ).join('');

    const editHTML = `
      <div class="job-detail-section">
        <div class="section-title">Edit Job — ${esc(job.project_ng)}</div>
        <div class="form-row">
          <div class="form-group">
            <label>Project NG #</label>
            <input type="text" id="edit-project-ng" value="${esc(job.project_ng)}" />
          </div>
          <div class="form-group">
            <label>Module Number</label>
            <input type="text" id="edit-module-number" value="${esc(job.module_number || '')}" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Customer</label>
            <select id="edit-customer-id">
              <option value="">— No Customer —</option>
              ${custOptions}
            </select>
          </div>
          <div class="form-group">
            <label>Machine Type</label>
            <select id="edit-machine-type-id">
              <option value="">— No Machine Type —</option>
              ${machOptions}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Sales Status</label>
            <select id="edit-sales-status">
              ${['SOLD','FORECAST','DEMO','CLAIMED'].map(s =>
                `<option value="${s}" ${job.sales_status === s ? 'selected' : ''}>${s}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Project Status</label>
            <select id="edit-project-status">
              ${['IN PROCUREMENT','IN ENGINEERING','SHIPPED (SOLD)','SHIPPED (NOT SOLD)'].map(s =>
                `<option value="${s}" ${job.project_status === s ? 'selected' : ''}>${s}</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Assembly Date</label>
            <input type="date" id="edit-assembly-date" value="${job.assembly_date || ''}" />
          </div>
          <div class="form-group">
            <label>Test Date</label>
            <input type="date" id="edit-test-date" value="${job.test_date || ''}" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Ship Date</label>
            <input type="date" id="edit-ship-date" value="${job.ship_date || ''}" />
          </div>
          <div class="form-group">
            <label>Slip Days</label>
            <input type="number" id="edit-slip-days" value="${job.slip_days || 0}" min="0" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Sales Rep</label>
            <input type="text" id="edit-sales-rep" value="${esc(job.sales_rep || '')}" />
          </div>
          <div class="form-group">
            <label>Planner</label>
            <input type="text" id="edit-planner" value="${esc(job.planner || '')}" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Assembly Tech</label>
            <input type="text" id="edit-assembly-tech" value="${esc(job.assembly_tech || '')}" />
          </div>
          <div class="form-group">
            <label>Test Tech</label>
            <input type="text" id="edit-test-tech" value="${esc(job.test_tech || '')}" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Power Spec</label>
            <input type="text" id="edit-power-spec" value="${esc(job.power_spec || '')}" />
          </div>
          <div class="form-group">
            <label>Shipping Type</label>
            <select id="edit-shipping-type">
              ${['Standard','Expedited','Freight','Customer Pickup'].map(s =>
                `<option value="${s}" ${job.shipping_type === s ? 'selected' : ''}>${s}</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Arranged By</label>
            <input type="text" id="edit-arranged-by" value="${esc(job.arranged_by || '')}" />
          </div>
          <div class="form-group">
            <label>Priority</label>
            <select id="edit-priority">
              ${['Normal','High','Low'].map(s =>
                `<option value="${s}" ${job.priority === s ? 'selected' : ''}>${s}</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Tags (comma separated)</label>
          <input type="text" id="edit-tags" value="${esc(job.tags || '')}" placeholder="tag1, tag2" />
        </div>
      </div>`;

    document.getElementById('job-body').innerHTML = editHTML;
  }

  async function saveJob() {
    const data = {
      project_ng:       document.getElementById('edit-project-ng').value.trim(),
      module_number:    document.getElementById('edit-module-number').value.trim() || null,
      customer_id:      parseInt(document.getElementById('edit-customer-id').value) || null,
      machine_type_id:  parseInt(document.getElementById('edit-machine-type-id').value) || null,
      sales_status:     document.getElementById('edit-sales-status').value,
      project_status:   document.getElementById('edit-project-status').value,
      assembly_date:    document.getElementById('edit-assembly-date').value || null,
      test_date:        document.getElementById('edit-test-date').value || null,
      ship_date:        document.getElementById('edit-ship-date').value || null,
      slip_days:        parseInt(document.getElementById('edit-slip-days').value) || 0,
      sales_rep:        document.getElementById('edit-sales-rep').value.trim() || null,
      planner:          document.getElementById('edit-planner').value.trim() || null,
      assembly_tech:    document.getElementById('edit-assembly-tech').value.trim() || null,
      test_tech:        document.getElementById('edit-test-tech').value.trim() || null,
      power_spec:       document.getElementById('edit-power-spec').value.trim() || null,
      shipping_type:    document.getElementById('edit-shipping-type').value,
      arranged_by:      document.getElementById('edit-arranged-by').value.trim() || null,
      priority:         document.getElementById('edit-priority').value,
      tags:             document.getElementById('edit-tags').value.trim() || null,
    };

    if (!data.project_ng) { alert('Project NG # is required'); return; }

    const res = await window.api.jobs.update(job.id, data);
    if (!res.ok) { alert('Error saving: ' + res.error); return; }

    exitEditMode();
    await loadJob();
  }

  // ── Note Modal ────────────────────────────────────────────────────────────
  function openNoteModal() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('note-date').value = today;
    document.getElementById('note-content').value = '';
    document.getElementById('note-author').value = '';
    document.getElementById('note-highlighted').checked = false;
    document.getElementById('note-modal').classList.remove('hidden');
  }

  document.getElementById('note-modal-close').addEventListener('click', () => {
    document.getElementById('note-modal').classList.add('hidden');
  });
  document.getElementById('note-cancel').addEventListener('click', () => {
    document.getElementById('note-modal').classList.add('hidden');
  });
  document.getElementById('note-save').addEventListener('click', async () => {
    const content = document.getElementById('note-content').value.trim();
    if (!content) { alert('Please enter a note'); return; }
    const data = {
      note_date: document.getElementById('note-date').value,
      content,
      author: document.getElementById('note-author').value.trim() || null,
      is_highlighted: document.getElementById('note-highlighted').checked,
    };
    const res = await window.api.notes.add(job.id, data);
    if (!res.ok) { alert('Error: ' + res.error); return; }
    document.getElementById('note-modal').classList.add('hidden');
    await loadJob();
  });

  // ── Late Part Modal ───────────────────────────────────────────────────────
  function openLatePartModal() {
    document.getElementById('latepart-date').value = '';
    document.getElementById('latepart-desc').value = '';
    document.getElementById('latepart-modal').classList.remove('hidden');
  }

  document.getElementById('latepart-modal-close').addEventListener('click', () => {
    document.getElementById('latepart-modal').classList.add('hidden');
  });
  document.getElementById('latepart-cancel').addEventListener('click', () => {
    document.getElementById('latepart-modal').classList.add('hidden');
  });
  document.getElementById('latepart-save').addEventListener('click', async () => {
    const desc = document.getElementById('latepart-desc').value.trim();
    if (!desc) { alert('Please enter a description'); return; }
    const data = {
      dock_date: document.getElementById('latepart-date').value || null,
      description: desc,
    };
    const res = await window.api.lateParts.add(job.id, data);
    if (!res.ok) { alert('Error: ' + res.error); return; }
    document.getElementById('latepart-modal').classList.add('hidden');
    await loadJob();
  });

  // ── Risk Modal ────────────────────────────────────────────────────────────
  function openRiskModal() {
    document.getElementById('risk-desc').value = '';
    document.getElementById('risk-severity').value = 'Medium';
    document.getElementById('risk-status').value = 'Open';
    document.getElementById('risk-modal').classList.remove('hidden');
  }

  document.getElementById('risk-modal-close').addEventListener('click', () => {
    document.getElementById('risk-modal').classList.add('hidden');
  });
  document.getElementById('risk-cancel').addEventListener('click', () => {
    document.getElementById('risk-modal').classList.add('hidden');
  });
  document.getElementById('risk-save').addEventListener('click', async () => {
    const desc = document.getElementById('risk-desc').value.trim();
    if (!desc) { alert('Please enter a description'); return; }
    const data = {
      description: desc,
      severity: document.getElementById('risk-severity').value,
      status: document.getElementById('risk-status').value,
    };
    const res = await window.api.risks.add(job.id, data);
    if (!res.ok) { alert('Error: ' + res.error); return; }
    document.getElementById('risk-modal').classList.add('hidden');
    await loadJob();
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatDate(d) {
    if (!d) return '—';
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function projectStatusBadge(status) {
    const map = {
      'IN PROCUREMENT': 'badge-blue',
      'IN ENGINEERING': 'badge-amber',
      'SHIPPED (SOLD)': 'badge-green',
      'SHIPPED (NOT SOLD)': 'badge-gray',
    };
    return `<span class="badge ${map[status] || 'badge-gray'}">${esc(status)}</span>`;
  }

  function salesStatusBadge(status) {
    const map = {
      'SOLD': 'badge-green',
      'FORECAST': 'badge-amber',
      'DEMO': 'badge-purple',
      'CLAIMED': 'badge-orange',
    };
    return `<span class="badge ${map[status] || 'badge-gray'}">${esc(status)}</span>`;
  }
})();
