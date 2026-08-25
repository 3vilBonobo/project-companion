import { Injectable, computed, inject, signal } from '@angular/core';
import { Project, Task } from '../models/project.models';
import { ProjectService } from './project.service';
import { SettingsService } from './settings.service';

export interface CompanionTask { project: Project; task: Task; }

@Injectable({ providedIn: 'root' })
export class TodaysTaskService {
  private readonly projects = inject(ProjectService);
  private readonly settings = inject(SettingsService);
  private readonly startedTaskId = signal<string | null>(null);
  readonly isStarted = computed(() => this.startedTaskId() === this.today()?.task.id);
  readonly today = computed<CompanionTask | null>(() => {
    const preferredMinutes = this.settings.settings().preferredTaskMinutes;
    const candidates: CompanionTask[] = [];
    for (const project of this.projects.projects()) {
      const task = [...project.tasks].sort((a, b) => a.order - b.order).find(item => !item.completed);
      if (task) candidates.push({ project, task });
    }
    return candidates.find(candidate => candidate.task.estimatedMinutes <= preferredMinutes) ?? candidates[0] ?? null;
  });

  start(): void { this.startedTaskId.set(this.today()?.task.id ?? null); }
  complete(): void {
    const current = this.today();
    if (!current) return;
    this.projects.completeTask(current.project.id, current.task.id);
    this.startedTaskId.set(null);
  }
}
