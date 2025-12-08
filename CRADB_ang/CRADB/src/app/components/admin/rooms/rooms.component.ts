import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { RoomService } from '../../../services/room.service';
import { RoomResponse } from '../../../models/room.models';
import { ResourceService, MaintenanceStatusDto, BlockResourceDto } from '../../../services/resource.service';
import { AuthService } from '../../../services/auth.service';
import { AuthResponse } from '../../../models/auth.models';
import Toastify from 'toastify-js';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, SidebarComponent],
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.css']
})
export class RoomsComponent implements OnInit {
  rooms: RoomResponse[] = [];
  filteredRooms: RoomResponse[] = [];
  loading = false;
  currentUser: AuthResponse | null = null;
  showProfileDropdown = false;
  editingRoom: RoomResponse | null = null;
  roomForm: FormGroup;
  saving = false;
  selectedFile: File | null = null;
  searchTerm = '';
  statusFilter = '';

  // Modal states
  showDeleteModal = false;
  showBlockModal = false;
  itemToDelete: RoomResponse | null = null;
  itemToBlock: RoomResponse | null = null;
  blockReason = '';

  constructor(
    private roomService: RoomService,
    private resourceService: ResourceService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.roomForm = this.fb.group({
      roomName: ['', Validators.required],
      capacity: [1, [Validators.required, Validators.min(1)]],
      hasTV: [false],
      hasWhiteboard: [false],
      hasWiFi: [false],
      hasProjector: [false],
      hasVideoConference: [false],
      hasAirConditioning: [false],
      phoneExtension: ['']
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadRooms();
  }

  loadRooms(): void {
    this.loading = true;
    this.roomService.getAllRooms().subscribe({
      next: (rooms: RoomResponse[]) => {
        this.rooms = rooms || [];
        this.filteredRooms = [...this.rooms];
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading rooms:', error);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.rooms];

    if (this.searchTerm) {
      filtered = filtered.filter(room =>
        room.RoomName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        room.LocationName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        room.BuildingName?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    if (this.statusFilter === 'available') {
      filtered = filtered.filter(r => !r.IsBlocked && !r.IsUnderMaintenance);
    } else if (this.statusFilter === 'maintenance') {
      filtered = filtered.filter(r => r.IsUnderMaintenance);
    } else if (this.statusFilter === 'blocked') {
      filtered = filtered.filter(r => r.IsBlocked);
    }

    this.filteredRooms = filtered;
  }

  getRoomStatus(room: RoomResponse): string {
    if (room.IsBlocked) return 'Blocked';
    if (room.IsUnderMaintenance) return 'Maintenance';
    return 'Available';
  }

  getRoomStatusClass(room: RoomResponse): string {
    if (room.IsBlocked) return 'badge bg-danger';
    if (room.IsUnderMaintenance) return 'badge bg-warning';
    return 'badge bg-success';
  }

  toggleMaintenance(room: RoomResponse): void {
    const dto: MaintenanceStatusDto = {
      IsUnderMaintenance: !room.IsUnderMaintenance
    };

    this.resourceService.updateMaintenanceStatus(room.ResourceId, dto).subscribe({
      next: () => {
        this.loadRooms();
      },
      error: (error) => {
        console.error('Error toggling maintenance:', error);
        Toastify({
          text: "Failed to update maintenance status. Please try again.",
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
      }
    });
  }

  toggleBlock(room: RoomResponse): void {
    if (room.IsBlocked) {
      this.resourceService.unblockResource(room.ResourceId).subscribe({
        next: () => {
          this.loadRooms();
          Toastify({
            text: "Resource unblocked successfully!",
            duration: 3000,
            backgroundColor: "#10b981"
          }).showToast();
        },
        error: (error) => {
          console.error('Error unblocking resource:', error);
          Toastify({
            text: "Failed to unblock resource. Please try again.",
            duration: 3000,
            backgroundColor: "#ef4444"
          }).showToast();
        }
      });
    } else {
      this.itemToBlock = room;
      this.blockReason = '';
      this.showBlockModal = true;
    }
  }

  cancelBlock(): void {
    this.showBlockModal = false;
    this.itemToBlock = null;
    this.blockReason = '';
  }

  blockConfirmed(): void {
    if (!this.itemToBlock) return;

    const dto: BlockResourceDto = {
      BlockReason: this.blockReason || undefined
    };

    this.resourceService.blockResource(this.itemToBlock.ResourceId, dto).subscribe({
      next: () => {
        this.loadRooms();
        this.showBlockModal = false;
        this.itemToBlock = null;
        Toastify({
          text: "Resource blocked successfully!",
          duration: 3000,
          backgroundColor: "#10b981"
        }).showToast();
      },
      error: (error) => {
        console.error('Error blocking resource:', error);
        Toastify({
          text: "Failed to block resource. Please try again.",
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
      }
    });
  }

  editRoom(room: RoomResponse): void {
    this.editingRoom = room;
    this.roomForm.patchValue({
      roomName: room.RoomName,
      capacity: room.Capacity,
      hasTV: room.HasTV,
      hasWhiteboard: room.HasWhiteboard,
      hasWiFi: room.HasWiFi,
      hasProjector: room.HasProjector,
      hasVideoConference: room.HasVideoConference,
      hasAirConditioning: room.HasAirConditioning,
      phoneExtension: room.PhoneExtension || ''
    });
  }

  cancelEdit(): void {
    this.editingRoom = null;
    this.selectedFile = null;
    this.roomForm.reset();
  }

  onRoomImageChange(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  saveRoom(): void {
    if (this.roomForm.invalid || !this.editingRoom) return;

    this.saving = true;
    const formData = new FormData();
    formData.append('RoomName', this.roomForm.value.roomName);
    formData.append('Capacity', this.roomForm.value.capacity.toString());
    formData.append('HasTV', this.roomForm.value.hasTV.toString());
    formData.append('HasWhiteboard', this.roomForm.value.hasWhiteboard.toString());
    formData.append('HasWiFi', this.roomForm.value.hasWiFi.toString());
    formData.append('HasProjector', this.roomForm.value.hasProjector.toString());
    formData.append('HasVideoConference', this.roomForm.value.hasVideoConference.toString());
    formData.append('HasAirConditioning', this.roomForm.value.hasAirConditioning.toString());
    formData.append('PhoneExtension', this.roomForm.value.phoneExtension || '');

    if (this.selectedFile) {
      formData.append('RoomImage', this.selectedFile);
    }

    this.roomService.updateRoomWithFormData(this.editingRoom.RoomId, formData).subscribe({
      next: () => {
        this.saving = false;
        this.cancelEdit();
        this.loadRooms();
      },
      error: (error) => {
        console.error('Error updating room:', error);
        this.saving = false;
      }
    });
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'AD';
    const firstInitial = this.currentUser.FirstName?.charAt(0) || '';
    const lastInitial = this.currentUser.LastName?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase() || 'AD';
  }

  getUserRole(): string {
    return this.currentUser?.Role || 'Admin';
  }

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getImageUrl(imageData: any): string {
    if (!imageData) return '';
    // Backend returns base64 string directly
    if (typeof imageData === 'string') {
      // If it already has data:image prefix, return as is
      if (imageData.startsWith('data:image')) {
        return imageData;
      }
      // Otherwise add the prefix
      return `data: image / jpeg; base64, ${imageData} `;
    }
    return '';
  }

  deleteRoom(room: RoomResponse): void {
    this.itemToDelete = room;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.itemToDelete = null;
  }

  deleteConfirmed(): void {
    if (!this.itemToDelete) return;

    this.resourceService.deleteResource(this.itemToDelete.ResourceId).subscribe({
      next: () => {
        this.loadRooms();
        this.showDeleteModal = false;
        this.itemToDelete = null;
        Toastify({
          text: "Room deleted successfully!",
          duration: 3000,
          backgroundColor: "#10b981"
        }).showToast();
      },
      error: (error) => {
        console.error('Error deleting room:', error);
        Toastify({
          text: "Failed to delete room. Please try again.",
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
      }
    });
  }
}