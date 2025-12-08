import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { DeskService } from '../../../services/desk.service';
import { DeskResponse } from '../../../models/desk.models';
import { ResourceService, MaintenanceStatusDto, BlockResourceDto } from '../../../services/resource.service';
import { AuthService } from '../../../services/auth.service';
import { AuthResponse } from '../../../models/auth.models';
import Toastify from 'toastify-js';

@Component({
  selector: 'app-desks',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './desks.component.html',
  styleUrls: ['./desks.component.css']
})
export class DesksComponent implements OnInit {
  desks: DeskResponse[] = [];
  filteredDesks: DeskResponse[] = [];
  loading = false;
  currentUser: AuthResponse | null = null;
  showProfileDropdown = false;
  editingDesk: DeskResponse | null = null;
  deskForm: FormGroup;
  saving = false;
  searchTerm = '';
  statusFilter = '';
  selectedFile: File | null = null;

  // Modal states
  showDeleteModal = false;
  showBlockModal = false;
  itemToDelete: DeskResponse | null = null;
  itemToBlock: DeskResponse | null = null;
  blockReason = '';

  constructor(
    private deskService: DeskService,
    private resourceService: ResourceService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.deskForm = this.fb.group({
      deskName: ['', Validators.required],
      hasMonitor: [false],
      hasKeyboard: [false],
      hasMouse: [false],
      hasDockingStation: [false]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDesks();
  }

  loadDesks(): void {
    this.loading = true;
    this.deskService.getAllDesks().subscribe({
      next: (desks: DeskResponse[]) => {
        this.desks = desks || [];
        this.filteredDesks = [...this.desks];
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading desks:', error);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.desks];

    if (this.searchTerm) {
      filtered = filtered.filter(desk =>
        desk.DeskName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        desk.LocationName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        desk.BuildingName?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    if (this.statusFilter === 'available') {
      filtered = filtered.filter(d => !d.IsBlocked && !d.IsUnderMaintenance);
    } else if (this.statusFilter === 'maintenance') {
      filtered = filtered.filter(d => d.IsUnderMaintenance);
    } else if (this.statusFilter === 'blocked') {
      filtered = filtered.filter(d => d.IsBlocked);
    }

    this.filteredDesks = filtered;
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
    if (typeof imageData === 'string') {
      if (imageData.startsWith('data:image')) {
        return imageData;
      }
      return `data:image/jpeg;base64,${imageData}`;
    }
    return '';
  }

  getDeskStatus(desk: DeskResponse): string {
    if (desk.IsBlocked) return 'Blocked';
    if (desk.IsUnderMaintenance) return 'Maintenance';
    return 'Available';
  }

  getDeskStatusClass(desk: DeskResponse): string {
    if (desk.IsBlocked) return 'badge-danger';
    if (desk.IsUnderMaintenance) return 'badge-warning';
    return 'badge-success';
  }

  toggleMaintenance(desk: DeskResponse): void {
    const dto: MaintenanceStatusDto = {
      IsUnderMaintenance: !desk.IsUnderMaintenance
    };

    this.resourceService.updateMaintenanceStatus(desk.ResourceId, dto).subscribe({
      next: () => {
        this.loadDesks();
        Toastify({
          text: desk.IsUnderMaintenance ? "Maintenance ended" : "Desk marked for maintenance",
          duration: 3000,
          backgroundColor: "#10b981"
        }).showToast();
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

  toggleBlock(desk: DeskResponse): void {
    if (desk.IsBlocked) {
      this.resourceService.unblockResource(desk.ResourceId).subscribe({
        next: () => {
          this.loadDesks();
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
      this.itemToBlock = desk;
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
        this.loadDesks();
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

  editDesk(desk: DeskResponse): void {
    this.editingDesk = desk;
    this.deskForm.patchValue({
      deskName: desk.DeskName,
      hasMonitor: desk.HasMonitor,
      hasKeyboard: desk.HasKeyboard,
      hasMouse: desk.HasMouse,
      hasDockingStation: desk.HasDockingStation
    });
  }

  cancelEdit(): void {
    this.editingDesk = null;
    this.selectedFile = null;
    this.deskForm.reset();
  }

  onDeskImageChange(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  saveDesk(): void {
    if (this.deskForm.invalid || !this.editingDesk) return;

    this.saving = true;

    // Create FormData to match backend [FromForm] expectation
    const formData = new FormData();
    formData.append('DeskName', this.deskForm.value.deskName);
    formData.append('HasMonitor', this.deskForm.value.hasMonitor ? 'true' : 'false');
    formData.append('HasKeyboard', this.deskForm.value.hasKeyboard ? 'true' : 'false');
    formData.append('HasMouse', this.deskForm.value.hasMouse ? 'true' : 'false');
    formData.append('HasDockingStation', this.deskForm.value.hasDockingStation ? 'true' : 'false');

    if (this.selectedFile) {
      formData.append('DeskImage', this.selectedFile);
    }

    this.deskService.updateDeskWithFormData(this.editingDesk.Id, formData).subscribe({
      next: () => {
        this.saving = false;
        this.cancelEdit();
        this.loadDesks();
      },
      error: (error) => {
        console.error('Error updating desk:', error);
        this.saving = false;
      }
    });
  }

  deleteDesk(desk: DeskResponse): void {
    this.itemToDelete = desk;
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
        this.loadDesks();
        this.showDeleteModal = false;
        this.itemToDelete = null;
        Toastify({
          text: "Desk deleted successfully!",
          duration: 3000,
          backgroundColor: "#10b981"
        }).showToast();
      },
      error: (error) => {
        console.error('Error deleting desk:', error);
        Toastify({
          text: "Failed to delete desk. Please try again.",
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
      }
    });
  }
}