import { mount } from './app.js';

export const applicationBoundary = 'web';

if (typeof document !== 'undefined') {
  mount();
  if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    void navigator.serviceWorker.register('./sw.js');
  }
}
