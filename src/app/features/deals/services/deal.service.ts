import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Deal, DealCreateRequest, DealFilters, MoveDealStageRequest } from '../../../core/models/deal.model';

@Service()
export class DealService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/deals`;

  // Listar oportunidades con filtros opcionales
  getDeals(filters?: DealFilters): Observable<Deal[]> {
    const params = this.buildParams(filters);
    return this.http.get<Deal[]>(this.baseUrl, { params });
  }

  // Crear oportunidad
  createDeal(payload: DealCreateRequest): Observable<Deal> {
    return this.http.post<Deal>(this.baseUrl, payload);
  }

  // Cambiar etapa en el embudo comercial (Kanban move)
  moveStage(dealId: string, newStageId: string): Observable<Deal> {
    const payload: MoveDealStageRequest = { new_stage_id: newStageId };
    return this.http.post<Deal>(`${this.baseUrl}/${dealId}/move-stage`, payload);
  }

  private buildParams(filters?: DealFilters): HttpParams {
    let params = new HttpParams();
    if (!filters) return params;

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value);
      }
    });

    return params;
  }
}
