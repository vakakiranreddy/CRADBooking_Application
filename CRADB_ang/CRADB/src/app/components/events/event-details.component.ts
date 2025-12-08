import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService, EventResponse } from '../../services/event.service';
import { EventRsvpService, RsvpStatus, CreateRsvpDto } from '../../services/event-rsvp.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-details.component.html',
  styleUrls: ['./event-details.component.css']
})
export class EventDetailsComponent implements OnInit {
  event: EventResponse | null = null;
  loading = true;
  userRsvpStatus = '';
  eventCounts = { interested: 0, maybe: 0, notInterested: 0 };
  currentUser: any;
  RsvpStatus = RsvpStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private rsvpService: EventRsvpService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    const eventId = this.route.snapshot.params['id'];
    if (eventId) {
      this.loadEvent(+eventId);
    } else {
      this.loading = false; // Stop loading if no ID
      console.error('No event ID provided in route');
    }
  }

  loadEvent(eventId: number): void {
    this.loading = true;
    this.eventService.getEventById(eventId).subscribe({
      next: (event) => {
        this.event = event;
        this.loadUserRsvp(eventId);
        this.loadEventCounts(eventId);
        this.loading = false;
        this.cdr.detectChanges(); // Force update
      },
      error: (error) => {
        console.error('Error loading event:', error);
        this.loading = false;
        this.cdr.detectChanges(); // Force update
      }
    });
  }

  loadUserRsvp(eventId: number): void {
    this.rsvpService.getUserRsvp(eventId).subscribe({
      next: (rsvp) => {
        if (rsvp) {
          this.userRsvpStatus = this.getStatusString(rsvp.Status);
        } else {
          this.userRsvpStatus = '';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.userRsvpStatus = '';
        this.cdr.detectChanges();
      }
    });
  }

  loadEventCounts(eventId: number): void {
    this.rsvpService.getInterestedCount(eventId).subscribe({
      next: (response) => {
        this.eventCounts.interested = response.interestedCount;
        this.cdr.detectChanges();
      }
    });
    
    this.rsvpService.getMaybeCount(eventId).subscribe({
      next: (response) => {
        this.eventCounts.maybe = response.maybeCount;
        this.cdr.detectChanges();
      }
    });
    
    this.rsvpService.getNotInterestedCount(eventId).subscribe({
      next: (response) => {
        this.eventCounts.notInterested = response.notInterestedCount;
        this.cdr.detectChanges();
      }
    });
  }

  rsvp(status: RsvpStatus): void {
    if (!this.event) return;

    const dto: CreateRsvpDto = {
      EventId: this.event.EventId,
      Status: status
    };

    const operation = this.userRsvpStatus 
      ? this.rsvpService.updateUserRsvp(dto)
      : this.rsvpService.addUserRsvp(dto);

    operation.subscribe({
      next: () => {
        this.userRsvpStatus = this.getStatusString(status);
        this.loadEventCounts(this.event!.EventId);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error updating RSVP:', error);
      }
    });
  }

  getStatusString(status: RsvpStatus | number): string {
    const numStatus = typeof status === 'number' ? status : Number(status);
    switch(numStatus) {
      case 0: return 'Yes';
      case 1: return 'No';
      case 2: return 'Maybe';
      default: return '';
    }
  }

  getEventImage(): string {
    if (!this.event) return '';
    const images = [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200'
    ];
    return images[this.event.EventId % images.length];
  }

  formatEventDate(date: string): string {
    if (!date) return '';
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? '' : parsedDate.toLocaleDateString('en-US', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  getEventStatus(): string {
    if (!this.event || !this.event.IsActive) return 'Inactive';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const eventDate = new Date(this.event.Date);
    const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    
    if (eventDateOnly > today) return 'Upcoming';
    if (eventDateOnly < today) return 'Past';
    return 'Today';
  }

  getEventStatusClass(): string {
    return this.getEventStatus().toLowerCase();
  }

  isUpcoming(): boolean {
    return this.getEventStatus() === 'Upcoming' || this.getEventStatus() === 'Today';
  }

  goBack(): void {
    this.router.navigate(['/events']);
  }
}