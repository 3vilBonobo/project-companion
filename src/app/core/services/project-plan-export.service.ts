import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { ProjectPlan } from '../models/project-plan.models';
import { Project } from '../models/project.models';

@Injectable({ providedIn: 'root' })
export class ProjectPlanExportService {
  private readonly document = inject(DOCUMENT);

  toPlan(project: Project): ProjectPlan {
    return {
      schemaVersion: 1,
      title: project.title,
      description: project.description,
      tasks: [...project.tasks]
        .sort((first, second) => first.order - second.order)
        .map(task => ({
          title: task.title,
          category: task.category ?? '',
          description: task.description,
          estimatedMinutes: task.estimatedMinutes,
          difficulty: task.difficulty,
          notes: task.notes
        }))
    };
  }

  toText(project: Project): string {
    return JSON.stringify(this.toPlan(project), null, 2);
  }

  download(project: Project): void {
    const blob = new Blob([this.toText(project)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = `${this.safeFileName(project.title)}-plan.json`;
    link.style.display = 'none';
    this.document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private safeFileName(title: string): string {
    return title
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
      .slice(0, 60) || 'project';
  }
}
