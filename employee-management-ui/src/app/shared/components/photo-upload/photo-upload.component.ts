import { Component, Input, Output, EventEmitter, forwardRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-photo-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, NzButtonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhotoUploadComponent),
      multi: true
    }
  ],
  template: `
    <div class="photo-upload-container">
      <div class="photo-preview" *ngIf="previewUrl">
        <img [src]="previewUrl" alt="Employee photo preview" class="preview-image">
        <button nz-button nzType="text" class="remove-photo-btn" (click)="removePhoto()" type="button" aria-label="Remove photo">
          <i nz-icon nzType="close"></i>
        </button>
      </div>
      <div class="photo-placeholder" *ngIf="!previewUrl"
           (click)="fileInput.click()" (keydown.enter)="fileInput.click()" (keydown.space)="fileInput.click(); $event.preventDefault()"
           tabindex="0" role="button" aria-label="Upload photo">
        <i nz-icon nzType="camera" class="upload-icon"></i>
        <span class="upload-text">{{ label }}</span>
        <span class="upload-hint">JPG or PNG, max 2MB</span>
      </div>
      <input #fileInput type="file" accept="image/jpeg,image/png"
             (change)="onFileSelected($event)" style="display:none">
      <div class="photo-error" *ngIf="errorMessage" role="alert" aria-live="polite">
        <i nz-icon nzType="warning"></i> {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .photo-upload-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }
    .photo-preview {
      position: relative;
      width: 150px;
      height: 150px;
      border-radius: var(--radius-full);
      overflow: hidden;
      border: 3px solid var(--color-card, #fff);
      box-shadow: 0 2px 12px rgba(31,61,110,0.2);
    }
    .preview-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .remove-photo-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      background: rgba(0,0,0,0.5) !important;
      color: white !important;
      width: 28px;
      height: 28px;
      min-width: 28px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.15s;
    }
    .photo-preview:hover .remove-photo-btn {
      opacity: 1;
    }
    .photo-placeholder {
      width: 150px;
      height: 150px;
      border: 2px dashed var(--color-border, #c0c0c0);
      border-radius: var(--radius-full);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s;
      background: var(--color-bg-alt, #f9f9f9);
    }
    .photo-placeholder:hover {
      border-color: var(--color-primary-500, #1f3d6e);
      background: var(--color-primary-50, #f0f4ff);
      box-shadow: 0 0 0 4px rgba(31,61,110,0.08);
    }
    .photo-placeholder:focus-visible {
      outline: 2px solid var(--color-primary-500, #1f3d6e);
      outline-offset: 2px;
    }
    .upload-icon {
      font-size: 36px;
      color: var(--color-text-muted, #999);
    }
    .photo-placeholder:hover .upload-icon {
      color: var(--color-primary-500, #1f3d6e);
    }
    .upload-text {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-secondary, #555);
    }
    .upload-hint {
      font-size: 11px;
      color: var(--color-text-muted, #999);
    }
    .photo-error {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      font-size: 12px;
      color: var(--color-error, #dc2626);
      background: rgba(220,38,38,0.08);
      padding: 6px 12px;
      border-radius: var(--radius-md);
      max-width: 200px;
      text-align: center;
    }
  `]
})
export class PhotoUploadComponent implements ControlValueAccessor, OnChanges {
  @Input() label: string = 'Upload Photo';
  @Input() existingPhotoUrl: string = '';

  @Output() photoChange = new EventEmitter<File | null>();

  previewUrl: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  errorMessage: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['existingPhotoUrl'] && this.existingPhotoUrl && !this.selectedFile) {
      this.previewUrl = this.existingPhotoUrl;
    }
  }

  private onChange: (value: File | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: any): void {
    if (value instanceof File) {
      this.selectedFile = value;
      this.loadPreview(value);
    } else if (typeof value === 'string') {
      this.previewUrl = value;
    } else if (this.existingPhotoUrl) {
      this.previewUrl = this.existingPhotoUrl;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onFileSelected(event: Event): void {
    this.errorMessage = '';
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 2 * 1024 * 1024) {
        this.errorMessage = 'File size exceeds 2MB limit. Please select a smaller file.';
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        this.errorMessage = 'Only JPG and PNG files are allowed.';
        return;
      }
      this.selectedFile = file;
      this.loadPreview(file);
      this.onChange(file);
      this.photoChange.emit(file);
    }
  }

  private loadPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result;
    };
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.errorMessage = '';
    this.previewUrl = null;
    this.selectedFile = null;
    this.onChange(null);
    this.photoChange.emit(null);
  }
}
