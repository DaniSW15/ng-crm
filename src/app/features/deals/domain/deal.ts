import type { DealStagePosition } from './deal-stage.policy';

/**
 * La oportunidad que recibe el caso de uso después de guardar un avance.
 * Los importes se conservan como texto decimal, sin perder precisión al leer la API.
 */
export interface Deal extends DealStagePosition {
  readonly id: string;
  readonly tenantId: string;
  readonly title: string;
  readonly amount: string;
  readonly currency: string;
  readonly ownerId: string;
  readonly accountId?: string | null;
  readonly contactId?: string | null;
  readonly expectedCloseDate?: string | null;
  readonly actualCloseDate?: string | null;
  readonly lostReason?: string | null;
  readonly customFields?: Readonly<Record<string, unknown>>;
}
