import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ActionSheetController, IonButton, IonContent, IonFooter, IonIcon, ToastController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { alarmOutline, closeCircleOutline, sunnyOutline, timeOutline, trophyOutline } from "ionicons/icons";
import { ProgressService } from "../../core/services/progress.service";
import { ProjectService } from "../../core/services/project.service";
import { ReminderService } from "../../core/services/reminder.service";
import { TodaysTaskService } from "../../core/services/todays-task.service";
import { SettingsService } from "../../core/services/settings.service";
import { AppTabsComponent } from "../../shared/components/app-tabs/app-tabs.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { PrimaryButtonComponent } from "../../shared/components/primary-button/primary-button.component";
import { ProgressCircleComponent } from "../../shared/components/progress-circle/progress-circle.component";
import { TaskCardComponent } from "../../shared/components/task-card/task-card.component";

@Component({
  selector: "app-today",
  standalone: true,
  imports: [
    IonContent,
    IonFooter,
    IonButton,
    IonIcon,
    AppTabsComponent,
    TaskCardComponent,
    ProgressCircleComponent,
    PrimaryButtonComponent,
    EmptyStateComponent,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "ion-page" },
  template: `<ion-content [fullscreen]="true"
      ><main class="page-shell today-shell">
        <header class="today-header">
          <div>
            <span class="day-label">Today{{ firstName() ? ', ' + firstName() : '' }}</span>
            <p>One small thing is enough.</p>
          </div>
          @if (today.today(); as item) {
            <div class="header-progress">
              <app-progress-circle [value]="progress().percentage" />
              <div><strong>{{ progress().completed }} of {{ progress().total }}</strong><span>project steps</span></div>
            </div>
          }
        </header>
        @if (today.today(); as item) {
          <div class="today-layout">
            <section class="focus-column" aria-label="Today's focus">
              <div class="project-context">
                <span>Today’s focus</span><strong>{{ item.project.title }}</strong>
              </div>
              <app-task-card [task]="item.task" />
              <div class="actions">
                @if (!today.isStarted()) {
                  <app-primary-button label="Start this small step" (pressed)="today.start()" />
                } @else {
                  <app-primary-button label="Mark as complete" icon="checkmark" (pressed)="today.complete()" />
                }
                <span class="encouragement">{{ encouragement() }}</span>
              </div>
              <section class="reminder-card" aria-label="Gentle reminder">
                <div class="reminder-icon"><ion-icon name="alarm-outline" /></div>
                <div>
                  <strong>{{ reminders.snoozedUntil() ? 'Reminder ready' : 'Not the right moment?' }}</strong>
                  <small>{{ reminders.snoozedUntil() ? 'We’ll bring this step back ' + reminderLabel() + '.' : 'Come back to this step later.' }}</small>
                </div>
                <div class="reminder-actions">
                  <ion-button fill="clear" size="small" [disabled]="!reminders.supported" (click)="openReminderOptions()">
                    {{ reminders.snoozedUntil() ? 'Change' : 'Remind me' }}
                  </ion-button>
                  @if (reminders.snoozedUntil()) { <button type="button" (click)="cancelReminder()">Cancel</button> }
                </div>
              </section>
            </section>
            <aside class="up-next" aria-label="Pending tasks">
              <div class="aside-heading"><div><span>Up next</span><h2>Pending tasks</h2></div><b>{{ pendingCount() }}</b></div>
              <div class="pending-list">
                @for (entry of pendingTasks(); track entry.task.id) {
                  <a [routerLink]="['/projects', entry.project.id]" class="pending-task">
                    <i aria-hidden="true"></i>
                    <span><strong>{{ entry.task.title }}</strong><small>{{ entry.project.title }} · {{ entry.task.estimatedMinutes }} min</small></span>
                  </a>
                } @empty {
                  <p class="no-pending">Nothing else is waiting for you.</p>
                }
              </div>
              @if (pendingCount() > pendingTasks().length) { <a routerLink="/projects" class="view-all">View all {{ pendingCount() }} tasks</a> }
              <section class="player-status" aria-label="Focus level">
                <div class="level-icon"><ion-icon name="trophy-outline" /></div>
                <div class="level-copy"><span>Focus level {{ gameStats().level }}</span><strong>{{ gameStats().points }} XP</strong></div>
                <div class="level-progress"><div><i [style.width.%]="gameStats().percentage"></i></div><small>{{ gameStats().remaining }} steps to level up</small></div>
              </section>
            </aside>
          </div>
        } @else {
          <app-empty-state
            title="All caught up"
            message="You’ve completed every planned step. Rest is part of making progress." />
        }</main></ion-content
    ><ion-footer><app-tabs active="today" /></ion-footer>`,
  styles: [
    `
      .today-shell {
        min-height: 100%;
        padding-top: max(42px, env(safe-area-inset-top));
        padding-bottom: 38px;
      }
      .today-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 28px;
      }
      .header-progress { display: flex; align-items: center; gap: 11px; }
      .header-progress > div { display: grid; gap: 2px; }
      .header-progress strong { color: var(--ink); font-size: .82rem; }
      .header-progress span { color: var(--muted); font-size: .68rem; }
      .today-layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 28px; align-items: start; }
      .focus-column { min-width: 0; }
      .up-next { padding: 20px; border: 1px solid var(--line); border-radius: var(--card-radius); background: color-mix(in srgb, var(--surface) 82%, transparent); }
      .aside-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
      .aside-heading span { color: var(--ion-color-primary); font-size: .65rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
      .aside-heading h2 { margin: 3px 0 0; color: var(--ink); font-size: 1.18rem; }
      .aside-heading b { display: grid; place-items: center; min-width: 28px; height: 28px; padding: 0 8px; border-radius: 99px; background: var(--ion-color-light); color: var(--ink-soft); font-size: .75rem; }
      .pending-list { display: grid; }
      .pending-task { display: grid; grid-template-columns: 18px 1fr; gap: 10px; padding: 12px 2px; border-bottom: 1px solid var(--line); color: inherit; text-decoration: none; }
      .pending-task i { width: 16px; height: 16px; margin-top: 2px; border: 1.5px solid var(--line); border-radius: 50%; }
      .pending-task span { display: grid; gap: 4px; min-width: 0; }
      .pending-task strong { overflow: hidden; color: var(--ink); font-size: .82rem; text-overflow: ellipsis; white-space: nowrap; }
      .pending-task small { overflow: hidden; color: var(--muted); font-size: .68rem; text-overflow: ellipsis; white-space: nowrap; }
      .pending-task:hover strong { color: var(--ion-color-primary); }
      .no-pending { margin: 12px 0; color: var(--muted); font-size: .78rem; line-height: 1.5; }
      .view-all { display: inline-block; margin-top: 14px; color: var(--ion-color-primary); font-size: .75rem; font-weight: 750; text-decoration: none; }
      .player-status {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 10px;
        margin-top: 20px;
        padding-top: 17px;
        border-top: 1px solid var(--line);
      }
      .level-icon {
        display: grid;
        place-items: center;
        width: 36px;
        height: 36px;
        border-radius: 12px;
        background: color-mix(in srgb, var(--accent-3) 28%, var(--surface));
        color: var(--ion-color-primary);
        font-size: 1.3rem;
      }
      .level-copy {
        display: grid;
        gap: 2px;
      }
      .level-copy span {
        color: var(--muted);
        font-size: .68rem;
        font-weight: 800;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      .level-copy strong { color: var(--ink); }
      .level-progress { grid-column: 1 / -1; display: grid; gap: 6px; color: var(--muted); font-size: .67rem; }
      .level-progress small { color: var(--muted); }
      .level-progress > div { width: 100%; height: 6px; overflow: hidden; border-radius: 99px; background: var(--ion-color-light-shade); }
      .level-progress i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--ion-color-primary), var(--accent-2)); }
      .day-label {
        color: var(--ink);
        font-size: 2rem;
        font-weight: 780;
        letter-spacing: -0.04em;
      }
      header p {
        margin: 5px 0 0;
        color: var(--muted);
      }
      .project-context {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        margin: 0 4px 12px;
        color: var(--muted);
        font-size: 0.85rem;
      }
      .project-context strong {
        color: var(--ink-soft);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .encouragement {
        color: var(--muted);
        text-align: center;
        font-size: 0.76rem;
      }
      .actions {
        width: 100%;
        margin: 18px auto 0;
        display: grid;
        gap: 10px;
      }
      .reminder-card {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 12px;
        width: 100%;
        margin: 14px auto 0;
        padding: 12px 14px;
        border: 1px dashed var(--line);
        border-radius: 18px;
        background: color-mix(in srgb, var(--surface) 74%, transparent);
      }
      .reminder-icon {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 13px;
        color: var(--ion-color-primary);
        background: color-mix(in srgb, var(--accent-2) 20%, var(--surface));
        font-size: 1.15rem;
      }
      .reminder-card > div:nth-child(2) { display: grid; gap: 3px; min-width: 0; }
      .reminder-card strong { color: var(--ink); font-size: .82rem; }
      .reminder-card small { color: var(--muted); font-size: .7rem; line-height: 1.35; }
      .reminder-actions { display: grid; justify-items: end; }
      .reminder-actions ion-button { margin: 0; text-transform: none; font-weight: 750; }
      .reminder-actions button {
        border: 0;
        padding: 3px 9px;
        background: none;
        color: var(--muted);
        font: inherit;
        font-size: .67rem;
        cursor: pointer;
      }
      app-task-card {
        display: block;
      }
      @media (min-width: 960px) {
        .today-shell { width: min(100% - 56px, 1080px); }
      }
      @media (max-width: 820px) {
        .today-layout { grid-template-columns: 1fr; }
        .up-next { display: none; }
      }
      @media (max-width: 560px) {
        .reminder-card { grid-template-columns: auto 1fr; }
        .reminder-actions { grid-column: 1 / -1; width: 100%; display: flex; align-items: center; justify-content: flex-end; }
      }
    `,
  ],
})
export class TodayPage {
  readonly today = inject(TodaysTaskService);
  readonly reminders = inject(ReminderService);
  private readonly settings = inject(SettingsService);
  private readonly projects = inject(ProjectService);
  private readonly progressService = inject(ProgressService);
  private readonly actionSheets = inject(ActionSheetController);
  private readonly toasts = inject(ToastController);
  readonly firstName = computed(() => this.settings.settings().firstName);
  readonly encouragement = computed(() => {
    const name = this.firstName();
    return this.today.isStarted()
      ? `${name ? name + ', you' : 'You'}’ve begun — take your time.`
      : `No rush${name ? ', ' + name : ''}. Start when you’re ready.`;
  });
  readonly progress = computed(() => {
    const item = this.today.today();
    return item ? this.progressService.forProject(item.project) : { completed: 0, total: 0, percentage: 0 };
  });
  readonly gameStats = computed(() => {
    const completed = this.projects.projects().reduce((total, project) => total + project.tasks.filter(task => task.completed).length, 0);
    const level = Math.floor(completed / 5) + 1;
    const progressInLevel = completed % 5;
    return { level, points: completed * 10, remaining: 5 - progressInLevel, percentage: progressInLevel * 20 };
  });
  readonly pendingTasks = computed(() => {
    const currentTaskId = this.today.today()?.task.id;
    return this.projects.projects()
      .flatMap(project => project.tasks.filter(task => !task.completed && task.id !== currentTaskId).map(task => ({ project, task })))
      .sort((first, second) => first.task.order - second.task.order)
      .slice(0, 5);
  });
  readonly pendingCount = computed(() => {
    const currentTaskId = this.today.today()?.task.id;
    return this.projects.projects().reduce((total, project) => total + project.tasks.filter(task => !task.completed && task.id !== currentTaskId).length, 0);
  });
  readonly reminderLabel = computed(() => {
    const value = this.reminders.snoozedUntil();
    if (!value) return '';
    const dueAt = new Date(value);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sameDay = (first: Date, second: Date) => first.getFullYear() === second.getFullYear()
      && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();
    const day = sameDay(dueAt, new Date()) ? 'today' : sameDay(dueAt, tomorrow) ? 'tomorrow' : dueAt.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${day} at ${dueAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  });

  constructor() { addIcons({ alarmOutline, closeCircleOutline, sunnyOutline, timeOutline, trophyOutline }); }

  async openReminderOptions(): Promise<void> {
    const sheet = await this.actionSheets.create({
      cssClass: 'project-start-sheet',
      header: 'Remind me gently',
      subHeader: 'Choose when this step should come back.',
      buttons: [
        { text: 'In 30 minutes', icon: 'time-outline', handler: () => void this.scheduleReminder(30) },
        { text: 'In 2 hours', icon: 'alarm-outline', handler: () => void this.scheduleReminder(120) },
        { text: 'Tomorrow morning', icon: 'sunny-outline', handler: () => void this.scheduleTomorrow() },
        { text: 'Cancel', icon: 'close-circle-outline', role: 'cancel' }
      ]
    });
    await sheet.present();
  }

  cancelReminder(): void {
    this.reminders.cancelSnoozedReminder();
    void this.showToast('The extra reminder was cancelled.');
  }

  private async scheduleReminder(minutes: number): Promise<void> {
    const dueAt = await this.reminders.remindIn(minutes);
    await this.showToast(dueAt ? `Reminder set for ${this.reminderLabel()}.` : 'Notification permission was not granted.', !dueAt);
  }

  private async scheduleTomorrow(): Promise<void> {
    const dueAt = await this.reminders.remindTomorrow();
    await this.showToast(dueAt ? `Reminder set for ${this.reminderLabel()}.` : 'Notification permission was not granted.', !dueAt);
  }

  private async showToast(message: string, danger = false): Promise<void> {
    const toast = await this.toasts.create({ message, color: danger ? 'danger' : undefined, duration: 2600, position: 'bottom' });
    await toast.present();
  }
}
