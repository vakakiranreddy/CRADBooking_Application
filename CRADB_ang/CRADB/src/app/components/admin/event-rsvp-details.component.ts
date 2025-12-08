import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EventResponse } from '../../services/event.service';
import { RsvpResponseDto, RsvpStatusType } from '../../services/event-rsvp.service';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { AuthResponse } from '../../models/auth.models';

@Component({
  selector: 'app-event-rsvp-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './event-rsvp-details.component.html',
  styleUrls: ['./event-rsvp-details.component.css']
})
export class EventRsvpDetailsComponent implements OnInit {
  event: EventResponse | null = null;
  rsvps: RsvpResponseDto[] = [];
  users: any[] = [];
  loading = true;
  activeTab = 'All';
  currentUser: AuthResponse | null = null;
  showProfileDropdown = false;

  tabs = [
    { key: 'All', label: 'All Responses', icon: '📊' },
    { key: 'Yes', label: 'Going', icon: '👍' },
    { key: 'Maybe', label: 'Maybe', icon: '🤔' },
    { key: 'No', label: 'Not Going', icon: '👎' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dashboardService: DashboardService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    const eventId = this.route.snapshot.params['id'];
    if (eventId) {
      this.loadEventDetails(+eventId);
    }
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'AD';
    const firstInitial = this.currentUser.FirstName?.charAt(0) || '';
    const lastInitial = this.currentUser.LastName?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase() || 'AD';
  }

  getParticipantInitials(userId: number): string {
    const user = this.users.find(u => u.Id === userId);
    if (!user) return 'U';
    const firstName = user.FirstName || '';
    const lastName = user.LastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
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

  loadEventDetails(eventId: number): void {
    this.dashboardService.getEventRsvpData(eventId).subscribe({
      next: (data: any) => {
        this.event = data.Event;
        this.rsvps = data.Rsvps || [];
        this.users = data.Users || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading event RSVP data:', error);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  getFilteredRsvps(): RsvpResponseDto[] {
    if (this.activeTab === 'All') {
      return this.rsvps;
    }
    return this.rsvps.filter(rsvp => this.getStatusString(rsvp.Status) === this.activeTab);
  }

  getCountByStatus(status: string): number {
    if (status === 'All') {
      return this.rsvps.length;
    }
    return this.rsvps.filter(rsvp => {
      const rsvpStatus = this.getStatusString(rsvp.Status);
      return rsvpStatus === status;
    }).length;
  }

  getUserName(userId: number): string {
    const user = this.users.find(u => u.Id === userId);
    return user ? `${user.FirstName} ${user.LastName}` : 'Unknown User';
  }

  getUserEmail(userId: number): string {
    const user = this.users.find(u => u.Id === userId);
    return user ? user.Email : 'No email';
  }



  getStatusClass(status: RsvpStatusType | number): string {
    return this.getStatusString(status).toLowerCase();
  }

  getStatusIcon(status: RsvpStatusType | number): string {
    const numStatus = typeof status === 'number' ? status : Number(status);
    switch (numStatus) {
      case 0: return '👍';
      case 1: return '👎';
      case 2: return '🤔';
      default: return '❓';
    }
  }

  getStatusString(status: RsvpStatusType | number): string {
    const numStatus = typeof status === 'number' ? status : Number(status);
    switch (numStatus) {
      case 0: return 'Yes';
      case 1: return 'No';
      case 2: return 'Maybe';
      default: return 'Unknown';
    }
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  goBack(): void {
    this.router.navigate(['/admin/events']);
  }
}