import { Injectable, NgZone } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';

export interface OnCanDeactivate {
  canDeactivate: () => boolean;
}

@Injectable({ providedIn: 'root' })
export class CanDeactivateGuard implements CanDeactivate<OnCanDeactivate> {
  constructor(
    private modal: NzModalService,
    private ngZone: NgZone
  ) {}

  canDeactivate(component: OnCanDeactivate): Promise<boolean> {
    if (!component.canDeactivate || component.canDeactivate()) {
      return Promise.resolve(true);
    }
    return new Promise((resolve) => {
      this.modal.confirm({
        nzTitle: 'Unsaved Changes',
        nzContent: 'You have unsaved changes. Are you sure you want to leave this page? Any unsaved data will be lost.',
        nzOkText: 'Leave',
        nzCancelText: 'Stay',
        nzOkDanger: true,
        nzOnOk: () => this.ngZone.run(() => resolve(true)),
        nzOnCancel: () => this.ngZone.run(() => resolve(false))
      });
    });
  }
}
