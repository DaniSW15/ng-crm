import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Deal,
  DealCreateRequest,
  DealFilters,
  DealUpdateRequest,
  MoveDealStageRequest,
  Pipeline,
} from '../../../core/models/deal.model';

@Service()
export class DealService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/deals`;
  private readonly pipelinesUrl = `${environment.apiUrl}/pipelines`;

  // 1. Embudos y etapas
  getPipelines(): Observable<Pipeline[]> {
    return this.http.get<Pipeline[]>(this.pipelinesUrl);
  }

  // 2. Listar oportunidades con filtros opcionales
  getDeals(filters?: DealFilters): Observable<Deal[]> {
    const params = this.buildParams(filters);
    return this.http.get<Deal[]>(this.baseUrl, { params });
  }

  // 3. Crear oportunidad
  createDeal(payload: DealCreateRequest): Observable<Deal> {
    return this.http.post<Deal>(this.baseUrl, payload);
  }

  // 4. Editar oportunidad
  updateDeal(dealId: string, payload: DealUpdateRequest): Observable<Deal> {
    return this.http.put<Deal>(`${this.baseUrl}/${dealId}`, payload);
  }

  // 5. Cambiar etapa en el embudo comercial (Kanban move)
  moveStage(dealId: string, newStageId: string): Observable<Deal> {
    const payload: MoveDealStageRequest = { new_stage_id: newStageId };
    return this.http.post<Deal>(`${this.baseUrl}/${dealId}/move-stage`, payload);
  }

  // 6. Eliminar oportunidad (Solo ADMIN y DEV)
  deleteDeal(dealId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${dealId}`);
  }

  private buildParams(filters?: DealFilters): HttpParams {
    let params = new HttpParams();
    if (!filters) return params;

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return params;
  }
}

