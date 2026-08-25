import { ProjectTemplateService } from './project-template.service';

describe('ProjectTemplateService', () => {
  it('offers substantial plans with unique ids and multiple phases', () => {
    const service = new ProjectTemplateService();
    const ids = service.templates.map(template => template.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(service.templates.length).toBeGreaterThanOrEqual(6);
    for (const template of service.templates) {
      expect(template.plan.tasks.length).toBeGreaterThanOrEqual(7);
      expect(new Set(template.plan.tasks.map(task => task.category)).size).toBeGreaterThanOrEqual(3);
    }
  });

  it('returns a safe copy of a template plan', () => {
    const service = new ProjectTemplateService();
    const first = service.planFor('tiny-app')!;
    first.title = 'Changed outside the catalog';

    expect(service.planFor('tiny-app')?.title).toBe('Ship a Tiny App');
    expect(service.planFor('missing')).toBeUndefined();
  });
});
