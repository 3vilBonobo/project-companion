import { Project } from '../models/project.models';
import { ProgressService } from './progress.service';

describe('ProgressService', () => {
  const service = new ProgressService();

  it('returns zero progress for a project without tasks', () => {
    expect(service.forProject(projectWith([]))).toEqual({ completed: 0, total: 0, percentage: 0 });
  });

  it('calculates rounded completion progress', () => {
    const project = projectWith([true, false, false]);
    expect(service.forProject(project)).toEqual({ completed: 1, total: 3, percentage: 33 });
  });

  it('calculates progress by category in first-appearance order', () => {
    const project = projectWith([true, false, false]);
    project.tasks[0].category = 'Foundation';
    project.tasks[1].category = 'Foundation';
    project.tasks[2].category = 'Polish';

    expect(service.forCategories(project)).toEqual([
      { category: 'Foundation', completed: 1, total: 2, percentage: 50 },
      { category: 'Polish', completed: 0, total: 1, percentage: 0 }
    ]);
  });

  it('does not add category UI to legacy projects without categories', () => {
    expect(service.forCategories(projectWith([false]))).toEqual([]);
  });
});

function projectWith(completed: boolean[]): Project {
  return {
    id: 'project', title: 'Test', description: '', createdAt: '', updatedAt: '',
    tasks: completed.map((value, order) => ({ id: `task-${order}`, title: 'Step', description: '', estimatedMinutes: 10, difficulty: 'gentle', completed: value, completedAt: value ? '2026-01-01' : null, order, notes: '' }))
  };
}
