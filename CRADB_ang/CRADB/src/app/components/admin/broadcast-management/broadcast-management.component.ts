import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BroadcastService, BroadcastResponse, SendBroadcastDto } from '../../../services/broadcast.service';
import { DepartmentResponse } from '../../../services/department.service';
import { LocationResponse } from '../../../services/location.service';
import { DashboardService } from '../../../services/dashboard.service';
import { UserService } from '../../../services/user.service';
import Toastify from 'toastify-js';

import { SidebarComponent } from '../../layout/sidebar/sidebar.component';

@Component({
  selector: 'app-broadcast-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './broadcast-management.component.html',
  styleUrls: ['./broadcast-management.component.css']
})
export class BroadcastManagementComponent implements OnInit {
  broadcasts: BroadcastResponse[] = [];
  filteredBroadcasts: BroadcastResponse[] = [];
  departments: DepartmentResponse[] = [];
  locations: LocationResponse[] = [];
  targetData: any[] = [];
  broadcastForm: FormGroup;
  showCreateForm = false;
  editingBroadcast: BroadcastResponse | null = null;
  loading = false;
  saving = false;
  searchTerm = '';
  selectedLocationId: number | null = null;
  selectedDepartmentId: number | null = null;
  showDeleteModal = false;
  itemToDelete: BroadcastResponse | null = null;

  constructor(
    private broadcastService: BroadcastService,
    private dashboardService: DashboardService,
    private userService: UserService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.broadcastForm = this.fb.group({
      title: ['', Validators.required],
      message: ['', Validators.required],
      type: [1, Validators.required],
      targetType: [''],
      targetId: [null]
    });
  }

  ngOnInit(): void {
    this.loadNotificationPageData();
  }

