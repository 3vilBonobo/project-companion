import { Injectable } from '@angular/core';
import { Progress, Project } from '../models/project.models';

export interface CategoryProgress extends Progress { category: string; }

@Injectable({ providedIn: 'root' })
export class ProgressService {
  forProject(project: Project): Progress {
    const total = project.tasks.length;
    const completed = project.tasks.filter(task => task.completed).length;
    return { completed, total, percentage: total ? Math.round((completed / total) * 100) : 0 };
  }

  forCategories(project: Project): CategoryProgress[] {
    if (!project.tasks.some(task => Boolean(task.category?.trim()))) return [];
    const grouped = new Map<string, { completed: number; total: number }>();
    for (const task of [...project.tasks].sort((first, second) => first.order - second.order)) {
      const category = task.category?.trim() || 'Other steps';
      const progress = grouped.get(category) ?? { completed: 0, total: 0 };
      progress.total += 1;
      if (task.completed) progress.completed += 1;
      grouped.set(category, progress);
    }
    return [...grouped].map(([category, progress]) => ({
      category,
      ...progress,
      percentage: Math.round((progress.completed / progress.total) * 100)
    }));
  }
}
