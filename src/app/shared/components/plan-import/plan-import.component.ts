import { ChangeDetectionStrategy, Component, ElementRef, Input, inject, input, output, signal, viewChild } from '@angular/core';
import { AlertController, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, clipboardOutline, cloudUploadOutline, copyOutline, createOutline, removeCircleOutline } from 'ionicons/icons';
import { ProjectPlan } from '../../../core/models/project-plan.models';
import { ProjectPlanDiff, ProjectPlanDiffService } from '../../../core/services/project-plan-diff.service';
import { ProjectPlanImportService, projectPlanPrompt } from '../../../core/services/project-plan-import.service';
import { ProjectService } from '../../../core/services/project.service';
import { SettingsService } from '../../../core/services/settings.service';

export interface PlanImportResult {
  projectId: string;
  taskCount: number;
}

@Component({
  selector: 'app-plan-import',
  standalone: true,
  imports: [IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (triggerVisible) {
      <div class="import-actions" [class.compact]="compact()">
        <ion-button fill="outline" (click)="openFilePicker()">
          <ion-icon name="cloud-upload-outline" slot="start" />Upload JSON
        </ion-button>
        <button class="prompt-button" type="button" (click)="openPasteDialog()"><ion-icon name="clipboard-outline" />Paste JSON</button>
        @if (!compact()) {
          <button class="prompt-button" type="button" (click)="copyPrompt()"><ion-icon name="copy-outline" />Copy ChatGPT prompt</button>
        }
      </div>
    }
    <input #picker type="file" accept="application/json,.json" (change)="selectFile($event)" />

    <ion-modal class="plan-review-modal" [isOpen]="reviewOpen()" (didDismiss)="closeReview()">
      <ng-template>
        <ion-header class="ion-no-border">
          <ion-toolbar>
            <ion-buttons slot="start"><ion-button (click)="closeReview()">Cancel</ion-button></ion-buttons>
            <ion-title>Review AI plan</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          @if (pendingReview(); as review) {
          <main class="review-shell">
            <span class="review-eyebrow">Safe replacement check</span>
            <h2>See what will change</h2>
            <p class="review-intro">Nothing changes until you choose an action below. Unchanged completed steps keep their completion state.</p>

            <div class="diff-summary" aria-label="Plan change summary">
              <div class="added"><strong>{{ review.diff.added.length }}</strong><span>Added</span></div>
              <div class="modified"><strong>{{ review.diff.modified.length }}</strong><span>Changed</span></div>
              <div class="removed"><strong>{{ review.diff.removed.length }}</strong><span>Removed</span></div>
              <div class="unchanged"><strong>{{ review.diff.unchanged }}</strong><span>Unchanged</span></div>
            </div>

            @if (review.diff.projectChanges.length) {
            <section class="diff-section project-changes">
              <h3>Project details</h3>
              <p>{{ review.diff.projectChanges.join(' and ') }} will be updated.</p>
            </section>
            }

            @if (review.diff.added.length) {
            <section class="diff-section">
              <h3><ion-icon name="add-circle-outline" />Added steps</h3>
              <ul>@for (item of review.diff.added; track $index) { <li><strong>{{ item.after?.title }}</strong><span>{{ item.after?.category || 'No category' }}</span></li> }</ul>
            </section>
            }

            @if (review.diff.modified.length) {
            <section class="diff-section">
              <h3><ion-icon name="create-outline" />Changed steps</h3>
              <ul>@for (item of review.diff.modified; track $index) { <li><strong>{{ item.before?.title }}@if (item.before?.title !== item.after?.title) { → {{ item.after?.title }} }</strong><span>{{ item.changes.join(' · ') }}</span></li> }</ul>
            </section>
            }

            @if (review.diff.removed.length) {
            <section class="diff-section removed-list">
              <h3><ion-icon name="remove-circle-outline" />Removed steps</h3>
              <ul>@for (item of review.diff.removed; track $index) { <li><strong>{{ item.before?.title }}</strong><span>{{ item.before?.completed ? 'Completed' : 'Not completed' }}</span></li> }</ul>
            </section>
            }

            @if (!review.diff.added.length && !review.diff.modified.length && !review.diff.removed.length && !review.diff.projectChanges.length) {
            <section class="no-changes"><strong>This plan already matches.</strong><span>There are no project or step changes to apply.</span></section>
            }

            <div class="review-actions">
              <ion-button fill="outline" expand="block" (click)="addReviewedSteps()">Add all {{ review.plan.tasks.length }} steps</ion-button>
              <ion-button expand="block" [disabled]="!review.diff.added.length && !review.diff.modified.length && !review.diff.removed.length && !review.diff.projectChanges.length" (click)="replaceWithReviewedPlan()">Replace current plan</ion-button>
              <small>Replacement can be undone from the confirmation message.</small>
            </div>
          </main>
          }
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    .import-actions { display: flex; align-items: center; gap: 10px; }
    ion-button { --border-radius: 15px; --box-shadow: none; margin: 0; text-transform: none; font-weight: 700; }
    .prompt-button { display: flex; align-items: center; gap: 6px; border: 0; background: none; color: var(--muted); font: inherit; font-size: .78rem; cursor: pointer; white-space: nowrap; }
    .prompt-button ion-icon { font-size: 1rem; }
    input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
    .compact ion-button { font-size: .82rem; }
    ion-modal.plan-review-modal { --width: min(760px, calc(100vw - 32px)); --height: min(86vh, 820px); --border-radius: var(--card-radius); }
    ion-modal ion-toolbar { --background: var(--surface); --color: var(--ink); }
    ion-modal ion-content { --background: var(--app-bg); }
    .review-shell { width: min(100% - 36px, 660px); margin: 0 auto; padding: 32px 0 44px; }
    .review-eyebrow { color: var(--ion-color-primary); font-size: .68rem; font-weight: 850; letter-spacing: .11em; text-transform: uppercase; }
    h2 { color: var(--ink); font-size: clamp(2rem, 6vw, 3rem); letter-spacing: -.045em; margin: 8px 0 8px; }
    .review-intro { color: var(--muted); line-height: 1.5; margin: 0 0 22px; }
    .diff-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 24px; }
    .diff-summary > div { display: grid; gap: 2px; padding: 14px; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); }
    .diff-summary strong { color: var(--ink); font-size: 1.4rem; }
    .diff-summary span { color: var(--muted); font-size: .7rem; font-weight: 750; text-transform: uppercase; }
    .diff-summary .added { border-top: 4px solid #35a853; }
    .diff-summary .modified { border-top: 4px solid var(--accent-3); }
    .diff-summary .removed { border-top: 4px solid var(--ion-color-danger); }
    .diff-summary .unchanged { border-top: 4px solid var(--muted); }
    .diff-section, .no-changes { margin-bottom: 14px; padding: 17px 18px; border: 1px solid var(--line); border-radius: 16px; background: var(--surface); }
    .diff-section h3 { display: flex; align-items: center; gap: 8px; color: var(--ink); font-size: .94rem; margin: 0 0 12px; }
    .diff-section h3 ion-icon { color: var(--ion-color-primary); }
    .diff-section p { color: var(--muted); margin: 0; }
    ul { display: grid; gap: 9px; list-style: none; margin: 0; padding: 0; }
    li { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; padding-top: 9px; border-top: 1px solid var(--line); }
    li:first-child { padding-top: 0; border-top: 0; }
    li strong { color: var(--ink); font-size: .84rem; }
    li span { color: var(--muted); font-size: .7rem; text-align: right; }
    .removed-list h3 ion-icon { color: var(--ion-color-danger); }
    .no-changes { display: grid; gap: 4px; color: var(--ink); text-align: center; }
    .no-changes span { color: var(--muted); font-size: .8rem; }
    .review-actions { display: grid; gap: 10px; margin-top: 24px; }
    .review-actions ion-button { height: 50px; }
    .review-actions small { color: var(--muted); text-align: center; }
    @media (max-width: 600px) { .import-actions:not(.compact) { width: 100%; flex-direction: column; align-items: stretch; } .import-actions:not(.compact) ion-button { width: 100%; } .prompt-button { justify-content: center; } }
    @media (max-width: 600px) { ion-modal.plan-review-modal { --width: 100%; --height: 100%; --border-radius: 0; } .diff-summary { grid-template-columns: repeat(2, 1fr); } li { align-items: flex-start; flex-direction: column; gap: 3px; } li span { text-align: left; } }
  `]
})
export class PlanImportComponent {
  readonly existingProjectId = input<string>();
  readonly compact = input(false);
  @Input() triggerVisible = true;
  readonly imported = output<PlanImportResult>();
  readonly reviewOpen = signal(false);
  readonly pendingReview = signal<{ projectId: string; plan: ProjectPlan; diff: ProjectPlanDiff } | null>(null);
  private readonly picker = viewChild.required<ElementRef<HTMLInputElement>>('picker');

  private readonly parser = inject(ProjectPlanImportService);
  private readonly projects = inject(ProjectService);
  private readonly settings = inject(SettingsService);
  private readonly planDiff = inject(ProjectPlanDiffService);
  private readonly alerts = inject(AlertController);
  private readonly toasts = inject(ToastController);

  constructor() { addIcons({ addCircleOutline, clipboardOutline, cloudUploadOutline, copyOutline, createOutline, removeCircleOutline }); }

  openFilePicker(): void { this.picker().nativeElement.click(); }

  async openPasteDialog(): Promise<void> {
    let plan: ProjectPlan | undefined;
    const alert = await this.alerts.create({
      header: this.existingProjectId() ? 'Paste generated steps' : 'Paste a JSON plan',
      subHeader: 'Paste the complete JSON response from ChatGPT.',
      inputs: [{
        name: 'json',
        type: 'textarea',
        placeholder: '{\n  "schemaVersion": 1,\n  "title": "My project",\n  "tasks": [...]\n}',
        attributes: { rows: 12, spellcheck: false, autocapitalize: 'off', autocomplete: 'off' }
      }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Review plan',
          role: 'confirm',
          handler: (value: { json?: string }) => {
            try {
              if (!value.json?.trim()) throw new Error('Paste your JSON plan first.');
              plan = this.parser.fromText(value.json);
              return true;
            } catch (error) {
              void this.showToast(this.errorMessage(error), 'danger');
              return false;
            }
          }
        }
      ]
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role === 'confirm' && plan) await this.reviewPlan(plan);
  }

  async selectFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const plan = await this.parser.fromFile(file);
      await new Promise<void>(resolve => window.setTimeout(resolve, 180));
      await this.reviewPlan(plan);
    } catch (error) {
      await this.showToast(this.errorMessage(error), 'danger');
    } finally {
      input.value = '';
    }
  }

  async copyPrompt(projectDescription = ''): Promise<void> {
    const prompt = projectPlanPrompt(this.settings.settings().firstName, projectDescription);
    try {
      await navigator.clipboard.writeText(prompt);
      await this.showToast(projectDescription ? 'Your planning prompt is ready. Paste it into any LLM.' : 'Planning prompt copied. Add your project description, then return with its JSON response.');
    } catch {
      const alert = await this.alerts.create({
        header: 'ChatGPT project-plan prompt',
        message: 'Clipboard access is unavailable. Select and copy the prompt below.',
        inputs: [{ type: 'textarea', value: prompt }],
        buttons: ['Done']
      });
      await alert.present();
    }
  }

  closeReview(): void {
    this.reviewOpen.set(false);
    this.pendingReview.set(null);
  }

  addReviewedSteps(): void {
    const review = this.pendingReview();
    if (!review) return;
    this.projects.appendPlanTasks(review.projectId, review.plan.tasks);
    this.closeReview();
    this.imported.emit({ projectId: review.projectId, taskCount: review.plan.tasks.length });
    void this.showToast(`${review.plan.tasks.length} generated steps added.`);
  }

  replaceWithReviewedPlan(): void {
    const review = this.pendingReview();
    if (!review) return;
    this.projects.replaceProjectFromPlan(review.projectId, review.plan);
    this.closeReview();
    this.imported.emit({ projectId: review.projectId, taskCount: review.plan.tasks.length });
    void this.showToast('The edited plan is now in place.', undefined, review.projectId);
  }

  private async showToast(message: string, color?: 'danger', undoProjectId?: string): Promise<void> {
    const toast = await this.toasts.create({
      message,
      duration: undoProjectId ? 6500 : 3200,
      position: 'bottom',
      color,
      buttons: undoProjectId ? [{ text: 'Undo', handler: () => {
        if (this.projects.undoProjectPlanReplacement(undoProjectId)) void this.showToast('Plan replacement undone.');
      } }] : undefined
    });
    await toast.present();
  }

  private async reviewPlan(plan: ProjectPlan): Promise<void> {
    const existingId = this.existingProjectId();
    if (existingId) {
      const project = this.projects.projectById(existingId);
      if (!project) {
        await this.showToast('The project could not be found.', 'danger');
        return;
      }
      this.pendingReview.set({ projectId: existingId, plan, diff: this.planDiff.compare(project, plan) });
      this.reviewOpen.set(true);
      return;
    }
    const alert = await this.alerts.create({
      header: `Import “${plan.title}”?`,
      message: `This will create one project with ${plan.tasks.length} ${plan.tasks.length === 1 ? 'step' : 'steps'}.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Create project', handler: () => {
          const project = this.projects.createProjectFromPlan(plan);
          this.imported.emit({ projectId: project.id, taskCount: plan.tasks.length });
          void this.showToast(`“${plan.title}” is ready.`);
        } }
      ]
    });
    await alert.present();
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'This plan could not be imported.';
  }
}
