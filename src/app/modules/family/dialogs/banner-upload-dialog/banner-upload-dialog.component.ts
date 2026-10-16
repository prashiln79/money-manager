import {
  Component,
  inject,
  ChangeDetectionStrategy,
  signal,
  computed,
  ElementRef,
  ViewChild,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface BannerUploadDialogData {
  currentBanner?: string | null;
  familyName?: string;
  familyIcon?: string;
}

export interface BannerUploadDialogResult {
  action: 'save' | 'remove';
  base64?: string;
}

@Component({
  selector: 'app-banner-upload-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './banner-upload-dialog.component.html',
  styleUrls: ['./banner-upload-dialog.component.scss']
})
export class BannerUploadDialogComponent implements OnDestroy {
  readonly dialogRef = inject(MatDialogRef<BannerUploadDialogComponent>);
  readonly data: BannerUploadDialogData = inject(MAT_DIALOG_DATA, { optional: true }) || {};

  private cropViewportEl?: HTMLDivElement;
  private simulationCardEl?: HTMLDivElement;
  private resizeObserver?: ResizeObserver;
  private simResizeObserver?: ResizeObserver;

  @ViewChild('cropViewport') set cropViewport(el: ElementRef<HTMLDivElement> | undefined) {
    this.cropViewportEl = el?.nativeElement;
    if (this.cropViewportEl) {
      const width = this.cropViewportEl.clientWidth || 540;
      this.viewportWidth.set(width);
      this.resizeObserver?.disconnect();
      this.resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0) {
            this.viewportWidth.set(entry.contentRect.width);
          }
        }
      });
      this.resizeObserver.observe(this.cropViewportEl);
    }
  }

  @ViewChild('simulationCard') set simulationCard(el: ElementRef<HTMLDivElement> | undefined) {
    this.simulationCardEl = el?.nativeElement;
    if (this.simulationCardEl) {
      const width = this.simulationCardEl.clientWidth || 200;
      this.simulationWidth.set(width);
      this.simResizeObserver?.disconnect();
      this.simResizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0) {
            this.simulationWidth.set(entry.contentRect.width);
          }
        }
      });
      this.simResizeObserver.observe(this.simulationCardEl);
    }
  }

  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  // State
  readonly imageSource = signal<string | null>(null);
  readonly originalFileSize = signal<string>('');
  readonly originalDimensions = signal<string>('');
  readonly optimizedFileSize = signal<string>('');
  readonly isProcessing = signal<boolean>(false);
  readonly isDraggingFile = signal<boolean>(false);

  // Viewport and Natural Dimensions
  readonly viewportWidth = signal<number>(540);
  readonly simulationWidth = signal<number>(200);
  readonly naturalWidth = signal<number>(1200);
  readonly naturalHeight = signal<number>(500);

  // Transform controls
  readonly zoom = signal<number>(1.0); // 0.8 to 3.0
  readonly rotation = signal<number>(0); // 0, 90, 180, 270
  readonly panX = signal<number>(0);
  readonly panY = signal<number>(0);
  readonly activeAspectRatio = signal<{ label: string; ratio: number }>({
    label: 'Wide (2.4:1)',
    ratio: 2.4
  });

  // Base Cover Scale: fits any resolution (4K, 8K, standard) to cover the viewport cleanly
  readonly baseCoverScale = computed(() => {
    const vw = this.viewportWidth();
    const ratio = this.activeAspectRatio().ratio;
    const vh = vw / ratio;

    const nw = this.naturalWidth();
    const nh = this.naturalHeight();
    const rot = this.rotation();
    const isRot90 = rot === 90 || rot === 270;
    const effW = isRot90 ? nh : nw;
    const effH = isRot90 ? nw : nh;

    if (!effW || !effH || !vw) return 1;
    return Math.max(vw / effW, vh / effH);
  });

  readonly baseImageWidth = computed(() => {
    return Math.round(this.naturalWidth() * this.baseCoverScale());
  });

  readonly baseImageHeight = computed(() => {
    return Math.round(this.naturalHeight() * this.baseCoverScale());
  });

  readonly simRatio = computed(() => {
    const vw = this.viewportWidth();
    const sw = this.simulationWidth();
    return vw > 0 ? sw / vw : 0.4;
  });

  // Drag interaction state
  private isPointerDown = false;
  private pointerStartX = 0;
  private pointerStartY = 0;
  private initialPanX = 0;
  private initialPanY = 0;

  // Cached HTML Image instance
  private loadedImg: HTMLImageElement | null = null;
  private originalFileBytes = 0;

  readonly aspectRatios = [
    { label: 'Wide (2.4:1)', ratio: 2.4 },
    { label: 'Standard (16:9)', ratio: 16 / 9 },
    { label: 'Cinematic (3:1)', ratio: 3.0 }
  ];

  readonly hasExistingBanner = computed(() => !!this.data.currentBanner);

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.simResizeObserver?.disconnect();
  }

  // --- File Selection & Handling ---
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.loadFile(file);
    }
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this.loadFile(file);
    }
  }

  private loadFile(file: File): void {
    this.isProcessing.set(true);
    this.originalFileBytes = file.size;
    this.originalFileSize.set(this.formatBytes(file.size));

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        this.loadedImg = img;
        this.naturalWidth.set(img.naturalWidth);
        this.naturalHeight.set(img.naturalHeight);
        this.originalDimensions.set(`${img.naturalWidth} × ${img.naturalHeight}px`);
        this.resetTransforms();
        this.imageSource.set(result);
        this.isProcessing.set(false);
        this.updateOptimizedEstimate();
      };
      img.onerror = () => {
        this.isProcessing.set(false);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  }

  // --- Transformations ---
  resetTransforms(): void {
    this.zoom.set(1.0);
    this.rotation.set(0);
    this.panX.set(0);
    this.panY.set(0);
  }

  setAspectRatio(item: { label: string; ratio: number }): void {
    this.activeAspectRatio.set(item);
    this.resetTransforms();
    this.updateOptimizedEstimate();
  }

  setZoom(value: number): void {
    this.zoom.set(Math.min(3.0, Math.max(0.8, value)));
    this.updateOptimizedEstimate();
  }

  zoomIn(): void {
    this.setZoom(Math.round((this.zoom() + 0.1) * 10) / 10);
  }

  zoomOut(): void {
    this.setZoom(Math.round((this.zoom() - 0.1) * 10) / 10);
  }

  rotateClockwise(): void {
    this.rotation.update(r => (r + 90) % 360);
    this.panX.set(0);
    this.panY.set(0);
    this.updateOptimizedEstimate();
  }

  // Pointer drag panning
  onPointerDown(event: PointerEvent): void {
    if (!this.imageSource()) return;
    this.isPointerDown = true;
    this.pointerStartX = event.clientX;
    this.pointerStartY = event.clientY;
    this.initialPanX = this.panX();
    this.initialPanY = this.panY();
    (event.target as HTMLElement)?.setPointerCapture?.(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.isPointerDown) return;
    const deltaX = event.clientX - this.pointerStartX;
    const deltaY = event.clientY - this.pointerStartY;
    this.panX.set(this.initialPanX + deltaX);
    this.panY.set(this.initialPanY + deltaY);
  }

  onPointerUp(event: PointerEvent): void {
    if (this.isPointerDown) {
      this.isPointerDown = false;
      try {
        (event.target as HTMLElement)?.releasePointerCapture?.(event.pointerId);
      } catch {
        // Ignored
      }
    }
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.08 : -0.08;
    this.setZoom(this.zoom() + delta);
  }

  chooseDifferentImage(): void {
    this.imageSource.set(null);
    this.loadedImg = null;
    this.resetTransforms();
  }

  // --- Output Compression and Export ---
  private updateOptimizedEstimate(): void {
    const ratio = this.activeAspectRatio().ratio;
    const width = 1200;
    const height = Math.round(width / ratio);
    const approxBytes = Math.round(width * height * 0.12);
    this.optimizedFileSize.set(`~${this.formatBytes(approxBytes)} (${width}×${height})`);
  }

  applyAndSave(): void {
    if (!this.loadedImg) return;
    this.isProcessing.set(true);

    try {
      const ratio = this.activeAspectRatio().ratio;
      const targetWidth = 1200;
      const targetHeight = Math.round(targetWidth / ratio);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        this.isProcessing.set(false);
        return;
      }

      // Fill background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const vw = this.viewportWidth() || 540;
      const scaleFactor = canvas.width / vw;

      const baseW = this.baseImageWidth();
      const baseH = this.baseImageHeight();
      const totalScale = this.zoom();

      ctx.save();
      // Translate to canvas center + pan offset scaled up to target canvas
      ctx.translate(
        canvas.width / 2 + this.panX() * scaleFactor,
        canvas.height / 2 + this.panY() * scaleFactor
      );
      ctx.rotate((this.rotation() * Math.PI) / 180);

      const drawW = baseW * scaleFactor * totalScale;
      const drawH = baseH * scaleFactor * totalScale;

      ctx.drawImage(this.loadedImg, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Compress to JPEG with quality 0.82
      let quality = 0.82;
      let base64 = canvas.toDataURL('image/jpeg', quality);

      // Ensure base64 string stays well under 250KB for safe Firestore storage
      if (base64.length > 250 * 1024) {
        quality = 0.7;
        base64 = canvas.toDataURL('image/jpeg', quality);
      }

      this.dialogRef.close({
        action: 'save',
        base64
      } as BannerUploadDialogResult);
    } catch (err) {
      console.error('Failed to crop and export banner image', err);
      this.isProcessing.set(false);
    }
  }

  removeBanner(): void {
    this.dialogRef.close({
      action: 'remove'
    } as BannerUploadDialogResult);
  }

  close(): void {
    this.dialogRef.close();
  }

  private formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}
