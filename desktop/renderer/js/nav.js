/**
 * nav.js — Shared navigation logic.
 * Highlights the current page's nav link in the sidebar.
 * Provides a global navigate() helper.
 */

(function () {
  // Determine current page from filename
  const page = location.pathname.split('/').pop().replace('.html', '') || 'index';
  const pageKey = page === 'index' ? 'dashboard' : page;

  // Highlight active nav link
  document.querySelectorAll('.nav-link[data-page]').forEach((el) => {
    if (el.dataset.page === pageKey) {
      el.classList.add('active');
    }
  });

  // Global navigate helper
  window.navigate = function (targetPage, params) {
    window.api.navigate(targetPage, params || {});
  };

  // Wire all nav links
  document.querySelectorAll('.nav-link[data-page]').forEach((el) => {
    el.addEventListener('click', () => {
      navigate(el.dataset.page);
    });
  });
})();
