import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

export interface CropResult {
  file: File;
  dataUrl: string;
  blob: Blob;
}

@Component({
  selector: 'app-image-crop-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzModalModule,
    NzButtonModule,
    NzSliderModule,
    NzRadioModule,
    NzIconModule,
    NzToolTipModule
  ],
  template: `
    <nz-modal
      [(nzVisible)]="isVisible"
      [nzTitle]="modalTitle"
      [nzWidth]="860"
      [nzFooter]="null"
      [nzMaskClosable]="false"
      (nzOnCancel)="onCancel()"
      nzClassName="image-crop-custom-modal"
    >
      <ng-container *nzModalContent>
        <div class="crop-container" *ngIf="imageLoaded; else loadingTpl">
          <!-- Left: Interactive Canvas Work Area -->
          <div class="crop-work-area">
            <div class="crop-viewport-wrapper" #viewportWrapper
                 (mousedown)="startPan($event)"
                 (touchstart)="startTouchPan($event)"
                 (wheel)="onWheel($event)">
              <canvas #cropCanvas class="crop-canvas"></canvas>

              <!-- Interactive Mask Overlay Guide -->
              <div class="crop-overlay-guide" [class.circle-mask]="mode === 'avatar' && aspectPreset === '1:1'">
                <div class="crop-guide-grid">
                  <div class="grid-line horizontal-1"></div>
                  <div class="grid-line horizontal-2"></div>
                  <div class="grid-line vertical-1"></div>
                  <div class="grid-line vertical-2"></div>
                </div>
              </div>
              <div class="crop-hint">
                <i nz-icon nzType="drag"></i> Drag to move &bull; Scroll to zoom
              </div>
            </div>

            <!-- Adjustment Controls -->
            <div class="crop-controls">
              <!-- Zoom Slider -->
              <div class="control-row zoom-row">
                <button nz-button nzType="text" nzSize="small" (click)="stepZoom(-0.1)" nz-tooltip="Zoom Out">
                  <i nz-icon nzType="zoom-out"></i>
                </button>
                <div class="slider-wrap">
                  <nz-slider [nzMin]="0.5" [nzMax]="3" [nzStep]="0.05" [(ngModel)]="scale" (ngModelChange)="draw()"></nz-slider>
                </div>
                <button nz-button nzType="text" nzSize="small" (click)="stepZoom(0.1)" nz-tooltip="Zoom In">
                  <i nz-icon nzType="zoom-in"></i>
                </button>
                <span class="zoom-value">{{ (scale * 100) | number:'1.0-0' }}%</span>
              </div>

              <!-- Rotate & Aspect Controls -->
              <div class="control-row actions-row">
                <div class="btn-group">
                  <button nz-button nzType="default" nzSize="small" (click)="rotate(-90)" nz-tooltip="Rotate Left 90°">
                    <i nz-icon nzType="undo"></i> 90°
                  </button>
                  <button nz-button nzType="default" nzSize="small" (click)="rotate(90)" nz-tooltip="Rotate Right 90°">
                    <i nz-icon nzType="redo"></i> 90°
                  </button>
                  <button nz-button nzType="default" nzSize="small" (click)="flipHorizontal()" nz-tooltip="Flip Horizontal">
                    <i nz-icon nzType="swap"></i> Flip
                  </button>
                  <button nz-button nzType="default" nzSize="small" (click)="resetAdjustments()" nz-tooltip="Reset Zoom & Position">
                    <i nz-icon nzType="sync"></i> Reset
                  </button>
                </div>

                <!-- Aspect Ratio Selector (for Logo Mode) -->
                <div class="aspect-selector" *ngIf="mode === 'logo'">
                  <span class="aspect-label">Ratio:</span>
                  <nz-radio-group [(ngModel)]="aspectPreset" (ngModelChange)="onAspectChange()" nzSize="small">
                    <label nz-radio-button nzValue="1:1">1:1</label>
                    <label nz-radio-button nzValue="4:3">4:3</label>
                    <label nz-radio-button nzValue="16:9">16:9</label>
                    <label nz-radio-button nzValue="3:1">Header</label>
                  </nz-radio-group>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Live Multi-Context Previews -->
          <div class="crop-preview-sidebar">
            <h4 class="preview-heading">Live Preview</h4>
            <p class="preview-sub">See how your image will look across the system:</p>

            <!-- AVATAR MODE PREVIEWS -->
            <div class="preview-showcase" *ngIf="mode === 'avatar'">
              <!-- 1. Circular Avatar (Navbar / List) -->
              <div class="preview-card">
                <div class="card-label">Profile Avatar (Navbar & List)</div>
                <div class="avatar-preview-row">
                  <div class="avatar-circle-lg">
                    <img [src]="livePreviewUrl" *ngIf="livePreviewUrl" alt="Avatar preview" />
                  </div>
                  <div class="avatar-circle-sm">
                    <img [src]="livePreviewUrl" *ngIf="livePreviewUrl" alt="Avatar preview small" />
                  </div>
                  <div class="avatar-meta">
                    <div class="sample-name">John Doe</div>
                    <div class="sample-role">Software Associate</div>
                  </div>
                </div>
              </div>

              <!-- 2. Staff ID Card Preview -->
              <div class="preview-card">
                <div class="card-label">Staff Profile Card</div>
                <div class="id-card-preview">
                  <div class="id-card-header"></div>
                  <div class="id-card-body">
                    <div class="id-photo-frame">
                      <img [src]="livePreviewUrl" *ngIf="livePreviewUrl" alt="Card preview" />
                    </div>
                    <div class="id-info">
                      <div class="id-badge-code">EMP #PARI101</div>
                      <div class="id-badge-dept">Operations Dept</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 3. Document / Letter Photo Box -->
              <div class="preview-card">
                <div class="card-label">Joining Report / Letter Photo</div>
                <div class="letter-photo-box-preview">
                  <div class="passport-photo-frame">
                    <img [src]="livePreviewUrl" *ngIf="livePreviewUrl" alt="Passport photo preview" />
                  </div>
                  <div class="doc-meta-text">
                    <span>Passport Size</span>
                    <span class="sub">35mm &times; 45mm</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- LOGO MODE PREVIEWS -->
            <div class="preview-showcase" *ngIf="mode === 'logo'">
              <!-- 1. Letterhead Brand Preview -->
              <div class="preview-card">
                <div class="card-label">Document Letterhead</div>
                <div class="letterhead-preview-mock">
                  <div class="mock-crest">
                    <img [src]="livePreviewUrl" *ngIf="livePreviewUrl" alt="Letterhead logo" />
                  </div>
                  <div class="mock-company-lines">
                    <div class="line title"></div>
                    <div class="line sub"></div>
                  </div>
                </div>
              </div>

              <!-- 2. Navbar Brand Preview -->
              <div class="preview-card">
                <div class="card-label">System Navbar Brand</div>
                <div class="navbar-preview-mock">
                  <div class="mock-nav-logo">
                    <img [src]="livePreviewUrl" *ngIf="livePreviewUrl" alt="Navbar logo" />
                  </div>
                  <div class="mock-nav-text">Parikar EMS</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="crop-modal-footer">
          <button nz-button nzType="default" (click)="onCancel()">
            <i nz-icon nzType="close"></i> Cancel
          </button>
          <button nz-button nzType="primary" class="btn-confirm" (click)="confirmCrop()" [nzLoading]="isProcessing">
            <i nz-icon nzType="check"></i> Apply & Confirm
          </button>
        </div>

        <ng-template #loadingTpl>
          <div class="crop-loading">
            <i nz-icon nzType="loading" nzTheme="outline" class="spin-icon"></i>
            <p>Loading image...</p>
          </div>
        </ng-template>
      </ng-container>
    </nz-modal>
  `,
  styles: [`
    .crop-container {
      display: flex;
      gap: 20px;
      min-height: 440px;
    }

    .crop-work-area {
      flex: 1.25;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .crop-viewport-wrapper {
      position: relative;
      width: 100%;
      height: 350px;
      background: #1e293b;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
      user-select: none;
      box-shadow: inset 0 2px 8px rgba(0,0,0,0.4);
    }
    .crop-viewport-wrapper:active {
      cursor: grabbing;
    }

    .crop-canvas {
      display: block;
      max-width: 100%;
      max-height: 100%;
    }

    .crop-overlay-guide {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 250px;
      height: 250px;
      border: 2px solid rgba(255, 255, 255, 0.85);
      box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.65);
      pointer-events: none;
      transition: border-radius 0.2s;
    }

    .crop-overlay-guide.circle-mask {
      border-radius: 50%;
    }

    .crop-guide-grid {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .grid-line {
      position: absolute;
      background: rgba(255, 255, 255, 0.25);
    }
    .grid-line.horizontal-1 { top: 33.33%; left: 0; right: 0; height: 1px; }
    .grid-line.horizontal-2 { top: 66.66%; left: 0; right: 0; height: 1px; }
    .grid-line.vertical-1 { left: 33.33%; top: 0; bottom: 0; width: 1px; }
    .grid-line.vertical-2 { left: 66.66%; top: 0; bottom: 0; width: 1px; }

    .crop-hint {
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.75);
      color: #e2e8f0;
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 12px;
      pointer-events: none;
      backdrop-filter: blur(4px);
    }

    .crop-controls {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .control-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .zoom-row .slider-wrap {
      flex: 1;
    }
    .zoom-value {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      min-width: 44px;
      text-align: right;
    }

    .actions-row {
      justify-content: space-between;
      flex-wrap: wrap;
    }

    .btn-group {
      display: flex;
      gap: 6px;
    }

    .aspect-selector {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .aspect-label {
      font-size: 12px;
      font-weight: 500;
      color: #64748b;
    }

    /* PREVIEW SIDEBAR */
    .crop-preview-sidebar {
      flex: 0.95;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
      max-height: 480px;
    }

    .preview-heading {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
    }

    .preview-sub {
      margin: 0;
      font-size: 11px;
      color: #64748b;
    }

    .preview-showcase {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .preview-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }

    .card-label {
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Avatar Preview Styles */
    .avatar-preview-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar-circle-lg {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid #2563eb;
      box-shadow: 0 2px 6px rgba(37,99,235,0.2);
      flex-shrink: 0;
    }
    .avatar-circle-lg img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-circle-sm {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      overflow: hidden;
      border: 1.5px solid #94a3b8;
      flex-shrink: 0;
    }
    .avatar-circle-sm img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-meta .sample-name {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
    }
    .avatar-meta .sample-role {
      font-size: 11px;
      color: #64748b;
    }

    /* ID Card Preview Styles */
    .id-card-preview {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      background: #ffffff;
    }
    .id-card-header {
      height: 14px;
      background: linear-gradient(90deg, #1e3a8a, #2563eb);
    }
    .id-card-body {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px;
    }
    .id-photo-frame {
      width: 44px;
      height: 52px;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid #94a3b8;
      flex-shrink: 0;
    }
    .id-photo-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .id-info .id-badge-code {
      font-size: 11px;
      font-weight: 700;
      color: #1e293b;
    }
    .id-info .id-badge-dept {
      font-size: 10px;
      color: #64748b;
    }

    /* Letter Photo Box */
    .letter-photo-box-preview {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fafafa;
      border: 1px dashed #94a3b8;
      padding: 8px;
      border-radius: 4px;
    }
    .passport-photo-frame {
      width: 45px;
      height: 55px;
      border: 1px solid #334155;
      background: #fff;
      overflow: hidden;
      flex-shrink: 0;
    }
    .passport-photo-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .doc-meta-text {
      font-size: 11px;
      font-weight: 600;
      color: #334155;
      display: flex;
      flex-direction: column;
    }
    .doc-meta-text .sub {
      font-size: 10px;
      font-weight: normal;
      color: #64748b;
    }

    /* Logo Preview Styles */
    .letterhead-preview-mock {
      background: #fff;
      border: 1px solid #cbd5e1;
      padding: 10px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .mock-crest {
      max-width: 110px;
      max-height: 42px;
      display: flex;
      align-items: center;
    }
    .mock-crest img {
      max-width: 100%;
      max-height: 42px;
      object-fit: contain;
    }
    .mock-company-lines {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .mock-company-lines .line.title {
      height: 8px;
      width: 70%;
      background: #94a3b8;
      border-radius: 2px;
    }
    .mock-company-lines .line.sub {
      height: 6px;
      width: 90%;
      background: #cbd5e1;
      border-radius: 2px;
    }

    .navbar-preview-mock {
      background: #1f3d6e;
      padding: 8px 12px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .mock-nav-logo {
      max-width: 80px;
      max-height: 28px;
    }
    .mock-nav-logo img {
      max-width: 100%;
      max-height: 28px;
      object-fit: contain;
    }
    .mock-nav-text {
      color: #fff;
      font-size: 12px;
      font-weight: 600;
    }

    /* Footer */
    .crop-modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
    }

    .btn-confirm {
      background: linear-gradient(135deg, #1e40af, #2563eb) !important;
      border: none !important;
      font-weight: 600;
      box-shadow: 0 2px 6px rgba(37,99,235,0.3);
    }

    .crop-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 0;
      gap: 12px;
      color: #64748b;
    }
    .spin-icon {
      font-size: 32px;
      color: #2563eb;
    }
  `]
})
export class ImageCropModalComponent implements AfterViewInit, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() imageFile: File | null = null;
  @Input() imageSrc: string = '';
  @Input() mode: 'avatar' | 'logo' = 'avatar';
  @Input() modalTitle: string = 'Adjust & Crop Image';

  @Output() isVisibleChange = new EventEmitter<boolean>();
  @Output() confirmed = new EventEmitter<CropResult>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('cropCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('viewportWrapper') viewportRef!: ElementRef<HTMLDivElement>;

  imageLoaded: boolean = false;
  isProcessing: boolean = false;
  livePreviewUrl: string = '';

  // Manipulation State
  scale: number = 1.0;
  rotation: number = 0;
  flipH: boolean = false;
  panX: number = 0;
  panY: number = 0;

  aspectPreset: string = '1:1';

  private img: HTMLImageElement = new Image();
  private isPanning: boolean = false;
  private startMouseX: number = 0;
  private startMouseY: number = 0;
  private initialPanX: number = 0;
  private initialPanY: number = 0;

  ngAfterViewInit(): void {
    if (this.isVisible && (this.imageFile || this.imageSrc)) {
      this.loadImage();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && this.isVisible) {
      this.resetAdjustments();
      this.loadImage();
    }
    if (changes['imageFile'] && this.imageFile && this.isVisible) {
      this.resetAdjustments();
      this.loadImage();
    }
  }

  resetAdjustments(): void {
    this.scale = 1.0;
    this.rotation = 0;
    this.flipH = false;
    this.panX = 0;
    this.panY = 0;
    this.aspectPreset = this.mode === 'avatar' ? '1:1' : '1:1';
  }

  private loadImage(): void {
    this.imageLoaded = false;
    this.img = new Image();
    this.img.crossOrigin = 'anonymous';

    this.img.onload = () => {
      this.imageLoaded = true;
      setTimeout(() => {
        this.initCanvasSize();
        this.draw();
      }, 50);
    };

    if (this.imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.img.src = e.target?.result as string;
      };
      reader.readAsDataURL(this.imageFile);
    } else if (this.imageSrc) {
      this.img.src = this.imageSrc;
    }
  }

  private initCanvasSize(): void {
    if (!this.canvasRef || !this.viewportRef) return;
    const canvas = this.canvasRef.nativeElement;
    const viewport = this.viewportRef.nativeElement;
    canvas.width = viewport.clientWidth || 400;
    canvas.height = viewport.clientHeight || 350;
  }

  draw(): void {
    if (!this.imageLoaded || !this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.save();
    ctx.translate(centerX + this.panX, centerY + this.panY);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.scale(this.flipH ? -this.scale : this.scale, this.scale);

    // Calculate fitted dimensions
    const imgRatio = this.img.width / this.img.height;
    let drawWidth = 250;
    let drawHeight = 250 / imgRatio;

    if (drawHeight < 250 && this.mode === 'avatar') {
      drawHeight = 250;
      drawWidth = 250 * imgRatio;
    }

    ctx.drawImage(this.img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    this.updateLivePreview();
  }

  private updateLivePreview(): void {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    
    // Crop center region based on aspect ratio
    let cropWidth = 250;
    let cropHeight = 250;

    if (this.mode === 'logo') {
      if (this.aspectPreset === '4:3') { cropWidth = 280; cropHeight = 210; }
      else if (this.aspectPreset === '16:9') { cropWidth = 320; cropHeight = 180; }
      else if (this.aspectPreset === '3:1') { cropWidth = 330; cropHeight = 110; }
    }

    const cropX = (canvas.width - cropWidth) / 2;
    const cropY = (canvas.height - cropHeight) / 2;

    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = cropWidth;
    previewCanvas.height = cropHeight;
    const pctx = previewCanvas.getContext('2d');
    if (pctx) {
      pctx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      this.livePreviewUrl = previewCanvas.toDataURL('image/png', 0.95);
    }
  }

  // Pan interactions
  startPan(event: MouseEvent): void {
    event.preventDefault();
    this.isPanning = true;
    this.startMouseX = event.clientX;
    this.startMouseY = event.clientY;
    this.initialPanX = this.panX;
    this.initialPanY = this.panY;
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isPanning) return;
    const dx = event.clientX - this.startMouseX;
    const dy = event.clientY - this.startMouseY;
    this.panX = this.initialPanX + dx;
    this.panY = this.initialPanY + dy;
    this.draw();
  }

  @HostListener('window:mouseup')
  onMouseUp(): void {
    this.isPanning = false;
  }

  startTouchPan(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.isPanning = true;
      this.startMouseX = event.touches[0].clientX;
      this.startMouseY = event.touches[0].clientY;
      this.initialPanX = this.panX;
      this.initialPanY = this.panY;
    }
  }

  @HostListener('window:touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (!this.isPanning || event.touches.length !== 1) return;
    const dx = event.touches[0].clientX - this.startMouseX;
    const dy = event.touches[0].clientY - this.startMouseY;
    this.panX = this.initialPanX + dx;
    this.panY = this.initialPanY + dy;
    this.draw();
  }

  @HostListener('window:touchend')
  onTouchEnd(): void {
    this.isPanning = false;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.05 : -0.05;
    this.stepZoom(delta);
  }

  stepZoom(delta: number): void {
    this.scale = Math.min(3.0, Math.max(0.5, parseFloat((this.scale + delta).toFixed(2))));
    this.draw();
  }

  rotate(degrees: number): void {
    this.rotation = (this.rotation + degrees) % 360;
    this.draw();
  }

  flipHorizontal(): void {
    this.flipH = !this.flipH;
    this.draw();
  }

  onAspectChange(): void {
    this.draw();
  }

  onCancel(): void {
    this.isVisible = false;
    this.isVisibleChange.emit(false);
    this.cancelled.emit();
  }

  confirmCrop(): void {
    if (!this.canvasRef) return;
    this.isProcessing = true;

    // High resolution export canvas
    const outputCanvas = document.createElement('canvas');
    const exportSize = this.mode === 'avatar' ? 600 : 900;
    
    let aspectMultiplier = 1;
    if (this.mode === 'logo') {
      if (this.aspectPreset === '4:3') aspectMultiplier = 3/4;
      else if (this.aspectPreset === '16:9') aspectMultiplier = 9/16;
      else if (this.aspectPreset === '3:1') aspectMultiplier = 1/3;
    }

    outputCanvas.width = exportSize;
    outputCanvas.height = exportSize * aspectMultiplier;
    const octx = outputCanvas.getContext('2d');

    if (octx && this.canvasRef) {
      const srcCanvas = this.canvasRef.nativeElement;
      let cropWidth = 250;
      let cropHeight = 250;

      if (this.mode === 'logo') {
        if (this.aspectPreset === '4:3') { cropWidth = 280; cropHeight = 210; }
        else if (this.aspectPreset === '16:9') { cropWidth = 320; cropHeight = 180; }
        else if (this.aspectPreset === '3:1') { cropWidth = 330; cropHeight = 110; }
      }

      const cropX = (srcCanvas.width - cropWidth) / 2;
      const cropY = (srcCanvas.height - cropHeight) / 2;

      octx.drawImage(srcCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, outputCanvas.width, outputCanvas.height);

      outputCanvas.toBlob((blob) => {
        this.isProcessing = false;
        if (blob) {
          const originalName = this.imageFile?.name || 'cropped-image.png';
          const fileName = originalName.replace(/\.[^/.]+$/, "") + ".png";
          const file = new File([blob], fileName, { type: 'image/png' });
          const dataUrl = outputCanvas.toDataURL('image/png', 0.95);

          this.isVisible = false;
          this.isVisibleChange.emit(false);
          this.confirmed.emit({ file, dataUrl, blob });
        }
      }, 'image/png', 0.95);
    } else {
      this.isProcessing = false;
    }
  }
}
