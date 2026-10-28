import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DealService } from '../../services/deal.service';
import { Deal, Pipeline } from '../../../../core/models/deal.model';
import { PermissionService } from '../../../../core/auth/permission.service';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';
import { DealTable } from '../../components/deal-table/deal-table';
import { finalize } from 'rxjs';
import { apiErrorMessage } from '../../../../core/utils/api-error-message';
import { findNextDealStage } from '../../domain/deal-stage.policy';

@Component({
  imports: [RouterLink, HasPermissionDirective, DealTable],
  selector: 'app-deal-list',
  styleUrl: './deal-list.scss',
  templateUrl: './deal-list.html',
})
export class DealList implements OnInit {
  private readonly dealService = inject(DealService);
  readonly permissionService = inject(PermissionService);

  /**
   * Route Input (vinculado automáticamente vía withComponentInputBinding):
   * Permite filtrar oportunidades por URL ej. /deals?status=OPEN
   */
  readonly statusFilter = input<string | undefined>(undefined, { alias: 'status' });

  // Estados reactivos con Signals
  readonly deals = signal<Deal[]>([]);
  readonly pipelines = signal<Pipeline[]>([]);
  readonly loading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly pipelineError = signal(false);
  readonly search = signal('');
  readonly actionMessage = signal<{ text: string; error: boolean } | null>(null);
  readonly pendingIds = signal<ReadonlySet<string>>(new Set());
  readonly statusOptions = [
    { value: '', label: 'Todas' },
    { value: 'OPEN', label: 'Abiertas' },
    { value: 'WON', label: 'Ganadas' },
    { value: 'LOST', label: 'Perdidas' },
  ];

  readonly hasFilters = computed(() => !!this.statusFilter() || !!this.search().trim());

  // Angular adapta los datos de la API y consulta una regla TypeScript independiente.
  readonly nextStages = computed(() => {
    const map = new Map<string, string>();
    for (const deal of this.deals()) {
      const pipeline = this.pipelines().find((p) => p.id === deal.pipeline_id);
      const nextStage = findNextDealStage(
        { pipelineId: deal.pipeline_id, stageId: deal.stage_id, status: deal.status },
        pipeline,
      );
      if (nextStage) map.set(deal.id, nextStage.id);
    }
    return map;
  });

  // Mapeo reactivo de id de etapa -> nombre de etapa
  readonly stageNames = computed(() => {
    const map = new Map<string, string>();
    for (const pipeline of this.pipelines()) {
      for (const stage of pipeline.stages) {
        map.set(stage.id, stage.name);
      }
    }
    return map;
  });

  // Lista filtrada reactivamente si se pasa un queryParam ?status=...
  readonly filteredDeals = computed(() => {
    const filter = this.statusFilter();
    const query = this.normalize(this.search().trim());
    return this.deals().filter(
      (deal) =>
        (!filter || deal.status.toUpperCase() === filter.toUpperCase()) &&
        (!query || this.normalize(deal.title).includes(query)),
    );
  });

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.errorMessage.set(null);
    this.pipelineError.set(false);
    this.actionMessage.set(null);

    // 1. Cargar embudos/etapas
    this.dealService.getPipelines().subscribe({
      next: (pipelines) => {
        this.pipelines.set(pipelines);
      },
      error: () => {
        this.pipelines.set([]);
        this.pipelineError.set(true);
      },
    });

    // 2. Cargar oportunidades comerciales
    this.dealService.getDeals().subscribe({
      next: (data) => {
        this.deals.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          apiErrorMessage(err, 'No se pudieron cargar las oportunidades. Intenta nuevamente.'),
        );
        this.loading.set(false);
      },
    });
  }

  onMoveToNextStage(deal: Deal): void {
    if (!this.permissionService.hasPermission('deals:move_stage') || this.pendingIds().has(deal.id))
      return;
    const nextStageId = this.nextStages().get(deal.id);
    if (!nextStageId) return;
    this.setPending(deal.id, true);
    this.actionMessage.set(null);
    this.dealService
      .moveStage(deal.id, nextStageId)
      .pipe(finalize(() => this.setPending(deal.id, false)))
      .subscribe({
        next: (updatedDeal) => {
          this.deals.update((currentList) =>
            currentList.map((item) => (item.id === updatedDeal.id ? updatedDeal : item)),
          );
          this.actionMessage.set({
            text: `Se actualizó la etapa de “${updatedDeal.title}”.`,
            error: false,
          });
        },
        error: (err) => {
          this.actionMessage.set({
            text: apiErrorMessage(err, 'No pudimos cambiar la etapa. Intenta nuevamente.'),
            error: true,
          });
        },
      });
  }

  onDeleteDeal(deal: Deal): void {
    if (!this.permissionService.hasPermission('deals:delete') || this.pendingIds().has(deal.id))
      return;

    if (!confirm(`¿Estás seguro de eliminar la oportunidad "${deal.title}"?`)) {
      return;
    }

    this.setPending(deal.id, true);
    this.actionMessage.set(null);
    this.dealService
      .deleteDeal(deal.id)
      .pipe(finalize(() => this.setPending(deal.id, false)))
      .subscribe({
        next: () => {
          // Eliminación inmutable del Signal en memoria
          this.deals.update((currentList) => currentList.filter((item) => item.id !== deal.id));
          this.actionMessage.set({
            text: `Se eliminó la oportunidad “${deal.title}”.`,
            error: false,
          });
        },
        error: (err) => {
          this.actionMessage.set({
            text: apiErrorMessage(err, 'No pudimos eliminar la oportunidad. Intenta nuevamente.'),
            error: true,
          });
        },
      });
  }

  private setPending(id: string, pending: boolean): void {
    this.pendingIds.update((ids) => {
      const updated = new Set(ids);
      if (pending) updated.add(id);
      else updated.delete(id);
      return updated;
    });
  }
}
