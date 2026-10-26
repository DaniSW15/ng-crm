import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DealService } from '../../services/deal.service';
import { Deal, Pipeline } from '../../../../core/models/deal.model';
import { PermissionService } from '../../../../core/auth/permission.service';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';
import { DealTable } from '../../components/deal-table/deal-table';

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

  // Capacidad de dominio reactiva (Domain Authorization Policy)
  readonly canDelete = this.permissionService.can('deals:delete');

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
    if (!filter) return this.deals();
    return this.deals().filter((deal) => deal.status.toUpperCase() === filter.toUpperCase());
  });

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    // 1. Cargar embudos/etapas
    this.dealService.getPipelines().subscribe({
      next: (pipelines) => {
        this.pipelines.set(pipelines);
      },
      error: (err) => {
        console.warn('No se pudieron obtener los embudos:', err);
      },
    });

    // 2. Cargar oportunidades comerciales
    this.dealService.getDeals().subscribe({
      next: (data) => {
        this.deals.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('No se pudieron obtener las oportunidades comerciales.');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  onMoveToNextStage(deal: Deal): void {
    const currentPipeline = this.pipelines().find((p) => p.id === deal.pipeline_id) ?? this.pipelines()[0];
    const currentStage = currentPipeline?.stages.find((s) => s.id === deal.stage_id);

    // Buscar la etapa siguiente según el orden secuencial del embudo
    const nextStage = currentPipeline?.stages.find((s) => s.order === (currentStage?.order ?? 1) + 1);

    if (!nextStage) {
      alert('Esta oportunidad ya se encuentra en la última etapa del embudo comercial.');
      return;
    }

    this.dealService.moveStage(deal.id, nextStage.id).subscribe({
      next: (updatedDeal) => {
        this.deals.update((currentList) =>
          currentList.map((item) => (item.id === updatedDeal.id ? updatedDeal : item))
        );
      },
      error: (err) => {
        alert(err.error?.detail || 'Error al mover la etapa de la oportunidad.');
      },
    });
  }

  onDeleteDeal(deal: Deal): void {
    if (!this.permissionService.hasPermission('deals:delete')) {
      alert('Tu rol actual no tiene autorización para eliminar oportunidades comerciales.');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar la oportunidad "${deal.title}"?`)) {
      return;
    }

    this.dealService.deleteDeal(deal.id).subscribe({
      next: () => {
        // Eliminación inmutable del Signal en memoria
        this.deals.update((currentList) => currentList.filter((item) => item.id !== deal.id));
      },
      error: (err) => {
        alert(err.error?.detail || 'No tienes permisos para eliminar esta oportunidad.');
      },
    });
  }
}

