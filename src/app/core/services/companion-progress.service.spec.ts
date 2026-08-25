import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Project, Task } from '../models/project.models';
import { ProjectService } from './project.service';
import { CompanionProgressService } from './companion-progress.service';

describe('CompanionProgressService', () => {
  const task = (changes: Partial<Task> = {}): Task => ({
    id: crypto.randomUUID(), title: 'A small quest', description: '', estimatedMinutes: 15,
    difficulty: 'gentle', completed: true, completedAt: new Date().toISOString(), order: 0, notes: '', ...changes
  });
  const project = (tasks: Task[]): Project => ({ id: 'project', title: 'Project', description: '', createdAt: '', updatedAt: '', tasks });
  const projects = signal<Project[]>([]);

  beforeEach(() => {
    projects.set([]);
    TestBed.configureTestingModule({
      providers: [CompanionProgressService, { provide: ProjectService, useValue: { projects: projects.asReadonly() } }]
    });
  });

  it('awards more XP for more demanding quests', () => {
    const service = TestBed.inject(CompanionProgressService);
    expect(service.xpFor(task({ difficulty: 'stretch', estimatedMinutes: 30 })))
      .toBeGreaterThan(service.xpFor(task()));
  });

  it('derives level progress and unlocks achievements from completed tasks', () => {
    projects.set([project(Array.from({ length: 4 }, (_, index) => task({ id: `${index}`, estimatedMinutes: 30 }))) ]);
    const service = TestBed.inject(CompanionProgressService);
    expect(service.xp()).toBe(96);
    expect(service.level()).toBe(1);
    expect(service.levelProgress()).toBe(96);
    expect(service.unlockedAchievements().map(achievement => achievement.id)).toContain('first-step');
  });
});
