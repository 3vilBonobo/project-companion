import { Injectable } from '@angular/core';
import { ProjectPlan, ProjectPlanTask } from '../models/project-plan.models';
import { TaskDifficulty } from '../models/project.models';

export const PROJECT_PLAN_PROMPT = `I will describe a personal project. Turn it into a calm, realistic plan for Project Companion.

Return only valid JSON. Do not use Markdown or code fences. Follow this exact structure:
{
  "schemaVersion": 1,
  "title": "Short project title",
  "description": "A supportive one-sentence description",
  "tasks": [
    {
      "title": "One small, concrete action",
      "category": "A short project phase such as Foundation or Polish",
      "description": "A brief helpful instruction",
      "estimatedMinutes": 15,
      "difficulty": "gentle",
      "notes": ""
    }
  ]
}

Rules:
- Break the project into small actions in the order they should be done.
- Group related actions with a short, consistent category. Use 2 to 6 categories for larger projects and keep tasks from the same category together.
- Each action should usually take 5 to 45 minutes.
- difficulty must be exactly "gentle", "focused", or "stretch".
- Avoid deadlines, guilt, streaks, and motivational pressure.
- Prefer the smallest meaningful next action.

My project description:
[PASTE MY PROJECT DESCRIPTION HERE]`;

export function projectPlanPrompt(firstName: string): string {
  const name = firstName.trim().slice(0, 50);
  if (!name) return PROJECT_PLAN_PROMPT;
  return `${PROJECT_PLAN_PROMPT}\n\nMy first name is ${name}. Address me by name occasionally in supportive descriptions or notes, but keep it natural and do not use my name in every task.`;
}

@Injectable({ providedIn: 'root' })
export class ProjectPlanImportService {
  async fromFile(file: File): Promise<ProjectPlan> {
    if (file.size > 1_000_000) throw new Error('This plan is larger than 1 MB. Please choose a smaller JSON file.');
    return this.fromText(await file.text());
  }

  fromText(text: string): ProjectPlan {
    let parsed: unknown;
    try {
      const cleanText = text.replace(/^\uFEFF/, '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      parsed = JSON.parse(cleanText);
    } catch {
      throw new Error('This content does not contain valid JSON. Ask ChatGPT to return JSON only, without Markdown.');
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('The JSON must contain one project object.');
    const value = parsed as Record<string, unknown>;
    if (value['schemaVersion'] !== 1) throw new Error('Unsupported plan version. The schemaVersion must be 1.');

    const title = this.requiredString(value['title'], 'The project needs a title.', 80);
    const description = this.optionalString(value['description'], 300);
    if (!Array.isArray(value['tasks']) || value['tasks'].length === 0) throw new Error('The plan needs at least one task.');
    if (value['tasks'].length > 200) throw new Error('A plan can contain at most 200 tasks.');

    return {
      schemaVersion: 1,
      title,
      description,
      tasks: value['tasks'].map((task, index) => this.parseTask(task, index))
    };
  }

  private parseTask(value: unknown, index: number): ProjectPlanTask {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Task ${index + 1} must be a JSON object.`);
    const task = value as Record<string, unknown>;
    const difficulty = task['difficulty'] ?? 'gentle';
    if (!this.isDifficulty(difficulty)) throw new Error(`Task ${index + 1} has an invalid difficulty. Use gentle, focused, or stretch.`);
    const minutes = task['estimatedMinutes'] === undefined ? 15 : Number(task['estimatedMinutes']);
    if (!Number.isFinite(minutes)) throw new Error(`Task ${index + 1} needs a valid estimatedMinutes number.`);

    return {
      title: this.requiredString(task['title'], `Task ${index + 1} needs a title.`, 100),
      category: this.optionalString(task['category'], 40),
      description: this.optionalString(task['description'], 300),
      estimatedMinutes: Math.round(Math.min(180, Math.max(5, minutes))),
      difficulty,
      notes: this.optionalString(task['notes'], 1000)
    };
  }

  private requiredString(value: unknown, error: string, maxLength: number): string {
    if (typeof value !== 'string' || !value.trim()) throw new Error(error);
    return value.trim().slice(0, maxLength);
  }

  private optionalString(value: unknown, maxLength: number): string {
    return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
  }

  private isDifficulty(value: unknown): value is TaskDifficulty {
    return value === 'gentle' || value === 'focused' || value === 'stretch';
  }
}
