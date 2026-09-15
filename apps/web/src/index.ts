import { mount } from './app.js';

export const applicationBoundary = 'web';

if (typeof document !== 'undefined') {
  mount();
}
