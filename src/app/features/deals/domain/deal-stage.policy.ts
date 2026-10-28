/** Estado mínimo que necesita la regla; no depende del formato de la API. */
export interface DealStagePosition {
  readonly pipelineId: string;
  readonly stageId: string;
  readonly status: 'OPEN' | 'WON' | 'LOST';
}

export interface PipelineStage {
  readonly id: string;
  readonly order: number;
}

export interface PipelineStages {
  readonly id: string;
  readonly stages: readonly PipelineStage[];
}

/**
 * Regla de la acción «Avanzar» del CRM:
 * una oportunidad abierta avanza a la siguiente etapa de su propio embudo.
 * Si no hay una siguiente etapa válida, no se propone ningún movimiento.
 */
export function findNextDealStage(
  position: DealStagePosition,
  pipeline: PipelineStages | undefined,
): PipelineStage | null {
  if (position.status !== 'OPEN' || !pipeline || pipeline.id !== position.pipelineId) {
    return null;
  }

  // Una copia evita cambiar el orden de los datos que recibe la pantalla.
  const stages = [...pipeline.stages].sort((a, b) => a.order - b.order);
  const currentIndex = stages.findIndex((stage) => stage.id === position.stageId);
  if (currentIndex < 0) return null;

  return stages[currentIndex + 1] ?? null;
}
