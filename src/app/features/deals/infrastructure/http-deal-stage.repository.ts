import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { DealStageRepository } from '@features/deals/application/deal-stage.repository';
import type { Deal } from '@features/deals/domain/deal';
import { DealService } from '@features/deals/services/deal.service';
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
