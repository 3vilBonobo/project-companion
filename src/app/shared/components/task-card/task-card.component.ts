import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { timeOutline } from "ionicons/icons";
import { Task } from "../../../core/models/project.models";

@Component({
  selector: "app-task-card",
  standalone: true,
  imports: [IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<article class="task-card">
    <div class="task-context">
      <span class="eyebrow">Today's companion task</span>
      @if (task().category) { <span class="category">{{ task().category }}</span> }
    </div>
    <h1>{{ task().title }}</h1>
    <p>{{ task().description }}</p>
    <div class="duration">
      <ion-icon name="time-outline" aria-hidden="true" /> About {{ task().estimatedMinutes }} minutes
    </div>
  </article>`,
  styles: [
    `
      .task-card {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: calc(var(--card-radius) + 6px);
        padding: 30px 26px;
        box-shadow: var(--card-shadow);
      }
      .eyebrow {
        color: var(--ion-color-primary);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.69rem;
        font-weight: 800;
      }
      .task-context {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .category {
        overflow: hidden;
        max-width: 48%;
        padding: 5px 9px;
        border-radius: 999px;
        background: var(--ion-color-light);
        color: var(--ink-soft);
        font-size: 0.7rem;
        font-weight: 700;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      h1 {
        color: var(--ink);
        font-size: clamp(2rem, 9vw, 2.65rem);
        line-height: 1.04;
        letter-spacing: -0.045em;
        margin: 18px 0 14px;
      }
      p {
        color: var(--muted);
        font-size: 1.02rem;
        line-height: 1.55;
        margin: 0 0 25px;
      }
      .duration {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--ink-soft);
        font-weight: 650;
        font-size: 0.9rem;
      }
      ion-icon {
        font-size: 1.15rem;
      }
    `,
  ],
})
export class TaskCardComponent {
  readonly task = input.required<Task>();
  constructor() {
    addIcons({ timeOutline });
  }
}
