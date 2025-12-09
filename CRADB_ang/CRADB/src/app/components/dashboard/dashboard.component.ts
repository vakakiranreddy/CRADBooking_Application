import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BookingService, BookingResponse } from '../../services/booking.service';
import { CheckInService } from '../../services/checkin.service';
import { RoomService } from '../../services/room.service';
import { LocationService, LocationResponse } from '../../services/location.service';
import { DashboardService } from '../../services/dashboard.service';
import { NavigationComponent } from '../shared/navigation.component';
import { UserNotificationsComponent } from '../user/user-notifications.component';
import Toastify from 'toastify-js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NavigationComponent, UserNotificationsComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: any;
  recentBookings: BookingResponse[] = [];
  activeBookings: BookingResponse[] = [];
  upcomingBookings: BookingResponse[] = [];
  locations: LocationResponse[] = [];
  notifications: any[] = [];
  
  // Calendar properties
  currentDate = new Date();
  calendarWeeks: any[][] = [];
  currentMonthYear = '';
  todayDate = '';

  constructor(
    private authService: AuthService,
    private bookingService: BookingService,
    private checkInService: CheckInService,
    private dashboardService: DashboardService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }


  ngOnInit(): void {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin']);
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.currentUser = currentUser;
      this.generateCalendar();
      this.currentMonthYear = this.getCurrentMonth();
      this.todayDate = this.getTodayDate();
      this.loadBookings();
    }
  }

  loadBookings(): void {
    if (!this.currentUser) return;
    
    this.dashboardService.getUserDashboardData(this.currentUser.UserId).subscribe({
      next: (data) => {
        this.locations = data.Locations || [];
        this.notifications = data.Notifications || [];
        const bookings: BookingResponse[] = data.Bookings || [];
        console.log('Raw bookings from API:', bookings);
        
        // Show details for all bookings to find booking 5
        bookings.forEach(booking => {
          console.log(`Booking ${booking.BookingId || booking.Id} details:`, {
            BookingId: booking.BookingId,
            Id: booking.Id,
            Status: booking.Status,
            SessionStatus: booking.SessionStatus,
            StatusText: this.getStatusText(booking.Status),
            SessionStatusText: this.getStatusText(booking.SessionStatus),
            StartTime: booking.StartTime,
            EndTime: booking.EndTime
          });
        });
        
        this.recentBookings = bookings.slice(0, 5);
        const now = new Date();
        this.activeBookings = bookings.filter((b: BookingResponse) => 
          this.getStatusText(b.SessionStatus) === 'Reserved' || this.getStatusText(b.SessionStatus) === 'Checked In'
        );
        this.upcomingBookings = bookings.filter((b: BookingResponse) => 
          new Date(b.StartTime) > now && this.getStatusText(b.SessionStatus) === 'Reserved'
        );
        this.updateCalendarWithBookings();
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        Toastify({
          text: "Failed to load bookings",
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
        this.cdr.detectChanges();
      }
    });
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

  getStatusClass(status: string | number): string {
    const statusText = this.getStatusText(status).toLowerCase();
    return `status-${statusText.replace(' ', '')}`;
  }

  canCheckIn(booking: BookingResponse): boolean {
    const now = new Date();
    const startTime = this.parseBookingTime(booking.StartTime);
    const endTime = this.parseBookingTime(booking.EndTime);
    const checkInTime = new Date(startTime.getTime() - 15 * 60 * 1000); // 15 minutes before
    
    // Use SessionStatus as primary since backend updates this field
    const sessionStatus = this.getStatusText(booking.SessionStatus);
    
    const isExpired = now > endTime;
    const isBeforeWindow = now < checkInTime;
    
    console.log('Check-in logic:', {
      bookingId: booking.BookingId,
      sessionStatus,
      now: now.toLocaleString(),
      startTime: startTime.toLocaleString(),
      checkInTime: checkInTime.toLocaleString(),
      endTime: endTime.toLocaleString(),
      isExpired,
      isBeforeWindow,
      canCheckIn: sessionStatus === 'Reserved' && !isExpired && !isBeforeWindow
    });
    
    // Can check in if SessionStatus is Reserved and not expired/before window
    return sessionStatus === 'Reserved' && !isExpired && !isBeforeWindow;
  }

  private parseBookingTime(timeString: string): Date {
    // The backend sends time in format like '2025-12-02T12:23:00'
    // This gets parsed as UTC by JavaScript, but it's actually IST
    // So we need to treat it as local time instead
    
    // Extract date and time parts
    const parts = timeString.split('T');
    if (parts.length === 2) {
      const datePart = parts[0]; // '2025-12-02'
      const timePart = parts[1].split('.')[0]; // '12:23:00' (remove milliseconds if any)
      
      // Create date treating it as local time (IST)
      const localTime = new Date(`${datePart} ${timePart}`);
      
      console.log('Time parsing debug:', {
        original: timeString,
        datePart,
        timePart,
        parsedAsLocal: localTime.toLocaleString(),
        currentTime: new Date().toLocaleString()
      });
      
      return localTime;
    }
    
    // Fallback to original parsing
    return new Date(timeString);
  }

  canCheckOut(booking: BookingResponse): boolean {
    const sessionStatus = this.getStatusText(booking.SessionStatus);
    const now = new Date();
    const endTime = this.parseBookingTime(booking.EndTime);
    
    // Can only check out if checked in AND booking hasn't expired
    return sessionStatus === 'Checked In' && now <= endTime;
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
    
    if (sessionStatus === 'Checked In' && now > endTime) {
      return 'Overdue';
    } else if (this.canCheckOut(booking)) {
      return 'Checked In';
    } else if (this.canCheckIn(booking)) {
      return 'Check In';
    }
    return 'Unavailable';
  }

  getToggleIcon(booking: BookingResponse): string {
    const now = new Date();
    const endTime = this.parseBookingTime(booking.EndTime);
    const sessionStatus = this.getStatusText(booking.SessionStatus);
    
    if (sessionStatus === 'Checked In' && now > endTime) {
      return '⚠️'; // Warning icon for overdue
    } else if (this.canCheckOut(booking)) {
      return '🚪'; // Exit icon
    } else if (this.canCheckIn(booking)) {
      return '✅'; // Check mark
    }
    return '⏰'; // Clock icon
  }

  isBookingOverdue(booking: BookingResponse): boolean {
    const now = new Date();
    const endTime = this.parseBookingTime(booking.EndTime);
    return now > endTime;
  }

  checkIn(bookingId: number): void {
    const booking = this.recentBookings.find(b => b.BookingId === bookingId);
    if (booking) {
      const now = new Date();
      const endTime = this.parseBookingTime(booking.EndTime);
      
      if (now > endTime) {
        Toastify({
          text: "This booking has expired. Check-in is no longer available.",
          duration: 3000,
          backgroundColor: "#f59e0b"
        }).showToast();
        return;
      }
    }
    
    this.checkInService.checkIn(bookingId).subscribe({
      next: (response) => {
        Toastify({
          text: "Checked in successfully!",
          duration: 3000,
          backgroundColor: "#10b981"
        }).showToast();
        this.loadBookings(); // Refresh bookings
      },
      error: (error) => {
        console.error('Check-in error:', error);
        let errorMessage = 'Failed to check in. Please try again.';
        
        if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        Toastify({
          text: errorMessage,
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
      }
    });
  }

  checkOut(bookingId: number): void {
    this.checkInService.checkOut(bookingId).subscribe({
      next: (response) => {
        Toastify({
          text: "Checked out successfully!",
          duration: 3000,
          backgroundColor: "#10b981"
        }).showToast();
        this.loadBookings(); // Refresh bookings
      },
      error: (error) => {
        console.error('Check-out error:', error);
        Toastify({
          text: "Failed to check out. Please try again.",
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
      }
    });
  }

  navigateToRooms(): void {
    this.router.navigate(['/rooms']);
  }

  viewAllBookings(): void {
    this.router.navigate(['/bookings']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Calendar methods
  getCurrentMonth(): string {
    return this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  getTodayDate(): string {
    return this.currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    this.calendarWeeks = [];
    const today = new Date();
    
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const currentDay = new Date(startDate);
        currentDay.setDate(startDate.getDate() + (week * 7) + day);
        
        weekDays.push({
          date: currentDay.getDate(),
          isToday: currentDay.toDateString() === today.toDateString(),
          isCurrentMonth: currentDay.getMonth() === month,
          hasBooking: false
        });
      }
      this.calendarWeeks.push(weekDays);
    }
    
    this.updateCalendarWithBookings();
  }

  updateCalendarWithBookings(): void {
    if (!this.calendarWeeks.length || !this.recentBookings.length) return;
    
    const currentMonth = this.currentDate.getMonth();
    const currentYear = this.currentDate.getFullYear();
    
    this.calendarWeeks.forEach(week => {
      week.forEach(day => {
        const dayDate = new Date(currentYear, currentMonth, day.date);
        const dayString = dayDate.toISOString().split('T')[0];
        
        day.hasBooking = this.recentBookings.some(booking => {
          const bookingDate = new Date(booking.StartTime).toISOString().split('T')[0];
          return bookingDate === dayString;
        });
      });
    });
  }

  previousMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.generateCalendar();
    this.currentMonthYear = this.getCurrentMonth();
  }

  nextMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.generateCalendar();
    this.currentMonthYear = this.getCurrentMonth();
  }

  onDateClick(day: any): void {
    if (!day.isCurrentMonth) return;
    
    if (day.hasBooking) {
      this.router.navigate(['/bookings']);
    }
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return 'User';
    return `${this.currentUser.FirstName || ''} ${this.currentUser.LastName || ''}`.trim() || 'User';
  }
}