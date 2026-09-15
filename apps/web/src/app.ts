import {
  DEFAULT_PREFERENCES,
  NAV_ITEMS,
  clampPercent,
  formatCompactNumber,
  navigate,
  toggleReducedMotion,
  toggleSidebar,
  type NavigationId,
  type WebPreferences,
} from './state.js';

const PROJECTS = [
  { name: 'Infinity Core', meta: '12 agents · active', health: 96 },
  { name: 'SI-Agents', meta: '8 agents · synced', health: 91 },
  { name: 'Research Lab', meta: '4 agents · idle', health: 84 },
];

const ACTIVITY = [
  ['Agent Runtime', 'Verification completed', '2m ago', 'success'],
  ['Project Brain', 'Indexed 148 files', '8m ago', 'info'],
  ['Automation', 'Workflow resumed after approval', '14m ago', 'warning'],
  ['AI Gateway', 'Routed to fallback model', '22m ago', 'info'],
] as const;

const BRAND_TAGLINE = 'Smarter Agents. Bigger Possibilities.';

let preferences: WebPreferences = { ...DEFAULT_PREFERENCES };

function icon(name: string): string {
  const paths: Record<string, string> = {
    command: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
    chat: '<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2h9A3.5 3.5 0 0 1 20 5.5v6a3.5 3.5 0 0 1-3.5 3.5H12l-4.5 3v-3.1A3.5 3.5 0 0 1 4 11.5z"/>',
    projects:
      '<path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z"/>',
    runs: '<path d="M5 4v16l14-8z"/>',
    approvals: '<path d="m5 12 4 4L19 6"/>',
    artifacts: '<path d="M4 5h16v14H4zM8 9h8M8 13h5"/>',
    usage: '<path d="M5 19V9M12 19V5M19 19v-7"/>',
    settings:
      '<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6v3m0 14v3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M2 12h3m14 0h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] ?? ''}</svg>`;
}

function navMarkup(): string {
  return NAV_ITEMS.map(
    (item) => `
    <button class="nav-item ${preferences.navigation === item.id ? 'active' : ''}" data-nav="${item.id}" aria-current="${preferences.navigation === item.id ? 'page' : 'false'}" title="${item.label}">
      ${icon(item.id)}<span>${item.label}</span>
    </button>`,
  ).join('');
}

function commandMarkup(): string {
  return `
    <section class="hero panel">
      <div>
        <span class="eyebrow">INFINITY-11 · COMMAND CENTER</span>
        <h1>Build. Operate. Improve.</h1>
        <p>One governed workspace for agents, automation, projects, verification and delivery.</p>
      </div>
      <button class="primary" data-action="new-run">Start a run <span>⌘ ↵</span></button>
    </section>
    <section class="metrics" aria-label="System overview">
      <article class="metric panel"><span>Active runs</span><strong>07</strong><small>+2 since yesterday</small></article>
      <article class="metric panel"><span>Agents working</span><strong>18</strong><small>6 teams · 3 queued</small></article>
      <article class="metric panel"><span>Verification</span><strong>94%</strong><small>healthy evidence coverage</small></article>
      <article class="metric panel"><span>Spend today</span><strong>$2.84</strong><small>31% under budget</small></article>
    </section>
    <section class="dashboard-grid">
      <article class="panel projects-panel">
        <div class="section-head"><div><span class="eyebrow">PROJECTS</span><h2>Workspace pulse</h2></div><button class="ghost" data-nav="projects">View all</button></div>
        <div class="project-list">${PROJECTS.map((project) => `<button class="project-row" data-nav="projects"><span class="project-mark">${project.name.slice(0, 1)}</span><span class="project-copy"><strong>${project.name}</strong><small>${project.meta}</small></span><span class="health"><i style="width:${clampPercent(project.health)}%"></i></span><b>${project.health}%</b></button>`).join('')}</div>
      </article>
      <article class="panel activity-panel">
        <div class="section-head"><div><span class="eyebrow">LIVE ACTIVITY</span><h2>What is happening</h2></div><button class="ghost" data-nav="runs">Open runs</button></div>
        <div class="activity-list">${ACTIVITY.map(([source, text, time, status]) => `<div class="activity"><span class="status-dot ${status}"></span><div><strong>${source}</strong><p>${text}</p></div><time>${time}</time></div>`).join('')}</div>
      </article>
    </section>
    <section class="panel quick-panel">
      <div><span class="eyebrow">COMMAND BAR</span><h2>Tell INFINITY-11 what to do next.</h2></div>
      <button class="command-input" data-action="new-run"><span class="spark">✦</span><span>Describe a task, build, investigation or workflow…</span><kbd>⌘ K</kbd></button>
    </section>`;
}

function placeholderMarkup(id: NavigationId): string {
  const labels: Record<NavigationId, [string, string]> = {
    command: ['Command Center', 'Your governed system overview.'],
    chat: ['AI Workspace', 'A focused surface for model conversations and engineering tasks.'],
    projects: ['Projects', 'Projects, context, requirements and engineering health.'],
    runs: ['Runs & Activity', 'Durable execution history, evidence and live progress.'],
    approvals: ['Approvals', 'Review policy-gated actions before they execute.'],
    artifacts: ['Artifacts', 'Generated files, builds, reports and verified outputs.'],
    usage: ['Usage & Cost', 'Transparent model, execution and automation usage.'],
    settings: ['Settings', 'Workspace, security, accessibility and experience controls.'],
  };
  const [title, description] = labels[id];
  return `<section class="panel page-placeholder"><span class="eyebrow">WORKSPACE</span><h1>${title}</h1><p>${description}</p><button class="primary" data-nav="command">Back to Command Center</button></section>`;
}

function render(): void {
  const root = document.querySelector<HTMLDivElement>('#app');
  if (!root) return;
  document.documentElement.dataset.reducedMotion = String(preferences.reducedMotion);
  root.innerHTML = `
    <div class="app-shell ${preferences.sidebarCollapsed ? 'sidebar-collapsed' : ''}">
      <aside class="sidebar" aria-label="Primary navigation">
        <div class="brand"><img class="brand-mark" src="./icon.svg" alt="INFINITY-11" width="38" height="38"/><div class="brand-copy"><span class="brand-name">INFINITY<span>-11</span></span><small>${BRAND_TAGLINE}</small></div></div>
        <button class="workspace-switcher" aria-label="Current workspace"><span class="avatar">SI</span><span><strong>SC Infinite</strong><small>Personal workspace</small></span><span class="chevron">⌄</span></button>
        <nav class="nav">${navMarkup()}</nav>
        <div class="sidebar-bottom"><button class="nav-item" data-action="toggle-motion">${icon('settings')}<span>${preferences.reducedMotion ? 'Motion reduced' : 'Motion enabled'}</span></button><div class="security-note"><span>●</span><span><strong>Governed</strong><small>Policy controls active</small></span></div></div>
      </aside>
      <main class="main">
        <header class="topbar"><button class="icon-button" data-action="toggle-sidebar" aria-label="Toggle sidebar">☰</button><div class="breadcrumbs"><span>Workspace</span><b>/</b><strong>${NAV_ITEMS.find((item) => item.id === preferences.navigation)?.label}</strong></div><div class="top-actions"><button class="icon-button" data-action="notifications" aria-label="Notifications">◌<span class="notification-dot"></span></button><button class="profile" aria-label="Account menu"><span class="avatar">SI</span><span>SC Infinite</span><b>⌄</b></button></div></header>
        <div class="content">${preferences.navigation === 'command' ? commandMarkup() : placeholderMarkup(preferences.navigation)}</div>
      </main>
    </div>
    <div class="toast" role="status" aria-live="polite" aria-atomic="true"></div>`;

  root.querySelectorAll<HTMLElement>('[data-nav]').forEach((element) =>
    element.addEventListener('click', () => {
      const id = element.dataset.nav as NavigationId | undefined;
      if (id && NAV_ITEMS.some((item) => item.id === id)) {
        preferences = navigate(preferences, id);
        render();
      }
    }),
  );
  root.querySelectorAll<HTMLElement>('[data-action]').forEach((element) =>
    element.addEventListener('click', () => {
      const action = element.dataset.action;
      if (action === 'toggle-sidebar') preferences = toggleSidebar(preferences);
      if (action === 'toggle-motion') preferences = toggleReducedMotion(preferences);
      if (action === 'new-run') showToast('Run composer ready — describe your task to begin.');
      if (action === 'notifications') showToast('No blocking notifications.');
      render();
    }),
  );
}

function showToast(message: string): void {
  const toast = document.querySelector<HTMLDivElement>('.toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  window.setTimeout(() => toast.classList.remove('visible'), 2400);
}

export function mount(): void {
  render();
}

export { formatCompactNumber };
