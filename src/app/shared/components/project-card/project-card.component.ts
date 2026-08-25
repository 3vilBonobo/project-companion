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
    @if (categoryProgress().length) {
    <div class="category-summary" aria-label="Progress by category">
      @for (category of categoryProgress(); track category.category) {
      <div
        class="category-ring"
        role="progressbar"
        [attr.aria-label]="category.category + ': ' + category.completed + ' of ' + category.total + ' complete'"
        [attr.aria-valuenow]="category.percentage"
        aria-valuemin="0"
        aria-valuemax="100">
        <div class="ring-visual">
          <svg viewBox="0 0 44 44" aria-hidden="true">
            <circle class="ring-track" cx="22" cy="22" r="18" />
            <circle class="ring-value" cx="22" cy="22" r="18" stroke-dasharray="113.1" [attr.stroke-dashoffset]="ringOffset(category.percentage)" />
          </svg>
          <small>{{ category.completed }}/{{ category.total }}</small>
        </div>
        <span>{{ category.category }}</span>
      </div>
      }
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
      .category-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(64px, 1fr));
        align-items: start;
        gap: 14px 10px;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid var(--line);
      }
      .category-ring {
        --ring-color: var(--ion-color-primary);
        display: grid;
        justify-items: center;
        gap: 7px;
        min-width: 0;
        color: var(--ink-soft);
        text-align: center;
      }
      .category-ring:nth-child(6n + 1) { --ring-color: var(--ion-color-primary); }
      .category-ring:nth-child(6n + 2) { --ring-color: var(--accent-2); }
      .category-ring:nth-child(6n + 3) { --ring-color: var(--accent-3); }
      .category-ring:nth-child(6n + 4) { --ring-color: color-mix(in srgb, var(--ion-color-primary) 58%, var(--accent-2)); }
      .category-ring:nth-child(6n + 5) { --ring-color: color-mix(in srgb, var(--accent-3) 58%, var(--ion-color-primary)); }
      .category-ring:nth-child(6n + 6) { --ring-color: color-mix(in srgb, var(--accent-2) 55%, var(--accent-3)); }
      .ring-visual {
        position: relative;
        display: grid;
        place-items: center;
        width: 56px;
        height: 56px;
      }
      .ring-visual svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      }
      .ring-track,
      .ring-value {
        fill: none;
        stroke-width: 5;
      }
      .ring-track { stroke: color-mix(in srgb, var(--ring-color) 22%, var(--surface)); }
      .ring-value {
        stroke: var(--ring-color);
        stroke-linecap: round;
        transition: stroke-dashoffset .35s ease;
      }
      .ring-visual small {
        position: relative;
        color: var(--ring-color);
        font-size: .65rem;
        font-weight: 850;
      }
      .category-ring > span {
        max-width: 82px;
        overflow: hidden;
        color: var(--ink-soft);
        font-size: .68rem;
        font-weight: 750;
        line-height: 1.2;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
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
  readonly categoryProgress = computed(() => this.progress.forCategories(this.project()));
  ringOffset(percentage: number): number { return 113.1 * (1 - Math.min(100, Math.max(0, percentage)) / 100); }
  constructor(readonly progress: ProgressService) {
    addIcons({ arrowForward, trashOutline });
  }
}
