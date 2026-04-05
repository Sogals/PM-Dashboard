'use strict';

// ── Tab switching ─────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => {
      p.classList.add('hidden');
      p.classList.remove('active');
    });
    btn.classList.add('active');
    const panel = document.getElementById(`tab-${btn.dataset.tab}`);
    if (panel) {
      panel.classList.remove('hidden');
      panel.classList.add('active');
    }
  });
});

// ── Confirm modal ─────────────────────────────────────────────────────────────
let confirmCallback = null;

function showConfirm(message, cb) {
  confirmCallback = cb;
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-modal').classList.remove('hidden');
}

document.getElementById('confirm-close').addEventListener('click', () => {
  document.getElementById('confirm-modal').classList.add('hidden');
  confirmCallback = null;
});
document.getElementById('confirm-cancel').addEventListener('click', () => {
  document.getElementById('confirm-modal').classList.add('hidden');
  confirmCallback = null;
});
document.getElementById('confirm-ok').addEventListener('click', () => {
  document.getElementById('confirm-modal').classList.add('hidden');
  if (confirmCallback) confirmCallback();
  confirmCallback = null;
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

// ── Machine Types ─────────────────────────────────────────────────────────────
async function loadMachineTypes() {
  const res = await window.api.admin.getMachineTypes();
  const tbody = document.getElementById('machine-types-tbody');
  if (!res.ok || !res.data.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-muted text-center" style="padding:16px">No machine types found.</td></tr>';
    return;
  }
  tbody.innerHTML = res.data.map((mt) => `
    <tr>
      <td><strong>${mt.name}</strong></td>
      <td class="text-muted">${mt.description || '—'}</td>
      <td>
        <button class="btn btn-sm btn-danger" data-delete-mt="${mt.id}" data-name="${mt.name}">Delete</button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-delete-mt]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showConfirm(`Delete machine type "${btn.dataset.name}"?`, async () => {
        await window.api.admin.deleteMachineType(btn.dataset.deleteMt);
        loadMachineTypes();
      });
    });
  });
}

document.getElementById('mt-save').addEventListener('click', async () => {
  const name = document.getElementById('mt-name').value.trim();
  const desc = document.getElementById('mt-desc').value.trim();
  if (!name) return showError('mt-error', 'Name is required.');
  const res = await window.api.admin.addMachineType({ name, description: desc });
  if (!res.ok) return showError('mt-error', res.error || 'Failed to add.');
  document.getElementById('mt-name').value = '';
  document.getElementById('mt-desc').value = '';
  loadMachineTypes();
});

// ── Statuses ──────────────────────────────────────────────────────────────────
async function loadStatuses() {
  const res = await window.api.admin.getStatuses();
  const tbody = document.getElementById('statuses-tbody');
  if (!res.ok || !res.data.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-muted text-center" style="padding:16px">No statuses found.</td></tr>';
    return;
  }
  tbody.innerHTML = res.data.map((s) => `
    <tr>
      <td><span class="text-muted" style="font-size:11px">${s.type === 'projectStatus' ? 'Project' : 'Sales'}</span></td>
      <td>
        <span class="badge" style="background:${s.color}20;color:${s.color};border:1px solid ${s.color}40">${s.value}</span>
      </td>
      <td><span style="display:inline-block;width:20px;height:20px;background:${s.color};border-radius:4px;vertical-align:middle"></span></td>
      <td>
        <button class="btn btn-sm btn-danger" data-delete-status="${s.id}" data-name="${s.value}">Delete</button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-delete-status]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showConfirm(`Delete status "${btn.dataset.name}"?`, async () => {
        await window.api.admin.deleteStatus(btn.dataset.deleteStatus);
        loadStatuses();
      });
    });
  });
}

document.getElementById('status-save').addEventListener('click', async () => {
  const type = document.getElementById('status-type').value;
  const value = document.getElementById('status-value').value.trim().toUpperCase();
  const color = document.getElementById('status-color').value;
  if (!value) return showError('status-error', 'Value is required.');
  const res = await window.api.admin.addStatus({ type, value, color });
  if (!res.ok) return showError('status-error', res.error || 'Failed to add.');
  document.getElementById('status-value').value = '';
  loadStatuses();
});

