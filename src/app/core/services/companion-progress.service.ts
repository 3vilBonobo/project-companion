import { Injectable, computed, inject } from '@angular/core';
import { Task } from '../models/project.models';
import { ProjectService } from './project.service';

export interface CompanionAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

@Injectable({ providedIn: 'root' })
export class CompanionProgressService {
  private readonly projects = inject(ProjectService);
  private readonly completedTasks = computed(() => this.projects.projects().flatMap(project => project.tasks.filter(task => task.completed)));

  readonly completedCount = computed(() => this.completedTasks().length);
  readonly xp = computed(() => this.completedTasks().reduce((total, task) => total + this.xpFor(task), 0));
  readonly level = computed(() => Math.floor(this.xp() / 100) + 1);
  readonly levelProgress = computed(() => this.xp() % 100);
  readonly xpToNextLevel = computed(() => 100 - this.levelProgress());
  readonly activeDays = computed(() => new Set(this.completedTasks()
    .map(task => task.completedAt?.slice(0, 10))
    .filter((date): date is string => Boolean(date))).size);
  readonly momentum = computed(() => {
    const activeDates = new Set(this.completedTasks()
      .map(task => task.completedAt?.slice(0, 10))
      .filter((date): date is string => Boolean(date)));
    const today = new Date();
    let total = 0;
    for (let offset = 0; offset < 7; offset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      if (activeDates.has(this.localDateKey(date))) total += 1;
    }
    return total;
  });
  readonly achievements = computed<CompanionAchievement[]>(() => {
    const count = this.completedCount();
    return [
      { id: 'first-step', title: 'First step', description: 'Completed your first quest', icon: '🌱', unlocked: count >= 1 },
      { id: 'finding-rhythm', title: 'Finding a rhythm', description: 'Made progress on three days', icon: '🎵', unlocked: this.activeDays() >= 3 },
      { id: 'small-wins', title: 'Small wins', description: 'Completed ten quests', icon: '✨', unlocked: count >= 10 },
      { id: 'deep-focus', title: 'Deep focus', description: 'Completed a stretch quest', icon: '🏔️', unlocked: this.completedTasks().some(task => task.difficulty === 'stretch') }
    ];
  });
  readonly unlockedAchievements = computed(() => this.achievements().filter(achievement => achievement.unlocked));

  unlockedIds(): Set<string> { return new Set(this.unlockedAchievements().map(achievement => achievement.id)); }

  newlyUnlocked(previousIds: ReadonlySet<string>): CompanionAchievement | undefined {
    return this.unlockedAchievements().find(achievement => !previousIds.has(achievement.id));
  }

  xpFor(task: Task): number {
    const difficultyBonus = task.difficulty === 'stretch' ? 10 : task.difficulty === 'focused' ? 5 : 0;
    const timeBonus = Math.min(10, Math.floor(task.estimatedMinutes / 15) * 2);
    return 20 + difficultyBonus + timeBonus;
  }

  private localDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
