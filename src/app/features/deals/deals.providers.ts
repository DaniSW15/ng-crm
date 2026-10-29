import { inject, InjectionToken } from '@angular/core';
import { AdvanceDealUseCase } from './application/advance-deal.use-case';
import { HttpDealStageRepository } from './infrastructure/http-deal-stage.repository';

/** Angular ensambla el caso de uso puro y su implementación de acceso a datos. */
export const ADVANCE_DEAL_USE_CASE = new InjectionToken<AdvanceDealUseCase>('AdvanceDealUseCase', {
  providedIn: 'root',
  factory: () => new AdvanceDealUseCase(inject(HttpDealStageRepository)),
});
