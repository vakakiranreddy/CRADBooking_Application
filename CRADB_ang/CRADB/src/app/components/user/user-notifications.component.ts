import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-notifications.component.html',
  styleUrls: ['./user-notifications.component.css']
})
export class UserNotificationsComponent implements OnInit {
  @Input() notifications: any[] = [];
  currentUser: any;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.notifications.length === 0) {
      this.currentUser = this.authService.getCurrentUser();
      if (this.currentUser) {
        this.notificationService.getUserNotifications(this.currentUser.UserId).subscribe({
          next: (data) => {
            this.notifications = data;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error loading notifications:', err);
          }
        });
      }
    }
  }
}