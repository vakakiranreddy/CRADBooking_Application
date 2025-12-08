import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { EventService, EventResponse, CreateEventDto, UpdateEventDto } from '../../../services/event.service';
import { EventRsvpService, UserRsvpDetails } from '../../../services/event-rsvp.service';
import { LocationResponse } from '../../../services/location.service';
import { DashboardService } from '../../../services/dashboard.service';
import { NotificationService } from '../../../services/notification.service';

import { AuthService } from '../../../services/auth.service';
import { AuthResponse } from '../../../models/auth.models';
import Toastify from 'toastify-js';

@Component({
  selector: 'app-event-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './event-management.component.html',
  styleUrls: ['./event-management.component.css']
})
export class EventManagementComponent implements OnInit {
  events: EventResponse[] = [];
  filteredEvents: EventResponse[] = [];
  locations: LocationResponse[] = [];
  eventForm: FormGroup;
  showCreateForm = false;
  editingEvent: EventResponse | null = null;
  loading = false;
  saving = false;
  searchTerm = '';
  eventFilter = '';
  selectedFile: File | null = null;
  selectedLocation = '';
  currentUser: AuthResponse | null = null;
  showProfileDropdown = false;
  participantCounts: { [eventId: number]: number } = {};
  rsvpCounts: { [eventId: number]: { interested: number, maybe: number, notInterested: number } } = {};
  showInterestedModal = false;
  selectedEventId: number | null = null;
  interestedUsers: UserRsvpDetails[] = [];
  loadingUsers = false;

