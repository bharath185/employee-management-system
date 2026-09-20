import { Component, Input, Output, EventEmitter, forwardRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { ImageCropModalComponent, CropResult } from '../image-crop-modal/image-crop-modal.component';

@Component({
  selector: 'app-photo-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, NzButtonModule, NzToolTipModule, ImageCropModalComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhotoUploadComponent),
      multi: true
    }
  ],
  template: `
    <div class="photo-upload-container">
      <div class="photo-preview-wrap" *ngIf="previewUrl">
        <div class="photo-preview">
          <img [src]="previewUrl" alt="Employee photo preview" class="preview-image">
          <div class="photo-actions-overlay">
            <button nz-button nzType="text" class="action-btn edit-btn" (click)="openCropAdjustment()" type="button" nz-tooltip="Adjust / Crop">
              <i nz-icon nzType="scissor"></i>
            </button>
            <button nz-button nzType="text" class="action-btn remove-photo-btn" (click)="removePhoto()" type="button" nz-tooltip="Remove photo">
              <i nz-icon nzType="delete"></i>
            </button>
          </div>
        </div>
        <button nz-button nzType="link" nzSize="small" class="change-photo-link" (click)="fileInput.click()" type="button">
          <i nz-icon nzType="camera"></i> Change Photo
        </button>
      </div>

      <div class="photo-placeholder" *ngIf="!previewUrl"
           (click)="fileInput.click()" (keydown.enter)="fileInput.click()" (keydown.space)="fileInput.click(); $event.preventDefault()"
           tabindex="0" role="button" aria-label="Upload photo">
        <div class="placeholder-icon-wrap">
          <i nz-icon nzType="camera" class="upload-icon"></i>
        </div>
        <span class="upload-text">{{ label }}</span>
        <span class="upload-hint">JPG or PNG &bull; Crop &amp; Preview</span>
      </div>

      <input #fileInput type="file" accept="image/jpeg,image/png,image/webp"
             (change)="onFileSelected($event)" style="display:none">

      <div class="photo-error" *ngIf="errorMessage" role="alert" aria-live="polite">
        <i nz-icon nzType="warning"></i> {{ errorMessage }}
      </div>

      <!-- Interactive Crop & Adjustment Modal -->
      <app-image-crop-modal
        [(isVisible)]="isCropModalOpen"
        [imageFile]="selectedRawFile"
        [imageSrc]="currentImageSrc"
        mode="avatar"
        modalTitle="Adjust Employee Profile Photo"
        (confirmed)="onCropConfirmed($event)"
        (cancelled)="onCropCancelled()"
      ></app-image-crop-modal>
    </div>
  `,
  styles: [`
    .photo-upload-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }
    .photo-preview-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .photo-preview {
      position: relative;
      width: 140px;
      height: 140px;
      border-radius: var(--radius-full, 50%);
      overflow: hidden;
      border: 3px solid #2563eb;
      box-shadow: 0 4px 14px rgba(37,99,235,0.22);
      background: #f8fafc;
    }
    .preview-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .photo-actions-overlay {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .photo-preview:hover .photo-actions-overlay {
      opacity: 1;
    }
    .action-btn {
      color: #ffffff !important;
      background: rgba(255,255,255,0.2) !important;
      border-radius: 50%;
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }
    .action-btn:hover {
      background: #2563eb !important;
      transform: scale(1.1);
    }
    .action-btn.remove-photo-btn:hover {
      background: #ef4444 !important;
    }
    .change-photo-link {
      font-size: 12px;
      font-weight: 500;
      color: #2563eb;
      padding: 2px 8px;
    }
    .photo-placeholder {
      width: 140px;
      height: 140px;
      border: 2px dashed #94a3b8;
      border-radius: var(--radius-full, 50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      cursor: pointer;
      transition: all 0.2s;
      background: #f8fafc;
      padding: 10px;
      text-align: center;
    }
    .photo-placeholder:hover {
      border-color: #2563eb;
      background: #eff6ff;
      box-shadow: 0 0 0 4px rgba(37,99,235,0.1);
    }
    .placeholder-icon-wrap {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .photo-placeholder:hover .placeholder-icon-wrap {
      background: #dbeafe;
    }
    .upload-icon {
      font-size: 22px;
      color: #64748b;
    }
    .photo-placeholder:hover .upload-icon {
      color: #2563eb;
    }
    .upload-text {
      font-size: 12px;
      font-weight: 600;
      color: #334155;
      margin-top: 2px;
    }
    .upload-hint {
      font-size: 10px;
      color: #94a3b8;
    }
    .photo-error {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      font-size: 12px;
      color: #ef4444;
      background: rgba(239,68,68,0.08);
      padding: 6px 12px;
      border-radius: 6px;
      max-width: 220px;
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

  // Crop Modal State
  isCropModalOpen: boolean = false;
  selectedRawFile: File | null = null;
  currentImageSrc: string = '';

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
      if (file.size > 10 * 1024 * 1024) {
        this.errorMessage = 'File size exceeds 10MB limit. Please select a smaller file.';
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        this.errorMessage = 'Only JPG, PNG and WebP files are allowed.';
        return;
      }
      
      // Open interactive crop modal
      this.selectedRawFile = file;
      this.currentImageSrc = '';
      this.isCropModalOpen = true;
      input.value = '';
    }
  }

  openCropAdjustment(): void {
    if (this.selectedFile) {
      this.selectedRawFile = this.selectedFile;
      this.currentImageSrc = '';
      this.isCropModalOpen = true;
    } else if (typeof this.previewUrl === 'string' && this.previewUrl) {
      this.selectedRawFile = null;
      this.currentImageSrc = this.previewUrl;
      this.isCropModalOpen = true;
    }
  }

  onCropConfirmed(result: CropResult): void {
    this.selectedFile = result.file;
    this.previewUrl = result.dataUrl;
    this.errorMessage = '';
    this.onChange(result.file);
    this.photoChange.emit(result.file);
  }

  onCropCancelled(): void {
    this.isCropModalOpen = false;
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
    this.selectedRawFile = null;
    this.currentImageSrc = '';
    this.onChange(null);
    this.photoChange.emit(null);
  }
}
