import { Injectable, inject } from '@angular/core';
import { CompanionBackup, Project, Settings, Task, TaskDifficulty } from '../models/project.models';
import { ProjectService } from './project.service';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class BackupService {
  private readonly projects = inject(ProjectService);
  private readonly settings = inject(SettingsService);

  createBackup(): CompanionBackup {
    return { schemaVersion: 1, exportedAt: new Date().toISOString(), projects: this.projects.projects(), settings: this.settings.settings() };
  }

  download(): void {
    const blob = new Blob([JSON.stringify(this.createBackup(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `project-companion-${new Date().toISOString().slice(0, 10)}.json`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async import(file: File): Promise<number> {
    const parsed: unknown = JSON.parse(await file.text());
    if (!this.isBackup(parsed)) throw new Error('This file is not a valid Project Companion backup.');
    this.projects.replaceProjects(parsed.projects);
    this.settings.replace(parsed.settings);
    return parsed.projects.length;
  }

  private isBackup(value: unknown): value is CompanionBackup {
    if (!value || typeof value !== 'object') return false;
    const backup = value as Partial<CompanionBackup>;
    return backup.schemaVersion === 1 && Array.isArray(backup.projects) && backup.projects.every(project => this.isProject(project)) && this.isSettings(backup.settings);
  }

  private isProject(value: unknown): value is Project {
    if (!value || typeof value !== 'object') return false;
    const project = value as Partial<Project>;
    return typeof project.id === 'string' && typeof project.title === 'string' && typeof project.description === 'string' && typeof project.createdAt === 'string' && typeof project.updatedAt === 'string' && Array.isArray(project.tasks) && project.tasks.every(task => this.isTask(task));
  }

  private isTask(value: unknown): value is Task {
    if (!value || typeof value !== 'object') return false;
    const task = value as Partial<Task>;
    return typeof task.id === 'string' && typeof task.title === 'string' && (task.category === undefined || typeof task.category === 'string') && typeof task.description === 'string' && typeof task.estimatedMinutes === 'number' && this.isDifficulty(task.difficulty) && typeof task.completed === 'boolean' && (task.completedAt === null || typeof task.completedAt === 'string') && typeof task.order === 'number' && typeof task.notes === 'string';
  }

  private isSettings(value: unknown): value is Settings {
    if (!value || typeof value !== 'object') return false;
    const settings = value as Partial<Settings>;
    return (settings.firstName === undefined || typeof settings.firstName === 'string')
      && typeof settings.preferredTaskMinutes === 'number'
      && typeof settings.reducedMotion === 'boolean'
      && (settings.theme === undefined || settings.theme === 'calm' || settings.theme === 'playful' || settings.theme === 'code' || settings.theme === 'arcade' || settings.theme === 'wizard' || settings.theme === 'woodland')
      && (settings.remindersEnabled === undefined || typeof settings.remindersEnabled === 'boolean')
      && (settings.reminderTime === undefined || (typeof settings.reminderTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(settings.reminderTime)));
  }

  private isDifficulty(value: unknown): value is TaskDifficulty { return value === 'gentle' || value === 'focused' || value === 'stretch'; }
}
