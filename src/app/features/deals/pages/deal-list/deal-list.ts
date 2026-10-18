import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DealService } from '../../services/deal.service';
import { Deal } from '../../../../core/models/deal.model';

@Component({
  imports: [CurrencyPipe, DatePipe, RouterLink],
  selector: 'app-deal-list',
  styleUrl: './deal-list.scss',
  templateUrl: './deal-list.html',
})
export class DealList implements OnInit {
  private dealService = inject(DealService);

  // Estados reactivos con Signals
  deals = signal<Deal[]>([]);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.fetchDeals();
  }

  fetchDeals(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.dealService.getDeals().subscribe({
      next: (data) => {
        this.deals.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('No se pudieron obtener las oportunidades comerciales.');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  onMoveToNextStage(deal: Deal): void {
    // Ejemplo de avance a la siguiente etapa de demostración
    const demoStageId = 'b0000000-0000-0000-0000-000000000002';

    this.dealService.moveStage(deal.id, demoStageId).subscribe({
      next: (updatedDeal) => {
        // Actualización inmutable del Signal sin recargar la lista completa
        this.deals.update(currentList =>
          currentList.map(item => (item.id === updatedDeal.id ? updatedDeal : item))
        );
      },
      error: (err) => {
        alert(err.error?.detail || 'Error al mover la etapa de la oportunidad.');
      }
    });
  }
}
