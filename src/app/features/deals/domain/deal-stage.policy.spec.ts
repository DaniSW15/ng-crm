import { describe, expect, it } from 'vitest';
import { DealStagePosition, findNextDealStage, PipelineStages } from './deal-stage.policy';

describe('Regla de negocio: avanzar una oportunidad', () => {
  const openDeal: DealStagePosition = {
    pipelineId: 'ventas',
    stageId: 'prospeccion',
    status: 'OPEN',
  };

  const pipeline: PipelineStages = {
    id: 'ventas',
    stages: [
      { id: 'cierre', order: 12 },
      { id: 'prospeccion', order: 1 },
      { id: 'negociacion', order: 5 },
    ],
  };

  it('elige negociación aunque las etapas lleguen desordenadas y los órdenes tengan saltos', () => {
    expect(findNextDealStage(openDeal, pipeline)?.id).toBe('negociacion');
  });

  it('permite avanzar desde negociación hacia cierre', () => {
    expect(findNextDealStage({ ...openDeal, stageId: 'negociacion' }, pipeline)?.id).toBe('cierre');
  });

  it.each(['WON', 'LOST'] as const)('no propone avanzar una oportunidad %s', (status) => {
    expect(findNextDealStage({ ...openDeal, status }, pipeline)).toBeNull();
  });

  it('no propone avanzar cuando la oportunidad está en la última etapa', () => {
    expect(findNextDealStage({ ...openDeal, stageId: 'cierre' }, pipeline)).toBeNull();
  });

  it('no propone avanzar cuando falta el embudo', () => {
    expect(findNextDealStage(openDeal, undefined)).toBeNull();
  });

  it('no utiliza las etapas de otro embudo como respaldo', () => {
    expect(findNextDealStage(openDeal, { ...pipeline, id: 'otro-embudo' })).toBeNull();
  });

  it('no propone avanzar si la etapa actual no pertenece al embudo', () => {
    expect(findNextDealStage({ ...openDeal, stageId: 'desconocida' }, pipeline)).toBeNull();
  });

  it('no propone avanzar en un embudo vacío', () => {
    expect(findNextDealStage(openDeal, { ...pipeline, stages: [] })).toBeNull();
  });

  it('respeta los datos originales, incluso cuando son inmutables', () => {
    const stages = Object.freeze(pipeline.stages.map((stage) => Object.freeze({ ...stage })));
    const immutablePipeline = Object.freeze({ id: pipeline.id, stages });
    expect(findNextDealStage(Object.freeze({ ...openDeal }), immutablePipeline)?.id).toBe(
      'negociacion',
    );
    expect(immutablePipeline.stages.map((stage) => stage.id)).toEqual([
      'cierre',
      'prospeccion',
      'negociacion',
    ]);
  });
});
