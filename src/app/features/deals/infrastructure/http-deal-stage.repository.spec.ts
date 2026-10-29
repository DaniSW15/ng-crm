import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import type { DealApiResponse } from './deal-api.mapper';
import { HttpDealStageRepository } from './http-deal-stage.repository';

describe('HttpDealStageRepository', () => {
  let repository: HttpDealStageRepository;
  let http: HttpTestingController;

  const response: DealApiResponse = {
    id: 'deal',
    tenant_id: 'tenant',
    title: 'Título confirmado por el servidor',
    amount: '15000.00',
    currency: 'MXN',
    pipeline_id: 'pipeline',
    stage_id: 'cierre',
    owner_id: 'owner',
    status: 'WON',
    account_id: null,
    contact_id: 'contact',
    expected_close_date: '2026-12-31',
    actual_close_date: '2026-12-20',
    lost_reason: null,
    custom_fields: { origen: 'referido' },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    repository = TestBed.inject(HttpDealStageRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envía el contrato HTTP y adapta toda la oportunidad al modelo de dominio', async () => {
    const result = repository.moveStage('deal', 'cierre');
    const request = http.expectOne(`${environment.apiUrl}/deals/deal/move-stage`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ new_stage_id: 'cierre' });
    request.flush(response);

    await expect(result).resolves.toEqual({
      id: 'deal',
      tenantId: 'tenant',
      title: 'Título confirmado por el servidor',
      amount: '15000.00',
      currency: 'MXN',
      pipelineId: 'pipeline',
      stageId: 'cierre',
      ownerId: 'owner',
      status: 'WON',
      accountId: null,
      contactId: 'contact',
      expectedCloseDate: '2026-12-31',
      actualCloseDate: '2026-12-20',
      lostReason: null,
      customFields: { origen: 'referido' },
    });
  });

  it('normaliza importes numéricos de respuestas anteriores sin cambiar el contrato del dominio', async () => {
    const result = repository.moveStage('deal', 'cierre');
    http
      .expectOne(`${environment.apiUrl}/deals/deal/move-stage`)
      .flush({ ...response, amount: 15000 });
    expect((await result).amount).toBe('15000');
  });

  it('conserva exactamente el texto decimal recibido', async () => {
    const result = repository.moveStage('deal', 'cierre');
    const amount = '12345678901234567890.01';
    http.expectOne(`${environment.apiUrl}/deals/deal/move-stage`).flush({ ...response, amount });
    expect((await result).amount).toBe(amount);
  });

  it('propaga los errores del backend al caso de uso', async () => {
    const result = repository.moveStage('deal', 'cierre');
    http
      .expectOne(`${environment.apiUrl}/deals/deal/move-stage`)
      .flush({ detail: 'Movimiento rechazado' }, { status: 400, statusText: 'Bad Request' });
    await expect(result).rejects.toMatchObject({
      status: 400,
      error: { detail: 'Movimiento rechazado' },
    });
  });
});
