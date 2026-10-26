import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { form, FormField, FormRoot, min, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { DealService } from '../../services/deal.service';
import { AuthService } from '../../../../core/auth/auth-service';
import { DealCreateRequest, Pipeline } from '../../../../core/models/deal.model';

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

  protected readonly model = signal<DealFormModel>({
    title: '',
    amount: 0,
    currency: 'USD',
    pipeline_id: 'a0000000-0000-0000-0000-000000000001',
    stage_id: 'b0000000-0000-0000-0000-000000000001',
    owner_id: this.authService.currentUser()?.id ?? '00000000-0000-0000-0000-000000000002',
    expected_close_date: new Date().toISOString().split('T')[0],
  });

  // Etapas disponibles según el embudo seleccionado
  readonly availableStages = computed(() => {
    const selectedPipelineId = this.model().pipeline_id;
    const currentPipeline =
      this.pipelines().find((p) => p.id === selectedPipelineId) ?? this.pipelines()[0];
    return currentPipeline ? currentPipeline.stages : [];
  });

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
          } catch (error: any) {
            console.error('Error al crear oportunidad:', error);
            this.errorMessage.set(
              error.error?.detail || 'No se pudo crear la oportunidad. Verifica los datos.'
            );
          } finally {
            this.isSubmitting.set(false);
          }
        },
      },
    }
  );

  ngOnInit(): void {
    this.dealService.getPipelines().subscribe({
      next: (pipelines) => {
        this.pipelines.set(pipelines);
        if (pipelines.length > 0) {
          const firstPipeline = pipelines[0];
          const firstStage = firstPipeline.stages[0];

          this.model.update((m) => ({
            ...m,
            pipeline_id: firstPipeline.id,
            stage_id: firstStage ? firstStage.id : m.stage_id,
          }));
        }
      },
      error: (err) => {
        console.warn('No se pudieron precargar los embudos:', err);
      },
    });
  }

  onPipelineChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const pipelineId = select.value;
    const pipeline = this.pipelines().find((p) => p.id === pipelineId);
    const firstStage = pipeline?.stages[0];

    this.model.update((m) => ({
      ...m,
      pipeline_id: pipelineId,
      stage_id: firstStage ? firstStage.id : m.stage_id,
    }));
  }
}
