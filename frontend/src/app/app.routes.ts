import { Routes } from '@angular/router';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'cadastro',
    loadComponent: () => import('./features/auth/cadastro/cadastro.component').then((m) => m.CadastroComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'esqueci-senha',
    loadComponent: () => import('./features/auth/esqueci-senha/esqueci-senha.component').then((m) => m.EsqueciSenhaComponent),
  },
  {
    path: 'termos',
    loadComponent: () => import('./features/auth/termos/termos.component').then((m) => m.TermosComponent),
  },
  {
    path: 'confirmar-email',
    loadComponent: () => import('./features/auth/confirmar-email/confirmar-email.component').then((m) => m.ConfirmarEmailComponent),
  },
  {
    path: 'redefinir-senha',
    loadComponent: () => import('./features/auth/redefinir-senha/redefinir-senha.component').then((m) => m.RedefinirSenhaComponent),
  },
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
];
