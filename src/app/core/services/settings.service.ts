import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { AppTheme, Settings } from '../models/project.models';
import { StorageService } from '../storage/storage.service';

export const DEFAULT_SETTINGS: Settings = {
  firstName: '',
  preferredTaskMinutes: 20,
  reducedMotion: false,
  theme: 'calm',
  remindersEnabled: false,
  reminderTime: '09:00'
};

const SETTINGS_KEY = 'project-companion.settings.v1';
const THEME_COLORS: Record<AppTheme, string> = {
  calm: '#526c55',
  playful: '#6c4cff',
  code: '#08141d',
  arcade: '#e23b32',
  wizard: '#741f32',
  woodland: '#176b4a'
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly storage = inject(StorageService);
  private readonly document = inject(DOCUMENT);
  private readonly state = signal<Settings>(this.sanitize(this.storage.get<Partial<Settings>>(SETTINGS_KEY, {})));

  readonly settings = this.state.asReadonly();

  constructor() {
    effect(() => {
      const settings = this.state();
      this.storage.set(SETTINGS_KEY, settings);
      this.document.documentElement.classList.toggle('reduce-motion', settings.reducedMotion);
      this.document.documentElement.dataset['theme'] = settings.theme;
      const themeColor = this.document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (themeColor) themeColor.content = THEME_COLORS[settings.theme];
    });
  }

  update(changes: Partial<Settings>): void {
    this.state.update(current => this.sanitize({ ...current, ...changes }));
  }

  replace(settings: Settings): void {
    this.state.set({ ...DEFAULT_SETTINGS, ...settings });
  }

  reset(): void { this.state.set(DEFAULT_SETTINGS); }

  private sanitize(value: Partial<Settings>): Settings {
    const minutes = Number(value.preferredTaskMinutes);
    return {
      firstName: typeof value.firstName === 'string' ? value.firstName.trim().slice(0, 50) : DEFAULT_SETTINGS.firstName,
      preferredTaskMinutes: Number.isFinite(minutes) ? Math.min(180, Math.max(5, minutes)) : DEFAULT_SETTINGS.preferredTaskMinutes,
      reducedMotion: value.reducedMotion === true,
      theme: this.isTheme(value.theme) ? value.theme : DEFAULT_SETTINGS.theme,
      remindersEnabled: value.remindersEnabled === true,
      reminderTime: typeof value.reminderTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value.reminderTime) ? value.reminderTime : DEFAULT_SETTINGS.reminderTime
    };
  }

  private isTheme(value: unknown): value is AppTheme {
    return value === 'calm' || value === 'playful' || value === 'code' || value === 'arcade'
      || value === 'wizard' || value === 'woodland';
  }
}
