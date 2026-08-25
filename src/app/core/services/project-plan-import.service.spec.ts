import { PROJECT_PLAN_PROMPT, ProjectPlanImportService, projectPlanPrompt } from './project-plan-import.service';

describe('ProjectPlanImportService', () => {
  const service = new ProjectPlanImportService();

  it('personalizes the planning prompt only when a name is available', () => {
    expect(projectPlanPrompt('')).toBe(PROJECT_PLAN_PROMPT);
    expect(projectPlanPrompt('  Mina  ')).toContain('My first name is Mina.');
  });

  it('normalizes a valid generated plan and supplies optional defaults', () => {
    const plan = service.fromText(JSON.stringify({
      schemaVersion: 1,
      title: ' Learn watercolor ',
      tasks: [{ title: ' Choose one brush ', estimatedMinutes: 8 }]
    }));

    expect(plan.title).toBe('Learn watercolor');
    expect(plan.description).toBe('');
    expect(plan.tasks[0]).toEqual({
      title: 'Choose one brush',
      category: '',
      description: '',
      estimatedMinutes: 8,
      difficulty: 'gentle',
      notes: ''
    });
  });

  it('preserves and normalizes task categories', () => {
    const plan = service.fromText(JSON.stringify({
      schemaVersion: 1,
      title: 'Build a game',
      tasks: [{ title: 'Create the app shell', category: ' Foundation ' }]
    }));

    expect(plan.tasks[0].category).toBe('Foundation');
  });

  it('accepts JSON copied with a Markdown code fence', () => {
    const plan = service.fromText('```json\n{"schemaVersion":1,"title":"Test","tasks":[{"title":"Begin"}]}\n```');
    expect(plan.tasks[0].title).toBe('Begin');
  });

  it('rejects invalid task difficulty with a useful task number', () => {
    expect(() => service.fromText(JSON.stringify({
      schemaVersion: 1,
      title: 'Test',
      tasks: [{ title: 'Begin', difficulty: 'hard' }]
    }))).toThrowError('Task 1 has an invalid difficulty. Use gentle, focused, or stretch.');
  });

  it('rejects a plan without any tasks', () => {
    expect(() => service.fromText('{"schemaVersion":1,"title":"Test","tasks":[]}')).toThrowError('The plan needs at least one task.');
  });
});
