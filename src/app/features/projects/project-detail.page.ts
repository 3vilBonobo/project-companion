import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from "@angular/core";
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import {
  ActionSheetController,
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonReorder,
  IonReorderGroup,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ToastController,
} from "@ionic/angular/standalone";
import type { ItemReorderEventDetail } from "@ionic/core";
import { addIcons } from "ionicons";
import {
  add,
  arrowBack,
  arrowDown,
  arrowUp,
  checkmarkCircle,
  createOutline,
  downloadOutline,
  ellipsisHorizontal,
  ellipseOutline,
  trashOutline,
} from "ionicons/icons";
import { Task, TaskDifficulty } from "../../core/models/project.models";
import { ProgressService } from "../../core/services/progress.service";
import { ProjectPlanExportService } from "../../core/services/project-plan-export.service";
import { ProjectService } from "../../core/services/project.service";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { AppTabsComponent } from "../../shared/components/app-tabs/app-tabs.component";
import { ProgressCircleComponent } from "../../shared/components/progress-circle/progress-circle.component";
import { PlanImportComponent } from "../../shared/components/plan-import/plan-import.component";

interface TaskCategoryGroup {
  category: string;
  tasks: Task[];
  completed: number;
  total: number;
  percentage: number;
}

@Component({
  selector: "app-project-detail",
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonFooter,
    IonButton,
    IonIcon,
    IonInput,
    IonModal,
    IonReorder,
    IonReorderGroup,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    ProgressCircleComponent,
    EmptyStateComponent,
    PlanImportComponent,
    AppTabsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "ion-page" },
  templateUrl: "./project-detail.page.html",
  styleUrl: "./project-detail.page.scss",
})
export class ProjectDetailPage {
  readonly id = input("");
  readonly projects = inject(ProjectService);
  private readonly progressService = inject(ProgressService);
  private readonly alerts = inject(AlertController);
  private readonly actions = inject(ActionSheetController);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly planExport = inject(ProjectPlanExportService);
  private readonly toasts = inject(ToastController);

  readonly taskEditorOpen = signal(false);
  readonly editingTask = signal<Task | null>(null);
  readonly taskForm = this.formBuilder.group({
    title: ["", [Validators.required, Validators.maxLength(80)]],
    category: ["", Validators.maxLength(40)],
    description: ["", Validators.maxLength(240)],
    estimatedMinutes: [15, [Validators.required, Validators.min(5), Validators.max(180)]],
    difficulty: ["gentle" as TaskDifficulty, Validators.required],
    notes: ["", Validators.maxLength(500)],
  });

  readonly project = computed(() => this.projects.projectById(this.id()));
  readonly progress = computed(() => {
    const project = this.project();
    return project ? this.progressService.forProject(project) : { completed: 0, total: 0, percentage: 0 };
  });
  readonly hasTaskCategories = computed(
    () => this.project()?.tasks.some((task) => Boolean(task.category?.trim())) ?? false,
  );
  readonly taskGroups = computed<TaskCategoryGroup[]>(() => {
    const project = this.project();
    if (!project) return [];
    const fallback = this.hasTaskCategories() ? "Other steps" : "Plan";
    const grouped = new Map<string, Task[]>();
    for (const task of [...project.tasks].sort((first, second) => first.order - second.order)) {
      const category = task.category?.trim() || fallback;
      grouped.set(category, [...(grouped.get(category) ?? []), task]);
    }
    return [...grouped].map(([category, tasks]) => {
      const completed = tasks.filter((task) => task.completed).length;
      return {
        category,
        tasks,
        completed,
        total: tasks.length,
        percentage: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
      };
    });
  });

  constructor() {
    addIcons({
      add,
      arrowBack,
      arrowDown,
      arrowUp,
      checkmarkCircle,
      createOutline,
      downloadOutline,
      ellipsisHorizontal,
      ellipseOutline,
      trashOutline,
    });
  }

  exportProjectPlan(): void {
    const project = this.project();
    if (!project) return;
    this.planExport.download(project);
    void this.showToast("JSON plan downloaded. Give it to your LLM, then import the edited version here.");
  }

