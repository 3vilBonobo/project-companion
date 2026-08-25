import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ReminderService } from './core/services/reminder.service';
import { PwaService } from './core/services/pwa.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ion-app><ion-router-outlet />
    @if (pwa.offline()) { <div class="connection-banner" role="status">Offline · your saved projects still work</div> }
    @if (pwa.canInstall() && !installDismissed()) {
      <aside class="pwa-prompt" aria-label="Install Project Companion">
        <img src="/icons/companion-192.png" alt="" /><div><strong>Keep your companion close</strong><span>Install the web app for quick, fullscreen access.</span></div>
        <button type="button" class="install" (click)="pwa.install()">Install</button><button type="button" class="dismiss" aria-label="Dismiss install prompt" (click)="installDismissed.set(true)">×</button>
      </aside>
    }
    @if (pwa.updateAvailable()) { <aside class="update-prompt" role="status"><span>A fresh version is ready.</span><button type="button" (click)="pwa.applyUpdate()">Update</button></aside> }
  </ion-app>`,
  styles: [`
    .connection-banner { position: fixed; z-index: 1200; top: max(8px, env(safe-area-inset-top)); left: 50%; transform: translateX(-50%); padding: 7px 13px; border-radius: 99px; background: var(--ink); color: var(--surface); font-size: .7rem; font-weight: 750; box-shadow: var(--card-shadow); }
    .pwa-prompt, .update-prompt { position: fixed; z-index: 1100; right: 18px; bottom: max(82px, calc(66px + env(safe-area-inset-bottom))); display: flex; align-items: center; gap: 12px; width: min(calc(100vw - 36px), 430px); padding: 12px; border: 1px solid var(--line); border-radius: 20px; background: var(--surface); box-shadow: 0 18px 50px rgba(0,0,0,.2); color: var(--ink); }
    .pwa-prompt img { width: 46px; height: 46px; border-radius: 14px; }
    .pwa-prompt > div { display: grid; flex: 1; gap: 3px; min-width: 0; }
    .pwa-prompt strong { font-size: .83rem; } .pwa-prompt span { color: var(--muted); font-size: .68rem; line-height: 1.35; }
    button { border: 0; font: inherit; cursor: pointer; }
    .install, .update-prompt button { min-height: 38px; padding: 0 14px; border-radius: 12px; background: var(--ion-color-primary); color: var(--ion-color-primary-contrast); font-size: .75rem; font-weight: 800; }
    .dismiss { padding: 7px; background: none; color: var(--muted); font-size: 1.2rem; }
    .update-prompt { justify-content: space-between; }
    .update-prompt span { font-size: .8rem; font-weight: 700; }
    @media (max-width: 520px) { .pwa-prompt, .update-prompt { right: 10px; width: calc(100vw - 20px); } .pwa-prompt span { display: none; } }
  `]
})
export class AppComponent {
  private readonly reminders = inject(ReminderService);
  readonly pwa = inject(PwaService);
  readonly installDismissed = signal(false);
}
