import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../storage/storage.service';
import { SettingsService } from './settings.service';
import { TodaysTaskService } from './todays-task.service';

export type ReminderPermission = NotificationPermission | 'unsupported';
const SNOOZED_REMINDER_KEY = 'project-companion.snoozed-reminder.v1';

@Injectable({ providedIn: 'root' })
export class ReminderService {
  private readonly document = inject(DOCUMENT);
  private readonly settings = inject(SettingsService);
  private readonly today = inject(TodaysTaskService);
  private readonly router = inject(Router);
  private readonly storage = inject(StorageService);
  private timerId: number | undefined;
  private snoozeTimerId: number | undefined;

  readonly supported = Boolean(this.document.defaultView?.Notification);
  readonly permission = signal<ReminderPermission>(this.supported ? Notification.permission : 'unsupported');
  readonly snoozedUntil = signal<string | null>(this.loadSnoozedReminder());

  constructor() {
    effect(onCleanup => {
      const settings = this.settings.settings();
      const pendingTask = this.today.today();
      this.permission();
      void this.updateBadge(Boolean(pendingTask));
      this.clearTimer();
      if (settings.remindersEnabled && pendingTask && this.permission() === 'granted') this.scheduleNext(settings.reminderTime);
      onCleanup(() => this.clearTimer());
    });
    effect(onCleanup => {
      const dueAt = this.snoozedUntil();
      this.clearSnoozeTimer();
      if (!dueAt) return;
      const delay = new Date(dueAt).getTime() - Date.now();
      if (delay <= 0) {
        queueMicrotask(() => this.cancelSnoozedReminder());
        return;
      }
      this.snoozeTimerId = this.document.defaultView?.setTimeout(() => {
        this.storage.remove(SNOOZED_REMINDER_KEY);
        this.snoozedUntil.set(null);
        this.showNotification(false);
      }, delay);
      onCleanup(() => this.clearSnoozeTimer());
    });
  }

  async setEnabled(enabled: boolean): Promise<boolean> {
    if (!enabled) {
      this.settings.update({ remindersEnabled: false });
      return true;
    }
    const NotificationApi = this.document.defaultView?.Notification;
    if (!NotificationApi) return false;
    let permission = NotificationApi.permission;
    if (permission === 'default') permission = await NotificationApi.requestPermission();
    this.permission.set(permission);
    const granted = permission === 'granted';
    this.settings.update({ remindersEnabled: granted });
    return granted;
  }

  sendTest(): void {
    if (this.permission() === 'granted') this.showNotification(true);
  }

  async remindIn(minutes: number): Promise<Date | null> {
    const dueAt = new Date(Date.now() + Math.max(1, minutes) * 60_000);
    return this.remindAt(dueAt);
  }

  async remindTomorrow(): Promise<Date | null> {
    const [hours, minutes] = this.settings.settings().reminderTime.split(':').map(Number);
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + 1);
    dueAt.setHours(hours, minutes, 0, 0);
    return this.remindAt(dueAt);
  }

  cancelSnoozedReminder(): void {
    this.clearSnoozeTimer();
    this.storage.remove(SNOOZED_REMINDER_KEY);
    this.snoozedUntil.set(null);
  }

  private async remindAt(dueAt: Date): Promise<Date | null> {
    if (!await this.ensurePermission()) return null;
    const iso = dueAt.toISOString();
    this.storage.set(SNOOZED_REMINDER_KEY, iso);
    this.snoozedUntil.set(iso);
    return dueAt;
  }

  private async ensurePermission(): Promise<boolean> {
    const NotificationApi = this.document.defaultView?.Notification;
    if (!NotificationApi) return false;
    let permission = NotificationApi.permission;
    if (permission === 'default') permission = await NotificationApi.requestPermission();
    this.permission.set(permission);
    return permission === 'granted';
  }

  private scheduleNext(time: string): void {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    this.timerId = this.document.defaultView?.setTimeout(() => {
      this.showNotification(false);
      this.scheduleNext(this.settings.settings().reminderTime);
    }, next.getTime() - now.getTime());
  }

  private showNotification(test: boolean): void {
    const item = this.today.today();
    const NotificationApi = this.document.defaultView?.Notification;
    if (!item || !NotificationApi || NotificationApi.permission !== 'granted') return;
    const notification = new NotificationApi(test ? 'Reminders are ready!' : 'Your next quest is ready', {
      body: `${item.task.title} · ${item.project.title}`,
      tag: test ? 'project-companion-test' : 'project-companion-daily'
    });
    notification.onclick = () => {
      this.document.defaultView?.focus();
      void this.router.navigate(['/today']);
      notification.close();
    };
  }

  private async updateBadge(hasPendingTask: boolean): Promise<void> {
    const navigator = this.document.defaultView?.navigator;
    try {
      if (!navigator || !('setAppBadge' in navigator)) return;
      if (hasPendingTask) await navigator.setAppBadge(1);
      else await navigator.clearAppBadge();
    } catch {
      // Badges are optional and may be blocked by the browser or operating system.
    }
  }

  private clearTimer(): void {
    if (this.timerId !== undefined) this.document.defaultView?.clearTimeout(this.timerId);
    this.timerId = undefined;
  }

  private clearSnoozeTimer(): void {
    if (this.snoozeTimerId !== undefined) this.document.defaultView?.clearTimeout(this.snoozeTimerId);
    this.snoozeTimerId = undefined;
  }

  private loadSnoozedReminder(): string | null {
    const value = this.storage.get<string | null>(SNOOZED_REMINDER_KEY, null);
    if (!value || !Number.isFinite(new Date(value).getTime()) || new Date(value).getTime() <= Date.now()) {
      this.storage.remove(SNOOZED_REMINDER_KEY);
      return null;
    }
    return value;
  }
}
