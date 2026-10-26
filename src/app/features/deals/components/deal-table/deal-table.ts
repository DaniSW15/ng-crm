import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Deal } from '../../../../core/models/deal.model';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';

/**
 * Presentational (Dumb) Component:
 * - Puro: no inyecta servicios ni efectúa llamadas HTTP.
 * - Recibe estado reactivo mediante Signal Inputs (input.required).
 * - Emite eventos tipados mediante Signal Outputs (output).
 */
@Component({
  selector: 'app-deal-table',
  imports: [CurrencyPipe, DatePipe, HasPermissionDirective],
  templateUrl: './deal-table.html',
  styleUrl: './deal-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DealTable {
  // Signal Inputs: Reactivos e inmutables en la vista
  readonly deals = input.required<Deal[]>();
  readonly stageNames = input.required<Map<string, string>>();

  // Signal Outputs: Eventos tipados hacia el Smart Component contenedor
  readonly moveToNext = output<Deal>();
  readonly delete = output<Deal>();
}

