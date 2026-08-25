import { Injectable } from '@angular/core';
import { ProjectPlan, ProjectPlanTask } from '../models/project-plan.models';
import { Project, Task } from '../models/project.models';

export interface PlanTaskChange {
  before?: Task;
  after?: ProjectPlanTask;
  changes: string[];
}

export interface ProjectPlanDiff {
  projectChanges: string[];
  added: PlanTaskChange[];
  modified: PlanTaskChange[];
  removed: PlanTaskChange[];
  unchanged: number;
}

@Injectable({ providedIn: 'root' })
export class ProjectPlanDiffService {
  compare(project: Project, plan: ProjectPlan): ProjectPlanDiff {
    const existing = [...project.tasks].sort((first, second) => first.order - second.order);
    const incoming = plan.tasks;
    const matches = this.longestCommonSubsequence(existing, incoming);
    const diff: ProjectPlanDiff = {
      projectChanges: [
        ...(project.title.trim() === plan.title.trim() ? [] : ['Project title']),
        ...(project.description.trim() === plan.description.trim() ? [] : ['Project description'])
      ],
      added: [],
      modified: [],
      removed: [],
      unchanged: 0
    };

    let previousExisting = -1;
    let previousIncoming = -1;
    for (const [existingIndex, incomingIndex] of [...matches, [existing.length, incoming.length] as [number, number]]) {
      const oldSegment = existing.slice(previousExisting + 1, existingIndex);
      const newSegment = incoming.slice(previousIncoming + 1, incomingIndex);
      const paired = Math.min(oldSegment.length, newSegment.length);
      for (let index = 0; index < paired; index += 1) {
        diff.modified.push({ before: oldSegment[index], after: newSegment[index], changes: this.changedFields(oldSegment[index], newSegment[index]) });
      }
      for (const task of newSegment.slice(paired)) diff.added.push({ after: task, changes: [] });
      for (const task of oldSegment.slice(paired)) diff.removed.push({ before: task, changes: [] });

      if (existingIndex < existing.length && incomingIndex < incoming.length) {
        const before = existing[existingIndex];
        const after = incoming[incomingIndex];
        const changes = this.changedFields(before, after);
        if (changes.length) diff.modified.push({ before, after, changes });
        else diff.unchanged += 1;
      }
      previousExisting = existingIndex;
      previousIncoming = incomingIndex;
    }
    return diff;
  }

  private longestCommonSubsequence(existing: Task[], incoming: ProjectPlanTask[]): Array<[number, number]> {
    const rows = existing.length + 1;
    const columns = incoming.length + 1;
    const lengths = Array.from({ length: rows }, () => Array<number>(columns).fill(0));
    for (let oldIndex = existing.length - 1; oldIndex >= 0; oldIndex -= 1) {
      for (let newIndex = incoming.length - 1; newIndex >= 0; newIndex -= 1) {
        lengths[oldIndex][newIndex] = this.sameTitle(existing[oldIndex].title, incoming[newIndex].title)
          ? lengths[oldIndex + 1][newIndex + 1] + 1
          : Math.max(lengths[oldIndex + 1][newIndex], lengths[oldIndex][newIndex + 1]);
      }
    }
    const matches: Array<[number, number]> = [];
    let oldIndex = 0;
    let newIndex = 0;
    while (oldIndex < existing.length && newIndex < incoming.length) {
      if (this.sameTitle(existing[oldIndex].title, incoming[newIndex].title)) {
        matches.push([oldIndex, newIndex]);
        oldIndex += 1;
        newIndex += 1;
      } else if (lengths[oldIndex + 1][newIndex] >= lengths[oldIndex][newIndex + 1]) oldIndex += 1;
      else newIndex += 1;
    }
    return matches;
  }

  private changedFields(before: Task, after: ProjectPlanTask): string[] {
    return [
      ...(before.title.trim() === after.title.trim() ? [] : ['Title']),
      ...((before.category ?? '').trim() === (after.category ?? '').trim() ? [] : ['Category']),
      ...(before.description.trim() === after.description.trim() ? [] : ['Description']),
      ...(before.estimatedMinutes === after.estimatedMinutes ? [] : ['Duration']),
      ...(before.difficulty === after.difficulty ? [] : ['Energy']),
      ...(before.notes.trim() === after.notes.trim() ? [] : ['Notes'])
    ];
  }

  private sameTitle(first: string, second: string): boolean {
    return first.trim().toLocaleLowerCase() === second.trim().toLocaleLowerCase();
  }
}
