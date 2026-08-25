import { ChangeDetectionStrategy, Component, computed, input, output } from "@angular/core";
import { IonButton, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { arrowForward, trashOutline } from "ionicons/icons";
import { Project } from "../../../core/models/project.models";
import { ProgressService } from "../../../core/services/progress.service";

@Component({
  selector: "app-project-card",
  standalone: true,
  imports: [IonButton, IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<article
    class="project-card"
    (click)="opened.emit()"
    (keydown.enter)="opened.emit()"
    tabindex="0"
    role="button">
    <div class="card-copy">
      <span>{{ progress.forProject(project()).completed }} of {{ progress.forProject(project()).total }} steps</span>
      <h2>{{ project().title }}</h2>
      <p>{{ project().description || "A meaningful project, one small step at a time." }}</p>
    </div>
    @if (journey().length) {
    <div class="quest-journey" aria-label="Project quest journey">
      <div class="journey-line" aria-hidden="true"><i [style.width.%]="progress.forProject(project()).percentage"></i></div>
      @for (step of journey(); track step.id; let index = $index) {
      <div class="quest-node" [class.complete]="step.completed" [class.current]="step.current" [attr.aria-label]="step.title + (step.completed ? ', complete' : step.current ? ', current quest' : ', upcoming')">
        <span>{{ step.completed ? '✓' : index + 1 }}</span>
        @if (step.current) { <small>Next</small> }
      </div>
      }
      @if (hiddenSteps() > 0) { <div class="more-steps" [attr.aria-label]="hiddenSteps() + ' more steps'">+{{ hiddenSteps() }}</div> }
    </div>
    }
    <div class="card-actions">
      <div
        class="overall-progress"
        role="progressbar"
        [attr.aria-label]="progress.forProject(project()).percentage + '% of project complete'"
        [attr.aria-valuenow]="progress.forProject(project()).percentage"
        aria-valuemin="0"
        aria-valuemax="100">
        <div class="progress-track"><div [style.width.%]="progress.forProject(project()).percentage"></div></div>
        <span>{{ progress.forProject(project()).percentage }}%</span>
      </div>
      <ion-button
        fill="clear"
        color="medium"
        aria-label="Delete project"
        (click)="$event.stopPropagation(); deleted.emit()"
        ><ion-icon slot="icon-only" name="trash-outline"
      /></ion-button>
      <ion-icon name="arrow-forward" aria-hidden="true" />
    </div>
  </article>`,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .project-card {
        display: flex;
        flex-direction: column;
        height: 100%;
        box-sizing: border-box;
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: var(--card-radius);
        padding: 22px;
        cursor: pointer;
        transition:
          transform 0.2s ease,
          border-color 0.2s ease;
        outline: none;
        box-shadow: var(--card-shadow);
      }
      .project-card:hover,
      .project-card:focus-visible {
        transform: translateY(-2px);
        border-color: var(--ion-color-primary-tint);
      }
      .card-copy > span {
        color: var(--ion-color-primary);
        font-size: 0.73rem;
        font-weight: 750;
      }
      h2 {
        margin: 8px 0;
        color: var(--ink);
        font-size: 1.35rem;
        letter-spacing: -0.025em;
      }
      p {
        margin: 0;
        color: var(--muted);
        line-height: 1.45;
      }
      .quest-journey {
        position: relative;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
        margin-top: 20px;
        padding: 20px 2px 4px;
        border-top: 1px solid var(--line);
      }
      .journey-line { position: absolute; z-index: 0; top: 36px; left: 20px; right: 20px; height: 5px; overflow: hidden; border-radius: 99px; background: var(--ion-color-light-shade); }
      .journey-line i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--ion-color-primary), var(--accent-2)); transition: width .35s ease; }
      .quest-node {
        position: relative;
        z-index: 1;
        display: grid;
        justify-items: center;
        gap: 5px;
        color: var(--muted);
      }
      .quest-node > span { display: grid; place-items: center; width: 34px; height: 34px; border: 3px solid var(--surface); border-radius: 50%; background: var(--ion-color-light-shade); box-shadow: 0 0 0 1px var(--line); color: var(--muted); font-size: .72rem; font-weight: 850; }
      .quest-node.complete > span { background: var(--ion-color-primary); box-shadow: 0 0 0 1px var(--ion-color-primary); color: var(--ion-color-primary-contrast); }
      .quest-node.current > span { background: var(--accent-3); box-shadow: 0 0 0 2px var(--accent-3), 0 4px 0 color-mix(in srgb, var(--accent-3) 45%, var(--ink)); color: var(--ink); animation: current-quest 2s ease-in-out infinite; }
      .quest-node small { color: var(--ion-color-primary); font-size: .58rem; font-weight: 850; text-transform: uppercase; }
      .more-steps { position: relative; z-index: 1; display: grid; place-items: center; width: 34px; height: 34px; border: 3px solid var(--surface); border-radius: 50%; background: var(--ion-color-light); box-shadow: 0 0 0 1px var(--line); color: var(--ink-soft); font-size: .65rem; font-weight: 850; }
      @keyframes current-quest { 50% { transform: translateY(-3px); } }
      .card-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
        margin-top: auto;
        padding-top: 20px;
        color: var(--muted);
        font-size: 0.76rem;
        font-weight: 700;
      }
      .overall-progress {
        display: flex;
        align-items: center;
        gap: 9px;
        min-width: 0;
        margin-right: auto;
        flex: 1;
      }
      .progress-track {
        height: 5px;
        flex: 1;
        overflow: hidden;
        border-radius: 999px;
        background: var(--ion-color-light-shade);
      }
      .progress-track div {
        height: 100%;
        border-radius: inherit;
        background: var(--ion-color-primary);
        transition: width .35s ease;
      }
      .overall-progress span {
        color: var(--ink-soft);
        font-size: .7rem;
        font-weight: 800;
      }
      ion-button {
        margin: -8px -5px -8px 2px;
      }
    `,
  ],
})
export class ProjectCardComponent {
  readonly project = input.required<Project>();
  readonly opened = output<void>();
  readonly deleted = output<void>();
  readonly journey = computed(() => {
    const tasks = [...this.project().tasks].sort((first, second) => first.order - second.order);
    const currentId = tasks.find(task => !task.completed)?.id;
    return tasks.slice(0, 6).map(task => ({ id: task.id, title: task.title, completed: task.completed, current: task.id === currentId }));
  });
  readonly hiddenSteps = computed(() => Math.max(0, this.project().tasks.length - this.journey().length));
  constructor(readonly progress: ProgressService) {
    addIcons({ arrowForward, trashOutline });
  }
}
