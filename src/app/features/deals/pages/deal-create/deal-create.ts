import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { form, FormField, FormRoot, min, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { DealService } from '@features/deals/services/deal.service';
import { AuthService } from '@core/auth/auth-service';
import { DealCreateRequest, Pipeline } from '@core/models/deal.model';
import { apiErrorMessage } from '@core/utils/api-error-message';

export interface DealFormModel {
  title: string;
  amount: number;
  currency: string;
  pipeline_id: string;
  stage_id: string;
  owner_id: string;
  expected_close_date: string;
}

@Component({
  imports: [FormRoot, FormField, RouterLink],
  selector: 'app-deal-create',
  styleUrl: './deal-create.scss',
  templateUrl: './deal-create.html',
})
export class DealCreate implements OnInit {
  private readonly dealService = inject(DealService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly pipelines = signal<Pipeline[]>([]);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly loadingPipelines = signal(true);
  readonly pipelineError = signal<string | null>(null);

  protected readonly model = signal<DealFormModel>({
    title: '',
    amount: 0,
    currency: 'USD',
    pipeline_id: '',
    stage_id: '',
    owner_id: this.authService.currentUser()?.id ?? '',
    expected_close_date: '',
  });

  // Etapas disponibles según el embudo seleccionado
  readonly availableStages = computed(() => {
    const selectedPipelineId = this.model().pipeline_id;
    const currentPipeline = this.pipelines().find((p) => p.id === selectedPipelineId);
    return [...(currentPipeline?.stages ?? [])].sort((a, b) => a.order - b.order);
  });

  readonly canCreate = computed(
    () =>
      !this.loadingPipelines() &&
      !this.pipelineError() &&
      !!this.authService.currentUser()?.id &&
      this.availableStages().some((stage) => stage.id === this.model().stage_id),
  );

  protected readonly form = form(
    this.model,
    (s) => {
      required(s.title, { message: 'El título del trato es obligatorio' });
      required(s.amount, { message: 'El monto es obligatorio' });
      min(s.amount, 0, { message: 'El monto debe ser mayor o igual a cero' });
      required(s.currency, { message: 'La moneda es obligatoria' });
      required(s.pipeline_id, { message: 'El embudo es obligatorio' });
      required(s.stage_id, { message: 'La etapa es obligatoria' });
    },
    {
      submission: {
        action: async () => {
          if (!this.canCreate()) return;
          this.errorMessage.set(null);
          this.isSubmitting.set(true);

          try {
            const formValues = this.model();
            const payload: DealCreateRequest = {
              title: formValues.title,
              amount: Number(formValues.amount),
              currency: formValues.currency,
              pipeline_id: formValues.pipeline_id,
              stage_id: formValues.stage_id,
              owner_id: this.authService.currentUser()?.id ?? formValues.owner_id,
              expected_close_date: formValues.expected_close_date || null,
              account_id: null,
              contact_id: null,
              custom_fields: {},
            };

            await firstValueFrom(this.dealService.createDeal(payload));
            await this.router.navigate(['/deals']);
          } catch (error: unknown) {
            this.errorMessage.set(
              apiErrorMessage(error, 'No se pudo crear la oportunidad. Verifica los datos.'),
            );
          } finally {
            this.isSubmitting.set(false);
          }
        },
      },
    },
  );

  ngOnInit(): void {
    this.loadPipelines();
  }

  loadPipelines(): void {
    this.loadingPipelines.set(true);
    this.pipelineError.set(null);
    this.dealService.getPipelines().subscribe({
      next: (pipelines) => {
        const activePipelines = pipelines.filter((pipeline) => pipeline.is_active);
        this.pipelines.set(activePipelines);
        const selected =
          activePipelines.find((pipeline) => pipeline.id === this.model().pipeline_id) ??
          activePipelines.find((pipeline) => pipeline.is_default) ??
          activePipelines[0];
        const stages = [...(selected?.stages ?? [])].sort((a, b) => a.order - b.order);
        this.model.update((m) => ({
          ...m,
          pipeline_id: selected?.id ?? '',
          stage_id: stages.some((stage) => stage.id === m.stage_id)
            ? m.stage_id
            : (stages[0]?.id ?? ''),
        }));
        this.loadingPipelines.set(false);
      },
      error: (err) => {
        this.pipelineError.set(
          apiErrorMessage(err, 'No pudimos cargar los embudos de ventas. Intenta nuevamente.'),
        );
        this.loadingPipelines.set(false);
      },
    });
  }

  onPipelineChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const pipelineId = select.value;
    const pipeline = this.pipelines().find((p) => p.id === pipelineId);
    const firstStage = [...(pipeline?.stages ?? [])].sort((a, b) => a.order - b.order)[0];

    this.model.update((m) => ({
      ...m,
      pipeline_id: pipelineId,
      stage_id: firstStage?.id ?? '',
    }));
  }
}
