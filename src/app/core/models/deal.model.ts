export type DealStatus = 'OPEN' | 'WON' | 'LOST';

export interface DealFilters {
  pipeline_id?: string;
  stage_id?: string;
  status?: DealStatus;
}

export interface Deal {
  id: string;
  tenant_id: string;
  title: string;
  amount: number;
  currency: string;
  pipeline_id: string;
  stage_id: string;
  owner_id: string;
  status: DealStatus;
  account_id?: string | null;
  contact_id?: string | null;
  expected_close_date?: string | null;
  actual_close_date?: string | null;
  lost_reason?: string | null;
  custom_fields?: Record<string, any>;
}

export interface DealCreateRequest {
  title: string;
  amount: number;
  currency: string;
  pipeline_id: string;
  stage_id: string;
  owner_id: string;
  account_id?: string | null;
  contact_id?: string | null;
  expected_close_date?: string | null;
  custom_fields?: Record<string, any>;
}

export interface MoveDealStageRequest {
  new_stage_id: string;
}
