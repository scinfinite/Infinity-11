export const NAV_ITEMS = [
  { id: 'command', label: 'Command Center' },
  { id: 'chat', label: 'AI Workspace' },
  { id: 'projects', label: 'Projects' },
  { id: 'runs', label: 'Runs & Activity' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'artifacts', label: 'Artifacts' },
  { id: 'usage', label: 'Usage & Cost' },
  { id: 'settings', label: 'Settings' },
] as const;

export type NavigationId = (typeof NAV_ITEMS)[number]['id'];

export interface WebPreferences {
  navigation: NavigationId;
  sidebarCollapsed: boolean;
  reducedMotion: boolean;
}

export const DEFAULT_PREFERENCES: WebPreferences = {
  navigation: 'command',
  sidebarCollapsed: false,
  reducedMotion: false,
};

export function navigate(preferences: WebPreferences, navigation: NavigationId): WebPreferences {
  return { ...preferences, navigation };
}

export function toggleSidebar(preferences: WebPreferences): WebPreferences {
  return { ...preferences, sidebarCollapsed: !preferences.sidebarCollapsed };
}

export function toggleReducedMotion(preferences: WebPreferences): WebPreferences {
  return { ...preferences, reducedMotion: !preferences.reducedMotion };
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}
