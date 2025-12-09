import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import Toastify from 'toastify-js';
import { ResourceService, ResourceResponse } from '../../../services/resource.service';
import { RoomService } from '../../../services/room.service';
import { DeskService } from '../../../services/desk.service';
import { CreateDeskDto } from '../../../models/desk.models';
import { CreateRoomDto } from '../../../models/room.models';
import { LocationResponse } from '../../../services/location.service';
import { DashboardService } from '../../../services/dashboard.service';
import { BuildingService, BuildingResponse } from '../../../services/building.service';
import { FloorService, FloorResponse } from '../../../services/floor.service';

import { AuthService } from '../../../services/auth.service';
import { AuthResponse } from '../../../models/auth.models';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.css']
})
export class ResourcesComponent implements OnInit {
  resources: ResourceResponse[] = [];
  filteredResources: ResourceResponse[] = [];
  paginatedResources: ResourceResponse[] = [];
  locations: LocationResponse[] = [];
  buildings: BuildingResponse[] = [];
  floors: FloorResponse[] = [];
  selectedLocationFilter = '';
  
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  selectedResource: ResourceResponse | null = null;

  resourceForm: FormGroup;
  roomForm: FormGroup;
  deskForm: FormGroup;

  showResourceForm = false;
  showRoomForm = false;
  showDeskForm = false;

  loading = false;
  saving = false;
  currentUser: AuthResponse | null = null;
  showProfileDropdown = false;

  roomImageFile: File | null = null;
  deskImageFile: File | null = null;

