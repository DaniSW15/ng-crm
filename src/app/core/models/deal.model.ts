export type DealStatus = 'OPEN' | 'WON' | 'LOST';

export interface Stage {
  id: string;
  pipeline_id: string;
  name: string;
  order: number;
  win_probability: number;
  days_until_stale: number;
  is_won_stage: boolean;
  is_lost_stage: boolean;
}

export interface Pipeline {
  id: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
  stages: Stage[];
}

export interface DealFilters {
  pipeline_id?: string;
  stage_id?: string;
  status?: DealStatus;
  limit?: number;
  offset?: number;
}

export interface Deal {
  id: string;
  tenant_id: string;
  title: string;
  amount: string | number;
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

export interface DealUpdateRequest {
  title?: string;
  amount?: number;
  currency?: string;
  expected_close_date?: string | null;
  pipeline_id?: string;
  stage_id?: string;
  status?: DealStatus;
  lost_reason?: string | null;
}