// ── Milestone Templates ───────────────────────────────────────────────────────
async function loadTemplates() {
  const res = await window.api.admin.getTemplates();
  const tbody = document.getElementById('templates-tbody');
  if (!res.ok || !res.data.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-muted text-center" style="padding:16px">No templates found.</td></tr>';
    return;
  }

  // Group by category
  const grouped = {};
  res.data.forEach((t) => {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  });

  const catLabel = { engineering: 'Engineering', operations: 'Operations', commercial: 'Commercial' };
  const catColor = { engineering: 'var(--amber)', operations: 'var(--blue)', commercial: 'var(--green)' };

  let rows = '';
  ['engineering', 'operations', 'commercial'].forEach((cat) => {
    if (!grouped[cat]) return;
    grouped[cat].forEach((t) => {
      rows += `
        <tr>
          <td><span class="badge" style="background:${catColor[cat]}20;color:${catColor[cat]}">${catLabel[cat]}</span></td>
          <td>${t.name}</td>
          <td class="text-muted">${t.display_order}</td>
          <td>
            <button class="btn btn-sm btn-danger" data-delete-tmpl="${t.id}" data-name="${t.name}">Delete</button>
          </td>
        </tr>
      `;
    });
  });
  tbody.innerHTML = rows;

  tbody.querySelectorAll('[data-delete-tmpl]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showConfirm(`Delete template "${btn.dataset.name}"?`, async () => {
        await window.api.admin.deleteTemplate(btn.dataset.deleteTmpl);
        loadTemplates();
      });
    });
  });
}

document.getElementById('tmpl-save').addEventListener('click', async () => {
  const category = document.getElementById('tmpl-category').value;
  const name = document.getElementById('tmpl-name').value.trim();
  const order = parseInt(document.getElementById('tmpl-order').value) || 0;
  if (!name) return showError('tmpl-error', 'Name is required.');
  const res = await window.api.admin.addTemplate({ name, category, display_order: order });
  if (!res.ok) return showError('tmpl-error', res.error || 'Failed to add.');
  document.getElementById('tmpl-name').value = '';
  loadTemplates();
});

// ── Customers ─────────────────────────────────────────────────────────────────
async function loadCustomers() {
  const res = await window.api.db.query('SELECT * FROM customers ORDER BY name ASC');
  const tbody = document.getElementById('customers-tbody');
  if (!res.ok || !res.data.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-muted text-center" style="padding:16px">No customers found.</td></tr>';
    return;
  }
  tbody.innerHTML = res.data.map((c) => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td class="text-muted">${c.contact || '—'}</td>
      <td class="text-muted">${c.email || '—'}</td>
      <td class="text-muted">${c.region || '—'}</td>
      <td>
        <button class="btn btn-sm btn-danger" data-delete-cust="${c.id}" data-name="${c.name}">Delete</button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-delete-cust]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showConfirm(`Delete customer "${btn.dataset.name}"? This may affect existing jobs.`, async () => {
        await window.api.db.run('DELETE FROM customers WHERE id = ?', [btn.dataset.deleteCust]);
        loadCustomers();
      });
    });
  });
}

document.getElementById('cust-save').addEventListener('click', async () => {
  const name = document.getElementById('cust-name').value.trim();
  const contact = document.getElementById('cust-contact').value.trim();
  const email = document.getElementById('cust-email').value.trim();
  const region = document.getElementById('cust-region').value.trim();
  if (!name) return showError('cust-error', 'Name is required.');
  const res = await window.api.db.run(
    'INSERT INTO customers (name, contact, email, region) VALUES (?, ?, ?, ?)',
    [name, contact, email, region]
  );
  if (!res.ok) return showError('cust-error', res.error || 'Failed to add.');
  document.getElementById('cust-name').value = '';
  document.getElementById('cust-contact').value = '';
  document.getElementById('cust-email').value = '';
  document.getElementById('cust-region').value = '';
  loadCustomers();
});

// ── Init ──────────────────────────────────────────────────────────────────────
loadMachineTypes();
loadStatuses();
loadTemplates();
loadCustomers();
