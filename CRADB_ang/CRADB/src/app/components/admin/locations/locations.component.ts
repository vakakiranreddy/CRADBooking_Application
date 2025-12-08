import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { LocationService, LocationResponse } from '../../../services/location.service';
import { BuildingService, BuildingResponse } from '../../../services/building.service';
import { FloorService, FloorResponse } from '../../../services/floor.service';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { AuthService } from '../../../services/auth.service';
import { AuthResponse } from '../../../models/auth.models';
import Toastify from 'toastify-js';

@Component({
  selector: 'app-locations',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SidebarComponent],
  templateUrl: './locations.component.html',
  styleUrls: ['./locations.component.css']
})
export class LocationsComponent implements OnInit {
  locations: LocationResponse[] = [];
  buildings: BuildingResponse[] = [];
  floors: FloorResponse[] = [];

  selectedLocation: LocationResponse | null = null;
  selectedBuilding: BuildingResponse | null = null;

  locationForm: FormGroup;
  buildingForm: FormGroup;
  floorForm: FormGroup;

  showLocationForm = false;
  showBuildingForm = false;
  showFloorForm = false;

  loading = false;
  saving = false;
  currentUser: AuthResponse | null = null;
  showProfileDropdown = false;

  constructor(
    private locationService: LocationService,
    private buildingService: BuildingService,
    private floorService: FloorService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.locationForm = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      country: ['', Validators.required],
      postalCode: ['', Validators.required]
    });

    this.buildingForm = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      floorCount: [1, [Validators.required, Validators.min(1)]]
    });

    this.floorForm = this.fb.group({
      name: ['', Validators.required],
      floorNumber: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadLocations();
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

  loadLocations(): void {
    this.loading = true;
    this.locationService.getAllLocations().subscribe({
      next: (locations: LocationResponse[]) => {
        this.locations = locations || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        Toastify({
          text: "Failed to load locations",
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadBuildings(locationId: number): void {
    this.buildingService.getBuildingsByLocation(locationId).subscribe({
      next: (buildings: BuildingResponse[]) => {
        this.buildings = buildings || [];
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading buildings:', error);
        this.buildings = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadFloors(buildingId: number): void {
    this.floorService.getFloorsByBuilding(buildingId).subscribe({
      next: (floors: FloorResponse[]) => {
        this.floors = floors || [];
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading floors:', error);
        this.floors = [];
        this.cdr.detectChanges();
      }
    });
  }

  selectLocation(location: LocationResponse): void {
    this.selectedLocation = location;
    this.selectedBuilding = null;
    this.floors = [];
    this.loadBuildings(location.LocationId);
  }

  selectBuilding(building: BuildingResponse): void {
    this.selectedBuilding = building;
    this.loadFloors(building.Id);
  }

  saveLocation(): void {
    if (this.locationForm.invalid) return;

    this.saving = true;
    const locationData = {
      Name: this.locationForm.value.name,
      Address: this.locationForm.value.address,
      City: this.locationForm.value.city,
      State: this.locationForm.value.state,
      Country: this.locationForm.value.country,
      PostalCode: this.locationForm.value.postalCode
    };

    this.locationService.createLocation(locationData).subscribe({
      next: () => {
        this.saving = false;
        this.cancelLocationForm();
        Toastify({
          text: "Location created successfully!",
          duration: 3000,
          backgroundColor: "#10b981"
        }).showToast();
        this.loadLocations();
      },
      error: (error: any) => {
        let errorMessage = "Failed to save location";
        if (error.error && error.error.errors) {
          const validationErrors = error.error.errors;
          const errorMessages = [];
          for (const field in validationErrors) {
            const fieldErrors = validationErrors[field];
            if (Array.isArray(fieldErrors)) {
              errorMessages.push(...fieldErrors);
            }
          }
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join('. ');
          }
        }
        Toastify({
          text: errorMessage,
          duration: 5000,
          backgroundColor: "#ef4444"
        }).showToast();
        this.saving = false;
      }
    });
  }

  saveBuilding(): void {
    if (this.buildingForm.invalid || !this.selectedLocation) return;

    this.saving = true;
    const buildingData = {
      Name: this.buildingForm.value.name,
      LocationId: this.selectedLocation.LocationId,
      Address: this.buildingForm.value.address,
      NumberOfFloors: this.buildingForm.value.floorCount
    };

    this.buildingService.createBuilding(buildingData).subscribe({
      next: () => {
        Toastify({
          text: "Building added successfully!",
          duration: 3000,
          backgroundColor: "#10b981"
        }).showToast();
        this.loadBuildings(this.selectedLocation!.LocationId);
        this.cancelBuildingForm();
        this.saving = false;
      },
      error: (error: any) => {
        console.error('Error saving building:', error);
        Toastify({
          text: "Failed to add building. Please try again.",
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
        this.saving = false;
      }
    });
  }

  saveFloor(): void {
    if (this.floorForm.invalid || !this.selectedBuilding) return;

    this.saving = true;
    const floorData = {
      FloorName: this.floorForm.value.name,
      BuildingId: this.selectedBuilding.Id,
      FloorNumber: this.floorForm.value.floorNumber,
      LocationId: this.selectedLocation!.LocationId
    };

    this.floorService.createFloor(floorData).subscribe({
      next: () => {
        Toastify({
          text: "Floor added successfully!",
          duration: 3000,
          backgroundColor: "#10b981"
        }).showToast();
        this.loadFloors(this.selectedBuilding!.Id);
        this.cancelFloorForm();
        this.saving = false;
      },
      error: (error: any) => {
        console.error('Error saving floor:', error);
        Toastify({
          text: "Failed to add floor. Please try again.",
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
        this.saving = false;
      }
    });
  }

  showAddLocationForm(): void {
    this.showLocationForm = true;
    setTimeout(() => {
      document.getElementById('locationFormSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  showAddBuildingForm(): void {
    this.showBuildingForm = true;
    setTimeout(() => {
      document.getElementById('buildingFormSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  showAddFloorForm(): void {
    this.showFloorForm = true;
    setTimeout(() => {
      document.getElementById('floorFormSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  cancelLocationForm(): void {
    this.showLocationForm = false;
    this.locationForm.reset();
  }

  cancelBuildingForm(): void {
    this.showBuildingForm = false;
    this.buildingForm.reset();
  }

  cancelFloorForm(): void {
    this.showFloorForm = false;
    this.floorForm.reset();
  }
}