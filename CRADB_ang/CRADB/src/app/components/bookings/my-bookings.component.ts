import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BookingService, BookingResponse } from '../../services/booking.service';
import { CheckInService, CheckInResponse } from '../../services/checkin.service';
import { NavigationComponent } from '../shared/navigation.component';
import Toastify from 'toastify-js';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, NavigationComponent],
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.css']
})
export class MyBookingsComponent implements OnInit {
  bookings: BookingResponse[] = [];
  filteredBookings: BookingResponse[] = [];
  checkIns: Map<number, CheckInResponse> = new Map();
  loading = false;
  processing = false;
  statusFilter = '';

  constructor(
    private bookingService: BookingService,
    private checkInService: CheckInService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    console.log('Loading my bookings...');
    this.bookingService.getMyBookings().subscribe({
      next: (bookings) => {
        console.log('Bookings loaded:', bookings);
        this.bookings = bookings.sort((a, b) =>
          new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime()
        );
        this.filteredBookings = [...this.bookings];
        this.loadCheckInStatuses();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        Toastify({
          text: "Failed to load bookings",
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
        this.loading = false;
      }
    });
  }

  getActiveBookingsCount(): number {
    return this.bookings.filter(b => this.getBookingStatusClass(b) === 'active').length;
  }

  getUpcomingBookingsCount(): number {
    return this.bookings.filter(b => this.getBookingStatusClass(b) === 'upcoming').length;
  }

  getCompletedBookingsCount(): number {
    return this.bookings.filter(b => this.getBookingStatusClass(b) === 'completed').length;
  }

  navigateToRooms(): void {
    this.router.navigate(['/rooms']);
  }

  filterBookings(): void {
    if (!this.statusFilter) {
      this.filteredBookings = [...this.bookings];
    } else {
      this.filteredBookings = this.bookings.filter(booking =>
        this.getBookingStatusClass(booking) === this.statusFilter
      );
    }
  }

  getStatusText(status: string | number): string {
    if (typeof status === 'number') {
      switch (status) {
        case 0: return 'Reserved';
        case 1: return 'Checked In';
        case 2: return 'Completed';
        case 3: return 'Cancelled';
        default: return 'Unknown';
      }
    }
    return status;
  }

  formatDate(dateTime: string): string {
    return new Date(dateTime).toLocaleDateString();
  }

  hasActions(booking: BookingResponse): boolean {
    return this.canCheckIn(booking) || this.canCheckOut(booking) || this.canCancel(booking);
  }

  loadBookingsOld(): void {
    this.loading = true;
    console.log('Loading my bookings...');
    this.bookingService.getMyBookings().subscribe({
      next: (bookings) => {
        console.log('Bookings loaded:', bookings);
        console.log('Bookings count:', bookings.length);
        this.bookings = bookings.sort((a, b) =>
          new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime()
        );
        console.log('Sorted bookings:', this.bookings);
        this.loadCheckInStatuses();
        this.loading = false;
        console.log('Loading set to false');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.loading = false;
      }
    });
  }

  loadCheckInStatuses(): void {
    // Only load check-in status for bookings that might have check-ins
    // Skip this for now since it's causing 404 errors
  }

  checkIn(bookingId: number): void {
    this.processing = true;
    this.checkInService.checkIn(bookingId).subscribe({
      next: (checkIn) => {
        this.checkIns.set(bookingId, checkIn);
        this.loadBookings(); // Refresh to update status
        this.processing = false;
        Toastify({
          text: "Checked in successfully!",
          duration: 3000,
          backgroundColor: "#10b981"
        }).showToast();
      },
      error: (error) => {
        console.error('Check-in error:', error);
        Toastify({
          text: "Failed to check in: " + (error.error?.message || 'Unknown error'),
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
        this.processing = false;
      }
    });
  }

  checkOut(bookingId: number): void {
    this.processing = true;
    this.checkInService.checkOut(bookingId).subscribe({
      next: (checkIn) => {
        this.checkIns.set(bookingId, checkIn);
        this.loadBookings(); // Refresh to update status
        this.processing = false;
        Toastify({
          text: "Checked out successfully!",
          duration: 3000,
          backgroundColor: "#10b981"
        }).showToast();
      },
      error: (error) => {
        console.error('Check-out error:', error);
        Toastify({
          text: "Failed to check out: " + (error.error?.message || 'Unknown error'),
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
        this.processing = false;
      }
    });
  }

  cancelBooking(bookingId: number): void {
    const reason = prompt('Please provide a reason for cancellation:');
    if (reason) {
      this.bookingService.cancelBooking(bookingId, reason).subscribe({
        next: () => {
          this.loadBookings();
          Toastify({
            text: "Booking cancelled successfully!",
            duration: 3000,
            backgroundColor: "#10b981"
          }).showToast();
        },
        error: (error) => {
          console.error('Cancel error:', error);
          Toastify({
            text: "Failed to cancel booking",
            duration: 3000,
            backgroundColor: "#ef4444"
          }).showToast();
        }
      });
    }
  }

  canCheckIn(booking: BookingResponse): boolean {
    const now = new Date();
    const startTime = this.parseBookingTime(booking.StartTime);
    const checkIn = this.checkIns.get(booking.BookingId);
    const fifteenMinutesBefore = new Date(startTime.getTime() - 15 * 60 * 1000);

    return (booking.SessionStatus === 'Reserved' || booking.SessionStatus === 0) &&
      now >= fifteenMinutesBefore &&
      !checkIn?.CheckInTime;
  }

  canCheckOut(booking: BookingResponse): boolean {
    const checkIn = this.checkIns.get(booking.BookingId);
    return !!(checkIn?.CheckInTime && !checkIn?.CheckOutTime);
  }

  canCancel(booking: BookingResponse): boolean {
    return booking.SessionStatus === 'Reserved' || booking.SessionStatus === 0;
  }

  getCheckInInfo(bookingId: number): CheckInResponse | null {
    return this.checkIns.get(bookingId) || null;
  }

  getBookingStatusClass(booking: BookingResponse): string {
    const now = new Date();
    const startTime = new Date(booking.StartTime);
    const endTime = new Date(booking.EndTime);

    if (booking.SessionStatus === 'Cancelled' || booking.SessionStatus === 3) return 'cancelled';
    if (booking.SessionStatus === 'Completed' || booking.SessionStatus === 2) return 'completed';
    if (now >= startTime && now <= endTime) return 'active';
    return 'upcoming';
  }

  formatDateTime(dateTime: string): string {
    return new Date(dateTime).toLocaleString();
  }

  formatTime(dateTime: string): string {
    return new Date(dateTime).toLocaleTimeString();
  }

  toggleCheckInOut(booking: BookingResponse): void {
    if (this.canCheckIn(booking)) {
      this.checkIn(booking.BookingId);
    } else if (this.canCheckOut(booking)) {
      this.checkOut(booking.BookingId);
    }
  }

  getToggleLabel(booking: BookingResponse): string {
    const now = new Date();
    const endTime = this.parseBookingTime(booking.EndTime);
    const sessionStatus = this.getStatusText(booking.SessionStatus);

    if (sessionStatus === 'Completed') {
      return 'Completed';
    } else if (sessionStatus === 'Checked In' && now > endTime) {
      return 'Overdue';
    } else if (this.canCheckOut(booking)) {
      return 'Checked In';
    } else if (this.canCheckIn(booking)) {
      return 'Check In';
    }
    return 'Unavailable';
  }

  isBookingOverdue(booking: BookingResponse): boolean {
    const now = new Date();
    const endTime = this.parseBookingTime(booking.EndTime);
    return now > endTime;
  }

  isCompleted(booking: BookingResponse): boolean {
    return this.getStatusText(booking.SessionStatus) === 'Completed';
  }

  private parseBookingTime(timeString: string): Date {
    // The backend sends time in format like '2025-12-02T12:23:00'
    // This gets parsed as UTC by JavaScript, but it's actually IST
    // So we need to treat it as local time instead

    const parts = timeString.split('T');
    if (parts.length === 2) {
      const datePart = parts[0];
      const timePart = parts[1].split('.')[0];
      const localTime = new Date(`${datePart} ${timePart}`);
      return localTime;
    }
    return new Date(timeString);
  }

  trackByBookingId(index: number, booking: BookingResponse): number {
    return booking.BookingId;
  }
}