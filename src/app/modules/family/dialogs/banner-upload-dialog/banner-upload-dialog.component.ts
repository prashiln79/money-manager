import {
  Component,
  inject,
  ChangeDetectionStrategy,
  signal,
  computed,
  ElementRef,
  ViewChild,
  HostListener,
  AfterViewInit
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
export class BannerUploadDialogComponent implements AfterViewInit {
  readonly dialogRef = inject(MatDialogRef<BannerUploadDialogComponent>);
  readonly data: BannerUploadDialogData = inject(MAT_DIALOG_DATA, { optional: true }) || {};

  @ViewChild('cropViewport') cropViewportRef?: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  // State
  readonly imageSource = signal<string | null>(null);
  readonly originalFileSize = signal<string>('');
  readonly originalDimensions = signal<string>('');
  readonly optimizedFileSize = signal<string>('');
  readonly isProcessing = signal<boolean>(false);
  readonly isDraggingFile = signal<boolean>(false);

  // Transform controls
  readonly zoom = signal<number>(1.0); // 1.0 to 3.0
  readonly rotation = signal<number>(0); // 0, 90, 180, 270
  readonly panX = signal<number>(0);
  readonly panY = signal<number>(0);
  readonly activeAspectRatio = signal<{ label: string; ratio: number }>({
    label: 'Wide (2.4:1)',
    ratio: 2.4
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

  ngAfterViewInit(): void {
    // If there's an existing banner and no new image, we keep it as reference
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
    this.zoom.set(Math.min(3.0, Math.max(1.0, value)));
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
    // Estimated compressed JPEG size: ~40KB - 85KB
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
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const viewportEl = this.cropViewportRef?.nativeElement;
      const viewportWidth = viewportEl?.clientWidth || 500;
      const viewportHeight = viewportEl?.clientHeight || (500 / ratio);
      const scaleFactor = canvas.width / viewportWidth;

      // Base cover scale calculation
      const rot = this.rotation();
      const isRotated90or270 = rot === 90 || rot === 270;
      const effImgW = isRotated90or270 ? this.loadedImg.naturalHeight : this.loadedImg.naturalWidth;
      const effImgH = isRotated90or270 ? this.loadedImg.naturalWidth : this.loadedImg.naturalHeight;

      const baseCoverScale = Math.max(viewportWidth / effImgW, viewportHeight / effImgH);
      const totalScale = baseCoverScale * this.zoom();

      ctx.save();
      // Translate to canvas center + pan offset
      ctx.translate(
        canvas.width / 2 + this.panX() * scaleFactor,
        canvas.height / 2 + this.panY() * scaleFactor
      );
      ctx.rotate((rot * Math.PI) / 180);

      const drawW = this.loadedImg.naturalWidth * totalScale * scaleFactor;
      const drawH = this.loadedImg.naturalHeight * totalScale * scaleFactor;

      ctx.drawImage(this.loadedImg, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Compress to JPEG with quality 0.8
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
