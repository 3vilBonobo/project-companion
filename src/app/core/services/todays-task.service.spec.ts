import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Settings } from '../models/project.models';
import { StorageService } from '../storage/storage.service';
import { ProjectService } from './project.service';
import { SettingsService } from './settings.service';
import { TodaysTaskService } from './todays-task.service';

class MemoryStorage {
  private readonly values = new Map<string, unknown>();
  has(key: string): boolean { return this.values.has(key); }
  get<T>(key: string, fallback: T): T { return (this.values.get(key) as T | undefined) ?? fallback; }
  set<T>(key: string, value: T): boolean { this.values.set(key, value); return true; }
}

describe('TodaysTaskService', () => {
  it('favors the earliest task that fits the preferred duration', () => {
    const preferences = signal<Settings>({ firstName: '', preferredTaskMinutes: 15, reducedMotion: false, theme: 'calm', remindersEnabled: false, reminderTime: '09:00' });
    TestBed.configureTestingModule({ providers: [
      ProjectService,
      TodaysTaskService,
      { provide: StorageService, useClass: MemoryStorage },
      { provide: SettingsService, useValue: { settings: preferences.asReadonly() } }
    ] });
    const projects = TestBed.inject(ProjectService);
    projects.clearProjects();
    const longProject = projects.createProject('Long project');
    projects.addTask(longProject.id, { title: 'Long step', description: '', estimatedMinutes: 45, difficulty: 'focused' });
    const shortProject = projects.createProject('Short project');
    projects.addTask(shortProject.id, { title: 'Short step', description: '', estimatedMinutes: 10, difficulty: 'gentle' });

    expect(TestBed.inject(TodaysTaskService).today()?.task.title).toBe('Short step');
  });
});
