import type { Deal } from '../domain/deal';

/** Formato de respuesta del backend; queda fuera del dominio y del caso de uso. */
export interface DealApiResponse {
  id: string;
  tenant_id: string;
  title: string;
  amount: string | number;
  currency: string;
  pipeline_id: string;
  stage_id: string;
  owner_id: string;
  status: 'OPEN' | 'WON' | 'LOST';
  account_id?: string | null;
  contact_id?: string | null;
  expected_close_date?: string | null;
  actual_close_date?: string | null;
  lost_reason?: string | null;
  custom_fields?: Record<string, unknown>;
}

export function dealFromApi(dto: DealApiResponse): Deal {
  return {
    id: dto.id,
    tenantId: dto.tenant_id,
    title: dto.title,
    amount: String(dto.amount),
    currency: dto.currency,
    pipelineId: dto.pipeline_id,
    stageId: dto.stage_id,
    ownerId: dto.owner_id,
    status: dto.status,
    accountId: dto.account_id,
    contactId: dto.contact_id,
    expectedCloseDate: dto.expected_close_date,
    actualCloseDate: dto.actual_close_date,
    lostReason: dto.lost_reason,
    customFields: dto.custom_fields,
  };
}
