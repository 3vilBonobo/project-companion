export type TaskDifficulty = 'gentle' | 'focused' | 'stretch';
export type AppTheme = 'calm' | 'playful' | 'code' | 'arcade' | 'wizard' | 'woodland';

export interface Task {
  id: string;
  title: string;
  category?: string;
  description: string;
  estimatedMinutes: number;
  difficulty: TaskDifficulty;
  completed: boolean;
  completedAt: string | null;
  order: number;
  notes: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
}

export interface Progress { completed: number; total: number; percentage: number; }

export interface Settings {
  firstName: string;
  preferredTaskMinutes: number;
  reducedMotion: boolean;
  theme: AppTheme;
  remindersEnabled: boolean;
  reminderTime: string;
}

export interface CompanionBackup {
  schemaVersion: 1;
  exportedAt: string;
  projects: Project[];
  settings: Settings;
}
