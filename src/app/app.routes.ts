import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@core/auth/auth-guard';

export const routes: Routes = [
  // Rutas públicas (Autenticación)
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () =>
      import('@features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // Rutas protegidas (CRM)
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@app/layout/components/main-layout.component/main-layout.component').then(
        m => m.MainLayoutComponent
      ),
    children: [
      {
        path: 'deals',
        loadChildren: () =>
          import('@features/deals/deals.routes').then(m => m.DEAL_ROUTES)
      },
      {
        path: '',
        redirectTo: 'deals',
        pathMatch: 'full'
      }
    ]
  },

  // Redirección para URLs desconocidas (404)
  {
    path: '**',
    redirectTo: 'deals'
  }
];
