import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonIcon, IonLabel, IonTabBar, IonTabButton } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { leaf, layersOutline, settingsOutline } from "ionicons/icons";

@Component({
  selector: "app-tabs",
  standalone: true,
  imports: [RouterLink, IonTabBar, IonTabButton, IonIcon, IonLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ion-tab-bar slot="bottom"
    ><ion-tab-button tab="today" routerLink="/today" [selected]="active() === 'today'"><ion-icon name="leaf" /><ion-label>Today</ion-label></ion-tab-button
    ><ion-tab-button tab="projects" routerLink="/projects" [selected]="active() === 'projects'"
      ><ion-icon name="layers-outline" /><ion-label>Projects</ion-label></ion-tab-button
    ><ion-tab-button tab="settings" routerLink="/settings" [selected]="active() === 'settings'"
      ><ion-icon name="settings-outline" /><ion-label>Settings</ion-label></ion-tab-button
    ></ion-tab-bar
  >`,
  styles: [
    `
      ion-tab-bar {
        --background: var(--tab-bg);
        border-top: 1px solid var(--line);
        height: 76px;
        padding-bottom: env(safe-area-inset-bottom);
        backdrop-filter: blur(18px);
      }
      ion-tab-button {
        --color: var(--muted);
        --color-selected: var(--ion-color-primary);
        font-weight: 650;
      }
    `,
  ],
})
export class AppTabsComponent {
  readonly active = input.required<"today" | "projects" | "settings">();

  constructor() {
    addIcons({ leaf, layersOutline, settingsOutline });
  }
}
