import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DealList } from './deal-list';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { DealService } from '@features/deals/services/deal.service';
import { PermissionService } from '@core/auth/permission.service';
import { Deal, Pipeline, Stage } from '@core/models/deal.model';

describe('DealList', () => {
  let component: DealList;
  let fixture: ComponentFixture<DealList>;
  const getDeals = vi.fn();
  const getPipelines = vi.fn();
  const moveStage = vi.fn();
  const hasPermission = vi.fn();
  const deal: Deal = {
    id: 'deal',
    tenant_id: 'tenant',
    title: 'Implementación México',
    amount: 100,
    currency: 'MXN',
    pipeline_id: 'pipeline',
    stage_id: 'first',
    owner_id: 'user',
    status: 'OPEN',
  };

  beforeEach(async () => {
    getDeals.mockReset().mockReturnValue(of([]));
    getPipelines.mockReset().mockReturnValue(of([]));
    moveStage.mockReset();
    hasPermission.mockReset().mockReturnValue(true);
    await TestBed.configureTestingModule({
      imports: [DealList],
      providers: [
        provideRouter([]),
        { provide: DealService, useValue: { getDeals, getPipelines, moveStage } },
        { provide: PermissionService, useValue: { hasPermission } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DealList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('no presenta una lista vacía cuando falló la carga y permite reintentar', async () => {
    getDeals.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 503 })));
    component.fetchData();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Aquí empieza tu próxima venta');
    expect(fixture.nativeElement.querySelector('app-deal-table')).toBeNull();

    getDeals.mockReturnValueOnce(of([deal]));
    fixture.nativeElement.querySelector('[role="alert"] button').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('table').textContent).toContain(deal.title);
  });

  it('combina búsqueda sin acentos con el filtro de estado', async () => {
    component.deals.set([deal, { ...deal, id: 'won', status: 'WON' }]);
    fixture.componentRef.setInput('status', 'OPEN');
    await fixture.whenStable();
    const search = fixture.nativeElement.querySelector('#deal-search') as HTMLInputElement;
    search.value = 'mexico';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
    search.value = 'sin coincidencias';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('No encontramos coincidencias');
  });

  it('avanza por orden aunque existan saltos y evita envíos duplicados', async () => {
    component.deals.set([deal]);
    component.pipelines.set([
      {
        id: 'pipeline',
        stages: [
          { id: 'second', order: 5 },
          { id: 'first', order: 1 },
        ] as Stage[],
      } as Pipeline,
    ]);
    const pending = new Subject<Deal>();
    moveStage.mockReturnValue(pending);
    const moving = component.onMoveToNextStage(deal);
    await component.onMoveToNextStage(deal);
    expect(moveStage).toHaveBeenCalledExactlyOnceWith('deal', 'second');
    pending.error(new HttpErrorResponse({ status: 503 }));
    await moving;
    expect(component.pendingIds().size).toBe(0);
    expect(component.actionMessage()?.error).toBe(true);
  });

  it('muestra la respuesta completa del servidor y libera el estado de envío', async () => {
    component.deals.set([deal]);
    component.pipelines.set([
      {
        id: 'pipeline',
        stages: [
          { id: 'first', order: 1 },
          { id: 'second', order: 5 },
        ] as Stage[],
      } as Pipeline,
    ]);
    moveStage.mockReturnValue(
      of({
        ...deal,
        title: 'Título confirmado por el servidor',
        amount: '15000.00',
        stage_id: 'second',
        status: 'WON',
        actual_close_date: '2026-12-20',
        custom_fields: { origen: 'referido' },
      }),
    );

    await component.onMoveToNextStage(deal);
    await fixture.whenStable();
    expect(component.pendingIds().size).toBe(0);
    expect(component.deals()[0]).toMatchObject({
      title: 'Título confirmado por el servidor',
      amount: '15000.00',
      stage_id: 'second',
      status: 'WON',
      actual_close_date: '2026-12-20',
      custom_fields: { origen: 'referido' },
    });
    expect(component.actionMessage()?.error).toBe(false);
    expect(fixture.nativeElement.querySelector('table').textContent).toContain(
      'Título confirmado por el servidor',
    );
  });

  it('no guarda movimientos cuando el usuario no tiene permiso', async () => {
    hasPermission.mockReturnValue(false);
    await component.onMoveToNextStage(deal);
    expect(moveStage).not.toHaveBeenCalled();
    expect(component.pendingIds().size).toBe(0);
  });
});