  constructor(
    private resourceService: ResourceService,
    private roomService: RoomService,
    private deskService: DeskService,
    private dashboardService: DashboardService,
    private buildingService: BuildingService,
    private floorService: FloorService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.resourceForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      buildingId: ['', Validators.required],
      floorId: ['', Validators.required]
    });

    this.roomForm = this.fb.group({
      roomName: ['', Validators.required],
      capacity: [1, [Validators.required, Validators.min(1)]],
      hasTV: [false],
      hasWhiteboard: [false],
      hasWiFi: [true],
      hasProjector: [false],
      hasVideoConference: [false],
      hasAirConditioning: [true],
      phoneExtension: ['']
    });

    this.deskForm = this.fb.group({
      deskName: ['', Validators.required],
      deskType: ['Standard', Validators.required],
      hasMonitor: [false],
      hasKeyboard: [false],
      hasMouse: [false],
      hasHeadset: [false],
      hasWebcam: [false],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadResourcePageData();
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

  loadResourcePageData(): void {
    this.loading = true;
    this.dashboardService.getResourcePageData().subscribe({
      next: (data: any) => {
        this.resources = data.Resources || [];
        this.filteredResources = [...this.resources];
        this.locations = data.Locations || [];
        this.updatePagination();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading resource page data:', error);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterByLocation(): void {
    if (this.selectedLocationFilter) {
      const selectedLocation = this.locations.find(l => l.LocationId == parseInt(this.selectedLocationFilter));
      if (selectedLocation) {
        this.filteredResources = this.resources.filter(r => r.LocationName === selectedLocation.Name);
      }
    } else {
      this.filteredResources = [...this.resources];
    }
    this.currentPage = 1;
    this.updatePagination();
    this.cdr.detectChanges();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredResources.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedResources = this.filteredResources.slice(startIndex, endIndex);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  loadResources(): void {
    this.resourceService.getAllResources().subscribe({
      next: (resources: ResourceResponse[]) => {
        this.resources = resources || [];
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading resources:', error);
      }
    });
  }

  onLocationChange(event: any): void {
    const locationId = event.target.value;
    if (locationId) {
      this.buildingService.getBuildingsByLocation(parseInt(locationId)).subscribe({
        next: (buildings: BuildingResponse[]) => {
          this.buildings = buildings || [];
          this.floors = [];
          this.resourceForm.patchValue({ buildingId: '', floorId: '' });
          this.cdr.detectChanges();
        }
      });
    } else {
      this.buildings = [];
      this.floors = [];
    }
  }

  onBuildingChange(): void {
    const buildingId = this.resourceForm.get('buildingId')?.value;
    if (buildingId) {
      this.floorService.getFloorsByBuilding(buildingId).subscribe({
        next: (floors: FloorResponse[]) => {
          this.floors = floors || [];
          this.resourceForm.patchValue({ floorId: '' });
          this.cdr.detectChanges();
        }
      });
    }
  }

  selectResource(resource: ResourceResponse): void {
    this.selectedResource = resource;
    
    // Scroll to details panel
    setTimeout(() => {
      const detailsPanel = document.querySelector('.col-md-6:last-child');
      if (detailsPanel) {
        detailsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    // Check if room/desk exists for this resource and load data
    if (this.isRoomType(resource.ResourceType)) {
      this.roomService.getRoomByResourceId(resource.Id)
        .pipe(
          catchError(() => of(null)) // Return null if 404 (room doesn't exist yet)
        )
        .subscribe({
          next: (room) => {
            if (room) {
              // Room exists, populate form for editing
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
          },
          error: () => {
            // This should never happen now due to catchError
            // Room doesn't exist yet, keep form empty
          }
        });
    } else if (this.isDeskType(resource.ResourceType)) {
      this.deskService.getDeskByResourceId(resource.Id)
        .pipe(
          catchError(() => of(null)) // Return null if 404 (desk doesn't exist yet)
        )
        .subscribe({
          next: (desk) => {
            if (desk) {
              // Desk exists, populate form for editing
              this.deskForm.patchValue({
                deskName: desk.DeskName,
                hasMonitor: desk.HasMonitor,
                hasKeyboard: desk.HasKeyboard,
                hasMouse: desk.HasMouse
              });
            }
          },
          error: () => {
            // This should never happen now due to catchError
            // Desk doesn't exist yet, keep form empty
          }
        });
    }

    this.cdr.detectChanges();
  }

  saveResource(): void {
    if (this.resourceForm.invalid) return;

    this.saving = true;
    const resourceData = {
      Name: this.resourceForm.value.name,
      ResourceType: parseInt(this.resourceForm.value.type),
      BuildingId: parseInt(this.resourceForm.value.buildingId),
      FloorId: parseInt(this.resourceForm.value.floorId),
      IsUnderMaintenance: false
    };

    this.resourceService.createResource(resourceData).subscribe({
      next: () => {
        this.loadResources();
        this.cancelResourceForm();
        this.saving = false;
      },
      error: (error: any) => {
        console.error('Error saving resource:', error);
        this.saving = false;
      }
    });
  }

  saveRoom(): void {
    if (this.roomForm.invalid || !this.selectedResource) {
      Toastify({
        text: "Please fill in all required fields",
        duration: 3000,
        backgroundColor: "#f59e0b"
      }).showToast();
      return;
    }

    this.saving = true;

    // Check if room exists to determine POST or PUT
    // Use catchError to handle 404 gracefully (room doesn't exist yet)
    this.roomService.getRoomByResourceId(this.selectedResource.Id)
      .pipe(
        catchError(() => of(null)) // Return null if 404 (room doesn't exist)
      )
      .subscribe({
        next: (existingRoom) => {
          const formData = new FormData();

          if (!existingRoom) {
            // CREATE - POST
            formData.append('ResourceId', this.selectedResource!.Id.toString());
          }

          formData.append('RoomName', this.roomForm.value.roomName.trim());
          formData.append('Capacity', this.roomForm.value.capacity.toString());
          formData.append('HasTV', this.roomForm.value.hasTV ? 'true' : 'false');
          formData.append('HasWhiteboard', this.roomForm.value.hasWhiteboard ? 'true' : 'false');
          formData.append('HasWiFi', this.roomForm.value.hasWiFi ? 'true' : 'false');
          formData.append('HasProjector', this.roomForm.value.hasProjector ? 'true' : 'false');
          formData.append('HasVideoConference', this.roomForm.value.hasVideoConference ? 'true' : 'false');
          formData.append('HasAirConditioning', this.roomForm.value.hasAirConditioning ? 'true' : 'false');

          if (this.roomForm.value.phoneExtension && this.roomForm.value.phoneExtension.trim()) {
            formData.append('PhoneExtension', this.roomForm.value.phoneExtension.trim());
          }

          if (this.roomImageFile) {
            formData.append('RoomImage', this.roomImageFile, this.roomImageFile.name);
          }

          const request = existingRoom
            ? this.roomService.updateRoomWithFormData(existingRoom.RoomId, formData)
            : this.roomService.createRoomWithFormData(formData);

          request.subscribe({
            next: () => {
              Toastify({
                text: existingRoom ? 'Room details updated successfully!' : 'Room created successfully!',
                duration: 3000,
                backgroundColor: "#10b981"
              }).showToast();
              this.loadResources();
              this.cancelRoomForm();
              this.saving = false;
            },
            error: (error: any) => {
              console.error('Full error:', error);
              let errorMsg = existingRoom ? 'Failed to update room. ' : 'Failed to create room. ';
              if (error.error?.message) {
                errorMsg += error.error.message;
              }
              Toastify({
                text: "Unable to save room details. Please check your input and try again.",
                duration: 4000,
                backgroundColor: "#ef4444"
              }).showToast();
              this.saving = false;
            }
          });
        },
        error: () => {
          // This should never happen now due to catchError
          Toastify({
            text: "Error loading room information. Please refresh and try again.",
            duration: 3000,
            backgroundColor: "#ef4444"
          }).showToast();
          this.saving = false;
        }
      });
  }

  saveDesk(): void {
    if (this.deskForm.invalid || !this.selectedResource) return;

    this.saving = true;

    // Check if desk exists to determine POST or PUT
    // Use catchError to handle 404 gracefully (desk doesn't exist yet)
    this.deskService.getDeskByResourceId(this.selectedResource.Id)
      .pipe(
        catchError(() => of(null)) // Return null if 404 (desk doesn't exist)
      )
      .subscribe({
        next: (existingDesk) => {
          const formData = new FormData();

          if (!existingDesk) {
            // CREATE - POST
            formData.append('ResourceId', this.selectedResource!.Id.toString());
          }

          formData.append('DeskName', this.deskForm.value.deskName);
          formData.append('HasMonitor', this.deskForm.value.hasMonitor ? 'true' : 'false');
          formData.append('HasKeyboard', this.deskForm.value.hasKeyboard ? 'true' : 'false');
          formData.append('HasMouse', this.deskForm.value.hasMouse ? 'true' : 'false');
          formData.append('HasDockingStation', 'false');

          if (this.deskImageFile) {
            formData.append('DeskImage', this.deskImageFile, this.deskImageFile.name);
          }

          const request = existingDesk
            ? this.deskService.updateDeskWithFormData(existingDesk.Id, formData)
            : this.deskService.createDeskWithFormData(formData);

          request.subscribe({
            next: () => {
              Toastify({
                text: existingDesk ? 'Desk details updated successfully!' : 'Desk created successfully!',
                duration: 3000,
                backgroundColor: "#10b981"
              }).showToast();
              this.loadResources();
              this.cancelDeskForm();
              this.saving = false;
            },
            error: (error: any) => {
              console.error('Error saving desk:', error);
              Toastify({
                text: "Unable to save desk details. Please check your input and try again.",
                duration: 4000,
                backgroundColor: "#ef4444"
              }).showToast();
              this.saving = false;
            }
          });
        },
        error: () => {
          // This should never happen now due to catchError
          Toastify({
            text: "Error loading desk information. Please refresh and try again.",
            duration: 3000,
            backgroundColor: "#ef4444"
          }).showToast();
          this.saving = false;
        }
      });
  }

  cancelResourceForm(): void {
    this.showResourceForm = false;
    this.resourceForm.reset();
  }

  cancelRoomForm(): void {
    this.showRoomForm = false;
    this.roomForm.reset();
    this.roomImageFile = null;
  }

  cancelDeskForm(): void {
    this.showDeskForm = false;
    this.deskForm.reset();
    this.deskImageFile = null;
  }

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

  getResourceTypeIcon(resourceType: string): string {
    const typeValue = parseInt(resourceType);
    return typeValue === 1 ? 'fas fa-door-open' : 'fas fa-desktop';
  }

  getResourceTypeText(type: number): string {
    switch (type) {
      case 1: return 'Room';
      case 2: return 'Desk';
      default: return 'Unknown';
    }
  }

  isRoomType(type: any): boolean {
    return type == 1 || type === '1' || type === 'Room';
  }

  isDeskType(type: any): boolean {
    return type == 2 || type === '2' || type === 'Desk';
  }

  scrollToResourceForm(): void {
    setTimeout(() => {
      const formElement = document.querySelector('.card:has(.card-header h6)');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
}