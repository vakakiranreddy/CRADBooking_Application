import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { BookingService, BookingResponse } from '../../../services/booking.service';
import { LocationService, LocationResponse } from '../../../services/location.service';
import { ResourceType } from '../../../models/enums';
import { AuthService } from '../../../services/auth.service';
import { AuthResponse } from '../../../models/auth.models';

@Component({
  selector: 'app-desk-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent],
  templateUrl: './desk-bookings.component.html',
  styleUrls: ['./desk-bookings.component.css']
})
export class DeskBookingsComponent implements OnInit {
  bookings: BookingResponse[] = [];
  locations: LocationResponse[] = [];
  loading = false;
  selectedLocation = '';
  selectedDate = 'Today';
  showBookingDropdown = false;
  currentUser: AuthResponse | null = null;
  showProfileDropdown = false;

  constructor(
    private bookingService: BookingService,
    private locationService: LocationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadBookings();
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

  loadBookings(): void {
    this.loading = true;
    this.bookingService.getAllBookings().subscribe({
      next: (bookings) => {
        this.bookings = bookings.filter(b => b.ResourceType === ResourceType.Desk.toString() || b.ResourceType === 'Desk');
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.loading = false;
      }
    });
  }

  loadLocations(): void {
    this.locationService.getAllLocations().subscribe({
      next: (locations) => {
        this.locations = locations;
      },
      error: (error) => {
        console.error('Error loading locations:', error);
      }
    });
  }

  toggleBookingDropdown(): void {
    this.showBookingDropdown = !this.showBookingDropdown;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}