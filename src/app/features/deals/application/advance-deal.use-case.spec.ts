import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Deal } from '@features/deals/domain/deal';
import { AdvanceDealUseCase, type AdvanceDealCommand } from './advance-deal.use-case';
import type { DealStageRepository } from './deal-stage.repository';

describe('Caso de uso: avanzar una oportunidad', () => {
  const command: AdvanceDealCommand = {
    dealId: 'oportunidad-1',
    pipelineId: 'ventas',
    stageId: 'prospeccion',
    status: 'OPEN',
    pipeline: {
      id: 'ventas',
      stages: [
        { id: 'negociacion', order: 5 },
        { id: 'prospeccion', order: 1 },
      ],
    },
  };

  const savedDeal: Deal = {
    id: 'oportunidad-1',
    tenantId: 'empresa-1',
    title: 'Título actualizado por el servidor',
    amount: '15000.00',
    currency: 'MXN',
    pipelineId: 'ventas',
    stageId: 'negociacion',
    ownerId: 'usuario-1',
    status: 'OPEN',
    expectedCloseDate: '2026-12-31',
  };

  const moveStage = vi.fn<DealStageRepository['moveStage']>();
  let useCase: AdvanceDealUseCase;

  beforeEach(() => {
    moveStage.mockReset().mockResolvedValue(savedDeal);
    useCase = new AdvanceDealUseCase({ moveStage });
  });

  it('guarda la siguiente etapa y devuelve la oportunidad que confirmó el repositorio', async () => {
    const result = await useCase.execute(command);
    expect(moveStage).toHaveBeenCalledExactlyOnceWith('oportunidad-1', 'negociacion');
    expect(result).toBe(savedDeal);
  });

  it.each<Pick<AdvanceDealCommand, 'status' | 'stageId' | 'pipeline'>>([
    { status: 'WON', stageId: 'prospeccion', pipeline: command.pipeline },
    { status: 'LOST', stageId: 'prospeccion', pipeline: command.pipeline },
    { status: 'OPEN', stageId: 'negociacion', pipeline: command.pipeline },
    { status: 'OPEN', stageId: 'prospeccion', pipeline: undefined },
    { status: 'OPEN', stageId: 'desconocida', pipeline: command.pipeline },
  ])('evita guardar si no existe un avance válido: %j', async (position) => {
    expect(await useCase.execute({ ...command, ...position })).toBeNull();
    expect(moveStage).not.toHaveBeenCalled();
  });

  it('deja que la presentación reciba un fallo al guardar', async () => {
    const error = new Error('El repositorio no está disponible');
    moveStage.mockRejectedValue(error);
    await expect(useCase.execute(command)).rejects.toBe(error);
  });
});
