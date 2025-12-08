import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit {
  currentUser: any;
  showBookDropdown = false;
  showUserDropdown = false;
  showNotifications = false;
  mobileMenuOpen = false;
  notificationCount = 0;
  notifications: any[] = [];

  constructor(
    private authService: AuthService, 
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadNotifications();
      }
    });
    if (this.currentUser) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    if (!this.currentUser?.UserId) return;
    
    this.notificationService.getUserNotifications(this.currentUser.UserId).subscribe({
      next: (notifications) => {
        this.notifications = notifications || [];
        this.notificationCount = this.notifications.length;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.notifications = [];
        this.notificationCount = 0;
      }
    });
  }

  toggleMobileMenu(): void { this.mobileMenuOpen = !this.mobileMenuOpen; }
  toggleNotifications(): void { this.showNotifications = !this.showNotifications; }
  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    const firstName = this.currentUser.FirstName || '';
    const lastName = this.currentUser.LastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }
  logout(): void { this.authService.logout(); this.router.navigate(['/login']); }
}
