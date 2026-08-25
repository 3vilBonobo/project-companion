import { Injectable, computed, inject, signal } from '@angular/core';
import { Project, Task } from '../models/project.models';
import { ProjectPlan, ProjectPlanTask } from '../models/project-plan.models';
import { StorageService } from '../storage/storage.service';

const PROJECTS_KEY = 'project-companion.projects.v2';
const LEGACY_PROJECTS_KEY = 'project-companion.projects.v1';
interface ProjectStore { schemaVersion: 2; projects: Project[]; }

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly storage = inject(StorageService);
  private readonly state = signal<Project[]>(this.loadProjects());
  readonly projects = this.state.asReadonly();
  readonly hasProjects = computed(() => this.state().length > 0);
  private undoPlanReplacement: { projectId: string; project: Project } | null = null;

  constructor() {
    if (!this.storage.has(PROJECTS_KEY) && !this.storage.has(LEGACY_PROJECTS_KEY)) this.createSampleProject();
  }

  projectById(id: string): Project | undefined { return this.state().find(project => project.id === id); }

  createProject(title: string, description = ''): Project {
    const now = new Date().toISOString();
    const project: Project = { id: crypto.randomUUID(), title: title.trim(), description: description.trim(), createdAt: now, updatedAt: now, tasks: [] };
    this.commit([...this.state(), project]);
    return project;
  }

  createProjectFromPlan(plan: ProjectPlan): Project {
    const now = new Date().toISOString();
    const project: Project = {
      id: crypto.randomUUID(),
      title: plan.title,
      description: plan.description,
      createdAt: now,
      updatedAt: now,
      tasks: this.reorder(plan.tasks.map((task, order) => this.createTask(task, order)))
    };
    this.commit([...this.state(), project]);
    return project;
  }

  deleteProject(id: string): void { this.commit(this.state().filter(project => project.id !== id)); }

  updateProjectDetails(id: string, changes: Pick<Project, 'title' | 'description'>): void {
    this.updateProject(id, project => ({ ...project, title: changes.title.trim(), description: changes.description.trim() }));
  }

  addTask(projectId: string, input: Pick<Task, 'title' | 'description' | 'estimatedMinutes' | 'difficulty'> & Partial<Pick<Task, 'category' | 'notes'>>): Task {
    const project = this.projectById(projectId);
    if (!project) throw new Error('Project not found');
    const task: Task = { ...input, title: input.title.trim(), category: input.category?.trim().slice(0, 40) ?? '', description: input.description.trim(), notes: input.notes?.trim() ?? '', id: crypto.randomUUID(), completed: false, completedAt: null, order: project.tasks.length };
    this.updateProject(projectId, current => ({ ...current, tasks: this.reorder([...current.tasks, task]) }));
    return task;
  }

  appendPlanTasks(projectId: string, tasks: ProjectPlanTask[]): number {
    const project = this.projectById(projectId);
    if (!project) throw new Error('Project not found');
    this.updateProject(projectId, current => ({
      ...current,
      tasks: this.reorder([...current.tasks, ...tasks.map((task, index) => this.createTask(task, current.tasks.length + index))])
    }));
    return tasks.length;
  }

  replaceProjectFromPlan(projectId: string, plan: ProjectPlan): void {
    const previous = this.projectById(projectId);
    if (!previous) throw new Error('Project not found');
    this.updateProject(projectId, current => ({
      ...current,
      title: plan.title,
      description: plan.description,
      tasks: this.reorder(this.tasksFromReplacement(current.tasks, plan.tasks))
    }));
    this.undoPlanReplacement = { projectId, project: structuredClone(previous) };
  }

  undoProjectPlanReplacement(projectId: string): boolean {
    if (this.undoPlanReplacement?.projectId !== projectId) return false;
    const previous = this.undoPlanReplacement.project;
    this.undoPlanReplacement = null;
    this.commit(this.state().map(project => project.id === projectId ? { ...previous, updatedAt: new Date().toISOString() } : project));
    return true;
  }

  updateTask(projectId: string, taskId: string, changes: Partial<Pick<Task, 'title' | 'category' | 'description' | 'estimatedMinutes' | 'difficulty' | 'notes'>>): void {
    this.updateProject(projectId, project => ({ ...project, tasks: this.reorder(project.tasks.map(task => task.id === taskId ? { ...task, ...changes, title: changes.title?.trim() ?? task.title, category: changes.category?.trim().slice(0, 40) ?? task.category ?? '', description: changes.description?.trim() ?? task.description, notes: changes.notes?.trim() ?? task.notes } : task)) }));
  }

  completeTask(projectId: string, taskId: string): void {
    this.updateProject(projectId, project => ({ ...project, tasks: project.tasks.map(task => task.id === taskId ? { ...task, completed: true, completedAt: new Date().toISOString() } : task) }));
  }

  toggleTask(projectId: string, taskId: string): void {
    this.updateProject(projectId, project => ({ ...project, tasks: project.tasks.map(task => task.id === taskId ? { ...task, completed: !task.completed, completedAt: task.completed ? null : new Date().toISOString() } : task) }));
  }

  deleteTask(projectId: string, taskId: string): void {
    this.updateProject(projectId, project => ({ ...project, tasks: this.reorder(project.tasks.filter(task => task.id !== taskId)) }));
  }

  moveTask(projectId: string, taskId: string, direction: -1 | 1): void {
    this.updateProject(projectId, project => {
      const tasks = [...project.tasks].sort((a, b) => a.order - b.order);
      const from = tasks.findIndex(task => task.id === taskId);
      if (from < 0) return project;
      const category = tasks[from].category?.trim() ?? '';
      const categoryIndexes = tasks.flatMap((task, index) => (task.category?.trim() ?? '') === category ? [index] : []);
      const categoryPosition = categoryIndexes.indexOf(from);
      const to = categoryIndexes[categoryPosition + direction];
      if (to === undefined) return project;
      [tasks[from], tasks[to]] = [tasks[to], tasks[from]];
      return { ...project, tasks: this.reorder(tasks) };
    });
  }

  reorderTasks(projectId: string, orderedTaskIds: string[]): void {
    this.updateProject(projectId, project => {
      const tasks = [...project.tasks].sort((a, b) => a.order - b.order);
      const ids = new Set(orderedTaskIds);
      if (ids.size !== orderedTaskIds.length) return project;
      const reordered = orderedTaskIds.map(id => tasks.find(task => task.id === id));
      if (reordered.some(task => !task)) return project;
      let next = 0;
      const merged = tasks.map(task => ids.has(task.id) ? reordered[next++]! : task);
      return { ...project, tasks: this.reorder(merged) };
    });
  }

  replaceProjects(projects: Project[]): void { this.commit(this.sanitizeProjects(projects)); }

  clearProjects(): void { this.commit([]); }

  createSampleProject(): Project {
    const existing = this.state().find(project => project.title === 'Build Memory Game');
    if (existing) return existing;
    const project = this.createProject('Build Memory Game', 'A small, playful Angular app — built one calm step at a time.');
    ['Create Angular project', 'Install Ionic', 'Create Home Screen', 'Create Routing', 'Create First Animation', 'Create Navigation', 'Add First Puzzle', 'Finish MVP'].forEach((title, index) =>
      this.addTask(project.id, { title, category: index < 4 ? 'Foundation' : index < 7 ? 'Game logic' : 'Polish', description: `Take a focused step: ${title.toLowerCase()}.`, estimatedMinutes: index < 2 ? 10 : 20, difficulty: index < 4 ? 'gentle' : 'focused' })
    );
    return this.projectById(project.id)!;
  }

  private updateProject(id: string, updater: (project: Project) => Project): void {
    if (this.undoPlanReplacement?.projectId === id) this.undoPlanReplacement = null;
    this.commit(this.state().map(project => project.id === id ? { ...updater(project), updatedAt: new Date().toISOString() } : project));
  }

  private commit(projects: Project[]): void {
    this.state.set(projects);
    this.storage.set<ProjectStore>(PROJECTS_KEY, { schemaVersion: 2, projects });
  }

  private loadProjects(): Project[] {
    const current = this.storage.get<ProjectStore | null>(PROJECTS_KEY, null);
    if (current?.schemaVersion === 2 && Array.isArray(current.projects)) return this.sanitizeProjects(current.projects);
    const legacy = this.storage.get<Project[]>(LEGACY_PROJECTS_KEY, []);
    const migrated = this.sanitizeProjects(legacy);
    if (this.storage.has(LEGACY_PROJECTS_KEY)) this.storage.set<ProjectStore>(PROJECTS_KEY, { schemaVersion: 2, projects: migrated });
    return migrated;
  }

  private sanitizeProjects(projects: Project[]): Project[] { return Array.isArray(projects) ? projects.filter(project => this.isProject(project)).map(project => ({ ...project, tasks: this.reorder(project.tasks) })) : []; }

  private reorder(tasks: Task[]): Task[] {
    const normalized = tasks.map(task => ({ ...task, category: task.category?.trim().slice(0, 40) ?? '' }));
    if (!normalized.some(task => task.category)) return normalized.map((task, order) => ({ ...task, order }));
    const groups = new Map<string, Task[]>();
    for (const task of normalized) {
      const category = task.category ?? '';
      groups.set(category, [...(groups.get(category) ?? []), task]);
    }
    return [...groups.values()].flat().map((task, order) => ({ ...task, order }));
  }

  private createTask(input: ProjectPlanTask, order: number): Task {
    return { ...input, id: crypto.randomUUID(), completed: false, completedAt: null, order };
  }

  private tasksFromReplacement(existing: Task[], incoming: ProjectPlanTask[]): Task[] {
    const available = [...existing].sort((first, second) => first.order - second.order);
    const consumed = new Set<string>();
    return incoming.map((input, order) => {
      const match = available.find(task => !consumed.has(task.id) && task.title.trim().toLocaleLowerCase() === input.title.trim().toLocaleLowerCase());
      if (!match) return this.createTask(input, order);
      consumed.add(match.id);
      return {
        ...this.createTask(input, order),
        id: match.id,
        completed: match.completed,
        completedAt: match.completedAt
      };
    });
  }

  private isProject(value: unknown): value is Project {
    if (!value || typeof value !== 'object') return false;
    const project = value as Partial<Project>;
    return typeof project.id === 'string' && typeof project.title === 'string' && Array.isArray(project.tasks);
  }
}
