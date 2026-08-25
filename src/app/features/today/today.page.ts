import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import {
  ActionSheetController,
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
  ToastController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { alarmOutline, closeCircleOutline, sunnyOutline, timeOutline } from "ionicons/icons";
import { ReminderService } from "../../core/services/reminder.service";
import { TodaysTaskService } from "../../core/services/todays-task.service";
import { SettingsService } from "../../core/services/settings.service";
import { CompanionProgressService } from "../../core/services/companion-progress.service";
import { InteractionFeedbackService } from "../../core/services/interaction-feedback.service";
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "ion-page" },
  template: `<ion-content [fullscreen]="true"
      ><main class="page-shell today-shell">
        <header class="today-header">
          <div>
            <span class="day-label">Today{{ firstName() ? ", " + firstName() : "" }}</span>
            <p>One small thing is enough.</p>
          </div>
          @if (today.today(); as item) {
            <div class="header-progress">
              <app-progress-circle [value]="companion.levelProgress()" />
              <div>
                <strong>Level {{ companion.level() }}</strong
                ><span>{{ companion.xp() }} gentle XP</span>
              </div>
            </div>
          }
        </header>
        @if (today.today(); as item) {
          <div class="today-layout">
            <section class="focus-column" aria-label="Today's focus">
              <div class="quest-welcome">
                <div class="companion" [class.awake]="today.isStarted()" aria-hidden="true">
                  <i></i><b></b><span></span>
                </div>
                <div>
                  <span>{{ today.isStarted() ? "Your companion is cheering you on" : companionMessage() }}</span
                  ><strong>{{
                    today.isStarted() ? "You already did the hardest part: beginning." : "Ready for one tiny quest?"
                  }}</strong>
                </div>
              </div>
              <div class="project-context">
                <span>Today’s quest · +{{ companion.xpFor(item.task) }} XP</span
                ><strong>{{ item.project.title }}</strong>
              </div>
              <div
                class="focus-progress"
                role="progressbar"
                [attr.aria-label]="projectProgress().percentage + '% of this project complete'"
                [attr.aria-valuenow]="projectProgress().percentage"
                aria-valuemin="0"
                aria-valuemax="100">
                <div><i [style.width.%]="projectProgress().percentage"></i></div>
                <span>{{ projectProgress().completed }} of {{ projectProgress().total }} project quests complete</span>
              </div>
              <app-task-card [task]="item.task" />
              <div class="actions">
                @if (!today.isStarted()) {
                  <app-primary-button label="Start this small step" (pressed)="startQuest()" />
                } @else {
                  <app-primary-button label="Complete quest" icon="checkmark" (pressed)="completeQuest()" />
                }
                <span class="encouragement">{{ encouragement() }}</span>
              </div>
              <section class="reminder-card" aria-label="Gentle reminder">
                <div class="reminder-icon"><ion-icon name="alarm-outline" /></div>
                <div>
                  <strong>{{ reminders.snoozedUntil() ? "Reminder ready" : "Not the right moment?" }}</strong>
                  <small>{{
                    reminders.snoozedUntil()
                      ? "We’ll bring this step back " + reminderLabel() + "."
                      : "Come back to this step later."
                  }}</small>
                </div>
                <div class="reminder-actions">
                  <ion-button
                    fill="clear"
                    size="small"
                    [disabled]="!reminders.supported"
                    (click)="openReminderOptions()">
                    {{ reminders.snoozedUntil() ? "Change" : "Remind me" }}
                  </ion-button>
                  @if (reminders.snoozedUntil()) {
                    <button type="button" (click)="cancelReminder()">Cancel</button>
                  }
                </div>
              </section>
            </section>
          </div>
        } @else {
          <app-empty-state
            title="All caught up"
            message="You’ve completed every planned step. Rest is part of making progress." />
        }
        @if (celebration(); as reward) {
          <div
            class="celebration"
            role="dialog"
            aria-modal="true"
            aria-labelledby="celebration-title"
            (click)="dismissCelebration()">
            <div class="confetti" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
            <section (click)="$event.stopPropagation()">
              <div class="celebration-companion" aria-hidden="true"><i></i><b></b><span></span></div>
              <span class="reward-pill">+{{ reward.xp }} XP</span>
              <h2 id="celebration-title">Quest complete!</h2>
              <p>
                You moved <strong>{{ reward.project }}</strong> forward. That small step counts.
              </p>
              @if (reward.achievement) {
                <div class="achievement-unlock">
                  <span>{{ reward.achievement.icon }}</span>
                  <div>
                    <small>Achievement unlocked</small><strong>{{ reward.achievement.title }}</strong>
                  </div>
                </div>
              }
              <button type="button" (click)="dismissCelebration()">Continue</button>
            </section>
          </div>
        }
      </main></ion-content
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
      .header-progress {
        display: flex;
        align-items: center;
        gap: 11px;
      }
      .header-progress > div {
        display: grid;
        gap: 2px;
      }
      .header-progress strong {
        color: var(--ink);
        font-size: 0.82rem;
      }
      .header-progress span {
        color: var(--muted);
        font-size: 0.68rem;
      }
      .today-layout {
        display: block;
      }
      .focus-column {
        width: min(100%, 760px);
        min-width: 0;
        margin-inline: auto;
      }
      .quest-welcome {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 18px;
        padding: 14px 18px;
        border: 1px solid var(--line);
        border-radius: 22px;
        background: color-mix(in srgb, var(--surface) 78%, var(--accent-3));
      }
      .quest-welcome > div:last-child {
        display: grid;
        gap: 3px;
      }
      .quest-welcome span {
        color: var(--muted);
        font-size: 0.72rem;
      }
      .quest-welcome strong {
        color: var(--ink);
        font-size: 0.88rem;
      }
      .focus-progress {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        gap: 10px;
        margin: -2px 4px 14px;
      }
      .focus-progress > div {
        height: 7px;
        overflow: hidden;
        border-radius: 99px;
        background: var(--ion-color-light-shade);
      }
      .focus-progress i {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--ion-color-primary), var(--accent-2));
        transition: width 0.35s ease;
      }
      .focus-progress span {
        color: var(--muted);
        font-size: 0.66rem;
        font-weight: 700;
      }
      .companion,
      .celebration-companion {
        position: relative;
        flex: 0 0 auto;
        width: 52px;
        height: 48px;
        border: 2px solid color-mix(in srgb, var(--ion-color-primary) 72%, var(--ink));
        border-radius: 48% 52% 45% 45%;
        background: linear-gradient(
          145deg,
          var(--accent-3),
          color-mix(in srgb, var(--ion-color-primary) 35%, var(--surface))
        );
        box-shadow:
          inset 0 -7px 0 rgba(0, 0, 0, 0.07),
          0 5px 0 color-mix(in srgb, var(--ion-color-primary) 20%, transparent);
        animation: companion-float 3s ease-in-out infinite;
      }
      .companion::before,
      .companion::after,
      .celebration-companion::before,
      .celebration-companion::after {
        content: "";
        position: absolute;
        top: -7px;
        width: 15px;
        height: 18px;
        border: 2px solid color-mix(in srgb, var(--ion-color-primary) 72%, var(--ink));
        background: var(--accent-3);
        z-index: -1;
      }
      .companion::before,
      .celebration-companion::before {
        left: 5px;
        border-radius: 90% 10% 0 20%;
        transform: rotate(-18deg);
      }
      .companion::after,
      .celebration-companion::after {
        right: 5px;
        border-radius: 10% 90% 20% 0;
        transform: rotate(18deg);
      }
      .companion i,
      .companion b,
      .celebration-companion i,
      .celebration-companion b {
        position: absolute;
        top: 17px;
        width: 5px;
        height: 7px;
        border-radius: 50%;
        background: var(--ink);
      }
      .companion i,
      .celebration-companion i {
        left: 14px;
      }
      .companion b,
      .celebration-companion b {
        right: 14px;
      }
      .companion span,
      .celebration-companion span {
        position: absolute;
        left: 50%;
        bottom: 9px;
        width: 12px;
        height: 6px;
        border-bottom: 2px solid var(--ink);
        border-radius: 50%;
        transform: translateX(-50%);
      }
      .companion.awake {
        animation-duration: 1.2s;
      }
      .up-next {
        padding: 20px;
        border: 1px solid var(--line);
        border-radius: var(--card-radius);
        background: color-mix(in srgb, var(--surface) 82%, transparent);
      }
      .aside-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      .aside-heading span {
        color: var(--ion-color-primary);
        font-size: 0.65rem;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .aside-heading h2 {
        margin: 3px 0 0;
        color: var(--ink);
        font-size: 1.18rem;
      }
      .aside-heading b {
        display: grid;
        place-items: center;
        min-width: 28px;
        height: 28px;
        padding: 0 8px;
        border-radius: 99px;
        background: var(--ion-color-light);
        color: var(--ink-soft);
        font-size: 0.75rem;
      }
      .pending-list {
        display: grid;
      }
      .pending-task {
        display: grid;
        grid-template-columns: 18px 1fr;
        gap: 10px;
        padding: 12px 2px;
        border-bottom: 1px solid var(--line);
        color: inherit;
        text-decoration: none;
      }
      .pending-task i {
        width: 16px;
        height: 16px;
        margin-top: 2px;
        border: 1.5px solid var(--line);
        border-radius: 50%;
      }
      .pending-task span {
        display: grid;
        gap: 4px;
        min-width: 0;
      }
      .pending-task strong {
        overflow: hidden;
        color: var(--ink);
        font-size: 0.82rem;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .pending-task small {
        overflow: hidden;
        color: var(--muted);
        font-size: 0.68rem;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .pending-task:hover strong {
        color: var(--ion-color-primary);
      }
      .no-pending {
        margin: 12px 0;
        color: var(--muted);
        font-size: 0.78rem;
        line-height: 1.5;
      }
      .view-all {
        display: inline-block;
        margin-top: 14px;
        color: var(--ion-color-primary);
        font-size: 0.75rem;
        font-weight: 750;
        text-decoration: none;
      }
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
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .level-copy strong {
        color: var(--ink);
      }
      .level-progress {
        grid-column: 1 / -1;
        display: grid;
        gap: 6px;
        color: var(--muted);
        font-size: 0.67rem;
      }
      .level-progress small {
        color: var(--muted);
      }
      .level-progress > div {
        width: 100%;
        height: 6px;
        overflow: hidden;
        border-radius: 99px;
        background: var(--ion-color-light-shade);
      }
      .level-progress i {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--ion-color-primary), var(--accent-2));
      }
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
      .reminder-card > div:nth-child(2) {
        display: grid;
        gap: 3px;
        min-width: 0;
      }
      .reminder-card strong {
        color: var(--ink);
        font-size: 0.82rem;
      }
      .reminder-card small {
        color: var(--muted);
        font-size: 0.7rem;
        line-height: 1.35;
      }
      .reminder-actions {
        display: grid;
        justify-items: end;
      }
      .reminder-actions ion-button {
        margin: 0;
        text-transform: none;
        font-weight: 750;
      }
      .reminder-actions button {
        border: 0;
        padding: 3px 9px;
        background: none;
        color: var(--muted);
        font: inherit;
        font-size: 0.67rem;
        cursor: pointer;
      }
      app-task-card {
        display: block;
      }
      .celebration {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: grid;
        place-items: center;
        padding: 22px;
        background: color-mix(in srgb, var(--ink) 30%, transparent);
        backdrop-filter: blur(5px);
        animation: fade-in 0.2s ease-out;
      }
      .celebration > section {
        position: relative;
        width: min(100%, 390px);
        padding: 34px 28px 28px;
        border: 1px solid var(--line);
        border-radius: 32px;
        background: var(--surface);
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.25);
        text-align: center;
        animation: reward-in 0.45s cubic-bezier(0.2, 0.9, 0.2, 1.2);
      }
      .celebration-companion {
        width: 82px;
        height: 74px;
        margin: 0 auto 20px;
        transform: scale(1.1);
      }
      .celebration-companion i,
      .celebration-companion b {
        top: 28px;
        width: 7px;
        height: 9px;
      }
      .celebration-companion i {
        left: 23px;
      }
      .celebration-companion b {
        right: 23px;
      }
      .celebration-companion span {
        bottom: 15px;
        width: 22px;
        height: 12px;
      }
      .reward-pill {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 99px;
        background: color-mix(in srgb, var(--accent-3) 30%, var(--surface));
        color: var(--ion-color-primary);
        font-size: 0.75rem;
        font-weight: 850;
        letter-spacing: 0.05em;
      }
      .celebration h2 {
        margin: 13px 0 8px;
        color: var(--ink);
        font-size: 2rem;
        letter-spacing: -0.04em;
      }
      .celebration p {
        margin: 0 auto 24px;
        color: var(--muted);
        line-height: 1.55;
      }
      .celebration p strong {
        color: var(--ink);
      }
      .achievement-unlock {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: -8px 0 22px;
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: 16px;
        background: color-mix(in srgb, var(--accent-3) 18%, var(--surface));
        text-align: left;
      }
      .achievement-unlock > span {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        border-radius: 13px;
        background: var(--surface);
        font-size: 1.3rem;
      }
      .achievement-unlock > div {
        display: grid;
        gap: 2px;
      }
      .achievement-unlock small {
        color: var(--ion-color-primary);
        font-size: 0.62rem;
        font-weight: 850;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .achievement-unlock strong {
        color: var(--ink);
      }
      .celebration button {
        width: 100%;
        min-height: 52px;
        border: 0;
        border-radius: 16px;
        background: var(--ion-color-primary);
        box-shadow: 0 5px 0 var(--ion-color-primary-shade);
        color: var(--ion-color-primary-contrast);
        font: inherit;
        font-weight: 800;
        cursor: pointer;
      }
      .celebration button:active {
        transform: translateY(3px);
        box-shadow: 0 2px 0 var(--ion-color-primary-shade);
      }
      .confetti i {
        position: absolute;
        left: var(--x);
        top: -30px;
        width: 10px;
        height: 18px;
        border-radius: 3px;
        background: var(--c);
        animation: confetti-fall 1.8s ease-in forwards;
        animation-delay: var(--d);
      }
      .confetti i:nth-child(1) {
        --x: 10%;
        --c: var(--accent-2);
        --d: 0.05s;
      }
      .confetti i:nth-child(2) {
        --x: 22%;
        --c: var(--accent-3);
        --d: 0.25s;
      }
      .confetti i:nth-child(3) {
        --x: 35%;
        --c: var(--ion-color-primary);
        --d: 0.12s;
      }
      .confetti i:nth-child(4) {
        --x: 48%;
        --c: var(--accent-2);
        --d: 0.35s;
      }
      .confetti i:nth-child(5) {
        --x: 61%;
        --c: var(--accent-3);
        --d: 0.08s;
      }
      .confetti i:nth-child(6) {
        --x: 73%;
        --c: var(--ion-color-primary);
        --d: 0.3s;
      }
      .confetti i:nth-child(7) {
        --x: 84%;
        --c: var(--accent-2);
        --d: 0.18s;
      }
      .confetti i:nth-child(8) {
        --x: 93%;
        --c: var(--accent-3);
        --d: 0.4s;
      }
      @keyframes companion-float {
        50% {
          transform: translateY(-3px) rotate(1deg);
        }
      }
      @keyframes fade-in {
        from {
          opacity: 0;
        }
      }
      @keyframes reward-in {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.9);
        }
      }
      @keyframes confetti-fall {
        to {
          transform: translateY(105vh) rotate(620deg);
        }
      }
      @media (min-width: 960px) {
        .today-shell {
          width: min(100% - 56px, 920px);
        }
      }
      @media (max-width: 560px) {
        .today-header {
          align-items: flex-start;
        }
        .header-progress span {
          display: none;
        }
        .quest-welcome {
          padding: 12px 14px;
        }
        .focus-progress {
          grid-template-columns: 1fr;
          gap: 6px;
        }
        .focus-progress span {
          text-align: center;
        }
        .reminder-card {
          grid-template-columns: auto 1fr;
        }
        .reminder-actions {
          grid-column: 1 / -1;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }
      }
    `,
  ],
})
export class TodayPage {
  readonly today = inject(TodaysTaskService);
  readonly reminders = inject(ReminderService);
  readonly companion = inject(CompanionProgressService);
  private readonly feedback = inject(InteractionFeedbackService);
  private readonly settings = inject(SettingsService);
  private readonly actionSheets = inject(ActionSheetController);
  private readonly toasts = inject(ToastController);
  readonly celebration = signal<{ xp: number; project: string; achievement?: { title: string; icon: string } } | null>(
    null,
  );
  readonly firstName = computed(() => this.settings.settings().firstName);
  readonly encouragement = computed(() => {
    const name = this.firstName();
    return this.today.isStarted()
      ? `${name ? name + ", you" : "You"}’ve begun — take your time.`
      : `No rush${name ? ", " + name : ""}. Start when you’re ready.`;
  });
  readonly companionMessage = computed(() =>
    this.companion.momentum() > 0
      ? `You’ve made progress on ${this.companion.momentum()} of the last 7 days.`
      : "No streaks to protect. Today can be a fresh start.",
  );
  readonly projectProgress = computed(() => {
    const tasks = this.today.today()?.project.tasks ?? [];
    const completed = tasks.filter((task) => task.completed).length;
    return {
      completed,
      total: tasks.length,
      percentage: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    };
  });
  readonly reminderLabel = computed(() => {
    const value = this.reminders.snoozedUntil();
    if (!value) return "";
    const dueAt = new Date(value);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sameDay = (first: Date, second: Date) =>
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate();
    const day = sameDay(dueAt, new Date())
      ? "today"
      : sameDay(dueAt, tomorrow)
        ? "tomorrow"
        : dueAt.toLocaleDateString([], { month: "short", day: "numeric" });
    return `${day} at ${dueAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  });

  constructor() {
    addIcons({ alarmOutline, closeCircleOutline, sunnyOutline, timeOutline });
  }

  async openReminderOptions(): Promise<void> {
    const sheet = await this.actionSheets.create({
      cssClass: "project-start-sheet",
      header: "Remind me gently",
      subHeader: "Choose when this step should come back.",
      buttons: [
        { text: "In 30 minutes", icon: "time-outline", handler: () => void this.scheduleReminder(30) },
        { text: "In 2 hours", icon: "alarm-outline", handler: () => void this.scheduleReminder(120) },
        { text: "Tomorrow morning", icon: "sunny-outline", handler: () => void this.scheduleTomorrow() },
        { text: "Cancel", icon: "close-circle-outline", role: "cancel" },
      ],
    });
    await sheet.present();
  }

  cancelReminder(): void {
    this.reminders.cancelSnoozedReminder();
    void this.showToast("The extra reminder was cancelled.");
  }

  completeQuest(): void {
    const item = this.today.today();
    if (!item) return;
    const previousAchievements = this.companion.unlockedIds();
    this.today.complete();
    const achievement = this.companion.newlyUnlocked(previousAchievements);
    this.celebration.set({ xp: this.companion.xpFor(item.task), project: item.project.title, achievement });
    this.feedback.questCompleted(Boolean(achievement));
  }

  startQuest(): void {
    this.today.start();
    this.feedback.questStarted();
  }

  dismissCelebration(): void {
    this.celebration.set(null);
  }

  private async scheduleReminder(minutes: number): Promise<void> {
    const dueAt = await this.reminders.remindIn(minutes);
    await this.showToast(
      dueAt ? `Reminder set for ${this.reminderLabel()}.` : "Notification permission was not granted.",
      !dueAt,
    );
  }

  private async scheduleTomorrow(): Promise<void> {
    const dueAt = await this.reminders.remindTomorrow();
    await this.showToast(
      dueAt ? `Reminder set for ${this.reminderLabel()}.` : "Notification permission was not granted.",
      !dueAt,
    );
  }

  private async showToast(message: string, danger = false): Promise<void> {
    const toast = await this.toasts.create({
      message,
      color: danger ? "danger" : undefined,
      duration: 2600,
      position: "bottom",
    });
    await toast.present();
  }
}