  constructor(
    private eventService: EventService,
    private rsvpService: EventRsvpService,
    private dashboardService: DashboardService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      eventDate: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      locationId: ['', Validators.required],
      maxParticipants: [1, [Validators.required, Validators.min(1)]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadEventsPageData();
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

  getUserProfileImage(): string | null {
    if (!this.currentUser?.ProfileImage) return null;
    return `data:image/jpeg;base64,${this.currentUser.ProfileImage}`;
  }

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  loadEventsPageData(): void {
    this.loading = true;
    this.events = [];
    this.filteredEvents = [];
    this.cdr.detectChanges();

    this.dashboardService.getEventsPageData().subscribe({
      next: (data: any) => {
        this.locations = data.Locations || [];
        
        const eventsData = data.Events || [];
        this.events = eventsData.map((item: any) => item.Event);
        this.filteredEvents = [...this.events];
        
        eventsData.forEach((item: any) => {
          const eventId = item.Event.EventId;
          this.participantCounts[eventId] = item.ParticipantCount || 0;
          this.rsvpCounts[eventId] = {
            interested: item.InterestedCount || 0,
            maybe: item.MaybeCount || 0,
            notInterested: item.NotInterestedCount || 0
          };
        });
        
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        Toastify({
          text: "Failed to load events",
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
        this.events = [];
        this.filteredEvents = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadEvents(): void {
    this.eventService.getAllEvents().subscribe({
      next: (events: EventResponse[]) => {
        this.events = events;
        this.filteredEvents = [...events];
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading events:', error);
      }
    });
  }

  getParticipantCount(eventId: number): number {
    return this.participantCounts[eventId] || 0;
  }



  getRsvpCounts(eventId: number): { interested: number, maybe: number, notInterested: number } {
    return this.rsvpCounts[eventId] || { interested: 0, maybe: 0, notInterested: 0 };
  }

  getTotalRsvps(eventId: number): number {
    const counts = this.getRsvpCounts(eventId);
    return counts.interested + counts.maybe + counts.notInterested;
  }

  saveEvent(): void {
    if (this.eventForm.invalid) return;

    this.saving = true;
    const formValue = this.eventForm.value;

    const eventData = {
      EventTitle: formValue.title,
      Description: formValue.description,
      Date: formValue.eventDate,
      StartTime: formValue.startTime,
      EndTime: formValue.endTime,
      LocationId: parseInt(formValue.locationId),
      EventImage: this.selectedFile
    };

    const operation = this.editingEvent
      ? this.eventService.updateEvent(this.editingEvent.EventId, eventData as UpdateEventDto)
      : this.eventService.createEvent(eventData as CreateEventDto);

    operation.subscribe({
      next: (response) => {
        const isNewEvent = !this.editingEvent;
        Toastify({
          text: this.editingEvent ? "Event updated successfully!" : "Event created successfully!",
          duration: 3000,
          backgroundColor: "#10b981"
        }).showToast();

        // Send broadcast notification for new events
        if (isNewEvent && response) {
          this.sendEventBroadcast(eventData, response);
        }

        this.loadEvents();
        this.cancelEdit();
        this.saving = false;
      },
      error: (error: any) => {
        Toastify({
          text: "Failed to save event",
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
        this.saving = false;
      }
    });
  }

  editEvent(event: EventResponse): void {
    this.editingEvent = event;
    this.eventForm.patchValue({
      title: event.EventTitle,
      description: event.Description,
      eventDate: event.Date.split('T')[0],
      startTime: event.StartTime,
      endTime: event.EndTime,
      locationId: this.getLocationIdByName(event.LocationName),
      maxParticipants: 1,
      isActive: event.IsActive
    });
    this.showCreateForm = true;
  }

  deleteEvent(id: number): void {
    if (confirm('Are you sure you want to delete this event?')) {
      this.eventService.deleteEvent(id).subscribe({
        next: () => {
          Toastify({
            text: "Event deleted successfully!",
            duration: 3000,
            backgroundColor: "#10b981"
          }).showToast();
          this.loadEvents();
        },
        error: (error: any) => {
          Toastify({
            text: "Failed to delete event",
            duration: 3000,
            backgroundColor: "#ef4444"
          }).showToast();
        }
      });
    }
  }

  searchEvents(): void {
    if (!this.searchTerm) {
      this.filteredEvents = [...this.events];
    } else {
      this.eventService.searchEvents(this.searchTerm).subscribe({
        next: (events: EventResponse[]) => {
          this.filteredEvents = events;
        },
        error: (error: any) => {
          console.error('Error searching events:', error);
        }
      });
    }
  }

  filterEvents(): void {
    let filtered = [...this.events];

    // Filter by location
    if (this.selectedLocation) {
      filtered = filtered.filter(event => event.LocationId?.toString() === this.selectedLocation);
    }

    // Filter by date/status
    if (this.eventFilter === 'today') {
      const today = new Date().toDateString();
      filtered = filtered.filter(event => new Date(event.Date).toDateString() === today);
    } else if (this.eventFilter === 'upcoming') {
      const now = new Date();
      filtered = filtered.filter(event => new Date(event.Date) > now);
    } else if (this.eventFilter === 'past') {
      const now = new Date();
      filtered = filtered.filter(event => new Date(event.Date) < now);
    }

    this.filteredEvents = filtered;
    this.cdr.detectChanges();
  }

  formatDate(date: string): string {
    if (!date) return 'Invalid Date';
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? 'Invalid Date' : parsedDate.toLocaleDateString();
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
    const status = this.getEventStatus(event).toLowerCase();
    return `badge ${status}`;
  }

  getLocationIdByName(locationName?: string): number {
    if (!locationName) return 0;
    const location = this.locations.find(l => l.Name === locationName);
    return location ? location.LocationId : 0;
  }

  cancelEdit(): void {
    this.showCreateForm = false;
    this.editingEvent = null;
    this.selectedFile = null;
    this.eventForm.reset({ isActive: true, maxParticipants: 1 });
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  trackByEventId(index: number, event: EventResponse): number {
    return event.EventId;
  }

  trackByLocationId(index: number, location: LocationResponse): number {
    return location.LocationId;
  }

  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  viewRsvpDetails(eventId: number): void {
    this.router.navigate(['/admin/events', eventId, 'rsvp']);
  }

  getImageUrl(eventImage?: string): string | null {
    if (!eventImage) return null;
    return `data:image/jpeg;base64,${eventImage}`;
  }

  showInterestedEmployees(eventId: number): void {
    this.selectedEventId = eventId;
    this.loadingUsers = true;
    this.showInterestedModal = true;

    this.rsvpService.getAllRsvpUsers(eventId).subscribe({
      next: (users) => {
        this.interestedUsers = users;
        this.loadingUsers = false;
      },
      error: (error) => {
        Toastify({
          text: "Failed to load RSVP details",
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
        this.loadingUsers = false;
      }
    });
  }

  closeInterestedModal(): void {
    this.showInterestedModal = false;
    this.selectedEventId = null;
    this.interestedUsers = [];
  }

  getFilteredUsers(status: number): UserRsvpDetails[] {
    // For now, return all users since the API doesn't include Status in the response
    // This will show all users in the "Going" section
    if (status === 0) {
      return this.interestedUsers;
    }
    return [];
  }

  getUserDisplayName(user: UserRsvpDetails): string {
    if (user.FirstName && user.LastName) {
      return `${user.FirstName} ${user.LastName}`;
    }
    if (user.FirstName) {
      return user.FirstName;
    }
    if (user.LastName) {
      return user.LastName;
    }
    return 'Unknown User';
  }

  getUserInitial(user: UserRsvpDetails): string {
    if (user.FirstName) {
      return user.FirstName.charAt(0).toUpperCase();
    }
    return 'U';
  }

  formatResponseDate(dateString?: string): string {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private sendEventBroadcast(eventData: any, eventResponse: any): void {
    const locationName = this.locations.find(l => l.LocationId === eventData.LocationId)?.Name || 'Unknown Location';
    const eventDate = new Date(eventData.Date).toLocaleDateString();
    const startTime = this.formatTime(eventData.StartTime);

    const broadcastDto = {
      Title: `New Event: ${eventData.EventTitle}`,
      Message: `A new event "${eventData.EventTitle}" has been scheduled for ${eventDate} at ${startTime} in ${locationName}. Check it out and RSVP!`,
      LocationId: eventData.LocationId,
      TargetAudience: 'All'
    };

    this.notificationService.createBroadcast(broadcastDto).subscribe({
      next: () => {
        Toastify({
          text: "Event notification sent to all employees!",
          duration: 3000,
          backgroundColor: "#10b981"
        }).showToast();
      },
      error: (error) => {
        Toastify({
          text: "Event created but failed to send notification",
          duration: 3000,
          backgroundColor: "#f59e0b"
        }).showToast();
      }
    });
  }
}