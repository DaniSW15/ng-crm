import {
  Directive,
  effect,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { PermissionService } from '@core/auth/permission.service';
import { AppPermission } from '@core/models/permission.model';

/**
 * Directiva Estructural declarativa para control de acceso en plantillas.
 *
 * Ejemplos de uso:
 *
 * 1. Ocultar si no tiene permiso:
 * ```html
 * <button *hasPermission="'deals:delete'" (click)="deleteDeal(deal.id)">
 *   Eliminar Trato
 * </button>
 * ```
 *
 * 2. Con plantilla fallback (else):
 * ```html
 * <button *hasPermission="'deals:delete'; else noPerm">
 *   Eliminar
 * </button>
 * <ng-template #noPerm>
 *   <span class="badge badge-disabled">Solo lectura</span>
 * </ng-template>
 * ```
 *
 * 3. Múltiples permisos requeridos:
 * ```html
 * <div *hasPermission="['deals:update', 'deals:move_stage']">...</div>
 * ```
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private readonly permissionService = inject(PermissionService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  readonly hasPermission = input.required<AppPermission | AppPermission[]>();
  readonly hasPermissionElse = input<TemplateRef<unknown> | null>(null);

  private hasView = false;
  private hasElseView = false;

  constructor() {
    effect(() => {
      const requiredPermission = this.hasPermission();
      const elseTemplate = this.hasPermissionElse();
      const isAllowed = this.permissionService.hasPermission(requiredPermission);

      if (isAllowed) {
        if (!this.hasView) {
          this.viewContainer.clear();
          this.viewContainer.createEmbeddedView(this.templateRef);
          this.hasView = true;
          this.hasElseView = false;
        }
      } else {
        if (!this.hasElseView) {
          this.viewContainer.clear();
          if (elseTemplate) {
            this.viewContainer.createEmbeddedView(elseTemplate);
            this.hasElseView = true;
          }
          this.hasView = false;
        }
      }
    });
  }
}

