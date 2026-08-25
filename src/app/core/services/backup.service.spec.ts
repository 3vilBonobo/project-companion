import { TestBed } from '@angular/core/testing';
import { Project } from '../models/project.models';
import { BackupService } from './backup.service';
import { ProjectService } from './project.service';
import { SettingsService } from './settings.service';

describe('BackupService', () => {
  const project: Project = {
    id: 'p1', title: 'Quiet project', description: '', createdAt: '2026-01-01', updatedAt: '2026-01-01',
    tasks: [{ id: 't1', title: 'Small step', description: '', estimatedMinutes: 10, difficulty: 'gentle', completed: false, completedAt: null, order: 0, notes: '' }]
  };
  let replacement: Project[] | undefined;
  let service: BackupService;

  beforeEach(() => {
    replacement = undefined;
    TestBed.configureTestingModule({ providers: [
      BackupService,
      { provide: ProjectService, useValue: { projects: () => [project], replaceProjects: (projects: Project[]) => replacement = projects } },
      { provide: SettingsService, useValue: { settings: () => ({ preferredTaskMinutes: 20, reducedMotion: false, theme: 'calm', remindersEnabled: false, reminderTime: '09:00' }), replace: jasmine.createSpy('replace') } }
    ] });
    service = TestBed.inject(BackupService);
  });

  it('creates a versioned backup', () => {
    const backup = service.createBackup();
    expect(backup.schemaVersion).toBe(1);
    expect(backup.projects).toEqual([project]);
  });

  it('restores a validated backup', async () => {
    const file = new File([JSON.stringify(service.createBackup())], 'backup.json', { type: 'application/json' });
    expect(await service.import(file)).toBe(1);
    expect(replacement).toEqual([project]);
  });

  it('rejects malformed data before replacing projects', async () => {
    const file = new File(['{"schemaVersion":1,"projects":"nope"}'], 'bad.json', { type: 'application/json' });
    await expectAsync(service.import(file)).toBeRejectedWithError('This file is not a valid Project Companion backup.');
    expect(replacement).toBeUndefined();
  });
});
