import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { DealStageRepository } from '../application/deal-stage.repository';
import type { Deal } from '../domain/deal';
import { DealService } from '../services/deal.service';
import { dealFromApi } from './deal-api.mapper';

/** Implementa el contrato de aplicación reutilizando el cliente HTTP del proyecto. */
@Service()
export class HttpDealStageRepository implements DealStageRepository {
  private readonly api = inject(DealService);

  async moveStage(dealId: string, newStageId: string): Promise<Deal> {
    const response = await firstValueFrom(this.api.moveStage(dealId, newStageId));
    return dealFromApi(response);
  }
}
