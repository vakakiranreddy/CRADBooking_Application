import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService, EventResponse } from '../../services/event.service';
import { EventRsvpService, RsvpStatus, CreateRsvpDto, RsvpResponseDto } from '../../services/event-rsvp.service';
import { AuthService } from '../../services/auth.service';
import { NavigationComponent } from '../shared/navigation.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-events',
  standalone: true,
  imports: [CommonModule, FormsModule, NavigationComponent],
  templateUrl: './user-events.component.html',
  styleUrls: ['./user-events.component.css']
})
export class UserEventsComponent implements OnInit {
  events: EventResponse[] = [];
  filteredEvents: EventResponse[] = [];
  loading = false;
  searchTerm = '';
  selectedLocationFilter: number | null = null;
  locations: any[] = [];

  userRsvps: { [eventId: number]: string } = {};
  currentUser: any;

  constructor(
    private eventService: EventService,
    private rsvpService: EventRsvpService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUser = user;
      this.loadData();
    }
    
    this.authService.currentUser$.subscribe(user => {
      if (user && user !== this.currentUser) {
        this.currentUser = user;
        this.loadData();
      }
    });
  }

  loadData(): void {
    this.loading = true;
    this.eventService.getEventsWithLocations().subscribe({
      next: ({ events, locations }) => {
        this.events = events.filter(event => event.IsActive);
        this.locations = locations;
        this.applyFilters();
        this.loadUserRsvps();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredEvents = this.events.filter(event => {
      if (this.selectedLocationFilter && event.LocationId !== this.selectedLocationFilter) {
        return false;
      }
      return true;
    });
  }

  onLocationFilterChange(): void {
    this.applyFilters();
  }

  loadUserRsvps(): void {
    if (!this.currentUser?.Id) return;
    
    this.rsvpService.getRsvpsByUser(this.currentUser.Id).subscribe({
      next: (rsvps) => {
        rsvps.forEach(rsvp => {
          this.userRsvps[rsvp.EventId] = this.getStatusString(rsvp.Status);
        });
      },
      error: (error) => console.error('Error loading user RSVPs:', error)
    });
  }



  getEventImage(event: EventResponse): string {
    if (event.EventImage) {
      return `data:image/jpeg;base64,${event.EventImage}`;
    }
    return '';
  }

  formatEventDate(date: string): string {
    if (!date) return '';
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? '' : parsedDate.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  getEventStatus(event: EventResponse): string {
    if (!event.IsActive) return 'Inactive';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const eventDate = new Date(event.Date);
    const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    
    if (eventDateOnly > today) return 'Upcoming';
    if (eventDateOnly < today) return 'Past';
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startTimeParts = event.StartTime.split(':');
    const endTimeParts = event.EndTime.split(':');
    const startMinutes = parseInt(startTimeParts[0]) * 60 + parseInt(startTimeParts[1]);
    const endMinutes = parseInt(endTimeParts[0]) * 60 + parseInt(endTimeParts[1]);
    
    if (currentTime < startMinutes) return 'Upcoming';
    if (currentTime >= startMinutes && currentTime <= endMinutes) return 'Ongoing';
    return 'Past';
  }

  getEventStatusClass(event: EventResponse): string {
    return this.getEventStatus(event).toLowerCase();
  }

  isUpcoming(event: EventResponse): boolean {
    return this.getEventStatus(event) === 'Upcoming' || this.getEventStatus(event) === 'Ongoing';
  }

  rsvp(eventId: number, status: RsvpStatus): void {
    const dto: CreateRsvpDto = {
      EventId: eventId,
      Status: status
    };

    const hasExistingRsvp = this.userRsvps[eventId];
    const operation = hasExistingRsvp 
      ? this.rsvpService.updateUserRsvp(dto)
      : this.rsvpService.addUserRsvp(dto);

    operation.subscribe({
      next: () => {
        this.userRsvps[eventId] = this.getStatusString(status);
      },
      error: (error) => {
        console.error('Error updating RSVP:', error);
      }
    });
  }

  RsvpStatus = RsvpStatus;

  getStatusString(status: RsvpStatus | number): string {
    const numStatus = typeof status === 'number' ? status : Number(status);
    switch(numStatus) {
      case 0: return 'Yes';
      case 1: return 'No';
      case 2: return 'Maybe';
      default: return '';
    }
  }

  getUserRsvpStatus(eventId: number): string {
    return this.userRsvps[eventId] || '';
  }



  formatTime(timeString: string): string {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  viewEventDetails(eventId: number): void {
    this.router.navigate(['/events', eventId]);
  }
}