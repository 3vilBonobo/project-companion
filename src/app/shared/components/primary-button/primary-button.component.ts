import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { IonButton, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { arrowForward, checkmark } from "ionicons/icons";

@Component({
  selector: "app-primary-button",
  standalone: true,
  imports: [IonButton, IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ion-button expand="block" [fill]="fill()" [disabled]="disabled()" (click)="pressed.emit()">
    <span>{{ label() }}</span
    ><ion-icon slot="end" [name]="icon()" aria-hidden="true" />
  </ion-button>`,
  styles: [
    `
      ion-button {
        --border-radius: 18px;
        --box-shadow: none;
        height: 58px;
        margin: 0;
        font-weight: 700;
        text-transform: none;
        letter-spacing: -0.01em;
      }
    `,
  ],
})
export class PrimaryButtonComponent {
  readonly label = input.required<string>();
  readonly icon = input("arrow-forward");
  readonly fill = input<"solid" | "outline" | "clear">("solid");
  readonly disabled = input(false);
  readonly pressed = output<void>();
  constructor() {
    addIcons({ arrowForward, checkmark });
  }
}
