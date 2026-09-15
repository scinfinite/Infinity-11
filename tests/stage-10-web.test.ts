import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PREFERENCES,
  NAV_ITEMS,
  clampPercent,
  formatCompactNumber,
  navigate,
  toggleReducedMotion,
  toggleSidebar,
} from '../apps/web/src/state.js';

const webRoot = resolve(process.cwd(), 'apps/web/public');

function readPublic(name: string): string {
  return readFileSync(resolve(webRoot, name), 'utf8');
}

describe('stage 10 web workspace', () => {
  it('defines stable navigation and immutable preference transitions', () => {
    expect(NAV_ITEMS).toHaveLength(8);
    expect(navigate(DEFAULT_PREFERENCES, 'projects')).toEqual({ ...DEFAULT_PREFERENCES, navigation: 'projects' });
    expect(toggleSidebar(DEFAULT_PREFERENCES).sidebarCollapsed).toBe(true);
    expect(toggleReducedMotion(DEFAULT_PREFERENCES).reducedMotion).toBe(true);
    expect(DEFAULT_PREFERENCES).toEqual({ navigation: 'command', sidebarCollapsed: false, reducedMotion: false });
  });

  it('normalizes shared display helpers at boundaries', () => {
    expect(clampPercent(-4)).toBe(0);
    expect(clampPercent(150)).toBe(100);
    expect(clampPercent(42)).toBe(42);
    expect(formatCompactNumber(1200)).toBe('1.2K');
  });

  it('ships an accessible, installable document shell', () => {
    const html = readPublic('index.html');
    const manifest = readPublic('manifest.webmanifest');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('name="viewport"');
    expect(html).toContain('rel="manifest"');
    expect(html).toContain('id="app"');
    expect(html).toContain('styles.css');
    expect(html).toContain('branding.css');
    expect(html).toContain('index.js');
    expect(html).toContain('Smarter Agents. Bigger Possibilities.');
    expect(manifest).toContain('"display": "standalone"');
    expect(manifest).toContain('"start_url": "./"');
    expect(manifest).toContain('./icon.svg');
  });

  it('ships the transparent infinity-11 brand mark', () => {
    const icon = readPublic('icon.svg');
    expect(icon).toContain('<title id="title">INFINITY-11 brand mark</title>');
    expect(icon).toContain('linearGradient id="infinity"');
    expect(icon).toContain('linearGradient id="ones"');
    expect(icon).not.toContain('<rect');
  });

  it('keeps the offline worker scoped to safe same-origin shell requests', () => {
    const worker = readPublic('sw.js');
    expect(worker).toContain("event.request.method !== 'GET'");
    expect(worker).toContain('requestUrl.origin !== self.location.origin');
    expect(worker).toContain('STATIC_PATHS');
    expect(worker).toContain('caches.match(event.request)');
    expect(worker).toContain('self.skipWaiting()');
  });

  it('supports mobile navigation and reduced-motion preferences in CSS', () => {
    const css = readPublic('styles.css');
    const branding = readPublic('branding.css');
    expect(css).toContain('@media(max-width:620px)');
    expect(css).toContain('prefers-reduced-motion:reduce');
    expect(css).toContain('focus-visible');
    expect(css).toContain('html[data-reduced-motion="true"]');
    expect(branding).toContain('.brand-mark');
    expect(branding).toContain('background:transparent');
  });
});
