import { TestBed } from '@angular/core/testing';
import { StorageService } from '../storage/storage.service';
import { ProjectService } from './project.service';

class MemoryStorage {
  readonly values = new Map<string, unknown>();
  has(key: string): boolean { return this.values.has(key); }
  get<T>(key: string, fallback: T): T { return (this.values.get(key) as T | undefined) ?? fallback; }
  set<T>(key: string, value: T): boolean { this.values.set(key, structuredClone(value)); return true; }
  remove(key: string): void { this.values.delete(key); }
}

describe('ProjectService', () => {
  let storage: MemoryStorage;
  let service: ProjectService;

  beforeEach(() => {
    storage = new MemoryStorage();
    TestBed.configureTestingModule({ providers: [ProjectService, { provide: StorageService, useValue: storage }] });
    service = TestBed.inject(ProjectService);
    service.clearProjects();
  });

  it('creates and edits a project', () => {
    const project = service.createProject('  Learn pottery  ', '  Make a bowl  ');
    service.updateProjectDetails(project.id, { title: 'Make pottery', description: 'Start gently' });

    expect(service.projectById(project.id)?.title).toBe('Make pottery');
    expect(service.projectById(project.id)?.description).toBe('Start gently');
  });

  it('supports the complete task lifecycle and ordering', () => {
    const project = service.createProject('Test');
    const first = service.addTask(project.id, { title: 'First', category: 'Foundation', description: '', estimatedMinutes: 10, difficulty: 'gentle' });
    const second = service.addTask(project.id, { title: 'Second', category: 'Polish', description: '', estimatedMinutes: 20, difficulty: 'focused' });

    service.updateTask(project.id, first.id, { title: 'Updated', category: 'Polish', notes: 'Remember this' });
    service.toggleTask(project.id, first.id);
    service.moveTask(project.id, second.id, -1);

    let tasks = service.projectById(project.id)!.tasks;
    expect(tasks.map(task => task.title)).toEqual(['Second', 'Updated']);
    expect(tasks[1].completed).toBeTrue();
    expect(tasks[1].notes).toBe('Remember this');
    expect(tasks[1].category).toBe('Polish');

    service.toggleTask(project.id, first.id);
    service.deleteTask(project.id, second.id);
    tasks = service.projectById(project.id)!.tasks;
    expect(tasks.length).toBe(1);
    expect(tasks[0].completed).toBeFalse();
    expect(tasks[0].order).toBe(0);
  });

  it('keeps categorized steps contiguous and moves them within their phase', () => {
    const project = service.createProject('Categorized');
    const firstFoundation = service.addTask(project.id, { title: 'First foundation', category: 'Foundation', description: '', estimatedMinutes: 10, difficulty: 'gentle' });
    service.addTask(project.id, { title: 'Polish', category: 'Polish', description: '', estimatedMinutes: 10, difficulty: 'gentle' });
    const secondFoundation = service.addTask(project.id, { title: 'Second foundation', category: 'Foundation', description: '', estimatedMinutes: 10, difficulty: 'gentle' });

    expect(service.projectById(project.id)!.tasks.map(task => task.title)).toEqual(['First foundation', 'Second foundation', 'Polish']);
    service.moveTask(project.id, secondFoundation.id, -1);
    expect(service.projectById(project.id)!.tasks.map(task => task.title)).toEqual(['Second foundation', 'First foundation', 'Polish']);
    expect(service.projectById(project.id)!.tasks.find(task => task.id === firstFoundation.id)?.order).toBe(1);
  });

  it('keeps an intentionally empty project list on the next startup', () => {
    service.clearProjects();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [ProjectService, { provide: StorageService, useValue: storage }] });

    expect(TestBed.inject(ProjectService).projects()).toEqual([]);
  });

  it('creates a project and appends tasks from generated plans in one operation', () => {
    const imported = service.createProjectFromPlan({
      schemaVersion: 1,
      title: 'Learn drawing',
      description: 'Practice gently.',
      tasks: [{ title: 'Find a pencil', category: 'Foundation', description: '', estimatedMinutes: 5, difficulty: 'gentle', notes: '' }]
    });
    service.appendPlanTasks(imported.id, [
      { title: 'Draw one circle', description: '', estimatedMinutes: 10, difficulty: 'gentle', notes: '' },
      { title: 'Shade the circle', description: '', estimatedMinutes: 15, difficulty: 'focused', notes: '' }
    ]);

    const tasks = service.projectById(imported.id)!.tasks;
    expect(tasks.map(task => task.title)).toEqual(['Find a pencil', 'Draw one circle', 'Shade the circle']);
    expect(tasks.map(task => task.order)).toEqual([0, 1, 2]);
    expect(tasks.every(task => !task.completed)).toBeTrue();
    expect(tasks[0].category).toBe('Foundation');
  });

  it('replaces an existing project with an edited generated plan', () => {
    const project = service.createProject('Old title', 'Old description');
    service.addTask(project.id, { title: 'Old step', description: '', estimatedMinutes: 10, difficulty: 'gentle' });

    service.replaceProjectFromPlan(project.id, {
      schemaVersion: 1,
      title: 'Edited title',
      description: 'Edited by an LLM.',
      tasks: [{ title: 'New step', category: 'Foundation', description: '', estimatedMinutes: 15, difficulty: 'focused', notes: '' }]
    });

    const updated = service.projectById(project.id)!;
    expect(updated.title).toBe('Edited title');
    expect(updated.description).toBe('Edited by an LLM.');
    expect(updated.tasks.map(task => task.title)).toEqual(['New step']);
    expect(updated.tasks[0].completed).toBeFalse();
  });

  it('keeps completion history for matching steps and can undo a plan replacement', () => {
    const project = service.createProject('Original title', 'Original description');
    const completed = service.addTask(project.id, {
      title: 'Keep this step',
      category: 'Foundation',
      description: 'Original task details',
      estimatedMinutes: 10,
      difficulty: 'gentle'
    });
    service.toggleTask(project.id, completed.id);
    const completedAt = service.projectById(project.id)!.tasks[0].completedAt;

    service.replaceProjectFromPlan(project.id, {
      schemaVersion: 1,
      title: 'Revised title',
      description: 'Revised description',
      tasks: [
        { title: 'Keep this step', category: 'Polish', description: 'New task details', estimatedMinutes: 25, difficulty: 'focused', notes: 'Updated by an LLM' },
        { title: 'A new step', category: 'Polish', description: '', estimatedMinutes: 10, difficulty: 'gentle', notes: '' }
      ]
    });

    const revised = service.projectById(project.id)!;
    expect(revised.tasks[0].id).toBe(completed.id);
    expect(revised.tasks[0].completed).toBeTrue();
    expect(revised.tasks[0].completedAt).toBe(completedAt);
    expect(revised.tasks[0].description).toBe('New task details');

    expect(service.undoProjectPlanReplacement(project.id)).toBeTrue();
    const restored = service.projectById(project.id)!;
    expect(restored.title).toBe('Original title');
    expect(restored.description).toBe('Original description');
    expect(restored.tasks.map(task => task.title)).toEqual(['Keep this step']);
    expect(restored.tasks[0].completed).toBeTrue();
    expect(service.undoProjectPlanReplacement(project.id)).toBeFalse();
  });
});
