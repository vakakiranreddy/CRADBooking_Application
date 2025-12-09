import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NotificationService, SendBroadcastDto } from '../../services/notification.service';
import { LocationResponse } from '../../services/location.service';
import { DashboardService } from '../../services/dashboard.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { AuthResponse } from '../../models/auth.models';
import Toastify from 'toastify-js';

@Component({
  selector: 'app-notification-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './notification-management.component.html',
  styleUrls: ['./notification-management.component.css']
})
export class NotificationManagementComponent implements OnInit {
  broadcastForm: any = {
    Title: '',
    Message: '',
    LocationId: undefined
  };

  locations: LocationResponse[] = [];
  broadcasts: any[] = [];
  sending = false;
  currentUser: AuthResponse | null = null;
  showProfileDropdown = false;

  constructor(
    private notificationService: NotificationService,
    private dashboardService: DashboardService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadNotificationPageData();
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

  loadNotificationPageData(): void {
    this.dashboardService.getNotificationPageData().subscribe({
      next: (data: any) => {
        this.locations = data.Locations || [];
        this.broadcasts = (data.Notifications || []).slice(0, 10);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading notification page data:', error);
      }
    });
  }

  loadBroadcasts(): void {
    this.notificationService.getAllBroadcasts().subscribe({
      next: (broadcasts) => {
        this.broadcasts = broadcasts.slice(0, 10);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading broadcasts:', error);
      }
    });
  }



  sendBroadcast(): void {
    if (!this.broadcastForm.Title || !this.broadcastForm.Message) {
      Toastify({
        text: "Please fill in all required fields",
        duration: 3000,
        backgroundColor: "#f59e0b"
      }).showToast();
      return;
    }

    this.sending = true;

    const dto: SendBroadcastDto = {
      Title: this.broadcastForm.Title,
      Message: this.broadcastForm.Message,
      Type: 0, // General broadcast
      TargetLocationId: this.broadcastForm.LocationId || null,
      TargetDepartmentId: null,
      TargetRole: null
    };

    this.notificationService.createBroadcast(dto).subscribe({
      next: (response) => {
        this.sending = false;
        Toastify({
          text: "Notification sent successfully to all users!",
          duration: 3000,
          backgroundColor: "#10b981"
        }).showToast();

        // Reset form
        this.broadcastForm = {
          Title: '',
          Message: '',
          LocationId: undefined
        };

        // Reload data
        this.loadBroadcasts();
      },
      error: (error) => {
        this.sending = false;
        console.error('Error sending broadcast:', error);
        Toastify({
          text: "Failed to send notification. Please try again.",
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}