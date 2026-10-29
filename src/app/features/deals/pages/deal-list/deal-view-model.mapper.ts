import type { Deal as DealViewModel } from '../../../../core/models/deal.model';
import type { Deal } from '../../domain/deal';

/** Adapta el resultado del caso de uso al formato que utiliza la tabla existente. */
export function dealToViewModel(deal: Deal): DealViewModel {
  return {
    id: deal.id,
    tenant_id: deal.tenantId,
    title: deal.title,
    amount: deal.amount,
    currency: deal.currency,
    pipeline_id: deal.pipelineId,
    stage_id: deal.stageId,
    owner_id: deal.ownerId,
    status: deal.status,
    account_id: deal.accountId,
    contact_id: deal.contactId,
    expected_close_date: deal.expectedCloseDate,
    actual_close_date: deal.actualCloseDate,
    lost_reason: deal.lostReason,
    custom_fields: deal.customFields,
  };
}
