import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'today', pathMatch: 'full' },
  { path: 'today', loadComponent: () => import('./features/today/today.page').then(m => m.TodayPage), title: 'Today · Project Companion' },
  { path: 'projects', loadComponent: () => import('./features/projects/projects.page').then(m => m.ProjectsPage), title: 'Projects · Project Companion' },
  { path: 'projects/:id', loadComponent: () => import('./features/projects/project-detail.page').then(m => m.ProjectDetailPage), title: 'Project · Project Companion' },
  { path: 'settings', loadComponent: () => import('./features/settings/settings.page').then(m => m.SettingsPage), title: 'Settings · Project Companion' },
  { path: 'help', loadComponent: () => import('./features/help/help.page').then(m => m.HelpPage), title: 'Help · Project Companion' },
  { path: '**', redirectTo: 'today' }
];
