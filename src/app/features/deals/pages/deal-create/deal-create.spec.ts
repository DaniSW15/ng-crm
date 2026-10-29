import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DealCreate } from './deal-create';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { AuthService } from '@core/auth/auth-service';
import { DealService } from '@features/deals/services/deal.service';
import { Pipeline, Stage } from '@core/models/deal.model';

describe('DealCreate', () => {
  let component: DealCreate;
  let fixture: ComponentFixture<DealCreate>;
  const getPipelines = vi.fn();
  const createDeal = vi.fn();

  const stage = (id: string, order: number): Stage => ({
    id,
    order,
    pipeline_id: 'pipeline',
    name: id,
    win_probability: 25,
    days_until_stale: 10,
    is_won_stage: false,
    is_lost_stage: false,
  });
  const pipeline: Pipeline = {
    id: 'pipeline',
    name: 'Ventas',
    is_active: true,
    is_default: true,
    stages: [stage('negociacion', 4), stage('prospeccion', 1)],
  };

  beforeEach(async () => {
    getPipelines.mockReset().mockReturnValue(of([]));
    createDeal.mockReset();
    await TestBed.configureTestingModule({
      imports: [DealCreate],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { currentUser: signal({ id: 'user' }) } },
        { provide: DealService, useValue: { getPipelines, createDeal } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DealCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('bloquea la creación cuando no existen embudos y no inventa opciones', () => {
    expect(fixture.nativeElement.querySelector('[type="submit"]').disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('No hay embudos de ventas disponibles');
    const values = Array.from(
      fixture.nativeElement.querySelectorAll('#pipeline_id option, #stage_id option'),
    ).map((option: unknown) => (option as HTMLOptionElement).value);
    expect(values).toEqual(['', '']);
    expect(createDeal).not.toHaveBeenCalled();
  });

  it('permite reintentar después de fallar y selecciona la primera etapa según su orden', async () => {
    getPipelines.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 503 })));
    component.loadPipelines();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[type="submit"]').disabled).toBe(true);

    getPipelines.mockReturnValueOnce(of([pipeline]));
    fixture.nativeElement.querySelector('[role="alert"] button').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('#stage_id').value).toBe('prospeccion');
    expect(component.canCreate()).toBe(true);
  });

  it('bloquea el envío al cambiar a un embudo sin etapas', async () => {
    getPipelines.mockReturnValueOnce(of([pipeline, { ...pipeline, id: 'empty', stages: [] }]));
    component.loadPipelines();
    await fixture.whenStable();
    const select = fixture.nativeElement.querySelector('#pipeline_id') as HTMLSelectElement;
    select.value = 'empty';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#stage_id').value).toBe('');
    expect(fixture.nativeElement.querySelector('[type="submit"]').disabled).toBe(true);
  });
});
