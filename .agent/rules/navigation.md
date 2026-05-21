---
glob: ["**/*.component.ts"]
description: "Guidelines for overlays and PWA navigation: Always use PwaNavigationService instead of MatBottomSheet"
---

# PWA Navigation & Overlays Rule

When opening bottom sheets in components, always use `PwaNavigationService` instead of `MatBottomSheet` directly. This ensures proper integration with the PWA hardware back button and history stack management.

## Guidelines

- **Do NOT inject `MatBottomSheet`**: Always inject `PwaNavigationService` instead.
- **Do NOT call `bottomSheet.open()`**: Always call `pwaNavigationService.openBottomSheet()`.
- **Automatic Dialog Tracking**: Note that `MatDialog` is automatically tracked globally by `PwaNavigationService`, so standard `MatDialog.open()` remains fine.

## Examples

### Correct:
```typescript
import { PwaNavigationService } from 'src/app/util/service/pwa-navigation.service';

export class MyComponent {
  private pwaNavigationService = inject(PwaNavigationService);

  openSheet() {
    this.pwaNavigationService.openBottomSheet(MyBottomSheetComponent, {
      data: { ... }
    });
  }
}
```

### Incorrect:
```typescript
import { MatBottomSheet } from '@angular/material/bottom-sheet';

export class MyComponent {
  private bottomSheet = inject(MatBottomSheet);

  openSheet() {
    this.bottomSheet.open(MyBottomSheetComponent, {
      data: { ... }
    });
  }
}
```