  async editProject(): Promise<void> {
    const project = this.project();
    if (!project) return;
    const alert = await this.alerts.create({
      header: "Edit project",
      inputs: [
        {
          name: "title",
          type: "text",
          value: project.title,
          placeholder: "Project name",
          attributes: { maxlength: 60 },
        },
        {
          name: "description",
          type: "textarea",
          value: project.description,
          placeholder: "What makes this meaningful?",
          attributes: { maxlength: 240 },
        },
      ],
      buttons: [
        { text: "Cancel", role: "cancel" },
        {
          text: "Save",
          handler: (value: { title?: string; description?: string }) => {
            if (!value.title?.trim()) return false;
            this.projects.updateProjectDetails(project.id, {
              title: value.title,
              description: value.description ?? "",
            });
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  addTask(): void {
    this.editingTask.set(null);
    this.taskForm.reset({
      title: "",
      category: "",
      description: "",
      estimatedMinutes: 15,
      difficulty: "gentle",
      notes: "",
    });
    this.taskEditorOpen.set(true);
  }

  editTask(task: Task): void {
    this.editingTask.set(task);
    this.taskForm.reset({
      title: task.title,
      category: task.category ?? "",
      description: task.description,
      estimatedMinutes: task.estimatedMinutes,
      difficulty: task.difficulty,
      notes: task.notes,
    });
    this.taskEditorOpen.set(true);
  }

  closeTaskEditor(): void {
    this.taskEditorOpen.set(false);
  }

  saveTask(): void {
    const project = this.project();
    if (!project || this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }
    const value = this.taskForm.getRawValue();
    const task = this.editingTask();
    if (task) this.projects.updateTask(project.id, task.id, value);
    else this.projects.addTask(project.id, value);
    this.closeTaskEditor();
  }

  reorderTasks(event: CustomEvent<ItemReorderEventDetail>, phaseTasks: Task[]): void {
    const { from, to } = event.detail;
    if (from !== to) {
      const tasks = [...phaseTasks];
      const [movedTask] = tasks.splice(from, 1);
      tasks.splice(to, 0, movedTask);
      this.projects.reorderTasks(
        this.id(),
        tasks.map((task) => task.id),
      );
    }
    event.detail.complete(false);
  }

  async openTaskActions(task: Task): Promise<void> {
    const sheet = await this.actions.create({
      header: task.title,
      buttons: [
        {
          text: task.completed ? "Mark as not complete" : "Mark as complete",
          icon: task.completed ? "ellipse-outline" : "checkmark-circle",
          handler: () => this.projects.toggleTask(this.id(), task.id),
        },
        { text: "Edit step", icon: "create-outline", handler: () => this.editTask(task) },
        {
          text: task.category ? "Move earlier in phase" : "Move earlier",
          icon: "arrow-up",
          handler: () => this.projects.moveTask(this.id(), task.id, -1),
        },
        {
          text: task.category ? "Move later in phase" : "Move later",
          icon: "arrow-down",
          handler: () => this.projects.moveTask(this.id(), task.id, 1),
        },
        {
          text: "Delete step",
          icon: "trash-outline",
          role: "destructive",
          handler: () => void this.confirmDeleteTask(task),
        },
        { text: "Cancel", role: "cancel" },
      ],
    });
    await sheet.present();
  }

  async deleteProject(): Promise<void> {
    const project = this.project();
    if (!project) return;
    const alert = await this.alerts.create({
      header: "Let this project go?",
      message: `“${project.title}” and all of its steps will be removed from this device.`,
      buttons: [
        { text: "Keep it", role: "cancel" },
        {
          text: "Delete project",
          role: "destructive",
          handler: () => {
            this.projects.deleteProject(project.id);
            void this.router.navigate(["/projects"]);
          },
        },
      ],
    });
    await alert.present();
  }

  private async confirmDeleteTask(task: Task): Promise<void> {
    const alert = await this.alerts.create({
      header: "Remove this step?",
      message: `“${task.title}” will be removed from the plan.`,
      buttons: [
        { text: "Keep it", role: "cancel" },
        { text: "Remove", role: "destructive", handler: () => this.projects.deleteTask(this.id(), task.id) },
      ],
    });
    await alert.present();
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toasts.create({ message, duration: 3400, position: "bottom" });
    await toast.present();
  }
}
