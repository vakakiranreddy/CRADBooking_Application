import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { BookingService, BookingResponse } from '../../../services/booking.service';
import { EventResponse } from '../../../services/event.service';
import { AuthService } from '../../../services/auth.service';
import { DashboardService } from '../../../services/dashboard.service';

interface CalendarEvent {
  title: string;
  time: Date;
  type: 'booking' | 'event';
  location: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  currentMonth: Date = new Date();
  calendarDays: CalendarDay[] = [];
  weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  selectedDay: CalendarDay | null = null;
  events: CalendarEvent[] = [];
  private currentUser: any;

  constructor(
    private datePipe: DatePipe,
    private bookingService: BookingService,
    private dashboardService: DashboardService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadData();
  }

  loadData() {
    const isAdmin = this.authService.isAdmin();
    const userId = isAdmin ? null : this.currentUser?.UserId;
    
    this.dashboardService.getCalendarPageData(userId).subscribe({
      next: (data: any) => {
        this.mapDataToCalendarEvents(data.Bookings || [], data.Events || []);
        this.generateCalendar();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading calendar data', err);
        this.generateCalendar();
      }
    });
  }

  mapDataToCalendarEvents(bookings: BookingResponse[], events: EventResponse[]) {
      const mappedBookings: CalendarEvent[] = bookings.map(b => ({
          title: b.MeetingName || `Booking #${b.BookingId}`,
          time: new Date(b.StartTime),
          type: 'booking',
          location: b.LocationName || b.ResourceName || 'Unknown Location'
      }));

      const mappedEvents: CalendarEvent[] = events
        .filter(e => e.IsActive)
        .map(e => {
          // Extract just the date part from the Date field (which is a full ISO datetime)
          // e.Date is like "2025-12-10T00:00:00", we need "2025-12-10"
          const datePart = e.Date.split('T')[0];
          const dateTimeString = `${datePart}T${e.StartTime}`;
          return {
            title: e.EventTitle,
            time: new Date(dateTimeString),
            type: 'event',
            location: e.LocationName || 'Unknown Location'
          };
        });

      this.events = [...mappedBookings, ...mappedEvents];
  }

  generateCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    // First day of monnth
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    
    // Days from prev month to fill grid
    const startDayOfWeek = firstDay.getDay();
    
    this.calendarDays = [];

    // Previous month (fillers)
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      this.calendarDays.push({
        date: date,
        isCurrentMonth: false,
        isToday: this.isSameDate(date, new Date()),
        events: this.getEventsForDate(date)
      });
    }

    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(year, month, i);
        this.calendarDays.push({
            date: date,
            isCurrentMonth: true,
            isToday: this.isSameDate(date, new Date()),
            events: this.getEventsForDate(date)
        });
    }

    // Next month (fillers to complete 6 weeks or 5)
    // Typical grid is 35 or 42 cells.
    const remainingCells = 42 - this.calendarDays.length;
    for (let i = 1; i <= remainingCells; i++) {
        const date = new Date(year, month + 1, i);
        this.calendarDays.push({
            date: date,
            isCurrentMonth: false,
            isToday: this.isSameDate(date, new Date()),
            events: this.getEventsForDate(date)
        });
    }
  }

  prevMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendar();
  }

  goToToday() {
    this.currentMonth = new Date();
    this.generateCalendar();
  }

  selectDay(day: CalendarDay) {
    this.selectedDay = day;
  }

  closeModal() {
    this.selectedDay = null;
  }

  // Helpers
  private isSameDate(d1: Date, d2: Date): boolean {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  }

  private getEventsForDate(date: Date): CalendarEvent[] {
    return this.events.filter(e => this.isSameDate(e.time, date));
  }
}

