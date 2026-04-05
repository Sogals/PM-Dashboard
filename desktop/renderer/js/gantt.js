/**
 * gantt.js — Gantt chart view
 */

(async function () {
  const PX_PER_DAY = 6;
  const LABEL_W = 280;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let allJobs = [];

  // Load jobs
  const res = await window.api.jobs.getAll({});
  if (!res.ok) {
    document.getElementById('gantt-content').innerHTML =
      `<div class="empty-state"><div class="empty-icon">⚠️</div><p>${res.error}</p></div>`;
    return;
  }
  allJobs = res.data;

  document.getElementById('filter-status').addEventListener('change', render);
  document.getElementById('filter-span').addEventListener('change', render);

  render();

  function render() {
    const statusFilter = document.getElementById('filter-status').value;
    const spanMonths = parseInt(document.getElementById('filter-span').value, 10);

    let jobs = allJobs.filter(j => {
      if (statusFilter && j.project_status !== statusFilter) return false;
      // Must have at least a ship date or assembly date
      return j.assembly_date || j.ship_date;
    });

    // Calculate time window
    // Start 2 months before today, end spanMonths after today
    const windowStart = new Date(today);
    windowStart.setMonth(windowStart.getMonth() - 1);
    windowStart.setDate(1);

    const windowEnd = new Date(windowStart);
    windowEnd.setMonth(windowEnd.getMonth() + spanMonths + 1);
    windowEnd.setDate(0); // last day of previous month

    const totalDays = Math.ceil((windowEnd - windowStart) / (1000 * 60 * 60 * 24));
    const timelineWidth = totalDays * PX_PER_DAY;

    // Sort by ship date
    jobs.sort((a, b) => {
      const da = a.ship_date || a.assembly_date || '';
      const db = b.ship_date || b.assembly_date || '';
      return da.localeCompare(db);
    });

    // Build months array for header
    const months = [];
    let cur = new Date(windowStart);
    while (cur < windowEnd) {
      const monthStart = new Date(cur);
      const offsetDays = Math.ceil((monthStart - windowStart) / (1000 * 60 * 60 * 24));
      months.push({ date: new Date(cur), offsetDays });
      cur.setMonth(cur.getMonth() + 1);
    }

    const todayOffset = Math.ceil((today - windowStart) / (1000 * 60 * 60 * 24)) * PX_PER_DAY;

    // Build HTML
    let html = `<div style="display:flex; flex-direction:column; min-width:${LABEL_W + timelineWidth}px;">`;

    // Header row
    html += `
      <div class="gantt-header-row">
        <div class="gantt-label-header">Job</div>
        <div class="gantt-months-header" style="width:${timelineWidth}px; position:relative; height:40px;">
    `;

    months.forEach(m => {
      const left = m.offsetDays * PX_PER_DAY;
      const label = m.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      html += `<div class="gantt-month-tick" style="left:${left}px;">${label}</div>`;
    });

    // Today marker in header
    html += `<div style="position:absolute;left:${todayOffset}px;top:0;bottom:0;width:2px;background:var(--red);opacity:.5;"></div>`;

    html += `</div></div>`;

    // Job rows
    if (jobs.length === 0) {
      html += `<div class="empty-state" style="margin:40px auto;"><div class="empty-icon">📅</div><p>No jobs to display</p></div>`;
    } else {
      jobs.forEach(job => {
        const asmDate = job.assembly_date ? new Date(job.assembly_date + 'T00:00:00') : null;
        const shipDate = job.ship_date ? new Date(job.ship_date + 'T00:00:00') : null;

        let barStart = asmDate || shipDate;
        let barEnd = shipDate || asmDate;

        if (!barStart || !barEnd) return;

        // Clamp to window
        const startDay = Math.max(0, Math.ceil((barStart - windowStart) / (1000 * 60 * 60 * 24)));
        const endDay = Math.min(totalDays, Math.ceil((barEnd - windowStart) / (1000 * 60 * 60 * 24)));
        const barLeft = startDay * PX_PER_DAY;
        const barWidth = Math.max(8, (endDay - startDay) * PX_PER_DAY);

        const barColor = getBarColor(job.project_status);
        const slip = job.slip_days || 0;
        const slipText = slip > 0 ? ` +${slip}d` : '';

        // Grid lines
        let gridLines = '';
        months.forEach(m => {
          const gx = m.offsetDays * PX_PER_DAY;
          gridLines += `<div class="gantt-grid-bg" style="left:${gx}px;"></div>`;
        });

        html += `
          <div class="gantt-job-row">
            <div class="gantt-row-label" onclick="navigate('job', {id: ${job.id}})">
              <div class="job-ng-small">${esc(job.project_ng)}</div>
              <div class="customer-small">${esc(job.customer_name || '—')}</div>
            </div>
            <div class="gantt-bar-area" style="width:${timelineWidth}px; position:relative; height:42px;">
              ${gridLines}
              <div class="gantt-today-line" style="left:${todayOffset}px;"></div>
              <div class="gantt-bar" title="${esc(job.project_ng)} — ${esc(job.customer_name || '')}${slipText}"
                   style="left:${barLeft}px; width:${barWidth}px; background:${barColor};"
                   onclick="navigate('job', {id: ${job.id}})">
                ${barWidth > 40 ? esc(job.project_ng) : ''}
              </div>
            </div>
          </div>`;
      });
    }

    html += '</div>';

    document.getElementById('gantt-content').innerHTML = html;
  }

  function getBarColor(status) {
    switch (status) {
      case 'IN PROCUREMENT': return '#3B82F6';
      case 'IN ENGINEERING': return '#F59E0B';
      case 'SHIPPED (SOLD)': return '#10B981';
      case 'SHIPPED (NOT SOLD)': return '#6B7280';
      default: return '#9CA3AF';
    }
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
