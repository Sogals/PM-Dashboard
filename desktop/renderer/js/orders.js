/**
 * orders.js — All Orders table page
 */

(async function () {
  let allJobs = [];
  let sortCol = 'ship_date';
  let sortDir = 'asc';

  // Load machine types for filter
  const machRes = await window.api.admin.getMachineTypes();
  if (machRes.ok) {
    const sel = document.getElementById('filter-machine-type');
    machRes.data.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.name;
      opt.textContent = m.name;
      sel.appendChild(opt);
    });
  }

  // Initial load
  await loadJobs();

  // Event listeners
  let searchTimer;
  document.getElementById('search-input').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => renderTable(), 200);
  });

  document.getElementById('filter-proj-status').addEventListener('change', renderTable);
  document.getElementById('filter-sales-status').addEventListener('change', renderTable);
  document.getElementById('filter-machine-type').addEventListener('change', renderTable);

  document.getElementById('btn-clear-filters').addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-proj-status').value = '';
    document.getElementById('filter-sales-status').value = '';
    document.getElementById('filter-machine-type').value = '';
    renderTable();
  });

  // Sort headers
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      if (sortCol === col) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortCol = col;
        sortDir = 'asc';
      }
      updateSortHeaders();
      renderTable();
    });
  });

  function updateSortHeaders() {
    document.querySelectorAll('th.sortable').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.col === sortCol) {
        th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
      }
    });
  }

  async function loadJobs() {
    const res = await window.api.jobs.getAll({});
    if (!res.ok) { console.error(res.error); return; }
    allJobs = res.data;
    renderTable();
  }

  function renderTable() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const projStatus = document.getElementById('filter-proj-status').value;
    const salesStatus = document.getElementById('filter-sales-status').value;
    const machType = document.getElementById('filter-machine-type').value;

    let filtered = allJobs.filter(j => {
      if (search) {
        const hay = `${j.project_ng} ${j.module_number || ''} ${j.customer_name || ''}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      if (projStatus && j.project_status !== projStatus) return false;
      if (salesStatus && j.sales_status !== salesStatus) return false;
      if (machType && j.machine_type_name !== machType) return false;
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let va = a[sortCol] ?? '';
      let vb = b[sortCol] ?? '';
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      va = String(va);
      vb = String(vb);
      const cmp = va.localeCompare(vb);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    document.getElementById('orders-count').textContent =
      `${filtered.length} of ${allJobs.length} orders`;

    const tbody = document.getElementById('orders-tbody');
    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted" style="padding:30px">No orders match filters</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(job => {
      const slip = job.slip_days || 0;
      const slipClass = slip === 0 ? 'slip-0' : slip <= 14 ? 'slip-low' : 'slip-high';
      const slipText = slip === 0 ? '—' : `+${slip}d`;
      const priorityCls = job.priority === 'High' ? 'badge-red' : job.priority === 'Low' ? 'badge-gray' : '';
      return `
        <tr class="clickable" onclick="navigate('job', {id: ${job.id}})">
          <td><span class="fw-600">${esc(job.project_ng)}</span></td>
          <td>${esc(job.module_number || '—')}</td>
          <td>${esc(job.customer_name || '—')}</td>
          <td>${esc(job.machine_type_name || '—')}</td>
          <td>${salesStatusBadge(job.sales_status)}</td>
          <td>${projectStatusBadge(job.project_status)}</td>
          <td>${formatDate(job.assembly_date)}</td>
          <td>${formatDate(job.test_date)}</td>
          <td>${formatDate(job.ship_date)}</td>
          <td class="${slipClass}">${slipText}</td>
          <td>${job.priority ? `<span class="badge ${priorityCls}">${esc(job.priority)}</span>` : '—'}</td>
        </tr>`;
    }).join('');

    updateSortHeaders();
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatDate(d) {
    if (!d) return '<span class="text-muted">—</span>';
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
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
