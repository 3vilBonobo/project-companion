import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { leafOutline } from "ionicons/icons";

@Component({
  selector: "app-empty-state",
  standalone: true,
  imports: [IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div>
    <ion-icon name="leaf-outline" />
    <h2>{{ title() }}</h2>
    <p>{{ message() }}</p>
    <ng-content />
  </div>`,
  styles: [
    `
      :host {
        display: block;
        text-align: center;
        padding: 48px 20px;
      }
      div {
        max-width: 330px;
        margin: auto;
      }
      ion-icon {
        font-size: 2.4rem;
        color: var(--ion-color-primary);
      }
      h2 {
        color: var(--ink);
        margin: 16px 0 8px;
      }
      p {
        color: var(--muted);
        line-height: 1.5;
        margin: 0 0 22px;
      }
    `,
  ],
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  constructor() {
    addIcons({ leafOutline });
  }
}
