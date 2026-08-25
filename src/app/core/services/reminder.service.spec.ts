import { DOCUMENT } from '@angular/common';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Settings } from '../models/project.models';
import { StorageService } from '../storage/storage.service';
import { ReminderService } from './reminder.service';
import { SettingsService } from './settings.service';
import { TodaysTaskService } from './todays-task.service';

class MemoryStorage {
  readonly values = new Map<string, unknown>();
  get<T>(key: string, fallback: T): T { return (this.values.get(key) as T | undefined) ?? fallback; }
  set<T>(key: string, value: T): boolean { this.values.set(key, value); return true; }
  remove(key: string): void { this.values.delete(key); }
}

describe('ReminderService', () => {
  let storage: MemoryStorage;
  let notificationPermission: NotificationPermission;

  beforeEach(() => {
    storage = new MemoryStorage();
    notificationPermission = 'granted';
    class FakeNotification {
      static get permission(): NotificationPermission { return notificationPermission; }
      static requestPermission(): Promise<NotificationPermission> { return Promise.resolve(notificationPermission); }
      onclick: (() => void) | null = null;
      constructor(_title: string, _options?: NotificationOptions) {}
      close(): void {}
    }
    const settings = signal<Settings>({
      firstName: '',
      preferredTaskMinutes: 20,
      reducedMotion: false,
      soundEffectsEnabled: true,
      theme: 'calm',
      remindersEnabled: false,
      reminderTime: '09:00'
    });
    const fakeWindow = {
      Notification: FakeNotification,
      navigator: {},
      setTimeout: jasmine.createSpy('setTimeout').and.returnValue(1),
      clearTimeout: jasmine.createSpy('clearTimeout'),
      focus: jasmine.createSpy('focus')
    };
    TestBed.configureTestingModule({
      providers: [
        ReminderService,
        { provide: DOCUMENT, useValue: { defaultView: fakeWindow } },
        { provide: StorageService, useValue: storage },
        { provide: SettingsService, useValue: { settings, update: (changes: Partial<Settings>) => settings.update(value => ({ ...value, ...changes })) } },
        { provide: TodaysTaskService, useValue: { today: signal(null) } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    });
  });

  it('stores and cancels a one-off reminder without enabling the daily reminder', async () => {
    const service = TestBed.inject(ReminderService);
    const dueAt = await service.remindIn(30);

    expect(dueAt).not.toBeNull();
    expect(service.snoozedUntil()).toBe(dueAt!.toISOString());
    expect(storage.values.get('project-companion.snoozed-reminder.v1')).toBe(dueAt!.toISOString());

    service.cancelSnoozedReminder();
    expect(service.snoozedUntil()).toBeNull();
    expect(storage.values.has('project-companion.snoozed-reminder.v1')).toBeFalse();
  });

  it('does not schedule a one-off reminder when notification permission is denied', async () => {
    notificationPermission = 'denied';
    const service = TestBed.inject(ReminderService);

    expect(await service.remindIn(30)).toBeNull();
    expect(service.snoozedUntil()).toBeNull();
    expect(storage.values.size).toBe(0);
  });
});
