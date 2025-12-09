import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { DashboardService } from '../../../services/dashboard.service';
import { AuthService } from '../../../services/auth.service';
import { AuthResponse } from '../../../models/auth.models';
import { ResourceType, BookingStatus } from '../../../models/enums';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
stats = {
    totalUsers: 0,
    totalRooms: 0,
    totalDesks: 0,
    activeBookings: 0,
    totalDepartments: 0,
    totalLocations: 0,
    busyRooms: 0,
    occupiedDesks: 0
  };

recentBookings: any[] = [];
  allBookings: any[] = [];
  upcomingEvents: any[] = [];
  locations: any[] = [];
  selectedLocation: any = null;
  currentDate = new Date();
  loading = false;
  calendarWeeks: any[][] = [];
  currentMonthYear = '';
  todayDate = '';
  todayEvents: any[] = [];
  currentUser: AuthResponse | null = null;
  showProfileDropdown = false;
  showBookingDropdown = false;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.generateCalendar();
    this.currentMonthYear = this.getCurrentMonth();
    this.todayDate = this.getTodayDate();
    this.loadDashboardData();
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'AD';
    const firstInitial = this.currentUser.FirstName?.charAt(0) || '';
    const lastInitial = this.currentUser.LastName?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase() || 'AD';
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return 'Admin';
    return `${this.currentUser.FirstName || ''} ${this.currentUser.LastName || ''}`.trim() || 'Admin';
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

  loadDashboardData(): void {
    this.loading = true;
    const userId = this.currentUser?.UserId || 1;
    
    this.dashboardService.getAdminDashboardData(userId).subscribe({
      next: (data: any) => {
        this.locations = data.Locations || [];
        if (this.locations.length > 0) {
          this.selectedLocation = this.locations[0];
        }
        
        this.stats.totalUsers = data.Users?.length || 0;
        this.stats.totalDepartments = data.Departments?.length || 0;
        this.stats.totalLocations = this.locations.length;
        
        this.updateStatsForLocation(data);
        
        this.upcomingEvents = data.UpcomingEvents?.slice(0, 3) || [];
        
        const bookings = data.Bookings || [];
        this.allBookings = bookings;
        
        if (bookings.length > 0) {
          const now = new Date();
          const activeBookings = bookings.filter((b: any) => {
            const startTime = new Date(b.StartTime);
            const endTime = new Date(b.EndTime);
            return now >= startTime && now <= endTime && (b.Status === BookingStatus.Confirmed || b.Status === BookingStatus.Active);
          });
          
          this.stats.activeBookings = activeBookings.length;
          this.stats.busyRooms = activeBookings.filter((b: any) => b.ResourceType === ResourceType.Room || b.ResourceType === 'Room').length;
          this.stats.occupiedDesks = activeBookings.filter((b: any) => b.ResourceType === ResourceType.Desk || b.ResourceType === 'Desk').length;
          
          this.recentBookings = bookings
            .filter((b: any) => b.StartTime && b.StartTime !== '0001-01-01T00:00:00')
            .sort((a: any, b: any) => new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime())
            .slice(0, 5)
            .map((booking: any) => ({
              id: booking.BookingId || booking.Id,
              roomName: booking.ResourceName || `Resource ${booking.ResourceId}`,
              userName: booking.UserName || 'Unknown User',
              date: new Date(booking.StartTime).toLocaleDateString(),
              time: `${new Date(booking.StartTime).toLocaleTimeString()} - ${new Date(booking.EndTime).toLocaleTimeString()}`,
              status: this.getStatusText(booking.Status)
            }));
        }
        
        const events = data.AllEvents || [];
        const today = new Date().toISOString().split('T')[0];
        const todayEvents = events.filter((event: any) => {
          const eventDate = new Date(event.Date).toISOString().split('T')[0];
          return eventDate === today && event.IsActive;
        });
        
        this.todayEvents = todayEvents.map((event: any) => ({
          EventId: event.EventId,
          EventTitle: event.EventTitle,
          StartTime: new Date(event.StartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          EndTime: new Date(event.EndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          bgColor: '#F0F8FF',
          borderColor: '#4A90E2',
          iconBg: '#4A90E2',
          icon: 'calendar-alt',
          titleColor: '#2C3E50',
          timeColor: '#7F8C8D'
        }));
        
        this.updateCalendarWithEvents(events);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
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



  updateCalendarWithEvents(events: any[]): void {
    if (!this.calendarWeeks.length) return;
    
    const currentMonth = this.currentDate.getMonth();
    const currentYear = this.currentDate.getFullYear();
    
    this.calendarWeeks.forEach(week => {
      week.forEach(day => {
        const dayDate = new Date(currentYear, currentMonth, day.date);
        const dayString = dayDate.toISOString().split('T')[0];
        
        day.hasEvent = events.some(event => {
          const eventDate = new Date(event.Date).toISOString().split('T')[0];
          return eventDate === dayString && event.IsActive;
        });
        
        day.hasBooking = this.allBookings.some(booking => {
          const bookingDate = new Date(booking.StartTime).toISOString().split('T')[0];
          return bookingDate === dayString;
        });
      });
    });
  }
  
  onDateClick(day: any): void {
    if (!day.isCurrentMonth) return;
    
    const currentMonth = this.currentDate.getMonth();
    const currentYear = this.currentDate.getFullYear();
    const clickedDate = new Date(currentYear, currentMonth, day.date);
    const dateString = clickedDate.toISOString().split('T')[0];
    
    if (day.hasEvent) {
      this.router.navigate(['/admin/events']);
    } else if (day.hasBooking) {
      this.router.navigate(['/admin/room-bookings']);
    }
  }

  onLocationChange(event: any): void {
    const locationId = event.target.value;
    this.selectedLocation = this.locations.find(l => l.LocationId == locationId);
    this.loadDashboardData();
  }

  updateStatsForLocation(data: any): void {
    const locationId = this.selectedLocation?.LocationId;
    
    if (locationId) {
      const locationRooms = (data.Rooms || []).filter((r: any) => r.LocationId === locationId);
      const locationDesks = (data.Desks || []).filter((d: any) => d.LocationId === locationId);
      
      this.stats.totalRooms = locationRooms.length;
      this.stats.totalDesks = locationDesks.length;
      
      const bookings = (data.Bookings || []).filter((b: any) => b.LocationId === locationId);
      this.allBookings = bookings;
      
      const now = new Date();
      const activeBookings = bookings.filter((b: any) => {
        const startTime = new Date(b.StartTime);
        const endTime = new Date(b.EndTime);
        return now >= startTime && now <= endTime && (b.Status === BookingStatus.Confirmed || b.Status === BookingStatus.Active);
      });
      
      this.stats.activeBookings = activeBookings.length;
      this.stats.busyRooms = activeBookings.filter((b: any) => b.ResourceType === ResourceType.Room || b.ResourceType === 'Room').length;
      this.stats.occupiedDesks = activeBookings.filter((b: any) => b.ResourceType === ResourceType.Desk || b.ResourceType === 'Desk').length;
    } else {
      this.stats.totalRooms = data.Rooms?.length || 0;
      this.stats.totalDesks = data.Desks?.length || 0;
      this.allBookings = data.Bookings || [];
      
      const now = new Date();
      const activeBookings = this.allBookings.filter((b: any) => {
        const startTime = new Date(b.StartTime);
        const endTime = new Date(b.EndTime);
        return now >= startTime && now <= endTime && (b.Status === BookingStatus.Confirmed || b.Status === BookingStatus.Active);
      });
      
      this.stats.activeBookings = activeBookings.length;
      this.stats.busyRooms = activeBookings.filter((b: any) => b.ResourceType === ResourceType.Room || b.ResourceType === 'Room').length;
      this.stats.occupiedDesks = activeBookings.filter((b: any) => b.ResourceType === ResourceType.Desk || b.ResourceType === 'Desk').length;
    }
  }

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
          hasEvent: false,
          hasBooking: false
        });
      }
      this.calendarWeeks.push(weekDays);
    }
  }

  previousMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.generateCalendar();
    this.currentMonthYear = this.getCurrentMonth();
    this.updateCalendarWithEvents(this.allBookings);
  }

  nextMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.generateCalendar();
    this.currentMonthYear = this.getCurrentMonth();
    this.updateCalendarWithEvents(this.allBookings);
  }

  toggleBookingDropdown(): void {
    this.showBookingDropdown = !this.showBookingDropdown;
  }

  filterBookings(type: string): void {
    this.showBookingDropdown = false;
    switch(type) {
      case 'room':
        this.router.navigate(['/admin/room-bookings']);
        break;
      case 'desk':
        this.router.navigate(['/admin/desk-bookings']);
        break;
      case 'my':
        this.router.navigate(['/admin/my-bookings']);
        break;
    }
  }
}