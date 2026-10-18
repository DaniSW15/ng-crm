import { Routes } from '@angular/router';

export const DEAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/deal-list/deal-list').then(m => m.DealList)
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/deal-create/deal-create').then(m => m.DealCreate)
  }
];
