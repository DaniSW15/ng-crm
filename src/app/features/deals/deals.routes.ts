import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/auth/permission.guard';

export const DEAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/deal-list/deal-list').then(m => m.DealList)
  },
  {
    path: 'new',
    canActivate: [permissionGuard('deals:create')],
    loadComponent: () =>
      import('./pages/deal-create/deal-create').then(m => m.DealCreate)
  }
];
