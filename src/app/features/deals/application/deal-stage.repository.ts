import type { Deal } from '@features/deals/domain/deal';

/** Contrato del caso de uso: guardar un cambio de etapa y devolver la oportunidad actualizada. */
export interface DealStageRepository {
  moveStage(dealId: string, newStageId: string): Promise<Deal>;
}