  loadNotificationPageData(): void {
    this.loading = true;
    this.broadcasts = [];
    this.filteredBroadcasts = [];
    this.cdr.detectChanges();

    this.dashboardService.getNotificationPageData().subscribe({
      next: (data: any) => {
        this.broadcasts = data.Notifications || [];
        this.locations = data.Locations || [];
        this.filteredBroadcasts = [...this.broadcasts];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading notification page data:', error);
        this.broadcasts = [];
        this.filteredBroadcasts = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadBroadcasts(): void {
    this.broadcastService.getAllBroadcasts().subscribe({
      next: (broadcasts: BroadcastResponse[]) => {
        this.broadcasts = broadcasts || [];
        this.filteredBroadcasts = [...this.broadcasts];
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading broadcasts:', error);
      }
    });
  }

  onSearch(event: any): void {
    this.searchTerm = event.target.value.toLowerCase();
    this.applyFilters();
  }

  onLocationFilter(event: any): void {
    this.selectedLocationId = event.target.value ? Number(event.target.value) : null;
    this.applyFilters();
  }

  onDepartmentFilter(event: any): void {
    this.selectedDepartmentId = event.target.value ? Number(event.target.value) : null;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredBroadcasts = this.broadcasts.filter(broadcast => {
      const matchesSearch = !this.searchTerm ||
        broadcast.Title.toLowerCase().includes(this.searchTerm) ||
        broadcast.Message.toLowerCase().includes(this.searchTerm);

      const matchesLocation = !this.selectedLocationId ||
        broadcast.TargetLocationId === this.selectedLocationId;

      const matchesDepartment = !this.selectedDepartmentId ||
        broadcast.TargetDepartmentId === this.selectedDepartmentId;

      return matchesSearch && matchesLocation && matchesDepartment;
    });
    this.cdr.detectChanges();
  }



  saveBroadcast(): void {
    if (this.broadcastForm.invalid) return;

    this.saving = true;
    const formValue = this.broadcastForm.value;
    const broadcastData: SendBroadcastDto = {
      Title: formValue.title,
      Message: formValue.message,
      Type: formValue.type
    };

    if (formValue.targetType === 'location' && formValue.targetId) {
      broadcastData.TargetLocationId = formValue.targetId;
    } else if (formValue.targetType === 'department' && formValue.targetId) {
      broadcastData.TargetDepartmentId = formValue.targetId;
    } else if (formValue.targetType === 'role' && formValue.targetId) {
      broadcastData.TargetRole = formValue.targetId;
    }

    this.broadcastService.createBroadcast(broadcastData).subscribe({
      next: () => {
        this.loadBroadcasts();
        this.cancelEdit();
        this.saving = false;
        Toastify({
          text: "Broadcast notification sent successfully to all users!",
          duration: 3000,
          backgroundColor: "#10b981"
        }).showToast();
      },
      error: (error: any) => {
        console.error('Error sending broadcast:', error);
        Toastify({
          text: "Failed to send broadcast notification. Please try again.",
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
        this.saving = false;
      }
    });
  }

  editBroadcast(broadcast: BroadcastResponse): void {
    this.editingBroadcast = broadcast;
    this.broadcastForm.patchValue({
      title: broadcast.Title,
      message: broadcast.Message,
      type: broadcast.Type,
      targetType: this.getTargetType(broadcast),
      targetId: broadcast.TargetLocationId || broadcast.TargetDepartmentId || broadcast.TargetRole
    });
    this.onTargetTypeChange();
    this.showCreateForm = true;
  }

  confirmDelete(broadcast: BroadcastResponse): void {
    this.itemToDelete = broadcast;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.itemToDelete = null;
  }

  deleteConfirmed(): void {
    if (this.itemToDelete) {
      this.broadcastService.deleteBroadcast(this.itemToDelete.Id).subscribe({
        next: () => {
          this.loadBroadcasts();
          this.showDeleteModal = false;
          this.itemToDelete = null;
          Toastify({
            text: "Broadcast deleted successfully!",
            duration: 3000,
            backgroundColor: "#10b981"
          }).showToast();
        },
        error: (error) => {
          console.error('Error deleting broadcast:', error);
          Toastify({
            text: "Failed to delete broadcast. Please try again.",
            duration: 3000,
            backgroundColor: "#ef4444"
          }).showToast();
        }
      });
    }
  }

  processPendingBroadcasts(): void {
    this.broadcastService.processPendingBroadcasts().subscribe({
      next: () => {
        this.loadBroadcasts();
      },
      error: (error) => {
        console.error('Error processing broadcasts:', error);
      }
    });
  }

  onTargetTypeChange(): void {
    const targetType = this.broadcastForm.get('targetType')?.value;
    this.broadcastForm.patchValue({ targetId: null });

    switch (targetType) {
      case 'role':
        this.targetData = [
          { id: 1, name: 'Admin' },
          { id: 2, name: 'User' }
        ];
        break;
      case 'location':
        this.targetData = this.locations.map(loc => ({ id: loc.LocationId, name: loc.Name }));
        break;
      case 'department':
        this.targetData = this.departments.map(dept => ({ id: dept.DepartmentId, name: dept.DepartmentName }));
        break;
      default:
        this.targetData = [];
    }
  }

  toggleForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (this.showCreateForm) {
      this.broadcastForm.reset({ type: 1, targetType: '' });
    }
  }

  canEditBroadcast(broadcast: BroadcastResponse): boolean {
    return broadcast.Status === '0' || broadcast.Status === 'Pending';
  }

  cancelEdit(): void {
    this.showCreateForm = false;
    this.editingBroadcast = null;
    this.broadcastForm.reset();
  }

  formatDateTime(dateTime: string): string {
    return dateTime ? new Date(dateTime).toLocaleString() : 'Not scheduled';
  }

  getTargetType(broadcast: BroadcastResponse): string {
    if (broadcast.TargetRole !== null && broadcast.TargetRole !== undefined) return 'role';
    if (broadcast.TargetLocationId !== null && broadcast.TargetLocationId !== undefined) return 'location';
    if (broadcast.TargetDepartmentId !== null && broadcast.TargetDepartmentId !== undefined) return 'department';
    return '';
  }

  getTargetAudience(broadcast: BroadcastResponse): string {
    if (broadcast.TargetRole !== null && broadcast.TargetRole !== undefined) {
      return broadcast.TargetRole === '1' || broadcast.TargetRole === 'Admin' ? 'Admin' : 'User';
    }
    if (broadcast.TargetLocationId !== null && broadcast.TargetLocationId !== undefined) {
      const location = this.locations.find(l => l.LocationId === broadcast.TargetLocationId);
      return location?.Name || `Location ${broadcast.TargetLocationId}`;
    }
    if (broadcast.TargetDepartmentId !== null && broadcast.TargetDepartmentId !== undefined) {
      const department = this.departments.find(d => d.DepartmentId === broadcast.TargetDepartmentId);
      return department?.DepartmentName || `Department ${broadcast.TargetDepartmentId}`;
    }
    return 'All Users';
  }

  getStatusText(status: string | number): string {
    const statusStr = status.toString();
    switch (statusStr) {
      case '0':
      case 'Pending': return 'Pending';
      case '1':
      case 'Sent': return 'Sent';
      case '2':
      case 'Failed': return 'Failed';
      default: return 'Unknown';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  getTargetLabel(): string {
    const targetType = this.broadcastForm.get('targetType')?.value;
    switch (targetType) {
      case 'location': return 'Location';
      case 'department': return 'Department';
      case 'role': return 'Role';
      default: return 'Target';
    }
  }
}