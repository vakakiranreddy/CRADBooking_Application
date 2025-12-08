import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BookingService } from '../../../services/booking.service';
import { AuthService } from '../../../services/auth.service';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { ResourceType, BookingStatus } from '../../../models/enums';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './booking-list.component.html',
  styleUrls: ['./booking-list.component.css']
})
export class BookingListComponent implements OnInit {
  bookings: any[] = [];
  loading = false;
  bookingType = '';

  constructor(
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.bookingType = params['type'] || 'all';
      this.loadBookings();
    });
  }

  loadBookings(): void {
    this.loading = true;
    this.bookings = [];
    this.cdr.detectChanges();
    
    this.bookingService.getAllBookings().subscribe({
      next: (bookings) => {
        this.filterBookings(bookings);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.bookings = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterBookings(allBookings: any[]): void {
    if (!allBookings || allBookings.length === 0) {
      this.bookings = [];
      this.cdr.detectChanges();
      return;
    }
    
    let filtered = allBookings;
    
    switch(this.bookingType) {
      case 'room':
        filtered = allBookings.filter(b => b.ResourceType === 0 || b.ResourceType === '0' || b.ResourceType === 'Room');
        break;
      case 'desk':
        filtered = allBookings.filter(b => b.ResourceType === 1 || b.ResourceType === '1' || b.ResourceType === 'Desk');
        break;
      case 'my':
        const currentUserId = this.authService.getCurrentUser()?.UserId;
        filtered = allBookings.filter(b => b.UserId === currentUserId);
        break;
    }
    
    this.bookings = filtered.map(booking => ({
      id: booking.BookingId || booking.Id,
      resourceName: booking.ResourceName || `Resource ${booking.ResourceId}`,
      userName: booking.UserName || 'Unknown User',
      date: new Date(booking.StartTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      time: `${new Date(booking.StartTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${new Date(booking.EndTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
      status: this.getStatusText(booking.Status),
      purpose: booking.Purpose || booking.MeetingName || 'Meeting',
      participants: booking.ParticipantCount,
      location: booking.LocationName || booking.BuildingName || 'Location',
      userTitle: 'Employee'
    }));
    
    this.cdr.detectChanges();
  }

  getTitle(): string {
    switch(this.bookingType) {
      case 'room': return 'Room Bookings';
      case 'desk': return 'Desk Bookings';
      case 'my': return 'My Bookings';
      default: return 'All Bookings';
    }
  }

  getStatusText(status: number): string {
    switch(status) {
      case BookingStatus.Pending: return 'Pending';
      case BookingStatus.Confirmed: return 'Confirmed';
      case BookingStatus.Active: return 'Active';
      case BookingStatus.Completed: return 'Completed';
      case BookingStatus.Cancelled: return 'Cancelled';
      default: return 'Unknown';
    }
  }

  getStatusClass(status: string): string {
    switch(status.toLowerCase()) {
      case 'confirmed': return 'bg-success';
      case 'active': return 'bg-primary';
      case 'pending': return 'bg-warning';
      case 'cancelled': return 'bg-danger';
      case 'completed': return 'bg-secondary';
      default: return 'bg-light text-dark';
    }
  }


}