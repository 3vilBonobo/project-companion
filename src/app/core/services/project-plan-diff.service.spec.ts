import { ProjectPlan } from '../models/project-plan.models';
import { Project, Task } from '../models/project.models';
import { ProjectPlanDiffService } from './project-plan-diff.service';

describe('ProjectPlanDiffService', () => {
  const task = (title: string, order: number, changes: Partial<Task> = {}): Task => ({
    id: `task-${order}`,
    title,
    category: 'Foundation',
    description: `${title} description`,
    estimatedMinutes: 10,
    difficulty: 'gentle',
    completed: false,
    completedAt: null,
    order,
    notes: '',
    ...changes
  });

  const project = (tasks: Task[]): Project => ({
    id: 'project-1',
    title: 'Original project',
    description: 'Original description',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    tasks
  });

  const plan = (tasks: ProjectPlan['tasks']): ProjectPlan => ({
    schemaVersion: 1,
    title: 'Revised project',
    description: 'Revised description',
    tasks
  });

  const planTask = (title: string, changes: Partial<ProjectPlan['tasks'][number]> = {}): ProjectPlan['tasks'][number] => ({
    title,
    category: 'Foundation',
    description: `${title} description`,
    estimatedMinutes: 10,
    difficulty: 'gentle',
    notes: '',
    ...changes
  });

  it('summarizes project, added, changed, removed, and unchanged content', () => {
    const service = new ProjectPlanDiffService();
    const result = service.compare(
      project([
        task('Keep me', 0),
        task('Rename me', 1),
        task('Remove me', 2),
        task('Change details', 3)
      ]),
      plan([
        planTask('Keep me'),
        planTask('Renamed step'),
        planTask('Change details', { estimatedMinutes: 25, difficulty: 'focused' }),
        planTask('Brand new step')
      ])
    );

    expect(result.projectChanges).toEqual(['Project title', 'Project description']);
    expect(result.unchanged).toBe(1);
    expect(result.added.map(change => change.after?.title)).toEqual(['Brand new step']);
    expect(result.removed.map(change => change.before?.title)).toEqual(['Remove me']);
    expect(result.modified.map(change => change.changes)).toEqual([
      ['Title', 'Description'],
      ['Duration', 'Energy']
    ]);
  });

  it('recognizes an inserted step without marking every later step as changed', () => {
    const service = new ProjectPlanDiffService();
    const original = project([task('First', 0), task('Second', 1), task('Third', 2)]);
    const incoming = plan([
      planTask('First'),
      planTask('Inserted'),
      planTask('Second'),
      planTask('Third')
    ]);

    const result = service.compare(original, incoming);

    expect(result.added.map(change => change.after?.title)).toEqual(['Inserted']);
    expect(result.modified).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.unchanged).toBe(3);
  });
});
