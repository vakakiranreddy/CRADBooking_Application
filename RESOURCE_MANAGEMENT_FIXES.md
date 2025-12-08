# Resource Management Fixes

## Issues Fixed

### 1. Resource Selection Bug
**Problem**: When selecting a resource, all resources were being selected instead of just one.

**Root Cause**: Inconsistent property usage - using `ResourceId` in the template but `Id` in the component.

**Fix**: Updated the template to use `resource.Id` consistently:
```html
<!-- Before -->
[ngClass]="{'active': selectedResource?.ResourceId === resource.ResourceId}"

<!-- After -->
[ngClass]="{'active': selectedResource?.Id === resource.Id}"
```

### 2. Resource Type Filtering
**Problem**: Both "Add Room Details" and "Add Desk Details" buttons were showing for all resource types.

**Root Cause**: No conditional rendering based on resource type.

**Fix**: Added conditional rendering to show only the appropriate button:
```html
@if (isRoomType(selectedResource.ResourceType)) {
  <button>Edit Room Details</button>
}
@if (isDeskType(selectedResource.ResourceType)) {
  <button>Edit Desk Details</button>
}
```

### 3. Image Upload Support
**Problem**: No image upload functionality for rooms and desks, even though backend DTOs support it.

**Backend DTOs**:
- `CreateRoomDto.cs`: Has `IFormFile? RoomImage` property
- `UpdateRoomDto.cs`: Has `IFormFile? RoomImage` property
- `CreateDeskDto.cs`: Has `byte[]? DeskImage` property
- `UpdateDeskDto.cs`: No image property (needs backend update)

**Frontend Changes**:

#### HTML Template Updates
Added file input fields for both room and desk forms:
```html
<!-- Room Form -->
<div class="mb-3">
  <label class="form-label">Room Image</label>
  <input type="file" class="form-control" (change)="onRoomImageChange($event)" accept="image/*">
  <small class="text-muted">Upload an image for this room</small>
</div>

<!-- Desk Form -->
<div class="mb-3">
  <label class="form-label">Desk Image</label>
  <input type="file" class="form-control" (change)="onDeskImageChange($event)" accept="image/*">
  <small class="text-muted">Upload an image for this desk</small>
</div>
```

#### TypeScript Component Updates
1. Added file storage properties:
```typescript
roomImageFile: File | null = null;
deskImageFile: File | null = null;
```

2. Added file change handlers:
```typescript
onRoomImageChange(event: any): void {
  const file = event.target.files[0];
  if (file) {
    this.roomImageFile = file;
  }
}

onDeskImageChange(event: any): void {
  const file = event.target.files[0];
  if (file) {
    this.deskImageFile = file;
  }
}
```

3. Updated save methods to use FormData:
```typescript
saveRoom(): void {
  const formData = new FormData();
  formData.append('ResourceId', this.selectedResource.Id.toString());
  formData.append('RoomName', this.roomForm.value.roomName);
  // ... other fields
  if (this.roomImageFile) {
    formData.append('RoomImage', this.roomImageFile);
  }
  this.roomService.createRoomWithFormData(formData).subscribe(...);
}

saveDesk(): void {
  const formData = new FormData();
  formData.append('ResourceId', this.selectedResource.Id.toString());
  formData.append('DeskName', this.deskForm.value.deskName);
  // ... other fields
  if (this.deskImageFile) {
    formData.append('DeskImage', this.deskImageFile);
  }
  this.deskService.createDeskWithFormData(formData).subscribe(...);
}
```

#### Service Updates

**room.service.ts**:
```typescript
createRoomWithFormData(formData: FormData): Observable<RoomResponse> {
  return this.http.post<RoomResponse>(this.apiUrl, formData);
}
```

**desk.service.ts**:
```typescript
createDeskWithFormData(formData: FormData): Observable<DeskResponse> {
  return this.http.post<DeskResponse>(`${this.apiUrl}/desk`, formData);
}
```

## Testing Checklist

- [x] Build succeeds without errors
- [ ] Resource selection works correctly (only one resource selected at a time)
- [ ] Room type resources show only "Edit Room Details" button
- [ ] Desk type resources show only "Edit Desk Details" button
- [ ] Room form includes image upload field
- [ ] Desk form includes image upload field
- [ ] Image files are properly sent to backend
- [ ] Backend accepts and stores images correctly

## Notes

1. The backend `UpdateDeskDto.cs` doesn't have an image property. Consider adding it for consistency:
```csharp
public IFormFile? DeskImage { get; set; }
```

2. Image preview functionality could be added as an enhancement.

3. Consider adding image validation (file size, type) on the frontend.

4. The backend should handle image storage (file system or cloud storage like S3).
