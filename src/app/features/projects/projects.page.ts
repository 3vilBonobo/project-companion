import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from "@angular/core";
import { Router } from "@angular/router";
import {
  ActionSheetController,
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonModal,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { add, albumsOutline, brushOutline, chevronDown, clipboardOutline, cloudUploadOutline, codeSlashOutline, copyOutline, heartOutline, homeOutline, mapOutline, schoolOutline, sparklesOutline, trophyOutline } from "ionicons/icons";
import { CompanionProgressService } from "../../core/services/companion-progress.service";
import { ProjectService } from "../../core/services/project.service";
import { ProjectStarterTemplate, ProjectTemplateService } from "../../core/services/project-template.service";
import { AppTabsComponent } from "../../shared/components/app-tabs/app-tabs.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { PlanImportComponent, PlanImportResult } from "../../shared/components/plan-import/plan-import.component";
import { ProjectCardComponent } from "../../shared/components/project-card/project-card.component";

@Component({
  selector: "app-projects",
  standalone: true,
  imports: [
    IonContent,
    IonFooter,
    IonButton,
    IonButtons,
    IonIcon,
    IonHeader,
    IonModal,
    IonTextarea,
    IonTitle,
    IonToolbar,
    AppTabsComponent,
    ProjectCardComponent,
    EmptyStateComponent,
    PlanImportComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "ion-page" },
  templateUrl: "./projects.page.html",
  styleUrl: "./projects.page.scss",
})
export class ProjectsPage {
  readonly projects = inject(ProjectService);
  readonly companion = inject(CompanionProgressService);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertController);
  private readonly actions = inject(ActionSheetController);
  private readonly planImport = viewChild.required(PlanImportComponent);
  readonly templateCatalog = inject(ProjectTemplateService);
  readonly templatePickerOpen = signal(false);
  readonly aiIdea = signal("");

  constructor() {
    addIcons({ add, albumsOutline, brushOutline, chevronDown, clipboardOutline, cloudUploadOutline, codeSlashOutline, copyOutline, heartOutline, homeOutline, mapOutline, schoolOutline, sparklesOutline, trophyOutline });
  }

  open(id: string): void {
    void this.router.navigate(["/projects", id]);
  }
  openImported(result: PlanImportResult): void {
    this.open(result.projectId);
  }

  async copyAiPrompt(): Promise<void> {
    await this.planImport().copyPrompt(this.aiIdea());
  }

  pasteAiPlan(): void { void this.planImport().openPasteDialog(); }

  async chooseProjectStart(): Promise<void> {
    const sheet = await this.actions.create({
      cssClass: "project-start-sheet",
      header: "How would you like to begin?",
      subHeader: "Choose one gentle way to start.",
      buttons: [
        { text: "Choose a starter template", icon: "albums-outline", role: "template" },
        { text: "Create manually", icon: "add", role: "manual" },
        { text: "Upload a JSON file", icon: "cloud-upload-outline", role: "upload" },
        { text: "Paste JSON", icon: "clipboard-outline", role: "paste" },
        { text: "Copy the ChatGPT prompt", icon: "copy-outline", role: "prompt" },
        { text: "Cancel", role: "cancel" },
      ],
    });
    await sheet.present();
    const { role } = await sheet.onDidDismiss();
    if (role === "template") this.templatePickerOpen.set(true);
    if (role === "manual") await this.createManually();
    if (role === "upload") this.planImport().openFilePicker();
    if (role === "paste") await this.planImport().openPasteDialog();
    if (role === "prompt") await this.planImport().copyPrompt();
  }

  closeTemplatePicker(): void { this.templatePickerOpen.set(false); }

  useTemplate(template: ProjectStarterTemplate): void {
    const plan = this.templateCatalog.planFor(template.id);
    if (!plan) return;
    const project = this.projects.createProjectFromPlan(plan);
    this.closeTemplatePicker();
    this.open(project.id);
  }

  async confirmDelete(id: string, title: string): Promise<void> {
    const alert = await this.alerts.create({
      header: "Let this project go?",
      message: `“${title}” will be removed from this device.`,
      buttons: [
        { text: "Keep it", role: "cancel" },
        { text: "Delete", role: "destructive", handler: () => this.projects.deleteProject(id) },
      ],
    });
    await alert.present();
  }

  private async createManually(): Promise<void> {
    const alert = await this.alerts.create({
      header: "Start something meaningful",
      subHeader: "Just a name is enough for now.",
      inputs: [
        { name: "title", type: "text", placeholder: "Project name", attributes: { maxlength: 60 } },
        {
          name: "description",
          type: "textarea",
          placeholder: "A gentle description (optional)",
          attributes: { maxlength: 160 },
        },
      ],
      buttons: [
        { text: "Not now", role: "cancel" },
        {
          text: "Create",
          handler: (value: { title?: string; description?: string }) => {
            if (!value.title?.trim()) return false;
            const project = this.projects.createProject(value.title, value.description);
            this.open(project.id);
            return true;
          },
        },
      ],
    });
    await alert.present();
  }
}
