import type { Deal } from '@features/deals/domain/deal';
import {
  type DealStagePosition,
  findNextDealStage,
  type PipelineStages,
} from '@features/deals/domain/deal-stage.policy';
import type { DealStageRepository } from './deal-stage.repository';

export interface AdvanceDealCommand extends DealStagePosition {
  readonly dealId: string;
  readonly pipeline?: PipelineStages;
}

/** Coordina la regla de negocio y su persistencia sin conocer Angular ni HTTP. */
export class AdvanceDealUseCase {
  constructor(private readonly repository: DealStageRepository) {}

  async execute(command: AdvanceDealCommand): Promise<Deal | null> {
    const nextStage = findNextDealStage(command, command.pipeline);
    if (!nextStage) return null;

    return this.repository.moveStage(command.dealId, nextStage.id);
  }
}
