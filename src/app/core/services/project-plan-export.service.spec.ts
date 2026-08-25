import { TestBed } from '@angular/core/testing';
import { Project } from '../models/project.models';
import { ProjectPlanExportService } from './project-plan-export.service';

describe('ProjectPlanExportService', () => {
  let service: ProjectPlanExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ProjectPlanExportService] });
    service = TestBed.inject(ProjectPlanExportService);
  });

  it('exports only the editable plan fields in task order', () => {
    const project: Project = {
      id: 'project-id',
      title: 'Build a game',
      description: 'A tiny puzzle game.',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
      tasks: [
        { id: 'second', title: 'Polish', category: 'Polish', description: '', estimatedMinutes: 10, difficulty: 'gentle', completed: true, completedAt: '2026-01-02', order: 1, notes: '' },
        { id: 'first', title: 'Create shell', category: 'Foundation', description: 'Start here.', estimatedMinutes: 15, difficulty: 'focused', completed: false, completedAt: null, order: 0, notes: 'Use Angular.' }
      ]
    };

    const exported = service.toPlan(project);
    expect(exported.tasks.map(task => task.title)).toEqual(['Create shell', 'Polish']);
    expect(exported.tasks[0].category).toBe('Foundation');
    expect(JSON.stringify(exported)).not.toContain('project-id');
    expect(JSON.stringify(exported)).not.toContain('completedAt');
  });
});
