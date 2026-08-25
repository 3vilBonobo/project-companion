import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { IonContent, IonFooter, IonIcon, IonSearchbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bulbOutline, chevronDownOutline, helpCircleOutline, leafOutline, searchOutline } from 'ionicons/icons';
import { AppTabsComponent } from '../../shared/components/app-tabs/app-tabs.component';

interface HelpItem {
  question: string;
  answer: string;
  keywords: string;
}

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [IonContent, IonFooter, IonIcon, IonSearchbar, AppTabsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ion-page' },
  templateUrl: './help.page.html',
  styleUrl: './help.page.scss'
})
export class HelpPage {
  readonly query = signal('');
  readonly questions: HelpItem[] = [
    { question: 'How do I create a project?', answer: 'Open Projects, choose New project, and give it a clear name. You can start from a template, build it manually, or import a plan from JSON.', keywords: 'add new start template import json' },
    { question: 'How does Today choose my task?', answer: 'Today looks for an unfinished task that fits your preferred step length. You can change that time in Settings under Daily focus.', keywords: 'suggest recommendation daily focus time length' },
    { question: 'How do I mark a task complete?', answer: 'Open the project or use the task shown on Today, then select the completion control. Your project progress updates automatically.', keywords: 'finish done check progress' },
    { question: 'Can I change the look of the app?', answer: 'Yes. Go to Settings and choose a theme under Choose your world. You can also reduce interface motion there.', keywords: 'theme appearance colors motion accessibility' },
    { question: 'How do reminders work?', answer: 'Enable Browser reminder in Settings, choose a time, and allow notifications when your browser asks. Reminders work while Project Companion is open; installed apps may also show a badge.', keywords: 'notification alarm time browser permission' },
    { question: 'Where is my data stored?', answer: 'Your projects and preferences are stored locally on this device. Project Companion does not require an account or send your project data to a server.', keywords: 'privacy local device account cloud server' },
    { question: 'How do I back up or move my projects?', answer: 'In Settings, select Export backup to download a JSON backup. On another device, use Import backup and choose that file.', keywords: 'export import restore transfer json data' },
    { question: 'What happens if I clear local data?', answer: 'All projects and preferences on this device are removed. This cannot be undone, so export a backup first if you may want them later.', keywords: 'delete reset remove erase backup' }
  ];

  readonly filteredQuestions = computed(() => {
    const term = this.query().trim().toLocaleLowerCase();
    if (!term) return this.questions;
    return this.questions.filter(item => `${item.question} ${item.answer} ${item.keywords}`.toLocaleLowerCase().includes(term));
  });

  constructor() {
    addIcons({ bulbOutline, chevronDownOutline, helpCircleOutline, leafOutline, searchOutline });
  }

  updateQuery(value: string | null | undefined): void {
    this.query.set(value ?? '');
  }
}
