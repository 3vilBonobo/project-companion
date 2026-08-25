import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  AlertController,
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonToggle,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alarmOutline, cloudDownloadOutline, cloudOfflineOutline, colorPaletteOutline, documentOutline, gameControllerOutline, leafOutline, notificationsOutline, personCircleOutline, phonePortraitOutline, sparklesOutline, terminalOutline, trashOutline, volumeHighOutline } from 'ionicons/icons';
import { AppTheme } from '../../core/models/project.models';
import { BackupService } from '../../core/services/backup.service';
import { ProjectService } from '../../core/services/project.service';
import { ReminderService } from '../../core/services/reminder.service';
import { SettingsService } from '../../core/services/settings.service';
import { AppTabsComponent } from '../../shared/components/app-tabs/app-tabs.component';
import { InteractionFeedbackService } from '../../core/services/interaction-feedback.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [IonButton, IonContent, IonFooter, IonIcon, IonInput, IonSelect, IonSelectOption, IonToggle, AppTabsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ion-page' },
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss'
})
export class SettingsPage {
  readonly settings = inject(SettingsService);
  readonly projects = inject(ProjectService);
  readonly projectCount = computed(() => this.projects.projects().length);
  private readonly backup = inject(BackupService);
  private readonly alerts = inject(AlertController);
  private readonly toasts = inject(ToastController);
  readonly reminders = inject(ReminderService);
  private readonly feedback = inject(InteractionFeedbackService);

  constructor() { addIcons({ alarmOutline, cloudDownloadOutline, cloudOfflineOutline, colorPaletteOutline, documentOutline, gameControllerOutline, leafOutline, notificationsOutline, personCircleOutline, phonePortraitOutline, sparklesOutline, terminalOutline, trashOutline, volumeHighOutline }); }

  selectTheme(theme: AppTheme): void { this.settings.update({ theme }); }

  toggleSounds(enabled: boolean): void {
    this.settings.update({ soundEffectsEnabled: enabled });
    if (enabled) this.feedback.preview();
  }

  async toggleReminders(enabled: boolean): Promise<void> {
    const granted = await this.reminders.setEnabled(enabled);
    if (enabled && !granted) await this.showToast(this.reminders.supported ? 'Notification permission was not granted.' : 'This browser does not support scheduled notifications.', 'danger');
  }

  testReminder(): void {
    this.reminders.sendTest();
    void this.showToast('Test reminder sent.');
  }

  exportBackup(): void {
    this.backup.download();
    void this.showToast('Backup saved to your downloads.');
  }

  async importBackup(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const count = await this.backup.import(file);
      await this.showToast(`${count} ${count === 1 ? 'project' : 'projects'} restored.`);
    } catch (error) {
      await this.showToast(error instanceof Error ? error.message : 'That backup could not be restored.', 'danger');
    } finally {
      input.value = '';
    }
  }

  async resetData(): Promise<void> {
    const alert = await this.alerts.create({
      header: 'Start with a clear space?',
      message: 'All projects and preferences on this device will be removed. Export a backup first if you may want them later.',
      buttons: [
        { text: 'Keep everything', role: 'cancel' },
        { text: 'Clear local data', role: 'destructive', handler: () => { this.projects.clearProjects(); this.settings.reset(); void this.showToast('Your local space is clear.'); } }
      ]
    });
    await alert.present();
  }

  private async showToast(message: string, color?: 'danger'): Promise<void> {
    const toast = await this.toasts.create({ message, duration: 2400, position: 'bottom', color });
    await toast.present();
  }
}
