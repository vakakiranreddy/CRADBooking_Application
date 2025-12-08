import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NavigationComponent } from '../shared/navigation.component';
import { DeskResponse } from '../../services/desk.service';
import { LocationResponse } from '../../services/location.service';
import { DashboardService } from '../../services/dashboard.service';
import Toastify from 'toastify-js';

@Component({
  selector: 'app-desk-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NavigationComponent],
  templateUrl: './desk-list.component.html',
  styleUrls: ['./desk-list.component.css']
})
export class DeskListComponent implements OnInit {
  desks: DeskResponse[] = [];
  filteredDesks: DeskResponse[] = [];
  locations: LocationResponse[] = [];
  loading = false;
  searchTerm = '';
  locationFilter = '';
  amenityFilter = '';
  showAvailableOnly = false;

  currentUser: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private dashboardService: DashboardService
  ) {
     this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.loading = true;
    this.dashboardService.getDesksPageData().subscribe({
      next: (data) => {
        this.desks = data.Desks || [];
        this.filteredDesks = [...this.desks];
        this.locations = data.Locations || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        Toastify({
          text: "Failed to load desks data",
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
        this.loading = false;
      }
    });
  }

  filterDesks(): void {
    this.filteredDesks = this.desks.filter(desk => {
      const matchesSearch = !this.searchTerm || 
        desk.DeskName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (desk.LocationName && desk.LocationName.toLowerCase().includes(this.searchTerm.toLowerCase()));

      const matchesLocation = !this.locationFilter || 
        desk.LocationName === this.locationFilter;

      const matchesAmenity = !this.amenityFilter || 
        (this.amenityFilter === 'monitor' && desk.HasMonitor) ||
        (this.amenityFilter === 'window' && desk.NearWindow) ||
        (this.amenityFilter === 'keyboard' && desk.HasKeyboard);

      const matchesAvailability = !this.showAvailableOnly || this.isAvailable(desk);

      return matchesSearch && matchesLocation && matchesAmenity && matchesAvailability;
    });
  }

  toggleAvailableOnly(): void {
    this.showAvailableOnly = !this.showAvailableOnly;
    this.filterDesks();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.locationFilter = '';
    this.amenityFilter = '';
    this.showAvailableOnly = false;
    this.filteredDesks = [...this.desks];
  }

  getTotalDesks(): number {
    return this.desks.length;
  }

  getAvailableDesks(): number {
    return this.desks.filter(desk => this.isAvailable(desk)).length;
  }

  getOccupiedDesks(): number {
    return this.desks.filter(desk => !this.isAvailable(desk)).length;
  }

  isAvailable(desk: DeskResponse): boolean {
    return !desk.IsBlocked && !desk.IsUnderMaintenance;
  }

  bookDesk(desk: DeskResponse): void {
    // Navigate to booking page with desk details
    this.router.navigate(['/book-room'], { 
      queryParams: { 
        resourceId: desk.ResourceId,
        resourceType: 'Desk',
        resourceName: desk.DeskName
      } 
    });
  }
}