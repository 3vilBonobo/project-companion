import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";

@Component({
  selector: "app-progress-circle",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[style.--progress]": "dashOffset()" },
  template: `<svg viewBox="0 0 72 72" role="img" [attr.aria-label]="value() + '% complete'">
      <circle class="track" cx="36" cy="36" r="30" />
      <circle class="value" cx="36" cy="36" r="30" /></svg
    ><span>{{ value() }}%</span>`,
  styles: [
    `
      :host {
        display: grid;
        place-items: center;
        width: 72px;
        height: 72px;
        position: relative;
      }
      svg {
        position: absolute;
        inset: 0;
        transform: rotate(-90deg);
      }
      circle {
        fill: none;
        stroke-width: 6;
      }
      .track {
        stroke: var(--ion-color-light-shade);
      }
      .value {
        stroke: var(--ion-color-primary);
        stroke-linecap: round;
        stroke-dasharray: 188.5;
        stroke-dashoffset: var(--progress);
        transition: stroke-dashoffset 0.35s ease;
      }
      span {
        color: var(--ion-color-primary-shade);
        font-size: 0.78rem;
        font-weight: 750;
      }
    `,
  ],
})
export class ProgressCircleComponent {
  readonly value = input(0);
  readonly dashOffset = computed(() => 188.5 * (1 - Math.min(100, Math.max(0, this.value())) / 100));
}
