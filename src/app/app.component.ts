import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ReminderService } from './core/services/reminder.service';

@Component({ selector: 'app-root', standalone: true, imports: [IonApp, IonRouterOutlet], template: '<ion-app><ion-router-outlet /></ion-app>', changeDetection: ChangeDetectionStrategy.OnPush })
export class AppComponent { private readonly reminders = inject(ReminderService); }
