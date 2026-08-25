import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class PwaService {
  private readonly document = inject(DOCUMENT);
  private installPrompt: InstallPromptEvent | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  readonly canInstall = signal(false);
  readonly updateAvailable = signal(false);
  readonly offline = signal(false);
  readonly standalone = signal(false);

  constructor() {
    const view = this.document.defaultView;
    if (!view) return;
    this.offline.set(!view.navigator.onLine);
    this.standalone.set(view.matchMedia('(display-mode: standalone)').matches);
    view.addEventListener('online', () => this.offline.set(false));
    view.addEventListener('offline', () => this.offline.set(true));
    view.addEventListener('appinstalled', () => { this.canInstall.set(false); this.standalone.set(true); });
    view.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      this.installPrompt = event as InstallPromptEvent;
      this.canInstall.set(true);
    });
    void this.register();
  }

  async install(): Promise<void> {
    if (!this.installPrompt) return;
    await this.installPrompt.prompt();
    await this.installPrompt.userChoice;
    this.installPrompt = null;
    this.canInstall.set(false);
  }

  applyUpdate(): void { this.registration?.waiting?.postMessage({ type: 'SKIP_WAITING' }); }

  private async register(): Promise<void> {
    const view = this.document.defaultView;
    if (!view?.navigator.serviceWorker || !['https:', 'http:'].includes(view.location.protocol)) return;
    if (['localhost', '127.0.0.1'].includes(view.location.hostname)) {
      const registrations = await view.navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
      const cacheKeys = await view.caches?.keys() ?? [];
      await Promise.all(cacheKeys.filter(key => key.startsWith('project-companion-')).map(key => view.caches.delete(key)));
      return;
    }
    try {
      this.registration = await view.navigator.serviceWorker.register('/service-worker.js');
      if (this.registration.waiting) this.updateAvailable.set(true);
      this.registration.addEventListener('updatefound', () => {
        const worker = this.registration?.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && view.navigator.serviceWorker.controller) this.updateAvailable.set(true);
        });
      });
      let refreshing = false;
      view.navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        view.location.reload();
      });
    } catch {
      // The app remains usable if private browsing or policy blocks service workers.
    }
  }
}
