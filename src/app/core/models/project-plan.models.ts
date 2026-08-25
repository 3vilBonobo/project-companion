import { TaskDifficulty } from './project.models';

export interface ProjectPlanTask {
  title: string;
  category?: string;
  description: string;
  estimatedMinutes: number;
  difficulty: TaskDifficulty;
  notes: string;
}

export interface ProjectPlan {
  schemaVersion: 1;
  title: string;
  description: string;
  tasks: ProjectPlanTask[];
}
